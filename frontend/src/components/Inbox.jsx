import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const Inbox = ({ currentUserId, onNavigate }) => {
  const [chats, setChats] = useState([]);

  // Poll for updates (so 'Seen' status or new messages update in real-time)
  useEffect(() => {
    const fetchInbox = () => {
        callBackend('get_my_dms', [currentUserId]).then(data => {
            if (Array.isArray(data)) {
                // Optional: Sort by time (newest first) if backend doesn't
                // data.sort((a, b) => new Date(b.time) - new Date(a.time)); 
                setChats(data);
            }
        });
    };

    fetchInbox();
    const interval = setInterval(fetchInbox, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [currentUserId]);

  // --- LOGIC REQUIREMENT IMPLEMENTATION ---
  const getStatusLabel = (chat) => {
    // Condition A: Unread Messages
    if (chat.unread > 0) {
        const countText = chat.unread > 3 ? "4+ new messages" : `${chat.unread} new message${chat.unread > 1 ? 's' : ''}`;
        return <span className="text-cyan-supernova font-bold">{countText}</span>;
    }

    // Check who sent the last message
    const isMyMessage = parseInt(chat.lastSender) === parseInt(currentUserId);

    if (isMyMessage) {
        // Condition B: Outgoing & Seen
        if (chat.lastSeen) {
            return <span className="text-gray-500">Seen</span>;
        }
        // Condition C: Outgoing & Sent
        return <span className="text-gray-500">Sent</span>;
    }

    // Condition D: Default (Received & Read) -> Show Preview
    return <span className="text-gray-400 truncate">{chat.last_msg}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-orbitron text-white mb-6">Encrypted Channels</h2>
      
      <GlassCard className="p-0 overflow-hidden">
        {chats.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <p>No active frequencies.</p>
                <button 
                    onClick={() => onNavigate('explore_users')}
                    className="mt-4 bg-cyan-supernova/10 text-cyan-supernova px-4 py-2 rounded border border-cyan-supernova/30 hover:bg-cyan-supernova/20 transition"
                >
                    Find Signals
                </button>
            </div>
        )}

        <div className="divide-y divide-white/5">
            {chats.map(chat => (
                <div 
                    key={chat.id} 
                    onClick={() => onNavigate(`dm_${chat.id}_${chat.name}`)}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition group"
                >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full border-2 border-white/10 group-hover:border-cyan-supernova/50 overflow-hidden bg-black flex-shrink-0 transition">
                        {chat.avatar && chat.avatar !== "NULL" && chat.avatar !== "none" ? (
                            <img src={chat.avatar} className="w-full h-full object-cover" alt="p" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl">{chat.name[0]}</div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`text-lg ${chat.unread > 0 ? "font-bold text-white" : "font-medium text-gray-300 group-hover:text-white"}`}>
                                {chat.name}
                            </h3>
                            <span className="text-xs text-gray-600 whitespace-nowrap ml-2">{chat.time}</span>
                        </div>
                        
                        {/* Status Label Logic */}
                        <div className="text-sm flex items-center gap-1">
                            {getStatusLabel(chat)}
                            {/* Dot indicator for unread */}
                            {chat.unread > 0 && <div className="w-2 h-2 bg-cyan-supernova rounded-full ml-2 animate-pulse"></div>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default Inbox;