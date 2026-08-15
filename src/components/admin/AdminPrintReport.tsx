import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getScoreCategoryBadge,
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

  const groupLeaders = employees.filter((e) => e.role === 'group_leader');
  const subordinates = employees.filter((e) => e.role === 'subordinate');

  const headCoachObj = employees.find((e) => e.role === 'head_coach');
  const headCoachName = headCoachObj ? headCoachObj.name : 'Dharmawan Kustanto';

  // State
  const [printMode, setPrintMode] = useState<'SUBORDINATE' | 'GROUP_LEADER'>('SUBORDINATE');
  const [selectedSubNik, setSelectedSubNik] = useState<string>(subordinates[0]?.nik || '');
  const [selectedGlNik, setSelectedGlNik] = useState<string>(groupLeaders[0]?.nik || '');
  const [printPeriod, setPrintPeriod] = useState<string>(selectedPeriod || '2026-08');

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
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 text-slate-800 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Printer className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Pencetakan Rapor MER (Sistem Admin)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cetak dokumen resmi Monthly Employee Report secara individu per Subordinat atau kolektif per Group Leader (1 Rapor = 1 Halaman A4)
            </p>
          </div>

          <button
            onClick={handlePrint}
            disabled={evaluatedEmployees.length === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download PDF ({evaluatedEmployees.length} Dokumen Siap)</span>
          </button>
        </div>

        {/* Configuration Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
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
                <span>Group Leader (Tim)</span>
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
                : '3. Pilih Group Leader:'}
            </label>
            {printMode === 'SUBORDINATE' ? (
              <select
                value={selectedSubNik}
                onChange={(e) => setSelectedSubNik(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {[...subordinates]
                  .sort((a, b) => a.name.localeCompare(b.name, 'id'))
                  .map((sub) => (
                    <option key={sub.id} value={sub.nik}>
                      {sub.name} (NIK: {sub.nik}) - GL: {sub.groupLeaderName || 'Ahmad Hidayat'}
                    </option>
                  ))}
              </select>
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
                  {unEvaluatedEmployees.length > 0 && (
                    <span className="text-amber-700 font-semibold ml-1">
                      ({unEvaluatedEmployees.length} belum diinput)
                    </span>
                  )}
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
        {/* Un-evaluated warning banners (Visible on screen, hidden in print) */}
        {unEvaluatedEmployees.length > 0 && (
          <div className="print:hidden space-y-3">
            {unEvaluatedEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    Laporan Belum Diinput: {emp.name} (NIK: {emp.nik})
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Evaluasi bulan {formatPeriodLabel(printPeriod)} belum diinput oleh Group Leader ({emp.groupLeaderName || activeGL?.name || 'Ahmad Hidayat'}).
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evaluated Report Pages */}
        {evaluatedEmployees.map((emp, index) => {
          const rep = reports.find(
            (r) => r.nik === emp.nik && r.period === printPeriod
          );

          if (!rep) return null;

          const isOperator = emp.category === 'Operator';
          const parameters = isOperator ? operatorParameters : nonomParameters;
          const badge = getScoreCategoryBadge(rep.finalScore);
          const isLastItem = index === evaluatedEmployees.length - 1;

          return (
            <div
              key={emp.id}
              className={`printable-mer-card mer-print-page bg-white text-slate-900 border border-slate-300 rounded-xl p-6 sm:p-7 shadow-md max-w-3xl mx-auto flex flex-col justify-between print:shadow-none print:border-[1.5px] print:border-slate-900 print:p-5 print:m-0 print:rounded-none print:w-full print:max-w-none print:break-inside-avoid ${
                isLastItem ? 'print:break-after-auto' : 'print:break-after-page'
              }`}
            >
              {/* Top Section */}
              <div className="space-y-4 print:space-y-3">
                {/* Header Company & Logo */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 print:pb-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 print:border-slate-300">
                      <img
                        src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786687867/Logo_MER_q2erzz.png"
                        alt="Logo MER"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                        MONTHLY EMPLOYEE REPORT (MER)
                      </h2>
                      <p className="text-[11px] text-slate-600 font-bold tracking-wide">
                        PT. WAHANA BARA SENTOSA
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold uppercase text-blue-900 bg-blue-50 px-3 py-1 rounded-md border border-blue-200 print:bg-slate-100 print:border-slate-400 print:text-slate-900">
                      PERIODE: {formatPeriodLabel(printPeriod)}
                    </span>
                  </div>
                </div>

                {/* Employee Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-300 print:p-2.5 print:text-[11px]">
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Nama Karyawan:</p>
                    <p className="font-extrabold text-slate-900 truncate">{emp.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">NIK Karyawan:</p>
                    <p className="font-mono font-bold text-slate-900">{emp.nik}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Jabatan / Posisi:</p>
                    <p className="font-bold text-slate-900 truncate">{emp.position}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Area Kerja / Dept:</p>
                    <p className="font-bold text-slate-900 truncate">{emp.department}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Kategori / Alat:</p>
                    <p className="font-bold text-slate-900 truncate">
                      {emp.category} {emp.equipmentType ? `(${emp.equipmentType})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Group Leader:</p>
                    <p className="font-bold text-slate-900 truncate">{emp.groupLeaderName || activeGL?.name || 'Ahmad Hidayat'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Head Coach:</p>
                    <p className="font-bold text-slate-900 truncate">{headCoachName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Status Dokumen:</p>
                    <p className="font-bold text-emerald-700 print:text-slate-900">RESMI / VALID</p>
                  </div>
                </div>

                {/* Score Summary Box */}
                <div className="bg-slate-900 text-white p-3.5 rounded-lg flex items-center justify-between shadow-inner print:bg-slate-900 print:text-white print:p-3">
                  <div>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Nilai Akhir MER:
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                      {rep.finalScore.toFixed(2)}{' '}
                      <span className="text-xs text-slate-300 font-normal">/ 4.00</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full uppercase tracking-wide inline-block">
                      {badge.label}
                    </span>
                    <p className="text-[10px] text-slate-300 mt-1 font-mono">
                      Base: {rep.baseScore.toFixed(2)} | Merit: +{rep.meritPoint.toFixed(2)} | Demerit: -{rep.demeritPoint.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Parameter Table */}
                <div className="overflow-hidden rounded-lg border border-slate-300 print:border-slate-400">
                  <table className="w-full text-xs text-left border-collapse print:text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold print:bg-slate-200">
                        <th className="py-2 px-2.5">Parameter Performance</th>
                        <th className="py-2 px-2 text-center w-14">Bobot</th>
                        <th className="py-2 px-2 text-center w-16">Nilai (1-4)</th>
                        <th className="py-2 px-2.5">Kriteria Terpenuhi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                      {parameters.map((p) => {
                        const val = rep.scores[p.id] || 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 font-bold text-slate-800">{p.name}</td>
                            <td className="py-1.5 px-2 text-center font-semibold text-slate-600">{p.weight}%</td>
                            <td className="py-1.5 px-2 text-center font-black text-blue-700 print:text-slate-900">
                              {val}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 font-medium text-[11px] leading-tight">
                              {p.criteria[val as 1 | 2 | 3 | 4] || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Merit / Demerit Notes (If any) */}
                {(rep.meritNotes || rep.demeritNotes) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600 space-y-0.5 print:bg-white print:border-slate-300">
                    {rep.meritNotes && (
                      <p><strong className="text-emerald-700">Catatan Merit (+{rep.meritPoint}):</strong> {rep.meritNotes}</p>
                    )}
                    {rep.demeritNotes && (
                      <p><strong className="text-red-700">Catatan Demerit (-{rep.demeritPoint}):</strong> {rep.demeritNotes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Signatures Section */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs border-t-2 border-slate-300 print:border-slate-800 print:pt-3">
                <div>
                  <p className="text-slate-600 font-medium mb-10 print:mb-12">Disetujui Oleh (Group Leader):</p>
                  <p className="font-extrabold text-slate-900 border-b border-slate-500 inline-block min-w-44 pb-1">
                    ({emp.groupLeaderName || activeGL?.name || 'Ahmad Hidayat'})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    GL {emp.department || activeGL?.department || 'Operations'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 font-medium mb-10 print:mb-12">Penerima Laporan (Karyawan):</p>
                  <p className="font-extrabold text-slate-900 border-b border-slate-500 inline-block min-w-44 pb-1">
                    ({emp.name})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">NIK: {emp.nik}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

