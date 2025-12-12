import React, { useState, useEffect, useRef } from 'react';
import { callBackend } from '../api';

const CommunityChat = ({ commId, currentUserId, onLeave }) => {
  const [details, setDetails] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef(null);

  const fetchDetails = async () => {
    const data = await callBackend('get_community', [commId, currentUserId]);
    if (data && data.id) setDetails(data);
  };

  // Poll for messages every 2 seconds
  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 2000);
    return () => clearInterval(interval);
  }, [commId]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [details?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await callBackend('send_message', [commId, currentUserId, msgInput]);
    setMsgInput("");
    fetchDetails(); // Instant refresh
  };

  const handleJoin = async () => {
    await callBackend('join_community', [currentUserId, commId]);
    fetchDetails();
  };

  if (!details) return <div className="text-white">Loading frequency...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-void-black/50 backdrop-blur">
        <div>
          <h2 className="text-2xl font-orbitron text-white flex items-center gap-3">
            <span className="text-cyan-supernova">#</span> {details.name}
          </h2>
          <p className="text-sm text-gray-400">{details.desc}</p>
        </div>
        <button onClick={onLeave} className="text-red-400 text-sm hover:text-red-300">Exit Channel</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {details.messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 italic">Channel silent. Start transmission.</div>
        )}
        {details.messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === "Alice" ? "items-end" : "items-start"}`}>
             <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${m.sender === "Alice" ? "text-cyan-supernova" : "text-cosmic-purple"}`}>{m.sender}</span>
                <span className="text-[10px] text-gray-600">{m.time}</span>
             </div>
             <div className={`px-4 py-2 rounded-lg max-w-[70%] ${m.sender === "Alice" ? "bg-cyan-supernova/10 border border-cyan-supernova/30 text-white" : "bg-white/5 border border-white/10 text-gray-200"}`}>
               {m.content}
             </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-void-black/50">
        {details.is_member ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              className="flex-1 bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none"
              placeholder={`Message #${details.name}...`}
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
            />
            <button type="submit" className="bg-cyan-supernova text-black font-bold px-6 rounded-lg hover:bg-cyan-supernova/80">
              SEND
            </button>
          </form>
        ) : (
          <div className="flex justify-center items-center gap-4">
            <span className="text-gray-400">Read Only Mode</span>
            <button 
              onClick={handleJoin}
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2 rounded shadow-lg shadow-green-500/20"
            >
              JOIN TO CHAT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;