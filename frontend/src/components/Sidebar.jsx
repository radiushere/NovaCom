import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, joinedCommunities = [], onCommunityClick }) => {
  return (
    <div className="w-20 md:w-64 bg-void-black/90 border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-50 backdrop-blur-xl">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center border-b border-white/10">
        <h1 className="hidden md:block font-orbitron text-xl text-cyan-supernova drop-shadow-glow tracking-widest">
          NOVA
        </h1>
        <span className="md:hidden font-orbitron text-2xl text-cyan-supernova">N</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-2">
        
        {/* Home Button */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'home' ? 'border-cyan-supernova bg-cyan-supernova/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Dashboard</span>
        </button>

        {/* Explore Button */}
        <button 
          onClick={() => setActiveTab('explore')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'explore' ? 'border-cosmic-purple bg-cosmic-purple/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">🔭</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Explorer</span>
        </button>

        <div className="mt-6 px-6 mb-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider hidden md:block">My Nebulas</p>
        </div>

        {/* Joined Communities List */}
        {joinedCommunities.map(c => (
          <button 
            key={c.id}
            onClick={() => onCommunityClick(c.id)}
            className={`w-full flex items-center px-6 py-2 transition-all border-l-4 ${activeTab === `comm_${c.id}` ? 'border-green-400 bg-green-400/10 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-xs font-bold border border-white/20">
              {c.name.substring(0,2).toUpperCase()}
            </div>
            <span className="ml-4 font-montserrat text-sm hidden md:block truncate">{c.name}</span>
          </button>
        ))}

      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-supernova/20 border border-cyan-supernova"></div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white">Operator</p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;