import { useState, useEffect } from 'react';
import Notifications from './components/Notifications';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import CommunityExplorer from './components/CommunityExplorer';
import CommunityChat from './components/CommunityChat';
import CommunityAbout from './components/CommunityAbout';
import FriendsPage from './components/FriendsPage';
import ProfileView from './components/ProfileView';
import HomeDashboard from './components/HomeDashboard';
import NetworkMap from './components/NetworkMap';
import Inbox from './components/Inbox';
import DirectChat from './components/DirectChat';
import GlobalNavigator from './components/GlobalNavigator';
import { callBackend } from './api';

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [returnPath, setReturnPath] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Joined Communities & User Data
  useEffect(() => {
    if (!currentUserId) return;

    // FIX: Instead of 'get_all_communities', we use 'get_my_communities'
    callBackend('get_my_communities', [currentUserId]).then(data => {
      if (Array.isArray(data)) {
        setJoinedCommunities(data);
      }
    });

    callBackend('get_user', [currentUserId]).then(data => {
      if (data && data.id) setCurrentUser(data);
    });
  }, [currentUserId, activeTab]); // Fetches whenever you switch tabs or login

  // --- C++ NAVIGATION ENGINE INTEGRATION ---
  const handleNavigate = async (tab, isHistoryAction = false) => {
    setReturnPath(null);
    if (!isHistoryAction) {
      await callBackend('nav_push', [currentUserId, tab]);
    }
    setActiveTab(tab);
  };

  const undo = async () => {
    setLoading(true);
    const res = await callBackend('nav_back', [currentUserId]);
    if (res?.tab) await handleNavigate(res.tab, true);
    setLoading(false);
  };

  const redo = async () => {
    setLoading(true);
    const res = await callBackend('nav_forward', [currentUserId]);
    if (res?.tab) await handleNavigate(res.tab, true);
    setLoading(false);
  };

  // NEW: Logout Function
  const handleLogout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    setActiveTab('home');
  };

  if (!currentUserId) {
    return <LoginPage onLogin={(id) => setCurrentUserId(id)} />;
  }

  return (
    <div className="flex min-h-screen bg-museum-bg text-museum-text font-sans">
      {/* Clean background, no overlay needed */}

      <GlobalNavigator onBack={undo} onForward={redo} loading={loading} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        joinedCommunities={joinedCommunities}
        onCommunityClick={(id) => handleNavigate(`comm_${id}`)}
        currentUserId={currentUserId}
        currentUser={currentUser}
      />

      <div className="relative z-10 flex-1 ml-20 md:ml-64 p-6 md:p-8 overflow-y-auto h-screen">

        {activeTab === 'home' && <HomeDashboard userId={currentUserId} onNavigate={handleNavigate} />}

        {activeTab === 'inbox' && <Inbox currentUserId={currentUserId} onNavigate={handleNavigate} />}

        {activeTab === 'explore_comms' && <div className="animate-fade-in"><CommunityExplorer currentUserId={currentUserId} onJoin={(id) => { callBackend('join_community', [currentUserId, id]); handleNavigate(`comm_${id}`); }} /></div>}

        {activeTab === 'explore_users' && <div className="animate-fade-in"><FriendsPage currentUserId={currentUserId} onNavigate={handleNavigate} /></div>}

        {activeTab === 'map' && <div className="h-full animate-fade-in"><NetworkMap /></div>}

        {/* UPDATED: Pass onLogout to ProfileView */}
        {activeTab.startsWith('profile_') && (
          <ProfileView
            targetId={activeTab.split('_')[1]}
            currentUserId={currentUserId}
            returnPath={returnPath}
            onBack={() => { setActiveTab(returnPath); setReturnPath(null); }}
            onNavigate={handleNavigate}
            onLogout={handleLogout} // <--- PASSED HERE
          />
        )}
        {/* VIEW: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="animate-fade-in">
            <Notifications currentUserId={currentUserId} />
          </div>
        )}

        {activeTab.startsWith('dm_') && (
          <DirectChat
            currentUserId={currentUserId}
            friendId={activeTab.split('_')[1]}
            friendName={activeTab.split('_')[2]}
            onBack={() => handleNavigate('inbox')}
          />
        )}

        {activeTab.startsWith('comm_') && !activeTab.includes('about') && <CommunityChat commId={activeTab.split('_')[1]} currentUserId={currentUserId} onLeave={() => handleNavigate('explore_comms')} onAbout={() => handleNavigate(`comm_about_${activeTab.split('_')[1]}`)} />}

        {activeTab.startsWith('comm_about_') && <CommunityAbout commId={activeTab.split('_')[2]} currentUserId={currentUserId} onNavigate={handleNavigate} onViewUserProfile={(userId) => { setReturnPath(activeTab); setActiveTab(`profile_${userId}`); }} />}
      </div>
    </div>
  );
}

export default App;