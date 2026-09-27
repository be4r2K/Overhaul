import { DailyNutritionLog, DailyStepLog, Exercise, LiftRecord, SportActivity, UserProfile } from '../types/fitness';
import { calculate1RM, calculateSportCalories } from './calculations';

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Barbell Bench Press', category: 'chest' },
  { id: 'back-squat', name: 'Barbell Back Squat', category: 'legs' },
  { id: 'deadlift', name: 'Conventional Deadlift', category: 'back' },
  { id: 'overhead-press', name: 'Standing Overhead Press (OHP)', category: 'shoulders' },
  { id: 'barbell-row', name: 'Barbell Bent-Over Row', category: 'back' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'chest' },
  { id: 'pull-ups', name: 'Weighted Pull-Ups', category: 'back' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', category: 'legs' },
  { id: 'leg-press', name: '45° Incline Leg Press', category: 'legs' },
  { id: 'bicep-curl', name: 'Barbell Bicep Curl', category: 'arms' },
  { id: 'tricep-dips', name: 'Parallel Bar Dips', category: 'arms' },
  { id: 'lateral-raises', name: 'Dumbbell Lateral Raise', category: 'shoulders' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'core' },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Christian',
  familyName: 'Salameh',
  birthDate: '2001-05-18',
  gender: 'male',
  heightCm: 0, // Kept at 0 until user logs
  weightKg: 0, // Kept at 0 until user logs
  activityLevel: 'moderate',
  goal: 'lean_bulk',
  macroSplit: 'high_protein',
  stepGoal: 10000,
  units: 'metric',
  targetWaterMl: 0,
  location: '',
  email: 'christiansalameh7@gmail.com',
  authProvider: 'local',
};

const todayStr = new Date().toISOString().split('T')[0];

function getRelativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const DEFAULT_LIFTS: LiftRecord[] = [];

export const DEFAULT_SPORTS: SportActivity[] = [];

export const DEFAULT_STEPS: DailyStepLog[] = [
  {
    date: todayStr,
    steps: 0,
    target: 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  },
];

export const DEFAULT_NUTRITION: DailyNutritionLog = {
  date: todayStr,
  waterConsumedMl: 0,
  meals: [],
};

// Storage keys
const STORAGE_PREFIX = 'apex_fitness_';

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}
