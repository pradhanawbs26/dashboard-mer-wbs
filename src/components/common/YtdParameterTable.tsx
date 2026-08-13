import React, { useState } from 'react';
import { Employee, MonthlyReport, DynamicParameter } from '../../types';
import { getScoreCategoryBadge, formatPeriodLabel } from '../../utils/calculations';
import { Calendar, FileSpreadsheet, Award, CheckCircle2, TrendingUp, Info } from 'lucide-react';

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

  const months = [
    { code: '01', name: 'Jan' },
    { code: '02', name: 'Feb' },
    { code: '03', name: 'Mar' },
    { code: '04', name: 'Apr' },
    { code: '05', name: 'Mei' },
    { code: '06', name: 'Jun' },
    { code: '07', name: 'Jul' },
    { code: '08', name: 'Ags' },
    { code: '09', name: 'Sep' },
    { code: '10', name: 'Okt' },
    { code: '11', name: 'Nov' },
    { code: '12', name: 'Des' },
  ];

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

  // Calculate YTD averages
  const validReports = Object.values(reportByMonth).filter(
    (r): r is MonthlyReport => r !== undefined
  );

  const ytdFinalAvg =
    validReports.length > 0
      ? validReports.reduce((acc, r) => acc + r.finalScore, 0) / validReports.length
      : 0;

  const ytdBaseAvg =
    validReports.length > 0
      ? validReports.reduce((acc, r) => acc + r.baseScore, 0) / validReports.length
      : 0;

  const ytdMeritAvg =
    validReports.length > 0
      ? validReports.reduce((acc, r) => acc + r.meritPoint, 0) / validReports.length
      : 0;

  const ytdDemeritAvg =
    validReports.length > 0
      ? validReports.reduce((acc, r) => acc + r.demeritPoint, 0) / validReports.length
      : 0;

  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'monthly' | 'table'>('cards');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-6 text-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
              Rapor YTD Transparansi Parameter ({currentYear})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Karyawan: <strong className="text-slate-800">{employee.name}</strong> (NIK: {employee.nik}) • {employee.department} • {employee.category}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <span className="font-bold text-slate-700 mr-1.5">Tahun:</span>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* YTD Summary Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-blue-50/90 border border-blue-200 p-2.5 sm:p-3 rounded-xl">
          <span className="text-[10px] text-blue-600 font-bold uppercase block truncate">
            Rerata Skor YTD
          </span>
          <span className="text-base sm:text-lg font-black text-blue-900">
            {ytdFinalAvg > 0 ? ytdFinalAvg.toFixed(2) : '-'} <span className="text-[10px] sm:text-xs font-normal text-slate-500">/ 4.00</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase block truncate">
            Rerata Skor Utama
          </span>
          <span className="text-base sm:text-lg font-extrabold text-slate-800">
            {ytdBaseAvg > 0 ? ytdBaseAvg.toFixed(2) : '-'}
          </span>
        </div>

        <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 sm:p-3 rounded-xl">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block truncate">
            Rerata Merit (+)
          </span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-800">
            +{ytdMeritAvg.toFixed(2)}
          </span>
        </div>

        <div className="bg-rose-50/90 border border-rose-200 p-2.5 sm:p-3 rounded-xl">
          <span className="text-[10px] text-rose-700 font-bold uppercase block truncate">
            Rerata Demerit (-)
          </span>
          <span className="text-base sm:text-lg font-extrabold text-rose-800">
            -{ytdDemeritAvg.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Mobile-Only View Switcher Pills */}
      <div className="flex sm:hidden items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
        <button
          onClick={() => setMobileViewMode('cards')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
            mobileViewMode === 'cards'
              ? 'bg-white text-blue-600 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Card Parameter
        </button>
        <button
          onClick={() => setMobileViewMode('monthly')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
            mobileViewMode === 'monthly'
              ? 'bg-white text-blue-600 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ringkasan Bulanan
        </button>
        <button
          onClick={() => setMobileViewMode('table')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
            mobileViewMode === 'table'
              ? 'bg-white text-blue-600 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tabel Matriks
        </button>
      </div>

      {/* MOBILE SCORE CARDS VIEW: Parameter Cards (Default on Mobile) */}
      {mobileViewMode === 'cards' && (
        <div className="block sm:hidden space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-bold text-slate-700">Rincian Per Parameter Evaluasi:</span>
            <span>{parameters.length} Parameter</span>
          </div>

          {parameters.map((param) => {
            // Calculate parameter YTD avg
            const paramScores = validReports
              .map((r) => r.scores[param.id])
              .filter((s): s is number => typeof s === 'number');

            const paramAvg =
              paramScores.length > 0
                ? paramScores.reduce((a, b) => a + b, 0) / paramScores.length
                : 0;

            return (
              <div
                key={param.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-slate-800 shadow-xs space-y-2.5"
              >
                {/* Card Title & YTD Avg */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      Bobot {param.weight}%
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                      {param.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Rerata YTD</span>
                    <span className="text-base font-black text-blue-600">
                      {paramAvg > 0 ? paramAvg.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>

                {/* 12 Months Score Badge Chips Grid */}
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                    Nilai Bulanan ({currentYear}):
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {months.map((m) => {
                      const rep = reportByMonth[m.code];
                      const score = rep?.scores[param.id];

                      let badgeClass = 'bg-slate-100 text-slate-400 border-slate-200';
                      if (score === 4) badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black';
                      if (score === 3) badgeClass = 'bg-blue-100 text-blue-800 border-blue-300 font-black';
                      if (score === 2) badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-black';
                      if (score === 1) badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-black';

                      return (
                        <div
                          key={m.code}
                          className={`p-1 rounded-lg border text-[10px] flex flex-col items-center justify-center ${badgeClass}`}
                        >
                          <span className="text-[9px] opacity-75">{m.name}</span>
                          <span className="text-xs">{score !== undefined ? score.toFixed(1) : '-'}</span>
                        </div>
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
            Rapor MER Per Bulan ({currentYear}):
          </span>

          {months.map((m) => {
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
      <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'} overflow-x-auto rounded-xl border border-slate-200`}>
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-800 text-slate-100 font-bold">
              <th className="p-3 border-b border-slate-700 w-52 sticky left-0 bg-slate-800 z-10">
                Parameter Evaluasi
              </th>
              <th className="p-2 border-b border-slate-700 text-center w-14">
                Bobot
              </th>
              {months.map((m) => (
                <th
                  key={m.code}
                  className="p-2 border-b border-slate-700 text-center w-12"
                >
                  {m.name}
                </th>
              ))}
              <th className="p-2 border-b border-slate-700 text-center w-16 bg-slate-900 text-blue-300 font-black">
                Rerata
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {/* Dynamic Parameter Rows */}
            {parameters.map((param) => {
              // Calculate parameter YTD avg
              const paramScores = validReports
                .map((r) => r.scores[param.id])
                .filter((s): s is number => typeof s === 'number');

              const paramAvg =
                paramScores.length > 0
                  ? paramScores.reduce((a, b) => a + b, 0) / paramScores.length
                  : 0;

              return (
                <tr key={param.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 shadow-sm">
                    <div className="truncate max-w-[200px]" title={param.name}>
                      {param.name}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      [{param.code}]
                    </span>
                  </td>
                  <td className="p-2 text-center font-bold text-blue-600 bg-slate-50/50">
                    {param.weight}%
                  </td>

                  {/* Monthly Score Cells */}
                  {months.map((m) => {
                    const rep = reportByMonth[m.code];
                    const score = rep?.scores[param.id];

                    if (score === undefined || score === null) {
                      return (
                        <td
                          key={m.code}
                          className="p-2 text-center text-slate-300 font-mono text-[11px]"
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
                      <td key={m.code} className="p-1.5 text-center">
                        <span
                          className={`inline-block w-8 py-0.5 rounded text-[11px] font-black border ${badgeBg}`}
                          title={`Level ${score} (${score.toFixed(1)})`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}

                  <td className="p-2 text-center font-black text-slate-900 bg-slate-100/80">
                    {paramAvg > 0 ? paramAvg.toFixed(2) : '-'}
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
                return (
                  <td key={m.code} className="p-2 text-center font-extrabold text-slate-800">
                    {rep ? rep.baseScore.toFixed(2) : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-slate-900 bg-slate-200/80">
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
                return (
                  <td key={m.code} className="p-2 text-center font-extrabold text-emerald-700">
                    {rep && rep.meritPoint > 0 ? `+${rep.meritPoint.toFixed(2)}` : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-emerald-800 bg-emerald-100/80">
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
                return (
                  <td key={m.code} className="p-2 text-center font-extrabold text-rose-700">
                    {rep && rep.demeritPoint > 0 ? `-${rep.demeritPoint.toFixed(2)}` : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black text-rose-800 bg-rose-100/80">
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
                return (
                  <td key={m.code} className="p-2 text-center font-black">
                    {rep ? rep.finalScore.toFixed(2) : '-'}
                  </td>
                );
              })}
              <td className="p-2 text-center font-black bg-blue-800 text-yellow-300">
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
                if (!rep) {
                  return (
                    <td key={m.code} className="p-2 text-center text-slate-300 text-[10px]">
                      -
                    </td>
                  );
                }
                const badge = getScoreCategoryBadge(rep.finalScore);
                return (
                  <td key={m.code} className="p-1.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.color}`}
                      title={badge.label}
                    >
                      {badge.label}
                    </span>
                  </td>
                );
              })}
              <td className="p-2 text-center font-bold bg-slate-200/80">
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

      {/* Legend Note */}
      <div className="flex items-center space-x-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-y-1">
        <span className="font-bold text-slate-700 flex items-center space-x-1">
          <Info className="w-3 h-3 text-blue-600" />
          <span>Keterangan Skala Level Parameter:</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Level 4 (Sangat Baik / 4.0)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Level 3 (Baik / 3.0)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Level 2 (Cukup / 2.0)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Level 1 (Kurang / 1.0)</span>
        </span>
      </div>
    </div>
  );
};
