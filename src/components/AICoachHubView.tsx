import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Dumbbell, 
  Camera, 
  Bot, 
  TrendingUp, 
  Calendar,
  Layers,
  MessageSquare
} from 'lucide-react';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { DailyNutritionLog, DailyStepLog, ExerciseCategory, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import { AIWorkoutSection } from './AIWorkoutSection';
import { AIBodyVisionSection } from './AIBodyVisionSection';
import { AICoachChatSection } from './AICoachChatSection';
import { AIOverviewSection } from './AIOverviewSection';
import { ErrorBoundary } from './ErrorBoundary';
import { t } from '../utils/i18n';

export type AICoachSubTab = 'overview' | 'routine' | 'body-rating' | 'coach-chat';

interface AICoachHubViewProps {
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

export const AICoachHubView: React.FC<AICoachHubViewProps> = ({
  profile = {} as UserProfile,
  cachedAnalysis = null,
  onSaveAnalysis,
  onImportExercisesToGym,
  onAddLift,
  liftRecords = [],
  sportsHistory = [],
  stepsHistory = [],
  sleepHistory = [],
  nutritionLog = { date: '', waterConsumedMl: 0, meals: [] },
  onOpenTimer,
  language = 'en',
  onUpdateLanguage,
  initialSubTab = 'overview',
}) => {
  // Normalize initialSubTab
  const normalizedInitial = initialSubTab === 'vision' ? 'body-rating' : initialSubTab;
  const [subTab, setSubTab] = useState<AICoachSubTab>(normalizedInitial);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab === 'vision' ? 'body-rating' : initialSubTab);
    }
  }, [initialSubTab]);

  const subTabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp, desc: 'Streaks & Audits' },
    { id: 'routine' as const, label: 'Routines', icon: Dumbbell, desc: 'Live Execution' },
    { id: 'body-rating' as const, label: 'Body Rating', icon: Camera, desc: 'Physique Scanner' },
    { id: 'coach-chat' as const, label: 'AI Chat', icon: MessageSquare, desc: 'Split Adaptor' },
  ];

  return (
    <ErrorBoundary
      fallbackTitle={t('coachUnavailable', language)}
      fallbackDescription={t('coachUnavailableDesc', language)}
    >
      <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 max-w-7xl mx-auto w-full gap-2 select-none">
        {/* Top Segmented Subpage Bar: Dedicated Subpages for Body Rating & AI Chat */}
        <div className="ig-glass-card rounded-2xl p-1.5 border border-white/10 grid grid-cols-4 gap-1 shadow-md shrink-0 relative">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`relative py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden select-none z-10 ${
                  isActive ? 'text-black font-black' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-xl shadow-md z-[-1]"
                    style={{ backgroundColor: 'var(--accent-hex)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 stroke-[2.4] shrink-0 transition-colors ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area with smooth internal scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={subTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full flex flex-col"
            >
              {/* SUBPAGE 1: AI OVERVIEWS & STREAKS */}
              {subTab === 'overview' && (
                <AIOverviewSection
                  profile={profile}
                  liftRecords={liftRecords}
                  sportsHistory={sportsHistory}
                  stepsHistory={stepsHistory}
                  sleepHistory={sleepHistory}
                  nutritionLog={nutritionLog}
                />
              )}

              {/* SUBPAGE 2: ROUTINES & LIVE WORKOUT EXECUTION */}
              {subTab === 'routine' && (
                <AIWorkoutSection
                  profile={profile}
                  cachedAnalysis={cachedAnalysis}
                  onSaveAnalysis={onSaveAnalysis}
                  onImportExercisesToGym={onImportExercisesToGym}
                  onAddLift={onAddLift}
                  liftRecords={liftRecords}
                  onOpenTimer={onOpenTimer}
                />
              )}

              {/* SUBPAGE 3: DEDICATED BODY VISION & PHYSIQUE RATING ENGINE */}
              {subTab === 'body-rating' && (
                <AIBodyVisionSection
                  profile={profile}
                  currentRoutine={cachedAnalysis}
                  onUpdateRoutine={onSaveAnalysis}
                  language={language}
                  onNavigateToChat={() => setSubTab('coach-chat')}
                />
              )}

              {/* SUBPAGE 4: DEDICATED AI COACH CHAT & REAL-TIME SPLIT ADAPTATION */}
              {subTab === 'coach-chat' && (
                <AICoachChatSection
                  profile={profile}
                  currentRoutine={cachedAnalysis}
                  onUpdateRoutine={onSaveAnalysis}
                  onNavigateToRoutine={() => setSubTab('routine')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
};
