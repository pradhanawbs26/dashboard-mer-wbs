import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserSettingsModal } from './common/UserSettingsModal';
import {
  LogOut,
  Calendar,
  Settings,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    selectedPeriod,
    setSelectedPeriod,
    logout,
  } = useApp();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');

  const periods = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
  ];

  return (
    <header className="bg-[#1e293b] text-white border-b border-slate-700 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Industrial Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-sm border border-slate-600/60 overflow-hidden shrink-0">
              <img
                src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
                alt="Logo MER"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  MER <span className="text-blue-400">Online</span>
                </span>
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium hidden sm:block">
                PT. Wahana Bara Sentosa
              </p>
            </div>
          </div>

          {/* Period Selector & Quick Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Period Dropdown */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs sm:text-sm text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.value} value={p.value} className="bg-slate-900 text-slate-200">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current User & Actions */}
            {currentUser && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-blue-400/30">
                    {currentUser.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="text-left text-xs hidden sm:block">
                    <span className="font-bold text-slate-100 block leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono block leading-tight">
                      {currentUser.role === 'admin'
                        ? 'Admin'
                        : currentUser.role === 'head_coach'
                        ? 'Head Coach'
                        : currentUser.role === 'group_leader'
                        ? 'Group Leader'
                        : `NIK: ${currentUser.nik}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSettingsTab('password');
                    setShowSettingsModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Pengaturan Akun"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Keluar dari Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Settings Modal (Photo & Password) */}
      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab={settingsTab}
      />
    </header>
  );
};
