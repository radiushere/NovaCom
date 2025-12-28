import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, joinedCommunities = [], onCommunityClick, currentUserId, currentUser }) => {

  const NavItem = ({ id, icon, label, onClick }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={onClick || (() => setActiveTab(id))}
        className={`w-full flex items-center px-6 py-4 transition-all duration-300 group ${isActive ? 'bg-museum-stone/30 text-museum-text' : 'text-museum-muted hover:text-museum-text hover:bg-museum-stone/10'}`}
      >
        <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className={`ml-4 font-sans text-sm font-medium tracking-wide hidden md:block ${isActive ? 'text-museum-text' : ''}`}>{label}</span>
        {isActive && <div className="ml-auto w-1 h-1 bg-museum-text hidden md:block"></div>}
      </button>
    );
  };

  return (
    <div className="w-20 md:w-64 bg-museum-surface border-r border-museum-stone flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300">

      {/* Logo */}
      <div className="h-24 flex items-center justify-center border-b border-museum-stone/50">
        <h1 className="hidden md:block font-serif text-2xl text-museum-text tracking-widest cursor-pointer" onClick={() => setActiveTab('home')}>MUSE</h1>
        <span className="md:hidden font-serif text-2xl text-museum-text">M</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1">
        <NavItem id="home" icon="🏛️" label="Gallery" />
        <NavItem id="inbox" icon="✉️" label="Correspondence" />
        <NavItem id="explore_comms" icon="🔭" label="Discover" />
        <NavItem id="explore_users" icon="👥" label="Patrons" />
        <NavItem id="notifications" icon="🔔" label="Notices" />
        <NavItem id="map" icon="🗺️" label="Cartography" />

        <div className="mt-8 px-6 mb-4">
          <p className="text-xs text-museum-muted font-serif italic tracking-wider hidden md:block">Collections</p>
        </div>

        {joinedCommunities.map(c => (
          <button key={c.id} onClick={() => onCommunityClick(c.id)} className={`w-full flex items-center px-6 py-3 transition-all group ${activeTab === `comm_${c.id}` ? 'text-museum-text' : 'text-museum-muted hover:text-museum-text'}`}>
            <div className="w-6 h-6 bg-museum-stone flex items-center justify-center text-[10px] font-serif border border-transparent group-hover:border-museum-muted transition-colors">
              {c.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="ml-4 font-sans text-sm hidden md:block truncate">{c.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-museum-stone/50">
        <button onClick={() => setActiveTab(`profile_${currentUserId}`)} className="flex items-center gap-3 w-full hover:bg-museum-stone/20 p-2 transition-colors text-left">
          <div className="w-10 h-10 bg-museum-stone overflow-hidden flex items-center justify-center text-museum-muted font-serif">
            {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt="me" /> : (currentUser?.name?.[0] || "U")}
          </div>
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-medium text-museum-text truncate">{currentUser?.name || "User"}</p>
            <p className="text-xs text-museum-muted">View Profile</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;