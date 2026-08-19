import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSettingsModal } from '../common/UserSettingsModal';
import { ProfileMenuDropdown } from '../common/ProfileMenuDropdown';
import { YtdParameterTable } from '../common/YtdParameterTable';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  getScoreCategoryBadge,
  getScoreFontColor,
  formatPeriodLabel,
} from '../../utils/calculations';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileDown,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  HardHat,
  ShieldAlert,
  ShieldCheck,
  Building,
  Settings,
  UserCheck,
  Maximize2,
  LogOut,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SubordinateViewProps {
  activeTab?: string;
}

export const SubordinateView: React.FC<SubordinateViewProps> = ({ activeTab = 'report' }) => {
  const {
    currentUser,
    employees,
    reports,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
    meritRules,
    demeritRules,
    logout,
  } = useApp();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  if (!currentUser) return null;

  // Resolve assigned Group Leader name & Head Coach name
  const assignedGL = employees.find(
    (e) => e.nik === currentUser.groupLeaderId || e.id === currentUser.groupLeaderId
  );
  const assignedGroupLeaderName = currentUser.groupLeaderName || assignedGL?.name || 'Ahmad Hidayat';

  const headCoachObj = employees.find((e) => e.role === 'head_coach');
  const headCoachName = headCoachObj ? headCoachObj.name : 'Dharmawan Kustanto';

  // Find report for current employee & period
  const currentReport = reports.find(
    (r) => r.nik === currentUser.nik && r.period === selectedPeriod
  );

  // YTD Reports sorted chronologically
  const ytdReports = reports
    .filter((r) => r.nik === currentUser.nik)
    .sort((a, b) => a.period.localeCompare(b.period));

  // Compute YTD average score
  const ytdAvgScore =
    ytdReports.length > 0
      ? (
          ytdReports.reduce((acc, r) => acc + r.finalScore, 0) /
          ytdReports.length
        ).toFixed(2)
      : '0.00';

  const isOperator = currentUser.category === 'Operator';
  const parameters = isOperator ? operatorParameters : nonomParameters;

  const currentBadge = currentReport
    ? getScoreCategoryBadge(currentReport.finalScore)
    : getScoreCategoryBadge(0);

  // Chart data for YTD trend
  const trendData = ytdReports.map((r) => ({
    period: formatPeriodLabel(r.period).split(' ')[0],
    score: r.finalScore,
    baseScore: r.baseScore,
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Subordinate Profile Bar */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 text-slate-800 shadow-md border border-white/80 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b42907]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
            {/* Avatar / Profile Photo */}
            <button
              type="button"
              onClick={() => setShowPhotoViewer(true)}
              className="relative group/avatar w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#b42907] via-[#d4380d] to-[#ff5e3a] flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 overflow-hidden border-2 border-white ring-4 ring-[#b42907]/10 hover:ring-[#b42907]/30 transition-all cursor-pointer"
              title="Klik untuk melihat foto profil besar"
            >
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform"
                />
              ) : (
                currentUser.name.charAt(0)
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 className="w-5 h-5" />
              </div>
            </button>

            {/* Symmetrical Profile Details Grid */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {currentUser.name}
                  </h2>
                  <span className="text-[11px] font-bold uppercase text-[#00668a] bg-[#00668a]/10 px-2 py-0.5 rounded-full">
                    {currentUser.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {currentUser.position || `${currentUser.category} - Area ${currentUser.department}`}
                </p>
              </div>

              {/* Symmetrical Key-Value Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl px-3.5 py-2 shadow-2xs">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">NIK:</span>
                  <span className="font-bold text-slate-800 font-mono truncate">{currentUser.nik}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">Group Leader:</span>
                  <span className="font-bold text-slate-800 truncate">{assignedGroupLeaderName}</span>
                </div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">Head Coach:</span>
                  <span className="font-bold text-slate-800 truncate">{headCoachName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab={settingsTab}
      />

      {activeTab === 'report' && (
        <>
          {/* Main Score Summary Header */}
          {currentReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Score Display Card */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 text-slate-800 shadow-md border border-white/80 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#b42907]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-xs font-bold text-[#b42907] uppercase tracking-wider flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Periode MER {formatPeriodLabel(selectedPeriod)}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      Rapor Kinerja Individu
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border shadow-2xs ${currentBadge.badgeClass}`}
                  >
                    {currentBadge.label}
                  </span>
                </div>

                <div className="my-6 flex items-baseline space-x-3 relative z-10">
                  <span className={`text-5xl sm:text-6xl font-black ${getScoreFontColor(currentReport.finalScore).tailwindClass} tracking-tight`}>
                    {currentReport.finalScore.toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    / 4.00 (Skor Maksimal)
                  </span>
                </div>

                {/* Formula breakdown metrics pills */}
                <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/60 text-center relative z-10">
                  <div className="bg-white/80 p-3 rounded-2xl border border-white/90 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Base Score</p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {currentReport.baseScore.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60 shadow-2xs">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      Poin Merit (+)
                    </p>
                    <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                      +{currentReport.meritPoint.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200/60 shadow-2xs">
                    <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">
                      Poin Demerit (-)
                    </p>
                    <p className="text-base font-extrabold text-rose-800 mt-0.5">
                      -{currentReport.demeritPoint.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* YTD Summary Card */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 text-slate-800 shadow-md border border-white/80 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#00668a]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <span className="text-xs font-bold text-[#00668a] uppercase tracking-wider flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                    Performa Year-to-Date (YTD)
                  </span>
                  <p className="text-3xl font-black text-slate-900 mt-2">
                    {ytdAvgScore}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      Rata-rata 2026
                    </span>
                  </p>
                </div>

                <div className="mt-6 space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Jumlah Periode:</span>
                    <strong className="text-slate-800 font-bold font-mono">
                      {ytdReports.length} Bulan
                    </strong>
                  </div>

                  <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#00668a] to-[#40c2fd] h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (parseFloat(ytdAvgScore) / 4) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center text-slate-500 shadow-md border border-white/80">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">
                Rapor MER Belum Diinput
              </h3>
              <p className="text-xs max-w-md mx-auto mt-1 text-slate-500">
                Data MER untuk periode {formatPeriodLabel(selectedPeriod)} belum dimasukkan oleh Admin atau Group Leader. Silakan pilih periode sebelumnya.
              </p>
            </div>
          )}

          {/* Parameter Details (Card Based Mobile-First) */}
          {currentReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-[#b42907]" />
                  <span>Rincian Nilai Parameter MER ({isOperator ? 'Operator' : 'Nonom'})</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  Skala Nilai 1 - 4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {parameters.map((param) => {
                  const scoreVal = currentReport.scores[param.id] || 0;
                  const criterionText =
                    param.criteria[scoreVal as 1 | 2 | 3 | 4] ||
                    'Belum dinilai';
                  const contribution = (
                    scoreVal *
                    (param.weight / 100)
                  ).toFixed(2);

                  return (
                    <div
                      key={param.id}
                      className="glass-panel rounded-3xl p-5 sm:p-6 text-slate-800 shadow-md border border-white/80 transition-all flex flex-col justify-between hover:shadow-lg hover:border-[#b42907]/30"
                    >
                      <div>
                        {/* Header parameter name & weight */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#b42907] bg-[#b42907]/10 px-2.5 py-1 rounded-full border border-[#b42907]/20">
                              Bobot {param.weight}%
                            </span>
                            <h4 className="font-extrabold text-base mt-2 text-slate-900">
                              {param.name}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-3xl font-black text-[#b42907]">
                              {scoreVal}
                            </span>
                            <span className="text-xs text-slate-400 font-bold block">
                              / 4.0
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          {param.description}
                        </p>

                        {/* Visual score bar (1-4 steps) */}
                        <div className="grid grid-cols-4 gap-1.5 my-3.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-2.5 rounded-full transition-all ${
                                step <= scoreVal
                                  ? step === 4
                                    ? 'bg-emerald-500'
                                    : step === 3
                                    ? 'bg-[#00668a]'
                                    : step === 2
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                  : 'bg-slate-200/60'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Criteria description box */}
                        <div className="bg-white/80 p-3.5 rounded-2xl border border-white/90 text-xs shadow-2xs">
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Kriteria Tercapai:
                          </p>
                          <p className="text-slate-800 font-semibold leading-relaxed">
                            {criterionText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium">Poin Kontribusi MER:</span>
                        <span className="font-extrabold text-[#b42907] font-mono text-sm">
                          +{contribution}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Merit & Demerit Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {/* Merit Section */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 text-slate-800 shadow-md border border-white/80">
                  <div className="flex items-center space-x-2 text-emerald-600 font-extrabold mb-3.5 pb-2.5 border-b border-slate-200/60">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="text-sm uppercase tracking-wider">Merit Points (Penambah Score)</h4>
                  </div>

                  {currentReport.meritItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentReport.meritItems.map((meritId) => {
                        const rule = meritRules.find((m) => m.id === meritId);
                        if (!rule) return null;
                        return (
                          <div
                            key={rule.id}
                            className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-2xl flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div>
                              <p className="font-extrabold text-emerald-950">
                                {rule.label}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {rule.description}
                              </p>
                            </div>
                            <span className="font-black text-emerald-700 text-sm ml-2 font-mono">
                              +{rule.points.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}

                      <p className="text-[10px] text-slate-500 italic mt-2">
                        *Sesuai rule PRD: Diambil nilai merit tertinggi (+
                        {currentReport.meritPoint.toFixed(1)}) dalam periode ini.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Tidak ada Poin Merit pada periode ini.
                    </p>
                  )}
                </div>

                {/* Demerit Section */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 text-slate-800 shadow-md border border-white/80">
                  <div className="flex items-center space-x-2 text-rose-600 font-extrabold mb-3.5 pb-2.5 border-b border-slate-200/60">
                    <ShieldAlert className="w-5 h-5" />
                    <h4 className="text-sm uppercase tracking-wider">Demerit Points (Pengurang Score)</h4>
                  </div>

                  {currentReport.demeritItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentReport.demeritItems.map((demeritId) => {
                        const rule = demeritRules.find((d) => d.id === demeritId);
                        if (!rule) return null;
                        return (
                          <div
                            key={rule.id}
                            className="bg-rose-50/80 border border-rose-200/80 p-3 rounded-2xl flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div>
                              <p className="font-extrabold text-rose-950">
                                {rule.label}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {rule.description}
                              </p>
                            </div>
                            <span className="font-black text-rose-700 text-sm ml-2 font-mono">
                              -{rule.points.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}

                      <p className="text-[10px] text-slate-500 italic mt-2">
                        *Sesuai rule PRD: Diambil nilai demerit terbesar (-
                        {currentReport.demeritPoint.toFixed(1)}) dalam periode ini.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Tidak ada Poin Demerit (Catatan Bersih).
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* YTD Trends Tab */}
      {activeTab === 'trends' && currentUser && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 text-slate-800 shadow-md border border-white/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#b42907]" />
                  <span>Grafik Tren Performa MER</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Riwayat perbandingan skor bulanan
                </p>
              </div>
              <span className="text-xs font-black text-[#b42907] bg-[#b42907]/10 px-3.5 py-1.5 rounded-full border border-[#b42907]/20">
                Rata-rata YTD: {ytdAvgScore}
              </span>
            </div>

            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 4.5]} stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#e2e8f0',
                      borderRadius: '1rem',
                      color: '#0f172a',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Skor Akhir MER"
                    stroke="#b42907"
                    strokeWidth={3}
                    dot={{ fill: '#b42907', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseScore"
                    name="Base Score"
                    stroke="#00668a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rapor Transparansi YTD Tabel Parameter */}
          <YtdParameterTable
            employee={currentUser}
            reports={reports}
            operatorParameters={operatorParameters}
            nonomParameters={nonomParameters}
            selectedYear="2026"
          />
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 text-slate-800 shadow-md border border-white/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Profil Karyawan
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Nama Lengkap:</span>
              <p className="font-extrabold text-base text-slate-900 mt-1">
                {currentUser.name}
              </p>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">NIK:</span>
              <p className="font-extrabold text-base text-[#b42907] font-mono mt-1">
                {currentUser.nik}
              </p>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Jabatan:</span>
              <p className="font-extrabold text-base text-slate-900 mt-1">
                {currentUser.position}
              </p>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Area Kerja:</span>
              <p className="font-extrabold text-base text-slate-900 mt-1">
                {currentUser.department}
              </p>
            </div>
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Kategori:</span>
              <p className="font-extrabold text-base text-slate-900 mt-1">
                {currentUser.category}
              </p>
            </div>
            {currentUser.equipmentType && (
              <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  Pengoperasian Alat Berat:
                </span>
                <p className="font-extrabold text-base text-[#00668a] mt-1">
                  {currentUser.equipmentType}
                </p>
              </div>
            )}
            <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Atasan (Group Leader):</span>
              <p className="font-extrabold text-base text-slate-900 mt-1">
                {currentUser.groupLeaderName || 'Ahmad Hidayat'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subordinate Profile Photo Viewer Modal */}
      <PhotoViewerModal
        employee={showPhotoViewer ? currentUser : null}
        onClose={() => setShowPhotoViewer(false)}
      />
    </div>
  );
};
