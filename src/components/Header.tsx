import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserSettingsModal } from './common/UserSettingsModal';
import {
  LogOut,
  Calendar,
  Settings,
  Camera,
  Key,
  ChevronDown,
  User,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings?: (tab: 'password' | 'photo') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    currentUser,
    selectedPeriod,
    setSelectedPeriod,
    logout,
  } = useApp();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click/touch outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const periods = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
  ];

  const getRoleLabel = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'admin':
        return 'Administrator';
      case 'head_coach':
        return 'Head Coach';
      case 'group_leader':
        return 'Group Leader';
      case 'subordinate':
        return 'Subordinat';
      default:
        return 'Karyawan';
    }
  };

  const getRoleBadgeStyle = () => {
    if (!currentUser) return 'bg-slate-100 text-slate-700';
    switch (currentUser.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'head_coach':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'group_leader':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'subordinate':
        return 'bg-orange-100 text-[#b42907] border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 print:hidden transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & MER Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
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
          <div className="flex items-center glass-input rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#00668a] mr-1 sm:mr-1.5 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs text-slate-800 font-bold focus:outline-none cursor-pointer pr-0.5"
              aria-label="Pilih Periode Laporan"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value} className="text-slate-800">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Current User Top Right Profile Icon & Menu Dropdown */}
          {currentUser && (
            <div className="relative inline-block text-left" ref={dropdownRef}>
              {/* Profile Avatar / Menu Trigger Button */}
              <button
                type="button"
                id="top-user-menu-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-1.5 sm:space-x-2 bg-slate-100 hover:bg-slate-200/90 active:scale-95 px-1.5 sm:px-2.5 py-1 rounded-full border transition-all cursor-pointer shadow-2xs ${
                  isDropdownOpen
                    ? 'border-[#b42907] ring-2 ring-[#b42907]/20 bg-slate-200/70'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
                title="Klik untuk membuka menu profil & logout"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar Icon */}
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#b42907] to-[#ff5e3a] text-white flex items-center justify-center font-extrabold text-xs overflow-hidden shrink-0 shadow-xs ring-1 ring-white">
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
                  {/* Status Indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* Name & Role (Hidden on small mobile screens to keep header compact) */}
                <div className="text-left text-xs hidden md:block pr-0.5">
                  <span className="font-extrabold text-slate-800 block leading-tight truncate max-w-[110px] lg:max-w-[140px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#00668a] font-semibold block leading-tight">
                    {getRoleLabel()}
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#b42907]' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Submenu */}
              {isDropdownOpen && (
                <div
                  id="user-profile-dropdown-menu"
                  className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 text-slate-800 p-3 animate-in fade-in zoom-in-95 duration-150 space-y-3"
                >
                  {/* Header Profile Summary Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#b42907] to-[#ff5e3a] text-white font-extrabold text-lg flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-white">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate leading-tight">
                        {currentUser.name}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="font-bold">NIK: {currentUser.nik}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeStyle()}`}
                        >
                          {getRoleLabel()}
                        </span>
                        {currentUser.department && (
                          <span className="text-[10px] font-semibold text-slate-500 truncate">
                            • {currentUser.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submenu Group: Pengaturan Akun */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 px-2 tracking-wider">
                      Pengaturan Akun
                    </span>

                    {currentUser.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (onOpenSettings) {
                            onOpenSettings('photo');
                          } else {
                            setSettingsTab('photo');
                            setShowSettingsModal(true);
                          }
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#00668a] hover:bg-slate-100 rounded-xl transition-all text-left cursor-pointer"
                      >
                        <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span>Ubah Foto Profil</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenSettings) {
                          onOpenSettings('password');
                        } else {
                          setSettingsTab('password');
                          setShowSettingsModal(true);
                        }
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#00668a] hover:bg-slate-100 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                        <Key className="w-4 h-4" />
                      </div>
                      <span>Ubah Password Akun</span>
                    </button>
                  </div>

                  {/* Prominent Red Logout Section */}
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      id="dropdown-logout-btn"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all text-left cursor-pointer shadow-xs"
                    >
                      <div className="p-1 bg-white/20 rounded-lg text-white">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="block leading-tight">Keluar dari Akun (Logout)</span>
                        <span className="text-[10px] text-rose-100 font-normal block leading-tight">
                          Akhiri sesi login di perangkat ini
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
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

