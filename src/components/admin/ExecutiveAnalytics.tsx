import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  getScoreCategoryBadge,
  formatPeriodLabel,
} from '../../utils/calculations';
import { YtdParameterTable } from '../common/YtdParameterTable';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  Award,
  TrendingUp,
  AlertOctagon,
  Building,
  HardHat,
  Filter,
  BarChart3,
  Users,
  PieChart as PieChartIcon,
  UserX,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  CalendarRange,
  Maximize2,
  X,
  ChevronRight,
  User,
  Truck,
  Wrench,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export const ExecutiveAnalytics: React.FC = () => {
  const {
    employees,
    reports,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
  } = useApp();

  const [analyticsMode, setAnalyticsMode] = useState<'MONTHLY' | 'CUSTOM'>('CUSTOM');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Operator' | 'Nonom'>('ALL');
  const [startMonth, setStartMonth] = useState<string>('01');
  const [endMonth, setEndMonth] = useState<string>('12');
  const [customYear, setCustomYear] = useState<string>('2026');
  const [selectedYtdSubNik, setSelectedYtdSubNik] = useState<string>('');
  const [selectedGlForTeamModal, setSelectedGlForTeamModal] = useState<Employee | null>(null);
  const [tableGlFilter, setTableGlFilter] = useState<string>('ALL');
  const [recapCategoryTab, setRecapCategoryTab] = useState<'ALL' | 'Operator' | 'Nonom'>('ALL');
  const [recapNikSortDir, setRecapNikSortDir] = useState<'asc' | 'desc'>('asc');
  const [recapSearchTerm, setRecapSearchTerm] = useState<string>('');
  const [photoViewingEmp, setPhotoViewingEmp] = useState<Employee | null>(null);

  const months = [
    { code: '01', name: 'Jan', fullName: 'Januari' },
    { code: '02', name: 'Feb', fullName: 'Februari' },
    { code: '03', name: 'Mar', fullName: 'Maret' },
    { code: '04', name: 'Apr', fullName: 'April' },
    { code: '05', name: 'Mei', fullName: 'Mei' },
    { code: '06', name: 'Jun', fullName: 'Juni' },
    { code: '07', name: 'Jul', fullName: 'Juli' },
    { code: '08', name: 'Agu', fullName: 'Agustus' },
    { code: '09', name: 'Sep', fullName: 'September' },
    { code: '10', name: 'Okt', fullName: 'Oktober' },
    { code: '11', name: 'Nov', fullName: 'November' },
    { code: '12', name: 'Des', fullName: 'Desember' },
  ];

  const availableYears = ['2026', '2025', '2024'];

  const handleStartMonthChange = (val: string) => {
    setStartMonth(val);
    if (parseInt(val, 10) > parseInt(endMonth, 10)) {
      setEndMonth(val);
    }
  };

  const handleEndMonthChange = (val: string) => {
    setEndMonth(val);
    if (parseInt(val, 10) < parseInt(startMonth, 10)) {
      setStartMonth(val);
    }
  };

  const startMonthObj = months.find((m) => m.code === startMonth) || months[0];
  const endMonthObj = months.find((m) => m.code === endMonth) || months[11];
  const isFullYear = startMonth === '01' && endMonth === '12';
  const customPeriodLabel = isFullYear
    ? `Januari - Desember ${customYear}`
    : `${startMonthObj.fullName} - ${endMonthObj.fullName} ${customYear}`;

  const currentActiveRangeLabel =
    analyticsMode === 'MONTHLY'
      ? `Bulanan: ${formatPeriodLabel(selectedPeriod)}`
      : `Periode: ${customPeriodLabel}`;

  const activeTableYear =
    analyticsMode === 'CUSTOM' ? customYear : selectedPeriod.split('-')[0];

  // Subordinates list
  const subEmployees = employees.filter((e) => e.role === 'subordinate');
  const groupLeaders = employees.filter((e) => e.role === 'group_leader');
  const displayedSubEmployees = subEmployees.filter((sub) => {
    if (tableGlFilter === 'ALL') return true;
    return (
      sub.groupLeaderId === tableGlFilter ||
      sub.groupLeaderName === tableGlFilter ||
      groupLeaders.some(
        (gl) =>
          gl.nik === tableGlFilter &&
          (sub.groupLeaderName === gl.name || sub.groupLeaderId === gl.id)
      )
    );
  });
  // Natural NIK Sorting helper
  const sortSubordinatesByNik = (list: Employee[], dir: 'asc' | 'desc') => {
    return [...list].sort((a, b) => {
      const res = (a.nik || '').localeCompare(b.nik || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return dir === 'asc' ? res : -res;
    });
  };

  // Filtered by search query if present
  const searchedRecapEmployees = displayedSubEmployees.filter((sub) => {
    if (!recapSearchTerm.trim()) return true;
    const q = recapSearchTerm.toLowerCase().trim();
    return (
      sub.name.toLowerCase().includes(q) ||
      sub.nik.toLowerCase().includes(q) ||
      (sub.groupLeaderName || '').toLowerCase().includes(q) ||
      (sub.equipmentType || '').toLowerCase().includes(q) ||
      (sub.position || '').toLowerCase().includes(q)
    );
  });

  // All subordinates sorted by NIK
  const allSortedSubordinates = sortSubordinatesByNik(searchedRecapEmployees, recapNikSortDir);

  // Split cleanly between Operator and Non-Operator (Nonom)
  const operatorSubordinates = allSortedSubordinates.filter((s) => s.category === 'Operator');
  const nonomSubordinates = allSortedSubordinates.filter((s) => s.category !== 'Operator');

  const activeYtdSub = subEmployees.find((e) => e.nik === selectedYtdSubNik) || subEmployees[0];

  const headCoachObj = employees.find((e) => e.role === 'head_coach');
  const headCoachName = headCoachObj ? headCoachObj.name : 'Dharmawan Kustanto';

  // Map employees with Monthly or Custom Period score
  const employeeScores = subEmployees.map((emp) => {
    if (analyticsMode === 'MONTHLY') {
      const rep = reports.find(
        (r) => r.nik === emp.nik && r.period === selectedPeriod
      );
      return {
        employee: emp,
        score: rep ? rep.finalScore : 0,
        hasReport: !!rep,
        periodCount: rep ? 1 : 0,
      };
    } else {
      // Custom Period Calculation across startMonth to endMonth of customYear
      const startCode = parseInt(startMonth, 10);
      const endCode = parseInt(endMonth, 10);
      const empReps = reports.filter((r) => {
        if (r.nik !== emp.nik) return false;
        const [yr, mo] = r.period.split('-');
        if (yr !== customYear) return false;
        const moNum = parseInt(mo, 10);
        return moNum >= startCode && moNum <= endCode;
      });

      const avg =
        empReps.length > 0
          ? empReps.reduce((acc, r) => acc + r.finalScore, 0) / empReps.length
          : 0;
      return {
        employee: emp,
        score: Number(avg.toFixed(2)),
        hasReport: empReps.length > 0,
        periodCount: empReps.length,
      };
    }
  });

  // Filtered by category
  const filteredScores = employeeScores.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    return item.employee.category === categoryFilter;
  });

  // Sort by score descending
  const sortedDescending = [...filteredScores].sort((a, b) => b.score - a.score);

  // Top 10 Best Employees
  const top10Best = sortedDescending.filter((s) => s.hasReport).slice(0, 10);

  // Top 10 Worst Employees (Lowest scores with valid reports)
  const sortedAscending = [...filteredScores]
    .filter((s) => s.hasReport)
    .sort((a, b) => a.score - b.score);
  const top10Worst = sortedAscending.slice(0, 10);

  // MER Score Bins & Pie Chart Calculation
  const validScores = filteredScores.filter((s) => s.hasReport);
  const totalEvaluated = validScores.length;

  const scoreBins = [
    {
      name: 'Nilai < 1.00',
      count: 0,
      color: '#f43f5e',
      label: 'Buruk',
    },
    {
      name: 'Nilai 1.00 - 1.99',
      count: 0,
      color: '#f59e0b',
      label: 'Kurang',
    },
    {
      name: 'Nilai 2.00 - 2.99',
      count: 0,
      color: '#2563eb',
      label: 'Cukup',
    },
    {
      name: 'Nilai 3.00 - 4.00',
      count: 0,
      color: '#10b981',
      label: 'Baik',
    },
  ];

  validScores.forEach((item) => {
    const s = item.score;
    if (s < 1.0) scoreBins[0].count++;
    else if (s < 2.0) scoreBins[1].count++;
    else if (s < 3.0) scoreBins[2].count++;
    else scoreBins[3].count++;
  });

  const pieChartData = scoreBins.map((bin) => ({
    name: bin.name,
    value: bin.count,
    percentage:
      totalEvaluated > 0
        ? ((bin.count / totalEvaluated) * 100).toFixed(1)
        : '0.0',
    color: bin.color,
    label: bin.label,
  }));

  // Lowest Average Team MER per Group Leader
  const glPerformanceList = groupLeaders.map((gl) => {
    const teamSubs = subEmployees.filter(
      (sub) => sub.groupLeaderNik === gl.nik || sub.groupLeaderName === gl.name
    );

    const teamScores = filteredScores.filter(
      (fs) =>
        fs.employee.groupLeaderNik === gl.nik ||
        fs.employee.groupLeaderName === gl.name
    );

    const evaluatedSubs = teamScores.filter((ts) => ts.hasReport);
    const totalScoreSum = evaluatedSubs.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore =
      evaluatedSubs.length > 0 ? totalScoreSum / evaluatedSubs.length : 0;

    return {
      gl,
      totalSubsCount: teamSubs.length,
      evaluatedCount: evaluatedSubs.length,
      avgScore: Number(avgScore.toFixed(2)),
    };
  });

  // Sort GLs by average team score ascending (lowest first)
  const lowestAvgGroupLeaders = [...glPerformanceList]
    .filter((g) => g.evaluatedCount > 0)
    .sort((a, b) => a.avgScore - b.avgScore);

  // Equipment Category Performance Averages
  const equipmentStats: Record<string, { sum: number; count: number }> = {};
  filteredScores.forEach((item) => {
    if (item.employee.category === 'Operator' && item.employee.equipmentType && item.hasReport) {
      const eq = item.employee.equipmentType;
      if (!equipmentStats[eq]) equipmentStats[eq] = { sum: 0, count: 0 };
      equipmentStats[eq].sum += item.score;
      equipmentStats[eq].count += 1;
    }
  });

  const equipmentAverages = Object.entries(equipmentStats).map(([eq, data]) => ({
    equipment: eq,
    average: Number((data.sum / data.count).toFixed(2)),
    count: data.count,
  })).sort((a, b) => b.average - a.average);

  // Department Performance Averages
  const deptStats: Record<string, { sum: number; count: number }> = {};
  filteredScores.forEach((item) => {
    if (item.hasReport) {
      const d = item.employee.department;
      if (!deptStats[d]) deptStats[d] = { sum: 0, count: 0 };
      deptStats[d].sum += item.score;
      deptStats[d].count += 1;
    }
  });

  const deptAverages = Object.entries(deptStats).map(([dept, data]) => ({
    department: dept,
    average: Number((data.sum / data.count).toFixed(2)),
    count: data.count,
  })).sort((a, b) => b.average - a.average);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-800 shadow-sm space-y-4">
        {/* Main Controls Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Dashboard MER
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring analitik performa, persebaran nilai, dan evaluasi tim
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {/* Monthly vs Periode Kustom Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
              <button
                onClick={() => setAnalyticsMode('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  analyticsMode === 'MONTHLY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan ({formatPeriodLabel(selectedPeriod)})
              </button>
              <button
                onClick={() => setAnalyticsMode('CUSTOM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  analyticsMode === 'CUSTOM'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Periode Kustom
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800">
              <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Operator">Operator</option>
                <option value="Nonom">Nonom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Period Range Toolbar */}
        {analyticsMode === 'CUSTOM' && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <CalendarRange className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Pilih Periode:</span>
              </div>

              {/* Bulan Awal */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Awal:</span>
                <select
                  value={startMonth}
                  onChange={(e) => handleStartMonthChange(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulan Akhir */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Akhir:</span>
                <select
                  value={endMonth}
                  onChange={(e) => handleEndMonthChange(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tahun:</span>
                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-blue-900 bg-blue-100/70 border border-blue-200/80 px-2.5 py-1 rounded-lg font-bold shrink-0 self-start sm:self-auto">
              Rentang Aktif: {customPeriodLabel}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section: Pie Chart Distribution & Lowest GL Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Distribution of MER Scores */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-800">
                Distribusi MER {activeTableYear}
              </h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
              TOTAL: {totalEvaluated} KARYAWAN
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Pie Chart Visualization */}
            <div className="w-full md:w-1/2 h-52">
              {totalEvaluated > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${value} Orang (${item.payload.percentage}%)`,
                        item.payload.label,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data evaluasi
                </div>
              )}
            </div>

            {/* Score Bins Percentage Table */}
            <div className="w-full md:w-1/2 space-y-2">
              {pieChartData.map((bin) => (
                <div
                  key={bin.name}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: bin.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {bin.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {bin.label}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="font-extrabold text-slate-900 block">
                      {bin.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {bin.value} Orang
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lowest Average MER Group Leaders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-slate-800">
                Group Leader Rata-Rata Tim Terendah
              </h3>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold">
              EVALUASI TIM GL
            </span>
          </div>

          <div className="space-y-2.5">
            {lowestAvgGroupLeaders.map((item, idx) => {
              const badge = getScoreCategoryBadge(item.avgScore);
              return (
                <div
                  key={item.gl.id}
                  onClick={() => setSelectedGlForTeamModal(item.gl)}
                  className="bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
                  title="Klik untuk melihat detail data subordinat tim Group Leader ini"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* GL Profile Photo Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoViewingEmp(item.gl);
                      }}
                      className="relative group/avatar w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                      title="Klik untuk melihat foto profil besar"
                    >
                      {item.gl.photoUrl ? (
                        <img
                          src={item.gl.photoUrl}
                          alt={item.gl.name}
                          className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                        />
                      ) : (
                        item.gl.name.charAt(0)
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </button>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors truncate">
                        {item.gl.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        NIK: {item.gl.nik} • Area Kerja: {item.gl.department}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-blue-600 font-medium truncate">
                          {item.evaluatedCount} / {item.totalSubsCount} Subordinat
                        </span>
                        <span className="text-[9px] text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded font-semibold hidden sm:inline-block">
                          Lihat Tim →
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2 flex items-center space-x-2">
                    <div>
                      <span className="text-base font-black text-rose-600 block leading-tight">
                        {item.avgScore.toFixed(2)}
                      </span>
                      <span
                        className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                      >
                        {badge.label.split(' ')[0]}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}

            {lowestAvgGroupLeaders.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                Belum ada data evaluasi Group Leader pada periode ini.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboards Grid (Top 10 Best vs Top 10 Worst) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Best Employees */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-800">
                Top 10 Best Employees
              </h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              PERFORMA TERTINGGI
            </span>
          </div>

          <div className="space-y-2">
            {top10Best.map((item, idx) => {
              const badge = getScoreCategoryBadge(item.score);
              return (
                <div
                  key={item.employee.id}
                  onClick={() => setSelectedYtdSubNik(item.employee.nik)}
                  className="bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
                  title="Klik untuk melihat rapor & detail evaluasi karyawan ini"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-md font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    {/* Employee Profile Photo Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoViewingEmp(item.employee);
                      }}
                      className="relative group/avatar w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer"
                      title="Klik untuk melihat foto profil besar"
                    >
                      {item.employee.photoUrl ? (
                        <img
                          src={item.employee.photoUrl}
                          alt={item.employee.name}
                          className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                        />
                      ) : (
                        item.employee.name.charAt(0)
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </button>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-emerald-950 transition-colors truncate">
                        {item.employee.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.employee.category}{' '}
                        {item.employee.equipmentType ? `(${item.employee.equipmentType})` : ''}{' '}
                        • GL: {item.employee.groupLeaderName}
                      </p>
                      <span className="text-[9px] text-emerald-700 font-semibold inline-block sm:hidden">
                        Lihat Rapor →
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2 flex items-center space-x-2">
                    <div>
                      <span className="text-base font-black text-emerald-600 block leading-tight">
                        {item.score.toFixed(2)}
                      </span>
                      <span
                        className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                      >
                        {badge.label.split(' ')[0]}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}

            {top10Best.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada data nilai pada periode ini.
              </p>
            )}
          </div>
        </div>

        {/* Top 10 Needs Coaching / Lowest Scores */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-base text-slate-800">
                Top 10 Needs Coaching
              </h3>
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
              PERLU EVALUASI
            </span>
          </div>

          <div className="space-y-2">
            {top10Worst.map((item, idx) => {
              const badge = getScoreCategoryBadge(item.score);
              return (
                <div
                  key={item.employee.id}
                  onClick={() => setSelectedYtdSubNik(item.employee.nik)}
                  className="bg-slate-50/80 hover:bg-rose-50/50 border border-slate-200/80 hover:border-rose-300 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
                  title="Klik untuk melihat rapor & detail evaluasi karyawan ini"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Employee Profile Photo Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoViewingEmp(item.employee);
                      }}
                      className="relative group/avatar w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-rose-500 transition-all cursor-pointer"
                      title="Klik untuk melihat foto profil besar"
                    >
                      {item.employee.photoUrl ? (
                        <img
                          src={item.employee.photoUrl}
                          alt={item.employee.name}
                          className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                        />
                      ) : (
                        item.employee.name.charAt(0)
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </button>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-rose-950 transition-colors truncate">
                        {item.employee.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.employee.category}{' '}
                        {item.employee.equipmentType ? `(${item.employee.equipmentType})` : ''}{' '}
                        • GL: {item.employee.groupLeaderName}
                      </p>
                      <span className="text-[9px] text-rose-700 font-semibold inline-block sm:hidden">
                        Lihat Rapor →
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2 flex items-center space-x-2">
                    <div>
                      <span className="text-base font-black text-rose-600 block leading-tight">
                        {item.score.toFixed(2)}
                      </span>
                      <span
                        className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                      >
                        {badge.label.split(' ')[0]}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}

            {top10Worst.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada data nilai pada periode ini.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Horizontal MER Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-slate-800 shadow-sm space-y-6">
        {/* Top Header & Overview */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">
                  Rekapitulasi MER {activeTableYear}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disusun terurut berdasar NIK subordinat dengan pemisahan kelompok Operator dan Nonom (Non-Operator).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              Total Subordinat: <strong className="text-slate-900">{subEmployees.length}</strong>
            </div>
            <div className="text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>Operator: <strong>{subEmployees.filter(s => s.category === 'Operator').length}</strong></span>
            </div>
            <div className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-700" />
              <span>Nonom: <strong>{subEmployees.filter(s => s.category !== 'Operator').length}</strong></span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row: Category Tabs + Group Leader + Search + NIK Sort */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Segmented Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto self-start border border-slate-200/80">
              <button
                type="button"
                onClick={() => setRecapCategoryTab('ALL')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  recapCategoryTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Semua Kelompok</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-extrabold">
                  {allSortedSubordinates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRecapCategoryTab('Operator')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  recapCategoryTab === 'Operator'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Operator</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  recapCategoryTab === 'Operator' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {operatorSubordinates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRecapCategoryTab('Nonom')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  recapCategoryTab === 'Nonom'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Nonom</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  recapCategoryTab === 'Nonom' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {nonomSubordinates.length}
                </span>
              </button>
            </div>

            {/* NIK Sort Direction Button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRecapNikSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Ubah urutan penyusunan NIK"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Urut NIK:</span>
                <span className="font-mono font-black text-blue-700">
                  {recapNikSortDir === 'asc' ? '01 → 99 (Asc)' : '99 → 01 (Desc)'}
                </span>
                {recapNikSortDir === 'asc' ? (
                  <ArrowUp className="w-3 h-3 text-blue-600" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Secondary Controls: GL Filter & Search Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {/* GL Filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
              <span className="text-slate-500 font-bold mr-1.5 uppercase text-[10px] tracking-wider whitespace-nowrap">Group Leader:</span>
              <select
                value={tableGlFilter}
                onChange={(e) => setTableGlFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer w-full truncate pr-1"
              >
                <option value="ALL">Semua Group Leader ({subEmployees.length} Subordinat)</option>
                {groupLeaders.map((gl) => {
                  const count = subEmployees.filter(
                    (s) =>
                      s.groupLeaderId === gl.nik ||
                      s.groupLeaderId === gl.id ||
                      s.groupLeaderName === gl.name
                  ).length;
                  return (
                    <option key={gl.id} value={gl.nik}>
                      {gl.name} ({count} Subordinat)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Search */}
            <div className="relative sm:col-span-1 lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recapSearchTerm}
                onChange={(e) => setRecapSearchTerm(e.target.value)}
                placeholder="Cari NIK, Nama Subordinat, Jabatan, Tipe Alat, atau GL..."
                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              {recapSearchTerm && (
                <button
                  onClick={() => setRecapSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RECAP SECTIONS: Render Operator and/or Nonom tables according to active category tab */}
        {(() => {
          // Reusable Table & Mobile Card renderer for a list of subordinates
          const renderSectionTable = (
            list: Employee[],
            sectionTitle: string,
            sectionIcon: React.ReactNode,
            theme: 'amber' | 'blue',
            emptySubtitle: string
          ) => {
            const isAmber = theme === 'amber';
            const headerBg = isAmber ? 'bg-amber-700 text-white' : 'bg-slate-900 text-white';
            const accentBadgeBg = isAmber ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200';
            const sectionBorder = isAmber ? 'border-amber-200' : 'border-slate-200';

            return (
              <div className={`space-y-3.5 border ${sectionBorder} rounded-2xl p-3.5 sm:p-5 bg-white shadow-2xs`}>
                {/* Section Sub-Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${isAmber ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {sectionIcon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                        <span>{sectionTitle}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${accentBadgeBg}`}>
                          {list.length} Subordinat
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Disusun urut berdasarkan NIK ({recapNikSortDir === 'asc' ? 'terkecil ke terbesar' : 'terbesar ke terkecil'}).
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 self-start sm:self-auto">
                    Kategori: <strong className={isAmber ? 'text-amber-800' : 'text-blue-800'}>{isAmber ? 'Operator' : 'Nonom (Non-Op)'}</strong>
                  </div>
                </div>

                {/* Mobile-Friendly Subordinate Card List */}
                <div className="block md:hidden space-y-2.5">
                  {list.map((sub) => {
                    const monthlyScores: (number | null)[] = months.map((m) => {
                      const rep = reports.find(
                        (r) => r.nik === sub.nik && r.period === `${activeTableYear}-${m.code}`
                      );
                      return rep ? rep.finalScore : null;
                    });

                    const startCode = parseInt(startMonth, 10);
                    const endCode = parseInt(endMonth, 10);
                    const rangeScores =
                      analyticsMode === 'CUSTOM'
                        ? monthlyScores.filter((s, mIdx) => {
                            const mNum = mIdx + 1;
                            return mNum >= startCode && mNum <= endCode && s !== null;
                          })
                        : monthlyScores.filter((s): s is number => s !== null);

                    const calculatedAvg =
                      rangeScores.length > 0
                        ? (rangeScores as number[]).reduce((acc, curr) => acc + curr, 0) / rangeScores.length
                        : 0;

                    const badge = getScoreCategoryBadge(calculatedAvg);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedYtdSubNik(sub.nik)}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoViewingEmp(sub);
                              }}
                              className={`w-9 h-9 rounded-full ${isAmber ? 'bg-amber-600' : 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-2xs`}
                            >
                              {sub.photoUrl ? (
                                <img src={sub.photoUrl} alt={sub.name} className="w-full h-full object-cover" />
                              ) : (
                                sub.name.charAt(0)
                              )}
                            </button>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {sub.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-800 border border-slate-200/80">{sub.nik}</span> • GL: {sub.groupLeaderName || '-'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-slate-900 block">
                              {calculatedAvg > 0 ? calculatedAvg.toFixed(2) : '-'}
                            </span>
                            <span className={`inline-block text-[8.5px] font-bold px-1.5 py-0.2 rounded ${badge.badgeClass}`}>
                              {badge.label.split(' ')[0]}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium">
                            {sub.category} {sub.equipmentType ? `(${sub.equipmentType})` : ''} • {sub.position || 'Subordinat'}
                          </span>
                          <span className="text-blue-600 font-bold hover:underline flex items-center space-x-0.5">
                            <span>Rapor YTD</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {list.length === 0 && (
                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                      <p className="font-bold text-xs text-slate-600">Tidak ada subordinat di kelompok ini.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{emptySubtitle}</p>
                    </div>
                  )}
                </div>

                {/* Desktop Horizontal Table Container */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                    <thead>
                      <tr className={`${headerBg} text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-800`}>
                        <th className="py-3 px-3 text-center w-12">No.</th>
                        <th className="py-3 px-4 min-w-[200px]">
                          <button
                            type="button"
                            onClick={() => setRecapNikSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="flex items-center space-x-1.5 hover:text-blue-200 cursor-pointer focus:outline-none"
                            title="Klik untuk mengubah urutan NIK"
                          >
                            <span>Subordinat / NIK</span>
                            <ArrowUpDown className="w-3 h-3 opacity-80" />
                          </button>
                        </th>
                        <th className="py-3 px-3 min-w-[140px]">Group Leader</th>
                        {months.map((m) => {
                          const mNum = parseInt(m.code, 10);
                          const isHighlighted =
                            analyticsMode === 'CUSTOM' &&
                            mNum >= parseInt(startMonth, 10) &&
                            mNum <= parseInt(endMonth, 10);
                          return (
                            <th
                              key={m.code}
                              className={`py-3 px-2 text-center transition-colors ${
                                isHighlighted ? 'bg-blue-950 text-blue-300 font-black' : ''
                              }`}
                            >
                              {m.name}
                            </th>
                          );
                        })}
                        <th className="py-3 px-3 text-center bg-blue-900 text-white min-w-[110px]">
                          {analyticsMode === 'CUSTOM'
                            ? `Rerata (${startMonthObj.name}-${endMonthObj.name})`
                            : 'Rerata YTD'}
                        </th>
                        <th className="py-3 px-4 text-center min-w-[130px]">Status Evaluasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 bg-white">
                      {list.map((sub, idx) => {
                        const monthlyScores: (number | null)[] = months.map((m) => {
                          const rep = reports.find(
                            (r) => r.nik === sub.nik && r.period === `${activeTableYear}-${m.code}`
                          );
                          return rep ? rep.finalScore : null;
                        });

                        const startCode = parseInt(startMonth, 10);
                        const endCode = parseInt(endMonth, 10);

                        const rangeScores =
                          analyticsMode === 'CUSTOM'
                            ? monthlyScores.filter((s, mIdx) => {
                                const mNum = mIdx + 1;
                                return mNum >= startCode && mNum <= endCode && s !== null;
                              })
                            : monthlyScores.filter((s): s is number => s !== null);

                        const calculatedAvg =
                          rangeScores.length > 0
                            ? (rangeScores as number[]).reduce((acc, curr) => acc + curr, 0) / rangeScores.length
                            : 0;

                        const badge = getScoreCategoryBadge(calculatedAvg);
                        const isExpanded = selectedYtdSubNik === sub.nik;

                        return (
                          <tr
                            key={sub.id}
                            onClick={() =>
                              setSelectedYtdSubNik(isExpanded ? '' : sub.nik)
                            }
                            className={`hover:bg-blue-50/60 transition-colors cursor-pointer ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                            } ${isExpanded ? 'bg-blue-50/90 font-medium' : ''}`}
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotoViewingEmp(sub);
                                  }}
                                  className={`relative group/avatar w-7 h-7 rounded-full ${
                                    isAmber ? 'bg-amber-600' : 'bg-blue-600'
                                  } text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer`}
                                  title="Klik untuk melihat foto profil besar"
                                >
                                  {sub.photoUrl ? (
                                    <img
                                      src={sub.photoUrl}
                                      alt={sub.name}
                                      className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                                    />
                                  ) : (
                                    sub.name.charAt(0)
                                  )}
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="w-2.5 h-2.5" />
                                  </div>
                                </button>

                                <div>
                                  <div className="font-extrabold text-slate-900 leading-tight">
                                    {sub.name}
                                  </div>
                                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                                    <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-black border border-slate-200/80">
                                      {sub.nik}
                                    </span>
                                    <span>•</span>
                                    <span className="font-medium text-slate-600">{sub.category}</span>
                                    {sub.equipmentType && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-700 font-bold">{sub.equipmentType}</span>
                                      </>
                                    )}
                                    {sub.position && sub.position !== 'Operator' && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-500">{sub.position}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700 text-[11px]">
                              {sub.groupLeaderName || '-'}
                            </td>

                            {/* 12 Months Scores */}
                            {monthlyScores.map((score, mIdx) => {
                              const mNum = mIdx + 1;
                              const isHighlighted =
                                analyticsMode === 'CUSTOM' &&
                                mNum >= startCode &&
                                mNum <= endCode;

                              return (
                                <td
                                  key={mIdx}
                                  className={`py-3 px-1.5 text-center font-bold text-[11px] ${
                                    isHighlighted ? 'bg-blue-50/40' : ''
                                  }`}
                                >
                                  {score !== null ? (
                                    <span
                                      className={
                                        score >= 3.25
                                          ? 'text-emerald-700'
                                          : score >= 2.5
                                          ? 'text-blue-700'
                                          : score >= 1.75
                                          ? 'text-amber-700'
                                          : 'text-rose-700'
                                      }
                                    >
                                      {score.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-normal">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Average Column */}
                            <td className="py-3 px-3 text-center font-black text-xs bg-blue-50/80 text-blue-900 border-x border-blue-200">
                              {calculatedAvg > 0 ? calculatedAvg.toFixed(2) : '0.00'}
                            </td>

                            {/* Status Badge Column */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                              >
                                {badge.label.split(' ')[0]}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {list.length === 0 && (
                        <tr>
                          <td colSpan={17} className="text-center py-10 text-slate-400 bg-slate-50/50">
                            <p className="font-bold text-slate-600">Tidak ada data subordinat untuk kelompok ini.</p>
                            <p className="text-xs text-slate-400 mt-1">{emptySubtitle}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-6">
              {/* SECTION 1: OPERATOR */}
              {(recapCategoryTab === 'ALL' || recapCategoryTab === 'Operator') &&
                renderSectionTable(
                  operatorSubordinates,
                  'Kelompok Subordinat Operator',
                  <Truck className="w-4 h-4 text-amber-700" />,
                  'amber',
                  'Periksa filter Group Leader atau kata kunci pencarian Anda.'
                )}

              {/* SECTION 2: NONOM (NON-OPERATOR) */}
              {(recapCategoryTab === 'ALL' || recapCategoryTab === 'Nonom') &&
                renderSectionTable(
                  nonomSubordinates,
                  'Kelompok Subordinat Nonom (Non-Operator)',
                  <Wrench className="w-4 h-4 text-blue-700" />,
                  'blue',
                  'Periksa filter Group Leader atau kata kunci pencarian Anda.'
                )}
            </div>
          );
        })()}
      </div>

      {/* Dedicated YTD Report Modal for Selected Employee */}
      {selectedYtdSubNik && (() => {
        const selectedEmployee = subEmployees.find((e) => e.nik === selectedYtdSubNik);
        if (!selectedEmployee) return null;
        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedYtdSubNik('')}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-3.5 sm:p-6 text-slate-800 space-y-3 sm:space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {selectedEmployee.photoUrl ? (
                      <img src={selectedEmployee.photoUrl} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedEmployee.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      NIK: {selectedEmployee.nik} • GL: {selectedEmployee.groupLeaderName || '-'} • {selectedEmployee.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedYtdSubNik('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <YtdParameterTable
                employee={selectedEmployee}
                reports={reports}
                operatorParameters={operatorParameters}
                nonomParameters={nonomParameters}
                selectedYear={activeTableYear}
              />
            </div>
          </div>
        );
      })()}

      {/* Group Leader Team Subordinates Modal */}
      {selectedGlForTeamModal && (() => {
        const gl = selectedGlForTeamModal;
        const teamSubs = subEmployees.filter((e) => e.groupLeaderNik === gl.nik);
        const glStats = glPerformanceList.find((g) => g.gl.nik === gl.nik);
        const glBadge = glStats ? getScoreCategoryBadge(glStats.avgScore) : null;

        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedGlForTeamModal(null)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-4 sm:p-6 text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setPhotoViewingEmp(gl)}
                    className="relative group/avatar w-11 h-11 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                    title="Klik untuk melihat foto profil besar"
                  >
                    {gl.photoUrl ? (
                      <img
                        src={gl.photoUrl}
                        alt={gl.name}
                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform"
                      />
                    ) : (
                      gl.name.charAt(0)
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">
                        Tim Subordinat: {gl.name}
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md shrink-0 hidden sm:inline-block">
                        Group Leader
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      NIK: {gl.nik} • Area Kerja: {gl.department} • {teamSubs.length} Anggota Tim
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGlForTeamModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Team Performance Summary */}
              {glStats && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-700">Rerata Performa Tim ({currentActiveRangeLabel}):</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black text-blue-600">
                      {glStats.avgScore.toFixed(2)}
                    </span>
                    {glBadge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${glBadge.badgeClass}`}>
                        {glBadge.label}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({glStats.evaluatedCount}/{glStats.totalSubsCount} Dievaluasi)
                    </span>
                  </div>
                </div>
              )}

              {/* Subordinates List */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Daftar Anggota Tim ({teamSubs.length} Orang):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Klik anggota untuk melihat Rapor YTD lengkap</span>
                </p>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {teamSubs.map((sub, idx) => {
                    const subScoreObj = filteredScores.find((s) => s.employee.nik === sub.nik);
                    const subScore = subScoreObj ? subScoreObj.score : 0;
                    const hasReport = subScoreObj ? subScoreObj.hasReport : false;
                    const badge = getScoreCategoryBadge(subScore);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedGlForTeamModal(null);
                          setSelectedYtdSubNik(sub.nik);
                        }}
                        className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoViewingEmp(sub);
                            }}
                            className="relative group/subAvatar w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                            title="Klik untuk melihat foto profil besar"
                          >
                            {sub.photoUrl ? (
                              <img
                                src={sub.photoUrl}
                                alt={sub.name}
                                className="w-full h-full object-cover group-hover/subAvatar:scale-110 transition-transform"
                              />
                            ) : (
                              sub.name.charAt(0)
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/subAvatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-3 h-3" />
                            </div>
                          </button>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              NIK: {sub.nik} • {sub.category} {sub.equipmentType ? `(${sub.equipmentType})` : ''} • {sub.department}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2 flex items-center space-x-2">
                          <div>
                            {hasReport ? (
                              <>
                                <span className="text-sm font-black text-slate-900 block leading-tight">
                                  {subScore.toFixed(2)}
                                </span>
                                <span
                                  className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                                >
                                  {badge.label.split(' ')[0]}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                                Belum dinilai
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}

                  {teamSubs.length === 0 && (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">
                      <User className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">Belum ada data anggota tim terdaftar</p>
                      <p className="text-xs text-slate-400">Tidak ada subordinat yang terkait dengan Group Leader ini.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Klik anggota tim mana saja untuk membuka Rapor YTD detailnya.</span>
                <button
                  onClick={() => setSelectedGlForTeamModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Profile Photo Viewer Popup */}
      <PhotoViewerModal
        employee={photoViewingEmp}
        onClose={() => setPhotoViewingEmp(null)}
      />
    </div>
  );
};


