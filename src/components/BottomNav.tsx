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
    <div className="fixed bottom-0 inset-x-0 bg-[#1e293b]/95 backdrop-blur-md border-t border-slate-700 z-30 shadow-lg print:hidden">
      <div className="max-w-3xl sm:max-w-4xl md:max-w-5xl mx-auto flex items-center justify-around py-2 px-2 sm:px-6 gap-1 sm:gap-3 md:gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-blue-600/20 text-blue-400 scale-105' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] sm:text-xs mt-1 font-medium whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
