import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const HomeDashboard = ({ userId, onNavigate }) => {
  const [popular, setPopular] = useState([]);
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);

  // Load Dashboard Data
  useEffect(() => {
    // 1. Get My Info
    callBackend('get_user', [userId]).then(data => {
        if(data && data.id) setUser(data);
    });

    // 2. Get Popular Communities
    callBackend('get_popular').then(data => {
        if(Array.isArray(data)) setPopular(data);
    });

    // 3. Get Friends List
    callBackend('get_friends', [userId]).then(data => {
        if(Array.isArray(data)) setFriends(data);
    });
  }, [userId]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. WELCOME HEADER */}
      <header>
        <h1 className="text-4xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-supernova to-cosmic-purple drop-shadow-glow">
          WELCOME, {user?.name?.toUpperCase() || "OPERATOR"}
        </h1>
        <p className="text-gray-400 mt-2 tracking-widest text-sm">
            SYSTEM STATUS: <span className="text-green-400">ONLINE</span>
        </p>
      </header>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COL: TRENDING NEBULAS */}
        <GlassCard className="col-span-2 relative overflow-hidden">
          <h2 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2">
             <span>🔥</span> Trending Nebulas
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popular.length === 0 && <p className="text-gray-500">No active sectors found.</p>}
            
            {popular.map(c => (
              <div 
                key={c.id} 
                onClick={() => onNavigate(`comm_${c.id}`)} 
                className="cursor-pointer bg-void-black/50 p-4 rounded-xl border border-white/10 hover:border-cyan-supernova transition group relative overflow-hidden h-32 flex flex-col justify-end"
              >
                {/* Cover Image Background */}
                {c.cover && c.cover !== "none" && c.cover !== "NULL" && (
                    <div className="absolute inset-0 z-0">
                        <img src={c.cover} alt="cover" className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-supernova transition">{c.name}</h3>
                    <p className="text-xs text-gray-400">{c.members} Signals Active</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* RIGHT COL: MY SIGNALS (FRIENDS) */}
        <GlassCard>
          <h2 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2">
             <span>📡</span> Your Signals
          </h2>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 pr-2">
            {friends.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-sm mb-4">No connections yet.</p>
                    <button 
                        onClick={() => onNavigate('explore_users')} 
                        className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded transition"
                    >
                        Find Signals
                    </button>
                </div>
            )}

            {friends.map(f => (
              <div 
                key={f.id} 
                onClick={() => onNavigate(`profile_${f.id}`)} 
                className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition group"
              >
                 {/* Avatar */}
                 <div className="w-10 h-10 rounded-full bg-cyan-supernova/20 border border-cyan-supernova flex items-center justify-center text-xs overflow-hidden flex-shrink-0 group-hover:border-white transition">
                    {f.avatar ? (
                        <img src={f.avatar} className="w-full h-full object-cover" alt="friend" />
                    ) : (
                        <span className="font-bold text-cyan-supernova">{f.name[0]}</span>
                    )}
                 </div>
                 
                 {/* Info */}
                 <div className="overflow-hidden">
                    <div className="font-bold text-sm text-white truncate group-hover:text-cyan-supernova transition">{f.name}</div>
                    <div className="text-xs text-yellow-400">✨ {f.karma || 0} Reputation</div>
                 </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default HomeDashboard;