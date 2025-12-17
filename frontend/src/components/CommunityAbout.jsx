import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const CommunityAbout = ({ commId, currentUserId, onNavigate, onViewUserProfile }) => {
  const [details, setDetails] = useState(null);
  const [members, setMembers] = useState([]);

  const refreshData = () => {
    callBackend('get_community', [commId, currentUserId, 0, 0]).then(data => {
        if(data && data.id) setDetails(data);
    });
    callBackend('get_community_members', [commId]).then(data => {
        if(Array.isArray(data)) setMembers(data);
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
      if(confirm("DANGER: Transfer OWNERSHIP? You will lose Moderator status.")) {
          await callBackend('mod_transfer', [commId, currentUserId, targetId]); 
          refreshData(); 
      }
  };
  const ban = async (targetId) => { if(confirm("Ban this user?")) { await callBackend('mod_ban', [commId, currentUserId, targetId]); refreshData(); }};
  const unban = async (targetId) => { if(confirm("Unban this user?")) { await callBackend('mod_unban', [commId, currentUserId, targetId]); refreshData(); }};

  if (!details) return <div className="text-white text-center mt-20">Loading Sector Info...</div>;

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      
      {/* Header Banner */}
      <div className="relative h-48 w-full shrink-0">
         <div className="absolute inset-0 bg-gradient-to-r from-void-black to-nebula-blue"></div>
         {details.cover && details.cover !== "NULL" && details.cover !== "none" && (
             <img src={details.cover} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="cover"/>
         )}
         <div className="absolute inset-0 bg-black/40"></div>
         
         <div className="absolute top-4 left-4 z-20">
             <button onClick={() => onNavigate(`comm_${commId}`)} className="bg-black/50 hover:bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 transition flex items-center gap-2">
                <span>⬅</span> Back to Chat
             </button>
         </div>

         <div className="absolute bottom-6 left-6 z-20">
             <h1 className="text-4xl font-orbitron text-white drop-shadow-lg">{details.name}</h1>
             <div className="flex gap-2 items-center">
                {details.is_mod && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold">YOU ARE MODERATOR</span>}
                {details.is_admin && <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">YOU ARE ADMIN</span>}
             </div>
             <p className="text-gray-300 max-w-2xl mt-1 text-sm bg-black/30 p-1 rounded px-2 inline-block backdrop-blur-sm">{details.desc}</p>
         </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-void-black/50 border-b border-white/10 p-4 flex justify-between items-center">
          <div className="flex gap-6 text-sm">
              <div className="text-gray-400">MEMBERS: <span className="text-white font-bold">{members.filter(m=>!m.is_banned).length}</span></div>
              <div className="text-gray-400">BANNED: <span className="text-red-400 font-bold">{members.filter(m=>m.is_banned).length}</span></div>
          </div>
          {details.is_member && <button onClick={handleLeave} className="bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded text-xs transition">LEAVE COMMUNITY</button>}
      </div>

      {/* Member Grid */}
      <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-orbitron text-cyan-supernova mb-4">Member Roster</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => {
                  const isSelf = m.id === parseInt(currentUserId);
                  return (
                    <GlassCard key={m.id} className={`relative flex flex-col gap-3 hover:bg-white/5 transition group ${m.is_banned ? 'border-red-500/50 opacity-70' : ''}`}>
                        
                        {/* Profile Click Area - USES NEW PROP */}
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewUserProfile(m.id)}>
                            <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-black flex-shrink-0">
                                {m.avatar && m.avatar !== "NULL" && m.avatar !== "none" ? <img src={m.avatar} className="w-full h-full object-cover" alt="p"/> : <div className="w-full h-full flex items-center justify-center text-gray-500">{m.name[0]}</div>}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white group-hover:text-cyan-supernova transition">{m.name}</span>
                                    {m.is_mod && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">MOD</span>}
                                    {m.is_admin && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                                    {m.is_banned && <span className="text-[10px] bg-black text-red-500 border border-red-500 px-1.5 py-0.5 rounded font-bold">BANNED</span>}
                                </div>
                                <div className="text-xs text-yellow-400">✨ {m.karma} Rep</div>
                            </div>
                        </div>

                        {/* Mod Controls */}
                        {!isSelf && (
                            <div className="flex flex-wrap gap-2 mt-1 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                                {details.is_mod && (
                                    <>
                                        {!m.is_banned && !m.is_admin && !m.is_mod && <button onClick={() => promote(m.id)} className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/40">Make Admin</button>}
                                        {m.is_admin && <button onClick={() => demote(m.id)} className="text-[10px] bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-500">Revoke Admin</button>}
                                        {!m.is_banned && <button onClick={() => transfer(m.id)} className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/40">Transfer Owner</button>}
                                        {!m.is_banned && <button onClick={() => ban(m.id)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40">Ban</button>}
                                        {m.is_banned && <button onClick={() => unban(m.id)} className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/40">Unban</button>}
                                    </>
                                )}
                                {details.is_admin && !details.is_mod && (
                                    <>
                                        {!m.is_banned && !m.is_mod && !m.is_admin && <button onClick={() => ban(m.id)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40">Ban</button>}
                                        {m.is_banned && <button onClick={() => unban(m.id)} className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/40">Unban</button>}
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