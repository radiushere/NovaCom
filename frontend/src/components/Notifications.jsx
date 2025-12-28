import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const Notifications = ({ currentUserId }) => {
    const [requests, setRequests] = useState([]);

    const fetchRequests = () => {
        callBackend('get_pending_requests', [currentUserId]).then(data => {
            if (Array.isArray(data)) setRequests(data);
        });
    };

    useEffect(() => { fetchRequests(); }, [currentUserId]);

    const handleAccept = async (requesterId) => {
        await callBackend('accept_request', [currentUserId, requesterId]);
        fetchRequests(); // Refresh list
        alert("Connection Confirmed.");
    };

    const handleDecline = async (requesterId) => {
        await callBackend('decline_request', [currentUserId, requesterId]);
        fetchRequests();
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in p-8">
            <h2 className="text-4xl font-serif text-museum-text mb-8 border-b border-museum-stone pb-4">Pending Invitations</h2>

            {requests.length === 0 ? (
                <div className="text-center py-20 text-museum-muted font-serif text-lg">
                    <p>No pending invitations.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <GlassCard key={req.id} className="flex items-center justify-between p-6 border border-museum-stone shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border border-museum-stone overflow-hidden bg-museum-stone">
                                    {req.avatar && req.avatar !== "NULL" ? <img src={req.avatar} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full font-serif text-museum-muted text-xl bg-white">{req.name[0]}</div>}
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-museum-text">{req.name}</h3>
                                    <p className="text-xs text-museum-muted uppercase tracking-widest">Wants to connect</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => handleAccept(req.id)} className="bg-museum-text text-white font-medium px-6 py-2 rounded-none hover:bg-black transition uppercase tracking-widest text-xs shadow-sm">
                                    Accept
                                </button>
                                <button onClick={() => handleDecline(req.id)} className="bg-white border border-museum-stone text-museum-muted font-medium px-6 py-2 rounded-none hover:bg-museum-bg hover:text-museum-text transition uppercase tracking-widest text-xs">
                                    Decline
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;