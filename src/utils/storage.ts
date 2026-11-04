import { 
  UserProfile, 
  Exercise, 
  LiftRecord, 
  SportActivity, 
  DailyStepLog, 
  DailyNutritionLog, 
  SleepLog, 
  Friend, 
  FriendPost 
} from '../types/fitness';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  familyName: '',
  birthDate: '2000-01-01',
  gender: 'male',
  heightCm: 0,
  weightKg: 0,
  activityLevel: 'moderate',
  goal: 'lean_bulk',
  macroSplit: 'high_protein',
  stepGoal: 10000,
  units: 'metric',
  targetWaterMl: 0,
  location: '',
  email: '',
  authProvider: 'local',
  hasExplicitlyLogged: false,
  personalFriendCode: '',
};

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Barbell Bench Press', category: 'chest' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'chest' },
  { id: 'dips', name: 'Chest Dips', category: 'chest' },
  { id: 'back-squat', name: 'Barbell Back Squat', category: 'legs' },
  { id: 'front-squat', name: 'Front Squat', category: 'legs' },
  { id: 'leg-press', name: 'Leg Press', category: 'legs' },
  { id: 'deadlift', name: 'Conventional Deadlift', category: 'back' },
  { id: 'barbell-row', name: 'Barbell Bent Over Row', category: 'back' },
  { id: 'pull-ups', name: 'Weighted Pull-Ups', category: 'back' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'back' },
  { id: 'overhead-press', name: 'Standing Overhead Press', category: 'shoulders' },
  { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', category: 'shoulders' },
  { id: 'barbell-curl', name: 'Barbell Bicep Curl', category: 'arms' },
  { id: 'tricep-pushdown', name: 'Tricep Rope Pushdown', category: 'arms' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'core' },
  { id: 'plank', name: 'Weighted Plank', category: 'core' },
];

export const DEFAULT_LIFTS: LiftRecord[] = [];

export const DEFAULT_SPORTS: SportActivity[] = [];

export const DEFAULT_STEPS: DailyStepLog[] = [
  {
    date: new Date().toISOString().split('T')[0],
    steps: 0,
    target: 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  }
];

export const DEFAULT_NUTRITION: DailyNutritionLog = {
  date: new Date().toISOString().split('T')[0],
  waterConsumedMl: 0,
  meals: [],
};

export const DEFAULT_SLEEP: SleepLog[] = [];

export const DEFAULT_FRIENDS: Friend[] = [];

export const DEFAULT_FRIEND_POSTS: FriendPost[] = [];

export const INITIAL_1RM_RECORDS: any[] = [];
export const INITIAL_BIOMETRICS: any[] = [];
export const INITIAL_WORKOUTS: any[] = [];

export const INITIAL_USER_PROFILE = {
  name: 'Athlete',
  email: '',
  isGoogleConnected: false,
  preferredUnit: 'kg' as const,
  heightCm: 0,
  targetWeightKg: 0,
  dailyStepGoal: 10000,
  dailyWaterGoalLiters: 3.0,
  dailyCalorieBurnGoal: 500,
  theme: 'dark' as const,
  lastSyncedAt: new Date().toISOString(),
};

const GLOBAL_UNSCOPED_KEYS = new Set(['app_theme', 'app_language']);

export function getActiveUserUid(): string {
  try {
    const rawSession = localStorage.getItem('overhaul_auth_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const user = parsed?.user;
      const uid =
        user?.uid ||
        user?.id ||
        user?.sub ||
        (user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : null);
      if (uid) return String(uid);
    }
    const storedUid = localStorage.getItem('overhaul_active_uid');
    if (storedUid) return storedUid;
  } catch {}
  return 'anonymous';
}

export function setActiveUserUid(uid: string | null): void {
  try {
    if (uid) {
      localStorage.setItem('overhaul_active_uid', uid);
    } else {
      localStorage.removeItem('overhaul_active_uid');
    }
  } catch {}
}

export function getScopedStorageKey(key: string, explicitUid?: string): string {
  if (GLOBAL_UNSCOPED_KEYS.has(key)) {
    return key;
  }
  const uid = explicitUid || getActiveUserUid();
  return `overhaul_user_${uid}_${key}`;
}

export function loadFromStorage<T>(key: string, fallback: T, explicitUid?: string): T {
  try {
    const scopedKey = getScopedStorageKey(key, explicitUid);
    const raw = localStorage.getItem(scopedKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T, explicitUid?: string): void {
  try {
    const uid = explicitUid || getActiveUserUid();
    const scopedKey = getScopedStorageKey(key, uid);
    localStorage.setItem(scopedKey, JSON.stringify(value));

    // Also maintain the unified per-user container key `overhaul_user_${uid}`
    if (!GLOBAL_UNSCOPED_KEYS.has(key)) {
      const masterKey = `overhaul_user_${uid}`;
      const existingRaw = localStorage.getItem(masterKey);
      const existingObj = existingRaw ? JSON.parse(existingRaw) : {};
      existingObj[key] = value;
      existingObj.updatedAt = new Date().toISOString();
      localStorage.setItem(masterKey, JSON.stringify(existingObj));
    }
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}
