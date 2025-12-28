import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const RecommendationList = ({ userId }) => {
  const [recs, setRecs] = useState([]);

  const fetchRecs = () => {
    callBackend('get_recommendations', [userId]).then((data) => {
      if (Array.isArray(data)) setRecs(data);
    });
  };

  useEffect(() => {
    fetchRecs();
  }, [userId]);

  // --- NEW FUNCTION ---
  const handleConnect = async (targetId) => {
    await callBackend('add_friend', [userId, targetId]);
    // Remove the user from the list immediately to show feedback
    setRecs(prev => prev.filter(u => u.id !== targetId));
    alert("Connection established.");
  };

  return (
    <GlassCard className="h-full border border-museum-stone shadow-sm">
      <h2 className="font-serif text-xl text-museum-text mb-6 border-b border-museum-stone pb-2">
        Curated For You
      </h2>

      {recs.length === 0 ? (
        <p className="text-museum-muted text-sm font-serif italic">No suggestions available.</p>
      ) : (
        <div className="space-y-4">
          {recs.map((user) => (
            <div key={user.id} className="flex justify-between items-center bg-white p-4 border border-museum-stone hover:border-museum-text transition-all group">
              <div>
                <h3 className="font-serif font-bold text-museum-text text-lg">{user.name}</h3>
                <p className="text-xs text-museum-muted uppercase tracking-widest">
                  {user.mutual_friends} Mutual
                </p>
              </div>

              {/* --- UPDATED BUTTON --- */}
              <button
                onClick={() => handleConnect(user.id)}
                className="bg-white border border-museum-stone text-museum-text text-xs px-4 py-2 hover:bg-museum-text hover:text-white transition uppercase tracking-widest"
              >
                Connect
              </button>

            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default RecommendationList;