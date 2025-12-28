import React, { useEffect, useState } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const FriendList = ({ userId }) => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    callBackend('get_friends', [userId]).then((data) => {
      if (Array.isArray(data)) setFriends(data);
    });
  }, [userId]);

  return (
    <GlassCard className="h-full">
      <h2 className="font-serif text-xl text-museum-text mb-6 border-b border-museum-stone pb-2">
        Associates <span className="text-xs text-museum-muted align-top ml-1">{friends.length}</span>
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-center space-x-4 p-3 border border-transparent hover:border-museum-stone transition group cursor-pointer">
            <div className="w-10 h-10 bg-museum-stone flex items-center justify-center text-museum-muted font-serif text-lg">
              {friend.name[0]}
            </div>
            <span className="font-sans text-museum-text group-hover:text-museum-gold transition-colors">{friend.name}</span>
          </div>
        ))}
        {friends.length === 0 && (
          <div className="text-museum-muted text-sm italic text-center py-4">No associates found.</div>
        )}
      </div>
    </GlassCard>
  );
};

export default FriendList;