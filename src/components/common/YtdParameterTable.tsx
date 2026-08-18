import React, { useState } from 'react';
import { Employee, MonthlyReport, DynamicParameter } from '../../types';
import {
  getScoreCategoryBadge,
  formatPeriodLabel,
  getParameterIndicatorDetails,
} from '../../utils/calculations';
import {
  Calendar,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  TrendingUp,
  Info,
  X,
  Activity,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface YtdParameterTableProps {
  employee: Employee;
  reports: MonthlyReport[];
  operatorParameters: DynamicParameter[];
  nonomParameters: DynamicParameter[];
  selectedYear?: string;
}

export const YtdParameterTable: React.FC<YtdParameterTableProps> = ({
  employee,
  reports,
  operatorParameters,
  nonomParameters,
  selectedYear = '2026',
}) => {
  const [currentYear, setCurrentYear] = useState<string>(selectedYear);
  const [startMonth, setStartMonth] = useState<string>('01');
  const [endMonth, setEndMonth] = useState<string>('12');
  const [selectedScoreDetail, setSelectedScoreDetail] = useState<{
    parameter: DynamicParameter;
    monthCode: string;
    monthName: string;
    year: string;
    report?: MonthlyReport;
    score: number;
  } | null>(null);

  const months = [
    { code: '01', name: 'Jan', fullName: 'Januari' },
    { code: '02', name: 'Feb', fullName: 'Februari' },
    { code: '03', name: 'Mar', fullName: 'Maret' },
    { code: '04', name: 'Apr', fullName: 'April' },
    { code: '05', name: 'Mei', fullName: 'Mei' },
    { code: '06', name: 'Jun', fullName: 'Juni' },
    { code: '07', name: 'Jul', fullName: 'Juli' },
    { code: '08', name: 'Ags', fullName: 'Agustus' },
    { code: '09', name: 'Sep', fullName: 'September' },
    { code: '10', name: 'Okt', fullName: 'Oktober' },
    { code: '11', name: 'Nov', fullName: 'November' },
    { code: '12', name: 'Des', fullName: 'Desember' },
  ];

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
  const periodRangeLabel = isFullYear
    ? `Jan - Des ${currentYear}`
    : `${startMonthObj.name} - ${endMonthObj.name} ${currentYear}`;

  const parameters =
    employee.category === 'Operator' ? operatorParameters : nonomParameters;

  // Filter reports for this employee and year
  const empReports = reports.filter(
    (r) => r.nik === employee.nik && r.period.startsWith(currentYear)
  );

  // Map month code to report
  const reportByMonth: Record<string, MonthlyReport | undefined> = {};
  months.forEach((m) => {
    const period = `${currentYear}-${m.code}`;
    reportByMonth[m.code] = empReports.find((r) => r.period === period);
  });

  // Calculate full YTD reports
  const allYtdReports = Object.values(reportByMonth).filter(
    (r): r is MonthlyReport => r !== undefined
  );

  // Filter months in selected range
  const monthsInRange = months.filter((m) => {
    const codeNum = parseInt(m.code, 10);
    return codeNum >= parseInt(startMonth, 10) && codeNum <= parseInt(endMonth, 10);
  });

  const rangeReports = monthsInRange
    .map((m) => reportByMonth[m.code])
    .filter((r): r is MonthlyReport => r !== undefined);

  // Full YTD averages
  const ytdFinalAvg =
    allYtdReports.length > 0
      ? allYtdReports.reduce((acc, r) => acc + r.finalScore, 0) / allYtdReports.length
      : 0;

  const ytdBaseAvg =
    allYtdReports.length > 0
      ? allYtdReports.reduce((acc, r) => acc + r.baseScore, 0) / allYtdReports.length
      : 0;

  const ytdMeritAvg =
    allYtdReports.length > 0
      ? allYtdReports.reduce((acc, r) => acc + r.meritPoint, 0) / allYtdReports.length
      : 0;

  const ytdDemeritAvg =
    allYtdReports.length > 0
      ? allYtdReports.reduce((acc, r) => acc + r.demeritPoint, 0) / allYtdReports.length
      : 0;

  // Selected Range averages
  const rangeFinalAvg =
    rangeReports.length > 0
      ? rangeReports.reduce((acc, r) => acc + r.finalScore, 0) / rangeReports.length
      : 0;

  const rangeBaseAvg =
    rangeReports.length > 0
      ? rangeReports.reduce((acc, r) => acc + r.baseScore, 0) / rangeReports.length
      : 0;

  const rangeMeritAvg =
    rangeReports.length > 0
      ? rangeReports.reduce((acc, r) => acc + r.meritPoint, 0) / rangeReports.length
      : 0;

  const rangeDemeritAvg =
    rangeReports.length > 0
      ? rangeReports.reduce((acc, r) => acc + r.demeritPoint, 0) / rangeReports.length
      : 0;

  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'monthly' | 'table'>('cards');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 text-slate-800 shadow-xs space-y-3 sm:space-y-4 w-full overflow-x-hidden">
      {/* Header Bar: Clean Title & Period Selectors */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-base sm:text-xl text-slate-900 tracking-tight truncate">
              Rapor YTD ({employee.name})
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Evaluasi kinerja periode {periodRangeLabel}
            </p>
          </div>
        </div>

        {/* Filter Controls: Periode Awal, Periode Akhir, & Tahun */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2.5 w-full lg:w-auto">
          {/* Periode Awal Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs">
            <span className="text-slate-400 font-bold mr-1 uppercase text-[9px] sm:text-[10px] tracking-wider">Awal:</span>
            <select
              value={startMonth}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-[11px] sm:text-xs"
            >
              {months.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Periode Akhir Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs">
            <span className="text-slate-400 font-bold mr-1 uppercase text-[9px] sm:text-[10px] tracking-wider">Akhir:</span>
            <select
              value={endMonth}
              onChange={(e) => handleEndMonthChange(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-[11px] sm:text-xs"
            >
              {months.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs col-span-2 sm:col-span-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
            <span className="text-slate-400 font-bold mr-1 uppercase text-[9px] sm:text-[10px] tracking-wider">Tahun:</span>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer text-[11px] sm:text-xs"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Reset to Full Year button if filtered */}
          {!isFullYear && (
            <button
              onClick={() => {
                setStartMonth('01');
                setEndMonth('12');
              }}
              className="col-span-2 sm:col-span-1 px-2.5 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] sm:text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer text-center"
              title="Kembalikan ke seluruh bulan (Jan - Des)"
            >
              Semua Bulan
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards: Menampilkan Rerata Periode Terpilih dan Rerata YTD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs">
        {/* Card 1: Rerata Skor MER */}
        <div className="bg-blue-50/70 border border-blue-200/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] text-blue-700 font-bold uppercase tracking-wider block truncate">
              Rerata ({startMonthObj.name} - {endMonthObj.name})
            </span>
            {rangeFinalAvg > 0 && (
              <span className={`text-[8.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded font-bold shrink-0 ${getScoreCategoryBadge(rangeFinalAvg).badgeClass}`}>
                {getScoreCategoryBadge(rangeFinalAvg).label.split(' ')[0]}
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-1 mt-0.5 sm:mt-1">
            <span className="text-lg sm:text-2xl font-black text-blue-900">
              {rangeFinalAvg > 0 ? rangeFinalAvg.toFixed(2) : '-'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal">/ 4.00</span>
          </div>
          <div className="mt-1 pt-1 border-t border-blue-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span className="truncate">YTD Tahunan:</span>
            <span className="font-bold text-blue-800 shrink-0 ml-1">{ytdFinalAvg > 0 ? ytdFinalAvg.toFixed(2) : '-'}</span>
          </div>
        </div>

        {/* Card 2: Skor Utama (Evaluasi Parameter) */}
        <div className="bg-slate-50 border border-slate-200/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate">
            Rerata Skor Utama
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5 sm:mt-1">
            <span className="text-lg sm:text-2xl font-black text-slate-800">
              {rangeBaseAvg > 0 ? rangeBaseAvg.toFixed(2) : '-'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">/ 4.00</span>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span className="truncate">YTD Tahunan:</span>
            <span className="font-bold text-slate-800 shrink-0 ml-1">{ytdBaseAvg > 0 ? ytdBaseAvg.toFixed(2) : '-'}</span>
          </div>
        </div>

        {/* Card 3: Merit Points */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
          <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold uppercase tracking-wider block truncate">
            Rerata Merit (+)
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5 sm:mt-1">
            <span className="text-lg sm:text-2xl font-black text-emerald-800">
              +{rangeMeritAvg.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span className="truncate">YTD Tahunan:</span>
            <span className="font-bold text-emerald-800 shrink-0 ml-1">+{ytdMeritAvg.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: Demerit Points */}
        <div className="bg-rose-50/70 border border-rose-200/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
          <span className="text-[9px] sm:text-[10px] text-rose-700 font-bold uppercase tracking-wider block truncate">
            Rerata Demerit (-)
          </span>
          <div className="flex items-baseline space-x-1 mt-0.5 sm:mt-1">
            <span className="text-lg sm:text-2xl font-black text-rose-800">
              -{rangeDemeritAvg.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 pt-1 border-t border-rose-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
            <span className="truncate">YTD Tahunan:</span>
            <span className="font-bold text-rose-800 shrink-0 ml-1">-{ytdDemeritAvg.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Mobile-Only View Switcher Pills */}
      <div className="flex sm:hidden items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
        <button
          onClick={() => setMobileViewMode('cards')}
          className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            mobileViewMode === 'cards'
              ? 'bg-white text-blue-600 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Parameter
        </button>
        <button
          onClick={() => setMobileViewMode('monthly')}
          className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            mobileViewMode === 'monthly'
              ? 'bg-white text-blue-600 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bulanan
        </button>
        <button
          onClick={() => setMobileViewMode('table')}
          className={`flex-1 py-1.5 px-1 rounded-lg transition-all text-center truncate ${
            mobileViewMode === 'table'
              ? 'bg-white text-blue-600 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Matriks
        </button>
      </div>

      {/* MOBILE SCORE CARDS VIEW: Parameter Cards (Default on Mobile) */}
      {mobileViewMode === 'cards' && (
        <div className="block sm:hidden space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-0.5">
            <span className="font-bold text-slate-700 text-[11px]">Rincian Per Parameter ({periodRangeLabel}):</span>
            <span className="text-[10px] text-slate-400">{parameters.length} Parameter</span>
          </div>

          {parameters.map((param) => {
            // Selected range parameter avg
            const rangeParamScores = rangeReports
              .map((r) => r.scores[param.id])
              .filter((s): s is number => typeof s === 'number');

            const rangeParamAvg =
              rangeParamScores.length > 0
                ? rangeParamScores.reduce((a, b) => a + b, 0) / rangeParamScores.length
                : 0;

            // Full YTD parameter avg
            const ytdParamScores = allYtdReports
              .map((r) => r.scores[param.id])
              .filter((s): s is number => typeof s === 'number');

            const ytdParamAvg =
              ytdParamScores.length > 0
                ? ytdParamScores.reduce((a, b) => a + b, 0) / ytdParamScores.length
                : 0;

            return (
              <div
                key={param.id}
                className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 text-slate-800 shadow-xs space-y-2"
              >
                {/* Card Title & Averages */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold uppercase text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      Bobot {param.weight}%
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 leading-snug break-words">
                      {param.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">
                      Rerata {startMonthObj.name}-{endMonthObj.name}
                    </span>
                    <span className="text-sm font-black text-blue-600">
                      {rangeParamAvg > 0 ? rangeParamAvg.toFixed(2) : '-'}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">
                      YTD: {ytdParamAvg > 0 ? ytdParamAvg.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>

                {/* Months Score Badge Chips Grid in Selected Range */}
                <div className="pt-1.5 border-t border-slate-200/80">
                  <span className="text-[9.5px] text-slate-500 font-bold block mb-1">
                    Nilai Bulanan (Klik angka untuk detail penyebab):
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {monthsInRange.map((m) => {
                      const rep = reportByMonth[m.code];
                      const score = rep?.scores[param.id];

                      let badgeClass = 'bg-slate-100 text-slate-400 border-slate-200';
                      if (score === 4) badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
                      if (score === 3) badgeClass = 'bg-blue-100 text-blue-800 border-blue-300 font-black';
                      if (score === 2) badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-black';
                      if (score === 1) badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-black';

                      return (
                        <button
                          key={m.code}
                          type="button"
                          onClick={() => {
                            if (score !== undefined) {
                              setSelectedScoreDetail({
                                parameter: param,
                                monthCode: m.code,
                                monthName: m.fullName,
                                year: currentYear,
                                report: rep,
                                score,
                              });
                            }
                          }}
                          className={`p-1 rounded-lg border text-[9.5px] flex flex-col items-center justify-center transition-all ${badgeClass} ${
                            score !== undefined
                              ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-2xs'
                              : 'opacity-60 cursor-default'
                          }`}
                        >
                          <span className="text-[8.5px] opacity-75">{m.name}</span>
                          <span className="text-[11px] font-bold">{score !== undefined ? score.toFixed(1) : '-'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MOBILE SCORE CARDS VIEW: Monthly Cards */}
      {mobileViewMode === 'monthly' && (
        <div className="block sm:hidden space-y-3 pt-1">
          <span className="text-xs font-bold text-slate-700 block">
            Rapor MER Periode {periodRangeLabel}:
          </span>

          {monthsInRange.map((m) => {
            const rep = reportByMonth[m.code];
            if (!rep) {
              return (
                <div
                  key={m.code}
                  className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400"
                >
                  <span className="font-bold text-slate-600">{m.name} {currentYear}</span>
                  <span className="italic text-[11px]">Belum diinput</span>
                </div>
              );
            }

            const badge = getScoreCategoryBadge(rep.finalScore);

            return (
              <div
                key={m.code}
                className="bg-white border border-slate-200 rounded-xl p-3.5 text-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {m.name} {currentYear}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xl font-black text-blue-600">
                    {rep.finalScore.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block">Base Score</span>
                    <span className="font-bold text-slate-800">{rep.baseScore.toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                    <span className="text-[9px] text-emerald-700 block">Merit (+)</span>
                    <span className="font-bold text-emerald-800">+{rep.meritPoint.toFixed(2)}</span>
                  </div>
                  <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                    <span className="text-[9px] text-rose-700 block">Demerit (-)</span>
                    <span className="font-bold text-rose-800">-{rep.demeritPoint.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP FULL MATRIX TABLE (and Mobile when 'table' tab selected) */}
      <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'} overflow-x-auto rounded-2xl border border-slate-200`}>
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-800 text-slate-100 font-bold">
              <th className="p-3 border-b border-slate-700 w-52 sticky left-0 bg-slate-800 z-10">
                Parameter Evaluasi
              </th>
              <th className="p-2 border-b border-slate-700 text-center w-14">
                Bobot
              </th>
              {months.map((m) => {
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);
                return (
                  <th
                    key={m.code}
                    className={`p-2 border-b border-slate-700 text-center w-12 transition-colors ${
                      isInRange ? 'bg-slate-700/90 text-white font-extrabold' : 'text-slate-400 opacity-60'
                    }`}
                  >
                    {m.name}
                  </th>
                );
              })}
              {/* Rerata Periode Terpilih */}
              <th className="p-2 border-b border-slate-700 text-center w-20 bg-blue-900 text-blue-200 font-black">
                Rerata ({startMonthObj.name}-{endMonthObj.name})
              </th>
              {/* Rerata YTD Tahunan */}
              <th className="p-2 border-b border-slate-700 text-center w-16 bg-slate-900 text-slate-300 font-black">
                Rerata YTD
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {/* Dynamic Parameter Rows */}
            {parameters.map((param) => {
              // Selected range parameter avg
              const rangeParamScores = rangeReports
                .map((r) => r.scores[param.id])
                .filter((s): s is number => typeof s === 'number');

              const rangeParamAvg =
                rangeParamScores.length > 0
                  ? rangeParamScores.reduce((a, b) => a + b, 0) / rangeParamScores.length
                  : 0;

              // Full YTD parameter avg
              const ytdParamScores = allYtdReports
                .map((r) => r.scores[param.id])
                .filter((s): s is number => typeof s === 'number');

              const ytdParamAvg =
                ytdParamScores.length > 0
                  ? ytdParamScores.reduce((a, b) => a + b, 0) / ytdParamScores.length
                  : 0;

              return (
                <tr key={param.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-xs">
                    <div className="truncate max-w-[220px]" title={param.name}>
                      {param.name}
                    </div>
                  </td>
                  <td className="p-2 text-center font-bold text-blue-600 bg-slate-50/50">
                    {param.weight}%
                  </td>

                  {/* Monthly Score Cells */}
                  {months.map((m) => {
                    const rep = reportByMonth[m.code];
                    const score = rep?.scores[param.id];
                    const isInRange =
                      parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                      parseInt(m.code, 10) <= parseInt(endMonth, 10);

                    if (score === undefined || score === null) {
                      return (
                        <td
                          key={m.code}
                          className={`p-2 text-center text-slate-300 font-mono text-[11px] ${
                            !isInRange ? 'opacity-40 bg-slate-50/30' : ''
                          }`}
                        >
                          -
                        </td>
                      );
                    }

                    // Score color styles (4=L4, 3=L3, 2=L2, 1=L1)
                    let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    if (score === 3) badgeBg = 'bg-blue-100 text-blue-800 border-blue-300';
                    if (score === 2) badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
                    if (score === 1) badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';

                    return (
                      <td
                        key={m.code}
                        className={`p-1.5 text-center ${
                          !isInRange ? 'opacity-40 bg-slate-50/30' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedScoreDetail({
                              parameter: param,
                              monthCode: m.code,
                              monthName: m.fullName,
                              year: currentYear,
                              report: rep,
                              score,
                            })
                          }
                          className={`inline-block w-8 py-0.5 rounded text-[11px] font-black border transition-all cursor-pointer hover:scale-110 active:scale-95 hover:shadow-md ring-offset-1 hover:ring-2 hover:ring-blue-400 ${badgeBg}`}
                          title={`Klik untuk melihat penyebab aktual ${param.name} (${m.name} ${currentYear}): Nilai ${score.toFixed(1)}`}
                        >
                          {score.toFixed(1)}
                        </button>
                      </td>
                    );
                  })}

                  {/* Range Average Column */}
                  <td className="p-2 text-center font-black text-blue-900 bg-blue-50/80 border-l border-blue-100">
                    {rangeParamAvg > 0 ? rangeParamAvg.toFixed(2) : '-'}
                  </td>

                  {/* Full YTD Average Column */}
                  <td className="p-2 text-center font-bold text-slate-700 bg-slate-100/80 border-l border-slate-200">
                    {ytdParamAvg > 0 ? ytdParamAvg.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}

            {/* Row: Base Score (Skor Utama) */}
            <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
              <td className="p-2.5 text-slate-900 sticky left-0 bg-slate-100 border-r border-slate-200 z-10">
                Skor Utama (Bobot Evaluasi)
              </td>
              <td className="p-2 text-center text-slate-500">100%</td>
              {months.map((m) => {
                const rep = reportByMonth[m.code];
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);
                return (
                  <td
                    key={m.code}
                    className={`p-2 text-center font-extrabold text-slate-800 ${
                      !isInRange ? 'opacity-40' : ''
                    }`}
                  >
                    {rep ? rep.baseScore.toFixed(2) : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-blue-900 bg-blue-100/80 border-l border-blue-200">
                {rangeBaseAvg > 0 ? rangeBaseAvg.toFixed(2) : '-'}
              </td>
              <td className="p-2 text-center font-black text-slate-900 bg-slate-200/80 border-l border-slate-300">
                {ytdBaseAvg > 0 ? ytdBaseAvg.toFixed(2) : '-'}
              </td>
            </tr>

            {/* Row: Merit Points */}
            <tr className="bg-emerald-50/50">
              <td className="p-2.5 text-emerald-900 font-bold sticky left-0 bg-emerald-50 border-r border-slate-200 z-10">
                Poin Merit (+)
              </td>
              <td className="p-2 text-center text-emerald-600 font-bold">+Bonus</td>
              {months.map((m) => {
                const rep = reportByMonth[m.code];
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);
                return (
                  <td
                    key={m.code}
                    className={`p-2 text-center font-extrabold text-emerald-700 ${
                      !isInRange ? 'opacity-40' : ''
                    }`}
                  >
                    {rep && rep.meritPoint > 0 ? `+${rep.meritPoint.toFixed(2)}` : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-emerald-900 bg-emerald-100/90 border-l border-emerald-200">
                {rangeMeritAvg > 0 ? `+${rangeMeritAvg.toFixed(2)}` : '-'}
              </td>
              <td className="p-2 text-center font-black text-emerald-800 bg-emerald-100/50 border-l border-emerald-200">
                {ytdMeritAvg > 0 ? `+${ytdMeritAvg.toFixed(2)}` : '-'}
              </td>
            </tr>

            {/* Row: Demerit Points */}
            <tr className="bg-rose-50/50">
              <td className="p-2.5 text-rose-900 font-bold sticky left-0 bg-rose-50 border-r border-slate-200 z-10">
                Poin Demerit (-)
              </td>
              <td className="p-2 text-center text-rose-600 font-bold">-Penalti</td>
              {months.map((m) => {
                const rep = reportByMonth[m.code];
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);
                return (
                  <td
                    key={m.code}
                    className={`p-2 text-center font-extrabold text-rose-700 ${
                      !isInRange ? 'opacity-40' : ''
                    }`}
                  >
                    {rep && rep.demeritPoint > 0 ? `-${rep.demeritPoint.toFixed(2)}` : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-rose-900 bg-rose-100/90 border-l border-rose-200">
                {rangeDemeritAvg > 0 ? `-${rangeDemeritAvg.toFixed(2)}` : '-'}
              </td>
              <td className="p-2 text-center font-black text-rose-800 bg-rose-100/50 border-l border-rose-200">
                {ytdDemeritAvg > 0 ? `-${ytdDemeritAvg.toFixed(2)}` : '-'}
              </td>
            </tr>

            {/* Row: Final Score MER */}
            <tr className="bg-blue-600 text-white font-black text-sm border-t-2 border-blue-700">
              <td className="p-3 sticky left-0 bg-blue-600 border-r border-blue-500 z-10">
                NILAI AKHIR MER
              </td>
              <td className="p-2 text-center text-blue-200 text-xs">Total</td>
              {months.map((m) => {
                const rep = reportByMonth[m.code];
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);
                return (
                  <td
                    key={m.code}
                    className={`p-2 text-center font-black ${
                      !isInRange ? 'opacity-40' : ''
                    }`}
                  >
                    {rep ? rep.finalScore.toFixed(2) : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black bg-blue-900 text-amber-300 border-l border-blue-800">
                {rangeFinalAvg > 0 ? rangeFinalAvg.toFixed(2) : '-'}
              </td>
              <td className="p-2 text-center font-black bg-slate-900 text-yellow-300 border-l border-slate-800">
                {ytdFinalAvg > 0 ? ytdFinalAvg.toFixed(2) : '-'}
              </td>
            </tr>

            {/* Row: Category Badge */}
            <tr className="bg-slate-50">
              <td className="p-2.5 text-slate-700 font-bold sticky left-0 bg-slate-50 border-r border-slate-200 z-10">
                Kategori Kinerja
              </td>
              <td className="p-2 text-center text-slate-400 text-[10px]">Badge</td>
              {months.map((m) => {
                const rep = reportByMonth[m.code];
                const isInRange =
                  parseInt(m.code, 10) >= parseInt(startMonth, 10) &&
                  parseInt(m.code, 10) <= parseInt(endMonth, 10);

                if (!rep) {
                  return (
                    <td
                      key={m.code}
                      className={`p-2 text-center text-slate-300 text-[10px] ${
                        !isInRange ? 'opacity-40' : ''
                      }`}
                    >
                      -
                    </td>
                  );
                }
                const badge = getScoreCategoryBadge(rep.finalScore);
                return (
                  <td
                    key={m.code}
                    className={`p-1.5 text-center ${
                      !isInRange ? 'opacity-40' : ''
                    }`}
                  >
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.color}`}
                      title={badge.label}
                    >
                      {badge.label}
                    </span>
                  </td>
                );
              })}
              <td className="p-2 text-center font-bold bg-blue-50/90 border-l border-blue-100">
                {rangeFinalAvg > 0 ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                      getScoreCategoryBadge(rangeFinalAvg).color
                    }`}
                  >
                    {getScoreCategoryBadge(rangeFinalAvg).label}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-2 text-center font-bold bg-slate-200/80 border-l border-slate-200">
                {ytdFinalAvg > 0 ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                      getScoreCategoryBadge(ytdFinalAvg).color
                    }`}
                  >
                    {getScoreCategoryBadge(ytdFinalAvg).label}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend Note & Click Hint */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[10px] text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <span className="font-bold text-slate-700 flex items-center space-x-1">
            <Info className="w-3 h-3 text-blue-600" />
            <span>Skala Nilai:</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>4 (Sangat Baik)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>3 (Baik)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>2 (Cukup)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>1 (Kurang)</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-blue-800 font-bold bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
          <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Klik angka nilai parameter pada tabel untuk melihat penyebab aktual & data riil</span>
        </div>
      </div>

      {/* Parameter Score Detail / Actual Cause Popup Modal */}
      {selectedScoreDetail && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedScoreDetail(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between relative">
              <div className="flex items-center space-x-3 pr-6">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
                    {selectedScoreDetail.parameter.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Periode: <strong className="text-blue-300">{selectedScoreDetail.monthName} {selectedScoreDetail.year}</strong> • <strong className="text-white">{employee.name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {(() => {
                const details = getParameterIndicatorDetails(
                  selectedScoreDetail.parameter,
                  selectedScoreDetail.report,
                  selectedScoreDetail.score
                );

                const score = selectedScoreDetail.score;
                let scoreBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                let levelLabel = 'Level 4: Sangat Baik / Memuaskan';
                if (score === 3) {
                  scoreBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
                  levelLabel = 'Level 3: Baik / Memenuhi Standar';
                } else if (score === 2) {
                  scoreBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                  levelLabel = 'Level 2: Cukup / Perlu Perhatian';
                } else if (score === 1) {
                  scoreBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  levelLabel = 'Level 1: Kurang / Perlu Evaluasi';
                }

                const contribution = ((score * selectedScoreDetail.parameter.weight) / 100).toFixed(2);

                return (
                  <>
                    {/* Score & Level Display Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Perolehan Nilai Parameter
                        </span>
                        <span className={`inline-block mt-1 text-xs font-black px-2.5 py-1 rounded-lg border ${scoreBadgeClass}`}>
                          {levelLabel}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline space-x-1 justify-end">
                          <span className="text-3xl font-black text-slate-900">
                            {score.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/ 4.0</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block font-medium">
                          Kontribusi: <strong className="text-blue-700">{contribution} Poin</strong>
                        </span>
                      </div>
                    </div>

                    {/* Prominent Highlight: Penyebab Aktual / Indikator Riil */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border-2 border-blue-300 rounded-xl p-4 shadow-xs space-y-2">
                      <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Penyebab Aktual & Indikator Riil</span>
                      </div>
                      <div className="bg-white/95 border border-blue-200 rounded-lg p-3 shadow-2xs">
                        <p className="text-base sm:text-lg font-black text-blue-950 leading-relaxed">
                          {details.indicatorText}
                        </p>
                      </div>
                      <p className="text-[11px] text-blue-700/80 font-medium">
                        Data aktual operasional yang menjadi dasar perolehan nilai parameter ini pada periode {selectedScoreDetail.monthName} {selectedScoreDetail.year}.
                      </p>
                    </div>

                    {/* Standard Rubric / Achieved Criteria */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kriteria Standar Evaluasi yang Terpenuhi</span>
                      </div>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-medium">
                        {details.criteriaText}
                      </p>
                    </div>

                    {/* Additional Metadata: Data Source & Evaluator */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Sumber Data Acuan
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {details.sourceText}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Penilai (Evaluator)
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5 truncate">
                          {selectedScoreDetail.report?.evaluatorName || employee.groupLeaderName || 'Group Leader'}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedScoreDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
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
