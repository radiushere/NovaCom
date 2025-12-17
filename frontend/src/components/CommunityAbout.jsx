import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const CommunityAbout = ({ commId, currentUserId, onNavigate }) => {
  const [details, setDetails] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // 1. Get Metadata
    callBackend('get_community', [commId, currentUserId, 0, 0]).then(data => {
        if(data && data.id) setDetails(data);
    });

    // 2. Get Member List
    callBackend('get_community_members', [commId]).then(data => {
        if(Array.isArray(data)) setMembers(data);
    });
  }, [commId, currentUserId]);

  const handleLeave = async () => {
    if (window.confirm(`Are you sure you want to leave ${details.name}?`)) {
        await callBackend('leave_community', [currentUserId, commId]);
        onNavigate('explore_comms');
    }
  };

  if (!details) return <div className="text-white text-center mt-20">Loading Sector Info...</div>;

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      
      {/* 1. Header Banner */}
      <div className="relative h-48 w-full shrink-0">
         {/* Background */}
         <div className="absolute inset-0 bg-gradient-to-r from-void-black to-nebula-blue"></div>
         {details.cover && details.cover !== "NULL" && details.cover !== "none" && (
             <img src={details.cover} className="absolute inset-0 w-full h-full object-cover opacity-50" />
         )}
         <div className="absolute inset-0 bg-black/40"></div>
         
         {/* Back Button */}
         <div className="absolute top-4 left-4 z-20">
             <button 
                onClick={() => onNavigate(`comm_${commId}`)} 
                className="bg-black/50 hover:bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 transition flex items-center gap-2"
             >
                <span>⬅</span> Back to Chat
             </button>
         </div>

         {/* Title Info */}
         <div className="absolute bottom-6 left-6 z-20">
             <h1 className="text-4xl font-orbitron text-white drop-shadow-lg">{details.name}</h1>
             <p className="text-gray-300 max-w-2xl mt-1 text-sm bg-black/30 p-1 rounded px-2 inline-block backdrop-blur-sm">
                {details.desc}
             </p>
         </div>
      </div>

      {/* 2. Stats Bar */}
      <div className="bg-void-black/50 border-b border-white/10 p-4 flex justify-between items-center">
          <div className="flex gap-6 text-sm">
              <div className="text-gray-400">MEMBERS: <span className="text-white font-bold">{members.length}</span></div>
              <div className="text-gray-400">STATUS: <span className="text-green-400 font-bold">ACTIVE</span></div>
          </div>
          
          {details.is_member && (
              <button onClick={handleLeave} className="bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded text-xs transition">
                LEAVE COMMUNITY
              </button>
          )}
      </div>

      {/* 3. Member Grid */}
      <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-orbitron text-cyan-supernova mb-4">Member Roster</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => (
                  <GlassCard 
                    key={m.id} 
                    className="flex items-center gap-4 hover:bg-white/5 cursor-pointer transition group"
                    onClick={() => onNavigate(`profile_${m.id}`)}
                  >
                      <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-black flex-shrink-0">
                          {m.avatar && m.avatar !== "NULL" && m.avatar !== "none" ? <img src={m.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">{m.name[0]}</div>}
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-cyan-supernova transition">{m.name}</span>
                              {m.is_mod && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">MOD</span>}
                          </div>
                          <div className="text-xs text-yellow-400">✨ {m.karma} Rep</div>
                      </div>
                  </GlassCard>
              ))}
          </div>
      </div>
    </div>
  );
};

export default CommunityAbout;