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
            return <span className="text-museum-text font-bold">{countText}</span>;
        }

        // Check who sent the last message
        const isMyMessage = parseInt(chat.lastSender) === parseInt(currentUserId);

        if (isMyMessage) {
            // Condition B: Outgoing & Seen
            if (chat.lastSeen) {
                return <span className="text-museum-muted italic">Seen</span>;
            }
            // Condition C: Outgoing & Sent
            return <span className="text-museum-muted italic">Sent</span>;
        }

        // Condition D: Default (Received & Read) -> Show Preview
        return <span className="text-museum-muted truncate">{chat.last_msg}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in p-8">
            <h2 className="text-4xl font-serif text-museum-text mb-8 border-b border-museum-stone pb-4">Private Correspondence</h2>

            <GlassCard className="p-0 overflow-hidden border border-museum-stone shadow-sm">
                {chats.length === 0 && (
                    <div className="text-center py-16 text-museum-muted">
                        <p className="font-serif text-lg mb-2">No active correspondence.</p>
                        <button
                            onClick={() => onNavigate('explore_users')}
                            className="mt-4 bg-museum-text text-white px-6 py-2 rounded-none hover:bg-black transition uppercase tracking-widest text-xs"
                        >
                            Find Curators
                        </button>
                    </div>
                )}

                <div className="divide-y divide-museum-stone">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onNavigate(`dm_${chat.id}_${chat.name}`)}
                            className="flex items-center gap-6 p-6 hover:bg-museum-bg cursor-pointer transition group"
                        >
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full border border-museum-stone overflow-hidden bg-museum-stone flex-shrink-0 transition">
                                {chat.avatar && chat.avatar !== "NULL" && chat.avatar !== "none" ? (
                                    <img src={chat.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="p" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-museum-muted font-serif text-2xl bg-white">{chat.name[0]}</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className={`text-xl font-serif ${chat.unread > 0 ? "font-bold text-museum-text" : "font-medium text-museum-text group-hover:text-black"}`}>
                                        {chat.name}
                                    </h3>
                                    <span className="text-xs text-museum-muted whitespace-nowrap ml-2 uppercase tracking-widest">{chat.time}</span>
                                </div>

                                {/* Status Label Logic */}
                                <div className="text-sm flex items-center gap-2 font-sans">
                                    {getStatusLabel(chat)}
                                    {/* Dot indicator for unread */}
                                    {chat.unread > 0 && <div className="w-2 h-2 bg-museum-gold rounded-full ml-2 animate-pulse"></div>}
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