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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <GlassCard className="w-96 p-8 shadow-2xl border border-museum-stone">
        <h3 className="text-2xl font-serif text-museum-text mb-6 text-center">New Poll</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full bg-museum-bg p-3 rounded-none border-b border-museum-stone text-museum-text placeholder-museum-muted focus:border-museum-text outline-none transition"
            placeholder="Ask a question..."
            value={question} onChange={e => setQuestion(e.target.value)}
          />

          <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
            {options.map((opt, i) => (
              <input
                key={i}
                className="w-full bg-white p-2 rounded-none border border-museum-stone text-museum-text text-sm focus:border-museum-text outline-none transition"
                placeholder={`Option ${i + 1}`}
                value={opt} onChange={e => handleOptionChange(i, e.target.value)}
              />
            ))}
          </div>

          <button type="button" onClick={addOption} className="text-xs text-museum-muted hover:text-museum-text uppercase tracking-widest border-b border-transparent hover:border-museum-text transition-all">+ Add Option</button>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={allowMulti} onChange={e => setAllowMulti(e.target.checked)} className="accent-museum-text" />
            <label className="text-sm text-museum-text">Allow Multiple Answers</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-white border border-museum-stone text-museum-text py-2 hover:bg-museum-bg transition uppercase tracking-widest text-xs">Cancel</button>
            <button type="submit" className="flex-1 bg-museum-text text-white font-medium py-2 hover:bg-black transition uppercase tracking-widest text-xs shadow-sm">Create</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default CreatePollModal;