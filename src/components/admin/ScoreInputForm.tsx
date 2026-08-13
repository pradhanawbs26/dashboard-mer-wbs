import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyReport, RawMetricsData } from '../../types';
import {
  calculateMerScore,
  getScoreCategoryBadge,
  formatPeriodLabel,
  evaluateParameterScore,
} from '../../utils/calculations';
import {
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Calculator,
  Calendar,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Database,
  RotateCcw,
} from 'lucide-react';

export const ScoreInputForm: React.FC = () => {
  const {
    currentUser,
    employees,
    reports,
    selectedPeriod,
    operatorParameters,
    nonomParameters,
    meritRules,
    demeritRules,
    saveMonthlyReport,
  } = useApp();

  const subEmployees = employees.filter((e) => e.role === 'subordinate');

  const [selectedNik, setSelectedNik] = useState<string>(
    subEmployees[0]?.nik || ''
  );

  const selectedEmp = subEmployees.find((e) => e.nik === selectedNik);

  const isOperator = selectedEmp?.category === 'Operator';
  const parameters = isOperator ? operatorParameters : nonomParameters;

  // Raw supporting metrics state (Input Data Pendukung)
  const [rawMetrics, setRawMetrics] = useState<RawMetricsData>({
    atrRate: 98,
    terlambatCount: 0,
    mangkirCount: 0,
    productivityRate: 105,
    sapCount: 4,
    incidentCount: 0,
    misoperasiCount: 0,
    mtoCount: 0,
    timesheetStatus: 'Lengkap & Valid',
    genericValue: 90,
  });

  // Parameter score state (Level 1..4)
  const [scores, setScores] = useState<Record<string, number>>({});
  const [evalReasons, setEvalReasons] = useState<Record<string, string>>({});
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const [selectedMerits, setSelectedMerits] = useState<string[]>([]);
  const [selectedDemerits, setSelectedDemerits] = useState<string[]>([]);
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync raw metrics -> auto-calculate scores for non-overridden parameters
  useEffect(() => {
    const newScores: Record<string, number> = { ...scores };
    const newReasons: Record<string, string> = { ...evalReasons };

    parameters.forEach((param) => {
      const evalRes = evaluateParameterScore(param, rawMetrics);
      if (!manualOverrides[param.id]) {
        newScores[param.id] = evalRes.level;
      }
      newReasons[param.id] = evalRes.reason;
    });

    setScores(newScores);
    setEvalReasons(newReasons);
  }, [rawMetrics, parameters, manualOverrides]);

  // Load existing report or initialize default metrics on employee or period change
  useEffect(() => {
    if (!selectedNik) return;

    const existingRep = reports.find(
      (r) => r.nik === selectedNik && r.period === selectedPeriod
    );

    if (existingRep) {
      setScores(existingRep.scores || {});
      setSelectedMerits(existingRep.meritItems || []);
      setSelectedDemerits(existingRep.demeritItems || []);
      setEvaluatorNotes(existingRep.notes || '');

      // Parse stored rawMetrics or populate intelligent defaults
      if (existingRep.rawMetrics) {
        const stored = existingRep.rawMetrics;
        const atrNum = parseFloat(String(stored.ATR || stored.atrRate || stored['ATR Kehadiran'] || '98').replace('%', ''));
        const prodNum = parseFloat(String(stored.Productivity || stored.productivityRate || '105').replace('%', ''));
        const sapNum = parseInt(String(stored.SAP || stored.sapCount || stored['SAP Hazard Report'] || '4').replace(/[^0-9]/g, ''), 10);
        const misNum = parseInt(String(stored.Misoperasi || stored.misoperasiCount || '0').replace(/[^0-9]/g, ''), 10);
        const genNum = parseInt(String(stored['Teamwork & Respon'] || stored.genericValue || '90').replace(/[^0-9]/g, ''), 10);

        setRawMetrics({
          atrRate: isNaN(atrNum) ? 98 : atrNum,
          terlambatCount: 0,
          mangkirCount: 0,
          productivityRate: isNaN(prodNum) ? 105 : prodNum,
          sapCount: isNaN(sapNum) ? 4 : sapNum,
          incidentCount: 0,
          misoperasiCount: isNaN(misNum) ? 0 : misNum,
          mtoCount: 0,
          timesheetStatus: stored.Timesheet || stored['Kualitas Administrasi'] || stored['Timesheet Status'] || (isOperator ? 'Lengkap & Valid' : 'Sangat Baik'),
          genericValue: isNaN(genNum) ? 90 : genNum,
        });
      }
    } else {
      // Default initial metrics
      const initMetrics: RawMetricsData = {
        atrRate: 98,
        terlambatCount: 0,
        mangkirCount: 0,
        productivityRate: isOperator ? 105 : 100,
        sapCount: 4,
        incidentCount: 0,
        misoperasiCount: 0,
        mtoCount: 0,
        timesheetStatus: isOperator ? 'Lengkap & Valid' : 'Sangat Baik',
        genericValue: 90,
      };

      setRawMetrics(initMetrics);

      const initScores: Record<string, number> = {};
      const initReasons: Record<string, string> = {};

      parameters.forEach((param) => {
        const res = evaluateParameterScore(param, initMetrics);
        initScores[param.id] = res.level;
        initReasons[param.id] = res.reason;
      });

      setScores(initScores);
      setEvalReasons(initReasons);
      setManualOverrides({});
      setSelectedMerits([]);
      setSelectedDemerits([]);
      setEvaluatorNotes('Penilaian otomatis berdasarkan data pendukung operasional.');
    }
  }, [selectedNik, selectedPeriod, reports, isOperator]);

  // Live Score Calculation
  const calc = calculateMerScore(
    scores,
    parameters,
    selectedMerits,
    selectedDemerits,
    meritRules,
    demeritRules
  );

  const badge = getScoreCategoryBadge(calc.finalScore);

  const handleScoreChange = (paramId: string, level: number) => {
    setManualOverrides((prev) => ({ ...prev, [paramId]: true }));
    setScores((prev) => ({ ...prev, [paramId]: level }));
  };

  const handleResetOverride = (paramId: string) => {
    setManualOverrides((prev) => {
      const copy = { ...prev };
      delete copy[paramId];
      return copy;
    });
  };

  const toggleMerit = (meritId: string) => {
    setSelectedMerits((prev) =>
      prev.includes(meritId)
        ? prev.filter((id) => id !== meritId)
        : [...prev, meritId]
    );
  };

  const toggleDemerit = (demeritId: string) => {
    setSelectedDemerits((prev) =>
      prev.includes(demeritId)
        ? prev.filter((id) => id !== demeritId)
        : [...prev, demeritId]
    );
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    // Convert raw metrics to readable string record for summary
    const formattedRawMetrics: Record<string, string> = isOperator
      ? {
          'ATR Kehadiran': `${rawMetrics.atrRate || 0}%`,
          'Terlambat / Mangkir': `${rawMetrics.terlambatCount || 0}x Terlambat / ${rawMetrics.mangkirCount || 0}x Mangkir`,
          'Productivity': `${rawMetrics.productivityRate || 0}%`,
          'SAP Hazard Report': `${rawMetrics.sapCount || 0} Laporan`,
          'Insiden K3': `${rawMetrics.incidentCount || 0} Incident`,
          'Misoperasi': `${rawMetrics.misoperasiCount || 0} Incident`,
          'Timesheet Status': rawMetrics.timesheetStatus || 'Lengkap & Valid',
        }
      : {
          'ATR Kehadiran': `${rawMetrics.atrRate || 0}%`,
          'Terlambat / Mangkir': `${rawMetrics.terlambatCount || 0}x Terlambat / ${rawMetrics.mangkirCount || 0}x Mangkir`,
          'SAP Hazard Report': `${rawMetrics.sapCount || 0} Laporan`,
          'Insiden K3': `${rawMetrics.incidentCount || 0} Incident`,
          'Kualitas Administrasi': rawMetrics.timesheetStatus || 'Sangat Baik',
          'Teamwork & Respon': `${rawMetrics.genericValue || 90} Poin`,
        };

    const reportObj: MonthlyReport = {
      id: `rep_${selectedEmp.nik}_${selectedPeriod}`,
      nik: selectedEmp.nik,
      employeeName: selectedEmp.name,
      department: selectedEmp.department,
      category: selectedEmp.category,
      equipmentType: selectedEmp.equipmentType,
      period: selectedPeriod,
      scores,
      rawMetrics: formattedRawMetrics,
      meritItems: selectedMerits,
      demeritItems: selectedDemerits,
      baseScore: calc.baseScore,
      meritPoint: calc.meritPoint,
      demeritPoint: calc.demeritPoint,
      finalScore: calc.finalScore,
      evaluatorNik: currentUser?.nik || 'admin',
      evaluatorName: currentUser?.name || 'Administrator',
      notes: evaluatorNotes,
      updatedAt: new Date().toISOString(),
    };

    saveMonthlyReport(reportObj);
    setToastMessage(`Nilai MER untuk ${selectedEmp.name} berhasil disimpan!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white font-bold px-4 py-3 rounded-xl shadow-md flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Employee & Period Selector Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Form Input Data Pendukung & Evaluasi Otomatis MER
            </h3>
            <p className="text-xs text-slate-500">
              Admin hanya memasukkan data pendukung operasional (persentase, jumlah, status). Sistem akan menilai otomatis secara akurat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Pilih Karyawan Subordinat:
            </label>
            <select
              value={selectedNik}
              onChange={(e) => setSelectedNik(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {subEmployees.map((emp) => (
                <option key={emp.id} value={emp.nik}>
                  {emp.name} (NIK: {emp.nik}) • {emp.category}
                  {emp.equipmentType ? ` [${emp.equipmentType}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Periode Evaluasi MER:
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-blue-600 font-bold flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formatPeriodLabel(selectedPeriod)}</span>
            </div>
          </div>
        </div>

        {selectedEmp && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">{selectedEmp.name}</p>
              <p className="text-[10px] text-slate-500">
                {selectedEmp.position} • Area Kerja: {selectedEmp.department} • GL:{' '}
                {selectedEmp.groupLeaderName}
              </p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md">
              Kategori: {selectedEmp.category}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveReport} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Supporting Data Input & Auto Calculated Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: RAW SUPPORTING DATA INPUT PANEL */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-blue-700 font-extrabold text-sm">
                <Database className="w-5 h-5 text-blue-600" />
                <span>1. Input Data Pendukung Operasional ({isOperator ? 'Operator' : 'Nonom'})</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Sistem Auto-Scoring Aktif</span>
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Masukkan indikator riil karyawan ({isOperator ? 'Operator Alat Berat' : 'Karyawan Non-Operator'}) untuk bulan ini. Sistem akan langsung membandingkan dengan kriteria threshold.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* ATR Kehadiran % */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="font-bold text-slate-800 flex justify-between">
                  <span>ATR Kehadiran (%)</span>
                  <span className="text-blue-600 font-bold">{rawMetrics.atrRate}%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rawMetrics.atrRate ?? 98}
                  onChange={(e) =>
                    setRawMetrics((prev) => ({
                      ...prev,
                      atrRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <div className="flex space-x-3 pt-1 text-[10px] text-slate-500">
                  <label className="flex items-center space-x-1">
                    <span>Terlambat:</span>
                    <input
                      type="number"
                      min="0"
                      value={rawMetrics.terlambatCount ?? 0}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          terlambatCount: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-12 bg-white border rounded px-1 text-center font-bold"
                    />
                    <span>x</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <span>Mangkir:</span>
                    <input
                      type="number"
                      min="0"
                      value={rawMetrics.mangkirCount ?? 0}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          mangkirCount: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-12 bg-white border rounded px-1 text-center font-bold"
                    />
                    <span>x</span>
                  </label>
                </div>
              </div>

              {/* SAP Hazard Report (Common for both) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="font-bold text-slate-800 flex justify-between">
                  <span>Achievement SAP (Hazard Report)</span>
                  <span className="text-blue-600 font-bold">{rawMetrics.sapCount} Laporan</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={rawMetrics.sapCount ?? 4}
                  onChange={(e) =>
                    setRawMetrics((prev) => ({
                      ...prev,
                      sapCount: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 pt-1">
                  <span>Insiden K3LH:</span>
                  <input
                    type="number"
                    min="0"
                    value={rawMetrics.incidentCount ?? 0}
                    onChange={(e) =>
                      setRawMetrics((prev) => ({
                        ...prev,
                        incidentCount: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-12 bg-white border rounded px-1 text-center font-bold"
                  />
                  <span>kali (Penilaian insiden operasional)</span>
                </div>
              </div>

              {/* CONDITIONAL OPERATOR vs NONOM FIELDS */}
              {isOperator ? (
                <>
                  {/* Productivity % */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-800 flex justify-between">
                      <span>Achievement Produktivitas (%)</span>
                      <span className="text-blue-600 font-bold">{rawMetrics.productivityRate}%</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="200"
                      value={rawMetrics.productivityRate ?? 105}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          productivityRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-400">Target 100% = Standard Target Production MCR</p>
                  </div>

                  {/* Machine Application / Misoperasi */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-800 flex justify-between">
                      <span>Kejadian Misoperasi Alat</span>
                      <span className="text-blue-600 font-bold">{rawMetrics.misoperasiCount} Kali</span>
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block">Misoperasi:</span>
                        <input
                          type="number"
                          min="0"
                          value={rawMetrics.misoperasiCount ?? 0}
                          onChange={(e) =>
                            setRawMetrics((prev) => ({
                              ...prev,
                              misoperasiCount: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block">Temuan MTO:</span>
                        <input
                          type="number"
                          min="0"
                          value={rawMetrics.mtoCount ?? 0}
                          onChange={(e) =>
                            setRawMetrics((prev) => ({
                              ...prev,
                              mtoCount: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Daily Report Timesheet Status */}
                  <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-800 block">
                      Status Pengumpulan Daily Report / Timesheet Operasional:
                    </label>
                    <select
                      value={rawMetrics.timesheetStatus || 'Lengkap & Valid'}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          timesheetStatus: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Lengkap & Valid">Lengkap & Valid</option>
                      <option value="Lengkap">Lengkap Tepat Waktu</option>
                      <option value="Terlambat">Terlambat ≥ 1x</option>
                      <option value="Tidak Mengumpulkan">Tidak Mengumpulkan ≥ 1x</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Status Kelengkapan Administrasi & Work Quality (Nonom) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-800 block">
                      Kelengkapan Administrasi & Work Quality:
                    </label>
                    <select
                      value={rawMetrics.timesheetStatus || 'Sangat Baik'}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          timesheetStatus: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Sangat Baik">Sangat Baik & Rapi</option>
                      <option value="Baik">Baik & Sesuai Standard</option>
                      <option value="Cukup">Cukup / Perlu Perbaikan</option>
                      <option value="Kurang">Kurang / Banyak Kekurangan</option>
                    </select>
                    <p className="text-[10px] text-slate-400">Pencatatan & kelengkapan administrasi kerja Non-Operator</p>
                  </div>

                  {/* Teamwork & Response Score (Nonom) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-800 flex justify-between">
                      <span>Kerjasama Tim & Respon Arahan (0 - 100)</span>
                      <span className="text-blue-600 font-bold">{rawMetrics.genericValue ?? 90} Poin</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={rawMetrics.genericValue ?? 90}
                      onChange={(e) =>
                        setRawMetrics((prev) => ({
                          ...prev,
                          genericValue: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[10px] text-slate-400">Poin Kerjasama Tim: ≥90 | ≥80 | ≥70 | &lt;70</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 2: AUTO-EVALUATED PARAMETERS VIEW */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>2. Hasil Penilaian Indikator Parameter MER ({isOperator ? 'Operator' : 'Nonom'})</span>
              </span>
              <span className="text-xs text-slate-500 font-normal">
                Auto Evaluated by Criteria Thresholds
              </span>
            </h4>

            {parameters.map((param) => {
              const currentScore = scores[param.id] || 3;
              const reasonText = evalReasons[param.id] || '';
              const isOverridden = manualOverrides[param.id];
              const criterionText = param.criteria[currentScore as 1 | 2 | 3 | 4] || '';

              return (
                <div
                  key={param.id}
                  className={`bg-white border rounded-xl p-4 sm:p-5 text-slate-800 shadow-sm space-y-3 transition-all ${
                    isOverridden ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          Bobot {param.weight}%
                        </span>
                        {isOverridden ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded flex items-center space-x-1">
                            <span>Manual Override</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Otomatis Sistem</span>
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                        {param.name}
                      </h5>
                      <p className="text-xs text-slate-500">{param.description}</p>
                    </div>

                    <div className="text-right">
                      {isOverridden && (
                        <button
                          type="button"
                          onClick={() => handleResetOverride(param.id)}
                          className="block text-[10px] text-blue-600 hover:underline mt-0.5 font-bold flex items-center justify-end space-x-0.5 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset ke Auto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating 1 to 4 Selection Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleScoreChange(param.id, level)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          currentScore === level
                            ? level === 4
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : level === 3
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : level === 2
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Auto Evaluation Reason Box */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-blue-700 uppercase">
                        Keterangan Penilaian Sistem:
                      </span>
                      <span className="text-slate-500 font-medium">{reasonText}</span>
                    </div>
                    <p className="text-slate-700 font-medium text-[11px]">
                      <span className="font-semibold text-slate-900">Kriteria Terpenuhi: </span>
                      {criterionText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Merit & Demerit Option Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Merit Checkboxes */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4" />
                <span>Pilih Merit Points (+)</span>
              </div>

              <div className="space-y-2 text-xs">
                {meritRules.map((m) => {
                  const isChecked = selectedMerits.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMerit(m.id)}
                        className="mt-0.5 accent-emerald-600 cursor-pointer"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{m.label}</p>
                        <p className="text-[10px] text-slate-500">
                          Poin: +{m.points.toFixed(1)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Demerit Checkboxes */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs pb-2 border-b border-slate-100">
                <ShieldAlert className="w-4 h-4" />
                <span>Pilih Demerit Points (-)</span>
              </div>

              <div className="space-y-2 text-xs">
                {demeritRules.map((d) => {
                  const isChecked = selectedDemerits.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDemerit(d.id)}
                        className="mt-0.5 accent-rose-600 cursor-pointer"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{d.label}</p>
                        <p className="text-[10px] text-slate-500">
                          Pengurang: -{d.points.toFixed(1)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Score Summary & Submit Column */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-800 shadow-sm space-y-4 sticky top-20">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Kalkulasi Hasil MER
            </h4>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-semibold block">
                Skor Akhir MER:
              </span>
              <p className="text-4xl font-black text-blue-600 my-1">
                {calc.finalScore.toFixed(2)}
              </p>
              <span
                className={`text-xs px-3 py-0.5 rounded-full font-bold border inline-block ${badge.badgeClass}`}
              >
                {badge.label}
              </span>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Base Weighted Score:</span>
                <span className="font-bold text-slate-800">{calc.baseScore.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Poin Merit Applied:</span>
                <span className="font-bold">+{calc.meritPoint.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Poin Demerit Applied:</span>
                <span className="font-bold">-{calc.demeritPoint.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan MER ({selectedPeriod})</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
