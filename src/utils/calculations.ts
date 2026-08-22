import { DynamicParameter, MeritRule, DemeritRule, MonthlyReport, RawMetricsData } from '../types';

export const DEFAULT_MERIT_RULES: MeritRule[] = [
  {
    id: 'merit_coach',
    code: 'COACHING',
    label: 'Melakukan konseling dengan Coach',
    points: 0.2,
    description: 'Menjalani sesi coaching rutin dengan atasan/coach',
  },
  {
    id: 'merit_ss',
    code: 'SS_SUGGESTION',
    label: 'Membuat SS (System Suggestion)',
    points: 0.3,
    description: 'Mengajukan usulan perbaikan kerja (System Suggestion)',
  },
  {
    id: 'merit_kapten_fd',
    code: 'KAPTEN_FD',
    label: 'Menjadi Kapten FD (Flat Deck)',
    points: 0.5,
    description: 'Bertugas aktif sebagai Kapten FD (Flat Deck)',
  },
  {
    id: 'merit_qcc',
    code: 'QCC_PROJECT',
    label: 'Terlibat dalam QCC/P (Quality Control Circle/Project)',
    points: 0.5,
    description: 'Anggota tim proyek perbaikan mutu operasional',
  },
];

export const DEFAULT_DEMERIT_RULES: DemeritRule[] = [
  {
    id: 'demerit_sp1',
    code: 'SP_1',
    label: 'Surat Peringatan 1 (SP 1)',
    points: 0.2,
    description: 'Pelanggaran disiplin tingkat 1',
  },
  {
    id: 'demerit_sp2',
    code: 'SP_2',
    label: 'Surat Peringatan 2 (SP 2)',
    points: 0.3,
    description: 'Pelanggaran disiplin tingkat 2',
  },
  {
    id: 'demerit_sp3',
    code: 'SP_3',
    label: 'Surat Peringatan 3 (SP 3)',
    points: 0.5,
    description: 'Pelanggaran disiplin tingkat 3 / berat',
  },
  {
    id: 'demerit_ftw',
    code: 'FTW_UNFAIR',
    label: 'FTW (Fit to Work) tidak jujur & tidak benar',
    points: 0.5,
    description: 'Pengisian status kelaikan kerja tidak sesuai fakta',
  },
  {
    id: 'demerit_bad_attitude',
    code: 'BAD_ATTITUDE',
    label: 'Bad Attitude',
    points: 1.0,
    description: 'Tindakan indisipliner berat / pelanggaran etika kerja',
  },
];

export const DEFAULT_OPERATOR_PARAMETERS: DynamicParameter[] = [
  {
    id: 'op_discipline',
    category: 'Operator',
    name: 'Discipline (Kehadiran & ATR)',
    code: 'DISCIPLINE',
    weight: 20,
    description: 'ATR (Attendance Rate) & Waktu Kehadiran',
    dataSource: 'Database ATR Darwinbox',
    autoThreshold: {
      metricType: 'atr',
      minL4: 98,
      minL3: 96,
      minL2: 94,
      maxLateL4: 0,
      maxLateL3: 0,
      maxLateL2: 4,
      unit: '%',
    },
    criteria: {
      1: 'ATR < 94% / Mangkir ≥ 1x / Terlambat > 4x',
      2: '94% ≤ ATR < 96% / Terlambat 1–4x',
      3: '96% ≤ ATR < 98% / Tidak terlambat & tidak mangkir',
      4: 'ATR ≥ 98% / Tidak terlambat & tidak mangkir',
    },
  },
  {
    id: 'op_productivity',
    category: 'Operator',
    name: 'Productivity (Ritase/Tonnage)',
    code: 'PRODUCTIVITY',
    weight: 25,
    description: 'Achievement vs Target Ritase/Tonnage (Prodty MCR)',
    dataSource: 'Database Prodty MCR',
    autoThreshold: {
      metricType: 'productivity',
      minL4: 105,
      minL3: 100,
      minL2: 90,
      unit: '%',
    },
    criteria: {
      1: 'Achievement < 90%',
      2: '90% ≤ Achievement < 100%',
      3: '100% ≤ Achievement < 105%',
      4: 'Achievement ≥ 105%',
    },
  },
  {
    id: 'op_safety',
    category: 'Operator',
    name: 'Safety (Hazard Report / SAP)',
    code: 'SAFETY',
    weight: 25,
    description: 'Achievement SAP (Hazard Report) & Terlibat Insiden',
    dataSource: 'SAP = Hazard Report',
    autoThreshold: {
      metricType: 'sap',
      minL4: 4,
      minL3: 3,
      minL2: 1,
      unit: 'Laporan',
    },
    criteria: {
      1: 'SAP = 0 ATAU Insiden ≥ 1x',
      2: '1 ≤ SAP < 3 & Tidak ada insiden',
      3: '3 ≤ SAP < 4 & Tidak ada insiden',
      4: 'SAP ≥ 4 & Tidak ada insiden',
    },
  },
  {
    id: 'op_machine',
    category: 'Operator',
    name: 'Machine Application',
    code: 'MACHINE_APP',
    weight: 15,
    description: 'Kejadian Misoperasi & Kepatuhan Temuan MTO',
    dataSource: 'Database Misoperasi MTC & Trainer',
    autoThreshold: {
      metricType: 'misoperasi',
      minL4: 0,
      minL3: 1,
      minL2: 2,
      unit: 'Kali',
    },
    criteria: {
      1: 'Misoperasi ≥ 3x / Property Damage / Temuan MTO ≥ 2x',
      2: 'Misoperasi = 2x / Temuan MTO = 1x',
      3: 'Misoperasi = 1x / Tidak ada temuan MTO',
      4: 'Misoperasi = 0 & Tidak ada temuan MTO 2 bulan berturut',
    },
  },
  {
    id: 'op_daily_report',
    category: 'Operator',
    name: 'Daily Report (Timesheet)',
    code: 'DAILY_REPORT',
    weight: 15,
    description: 'Pengumpulan Timesheet Operasional Alat Berat',
    dataSource: 'Database Record Timesheet',
    autoThreshold: {
      metricType: 'timesheet',
      minL4: 4,
      minL3: 3,
      minL2: 2,
    },
    criteria: {
      1: 'Pengumpulan Timesheet tidak dilakukan ≥ 1x',
      2: 'Pengumpulan Timesheet terlambat ≥ 1x',
      3: 'Pengumpulan Timesheet lengkap',
      4: 'Pengumpulan Timesheet lengkap & valid',
    },
  },
];

export const DEFAULT_NONOM_PARAMETERS: DynamicParameter[] = [
  {
    id: 'non_disiplin',
    category: 'Nonom',
    name: 'Disiplin (Kehadiran & ATR)',
    code: 'DISIPLIN',
    weight: 25,
    description: 'ATR / Waktu Kehadiran / Kedisiplinan Kerja',
    dataSource: 'Darwinbox & Laporan GL Coach',
    autoThreshold: {
      metricType: 'atr',
      minL4: 98,
      minL3: 96,
      minL2: 94,
      maxLateL4: 0,
      maxLateL3: 0,
      maxLateL2: 4,
      unit: '%',
    },
    criteria: {
      1: 'ATR < 94% / Mangkir ≥ 1x / Meninggalkan lokasi kerja',
      2: '94% ≤ ATR < 96% / Terlambat 1–4x / Meninggalkan lokasi',
      3: '96% ≤ ATR < 98% / Tidak terlambat / Tidak pernah meninggalkan lokasi',
      4: 'ATR ≥ 98% / Tidak terlambat / Tidak pernah meninggalkan lokasi',
    },
  },
  {
    id: 'non_safety',
    category: 'Nonom',
    name: 'Safety (Hazard Report SAP)',
    code: 'SAFETY',
    weight: 25,
    description: 'Achievement SAP / Terlibat Insiden',
    dataSource: 'SAP Hazard Report',
    autoThreshold: {
      metricType: 'sap',
      minL4: 4,
      minL3: 3,
      minL2: 1,
      unit: 'Laporan',
    },
    criteria: {
      1: 'Achievement 0% / Insiden ≥ 1x',
      2: '80% ≤ Achievement < 90% / Tidak ada insiden',
      3: '90% ≤ Achievement < 100% / Tidak ada insiden',
      4: 'Achievement ≥ 100% / Tidak ada insiden',
    },
  },
  {
    id: 'non_work_quality',
    category: 'Nonom',
    name: 'Work Quality (Administrasi)',
    code: 'WORK_QUALITY',
    weight: 25,
    description: 'Kualitas dari hasil pekerjaan & kelengkapan administrasi',
    dataSource: 'Hasil pencatatan lapangan',
    autoThreshold: {
      metricType: 'timesheet',
      minL4: 4,
      minL3: 3,
      minL2: 2,
    },
    criteria: {
      1: 'Administrasi kerja tidak lengkap',
      2: 'Administrasi kerja cukup',
      3: 'Administrasi kerja baik',
      4: 'Administrasi kerja baik & rapi',
    },
  },
  {
    id: 'non_teamwork',
    category: 'Nonom',
    name: 'Teamwork & Response',
    code: 'TEAMWORK',
    weight: 25,
    description: 'Kerjasama tim dan respon arahan atasan',
    dataSource: 'Laporan GL Coach',
    autoThreshold: {
      metricType: 'generic_numeric',
      minL4: 90,
      minL3: 80,
      minL2: 70,
      unit: 'Poin',
    },
    criteria: {
      1: 'Sering melawan perintah atasan',
      2: 'Sering tidak menuruti petunjuk',
      3: 'Menuruti semua petunjuk',
      4: 'Menuruti semua petunjuk & proaktif',
    },
  },
];

/**
 * Auto-evaluates a parameter score (1-4) based on supporting operational raw metrics and parameter threshold configuration
 */
export function evaluateParameterScore(
  param: DynamicParameter,
  metrics: RawMetricsData
): { level: 1 | 2 | 3 | 4; reason: string } {
  if (!param.autoThreshold) {
    return { level: 3, reason: 'Evaluasi Manual' };
  }

  const th = param.autoThreshold;

  switch (th.metricType) {
    case 'atr': {
      const atr = metrics.atrRate ?? 98;
      const late = metrics.terlambatCount ?? 0;
      const mangkir = metrics.mangkirCount ?? 0;

      const maxLate4 = th.maxLateL4 ?? 0;
      const maxLate3 = th.maxLateL3 ?? 0;
      const maxLate2 = th.maxLateL2 ?? 4;

      if (mangkir >= 1) {
        return { level: 1, reason: `Mangkir ${mangkir}x (Nilai 1)` };
      }
      if (atr >= th.minL4 && late <= maxLate4) {
        return { level: 4, reason: `ATR ${atr}% (≥ ${th.minL4}%) & Terlambat ${late}x (≤ ${maxLate4}x)` };
      }
      if (atr >= th.minL3 && late <= maxLate3) {
        return { level: 3, reason: `ATR ${atr}% (≥ ${th.minL3}%) & Terlambat ${late}x (≤ ${maxLate3}x)` };
      }
      if (atr >= th.minL2 && late <= maxLate2) {
        return { level: 2, reason: `ATR ${atr}% (≥ ${th.minL2}%) & Terlambat ${late}x (≤ ${maxLate2}x)` };
      }
      return { level: 1, reason: `ATR ${atr}% (< ${th.minL2}%) atau Terlambat ${late}x (> ${maxLate2}x)` };
    }

    case 'productivity': {
      const prod = metrics.productivityRate ?? 100;
      if (prod >= th.minL4) {
        return { level: 4, reason: `Produktivitas ${prod}% (≥ ${th.minL4}%)` };
      }
      if (prod >= th.minL3) {
        return { level: 3, reason: `Produktivitas ${prod}% (≥ ${th.minL3}%)` };
      }
      if (prod >= th.minL2) {
        return { level: 2, reason: `Produktivitas ${prod}% (≥ ${th.minL2}%)` };
      }
      return { level: 1, reason: `Produktivitas ${prod}% (< ${th.minL2}%)` };
    }

    case 'sap': {
      const sap = metrics.sapCount ?? 4;
      const inc = metrics.incidentCount ?? 0;
      if (inc >= 1) {
        return { level: 1, reason: `Terlibat insiden ${inc}x (Nilai 1)` };
      }
      if (sap >= th.minL4) {
        return { level: 4, reason: `SAP ${sap} Laporan (≥ ${th.minL4}) & Insiden 0x` };
      }
      if (sap >= th.minL3) {
        return { level: 3, reason: `SAP ${sap} Laporan (≥ ${th.minL3}) & Insiden 0x` };
      }
      if (sap >= th.minL2) {
        return { level: 2, reason: `SAP ${sap} Laporan (≥ ${th.minL2}) & Insiden 0x` };
      }
      return { level: 1, reason: `SAP ${sap} Laporan (< ${th.minL2})` };
    }

    case 'misoperasi': {
      const mis = metrics.misoperasiCount ?? 0;
      const mto = metrics.mtoCount ?? 0;
      if (mis === 0 && mto === 0) {
        return { level: 4, reason: 'Misoperasi 0x & Temuan MTO 0x' };
      }
      if (mis <= 1 && mto === 0) {
        return { level: 3, reason: `Misoperasi ${mis}x & Temuan MTO 0x` };
      }
      if (mis <= 2 || mto <= 1) {
        return { level: 2, reason: `Misoperasi ${mis}x / Temuan MTO ${mto}x` };
      }
      return { level: 1, reason: `Misoperasi ${mis}x / Temuan MTO ${mto}x` };
    }

    case 'timesheet': {
      const st = metrics.timesheetStatus || 'Lengkap & Valid';
      if (st === 'Lengkap & Valid' || st === 'Sangat Baik' || st === 'Sangat Rapi') {
        return { level: 4, reason: `Status '${st}'` };
      }
      if (st === 'Lengkap' || st === 'Baik') {
        return { level: 3, reason: `Status '${st}'` };
      }
      if (st === 'Terlambat' || st === 'Cukup') {
        return { level: 2, reason: `Status '${st}'` };
      }
      return { level: 1, reason: `Status '${st}'` };
    }

    default: {
      const val = metrics.genericValue ?? 85;
      if (val >= th.minL4) return { level: 4, reason: `Nilai Data ${val} ≥ ${th.minL4}` };
      if (val >= th.minL3) return { level: 3, reason: `Nilai Data ${val} ≥ ${th.minL3}` };
      if (val >= th.minL2) return { level: 2, reason: `Nilai Data ${val} ≥ ${th.minL2}` };
      return { level: 1, reason: `Nilai Data ${val} < ${th.minL2}` };
    }
  }
}

/**
 * Calculates MER Score following exact PRD formula:
 * Skor MER Akhir = (∑ (Nilai Parameter × Bobot)) + Poin Merit - Poin Demerit
 * Rule Merit & Demerit: If multiple items earned, take the maximum point item.
 */
export function calculateMerScore(
  scores: Record<string, number>,
  parameters: DynamicParameter[],
  selectedMeritIds: string[],
  selectedDemeritIds: string[],
  meritRules: MeritRule[] = DEFAULT_MERIT_RULES,
  demeritRules: DemeritRule[] = DEFAULT_DEMERIT_RULES
): {
  baseScore: number;
  meritPoint: number;
  demeritPoint: number;
  finalScore: number;
} {
  // Total weight check
  let baseSum = 0;
  let totalWeight = 0;

  parameters.forEach((param) => {
    const scoreVal = scores[param.id] || 0;
    baseSum += scoreVal * (param.weight / 100);
    totalWeight += param.weight;
  });

  // Normalize if total weight differs from 100
  const baseScore = totalWeight > 0 ? (baseSum * 100) / totalWeight : baseSum;

  // Merit rule: largest value among selected merit parameters
  let meritPoint = 0;
  if (selectedMeritIds.length > 0) {
    const points = selectedMeritIds
      .map((id) => meritRules.find((m) => m.id === id)?.points || 0);
    meritPoint = Math.max(0, ...points);
  }

  // Demerit rule: largest value among selected demerit parameters
  let demeritPoint = 0;
  if (selectedDemeritIds.length > 0) {
    const points = selectedDemeritIds
      .map((id) => demeritRules.find((d) => d.id === id)?.points || 0);
    demeritPoint = Math.max(0, ...points);
  }

  const finalScore = Math.max(0, Number((baseScore + meritPoint - demeritPoint).toFixed(2)));

  return {
    baseScore: Number(baseScore.toFixed(2)),
    meritPoint: Number(meritPoint.toFixed(2)),
    demeritPoint: Number(demeritPoint.toFixed(2)),
    finalScore,
  };
}

export function getScoreCategoryBadge(score: number): {
  label: string;
  badgeClass: string;
  borderClass: string;
  color: string;
  textClass: string;
  pillSolidClass: string;
} {
  if (score >= 3.0) {
    return {
      label: 'Baik',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
      borderClass: 'border-emerald-500',
      color: '#22c55e',
      textClass: 'text-emerald-400',
      pillSolidClass: 'bg-emerald-600 text-white',
    };
  } else if (score >= 2.0) {
    return {
      label: 'Cukup',
      badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40',
      borderClass: 'border-orange-500',
      color: '#f97316',
      textClass: 'text-orange-400',
      pillSolidClass: 'bg-orange-500 text-white',
    };
  } else if (score >= 1.0) {
    return {
      label: 'Kurang',
      badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/40',
      borderClass: 'border-yellow-500',
      color: '#eab308',
      textClass: 'text-yellow-400',
      pillSolidClass: 'bg-yellow-400 text-slate-950 font-black',
    };
  } else {
    return {
      label: 'Buruk',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40',
      borderClass: 'border-rose-500',
      color: '#ef4444',
      textClass: 'text-rose-500',
      pillSolidClass: 'bg-rose-600 text-white',
    };
  }
}

export function getScoreFontColor(score: number): {
  color: string;
  tailwindClass: string;
} {
  if (score >= 3.0) {
    return { color: '#22c55e', tailwindClass: 'text-emerald-400' };
  } else if (score >= 2.0) {
    return { color: '#f97316', tailwindClass: 'text-orange-400' };
  } else if (score >= 1.0) {
    return { color: '#facc15', tailwindClass: 'text-yellow-400' };
  } else {
    return { color: '#ef4444', tailwindClass: 'text-rose-500' };
  }
}

export function formatPeriodLabel(periodString: string): string {
  if (!periodString) return '';
  const [year, month] = periodString.split('-');
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex] || month} ${year}`;
}

export const AVAILABLE_PERIODS_2026 = [
  { value: '2026-01', label: 'Januari 2026' },
  { value: '2026-02', label: 'Februari 2026' },
  { value: '2026-03', label: 'Maret 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'Desember 2026' },
];

/**
 * Calculates default period: Previous month of the current date.
 * E.g., if current system month is August 2026, default is July 2026 ('2026-07').
 */
export function getDefaultPreviousPeriod(): string {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prevMonthDate.getFullYear();
  const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getParameterIndicatorDetails(
  param: DynamicParameter,
  report?: MonthlyReport | null,
  overrideScore?: number
): {
  indicatorText: string;
  criteriaText: string;
  sourceText: string;
  level: number;
} {
  const scoreVal = overrideScore !== undefined ? overrideScore : (report?.scores?.[param.id] || 0);
  const criteriaText = param.criteria?.[scoreVal as 1 | 2 | 3 | 4] || 'Belum dievaluasi';
  const sourceText = param.dataSource || 'Data Operasional';

  const raw = report?.rawMetrics;
  let indicatorText = '';

  if (raw) {
    if (param.id === 'op_discipline' || param.id === 'non_disiplin') {
      const atr = raw['ATR Kehadiran'] || (raw.atrRate ? `${raw.atrRate}%` : '');
      const late = raw['Terlambat / Mangkir'] || (raw.terlambatCount !== undefined ? `${raw.terlambatCount}x Terlambat` : '');
      indicatorText = [atr ? `ATR: ${atr}` : '', late ? `Disiplin: ${late}` : ''].filter(Boolean).join(' • ');
    } else if (param.id === 'op_productivity') {
      const prod = raw['Productivity'] || (raw.productivityRate ? `${raw.productivityRate}%` : '');
      indicatorText = prod ? `Pencapaian: ${prod}` : '';
    } else if (param.id === 'op_safety' || param.id === 'non_safety') {
      const sap = raw['SAP Hazard Report'] || (raw.sapCount !== undefined ? `${raw.sapCount} Laporan` : '');
      const inc = raw['Insiden K3'] || (raw.incidentCount !== undefined ? `${raw.incidentCount} Insiden` : '');
      indicatorText = [sap ? `SAP: ${sap}` : '', inc ? `Insiden: ${inc}` : ''].filter(Boolean).join(' • ');
    } else if (param.id === 'op_machine') {
      const mis = raw['Misoperasi'] || (raw.misoperasiCount !== undefined ? `${raw.misoperasiCount}x` : '');
      indicatorText = mis ? `Misoperasi: ${mis}` : '';
    } else if (param.id === 'op_daily_report' || param.id === 'non_work_quality') {
      const ts = raw['Timesheet Status'] || raw['Kualitas Administrasi'] || raw.timesheetStatus || '';
      indicatorText = ts ? `Status: ${ts}` : '';
    } else if (param.id === 'non_teamwork') {
      const tw = raw['Teamwork & Respon'] || (raw.genericValue !== undefined ? `${raw.genericValue} Poin` : '');
      indicatorText = tw ? `Skor Respon: ${tw}` : '';
    } else {
      const direct = raw[param.name] || raw[param.code];
      if (direct) indicatorText = `Data: ${direct}`;
    }
  }

  // If no explicit raw metric was stored, synthesize an accurate indicator from achieved criteria
  if (!indicatorText && scoreVal > 0) {
    if (param.id === 'op_discipline' || param.id === 'non_disiplin') {
      indicatorText = scoreVal === 4 ? 'ATR: ≥ 98% (0 Terlambat/Mangkir)' : scoreVal === 3 ? 'ATR: 96% - 98%' : scoreVal === 2 ? 'ATR: 94% - 96%' : 'ATR: < 94%';
    } else if (param.id === 'op_productivity') {
      indicatorText = scoreVal === 4 ? 'Pencapaian: ≥ 105%' : scoreVal === 3 ? 'Pencapaian: 100% - 105%' : scoreVal === 2 ? 'Pencapaian: 90% - 100%' : 'Pencapaian: < 90%';
    } else if (param.id === 'op_safety' || param.id === 'non_safety') {
      indicatorText = scoreVal === 4 ? 'SAP: ≥ 4 Laporan & 0 Insiden' : scoreVal === 3 ? 'SAP: 3 Laporan & 0 Insiden' : scoreVal === 2 ? 'SAP: 1-2 Laporan' : 'SAP: 0 Laporan / Ada Insiden';
    } else if (param.id === 'op_machine') {
      indicatorText = scoreVal === 4 ? 'Misoperasi: 0x & Temuan MTO 0x' : scoreVal === 3 ? 'Misoperasi: 1x' : scoreVal === 2 ? 'Misoperasi: 2x' : 'Misoperasi: ≥ 3x / Damage';
    } else if (param.id === 'op_daily_report' || param.id === 'non_work_quality') {
      indicatorText = scoreVal === 4 ? 'Status: Lengkap & Valid' : scoreVal === 3 ? 'Status: Lengkap' : scoreVal === 2 ? 'Status: Terlambat' : 'Status: Tidak Mengumpulkan';
    } else if (param.id === 'non_teamwork') {
      indicatorText = scoreVal === 4 ? 'Skor Respon: ≥ 90 Poin (Proaktif)' : scoreVal === 3 ? 'Skor Respon: ≥ 80 Poin' : scoreVal === 2 ? 'Skor Respon: ≥ 70 Poin' : 'Skor Respon: < 70 Poin';
    } else {
      indicatorText = `Kriteria: ${criteriaText.split('/')[0].trim()}`;
    }
  }

  return {
    indicatorText: indicatorText || 'Data indikator standar',
    criteriaText,
    sourceText,
    level: scoreVal,
  };
}
