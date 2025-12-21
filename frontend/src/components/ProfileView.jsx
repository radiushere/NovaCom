import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';
import TagSelector from './TagSelector';

const ProfileView = ({ targetId, currentUserId, returnPath, onBack, onNavigate, onLogout }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("none"); // friend, pending_sent, pending_received, none, self
  
  const [formData, setFormData] = useState({ email: "", avatar: "", tags: [] });
  const isSelf = parseInt(targetId) === parseInt(currentUserId);

  const fetchProfileData = async () => {
    // 1. Get User Profile Details
    const data = await callBackend('get_user', [targetId]);
    if (data && data.id) {
      setUser(data);
      setFormData({
          email: data.email || "",
          avatar: data.avatar || "",
          tags: data.tags || []
      });
    }

    // 2. Get Relationship Status (Invite System Logic)
    if (!isSelf) {
        const rel = await callBackend('get_relationship', [currentUserId, targetId]);
        if (rel && rel.status) setStatus(rel.status);
    } else {
        setStatus("self");
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [targetId, currentUserId]);

  const handleSave = async () => {
    const tagsStr = formData.tags.join(',');
    await callBackend('update_profile', [targetId, formData.email, formData.avatar, tagsStr]);
    setIsEditing(false);
    setUser(prev => ({ ...prev, ...formData }));
    alert("Profile Identity Updated Successfully.");
  };

  const handleConnect = async () => {
    const res = await callBackend('send_request', [currentUserId, targetId]);
    if (res.status === "request_sent") {
        setStatus("pending_sent");
        alert(`Handshake signal transmitted to ${user.name}. Waiting for confirmation.`);
    } else {
        alert("Transmission Failed: " + res.status);
    }
  };

  const handleUnfriend = async () => {
      if(window.confirm(`Are you sure you want to disconnect from ${user.name}?`)) {
          await callBackend('remove_friend', [currentUserId, targetId]);
          setStatus("none");
      }
  };

  const handleMessage = () => {
      if(onNavigate) onNavigate(`dm_${user.id}_${user.name}`);
  };

  const handleLogout = () => {
      if (window.confirm("End active session and return to login?")) {
          onLogout();
      }
  };

  const handleDeleteAccount = async () => {
      const confirmDelete = prompt("WARNING: This will permanently delete your account and all data. Type 'DELETE' to confirm.");
      if (confirmDelete === 'DELETE') {
          await callBackend('delete_user', [currentUserId]);
          onLogout(); 
      }
  };

  if (!user) return (
    <div className="flex items-center justify-center h-full">
        <div className="text-white text-center animate-pulse">
            <div className="w-12 h-12 border-4 border-cyan-supernova border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-orbitron tracking-widest">SCANNING NEURAL LINK...</p>
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10 relative">
      
      {/* Dynamic Back Button */}
      {returnPath && (
          <button 
            onClick={onBack}
            className="absolute top-0 left-0 z-50 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 backdrop-blur-md transition group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">⬅</span> 
            <span className="text-sm font-bold uppercase tracking-wider">Back</span>
          </button>
      )}

      <GlassCard className="relative overflow-hidden p-0 mt-8">
        
        {/* Animated Banner */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-cyan-supernova/20 via-cosmic-purple/20 to-void-black border-b border-white/10">
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="relative z-10 mt-20 flex flex-col items-center">
          
          {/* Avatar Container */}
          <div className="w-40 h-40 rounded-full border-4 border-void-black bg-deep-void flex items-center justify-center overflow-hidden shadow-2xl relative group">
            {user.avatar && user.avatar !== "NULL" && user.avatar !== "none" ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover transition transform group-hover:scale-110 duration-500" />
            ) : (
                <span className="text-6xl font-bold text-gray-700 select-none font-orbitron">{user.name[0]}</span>
            )}
            <div className="absolute inset-0 bg-cyan-supernova/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>

          <h1 className="mt-4 text-4xl font-orbitron text-white tracking-wide drop-shadow-glow">{user.name}</h1>
          
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-yellow-500/10 text-yellow-400 px-4 py-1 rounded-full text-sm font-bold border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                ✨ {user.karma} Reputation
            </span>
            <span className="bg-white/5 text-gray-400 px-4 py-1 rounded-full text-xs border border-white/10 font-mono">
                ID: {user.id}
            </span>
          </div>

          {/* EDITING INTERFACE */}
          {isEditing ? (
            <div className="mt-8 w-full max-w-lg space-y-5 bg-black/40 p-8 rounded-2xl border border-cyan-supernova/30 shadow-2xl backdrop-blur-xl animate-slide-up">
                <h3 className="text-cyan-supernova font-bold mb-4 text-lg border-b border-white/10 pb-2 font-orbitron uppercase tracking-widest">Update Identity</h3>
                
                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">Avatar Data Link</label>
                    <input 
                        className="w-full bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova focus:ring-1 focus:ring-cyan-supernova outline-none mt-1 transition-all"
                        placeholder="https://images.com/user-7.jpg"
                        value={formData.avatar} 
                        onChange={e => setFormData({...formData, avatar: e.target.value})} 
                    />
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">Email Relay Protocol</label>
                    <input 
                        className="w-full bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova focus:ring-1 focus:ring-cyan-supernova outline-none mt-1 transition-all"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                </div>

                <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest ml-1">Interest Frequencies</label>
                    <div className="mt-1 bg-deep-void p-3 rounded-lg border border-white/10">
                        <TagSelector selectedTags={formData.tags} setSelectedTags={t => setFormData({...formData, tags: t})} />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={handleSave} 
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition shadow-lg shadow-green-500/20 active:scale-95"
                    >
                        COMMIT CHANGES
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition active:scale-95"
                    >
                        ABORT
                    </button>
                </div>
            </div>
          ) : (
            /* PUBLIC/PRIVATE VIEW MODE */
            <div className="mt-8 text-center space-y-8 w-full max-w-2xl px-4 animate-fade-in">
                
                <div className="flex flex-wrap justify-center gap-2">
                    {user.tags && user.tags.map(t => (
                        <span key={t} className="px-4 py-1.5 bg-cyan-supernova/5 text-cyan-supernova border border-cyan-supernova/20 rounded-full text-sm font-medium tracking-wide">
                            #{t}
                        </span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition group">
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Email Relay</p>
                        <p className="text-white font-mono text-sm truncate group-hover:text-cyan-supernova transition">
                            {isSelf ? user.email : "DATA_ENCRYPTED"}
                        </p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition">
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <p className="text-green-400 font-bold text-sm tracking-widest">CONNECTED</p>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                    {isSelf ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl border border-white/20 transition font-bold tracking-widest uppercase text-sm"
                            >
                                Edit Profile
                            </button>
                            
                            <button 
                                onClick={handleLogout} 
                                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-8 py-3 rounded-xl border border-yellow-500/30 transition font-bold tracking-widest uppercase text-sm"
                            >
                                Logout
                            </button>

                            <button 
                                onClick={handleDeleteAccount} 
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-8 py-3 rounded-xl border border-red-500/30 transition font-bold tracking-widest uppercase text-sm"
                            >
                                Terminate Account
                            </button>
                        </>
                    ) : (
                        <>
                            {status === "friend" ? (
                                <div className="flex gap-2 animate-fade-in">
                                    <button disabled className="bg-gray-800 text-green-400 font-bold px-10 py-3 rounded-xl border border-green-500/20 cursor-not-allowed flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Linked
                                    </button>
                                    <button 
                                        onClick={handleUnfriend} 
                                        className="bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/20 px-6 py-3 rounded-xl font-bold transition uppercase text-xs"
                                    >
                                        Unfriend
                                    </button>
                                </div>
                            ) : status === "pending_sent" ? (
                                <button disabled className="bg-yellow-500/10 text-yellow-400 font-bold px-10 py-3 rounded-xl border border-yellow-500/20 cursor-wait animate-pulse uppercase tracking-widest text-sm">
                                    ⌛ Handshake Sent
                                </button>
                            ) : status === "pending_received" ? (
                                <button 
                                    onClick={() => onNavigate('notifications')} 
                                    className="bg-cyan-supernova text-black font-bold px-10 py-3 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-bounce uppercase tracking-widest text-sm"
                                >
                                    🔔 Signal Detected!
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConnect} 
                                    className="bg-cosmic-purple hover:bg-purple-500 text-white font-bold px-12 py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
                                >
                                    Connect Signal
                                </button>
                            )}

                            <button 
                                onClick={handleMessage} 
                                className="bg-cyan-supernova hover:bg-cyan-400 text-black font-bold px-10 py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95 uppercase tracking-widest text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Message
                            </button>
                        </>
                    )}
                </div>
            </div>
          )}
        </div>
        <div className="h-10"></div>
      </GlassCard>
    </div>
  );
};

export default ProfileView;