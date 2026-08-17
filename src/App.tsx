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
    const faviconUrl = 'https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png';
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
    <div className="mesh-bg min-h-screen text-slate-800 flex flex-col font-sans selection:bg-[#b42907] selection:text-white print:min-h-0 print:bg-white print:p-0">
      {/* Sticky Top Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 print:p-0 print:m-0 print:max-w-none print:w-full print:pb-0">
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

        {/* Global Page Footer */}
        <footer className="mt-12 sm:mt-16 pt-6 pb-4 text-center border-t border-slate-200/60 print:hidden">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
            © 2026 PT. WBS. All rights reserved.
          </p>
        </footer>
      </main>

      {/* Floating Bottom Navigation Bar */}
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
