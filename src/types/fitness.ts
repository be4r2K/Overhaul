export type Gender = 'male' | 'female';
export type UnitSystem = 'metric' | 'imperial';

export type ActivityLevel =
  | 'sedentary'      // Desk job, little to no exercise
  | 'light'          // Light exercise 1-3 days/week
  | 'moderate'       // Moderate exercise 3-5 days/week
  | 'very_active'    // Heavy exercise 6-7 days/week
  | 'extra_active';  // Intense daily exercise / physical job / athlete

export type FitnessGoal =
  | 'aggressive_cut' // -25% calories
  | 'moderate_cut'   // -15% calories
  | 'maintenance'    // 0%
  | 'lean_bulk'      // +10% calories
  | 'heavy_bulk';    // +20% calories

export type MacroSplit = 'balanced' | 'high_protein' | 'low_carb' | 'keto' | 'custom';

export interface UserProfile {
  name: string;
  familyName?: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  macroSplit: MacroSplit;
  stepGoal: number;
  units: UnitSystem;
  targetWaterMl: number;
  location?: string;
  photoUrl?: string;
  email?: string;
  authProvider?: 'google' | 'apple' | 'local';
  hasExplicitlyLogged?: boolean;
  personalFriendCode?: string;
}

export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom?: boolean;
}

export interface LiftRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  rpe?: number; // 6 to 10
  calculated1RM: number; // in kg
  date: string; // YYYY-MM-DD
  notes?: string;
  isPR?: boolean;
}

export interface OneRepMaxBreakdown {
  brzycki: number;
  epley: number;
  lombardi: number;
  mayhew: number;
  average: number;
  percentages: {
    percent: number;
    weightKg: number;
    weightLbs: number;
    repsRange: string;
  }[];
}

export type SportType = 'bike' | 'run' | 'swim' | 'hiit' | 'walk' | 'sports' | 'rowing';

export interface SportActivity {
  id: string;
  type: SportType;
  title: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  paceMinPerKm?: string;
  elevationM?: number;
  heartRateAvg?: number;
  caloriesBurned: number;
  notes?: string;
}

export interface DailyStepLog {
  date: string; // YYYY-MM-DD
  steps: number;
  target: number;
  distanceKm: number;
  caloriesBurned: number;
}

export interface MealItem {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  time: string;
}

export interface DailyNutritionLog {
  date: string; // YYYY-MM-DD
  waterConsumedMl: number;
  meals: MealItem[];
}

export interface SleepLog {
  date: string;
  totalMinutes: number; // e.g. 450 = 7h 30m
  score: number; // 0 to 100
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  source: 'samsung_health' | 'google_fit' | 'apple_health' | 'manual';
  syncedAt?: string;
}

export interface CongratsMessage {
  id: string;
  fromName: string;
  fromAvatar?: string;
  message: string;
  timestamp: string;
  isCustom?: boolean;
}

export interface ReminderNudge {
  id: string;
  fromName: string;
  fromAvatar?: string;
  message: string;
  timestamp: string;
}

export interface Friend {
  id: string;
  friendCode: string;
  name: string;
  avatar: string;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing';
  streak: number;
  bplScore: number;
  bench1RM: number;
  squat1RM: number;
  deadlift1RM: number;
  lastActive: string;
  recentWorkout: string;
  overviewSnippet: string;
  sleepHours: number;
  favoriteLift?: string;
}

export interface FriendPost {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  type: 'pr' | 'workout_completed' | 'streak_milestone' | 'sports';
  title: string;
  description: string;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
  congrats: CongratsMessage[];
}
