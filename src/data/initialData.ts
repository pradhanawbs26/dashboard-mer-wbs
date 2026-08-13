import { Employee, MonthlyReport, HeavyEquipmentType } from '../types';
import {
  DEFAULT_OPERATOR_PARAMETERS,
  DEFAULT_NONOM_PARAMETERS,
  calculateMerScore,
  DEFAULT_MERIT_RULES,
  DEFAULT_DEMERIT_RULES,
} from '../utils/calculations';

export const HEAVY_EQUIPMENT_LIST: HeavyEquipmentType[] = [
  'Reach Stacker',
  'Forklift',
  'Flat Deck',
  'Dump Truck',
  'Water Truck',
  'Wheel Loader',
  'Excavator',
  'Buldozer',
  'Barge Loading Conveyor (BLC)',
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // Admin
  {
    id: 'emp_admin',
    nik: 'admin',
    name: 'Administrator MER System',
    password: 'admin123',
    role: 'admin',
    category: 'Nonom',
    department: 'CY',
    position: 'System Administrator',
  },
];

// Generator function to build realistic monthly reports for Jan-Aug 2026
export function generateInitialReports(): MonthlyReport[] {
  const periods = ['2026-05', '2026-06', '2026-07', '2026-08'];
  const reports: MonthlyReport[] = [];

  INITIAL_EMPLOYEES.filter(
    (e) => e.role === 'subordinate' || e.role === 'group_leader'
  ).forEach((emp) => {
    periods.forEach((period) => {
      const isOperator = emp.category === 'Operator';
      const params = isOperator
        ? DEFAULT_OPERATOR_PARAMETERS
        : DEFAULT_NONOM_PARAMETERS;

      // Seed varied performance based on NIK for realism
      const seed = (parseInt(emp.nik, 10) + parseInt(period.replace('-', ''), 10)) % 10;

      const scores: Record<string, number> = {};
      params.forEach((p, idx) => {
        if (seed > 7) {
          scores[p.id] = (idx % 2 === 0) ? 4 : 3;
        } else if (seed > 4) {
          scores[p.id] = 3;
        } else if (seed > 1) {
          scores[p.id] = (idx === 0) ? 2 : 3;
        } else {
          scores[p.id] = (idx % 2 === 0) ? 2 : 1;
        }
      });

      const meritItems: string[] = [];
      const demeritItems: string[] = [];

      if (seed >= 6) {
        meritItems.push('merit_ss');
      }
      if (seed === 9) {
        meritItems.push('merit_qcc');
      }
      if (seed === 1) {
        demeritItems.push('demerit_sp1');
      }
      if (seed === 0) {
        demeritItems.push('demerit_ftw');
      }

      const calc = calculateMerScore(
        scores,
        params,
        meritItems,
        demeritItems,
        DEFAULT_MERIT_RULES,
        DEFAULT_DEMERIT_RULES
      );

      const evaluatorNik =
        emp.role === 'group_leader' ? '1000' : emp.groupLeaderId || '1001';
      const evaluatorName =
        emp.role === 'group_leader'
          ? 'Dharmawan Kustanto'
          : emp.groupLeaderName || 'Ahmad Hidayat';

      reports.push({
        id: `rep_${emp.nik}_${period}`,
        nik: emp.nik,
        employeeName: emp.name,
        department: emp.department,
        category: emp.category,
        equipmentType: emp.equipmentType,
        period,
        scores,
        rawMetrics: isOperator
          ? {
              ATR: seed > 5 ? '99%' : '95%',
              Productivity: seed > 5 ? '108%' : '98%',
              SAP: seed > 5 ? '4 Report' : '2 Report',
              Misoperasi: seed < 2 ? '1 Kali' : '0 Kali',
              Timesheet: 'Lengkap & Valid',
            }
          : {
              ATR: seed > 5 ? '98.5%' : '94.5%',
              SAP: seed > 5 ? '100%' : '85%',
              Kualitas: 'Lengkap dan Rapi',
              Kerjasama: 'Sangat Proaktif',
            },
        meritItems,
        demeritItems,
        baseScore: calc.baseScore,
        meritPoint: calc.meritPoint,
        demeritPoint: calc.demeritPoint,
        finalScore: calc.finalScore,
        evaluatorNik,
        evaluatorName,
        notes:
          seed >= 6
            ? 'Kinerja sangat memuaskan, konsisten menjaga K3LH dan produktivitas tim.'
            : seed <= 1
            ? 'Perlu perhatian khusus pada disiplin operasional dan supervisi tim.'
            : 'Performa stabil sesuai kriteria standar operasional.',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return reports;
}

