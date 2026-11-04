import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  Activity, 
  Flame, 
  Heart, 
  Sparkles, 
  Droplet, 
  Scale, 
  Ruler, 
  Calendar, 
  User, 
  Info,
  CheckCircle2,
  TrendingUp,
  Zap,
  ShieldCheck,
  X,
  Sliders,
  ChevronRight,
  Maximize2,
  Target,
  Percent,
  Camera,
  Moon
} from 'lucide-react';
import { ActivityLevel, DailyNutritionLog, FitnessGoal, Gender, LiftRecord, MacroSplit, MealItem, SleepLog, SportActivity, UserProfile } from '../types/fitness';
import { 
  calculateAge, 
  calculateBMI, 
  calculateBMR, 
  calculateBodyComposition, 
  calculateBPL, 
  calculateNutritionTargets, 
  calculateTDEE, 
  units 
} from '../utils/calculations';
import { t } from '../utils/i18n';

interface BiometricsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  benchPR1RM: number;
  squatPR1RM: number;
  deadliftPR1RM: number;
  weeklyStepsAvg: number;
  weeklyCardioMinutes: number;
  sleepLog?: SleepLog;
  sleepHistory?: SleepLog[];
  onUpdateSleep?: (updated: SleepLog) => void;
  language?: string;
  nutritionLog?: DailyNutritionLog;
  liftRecords?: LiftRecord[];
  sportsHistory?: SportActivity[];
  onOpenPhysiqueScanner?: () => void;
}

const SleepTrendChart: React.FC<{ sleepHistory?: SleepLog[] }> = ({ sleepHistory = [] }) => {
  const prepareData = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const defaultScores = [76, 82, 79, 88, 92, 85, 88];
    const defaultHours = [7.2, 7.8, 7.4, 8.1, 8.5, 7.6, 8.0];

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const match = sleepHistory.find((s) => s.date === dateStr);
      const score = match ? match.score : defaultScores[6 - i];
      const hours = match ? Number((match.totalMinutes / 60).toFixed(1)) : defaultHours[6 - i];
      const deepMin = match ? match.deepMinutes : Math.round(hours * 60 * 0.22);

      result.push({
        date: dateStr,
        day: dayName,
        score: score,
        hours: hours,
        deepMin: deepMin,
      });
    }
    return result;
  };

  const data = prepareData();
  const avgScore = Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length);
  const avgHours = (data.reduce((acc, curr) => acc + curr.hours, 0) / data.length).toFixed(1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md text-xs space-y-1 font-sans">
          <div className="text-[10px] font-mono uppercase text-indigo-300 font-bold">{p.day} · {p.date}</div>
          <div className="text-sm font-black text-white font-mono flex items-center gap-1.5">
            <span>Sleep Score:</span>
            <span className="text-indigo-400">{p.score}/100</span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium">
            Duration: {p.hours}h ({p.deepMin}m Deep Sleep)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3.5 space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-inherit uppercase font-mono">
              7-Day Sleep Score Trend
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Circadian Recovery Index & Score History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="pill text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-lg">
            7D Avg: {avgScore}/100
          </span>
          <span className="pill text-[10px] font-mono font-bold text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-lg hidden sm:inline-block">
            {avgHours}h / Night
          </span>
        </div>
      </div>

      {/* Recharts Area / Line Chart */}
      <div className="w-full h-44 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="sleepScoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={80} stroke="#818cf8" strokeDasharray="4 4" label={{ value: '80 Target', fill: '#818cf8', fontSize: 9, position: 'insideTopRight' }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#818cf8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#sleepScoreGrad)"
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Optimal Circadian Range (80+)</span>
        </span>
        <span className="text-indigo-400 font-bold">Recharts Synced ✓</span>
      </div>
    </div>
  );
};

export const BiometricsView: React.FC<BiometricsViewProps> = ({
  profile,
  onUpdateProfile,
  benchPR1RM,
  squatPR1RM,
  deadliftPR1RM,
  weeklyStepsAvg,
  weeklyCardioMinutes,
  sleepLog,
  sleepHistory = [],
  onUpdateSleep,
  language = 'en',
  nutritionLog,
  liftRecords = [],
  sportsHistory = [],
  onOpenPhysiqueScanner,
}) => {
  const isMetric = profile.units === 'metric';

  // Active modal drawer for zero-scroll single-screen
  const [activeModal, setActiveModal] = useState<'scale' | 'bmi' | 'body-comp' | 'bmr-tdee' | 'macros' | 'bpl-radar' | null>(null);

  // Enforce default collapsed state on tab switch / mount
  React.useEffect(() => {
    setActiveModal(null);
  }, []);

  // Local state for smooth fluid typing in modals
  const [localWeightStr, setLocalWeightStr] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [localHeightStr, setLocalHeightStr] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );

  // Calculations - strictly 0 when unlogged
  const currentWeightKg = profile.weightKg > 0 ? profile.weightKg : 0;
  const currentHeightCm = profile.heightCm > 0 ? profile.heightCm : 0;
  const hasLoggedWeight = profile.weightKg > 0;
  const hasLoggedHeight = profile.heightCm > 0;
  const ageData = calculateAge(profile.birthDate);
  const bmiData = calculateBMI(currentWeightKg, currentHeightCm);
  const bmrData = calculateBMR(currentWeightKg, currentHeightCm, ageData.years, profile.gender);
  const tdee = calculateTDEE(bmrData.mifflinStJeor, profile.activityLevel);
  const nutrition = calculateNutritionTargets(tdee, currentWeightKg, profile.goal, profile.macroSplit);
  const bodyComp = calculateBodyComposition(currentWeightKg, currentHeightCm, ageData.years, profile.gender);

  // Today's consumed nutrition totals from active logs
  const totalCaloriesConsumed = nutritionLog?.meals?.reduce((sum: number, m: MealItem) => sum + m.calories, 0) || 0;
  const totalProteinConsumed = nutritionLog?.meals?.reduce((sum: number, m: MealItem) => sum + m.proteinG, 0) || 0;
  const totalCarbsConsumed = nutritionLog?.meals?.reduce((sum: number, m: MealItem) => sum + m.carbsG, 0) || 0;
  const totalFatsConsumed = nutritionLog?.meals?.reduce((sum: number, m: MealItem) => sum + m.fatsG, 0) || 0;

  // Big 3 Strength Ratio & Weekly Logged Sessions
  const totalLiftsKg = benchPR1RM + squatPR1RM + deadliftPR1RM;
  const strengthRatio = currentWeightKg > 0 && totalLiftsKg > 0 ? Number((totalLiftsKg / currentWeightKg).toFixed(2)) : 0;
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

  const heightFtIn = units.cmToFtIn(profile.heightCm);

  // Handlers for profile updates
  const handleWeightTyping = (valStr: string) => {
    setLocalWeightStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const weightKg = isMetric ? parsed : units.lbsToKg(parsed);
      onUpdateProfile({ ...profile, weightKg: Number(weightKg.toFixed(1)), hasExplicitlyLogged: true });
    } else if (valStr === '' || valStr === '0') {
      onUpdateProfile({ ...profile, weightKg: 0, hasExplicitlyLogged: true });
    }
  };

  const handleHeightTyping = (valStr: string) => {
    setLocalHeightStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateProfile({ ...profile, heightCm: Math.round(parsed), hasExplicitlyLogged: true });
    } else if (valStr === '' || valStr === '0') {
      onUpdateProfile({ ...profile, heightCm: 0, hasExplicitlyLogged: true });
    }
  };

  const handleFtInChange = (feet: number, inches: number) => {
    const cm = units.ftInToCm(feet, inches);
    onUpdateProfile({ ...profile, heightCm: cm, hasExplicitlyLogged: true });
  };

  return (
    <div
      className="page-container biometrics-page h-full max-h-full flex-1 min-h-0 overflow-hidden flex flex-col justify-start p-1.5 sm:p-2.5 pb-1 max-w-7xl mx-auto w-full select-none"
      style={{
        justifyContent: 'flex-start',
        gap: '0px',
      }}
    >
      {/* 1. TOP HEADER & ATHLETE BIO SUMMARY (Compact) */}
      <div
        className="biometrics-banner card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0"
        style={{ marginBottom: '8px' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="pill w-8 h-8 rounded-xl flex items-center justify-center text-cyan-500 dark:text-cyan-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-inherit tracking-tight">Biometrics & Body Intelligence</h2>
              <span className="pill text-[10px] font-mono px-1.5 py-0.5 rounded-lg text-cyan-600 dark:text-cyan-300 font-bold uppercase">
                BPL {bplData.score}/100 · {bplData.tier}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              {profile.name || 'Athlete'} · {ageData.displayText} · {hasLoggedWeight ? `${profile.weightKg}kg` : '0kg'} · BMI {bmiData.bmi} ({bmiData.category})
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN 6-WIDGET BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[6px] shrink-0">
        {/* WIDGET 1: Scale Weight & Height */}
        <div
          onClick={() => setActiveModal('scale')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Body Scale</span>
            <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="my-1 space-y-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {hasLoggedWeight ? (isMetric ? `${profile.weightKg} kg` : `${units.kgToLbs(profile.weightKg)} lbs`) : '0 kg'}
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug">
              {hasLoggedHeight ? `${profile.heightCm} cm (${heightFtIn.feet}'${heightFtIn.inches}")` : 'Height: 0 cm'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>{isMetric ? 'Metric' : 'Imperial'}</span>
            <span className="text-cyan-400 font-bold">Edit Bio →</span>
          </div>
        </div>

        {/* WIDGET 2: BMI Spectrum & Category */}
        <div
          onClick={() => setActiveModal('bmi')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>BMI Index</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="my-1 space-y-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bmiData.bmi}
            </div>
            <div className="text-[11px] font-bold text-emerald-400 leading-snug">
              {bmiData.category}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>18.5–24.9</span>
            <span className="text-emerald-400 font-bold">Spectrum →</span>
          </div>
        </div>

        {/* WIDGET 3: Body Composition & Lean Mass */}
        <div
          onClick={() => setActiveModal('body-comp')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>Body Comp</span>
            <Percent className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          </div>
          <div className="my-1 space-y-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bodyComp.bodyFatPct > 0 ? `${bodyComp.bodyFatPct}% Fat` : '0% Fat'}
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug">
              Lean: {bodyComp.leanBodyMassKg}kg · FFMI {bodyComp.ffmi}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Fat: {bodyComp.fatMassKg}kg</span>
            <span className="text-violet-400 font-bold">Details →</span>
          </div>
        </div>

        {/* WIDGET 4: BMR & TDEE Metabolism */}
        <div
          onClick={() => setActiveModal('bmr-tdee')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>TDEE Burn</span>
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="my-1 space-y-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {tdee} kcal
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug capitalize">
              {hasLoggedWeight && hasLoggedHeight
                ? `BMR ${bmrData.mifflinStJeor} kcal · ${profile.activityLevel.replace('_', ' ')}`
                : 'Log weight & height'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>HB: {bmrData.harrisBenedict} kcal</span>
            <span className="text-amber-400 font-bold">Formulas →</span>
          </div>
        </div>

        {/* WIDGET 5: Macro Targets & Nutrition Split */}
        <div
          onClick={() => setActiveModal('macros')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Macro Split</span>
            <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </div>

          {/* 3-way Goal Selector Pill */}
          <div
            className="pill settings-item my-1 w-full grid grid-cols-3 gap-1 p-1 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { id: 'maintenance' as FitnessGoal, label: 'Recomp' },
              { id: 'lean_bulk' as FitnessGoal, label: 'Lean Gain' },
              { id: 'moderate_cut' as FitnessGoal, label: 'Fat Loss' },
            ].map((g) => {
              const isSelected = profile.goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onUpdateProfile({ ...profile, goal: g.id })}
                  className={`w-full text-[9px] font-bold py-1 px-0.5 text-center rounded-md transition-all select-none cursor-pointer leading-tight ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title={`${g.label} Macro Goal`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span className="text-rose-400 font-semibold">
              {profile.goal === 'maintenance' ? 'Recomp' : profile.goal === 'lean_bulk' ? 'Lean Gain' : profile.goal === 'moderate_cut' ? 'Fat Loss' : 'Custom'}
            </span>
            <span className="text-rose-400 font-bold shrink-0">Macros →</span>
          </div>
        </div>

        {/* WIDGET 6: BPL Athletic Level & Performance Radar */}
        <div
          onClick={() => setActiveModal('bpl-radar')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>BPL Radar</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="my-1 space-y-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bplData.score}/100 BPL
            </div>
            <div>
              <span className="pill text-[10px] font-bold text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full inline-block">
                {bplData.tier}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Strength {strengthRatio}x</span>
            <span className="text-cyan-400 font-bold">Full Radar →</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS (FULL DETAILED BREAKDOWNS & CONTROLS) */}

      {/* MODAL 1: SCALE & BIO PROFILE CONTROLS */}
      {activeModal === 'scale' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Body Scale & Personal Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Family Name</label>
                  <input
                    type="text"
                    value={profile.familyName || ''}
                    onChange={(e) => onUpdateProfile({ ...profile, familyName: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Weight ({isMetric ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={localWeightStr}
                    onChange={(e) => handleWeightTyping(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 text-white text-sm font-bold font-mono px-3 focus:outline-none"
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localHeightStr}
                    onChange={(e) => handleHeightTyping(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 text-white text-sm font-bold font-mono px-3 focus:outline-none"
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={profile.birthDate}
                    onChange={(e) => onUpdateProfile({ ...profile, birthDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 text-white text-sm font-bold font-mono px-3 focus:outline-none"
                    style={{ height: '42px', borderRadius: '10px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Biological Sex</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => onUpdateProfile({ ...profile, gender: e.target.value as Gender })}
                    className="w-full bg-slate-950 border border-white/15 text-white text-sm font-bold px-3 focus:outline-none"
                    style={{ height: '42px', borderRadius: '10px' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="save-recalculate-btn w-full rounded-xl text-black font-black text-xs shadow-md transition-transform cursor-pointer"
              style={{ backgroundColor: 'var(--accent-hex)', marginTop: '12px', height: '46px', fontWeight: 700 }}
            >
              Save & Recalculate
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: BMI SPECTRUM & GAUGE */}
      {activeModal === 'bmi' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Body Mass Index (BMI) Spectrum</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
              <span className="text-3xl font-black font-mono text-white block">{bmiData.bmi}</span>
              <span className="text-sm font-bold text-emerald-400 block">{bmiData.category}</span>
              <div className="h-3 w-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-rose-500 rounded-full mt-3 relative overflow-hidden" />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>&lt; 18.5 Under</span>
                <span>18.5–24.9 Normal</span>
                <span>25–29.9 Over</span>
                <span>30+ Obese</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: BODY COMPOSITION & LEAN MASS */}
      {activeModal === 'body-comp' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-violet-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Body Composition & Muscle Mass</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Body Fat Percentage</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">{bodyComp.bodyFatPct}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Fat-Free Mass Index</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">{bodyComp.ffmi}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Lean Body Mass</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{bodyComp.leanBodyMassKg} kg</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Total Fat Mass</span>
                <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">{bodyComp.fatMassKg} kg</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: BMR & TDEE METABOLISM */}
      {activeModal === 'bmr-tdee' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Metabolism & Caloric Expenditure</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-300 font-bold block">Active Daily TDEE</span>
                  <span 
                    className="tdee-value-display text-white font-black font-mono"
                    style={{ fontSize: '28px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: '6px' }}
                  >
                    <span>{tdee}</span>
                    <span className="text-base text-amber-300 font-bold font-sans">kcal/day</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block">Mifflin-St Jeor BMR</span>
                  <span className="text-lg font-bold text-white">{bmrData.mifflinStJeor} kcal</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block">Harris-Benedict BMR</span>
                  <span className="text-lg font-bold text-white">{bmrData.harrisBenedict} kcal</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: MACRO TARGETS & SPLIT */}
      {activeModal === 'macros' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div 
            className="macro-modal-container glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl max-w-xl w-full shadow-2xl space-y-4 overflow-y-auto"
            style={{ marginTop: '32px', maxHeight: '80vh', padding: '16px' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Target Calories & Macronutrient Split</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logged vs Target summary card */}
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-xs text-rose-300 font-bold block">Daily Calorie Target</span>
              <span 
                className="target-calorie-display text-white font-black font-mono mt-0.5"
                style={{ fontSize: '26px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}
              >
                <span>{totalCaloriesConsumed} / Target {nutrition.targetCalories}</span>
                <span className="text-sm text-rose-300 font-bold font-sans">kcal</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div 
                className="macro-target-card rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center"
                style={{ padding: '10px 8px', gap: '4px' }}
              >
                <span className="text-xs text-cyan-300 font-bold block">Protein</span>
                <span className="text-lg font-black font-mono text-white block">{totalProteinConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.proteinGrams}g</span>
              </div>
              <div 
                className="macro-target-card rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center"
                style={{ padding: '10px 8px', gap: '4px' }}
              >
                <span className="text-xs text-amber-300 font-bold block">Carbohydrates</span>
                <span className="text-lg font-black font-mono text-white block">{totalCarbsConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.carbsGrams}g</span>
              </div>
              <div 
                className="macro-target-card rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center"
                style={{ padding: '10px 8px', gap: '4px' }}
              >
                <span className="text-xs text-rose-300 font-bold block">Fats</span>
                <span className="text-lg font-black font-mono text-white block">{totalFatsConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.fatsGrams}g</span>
              </div>
            </div>

            {/* Dynamic 3-Way Goal Selector Pill */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="block text-xs font-bold text-slate-200">Macro Goal</label>
              <div className="p-1 bg-black/40 rounded-2xl border border-white/10 grid grid-cols-3 gap-1.5">
                {[
                  {
                    id: 'maintenance' as FitnessGoal,
                    label: 'Recomp',
                    desc: 'Maintain & Build',
                    cals: `${calculateNutritionTargets(tdee, currentWeightKg, 'maintenance', profile.macroSplit).targetCalories} kcal`,
                    protein: `${calculateNutritionTargets(tdee, currentWeightKg, 'maintenance', profile.macroSplit).proteinGrams}g P`,
                  },
                  {
                    id: 'lean_bulk' as FitnessGoal,
                    label: 'Lean Gain',
                    desc: '+10% Surplus',
                    cals: `${calculateNutritionTargets(tdee, currentWeightKg, 'lean_bulk', profile.macroSplit).targetCalories} kcal`,
                    protein: `${calculateNutritionTargets(tdee, currentWeightKg, 'lean_bulk', profile.macroSplit).proteinGrams}g P`,
                  },
                  {
                    id: 'moderate_cut' as FitnessGoal,
                    label: 'Fat Loss',
                    desc: '-18% Deficit',
                    cals: `${calculateNutritionTargets(tdee, currentWeightKg, 'moderate_cut', profile.macroSplit).targetCalories} kcal`,
                    protein: `${calculateNutritionTargets(tdee, currentWeightKg, 'moderate_cut', profile.macroSplit).proteinGrams}g P`,
                  },
                ].map((g) => {
                  const isSelected = profile.goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onUpdateProfile({ ...profile, goal: g.id })}
                      className={`macro-goal-card rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer min-w-0 ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-md font-black ring-2 ring-rose-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ padding: '10px 6px' }}
                    >
                      <span className="text-xs font-bold truncate w-full">{g.label}</span>
                      <span className={`text-[11px] font-mono mt-0.5 font-bold whitespace-nowrap ${isSelected ? 'text-white' : 'text-rose-300'}`}>{g.cals}</span>
                      <span className={`text-[9px] font-mono whitespace-nowrap ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>{g.protein}</span>
                      <span className={`text-[8px] mt-0.5 whitespace-nowrap ${isSelected ? 'text-rose-100 font-normal' : 'text-slate-500'}`}>{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Goal & Macro Split selectors */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fine-Tune Goal</label>
                <select
                  value={profile.goal}
                  onChange={(e) => onUpdateProfile({ ...profile, goal: e.target.value as FitnessGoal })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold cursor-pointer"
                >
                  <option value="maintenance" className="goal-option-item">Maintain</option>
                  <option value="lean_bulk" className="goal-option-item">Lean Bulk</option>
                  <option value="moderate_cut" className="goal-option-item">Fat Loss</option>
                  <option value="aggressive_cut" className="goal-option-item">Aggressive Cut</option>
                  <option value="heavy_bulk" className="goal-option-item">Heavy Bulk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Macro Split Distribution</label>
                <select
                  value={profile.macroSplit}
                  onChange={(e) => onUpdateProfile({ ...profile, macroSplit: e.target.value as MacroSplit })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold cursor-pointer"
                >
                  <option value="high_protein" className="macro-option-item">High Protein</option>
                  <option value="balanced" className="macro-option-item">Balanced</option>
                  <option value="low_carb" className="macro-option-item">Low Carb</option>
                  <option value="keto" className="macro-option-item">Keto</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="close-modal-btn w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/15"
              style={{ marginTop: '16px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: BPL RADAR */}
      {activeModal === 'bpl-radar' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-white">BPL Athletic Score & Performance Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bpl-hero-container rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center flex flex-col items-center justify-center space-y-1" style={{ padding: '16px 0' }}>
              <span className="text-4xl font-black font-mono text-white leading-none">{bplData.score} / 100</span>
              <span className="text-sm font-bold text-cyan-300 block mt-1">{bplData.tier}</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  label: 'Strength to Bodyweight Ratio',
                  scoreVal: bplData.strengthScore,
                  score: `${bplData.strengthScore}/100`,
                  desc:
                    strengthRatio > 0
                      ? `Big 3 total is ${strengthRatio}x bodyweight (${totalLiftsKg} kg)`
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
                <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
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

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
