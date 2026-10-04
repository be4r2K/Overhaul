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
  name: 'Christian',
  familyName: 'Salameh',
  birthDate: '2001-05-18',
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
  email: 'christiansalameh7@gmail.com',
  authProvider: 'local',
  hasExplicitlyLogged: false,
  personalFriendCode: 'CHRISTIAN-94',
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

export const INITIAL_USER_PROFILE = {
  name: 'Christian Salameh',
  email: 'christiansalameh7@gmail.com',
  isGoogleConnected: true,
  preferredUnit: 'kg' as const,
  heightCm: 182,
  targetWeightKg: 78.5,
  dailyStepGoal: 10000,
  dailyWaterGoalLiters: 3.5,
  dailyCalorieBurnGoal: 650,
  theme: 'dark' as const,
  lastSyncedAt: new Date().toISOString(),
};

export const INITIAL_1RM_RECORDS = [
  {
    id: 'pr-1',
    exercise: 'Barbell Back Squat',
    category: 'Barbell' as const,
    weight: 140,
    reps: 3,
    unit: 'kg' as const,
    estimated1RM: 154,
    formula: 'epley' as const,
    date: '2026-09-28',
    rpe: 9,
    notes: 'Solid depth, clean lockout. Belt only.',
    isPersonalRecord: true,
  },
  {
    id: 'pr-2',
    exercise: 'Flat Barbell Bench Press',
    category: 'Barbell' as const,
    weight: 110,
    reps: 4,
    unit: 'kg' as const,
    estimated1RM: 124.7,
    formula: 'epley' as const,
    date: '2026-09-26',
    rpe: 8.5,
    notes: 'Paused on chest for 1 count.',
    isPersonalRecord: true,
  },
  {
    id: 'pr-3',
    exercise: 'Conventional Deadlift',
    category: 'Barbell' as const,
    weight: 180,
    reps: 2,
    unit: 'kg' as const,
    estimated1RM: 192,
    formula: 'epley' as const,
    date: '2026-09-24',
    rpe: 9.5,
    notes: 'Double overhand hook grip.',
    isPersonalRecord: true,
  },
];

export const INITIAL_BIOMETRICS = [
  {
    id: 'bio-1',
    date: '2026-09-30',
    weightKg: 79.2,
    bodyFatPercent: 13.8,
    restingHeartRate: 52,
    systolicBp: 118,
    diastolicBp: 76,
    sleepHours: 7.8,
    sleepQuality: 88,
    hrvMs: 74,
    stepCount: 8420,
    hydrationLiters: 2.8,
    recoveryScore: 92,
    notes: 'Woke up feeling energetic. Ready for leg day.',
  }
];

export const INITIAL_WORKOUTS = [
  {
    id: 'wo-1',
    title: 'Heavy Lower Body & Core',
    date: '2026-09-28',
    durationMinutes: 72,
    caloriesBurned: 580,
    sportCategory: 'Strength' as const,
    rating: 5 as const,
    rpeAverage: 8.8,
    notes: 'Hit a 3-rep PR on Squats.',
    exercises: [
      {
        id: 'we-1',
        name: 'Barbell Back Squat',
        category: 'Legs',
        sets: [
          { setNumber: 1, weight: 100, reps: 8, completed: true, rpe: 7 },
          { setNumber: 2, weight: 120, reps: 5, completed: true, rpe: 8 },
          { setNumber: 3, weight: 140, reps: 3, completed: true, rpe: 9 },
        ],
      },
    ],
  }
];

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}
