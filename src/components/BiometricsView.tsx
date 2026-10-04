import React, { useState } from 'react';
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
  Camera
} from 'lucide-react';
import { ActivityLevel, DailyNutritionLog, FitnessGoal, Gender, MacroSplit, MealItem, SleepLog, UserProfile } from '../types/fitness';
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
  onUpdateSleep?: (updated: SleepLog) => void;
  language?: string;
  nutritionLog?: DailyNutritionLog;
  onOpenPhysiqueScanner?: () => void;
}

export const BiometricsView: React.FC<BiometricsViewProps> = ({
  profile,
  onUpdateProfile,
  benchPR1RM,
  squatPR1RM,
  deadliftPR1RM,
  weeklyStepsAvg,
  weeklyCardioMinutes,
  sleepLog,
  onUpdateSleep,
  language = 'en',
  nutritionLog,
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

  // Calculations - relative to user's current weight (79kg) and height (170cm)
  const currentWeightKg = profile.weightKg > 0 ? profile.weightKg : 79;
  const currentHeightCm = profile.heightCm > 0 ? profile.heightCm : 170;
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

  // Big 3 Strength Ratio
  const totalLiftsKg = benchPR1RM + squatPR1RM + deadliftPR1RM;
  const strengthRatio = currentWeightKg > 0 ? Number((totalLiftsKg / currentWeightKg).toFixed(2)) : 0;

  const bplData = calculateBPL(
    strengthRatio,
    weeklyStepsAvg,
    weeklyCardioMinutes,
    bmiData.bmi,
    bodyComp.bodyFatPct
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
    <div className="flex-1 min-h-full flex flex-col justify-start overflow-y-auto p-2 sm:p-3 pb-16 max-w-7xl mx-auto w-full gap-2.5 select-none">
      {/* 1. TOP HEADER & ATHLETE BIO SUMMARY (Compact) */}
      <div className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        {/* WIDGET 1: Scale Weight & Height */}
        <div
          onClick={() => setActiveModal('scale')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Body Scale</span>
            <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="my-1.5 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-inherit tabular-nums leading-tight">
              {hasLoggedWeight ? (isMetric ? `${profile.weightKg} kg` : `${units.kgToLbs(profile.weightKg)} lbs`) : '0 kg'}
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug">
              {hasLoggedHeight ? `${profile.heightCm} cm (${heightFtIn.feet}'${heightFtIn.inches}")` : 'Height: 0 cm'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>{isMetric ? 'Metric' : 'Imperial'}</span>
            <span className="text-cyan-400 font-bold">Edit Bio →</span>
          </div>
        </div>

        {/* WIDGET 2: BMI Spectrum & Category */}
        <div
          onClick={() => setActiveModal('bmi')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>BMI Index</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="my-1.5 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bmiData.bmi}
            </div>
            <div className="text-[11px] font-bold text-emerald-400 leading-snug">
              {bmiData.category}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>18.5–24.9</span>
            <span className="text-emerald-400 font-bold">Spectrum →</span>
          </div>
        </div>

        {/* WIDGET 3: Body Composition & Lean Mass */}
        <div
          onClick={() => setActiveModal('body-comp')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>Body Comp</span>
            <Percent className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          </div>
          <div className="my-1.5 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bodyComp.bodyFatPct > 0 ? `${bodyComp.bodyFatPct}% Fat` : '0% Fat'}
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug">
              Lean: {bodyComp.leanBodyMassKg}kg · FFMI {bodyComp.ffmi}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>Fat: {bodyComp.fatMassKg}kg</span>
            <span className="text-violet-400 font-bold">Details →</span>
          </div>
        </div>

        {/* WIDGET 4: BMR & TDEE Metabolism */}
        <div
          onClick={() => setActiveModal('bmr-tdee')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>TDEE Burn</span>
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="my-1.5 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black font-mono text-inherit tabular-nums leading-tight">
              {tdee} kcal
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-snug capitalize">
              {hasLoggedWeight && hasLoggedHeight
                ? `BMR ${bmrData.mifflinStJeor} kcal · ${profile.activityLevel.replace('_', ' ')} activity`
                : 'Log weight & height'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>HB: {bmrData.harrisBenedict} kcal</span>
            <span className="text-amber-400 font-bold">Formulas →</span>
          </div>
        </div>

        {/* WIDGET 5: Macro Targets & Nutrition Split */}
        <div
          onClick={() => setActiveModal('macros')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Macro Split</span>
            <Target className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </div>

          {/* 3-way Goal Selector Pill */}
          <div
            className="pill settings-item my-1.5 w-full grid grid-cols-3 gap-1 p-1 rounded-lg overflow-hidden"
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
                  className={`w-full text-[9px] font-bold py-1.5 px-0.5 text-center rounded-md transition-all select-none cursor-pointer leading-tight ${
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

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span className="text-rose-400 font-semibold">
              {profile.goal === 'maintenance' ? 'Recomp' : profile.goal === 'lean_bulk' ? 'Lean Gain' : profile.goal === 'moderate_cut' ? 'Fat Loss' : 'Custom'}
            </span>
            <span className="text-rose-400 font-bold shrink-0">Macros →</span>
          </div>
        </div>

        {/* WIDGET 6: BPL Athletic Level & Performance Radar */}
        <div
          onClick={() => setActiveModal('bpl-radar')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>BPL Radar</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="my-1.5 space-y-1">
            <div className="text-xl sm:text-2xl font-black font-mono text-inherit tabular-nums leading-tight">
              {bplData.score}/100 BPL
            </div>
            <div>
              <span className="pill text-[10px] font-bold text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full inline-block">
                {bplData.tier} Tier
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>Strength {strengthRatio}x</span>
            <span className="text-cyan-400 font-bold">Full Radar →</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS (FULL DETAILED BREAKDOWNS & CONTROLS) */}

      {/* MODAL 1: SCALE & BIO PROFILE CONTROLS */}
      {activeModal === 'scale' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-base font-black font-mono"
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
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-base font-black font-mono"
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
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Biological Sex</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => onUpdateProfile({ ...profile, gender: e.target.value as Gender })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
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
              className="w-full py-2.5 rounded-xl text-black font-black text-xs shadow-md"
              style={{ backgroundColor: 'var(--accent-hex)' }}
            >
              Save & Recalculate
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: BMI SPECTRUM & GAUGE */}
      {activeModal === 'bmi' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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
                  <span className="text-2xl font-black font-mono text-white">{tdee} kcal/day</span>
                </div>
                <div className="text-right">
                  <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Activity Factor</label>
                  <select
                    value={profile.activityLevel}
                    onChange={(e) => onUpdateProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
                    className="bg-slate-950 border border-white/15 text-white text-xs rounded-lg px-2 py-1 outline-none font-semibold cursor-pointer"
                  >
                    <option value="sedentary">Sedentary (1.2x)</option>
                    <option value="light">Light Active (1.375x)</option>
                    <option value="moderate">Moderate Gym (1.55x)</option>
                    <option value="very_active">Very Active (1.725x)</option>
                    <option value="extra_active">Extra Active (1.9x)</option>
                  </select>
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
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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
              <span className="text-xs text-rose-300 font-bold block">Daily Calorie Target ({nutrition.goalLabel})</span>
              <span className="text-2xl font-black font-mono text-white mt-0.5 block">
                {totalCaloriesConsumed} / Target {nutrition.targetCalories} kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xs text-cyan-300 font-bold block">Protein</span>
                <span className="text-lg font-black font-mono text-white mt-1 block">{totalProteinConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.proteinGrams}g</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-300 font-bold block">Carbohydrates</span>
                <span className="text-lg font-black font-mono text-white mt-1 block">{totalCarbsConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.carbsGrams}g</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xs text-rose-300 font-bold block">Fats</span>
                <span className="text-lg font-black font-mono text-white mt-1 block">{totalFatsConsumed}g</span>
                <span className="text-[11px] text-slate-400 font-mono block">Target {nutrition.fatsGrams}g</span>
              </div>
            </div>

            {/* Dynamic 3-Way Goal Selector Pill */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">Goal Selector (Real-Time Macro Calculator)</label>
                <span className="text-[10px] font-mono text-slate-400">{currentWeightKg}kg · {currentHeightCm}cm</span>
              </div>
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
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-md font-black ring-2 ring-rose-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs font-bold">{g.label}</span>
                      <span className={`text-[10px] font-mono mt-0.5 font-bold ${isSelected ? 'text-white' : 'text-rose-300'}`}>{g.cals}</span>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>{g.protein}</span>
                      <span className={`text-[8px] mt-0.5 ${isSelected ? 'text-rose-100 font-normal' : 'text-slate-500'}`}>{g.desc}</span>
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
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                >
                  <option value="maintenance">Maintain / Recomp</option>
                  <option value="lean_bulk">Lean Mass Bulk (+10%)</option>
                  <option value="moderate_cut">Lean Fat Loss (-18%)</option>
                  <option value="aggressive_cut">Aggressive Fat Cut (-25%)</option>
                  <option value="heavy_bulk">Power & Mass Bulk (+20%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Macro Split Distribution</label>
                <select
                  value={profile.macroSplit}
                  onChange={(e) => onUpdateProfile({ ...profile, macroSplit: e.target.value as MacroSplit })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                >
                  <option value="high_protein">High Protein (35% P / 45% C / 20% F)</option>
                  <option value="balanced">Balanced (30% P / 40% C / 30% F)</option>
                  <option value="low_carb">Low Carb (35% P / 25% C / 40% F)</option>
                  <option value="keto">Keto (25% P / 5% C / 70% F)</option>
                </select>
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

      {/* MODAL 6: BPL RADAR */}
      {activeModal === 'bpl-radar' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-1">
              <span className="text-4xl font-black font-mono text-white">{bplData.score} / 100</span>
              <span className="text-sm font-bold text-cyan-300 block">{bplData.tier} Athletic Tier</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">Relative Strength Power</span>
                <span className="text-white font-bold">{strengthRatio}x BW</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">Weekly Step Volume</span>
                <span className="text-white font-bold">{weeklyStepsAvg} steps/day</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">Weekly Cardio Stamina</span>
                <span className="text-white font-bold">{weeklyCardioMinutes} mins</span>
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
    </div>
  );
};
