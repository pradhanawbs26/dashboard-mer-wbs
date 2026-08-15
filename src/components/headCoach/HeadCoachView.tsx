import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSettingsModal } from '../common/UserSettingsModal';
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
  BarChart2,
  Settings,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Layers,
  X,
  Eye,
  Briefcase,
  Sparkles,
  ChevronDown,
  Check,
  Database,
  Calendar,
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

interface HeadCoachViewProps {
  activeTab?: string;
}

export const HeadCoachView: React.FC<HeadCoachViewProps> = ({ activeTab = 'team_dashboard' }) => {
  const {
    currentUser,
    employees,
    reports,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGlNik, setSelectedGlNik] = useState<string | null>(null);
  const [selectedYtdNik, setSelectedYtdNik] = useState<string>('');
  const [ytdSearchQuery, setYtdSearchQuery] = useState<string>('');
  const [isYtdDropdownOpen, setIsYtdDropdownOpen] = useState<boolean>(false);
  const ytdDropdownRef = useRef<HTMLDivElement>(null);
  const ytdSearchInputRef = useRef<HTMLInputElement>(null);

  const [glModalSearchTerm, setGlModalSearchTerm] = useState<string>('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');

  // Subordinate detail modal states
  const [selectedSubNik, setSelectedSubNik] = useState<string | null>(null);
  const [subModalTab, setSubModalTab] = useState<'period' | 'ytd'>('ytd');

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

  // 1. Group Leaders under this Head Coach
  const myGroupLeaders = employees.filter(
    (e) =>
      e.role === 'group_leader' &&
      (e.groupLeaderId === currentUser.nik ||
        e.groupLeaderName === currentUser.name ||
        !e.groupLeaderId)
  );

  // 2. Group Leaders stats & their team subordinates
  const glStatsList = myGroupLeaders.map((gl) => {
    const glSubordinates = employees.filter(
      (e) => e.role === 'subordinate' && (e.groupLeaderId === gl.nik || e.groupLeaderName === gl.name)
    );

    const subReports = glSubordinates.map((sub) => {
      const rep = reports.find((r) => r.nik === sub.nik && r.period === selectedPeriod);
      return {
        subordinate: sub,
        report: rep,
        finalScore: rep ? rep.finalScore : 0,
      };
    });

    const validSubReports = subReports.filter((sr) => sr.report !== undefined);
    const avgScoreVal =
      validSubReports.length > 0
        ? validSubReports.reduce((acc, sr) => acc + sr.finalScore, 0) / validSubReports.length
        : 0;

    return {
      groupLeader: gl,
      subordinates: glSubordinates,
      subReports,
      validReportsCount: validSubReports.length,
      avgScore: Number(avgScoreVal.toFixed(2)),
    };
  });

  // 3. Head Coach Overall Summary across all GL teams
  const allHCSubordinates = glStatsList.flatMap((g) => g.subordinates);
  const allHCSubReports = glStatsList.flatMap((g) => g.subReports.filter((sr) => sr.report !== undefined));

  const hcOverallAvgScore =
    allHCSubReports.length > 0
      ? (
          allHCSubReports.reduce((acc, sr) => acc + sr.finalScore, 0) /
          allHCSubReports.length
        ).toFixed(2)
      : '0.00';

  // Sort GLs by team average MER score descending
  const sortedGlStats = [...glStatsList].sort((a, b) => b.avgScore - a.avgScore);
  const topGlTeam = sortedGlStats[0]?.avgScore > 0 ? sortedGlStats[0] : null;

  // Filtered GL list by search term
  const filteredGlStats = sortedGlStats.filter((item) => {
    const matchesGlSearch =
      item.groupLeader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.groupLeader.nik.includes(searchTerm) ||
      item.groupLeader.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubSearch = item.subordinates.some(
      (sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.nik.includes(searchTerm)
    );

    return matchesGlSearch || matchesSubSearch;
  });

  // Chart data comparing Group Leaders' team MER average
  const chartData = sortedGlStats.map((item) => ({
    name: item.groupLeader.name.split(' ')[0],
    fullName: item.groupLeader.name,
    score: item.avgScore,
    memberCount: item.subordinates.length,
    department: item.groupLeader.department,
  }));

  // Active GL detail modal object
  const activeGlDetail = selectedGlNik
    ? glStatsList.find((g) => g.groupLeader.nik === selectedGlNik)
    : null;

  // Active subordinate detail object
  const allHCSubObjects = glStatsList.flatMap((g) => g.subReports);
  const activeSubDetail = selectedSubNik
    ? allHCSubObjects.find((sr) => sr.subordinate.nik === selectedSubNik)
    : null;

  // YTD Employee selector (Subordinates & Group Leaders)
  const selectableYtdEmployees = useMemo(() => {
    return [...myGroupLeaders, ...allHCSubordinates];
  }, [myGroupLeaders, allHCSubordinates]);

  // Filtered list for YTD picker in Head Coach view
  const filteredYtdList = useMemo(() => {
    if (!ytdSearchQuery.trim()) return selectableYtdEmployees;
    const q = ytdSearchQuery.toLowerCase().trim();
    return selectableYtdEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.nik.toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q) ||
        (emp.role === 'group_leader' ? 'group leader gl' : (emp.category || '')).toLowerCase().includes(q) ||
        (emp.equipmentType || '').toLowerCase().includes(q)
    );
  }, [selectableYtdEmployees, ytdSearchQuery]);

  const activeYtdEmployee =
    selectableYtdEmployees.find((e) => e.nik === selectedYtdNik) ||
    allHCSubordinates[0] ||
    myGroupLeaders[0] ||
    currentUser;

  return (
    <div className="space-y-6 pb-20">
      {/* Head Coach Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
            {/* Avatar / Photo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0 overflow-hidden border-2 border-amber-200">
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
                  {currentUser.position || `Head Coach Operations - Area ${currentUser.department}`}
                </p>
              </div>

              {/* Symmetrical Key-Value Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 text-xs bg-amber-50/50 border border-amber-200/60 rounded-xl px-3 py-2">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">NIK:</span>
                  <span className="font-bold text-slate-800 font-mono truncate">{currentUser.nik}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Area:</span>
                  <span className="font-bold text-slate-800 truncate">{currentUser.department}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Group Leader:</span>
                  <span className="font-bold text-slate-800 truncate">{myGroupLeaders.length} Orang</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">Subordinat:</span>
                  <span className="font-bold text-slate-800 truncate">{allHCSubordinates.length} Anggota</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-amber-50/80 px-4 py-2 rounded-xl border border-amber-200 text-right w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">
                Rata-rata MER Operasional
              </span>
              <span className="text-2xl font-black text-amber-700">
                {hcOverallAvgScore}{' '}
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
            <h3 className="text-lg font-bold text-amber-700 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Profil & Informasi Head Coach</span>
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
              <span className="text-slate-500 font-medium">Lingkup Area Kerja Operations:</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser.department}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Role Hirarki Sistem:</span>
              <p className="font-extrabold text-amber-700 text-sm mt-0.5">Head Coach Operations</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Tim Bawahan Direct:</span>
              <p className="font-extrabold text-blue-600 text-sm mt-0.5">{myGroupLeaders.length} Group Leader ({allHCSubordinates.length} Total Subordinat)</p>
            </div>
          </div>

          {/* Group Leaders under Head Coach */}
          <div className="pt-2">
            <h4 className="font-bold text-xs text-slate-700 mb-2.5">
              Daftar Group Leader di Bawah Pengawasan Direct:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGroupLeaders.map((gl) => {
                const subsCount = employees.filter(
                  (e) => e.role === 'subordinate' && (e.groupLeaderId === gl.nik || e.groupLeaderName === gl.name)
                ).length;
                return (
                  <div
                    key={gl.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {gl.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{gl.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          NIK: {gl.nik} • Area Kerja: {gl.department}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-md border border-blue-200 shrink-0">
                      {subsCount} Subordinat
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Rapor YTD Parameter */}
      {activeTab === 'ytd_report' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="w-full sm:w-auto relative" ref={ytdDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Karyawan (Group Leader atau Subordinat):
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsYtdDropdownOpen((prev) => !prev)}
                className="w-full sm:w-96 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 transition-all text-left rounded-xl px-3.5 py-2 flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs ${
                    activeYtdEmployee.role === 'group_leader' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activeYtdEmployee.role === 'group_leader' ? 'GL' : activeYtdEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 text-xs truncate block">
                      {activeYtdEmployee.role === 'group_leader' ? `[GL] ${activeYtdEmployee.name}` : activeYtdEmployee.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      NIK: {activeYtdEmployee.nik} • {activeYtdEmployee.role === 'group_leader' ? 'Group Leader' : activeYtdEmployee.category} - {activeYtdEmployee.department}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ml-2 ${
                    isYtdDropdownOpen ? 'rotate-180 text-amber-600' : ''
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
                        placeholder="Ketik NIK atau Nama GL / Subordinat..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-600"
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

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {filteredYtdList.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ditemukan karyawan dengan kata kunci "{ytdSearchQuery}".
                      </div>
                    ) : (
                      filteredYtdList.map((emp) => {
                        const isSelected = emp.nik === activeYtdEmployee.nik;
                        const isGl = emp.role === 'group_leader';
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setSelectedYtdNik(emp.nik);
                              setIsYtdDropdownOpen(false);
                              setYtdSearchQuery('');
                            }}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? 'bg-amber-50/80 font-bold text-amber-900'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-600 text-white'
                                    : isGl
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isGl ? 'GL' : emp.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <p className="truncate font-semibold">
                                  {isGl ? `[GL] ${emp.name}` : emp.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  NIK: {emp.nik} • {isGl ? 'Group Leader' : emp.category} - {emp.department}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium sm:text-right">
              Total <strong className="text-slate-800">{selectableYtdEmployees.length}</strong> Karyawan ({myGroupLeaders.length} GL + {allHCSubordinates.length} Subordinat)
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

      {/* Tab: Dashboard Tim Head Coach */}
      {(activeTab === 'team_dashboard' || (activeTab !== 'profile' && activeTab !== 'ytd_report')) && (
        <>
          {/* Stats Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Group Leader */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Total Group Leader</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{myGroupLeaders.length} GL</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Bawahan direct Head Coach
              </p>
            </div>

            {/* Total Subordinates */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Subordinat Tim</span>
                <HardHat className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{allHCSubordinates.length} Orang</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Di bawah {myGroupLeaders.length} tim Group Leader
              </p>
            </div>

            {/* Overall MER Score */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Rerata MER Overall</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">{hcOverallAvgScore}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Status: {parseFloat(hcOverallAvgScore) >= 3.0 ? 'Performa Baik' : 'Perlu Evaluasi'}
              </p>
            </div>

            {/* Top GL Team */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Best GL Team</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm font-extrabold text-amber-700 truncate">
                {topGlTeam ? topGlTeam.groupLeader.name : '-'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Rerata Tim: {topGlTeam ? topGlTeam.avgScore.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          {/* Main Dashboard Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm space-y-6">
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama Group Leader, NIK, atau area kerja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Bar Chart comparing GL Teams */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-amber-600" />
                <span>Grafik Perbandingan Rerata Nilai MER per Tim Group Leader ({formatPeriodLabel(selectedPeriod)})</span>
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
                      formatter={(val: any) => [`${val} / 4.00`, 'Rerata MER Tim GL']}
                    />
                    <Bar dataKey="score" fill="#d97706" radius={[6, 6, 0, 0]} name="Rerata MER Tim" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Group Leader List Cards */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Daftar Tim Group Leader & Rata-Rata Nilai MER Tim</span>
              </h3>

              <div className="space-y-3">
                {filteredGlStats.map((glItem, index) => {
                  const badge = getScoreCategoryBadge(glItem.avgScore);
                  return (
                    <div
                      key={glItem.groupLeader.id}
                      className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-100/70"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-amber-200">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-extrabold text-slate-900 text-sm">
                              {glItem.groupLeader.name}
                            </p>
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 font-mono">
                              NIK: {glItem.groupLeader.nik}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                            <span>Area Kerja: <strong>{glItem.groupLeader.department}</strong></span>
                            <span>•</span>
                            <span>Jabatan: {glItem.groupLeader.position}</span>
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
                              {glItem.subordinates.length} Subordinat
                            </span>
                            <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {glItem.validReportsCount} Laporan Rapor
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Score & Action */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Rerata MER Tim GL
                          </span>
                          <span className="text-2xl font-black text-amber-600">
                            {glItem.avgScore.toFixed(2)}
                          </span>
                          <span className={`block text-[10px] font-bold mt-0.5 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedGlNik(glItem.groupLeader.nik)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail Subordinat Tim</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Group Leader Team Subordinates Modal */}
      {activeGlDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-5 sm:p-6 text-slate-800 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase">
                  Detail Tim Group Leader
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {activeGlDetail.groupLeader.name} (NIK: {activeGlDetail.groupLeader.nik})
                </h3>
                <p className="text-xs text-slate-500">
                  Area Kerja: {activeGlDetail.groupLeader.department} • Total Subordinat: {activeGlDetail.subordinates.length} Orang
                </p>
              </div>
              <button
                onClick={() => setSelectedGlNik(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Score Summary */}
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800">
                  Rerata Nilai MER Tim Group Leader ({formatPeriodLabel(selectedPeriod)})
                </span>
                <p className="text-2xl font-black text-amber-700">
                  {activeGlDetail.avgScore.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ 4.00</span>
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getScoreCategoryBadge(activeGlDetail.avgScore).badgeClass}`}>
                {getScoreCategoryBadge(activeGlDetail.avgScore).label}
              </span>
            </div>

            {/* Subordinates Table Header with Search */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-xs text-slate-800">
                  Daftar Subordinat di Bawah GL {activeGlDetail.groupLeader.name}:
                </h4>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={glModalSearchTerm}
                    onChange={(e) => setGlModalSearchTerm(e.target.value)}
                    placeholder="Cari subordinat (NIK/Nama)..."
                    className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-amber-600"
                  />
                  {glModalSearchTerm && (
                    <button
                      onClick={() => setGlModalSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Karyawan</th>
                      <th className="p-3">Kategori / Jabatan</th>
                      <th className="p-3">Skor MER Periode</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeGlDetail.subReports
                      .filter((sr) => {
                        if (!glModalSearchTerm.trim()) return true;
                        const q = glModalSearchTerm.toLowerCase().trim();
                        return (
                          sr.subordinate.name.toLowerCase().includes(q) ||
                          sr.subordinate.nik.toLowerCase().includes(q) ||
                          sr.subordinate.position.toLowerCase().includes(q) ||
                          (sr.subordinate.equipmentType || '').toLowerCase().includes(q)
                        );
                      })
                      .map((sr) => {
                        const badge = getScoreCategoryBadge(sr.finalScore);
                        return (
                          <tr key={sr.subordinate.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {sr.subordinate.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{sr.subordinate.name}</p>
                                  <span className="text-[10px] text-blue-600 font-mono">
                                    NIK: {sr.subordinate.nik}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{sr.subordinate.position}</p>
                              <span className="text-[10px] text-slate-500">
                                {sr.subordinate.category} {sr.subordinate.equipmentType ? `(${sr.subordinate.equipmentType})` : ''}
                              </span>
                            </td>
                            <td className="p-3">
                              {sr.report ? (
                                <div>
                                  <span className="font-black text-sm text-slate-900">
                                    {sr.finalScore.toFixed(2)}
                                  </span>
                                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Belum Diinput</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedSubNik(sr.subordinate.nik);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                              >
                                Detail Rapor
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedGlNik(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subordinate Detail Modal */}
      {activeSubDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-5 sm:p-6 text-slate-800 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-amber-700">
                  Rincian Evaluasi & Rapor MER Subordinat
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-slate-800">{activeSubDetail.subordinate.name}</strong> (NIK: {activeSubDetail.subordinate.nik}) • Area Kerja: {activeSubDetail.subordinate.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubNik(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-slate-200 space-x-4">
              <button
                onClick={() => setSubModalTab('ytd')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  subModalTab === 'ytd'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Rapor YTD
              </button>
              <button
                onClick={() => setSubModalTab('period')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  subModalTab === 'period'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Detail Periode ({formatPeriodLabel(selectedPeriod)})
              </button>
            </div>

            {subModalTab === 'ytd' && (
              <YtdParameterTable
                employee={activeSubDetail.subordinate}
                reports={reports}
                operatorParameters={operatorParameters}
                nonomParameters={nonomParameters}
                selectedYear="2026"
              />
            )}

            {subModalTab === 'period' && (
              <>
                {activeSubDetail.report ? (
                  <div className="space-y-4 text-xs">
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800">
                          Skor MER Periode {formatPeriodLabel(selectedPeriod)}
                        </span>
                        <p className="text-3xl font-black text-amber-700">
                          {activeSubDetail.report.finalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            getScoreCategoryBadge(activeSubDetail.report.finalScore).badgeClass
                          }`}
                        >
                          {getScoreCategoryBadge(activeSubDetail.report.finalScore).label}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown by Parameters */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <Layers className="w-4 h-4 text-amber-600" />
                          <span>Evaluasi Parameter MER & Data Indikator Input:</span>
                        </p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Skala Nilai 1 (Min) s.d. 4 (Maks)
                        </span>
                      </div>

                      {(activeSubDetail.subordinate.category === 'Operator'
                        ? operatorParameters
                        : nonomParameters
                      ).map((p) => {
                        const scoreVal = activeSubDetail.report?.scores[p.id] || 0;
                        const indDetails = getParameterIndicatorDetails(p, activeSubDetail.report);
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
                                  <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[10px] font-bold">
                                    Bobot {p.weight}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {p.description}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="inline-flex items-center space-x-1 bg-white border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                  <span className="text-[10px] text-slate-500 font-semibold">Skor:</span>
                                  <span className="font-black text-sm text-amber-700">{scoreVal}</span>
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
                                  <Database className="w-3 h-3 text-amber-600 inline" />
                                  <span>Data Indikator Riil:</span>
                                </span>
                                <span className="font-extrabold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded font-mono">
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
                onClick={() => setSelectedSubNik(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
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
