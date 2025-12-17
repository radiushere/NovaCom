import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import CommunityExplorer from './components/CommunityExplorer';
import CommunityChat from './components/CommunityChat';
import CommunityAbout from './components/CommunityAbout';
import FriendsPage from './components/FriendsPage';
import ProfileView from './components/ProfileView';
import HomeDashboard from './components/HomeDashboard';
import NetworkMap from './components/NetworkMap';
import { callBackend } from './api';

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  
  // NEW: Stores the path to go back to (e.g., if viewing profile from About page)
  const [returnPath, setReturnPath] = useState(null);

  // Fetch Joined Communities & User Data
  useEffect(() => {
    if (!currentUserId) return;
    
    callBackend('get_all_communities').then(all => {
       if(Array.isArray(all)) setJoinedCommunities(all);
    });

    callBackend('get_user', [currentUserId]).then(data => {
        if(data && data.id) setCurrentUser(data);
    });
  }, [currentUserId, activeTab]);

  // Helper to handle navigation changes and clear return path if navigating normally
  const handleNavigate = (tab) => {
      setReturnPath(null); // Clear history on normal navigation
      setActiveTab(tab);
  };

  if (!currentUserId) {
    return <LoginPage onLogin={(id) => setCurrentUserId(id)} />;
  }

  return (
    <div className="flex min-h-screen bg-void-black bg-[url('/bg.jpg')] bg-cover bg-center text-white font-montserrat">
      <div className="fixed inset-0 bg-void-black/85 pointer-events-none z-0"></div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavigate} 
        joinedCommunities={joinedCommunities}
        onCommunityClick={(id) => handleNavigate(`comm_${id}`)}
        currentUserId={currentUserId}
        currentUser={currentUser}
      />

      <div className="relative z-10 flex-1 ml-20 md:ml-64 p-6 md:p-8 overflow-y-auto h-screen">
        
        {activeTab === 'home' && (
            <HomeDashboard userId={currentUserId} onNavigate={handleNavigate} />
        )}

        {activeTab === 'explore_comms' && (
           <div className="animate-fade-in">
             <CommunityExplorer 
                currentUserId={currentUserId} 
                onJoin={(id) => {
                    callBackend('join_community', [currentUserId, id]);
                    handleNavigate(`comm_${id}`);
                }} 
             />
           </div>
        )}

        {activeTab === 'explore_users' && (
            <div className="animate-fade-in">
                <FriendsPage currentUserId={currentUserId} onNavigate={handleNavigate} />
            </div>
        )}

        {activeTab === 'map' && (
           <div className="h-full animate-fade-in">
             <NetworkMap />
           </div>
        )}

        {/* PROFILE VIEW (With Back Button Logic) */}
        {activeTab.startsWith('profile_') && (
            <ProfileView 
                targetId={activeTab.split('_')[1]} 
                currentUserId={currentUserId} 
                returnPath={returnPath} // Pass the history
                onBack={() => {
                    setActiveTab(returnPath);
                    setReturnPath(null);
                }}
            />
        )}

        {/* COMMUNITY CHAT */}
        {activeTab.startsWith('comm_') && !activeTab.includes('about') && (
            <CommunityChat 
               commId={activeTab.split('_')[1]} 
               currentUserId={currentUserId}
               onLeave={() => handleNavigate('explore_comms')}
               onAbout={() => handleNavigate(`comm_about_${activeTab.split('_')[1]}`)}
            />
        )}

        {/* COMMUNITY ABOUT PAGE */}
        {activeTab.startsWith('comm_about_') && (
            <CommunityAbout 
               commId={activeTab.split('_')[2]} 
               currentUserId={currentUserId}
               onNavigate={handleNavigate}
               // Special handler: When clicking a user here, remember to come back here
               onViewUserProfile={(userId) => {
                   setReturnPath(activeTab); // Save current "About" page as return path
                   setActiveTab(`profile_${userId}`);
               }}
            />
        )}

      </div>
    </div>
  );
}

export default App;