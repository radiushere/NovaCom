import React, { useState, useEffect, useRef } from 'react';
import { callBackend } from '../api';

const DirectChat = ({ currentUserId, friendId, friendName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [replyTarget, setReplyTarget] = useState(null); 
  const scrollRef = useRef(null);

  // Poll for messages
  const fetchMessages = async () => {
    const data = await callBackend('get_dm', [currentUserId, friendId]);
    if (data && data.messages) {
        setMessages(data.messages);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [friendId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    const replyId = replyTarget ? replyTarget.id : -1;
    await callBackend('send_dm', [currentUserId, friendId, replyId, msgInput]);
    setMsgInput("");
    setReplyTarget(null); 
    fetchMessages();
  };

  const handleReaction = async (msgId) => {
    const reaction = prompt("Enter Emoji (e.g. ❤️, 😂):");
    if (reaction) {
        await callBackend('react_dm', [currentUserId, friendId, msgId, reaction]);
        fetchMessages();
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-void-black/50">
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 bg-void-black/80 backdrop-blur z-20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold border border-white/20">
                {friendName[0].toUpperCase()}
            </div>
            <div>
                <h2 className="text-lg font-orbitron text-white tracking-wide">@{friendName}</h2>
                <p className="text-[10px] text-green-400 uppercase tracking-widest">Encrypted Signal</p>
            </div>
        </div>
        <button onClick={onBack} className="text-gray-400 hover:text-white px-3 py-1 hover:bg-white/10 rounded transition">✕ Close</button>
      </div>

      {/* MESSAGES AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((m) => {
            const isMe = m.senderId === parseInt(currentUserId);
            return (
                <div 
                    key={m.id} 
                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                    {/* Message Row Container: Aligns Bubble + Arrow side-by-side */}
                    <div className={`flex max-w-[80%] items-end gap-3 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        
                        {/* 1. MESSAGE BUBBLE */}
                        <div className="relative flex flex-col">
                            
                            {/* Reply Preview (Attached to top of bubble) */}
                            {m.replyTo !== -1 && (
                                <div className={`text-xs p-2 rounded-t-lg mb-0.5 border-l-2 ${isMe ? "bg-purple-900/50 border-purple-400 text-purple-200" : "bg-gray-800 border-gray-500 text-gray-400"}`}>
                                    <span className="opacity-70 text-[10px] uppercase block mb-1">Replying to:</span>
                                    <span className="italic line-clamp-1">"{m.replyPreview || "Message unavailable"}"</span>
                                </div>
                            )}

                            {/* Main Bubble Content */}
                            <div 
                                className={`px-4 py-3 text-sm shadow-lg backdrop-blur-sm cursor-pointer
                                    ${m.replyTo !== -1 ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl"}
                                    ${isMe 
                                        ? "bg-gradient-to-br from-cosmic-purple to-purple-700 text-white rounded-tr-none" 
                                        : "bg-deep-void border border-white/10 text-gray-100 rounded-tl-none"
                                    }
                                `}
                                onDoubleClick={() => handleReaction(m.id)}
                                title="Double click to react"
                            >
                                {m.content}
                            </div>

                            {/* Metadata (Time + Seen + Reaction) */}
                            <div className="absolute -bottom-5 w-full flex justify-between px-1">
                                {/* Reaction Badge */}
                                {m.reaction ? (
                                    <div className="bg-black/80 rounded-full px-1.5 py-0.5 text-xs border border-white/20 shadow -mt-2 z-10">
                                        {m.reaction}
                                    </div>
                                ) : <span></span>}
                                
                                {/* Status */}
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    {m.time}
                                    {isMe && (
                                        <span>{m.isSeen ? <span className="text-cyan-supernova font-bold">✓✓</span> : "✓"}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. REPLY ARROW (Flex Item - No longer absolute) */}
                        <button 
                            onClick={() => setReplyTarget({ id: m.id, content: m.content })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-500 hover:text-cyan-supernova hover:bg-white/5 rounded-full"
                            title="Reply"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 14L4 9l5-5"/>
                                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
                            </svg>
                        </button>

                    </div>
                </div>
            );
        })}
      </div>

      {/* REPLY CONTEXT BAR */}
      {replyTarget && (
          <div className="bg-black/80 border-t border-cyan-supernova/30 p-2 px-4 flex justify-between items-center animate-slide-up backdrop-blur">
              <div className="text-xs text-gray-300 pl-2 border-l-2 border-cyan-supernova">
                  <span className="text-cyan-supernova font-bold mr-2">Replying to:</span> 
                  <span className="italic opacity-80 line-clamp-1">{replyTarget.content}</span>
              </div>
              <button onClick={() => setReplyTarget(null)} className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full p-1 transition">✕</button>
          </div>
      )}

      {/* INPUT AREA */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-void-black/90 flex gap-3 shrink-0">
        <input 
            className="flex-1 bg-deep-void px-4 py-3 rounded-xl border border-white/10 text-white focus:border-cyan-supernova focus:ring-1 focus:ring-cyan-supernova outline-none placeholder-gray-600 transition"
            placeholder={replyTarget ? "Type your reply..." : "Send a secure message..."}
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
        />
        <button 
            type="submit" 
            className="bg-cyan-supernova text-black font-bold px-6 py-3 rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-95"
        >
            SEND
        </button>
      </form>
    </div>
  );
};

export default DirectChat;