import React, { useState } from 'react';
import { 
  X, 
  MoreHorizontal, 
  Footprints, 
  Award, 
  Scale, 
  Dumbbell, 
  Compass, 
  Sparkles, 
  Bike, 
  Flame, 
  Activity, 
  Target, 
  ArrowUpRight, 
  Check, 
  Plus, 
  RefreshCw, 
  Smartphone, 
  TrendingUp, 
  Clock, 
  Info, 
  ChevronRight, 
  Shield, 
  Zap, 
  Sliders, 
  ExternalLink,
  Moon
} from 'lucide-react';
import { DailyNutritionLog, DailyStepLog, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import { WeatherData } from '../utils/weather';
import { units, calculate1RM, calculateAge, calculateBMI, calculateBodyComposition, calculateBPL } from '../utils/calculations';
import { getAndUpdateDailyStreak } from '../utils/streak';
import { calculateStreakFromWorkoutLogs, getWeekDaysActivity, useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export interface CardDetailModalProps {
  cardId: string | null;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  weather: WeatherData | null;
  weatherLoading: boolean;
  onRefreshWeather: () => void;
  onRequestGps?: () => Promise<void>;
  liftRecords: LiftRecord[];
  sportsHistory: SportActivity[];
  stepsHistory: DailyStepLog[];
  sleepHistory?: SleepLog[];
  onUpdateSleep?: (updated: SleepLog) => void;
  nutritionLog: DailyNutritionLog;
  onNavigateTab: (tab: string) => void;
  onQuickAddSteps: (inc: number) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  cardId,
  onClose,
  profile,
  onUpdateProfile,
  weather,
  weatherLoading,
  onRefreshWeather,
  onRequestGps,
  liftRecords,
  sportsHistory,
  stepsHistory,
  sleepHistory = [],
  onUpdateSleep,
  nutritionLog,
  onNavigateTab,
  onQuickAddSteps,
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];

  // Local state for interactive calculators in expanded card
  const [calcWeight, setCalcWeight] = useState(100);
  const [calcReps, setCalcReps] = useState(5);

  // Interactive weight & height quick update
  const [tempWeight, setTempWeight] = useState(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [tempHeight, setTempHeight] = useState(profile.heightCm > 0 ? profile.heightCm.toString() : '');
  const [weightSaved, setWeightSaved] = useState(false);

  // Interactive step target adjust
  const [targetSteps] = useState(profile.stepGoal || 10000);

  // GPS state
  const [gpsTriggering, setGpsTriggering] = useState(false);

  if (!cardId) return null;

  // Steps & Sleep data
  const todayStepLog = stepsHistory.find((s) => s.date === todayStr) || {
    date: todayStr,
    steps: 0,
    target: profile.stepGoal || 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  };
  const stepPct = todayStepLog.target > 0 
    ? Math.min(100, Math.round((todayStepLog.steps / todayStepLog.target) * 100))
    : 0;

  const todaySleepEntry = sleepHistory.find((s) => s.date === todayStr);
  const todaySleepHours = todaySleepEntry
    ? todaySleepEntry.hoursSlept !== undefined
      ? Number(todaySleepEntry.hoursSlept)
      : Number(((todaySleepEntry.totalMinutes || 0) / 60).toFixed(1))
    : 0;
  const sleepTargetHours = 8.0;
  const sleepPct = Math.min(100, Math.round((todaySleepHours / sleepTargetHours) * 100));
  const todaySleepQuality = todaySleepEntry?.qualityScore
    ? todaySleepEntry.qualityScore
    : todaySleepEntry?.score
    ? todaySleepEntry.score
    : todaySleepHours > 0
    ? Math.min(100, Math.max(55, Math.round((todaySleepHours / sleepTargetHours) * 94)))
    : 0;

  // Big 3 PRs
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };
  const benchPR = getBest1RM('bench-press');
  const squatPR = getBest1RM('back-squat');
  const deadliftPR = getBest1RM('deadlift');
  const bigThreeTotalKg = benchPR + squatPR + deadliftPR;
  const estimated1RM = Math.round(calculate1RM(calcWeight, calcReps).average);

  // Dynamic BPL 4-Pillar Calculations
  const strengthRatio =
    profile.weightKg > 0 && bigThreeTotalKg > 0
      ? Number((bigThreeTotalKg / profile.weightKg).toFixed(2))
      : 0;
  const weeklyStepsAvg =
    stepsHistory.length > 0
      ? Math.round(stepsHistory.reduce((a, b) => a + b.steps, 0) / stepsHistory.length)
      : 0;
  const weeklyCardioMinutes = sportsHistory.reduce((sum, s) => sum + s.durationMinutes, 0);
  const ageData = calculateAge(profile.birthDate);
  const bmiData = calculateBMI(profile.weightKg, profile.heightCm);
  const bodyComp = calculateBodyComposition(profile.weightKg, profile.heightCm, ageData.years, profile.gender);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const recentSessionDates = new Set([
    ...liftRecords.filter((l) => l.date >= sevenDaysAgoStr).map((l) => l.date),
    ...sportsHistory.filter((s) => s.date >= sevenDaysAgoStr).map((s) => s.date),
  ]);
  const loggedSessionsThisWeek =
    recentSessionDates.size > 0
      ? recentSessionDates.size
      : liftRecords.length + sportsHistory.length > 0
      ? Math.min(5, liftRecords.length + sportsHistory.length)
      : 0;
  const targetSessions = 5;
  const bplData = calculateBPL(
    strengthRatio,
    weeklyStepsAvg,
    weeklyCardioMinutes,
    bmiData.bmi,
    bodyComp.bodyFatPct,
    loggedSessionsThisWeek,
    targetSessions
  );

  const handleSaveBodyMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(tempWeight);
    const h = parseFloat(tempHeight);

    let updatedWeightKg = profile.weightKg;
    let updatedHeightCm = profile.heightCm;

    if (!isNaN(w) && w > 0) {
      updatedWeightKg = isMetric ? w : units.lbsToKg(w);
    }
    if (!isNaN(h) && h > 0) {
      updatedHeightCm = Math.round(h);
    }

    onUpdateProfile({
      ...profile,
      weightKg: Number(updatedWeightKg.toFixed(1)),
      heightCm: updatedHeightCm,
      hasExplicitlyLogged: true,
    });
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 2000);
  };

  const handleTriggerGpsLocal = async () => {
    if (!onRequestGps) return;
    setGpsTriggering(true);
    try {
      await onRequestGps();
    } finally {
      setGpsTriggering(false);
    }
  };

  // Instagram Card Header Renderer - Clean header without badges, clean X close button
  const renderCardHeader = (title: string, subtitle: string, icon: React.ReactNode, _igTag?: string) => (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
      <div className="flex items-center gap-3">
        {/* Instagram Story Gradient Ring around icon */}
        <div className="p-[2px] rounded-2xl ig-story-ring shrink-0 shadow-md">
          <div className="w-10 h-10 rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white">
            {icon}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="modal-title text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="modal-close-btn p-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
          title="Close details"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 overflow-y-auto"
      onClick={onClose}
    >
      {/* Expanded Big Card Container */}
      <div 
        className={`card w-full max-w-xl glass-modal modal-content dialog-sheet rounded-3xl p-5 sm:p-6 space-y-5 animate-card-expand relative my-auto max-h-[92vh] overflow-y-auto ${
          cardId === 'streak-box' ? 'social-modal-card streak-stats-modal' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DETAIL VIEW 1: Activity & Sleep Dual Ring */}
        {cardId === 'steps-ring' && (
          <>
            {renderCardHeader('Steps & Sleep Telemetry', 'Real-time Samsung Health & Health Connect metrics', <Footprints className="w-5 h-5 text-emerald-400" />, 'Dual Ring')}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Dual Concentric Gauge (Outer = Steps, Inner = Sleep) - Clean Minimal Concentric Arcs */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
                    <defs>
                      <linearGradient id="modalOuterStepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                      <linearGradient id="modalInnerSleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    {/* Outer Track (Steps - Subtle 12% Opacity Track) */}
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-slate-900/15 dark:stroke-white/12 fill-transparent"
                      strokeWidth="9"
                    />
                    {/* Outer Progress (Steps - Dynamic Cyan-to-Emerald with 0.8s cubic-bezier transition) */}
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="url(#modalOuterStepGrad)"
                      className="fill-transparent telemetry-ring-arc"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={(2 * Math.PI * 60) * (1 - stepPct / 100)}
                      strokeLinecap="round"
                    />
                    {/* Inner Track (Sleep - Subtle 12% Opacity Track) */}
                    <circle
                      cx="72"
                      cy="72"
                      r="45"
                      className="stroke-slate-900/15 dark:stroke-white/12 fill-transparent"
                      strokeWidth="9"
                    />
                    {/* Inner Progress (Sleep - Vibrant Amethyst-to-Indigo with 0.8s cubic-bezier transition) */}
                    <circle
                      cx="72"
                      cy="72"
                      r="45"
                      stroke="url(#modalInnerSleepGrad)"
                      className="fill-transparent telemetry-ring-arc"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={(2 * Math.PI * 45) * (1 - sleepPct / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center Core Anchor: Dual Steps Shoe + Diagonal Slash + Sleep Crescent Moon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-1">
                    <Footprints className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                    <span className="text-sm font-bold text-slate-400/80 -rotate-12 select-none">/</span>
                    <Moon className="w-4.5 h-4.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
                  </div>
                </div>

                {/* Numeric Callouts Neatly Positioned Below Ring with Centered Line-Heights */}
                <div className="w-full grid grid-cols-3 gap-2 items-center text-center pt-3 mt-2 border-t border-white/10 font-mono">
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <span className="text-sm font-black text-emerald-400 tabular-nums leading-tight">
                      {todayStepLog.steps.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase leading-tight mt-0.5">Steps ({stepPct}%)</span>
                  </div>
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <span className="text-sm font-black text-cyan-400 tabular-nums leading-tight">
                      {todayStepLog.caloriesBurned}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase leading-tight mt-0.5">Burn (kcal)</span>
                  </div>
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <span className="text-sm font-black text-violet-400 tabular-nums leading-tight">
                      {todaySleepHours.toFixed(1)}h
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase leading-tight mt-0.5">Sleep ({sleepTargetHours.toFixed(1)}h)</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Stats (Steps, Burn, Sleep Duration, Average Cadence) */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Distance Walked</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {isMetric ? `${todayStepLog.distanceKm} km` : `${units.kmToMiles(todayStepLog.distanceKm)} miles`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Active Energy Burn</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    +{todayStepLog.caloriesBurned} kcal
                  </span>
                </div>

                <div className="sleep-telemetry-row p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between whitespace-nowrap" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-xs text-slate-400 whitespace-nowrap">Sleep Telemetry</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-violet-400 whitespace-nowrap">
                    {todaySleepHours.toFixed(1)} hrs Sleep
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Average Cadence</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">
                    {todayStepLog.steps > 0 ? '112 steps/min' : '0 steps/min'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DETAIL VIEW 2: BPL Score */}
        {cardId === 'bpl-score' && (
          <>
            {renderCardHeader('BPL Athletic Performance', 'Body Performance Level 4-pillar index', <Award className="w-5 h-5 text-violet-400" />, bplData.tier)}

            <div className="p-4 rounded-2xl bg-white/[0.04] dark:bg-white/[0.04] border border-white/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Current Rank</span>
                <span className="text-2xl font-black text-white mt-0.5 block">{bplData.tier}</span>
                <span className="text-xs text-slate-400">{bplData.summary}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl ig-story-ring p-[2px] shrink-0">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                  <span className="text-xl font-black font-mono text-white">{bplData.score}</span>
                  <span className="text-[8px] font-bold uppercase text-violet-400">Score</span>
                </div>
              </div>
            </div>

            {/* 4 Performance Pillars */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                The 4 Athletic Pillars
              </label>

              <div className="space-y-2">
                {[
                  {
                    label: 'Strength to Bodyweight Ratio',
                    scoreVal: bplData.strengthScore,
                    score: `${bplData.strengthScore}/100`,
                    desc:
                      strengthRatio > 0
                        ? `Big 3 total is ${strengthRatio}x bodyweight (${bigThreeTotalKg} kg)`
                        : '0x bodyweight — log Big 3 lifts & weight',
                    color: 'bg-emerald-400',
                  },
                  {
                    label: 'Aerobic & Cardio Volume',
                    scoreVal: bplData.cardioScore,
                    score: `${bplData.cardioScore}/100`,
                    desc:
                      weeklyCardioMinutes > 0
                        ? `${weeklyCardioMinutes} / 150 weekly cardio minutes`
                        : '0 / 150 weekly cardio minutes logged',
                    color: 'bg-cyan-400',
                  },
                  {
                    label: 'Body Composition & Lean Mass',
                    scoreVal: bplData.compositionScore,
                    score: `${bplData.compositionScore}/100`,
                    desc:
                      bodyComp.bodyFatPct > 0
                        ? `${(100 - bodyComp.bodyFatPct).toFixed(1)}% lean mass (${bodyComp.bodyFatPct}% body fat)`
                        : '0% lean mass ratio — log weight & height',
                    color: 'bg-violet-400',
                  },
                  {
                    label: 'Logging Consistency & Frequency',
                    scoreVal: bplData.consistencyScore,
                    score: `${bplData.consistencyScore}/100`,
                    desc: `${loggedSessionsThisWeek} / ${targetSessions} active sessions logged this week`,
                    color: 'bg-amber-400',
                  },
                ].map((pillar, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{pillar.label}</span>
                      <span className="font-mono font-bold text-slate-300">{pillar.score}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${pillar.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pillar.scoreVal}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400">{pillar.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* DETAIL VIEW 3: Body Weight & BMI */}
        {cardId === 'weight-bmi' && (
          <>
            {renderCardHeader('Weight & Body Metrics', 'Scale mass, BMI & healthy standard', <Scale className="w-5 h-5 text-cyan-400" />, 'Biometrics')}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Current Scale Weight</span>
                <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
                  {profile.weightKg > 0 ? (isMetric ? `${profile.weightKg} kg` : `${units.kgToLbs(profile.weightKg)} lbs`) : '0 kg'}
                </span>
                <span className="text-[11px] accent-text mt-1 block">
                  {profile.weightKg > 0 ? 'Scale reading logged' : 'Not yet logged'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">BMI Index</span>
                <span className="text-3xl font-extrabold font-mono text-cyan-400 mt-1 block">
                  {profile.weightKg > 0 && profile.heightCm > 0 ? (profile.weightKg / ((profile.heightCm / 100) * (profile.heightCm / 100))).toFixed(1) : '0.0'}
                </span>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  {profile.weightKg > 0 && profile.heightCm > 0 ? 'Normal / Athletic Range' : 'Log weight & height to calculate'}
                </span>
              </div>
            </div>

            {/* Quick Update Scale Weight & Height Form */}
            <form onSubmit={handleSaveBodyMetrics} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Update Scale Weight & Height
                </label>
                {weightSaved && <span className="text-xs text-emerald-400 font-bold">Saved!</span>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Weight ({isMetric ? 'kg' : 'lbs'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      placeholder="e.g. 78.5"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-400">{isMetric ? 'kg' : 'lbs'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={tempHeight}
                      onChange={(e) => setTempHeight(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                      placeholder="e.g. 180"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-400">cm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Updates TDEE calories, Big 3 ratios & BPL in real time.
                </p>
                <button
                  type="submit"
                  className="px-4 py-2 text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: 'var(--accent-hex)' }}
                >
                  Save Metrics
                </button>
              </div>
            </form>
          </>
        )}

        {/* DETAIL VIEW 4: Big 3 Power & Gym 1RM */}
        {cardId === 'gym-strength' && (
          <>
            {renderCardHeader('Big 3 Powerlifting Strength', '1RM metrics & power standards', <Dumbbell className="w-5 h-5 text-amber-400" />, 'Power 1RM')}

            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">Total Big 3</span>
                <span className="text-3xl font-extrabold font-mono text-white mt-0.5 block">{bigThreeTotalKg} kg</span>
                <span className="text-xs text-slate-400">
                  {profile.weightKg > 0 ? (bigThreeTotalKg / profile.weightKg).toFixed(2) : 2.5}x bodyweight ratio
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Dumbbell className="w-7 h-7" />
              </div>
            </div>

            {/* Individual Lifts */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Bench Press</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">{benchPR} kg</span>
                <span className="text-[9px] text-emerald-400 font-bold">Advanced</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Back Squat</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">{squatPR} kg</span>
                <span className="text-[9px] text-amber-400 font-bold">Proficient</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Deadlift</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">{deadliftPR} kg</span>
                <span className="text-[9px] text-cyan-400 font-bold">Elite</span>
              </div>
            </div>
          </>
        )}

        {/* DETAIL VIEW 5: Live Weather & GPS */}
        {cardId === 'weather-gps' && (
          <>
            {renderCardHeader('Hyper-Local Weather & GPS', 'Satellite location & outdoor advisories', <Compass className="w-5 h-5 text-sky-400" />, 'Live Sensor')}

            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-teal-500/10 border border-sky-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 block">Current Conditions</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {weather ? (isMetric ? `${weather.temperatureC}°C` : `${weather.temperatureF}°F`) : '22°C'}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">{weather?.city || 'Local Location'}</span>
                </div>
                <span className="text-xs text-emerald-400 mt-1 block">
                  {weather?.outdoorAdvice || 'Clear skies. Optimal conditions for running and cycling.'}
                </span>
              </div>

              <button
                onClick={handleTriggerGpsLocal}
                disabled={gpsTriggering}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                title="Lock accurate GPS"
              >
                <Smartphone className={`w-5 h-5 text-cyan-400 ${gpsTriggering ? 'animate-bounce' : ''}`} />
                <span className="text-[10px] font-bold">{gpsTriggering ? 'Locking...' : 'Lock GPS'}</span>
              </button>
            </div>

            {/* Sensor Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                <span className="text-slate-400 text-[10px] block weather-metric-label">Wind Velocity</span>
                <div className="weather-metric-value flex items-center gap-1.5 whitespace-nowrap" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono font-bold text-white text-sm whitespace-nowrap">
                    {weather ? (isMetric ? `${weather.windSpeedKmh} km/h` : `${weather.windSpeedMph} mph`) : '5 km/h'}
                  </span>
                  <span className="text-[10px] text-teal-400 whitespace-nowrap">Gentle Breeze</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                <span className="text-slate-400 text-[10px] block weather-metric-label">Relative Humidity</span>
                <div className="weather-metric-value flex items-center gap-1.5 whitespace-nowrap" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono font-bold text-white text-sm whitespace-nowrap">
                    {weather?.humidity || 52}%
                  </span>
                  <span className="text-[10px] text-cyan-400 whitespace-nowrap">Comfortable</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Outdoor Activity Advisory
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span><strong>Running:</strong> Ideal weather for 5K-10K intervals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span><strong>Bicycle Cycling:</strong> Low headwind along open roads</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span><strong>Hydration:</strong> Recommended 500ml water per 45 min active</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DETAIL VIEW 6: AI Notes Workout & Split Engine */}
        {cardId === 'ai-split' && (
          <>
            {renderCardHeader('AI Workout Split & Notes Intelligence', 'Gemini 3.8 Flash multi-day parser', <Sparkles className="w-5 h-5 text-violet-400" />, 'Gemini AI')}

            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-indigo-500/15 border border-violet-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">How The AI Engine Works</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Copy raw unstructured text from your Apple Notes, Samsung Notes, or Google Keep app. Gemini 3.8 processes the entire text:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li>Separates days into structured workout splits (Day 1 Push, Day 2 Pull, Day 3 Legs)</li>
                <li>Extracts sets, reps, and weights for each exercise</li>
                <li>Calculates targeted muscle coverage across your whole body</li>
                <li>Highlights what is super strong vs what is neglected</li>
                <li>Offers intelligent alternative exercises if you cannot perform a movement</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Balanced Splits</span>
                <span className="text-white font-bold mt-1 block">Full Coverage</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] text-violet-400 font-bold block uppercase">Exercise Swaps</span>
                <span className="text-white font-bold mt-1 block">Injury & Joint Free</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onNavigateTab('ai-workouts');
              }}
              className="w-full py-2.5 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-violet-500/20"
            >
              <span>Launch AI Notes Workout Analyzer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* DETAIL VIEW 7: Highlights (Walks, Gym, Rides, Fuel) */}
        {cardId?.startsWith('highlights-') && (
          <>
            {renderCardHeader(
              cardId === 'highlights-walks' ? 'Walks & Step Highlights' :
              cardId === 'highlights-gym' ? 'Gym Sets & PR Highlights' :
              cardId === 'highlights-rides' ? 'Rides & Cardio Highlights' : 'Daily Fuel & Calorie Highlights',
              'Deep dive on today\'s logged session metrics',
              <Flame className="w-5 h-5 text-rose-400" />,
              'Highlights'
            )}

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Date</span>
                <span className="text-white font-bold font-mono">{todayStr}</span>
              </div>

              {cardId === 'highlights-walks' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Steps</span>
                    <span className="text-emerald-400 font-bold font-mono">{todayStepLog.steps.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Distance</span>
                    <span className="text-white font-bold font-mono">{isMetric ? `${todayStepLog.distanceKm} km` : `${units.kmToMiles(todayStepLog.distanceKm)} mi`}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Energy Expenditure</span>
                    <span className="text-emerald-400 font-bold font-mono">+{todayStepLog.caloriesBurned} kcal</span>
                  </div>
                </>
              )}

              {cardId === 'highlights-gym' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Completed Lift Sets</span>
                    <span className="text-cyan-400 font-bold font-mono">{liftRecords.filter(l => l.date === todayStr).length} sets</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Peak Exercise</span>
                    <span className="text-white font-bold font-mono">Bench Press 100kg</span>
                  </div>
                </>
              )}

              {cardId === 'highlights-rides' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cardio History</span>
                    <span className="text-amber-400 font-bold font-mono">{sportsHistory.length} sessions logged</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cardio Type</span>
                    <span className="text-white font-bold">Outdoor Cycling / Run</span>
                  </div>
                </>
              )}

              {cardId === 'highlights-fuel' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Meals Recorded</span>
                    <span className="text-rose-400 font-bold font-mono">{nutritionLog.meals.length} meals</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Calories Consumed</span>
                    <span className="text-white font-bold font-mono">
                      {nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0)} kcal
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                if (cardId === 'highlights-walks' || cardId === 'highlights-rides') onNavigateTab('sports');
                else if (cardId === 'highlights-gym') onNavigateTab('gym');
                else onNavigateTab('nutrition');
              }}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
            >
              <span>Open Dedicated View</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* DETAIL VIEW 8: Body Composition & Fuel Engine */}
        {(cardId === 'body-comp' || cardId === 'goals-fuel') && (
          <>
            {renderCardHeader(
              cardId === 'body-comp' ? 'Body Weight & Composition' : 'Active Goals & Fuel Engine',
              'Macro ratios, metabolic rates & physique strategy',
              <Target className="w-5 h-5 text-emerald-400" />,
              'Nutrition'
            )}

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Physique Goal</span>
                <span className="text-emerald-400 font-bold uppercase font-mono">{profile.goal || 'Lean Muscle Recomp'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Activity Level</span>
                <span className="text-white font-bold capitalize">{profile.activityLevel || 'Moderately Active'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Macro Ratio</span>
                <span className="text-cyan-400 font-mono font-bold">40% P / 40% C / 20% F</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onNavigateTab('nutrition');
              }}
              className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Open Fuel & Nutrition Hub</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* DETAIL VIEW 9: Sleep & Overnight Recovery Engine */}
        {(cardId === 'sleep-card' || cardId === 'sleep-recovery') && (
          <>
            {renderCardHeader(
              'Sleep & Overnight Recovery',
              'Deep, REM, and light sleep telemetry',
              <Zap className="w-5 h-5 text-indigo-400" />,
              'Recovery'
            )}

            {(() => {
              const currentSleep = sleepHistory.find((s) => s.date === todayStr) || sleepHistory[0] || {
                date: todayStr,
                totalMinutes: 0,
                score: 0,
                deepMinutes: 0,
                remMinutes: 0,
                lightMinutes: 0,
                awakeMinutes: 0,
                source: 'manual' as const,
              };

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Sleep</span>
                      <span className="text-xl font-black font-mono text-white mt-0.5 block tabular-nums">
                        {currentSleep.totalMinutes > 0 ? `${Math.floor(currentSleep.totalMinutes / 60)}h ${currentSleep.totalMinutes % 60}m` : '0h 0m'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Deep Sleep</span>
                      <span className="text-xl font-bold font-mono text-indigo-400 mt-0.5 block tabular-nums">
                        {currentSleep.deepMinutes > 0 ? `${Math.floor(currentSleep.deepMinutes / 60)}h ${currentSleep.deepMinutes % 60}m` : '0m'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">REM Sleep</span>
                      <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block tabular-nums">
                        {currentSleep.remMinutes > 0 ? `${Math.floor(currentSleep.remMinutes / 60)}h ${currentSleep.remMinutes % 60}m` : '0m'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Score</span>
                      <span className="text-xl font-black font-mono accent-text mt-0.5 block">
                        {currentSleep.score > 0 ? `${currentSleep.score}/100` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs text-slate-300">
                    <div className="font-bold text-white">Recovery Insight:</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Deep and REM sleep stages enable protein muscle synthesis, testosterone regulation, and central nervous system replenishment. Aim for 7-9 hours of consistent sleep.
                    </p>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* DETAIL VIEW 10: Consistency & Workout Streak Modal */}
        {cardId === 'streak-box' && (() => {
          const appContext = useApp();
          const logsFromContext = appContext ? appContext.workoutLogs : [];
          const combinedLogs = [
            ...(logsFromContext || []),
            ...liftRecords.map((l) => ({ id: l.id, date: l.date, title: l.exerciseName })),
            ...sportsHistory.map((s) => ({ id: s.id, date: s.date, title: s.title })),
          ];
          const scheduledRestDays = ['Wed', 'Sun'];
          const streakCalc = calculateStreakFromWorkoutLogs(combinedLogs, scheduledRestDays);
          const activeStreak = streakCalc.activeStreak;
          const bestStreak = streakCalc.bestStreak;
          const weekDays = getWeekDaysActivity(combinedLogs, scheduledRestDays);
          const activeDaysThisWeek = weekDays.filter((w) => w.hasWorkout).length;
          const consistencyRate = Math.round((activeDaysThisWeek / 7) * 100);

          return (
            <>
              {renderCardHeader(
                'Consistency & Workout Streak Stats',
                'Daily training momentum & weekly cadence',
                <Flame className="w-5 h-5 text-amber-400" />
              )}

              {/* Top Highlight Stats Grid - Restructured Pill Typography */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="streak-stat-pill p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between items-center">
                  <span className="streak-pill-header text-[11px] font-mono text-amber-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
                    ACTIVE
                  </span>
                  <span className="streak-pill-value text-[32px] font-extrabold font-mono text-amber-400 text-center leading-[1.1] my-1">
                    {activeStreak}
                  </span>
                  <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
                    {activeStreak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <div className="streak-stat-pill p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex flex-col justify-between items-center">
                  <span className="streak-pill-header text-[11px] font-mono text-violet-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
                    BEST
                  </span>
                  <span className="streak-pill-value text-[32px] font-extrabold font-mono text-violet-400 text-center leading-[1.1] my-1">
                    {bestStreak}
                  </span>
                  <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
                    {bestStreak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <div className="streak-stat-pill p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between items-center">
                  <span className="streak-pill-header text-[11px] font-mono text-emerald-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
                    CONSISTENCY
                  </span>
                  <span className="streak-pill-value text-[32px] font-extrabold font-mono text-emerald-400 text-center leading-[1.1] my-1">
                    {consistencyRate}%
                  </span>
                  <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
                    {activeDaysThisWeek}/7 Days
                  </span>
                </div>
              </div>

              {/* THIS WEEK'S ACTIVITY - ONLY Mon-Sun Day Indicator Bubbles (no Protected subtext) */}
              <div className="weekly-activity-grid p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">THIS WEEK'S ACTIVITY</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{activeDaysThisWeek}/7 Targets Hit</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {weekDays.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold ${item.isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          item.status === 'done'
                            ? 'bg-emerald-500 text-black font-black'
                            : item.status === 'rest'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : item.isToday
                            ? 'accent-bg text-black font-black ring-2 ring-white/50'
                            : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                        style={item.isToday && item.status !== 'done' && item.status !== 'rest' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                        title={
                          item.status === 'done'
                            ? 'Workout Completed'
                            : item.status === 'rest'
                            ? 'Rest Day Protected'
                            : item.isToday
                            ? 'Today'
                            : 'Rest'
                        }
                      >
                        {item.status === 'done' ? '✔' : item.status === 'rest' ? 'R' : item.isToday ? '⚡' : '○'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Safeguard & Rest Day Protection */}
              <div className="safeguard-card p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Rest Day Safeguard Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Scheduled recovery days on your custom split do not break your streak.</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 shrink-0">
                  Active
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
};
