import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const CommunityAbout = ({ commId, currentUserId, onNavigate, onViewUserProfile }) => {
    const [details, setDetails] = useState(null);
    const [members, setMembers] = useState([]);

    const refreshData = () => {
        callBackend('get_community', [commId, currentUserId, 0, 0]).then(data => {
            if (data && data.id) setDetails(data);
        });
        callBackend('get_community_members', [commId]).then(data => {
            if (Array.isArray(data)) setMembers(data);
        });
    };

    useEffect(() => { refreshData(); }, [commId, currentUserId]);

    const handleLeave = async () => {
        if (window.confirm(`Are you sure you want to leave ${details.name}?`)) {
            await callBackend('leave_community', [currentUserId, commId]);
            onNavigate('explore_comms');
        }
    };

    const promote = async (targetId) => { await callBackend('mod_promote_admin', [commId, currentUserId, targetId]); refreshData(); };
    const demote = async (targetId) => { await callBackend('mod_demote_admin', [commId, currentUserId, targetId]); refreshData(); };
    const transfer = async (targetId) => {
        if (confirm("DANGER: Transfer OWNERSHIP? You will lose Moderator status.")) {
            await callBackend('mod_transfer', [commId, currentUserId, targetId]);
            refreshData();
        }
    };
    const ban = async (targetId) => { if (confirm("Ban this user?")) { await callBackend('mod_ban', [commId, currentUserId, targetId]); refreshData(); } };
    const unban = async (targetId) => { if (confirm("Unban this user?")) { await callBackend('mod_unban', [commId, currentUserId, targetId]); refreshData(); } };

    if (!details) return <div className="text-museum-muted text-center mt-20 font-serif">Loading Collection Info...</div>;

    return (
        <div className="flex flex-col h-full animate-fade-in relative bg-museum-bg">

            {/* Header Banner */}
            <div className="relative h-64 w-full shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-museum-stone"></div>
                {details.cover && details.cover !== "NULL" && details.cover !== "none" && (
                    <img src={details.cover} className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale" alt="cover" />
                )}
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="absolute top-6 left-6 z-20">
                    <button onClick={() => onNavigate(`comm_${commId}`)} className="bg-white/90 hover:bg-white text-museum-text px-6 py-2 rounded-none border border-museum-stone transition flex items-center gap-2 uppercase tracking-widest text-xs shadow-sm">
                        <span>←</span> Back to Collection
                    </button>
                </div>

                <div className="absolute bottom-8 left-8 z-20">
                    <h1 className="text-5xl font-serif text-white drop-shadow-md mb-2">{details.name}</h1>
                    <div className="flex gap-3 items-center mb-2">
                        {details.is_mod && <span className="bg-museum-text text-white text-[10px] px-2 py-1 uppercase tracking-widest">Curator</span>}
                        {details.is_admin && <span className="bg-museum-gold text-white text-[10px] px-2 py-1 uppercase tracking-widest">Director</span>}
                    </div>
                    <p className="text-white/90 max-w-2xl text-lg font-serif italic bg-black/40 p-2 backdrop-blur-sm">{details.desc}</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-museum-stone p-6 flex justify-between items-center">
                <div className="flex gap-8 text-xs uppercase tracking-widest">
                    <div className="text-museum-muted">Members: <span className="text-museum-text font-bold">{members.filter(m => !m.is_banned).length}</span></div>
                    <div className="text-museum-muted">Banned: <span className="text-red-400 font-bold">{members.filter(m => m.is_banned).length}</span></div>
                </div>
                {details.is_member && <button onClick={handleLeave} className="text-red-400 hover:text-red-600 border-b border-transparent hover:border-red-400 text-xs uppercase tracking-widest transition">Leave Collection</button>}
            </div>

            {/* Member Grid */}
            <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-serif text-museum-text mb-6 border-b border-museum-stone pb-2">Member Roster</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map(m => {
                        const isSelf = m.id === parseInt(currentUserId);
                        return (
                            <GlassCard key={m.id} className={`relative flex flex-col gap-4 p-6 border border-museum-stone hover:border-museum-text transition group shadow-sm ${m.is_banned ? 'opacity-50 grayscale' : ''}`}>

                                {/* Profile Click Area - USES NEW PROP */}
                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewUserProfile(m.id)}>
                                    <div className="w-14 h-14 rounded-full border border-museum-stone overflow-hidden bg-museum-stone flex-shrink-0">
                                        {m.avatar && m.avatar !== "NULL" && m.avatar !== "none" ? <img src={m.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="p" /> : <div className="w-full h-full flex items-center justify-center text-museum-muted font-serif text-xl bg-white">{m.name[0]}</div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-serif text-lg text-museum-text group-hover:underline decoration-museum-gold underline-offset-4 transition">{m.name}</span>
                                            {m.is_mod && <span className="text-[9px] bg-museum-text text-white px-1.5 py-0.5 uppercase tracking-widest">Mod</span>}
                                            {m.is_admin && <span className="text-[9px] bg-museum-gold text-white px-1.5 py-0.5 uppercase tracking-widest">Admin</span>}
                                            {m.is_banned && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 uppercase tracking-widest">Banned</span>}
                                        </div>
                                        <div className="text-xs text-museum-muted mt-1 uppercase tracking-widest">Reputation: {m.karma}</div>
                                    </div>
                                </div>

                                {/* Mod Actions */}
                                {details.is_admin && !isSelf && (
                                    <div className="flex gap-2 mt-2 pt-4 border-t border-museum-stone">
                                        {m.is_banned ? (
                                            <button onClick={() => unban(m.id)} className="flex-1 bg-white border border-museum-stone text-museum-text hover:bg-museum-text hover:text-white text-[10px] py-2 uppercase tracking-widest transition">Unban</button>
                                        ) : (
                                            <>
                                                <button onClick={() => ban(m.id)} className="flex-1 bg-white border border-museum-stone text-museum-muted hover:text-red-500 hover:border-red-500 text-[10px] py-2 uppercase tracking-widest transition">Ban</button>
                                                {!m.is_mod && <button onClick={() => promote(m.id)} className="flex-1 bg-museum-text text-white text-[10px] py-2 uppercase tracking-widest transition hover:bg-black">Promote</button>}
                                                {m.is_mod && <button onClick={() => demote(m.id)} className="flex-1 bg-white border border-museum-stone text-museum-text hover:bg-museum-bg text-[10px] py-2 uppercase tracking-widest transition">Demote</button>}
                                            </>
                                        )}
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CommunityAbout;