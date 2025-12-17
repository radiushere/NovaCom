import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';
import TagSelector from './TagSelector';

const ProfileView = ({ targetId, currentUserId }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  
  // Form State for Editing
  const [formData, setFormData] = useState({
    email: "", 
    avatar: "", 
    tags: []
  });

  const isSelf = parseInt(targetId) === parseInt(currentUserId);

  // 1. Fetch User Data & Friend Status
  useEffect(() => {
    // Fetch Profile Data
    callBackend('get_user', [targetId]).then(data => {
      if (data && data.id) {
        setUser(data);
        // Initialize form with current data
        setFormData({
            email: data.email || "",
            avatar: data.avatar || "",
            tags: data.tags || []
        });
      }
    });

    // Check if already friends (to disable Connect button)
    if (!isSelf) {
        callBackend('get_friends', [currentUserId]).then(friends => {
            if (Array.isArray(friends)) {
                // Check if targetId exists in my friend list
                const alreadyConnected = friends.some(f => f.id === parseInt(targetId));
                setIsFriend(alreadyConnected);
            }
        });
    }
  }, [targetId, currentUserId, isSelf]);

  // 2. Handle Profile Update
  const handleSave = async () => {
    const tagsStr = formData.tags.join(',');
    // update_profile <id> <email> <avatar> <tags>
    await callBackend('update_profile', [targetId, formData.email, formData.avatar, tagsStr]);
    
    setIsEditing(false);
    // Update local view immediately
    setUser(prev => ({ ...prev, ...formData }));
    alert("Profile Identity Updated Successfully.");
  };

  // 3. Handle Connect Request
  const handleConnect = async () => {
    await callBackend('add_friend', [currentUserId, targetId]);
    setIsFriend(true);
    alert(`Signal Link established with ${user.name}.`);
  };

  if (!user) return <div className="text-white text-center mt-20 animate-pulse">Loading Identity...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      <GlassCard className="relative overflow-hidden p-0">
        
        {/* Banner Background */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-cyan-supernova/20 via-cosmic-purple/20 to-void-black border-b border-white/10"></div>

        <div className="relative z-10 mt-20 flex flex-col items-center">
          
          {/* Avatar Circle */}
          <div className="w-40 h-40 rounded-full border-4 border-void-black bg-deep-void flex items-center justify-center overflow-hidden shadow-2xl relative group">
            {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover transition transform group-hover:scale-110" />
            ) : (
                <span className="text-6xl font-bold text-gray-700 select-none">{user.name[0]}</span>
            )}
          </div>

          {/* User Name */}
          <h1 className="mt-4 text-4xl font-orbitron text-white tracking-wide">{user.name}</h1>
          
          {/* Badges */}
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-yellow-500/10 text-yellow-400 px-4 py-1 rounded-full text-sm font-bold border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                ✨ {user.karma} Reputation
            </span>
            <span className="bg-white/5 text-gray-400 px-4 py-1 rounded-full text-xs border border-white/10 font-mono">
                ID: {user.id}
            </span>
          </div>

          {/* === EDIT MODE === */}
          {isEditing ? (
            <div className="mt-8 w-full max-w-lg space-y-5 bg-black/40 p-8 rounded-2xl border border-cyan-supernova/30 shadow-2xl backdrop-blur-xl">
                <h3 className="text-cyan-supernova font-bold mb-4 text-lg border-b border-white/10 pb-2">Edit Identity</h3>
                
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider ml-1">Avatar URL</label>
                    <input 
                        className="w-full bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none mt-1"
                        placeholder="https://example.com/image.jpg"
                        value={formData.avatar}
                        onChange={e => setFormData({...formData, avatar: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider ml-1">Email Protocol</label>
                    <input 
                        className="w-full bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none mt-1"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider ml-1">Interest Frequencies</label>
                    <div className="mt-1 bg-deep-void p-3 rounded-lg border border-white/10">
                        <TagSelector 
                            selectedTags={formData.tags} 
                            setSelectedTags={t => setFormData({...formData, tags: t})} 
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={handleSave} 
                        className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition shadow-lg shadow-green-500/20"
                    >
                        SAVE CHANGES
                    </button>
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                    >
                        CANCEL
                    </button>
                </div>
            </div>
          ) : (
            /* === VIEW MODE === */
            <div className="mt-8 text-center space-y-8 w-full max-w-2xl px-4">
                
                {/* Tags Display */}
                <div className="flex flex-wrap justify-center gap-2">
                    {user.tags && user.tags.map(t => (
                        <span key={t} className="px-4 py-1.5 bg-cyan-supernova/5 text-cyan-supernova border border-cyan-supernova/20 rounded-full text-sm font-medium">
                            #{t}
                        </span>
                    ))}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition">
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">Email Protocol</p>
                        <p className="text-white font-mono text-sm truncate">
                            {isSelf ? user.email : "Hidden (Privacy Protocol)"}
                        </p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition">
                        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">Current Status</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-green-400 font-bold text-sm">Online</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4">
                    {isSelf ? (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="bg-white/10 hover:bg-white/20 text-white px-10 py-3 rounded-xl border border-white/20 transition font-bold tracking-wide"
                        >
                            EDIT PROFILE
                        </button>
                    ) : isFriend ? (
                        <button 
                            disabled 
                            className="bg-gray-800 text-gray-400 font-bold px-10 py-3 rounded-xl cursor-not-allowed border border-white/5 flex items-center gap-2 mx-auto"
                        >
                            <span>✅</span> Signal Connected
                        </button>
                    ) : (
                        <button 
                            onClick={handleConnect}
                            className="bg-cosmic-purple hover:bg-purple-500 text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition transform hover:scale-105"
                        >
                            CONNECT SIGNAL
                        </button>
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