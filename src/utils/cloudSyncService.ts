import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, setLogLevel } from 'firebase/firestore';
import appletFirebaseConfig from '../../firebase-applet-config.json';

// Silence internal @firebase/firestore offline-mode console.error logs
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

// Safe initialization of Firebase App
const firebaseConfig = {
  apiKey: appletFirebaseConfig.apiKey || "AIzaSyDummyKeyForGoogleAuthOverhaulProd2026",
  authDomain: appletFirebaseConfig.authDomain || "overhaul-fitness-core.firebaseapp.com",
  projectId: appletFirebaseConfig.projectId || "overhaul-fitness-core",
  storageBucket: appletFirebaseConfig.storageBucket || "overhaul-fitness-core.appspot.com",
  messagingSenderId: appletFirebaseConfig.messagingSenderId || "17995664186",
  appId: appletFirebaseConfig.appId || "1:17995664186:web:48a8e3d8c1192e76"
};

let app: any = null;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("Failed to initialize Firebase in cloudSyncService:", err);
}

// Only initialize Firestore if a firestoreDatabaseId is explicitly provisioned in firebase-applet-config.json
const databaseId = (appletFirebaseConfig as any).firestoreDatabaseId;
export const db = app && databaseId ? getFirestore(app, databaseId) : null;

function canSyncWithFirestore(userId: string): boolean {
  if (!db || !databaseId || !userId || userId === 'anonymous' || userId.startsWith('athlete_')) {
    return false;
  }
  try {
    const auth = app ? getAuth(app) : null;
    if (!auth?.currentUser || auth.currentUser.uid !== userId) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getLocalCloudBackup(userId: string): Record<string, any> {
  try {
    const raw = localStorage.getItem(`overhaul_cloud_backup_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCloudBackup(userId: string, patch: Record<string, any>) {
  try {
    const current = getLocalCloudBackup(userId);
    localStorage.setItem(`overhaul_cloud_backup_${userId}`, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Sync active routine and routine lists to Firestore under users/{userId}/routines/active
 */
export async function syncRoutinesToCloud(userId: string, routines: any[], activeRoutine: any) {
  if (!userId || userId === 'anonymous') return;
  const payload = {
    routines,
    activeRoutine,
    updatedAt: new Date().toISOString()
  };
  setLocalCloudBackup(userId, { routines: payload });

  if (!canSyncWithFirestore(userId) || !db) return;
  try {
    const routineRef = doc(db, 'users', userId, 'routines', 'active');
    await setDoc(routineRef, payload, { merge: true });
  } catch {
    // Offline fallback handled via localStorage
  }
}

/**
 * Sync logged workout sets (lifts) to Firestore under users/{userId}/logs/history
 */
export async function syncLogsToCloud(userId: string, liftRecords: any[]) {
  if (!userId || userId === 'anonymous') return;
  const payload = {
    liftRecords,
    updatedAt: new Date().toISOString()
  };
  setLocalCloudBackup(userId, { logs: payload });

  // Convert lift records into workoutLogs for streak calculations and sync
  const uniqueDates = Array.from(new Set(liftRecords.map((r: any) => r.date).filter(Boolean)));
  const derivedWorkoutLogs = uniqueDates.map((dateStr) => {
    const dayLifts = liftRecords.filter((r: any) => r.date === dateStr);
    return {
      id: `workout-${dateStr}`,
      title: dayLifts[0]?.exerciseName || 'Strength Training',
      date: dateStr,
      durationMinutes: 45,
      sportCategory: 'Strength',
      exercises: dayLifts.map((l: any) => ({
        id: l.id,
        name: l.exerciseName,
        sets: [{ reps: l.reps, weightKg: l.weightKg }]
      }))
    };
  });
  await syncWorkoutLogsToCloud(userId, derivedWorkoutLogs);

  if (!canSyncWithFirestore(userId) || !db) return;
  try {
    const logsRef = doc(db, 'users', userId, 'logs', 'history');
    await setDoc(logsRef, payload, { merge: true });
  } catch {
    // Offline fallback handled via localStorage
  }
}

/**
 * Persist workout logs array directly to Firestore under users/{userId}/workoutHistory
 */
export async function syncWorkoutLogsToCloud(userId: string, workoutLogs: any[]) {
  if (!userId || userId === 'anonymous') return;
  const payload = {
    workoutLogs: Array.isArray(workoutLogs) ? workoutLogs : [],
    updatedAt: new Date().toISOString(),
  };
  setLocalCloudBackup(userId, { workoutHistory: payload });

  if (!canSyncWithFirestore(userId) || !db) return;
  try {
    const historyRef = doc(db, 'users', userId, 'workoutHistory', 'logs');
    await setDoc(historyRef, payload, { merge: true });
    // Also merge to root document for backward compatibility
    const rootHistoryRef = doc(db, 'users', userId, 'workoutHistory', 'summary');
    await setDoc(rootHistoryRef, payload, { merge: true });
  } catch {
    // Offline fallback handled via localStorage
  }
}

/**
 * Sync user profile biometrics to Firestore under users/{userId}/biometrics/profile
 */
export async function syncBiometricsToCloud(userId: string, profile: any) {
  if (!userId || userId === 'anonymous') return;
  const payload = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  setLocalCloudBackup(userId, { biometrics: payload });

  if (!canSyncWithFirestore(userId) || !db) return;
  try {
    const biometricsRef = doc(db, 'users', userId, 'biometrics', 'profile');
    await setDoc(biometricsRef, payload, { merge: true });
  } catch {
    // Offline fallback handled via localStorage
  }
}

/**
 * Pull all synced data from Google Cloud on app launch
 */
export async function pullLatestDataFromCloud(userId: string) {
  if (!userId || userId === 'anonymous') return null;
  const localBackup = getLocalCloudBackup(userId);

  if (!canSyncWithFirestore(userId) || !db) {
    return {
      routines: localBackup.routines || null,
      logs: localBackup.logs || null,
      biometrics: localBackup.biometrics || null,
      workoutHistory: localBackup.workoutHistory || null,
    };
  }

  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const fetchPromise = (async () => {
      const [routinesDoc, logsDoc, biometricsDoc, workoutHistoryDoc] = await Promise.all([
        getDoc(doc(db, 'users', userId, 'routines', 'active')),
        getDoc(doc(db, 'users', userId, 'logs', 'history')),
        getDoc(doc(db, 'users', userId, 'biometrics', 'profile')),
        getDoc(doc(db, 'users', userId, 'workoutHistory', 'logs')),
      ]);

      return {
        routines: routinesDoc.exists() ? routinesDoc.data() : (localBackup.routines || null),
        logs: logsDoc.exists() ? logsDoc.data() : (localBackup.logs || null),
        biometrics: biometricsDoc.exists() ? biometricsDoc.data() : (localBackup.biometrics || null),
        workoutHistory: workoutHistoryDoc.exists() ? workoutHistoryDoc.data() : (localBackup.workoutHistory || null),
      };
    })();

    const result = await Promise.race([fetchPromise, timeout]);
    return result || {
      routines: localBackup.routines || null,
      logs: localBackup.logs || null,
      biometrics: localBackup.biometrics || null,
      workoutHistory: localBackup.workoutHistory || null,
    };
  } catch {
    return {
      routines: localBackup.routines || null,
      logs: localBackup.logs || null,
      biometrics: localBackup.biometrics || null,
      workoutHistory: localBackup.workoutHistory || null,
    };
  }
}

/**
 * Check Firestore for existing user document (users/{userId}); auto-create if missing.
 */
export async function ensureFirestoreUserAccount(userId: string, user: { email?: string; displayName?: string; photoURL?: string }) {
  if (!userId || userId === 'anonymous') return null;
  const localBackup = getLocalCloudBackup(userId);

  if (!db) {
    return { isNew: false, data: localBackup };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return { isNew: false, data };
    } else {
      const newUserData = {
        uid: userId,
        email: user.email || 'christiansalameh7@gmail.com',
        displayName: user.displayName || 'Christian Salameh',
        createdAt: new Date().toISOString(),
        activeStreak: 0,
        bestStreak: 0,
        workoutLogs: [],
        biometrics: { weight: 0, height: 0 }
      };
      await setDoc(userRef, newUserData, { merge: true });
      return { isNew: true, data: newUserData };
    }
  } catch (err) {
    console.warn("Firestore user lookup/auto-create non-fatal:", err);
    return { isNew: false, data: localBackup };
  }
}
