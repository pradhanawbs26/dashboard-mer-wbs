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
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 print:hidden transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & MER Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#b42907] via-[#00668a] to-[#7b41b4] p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img
              src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786941816/Logo_MER_02_wmtlnu.png"
              alt="Logo MER"
              className="w-full h-full object-contain bg-white rounded-full p-0.5"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-headline-lg font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 leading-none">
              MER Online
            </span>
            <p className="font-label-caps text-[8px] sm:text-[9.5px] text-slate-500 font-bold uppercase tracking-wider leading-tight mt-0.5">
              PT. WAHANA BARA SENTOSA
            </p>
          </div>
        </div>

        {/* Right Section / Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Period Dropdown */}
          <div className="flex items-center glass-input rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#00668a] mr-1 sm:mr-1.5 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
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
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="flex items-center space-x-2 bg-slate-100/90 px-1.5 sm:px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#b42907] to-[#ff5e3a] text-white flex items-center justify-center font-bold text-[11px] sm:text-xs overflow-hidden shrink-0 shadow-2xs">
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
                <div className="text-left text-xs hidden md:block pr-1">
                  <span className="font-extrabold text-slate-800 block leading-tight truncate max-w-[120px] lg:max-w-[150px]">
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
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full glass-button text-slate-600 hover:text-[#00668a] flex items-center justify-center transition-colors cursor-pointer"
                title="Pengaturan Akun"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={logout}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full glass-button text-slate-600 hover:text-[#b42907] flex items-center justify-center transition-colors cursor-pointer"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
