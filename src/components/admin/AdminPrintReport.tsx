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

  // Function to handle browser window print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
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
              Cetak dokumen resmi Monthly Employee Report secara individu per Subordinat atau kolektif per Group Leader
            </p>
          </div>

          <button
            onClick={handlePrint}
            disabled={targetEmployees.length === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download PDF ({targetEmployees.length} Dokumen)</span>
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
                {subordinates.map((sub) => (
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
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
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
                  Siap mencetak seluruh <strong>{targetEmployees.length} Rapor MER anggota tim</strong> di bawah Group Leader{' '}
                  <strong className="underline">{activeGL?.name}</strong> (Periode {formatPeriodLabel(printPeriod)})
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Area - List of Report Cards */}
      <div className="space-y-8">
        {targetEmployees.map((emp) => {
          const rep = reports.find(
            (r) => r.nik === emp.nik && r.period === printPeriod
          );

          const isOperator = emp.category === 'Operator';
          const parameters = isOperator ? operatorParameters : nonomParameters;

          if (!rep) {
            return (
              <div
                key={emp.id}
                className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 space-y-2 print:hidden"
              >
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Laporan MER Belum Tersedia: {emp.name} (NIK: {emp.nik})
                </h4>
                <p className="text-xs text-slate-500">
                  Data evaluasi bulan {formatPeriodLabel(printPeriod)} belum diinput oleh Group Leader ({emp.groupLeaderName || 'Ahmad Hidayat'}).
                </p>
              </div>
            );
          }

          const badge = getScoreCategoryBadge(rep.finalScore);

          return (
            <div
              key={emp.id}
              className="printable-mer-card bg-white text-slate-900 border border-slate-300 rounded-xl p-6 sm:p-8 shadow-md max-w-3xl mx-auto space-y-6 print:shadow-none print:border-slate-800 print:p-0 print:m-0 print:rounded-none print:w-full print:max-w-none page-break-after-always"
            >
              {/* Header Company & Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="https://res.cloudinary.com/dgjnlxf69/image/upload/v1786444304/Logo_MER_u8qeow.png"
                      alt="Logo MER"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                      MONTHLY EMPLOYEE REPORT (MER)
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      PT. WAHANA BARA SENTOSA
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold uppercase text-blue-900 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                    {formatPeriodLabel(printPeriod)}
                  </span>
                </div>
              </div>

              {/* Employee Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Nama Karyawan:</p>
                  <p className="font-extrabold text-slate-900">{emp.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">NIK Karyawan:</p>
                  <p className="font-mono font-bold text-slate-900">{emp.nik}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Jabatan:</p>
                  <p className="font-bold text-slate-900">{emp.position}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Area Kerja:</p>
                  <p className="font-bold text-slate-900">{emp.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Kategori / Alat:</p>
                  <p className="font-bold text-slate-900">
                    {emp.category} {emp.equipmentType ? `(${emp.equipmentType})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Group Leader:</p>
                  <p className="font-bold text-slate-900">{emp.groupLeaderName || 'Ahmad Hidayat'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Head Coach:</p>
                  <p className="font-bold text-slate-900">{headCoachName}</p>
                </div>
              </div>

              {/* Score Summary Box */}
              <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Nilai Akhir MER:
                  </p>
                  <p className="text-3xl font-black text-amber-400 mt-0.5">
                    {rep.finalScore.toFixed(2)}{' '}
                    <span className="text-xs text-slate-300 font-normal">/ 4.00</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full uppercase tracking-wide">
                    {badge.label}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono">
                    Base: {rep.baseScore.toFixed(2)} | Merit: +{rep.meritPoint.toFixed(2)} | Demerit: -{rep.demeritPoint.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Parameter Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-2.5">Parameter Performance</th>
                      <th className="p-2.5 text-center w-16">Bobot</th>
                      <th className="p-2.5 text-center w-20">Nilai (1-4)</th>
                      <th className="p-2.5">Kriteria Terpenuhi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parameters.map((p) => {
                      const val = rep.scores[p.id] || 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                          <td className="p-2.5 text-center font-semibold text-slate-600">{p.weight}%</td>
                          <td className="p-2.5 text-center font-black text-blue-700 text-sm">
                            {val}
                          </td>
                          <td className="p-2.5 text-slate-600 font-medium">
                            {p.criteria[val as 1 | 2 | 3 | 4] || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200">
                <div>
                  <p className="text-slate-500 mb-12">Disetujui Oleh (Group Leader):</p>
                  <p className="font-extrabold text-slate-900 border-b border-slate-400 inline-block px-8 pb-1">
                    ({emp.groupLeaderName || 'Ahmad Hidayat'})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">NIP / NIK Group Leader</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-12">Penerima Laporan (Karyawan):</p>
                  <p className="font-extrabold text-slate-900 border-b border-slate-400 inline-block px-8 pb-1">
                    ({emp.name})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">NIK: {emp.nik}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
