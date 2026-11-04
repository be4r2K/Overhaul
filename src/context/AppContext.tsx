import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { loadFromStorage, saveToStorage, getActiveUserUid } from '../utils/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { syncWorkoutLogsToCloud, pullLatestDataFromCloud } from '../utils/cloudSyncService';

export interface WeekDayActivity {
  day: string; // 'Mon', 'Tue', etc.
  dateStr: string; // 'YYYY-MM-DD'
  dateNum: number;
  isToday: boolean;
  status: 'done' | 'rest' | 'today' | 'missed' | 'future';
  hasWorkout: boolean;
  isProtectedRest: boolean;
}

export interface AppContextType {
  workoutLogs: any[];
  setWorkoutLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addWorkoutLog: (log: any) => Promise<void>;
  activeStreak: number;
  bestStreak: number;
  weekDaysActivity: WeekDayActivity[];
  activeDaysThisWeek: number;
  consistencyRate: number; // 0 to 100%
  recalculateStreak: () => void;
  syncToCloud: () => Promise<void>;
}

/**
 * Calculates active and best streak strictly from completed workout logs.
 * Rest days in the active split schedule (e.g. Wednesday and Sunday) do not break the streak.
 */
export function calculateStreakFromWorkoutLogs(
  workoutLogs: any[],
  scheduledRestDays: string[] = ['Wed', 'Sun']
): { activeStreak: number; bestStreak: number } {
  const completedDateSet = new Set<string>();
  (workoutLogs || []).forEach((log) => {
    if (!log) return;
    const date = log.date || (log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : null);
    if (date) {
      completedDateSet.add(date);
    }
  });

  if (completedDateSet.size === 0) {
    return { activeStreak: 0, bestStreak: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // If today has a workout, streak is anchored at today; otherwise yesterday.
  const hasToday = completedDateSet.has(todayStr);
  let checkDate = new Date(today);
  if (!hasToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let activeStreak = 0;
  let consecutiveRestDays = 0;

  // Walk backwards day-by-day
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = (checkDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek];
    const isRest = scheduledRestDays.includes(dayName);

    if (completedDateSet.has(dateStr)) {
      activeStreak++;
      consecutiveRestDays = 0;
    } else if (isRest && activeStreak > 0 && consecutiveRestDays < 2) {
      // Protected rest day: keeps consecutive momentum alive
      consecutiveRestDays++;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate historic best streak
  const sortedDates = Array.from(completedDateSet).sort();
  let maxStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays === 2) {
        const intervening = new Date(prevDate);
        intervening.setDate(intervening.getDate() + 1);
        const dayOfWeek = (intervening.getDay() + 6) % 7;
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek];
        if (scheduledRestDays.includes(dayName)) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }
    }
    prevDate = curDate;
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }

  const bestStreak = Math.max(maxStreak, activeStreak);
  return { activeStreak, bestStreak };
}

/**
 * Builds the 7-day Monday through Sunday calendar activity view mapped to workoutLogs.
 */
export function getWeekDaysActivity(
  workoutLogs: any[],
  scheduledRestDays: string[] = ['Wed', 'Sun']
): WeekDayActivity[] {
  const completedDateSet = new Set<string>();
  (workoutLogs || []).forEach((log) => {
    if (!log) return;
    const date = log.date || (log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : null);
    if (date) {
      completedDateSet.add(date);
    }
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isPast = d < now && !isToday;
    const isFuture = d > now && !isToday;

    const hasWorkout = completedDateSet.has(dateStr);
    const isProtectedRest = scheduledRestDays.includes(name);

    let status: 'done' | 'rest' | 'today' | 'missed' | 'future' = 'future';

    if (hasWorkout) {
      status = 'done';
    } else if (isProtectedRest) {
      status = 'rest';
    } else if (isToday) {
      status = 'today';
    } else if (isPast) {
      status = 'missed';
    } else if (isFuture) {
      status = 'future';
    }

    return {
      day: name,
      dateStr,
      dateNum: d.getDate(),
      isToday,
      status,
      hasWorkout,
      isProtectedRest,
    };
  });
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string>(() => getActiveUserUid());

  const [workoutLogs, setWorkoutLogs] = useState<any[]>(() => {
    const loaded = loadFromStorage<any[]>('workout_history_list', [], uid);
    return Array.isArray(loaded) ? loaded : [];
  });

  // Track auth state to isolate per user
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

  // Reload and pull from Google Cloud on user switch / app launch
  useEffect(() => {
    const loadedHistory = loadFromStorage<any[]>('workout_history_list', [], uid);
    setWorkoutLogs(Array.isArray(loadedHistory) ? loadedHistory : []);

    if (!uid || uid === 'anonymous' || uid.startsWith('athlete_')) return;

    (async () => {
      try {
        const cloudData = await pullLatestDataFromCloud(uid);
        if (cloudData) {
          if (cloudData.workoutHistory && Array.isArray(cloudData.workoutHistory.workoutLogs)) {
            setWorkoutLogs(cloudData.workoutHistory.workoutLogs);
            saveToStorage('workout_history_list', cloudData.workoutHistory.workoutLogs, uid);
          } else if (cloudData.logs && Array.isArray(cloudData.logs.workoutHistory)) {
            setWorkoutLogs(cloudData.logs.workoutHistory);
            saveToStorage('workout_history_list', cloudData.logs.workoutHistory, uid);
          }
        }
      } catch {
        // Offline fallback
      }
    })();
  }, [uid]);

  // Sync workout logs to storage & Google Cloud whenever updated
  useEffect(() => {
    saveToStorage('workout_history_list', workoutLogs, uid);
    if (!uid || uid === 'anonymous' || uid.startsWith('athlete_')) return;
    syncWorkoutLogsToCloud(uid, workoutLogs).catch(() => {});
  }, [workoutLogs, uid]);

  // Calculate dynamic streaks from workoutLogs
  const { activeStreak, bestStreak } = useMemo(() => {
    return calculateStreakFromWorkoutLogs(workoutLogs);
  }, [workoutLogs]);

  // Map 7-day Monday through Sunday activity
  const weekDaysActivity = useMemo(() => {
    return getWeekDaysActivity(workoutLogs);
  }, [workoutLogs]);

  // Active workout days this week
  const activeDaysThisWeek = useMemo(() => {
    return weekDaysActivity.filter((d) => d.hasWorkout).length;
  }, [weekDaysActivity]);

  // Consistency Rate: (Active Days / 7) * 100, where 0/7 = 0%, 1/7 = 14%
  const consistencyRate = useMemo(() => {
    return Math.round((activeDaysThisWeek / 7) * 100);
  }, [activeDaysThisWeek]);

  const addWorkoutLog = useCallback(async (log: any) => {
    setWorkoutLogs((prev) => {
      const updated = [log, ...prev];
      saveToStorage('workout_history_list', updated, uid);
      syncWorkoutLogsToCloud(uid, updated).catch(() => {});
      return updated;
    });
  }, [uid]);

  const syncToCloud = useCallback(async () => {
    if (!uid || uid === 'anonymous') return;
    await syncWorkoutLogsToCloud(uid, workoutLogs);
  }, [uid, workoutLogs]);

  const recalculateStreak = useCallback(() => {
    const current = loadFromStorage<any[]>('workout_history_list', [], uid);
    if (Array.isArray(current)) {
      setWorkoutLogs(current);
    }
  }, [uid]);

  const value = useMemo(() => ({
    workoutLogs,
    setWorkoutLogs,
    addWorkoutLog,
    activeStreak,
    bestStreak,
    weekDaysActivity,
    activeDaysThisWeek,
    consistencyRate,
    recalculateStreak,
    syncToCloud,
  }), [
    workoutLogs,
    addWorkoutLog,
    activeStreak,
    bestStreak,
    weekDaysActivity,
    activeDaysThisWeek,
    consistencyRate,
    recalculateStreak,
    syncToCloud,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
