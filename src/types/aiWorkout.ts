export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'blue';
export type FontFamily = 'sans' | 'mono' | 'display';

export interface AppThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
  font: FontFamily;
}

export interface AIWorkoutParsedExercise {
  name: string;
  setsReps?: string;
  targetMuscle: string;
  rating?: number;
  substitution: string;
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
