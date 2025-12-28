import React from 'react';
import { callBackend } from '../api';

const PollMessage = ({ poll, msgId, commId, currentUserId, onUpdate }) => {
  // Calculate total votes for percentage
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.count, 0);

  const handleVote = async (optionId) => {
    await callBackend('vote_poll', [commId, currentUserId, msgId, optionId]);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="w-full min-w-[250px] max-w-[300px]">
      <div className="mb-3 font-serif text-museum-text border-b border-museum-stone pb-2">
        <span className="font-bold text-lg">{poll.question}</span>
        <span className="block text-[10px] text-museum-muted font-sans uppercase tracking-widest mt-1">
          {poll.multi ? "Multiple Choice" : "Single Choice"} • {totalVotes} votes
        </span>
      </div>

      <div className="space-y-2">
        {poll.options.map(opt => {
          const percent = totalVotes === 0 ? 0 : Math.round((opt.count / totalVotes) * 100);

          return (
            <div
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className={`relative rounded-none overflow-hidden cursor-pointer border transition group
                        ${opt.voted ? "border-museum-text bg-museum-bg" : "border-museum-stone hover:border-museum-text bg-white"}
                    `}
            >
              {/* Progress Bar Background */}
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-500
                            ${opt.voted ? "bg-museum-gold/20" : "bg-museum-stone/20"}
                        `}
                style={{ width: `${percent}%` }}
              ></div>

              {/* Content */}
              <div className="relative p-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition
                                ${opt.voted ? "bg-museum-text border-museum-text" : "border-museum-muted group-hover:border-museum-text"}
                            `}>
                    {opt.voted && <span className="text-white text-[8px] font-bold">✓</span>}
                  </div>
                  <span className={`text-sm ${opt.voted ? "text-museum-text font-medium" : "text-museum-text"}`}>{opt.text}</span>
                </div>
                <span className="text-xs text-museum-muted font-mono">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PollMessage;