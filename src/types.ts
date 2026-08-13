export type UserRole = 'admin' | 'head_coach' | 'group_leader' | 'subordinate';
export type SubordinateCategory = 'Operator' | 'Nonom';

export type WorkArea = 'CY' | 'Hauling' | 'Stockpile' | 'Jetty';
export const WORK_AREAS: WorkArea[] = ['CY', 'Hauling', 'Stockpile', 'Jetty'];

export type HeavyEquipmentType =
  | 'Reach Stacker'
  | 'Forklift'
  | 'Flat Deck'
  | 'Dump Truck'
  | 'Water Truck'
  | 'Wheel Loader'
  | 'Excavator'
  | 'Buldozer'
  | 'Barge Loading Conveyor (BLC)';

export interface Employee {
  id: string;
  nik: string; // Used for login
  name: string;
  password?: string; // Account password
  role: UserRole;
  category: SubordinateCategory;
  equipmentType?: HeavyEquipmentType;
  department: string; // Area Kerja: "CY", "Hauling", "Stockpile", "Jetty"
  groupLeaderId?: string; // NIK or ID of Group Leader
  groupLeaderName?: string;
  position: string; // e.g., "Senior Heavy Operator", "Helper Stockpile", "Group Leader Logistics"
  photoUrl?: string;
}

export interface ParameterCriterion {
  level: 1 | 2 | 3 | 4;
  description: string;
}

export interface AutoThresholdConfig {
  metricType: 'atr' | 'productivity' | 'sap' | 'misoperasi' | 'timesheet' | 'generic_numeric';
  minL4: number; // e.g. 98 for ATR >= 98%, 105 for Productivity >= 105%, 4 for SAP >= 4
  minL3: number; // e.g. 96 for ATR >= 96%, 100 for Productivity >= 100%, 3 for SAP >= 3
  minL2: number; // e.g. 94 for ATR >= 94%, 90 for Productivity >= 90%, 1 for SAP >= 1
  maxLateL4?: number; // e.g. 0
  maxLateL3?: number; // e.g. 0
  maxLateL2?: number; // e.g. 4
  maxIncidentL4?: number; // e.g. 0
  unit?: string; // e.g. "%", "Laporan", "Kali"
}

export interface RawMetricsData {
  atrRate?: number;
  terlambatCount?: number;
  mangkirCount?: number;
  productivityRate?: number;
  sapCount?: number;
  incidentCount?: number;
  misoperasiCount?: number;
  mtoCount?: number;
  timesheetStatus?: string;
  genericValue?: number;
  [key: string]: any;
}

export interface DynamicParameter {
  id: string;
  category: SubordinateCategory;
  name: string;
  code: string;
  weight: number; // percentage, e.g. 20 for 20%
  description: string;
  criteria: Record<1 | 2 | 3 | 4, string>;
  dataSource?: string;
  autoThreshold?: AutoThresholdConfig;
}

export interface MeritRule {
  id: string;
  code: string;
  label: string;
  points: number; // e.g. 0.2, 0.3, 0.5
  description: string;
}

export interface DemeritRule {
  id: string;
  code: string;
  label: string;
  points: number; // e.g. 0.2, 0.3, 0.5, 1.0 (subtracted)
  description: string;
}

export interface MonthlyReport {
  id: string;
  nik: string;
  employeeName: string;
  department: string;
  category: SubordinateCategory;
  equipmentType?: HeavyEquipmentType;
  period: string; // Format: "YYYY-MM", e.g., "2026-08"
  scores: Record<string, number>; // parameterId -> score (1..4)
  rawMetrics?: Record<string, string>; // raw data e.g. ATR percentage, SAP count
  meritItems: string[]; // ids of selected merit rules
  demeritItems: string[]; // ids of selected demerit rules
  baseScore: number; // Weighted sum (1.00 - 4.00)
  meritPoint: number; // Max merit point applied
  demeritPoint: number; // Max demerit point applied
  finalScore: number; // baseScore + meritPoint - demeritPoint
  evaluatorNik: string;
  evaluatorName: string;
  notes?: string;
  updatedAt: string;
}

export interface TeamSummary {
  glNik: string;
  glName: string;
  department: string;
  totalMembers: number;
  averageScore: number;
  topPerformer?: { name: string; score: number };
  needsCoachingCount: number;
}
