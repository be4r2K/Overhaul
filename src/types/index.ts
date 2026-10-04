export type WeightUnit = 'kg' | 'lbs';

export interface OneRepMaxRecord {
  id: string;
  exercise: string;
  category: 'Barbell' | 'Dumbbell' | 'Bodyweight' | 'Machine' | 'Cable';
  weight: number;
  reps: number;
  unit: WeightUnit;
  estimated1RM: number;
  formula: 'epley' | 'brzycki' | 'lombardi' | 'oconner' | 'mayhew' | 'wathan';
  date: string;
  rpe?: number;
  notes?: string;
  isPersonalRecord?: boolean;
}

export interface BiometricLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  bodyFatPercent?: number;
  restingHeartRate?: number; // bpm
  systolicBp?: number; // mmHg
  diastolicBp?: number; // mmHg
  sleepHours?: number;
  sleepQuality?: number; // 1-100
  hrvMs?: number; // Heart Rate Variability (SDNN/rMSSD)
  stepCount?: number;
  hydrationLiters?: number;
  recoveryScore?: number; // 1-100 calculated or entered
  notes?: string;
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: string;
  sets: ExerciseSet[];
}

export interface WorkoutLog {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  caloriesBurned?: number;
  sportCategory: 'Strength' | 'Running' | 'Cycling' | 'HIIT' | 'Swimming' | 'Calisthenics' | 'Mobility' | 'Sports';
  exercises: WorkoutExercise[];
  rating: 1 | 2 | 3 | 4 | 5;
  rpeAverage?: number;
  notes?: string;
}

export interface WeatherData {
  city: string;
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeedKmH: number;
  uvIndex: number;
  conditionCode: number;
  conditionText: string;
  iconName: string;
  isDay: boolean;
  precipitationProbability: number;
  airQualityIndex?: number;
  forecast: {
    time: string;
    temp: number;
    pop: number;
  }[];
}

export interface SportSuitability {
  sport: string;
  score: number; // 0-100
  status: 'Ideal' | 'Good' | 'Fair' | 'Poor' | 'Hazardous';
  recommendation: string;
  icon: string;
}

export interface UserProfile {
  name: string;
  email: string;
  isGoogleConnected: boolean;
  preferredUnit: WeightUnit;
  heightCm: number;
  targetWeightKg: number;
  dailyStepGoal: number;
  dailyWaterGoalLiters: number;
  dailyCalorieBurnGoal: number;
  theme: 'dark';
  lastSyncedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0 to 100
}
