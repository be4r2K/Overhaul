import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Haptic feedback utilities with web fallback
const triggerLightHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
};

const triggerMediumHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  }
};

const triggerPRHaptic = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
    setTimeout(async () => {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch {}
    }, 150);
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 120]);
    }
  }
};
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
  ChevronUp,
  Sparkles,
  MoreHorizontal,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Edit2,
  Clock
} from 'lucide-react';
import { Exercise, ExerciseCategory, LiftRecord, UserProfile, DailyStepLog, SleepLog, DailyNutritionLog, SportActivity } from '../types/fitness';
import { AIWorkoutAnalysisResult, AIBodyVisionData } from '../types/aiWorkout';
import { calculate1RM, units } from '../utils/calculations';
import { playPRFanfare } from '../utils/audio';
import { AIRoutineBuilderModal } from './AIRoutineBuilderModal';
import { formatExerciseRow } from '../utils/workoutParser';
import { getActiveUserUid, saveToStorage } from '../utils/storage';
import { syncRoutinesToCloud } from '../utils/cloudSyncService';

interface GymProgressViewProps {
  profile: UserProfile;
  exercises: Exercise[];
  liftRecords: LiftRecord[];
  onAddLift: (lift: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => void;
  onDeleteLift: (id: string) => void;
  onAddCustomExercise: (name: string, category: ExerciseCategory) => void;
  onOpenTimer?: () => void;
  aiWorkoutAnalysis?: AIWorkoutAnalysisResult | null;
  onUpdateRoutine?: (routine: any) => void;
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
  aiWorkoutAnalysis,
  onUpdateRoutine,
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

  // Inline exercise log state
  const [inlineLoggingExercise, setInlineLoggingExercise] = useState<string | null>(null);
  const [inlineWeight, setInlineWeight] = useState<number>(100);
  const [inlineReps, setInlineReps] = useState<number>(5);
  const [inlineDuration, setInlineDuration] = useState<number>(30);
  const [inlineBodyweightAdded, setInlineBodyweightAdded] = useState<number>(0);

  // Manual Done Map state
  const [markedDoneMap, setMarkedDoneMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('overhaul_marked_done');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleMarkDone = (exName: string) => {
    setMarkedDoneMap((prev) => {
      const next = { ...prev, [exName]: !prev[exName] };
      try {
        localStorage.setItem('overhaul_marked_done', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Exercise ⋯ Action Menu State
  const [openExerciseMenu, setOpenExerciseMenu] = useState<{ dayIdx: number; exIdx: number } | null>(null);

  // Edit Exercise Modal State
  const [editingExercise, setEditingExercise] = useState<{
    dayIdx: number;
    exIdx: number;
    name: string;
    sets: string;
    reps: string;
    weight: string;
    notes: string;
  } | null>(null);

  // Add Exercise to Day Modal State
  const [addingExerciseDayIdx, setAddingExerciseDayIdx] = useState<number | null>(null);
  const [addExName, setAddExName] = useState<string>('');
  const [addExSets, setAddExSets] = useState<string>('3');
  const [addExReps, setAddExReps] = useState<string>('8');
  const [addExWeight, setAddExWeight] = useState<string>('');
  const [addExNotes, setAddExNotes] = useState<string>('');

  // Rename Day State
  const [renamingDayIdx, setRenamingDayIdx] = useState<number | null>(null);
  const [renamingDayTitle, setRenamingDayTitle] = useState<string>('');

  // Move Exercise to Day Modal State
  const [moveExerciseState, setMoveExerciseState] = useState<{ dayIdx: number; exIdx: number } | null>(null);

  // Delete Split Confirmation Modal State
  const [showDeleteSplitModal, setShowDeleteSplitModal] = useState<boolean>(false);

  // Edit Logged Record inline
  const [editingLoggedRecord, setEditingLoggedRecord] = useState<{ id: string; weight: number; reps: number } | null>(null);

  // Active modal drawer state matching Tracker cards 1-to-1
  const [activeModal, setActiveModal] = useState<'live-execution' | 'muscle-ratings' | 'daily-highlights' | 'history' | 'ai-routine-builder' | null>(null);

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

  // State for subtle 1RM trophy pop animation when a new PR is set or detected
  const [trophyPopData, setTrophyPopData] = useState<{ exerciseName: string; max1RM: number } | null>(null);
  const previousPRCountRef = useRef<number>(totalLoggedPRs);

  // Centered temporary framer-motion trophy animation state when a liftRecord contains { isPR: true }
  const [activePRRecord, setActivePRRecord] = useState<LiftRecord | null>(null);
  const lastTriggeredPRIdRef = useRef<string | null>(null);
  const initialMountRef = useRef<boolean>(true);

  // Selected exercise current PR
  const currentExercisePR = exercisePRsMap.get(selectedExerciseId)?.max1RM || 0;
  const willBePR = rmBreakdown.average > currentExercisePR;

  useEffect(() => {
    if (!liftRecords || liftRecords.length === 0) return;

    const prRecord = liftRecords.find((r) => r.isPR === true);

    if (initialMountRef.current) {
      initialMountRef.current = false;
      if (prRecord) {
        lastTriggeredPRIdRef.current = prRecord.id;
      }
      return;
    }

    if (prRecord && prRecord.id !== lastTriggeredPRIdRef.current) {
      lastTriggeredPRIdRef.current = prRecord.id;
      setActivePRRecord(prRecord);
      triggerPRHaptic();

      const timer = setTimeout(() => {
        setActivePRRecord(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [liftRecords]);

  useEffect(() => {
    if (totalLoggedPRs > previousPRCountRef.current && uniquePRs.length > 0) {
      const topPR = uniquePRs[0];
      setTrophyPopData({ exerciseName: topPR.exerciseName, max1RM: topPR.max1RM });
      triggerPRHaptic();
      const timer = setTimeout(() => setTrophyPopData(null), 3800);
      previousPRCountRef.current = totalLoggedPRs;
      return () => clearTimeout(timer);
    }
    previousPRCountRef.current = totalLoggedPRs;
  }, [totalLoggedPRs, uniquePRs]);

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

  const isTimedExercise = (ex: any) => {
    const text = `${ex.name || ''} ${ex.reps_or_duration || ''} ${ex.notes || ''}`.toLowerCase();
    return text.includes('sec') || text.includes('hold') || text.includes('plank') || text.includes('duration');
  };

  const isBodyweightExercise = (ex: any) => {
    const text = `${ex.name || ''} ${ex.weight || ''}`.toLowerCase();
    return text.includes('bodyweight') || text.includes('bw') || text.includes('calisthenic') || ex.weight === '0' || ex.weight === 0 || !ex.weight || ex.weight === '-';
  };

  const getExerciseLogsThisWeek = (exerciseName: string) => {
    return liftRecords.filter((r) => {
      const match = r.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim() ||
        r.exerciseName.toLowerCase().includes(exerciseName.toLowerCase()) ||
        exerciseName.toLowerCase().includes(r.exerciseName.toLowerCase());
      if (!match) return false;
      const recordTime = new Date(r.date + 'T00:00:00').getTime();
      return recordTime >= currentWeekMondayTime && recordTime <= currentWeekSundayTime;
    });
  };

  const isExerciseDoneThisWeek = (ex: any) => {
    if (markedDoneMap[ex.name]) return true;
    const logs = getExerciseLogsThisWeek(ex.name);
    const plannedSets = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets, 10) || 0;
    const threshold = plannedSets > 0 ? plannedSets : 1;
    return logs.length >= threshold;
  };

  const isMovementDoneThisWeek = (exerciseName: string) => {
    if (markedDoneMap[exerciseName]) return true;
    const logs = getExerciseLogsThisWeek(exerciseName);
    return logs.length >= 1;
  };

  const routinesList = aiWorkoutAnalysis?.parsedDays || [];
  const routineExercises = routinesList.flatMap((day: any) => day.exercises || []);

  const totalCycleExercises = aiWorkoutAnalysis 
    ? routineExercises.length 
    : (DEFAULT_DAY1_EXERCISES.length + DEFAULT_DAY2_EXERCISES.length);

  const completedCycleExercisesCount = aiWorkoutAnalysis
    ? routineExercises.filter((ex: any) => isExerciseDoneThisWeek(ex)).length
    : [...DEFAULT_DAY1_EXERCISES, ...DEFAULT_DAY2_EXERCISES].filter((ex: any) => isMovementDoneThisWeek(ex.name)).length;

  const persistUpdatedRoutine = (updated: any) => {
    if (onUpdateRoutine) {
      onUpdateRoutine(updated);
    }
    saveToStorage('ai_workout_analysis', updated);
    try {
      if (updated) {
        localStorage.setItem('active_ai_routine', JSON.stringify(updated));
      } else {
        localStorage.removeItem('active_ai_routine');
      }
    } catch {}
    const uid = getActiveUserUid();
    if (uid && updated) {
      syncRoutinesToCloud(uid, updated.parsedDays || [], updated).catch(() => {});
    }
  };

  const handleDeleteSplit = () => {
    triggerMediumHaptic();
    persistUpdatedRoutine(null);
    setShowDeleteSplitModal(false);
    setActiveModal(null);
  };

  const handleSaveEditedExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise || !aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerLightHaptic();
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    const day = { ...updatedDays[editingExercise.dayIdx] };
    const exercisesList = [...(day.exercises || [])];
    const parsedSets = parseInt(editingExercise.sets, 10);
    exercisesList[editingExercise.exIdx] = {
      ...exercisesList[editingExercise.exIdx],
      name: editingExercise.name.trim(),
      sets: isNaN(parsedSets) ? 0 : parsedSets,
      reps_or_duration: editingExercise.reps.trim(),
      weight: editingExercise.weight.trim(),
      notes: editingExercise.notes.trim(),
    };
    day.exercises = exercisesList;
    updatedDays[editingExercise.dayIdx] = day;
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setEditingExercise(null);
  };

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingExerciseDayIdx === null || !addExName.trim() || !aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerLightHaptic();
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    const day = { ...updatedDays[addingExerciseDayIdx] };
    const exercisesList = [...(day.exercises || [])];
    const parsedSets = parseInt(addExSets, 10);
    exercisesList.push({
      name: addExName.trim(),
      sets: isNaN(parsedSets) ? 3 : parsedSets,
      reps_or_duration: addExReps.trim() || '8',
      weight: addExWeight.trim() || '',
      notes: addExNotes.trim(),
      muscles: [],
    });
    day.exercises = exercisesList;
    updatedDays[addingExerciseDayIdx] = day;
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setAddingExerciseDayIdx(null);
    setAddExName('');
    setAddExSets('3');
    setAddExReps('8');
    setAddExWeight('');
    setAddExNotes('');
  };

  const handleRenameDaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingDayIdx === null || !renamingDayTitle.trim() || !aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerLightHaptic();
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    updatedDays[renamingDayIdx] = {
      ...updatedDays[renamingDayIdx],
      dayTitle: renamingDayTitle.trim(),
    };
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setRenamingDayIdx(null);
    setRenamingDayTitle('');
  };

  const handleDeleteDay = (dayIdx: number) => {
    if (!aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerMediumHaptic();
    const updatedDays = aiWorkoutAnalysis.parsedDays.filter((_: any, idx: number) => idx !== dayIdx);
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
  };

  const handleDeleteExercise = (dayIdx: number, exIdx: number) => {
    if (!aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerMediumHaptic();
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    const day = { ...updatedDays[dayIdx] };
    day.exercises = (day.exercises || []).filter((_: any, idx: number) => idx !== exIdx);
    updatedDays[dayIdx] = day;
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setOpenExerciseMenu(null);
  };

  const handleMoveExerciseUpDown = (dayIdx: number, exIdx: number, direction: 'up' | 'down') => {
    if (!aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerLightHaptic();
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    const day = { ...updatedDays[dayIdx] };
    const list = [...(day.exercises || [])];
    const targetIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[exIdx];
    list[exIdx] = list[targetIdx];
    list[targetIdx] = temp;
    day.exercises = list;
    updatedDays[dayIdx] = day;
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setOpenExerciseMenu(null);
  };

  const handleMoveExerciseToDay = (targetDayIdx: number) => {
    if (!moveExerciseState || !aiWorkoutAnalysis || !aiWorkoutAnalysis.parsedDays) return;
    triggerLightHaptic();
    const { dayIdx, exIdx } = moveExerciseState;
    if (dayIdx === targetDayIdx) {
      setMoveExerciseState(null);
      return;
    }
    const updatedDays = [...(aiWorkoutAnalysis.parsedDays || [])];
    const sourceDay = { ...updatedDays[dayIdx] };
    const targetDay = { ...updatedDays[targetDayIdx] };
    const sourceExercises = sourceDay.exercises || [];
    const exerciseToMove = sourceExercises[exIdx];
    if (!exerciseToMove) return;
    sourceDay.exercises = sourceExercises.filter((_: any, i: number) => i !== exIdx);
    targetDay.exercises = [...(targetDay.exercises || []), exerciseToMove];
    updatedDays[dayIdx] = sourceDay;
    updatedDays[targetDayIdx] = targetDay;
    const updatedAnalysis = { ...aiWorkoutAnalysis, parsedDays: updatedDays };
    persistUpdatedRoutine(updatedAnalysis);
    setMoveExerciseState(null);
    setOpenExerciseMenu(null);
  };

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

  const latestSleep = sleepHistory.find((s) => s.date === todayStr) || (sleepHistory.length > 0 ? sleepHistory[0] : null);
  const rawSleepHours = latestSleep
    ? latestSleep.hoursSlept !== undefined
      ? Number(latestSleep.hoursSlept)
      : (latestSleep.totalMinutes || 0) / 60
    : 0;
  const sleepHours = rawSleepHours > 0 ? rawSleepHours.toFixed(1) : '0.0';
  const sleepScore = latestSleep && rawSleepHours > 0 ? (latestSleep.score || latestSleep.qualityScore || 0) : 0;

  const todaySportsBurn = sportsHistory.filter((s) => s.date === todayStr).reduce((sum, s) => sum + s.caloriesBurned, 0);
  const activeCaloriesBurned = totalCaloriesBurnedToday ?? (todayStepLog.caloriesBurned + todaySportsBurn + Math.round(todayTotalVolumeKg * 0.05));

  const caloriesConsumed = nutritionLog ? nutritionLog.meals.reduce((sum, m) => sum + m.calories, 0) : 0;
  const proteinConsumedG = nutritionLog ? nutritionLog.meals.reduce((sum, m) => sum + m.proteinG, 0) : 0;
  const waterConsumedL = nutritionLog ? (nutritionLog.waterConsumedMl / 1000).toFixed(1) : '0.0';

  // Handle selecting an exercise to log
  const handleSelectExerciseForLogging = (exerciseName: string, defaultW: number, defaultR: number) => {
    triggerLightHaptic();
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
      triggerPRHaptic();
      setTrophyPopData({
        exerciseName: currentExercise?.name || 'Exercise',
        max1RM: Math.round(rmBreakdown.average),
      });
      setTimeout(() => setTrophyPopData(null), 3800);
    } else {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      triggerMediumHaptic();
    }
  };

  // Matched toggle inline log
  const handleToggleInlineLog = (ex: any) => {
    triggerLightHaptic();
    const exName = ex.name;
    if (inlineLoggingExercise === exName) {
      setInlineLoggingExercise(null);
      return;
    }

    const exLogs = getExerciseLogsThisWeek(exName);
    const lastLog = exLogs.length > 0 ? exLogs[exLogs.length - 1] : null;

    if (isTimedExercise(ex)) {
      if (lastLog) {
        setInlineDuration(lastLog.reps || 30);
      } else {
        const match = (ex.reps_or_duration || '').match(/(\d+)/);
        setInlineDuration(match ? parseInt(match[1], 10) : 30);
      }
    } else if (isBodyweightExercise(ex)) {
      if (lastLog) {
        setInlineReps(lastLog.reps || 8);
        setInlineBodyweightAdded(isMetric ? lastLog.weightKg : Number(units.kgToLbs(lastLog.weightKg).toFixed(1)));
      } else {
        const match = (ex.reps_or_duration || '').match(/(\d+)/);
        setInlineReps(match ? parseInt(match[1], 10) : 8);
        setInlineBodyweightAdded(0);
      }
    } else {
      if (lastLog) {
        setInlineWeight(isMetric ? lastLog.weightKg : Number(units.kgToLbs(lastLog.weightKg).toFixed(1)));
        setInlineReps(lastLog.reps || 5);
      } else {
        const wMatch = (ex.weight || '').match(/(\d+(?:\.\d+)?)/);
        const rMatch = (ex.reps_or_duration || '').match(/(\d+)/);
        setInlineWeight(wMatch ? parseFloat(wMatch[1]) : 60);
        setInlineReps(rMatch ? parseInt(rMatch[1], 10) : 8);
      }
    }
    setInlineLoggingExercise(exName);
  };

  // Save matched inline set and auto-collapse
  const handleSaveInlineSet = (e: React.FormEvent, ex: any) => {
    e.preventDefault();
    const exName = ex.name;

    let matched = exercises.find((item) => item.name.toLowerCase().trim() === exName.toLowerCase().trim()) ||
      exercises.find((item) => item.name.toLowerCase().includes(exName.toLowerCase()) || exName.toLowerCase().includes(item.name.toLowerCase()));
    
    let targetId = matched?.id;
    if (!matched) {
      targetId = `custom-${Date.now()}`;
      onAddCustomExercise(exName, 'chest');
    }

    let finalWeightKg = 0;
    let finalReps = 0;

    if (isTimedExercise(ex)) {
      if (inlineDuration <= 0) return;
      finalWeightKg = 0;
      finalReps = inlineDuration; // Duration in seconds stored in reps
    } else if (isBodyweightExercise(ex)) {
      if (inlineReps <= 0) return;
      finalWeightKg = isMetric ? inlineBodyweightAdded : units.lbsToKg(inlineBodyweightAdded);
      finalReps = inlineReps;
    } else {
      if (inlineWeight <= 0 || inlineReps <= 0) return;
      finalWeightKg = isMetric ? inlineWeight : units.lbsToKg(inlineWeight);
      finalReps = inlineReps;
    }

    const calculated = calculate1RM(finalWeightKg, finalReps);
    const currentPR = targetId ? (exercisePRsMap.get(targetId)?.max1RM || 0) : 0;
    const isNewPR = !isTimedExercise(ex) && finalWeightKg > 0 && calculated.average > currentPR;

    onAddLift({
      exerciseId: targetId || 'bench-press',
      exerciseName: exName,
      weightKg: finalWeightKg,
      reps: finalReps,
      rpe: 8.5,
      date: todayStr,
    });

    if (isNewPR) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      playPRFanfare();
      triggerPRHaptic();
      setTrophyPopData({
        exerciseName: exName,
        max1RM: Math.round(calculated.average),
      });
      setTimeout(() => setTrophyPopData(null), 3800);
    } else {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      triggerMediumHaptic();
    }

    // Auto-collapse inline form immediately upon saving
    setInlineLoggingExercise(null);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    triggerLightHaptic();
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
    <div
      className="page-container tracker-page h-full max-h-full flex-1 min-h-0 overflow-hidden flex flex-col justify-start p-1.5 sm:p-2.5 pb-1 max-w-7xl mx-auto w-full gap-[6px] select-none"
      style={{ justifyContent: 'flex-start' }}
    >
      {/* Centered Temporary Framer-Motion Trophy Animation Overlay when a liftRecord has { isPR: true } */}
      <AnimatePresence>
        {activePRRecord && (
          <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 30, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="pointer-events-auto max-w-xs w-full p-5 rounded-3xl bg-slate-900/90 dark:bg-slate-950/90 border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.45)] backdrop-blur-xl flex flex-col items-center text-center space-y-3 relative overflow-hidden"
            >
              {/* Glowing ambient accents */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/25 rounded-full blur-2xl pointer-events-none" />

              {/* Bouncing Gold Trophy Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.35, 1, 1.18, 1],
                  rotate: [0, -15, 15, -8, 8, 0],
                  y: [0, -8, 0],
                }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/30 shrink-0 relative"
              >
                <Trophy className="w-9 h-9 text-slate-950 fill-amber-200" />
              </motion.div>

              {/* Text Details */}
              <div className="space-y-1 z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>NEW 1RM PERSONAL RECORD!</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight leading-tight pt-1">
                  {activePRRecord.exerciseName}
                </h3>
                <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
                  {isMetric ? `${activePRRecord.calculated1RM} kg` : `${Math.round(units.kgToLbs(activePRRecord.calculated1RM))} lbs`}{' '}
                  <span className="text-xs text-slate-400 font-semibold font-sans">1RM</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  {isMetric ? `${activePRRecord.weightKg}kg` : `${Math.round(units.kgToLbs(activePRRecord.weightKg))}lbs`} × {activePRRecord.reps} reps
                </p>
              </div>

              {/* Auto-Dismiss progress bar indicator */}
              <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-1 z-10">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3.5, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setActivePRRecord(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 
        MAIN TRACKER BENTO GRID (TOP BANNER REMOVED):
        1RM LIVE ENGINE is promoted to the TOP POSITION.
        Every card corresponds directly to its modal popup:
        1. 1RM LIVE ENGINE -> Active Workout Routine & Execution Drawer
        2. TOP MUSCLE RATINGS -> Muscle Rating Podium Drawer
        3. DAILY HIGHLIGHTS -> Real-Time Daily Telemetry Drawer
        4. PERSONAL RECORDS -> PR Trophy Cabinet
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[6px] shrink-0">
        
        {/* CARD 1: Compact "ACTIVE ROUTINE & EXECUTION" so all 4 pills fit cleanly above BottomNav */}
        <div
          onClick={() => {
            triggerLightHaptic();
            if (aiWorkoutAnalysis) {
              setActiveModal('live-execution');
            } else {
              setActiveModal('ai-routine-builder');
            }
          }}
          style={{ padding: '6px 10px' }}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative"
        >
          {aiWorkoutAnalysis ? (
            <>
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Routine Tracker</span>
                </span>
                <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <div className="my-1 space-y-1.5">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-inherit tracking-tight leading-tight">
                    Workout
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Today: {aiWorkoutAnalysis.parsedDays?.[0]?.dayTitle || 'Day 1'} · {aiWorkoutAnalysis.parsedDays?.[0]?.exercises?.length || 0} exercises
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Progress</span>
                    <span className="text-amber-400 font-bold">{completedCycleExercisesCount} / {totalCycleExercises} Done</span>
                  </div>
                  <div className="w-full bg-black/20 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalCycleExercises > 0 ? Math.min(100, Math.round((completedCycleExercisesCount / totalCycleExercises) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span className="text-slate-400 font-mono">
                  {aiWorkoutAnalysis.parsedDays?.length || 0} Days Total
                </span>
                <span className="pill px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-all flex items-center gap-1 text-[11px]">
                  <span>Open workout</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-between h-full w-full">
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>No Active Routine</span>
                </span>
                <Dumbbell className="w-3.5 h-3.5 text-slate-500" />
              </div>

              <div className="my-1 text-center py-1">
                <h3 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight">
                  No Active Routine
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tap to create your first workout split
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerLightHaptic();
                  setActiveModal('ai-routine-builder');
                }}
                className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>+ Create Routine</span>
              </button>
            </div>
          )}
        </div>

        {/* CARD 2: Top Muscle Ratings -> Opens Muscle Rating Podium Drawer or Direct Scanner Modal */}
        <div
          onClick={() => {
            triggerLightHaptic();
            if (hasVisionScan) {
              setActiveModal('muscle-ratings');
            } else if (onOpenPhysiqueScanner) {
              onOpenPhysiqueScanner();
            }
          }}
          style={{ padding: '6px 10px' }}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase leading-tight">
            <span>Top Muscle Ratings</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerLightHaptic();
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
            <div className="my-0.5 flex items-end justify-center gap-1.5 h-16 pt-0.5">
              {/* Silver #2 */}
              {top3Podium[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-[65px]">
                    {top3Podium[1].muscle.split(' ')[0]}
                  </span>
                  <div className="w-full bg-slate-800/80 border border-slate-400/40 rounded-t-xl h-9 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-slate-300">#2</span>
                    <span className="text-[9px] font-mono font-bold text-slate-200">{top3Podium[1].rating}</span>
                  </div>
                </div>
              )}

              {/* Gold #1 */}
              {top3Podium[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <Crown className="w-3 h-3 text-amber-400 -mb-0.5 animate-bounce" />
                  <span className="text-[9px] font-bold text-amber-300 truncate max-w-[70px]">
                    {top3Podium[0].muscle.split(' ')[0]}
                  </span>
                  <div className="w-full bg-amber-500/20 border border-amber-400/60 rounded-t-xl h-11 flex flex-col items-center justify-center shadow-lg">
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
                  <div className="w-full bg-amber-950/60 border border-amber-700/50 rounded-t-xl h-8 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-amber-500">#3</span>
                    <span className="text-[9px] font-mono font-bold text-amber-400">{top3Podium[2].rating}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pill my-1 p-1.5 rounded-xl text-center space-y-0.5">
              <Camera className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 mx-auto" />
              <p className="text-[10px] font-semibold text-slate-700 dark:text-cyan-200 leading-tight">
                Upload check-in photos with the camera button to reveal your Muscle Rating Podium.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
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
          onClick={() => {
            triggerLightHaptic();
            setActiveModal('daily-highlights');
          }}
          style={{ padding: '6px 10px' }}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase leading-tight">
            <span>Daily Highlights</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="my-0.5 space-y-1">
            {todayLifts.length > 0 ? (
              <div className="space-y-0.5">
                <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight leading-tight">
                  {todayLifts.length} <span className="text-xs text-slate-400 font-normal">Sets Logged</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-300 truncate">
                  ✓ {todayLifts[0].exerciseName} ({todayLifts[0].weightKg}kg × {todayLifts[0].reps})
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 py-0.5">
                <div className="text-xs sm:text-sm font-bold text-slate-300 leading-tight">No Workout Logged Yet</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {todayStepLog.steps.toLocaleString()} steps · {sleepHours}h sleep · {activeCaloriesBurned} kcal
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>{todayLifts.length > 0 ? `${todayLifts.length} Sets Logged` : 'Live Telemetry'}</span>
            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">Highlights →</span>
          </div>
        </div>

        {/* CARD 4: Personal Records -> Opens PR Trophy Cabinet */}
        <div
          onClick={() => {
            triggerLightHaptic();
            setActiveModal('history');
          }}
          style={{ padding: '8px 10px 12px 10px' }}
          className="pr-card-container trophy-shelf-preview card dashboard-item ig-glass-card glass-card-light rounded-2xl flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          {/* Subtle Framer-Motion Trophy Pop Banner */}
          <AnimatePresence>
            {trophyPopData && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="absolute inset-x-1.5 top-1.5 z-20 p-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-xl flex items-center justify-between border border-amber-300/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <motion.div
                    animate={{ rotate: [0, -18, 18, -10, 10, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="p-1.5 rounded-lg bg-black/25 shrink-0"
                  >
                    <Trophy className="w-4 h-4 text-amber-200 fill-amber-300" />
                  </motion.div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-wider text-amber-200 leading-none">New 1RM Record!</div>
                    <div className="text-[11px] font-bold truncate text-white mt-0.5 leading-tight">{trophyPopData.exerciseName}: {trophyPopData.max1RM}kg 1RM</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrophyPopData(null);
                  }}
                  className="p-1 text-white/80 hover:text-white shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase leading-tight">
            <span>Personal Records</span>
            <motion.div
              key={totalLoggedPRs + (trophyPopData ? '_pop' : '')}
              animate={trophyPopData ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -15, 15, -6, 0] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 15 }}
            >
              <Award className="w-3.5 h-3.5 text-rose-400" />
            </motion.div>
          </div>

          <div className="my-1 space-y-1">
            {uniquePRs.length > 0 ? (
              <>
                <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums tracking-tight leading-tight">
                  {totalLoggedPRs} <span className="text-xs text-slate-400 font-normal">Active PRs</span>
                </div>
                <div className="text-[11px] font-semibold text-rose-300 truncate">
                  🏆 {uniquePRs[0].exerciseName}: {uniquePRs[0].max1RM}kg 1RM
                </div>
              </>
            ) : (
              <div className="space-y-1 py-0.5">
                <div className="text-[11px] font-bold text-inherit leading-tight group-hover:text-rose-300 transition-colors">
                  0 PRs Set — Log a session to unlock trophy cabinet.
                </div>
                <div className="pill inline-flex items-center gap-1.5 text-[10px] font-mono text-rose-500 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-lg">
                  <Award className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>Tap to open Trophy Cabinet</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 mt-0.5 mb-1.5 border-t border-white/10">
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
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div 
            className="active-routine-modal glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4"
            style={{ marginTop: '28px', maxHeight: '82vh' }}
          >
            
            {/* DRAWER HEADER WITH NON-TRUNCATING TITLE, + NEW, DELETE SPLIT & 'X' */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Dumbbell className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white truncate">Workout</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerLightHaptic();
                    setActiveModal('ai-routine-builder');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  + New
                </button>
                {aiWorkoutAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerMediumHaptic();
                      setShowDeleteSplitModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Delete split
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    triggerLightHaptic();
                    setActiveModal(null);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* WEEKLY SESSION AUTO-REFRESH STATUS BANNER */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Weekly Session Cycle: {weekCycleLabel}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Resets every Monday. PRs and logs are kept.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                {completedCycleExercisesCount}/{totalCycleExercises} Done
              </span>
            </div>

            {/* COLLAPSIBLE ACCORDION WORKOUT SPLITS */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 flex-1">
              {aiWorkoutAnalysis && Array.isArray(aiWorkoutAnalysis.parsedDays) && aiWorkoutAnalysis.parsedDays.length > 0 ? (
                aiWorkoutAnalysis.parsedDays.map((day, dayIdx) => {
                  const isDayExpanded = expandedDays[`day${dayIdx + 1}` as keyof typeof expandedDays] || false;
                  const dayExercises = Array.isArray(day.exercises) ? day.exercises : [];
                  
                  return (
                    <div key={dayIdx} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerLightHaptic();
                          setExpandedDays((prev) => ({
                            ...prev,
                            [`day${dayIdx + 1}`]: !isDayExpanded
                          }));
                        }}
                        className="w-full p-3.5 flex items-center justify-between gap-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dayIdx === 0 ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                          <h4 className="routine-day-header text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                            {day.dayTitle} · {dayExercises.length} exercises
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                            dayIdx === 0 
                              ? 'text-amber-300 bg-amber-500/20 border-amber-500/30' 
                              : 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30'
                          }`}>
                            {dayExercises.filter((ex) => isExerciseDoneThisWeek(ex)).length}/{dayExercises.length} Done
                          </span>
                          {isDayExpanded ? (
                            <ChevronUp className={`w-4 h-4 ${dayIdx === 0 ? 'text-amber-400' : 'text-cyan-400'}`} />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Collapsible Content */}
                      {isDayExpanded && (
                        <div className="p-3 pt-0 border-t border-white/10 divide-y divide-white/10 animate-in fade-in duration-200">
                          
                          {/* Day Actions Bar */}
                          <div className="py-2 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  triggerLightHaptic();
                                  setAddingExerciseDayIdx(dayIdx);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-amber-400" />
                                <span>Add exercise</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerLightHaptic();
                                  setRenamingDayIdx(dayIdx);
                                  setRenamingDayTitle(day.dayTitle || '');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Rename day</span>
                              </button>
                            </div>

                            {(aiWorkoutAnalysis.parsedDays?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDay(dayIdx)}
                                className="px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Delete day
                              </button>
                            )}
                          </div>

                          {dayExercises.map((ex, exIdx) => {
                            const matched = exercises.find((e) => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()) ||
                              exercises.find((e) => e.name.toLowerCase().includes(ex.name.toLowerCase()) || ex.name.toLowerCase().includes(e.name.toLowerCase()));
                            const matchedId = matched?.id;
                            const prevRecord = matchedId ? exercisePRsMap.get(matchedId) : null;
                            const isDone = isExerciseDoneThisWeek(ex);
                            const isInlineOpen = inlineLoggingExercise === ex.name;
                            const isMenuOpen = openExerciseMenu?.dayIdx === dayIdx && openExerciseMenu?.exIdx === exIdx;
                            const exLogs = getExerciseLogsThisWeek(ex.name);

                            const formattedSummary = formatExerciseRow(ex);

                            return (
                              <div
                                key={exIdx}
                                className={`transition-all overflow-hidden ${
                                  isInlineOpen
                                    ? dayIdx === 0 
                                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30 my-1 rounded-xl'
                                      : 'bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30 my-1 rounded-xl'
                                    : 'hover:bg-white/[0.04]'
                                }`}
                                style={{ padding: '10px 6px' }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div 
                                    className="min-w-0 flex-1 cursor-pointer"
                                    onClick={() => handleToggleInlineLog(ex)}
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-white truncate block max-w-full">{ex.name}</span>
                                      {isDone && (
                                        <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          <span>Done</span>
                                        </span>
                                      )}
                                      {prevRecord && (
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                          dayIdx === 0
                                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                            : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                                        }`}>
                                          PR: {prevRecord.max1RM}k
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Line 2: formatted exercise details */}
                                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                      {formattedSummary}
                                    </span>

                                    {/* Primary muscle tags only (max 2) */}
                                    {Array.isArray((ex as any).muscles) && (ex as any).muscles.length > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        {(ex as any).muscles.slice(0, 2).map((m: string, mi: number) => (
                                          <span key={mi} className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 px-1.5 py-0.2 rounded">
                                            {m}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Muted Secondary Muscles line */}
                                    {Array.isArray((ex as any).secondaryMuscles) && (ex as any).secondaryMuscles.length > 0 && (
                                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        Also: {(ex as any).secondaryMuscles.join(', ')}
                                      </div>
                                    )}

                                    {/* Expandable Notes */}
                                    {(ex as any).notes && (
                                      <div className="text-[10px] text-amber-300/90 font-mono mt-0.5">
                                        Note: {(ex as any).notes}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Mark Done quick toggle */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerLightHaptic();
                                        toggleMarkDone(ex.name);
                                      }}
                                      className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                        isDone
                                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                      }`}
                                      title={isDone ? "Mark incomplete" : "Mark done"}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Log set button (no plus sign) */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleInlineLog(ex)}
                                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                                        isInlineOpen
                                          ? dayIdx === 0 
                                            ? 'bg-amber-500 text-black shadow-md'
                                            : 'bg-cyan-400 text-black shadow-md'
                                          : dayIdx === 0
                                            ? 'bg-white/10 hover:bg-amber-500 hover:text-black text-white'
                                            : 'bg-white/10 hover:bg-cyan-400 hover:text-black text-white'
                                      }`}
                                    >
                                      {isInlineOpen ? <X className="w-3.5 h-3.5" /> : null}
                                      <span>{isInlineOpen ? 'Close' : 'Log set'}</span>
                                    </button>

                                    {/* ⋯ Three Dots Menu Button */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerLightHaptic();
                                          setOpenExerciseMenu(isMenuOpen ? null : { dayIdx, exIdx });
                                        }}
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                        title="Exercise options"
                                      >
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>

                                      {/* Dropdown Menu */}
                                      {isMenuOpen && (
                                        <div className="absolute right-0 top-8 z-30 w-36 rounded-2xl bg-slate-900 border border-white/20 shadow-xl p-1.5 space-y-0.5 text-xs animate-in fade-in duration-150">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingExercise({
                                                dayIdx,
                                                exIdx,
                                                name: ex.name,
                                                sets: String((ex as any).sets || '3'),
                                                reps: String((ex as any).reps_or_duration || '8'),
                                                weight: String((ex as any).weight || ''),
                                                notes: String((ex as any).notes || ''),
                                              });
                                              setOpenExerciseMenu(null);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white font-medium flex items-center gap-2 cursor-pointer"
                                          >
                                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Edit</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMoveExerciseState({ dayIdx, exIdx });
                                              setOpenExerciseMenu(null);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white font-medium flex items-center gap-2 cursor-pointer"
                                          >
                                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Move to day</span>
                                          </button>

                                          {exIdx > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleMoveExerciseUpDown(dayIdx, exIdx, 'up')}
                                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white font-medium flex items-center gap-2 cursor-pointer"
                                            >
                                              <ArrowUp className="w-3.5 h-3.5 text-slate-300" />
                                              <span>Move up</span>
                                            </button>
                                          )}

                                          {exIdx < dayExercises.length - 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleMoveExerciseUpDown(dayIdx, exIdx, 'down')}
                                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white font-medium flex items-center gap-2 cursor-pointer"
                                            >
                                              <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                                              <span>Move down</span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteExercise(dayIdx, exIdx)}
                                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 font-medium flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Remove</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* LIST LOGGED SETS UNDER EXERCISE */}
                                {exLogs.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                    <div className="text-[10px] font-mono text-slate-400">Logged This Week:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {exLogs.map((log, logIdx) => {
                                        const isTimed = isTimedExercise(ex);
                                        const displayWeight = isMetric ? log.weightKg : Math.round(units.kgToLbs(log.weightKg));
                                        const label = isTimed
                                          ? `Set ${logIdx + 1} · ${log.reps} sec`
                                          : log.weightKg === 0
                                            ? `Set ${logIdx + 1} · BW × ${log.reps}`
                                            : `Set ${logIdx + 1} · ${displayWeight} ${isMetric ? 'kg' : 'lbs'} × ${log.reps}`;

                                        return (
                                          <div
                                            key={log.id}
                                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300"
                                          >
                                            <span>{label}</span>
                                            <button
                                              type="button"
                                              onClick={() => onDeleteLift(log.id)}
                                              className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                              title="Delete set"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* MATCHED INLINE LOGGING FORM */}
                                {isInlineOpen && (
                                  <form
                                    onSubmit={(e) => handleSaveInlineSet(e, ex)}
                                    className="set-logging-card-expanded mt-2 p-3 bg-slate-950/90 rounded-xl border border-white/15 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150"
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-1.5">
                                      <span>Logging Set: {ex.name}</span>
                                      <span className="text-amber-300">
                                        {isTimedExercise(ex) ? 'Timed movement' : isBodyweightExercise(ex) ? 'Bodyweight movement' : 'Weighted movement'}
                                      </span>
                                    </div>

                                    {/* TIMED LOGGING */}
                                    {isTimedExercise(ex) ? (
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-cyan-400" />
                                          <span>Duration (seconds)</span>
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="3600"
                                          value={inlineDuration}
                                          onChange={(e) => setInlineDuration(parseInt(e.target.value, 10) || 1)}
                                          className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-cyan-400"
                                          required
                                          autoFocus
                                        />
                                      </div>
                                    ) : isBodyweightExercise(ex) ? (
                                      /* BODYWEIGHT LOGGING */
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-300 mb-1">Reps</label>
                                          <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={inlineReps}
                                            onChange={(e) => setInlineReps(parseInt(e.target.value, 10) || 1)}
                                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-amber-400"
                                            required
                                            autoFocus
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-300 mb-1">
                                            Added Weight ({isMetric ? 'kg' : 'lbs'}) <span className="text-slate-500 font-normal">(Optional)</span>
                                          </label>
                                          <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={inlineBodyweightAdded}
                                            onChange={(e) => setInlineBodyweightAdded(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-amber-400"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      /* WEIGHTED LOGGING */
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
                                            max="100"
                                            value={inlineReps}
                                            onChange={(e) => setInlineReps(parseInt(e.target.value, 10) || 1)}
                                            className="w-full bg-slate-900 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-sm font-mono font-bold outline-none focus:border-amber-400"
                                            required
                                          />
                                        </div>
                                      </div>
                                    )}

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
                                        <span>
                                          {isTimedExercise(ex)
                                            ? `Save Set (${inlineDuration} sec)`
                                            : isBodyweightExercise(ex)
                                              ? inlineBodyweightAdded > 0
                                                ? `Save Set (BW + ${inlineBodyweightAdded}${isMetric ? 'kg' : 'lbs'} × ${inlineReps})`
                                                : `Save Set (BW × ${inlineReps})`
                                              : `Save Set (${inlineWeight}${isMetric ? 'kg' : 'lbs'} × ${inlineReps})`}
                                        </span>
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
                  );
                })
              ) : (
                <div className="py-10 text-center space-y-3">
                  <Dumbbell className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                  <h4 className="text-base font-bold text-white">No Active Routine Loaded</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Use the AI Workout Routine Builder to paste and compile your first workout splits!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      triggerLightHaptic();
                      setActiveModal('ai-routine-builder');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Create Workout Split</span>
                  </button>
                </div>
              )}
            </div>

            {/* DRAWER FOOTER: ANCHORED PROMINENT 'DONE' BUTTON */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  setActiveModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GLASS CONFIRMATION MODAL: DELETE ACTIVE SPLIT */}
      {showDeleteSplitModal && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal modal-content liquid-glass-enabled bg-slate-900/80 border border-white/20 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black text-white">Delete Active Split?</h3>
              <button
                type="button"
                onClick={() => setShowDeleteSplitModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this workout split? This will remove the active split from your dashboard.
            </p>
            <p className="text-[11px] text-amber-300 font-mono">
              Note: All past workout logs, PR records, and statistics remain permanently retained.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSplitModal(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSplit}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow"
              >
                Delete split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXERCISE MODAL */}
      {editingExercise && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedExercise}
            className="glass-modal modal-content liquid-glass-enabled bg-slate-900/85 border border-white/20 rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black text-white">Edit Exercise</h3>
              <button
                type="button"
                onClick={() => setEditingExercise(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Exercise Name</label>
                <input
                  type="text"
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Sets</label>
                  <input
                    type="number"
                    min="0"
                    value={editingExercise.sets}
                    onChange={(e) => setEditingExercise({ ...editingExercise, sets: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Reps / Time</label>
                  <input
                    type="text"
                    value={editingExercise.reps}
                    onChange={(e) => setEditingExercise({ ...editingExercise, reps: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Weight</label>
                  <input
                    type="text"
                    value={editingExercise.weight}
                    onChange={(e) => setEditingExercise({ ...editingExercise, weight: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingExercise.notes}
                  onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                  placeholder="e.g. 5s hold, 2-3 sets"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingExercise(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD EXERCISE TO DAY MODAL */}
      {addingExerciseDayIdx !== null && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAddExerciseSubmit}
            className="glass-modal modal-content liquid-glass-enabled bg-slate-900/85 border border-white/20 rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black text-white">
                Add Exercise to {aiWorkoutAnalysis?.parsedDays?.[addingExerciseDayIdx]?.dayTitle || 'Day'}
              </h3>
              <button
                type="button"
                onClick={() => setAddingExerciseDayIdx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Exercise Name</label>
                <input
                  type="text"
                  value={addExName}
                  onChange={(e) => setAddExName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-400"
                  placeholder="e.g. Incline Dumbbell Press"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Sets</label>
                  <input
                    type="number"
                    min="0"
                    value={addExSets}
                    onChange={(e) => setAddExSets(e.target.value)}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Reps / Time</label>
                  <input
                    type="text"
                    value={addExReps}
                    onChange={(e) => setAddExReps(e.target.value)}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                    placeholder="8 or 30 sec"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Weight</label>
                  <input
                    type="text"
                    value={addExWeight}
                    onChange={(e) => setAddExWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                    placeholder="e.g. 20 kg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={addExNotes}
                  onChange={(e) => setAddExNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddingExerciseDayIdx(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow"
              >
                Add Exercise
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENAME DAY MODAL */}
      {renamingDayIdx !== null && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameDaySubmit}
            className="glass-modal modal-content liquid-glass-enabled bg-slate-900/85 border border-white/20 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black text-white">Rename Day</h3>
              <button
                type="button"
                onClick={() => setRenamingDayIdx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Day Name</label>
              <input
                type="text"
                value={renamingDayTitle}
                onChange={(e) => setRenamingDayTitle(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-400"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingDayIdx(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MOVE EXERCISE TO DAY MODAL */}
      {moveExerciseState !== null && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal modal-content liquid-glass-enabled bg-slate-900/85 border border-white/20 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-base font-black text-white">Move to Day</h3>
              <button
                type="button"
                onClick={() => setMoveExerciseState(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select the day you want to move this exercise to:
            </p>

            <div className="space-y-1.5 pt-1">
              {(aiWorkoutAnalysis?.parsedDays || []).map((d, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  disabled={dIdx === moveExerciseState.dayIdx}
                  onClick={() => handleMoveExerciseToDay(dIdx)}
                  className={`w-full p-2.5 rounded-xl text-left font-bold text-xs transition-colors flex items-center justify-between ${
                    dIdx === moveExerciseState.dayIdx
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  }`}
                >
                  <span>{d.dayTitle}</span>
                  {dIdx === moveExerciseState.dayIdx ? (
                    <span className="text-[10px] text-slate-500 font-mono">Current Day</span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMoveExerciseState(null)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: MUSCLE RATING PODIUM DRAWER */}
      {activeModal === 'muscle-ratings' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Top Muscle Rating Podium</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  setActiveModal(null);
                }}
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
                      triggerLightHaptic();
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
              onClick={() => {
                triggerLightHaptic();
                setActiveModal(null);
              }}
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
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Daily Highlights & Real-Time Telemetry</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  setActiveModal(null);
                }}
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
                              onClick={() => {
                                triggerLightHaptic();
                                onDeleteLift(lift.id);
                              }}
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
              onClick={() => {
                triggerLightHaptic();
                setActiveModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: PERSONAL RECORDS (PR TROPHY CABINET) */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Personal Record (PR) Trophy Cabinet</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  setActiveModal(null);
                }}
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
                    Log your workout sets to unlock your trophy cabinet and automatically track new PRs.
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
                            onClick={() => {
                              triggerLightHaptic();
                              onDeleteLift(rec.id);
                            }}
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
              onClick={() => {
                triggerLightHaptic();
                setActiveModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD CUSTOM EXERCISE */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-modal modal-content dialog-sheet liquid-glass-enabled bg-slate-900/60 border border-white/25 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Create Custom Exercise</h3>
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  setShowAddCustomModal(false);
                }}
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
                  onClick={() => {
                    triggerLightHaptic();
                    setShowAddCustomModal(false);
                  }}
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

      {/* AIRoutineBuilderModal POPUP */}
      <AIRoutineBuilderModal
        isOpen={activeModal === 'ai-routine-builder'}
        onClose={() => setActiveModal(null)}
        profile={profile}
        onUpdateRoutine={onUpdateRoutine}
      />
    </div>
  );
};
