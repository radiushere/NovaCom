import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { callBackend } from '../api';

const CommunityChat = ({ commId, currentUserId, onLeave }) => {
  const [details, setDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  
  // Pagination State
  const [offset, setOffset] = useState(0);
  const [totalMsgs, setTotalMsgs] = useState(0);
  const [loading, setLoading] = useState(false);
  const MSG_LIMIT = 50;

  // Refs
  const scrollContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const prevScrollHeight = useRef(0); // To calculate scroll jump
  const isAtBottom = useRef(true);    // Track if user is stuck to bottom
  const loadingHistory = useRef(false); // Fix: Prevent polling while loading history

  // 1. Initial Load & Polling
  const fetchLatest = async () => {
    // If we are currently loading history, DO NOT poll, or it causes the jump bug
    if (loadingHistory.current) return;

    const data = await callBackend('get_community', [commId, currentUserId, 0, MSG_LIMIT]);
    if (data && data.id) {
        setDetails(data);
        setTotalMsgs(data.total_msgs);
        
        const visiblePins = data.messages.filter(m => m.pinned);
        setPinnedMessages(visiblePins); 
        
        // Only update messages if we are looking at the latest (offset 0)
        if (offset === 0) {
            setMessages(data.messages);
        }
    }
  };

  useEffect(() => {
    setOffset(0); 
    isAtBottom.current = true; // Reset to bottom on new chat
    fetchLatest();
    
    const interval = setInterval(() => {
        // Only poll if we are viewing the latest messages
        if (offset === 0) fetchLatest(); 
    }, 2000);
    return () => clearInterval(interval);
  }, [commId]);

  // 2. Smart Scroll Handling (The Fix)
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return;

    const { scrollHeight } = scrollContainerRef.current;

    // Case A: User was at bottom -> Keep them at bottom (New messages arrive)
    if (isAtBottom.current) {
        scrollContainerRef.current.scrollTop = scrollHeight;
    }
    // Case B: User loaded history -> Maintain visual position
    else if (prevScrollHeight.current > 0) {
        const heightDifference = scrollHeight - prevScrollHeight.current;
        scrollContainerRef.current.scrollTop = heightDifference;
        prevScrollHeight.current = 0; // Reset
    }
  }, [messages]); // Runs whenever messages update

  // 3. Handle Scroll Logic
  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if user is at the bottom (allow 50px buffer)
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = atBottom;

    // Detect Top of Scroll (Load History)
    if (scrollTop === 0 && messages.length < totalMsgs && !loading && !loadingHistory.current) {
        setLoading(true);
        loadingHistory.current = true; // Block polling
        prevScrollHeight.current = scrollHeight; // Capture height BEFORE update

        const newOffset = offset + MSG_LIMIT;
        const data = await callBackend('get_community', [commId, currentUserId, newOffset, MSG_LIMIT]);
        
        if (data && data.messages.length > 0) {
            setMessages(prev => [...data.messages, ...prev]);
            setOffset(newOffset);
        }
        
        setLoading(false);
        loadingHistory.current = false; // Resume polling capability
    }
  };

  // --- ACTIONS ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await callBackend('send_message', [commId, currentUserId, msgInput]);
    setMsgInput("");
    setOffset(0); // Snap to bottom on send
    isAtBottom.current = true;
    fetchLatest();
  };

  const handleLeaveCommunity = async () => {
    if (window.confirm(`Are you sure you want to leave ${details.name}?`)) {
        await callBackend('leave_community', [currentUserId, commId]);
        onLeave(); 
    }
  };

  // Standard Actions
  const handleVote = async (index) => { await callBackend('vote_message', [commId, currentUserId, index]); fetchLatest(); };
  const handlePin = async (index) => { await callBackend('mod_pin', [commId, currentUserId, index]); fetchLatest(); };
  const handleDelete = async (index) => { if(window.confirm("Delete?")) { await callBackend('mod_delete', [commId, currentUserId, index]); fetchLatest(); }};
  const handleBan = async (targetId) => { if(window.confirm(`Ban User ID ${targetId}?`)) { await callBackend('mod_ban', [commId, currentUserId, targetId]); fetchLatest(); }};
  const handleUnban = async () => { const t = prompt("User ID to Unban:"); if (t) { await callBackend('mod_unban', [commId, currentUserId, t]); alert("Done."); }};

  if (!details) return <div className="text-white text-center mt-10">Loading frequency...</div>;

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
            {details.is_mod && <button onClick={handleUnban} className="bg-gray-700 hover:bg-gray-600 text-xs text-white px-3 py-1 rounded border border-white/10">Manage Bans</button>}
            {details.is_member && <button onClick={handleLeaveCommunity} className="bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-200 text-xs px-3 py-1 rounded border border-red-500/30 transition">Leave</button>}
            <button onClick={onLeave} className="text-gray-400 hover:text-white text-sm px-2">✕</button>
        </div>
      </div>

      {/* PINNED BANNER */}
      {pinnedMessages.length > 0 && (
        <div className="bg-void-black/90 border-b border-cyan-supernova/30 p-2 z-10 shadow-lg shadow-cyan-supernova/5">
             <div className="flex items-center gap-2 text-cyan-supernova text-xs font-bold uppercase mb-1">
                <span>📌 Pinned</span>
             </div>
             <div className="flex flex-col gap-1">
                {pinnedMessages.map((m, i) => (
                    <div key={i} className="text-sm text-white truncate flex justify-between">
                         <span><span className="font-bold text-gray-400">{m.sender}:</span> {m.content}</span>
                         {details.is_mod && <button onClick={() => handlePin(m.index)} className="text-[10px] text-red-400 hover:text-white">Unpin</button>}
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
        
        {messages.map((m, idx) => (
          <div key={`${m.index}-${idx}`} className={`flex flex-col ${m.senderId === parseInt(currentUserId) ? "items-end" : "items-start"}`}>
             <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${m.senderId === parseInt(currentUserId) ? "text-cyan-supernova" : "text-cosmic-purple"}`}>{m.sender}</span>
                {details.is_mod && m.senderId !== parseInt(currentUserId) && (
                    <button onClick={() => handleBan(m.senderId)} className="text-[10px] text-red-500 border border-red-500/30 px-1 rounded hover:bg-red-500/10">BAN</button>
                )}
             </div>
             
             <div className="flex items-end gap-2 group relative">
                <div className={`px-4 py-2 rounded-lg max-w-[80%] break-words relative ${m.pinned ? "border-l-4 border-l-cyan-supernova bg-cyan-supernova/5" : ""} ${m.senderId === parseInt(currentUserId) ? "bg-cyan-supernova/10 border border-cyan-supernova/30 text-white" : "bg-white/5 border border-white/10 text-gray-200"}`}>
                  {m.content}
                </div>

                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition">
                     {details.is_mod && (
                        <div className="flex gap-1 mb-1 bg-black/50 p-1 rounded">
                            <button onClick={() => handlePin(m.index)} title={m.pinned ? "Unpin" : "Pin"} className="text-xs hover:scale-110">📌</button>
                            <button onClick={() => handleDelete(m.index)} title="Delete" className="text-xs text-red-500 hover:scale-110">🗑️</button>
                        </div>
                     )}
                     <button onClick={() => handleVote(m.index)} className={`text-xs transition hover:scale-125 ${m.has_voted ? "text-cyan-supernova" : "text-gray-500"}`}>▲</button>
                     <span className="text-[10px] font-bold text-gray-400">{m.votes}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-4 bg-void-black/80 border-t border-white/10">
        {details.is_member ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              className="flex-1 bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none"
              placeholder={`Message #${details.name}...`}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
            />
            <button type="submit" className="bg-cyan-supernova text-black font-bold px-6 rounded-lg hover:bg-cyan-supernova/80">SEND</button>
          </form>
        ) : (
             <div className="text-center">
                 <button onClick={() => callBackend('join_community', [currentUserId, commId]).then(fetchLatest)} className="bg-green-500 text-black font-bold px-6 py-2 rounded">JOIN CHANNEL</button>
             </div>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;