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
  ShieldCheck
} from 'lucide-react';
import { ActivityLevel, FitnessGoal, Gender, MacroSplit, UserProfile } from '../types/fitness';
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

interface BiometricsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  benchPR1RM: number;
  squatPR1RM: number;
  deadliftPR1RM: number;
  weeklyStepsAvg: number;
  weeklyCardioMinutes: number;
}

export const BiometricsView: React.FC<BiometricsViewProps> = ({
  profile,
  onUpdateProfile,
  benchPR1RM,
  squatPR1RM,
  deadliftPR1RM,
  weeklyStepsAvg,
  weeklyCardioMinutes,
}) => {
  // Dual unit local state for fluid typing
  const isMetric = profile.units === 'metric';

  // Local state for smooth fluid typing of weight and height
  const [localWeightStr, setLocalWeightStr] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [localHeightStr, setLocalHeightStr] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );

  // Sync if profile changes externally
  React.useEffect(() => {
    if (profile.weightKg > 0) {
      setLocalWeightStr(isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString());
    }
  }, [profile.weightKg, isMetric]);

  React.useEffect(() => {
    if (profile.heightCm > 0) {
      setLocalHeightStr(profile.heightCm.toString());
    }
  }, [profile.heightCm]);

  // Calculations
  const ageData = calculateAge(profile.birthDate);
  const bmiData = calculateBMI(profile.weightKg, profile.heightCm);
  const bmrData = calculateBMR(profile.weightKg, profile.heightCm, ageData.years, profile.gender);
  const tdee = calculateTDEE(bmrData.mifflinStJeor, profile.activityLevel);
  const nutrition = calculateNutritionTargets(tdee, profile.weightKg, profile.goal, profile.macroSplit);
  const bodyComp = calculateBodyComposition(profile.weightKg, profile.heightCm, ageData.years, profile.gender);

  // Big 3 Total Strength Ratio
  const totalLiftsKg = benchPR1RM + squatPR1RM + deadliftPR1RM;
  const strengthRatio = profile.weightKg > 0 ? Number((totalLiftsKg / profile.weightKg).toFixed(2)) : 0;

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
    <div className="space-y-6 pb-12">
      {/* Header section with clean unboxed metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Health & Biometrics Intelligence
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Age: <strong className="text-slate-200">{ageData.displayText}</strong></span>
            <span aria-hidden="true">·</span>
            <span>BMI: <strong className="text-slate-200">{bmiData.bmi} ({bmiData.category})</strong></span>
            <span aria-hidden="true">·</span>
            <span>BPL Score: <strong className={bplData.color}>{bplData.score}/100</strong></span>
            <span aria-hidden="true">·</span>
            <span>Daily Target: <strong className="text-emerald-400 tabular-nums">{nutrition.targetCalories} kcal</strong></span>
          </div>
        </div>

        {/* Quick Goal Tag */}
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Goal: <strong className="text-white">{nutrition.goalLabel}</strong></span>
        </div>
      </div>

      {/* Main Grid: Biometric Input Form & Instant Live Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Your Biometrics Profile</h2>
              </div>
              <span className="text-[11px] text-slate-400">Auto-saved</span>
            </div>

            {/* First Name & Family Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Family / Last Name</label>
                <input
                  type="text"
                  value={profile.familyName || ''}
                  onChange={(e) => onUpdateProfile({ ...profile, familyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                  placeholder="Family name"
                />
              </div>
            </div>

            {/* Location City */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">City / Location (for Weather)</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => onUpdateProfile({ ...profile, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                placeholder="e.g. London, San Francisco, Paris"
              />
            </div>

            {/* Date of Birth (Age Auto-Calculation) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Date of Birth</label>
                <span className="text-xs font-semibold text-emerald-400">Age: {ageData.displayText}</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => onUpdateProfile({ ...profile, birthDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total days lived: <span className="tabular-nums font-mono text-slate-300">{ageData.totalDays.toLocaleString()}</span> days
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Biological Sex (for BMR & BPL)</label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onUpdateProfile({ ...profile, gender: g })}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer capitalize ${
                      profile.gender === g
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight and Height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Weight */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Weight ({isMetric ? 'kg' : 'lbs'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75"
                    value={localWeightStr}
                    onChange={(e) => handleWeightTyping(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-white/40 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 uppercase font-mono">
                    {isMetric ? 'kg' : 'lbs'}
                  </span>
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Height ({isMetric ? 'cm' : 'ft / in'})
                </label>
                {isMetric ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="e.g. 180"
                      value={localHeightStr}
                      onChange={(e) => handleHeightTyping(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-white/40 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 uppercase font-mono">
                      cm
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      min="3"
                      max="7"
                      placeholder="ft"
                      value={heightFtIn.feet}
                      onChange={(e) => handleFtInChange(parseInt(e.target.value) || 5, heightFtIn.inches)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs font-mono text-center text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      max="11"
                      placeholder="in"
                      value={heightFtIn.inches}
                      onChange={(e) => handleFtInChange(heightFtIn.feet, parseInt(e.target.value) || 0)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs font-mono text-center text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Activity Factor (TDEE)</label>
              <select
                value={profile.activityLevel}
                onChange={(e) => onUpdateProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="sedentary">Sedentary (Little/no exercise, desk job)</option>
                <option value="light">Lightly Active (1-3 gym workouts / 5k-7.5k steps)</option>
                <option value="moderate">Moderately Active (3-5 workouts / 8k-10k steps)</option>
                <option value="very_active">Very Active (6-7 intense sessions / 12k steps)</option>
                <option value="extra_active">Extra Active (Athlete, 2x day training / manual job)</option>
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nutritional & Body Goal</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'aggressive_cut', label: 'Heavy Cut (-25%)' },
                  { id: 'moderate_cut', label: 'Lean Cut (-18%)' },
                  { id: 'maintenance', label: 'Maintenance (0%)' },
                  { id: 'lean_bulk', label: 'Lean Bulk (+10%)' },
                  { id: 'heavy_bulk', label: 'Power Bulk (+20%)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onUpdateProfile({ ...profile, goal: g.id as FitnessGoal })}
                    className={`py-2 px-2 text-[11px] font-semibold rounded-xl border text-center transition-all cursor-pointer whitespace-nowrap ${
                      profile.goal === g.id
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Macro Preference */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Macro Distribution</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'high_protein', label: 'High Protein (35P / 45C / 20F)' },
                  { id: 'balanced', label: 'Balanced (30P / 40C / 30F)' },
                  { id: 'low_carb', label: 'Low Carb (35P / 25C / 40F)' },
                  { id: 'keto', label: 'Keto (25P / 5C / 70F)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateProfile({ ...profile, macroSplit: m.id as MacroSplit })}
                    className={`py-2 px-2 text-[11px] font-medium rounded-xl border text-left transition-all cursor-pointer ${
                      profile.macroSplit === m.id
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Health & Sports Intelligence Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Calorie Intelligence Card (Primary answer to "How many calories I need to eat?") */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                <h2 className="text-base font-bold text-white">Daily Calorie & Metabolic Engine</h2>
              </div>
              <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {nutrition.goalLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {/* Daily Target */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                <div className="text-[11px] font-medium text-slate-400 mb-0.5">Recommended Intake</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {nutrition.targetCalories}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {nutrition.deficitOrSurplus === 0
                    ? '100% Maintenance'
                    : nutrition.deficitOrSurplus > 0
                    ? `+${nutrition.deficitOrSurplus} kcal surplus`
                    : `${nutrition.deficitOrSurplus} kcal deficit`}
                </div>
              </div>

              {/* Maintenance TDEE */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                <div className="text-[11px] font-medium text-slate-400 mb-0.5">Maintenance (TDEE)</div>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {tdee} <span className="text-xs text-slate-500 font-normal">kcal/day</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Based on {profile.activityLevel.replace('_', ' ')} factor
                </div>
              </div>

              {/* Basal Metabolic Rate (BMR) */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                <div className="text-[11px] font-medium text-slate-400 mb-0.5">Basal Metabolic (BMR)</div>
                <div className="text-2xl font-bold font-mono text-slate-200 tabular-nums">
                  {bmrData.mifflinStJeor} <span className="text-xs text-slate-500 font-normal">kcal</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Mifflin-St Jeor (HB: {bmrData.harrisBenedict})
                </div>
              </div>
            </div>

            {/* Macronutrient Distribution Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Daily Macronutrient Targets</span>
                <span className="font-mono text-slate-400">{nutrition.targetCalories} Total kcal</span>
              </div>

              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${nutrition.proteinPct}%` }}
                  className="bg-emerald-400 h-full"
                  title={`Protein: ${nutrition.proteinPct}%`}
                />
                <div
                  style={{ width: `${nutrition.carbsPct}%` }}
                  className="bg-cyan-400 h-full"
                  title={`Carbs: ${nutrition.carbsPct}%`}
                />
                <div
                  style={{ width: `${nutrition.fatsPct}%` }}
                  className="bg-amber-400 h-full"
                  title={`Fats: ${nutrition.fatsPct}%`}
                />
              </div>

              {/* Macro Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">Protein</span>
                    <span className="text-slate-500">{nutrition.proteinPct}%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                    {nutrition.proteinGrams}g
                  </div>
                  <div className="text-[10px] text-slate-400">{nutrition.proteinKcal} kcal · {(nutrition.proteinGrams / profile.weightKg).toFixed(1)}g/kg</div>
                </div>

                <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">Carbs</span>
                    <span className="text-slate-500">{nutrition.carbsPct}%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                    {nutrition.carbsGrams}g
                  </div>
                  <div className="text-[10px] text-slate-400">{nutrition.carbsKcal} kcal</div>
                </div>

                <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-bold">Fats</span>
                    <span className="text-slate-500">{nutrition.fatsPct}%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                    {nutrition.fatsGrams}g
                  </div>
                  <div className="text-[10px] text-slate-400">{nutrition.fatsKcal} kcal · Essential lipids</div>
                </div>
              </div>

              {/* Water intake advice */}
              <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Droplet className="w-4 h-4 fill-cyan-400/30 text-cyan-400" />
                  <span>Target Daily Water Intake</span>
                </div>
                <span className="font-mono font-bold text-white tabular-nums">
                  {nutrition.recommendedWaterMl.toLocaleString()} ml <span className="text-slate-500 font-normal">({(nutrition.recommendedWaterMl / 250).toFixed(0)} glasses)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dual Row: BMI Card and BPL Score Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* BMI Analysis Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">BMI Index</h3>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${bmiData.badgeBg}`}>
                  {bmiData.category}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                  {bmiData.bmi}
                </span>
                <span className="text-xs text-slate-400">kg/m²</span>
              </div>

              {/* BMI Progress scale visual */}
              <div className="relative pt-2">
                <div className="h-2 w-full rounded-full bg-slate-950 flex overflow-hidden">
                  <div className="w-[18.5%] bg-amber-400/80" title="Underweight <18.5" />
                  <div className="w-[25%] bg-emerald-400" title="Normal 18.5-24.9" />
                  <div className="w-[20%] bg-amber-400" title="Overweight 25-29.9" />
                  <div className="w-[36.5%] bg-rose-500" title="Obese 30+" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>18.5</span>
                  <span>24.9</span>
                  <span>29.9</span>
                  <span>35+</span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Healthy weight range:</span>
                  <span className="text-slate-200 font-mono font-medium">
                    {isMetric
                      ? `${bmiData.healthyWeightMinKg} - ${bmiData.healthyWeightMaxKg} kg`
                      : `${units.kgToLbs(bmiData.healthyWeightMinKg)} - ${units.kgToLbs(bmiData.healthyWeightMaxKg)} lbs`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {bmiData.percentileText}
                </div>
              </div>
            </div>

            {/* BPL (Body Performance Level) Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">BPL Performance Level</h3>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 ${bplData.color}`}>
                  {bplData.tier} Tier
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono tabular-nums ${bplData.color}`}>
                  {bplData.score}
                </span>
                <span className="text-xs text-slate-400">/ 100 Overall Score</span>
              </div>

              {/* Sub components */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Strength Power (1RM / BW)</span>
                  <span className="text-slate-200 font-mono font-semibold">{bplData.strengthScore} / 35</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(bplData.strengthScore / 35) * 100}%` }}
                    className="bg-emerald-400 h-full rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Cardio & Steps Stamina</span>
                  <span className="text-slate-200 font-mono font-semibold">{bplData.cardioScore} / 35</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(bplData.cardioScore / 35) * 100}%` }}
                    className="bg-cyan-400 h-full rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Body Composition Index</span>
                  <span className="text-slate-200 font-mono font-semibold">{bplData.compositionScore} / 30</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(bplData.compositionScore / 30) * 100}%` }}
                    className="bg-amber-400 h-full rounded-full"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 leading-relaxed">
                {bplData.summary}
              </div>
            </div>
          </div>

          {/* Deep Body Composition & Natural Muscularity (FFMI) Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Body Composition & Muscularity (FFMI)</h3>
              </div>
              <span className="text-xs text-slate-400">{bodyComp.ffmiCategory}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 border border-slate-800/70 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Est. Body Fat</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {bodyComp.bodyFatPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{bodyComp.category}</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Lean Mass (LBM)</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {isMetric ? `${bodyComp.leanBodyMassKg} kg` : `${units.kgToLbs(bodyComp.leanBodyMassKg)} lbs`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Muscle & organ weight</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Fat Mass</div>
                <div className="text-xl font-bold font-mono text-slate-300 mt-0.5 tabular-nums">
                  {isMetric ? `${bodyComp.fatMassKg} kg` : `${units.kgToLbs(bodyComp.fatMassKg)} lbs`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Stored adiposity</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/70 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Norm. FFMI</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5 tabular-nums">
                  {bodyComp.ffmi}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Muscular Index</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
              <strong className="text-slate-300">Fat-Free Mass Index (FFMI) Insight:</strong> An FFMI of {bodyComp.ffmi} represents {bodyComp.ffmiCategory.toLowerCase()}. Natural lifters typically max out around 24.5-25.0 FFMI. Combined with your age ({ageData.displayText}), your metabolic baseline is optimized for {nutrition.goalLabel.toLowerCase()}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
