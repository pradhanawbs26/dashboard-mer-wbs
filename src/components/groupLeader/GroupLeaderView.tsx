import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSettingsModal } from '../common/UserSettingsModal';
import { ProfileMenuDropdown } from '../common/ProfileMenuDropdown';
import { YtdParameterTable } from '../common/YtdParameterTable';
import {
  getScoreCategoryBadge,
  formatPeriodLabel,
  getParameterIndicatorDetails,
} from '../../utils/calculations';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  HardHat,
  ChevronRight,
  BarChart2,
  FileText,
  UserCheck,
  CheckCircle,
  Settings,
  ChevronDown,
  X,
  Check,
  Database,
  Layers,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface GroupLeaderViewProps {
  activeTab?: string;
}

export const GroupLeaderView: React.FC<GroupLeaderViewProps> = ({ activeTab = 'team_dashboard' }) => {
  const {
    currentUser,
    employees,
    reports,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMemberNik, setSelectedMemberNik] = useState<string | null>(null);
  const [memberModalTab, setMemberModalTab] = useState<'period' | 'ytd'>('ytd');
  const [selectedYtdNik, setSelectedYtdNik] = useState<string>('');
  const [ytdSearchQuery, setYtdSearchQuery] = useState<string>('');
  const [isYtdDropdownOpen, setIsYtdDropdownOpen] = useState<boolean>(false);
  const ytdDropdownRef = useRef<HTMLDivElement>(null);
  const ytdSearchInputRef = useRef<HTMLInputElement>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');

  // Close YTD dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ytdDropdownRef.current && !ytdDropdownRef.current.contains(event.target as Node)) {
        setIsYtdDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus YTD search input when opened
  useEffect(() => {
    if (isYtdDropdownOpen) {
      setTimeout(() => {
        ytdSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isYtdDropdownOpen]);

  if (!currentUser) return null;

  // Resolve assigned Head Coach for this Group Leader
  const assignedHeadCoach = employees.find(
    (e) =>
      (currentUser.groupLeaderId &&
        (e.nik === currentUser.groupLeaderId || e.id === currentUser.groupLeaderId)) ||
      e.role === 'head_coach'
  );
  const headCoachName = assignedHeadCoach ? assignedHeadCoach.name : 'Dharmawan Kustanto';

  // Subordinates under this GL or Head Coach
  const mySubordinates =
    currentUser.role === 'head_coach'
      ? employees.filter((e) => e.role === 'subordinate' || e.role === 'group_leader')
      : employees.filter(
          (e) => e.groupLeaderId === currentUser.nik || e.groupLeaderName === currentUser.name
        );

  // Filtered subordinates for YTD dropdown
  const filteredYtdSubordinates = useMemo(() => {
    if (!ytdSearchQuery.trim()) return mySubordinates;
    const q = ytdSearchQuery.toLowerCase().trim();
    return mySubordinates.filter(
      (sub) =>
        sub.name.toLowerCase().includes(q) ||
        sub.nik.toLowerCase().includes(q) ||
        (sub.department || '').toLowerCase().includes(q) ||
        (sub.equipmentType || '').toLowerCase().includes(q)
    );
  }, [mySubordinates, ytdSearchQuery]);

  // Active YTD employee (directly to subordinates)
  const activeYtdEmployee =
    mySubordinates.find((e) => e.nik === selectedYtdNik) || mySubordinates[0] || currentUser;

  // Reports for subordinates in selected period
  const teamReports = mySubordinates.map((sub) => {
    const rep = reports.find(
      (r) => r.nik === sub.nik && r.period === selectedPeriod
    );
    return {
      employee: sub,
      report: rep,
      finalScore: rep ? rep.finalScore : 0,
    };
  });

  // Calculate team stats
  const validReports = teamReports.filter((tr) => tr.report !== undefined);
  const totalMembers = mySubordinates.length;
  const teamAvgScore =
    validReports.length > 0
      ? (
          validReports.reduce((acc, tr) => acc + tr.finalScore, 0) /
          validReports.length
        ).toFixed(2)
      : '0.00';

  // Sort team members by MER score descending
  const sortedTeam = [...teamReports].sort(
    (a, b) => b.finalScore - a.finalScore
  );

  const topPerformer = sortedTeam[0]?.finalScore > 0 ? sortedTeam[0] : null;
  const needsCoachingList = sortedTeam.filter(
    (st) => st.report && st.finalScore < 2.5
  );

  // Filtered list by search & category
  const filteredTeam = sortedTeam.filter((item) => {
    const matchesSearch =
      item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.nik.includes(searchTerm) ||
      (item.employee.equipmentType &&
        item.employee.equipmentType
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || item.employee.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Chart data for team comparison
  const chartData = sortedTeam.map((item) => ({
    name: item.employee.name.split(' ')[0],
    score: item.finalScore,
    category: item.employee.category,
  }));

  // Selected member detail
  const memberDetailObj = selectedMemberNik
    ? teamReports.find((tr) => tr.employee.nik === selectedMemberNik)
    : null;

  return (
    <div className="space-y-6 pb-20">
      {/* GL Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
            {/* Avatar / Photo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 overflow-hidden border-2 border-blue-100">
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

            {/* Symmetrical Profile Details Grid */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {currentUser.position || `Group Leader - Area ${currentUser.department}`}
                </p>
              </div>

              {/* Symmetrical Key-Value Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">NIK:</span>
                  <span className="font-bold text-slate-800 font-mono truncate">{currentUser.nik}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Area:</span>
                  <span className="font-bold text-slate-800 truncate">{currentUser.department}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Head Coach:</span>
                  <span className="font-bold text-slate-800 truncate">{headCoachName}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Subordinat:</span>
                  <span className="font-bold text-slate-800 truncate">{mySubordinates.length} Anggota</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Rata-rata MER Tim
              </span>
              <span className="text-2xl font-black text-blue-600">
                {teamAvgScore}{' '}
                <span className="text-xs text-slate-500 font-normal">/ 4.00</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab={settingsTab}
      />

      {/* Tab: Profil Saya */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-blue-600">
              Profil & Informasi Group Leader
            </h3>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              title="Pengaturan Foto Profil & Password Akun"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Pengaturan Akun</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Nama Lengkap:</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser.name}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">NIK Karyawan:</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5 font-mono">{currentUser.nik}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Jabatan Utama:</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser.position}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Area Kerja:</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser.department}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Role Sistem:</span>
              <p className="font-extrabold text-blue-600 text-sm mt-0.5">Group Leader Tim</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Total Anggota Tim:</span>
              <p className="font-extrabold text-emerald-600 text-sm mt-0.5">{totalMembers} Subordinat</p>
            </div>
          </div>

          {/* Members under GL */}
          <div className="pt-2">
            <h4 className="font-bold text-xs text-slate-700 mb-2.5">
              Daftar Anggota Subordinat Tim Pengawasan:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mySubordinates.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{sub.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        NIK: {sub.nik} • {sub.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    {sub.equipmentType || sub.position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Rapor YTD Tim & Personal */}
      {activeTab === 'ytd_report' && (
        <div className="space-y-4">
          {/* Searchable Subordinate Picker Dropdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="w-full sm:w-auto relative" ref={ytdDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Karyawan / Subordinat Tim:
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsYtdDropdownOpen((prev) => !prev)}
                className="w-full sm:w-96 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 transition-all text-left rounded-xl px-3.5 py-2 flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    {activeYtdEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 text-xs truncate block">
                      {activeYtdEmployee.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      NIK: {activeYtdEmployee.nik} • {activeYtdEmployee.category}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ml-2 ${
                    isYtdDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {/* Search Popover */}
              {isYtdDropdownOpen && (
                <div className="absolute z-50 top-full left-0 mt-1.5 w-full sm:w-96 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        ref={ytdSearchInputRef}
                        type="text"
                        value={ytdSearchQuery}
                        onChange={(e) => setYtdSearchQuery(e.target.value)}
                        placeholder="Ketik NIK atau Nama anggota tim..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-600"
                      />
                      {ytdSearchQuery && (
                        <button
                          onClick={() => setYtdSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredYtdSubordinates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ada anggota tim yang cocok dengan pencarian "{ytdSearchQuery}".
                      </div>
                    ) : (
                      filteredYtdSubordinates.map((sub) => {
                        const isSelected = sub.nik === activeYtdEmployee.nik;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setSelectedYtdNik(sub.nik);
                              setIsYtdDropdownOpen(false);
                              setYtdSearchQuery('');
                            }}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              isSelected ? 'bg-blue-50/80 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {sub.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <p className="truncate font-semibold">{sub.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  NIK: {sub.nik} • {sub.category} - {sub.department}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium sm:text-right">
              Total <strong className="text-slate-800">{mySubordinates.length}</strong> Subordinat Terdaftar
            </div>
          </div>

          <YtdParameterTable
            employee={activeYtdEmployee}
            reports={reports}
            operatorParameters={operatorParameters}
            nonomParameters={nonomParameters}
            selectedYear="2026"
          />
        </div>
      )}

      {/* Tab: Dashboard Tim */}
      {(activeTab === 'team_dashboard' || (activeTab !== 'profile' && activeTab !== 'ytd_report')) && (
        <>
          {/* Stats Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Members */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Subordinat</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalMembers} Orang</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Terdaftar di bawah pengawasan GL
              </p>
            </div>

            {/* Team Average */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Nilai Rerata Tim</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-blue-600">{teamAvgScore}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Status: {parseFloat(teamAvgScore) >= 3.0 ? 'Performa Baik' : 'Cukup'}
              </p>
            </div>

            {/* Top Performer */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Best Performer</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-extrabold text-emerald-700 truncate">
                {topPerformer ? topPerformer.employee.name : '-'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Skor MER: {topPerformer ? topPerformer.finalScore.toFixed(2) : '0.00'}
              </p>
            </div>

            {/* Low Score List */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Performa Kurang</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-600">
                {needsCoachingList.length} Orang
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Skor MER &lt; 2.50</p>
            </div>
          </div>

          {/* Main Team Content */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm space-y-6">
            {/* Search & Category Filter Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama, NIK, atau tipe alat berat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Operator">Operator Alat Berat</option>
                  <option value="Nonom">Nonom (Helper/Dumpman)</option>
                </select>
              </div>
            </div>

            {/* Performance Bar Chart for Team */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Grafik Perbandingan Performa MER Tim ({formatPeriodLabel(selectedPeriod)})</span>
              </h3>
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[0, 4.5]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} name="Skor MER" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Member Ranking List */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Daftar Rangking Performa Subordinat</span>
              </h3>

              <div className="space-y-2">
                {filteredTeam.map((item, index) => {
                  const badge = getScoreCategoryBadge(item.finalScore);
                  return (
                    <div
                      key={item.employee.id}
                      onClick={() => setSelectedMemberNik(item.employee.nik)}
                      className="bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-100/60"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                            index === 0
                              ? 'bg-blue-600 text-white'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : index === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {item.employee.name}
                            </h4>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              NIK: {item.employee.nik}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.employee.category}{' '}
                            {item.employee.equipmentType
                              ? `• ${item.employee.equipmentType}`
                              : ''}{' '}
                            • {item.employee.position}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 ml-2">
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-black text-blue-600">
                            {item.finalScore.toFixed(2)}
                          </span>
                          <span
                            className={`text-[9px] block font-bold px-1.5 py-0.5 rounded border ${badge.badgeClass}`}
                          >
                            {badge.label.split(' ')[0]}
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}

                {filteredTeam.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Tidak ada data subordinat ditemukan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Member Detail Drawer / Modal */}
      {memberDetailObj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-4 sm:p-6 text-slate-800 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-blue-600">
                  Rincian Evaluasi & Rapor MER Karyawan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-slate-800">{memberDetailObj.employee.name}</strong> (NIK: {memberDetailObj.employee.nik}) • Area Kerja: {memberDetailObj.employee.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberNik(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-slate-200 space-x-4">
              <button
                onClick={() => setMemberModalTab('ytd')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  memberModalTab === 'ytd'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Rapor YTD
              </button>
              <button
                onClick={() => setMemberModalTab('period')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  memberModalTab === 'period'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Detail Periode ({formatPeriodLabel(selectedPeriod)})
              </button>
            </div>

            {memberModalTab === 'ytd' && (
              <YtdParameterTable
                employee={memberDetailObj.employee}
                reports={reports}
                operatorParameters={operatorParameters}
                nonomParameters={nonomParameters}
                selectedYear="2026"
              />
            )}

            {memberModalTab === 'period' && (
              <>
                {memberDetailObj.report ? (
                  <div className="space-y-4 text-xs">
                    {/* Score Summary Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Skor MER Periode {formatPeriodLabel(selectedPeriod)}
                        </span>
                        <p className="text-3xl font-black text-blue-600">
                          {memberDetailObj.report.finalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            getScoreCategoryBadge(memberDetailObj.report.finalScore)
                              .badgeClass
                          }`}
                        >
                          {getScoreCategoryBadge(memberDetailObj.report.finalScore).label}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown by Parameters */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Evaluasi Parameter MER & Data Indikator Input:</span>
                        </p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Skala Nilai 1 (Min) s.d. 4 (Maks)
                        </span>
                      </div>

                      {(memberDetailObj.employee.category === 'Operator'
                        ? operatorParameters
                        : nonomParameters
                      ).map((p) => {
                        const scoreVal = memberDetailObj.report?.scores[p.id] || 0;
                        const indDetails = getParameterIndicatorDetails(p, memberDetailObj.report);
                        const weightContribution = ((scoreVal * p.weight) / 100).toFixed(2);

                        return (
                          <div
                            key={p.id}
                            className="bg-slate-50 hover:bg-slate-100/60 transition-colors p-3.5 rounded-xl border border-slate-200 space-y-2.5"
                          >
                            {/* Header: Title, Weight & Score */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                    {p.name}
                                  </p>
                                  <span className="text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Bobot {p.weight}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {p.description}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="inline-flex items-center space-x-1 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                  <span className="text-[10px] text-slate-500 font-semibold">Skor:</span>
                                  <span className="font-black text-sm text-blue-600">{scoreVal}</span>
                                  <span className="text-[10px] text-slate-400">/ 4</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  +{weightContribution} poin
                                </div>
                              </div>
                            </div>

                            {/* Indicator Data Badge & Details */}
                            <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                              {/* Indicator Value (Data yang diinput) */}
                              <div className="flex items-start space-x-1.5">
                                <span className="font-bold text-slate-700 shrink-0 flex items-center space-x-1">
                                  <Database className="w-3 h-3 text-blue-600 inline" />
                                  <span>Data Indikator Riil:</span>
                                </span>
                                <span className="font-extrabold text-blue-900 bg-blue-50/90 border border-blue-200/80 px-2 py-0.5 rounded font-mono">
                                  {indDetails.indicatorText}
                                </span>
                              </div>

                              {/* Rubric Criteria for this Level */}
                              <div className="flex items-start space-x-1.5">
                                <span className="font-bold text-slate-600 shrink-0">Kriteria Level {scoreVal || '-'}:</span>
                                <span className="text-slate-700 font-medium leading-relaxed">
                                  {indDetails.criteriaText}
                                </span>
                              </div>

                              {/* Data Source */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                <span>Sumber Data Operasional: <strong className="text-slate-600">{indDetails.sourceText}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Merit / Demerit */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700">
                          Poin Merit (+)
                        </span>
                        <p className="font-bold text-emerald-800 mt-0.5">
                          +{memberDetailObj.report.meritPoint.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-700">
                          Poin Demerit (-)
                        </span>
                        <p className="font-bold text-rose-800 mt-0.5">
                          -{memberDetailObj.report.demeritPoint.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">
                    Belum ada data nilai MER diinput untuk periode ini.
                  </p>
                )}
              </>
            )}

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedMemberNik(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-4 py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
