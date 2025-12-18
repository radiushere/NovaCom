import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { callBackend } from '../api';

const CreatePollModal = ({ commId, currentUserId, onClose, onRefresh }) => {
  const [question, setQuestion] = useState("");
  const [allowMulti, setAllowMulti] = useState(false);
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options

  const handleOptionChange = (idx, val) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const addOption = () => setOptions([...options, ""]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOpts = options.filter(o => o.trim() !== "");
    if (!question || validOpts.length < 2) return alert("Need question and at least 2 options.");

    // create_poll <comm> <sender> <q> <multi> <opt1>...
    const args = [commId, currentUserId, question, allowMulti ? "1" : "0", ...validOpts];
    await callBackend('create_poll', args);
    onRefresh();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-96 p-6">
        <h3 className="text-xl font-orbitron text-cyan-supernova mb-4">Create Poll</h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
            <input 
                className="w-full bg-deep-void p-2 rounded border border-white/20 text-white" 
                placeholder="Ask a question..."
                value={question} onChange={e => setQuestion(e.target.value)}
            />
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {options.map((opt, i) => (
                    <input 
                        key={i}
                        className="w-full bg-white/5 p-2 rounded border border-white/10 text-white text-sm"
                        placeholder={`Option ${i+1}`}
                        value={opt} onChange={e => handleOptionChange(i, e.target.value)}
                    />
                ))}
            </div>
            
            <button type="button" onClick={addOption} className="text-xs text-gray-400 hover:text-white">+ Add Option</button>

            <div className="flex items-center gap-2">
                <input type="checkbox" checked={allowMulti} onChange={e => setAllowMulti(e.target.checked)} />
                <label className="text-sm text-gray-300">Allow Multiple Answers</label>
            </div>

            <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-cyan-supernova text-black font-bold py-2 rounded">Create</button>
                <button type="button" onClick={onClose} className="flex-1 bg-gray-700 text-white py-2 rounded">Cancel</button>
            </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CreatePollModal;