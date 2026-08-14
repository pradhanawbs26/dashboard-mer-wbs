import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { Employee, MonthlyReport, DynamicParameter, MeritRule, DemeritRule } from '../types';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyALIRU7TqP6kApp567HN53Kfk32-rs7pmY",
  authDomain: "mer-wbs.firebaseapp.com",
  projectId: "mer-wbs",
  storageBucket: "mer-wbs.firebasestorage.app",
  messagingSenderId: "737970159602",
  appId: "1:737970159602:web:0c041d5eb898fc7db3356b",
  measurementId: "G-4ZLC51D979",
};

// Load from Vite env, localStorage override, or default fallback
export const getFirebaseConfig = () => {
  const localConfig = localStorage.getItem('mer_firebase_config');
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  const metaEnv = (import.meta as any).env || {};

  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: metaEnv.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  };
};

const firebaseConfig = getFirebaseConfig();

export const isFirebaseConfigured = () => {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.projectId && cfg.apiKey);
};

let dbInstance: ReturnType<typeof getFirestore> | null = null;

export const getDb = () => {
  if (dbInstance) return dbInstance;
  const cfg = getFirebaseConfig();
  if (!cfg.projectId || !cfg.apiKey) return null;

  try {
    const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
    return null;
  }
};

// Helper to sanitize data for Firestore (Firestore strictly rejects undefined values)
export const cleanForFirestore = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        cleaned[key] = cleanForFirestore(val);
      } else if (Array.isArray(val)) {
        cleaned[key] = val.map((item) =>
          item !== null && typeof item === 'object' ? cleanForFirestore(item) : item
        );
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned as T;
};

// Firestore Sync Helpers
export const fetchEmployeesFromFirebase = async (): Promise<Employee[] | null> => {
  const db = getDb();
  if (!db) return null;
  try {
    const snapshot = await getDocs(collection(db, 'employees'));
    if (snapshot.empty) return null;
    return snapshot.docs.map((d) => d.data() as Employee);
  } catch (err) {
    console.error('Failed to fetch employees from Firebase:', err);
    return null;
  }
};

export const saveEmployeeToFirebase = async (employee: Employee): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    const sanitized = cleanForFirestore(employee);
    await setDoc(doc(db, 'employees', employee.id), sanitized);
    return true;
  } catch (err) {
    console.error('Failed to save employee to Firebase:', err);
    return false;
  }
};

export const deleteEmployeeFromFirebase = async (employeeId: string): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
    return true;
  } catch (err) {
    console.error('Failed to delete employee from Firebase:', err);
    return false;
  }
};

export const saveBulkEmployeesToFirebase = async (employees: Employee[]): Promise<boolean> => {
  const db = getDb();
  if (!db || employees.length === 0) return false;
  try {
    // Firestore batch limit is 500 operations, chunk by 200 for safety
    const chunkSize = 200;
    for (let i = 0; i < employees.length; i += chunkSize) {
      const chunk = employees.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((emp) => {
        const sanitized = cleanForFirestore(emp);
        batch.set(doc(db, 'employees', emp.id), sanitized);
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('Failed to bulk save employees to Firebase:', err);
    return false;
  }
};

export const fetchReportsFromFirebase = async (): Promise<MonthlyReport[] | null> => {
  const db = getDb();
  if (!db) return null;
  try {
    const snapshot = await getDocs(collection(db, 'reports'));
    if (snapshot.empty) return null;
    return snapshot.docs.map((d) => d.data() as MonthlyReport);
  } catch (err) {
    console.error('Failed to fetch reports from Firebase:', err);
    return null;
  }
};

export const saveReportToFirebase = async (report: MonthlyReport): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    const sanitized = cleanForFirestore(report);
    await setDoc(doc(db, 'reports', report.id), sanitized);
    return true;
  } catch (err) {
    console.error('Failed to save report to Firebase:', err);
    return false;
  }
};

export const deleteReportFromFirebase = async (reportId: string): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'reports', reportId));
    return true;
  } catch (err) {
    console.error('Failed to delete report from Firebase:', err);
    return false;
  }
};

export const saveBulkReportsToFirebase = async (reports: MonthlyReport[]): Promise<boolean> => {
  const db = getDb();
  if (!db || reports.length === 0) return false;
  try {
    const chunkSize = 200;
    for (let i = 0; i < reports.length; i += chunkSize) {
      const chunk = reports.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((rep) => {
        const sanitized = cleanForFirestore(rep);
        batch.set(doc(db, 'reports', rep.id), sanitized);
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('Failed to bulk save reports to Firebase:', err);
    return false;
  }
};

export const fetchSettingsFromFirebase = async (): Promise<{
  operatorParameters?: DynamicParameter[];
  nonomParameters?: DynamicParameter[];
  meritRules?: MeritRule[];
  demeritRules?: DemeritRule[];
} | null> => {
  const db = getDb();
  if (!db) return null;
  try {
    const snapshot = await getDocs(collection(db, 'settings'));
    if (snapshot.empty) return null;
    const settings: any = {};
    snapshot.docs.forEach((doc) => {
      settings[doc.id] = doc.data().data;
    });
    return settings;
  } catch (err) {
    console.error('Failed to fetch settings from Firebase:', err);
    return null;
  }
};

export const saveSettingToFirebase = async (key: string, data: any): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, 'settings', key), { data, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error(`Failed to save setting ${key} to Firebase:`, err);
    return false;
  }
};

