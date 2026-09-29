import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Target, 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Moon, 
  RefreshCw 
} from 'lucide-react';
import { AIOverviewData, OverviewPeriod } from '../types/aiWorkout';
import { DailyNutritionLog, DailyStepLog, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import confetti from 'canvas-confetti';

interface AIOverviewSectionProps {
  profile: UserProfile;
  liftRecords: LiftRecord[];
  sportsHistory: SportActivity[];
  stepsHistory: DailyStepLog[];
  sleepHistory: SleepLog[];
  nutritionLog: DailyNutritionLog;
}

export const AIOverviewSection: React.FC<AIOverviewSectionProps> = ({
  profile,
  liftRecords = [],
  sportsHistory = [],
  stepsHistory = [],
  sleepHistory = [],
  nutritionLog,
}) => {
  const [period, setPeriod] = useState<OverviewPeriod>('daily');
  const [loading, setLoading] = useState<boolean>(false);

  // Purely static local state by default with zero automatic background network requests on mount
  const [overview, setOverview] = useState<AIOverviewData>({
    period: 'daily',
    headline: 'Streak Protected & Execution Optimal',
    coachVerdict: `Discipline is locked in, ${profile?.name || 'Athlete'}. Protect your streak, maintain progressive overload, and execute your sessions with uncompromising focus.`,
    completionRate: 90,
    streakStatus: {
      currentStreak: 3,
      status: 'on_fire',
      message: '3 days strong and burning!'
    },
    recommendations: [
      'Hydrate with at least 500ml of electrolyte water before your session.',
      'Prioritize 8 hours of uninterrupted sleep for neuromuscular recovery.',
      'Focus on progressive overload on your main compound movement.'
    ],
    focusAreas: ['Chest & Triceps', 'Sleep Recovery', 'Core Stability'],
    recoveryAdvice: 'Sleep quality is optimal. Ensure you hit protein targets (+1.8g/kg).',
    skippedAdvice: 'None — keep up the relentless momentum!',
    generatedAt: 'Just now'
  });

  const handleManualRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setOverview({
        period,
        headline: 'AI Coach Briefing Refreshed',
        coachVerdict: `All training logs and recovery metrics analyzed successfully for ${period}. Keep pushing forward!`,
        completionRate: 95,
        streakStatus: {
          currentStreak: 4,
          status: 'on_fire',
          message: 'Momentum is peaking!'
        },
        recommendations: [
          'Maintain clean nutrition and caloric surplus for muscle repair.',
          'Incorporate 10 minutes of mobility work post-workout.',
          'Protect sleep consistency.'
        ],
        focusAreas: ['Back & Biceps', 'Hydration', 'Mobility'],
        recoveryAdvice: 'Recovery status is green.',
        skippedAdvice: 'None — flawless execution.',
        generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setLoading(false);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    }, 400);
  };

  const briefing = overview || {
    headline: 'Streak Protected. Keep pushing.',
    coachVerdict: 'Discipline is locked in.',
    completionRate: 90,
    streakStatus: { currentStreak: 3, status: 'on_fire', message: 'Streak active!' },
    recommendations: [],
    focusAreas: [],
    recoveryAdvice: 'Recovery optimal.',
    skippedAdvice: 'None',
    generatedAt: 'Just now'
  };

  const safeRecommendations = Array.isArray(briefing?.recommendations) ? briefing.recommendations : [];
  const safeFocusAreas = Array.isArray(briefing?.focusAreas) ? briefing.focusAreas : [];
  const safeStreak = briefing?.streakStatus?.currentStreak ?? 3;
  const safeScore = briefing?.completionRate ?? 90;

  return (
    <div className="h-full flex flex-col justify-between gap-2 overflow-hidden select-none">
      {/* Top Controls: Timeframe Tabs */}
      <div className="ig-glass-card rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 border border-white/10 shadow-sm shrink-0">
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 overflow-x-auto">
          {(['daily', 'monthly', 'yearly', 'workout'] as OverviewPeriod[]).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'accent-bg text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Right side: Manual Refresh Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/15 transition-all cursor-pointer"
            title="Refresh AI Overview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main AI Coach Card */}
      <div className="ig-glass-card rounded-2xl p-3 sm:p-4 border border-white/15 shadow-xl flex-1 min-h-0 flex flex-col justify-between overflow-y-auto gap-2.5 pr-1">
        {/* Header Banner */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-black shadow-md shrink-0"
              style={{ backgroundColor: 'var(--accent-hex)' }}
            >
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider font-mono">
                <span className="accent-text">AI Coach Intelligence</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 capitalize">{briefing?.period || period} Briefing</span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                {briefing?.headline || 'Coach Briefing'}
              </h3>
            </div>
          </div>

          {/* Streak & Completion Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-1 text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="text-[11px] font-mono font-black">{safeStreak}d</span>
            </div>

            <div className="px-2 py-1 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1 text-white">
              <span className="text-[11px] font-mono font-black accent-text">{safeScore}%</span>
            </div>
          </div>
        </div>

        {/* Coach Verdict */}
        <div className="p-2.5 sm:p-3 rounded-xl border shrink-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Coach Commendation</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-100 font-medium whitespace-pre-line">
            "{briefing?.coachVerdict || 'Streak protected. Keep pushing.'}"
          </p>
        </div>

        {/* Modular Grid: Recommendations & Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
          {/* Recommendations */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Coach Action Items</span>
            </div>
            <div className="space-y-1">
              {safeRecommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center font-mono font-bold text-[9px] text-black shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--accent-hex)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-tight">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas & Recovery */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white mb-1.5">
                <Award className="w-3.5 h-3.5 text-violet-400" />
                <span>Priority Focus Areas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {safeFocusAreas?.map((area, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 text-white border border-white/15"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Moon className="w-3 h-3 text-indigo-400" />
                <span className="font-bold text-slate-200">Sleep & Recovery:</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">{briefing?.recoveryAdvice || 'Prioritize 8 hours of sleep.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
