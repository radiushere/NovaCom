import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { callBackend } from '../api';

// FIX: Added 'onAbout' to the props list below
const CommunityChat = ({ commId, currentUserId, onLeave, onAbout }) => {
  const [details, setDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  
  // Pagination State
  const [offset, setOffset] = useState(0);
  const [totalMsgs, setTotalMsgs] = useState(0);
  const [loading, setLoading] = useState(false);
  const MSG_LIMIT = 50;

  // Refs for Scroll Management
  const scrollContainerRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const isAtBottom = useRef(true);
  const loadingHistory = useRef(false);

  // 1. Fetch Latest Data (Polled)
  const fetchLatest = async () => {
    // Prevent polling if we are currently loading old history to avoid jumps
    if (loadingHistory.current) return;

    const data = await callBackend('get_community', [commId, currentUserId, 0, MSG_LIMIT]);
    if (data && data.id) {
        setDetails(data);
        setTotalMsgs(data.total_msgs);
        
        // Extract Pinned Messages
        const visiblePins = data.messages.filter(m => m.pinned);
        setPinnedMessages(visiblePins); 
        
        // Only replace messages if we are viewing the latest block (Offset 0)
        if (offset === 0) {
            setMessages(data.messages);
        }
    }
  };

  // 2. Setup Polling
  useEffect(() => {
    setOffset(0); 
    isAtBottom.current = true; // Snap to bottom on open
    fetchLatest();
    
    const interval = setInterval(() => {
        if (offset === 0) fetchLatest(); 
    }, 2000);
    return () => clearInterval(interval);
  }, [commId]);

  // 3. Scroll Position Maintenance
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollHeight } = scrollContainerRef.current;

    // If we were at the bottom, stay there (for new incoming messages)
    if (isAtBottom.current) {
        scrollContainerRef.current.scrollTop = scrollHeight;
    } 
    // If we just loaded history, maintain visual position relative to new content
    else if (prevScrollHeight.current > 0) {
        const heightDiff = scrollHeight - prevScrollHeight.current;
        scrollContainerRef.current.scrollTop = heightDiff;
        prevScrollHeight.current = 0;
    }
  }, [messages]);

  // 4. Handle Scroll Logic (Reverse Pagination)
  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Determine if user is near bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = atBottom;

    // Detect Top of Scroll -> Load Older Messages
    if (scrollTop === 0 && messages.length < totalMsgs && !loading && !loadingHistory.current) {
        setLoading(true);
        loadingHistory.current = true;
        prevScrollHeight.current = scrollHeight; // Capture height before update

        const newOffset = offset + MSG_LIMIT;
        const data = await callBackend('get_community', [commId, currentUserId, newOffset, MSG_LIMIT]);
        
        if (data && data.messages.length > 0) {
            setMessages(prev => [...data.messages, ...prev]); // Prepend old messages
            setOffset(newOffset);
        }
        
        setLoading(false);
        loadingHistory.current = false;
    }
  };

  // --- ACTIONS ---

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await callBackend('send_message', [commId, currentUserId, msgInput]);
    setMsgInput("");
    setOffset(0); // Reset to latest
    isAtBottom.current = true;
    fetchLatest();
  };

  const handleLeaveCommunity = async () => {
    if (window.confirm(`Are you sure you want to leave ${details.name}?`)) {
        await callBackend('leave_community', [currentUserId, commId]);
        onLeave(); 
    }
  };

  // Mod / Interact Actions
  const handleVote = async (index) => { await callBackend('vote_message', [commId, currentUserId, index]); fetchLatest(); };
  const handlePin = async (index) => { await callBackend('mod_pin', [commId, currentUserId, index]); fetchLatest(); };
  const handleDelete = async (index) => { if(window.confirm("Delete this transmission?")) { await callBackend('mod_delete', [commId, currentUserId, index]); fetchLatest(); }};
  const handleBan = async (targetId) => { if(window.confirm(`Ban User ID ${targetId}?`)) { await callBackend('mod_ban', [commId, currentUserId, targetId]); fetchLatest(); }};
  
  const handleUnban = async () => {
     const targetId = prompt("Enter User ID to Unban:");
     if (targetId) {
         await callBackend('mod_unban', [commId, currentUserId, targetId]);
         alert("User ID " + targetId + " unbanned (if previously banned).");
     }
  };

  if (!details) return <div className="text-white text-center mt-10 animate-pulse">Loading frequency...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-void-black/80 backdrop-blur z-20">
        <div>
          <h2 className="text-xl font-orbitron text-white flex items-center gap-2">
            <span className="text-cyan-supernova">#</span> {details.name}
            {details.is_mod && <span className="text-[10px] bg-red-500 text-white px-2 rounded">MOD</span>}
          </h2>
          <p className="text-xs text-gray-400">{details.desc}</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* About Button */}
            <button 
                onClick={onAbout} 
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded border border-white/10 transition"
            >
                About
            </button>

            {details.is_mod && (
                <button onClick={handleUnban} className="bg-gray-700 hover:bg-gray-600 text-xs text-white px-3 py-1 rounded border border-white/10">
                    Bans
                </button>
            )}

            {details.is_member && (
                <button 
                    onClick={handleLeaveCommunity} 
                    className="bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-200 text-xs px-3 py-1 rounded border border-red-500/30 transition"
                >
                    Leave
                </button>
            )}

            <button onClick={onLeave} className="text-gray-400 hover:text-white text-sm px-2">
                ✕
            </button>
        </div>
      </div>

      {/* PINNED MESSAGES DRAWER */}
      {pinnedMessages.length > 0 && (
        <div className="bg-void-black/90 border-b border-cyan-supernova/30 p-2 z-10 shadow-lg shadow-cyan-supernova/5">
             <div className="flex items-center gap-2 text-cyan-supernova text-xs font-bold uppercase mb-1">
                <span>📌 Pinned</span>
             </div>
             <div className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-none">
                {pinnedMessages.map((m, i) => (
                    <div key={i} className="text-sm text-white truncate flex justify-between items-center bg-white/5 p-1 rounded">
                         <span className="truncate w-11/12">
                             <span className="font-bold text-gray-400 mr-2">{m.sender}:</span> 
                             {m.content}
                         </span>
                         {details.is_mod && (
                             <button onClick={() => handlePin(m.index)} className="text-[10px] text-red-400 hover:text-white ml-2">Unpin</button>
                         )}
                    </div>
                ))}
             </div>
        </div>
      )}

      {/* CHAT SCROLL AREA */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700"
      >
        {loading && <div className="text-center text-xs text-cyan-supernova animate-pulse pb-2">Retrieving Archives...</div>}
        
        {messages.map((m, idx) => {
            const isMe = m.senderId === parseInt(currentUserId);
            return (
              <div key={`${m.index}-${idx}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                 
                 {/* Metadata: Name + Ban Button */}
                 <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <span className={`text-xs font-bold ${isMe ? "text-cyan-supernova" : "text-cosmic-purple"}`}>{m.sender}</span>
                    {details.is_mod && !isMe && (
                        <button onClick={() => handleBan(m.senderId)} className="text-[10px] text-red-500 border border-red-500/30 px-1 rounded hover:bg-red-500/10">BAN</button>
                    )}
                 </div>
                 
                 {/* Message Container */}
                 <div className={`flex items-end gap-2 group relative ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* AVATAR */}
                    <div className="w-8 h-8 rounded-full bg-black border border-white/10 overflow-hidden flex-shrink-0">
                        {m.senderAvatar ? (
                            <img src={m.senderAvatar} className="w-full h-full object-cover" alt="pic" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                {m.sender[0]}
                            </div>
                        )}
                    </div>

                    {/* Bubble */}
                    <div className={`px-4 py-2 rounded-lg max-w-[70%] break-words relative shadow-lg ${m.pinned ? "border-l-4 border-l-cyan-supernova bg-cyan-supernova/5" : ""} ${isMe ? "bg-cyan-supernova/10 border border-cyan-supernova/30 text-white" : "bg-white/5 border border-white/10 text-gray-200"}`}>
                      {m.content}
                    </div>

                    {/* Hover Tools (Vote/Pin/Delete) */}
                    <div className={`flex flex-col items-center opacity-0 group-hover:opacity-100 transition duration-200 ${isMe ? "items-end" : "items-start"}`}>
                         {details.is_mod && (
                            <div className="flex gap-1 mb-1 bg-black/50 p-1 rounded backdrop-blur">
                                <button onClick={() => handlePin(m.index)} title={m.pinned ? "Unpin" : "Pin"} className="text-xs hover:scale-110 transition">📌</button>
                                <button onClick={() => handleDelete(m.index)} title="Delete" className="text-xs text-red-500 hover:scale-110 transition">🗑️</button>
                            </div>
                         )}
                         <div className="flex flex-col items-center">
                             <button 
                                onClick={() => handleVote(m.index)} 
                                className={`text-xs transition hover:scale-125 ${m.has_voted ? "text-cyan-supernova" : "text-gray-500"}`}
                             >
                                ▲
                             </button>
                             <span className="text-[10px] font-bold text-gray-400">{m.votes}</span>
                         </div>
                    </div>
                 </div>
              </div>
            );
        })}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-void-black/80 border-t border-white/10">
        {details.is_member ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              className="flex-1 bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none placeholder-gray-600 transition"
              placeholder={`Message #${details.name}...`}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
            />
            <button type="submit" className="bg-cyan-supernova text-black font-bold px-6 rounded-lg hover:bg-cyan-supernova/80 shadow-lg shadow-cyan-supernova/20 transition">
                SEND
            </button>
          </form>
        ) : (
             <div className="text-center">
                 <span className="text-gray-400 text-sm mr-4">You are viewing as a guest.</span>
                 <button 
                    onClick={() => callBackend('join_community', [currentUserId, commId]).then(fetchLatest)} 
                    className="bg-green-500 text-black font-bold px-6 py-2 rounded shadow-lg hover:scale-105 transition"
                 >
                    JOIN CHANNEL
                 </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;