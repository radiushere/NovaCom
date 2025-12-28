import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const FriendsPage = ({ currentUserId, onNavigate }) => {
    const [view, setView] = useState("friends");
    const [friends, setFriends] = useState([]);

    // Search State
    const [query, setQuery] = useState("");
    const [tagFilter, setTagFilter] = useState("All");
    const [results, setResults] = useState([]);
    const [relationships, setRelationships] = useState({}); // Stores status for each user

    // 1. Fetch Friends
    const fetchFriends = () => {
        callBackend('get_friends', [currentUserId]).then(data => {
            if (Array.isArray(data)) setFriends(data);
        });
    };

    useEffect(() => { fetchFriends(); }, [currentUserId]);

    // 2. Search & Check Status
    useEffect(() => {
        if (view === 'search') {
            const timer = setTimeout(async () => {
                const data = await callBackend('search_users', [query, tagFilter]);
                if (Array.isArray(data)) {
                    setResults(data);

                    // Check relationship status for each result
                    const newRels = {};
                    for (const u of data) {
                        const res = await callBackend('get_relationship', [currentUserId, u.id]);
                        if (res && res.status) newRels[u.id] = res.status;
                    }
                    setRelationships(newRels);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [query, tagFilter, view]);

    // --- NEW HANDLER: SEND REQUEST ---
    const handleRequest = async (targetId) => {
        const res = await callBackend('send_request', [currentUserId, targetId]);
        if (res.status === "request_sent") {
            setRelationships(prev => ({ ...prev, [targetId]: "pending_sent" }));
            alert("Invitation sent.");
        } else if (res.status === "already_friends") {
            alert("You are already connected.");
        } else {
            alert("Action failed: " + res.status);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-8">

            {/* Header */}
            <div className="flex justify-between items-center border-b border-museum-stone pb-6">
                <h2 className="text-4xl font-serif text-museum-text">
                    {view === 'friends' ? "My Circle" : "Curator Directory"}
                </h2>
                <div className="flex bg-white border border-museum-stone">
                    <button onClick={() => setView('friends')} className={`px-6 py-3 text-xs uppercase tracking-widest transition ${view === 'friends' ? 'bg-museum-text text-white' : 'text-museum-muted hover:text-museum-text hover:bg-museum-bg'}`}>Connections</button>
                    <button onClick={() => setView('search')} className={`px-6 py-3 text-xs uppercase tracking-widest transition ${view === 'search' ? 'bg-museum-text text-white' : 'text-museum-muted hover:text-museum-text hover:bg-museum-bg'}`}>Discover</button>
                </div>
            </div>

            {/* VIEW 1: FRIENDS */}
            {view === 'friends' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.length === 0 && <p className="text-museum-muted col-span-3 text-center py-16 font-serif text-lg">No active connections.</p>}
                    {friends.map(f => (
                        <div key={f.id} onClick={() => onNavigate(`profile_${f.id}`)} className="cursor-pointer group">
                            <GlassCard className="flex items-center gap-6 p-6 border border-museum-stone hover:border-museum-text transition shadow-sm hover:shadow-md">
                                <div className="w-16 h-16 rounded-full border border-museum-stone overflow-hidden bg-museum-stone flex-shrink-0">
                                    {f.avatar && f.avatar !== "NULL" ? <img src={f.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="p" /> : <div className="flex items-center justify-center h-full font-serif text-museum-muted text-2xl bg-white">{f.name[0]}</div>}
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-museum-text group-hover:underline decoration-museum-gold underline-offset-4">{f.name}</h3>
                                    <div className="text-xs text-museum-muted mt-1 uppercase tracking-widest">● Connected</div>
                                </div>
                            </GlassCard>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW 2: SEARCH */}
            {view === 'search' && (
                <div className="space-y-8 animate-fade-in">
                    <GlassCard className="p-8 border border-museum-stone shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input autoFocus placeholder="Search by name..." className="flex-1 bg-museum-bg p-4 rounded-none border-b border-museum-stone text-museum-text placeholder-museum-muted focus:border-museum-text outline-none transition font-serif text-lg" value={query} onChange={e => setQuery(e.target.value)} />
                            <select onChange={e => setTagFilter(e.target.value)} className="bg-white text-museum-text p-4 rounded-none border border-museum-stone outline-none focus:border-museum-text uppercase tracking-widest text-xs">
                                <option value="All">All Interests</option>
                                {["Photography", "Art", "History", "Design", "Architecture", "Music"].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.map(u => {
                            if (u.id === parseInt(currentUserId)) return null;
                            const status = relationships[u.id] || "none";

                            return (
                                <GlassCard key={u.id} className="flex items-center justify-between p-6 border border-museum-stone hover:border-museum-text transition group">
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate(`profile_${u.id}`)}>
                                        <div className="w-14 h-14 rounded-full border border-museum-stone overflow-hidden bg-museum-stone">
                                            {u.avatar && u.avatar !== "NULL" ? <img src={u.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" alt="p" /> : <div className="flex items-center justify-center h-full font-serif text-museum-muted text-xl bg-white">{u.name[0]}</div>}
                                        </div>
                                        <div>
                                            <h4 className="font-serif text-lg text-museum-text">{u.name}</h4>
                                            <p className="text-xs text-museum-muted line-clamp-1 max-w-[150px]">{u.bio || "No biography."}</p>
                                        </div>
                                    </div>

                                    {status === "friends" ? (
                                        <span className="text-xs uppercase tracking-widest text-museum-muted border border-museum-stone px-3 py-1">Connected</span>
                                    ) : status === "pending_sent" ? (
                                        <span className="text-xs uppercase tracking-widest text-museum-muted italic">Pending</span>
                                    ) : status === "pending_received" ? (
                                        <button onClick={() => onNavigate('notifications')} className="text-xs uppercase tracking-widest bg-museum-gold text-white px-4 py-2 hover:bg-black transition">Respond</button>
                                    ) : (
                                        <button onClick={() => handleRequest(u.id)} className="text-xs uppercase tracking-widest border border-museum-text text-museum-text px-4 py-2 hover:bg-museum-text hover:text-white transition">Connect</button>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendsPage;