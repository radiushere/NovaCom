import React, { useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const UserSearch = ({ currentUserId, onFriendAdded, existingFriends = [] }) => {
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [degree, setDegree] = useState(null); // Store connection degree
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;

    // 1. Get User Details
    const data = await callBackend('get_user', [searchId]);

    if (data && data.id) {
      setFoundUser(data);
      setError("");

      // 2. Check Degree of Connection
      const rel = await callBackend('get_relation', [currentUserId, data.id]);
      if (rel) setDegree(rel.degree);
    } else {
      setFoundUser(null);
      setError("Patron not found in the registry.");
    }
  };

  const handleAddFriend = async () => {
    if (!foundUser) return;
    await callBackend('add_friend', [currentUserId, foundUser.id]);
    alert(`Connection established with ${foundUser.name}`);
    setFoundUser(null);
    setSearchId("");
    if (onFriendAdded) onFriendAdded();
  };

  const isSelf = foundUser && parseInt(foundUser.id) === parseInt(currentUserId);

  return (
    <GlassCard className="mb-6">
      <h3 className="font-serif text-xl text-museum-text mb-4">Locate Patron</h3>

      <form onSubmit={handleSearch} className="flex gap-0 mb-6 border-b border-museum-stone pb-2">
        <input
          type="number" placeholder="Enter Patron ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)}
          className="bg-transparent text-museum-text p-2 w-full outline-none font-sans placeholder-museum-muted"
        />
        <button type="submit" className="text-museum-text hover:text-museum-gold px-4 font-medium uppercase tracking-widest text-xs transition">SEARCH</button>
      </form>

      {error && <p className="text-red-400 text-sm italic">{error}</p>}

      {foundUser && (
        <div className="bg-white border border-museum-stone p-6 flex justify-between items-center animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-serif text-2xl text-museum-text">{foundUser.name}</h4>

              {/* DEGREE BADGE */}
              {degree > 0 && degree <= 3 && (
                <span className="bg-museum-stone text-museum-muted text-[10px] px-2 py-1 uppercase tracking-widest">
                  {degree === 1 ? "1st" : degree === 2 ? "2nd" : "3rd"} Degree
                </span>
              )}
            </div>

            <div className="flex gap-4 text-xs mt-2 uppercase tracking-widest text-museum-muted">
              <span>ID: {foundUser.id}</span>
              <span>Reputation: {foundUser.karma || 0}</span>
            </div>
          </div>

          {/* LOGIC CHANGE: Hide if Self OR Degree is 1 (Direct Friend) */}
          {!isSelf && degree !== 1 && (
            <button
              onClick={handleAddFriend}
              className="bg-museum-text hover:bg-black text-white text-xs px-6 py-3 uppercase tracking-widest transition"
            >
              Connect
            </button>
          )}

          {/* If Degree is 1, show Linked */}
          {degree === 1 && (
            <span className="text-museum-gold text-xs font-bold border border-museum-gold px-3 py-1 uppercase tracking-widest">
              Connected
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default UserSearch;