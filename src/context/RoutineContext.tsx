import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage, getActiveUserUid } from '../utils/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, pullLatestDataFromCloud } from '../utils/cloudSyncService';

export interface RoutineDay {
  dayTitle: string;
  focus: string;
  exercises: {
    name: string;
    setsReps: string;
    targetMuscle: string;
    rating?: number;
    substitution?: string;
  }[];
}

export interface ActiveRoutine {
  id: string;
  summaryTitle: string;
  parsedDays: RoutineDay[];
  analyzedAt?: string;
}

interface RoutineContextType {
  activeRoutine: ActiveRoutine[];
  setActiveRoutine: React.Dispatch<React.SetStateAction<ActiveRoutine[]>>;
  workoutHistory: any[];
  setWorkoutHistory: React.Dispatch<React.SetStateAction<any[]>>;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string>(() => getActiveUserUid());

  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutine[]>(() => {
    const loaded = loadFromStorage<ActiveRoutine[]>('active_routines_list', [], uid);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [workoutHistory, setWorkoutHistory] = useState<any[]>(() => {
    const loaded = loadFromStorage<any[]>('workout_history_list', [], uid);
    return Array.isArray(loaded) ? loaded : [];
  });

  // Track Firebase auth state to ensure we always have the correct, reactive userId
  useEffect(() => {
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const calculatedUid = user.uid || (user.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'anonymous');
          setUid(calculatedUid);
        } else {
          setUid(getActiveUserUid() || 'anonymous');
        }
      });
      return () => unsubscribe();
    } catch {
      return;
    }
  }, []);

  // When the UID changes (e.g. login/logout), reload data from storage and sync from cloud
  useEffect(() => {
    // 1. Instantly switch to the new user's local storage data
    const loadedRoutines = loadFromStorage<ActiveRoutine[]>('active_routines_list', [], uid);
    setActiveRoutine(Array.isArray(loadedRoutines) ? loadedRoutines : []);

    const loadedHistory = loadFromStorage<any[]>('workout_history_list', [], uid);
    setWorkoutHistory(Array.isArray(loadedHistory) ? loadedHistory : []);

    if (!uid || uid === 'anonymous' || uid.startsWith('athlete_')) return;

    // 2. Async pull from Google Cloud to sync latest data
    (async () => {
      try {
        const cloudData = await pullLatestDataFromCloud(uid);
        if (cloudData) {
          if (cloudData.routines && Array.isArray(cloudData.routines.routines)) {
            setActiveRoutine(cloudData.routines.routines);
            saveToStorage('active_routines_list', cloudData.routines.routines, uid);
          }
          if (cloudData.logs && Array.isArray(cloudData.logs.workoutHistory)) {
            setWorkoutHistory(cloudData.logs.workoutHistory);
            saveToStorage('workout_history_list', cloudData.logs.workoutHistory, uid);
          }
        }
      } catch {
        // Offline fallback via localStorage
      }
    })();
  }, [uid]);

  // Sync active routines changes to storage & Google Cloud
  useEffect(() => {
    saveToStorage('active_routines_list', activeRoutine, uid);
    if (!db || !uid || uid === 'anonymous' || uid.startsWith('athlete_')) return;

    try {
      const auth = getAuth();
      if (!auth.currentUser || auth.currentUser.uid !== uid) return;
      const routineRef = doc(db, 'users', uid, 'routines', 'active');
      setDoc(routineRef, {
        routines: activeRoutine,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {
      // Offline fallback via localStorage
    }
  }, [activeRoutine, uid]);

  // Sync workout history list changes to storage & Google Cloud
  useEffect(() => {
    saveToStorage('workout_history_list', workoutHistory, uid);
    if (!db || !uid || uid === 'anonymous' || uid.startsWith('athlete_')) return;

    try {
      const auth = getAuth();
      if (!auth.currentUser || auth.currentUser.uid !== uid) return;
      const logsRef = doc(db, 'users', uid, 'logs', 'history');
      setDoc(logsRef, {
        workoutHistory,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      const historyRef = doc(db, 'users', uid, 'workoutHistory', 'logs');
      setDoc(historyRef, {
        workoutLogs: workoutHistory,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {
      // Offline fallback via localStorage
    }
  }, [workoutHistory, uid]);

  return (
    <RoutineContext.Provider value={{ activeRoutine, setActiveRoutine, workoutHistory, setWorkoutHistory }}>
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
};
