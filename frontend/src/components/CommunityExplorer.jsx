import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';

const PRESET_TAGS = ["All", "Gaming", "Anime", "Tech", "Music", "Space", "Random"];

const CommunityExplorer = ({ currentUserId, onJoin }) => {
  const [communities, setCommunities] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");

  const fetchComms = () => {
    callBackend('get_all_communities').then(data => {
      if(Array.isArray(data)) setCommunities(data);
    });
  };

  useEffect(() => { fetchComms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await callBackend('create_community', [newName, newDesc, newTags]);
    setShowCreate(false);
    fetchComms(); // Refresh
  };

  // Filter Logic
  const filtered = communities.filter(c => {
    const matchesTag = filter === "All" || c.tags.includes(filter);
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-orbitron text-white">Explore Galaxies</h2>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-cyan-supernova text-black font-bold px-4 py-2 rounded hover:scale-105 transition"
        >
          + Create New
        </button>
      </div>

      {/* Creation Form */}
      {showCreate && (
        <GlassCard className="animate-fade-in mb-6 border-cyan-supernova/50">
          <h3 className="text-xl font-bold mb-4">Initialize New Sector</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input placeholder="Community Name" className="w-full bg-deep-void p-3 rounded border border-white/10 text-white" value={newName} onChange={e=>setNewName(e.target.value)} required />
            <input placeholder="Description" className="w-full bg-deep-void p-3 rounded border border-white/10 text-white" value={newDesc} onChange={e=>setNewDesc(e.target.value)} required />
            <input placeholder="Tags (e.g. Gaming,Tech)" className="w-full bg-deep-void p-3 rounded border border-white/10 text-white" value={newTags} onChange={e=>setNewTags(e.target.value)} required />
            <button type="submit" className="w-full bg-green-500 text-black font-bold py-2 rounded">Launch</button>
          </form>
        </GlassCard>
      )}

      {/* Search & Tags */}
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          placeholder="Search frequencies..." 
          className="flex-1 bg-deep-void p-3 rounded-lg border border-white/10 text-white focus:border-cyan-supernova outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PRESET_TAGS.map(tag => (
            <button 
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filter === tag ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <GlassCard key={c.id} className="hover:border-cyan-supernova/50 transition group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-supernova to-cosmic-purple"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-deep-void flex items-center justify-center text-xl font-bold border border-white/10">
                {c.name.substring(0,1)}
              </div>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">{c.members} Members</span>
            </div>
            <h3 className="font-orbitron text-xl text-white group-hover:text-cyan-supernova transition">{c.name}</h3>
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{c.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.tags.map(t => (
                <span key={t} className="text-xs text-cyan-supernova bg-cyan-supernova/10 px-2 py-0.5 rounded border border-cyan-supernova/20">#{t}</span>
              ))}
            </div>
            <button 
              onClick={() => onJoin(c.id)}
              className="w-full mt-4 bg-white/5 hover:bg-white/20 border border-white/10 text-white py-2 rounded font-bold transition"
            >
              Tune In
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default CommunityExplorer;