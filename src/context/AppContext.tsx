import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  MonthlyReport,
  DynamicParameter,
  MeritRule,
  DemeritRule,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  generateInitialReports,
} from '../data/initialData';
import {
  DEFAULT_OPERATOR_PARAMETERS,
  DEFAULT_NONOM_PARAMETERS,
  DEFAULT_MERIT_RULES,
  DEFAULT_DEMERIT_RULES,
  getDefaultPreviousPeriod,
} from '../utils/calculations';
import {
  isFirebaseConfigured,
  fetchEmployeesFromFirebase,
  fetchReportsFromFirebase,
  fetchSettingsFromFirebase,
  saveEmployeeToFirebase,
  deleteEmployeeFromFirebase,
  saveBulkEmployeesToFirebase,
  saveReportToFirebase,
  deleteReportFromFirebase,
  saveBulkReportsToFirebase,
  saveSettingToFirebase,
} from '../lib/firebase';

interface AppContextType {
  currentUser: Employee | null;
  employees: Employee[];
  reports: MonthlyReport[];
  operatorParameters: DynamicParameter[];
  nonomParameters: DynamicParameter[];
  meritRules: MeritRule[];
  demeritRules: DemeritRule[];
  selectedPeriod: string; // "YYYY-MM"
  setSelectedPeriod: (period: string) => void;
  login: (nik: string, pass: string) => boolean;
  quickLogin: (nik: string) => void;
  logout: () => void;
  // Master Data CRUD
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  bulkImportEmployees: (newEmps: (Omit<Employee, 'id'> | Employee)[]) => Promise<boolean>;
  // Reports CRUD & Bulk
  saveMonthlyReport: (report: MonthlyReport) => void;
  deleteMonthlyReport: (id: string) => void;
  bulkImportReports: (newReports: MonthlyReport[]) => Promise<boolean>;
  // Parameter Customization Engine
  updateOperatorParameters: (params: DynamicParameter[]) => void;
  updateNonomParameters: (params: DynamicParameter[]) => void;
  updateMeritRules: (rules: MeritRule[]) => void;
  updateDemeritRules: (rules: DemeritRule[]) => void;
  resetAllDataToDefault: () => void;
  // Cloud Sync
  isSyncingFirebase: boolean;
  syncAllDataToFirebase: () => Promise<{ success: boolean; count: number; message: string }>;
  refreshFromFirebase: (force?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('mer_current_user');
    if (!saved) return null;
    try {
      const parsed: Employee | null = JSON.parse(saved);
      return parsed;
    } catch {
      return null;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('mer_employees');
    if (!saved) return INITIAL_EMPLOYEES;
    try {
      const parsed: Employee[] = JSON.parse(saved);
      if (!parsed.some((e) => e.nik === 'admin')) {
        parsed.unshift(INITIAL_EMPLOYEES[0]);
      }
      return parsed;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [reports, setReports] = useState<MonthlyReport[]>(() => {
    const saved = localStorage.getItem('mer_reports');
    if (!saved) return generateInitialReports();
    try {
      const parsed: MonthlyReport[] = JSON.parse(saved);
      return parsed;
    } catch {
      return generateInitialReports();
    }
  });

  const [operatorParameters, setOperatorParameters] = useState<DynamicParameter[]>(() => {
    const saved = localStorage.getItem('mer_operator_params');
    return saved ? JSON.parse(saved) : DEFAULT_OPERATOR_PARAMETERS;
  });

  const [nonomParameters, setNonomParameters] = useState<DynamicParameter[]>(() => {
    const saved = localStorage.getItem('mer_nonom_params');
    return saved ? JSON.parse(saved) : DEFAULT_NONOM_PARAMETERS;
  });

  const [meritRules, setMeritRules] = useState<MeritRule[]>(() => {
    const saved = localStorage.getItem('mer_merit_rules');
    if (!saved) return DEFAULT_MERIT_RULES;
    try {
      const parsed: MeritRule[] = JSON.parse(saved);
      return parsed.map((rule) => {
        const defaultRule = DEFAULT_MERIT_RULES.find((d) => d.id === rule.id);
        if (defaultRule) {
          return {
            ...rule,
            label: defaultRule.label,
            description: defaultRule.description,
          };
        }
        return rule;
      });
    } catch {
      return DEFAULT_MERIT_RULES;
    }
  });

  const [demeritRules, setDemeritRules] = useState<DemeritRule[]>(() => {
    const saved = localStorage.getItem('mer_demerit_rules');
    return saved ? JSON.parse(saved) : DEFAULT_DEMERIT_RULES;
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => getDefaultPreviousPeriod());

  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const isFetchingRef = React.useRef(false);
  const hasInitializedRef = React.useRef(false);

  // Sync with Firebase with smart caching and loop prevention
  const refreshFromFirebase = async (force: boolean = false) => {
    if (!isFirebaseConfigured()) return;
    if (isFetchingRef.current) return;

    // Cooldown check (15 minutes) unless explicitly forced by user
    if (!force) {
      const lastSync = localStorage.getItem('mer_last_fb_sync_ts');
      const hasLocalEmployees = localStorage.getItem('mer_employees');
      if (lastSync && hasLocalEmployees) {
        const timeSinceSync = Date.now() - parseInt(lastSync, 10);
        // If synced within 15 minutes, skip auto-fetch to protect Firestore quota
        if (timeSinceSync < 15 * 60 * 1000) {
          return;
        }
      }
    }

    isFetchingRef.current = true;
    setIsSyncingFirebase(true);

    try {
      let fbEmps: Employee[] | null = null;
      let fbReports: MonthlyReport[] | null = null;

      // Fetch data according to role
      if (currentUser?.role === 'subordinate') {
        // Subordinates fetch their own reports + all employees (for GL/HC info) + settings
        const [subReports, emps, fbSettings] = await Promise.all([
          fetchReportsFromFirebase({ nik: currentUser.nik, limitCount: 48 }),
          fetchEmployeesFromFirebase({ limitCount: 1000 }),
          fetchSettingsFromFirebase(),
        ]);
        fbReports = subReports;
        fbEmps = emps;
      } else {
        // Admin, Head Coach, or Group Leader: Fetch all employees and reports
        const [emps, reps, fbSettings] = await Promise.all([
          fetchEmployeesFromFirebase({ limitCount: 1000 }),
          fetchReportsFromFirebase({ limitCount: 1500 }),
          fetchSettingsFromFirebase(),
        ]);
        fbEmps = emps;
        fbReports = reps;

        if (fbSettings) {
          if (fbSettings.operatorParameters && Array.isArray(fbSettings.operatorParameters)) {
            setOperatorParameters(fbSettings.operatorParameters);
          }
          if (fbSettings.nonomParameters && Array.isArray(fbSettings.nonomParameters)) {
            setNonomParameters(fbSettings.nonomParameters);
          }
          if (fbSettings.meritRules && Array.isArray(fbSettings.meritRules)) {
            setMeritRules(fbSettings.meritRules);
          }
          if (fbSettings.demeritRules && Array.isArray(fbSettings.demeritRules)) {
            setDemeritRules(fbSettings.demeritRules);
          }
        }
      }

      if (fbEmps && fbEmps.length > 0) {
        setEmployees((prev) => {
          const map = new Map<string, Employee>();
          prev.forEach((e) => {
            if (e.nik) map.set(e.nik, e);
          });
          fbEmps?.forEach((e) => {
            if (e.nik) {
              const existing = map.get(e.nik);
              map.set(e.nik, existing ? { ...existing, ...e } : e);
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem('mer_employees', JSON.stringify(merged));
          return merged;
        });
      }

      if (fbReports && fbReports.length > 0) {
        setReports((prev) => {
          const map = new Map<string, MonthlyReport>();
          prev.forEach((r) => {
            if (r.nik && r.period) map.set(`${r.nik}_${r.period}`, r);
          });
          fbReports?.forEach((r) => {
            if (r.nik && r.period) {
              const key = `${r.nik}_${r.period}`;
              const existing = map.get(key);
              if (!existing) {
                map.set(key, r);
              } else {
                const cloudTime = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
                const localTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                if (cloudTime >= localTime) {
                  map.set(key, { ...existing, ...r });
                }
              }
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem('mer_reports', JSON.stringify(merged));
          return merged;
        });
      }

      localStorage.setItem('mer_last_fb_sync_ts', String(Date.now()));
    } catch (err) {
      console.error('Error refreshing from Firebase:', err);
    } finally {
      isFetchingRef.current = false;
      setIsSyncingFirebase(false);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      refreshFromFirebase(false);
    }
  }, []);

  const syncAllDataToFirebase = async (): Promise<{ success: boolean; count: number; message: string }> => {
    setIsSyncingFirebase(true);
    try {
      const empSuccess = await saveBulkEmployeesToFirebase(employees);
      const repSuccess = await saveBulkReportsToFirebase(reports);
      await Promise.all([
        saveSettingToFirebase('operatorParameters', operatorParameters),
        saveSettingToFirebase('nonomParameters', nonomParameters),
        saveSettingToFirebase('meritRules', meritRules),
        saveSettingToFirebase('demeritRules', demeritRules),
      ]);

      return {
        success: empSuccess,
        count: employees.length,
        message: empSuccess
          ? `Berhasil menyinkronkan ${employees.length} Karyawan & ${reports.length} Laporan ke Firestore Database`
          : 'Sinkronisasi gagal, periksa koneksi internet atau security rules Firebase',
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: `Gagal sinkron: ${err?.message || 'Error tidak diketahui'}`,
      };
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('mer_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('mer_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('mer_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('mer_operator_params', JSON.stringify(operatorParameters));
  }, [operatorParameters]);

  useEffect(() => {
    localStorage.setItem('mer_nonom_params', JSON.stringify(nonomParameters));
  }, [nonomParameters]);

  useEffect(() => {
    localStorage.setItem('mer_merit_rules', JSON.stringify(meritRules));
  }, [meritRules]);

  useEffect(() => {
    localStorage.setItem('mer_demerit_rules', JSON.stringify(demeritRules));
  }, [demeritRules]);

  // Actions
  const login = (nik: string, pass: string): boolean => {
    const trimmed = nik.trim();
    // Special admin login or employee NIK
    const found = employees.find(
      (e) => e.nik.toLowerCase() === trimmed.toLowerCase() || (trimmed.toLowerCase() === 'admin' && e.role === 'admin')
    );

    if (found) {
      const expectedPassword = found.password || (found.role === 'admin' ? 'admin123' : '123456');
      if (pass === expectedPassword) {
        setCurrentUser(found);
        // Default to previous month on every login
        setSelectedPeriod(getDefaultPreviousPeriod());
        return true;
      }
    }
    return false;
  };

  const quickLogin = (nik: string) => {
    const found = employees.find((e) => e.nik === nik);
    if (found) {
      setCurrentUser(found);
      // Default to previous month on quick switch
      setSelectedPeriod(getDefaultPreviousPeriod());
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: empData.nik ? `emp_${empData.nik}` : `emp_${Date.now()}`,
    };
    setEmployees((prev) => {
      const updated = [...prev, newEmp];
      localStorage.setItem('mer_employees', JSON.stringify(updated));
      return updated;
    });
    saveEmployeeToFirebase(newEmp);
  };

  const updateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => {
      const updated = prev.map((e) =>
        e.id === updatedEmp.id || e.nik === updatedEmp.nik ? updatedEmp : e
      );
      localStorage.setItem('mer_employees', JSON.stringify(updated));
      return updated;
    });
    if (currentUser?.nik === updatedEmp.nik) {
      setCurrentUser(updatedEmp);
    }
    saveEmployeeToFirebase(updatedEmp);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem('mer_employees', JSON.stringify(updated));
      return updated;
    });
    deleteEmployeeFromFirebase(id);
  };

  const bulkImportEmployees = async (newEmps: (Omit<Employee, 'id'> | Employee)[]): Promise<boolean> => {
    let itemsToSave: Employee[] = [];
    setEmployees((prev) => {
      const copy = [...prev];
      newEmps.forEach((ne) => {
        const existingIdx = copy.findIndex((e) => e.nik === ne.nik);
        if (existingIdx >= 0) {
          copy[existingIdx] = {
            ...copy[existingIdx],
            ...ne,
          };
          itemsToSave.push(copy[existingIdx]);
        } else {
          const generatedId = (ne as Employee).id || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const fullEmp = {
            ...ne,
            id: generatedId,
          } as Employee;
          copy.push(fullEmp);
          itemsToSave.push(fullEmp);
        }
      });
      localStorage.setItem('mer_employees', JSON.stringify(copy));
      return copy;
    });
    return await saveBulkEmployeesToFirebase(itemsToSave);
  };

  const saveMonthlyReport = (report: MonthlyReport) => {
    const docId = report.id && report.id.trim() !== '' ? report.id : `rep_${report.nik}_${report.period}`;
    const standardized: MonthlyReport = {
      ...report,
      id: docId,
      updatedAt: report.updatedAt || new Date().toISOString(),
    };
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.id === docId || (r.nik === standardized.nik && r.period === standardized.period));
      let updatedList: MonthlyReport[];
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = standardized;
        updatedList = copy;
      } else {
        updatedList = [standardized, ...prev];
      }
      localStorage.setItem('mer_reports', JSON.stringify(updatedList));
      return updatedList;
    });
    saveReportToFirebase(standardized);
  };

  const deleteMonthlyReport = (id: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('mer_reports', JSON.stringify(updated));
      return updated;
    });
    deleteReportFromFirebase(id);
  };

  const bulkImportReports = async (newReports: MonthlyReport[]): Promise<boolean> => {
    const standardizedReports = newReports.map((nr) => {
      const docId = nr.id && nr.id.trim() !== '' ? nr.id : `rep_${nr.nik}_${nr.period}`;
      return {
        ...nr,
        id: docId,
        updatedAt: nr.updatedAt || new Date().toISOString(),
      };
    });

    setReports((prev) => {
      const copy = [...prev];
      standardizedReports.forEach((nr) => {
        const existingIdx = copy.findIndex(
          (r) => r.id === nr.id || (r.nik === nr.nik && r.period === nr.period)
        );
        if (existingIdx >= 0) {
          copy[existingIdx] = nr;
        } else {
          copy.unshift(nr);
        }
      });
      localStorage.setItem('mer_reports', JSON.stringify(copy));
      return copy;
    });
    return await saveBulkReportsToFirebase(standardizedReports);
  };

  const updateOperatorParameters = (params: DynamicParameter[]) => {
    setOperatorParameters(params);
    saveSettingToFirebase('operatorParameters', params);
  };

  const updateNonomParameters = (params: DynamicParameter[]) => {
    setNonomParameters(params);
    saveSettingToFirebase('nonomParameters', params);
  };

  const updateMeritRules = (rules: MeritRule[]) => {
    setMeritRules(rules);
    saveSettingToFirebase('meritRules', rules);
  };

  const updateDemeritRules = (rules: DemeritRule[]) => {
    setDemeritRules(rules);
    saveSettingToFirebase('demeritRules', rules);
  };

  const resetAllDataToDefault = () => {
    localStorage.clear();
    setEmployees(INITIAL_EMPLOYEES);
    setReports(generateInitialReports());
    setOperatorParameters(DEFAULT_OPERATOR_PARAMETERS);
    setNonomParameters(DEFAULT_NONOM_PARAMETERS);
    setMeritRules(DEFAULT_MERIT_RULES);
    setDemeritRules(DEFAULT_DEMERIT_RULES);
    setCurrentUser(INITIAL_EMPLOYEES[0]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        employees,
        reports,
        operatorParameters,
        nonomParameters,
        meritRules,
        demeritRules,
        selectedPeriod,
        setSelectedPeriod,
        login,
        quickLogin,
        logout,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        bulkImportEmployees,
        saveMonthlyReport,
        deleteMonthlyReport,
        bulkImportReports,
        updateOperatorParameters,
        updateNonomParameters,
        updateMeritRules,
        updateDemeritRules,
        resetAllDataToDefault,
        isSyncingFirebase,
        syncAllDataToFirebase,
        refreshFromFirebase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
