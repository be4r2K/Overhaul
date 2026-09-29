import { DailyNutritionLog, DailyStepLog, Exercise, Friend, FriendPost, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
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

export const DEFAULT_SLEEP: SleepLog[] = [];

export const DEFAULT_FRIENDS: Friend[] = [];

export const DEFAULT_FRIEND_POSTS: FriendPost[] = [];

export const ATHLETE_DATABASE: Record<string, Omit<Friend, 'id' | 'status'>> = {
  'OH-8421-MARC': {
    friendCode: 'OH-8421-MARC',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    streak: 12,
    bplScore: 86,
    bench1RM: 125,
    squat1RM: 170,
    deadlift1RM: 215,
    lastActive: '30m ago',
    recentWorkout: 'Heavy Push & Tricep Overload',
    overviewSnippet: 'Crushing strength goals this month. On track for 500kg Big 3 club.',
    sleepHours: 7.8,
    favoriteLift: 'Deadlift'
  },
  'OH-3912-SARA': {
    friendCode: 'OH-3912-SARA',
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    streak: 8,
    bplScore: 81,
    bench1RM: 75,
    squat1RM: 110,
    deadlift1RM: 140,
    lastActive: '2h ago',
    recentWorkout: 'Legs & Core Conditioning',
    overviewSnippet: 'Hit a 110kg Squat PR yesterday! Calorie target met 5 days straight.',
    sleepHours: 8.1,
    favoriteLift: 'Back Squat'
  },
  'OH-5509-LEO': {
    friendCode: 'OH-5509-LEO',
    name: 'Leo Thorne',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    streak: 3,
    bplScore: 74,
    bench1RM: 100,
    squat1RM: 135,
    deadlift1RM: 165,
    lastActive: '4h ago',
    recentWorkout: 'Pull Day & Bicep Blast',
    overviewSnippet: 'Recovering from slight fatigue; prioritizing sleep and hydration.',
    sleepHours: 6.9,
    favoriteLift: 'Barbell Row'
  },
  'OH-6743-EMMA': {
    friendCode: 'OH-6743-EMMA',
    name: 'Emma Watson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    streak: 15,
    bplScore: 88,
    bench1RM: 70,
    squat1RM: 115,
    deadlift1RM: 145,
    lastActive: '1d ago',
    recentWorkout: 'HIIT & Sprint Intervals',
    overviewSnippet: 'Consistent 15-day streak. Ready to connect and challenge!',
    sleepHours: 8.0,
    favoriteLift: 'Romanian Deadlift'
  }
};

export const SAMPLE_FRIEND_POSTS: Record<string, Omit<FriendPost, 'id' | 'friendId' | 'friendName' | 'friendAvatar'>[]> = {
  'OH-8421-MARC': [
    {
      type: 'streak_milestone',
      title: '12-Day Workout Streak Milestone 🔥',
      description: '12 consecutive days of logging every set, hitting 10k steps and dialed-in sleep. Consistency over motivation every single day.',
      timeAgo: '4 hours ago',
      likes: 9,
      userLiked: false,
      congrats: []
    }
  ],
  'OH-3912-SARA': [
    {
      type: 'pr',
      title: 'New Personal Record: 110 kg Back Squat! 🏆',
      description: 'Felt effortless today! 5 reps clean at 95kg, then hit the single at 110kg with zero form breakdown. Overhaul AI suggested moving squats first in the session and it worked wonders!',
      timeAgo: '2 hours ago',
      likes: 6,
      userLiked: false,
      congrats: []
    }
  ],
  'OH-5509-LEO': [
    {
      type: 'workout_completed',
      title: 'Completed Day 2 - Pull Power & Grip ⚡',
      description: '3x3 Deadlifts at 165kg, followed by weighted pull-ups (+15kg) and heavy hammer curls. Grip strength is finally peaking.',
      timeAgo: '6 hours ago',
      likes: 4,
      userLiked: false,
      congrats: []
    }
  ]
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
