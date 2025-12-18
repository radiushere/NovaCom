import React from 'react';
import { callBackend } from '../api';

const PollMessage = ({ poll, msgId, commId, currentUserId, onUpdate }) => {
  // Calculate total votes for percentage
  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.count, 0);

  const handleVote = async (optionId) => {
    // vote_poll <commId> <userId> <msgId> <optionId>
    await callBackend('vote_poll', [commId, currentUserId, msgId, optionId]);
    if(onUpdate) onUpdate();
  };

  return (
    <div className="w-full min-w-[250px] max-w-[300px]">
      <div className="mb-2 font-bold text-white border-b border-white/10 pb-1">
        📊 {poll.question}
        <span className="block text-[10px] text-gray-400 font-normal">
            {poll.multi ? "(Select Multiple)" : "(Single Choice)"} • {totalVotes} votes
        </span>
      </div>

      <div className="space-y-2">
        {poll.options.map(opt => {
            const percent = totalVotes === 0 ? 0 : Math.round((opt.count / totalVotes) * 100);
            
            return (
                <div 
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    className={`relative rounded overflow-hidden cursor-pointer border transition
                        ${opt.voted ? "border-cyan-supernova" : "border-white/10 hover:border-white/30"}
                    `}
                >
                    {/* Progress Bar Background */}
                    <div 
                        className={`absolute top-0 left-0 h-full opacity-20 transition-all duration-500
                            ${opt.voted ? "bg-cyan-supernova" : "bg-gray-500"}
                        `}
                        style={{ width: `${percent}%` }}
                    ></div>

                    {/* Content */}
                    <div className="relative p-2 flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                ${opt.voted ? "bg-cyan-supernova border-cyan-supernova" : "border-gray-500"}
                            `}>
                                {opt.voted && <span className="text-black text-[10px] font-bold">✓</span>}
                            </div>
                            <span className="text-sm text-white">{opt.text}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{percent}% ({opt.count})</span>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default PollMessage;