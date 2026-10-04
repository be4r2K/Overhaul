import React, { useState } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Zap, 
  Wind, 
  MapPin, 
  Dumbbell, 
  Footprints, 
  Bike, 
  Activity, 
  Flame, 
  TrendingUp, 
  Scale, 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Sparkles, 
  Droplet,
  Clock,
  Plus, 
  RefreshCw, 
  LogIn, 
  CheckCircle2, 
  Compass, 
  Award, 
  ZapOff, 
  Navigation, 
  Smartphone, 
  Sliders, 
  ArrowUpRight, 
  MoreHorizontal,
  Moon,
  Users
} from 'lucide-react';
import { DailyNutritionLog, DailyStepLog, Friend, FriendPost, LiftRecord, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import { WeatherData } from '../utils/weather';
import { 
  calculateAge, 
  calculateBMI, 
  calculateBodyComposition, 
  calculateBPL, 
  calculateNutritionTargets, 
  calculateTDEE, 
  units 
} from '../utils/calculations';
import { CardDetailModal } from './CardDetailModal';
import { SleepCard } from './SleepCard';
import { AthleteProfileModal } from './AthleteProfileModal';
import { AppThemeSettings } from '../types/aiWorkout';
import { getAndUpdateDailyStreak } from '../utils/streak';


interface HomeMainViewProps {
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
  friends?: Friend[];
  friendPosts?: FriendPost[];
  onUpdateFriendPosts?: (posts: FriendPost[]) => void;
  nutritionLog: DailyNutritionLog;
  onNavigateTab: (tab: string) => void;
  onQuickAddSteps: (inc: number) => void;
  onOpenTimer: () => void;
  onOpenQuickLog: () => void;
  onGoogleSignIn: () => void;
  authLoading: boolean;
  isAuthenticated: boolean;
  onOpenSettings?: () => void;
  onOpenPhysiqueScanner?: () => void;
  theme?: AppThemeSettings;
  language?: string;
}

export const HomeMainView: React.FC<HomeMainViewProps> = ({
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
  friends = [],
  friendPosts = [],
  onUpdateFriendPosts,
  nutritionLog,
  onNavigateTab,
  onQuickAddSteps,
  onOpenTimer,
  onOpenQuickLog,
  onGoogleSignIn,
  authLoading,
  isAuthenticated,
  onOpenSettings,
  onOpenPhysiqueScanner,
  theme,
  language = 'en',
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showAthleteModal, setShowAthleteModal] = useState(false);

  // Enforce default collapsed state on tab switch / mount
  React.useEffect(() => {
    setExpandedCard(null);
    setIsProfileModalOpen(false);
    setShowAthleteModal(false);
  }, []);

  // Core biometrics calculations: If unlogged (weight 0 or height 0), keep at 0!
  const hasLoggedWeight = profile.weightKg > 0;
  const hasLoggedHeight = profile.heightCm > 0;
  const ageData = calculateAge(profile.birthDate);
  const bmiData = calculateBMI(profile.weightKg, profile.heightCm);
  const bodyComp = calculateBodyComposition(profile.weightKg, profile.heightCm, ageData.years, profile.gender);
  const bmrData = hasLoggedWeight ? calculateTDEE(1800, profile.activityLevel) : 0;
  const targets = hasLoggedWeight 
    ? calculateNutritionTargets(bmrData, profile.weightKg, profile.goal, profile.macroSplit)
    : { targetCalories: 0, proteinGrams: 0, carbsGrams: 0, fatsGrams: 0, goalLabel: 'Log metrics to set target' };

  // Big 3 Total Strength: If unlogged, 0!
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };
  const benchPR = getBest1RM('bench-press');
  const squatPR = getBest1RM('back-squat');
  const deadliftPR = getBest1RM('deadlift');
  const bigThreeTotalKg = benchPR + squatPR + deadliftPR;
  const strengthRatio = profile.weightKg > 0 && bigThreeTotalKg > 0 
    ? Number((bigThreeTotalKg / profile.weightKg).toFixed(2)) 
    : 0;

  // Daily Steps: If unlogged, 0!
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

  // Today's activities: If unlogged, 0!
  const todayLifts = liftRecords.filter((l) => l.date === todayStr);
  const todaySports = sportsHistory.filter((s) => s.date === todayStr);
  const totalSportCaloriesToday = todaySports.reduce((sum, s) => sum + s.caloriesBurned, 0);
  const totalCaloriesBurnedToday = todayStepLog.caloriesBurned + totalSportCaloriesToday;

  // Meals & Calories: If unlogged, 0!
  const totalCaloriesConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0);
  const remainingCalories = targets.targetCalories > 0 
    ? targets.targetCalories - totalCaloriesConsumed + totalCaloriesBurnedToday
    : 0;

  // BPL Score
  const weeklyStepsAvg = stepsHistory.length > 0 
    ? Math.round(stepsHistory.reduce((a, b) => a + b.steps, 0) / stepsHistory.length)
    : 0;
  const weeklyCardioMinutes = sportsHistory.reduce((sum, s) => sum + s.durationMinutes, 0);
  const bplData = calculateBPL(
    strengthRatio,
    weeklyStepsAvg,
    weeklyCardioMinutes,
    bmiData.bmi,
    bodyComp.bodyFatPct
  );

  // Weather icon helper
  const renderWeatherIcon = (iconType?: WeatherData['iconType']) => {
    switch (iconType) {
      case 'rain': return <CloudRain className="w-6 h-6 text-cyan-400" />;
      case 'cloud': return <Cloud className="w-6 h-6 text-slate-300" />;
      case 'snow': return <Snowflake className="w-6 h-6 text-blue-200" />;
      case 'storm': return <Zap className="w-6 h-6 text-amber-400" />;
      case 'wind': return <Wind className="w-6 h-6 text-teal-300" />;
      default: return <Sun className="w-6 h-6 text-amber-400 fill-amber-400/20" />;
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleTriggerGps = async () => {
    if (!onRequestGps) return;
    setGpsAcquiring(true);
    try {
      await onRequestGps();
    } finally {
      setGpsAcquiring(false);
    }
  };

  // Circular gauge math
  const circleRadius = 34;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (stepPct / 100) * circumference;

  // Instagram More Options (•••) button helper
  const renderMoreIcon = (cardId: string, title: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setExpandedCard(cardId);
      }}
      className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      title={`Options & full details for ${title}`}
      aria-label={`Options for ${title}`}
    >
      <MoreHorizontal className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="flex-1 min-h-full flex flex-col justify-start overflow-y-auto p-2 sm:p-3 pb-16 max-w-7xl mx-auto w-full gap-2.5 select-none">
      {/* COMPACT 1-PAGE HERO BAR: Minimalist, clean, Instagram glass */}
      <div className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between gap-2.5 relative shrink-0">
        {/* ABSOLUTE TOP-RIGHT: Animated Streak Pill Badge (1 Day ⚡) */}
        <div
          style={{ position: 'absolute', top: '12px', right: '12px' }}
          className="z-20"
        >
          <span
            className="pill streak-badge-flash inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded-full relative"
            title="Active Daily Training Streak"
          >
            <span className="tabular-nums tracking-tight">
              {getAndUpdateDailyStreak().currentStreak} {getAndUpdateDailyStreak().currentStreak === 1 ? 'Day' : 'Days'}
            </span>
            <svg
              className="lightning-flash-svg w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M13 2L4.09 12.63C3.74 13.04 3.57 13.25 3.56 13.43C3.56 13.59 3.63 13.74 3.76 13.84C3.91 13.95 4.18 13.95 4.72 13.95H11L10 22L18.91 11.37C19.26 10.96 19.43 10.75 19.44 10.57C19.44 10.41 19.37 10.26 19.24 10.16C19.09 10.05 18.82 10.05 18.28 10.05H12L13 2Z"
                fill="#EAB308"
                stroke="#FDE047"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Top Tier: Avatar, Name & Date on left */}
        <div className="flex items-center justify-between gap-2 pr-24">
          {/* Avatar and Name */}
          <div 
            onClick={() => setShowAthleteModal(true)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
            title="Tap to open Athlete Profile & Career Stats"
          >
            {/* Instagram Story Gradient Ring around Profile */}
            <div className="p-[2px] rounded-full ig-story-ring shrink-0 shadow-md">
              <div className="avatar-circle w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-950 border border-black/15 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white font-black text-base shadow-xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'O'}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span className="accent-text font-bold">{formattedDate}</span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-inherit truncate">
                {profile.name || 'Athlete'}{profile.familyName ? ` ${profile.familyName}` : ''}
              </h1>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Rank Badge on BOTTOM LEFT; SYNCED badge on BOTTOM RIGHT */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-black/5 dark:border-white/10">
          {/* BOTTOM LEFT: Rank badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAthleteModal(true);
            }}
            className="pill inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-mono font-bold text-xs px-2.5 py-1 rounded-full active:scale-95 transition-all cursor-pointer"
            title="Athlete Rank & BPL Tier"
          >
            <span>🏆</span>
            <span>{bplData.tier}</span>
          </button>

          {/* BOTTOM RIGHT: Synced Badge / Google Sync */}
          <div className="shrink-0">
            {!isAuthenticated ? (
              <button
                onClick={onGoogleSignIn}
                disabled={authLoading}
                className="pill px-2.5 py-1 text-inherit rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{authLoading ? '...' : 'Sync'}</span>
              </button>
            ) : (
              <div className="pill flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Synced</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPACT BENTO GRID (1-PAGE VIEWPORT PRESENCE) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* CIRCLE 1: Steps Ring (Square card with circular progress gauge) */}
        <div 
          onClick={() => setExpandedCard('steps-ring')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer group hover:scale-[1.02] relative"
        >
          <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase accent-text font-mono">
            <span>Steps Ring</span>
            <div className="flex items-center gap-1">
              <span>{stepPct}%</span>
              {renderMoreIcon('steps-ring', 'Steps Ring')}
            </div>
          </div>

          <div className="relative my-1 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={circleRadius}
                className="stroke-slate-200 dark:stroke-slate-900/80 fill-transparent"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r={circleRadius}
                className="stroke-accent fill-transparent transition-all duration-500"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ stroke: 'var(--accent-hex)' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-black font-mono text-white tabular-nums">
                {todayStepLog.steps.toLocaleString()}
              </span>
              <span className="text-[8px] text-slate-400 uppercase font-mono">
                / {(todayStepLog.target / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/10">
            <span>{todayStepLog.distanceKm > 0 ? (isMetric ? `${todayStepLog.distanceKm}km` : `${units.kmToMiles(todayStepLog.distanceKm)}mi`) : '0.0km'}</span>
            <span className="accent-text font-mono font-bold">+{todayStepLog.caloriesBurned}kcal</span>
          </div>
        </div>

        {/* CIRCLE 2: BPL Athletic Level Gauge */}
        <div 
          onClick={() => setExpandedCard('bpl-score')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer group hover:scale-[1.02] relative"
        >
          <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-violet-400 font-mono">
            <span>BPL Score</span>
            <div className="flex items-center gap-1">
              <span>{bplData.tier}</span>
              {renderMoreIcon('bpl-score', 'BPL Score')}
            </div>
          </div>

          <div className="relative w-18 h-18 rounded-full ig-story-ring p-[2px] my-1 shadow-inner">
            <div className="bpl-score-circle w-full h-full rounded-full bg-slate-100/90 dark:bg-slate-950/80 border border-black/10 dark:border-white/10 flex flex-col items-center justify-center">
              <span className="bpl-number text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">
                {bplData.score}
              </span>
              <span className="bpl-label text-[8px] font-bold uppercase tracking-wider text-slate-700 dark:text-violet-400">
                Level
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-black/5 dark:border-white/10">
            <span>Fat: {bodyComp.bodyFatPct > 0 ? `${bodyComp.bodyFatPct}%` : '0%'}</span>
            <span className="text-violet-500 dark:text-violet-400 font-mono font-bold uppercase text-[9px]">{bplData.tier}</span>
          </div>
        </div>

        {/* SQUARE 1: Body Weight & BMI */}
        <div 
          onClick={() => setExpandedCard('weight-bmi')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-cyan-400 font-mono">Weight & BMI</span>
            <div className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              {renderMoreIcon('weight-bmi', 'Weight & BMI')}
            </div>
          </div>

          <div className="my-1">
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {hasLoggedWeight ? (isMetric ? `${profile.weightKg} kg` : `${units.kgToLbs(profile.weightKg)} lbs`) : '0 kg'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-mono font-bold text-cyan-400">BMI {bmiData.bmi}</span>
              <span className="text-[9px] text-slate-400 truncate">
                {hasLoggedWeight && hasLoggedHeight ? `(${bmiData.category})` : '(Log to track)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span className="truncate">{hasLoggedHeight ? `Height: ${profile.heightCm}cm` : 'Height: 0cm'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQuickLog();
              }}
              className="text-[10px] font-bold accent-text hover:underline flex items-center gap-0.5 cursor-pointer shrink-0 ml-1"
              title="Quickly log or update weight and height"
            >
              <span>{hasLoggedWeight ? 'Update' : '+ Log'}</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* SQUARE 2: Big 3 Strength */}
        <div 
          onClick={() => setExpandedCard('gym-strength')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">Big 3 Power</span>
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
              {renderMoreIcon('gym-strength', 'Big 3 Power')}
            </div>
          </div>

          <div className="my-1">
            <div className="text-xl font-black font-mono text-white tabular-nums">
              {bigThreeTotalKg} <span className="text-xs text-slate-400 font-normal">kg 1RM</span>
            </div>
            <div className="text-xs font-mono text-amber-400 mt-0.5">
              Bench {benchPR}k · Sq {squatPR}k
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Deadlift: {deadliftPR}kg</span>
            <span className="text-amber-400 font-bold flex items-center">PRs <ArrowUpRight className="w-2.5 h-2.5" /></span>
          </div>
        </div>

        {/* RECTANGLE 1: Live Weather & Hyper-local GPS (Col-span 2) - Compact Single-Line Widget */}
        <div 
          onClick={() => setExpandedCard('weather-gps')}
          className="col-span-2 card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex items-center justify-between gap-2 hover:scale-[1.01] transition-all cursor-pointer relative"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="pill p-1 rounded-lg shrink-0 flex items-center justify-center">
              {weather ? renderWeatherIcon(weather.iconType) : <Compass className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-sm font-black font-mono text-white tabular-nums shrink-0">
                {weather ? (isMetric ? `${weather.temperatureC}°C` : `${weather.temperatureF}°F`) : '--°'}
              </span>
              <span className="text-xs text-slate-300 font-semibold truncate max-w-[90px] sm:max-w-[130px]">
                {weather?.city || profile.location || 'Local GPS'}
              </span>
              {weather && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                  · {weather.outdoorAdvice.slice(0, 32)}...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerGps();
              }}
              disabled={gpsAcquiring}
              className="pill text-[10px] text-cyan-600 dark:text-cyan-300 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Lock device GPS"
            >
              <Smartphone className={`w-3 h-3 text-cyan-400 ${gpsAcquiring ? 'animate-bounce' : ''}`} />
              <span className="font-bold">GPS</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshWeather();
              }}
              disabled={weatherLoading}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Refresh weather"
            >
              <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
            </button>
            {renderMoreIcon('weather-gps', 'Live Weather & GPS')}
          </div>
        </div>
      </div>

      {/* ENLARGED BIG CARD DETAIL MODAL */}
      {expandedCard && (
        <CardDetailModal
          cardId={expandedCard}
          onClose={() => setExpandedCard(null)}
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          weather={weather}
          weatherLoading={weatherLoading}
          onRefreshWeather={onRefreshWeather}
          onRequestGps={onRequestGps}
          liftRecords={liftRecords}
          sportsHistory={sportsHistory}
          stepsHistory={stepsHistory}
          sleepHistory={sleepHistory}
          onUpdateSleep={onUpdateSleep}
          nutritionLog={nutritionLog}
          onNavigateTab={onNavigateTab}
          onQuickAddSteps={onQuickAddSteps}
        />
      )}

      <AthleteProfileModal
        isOpen={showAthleteModal}
        onClose={() => setShowAthleteModal(false)}
        profile={profile}
        onUpdateProfile={onUpdateProfile}
        liftRecords={liftRecords}
        sportsHistory={sportsHistory}
        stepsHistory={stepsHistory}
        bplScore={bplData.score}
        bplTier={bplData.tier}
        currentStreak={weeklyStepsAvg > 0 ? 3 : 1}
      />
    </div>
  );
};
