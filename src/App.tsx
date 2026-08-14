import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SubordinateView } from './components/subordinate/SubordinateView';
import { GroupLeaderView } from './components/groupLeader/GroupLeaderView';
import { HeadCoachView } from './components/headCoach/HeadCoachView';
import { AdminView } from './components/admin/AdminView';
import { LoginModal } from './components/LoginModal';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<string>('report');

  // Set favicon and title dynamically
  useEffect(() => {
    const faviconUrl = 'https://res.cloudinary.com/dgjnlxf69/image/upload/v1786444304/Logo_MER_u8qeow.png';
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach((el) => el.setAttribute('href', faviconUrl));
    
    if (existingIcons.length === 0) {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/png';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  }, []);

  // Adjust default tab when currentUser role changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'subordinate') {
      setActiveTab('report');
    } else if (currentUser.role === 'group_leader' || currentUser.role === 'head_coach') {
      setActiveTab('team_dashboard');
    } else if (currentUser.role === 'admin') {
      setActiveTab('analytics');
    }
  }, [currentUser?.role]);

  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {currentUser.role === 'subordinate' && (
          <SubordinateView activeTab={activeTab} />
        )}

        {currentUser.role === 'group_leader' && (
          <GroupLeaderView activeTab={activeTab} />
        )}

        {currentUser.role === 'head_coach' && (
          <HeadCoachView activeTab={activeTab} />
        )}

        {currentUser.role === 'admin' && (
          <AdminView activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
