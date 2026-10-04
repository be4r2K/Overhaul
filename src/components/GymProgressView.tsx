import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dumbbell, 
  Trophy, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sliders, 
  Award, 
  Activity, 
  ArrowRight, 
  Camera, 
  Medal, 
  Crown,
  CheckCircle2,
  Calendar,
  Footprints,
  Moon,
  Flame,
  Droplet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Exercise, ExerciseCategory, LiftRecord, UserProfile, DailyStepLog, SleepLog, DailyNutritionLog, SportActivity } from '../types/fitness';
import { AIWorkoutAnalysisResult, AIBodyVisionData } from '../types/aiWorkout';
import { calculate1RM, units } from '../utils/calculations';
import { playPRFanfare } from '../utils/audio';

interface GymProgressViewProps {
  profile: UserProfile;
  exercises: Exercise[];
  liftRecords: LiftRecord[];
  onAddLift: (lift: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => void;
  onDeleteLift: (id: string) => void;
  onAddCustomExercise: (name: string, category: ExerciseCategory) => void;
  onOpenTimer?: () => void;
  aiWorkoutAnalysis?: AIWorkoutAnalysisResult | null;
  stepsHistory?: DailyStepLog[];
  sleepHistory?: SleepLog[];
  sportsHistory?: SportActivity[];
  nutritionLog?: DailyNutritionLog;
  totalCaloriesBurnedToday?: number;
  onNavigateToTab?: (tab: string) => void;
  language?: string;
  onOpenPhysiqueScanner?: () => void;
}

const DEFAULT_DAY1_EXERCISES = [
  { name: 'Barbell Bench Press', setsReps: '4 sets × 5 reps', targetMuscle: 'Chest / Triceps', defaultWeight: 100, defaultReps: 5, category: 'chest' as ExerciseCategory },
  { name: 'Barbell Rows', setsReps: '4 sets × 6 reps', targetMuscle: 'Upper Back / Lats', defaultWeight: 80, defaultReps: 6, category: 'back' as ExerciseCategory },
  { name: 'Incline DB Press', setsReps: '3 sets × 8-10 reps', targetMuscle: 'Upper Chest', defaultWeight: 34, defaultReps: 8, category: 'chest' as ExerciseCategory },
  { name: 'Weighted Pull-Ups', setsReps: '3 sets × 6-8 reps', targetMuscle: 'Lats & Back', defaultWeight: 20, defaultReps: 6, category: 'back' as ExerciseCategory },
  { name: 'Overhead Barbell Press', setsReps: '3 sets × 6 reps', targetMuscle: 'Shoulders / Delts', defaultWeight: 60, defaultReps: 6, category: 'shoulders' as ExerciseCategory },
  { name: 'Skull Crushers / Pushdowns', setsReps: '3 sets × 10 reps', targetMuscle: 'Triceps', defaultWeight: 35, defaultReps: 10, category: 'arms' as ExerciseCategory },
];

const DEFAULT_DAY2_EXERCISES = [
  { name: 'Ring Dips / Parallel Dips', setsReps: '4 sets × 8-10 reps', targetMuscle: 'Chest / Triceps', defaultWeight: 25, defaultReps: 8, category: 'chest' as ExerciseCategory },
  { name: 'Muscle-Up / Explosive Pulls', setsReps: '3 sets × 5 reps', targetMuscle: 'Full Upper Body', defaultWeight: 0, defaultReps: 5, category: 'back' as ExerciseCategory },
  { name: 'Incline DB Bicep Curls', setsReps: '3 sets × 10-12 reps', targetMuscle: 'Biceps', defaultWeight: 18, defaultReps: 10, category: 'arms' as ExerciseCategory },
  { name: 'Lateral DB Raises', setsReps: '4 sets × 12-15 reps', targetMuscle: 'Lateral Delts', defaultWeight: 14, defaultReps: 12, category: 'shoulders' as ExerciseCategory },
  { name: 'Hanging Leg Raises', setsReps: '3 sets × 12 reps', targetMuscle: 'Core & Abs', defaultWeight: 0, defaultReps: 12, category: 'core' as ExerciseCategory },
  { name: 'Hammer Curls', setsReps: '3 sets × 10 reps', targetMuscle: 'Brachialis / Forearms', defaultWeight: 18, defaultReps: 10, category: 'arms' as ExerciseCategory },
];

export const GymProgressView: React.FC<GymProgressViewProps> = ({
  profile,
  exercises,
  liftRecords,
  onAddLift,
  onDeleteLift,
  onAddCustomExercise,
  stepsHistory = [],
  sleepHistory = [],
  sportsHistory = [],
  nutritionLog,
  totalCaloriesBurnedToday,
  onNavigateToTab,
  onOpenPhysiqueScanner,
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];

  // Simplified Logging form state (Only Weight & Reps - RPE and Date removed from form)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('bench-press');
  const [inputWeight, setInputWeight] = useState<number>(100);
  const [inputReps, setInputReps] = useState<number>(5);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('chest');

  // Collapsible day accordion states: strictly collapsed by default ({ day1: false, day2: false })
  const [expandedDays, setExpandedDays] = useState<{ day1: boolean; day2: boolean }>({ day1: false, day2: false });

  // Inline exercise log state: tracks which exercise is currently expanded for inline logging
  const [inlineLoggingExercise, setInlineLoggingExercise] = useState<string | null>(null);
  const [inlineWeight, setInlineWeight] = useState<number>(100);
  const [inlineReps, setInlineReps] = useState<number>(5);

  // Active modal drawer state matching Tracker cards 1-to-1:
  // 'live-execution' | 'muscle-ratings' | 'daily-highlights' | 'history' | null
  const [activeModal, setActiveModal] = useState<'live-execution' | 'muscle-ratings' | 'daily-highlights' | 'history' | null>(null);

  // Enforce default collapsed state on tab switch / mount
  useEffect(() => {
    setExpandedDays({ day1: false, day2: false });
    setInlineLoggingExercise(null);
    setActiveModal(null);
  }, []);

  // Read physique scan data from localStorage and listen to dynamic cross-app events
  const [bodyVisionData, setBodyVisionData] = useState<AIBodyVisionData | null>(() => {
    try {
      const saved = localStorage.getItem('ai_body_vision_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const checkVisionData = (e?: any) => {
      try {
        if (e && e.detail) {
          setBodyVisionData(e.detail);
          return;
        }
        const saved = localStorage.getItem('ai_body_vision_result');
        if (saved) {
          setBodyVisionData(JSON.parse(saved));
        }
      } catch (err) {}
    };
    window.addEventListener('body_vision_updated', checkVisionData as any);
    window.addEventListener('storage', checkVisionData as any);
    window.addEventListener('focus', checkVisionData as any);
    return () => {
      window.removeEventListener('body_vision_updated', checkVisionData as any);
      window.removeEventListener('storage', checkVisionData as any);
      window.removeEventListener('focus', checkVisionData as any);
    };
  }, []);

  // Convert input weight to KG for calculations
  const weightKg = isMetric ? inputWeight : units.lbsToKg(inputWeight);

  // Real-time 1RM calculations
  const rmBreakdown = calculate1RM(weightKg, inputReps);

  // Selected exercise info
  const currentExercise = exercises.find((e) => e.id === selectedExerciseId) || exercises[0];

  // Group lift records strictly by exercise to compute Personal Records (PRs)
  const exercisePRsMap = new Map<string, { record: LiftRecord; exerciseName: string; max1RM: number; count: number }>();

  liftRecords.forEach((r) => {
    const exName = r.exerciseName || exercises.find((e) => e.id === r.exerciseId)?.name || 'Exercise';
    const existing = exercisePRsMap.get(r.exerciseId);
    if (!existing || r.calculated1RM > existing.max1RM) {
      exercisePRsMap.set(r.exerciseId, {
        record: r,
        exerciseName: exName,
        max1RM: r.calculated1RM,
        count: (existing?.count || 0) + 1,
      });
    } else {
      existing.count += 1;
    }
  });

  const uniquePRs = Array.from(exercisePRsMap.values()).sort((a, b) => b.max1RM - a.max1RM);
  const totalLoggedPRs = uniquePRs.length;

  // Selected exercise current PR
  const currentExercisePR = exercisePRsMap.get(selectedExerciseId)?.max1RM || 0;
  const willBePR = rmBreakdown.average > currentExercisePR;

  // Lifts actively completed TODAY only
  const todayLifts = liftRecords.filter((r) => r.date === todayStr);
  const todayTotalVolumeKg = todayLifts.reduce((acc, l) => acc + (l.weightKg * l.reps), 0);

  // =========================================================================
  // WEEKLY AUTO-RESET LOGIC & PERMANENT DATA PERSISTENCE
  // Active checkmarks calculate strictly from Monday 00:00:00 of the CURRENT week.
  // At midnight every Monday, active checkmarks automatically clear for a fresh cycle.
  // All past session logs, PR maxes, and volume remain permanently in localStorage.
  // =========================================================================
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const distToMonday = (dayOfWeek + 6) % 7;

  const currentWeekMonday = new Date(now);
  currentWeekMonday.setDate(now.getDate() - distToMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);

  const currentWeekSunday = new Date(currentWeekMonday);
  currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);
  currentWeekSunday.setHours(23, 59, 59, 999);

  const currentWeekMondayTime = currentWeekMonday.getTime();
  const currentWeekSundayTime = currentWeekSunday.getTime();

  const weekCycleLabel = `${currentWeekMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${currentWeekSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const isMovementDoneThisWeek = (exerciseName: string) => {
    return liftRecords.some((r) => {
      const match = r.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim() ||
        r.exerciseName.toLowerCase().includes(exerciseName.toLowerCase()) ||
        exerciseName.toLowerCase().includes(r.exerciseName.toLowerCase());
      if (!match) return false;
      const recordTime = new Date(r.date + 'T00:00:00').getTime();
      return recordTime >= currentWeekMondayTime && recordTime <= currentWeekSundayTime;
    });
  };

  const totalCycleExercises = DEFAULT_DAY1_EXERCISES.length + DEFAULT_DAY2_EXERCISES.length;
  const completedCycleExercisesCount = [...DEFAULT_DAY1_EXERCISES, ...DEFAULT_DAY2_EXERCISES].filter(
    (ex) => isMovementDoneThisWeek(ex.name)
  ).length;

  // Telemetry computations for Daily Highlights Modal
  const todayStepLog = stepsHistory.find((s) => s.date === todayStr) || {
    date: todayStr,
    steps: stepsHistory.length > 0 ? stepsHistory[0].steps : 0,
    target: profile.stepGoal || 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  };
  const stepTarget = profile.stepGoal || 10000;
  const stepPercentage = Math.min(100, Math.round((todayStepLog.steps / stepTarget) * 100));

  const latestSleep = sleepHistory.length > 0 ? sleepHistory[0] : null;
  const sleepHours = latestSleep ? (latestSleep.totalMinutes / 60).toFixed(1) : '7.5';
  const sleepScore = latestSleep ? latestSleep.score : 85;

  const todaySportsBurn = sportsHistory.filter((s) => s.date === todayStr).reduce((sum, s) => sum + s.caloriesBurned, 0);
  const activeCaloriesBurned = totalCaloriesBurnedToday ?? (todayStepLog.caloriesBurned + todaySportsBurn + Math.round(todayTotalVolumeKg * 0.05));

  const caloriesConsumed = nutritionLog ? nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0) : 0;
  const proteinConsumedG = nutritionLog ? nutritionLog.meals.reduce((sum, m) => sum + m.proteinG, 0) : 0;
  const waterConsumedL = nutritionLog ? (nutritionLog.waterConsumedMl / 1000).toFixed(1) : '0.0';

  // Handle selecting an exercise to log
  const handleSelectExerciseForLogging = (exerciseName: string, defaultW: number, defaultR: number) => {
    let matched = exercises.find((e) => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim()) ||
      exercises.find((e) => e.name.toLowerCase().includes(exerciseName.toLowerCase()) || exerciseName.toLowerCase().includes(e.name.toLowerCase()));
    
    let targetId = matched?.id;
    if (!matched) {
      targetId = `custom-${Date.now()}`;
      onAddCustomExercise(exerciseName, 'chest');
    }

    if (targetId) {
      setSelectedExerciseId(targetId);
      const prevPR = exercisePRsMap.get(targetId);
      if (prevPR) {
        setInputWeight(isMetric ? prevPR.record.weightKg : Number(units.kgToLbs(prevPR.record.weightKg).toFixed(1)));
        setInputReps(prevPR.record.reps || defaultR);
      } else {
        setInputWeight(isMetric ? defaultW : Number(units.kgToLbs(defaultW).toFixed(1)));
        setInputReps(defaultR);
      }
    }
  };

  // Simplified Save lift handler (Only weight and reps required; auto-assigns todayStr)
  const handleSaveLift = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputWeight <= 0 || inputReps <= 0) return;

    onAddLift({
      exerciseId: selectedExerciseId,
      exerciseName: currentExercise?.name || 'Exercise',
      weightKg: weightKg,
      reps: inputReps,
      rpe: 8.5,
      date: todayStr,
    });

    if (willBePR) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      playPRFanfare();
    } else {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    }
  };

  // Toggle inline logging form directly beneath a specific exercise
  const handleToggleInlineLog = (exName: string, defaultW: number, defaultR: number) => {
    if (inlineLoggingExercise === exName) {
      setInlineLoggingExercise(null);
      return;
    }
    const matched = exercises.find((e) => e.name.toLowerCase().trim() === exName.toLowerCase().trim()) ||
      exercises.find((e) => e.name.toLowerCase().includes(exName.toLowerCase()) || exName.toLowerCase().includes(e.name.toLowerCase()));
    const matchedId = matched?.id;
    const prevRecord = matchedId ? exercisePRsMap.get(matchedId) : null;
    if (prevRecord) {
      setInlineWeight(isMetric ? prevRecord.record.weightKg : Number(units.kgToLbs(prevRecord.record.weightKg).toFixed(1)));
      setInlineReps(prevRecord.record.reps || defaultR);
    } else {
      setInlineWeight(isMetric ? defaultW : Number(units.kgToLbs(defaultW).toFixed(1)));
      setInlineReps(defaultR);
    }
    setInlineLoggingExercise(exName);
  };

  // Save inline set and auto-collapse the inline form
  const handleSaveInlineSet = (e: React.FormEvent, exName: string) => {
    e.preventDefault();
    if (inlineWeight <= 0 || inlineReps <= 0) return;

    let matched = exercises.find((e) => e.name.toLowerCase().trim() === exName.toLowerCase().trim()) ||
      exercises.find((e) => e.name.toLowerCase().includes(exName.toLowerCase()) || exName.toLowerCase().includes(e.name.toLowerCase()));
    
    let targetId = matched?.id;
    if (!matched) {
      targetId = `custom-${Date.now()}`;
      onAddCustomExercise(exName, 'chest');
    }

    const wKg = isMetric ? inlineWeight : units.lbsToKg(inlineWeight);
    const calculated = calculate1RM(wKg, inlineReps);
    const currentPR = targetId ? (exercisePRsMap.get(targetId)?.max1RM || 0) : 0;
    const isNewPR = calculated.average > currentPR;

    onAddLift({
      exerciseId: targetId || 'bench-press',
      exerciseName: exName,
      weightKg: wKg,
      reps: inlineReps,
      rpe: 8.5,
      date: todayStr,
    });

    if (isNewPR) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      playPRFanfare();
    } else {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    }

    // Auto-collapse inline form immediately upon saving
    setInlineLoggingExercise(null);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustomExercise(customName.trim(), customCategory);
    setCustomName('');
    setShowAddCustomModal(false);
  };

  // Top muscle ratings sorted descending for podium
  const muscleRatingsList = bodyVisionData?.muscleRatings && Array.isArray(bodyVisionData.muscleRatings) && bodyVisionData.muscleRatings.length > 0
    ? [...bodyVisionData.muscleRatings].sort((a, b) => b.rating - a.rating)
    : [];

  const top3Podium = muscleRatingsList.slice(0, 3);
  const hasVisionScan = top3Podium.length > 0;

  return (
    <div className="flex-1 min-h-full flex flex-col justify-start overflow-y-auto p-2 sm:p-3 pb-16 max-w-7xl mx-auto w-full gap-2.5 select-none">
      
      {/* 
        MAIN TRACKER BENTO GRID (TOP BANNER REMOVED):
        1RM LIVE ENGINE is promoted to the TOP POSITION.
        Every card corresponds directly to its modal popup:
        1. 1RM LIVE ENGINE -> Active Workout Routine & Execution Drawer
        2. TOP MUSCLE RATINGS -> Muscle Rating Podium Drawer
        3. DAILY HIGHLIGHTS -> Real-Time Daily Telemetry Drawer
        4. PERSONAL RECORDS -> PR Trophy Cabinet
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        
        {/* CARD 1: Refactored to "ACTIVE ROUTINE & EXECUTION" with clean low-detail preview */}
        <div
          onClick={() => setActiveModal('live-execution')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Active Routine & Execution</span>
            </span>
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="my-1.5 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-inherit tracking-tight leading-snug">
                Day 1: Heavy Pressing & Pulling
              </h3>
              <span className="pill text-[9px] font-mono font-bold text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-lg shrink-0">
                Today's Split
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              <span className="pill text-[10px] px-2.5 py-1 rounded-lg text-inherit font-medium leading-none">
                Barbell Bench Press
              </span>
              <span className="pill text-[10px] px-2.5 py-1 rounded-lg text-inherit font-medium leading-none">
                Barbell Rows
              </span>
              <span className="pill text-[10px] px-2.5 py-1 rounded-lg text-inherit font-medium leading-none">
                Incline DB Press
              </span>
              <span className="pill text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold px-2 py-1 rounded-lg leading-none">
                +3 more
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between gap-2">
              <span>Day 2: Calisthenics & Arms ready</span>
              <span className="text-emerald-400 font-bold shrink-0">
                {DEFAULT_DAY1_EXERCISES.filter((ex) => isMovementDoneThisWeek(ex.name)).length}/6 Done
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span className="text-slate-400">2-Day Split Cycle</span>
            <span className="pill px-2 py-0.5 rounded-lg text-amber-600 dark:text-amber-300 font-bold transition-all flex items-center gap-1">
              <span>Open Routine & Log Sets →</span>
            </span>
          </div>
        </div>

        {/* CARD 2: Top Muscle Ratings -> Opens Muscle Rating Podium Drawer or Direct Scanner Modal */}
        <div
          onClick={() => {
            if (hasVisionScan) {
              setActiveModal('muscle-ratings');
            } else if (onOpenPhysiqueScanner) {
              onOpenPhysiqueScanner();
            }
          }}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Top Muscle Ratings</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPhysiqueScanner) onOpenPhysiqueScanner();
              }}
              className="pill p-1 rounded-lg text-cyan-500 dark:text-cyan-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Launch AI Physique Scanner"
              aria-label="Launch AI Physique Scanner"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasVisionScan ? (
            <div className="my-1 flex items-end justify-center gap-1.5 h-20 pt-1">
              {/* Silver #2 */}
              {top3Podium[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-[65px]">
                    {top3Podium[1].muscle.split(' ')[0]}
                  </span>
                  <div className="w-full bg-slate-800/80 border border-slate-400/40 rounded-t-xl h-11 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-slate-300">#2</span>
                    <span className="text-[9px] font-mono font-bold text-slate-200">{top3Podium[1].rating}</span>
                  </div>
                </div>
              )}

              {/* Gold #1 */}
              {top3Podium[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <Crown className="w-3.5 h-3.5 text-amber-400 -mb-0.5 animate-bounce" />
                  <span className="text-[9px] font-bold text-amber-300 truncate max-w-[70px]">
                    {top3Podium[0].muscle.split(' ')[0]}
                  </span>
                  <div className="w-full bg-amber-500/20 border border-amber-400/60 rounded-t-xl h-14 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[11px] font-black text-amber-300">#1</span>
                    <span className="text-[10px] font-mono font-bold text-amber-200">{top3Podium[0].rating}</span>
                  </div>
                </div>
              )}

              {/* Bronze #3 */}
              {top3Podium[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-amber-600 truncate max-w-[65px]">
                    {top3Podium[2].muscle.split(' ')[0]}
                  </span>
                  <div className="w-full bg-amber-950/60 border border-amber-700/50 rounded-t-xl h-9 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-amber-500">#3</span>
                    <span className="text-[9px] font-mono font-bold text-amber-400">{top3Podium[2].rating}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pill my-1.5 p-2 rounded-xl text-center space-y-1">
              <Camera className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mx-auto" />
              <p className="text-[11px] font-semibold text-slate-700 dark:text-cyan-200 leading-tight">
                Upload check-in photos with the camera button to reveal your Muscle Rating Podium.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>{hasVisionScan ? `${muscleRatingsList.length} Muscles Analyzed` : 'Muscular Audit'}</span>
            {hasVisionScan ? (
              <span className="text-cyan-400 font-bold">Full Podium →</span>
            ) : (
              <span className="p-0.5 rounded-md text-cyan-400">
                <Camera className="w-3.5 h-3.5 inline-block" />
              </span>
            )}
          </div>
        </div>

        {/* CARD 3: Daily Highlights -> Opens Real-Time Daily Telemetry Drawer */}
        <div
          onClick={() => setActiveModal('daily-highlights')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Daily Highlights</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="my-1 space-y-1.5">
            {todayLifts.length > 0 ? (
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums tracking-tight">
                  {todayLifts.length} <span className="text-xs text-slate-400 font-normal">Sets Logged</span>
                </div>
                <div className="text-xs font-semibold text-emerald-300 truncate">
                  ✓ {todayLifts[0].exerciseName} ({todayLifts[0].weightKg}kg × {todayLifts[0].reps})
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Volume: {todayTotalVolumeKg.toLocaleString()}kg moved today
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-1">
                <div className="text-sm font-bold text-slate-300">No Workout Logged Yet</div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {todayStepLog.steps.toLocaleString()} steps · {sleepHours}h sleep · {activeCaloriesBurned} kcal
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>{todayLifts.length > 0 ? `${todayLifts.length} Sets Logged` : 'Live Telemetry'}</span>
            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">Highlights →</span>
          </div>
        </div>

        {/* CARD 4: Personal Records -> Opens PR Trophy Cabinet */}
        <div
          onClick={() => setActiveModal('history')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-3 min-h-[72px] flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Personal Records</span>
            <Award className="w-3.5 h-3.5 text-rose-400" />
          </div>

          <div className="my-1.5 space-y-1">
            {uniquePRs.length > 0 ? (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums tracking-tight">
                  {totalLoggedPRs} <span className="text-xs text-slate-400 font-normal">Active PRs</span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-rose-300 truncate">
                    🏆 {uniquePRs[0].exerciseName}: {uniquePRs[0].max1RM}kg 1RM
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {uniquePRs.slice(0, 2).map((p) => `${p.exerciseName} (${p.max1RM}k)`).join(' · ')}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5 py-0.5">
                <div className="text-xs font-bold text-inherit leading-snug group-hover:text-rose-300 transition-colors">
                  0 PRs Set — Log a session to unlock trophy cabinet.
                </div>
                <div className="pill inline-flex items-center gap-1.5 text-[10px] font-mono text-rose-500 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg">
                  <Award className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>Tap to open Trophy Cabinet</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>Trophy Cabinet</span>
            <span className="text-rose-400 font-bold group-hover:translate-x-0.5 transition-transform">PR Shelf →</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL DRAWERS MATCHING TRACKER CARDS 1-TO-1                              */}
      {/* ========================================================================= */}

      {/* MODAL 1: ACTIVE WORKOUT ROUTINE & LIVE EXECUTION DRAWER */}
      {activeModal === 'live-execution' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4">
            
            {/* DRAWER HEADER WITH 'X' CLOSE BUTTON */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Active Workout Routine & Live Execution</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WEEKLY SESSION AUTO-REFRESH STATUS BANNER */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Weekly Session Cycle: {weekCycleLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Active checkmarks reset every Monday at midnight. All PRs, maxes, and logs are permanently retained.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                {completedCycleExercisesCount}/{totalCycleExercises} Done This Week
              </span>
            </div>

            {/* COLLAPSIBLE ACCORDION WORKOUT SPLITS */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              
              {/* ACCORDION 1: DAY 1: HEAVY PRESSING & PULLING */}
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedDays((prev) => ({ ...prev, day1: !prev.day1 }))}
                  className="w-full p-3.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                        Day 1: Heavy Pressing & Pulling
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        6 Scheduled Movements · Strength Focus
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                      {DEFAULT_DAY1_EXERCISES.filter((ex) => isMovementDoneThisWeek(ex.name)).length}/6 Done
                    </span>
                    {expandedDays.day1 ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {expandedDays.day1 && (
                  <div className="p-3 pt-0 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                    {DEFAULT_DAY1_EXERCISES.map((ex, idx) => {
                      const matched = exercises.find((e) => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()) ||
                        exercises.find((e) => e.name.toLowerCase().includes(ex.name.toLowerCase()) || ex.name.toLowerCase().includes(e.name.toLowerCase()));
                      const matchedId = matched?.id;
                      const prevRecord = matchedId ? exercisePRsMap.get(matchedId) : null;
                      const isDoneThisWeek = isMovementDoneThisWeek(ex.name);
                      const isInlineOpen = inlineLoggingExercise === ex.name;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isInlineOpen
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="p-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate block">{ex.name}</span>
                                {isDoneThisWeek && (
                                  <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Done this week</span>
                                  </span>
                                )}
                                {prevRecord && (
                                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                    PR: {prevRecord.max1RM}k
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {ex.setsReps} · {ex.targetMuscle}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleInlineLog(ex.name, ex.defaultWeight, ex.defaultReps)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                                isInlineOpen
                                  ? 'bg-amber-500 text-black shadow-md'
                                  : 'bg-white/10 hover:bg-amber-500 hover:text-black text-white'
                              }`}
                            >
                              {isInlineOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{isInlineOpen ? 'Close' : 'Log Set +'}</span>
                            </button>
                          </div>

                          {/* INLINE LOGGING FORM (AUTO-COLLAPSES ON SAVE) */}
                          {isInlineOpen && (
                            <form
                              onSubmit={(e) => handleSaveInlineSet(e, ex.name)}
                              className="p-3 bg-slate-950/90 border-t border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-1.5">
                                <span>Logging Set: {ex.name}</span>
                                <span className="text-amber-300">Default: {ex.setsReps}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                                    Weight ({isMetric ? 'kg' : 'lbs'})
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={inlineWeight}
                                    onChange={(e) => setInlineWeight(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-amber-400"
                                    required
                                    autoFocus
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Reps</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={inlineReps}
                                    onChange={(e) => setInlineReps(parseInt(e.target.value, 10) || 1)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-amber-400"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setInlineLoggingExercise(null)}
                                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save Set ({inlineWeight}{isMetric ? 'kg' : 'lbs'} × {inlineReps})</span>
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ACCORDION 2: DAY 2: CALISTHENICS SKILLS, ARMS & SHOULDERS */}
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedDays((prev) => ({ ...prev, day2: !prev.day2 }))}
                  className="w-full p-3.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                        Day 2: Calisthenics Skills, Arms & Shoulders
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        6 Scheduled Movements · Hypertrophy & Skill
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                      {DEFAULT_DAY2_EXERCISES.filter((ex) => isMovementDoneThisWeek(ex.name)).length}/6 Done
                    </span>
                    {expandedDays.day2 ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {expandedDays.day2 && (
                  <div className="p-3 pt-0 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                    {DEFAULT_DAY2_EXERCISES.map((ex, idx) => {
                      const matched = exercises.find((e) => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()) ||
                        exercises.find((e) => e.name.toLowerCase().includes(ex.name.toLowerCase()) || ex.name.toLowerCase().includes(e.name.toLowerCase()));
                      const matchedId = matched?.id;
                      const prevRecord = matchedId ? exercisePRsMap.get(matchedId) : null;
                      const isDoneThisWeek = isMovementDoneThisWeek(ex.name);
                      const isInlineOpen = inlineLoggingExercise === ex.name;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isInlineOpen
                              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="p-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate block">{ex.name}</span>
                                {isDoneThisWeek && (
                                  <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Done this week</span>
                                  </span>
                                )}
                                {prevRecord && (
                                  <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                                    PR: {prevRecord.max1RM}k
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {ex.setsReps} · {ex.targetMuscle}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleInlineLog(ex.name, ex.defaultWeight, ex.defaultReps)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                                isInlineOpen
                                  ? 'bg-cyan-400 text-black shadow-md'
                                  : 'bg-white/10 hover:bg-cyan-400 hover:text-black text-white'
                              }`}
                            >
                              {isInlineOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{isInlineOpen ? 'Close' : 'Log Set +'}</span>
                            </button>
                          </div>

                          {/* INLINE LOGGING FORM (AUTO-COLLAPSES ON SAVE) */}
                          {isInlineOpen && (
                            <form
                              onSubmit={(e) => handleSaveInlineSet(e, ex.name)}
                              className="p-3 bg-slate-950/90 border-t border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-1.5">
                                <span>Logging Set: {ex.name}</span>
                                <span className="text-cyan-300">Default: {ex.setsReps}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                                    Weight ({isMetric ? 'kg' : 'lbs'})
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={inlineWeight}
                                    onChange={(e) => setInlineWeight(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-cyan-400"
                                    required
                                    autoFocus
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Reps</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={inlineReps}
                                    onChange={(e) => setInlineReps(parseInt(e.target.value, 10) || 1)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-cyan-400"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setInlineLoggingExercise(null)}
                                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save Set ({inlineWeight}{isMetric ? 'kg' : 'lbs'} × {inlineReps})</span>
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* DRAWER FOOTER: ANCHORED PROMINENT 'DONE' BUTTON */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: MUSCLE RATING PODIUM DRAWER */}
      {activeModal === 'muscle-ratings' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Top Muscle Rating Podium</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {hasVisionScan ? (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {/* 1st, 2nd, 3rd Podium Display */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-950/90 border border-cyan-500/20 flex items-end justify-center gap-2 h-36 pt-2">
                  {/* #2 Silver */}
                  {top3Podium[1] && (
                    <div className="flex-1 flex flex-col items-center">
                      <Medal className="w-4 h-4 text-slate-300 mb-0.5" />
                      <span className="text-[10px] font-bold text-slate-200 truncate max-w-[85px] text-center">
                        {top3Podium[1].muscle}
                      </span>
                      <div className="w-full bg-slate-800/90 border border-slate-400/50 rounded-t-2xl h-16 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-xs font-black text-slate-300">#2 Silver</span>
                        <span className="text-sm font-mono font-black text-white">{top3Podium[1].rating}/10</span>
                      </div>
                    </div>
                  )}

                  {/* #1 Gold */}
                  {top3Podium[0] && (
                    <div className="flex-1 flex flex-col items-center">
                      <Crown className="w-5 h-5 text-amber-400 mb-0.5 animate-bounce" />
                      <span className="text-[11px] font-black text-amber-300 truncate max-w-[95px] text-center">
                        {top3Podium[0].muscle}
                      </span>
                      <div className="w-full bg-amber-500/20 border-2 border-amber-400/80 rounded-t-2xl h-22 flex flex-col items-center justify-center shadow-2xl">
                        <span className="text-xs font-black text-amber-300">#1 Gold</span>
                        <span className="text-base font-mono font-black text-white">{top3Podium[0].rating}/10</span>
                        <span className="text-[8px] font-mono text-amber-200 uppercase font-bold">Peak Group</span>
                      </div>
                    </div>
                  )}

                  {/* #3 Bronze */}
                  {top3Podium[2] && (
                    <div className="flex-1 flex flex-col items-center">
                      <Medal className="w-4 h-4 text-amber-600 mb-0.5" />
                      <span className="text-[10px] font-bold text-amber-400 truncate max-w-[85px] text-center">
                        {top3Podium[2].muscle}
                      </span>
                      <div className="w-full bg-amber-950/80 border border-amber-700/60 rounded-t-2xl h-14 flex flex-col items-center justify-center shadow-lg">
                        <span className="text-xs font-black text-amber-400">#3 Bronze</span>
                        <span className="text-sm font-mono font-black text-white">{top3Podium[2].rating}/10</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* All Remaining Muscle Ratings Listed Below */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Complete Hypertrophy Ranks
                  </span>
                  {muscleRatingsList.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 text-center font-mono font-black text-xs ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">{m.muscle}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{m.notes || 'High aesthetic density'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono font-black text-cyan-300">{m.rating}/10</span>
                        <span className={`block text-[9px] font-bold uppercase ${
                          m.rating >= 8.5 ? 'text-emerald-400' : m.rating >= 7.5 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {m.status || (m.rating >= 8.5 ? 'Peak' : m.rating >= 7.5 ? 'Balanced' : 'Lagging')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-white/5 rounded-2xl border border-white/10 p-6">
                <Camera className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No Physique Photos Uploaded Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Upload physique check-in photos in AI Coach to generate your full 1st, 2nd, and 3rd place Muscle Rating Podium!
                  </p>
                </div>
                {onOpenPhysiqueScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      onOpenPhysiqueScanner();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch AI Physique Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 
        MODAL 3: REAL-TIME DAILY TELEMETRY IN DAILY HIGHLIGHTS MODAL (PER USER REQUIREMENT):
        - Today's logged workouts (exercises, weight, reps completed, volume)
        - Real-time step count ring and progress toward daily target
        - Synced sleep duration and recovery percentage
        - Active energy burn and caloric intake telemetry
      */}
      {activeModal === 'daily-highlights' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Daily Highlights & Real-Time Telemetry</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              
              {/* REAL-TIME 4-METRIC TELEMETRY BENTO GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                {/* 1. Real-Time Steps & Progress Ring */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold">Daily Steps</span>
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="my-1.5">
                    <div className="text-lg sm:text-xl font-black font-mono text-white">
                      {todayStepLog.steps.toLocaleString()}
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${stepPercentage}%` }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {stepPercentage}% of {stepTarget.toLocaleString()} goal
                  </span>
                </div>

                {/* 2. Synced Sleep Duration & Recovery */}
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold">Sleep & Recovery</span>
                    <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="my-1.5">
                    <div className="text-lg sm:text-xl font-black font-mono text-white">
                      {sleepHours}h
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-cyan-400 h-full rounded-full transition-all" style={{ width: `${sleepScore}%` }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {sleepScore}% Recovery Efficiency
                  </span>
                </div>

                {/* 3. Active Energy Burn Telemetry */}
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-300 uppercase font-bold">Active Burn</span>
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="my-1.5">
                    <div className="text-lg sm:text-xl font-black font-mono text-white">
                      {activeCaloriesBurned.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-rose-300 font-mono block">kcal burned</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Steps, Sports & Gym
                  </span>
                </div>

                {/* 4. Caloric Intake & Fuel */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">Daily Fuel</span>
                    <Droplet className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="my-1.5">
                    <div className="text-lg sm:text-xl font-black font-mono text-white">
                      {caloriesConsumed.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono block">{proteinConsumedG}g protein</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {waterConsumedL}L hydration
                  </span>
                </div>
              </div>

              {/* TODAY'S EXECUTED WORKOUTS LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Today's Executed Workouts ({todayLifts.length} Sets)
                  </span>
                  {todayLifts.length > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Total Volume: {todayTotalVolumeKg.toLocaleString()}kg
                    </span>
                  )}
                </div>

                {todayLifts.length === 0 ? (
                  <div className="py-8 text-center space-y-2 bg-white/5 rounded-2xl border border-white/10 p-6">
                    <Dumbbell className="w-8 h-8 text-slate-500 mx-auto" />
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">No workout logged yet today.</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Complete a session to see your daily highlights.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('live-execution')}
                      className="px-4 py-2 rounded-xl text-black font-black text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-1"
                      style={{ backgroundColor: 'var(--accent-hex)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Workout Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayLifts.map((lift, idx) => (
                      <div key={lift.id || idx} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white block truncate">{lift.exerciseName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {lift.weightKg}kg × {lift.reps} reps
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-amber-300 block">{lift.calculated1RM}kg 1RM</span>
                            <span className="text-[9px] text-slate-400">{(lift.weightKg * lift.reps)}kg volume</span>
                          </div>
                          {onDeleteLift && lift.id && (
                            <button
                              type="button"
                              onClick={() => onDeleteLift(lift.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: PERSONAL RECORDS (PR TROPHY CABINET) */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Personal Record (PR) Trophy Cabinet</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {uniquePRs.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-white/5 rounded-2xl border border-white/10 p-6">
                  <Dumbbell className="w-8 h-8 text-rose-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-200">0 PRs Set</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    0 PRs Set — Log a session to unlock trophy cabinet. Working sets automatically compute personal records!
                  </p>
                </div>
              ) : (
                uniquePRs.map((prItem, idx) => {
                  const rec = prItem.record;
                  return (
                    <div key={rec.id || idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/10 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">{prItem.exerciseName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {rec.weightKg}kg × {rec.reps} reps · {rec.date || 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono">
                          <span className="text-sm font-black text-rose-400">{prItem.max1RM}kg</span>
                          <span className="text-[9px] text-slate-400 block">1RM Max</span>
                        </div>

                        {onDeleteLift && rec.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteLift(rec.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD CUSTOM EXERCISE */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Create Custom Exercise</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Incline Smith Machine Press"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-sm text-white font-semibold outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Muscle Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ExerciseCategory)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-sm text-white font-semibold outline-none"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="legs">Legs</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="core">Core</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md"
                >
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
