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
        alert("Profile Updated.");
    };

    const handleConnect = async () => {
        const res = await callBackend('send_request', [currentUserId, targetId]);
        if (res.status === "request_sent") {
            setStatus("pending_sent");
            alert(`Invitation sent to ${user.name}.`);
        } else {
            alert("Action Failed: " + res.status);
        }
    };

    const handleUnfriend = async () => {
        if (window.confirm(`Disconnect from ${user.name}?`)) {
            await callBackend('remove_friend', [currentUserId, targetId]);
            setStatus("none");
        }
    };

    const handleMessage = () => {
        if (onNavigate) onNavigate(`dm_${user.id}_${user.name}`);
    };

    const handleLogout = () => {
        if (window.confirm("End session?")) {
            onLogout();
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = prompt("WARNING: This will permanently delete your account. Type 'DELETE' to confirm.");
        if (confirmDelete === 'DELETE') {
            await callBackend('delete_user', [currentUserId]);
            onLogout();
        }
    };

    if (!user) return (
        <div className="flex items-center justify-center h-full">
            <div className="text-museum-muted text-center animate-pulse font-serif">
                Loading Curator Profile...
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-10 relative p-8">

            {/* Dynamic Back Button */}
            {returnPath && (
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 z-50 text-museum-muted hover:text-museum-text flex items-center gap-2 transition group uppercase tracking-widest text-xs"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                </button>
            )}

            <div className="mt-12">
                <GlassCard className="p-12 border border-museum-stone shadow-lg relative overflow-hidden">

                    {/* Background Art Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-museum-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-48 h-48 rounded-full border border-museum-stone p-2 bg-white shadow-sm">
                                <div className="w-full h-full rounded-full overflow-hidden bg-museum-stone relative group">
                                    {isEditing ? (
                                        <>
                                            {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full bg-museum-stone"></div>}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <input
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setFormData({ ...formData, avatar: reader.result });
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <span className="text-xs font-bold text-museum-text bg-white/80 px-3 py-1 rounded uppercase tracking-widest">Upload</span>
                                            </div>
                                        </>
                                    ) : (
                                        user.avatar && user.avatar !== "NULL" ? (
                                            <img src={user.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" alt="Profile" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl text-museum-muted font-serif bg-white">{user.name[0]}</div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 w-full">
                                {isSelf ? (
                                    !isEditing ? (
                                        <>
                                            <button onClick={() => setIsEditing(true)} className="w-full bg-museum-text text-white py-3 hover:bg-black transition uppercase tracking-widest text-xs shadow-sm">Edit Profile</button>
                                            <button onClick={handleLogout} className="w-full border border-museum-stone text-museum-muted hover:text-museum-text py-3 hover:bg-museum-bg transition uppercase tracking-widest text-xs">Log Out</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleSave} className="w-full bg-museum-gold text-white py-3 hover:bg-yellow-600 transition uppercase tracking-widest text-xs shadow-sm">Save Changes</button>
                                            <button onClick={() => setIsEditing(false)} className="w-full border border-museum-stone text-museum-muted hover:text-museum-text py-3 hover:bg-museum-bg transition uppercase tracking-widest text-xs">Cancel</button>
                                        </>
                                    )
                                ) : (
                                    <>
                                        {status === "friends" ? (
                                            <>
                                                <button onClick={handleMessage} className="w-full bg-museum-text text-white py-3 hover:bg-black transition uppercase tracking-widest text-xs shadow-sm">Message</button>
                                                <button onClick={handleUnfriend} className="w-full border border-museum-stone text-museum-muted hover:text-red-500 py-3 hover:bg-red-50 transition uppercase tracking-widest text-xs">Disconnect</button>
                                            </>
                                        ) : status === "pending_sent" ? (
                                            <button disabled className="w-full bg-museum-stone text-museum-muted py-3 cursor-not-allowed uppercase tracking-widest text-xs">Pending</button>
                                        ) : status === "pending_received" ? (
                                            <button onClick={() => onNavigate('notifications')} className="w-full bg-museum-gold text-white py-3 hover:bg-yellow-600 transition uppercase tracking-widest text-xs shadow-sm">Respond</button>
                                        ) : (
                                            <button onClick={handleConnect} className="w-full bg-museum-text text-white py-3 hover:bg-black transition uppercase tracking-widest text-xs shadow-sm">Connect</button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 space-y-8 w-full">
                            <div>
                                <h1 className="text-5xl font-serif text-museum-text mb-2">{user.name}</h1>
                                <p className="text-museum-muted font-serif italic text-lg">Member since {new Date().getFullYear()}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="border-b border-museum-stone pb-4">
                                    <label className="block text-xs uppercase tracking-widest text-museum-muted mb-2">Email Address</label>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-museum-bg p-3 border-b border-museum-stone text-museum-text focus:border-museum-text outline-none transition font-serif"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-xl text-museum-text font-serif">{user.email || "No email provided"}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-museum-muted mb-4">Interests & Expertise</label>
                                    {isEditing ? (
                                        <TagSelector
                                            selectedTags={formData.tags}
                                            onChange={newTags => setFormData({ ...formData, tags: newTags })}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {user.tags && user.tags.length > 0 ? (
                                                user.tags.map(t => (
                                                    <span key={t} className="px-4 py-1.5 bg-museum-bg border border-museum-stone text-museum-text text-xs uppercase tracking-widest">
                                                        {t}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-museum-muted italic">No interests listed.</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isSelf && isEditing && (
                                <div className="pt-8 border-t border-museum-stone">
                                    <button onClick={handleDeleteAccount} className="text-red-400 hover:text-red-600 text-xs uppercase tracking-widest border-b border-transparent hover:border-red-400 transition-all">
                                        Delete Account Permanently
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ProfileView;