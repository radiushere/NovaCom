import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const FriendsPage = ({ currentUserId, onNavigate }) => {
  const [view, setView] = useState("friends"); // 'friends' or 'search'
  const [friends, setFriends] = useState([]);
  
  // Search State
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [results, setResults] = useState([]);

  // 1. Fetch Friends List
  const fetchFriends = () => {
    callBackend('get_friends', [currentUserId]).then(data => {
      if (Array.isArray(data)) setFriends(data);
    });
  };

  useEffect(() => { fetchFriends(); }, [currentUserId]);

  // 2. Real-time Search Effect (Debounced)
  useEffect(() => {
    if (view === 'search') {
        const timer = setTimeout(() => {
            callBackend('search_users', [query, tagFilter]).then(data => {
                if (Array.isArray(data)) setResults(data);
            });
        }, 300); // 300ms delay to prevent lag while typing
        return () => clearTimeout(timer);
    }
  }, [query, tagFilter, view]);

  // Handle Connection Request
  const handleConnect = async (targetId) => {
    await callBackend('add_friend', [currentUserId, targetId]);
    fetchFriends(); // Refresh local friend list to update UI
    alert("Signal Link Established.");
  };

  // Helper to check if user is already a friend
  const isFriend = (id) => friends.some(f => f.id === id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header & View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-orbitron text-white">
            {view === 'friends' ? "My Connections" : "Find Signals"}
        </h2>
        <div className="flex bg-deep-void p-1 rounded-lg border border-white/10">
            <button 
                onClick={() => setView('friends')}
                className={`px-4 py-2 rounded text-sm font-bold transition ${view === 'friends' ? 'bg-cyan-supernova text-black' : 'text-gray-400 hover:text-white'}`}
            >
                My Friends
            </button>
            <button 
                onClick={() => setView('search')}
                className={`px-4 py-2 rounded text-sm font-bold transition ${view === 'search' ? 'bg-green-400 text-black' : 'text-gray-400 hover:text-white'}`}
            >
                Find New
            </button>
        </div>
      </div>

      {/* VIEW 1: FRIENDS LIST */}
      {view === 'friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.length === 0 && (
                  <p className="text-gray-500 col-span-3 text-center py-10">
                      No active signals. Switch to "Find New" to connect.
                  </p>
              )}
              
              {friends.map(f => (
                  <div key={f.id} onClick={() => onNavigate(`profile_${f.id}`)} className="cursor-pointer">
                    <GlassCard className="flex items-center gap-4 hover:border-cyan-supernova/50 transition">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full border-2 border-cyan-supernova overflow-hidden bg-black flex-shrink-0">
                            {f.avatar && f.avatar !== "NULL" && f.avatar !== "none" ? (
                                <img src={f.avatar} className="w-full h-full object-cover" alt="friend" />
                            ) : (
                                <div className="flex items-center justify-center h-full font-bold text-gray-500 text-xl">{f.name[0]}</div>
                            )}
                        </div>
                        
                        {/* Info */}
                        <div>
                            <h3 className="font-bold text-lg text-white">{f.name}</h3>
                            <div className="text-xs text-yellow-400">✨ {f.karma} Reputation</div>
                            <div className="text-xs text-green-400 mt-1">● Connected</div>
                        </div>
                    </GlassCard>
                  </div>
              ))}
          </div>
      )}

      {/* VIEW 2: SEARCH / FIND NEW */}
      {view === 'search' && (
          <div className="space-y-6 animate-fade-in">
              {/* Search Bar */}
              <GlassCard>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        autoFocus
                        placeholder="Search by Username..." 
                        className="flex-1 bg-deep-void p-3 rounded border border-white/10 text-white focus:border-green-400 outline-none"
                        value={query} onChange={e => setQuery(e.target.value)}
                    />
                    <select 
                        onChange={e => setTagFilter(e.target.value)} 
                        className="bg-deep-void text-white p-3 rounded border border-white/10 outline-none focus:border-green-400"
                    >
                        <option value="All">All Frequencies</option>
                        {["Gaming", "Anime", "Movies", "Student", "Adult", "Teen"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
              </GlassCard>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(u => {
                    const alreadyFriend = isFriend(u.id);
                    const isSelf = parseInt(u.id) === parseInt(currentUserId);

                    return (
                        <div key={u.id} onClick={() => onNavigate(`profile_${u.id}`)} className="cursor-pointer">
                            <GlassCard className="flex items-center gap-4 hover:bg-white/5 transition">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full border border-white/20 overflow-hidden bg-black flex-shrink-0">
                                    {u.avatar && u.avatar !== "NULL" && u.avatar !== "none" ? (
                                        <img src={u.avatar} className="w-full h-full object-cover" alt="search" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full font-bold text-gray-500">{u.name[0]}</div>
                                    )}
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-white">{u.name}</h3>
                                    <div className="text-xs text-yellow-400">✨ {u.karma}</div>
                                </div>
                                
                                {/* Action Button */}
                                {!isSelf && !alreadyFriend && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); // Prevent opening profile when clicking Connect
                                            handleConnect(u.id); 
                                        }} 
                                        className="text-xs bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded shadow-lg transition"
                                    >
                                        Connect
                                    </button>
                                )}
                                {alreadyFriend && (
                                    <span className="text-xs text-gray-500 font-bold border border-gray-600 px-2 py-1 rounded">LINKED</span>
                                )}
                                {isSelf && (
                                    <span className="text-xs text-cyan-supernova font-bold border border-cyan-supernova px-2 py-1 rounded">YOU</span>
                                )}
                            </GlassCard>
                        </div>
                    );
                })}
              </div>
          </div>
      )}
    </div>
  );
};

export default FriendsPage;