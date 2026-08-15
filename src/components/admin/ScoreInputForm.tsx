import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  ArrowUpDown,
  ChevronDown,
  Check,
  User,
  X,
  Filter,
  CheckCircle2,
  Clock,
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

  const [selectedNik, setSelectedNik] = useState<string>('');

  // Search, Sorting, and Filter states for Subordinate Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'NAME_DESC' | 'NIK_ASC' | 'NIK_DESC'>('NAME_ASC');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Operator' | 'Nonom'>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  // Filter & Sort Subordinates List
  const filteredSubordinates = useMemo(() => {
    let list = subEmployees.filter((emp) => {
      // Category filter
      if (categoryFilter !== 'ALL' && emp.category !== categoryFilter) {
        return false;
      }
      // Search query (NIK, Name, Position, Department, Equipment, GL)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchNik = emp.nik.toLowerCase().includes(q);
        const matchDept = (emp.department || '').toLowerCase().includes(q);
        const matchEquip = (emp.equipmentType || '').toLowerCase().includes(q);
        const matchGL = (emp.groupLeaderName || '').toLowerCase().includes(q);
        return matchName || matchNik || matchDept || matchEquip || matchGL;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name, 'id');
      }
      if (sortBy === 'NAME_DESC') {
        return b.name.localeCompare(a.name, 'id');
      }
      if (sortBy === 'NIK_ASC') {
        return a.nik.localeCompare(b.nik, undefined, { numeric: true });
      }
      if (sortBy === 'NIK_DESC') {
        return b.nik.localeCompare(a.nik, undefined, { numeric: true });
      }
      return 0;
    });

    return list;
  }, [subEmployees, searchQuery, sortBy, categoryFilter]);

  const selectedEmp = selectedNik ? (subEmployees.find((e) => e.nik === selectedNik) || null) : null;

  // Helper to check if an employee has report in selectedPeriod
  const getEmployeePeriodStatus = (nik: string) => {
    const rep = reports.find((r) => r.nik === nik && r.period === selectedPeriod);
    if (rep) {
      return {
        evaluated: true,
        score: rep.finalScore,
        badge: getScoreCategoryBadge(rep.finalScore),
      };
    }
    return { evaluated: false, score: null, badge: null };
  };

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
          {/* Searchable & Sortable Subordinate Selector */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">
                Pilih Karyawan Subordinat:
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Cari NIK / Nama • Total {subEmployees.length} Subordinat
              </span>
            </div>

            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-full bg-slate-50 hover:bg-slate-100/80 border transition-all text-left rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs ${
                isDropdownOpen ? 'border-blue-600 ring-2 ring-blue-100 bg-white' : 'border-slate-300'
              }`}
            >
              {selectedEmp ? (
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                    {selectedEmp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="font-extrabold text-slate-900 text-xs truncate">
                        {selectedEmp.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded font-bold shrink-0">
                        NIK: {selectedEmp.nik}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {selectedEmp.category} {selectedEmp.equipmentType ? `• [${selectedEmp.equipmentType}]` : ''} • {selectedEmp.department}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0 text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-500 text-xs">
                      -- Pilih Karyawan Subordinat (Cari NIK / Nama) --
                    </span>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Klik untuk mencari dari {subEmployees.length} karyawan subordinat
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                {selectedEmp && (
                  <span
                    role="button"
                    title="Hapus / Reset Pilihan"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNik('');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors mr-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${
                    isDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Search & Filter Header */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ketik NIK (contoh: 2169...) atau Nama..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sorting and Category Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    {/* Sort Selector */}
                    <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Urutkan:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-[11px]"
                      >
                        <option value="NAME_ASC">Abjad Nama (A - Z)</option>
                        <option value="NAME_DESC">Abjad Nama (Z - A)</option>
                        <option value="NIK_ASC">NIK (Terkecil - Terbesar)</option>
                        <option value="NIK_DESC">NIK (Terbesar - Terkecil)</option>
                      </select>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center space-x-1 bg-slate-200/70 p-0.5 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('ALL')}
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all ${
                          categoryFilter === 'ALL'
                            ? 'bg-white text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua ({subEmployees.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('Operator')}
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all ${
                          categoryFilter === 'Operator'
                            ? 'bg-white text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Operator
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('Nonom')}
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all ${
                          categoryFilter === 'Nonom'
                            ? 'bg-white text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Nonom
                      </button>
                    </div>
                  </div>

                  {/* Results Count Helper */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
                    <span>
                      Menampilkan <strong className="text-slate-800">{filteredSubordinates.length}</strong> karyawan
                    </span>
                    {searchQuery && (
                      <span className="text-blue-600 font-semibold">
                        Filter: &quot;{searchQuery}&quot;
                      </span>
                    )}
                  </div>
                </div>

                {/* Subordinates Scrollable List */}
                <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {filteredSubordinates.length > 0 ? (
                    filteredSubordinates.map((emp) => {
                      const isSelected = emp.nik === selectedNik;
                      const periodStatus = getEmployeePeriodStatus(emp.nik);

                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedNik(emp.nik);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 text-left flex items-center justify-between gap-3 transition-colors hover:bg-blue-50/60 ${
                            isSelected ? 'bg-blue-50/90 font-bold border-l-4 border-blue-600' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                emp.name.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="truncate">
                              <div className="flex items-center space-x-2 truncate">
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded shrink-0">
                                  {emp.nik}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                                    emp.category === 'Operator'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {emp.category}
                                </span>
                              </div>

                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {emp.position} • Area: {emp.department}
                                {emp.equipmentType ? ` [${emp.equipmentType}]` : ''} • GL: {emp.groupLeaderName}
                              </div>
                            </div>
                          </div>

                          {/* Evaluation status in current period */}
                          <div className="shrink-0 text-right">
                            {periodStatus.evaluated ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{periodStatus.score?.toFixed(2)}</span>
                                </span>
                                <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                                  {periodStatus.badge?.label}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Belum Dinilai</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-500 space-y-2">
                      <p className="text-xs">
                        Tidak ada karyawan dengan kata kunci &quot;<strong className="text-slate-800">{searchQuery}</strong>&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('ALL');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Reset Pencarian & Filter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Periode Evaluasi MER:
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-blue-600 font-bold flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formatPeriodLabel(selectedPeriod)}</span>
            </div>
          </div>
        </div>

        {selectedEmp && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{selectedEmp.name}</span>
                <span className="font-mono text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded font-bold text-[11px]">
                  NIK: {selectedEmp.nik}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedEmp.position} • Area Kerja: {selectedEmp.department} • GL:{' '}
                {selectedEmp.groupLeaderName}
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md">
                Kategori: {selectedEmp.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNik('')}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Ganti Karyawan
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEmp ? (
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan MER ({selectedPeriod})</span>
            </button>
          </div>
        </div>
      </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-14 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Silakan Pilih Karyawan Terlebih Dahulu
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Ketik NIK atau Nama karyawan pada menu pencarian di atas untuk mulai memasukkan data pendukung operasional dan melakukan penilaian MER periode <strong className="text-slate-800">{formatPeriodLabel(selectedPeriod)}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buka Menu Pencarian Karyawan ({subEmployees.length} Subordinat)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
