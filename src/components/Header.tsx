import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserSettingsModal } from './common/UserSettingsModal';
import {
  LogOut,
  Calendar,
  Settings,
  Sparkles,
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
    <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl rounded-full border border-white/80 bg-white/85 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] z-40 px-4 sm:px-6 py-2.5 print:hidden">
      <div className="flex items-center justify-between">
        {/* Brand & MER Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b42907] via-[#00668a] to-[#7b41b4] p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img
              src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
              alt="Logo MER"
              className="w-full h-full object-contain bg-white rounded-full p-0.5"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-headline-lg font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
              MER Online
            </span>
            <p className="font-label-caps text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-tight mt-1">
              PT. WAHANA BARA SENTOSA
            </p>
          </div>
        </div>

        {/* Center / Period Selector */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Period Dropdown */}
          <div className="flex items-center glass-input rounded-full px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#00668a] mr-1.5 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value} className="text-slate-800">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current User Profile Pill & Actions */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="flex items-center space-x-2 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#b42907] to-[#ff5e3a] text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 shadow-2xs">
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
                <div className="text-left text-xs hidden lg:block pr-1">
                  <span className="font-extrabold text-slate-800 block leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#00668a] font-semibold block leading-tight">
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
                className="w-8 h-8 rounded-full glass-button text-slate-600 hover:text-[#00668a] flex items-center justify-center transition-colors cursor-pointer"
                title="Pengaturan Akun"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="w-8 h-8 rounded-full glass-button text-slate-600 hover:text-[#b42907] flex items-center justify-center transition-colors cursor-pointer"
                title="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
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
