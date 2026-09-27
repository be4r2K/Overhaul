import React, { useState } from 'react';
import { 
  Utensils, 
  Flame, 
  Droplet, 
  Plus, 
  Trash2, 
  Apple, 
  TrendingUp, 
  Check, 
  Clock,
  PieChart
} from 'lucide-react';
import { DailyNutritionLog, MealItem, UserProfile } from '../types/fitness';
import { calculateAge, calculateBMR, calculateNutritionTargets, calculateTDEE } from '../utils/calculations';

interface NutritionViewProps {
  profile: UserProfile;
  nutritionLog: DailyNutritionLog;
  totalCaloriesBurnedToday: number;
  onAddMeal: (meal: Omit<MealItem, 'id' | 'time'>) => void;
  onDeleteMeal: (mealId: string) => void;
  onUpdateWater: (amountMl: number) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  nutritionLog,
  totalCaloriesBurnedToday,
  onAddMeal,
  onDeleteMeal,
  onUpdateWater,
}) => {
  const ageData = calculateAge(profile.birthDate);
  const bmrData = calculateBMR(profile.weightKg, profile.heightCm, ageData.years, profile.gender);
  const tdee = calculateTDEE(bmrData.mifflinStJeor, profile.activityLevel);
  const targets = calculateNutritionTargets(tdee, profile.weightKg, profile.goal, profile.macroSplit);

  // Form states
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [calories, setCalories] = useState<number>(450);
  const [proteinG, setProteinG] = useState<number>(35);
  const [carbsG, setCarbsG] = useState<number>(40);
  const [fatsG, setFatsG] = useState<number>(14);

  // Calculations for today's intake
  const totalCaloriesConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.proteinG, 0);
  const totalCarbsConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.carbsG, 0);
  const totalFatsConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.fatsG, 0);

  // Calorie balance: Target - Consumed + Burned = Remaining Allowance
  const remainingCalories = targets.targetCalories - totalCaloriesConsumed + totalCaloriesBurnedToday;
  const calPercent = Math.min(100, Math.round((totalCaloriesConsumed / targets.targetCalories) * 100));

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || calories <= 0) return;

    onAddMeal({
      name: mealName.trim(),
      mealType,
      calories,
      proteinG,
      carbsG,
      fatsG,
    });

    setMealName('');
  };

  const handleQuickAddWater = (ml: number) => {
    onUpdateWater(nutritionLog.waterConsumedMl + ml);
  };

  const waterPct = Math.min(100, Math.round((nutritionLog.waterConsumedMl / targets.recommendedWaterMl) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Daily Nutrition & Calorie Tracking
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Daily Target: <strong className="text-emerald-400 font-mono tabular-nums">{targets.targetCalories} kcal</strong></span>
            <span aria-hidden="true">·</span>
            <span>Consumed: <strong className="text-white font-mono tabular-nums">{totalCaloriesConsumed} kcal</strong></span>
            <span aria-hidden="true">·</span>
            <span>Active Burn: <strong className="text-rose-400 font-mono tabular-nums">{totalCaloriesBurnedToday} kcal</strong></span>
            <span aria-hidden="true">·</span>
            <span>Remaining: <strong className={remainingCalories >= 0 ? 'text-cyan-400 font-mono tabular-nums' : 'text-rose-400 font-mono tabular-nums'}>{remainingCalories} kcal</strong></span>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 self-start sm:self-auto">
          Strategy: <strong className="text-emerald-400">{targets.goalLabel}</strong>
        </div>
      </div>

      {/* Main Calorie & Macronutrient Budget Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calorie Ring & Balance Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Today's Calorie Balance</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">{calPercent}% Eaten</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-4xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {totalCaloriesConsumed}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                of <span className="font-mono text-slate-300 font-bold">{targets.targetCalories} kcal</span> target
              </div>
            </div>

            <div className="text-right">
              <div className={`text-2xl font-bold font-mono tabular-nums ${remainingCalories >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {remainingCalories >= 0 ? `+${remainingCalories}` : remainingCalories}
              </div>
              <div className="text-[11px] text-slate-400">
                Net remaining kcal
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalCaloriesConsumed > targets.targetCalories ? 'bg-amber-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, calPercent)}%` }}
            />
          </div>

          {/* Calorie equation breakdown */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Daily Target</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">{targets.targetCalories}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Food Consumed</div>
              <div className="font-mono font-bold text-amber-400 mt-0.5">-{totalCaloriesConsumed}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Sports & Steps</div>
              <div className="font-mono font-bold text-rose-400 mt-0.5">+{totalCaloriesBurnedToday}</div>
            </div>
          </div>

          {/* Hydration Widget */}
          <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Droplet className="w-4 h-4 fill-cyan-400/20" />
                <span>Water Hydration</span>
              </div>
              <span className="font-mono text-slate-300 font-semibold tabular-nums">
                {nutritionLog.waterConsumedMl} / {targets.recommendedWaterMl} ml ({waterPct}%)
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, waterPct)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAddWater(250)}
                className="flex-1 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                +250 ml (Glass)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(500)}
                className="flex-1 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                +500 ml (Bottle)
              </button>
              <button
                type="button"
                onClick={() => onUpdateWater(0)}
                className="px-2 py-1.5 text-xs font-mono rounded-lg bg-slate-900 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Reset water"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Macronutrient Tracking Grid (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Daily Macronutrient Targets</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-calculated for your weight & goals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">Protein</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {Math.round((totalProteinConsumed / targets.proteinGrams) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {totalProteinConsumed} <span className="text-xs text-slate-500 font-normal">/ {targets.proteinGrams}g</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (totalProteinConsumed / targets.proteinGrams) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                {(totalProteinConsumed / profile.weightKg).toFixed(1)}g / kg bodyweight
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">Carbohydrates</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {Math.round((totalCarbsConsumed / targets.carbsGrams) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {totalCarbsConsumed} <span className="text-xs text-slate-500 font-normal">/ {targets.carbsGrams}g</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (totalCarbsConsumed / targets.carbsGrams) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Fuel for workout performance
              </div>
            </div>

            {/* Fats */}
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">Dietary Fats</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {Math.round((totalFatsConsumed / targets.fatsGrams) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {totalFatsConsumed} <span className="text-xs text-slate-500 font-normal">/ {targets.fatsGrams}g</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (totalFatsConsumed / targets.fatsGrams) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Hormonal & cellular health
              </div>
            </div>
          </div>

          {/* Quick macro tip */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Nutrition Rule:</strong> For muscle retention and progressive overload, keep protein near 2.0g/kg ({Math.round(profile.weightKg * 2.0)}g target). Your current goal ({targets.goalLabel}) requires {targets.targetCalories} kcal.
          </div>
        </div>
      </div>

      {/* Main Grid: Meal Logger & Meal History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Log Meal Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Log Meal or Snack</h2>

              {/* Meal Type Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/60">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMealType(t)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      mealType === t ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Meal Description</label>
                <input
                  type="text"
                  placeholder="e.g. Steak, baked sweet potato & broccoli"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              {/* Calories and Protein */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Calories (kcal)</label>
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={calories}
                    onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Protein (grams)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={proteinG}
                    onChange={(e) => setProteinG(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {/* Carbs and Fats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Carbs (grams)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={carbsG}
                    onChange={(e) => setCarbsG(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fats (grams)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={fatsG}
                    onChange={(e) => setFatsG(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Meal to Daily Fuel</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Meal Log Entries (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Today's Meals & Snacks</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {nutritionLog.meals.length} entries · {totalCaloriesConsumed} kcal
            </span>
          </div>

          {nutritionLog.meals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No meals logged today yet. Add your breakfast, lunch, or post-workout fuel!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {nutritionLog.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{meal.name}</span>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {meal.mealType}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">{meal.time}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-bold text-white tabular-nums">
                        {meal.calories} kcal
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-emerald-300 tabular-nums">
                        {meal.proteinG}g P
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-cyan-300 tabular-nums">
                        {meal.carbsG}g C
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-300 tabular-nums">
                        {meal.fatsG}g F
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Delete meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
