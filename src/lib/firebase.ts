import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
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
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fallback if already initialized or in unsupported environment
      dbInstance = getFirestore(app);
    }
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

// -------------------------------------------------------------
// Lightweight Firestore Rate Monitor & Early Alerting
// -------------------------------------------------------------
interface FirestoreStats {
  totalReads: number;
  totalWrites: number;
  recentReadTimestamps: number[];
}

const stats: FirestoreStats = {
  totalReads: 0,
  totalWrites: 0,
  recentReadTimestamps: [],
};

const MONITOR_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_THRESHOLD = 8;  // Alert if more than 8 reads in 10s

export const recordFirestoreRead = (operationName: string) => {
  const now = Date.now();
  stats.totalReads++;
  stats.recentReadTimestamps.push(now);

  // Filter timestamps outside the sliding window
  stats.recentReadTimestamps = stats.recentReadTimestamps.filter(
    (t) => now - t <= MONITOR_WINDOW_MS
  );

  if (stats.recentReadTimestamps.length > RATE_LIMIT_THRESHOLD) {
    console.warn(
      `⚠️ [FIRESTORE MONITOR ALERT] High frequency of read operations detected! (${stats.recentReadTimestamps.length} queries within 10s during '${operationName}'). Verify that component useEffects and sync triggers are guarded against loops.`
    );
  }
};

export const recordFirestoreWrite = (operationName: string, count: number = 1) => {
  stats.totalWrites += count;
};

export const getFirestoreStats = () => ({
  totalReads: stats.totalReads,
  totalWrites: stats.totalWrites,
  recentReadsIn10s: stats.recentReadTimestamps.length,
});

// -------------------------------------------------------------
// Firestore Sync Helpers with Pagination & Scoped Queries (limit/where)
// -------------------------------------------------------------
export interface FetchEmployeesOptions {
  role?: string;
  groupLeaderId?: string;
  limitCount?: number;
}

export const fetchEmployeesFromFirebase = async (
  options?: FetchEmployeesOptions
): Promise<Employee[] | null> => {
  const db = getDb();
  if (!db) return null;
  recordFirestoreRead('fetchEmployees');

  try {
    const constraints: QueryConstraint[] = [];
    if (options?.role) {
      constraints.push(where('role', '==', options.role));
    }
    if (options?.groupLeaderId) {
      constraints.push(where('groupLeaderId', '==', options.groupLeaderId));
    }
    // Apply safe limit to avoid uncontrolled memory usage while accommodating all employees
    constraints.push(limit(options?.limitCount || 1000));

    const q = query(collection(db, 'employees'), ...constraints);
    const snapshot = await getDocs(q);
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
    const docId = employee.id && employee.id.trim() !== '' ? employee.id : (employee.nik ? `emp_${employee.nik}` : `emp_${Date.now()}`);
    const sanitized = cleanForFirestore({ ...employee, id: docId });
    await setDoc(doc(db, 'employees', docId), sanitized, { merge: true });
    recordFirestoreWrite('saveEmployee', 1);
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
    recordFirestoreWrite('deleteEmployee', 1);
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
        const docId = emp.id && emp.id.trim() !== '' ? emp.id : (emp.nik ? `emp_${emp.nik}` : `emp_${Date.now()}`);
        const sanitized = cleanForFirestore({ ...emp, id: docId });
        batch.set(doc(db, 'employees', docId), sanitized, { merge: true });
      });
      await batch.commit();
      recordFirestoreWrite('saveBulkEmployees', chunk.length);
    }
    return true;
  } catch (err) {
    console.error('Failed to bulk save employees to Firebase:', err);
    return false;
  }
};

export interface FetchReportsOptions {
  period?: string;
  nik?: string;
  limitCount?: number;
}

export const fetchReportsFromFirebase = async (
  options?: FetchReportsOptions
): Promise<MonthlyReport[] | null> => {
  const db = getDb();
  if (!db) return null;
  recordFirestoreRead('fetchReports');

  try {
    const constraints: QueryConstraint[] = [];
    if (options?.period) {
      constraints.push(where('period', '==', options.period));
    }
    if (options?.nik) {
      constraints.push(where('nik', '==', options.nik));
    }
    // Set limit high enough so all active reports across periods and employees are loaded
    constraints.push(limit(options?.limitCount || 1500));

    const q = query(collection(db, 'reports'), ...constraints);
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs.map((d) => d.data() as MonthlyReport);
  } catch (err) {
    console.error('Failed to fetch reports from Firebase:', err);
    return null;
  }
};

/**
 * Paginated reports query with cursor (startAfter)
 */
export const fetchReportsPagedFromFirebase = async (
  pageSize: number = 50,
  lastDocSnapshot?: DocumentSnapshot
): Promise<{ reports: MonthlyReport[]; lastDoc: DocumentSnapshot | null }> => {
  const db = getDb();
  if (!db) return { reports: [], lastDoc: null };
  recordFirestoreRead('fetchReportsPaged');

  try {
    const constraints: QueryConstraint[] = [orderBy('period', 'desc'), limit(pageSize)];
    if (lastDocSnapshot) {
      constraints.push(startAfter(lastDocSnapshot));
    }

    const q = query(collection(db, 'reports'), ...constraints);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { reports: [], lastDoc: null };
    }

    const reports = snapshot.docs.map((d) => d.data() as MonthlyReport);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    return { reports, lastDoc };
  } catch (err) {
    console.error('Failed to fetch paged reports from Firebase:', err);
    return { reports: [], lastDoc: null };
  }
};

export const saveReportToFirebase = async (report: MonthlyReport): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;
  try {
    const docId = report.id && report.id.trim() !== '' ? report.id : `rep_${report.nik}_${report.period}`;
    const sanitized = cleanForFirestore({ ...report, id: docId });
    await setDoc(doc(db, 'reports', docId), sanitized, { merge: true });
    recordFirestoreWrite('saveReport', 1);
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
    recordFirestoreWrite('deleteReport', 1);
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
        const docId = rep.id && rep.id.trim() !== '' ? rep.id : `rep_${rep.nik}_${rep.period}`;
        const sanitized = cleanForFirestore({ ...rep, id: docId });
        batch.set(doc(db, 'reports', docId), sanitized, { merge: true });
      });
      await batch.commit();
      recordFirestoreWrite('saveBulkReports', chunk.length);
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
  recordFirestoreRead('fetchSettings');

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
    recordFirestoreWrite('saveSetting', 1);
    return true;
  } catch (err) {
    console.error(`Failed to save setting ${key} to Firebase:`, err);
    return false;
  }
};

