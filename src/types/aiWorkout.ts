export type ThemeMode = 'dark' | 'light' | 'glass';

export type SignatureAccentColor =
  | 'emerald_light' | 'emerald_green' | 'emerald_dark'
  | 'cobalt_light' | 'deep_cobalt' | 'cobalt_dark'
  | 'cyan_light' | 'electric_cyan' | 'cyan_dark'
  | 'teal_light' | 'electric_teal' | 'teal_dark'
  | 'lime_light' | 'neon_lime' | 'lime_dark'
  | 'amber_light' | 'amber_gold' | 'amber_dark'
  | 'coral_light' | 'coral_orange' | 'coral_dark'
  | 'crimson_light' | 'crimson_red' | 'crimson_dark'
  | 'pink_light' | 'cyberpunk_pink' | 'pink_dark'
  | 'amethyst_light' | 'amethyst_purple' | 'amethyst_dark'
  | 'indigo_light' | 'midnight_indigo' | 'indigo_dark'
  | 'slate_light' | 'slate_monochrome' | 'slate_dark';

export type AccentColor = 
  | SignatureAccentColor
  | string;

export type FontFamily = 
  | 'inter' 
  | 'space_grotesk' 
  | 'cinzel' 
  | 'rubik' 
  | 'sans' 
  | 'mono' 
  | 'display';

export interface AppThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
  font: FontFamily;
  customHex?: string;
  liquidGlass?: boolean; // Apple Liquid Glass Engine toggle
}

export type OverviewPeriod = 'week' | 'month' | '3month' | 'year' | 'all' | 'daily' | 'monthly' | 'yearly' | 'workout';

export interface AIOverviewData {
  period?: any;
  dateRange?: string;
  executiveSummary?: string;
  headline?: string;
  coachVerdict?: string;
  recommendations?: any;
  focusAreas?: any;
  streakStatus?: any;
  completionRate?: any;
  recoveryAdvice?: string;
  totalWorkouts?: number;
  totalVolumeKg?: number;
  totalActiveMinutes?: number;
  totalCaloriesBurned?: number;
  totalSteps?: number;
  averageSleepScore?: number;
  averageHydrationPct?: number;
  readinessTrend?: string;
  prCount?: number;
  topAchievements?: string[];
  keyStrengths?: string[];
  areasForImprovement?: string[];
  strategicRecommendations?: any[];
  generatedAt?: string;
  [key: string]: any;
}

export interface BodyMuscleRating {
  muscle?: string;
  rating?: number;
  status?: string;
  notes?: string;
  [key: string]: any;
}

export interface AIBodyVisionData {
  id?: string;
  date?: string;
  scanTimestamp?: string;
  overallRating?: any;
  bodyFatEstimate?: any;
  muscleMassEstimate?: any;
  symmetryScore?: any;
  postureScore?: any;
  postureAssessment?: any;
  physiquePotential?: any;
  muscleRatings?: any;
  keyImprovements?: any;
  strengths?: any;
  weaknesses?: any;
  critiqueNotes?: any;
  weeklyProgression?: any;
  photoUrls?: any;
  [key: string]: any;
}

export interface AIWorkoutParsedExercise {
  name: string;
  setsReps?: string;
  targetMuscle?: string;
  rating?: number;
  tips?: string;
  notes?: string;
  substitution?: string;
  suggestedWeight?: number;
  suggestedReps?: number;
  [key: string]: any;
}

export interface AIWorkoutDayRoutine {
  dayName?: string;
  dayTitle?: string;
  focus?: string;
  dayType?: string;
  exercises?: AIWorkoutParsedExercise[];
  [key: string]: any;
}

export interface AIWorkoutAnalysisResult {
  id?: string;
  splitName?: string;
  splitSummary?: string;
  summaryTitle?: string;
  balanceRating?: any;
  overallScore?: any;
  parsedDays?: AIWorkoutDayRoutine[];
  schedule?: AIWorkoutDayRoutine[];
  weakPointsIdentified?: any;
  fatigueRiskAssessment?: any;
  frequencyAdvice?: any;
  muscleGroupCoverage?: any;
  substitutions?: any;
  neglectedOrNeedsWork?: any;
  improvements?: any;
  honestOpinion?: any;
  rawNotesSnippet?: string;
  analyzedAt?: string;
  lastGenerated?: string;
  [key: string]: any;
}

export interface AIWorkoutExerciseLogItem {
  id?: string;
  name?: string;
  exerciseName?: string;
  category?: string;
  weightKg?: number;
  weight?: number;
  reps?: number;
  sets?: any;
  weightUnit?: string;
  timestamp?: string;
  dayTitle?: string;
  calculated1RM?: number;
  notes?: string;
  date?: string;
  [key: string]: any;
}

export interface AIChatMessage {
  id?: string;
  sender?: 'user' | 'ai';
  role?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  didModifyRoutine?: boolean;
  suggestedRoutineUpdate?: AIWorkoutAnalysisResult;
  [key: string]: any;
}

export type AICoachMessage = AIChatMessage;
