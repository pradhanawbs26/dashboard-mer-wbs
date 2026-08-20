import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getScoreCategoryBadge,
  getScoreFontColor,
  formatPeriodLabel,
} from '../../utils/calculations';
import {
  Printer,
  FileText,
  UserCheck,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building,
  HardHat,
  Award,
} from 'lucide-react';

export const AdminPrintReport: React.FC = () => {
  const {
    currentUser,
    employees,
    reports,
    selectedPeriod,
    setSelectedPeriod,
    operatorParameters,
    nonomParameters,
  } = useApp();

  const periods = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: '2026-03', label: 'Maret 2026' },
    { value: '2026-02', label: 'Februari 2026' },
    { value: '2026-01', label: 'Januari 2026' },
  ];

  // Scoping according to user role
  const isGL = currentUser?.role === 'group_leader';
  const isHC = currentUser?.role === 'head_coach';

  // Group leaders in scope
  const groupLeaders = React.useMemo(() => {
    const allGroupLeaders = employees.filter((e) => e.role === 'group_leader');
    if (isGL) {
      return allGroupLeaders.filter((gl) => gl.nik === currentUser?.nik || gl.id === currentUser?.id);
    }
    if (isHC) {
      return allGroupLeaders.filter(
        (gl) =>
          gl.groupLeaderId === currentUser?.nik ||
          gl.groupLeaderId === currentUser?.id ||
          gl.groupLeaderName === currentUser?.name
      );
    }
    return allGroupLeaders;
  }, [employees, isGL, isHC, currentUser?.nik, currentUser?.id, currentUser?.name]);

  // Subordinates in scope
  const subordinates = React.useMemo(() => {
    const allSubordinates = employees.filter((e) => e.role === 'subordinate');
    if (isGL) {
      return allSubordinates.filter(
        (s) => s.groupLeaderId === currentUser?.nik || s.groupLeaderName === currentUser?.name
      );
    }
    if (isHC) {
      return allSubordinates.filter((s) =>
        groupLeaders.some((gl) => s.groupLeaderId === gl.nik || s.groupLeaderName === gl.name)
      );
    }
    return allSubordinates;
  }, [employees, isGL, isHC, groupLeaders, currentUser?.nik, currentUser?.name]);

  const headCoachObj = employees.find((e) => e.role === 'head_coach');
  const headCoachName = isHC
    ? currentUser?.name
    : headCoachObj
    ? headCoachObj.name
    : 'Dharmawan Kustanto';

  // State
  const [printMode, setPrintMode] = useState<'SUBORDINATE' | 'GROUP_LEADER'>('SUBORDINATE');
  const [selectedSubNik, setSelectedSubNik] = useState<string>(subordinates[0]?.nik || '');
  const [selectedGlNik, setSelectedGlNik] = useState<string>(groupLeaders[0]?.nik || '');
  const [printPeriod, setPrintPeriod] = useState<string>(selectedPeriod || '2026-08');

  // Ensure selected Sub / GL are valid within scope
  React.useEffect(() => {
    if (subordinates.length > 0 && !subordinates.some((s) => s.nik === selectedSubNik)) {
      setSelectedSubNik(subordinates[0]?.nik || '');
    }
  }, [subordinates, selectedSubNik]);

  React.useEffect(() => {
    if (groupLeaders.length > 0 && !groupLeaders.some((gl) => gl.nik === selectedGlNik)) {
      setSelectedGlNik(groupLeaders[0]?.nik || '');
    }
  }, [groupLeaders, selectedGlNik]);

  // Resolve active Group Leader
  const activeGL = groupLeaders.find((gl) => gl.nik === selectedGlNik) || groupLeaders[0];

  // Target subordinates for printing
  const targetEmployees =
    printMode === 'SUBORDINATE'
      ? subordinates.filter((s) => s.nik === selectedSubNik)
      : subordinates.filter(
          (s) => s.groupLeaderId === activeGL?.nik || s.groupLeaderName === activeGL?.name
        );

  const evaluatedEmployees = targetEmployees.filter((emp) =>
    reports.some((r) => r.nik === emp.nik && r.period === printPeriod)
  );
  const unEvaluatedEmployees = targetEmployees.filter(
    (emp) => !reports.some((r) => r.nik === emp.nik && r.period === printPeriod)
  );

  // Function to handle browser window print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:p-0 print:m-0 print:space-y-0">
      {/* Header & Controls Card (Hidden during actual print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-slate-800 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pencetakan Rapor MER
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isGL
                ? `Mencetak Rapor MER anggota tim (${subordinates.length} karyawan subordinat)`
                : isHC
                ? `Mencetak Rapor MER tim di bawah naungan ${currentUser?.name || 'Head Coach'}`
                : 'Mencetak Rapor MER secara individu maupun seluruh tim Group Leader'}
            </p>
          </div>

          <button
            onClick={handlePrint}
            disabled={evaluatedEmployees.length === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download PDF</span>
          </button>
        </div>

        {/* Configuration Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-5">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Tipe Cetak Rapor:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('SUBORDINATE')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  printMode === 'SUBORDINATE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Individu</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('GROUP_LEADER')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  printMode === 'GROUP_LEADER'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isGL ? 'Semua Anggota Tim' : 'Group Leader (Tim)'}</span>
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Periode Bulan Evaluasi:
            </label>
            <div className="relative">
              <select
                value={printPeriod}
                onChange={(e) => {
                  setPrintPeriod(e.target.value);
                  setSelectedPeriod(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {printMode === 'SUBORDINATE'
                ? '3. Pilih Subordinat / Karyawan:'
                : isGL
                ? '3. Group Leader Aktif:'
                : '3. Pilih Group Leader:'}
            </label>
            {printMode === 'SUBORDINATE' ? (
              <select
                value={selectedSubNik}
                onChange={(e) => setSelectedSubNik(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {subordinates.length === 0 ? (
                  <option value="">Tidak ada anggota subordinat</option>
                ) : (
                  [...subordinates]
                    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
                    .map((sub) => (
                      <option key={sub.id} value={sub.nik}>
                        {sub.name} (NIK: {sub.nik}) {sub.position ? `- ${sub.position}` : ''}
                      </option>
                    ))
                )}
              </select>
            ) : isGL ? (
              <div className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800">
                {currentUser?.name} (Tim GL Anda - {subordinates.length} Anggota)
              </div>
            ) : (
              <select
                value={selectedGlNik}
                onChange={(e) => setSelectedGlNik(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {groupLeaders.map((gl) => {
                  const teamCount = subordinates.filter(
                    (s) => s.groupLeaderId === gl.nik || s.groupLeaderName === gl.name
                  ).length;
                  return (
                    <option key={gl.id} value={gl.nik}>
                      {gl.name} (GL {gl.department}) - {teamCount} Anggota
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {/* Informational Status Banner */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {printMode === 'SUBORDINATE' ? (
                <>
                  Siap mencetak <strong>1 lembar Rapor MER individu</strong> untuk karyawan{' '}
                  <strong className="underline">{subordinates.find((s) => s.nik === selectedSubNik)?.name}</strong> (Periode {formatPeriodLabel(printPeriod)})
                </>
              ) : (
                <>
                  Siap mencetak <strong>{evaluatedEmployees.length} dari {targetEmployees.length} Rapor MER anggota tim</strong> di bawah Group Leader{' '}
                  <strong className="underline">{activeGL?.name}</strong> (Periode {formatPeriodLabel(printPeriod)}).
                </>
              )}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-800 shrink-0 bg-white/80 px-2.5 py-0.5 rounded border border-blue-200">
            Format: A4 Portrait (1 Rapor / Lembar)
          </span>
        </div>
      </div>

      {/* Printable Area - List of Report Cards */}
      <div className="space-y-8 print:space-y-0 mer-print-container">
        {/* Evaluated Report Pages */}
        {evaluatedEmployees.map((emp, index) => {
          const rep = reports.find(
            (r) => r.nik === emp.nik && r.period === printPeriod
          );

          if (!rep) return null;

          const isOperator = emp.category === 'Operator';
          const parameters = isOperator ? operatorParameters : nonomParameters;
          const badge = getScoreCategoryBadge(rep.finalScore);
          const scoreFont = getScoreFontColor(rep.finalScore);
          const isLastItem = index === evaluatedEmployees.length - 1;

          return (
            <div
              key={emp.id}
              className={`printable-mer-card mer-print-page bg-white text-slate-900 border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-8 shadow-lg max-w-4xl mx-auto flex flex-col justify-between print:shadow-none print:border-[1.5px] print:border-slate-900 print:p-5 print:m-0 print:rounded-none print:w-full print:max-w-none print:bg-white print:break-inside-avoid ${
                isLastItem ? 'print:break-after-auto' : 'print:break-after-page'
              }`}
            >
              {/* Top Section */}
              <div className="space-y-4 sm:space-y-5 print:space-y-3">
                {/* Header Title */}
                <header className="mer-print-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 border-b-2 border-slate-900/10 pb-3 sm:pb-4 print:border-slate-900 print:pb-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 print:border-slate-300">
                      <img
                        src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786941816/Logo_MER_02_wmtlnu.png"
                        alt="Logo MER"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h1 className="font-headline-lg text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase leading-tight">
                        MONTHLY EMPLOYEE REPORT (MER)
                      </h1>
                      <p className="font-body-lg text-[11px] sm:text-sm text-slate-500 font-semibold mt-0.5">
                        PT. WAHANA BARA SENTOSA
                      </p>
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200 bg-slate-50 shadow-2xs print:bg-slate-100 print:border-slate-300 shrink-0">
                    <span className="font-label-caps text-[10px] sm:text-xs font-black uppercase text-[#b42907] tracking-wider font-mono">
                      PERIODE: {formatPeriodLabel(printPeriod).toUpperCase()}
                    </span>
                  </div>
                </header>

                {/* Employee Profile Details */}
                <section className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 shadow-2xs print:p-2.5 print:rounded-none print:border-slate-300 print:bg-slate-50">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NAMA KARYAWAN:
                    </span>
                    <span className="font-headline-md text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {emp.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIK KARYAWAN:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-bold font-mono">
                      {emp.nik}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      JABATAN / POSISI:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-semibold truncate">
                      {emp.position || 'Subordinat'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      AREA KERJA / DEPT:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-semibold truncate">
                      {emp.department}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      KATEGORI:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-semibold truncate">
                      {emp.category} {emp.equipmentType ? `[${emp.equipmentType}]` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      GROUP LEADER:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-semibold truncate">
                      {emp.groupLeaderName || activeGL?.name || 'Ahmad Hidayat'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1 lg:col-span-2">
                    <span className="font-label-caps text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      HEAD COACH:
                    </span>
                    <span className="font-body-lg text-xs sm:text-sm text-slate-800 font-semibold truncate">
                      {headCoachName}
                    </span>
                  </div>
                </section>

                {/* Performance Summary Card */}
                <section className="bg-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl text-white relative overflow-hidden shadow-md border border-slate-800 print:bg-[#0c2340] print:p-3 print:rounded-none">
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                      <h2 className="font-label-caps text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-300 mb-0.5">
                        NILAI AKHIR MER:
                      </h2>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-display-xl text-3xl sm:text-4xl font-black ${scoreFont.tailwindClass} drop-shadow-md`}>
                          {rep.finalScore.toFixed(2)}
                        </span>
                        <span className="font-headline-md text-sm sm:text-base font-bold text-slate-400">
                          / 4.00
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1.5 sm:gap-2">
                      <div className={`px-3.5 py-1 rounded-full shadow-sm ${badge.pillSolidClass}`}>
                        <span className="font-label-caps text-xs font-black tracking-wider uppercase">
                          {badge.label}
                        </span>
                      </div>
                      <div className="font-status-mono text-[10.5px] sm:text-[11px] text-slate-300 flex flex-wrap gap-2 opacity-95">
                        <span>Base: <span className="text-white font-bold">{rep.baseScore.toFixed(2)}</span></span>
                        <span className="text-slate-600">|</span>
                        <span>Merit: <span className="text-emerald-400 font-bold">+{rep.meritPoint.toFixed(2)}</span></span>
                        <span className="text-slate-600">|</span>
                        <span>Demerit: <span className="text-rose-400 font-bold">-{rep.demeritPoint.toFixed(2)}</span></span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Performance Table */}
                <section className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-2xs print:rounded-none print:border-slate-300">
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-xs min-w-[480px] sm:min-w-0">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 print:bg-slate-200 print:border-slate-300">
                          <th className="p-2.5 sm:p-3 font-bold text-slate-900">Parameter Performance</th>
                          <th className="p-2.5 sm:p-3 font-bold text-slate-900 text-center w-14 sm:w-16">Bobot</th>
                          <th className="p-2.5 sm:p-3 font-bold text-slate-900 text-center w-16 sm:w-20">Nilai</th>
                          <th className="p-2.5 sm:p-3 font-bold text-slate-900">Kriteria Terpenuhi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 print:divide-slate-300 text-xs">
                        {parameters.map((p, pIdx) => {
                          const val = rep.scores[p.id] || 0;
                          const scoreColor =
                            val === 1
                              ? 'text-[#b42907]'
                              : val === 2 || val === 3
                              ? 'text-[#00668a]'
                              : 'text-[#7b41b4]';
                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors ${
                                pIdx % 2 === 1 ? 'bg-slate-50/60 print:bg-slate-50' : 'bg-white'
                              }`}
                            >
                              <td className="p-2 sm:p-3 font-bold text-slate-900">{p.name}</td>
                              <td className="p-2 sm:p-3 text-center text-slate-600 font-semibold">
                                {p.weight}%
                              </td>
                              <td className={`p-2 sm:p-3 text-center font-extrabold text-xs sm:text-sm ${scoreColor} print:text-slate-900 font-mono`}>
                                {val}
                              </td>
                              <td className="p-2 sm:p-3 text-slate-700 text-[11px] sm:text-xs leading-relaxed">
                                {p.criteria[val as 1 | 2 | 3 | 4] || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Merit / Demerit Notes (If any) */}
                {(rep.meritNotes || rep.demeritNotes) && (
                  <div className="p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1 bg-slate-50 print:bg-white print:border-slate-300 print:rounded-none">
                    {rep.meritNotes && (
                      <p>
                        <strong className="text-emerald-700">Catatan Merit (+{rep.meritPoint}):</strong>{' '}
                        {rep.meritNotes}
                      </p>
                    )}
                    {rep.demeritNotes && (
                      <p>
                        <strong className="text-rose-700">Catatan Demerit (-{rep.demeritPoint}):</strong>{' '}
                        {rep.demeritNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Signatures Section */}
              <section className="mt-5 sm:mt-6 flex flex-row justify-around items-center gap-4 sm:gap-12 pt-3 sm:pt-4 border-t-2 border-slate-900/10 print:border-slate-900 print:pt-3">
                <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-xs text-center">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600">
                    Disetujui Oleh (Group Leader):
                  </span>
                  <div className="h-12 sm:h-14 w-full flex items-center justify-center border-b border-slate-400/60 relative">
                  </div>
                  <div className="text-center w-full">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ({emp.groupLeaderName || activeGL?.name || 'Ahmad Hidayat'})
                    </p>
                    <p className="font-status-mono text-[9px] sm:text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                      GL {emp.department || activeGL?.department || 'Operations'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-xs text-center">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600">
                    Penerima Laporan (Karyawan):
                  </span>
                  <div className="h-12 sm:h-14 w-full flex items-center justify-center border-b border-slate-400/60 relative">
                  </div>
                  <div className="text-center w-full">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ({emp.name})
                    </p>
                    <p className="font-status-mono text-[9px] sm:text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                      NIK: {emp.nik}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
};

