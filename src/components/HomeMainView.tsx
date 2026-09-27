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
  MoreHorizontal 
} from 'lucide-react';
import { DailyNutritionLog, DailyStepLog, LiftRecord, SportActivity, UserProfile } from '../types/fitness';
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
  nutritionLog: DailyNutritionLog;
  onNavigateTab: (tab: string) => void;
  onQuickAddSteps: (inc: number) => void;
  onOpenTimer: () => void;
  onOpenQuickLog: () => void;
  onGoogleSignIn: () => void;
  authLoading: boolean;
  isAuthenticated: boolean;
  onOpenSettings?: () => void;
  theme?: AppThemeSettings;
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
  nutritionLog,
  onNavigateTab,
  onQuickAddSteps,
  onOpenTimer,
  onOpenQuickLog,
  onGoogleSignIn,
  authLoading,
  isAuthenticated,
  onOpenSettings,
  theme,
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
    <div className="space-y-3 pb-24 md:pb-16 max-w-7xl mx-auto">
      {/* COMPACT 1-PAGE HERO BAR: Minimalist, clean, Instagram glass */}
      <div className="ig-glass-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm border border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-3">
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

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
              <span>{profile.name || 'Athlete'}{profile.familyName ? ` ${profile.familyName}` : ''}</span>
              <span className="inline-block animate-pulse text-amber-400">⚡</span>
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
              <span className="truncate max-w-[85px]">{profile.name}</span>
            </div>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Theme, accent color, font & GPS settings"
              className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          <button
            onClick={onOpenQuickLog}
            className="px-3 py-1.5 accent-bg text-black font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log</span>
          </button>
        </div>
      </div>

      {/* COMPACT BENTO GRID (1-PAGE VIEWPORT PRESENCE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
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
            <span className="text-violet-400 font-mono font-bold">{strengthRatio > 0 ? `${strengthRatio}x` : '0x'}</span>
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

          <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10 truncate">
            {hasLoggedHeight ? `Height: ${profile.heightCm}cm` : 'Height: 0cm'} · Lean: {bodyComp.leanBodyMassKg > 0 ? `${bodyComp.leanBodyMassKg}kg` : '0kg'}
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

        {/* RECTANGLE 1: Live Weather & Hyper-local GPS (Col-span 2) */}
        <div 
          onClick={() => setExpandedCard('weather-gps')}
          className="col-span-2 ig-glass-card rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all cursor-pointer border border-white/10 relative"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
            <div className="flex items-center gap-1.5 text-sky-400">
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live Weather & GPS</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerGps();
                }}
                disabled={gpsAcquiring}
                className="text-[9px] text-cyan-300 hover:text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15 flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-2.5 h-2.5" />
                <span>GPS</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshWeather();
                }}
                disabled={weatherLoading}
                className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                title="Refresh weather"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
              {renderMoreIcon('weather-gps', 'Live Weather & GPS')}
            </div>
          </div>

          {weather ? (
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 flex items-center gap-2">
                <div className="p-1 rounded-xl bg-white/10 border border-white/10 shrink-0">
                  {renderWeatherIcon(weather.iconType)}
                </div>
                <div>
                  <div className="text-base font-black font-mono text-white tabular-nums leading-tight">
                    {isMetric ? `${weather.temperatureC}°C` : `${weather.temperatureF}°F`}
                  </div>
                  <div className="text-[10px] text-slate-300 font-semibold truncate max-w-[80px]">
                    {weather.city || 'Local'}
                  </div>
                </div>
              </div>

              <div className="col-span-7 bg-white/[0.04] p-1.5 rounded-xl border border-white/10 text-[9px] text-emerald-300 leading-snug line-clamp-2">
                <span className="font-bold text-sky-300 block">Advisory:</span>
                {weather.outdoorAdvice}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 py-1 text-center">
              Tap GPS to lock hyper-local coordinates...
            </div>
          )}

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/10 mt-1">
            <span>Wind: {weather ? (isMetric ? `${weather.windSpeedKmh}km/h` : `${weather.windSpeedMph}mph`) : '--'}</span>
            <span>Humidity: {weather?.humidity || 50}%</span>
          </div>
        </div>
      </div>

      {/* RECTANGLE 2: AI Workout Intelligence & Split Engine (Compact) */}
      <div 
        onClick={() => setExpandedCard('ai-split')}
        className="ig-glass-card rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all cursor-pointer group shadow-sm border border-white/10 hover:border-violet-500/40 relative"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl ig-story-ring p-[2px] shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-violet-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">AI Notes Workout & Split Analyzer</span>
              <span className="text-[8px] font-bold text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded-full border border-violet-500/30 uppercase font-mono">Gemini AI</span>
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-1">
              Paste workout notes from Apple Notes or Google Keep. AI splits into days, muscles hit, ratings & swaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('ai-workouts');
            }}
            className="px-3 py-1 bg-violet-500 hover:bg-violet-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Analyze</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          {renderMoreIcon('ai-split', 'AI Workout Split')}
        </div>
      </div>

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
        nutritionLog={nutritionLog}
        onNavigateTab={onNavigateTab}
        onQuickAddSteps={onQuickAddSteps}
      />
    </div>
  );
};
