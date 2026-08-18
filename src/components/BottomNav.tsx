import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Sliders,
  FileSpreadsheet,
  Database,
  UserCheck,
  Printer,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const role = currentUser.role;

  let tabs: {
    id: string;
    label: string;
    shortLabel?: string;
    icon: React.FC<{ className?: string }>;
  }[] = [];

  if (role === 'subordinate') {
    tabs = [
      { id: 'report', label: 'Rapor MER', shortLabel: 'Rapor', icon: FileText },
      { id: 'trends', label: 'Rapor YTD', shortLabel: 'YTD', icon: TrendingUp },
      { id: 'profile', label: 'Profil Saya', shortLabel: 'Profil', icon: UserCheck },
    ];
  } else if (role === 'group_leader' || role === 'head_coach') {
    tabs = [
      { id: 'team_dashboard', label: 'Ringkasan Tim', shortLabel: 'Tim', icon: Users },
      { id: 'ytd_report', label: 'Rapor YTD Tim', shortLabel: 'YTD', icon: TrendingUp },
      { id: 'print_report', label: 'Cetak Rapor', shortLabel: 'Cetak', icon: Printer },
      { id: 'profile', label: 'Profil Saya', shortLabel: 'Profil', icon: UserCheck },
    ];
  } else if (role === 'admin') {
    tabs = [
      { id: 'analytics', label: 'Analytics', shortLabel: 'Analytics', icon: BarChart3 },
      { id: 'master_data', label: 'Karyawan', shortLabel: 'Karyawan', icon: Database },
      { id: 'input_score', label: 'Input MER', shortLabel: 'Input', icon: FileText },
      { id: 'print_report', label: 'Cetak Rapor', shortLabel: 'Cetak', icon: Printer },
      { id: 'bulk_import', label: 'Upload Excel', shortLabel: 'Import', icon: FileSpreadsheet },
      { id: 'config_engine', label: 'Kustomisasi', shortLabel: 'Kustom', icon: Sliders },
    ];
  }

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 w-[96%] max-w-[420px] sm:max-w-2xl md:max-w-3xl rounded-3xl sm:rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] z-40 p-1 sm:px-4 sm:py-2 print:hidden overflow-hidden">
      <div className="flex items-center justify-between sm:justify-around gap-0.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[50px] sm:min-w-0 flex flex-col items-center justify-center py-1 px-1 sm:px-2.5 rounded-2xl sm:rounded-full transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-[#b42907] font-extrabold bg-[#b42907]/10 sm:bg-transparent'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-full transition-all ${
                  isActive ? 'bg-[#b42907]/15 text-[#b42907] scale-105 shadow-2xs' : ''
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9.5px] sm:text-xs mt-0.5 font-bold tracking-tight text-center leading-tight">
                <span className="inline sm:hidden">{tab.shortLabel || tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
