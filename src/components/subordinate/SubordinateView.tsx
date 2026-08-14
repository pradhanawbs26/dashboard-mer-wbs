import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSettingsModal } from '../common/UserSettingsModal';
import { ProfileMenuDropdown } from '../common/ProfileMenuDropdown';
import { YtdParameterTable } from '../common/YtdParameterTable';
import {
  getScoreCategoryBadge,
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
  } = useApp();

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'photo' | 'password'>('photo');

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
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs shrink-0 overflow-hidden border-2 border-blue-100">
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentUser.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  NIK: {currentUser.nik}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {currentUser.position}
              </p>

              {/* Group Leader & Head Coach Clean Container */}
              <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Group Leader:</span>
                  <span className="font-bold text-slate-900 truncate">{assignedGroupLeaderName}</span>
                </div>
                <div className="hidden sm:block text-slate-300">•</div>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Head Coach:</span>
                  <span className="font-bold text-slate-900 truncate">{headCoachName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            {activeTab === 'report' && (
              <button
                onClick={() => setShowPrintModal(true)}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rapor MER</span>
              </button>
            )}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Score Display Card */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Periode MER {formatPeriodLabel(selectedPeriod)}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      Rapor Kinerja Individu
                    </h3>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold border ${currentBadge.badgeClass}`}
                  >
                    {currentBadge.label}
                  </span>
                </div>

                <div className="my-6 flex items-baseline space-x-3">
                  <span className="text-4xl sm:text-5xl font-black text-blue-600">
                    {currentReport.finalScore.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    / 4.00 (Skor Maksimal)
                  </span>
                </div>

                {/* Formula breakdown metrics pills */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium">Base Score</p>
                    <p className="text-sm font-bold text-slate-800">
                      {currentReport.baseScore.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Poin Merit (+)
                    </p>
                    <p className="text-sm font-bold text-emerald-800">
                      +{currentReport.meritPoint.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <p className="text-[10px] text-rose-700 font-medium">
                      Poin Demerit (-)
                    </p>
                    <p className="text-sm font-bold text-rose-800">
                      -{currentReport.demeritPoint.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* YTD Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                    Performa Year-to-Date (YTD)
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    {ytdAvgScore}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      Rata-rata 2026
                    </span>
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-500">
                    Jumlah Periode Evaluasi:{' '}
                    <strong className="text-slate-800">
                      {ytdReports.length} Bulan
                    </strong>
                  </p>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-500"
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
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Rincian Nilai Parameter MER ({isOperator ? 'Operator' : 'Nonom'})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Skala Nilai 1 - 4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 text-slate-800 shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header parameter name & weight */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Bobot {param.weight}%
                            </span>
                            <h4 className="font-bold text-base mt-1 text-slate-900">
                              {param.name}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-blue-600">
                              {scoreVal}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold block">
                              / 4.0
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                          {param.description}
                        </p>

                        {/* Visual score bar (1-4 steps) */}
                        <div className="grid grid-cols-4 gap-1.5 my-3">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-2 rounded-full transition-all ${
                                step <= scoreVal
                                  ? step === 4
                                    ? 'bg-emerald-600'
                                    : step === 3
                                    ? 'bg-blue-600'
                                    : step === 2
                                    ? 'bg-amber-500'
                                    : 'bg-rose-600'
                                  : 'bg-slate-100'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Criteria description box */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                          <p className="text-slate-400 text-[10px] font-semibold uppercase mb-1">
                            Kriteria Tercapai:
                          </p>
                          <p className="text-slate-800 font-medium leading-relaxed">
                            {criterionText}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Poin Kontribusi MER:</span>
                        <span className="font-bold text-slate-800">
                          +{contribution}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Merit & Demerit Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Merit Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold mb-3 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-5 h-5" />
                    <h4>Merit Points (Penambah Score)</h4>
                  </div>

                  {currentReport.meritItems.length > 0 ? (
                    <div className="space-y-2">
                      {currentReport.meritItems.map((meritId) => {
                        const rule = meritRules.find((m) => m.id === meritId);
                        if (!rule) return null;
                        return (
                          <div
                            key={rule.id}
                            className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-emerald-900">
                                {rule.label}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {rule.description}
                              </p>
                            </div>
                            <span className="font-extrabold text-emerald-700 text-sm ml-2">
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
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm">
                  <div className="flex items-center space-x-2 text-rose-600 font-bold mb-3 pb-2 border-b border-slate-100">
                    <ShieldAlert className="w-5 h-5" />
                    <h4>Demerit Points (Pengurang Score)</h4>
                  </div>

                  {currentReport.demeritItems.length > 0 ? (
                    <div className="space-y-2">
                      {currentReport.demeritItems.map((demeritId) => {
                        const rule = demeritRules.find((d) => d.id === demeritId);
                        if (!rule) return null;
                        return (
                          <div
                            key={rule.id}
                            className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-rose-900">
                                {rule.label}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {rule.description}
                              </p>
                            </div>
                            <span className="font-extrabold text-rose-700 text-sm ml-2">
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Grafik Tren Performa MER</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Riwayat perbandingan skor bulanan
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
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
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Skor Akhir MER"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseScore"
                    name="Base Score"
                    stroke="#64748b"
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-blue-600">
              Profil Karyawan Batubara
            </h3>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Pengaturan Foto Profil & Password Akun"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Pengaturan Akun</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Nama Lengkap:</span>
              <p className="font-bold text-sm text-slate-900 mt-1">
                {currentUser.name}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">NIK:</span>
              <p className="font-bold text-sm text-blue-600 mt-1">
                {currentUser.nik}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Jabatan:</span>
              <p className="font-bold text-sm text-slate-900 mt-1">
                {currentUser.position}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Area Kerja:</span>
              <p className="font-bold text-sm text-slate-900 mt-1">
                {currentUser.department}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Kategori:</span>
              <p className="font-bold text-sm text-slate-900 mt-1">
                {currentUser.category}
              </p>
            </div>
            {currentUser.equipmentType && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">
                  Pengoperasian Alat Berat:
                </span>
                <p className="font-bold text-sm text-blue-600 mt-1">
                  {currentUser.equipmentType}
                </p>
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Atasan (Group Leader):</span>
              <p className="font-bold text-sm text-slate-900 mt-1">
                {currentUser.groupLeaderName || 'Ahmad Hidayat'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print/Download Modal View */}
      {showPrintModal && currentReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
            {/* Printable Report Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img
                    src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
                    alt="Logo MER"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    MONTHLY EMPLOYEE REPORT (MER)
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    PT. Wahana Bara Sentosa
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {formatPeriodLabel(selectedPeriod)}
                </span>
              </div>
            </div>

            {/* Employee Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500">Nama Karyawan:</p>
                <p className="font-bold text-slate-900">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-slate-500">NIK:</p>
                <p className="font-bold text-slate-900">{currentUser.nik}</p>
              </div>
              <div>
                <p className="text-slate-500">Jabatan:</p>
                <p className="font-bold text-slate-900">{currentUser.position}</p>
              </div>
              <div>
                <p className="text-slate-500">Area Kerja:</p>
                <p className="font-bold text-slate-900">{currentUser.department}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Kategori / Alat Berat:</p>
                <p className="font-bold text-slate-900">
                  {currentUser.category}{' '}
                  {currentUser.equipmentType ? `(${currentUser.equipmentType})` : ''}
                </p>
              </div>
            </div>

            {/* Score Summary Box */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase">
                  Skor Akhir MER:
                </p>
                <p className="text-3xl font-black text-amber-400">
                  {currentReport.finalScore.toFixed(2)}{' '}
                  <span className="text-xs text-slate-300 font-normal">/ 4.00</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-amber-500 text-slate-950 px-3 py-1 rounded-full">
                  {getScoreCategoryBadge(currentReport.finalScore).label}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Base: {currentReport.baseScore.toFixed(2)} | Merit: +
                  {currentReport.meritPoint.toFixed(2)} | Demerit: -
                  {currentReport.demeritPoint.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Parameter Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 font-bold">Parameter</th>
                  <th className="p-2 font-bold text-center">Bobot</th>
                  <th className="p-2 font-bold text-center">Nilai (1-4)</th>
                  <th className="p-2 font-bold">Kriteria Terpenuhi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {parameters.map((p) => {
                  const val = currentReport.scores[p.id] || 0;
                  return (
                    <tr key={p.id}>
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2 text-center">{p.weight}%</td>
                      <td className="p-2 text-center font-bold text-blue-600">
                        {val}
                      </td>
                      <td className="p-2 text-slate-600">
                        {p.criteria[val as 1 | 2 | 3 | 4] || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Download PDF</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl"
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
