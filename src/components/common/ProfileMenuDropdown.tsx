import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Settings,
  Camera,
  Key,
  LogOut,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface ProfileMenuDropdownProps {
  onOpenSettings: (tab: 'photo' | 'password') => void;
  onOpenSwitchUser?: () => void;
  align?: 'left' | 'right';
  className?: string;
}

export const ProfileMenuDropdown: React.FC<ProfileMenuDropdownProps> = ({
  onOpenSettings,
  onOpenSwitchUser,
  align = 'right',
  className = '',
}) => {
  const { currentUser, employees, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Resolve Subordinate's Group Leader Name
  let assignedGLName: string | null = null;
  if (currentUser.role === 'subordinate') {
    if (currentUser.groupLeaderName) {
      assignedGLName = currentUser.groupLeaderName;
    } else if (currentUser.groupLeaderId) {
      const gl = employees.find(
        (e) => e.nik === currentUser.groupLeaderId || e.id === currentUser.groupLeaderId
      );
      assignedGLName = gl ? gl.name : currentUser.groupLeaderId;
    } else {
      assignedGLName = 'Ahmad Hidayat (Stockpile)';
    }
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button: Profil Saya */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all shadow-sm cursor-pointer"
        title="Menu Profil Saya & Pengaturan"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-blue-400/40">
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
        <span className="hidden sm:inline font-bold">Profil Saya</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Submenu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-800 p-3 animate-in fade-in zoom-in-95 duration-150 space-y-3`}
        >
          {/* Header Profile Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center overflow-hidden shrink-0 border border-blue-200 shadow-sm">
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
              <p className="font-extrabold text-sm text-slate-900 truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono mt-0.5">
                <span>NIK: {currentUser.nik}</span>
                <span>•</span>
                <span className="capitalize">{currentUser.role.replace('_', ' ')}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {currentUser.position}
              </p>

              {/* Group Leader Indicator for Subordinates */}
              {currentUser.role === 'subordinate' && assignedGLName && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center space-x-1.5 text-[11px] text-blue-700 font-medium bg-blue-50/80 px-2 py-1 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Group Leader: <strong className="font-bold">{assignedGLName}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submenu Group: Pengaturan Akun */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2 tracking-wider">
              Submenu Pengaturan
            </span>

            {currentUser.role !== 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings('photo');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <span>Ubah Foto Profil</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings('password');
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left cursor-pointer"
            >
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <Key className="w-3.5 h-3.5" />
              </div>
              <span>Ubah Password Akun</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-1 space-y-1">
            {onOpenSwitchUser && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSwitchUser();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-50 rounded-xl transition-all text-left cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Ganti Akun Demo / Switch</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
