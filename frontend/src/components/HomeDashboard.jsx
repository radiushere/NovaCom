import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const HomeDashboard = ({ userId, onNavigate }) => {
  const [popular, setPopular] = useState([]);
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
  const [userRecs, setUserRecs] = useState([]);
  const [commRecs, setCommRecs] = useState([]);

  // Load Dashboard Data
  useEffect(() => {
    callBackend('get_user', [userId]).then(data => { if (data && data.id) setUser(data); });
    callBackend('get_popular').then(data => { if (Array.isArray(data)) setPopular(data); });
    callBackend('get_friends', [userId]).then(data => { if (Array.isArray(data)) setFriends(data); });
    callBackend('get_recommendations', [userId]).then(data => { if (Array.isArray(data)) setUserRecs(data); });
    callBackend('get_comm_recs', [userId]).then(data => { if (Array.isArray(data)) setCommRecs(data); });
  }, [userId]);

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* 1. WELCOME HEADER */}
      <header className="border-b border-museum-stone pb-8">
        <h1 className="text-5xl font-serif text-museum-text tracking-tight">
          Welcome, {user?.name || "Curator"}
        </h1>
        <p className="text-museum-muted mt-4 text-lg font-light">
          Your daily curation of art, culture, and connection.
        </p>
      </header>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COL: TRENDING GALLERIES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-museum-text">Featured Collections</h2>
            <button onClick={() => onNavigate('explore_comms')} className="text-sm text-museum-muted hover:text-museum-text underline decoration-1 underline-offset-4">View All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {popular.length === 0 && <p className="text-museum-muted italic">No collections currently trending.</p>}

            {popular.map(c => (
              <div
                key={c.id}
                onClick={() => onNavigate(`comm_${c.id}`)}
                className="group cursor-pointer bg-white border border-museum-stone rounded-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden aspect-[4/3]"
              >
                {/* Cover Image */}
                {c.cover && c.cover !== "none" && c.cover !== "NULL" ? (
                  <img src={c.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-museum-stone/20 flex items-center justify-center text-museum-muted font-serif text-4xl">
                    {c.name.substring(0, 1)}
                  </div>
                )}

                {/* Overlay Content */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col justify-end p-6">
                  <div className="bg-white/90 backdrop-blur-sm p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-serif text-xl text-museum-text">{c.name}</h3>
                    <p className="text-xs text-museum-muted mt-1 uppercase tracking-wider">{c.members} Patrons</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COL: CONNECTIONS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-museum-text">Connections</h2>
            <button onClick={() => onNavigate('explore_users')} className="text-sm text-museum-muted hover:text-museum-text underline decoration-1 underline-offset-4">Find</button>
          </div>

          <GlassCard className="min-h-[300px]">
            <div className="space-y-4">
              {friends.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-museum-muted italic mb-4">You have not yet connected with other curators.</p>
                  <button
                    onClick={() => onNavigate('explore_users')}
                    className="bg-museum-text text-white text-xs px-6 py-3 uppercase tracking-widest hover:bg-black transition"
                  >
                    Discover People
                  </button>
                </div>
              )}

              {friends.map(f => (
                <div key={f.id} className="flex items-center gap-4 p-3 hover:bg-museum-stone/20 transition-colors cursor-pointer" onClick={() => onNavigate(`profile_${f.id}`)}>
                  <div className="w-10 h-10 bg-museum-stone overflow-hidden flex items-center justify-center">
                    {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" alt="avatar" /> : <div className="text-museum-muted font-serif">{f.name[0]}</div>}
                  </div>
                  <div>
                    <p className="font-medium text-museum-text">{f.name}</p>
                    <p className="text-xs text-museum-muted uppercase tracking-wider">Associate</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* User Recommendations */}
          {userRecs.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl text-museum-text mb-4">Suggested Patrons</h3>
              <div className="space-y-3">
                {userRecs.map(u => (
                  <div key={u.id} onClick={() => onNavigate(`profile_${u.id}`)} className="flex items-center gap-4 p-3 border border-museum-stone hover:border-museum-muted transition-colors cursor-pointer bg-white">
                    <div className="w-10 h-10 bg-museum-stone flex items-center justify-center font-serif text-museum-muted overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="avatar" /> : (u.name ? u.name[0] : '?')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-museum-text">{u.name}</p>
                        {u.degree && <span className="text-[9px] bg-museum-stone px-1.5 py-0.5 uppercase tracking-widest text-museum-muted">{u.degree} Deg</span>}
                      </div>
                      <p className="text-xs text-museum-muted">{(u.score ?? u.mutual_friends ?? 0)} Mutual Connections</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {commRecs.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl text-museum-text mb-4">Recommended for You</h3>
              <div className="space-y-3">
                {commRecs.map(c => (
                  <div key={c.id} onClick={() => onNavigate(`comm_${c.id}`)} className="flex items-center gap-4 p-3 border border-museum-stone hover:border-museum-muted transition-colors cursor-pointer bg-white">
                    <div className="w-10 h-10 bg-museum-stone flex items-center justify-center font-serif text-museum-muted">{c.name[0]}</div>
                    <div>
                      <p className="font-medium text-museum-text">{c.name}</p>
                      <p className="text-xs text-museum-muted">{c.members} Members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;