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

  // Fetch Joined Communities & User Data
  useEffect(() => {
    if (!currentUserId) return;
    
    // 1. Sidebar Data (Joined Communities)
    callBackend('get_all_communities').then(all => {
       if(Array.isArray(all)) setJoinedCommunities(all);
    });

    // 2. My User Data (For Avatar/Name display)
    callBackend('get_user', [currentUserId]).then(data => {
        if(data && data.id) setCurrentUser(data);
    });
  }, [currentUserId, activeTab]);

  // View: Login Page (if not authenticated)
  if (!currentUserId) {
    return <LoginPage onLogin={(id) => setCurrentUserId(id)} />;
  }

  // View: Main App Layout
  return (
    <div className="flex min-h-screen bg-void-black bg-[url('/bg.jpg')] bg-cover bg-center text-white font-montserrat">
      {/* Background Dark Overlay */}
      <div className="fixed inset-0 bg-void-black/85 pointer-events-none z-0"></div>

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        joinedCommunities={joinedCommunities}
        onCommunityClick={(id) => setActiveTab(`comm_${id}`)}
        currentUserId={currentUserId}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 ml-20 md:ml-64 p-6 md:p-8 overflow-y-auto h-screen">
        
        {/* 1. DASHBOARD */}
        {activeTab === 'home' && (
            <HomeDashboard userId={currentUserId} onNavigate={setActiveTab} />
        )}

        {/* 2. FIND NEBULAS (Community Explorer) */}
        {activeTab === 'explore_comms' && (
           <div className="animate-fade-in">
             <CommunityExplorer 
                currentUserId={currentUserId} 
                onJoin={(id) => {
                    callBackend('join_community', [currentUserId, id]);
                    setActiveTab(`comm_${id}`);
                }} 
             />
           </div>
        )}

        {/* 3. FRIENDS PAGE */}
        {activeTab === 'explore_users' && (
            <div className="animate-fade-in">
                <FriendsPage currentUserId={currentUserId} onNavigate={setActiveTab} />
            </div>
        )}

        {/* 4. GALAXY MAP */}
        {activeTab === 'map' && (
           <div className="h-full animate-fade-in">
             <NetworkMap />
           </div>
        )}

        {/* 5. PROFILE VIEW */}
        {activeTab.startsWith('profile_') && (
            <ProfileView 
                targetId={activeTab.split('_')[1]} 
                currentUserId={currentUserId} 
            />
        )}

        {/* 6. COMMUNITY CHAT */}
        {/* Note: We check !activeTab.includes('about') to prevent Chat from showing when viewing About page */}
        {activeTab.startsWith('comm_') && !activeTab.includes('about') && (
            <CommunityChat 
               commId={activeTab.split('_')[1]} 
               currentUserId={currentUserId}
               onLeave={() => setActiveTab('explore_comms')}
               onAbout={() => setActiveTab(`comm_about_${activeTab.split('_')[1]}`)}
            />
        )}

        {/* 7. COMMUNITY ABOUT PAGE */}
        {activeTab.startsWith('comm_about_') && (
            <CommunityAbout 
               commId={activeTab.split('_')[2]} // Extract ID after 'comm_about_'
               currentUserId={currentUserId}
               onNavigate={setActiveTab}
            />
        )}

      </div>
    </div>
  );
}

export default App;