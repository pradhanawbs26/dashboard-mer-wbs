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

  let tabs: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [];

  if (role === 'subordinate') {
    tabs = [
      { id: 'report', label: 'Rapor MER', icon: FileText },
      { id: 'trends', label: 'Rapor YTD', icon: TrendingUp },
      { id: 'profile', label: 'Profil Saya', icon: UserCheck },
    ];
  } else if (role === 'group_leader' || role === 'head_coach') {
    tabs = [
      { id: 'team_dashboard', label: 'Ringkasan Tim', icon: Users },
      { id: 'ytd_report', label: 'Rapor YTD Tim', icon: TrendingUp },
      { id: 'profile', label: 'Profil Saya', icon: UserCheck },
    ];
  } else if (role === 'admin') {
    tabs = [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'master_data', label: 'Karyawan', icon: Database },
      { id: 'input_score', label: 'Input MER', icon: FileText },
      { id: 'print_report', label: 'Cetak Rapor', icon: Printer },
      { id: 'bulk_import', label: 'Upload Excel', icon: FileSpreadsheet },
      { id: 'config_engine', label: 'Kustomisasi', icon: Sliders },
    ];
  }

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl sm:max-w-3xl md:max-w-4xl rounded-full bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.09)] z-40 py-2 px-3 sm:px-6 print:hidden">
      <div className="flex items-center justify-around gap-1 sm:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3.5 rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'text-[#b42907] font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all ${
                  isActive ? 'bg-[#b42907]/15 text-[#b42907] scale-105 shadow-2xs' : ''
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs mt-0.5 font-bold whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
