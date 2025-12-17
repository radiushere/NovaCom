import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, joinedCommunities = [], onCommunityClick, currentUserId, currentUser }) => {
  return (
    <div className="w-20 md:w-64 bg-void-black/90 border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-50 backdrop-blur-xl">
      
      {/* 1. LOGO AREA */}
      <div className="h-20 flex items-center justify-center border-b border-white/10">
        <h1 
          className="hidden md:block font-orbitron text-xl text-cyan-supernova drop-shadow-glow tracking-widest cursor-pointer" 
          onClick={() => setActiveTab('home')}
        >
          NOVA
        </h1>
        <span className="md:hidden font-orbitron text-2xl text-cyan-supernova">N</span>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-2">
        
        {/* Dashboard */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'home' ? 'border-cyan-supernova bg-cyan-supernova/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Dashboard</span>
        </button>

        {/* Find Nebulas (Community Explorer) */}
        <button 
          onClick={() => setActiveTab('explore_comms')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'explore_comms' ? 'border-cosmic-purple bg-cosmic-purple/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">🔭</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Find Nebulas</span>
        </button>

        {/* Friends / Signals (User Explorer) */}
        <button 
          onClick={() => setActiveTab('explore_users')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'explore_users' ? 'border-green-400 bg-green-400/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">📡</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Friends</span>
        </button>

        {/* Galaxy Map */}
        <button 
          onClick={() => setActiveTab('map')}
          className={`w-full flex items-center px-6 py-3 transition-all border-l-4 ${activeTab === 'map' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <span className="text-xl">🌌</span>
          <span className="ml-4 font-montserrat font-bold hidden md:block">Galaxy Map</span>
        </button>

        {/* 3. JOINED COMMUNITIES SECTION */}
        <div className="mt-6 px-6 mb-2 border-t border-white/10 pt-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider hidden md:block">Joined Nebulas</p>
        </div>

        {joinedCommunities.map(c => (
          <button 
            key={c.id}
            onClick={() => onCommunityClick(c.id)}
            className={`w-full flex items-center px-6 py-2 transition-all border-l-4 ${activeTab === `comm_${c.id}` ? 'border-cyan-supernova bg-cyan-supernova/5 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
          >
            <div className="w-8 h-8 rounded-full bg-deep-void flex items-center justify-center text-xs font-bold border border-white/20 flex-shrink-0">
              {c.name.substring(0,2).toUpperCase()}
            </div>
            <span className="ml-4 font-montserrat text-sm hidden md:block truncate">{c.name}</span>
          </button>
        ))}
      </nav>

      {/* 4. USER PROFILE FOOTER */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={() => setActiveTab(`profile_${currentUserId}`)}
          className="flex items-center gap-3 w-full hover:bg-white/5 p-2 rounded transition text-left"
        >
          {/* Avatar Area */}
          <div className="w-10 h-10 rounded-full bg-cyan-supernova/20 border border-cyan-supernova overflow-hidden flex items-center justify-center text-cyan-supernova font-bold flex-shrink-0">
             {currentUser?.avatar ? (
                 <img src={currentUser.avatar} className="w-full h-full object-cover" alt="me" />
             ) : (
                 // Fallback to first letter of name or ID if name is missing
                 (currentUser?.name?.[0] || currentUserId)
             )}
          </div>
          
          {/* Text Area */}
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-bold text-white truncate">
                {currentUser?.name || "User " + currentUserId}
            </p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;