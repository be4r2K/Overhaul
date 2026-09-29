export type ThemeMode = 'dark' | 'light' | 'glass';
export type AccentColor = 
  | 'acid_lime'
  | 'amber_flame'
  | 'amethyst_glow'
  | 'bronze_metal'
  | 'burnt_sienna'
  | 'cadmium_orange'
  | 'chartreuse_shock'
  | 'copper_rust'
  | 'crimson_red'
  | 'cyberpunk_pink'
  | 'deep_cobalt'
  | 'deep_forest'
  | 'electric_cyan'
  | 'electric_plum'
  | 'electric_teal'
  | 'emerald_green'
  | 'ghost_lavender'
  | 'hot_fuchsia'
  | 'hyper_violet'
  | 'ice_blue'
  | 'inferno_orange'
  | 'jade_imperial'
  | 'lapis_lazuli'
  | 'laser_lemon'
  | 'midnight_indigo'
  | 'mint_green'
  | 'neon_grape'
  | 'neon_green'
  | 'neon_magenta'
  | 'obsidian_black'
  | 'pastel_peach'
  | 'pitch_black'
  | 'plasma_yellow'
  | 'platinum_silver'
  | 'pure_white'
  | 'royal_sapphire'
  | 'ruby_rose'
  | 'scarlet_red'
  | 'solar_gold'
  | 'steel_blue'
  | 'stealth_slate'
  | 'sunset_coral'
  | 'tangerine_pulse'
  | 'titanium_gray'
  | 'toxic_slime'
  | 'ultramarine_sky'
  | 'ultra_violet'
  | 'verdant_olive'
  | 'volcanic_red'
  | 'zaffre_blue'
  | 'custom';

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
}

export interface AIWorkoutParsedExercise {
  name: string;
  setsReps?: string;
  targetMuscle: string;
  rating?: number;
  substitution: string;
  notes?: string;
  formCue?: string;
}

export interface AIWorkoutParsedDay {
  dayTitle: string;
  focus: string;
  exercises: AIWorkoutParsedExercise[];
}

export interface AIMuscleCoverage {
  muscle: string;
  intensity: string;
  percentage: number;
  assessment: string;
}

export interface AIExerciseSubstitution {
  originalExercise: string;
  reasonToSwap?: string;
  replacement1: string;
  replacement2: string;
  equipmentNeeded?: string;
}

export interface AIWorkoutExerciseLogItem {
  id: string;
  exerciseName: string;
  dayTitle: string;
  sets: number;
  reps: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  calculated1RM: number;
  timestamp: string;
  notes?: string;
}

export interface AIWorkoutAnalysisResult {
  overallScore: number;
  balanceRating: number;
  volumeRating: number;
  exerciseSelectionRating: number;
  summaryTitle: string;
  honestOpinion: string;
  superStrongAreas: string[];
  neglectedOrNeedsWork: string[];
  improvements: string[];
  muscleGroupCoverage: AIMuscleCoverage[];
  parsedDays: AIWorkoutParsedDay[];
  substitutions: AIExerciseSubstitution[];
  rawNotesSnippet?: string;
  analyzedAt?: string;
}

export type OverviewPeriod = 'daily' | 'monthly' | 'yearly' | 'workout';

export interface AIOverviewData {
  period: OverviewPeriod;
  language?: string;
  headline: string;
  coachVerdict: string;
  completionRate: number;
  streakStatus: {
    currentStreak: number;
    status: 'on_fire' | 'at_risk' | 'broken' | 'building';
    message: string;
  };
  recommendations: string[];
  focusAreas: string[];
  recoveryAdvice: string;
  skippedAdvice?: string;
  generatedAt: string;
}

export interface BodyMuscleRating {
  muscle: string;
  rating: number; // 1-10
  status: 'peak' | 'balanced' | 'needs_improvement' | 'lagging';
  notes: string;
}

export interface PhysiquePotential {
  geneticScore: number; // 1-10 scale
  potentialCeiling: string;
  projectedGainsKg: string;
  topGeneticAdvantages: string[];
  laggingPotentialUnlocks: string[];
  progressForecast: string;
}

export interface AIBodyVisionData {
  id: string;
  date: string;
  photoUrl: string;
  overallRating: number;
  bodyFatEstimate: string;
  postureAssessment: string;
  physiquePotential: PhysiquePotential;
  muscleRatings: BodyMuscleRating[];
  keyImprovements: string[];
  weeklyProgression: {
    hasPreviousComparison: boolean;
    improved: string[];
    stagnant: string[];
    backwards: string[];
    summary: string;
  };
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  didModifyRoutine?: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];
