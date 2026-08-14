import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getScoreCategoryBadge,
  formatPeriodLabel,
} from '../../utils/calculations';
import { YtdParameterTable } from '../common/YtdParameterTable';
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
  const groupLeaders = employees.filter((e) => e.role === 'group_leader');

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
                Persebaran Nilai MER ({currentActiveRangeLabel})
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
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {item.gl.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        NIK: {item.gl.nik} • Area Kerja: {item.gl.department}
                      </p>
                      <p className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                        Anggota Dievaluasi: {item.evaluatedCount} / {item.totalSubsCount} Subordinat
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-base font-black text-rose-600 block">
                      {item.avgScore.toFixed(2)}
                    </span>
                    <span
                      className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                    >
                      {badge.label.split(' ')[0]}
                    </span>
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
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
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
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {item.employee.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.employee.category}{' '}
                        {item.employee.equipmentType ? `(${item.employee.equipmentType})` : ''}{' '}
                        • GL: {item.employee.groupLeaderName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-base font-black text-emerald-600">
                      {item.score.toFixed(2)}
                    </span>
                    <span
                      className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                    >
                      {badge.label.split(' ')[0]}
                    </span>
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
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {item.employee.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.employee.category}{' '}
                        {item.employee.equipmentType ? `(${item.employee.equipmentType})` : ''}{' '}
                        • GL: {item.employee.groupLeaderName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-base font-black text-rose-600">
                      {item.score.toFixed(2)}
                    </span>
                    <span
                      className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}
                    >
                      {badge.label.split(' ')[0]}
                    </span>
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 text-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Tabel Rekapitulasi Nilai MER ({activeTableYear})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi perolehan nilai akhir MER bulanan (Januari - Desember {activeTableYear}) dan Rerata {analyticsMode === 'CUSTOM' ? `Periode (${startMonthObj.name} - ${endMonthObj.name})` : 'YTD'} untuk seluruh anggota subordinat
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Total Subordinat: <strong className="text-slate-900">{subEmployees.length} Orang</strong>
          </div>
        </div>

        {/* Horizontal Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-900 text-slate-100 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-800">
                <th className="py-3 px-3 text-center w-10">No.</th>
                <th className="py-3 px-4 min-w-[180px]">Subordinat / NIK</th>
                <th className="py-3 px-3 min-w-[130px]">Group Leader</th>
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
                <th className="py-3 px-3 text-center bg-blue-900 text-white min-w-[100px]">
                  {analyticsMode === 'CUSTOM'
                    ? `Rerata (${startMonthObj.name}-${endMonthObj.name})`
                    : 'Rerata YTD'}
                </th>
                <th className="py-3 px-4 text-center min-w-[130px]">Status Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {subEmployees.map((sub, idx) => {
                const monthlyScores: (number | null)[] = months.map((m) => {
                  const rep = reports.find(
                    (r) => r.nik === sub.nik && r.period === `${activeTableYear}-${m.code}`
                  );
                  return rep ? rep.finalScore : null;
                });

                // Range scores for selected period
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
                  <React.Fragment key={sub.id}>
                    <tr
                      onClick={() =>
                        setSelectedYtdSubNik(isExpanded ? '' : sub.nik)
                      }
                      className={`hover:bg-blue-50/60 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      } ${isExpanded ? 'bg-blue-50/90 font-medium' : ''}`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {sub.name}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">
                            {sub.nik}
                          </span>
                          <span>•</span>
                          <span>{sub.category}</span>
                          {sub.equipmentType && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">{sub.equipmentType}</span>
                            </>
                          )}
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

                    {/* Expandable Parameter Detail Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={17} className="p-4 bg-slate-100/90 border-b-2 border-blue-500">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <h4 className="font-extrabold text-sm text-blue-900 flex items-center space-x-2">
                                <span>Rapor YTD:</span>
                                <span className="text-slate-900">{sub.name} (NIK: {sub.nik})</span>
                              </h4>
                              <button
                                onClick={() => setSelectedYtdSubNik('')}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold"
                              >
                                Tutup Detail
                              </button>
                            </div>

                            <YtdParameterTable
                              employee={sub}
                              reports={reports}
                              operatorParameters={operatorParameters}
                              nonomParameters={nonomParameters}
                              selectedYear={activeTableYear}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


