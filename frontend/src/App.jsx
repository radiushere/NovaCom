import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FriendList from './components/FriendList';
import RecommendationList from './components/RecommendationList';
import UserSearch from './components/UserSearch';
import CommunityExplorer from './components/CommunityExplorer';
import CommunityChat from './components/CommunityChat';
import { callBackend } from './api';

function App() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'explore', 'comm_101'
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  
  // Refresh Joined List
  const fetchMyComms = async () => {
    // Ideally, backend should have "get_my_communities", but we can filter all for now
    // Or we rely on the Join click to update local state immediately
    // For this demo, let's assume 'get_all' and we filter in frontend or just show all for nav demo
    // A proper get_my_communities <id> is better, but let's stick to what we built:
    const all = await callBackend('get_all_communities');
    if(Array.isArray(all)) {
        // Since we didn't make get_my_communities, we show ALL in sidebar for this Phase demo
        // Or you can update C++ to add "get_my_communities"
        setJoinedCommunities(all.filter(c => c.members > 0)); // Hack for demo: show active ones
    }
  };

  useEffect(() => { fetchMyComms(); }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-void-black bg-[url('/bg.jpg')] bg-cover bg-center text-white font-montserrat">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-void-black/85 pointer-events-none z-0"></div>

      {/* Sidebar (Fixed Left) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        joinedCommunities={joinedCommunities}
        onCommunityClick={(id) => setActiveTab(`comm_${id}`)}
      />

      {/* Main Content Area (Pushed Right) */}
      <div className="relative z-10 flex-1 ml-20 md:ml-64 p-6 md:p-8 overflow-y-auto h-screen">
        
        {/* VIEW: DASHBOARD */}
        {activeTab === 'home' && (
           <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
              <header className="flex justify-between items-center">
                 <div>
                    <h1 className="text-4xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-supernova to-cosmic-purple">DASHBOARD</h1>
                    <p className="text-gray-400">Welcome back, Operator.</p>
                 </div>
                 {/* User Switcher */}
                 <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                    <span className="text-xs text-gray-400">ID:</span>
                    <input type="number" value={currentUserId} onChange={e=>setCurrentUserId(e.target.value)} className="w-10 bg-transparent text-white font-bold text-center outline-none"/>
                 </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-6">
                    <UserSearch currentUserId={currentUserId} />
                    <FriendList userId={currentUserId} />
                 </div>
                 <div>
                    <RecommendationList userId={currentUserId} />
                 </div>
              </div>
           </div>
        )}

        {/* VIEW: EXPLORER */}
        {activeTab === 'explore' && (
           <div className="max-w-6xl mx-auto animate-fade-in">
             <CommunityExplorer 
                currentUserId={currentUserId} 
                onJoin={(id) => {
                    callBackend('join_community', [currentUserId, id]);
                    setActiveTab(`comm_${id}`);
                }} 
             />
           </div>
        )}

        {/* VIEW: SPECIFIC COMMUNITY */}
        {activeTab.startsWith('comm_') && (
            <div className="h-full animate-fade-in">
               <CommunityChat 
                  commId={activeTab.split('_')[1]} 
                  currentUserId={currentUserId}
                  onLeave={() => setActiveTab('explore')}
               />
            </div>
        )}

      </div>
    </div>
  );
}

export default App;