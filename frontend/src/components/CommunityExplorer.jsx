import React, { useState, useEffect } from 'react';
import { callBackend } from '../api';
import GlassCard from './GlassCard';
import TagSelector from './TagSelector';

const PRESET_TAGS = ["All", "Art", "Design", "Photography", "Music", "Literature", "Cinema"];

const CommunityExplorer = ({ currentUserId, onJoin }) => {
  const [communities, setCommunities] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCover, setNewCover] = useState("");
  const [newTags, setNewTags] = useState(["Art"]);

  const fetchComms = () => {
    callBackend('get_all_communities').then(data => {
      if (Array.isArray(data)) setCommunities(data);
    });
  };

  useEffect(() => { fetchComms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const tagsStr = newTags.join(',');
    // create_community <Name> <Desc> <Tags> <CreatorID> <CoverUrl>
    await callBackend('create_community', [newName, newDesc, tagsStr, currentUserId, newCover || "none"]);

    setShowCreate(false);
    // Reset Form
    setNewName(""); setNewDesc(""); setNewCover(""); setNewTags(["Gaming"]);
    fetchComms(); // Refresh list
  };

  // Filter Logic
  const filtered = communities.filter(c => {
    const matchesTag = filter === "All" || (c.tags && c.tags.includes(filter));
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end border-b border-museum-stone pb-6">
        <div>
          <h2 className="text-4xl font-serif text-museum-text">Explore Collections</h2>
          <p className="text-museum-muted mt-2">Discover new galleries and circles.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-museum-text text-white font-medium px-6 py-3 rounded-none hover:bg-black transition-all uppercase tracking-widest text-xs"
        >
          {showCreate ? "Cancel" : "Curate New Collection"}
        </button>
      </div>

      {/* Creation Form */}
      {showCreate && (
        <GlassCard className="animate-fade-in mb-8 border-museum-gold/50 shadow-md">
          <h3 className="text-2xl font-serif mb-6 text-museum-text">Initialize New Collection</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              placeholder="Collection Name"
              className="w-full bg-transparent border-b border-museum-stone p-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-muted"
              value={newName} onChange={e => setNewName(e.target.value)} required
            />
            <input
              placeholder="Description / Manifesto"
              className="w-full bg-transparent border-b border-museum-stone p-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-muted"
              value={newDesc} onChange={e => setNewDesc(e.target.value)} required
            />
            <input
              placeholder="Cover Image URL (Optional)"
              className="w-full bg-transparent border-b border-museum-stone p-3 text-museum-text focus:border-museum-text outline-none transition-colors placeholder-museum-muted"
              value={newCover} onChange={e => setNewCover(e.target.value)}
            />

            <div>
              <label className="text-xs text-museum-muted uppercase tracking-widest mb-2 block">Tags</label>
              <TagSelector selectedTags={newTags} setSelectedTags={setNewTags} />
            </div>

            <button type="submit" className="w-full bg-museum-gold text-white py-3 font-medium hover:bg-yellow-700 transition-colors mt-4 uppercase tracking-widest text-xs">
              PUBLISH
            </button>
          </form>
        </GlassCard>
      )}

      {/* Search & Tags */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input
          placeholder="Search collections..."
          className="flex-1 bg-white p-3 border border-museum-stone text-museum-text focus:border-museum-muted outline-none transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PRESET_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-4 py-2 text-xs uppercase tracking-wider border transition-all ${filter === tag ? 'bg-museum-text text-white border-museum-text' : 'bg-white text-museum-muted border-museum-stone hover:border-museum-muted'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 && !showCreate && (
        <div className="text-center text-museum-muted py-20 italic">
          No collections found. Be the first to curate one.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="group bg-white border border-museum-stone hover:shadow-lg transition-all duration-300 flex flex-col">
            {/* Cover Image Background */}
            <div className="h-48 bg-museum-stone relative overflow-hidden">
              {c.cover && c.cover !== "none" && c.cover !== "NULL" ? (
                <img src={c.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-museum-muted font-serif text-4xl bg-museum-stone/30">
                  {c.name[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-xl text-museum-text group-hover:text-museum-gold transition-colors">{c.name}</h3>
                <span className="text-xs text-museum-muted bg-museum-stone/30 px-2 py-1 rounded-full">{c.members} Patrons</span>
              </div>
              <p className="text-sm text-museum-muted line-clamp-2 mb-4 flex-1">{c.desc || c.description || "No description provided."}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {c.tags && (Array.isArray(c.tags) ? c.tags : c.tags.split(',')).slice(0, 3).map(t => (
                  <span key={t} className="text-[10px] text-museum-muted border border-museum-stone px-2 py-1 uppercase tracking-wider">{t}</span>
                ))}
              </div>

              <button
                onClick={() => onJoin(c.id)}
                className="w-full border border-museum-text text-museum-text py-3 hover:bg-museum-text hover:text-white transition-all uppercase text-xs tracking-widest font-medium"
              >
                View Collection
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityExplorer;