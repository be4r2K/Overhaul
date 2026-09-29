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
  PieChart,
  X,
  Target
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
  language?: string;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  nutritionLog,
  totalCaloriesBurnedToday,
  onAddMeal,
  onDeleteMeal,
  onUpdateWater,
  language = 'en',
}) => {
  const ageData = calculateAge(profile.birthDate);
  const bmrData = calculateBMR(profile.weightKg, profile.heightCm, ageData.years, profile.gender);
  const tdee = calculateTDEE(bmrData.mifflinStJeor, profile.activityLevel);
  const targets = calculateNutritionTargets(tdee, profile.weightKg, profile.goal, profile.macroSplit);

  const [activeModal, setActiveModal] = useState<'log-meal' | 'meals-list' | 'macros' | 'water' | null>(null);

  // Form states
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [calories, setCalories] = useState<number>(0);
  const [proteinG, setProteinG] = useState<number>(0);
  const [carbsG, setCarbsG] = useState<number>(0);
  const [fatsG, setFatsG] = useState<number>(0);

  // Calculations for today's intake
  const totalCaloriesConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.proteinG, 0);
  const totalCarbsConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.carbsG, 0);
  const totalFatsConsumed = nutritionLog.meals.reduce((sum, m) => sum + m.fatsG, 0);

  // Calorie balance
  const remainingCalories = targets.targetCalories - totalCaloriesConsumed + totalCaloriesBurnedToday;
  const calPercent = targets.targetCalories > 0 ? Math.min(100, Math.round((totalCaloriesConsumed / targets.targetCalories) * 100)) : 0;
  const waterPct = targets.recommendedWaterMl > 0 ? Math.min(100, Math.round((nutritionLog.waterConsumedMl / targets.recommendedWaterMl) * 100)) : 0;

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
    setActiveModal(null);
  };

  const handleQuickAddWater = (ml: number) => {
    onUpdateWater(nutritionLog.waterConsumedMl + ml);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 max-w-7xl mx-auto w-full gap-2 select-none">
      {/* 1. TOP HEADER & METADATA BAR (Compact) */}
      <div className="ig-glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight">Nutrition & Fuel Engine</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-400/20 text-rose-300 font-bold border border-rose-400/30 uppercase">
                {targets.targetCalories} kcal Target
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Eaten {totalCaloriesConsumed}k · Burn +{totalCaloriesBurnedToday}k · Remaining {remainingCalories} kcal ({targets.goalLabel})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveModal('log-meal')}
            className="px-3 py-1.5 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            style={{ backgroundColor: 'var(--accent-hex)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 6-WIDGET ZERO-SCROLL BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 min-h-0 overflow-hidden">
        {/* WIDGET 1: Calorie Balance & Remaining */}
        <div
          onClick={() => setActiveModal('log-meal')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Calorie Budget</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalCaloriesConsumed} <span className="text-xs text-slate-400 font-normal">kcal</span>
            </div>
            <div className={`text-[11px] font-mono font-bold mt-0.5 truncate ${remainingCalories >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {remainingCalories >= 0 ? `+${remainingCalories} left` : `${remainingCalories} over`}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>{calPercent}% of target</span>
            <span className="text-rose-400 font-bold">Log Food →</span>
          </div>
        </div>

        {/* WIDGET 2: Protein Target & Consumed */}
        <div
          onClick={() => setActiveModal('macros')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Protein</span>
            <Apple className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalProteinConsumed}g <span className="text-xs text-slate-400 font-normal">/ {targets.proteinGrams}g</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 mt-0.5 truncate">
              {Math.max(0, targets.proteinGrams - totalProteinConsumed)}g remaining
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Muscle Repair</span>
            <span className="text-cyan-400 font-bold">Macros →</span>
          </div>
        </div>

        {/* WIDGET 3: Carbs & Energy Intake */}
        <div
          onClick={() => setActiveModal('macros')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Carbs</span>
            <PieChart className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalCarbsConsumed}g <span className="text-xs text-slate-400 font-normal">/ {targets.carbsGrams}g</span>
            </div>
            <div className="text-[11px] font-mono text-amber-300 mt-0.5 truncate">
              {Math.max(0, targets.carbsGrams - totalCarbsConsumed)}g remaining
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Glycogen Fuel</span>
            <span className="text-amber-400 font-bold">Details →</span>
          </div>
        </div>

        {/* WIDGET 4: Healthy Fats & Hormonal Balance */}
        <div
          onClick={() => setActiveModal('macros')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>Fats</span>
            <Utensils className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalFatsConsumed}g <span className="text-xs text-slate-400 font-normal">/ {targets.fatsGrams}g</span>
            </div>
            <div className="text-[11px] font-mono text-violet-300 mt-0.5 truncate">
              {Math.max(0, targets.fatsGrams - totalFatsConsumed)}g remaining
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Hormone Health</span>
            <span className="text-violet-400 font-bold">Details →</span>
          </div>
        </div>

        {/* WIDGET 5: Hydration & Water Intake */}
        <div
          onClick={() => setActiveModal('water')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-sky-400 font-bold uppercase">
            <span>Hydration</span>
            <Droplet className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {nutritionLog.waterConsumedMl} <span className="text-xs text-slate-400 font-normal">ml</span>
            </div>
            <div className="text-[11px] font-mono text-sky-300 mt-0.5 truncate">
              Target: {targets.recommendedWaterMl} ml ({waterPct}%)
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>+250ml quick</span>
            <span className="text-sky-400 font-bold">Log Water →</span>
          </div>
        </div>

        {/* WIDGET 6: Logged Meals History */}
        <div
          onClick={() => setActiveModal('meals-list')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Meals Logged</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {nutritionLog.meals.length} <span className="text-xs text-slate-400 font-normal">Meals</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {nutritionLog.meals.length > 0 ? nutritionLog.meals[0].name : 'No meals logged'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Review Food</span>
            <span className="text-emerald-400 font-bold">View List →</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS */}

      {/* MODAL 1: LOG MEAL FORM */}
      {activeModal === 'log-meal' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Log Meal & Nutrients</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Meal / Food Description</label>
                <input
                  type="text"
                  placeholder="e.g., Grilled Chicken Breast & Brown Rice"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={proteinG}
                    onChange={(e) => setProteinG(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={carbsG}
                    onChange={(e) => setCarbsG(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-300 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={fatsG}
                    onChange={(e) => setFatsG(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-black font-black text-xs shadow-md mt-2"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                Save Meal Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MEALS LIST & DELETION */}
      {activeModal === 'meals-list' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Today's Food Diary ({nutritionLog.meals.length})</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {nutritionLog.meals.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No meals logged today yet.</div>
              ) : (
                nutritionLog.meals.map((meal) => (
                  <div key={meal.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">{meal.name}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {meal.calories} kcal · P: {meal.proteinG}g · C: {meal.carbsG}g · F: {meal.fatsG}g ({meal.time})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMeal(meal.id)}
                      className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: WATER LOGGING */}
      {activeModal === 'water' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Daily Hydration Log</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
              <span className="text-3xl font-black font-mono text-white">{nutritionLog.waterConsumedMl} ml</span>
              <span className="text-xs text-sky-300 block">Target: {targets.recommendedWaterMl} ml ({waterPct}%)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAddWater(250)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +250 ml (Glass)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(500)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +500 ml (Bottle)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddWater(1000)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +1.0 L (Jug)
              </button>
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

      {/* MODAL 4: MACROS BREAKDOWN */}
      {activeModal === 'macros' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Macronutrient Target Breakdown</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xs text-cyan-300 font-bold block">Protein Target</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">{targets.proteinGrams}g</span>
                <span className="text-[10px] text-slate-400 font-mono">Eaten: {totalProteinConsumed}g</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-300 font-bold block">Carbs Target</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">{targets.carbsGrams}g</span>
                <span className="text-[10px] text-slate-400 font-mono">Eaten: {totalCarbsConsumed}g</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xs text-rose-300 font-bold block">Fats Target</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">{targets.fatsGrams}g</span>
                <span className="text-[10px] text-slate-400 font-mono">Eaten: {totalFatsConsumed}g</span>
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
