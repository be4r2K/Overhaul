import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AICoachHubView, AICoachSubTab } from './AICoachHubView';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { DailyNutritionLog, DailyStepLog, ExerciseCategory, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import { RotateCcw, Bot } from 'lucide-react';

interface AICoachViewProps {
  profile?: UserProfile;
  cachedAnalysis?: AIWorkoutAnalysisResult | null;
  onSaveAnalysis: (result: AIWorkoutAnalysisResult) => void;
  onImportExercisesToGym: (exercises: { name: string; category: ExerciseCategory }[]) => void;
  onAddLift: (lift: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => void;
  liftRecords?: LiftRecord[];
  sportsHistory?: SportActivity[];
  stepsHistory?: DailyStepLog[];
  sleepHistory?: SleepLog[];
  nutritionLog?: DailyNutritionLog;
  onOpenTimer: () => void;
  language?: string;
  onUpdateLanguage?: (lang: string) => void;
  initialSubTab?: AICoachSubTab | 'vision';
}

interface AICoachErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AICoachErrorBoundary extends Component<{ children: ReactNode; language?: string; onReset?: () => void }, AICoachErrorBoundaryState> {
  public state: AICoachErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): AICoachErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AICoachErrorBoundary] Caught render error:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.removeItem('ai_coach_chat_history');
      localStorage.removeItem('ai_workout_analysis');
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[calc(100vh-80px)] flex flex-col justify-center items-center p-4 max-w-lg mx-auto w-full select-none">
          <div className="ig-glass-card rounded-3xl p-6 border border-amber-500/30 text-white shadow-2xl space-y-4 text-center w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-md">
              <Bot className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white">
                AI Coach Offline - Tap to Refresh
              </h3>
              <p className="text-xs text-slate-400">
                We caught an unexpected render issue. Tap below to reset and recover safely.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset AI Coach</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AICoachView: React.FC<AICoachViewProps> = (props) => {
  return (
    <AICoachErrorBoundary language={props.language}>
      <AICoachHubView {...props} />
    </AICoachErrorBoundary>
  );
};

export default AICoachView;
