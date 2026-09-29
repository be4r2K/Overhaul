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
    <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 max-w-7xl mx-auto w-full gap-2 select-none">
      {/* COMPACT 1-PAGE HERO BAR: Minimalist, clean, Instagram glass */}
      <div className="ig-glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm border border-white/10 relative overflow-hidden shrink-0">
        <div 
          onClick={() => setShowAthleteModal(true)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          title="Tap to open Athlete Profile & Career Stats"
        >
          {/* Instagram Story Gradient Ring around Profile */}
          <div className="p-[2px] rounded-full ig-story-ring shrink-0 shadow-md">
            <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white font-black text-base">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'O'}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span className="accent-text font-bold">{formattedDate}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <button
                type="button"
                onClick={handleTriggerGps}
                disabled={gpsAcquiring}
                title="Lock phone GPS"
                className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full border border-white/10 transition-all cursor-pointer"
              >
                <Smartphone className={`w-3 h-3 text-cyan-400 ${gpsAcquiring ? 'animate-bounce' : ''}`} />
                <span className="truncate max-w-[120px]">{gpsAcquiring ? 'Locking GPS...' : profile.location || 'Accurate Phone GPS'}</span>
              </button>
            </div>

            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
              <span className="truncate max-w-[170px] sm:max-w-xs md:max-w-sm" title={`${profile.name || 'Athlete'}${profile.familyName ? ` ${profile.familyName}` : ''}`}>
                {profile.name || 'Athlete'}{profile.familyName ? ` ${profile.familyName}` : ''}
              </span>
              <span className="inline-block animate-pulse text-amber-400 shrink-0">⚡</span>
            </h1>
          </div>
        </div>

        {/* Quick Compact Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {!isAuthenticated ? (
            <button
              onClick={onGoogleSignIn}
              disabled={authLoading}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
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
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider">Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Prompt to Log Weight & Height if unlogged */}
      {(!hasLoggedWeight || !hasLoggedHeight) && (
        <div 
          onClick={onOpenQuickLog}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-violet-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-300 cursor-pointer hover:border-emerald-500/50 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 shadow-sm" style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}>
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>Enter your Weight & Height</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">Action Needed</span>
              </h3>
              <p className="text-[11px] text-slate-300">Tap to unlock real-time TDEE calories, Big 3 strength ratios, and BPL athletic scores.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      )}

      {/* COMPACT BENTO GRID (1-PAGE VIEWPORT PRESENCE) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* CIRCLE 1: Steps Ring (Square card with circular progress gauge) */}
        <div 
          onClick={() => setExpandedCard('steps-ring')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer group hover:scale-[1.02] border border-white/10 relative shadow-sm"
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
                className="stroke-slate-900/80 fill-transparent"
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
          className="ig-glass-card rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer group hover:scale-[1.02] border border-white/10 relative shadow-sm"
        >
          <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-violet-400 font-mono">
            <span>BPL Score</span>
            <div className="flex items-center gap-1">
              <span>{bplData.tier}</span>
              {renderMoreIcon('bpl-score', 'BPL Score')}
            </div>
          </div>

          <div className="relative w-18 h-18 rounded-full ig-story-ring p-[2px] my-1 shadow-inner">
            <div className="w-full h-full rounded-full bg-slate-950/80 flex flex-col items-center justify-center">
              <span className="text-lg font-black font-mono text-white tabular-nums">
                {bplData.score}
              </span>
              <span className="text-[8px] font-bold uppercase text-violet-400">
                Level
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-white/10">
            <span>Fat: {bodyComp.bodyFatPct > 0 ? `${bodyComp.bodyFatPct}%` : '0%'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPhysiqueScanner) onOpenPhysiqueScanner();
              }}
              className="text-violet-400 font-mono font-bold hover:underline cursor-pointer"
            >
              Scan Physique →
            </button>
          </div>
        </div>

        {/* SQUARE 1: Body Weight & BMI */}
        <div 
          onClick={() => setExpandedCard('weight-bmi')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] border border-white/10 relative shadow-sm"
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
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] border border-white/10 relative shadow-sm"
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
          className="col-span-2 ig-glass-card rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm hover:scale-[1.01] transition-all cursor-pointer border border-white/10 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-white/10 border border-white/10 shrink-0 flex items-center justify-center">
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
              className="text-[10px] text-cyan-300 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded-lg border border-white/15 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
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

      {/* RECTANGLE 2: Overhaul AI Coach Hub (Dedicated Subpages: Body Rating, Coach Chat, Overviews & Routines) */}
      <div 
        onClick={() => onNavigateTab('ai-coach')}
        className="ig-glass-card rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all cursor-pointer group shadow-md border border-white/10 hover:border-emerald-500/40 relative overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl ig-story-ring p-[2px] shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">Overhaul AI Performance Hub & Coach</span>
              <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30 uppercase font-mono">Multilingual AI</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              Dedicated subpages for AI Body Rating, Real-Time Split Chat, Overviews & Adaptive Routines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-stretch md:self-auto shrink-0 justify-end flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenPhysiqueScanner) {
                onOpenPhysiqueScanner();
              } else {
                onNavigateTab('ai-coach-rating');
              }
            }}
            className="px-2.5 py-1 text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold border border-white/15 transition-all cursor-pointer"
          >
            Body Rating
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('ai-coach-chat');
            }}
            className="px-2.5 py-1 text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold border border-white/15 transition-all cursor-pointer"
          >
            AI Chat
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('ai-coach');
            }}
            className="px-3 py-1.5 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--accent-hex)' }}
          >
            <span>Open Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SLEEP & RECOVERY CARD */}
      {sleepHistory && sleepHistory.length > 0 && onUpdateSleep && (
        <SleepCard
          sleepLog={sleepHistory.find((s) => s.date === todayStr) || sleepHistory[0]}
          onUpdateSleep={onUpdateSleep}
        />
      )}

      {/* FRIENDS COMMUNITY SPOTLIGHT / ZERO FRIENDS CARD */}
      {(() => {
        const acceptedFriends = (friends || []).filter((fr) => fr.status === 'accepted');
        const incomingRequestsCount = (friends || []).filter((fr) => fr.status === 'pending_incoming').length;
        const outgoingRequestsCount = (friends || []).filter((fr) => fr.status === 'pending_outgoing').length;

        return (
          <div
            onClick={() => onNavigateTab('friends')}
            className="ig-glass-card rounded-2xl p-4 border border-white/10 shadow-md space-y-3 cursor-pointer group hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Friends Community {acceptedFriends.length > 0 ? `(${acceptedFriends.length})` : '(0 Friends)'}
                </span>
                {incomingRequestsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                    {incomingRequestsCount} New
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-white flex items-center gap-1">
                <span>{acceptedFriends.length > 0 ? 'View All Friends' : 'Add Friends & Requests'}</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            {acceptedFriends.length > 0 ? (
              <div className="flex items-center justify-between gap-3 overflow-x-auto">
                {acceptedFriends.slice(0, 3).map((fr) => (
                  <div
                    key={fr.id}
                    className="flex-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={fr.avatar} alt={fr.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{fr.name}</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {fr.streak}d streak · BPL {fr.bplScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">0 Friends Connected</h4>
                    <p className="text-[11px] text-slate-400">
                      {incomingRequestsCount > 0
                        ? `You have ${incomingRequestsCount} incoming friend request waiting to add back!`
                        : outgoingRequestsCount > 0
                        ? `You have ${outgoingRequestsCount} outgoing request pending approval.`
                        : 'No fake friends. Add athlete codes to mutually connect and track Big 3 PRs.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab('friends');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black self-start sm:self-auto cursor-pointer shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                  style={{ backgroundColor: 'var(--accent-hex)' }}
                >
                  {incomingRequestsCount > 0 ? `Review Request (${incomingRequestsCount})` : 'Add Friends & Requests'}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* COMPACT ACTIVITY ROW (Walks, Gym, Rides, Fuel) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Walks */}
        <div
          onClick={() => setExpandedCard('highlights-walks')}
          className="ig-glass-card rounded-2xl p-3 transition-all cursor-pointer group border border-white/10 relative hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 accent-text" style={{ color: 'var(--accent-hex)' }} />
              <span className="font-bold text-white">Walks</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono accent-text font-bold text-[10px]">{stepPct}%</span>
              {renderMoreIcon('highlights-walks', 'Walks')}
            </div>
          </div>
          <div className="text-lg font-black font-mono text-white tabular-nums my-0.5">
            {todayStepLog.steps.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-1">
            <span>{todayStepLog.distanceKm > 0 ? (isMetric ? `${todayStepLog.distanceKm}km` : `${units.kmToMiles(todayStepLog.distanceKm)}mi`) : '0.0km'}</span>
            <span className="accent-text font-mono font-bold">+{todayStepLog.caloriesBurned}k</span>
          </div>
        </div>

        {/* Gym Sets */}
        <div
          onClick={() => setExpandedCard('highlights-gym')}
          className="ig-glass-card rounded-2xl p-3 transition-all cursor-pointer group border border-white/10 relative hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white">Gym Sets</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-cyan-400 font-bold text-[10px]">{todayLifts.length} Sets</span>
              {renderMoreIcon('highlights-gym', 'Gym Sets')}
            </div>
          </div>
          <div className="text-lg font-black font-mono text-white tabular-nums my-0.5 truncate">
            {todayLifts.length > 0 ? `${todayLifts[0].exerciseName.split(' ')[0]} ${todayLifts[0].weightKg}k` : '0 sets logged'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-1">
            <span>Bench: {benchPR}kg</span>
            <span className="text-cyan-400 font-bold">Log Set →</span>
          </div>
        </div>

        {/* Rides & Runs */}
        <div
          onClick={() => setExpandedCard('highlights-rides')}
          className="ig-glass-card rounded-2xl p-3 transition-all cursor-pointer group border border-white/10 relative hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">Cardio</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-amber-400 font-bold text-[10px]">{todaySports.length > 0 ? `${todaySports[0].durationMinutes}m` : '0m'}</span>
              {renderMoreIcon('highlights-rides', 'Cardio')}
            </div>
          </div>
          <div className="text-lg font-black font-mono text-white tabular-nums my-0.5 truncate">
            {todaySports.length > 0 ? todaySports[0].title : '0 sessions'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-1">
            <span>{todaySports.length > 0 && todaySports[0].distanceKm ? `${todaySports[0].distanceKm}km` : '0km'}</span>
            <span className="text-amber-400 font-bold">Log Ride →</span>
          </div>
        </div>

        {/* Daily Fuel */}
        <div
          onClick={() => setExpandedCard('highlights-fuel')}
          className="ig-glass-card rounded-2xl p-3 transition-all cursor-pointer group border border-white/10 relative hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-white">Daily Fuel</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-rose-400 font-bold text-[10px]">{targets.targetCalories} kcal</span>
              {renderMoreIcon('highlights-fuel', 'Daily Fuel')}
            </div>
          </div>
          <div className="text-lg font-black font-mono text-white tabular-nums my-0.5">
            {totalCaloriesConsumed} <span className="text-xs text-slate-400 font-normal">eaten</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-1">
            <span>Burn: +{totalCaloriesBurnedToday}k</span>
            <span className={remainingCalories >= 0 ? 'accent-text font-mono font-bold' : 'text-rose-400 font-mono font-bold'}>
              {remainingCalories} left
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT ACTIVE GOALS & COMPOSITION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div 
          onClick={() => setExpandedCard('body-comp')}
          className="ig-glass-card rounded-2xl p-3 border border-white/10 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 accent-text" style={{ color: 'var(--accent-hex)' }} />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Body Composition</span>
              <span className="text-xs font-bold text-white">
                {hasLoggedWeight ? `${profile.weightKg}kg · BMI ${bmiData.bmi} · ${bmiData.category}` : '0 kg · BMI 0.0 (Log metrics)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] accent-text font-bold">Details →</span>
            {renderMoreIcon('body-comp', 'Body Composition')}
          </div>
        </div>

        <div 
          onClick={() => setExpandedCard('goals-fuel')}
          className="ig-glass-card rounded-2xl p-3 border border-white/10 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Physique Target</span>
              <span className="text-xs font-bold text-white">
                {hasLoggedWeight ? `${targets.goalLabel} (${targets.targetCalories} kcal)` : 'Set Goal & Log Scale Weight'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-cyan-400 font-bold">Macros →</span>
            {renderMoreIcon('goals-fuel', 'Physique Target')}
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
