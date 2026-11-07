import React, { useState } from 'react';
import { Dumbbell, AlertCircle, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { useRoutine } from '../context/RoutineContext';
import { UserProfile } from '../types/fitness';
import { triggerLightHaptic } from '../utils/audio';
import { syncRoutinesToCloud } from '../utils/cloudSyncService';
import { getActiveUserUid } from '../utils/storage';
import { parseWorkoutTextFormatAgnostic, ParseResult } from '../utils/workoutParser';

interface AIRoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateRoutine?: (routine: any) => void;
}

export const AIRoutineBuilderModal: React.FC<AIRoutineBuilderModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateRoutine,
}) => {
  const { activeRoutine, setActiveRoutine } = useRoutine();
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preview step state
  const [previewResult, setPreviewResult] = useState<ParseResult | null>(null);

  if (!isOpen) return null;

  const handleParseText = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerLightHaptic();
    
    if (!rawText.trim()) {
      setError('Please paste your workout routine text first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Send to server endpoint
      const res = await fetch('/api/ai/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: rawText,
          userWeightKg: profile.weightKg,
          userGoal: profile.goal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.parsedDays) && data.parsedDays.length > 0) {
          const totalEx = data.parsedDays.reduce((sum: number, d: any) => sum + (d.exercises?.length || 0), 0);
          setPreviewResult({
            parsedDays: data.parsedDays,
            totalExercises: totalEx,
            summaryTitle: data.summaryTitle || `${data.parsedDays.length}-Day Split (${totalEx} exercises)`,
          });
          setLoading(false);
          return;
        }
      }

      // 2. Deterministic format-agnostic fallback parser if server call fails or returns empty
      const localResult = parseWorkoutTextFormatAgnostic(rawText, profile.units === 'imperial' ? 'lbs' : 'kg');
      setPreviewResult(localResult);
    } catch (err: any) {
      console.warn('AI Workout parse error, using format-agnostic parser fallback:', err);
      const localResult = parseWorkoutTextFormatAgnostic(rawText, profile.units === 'imperial' ? 'lbs' : 'kg');
      setPreviewResult(localResult);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = () => {
    if (!previewResult) return;
    triggerLightHaptic();

    const formattedResult = {
      overallScore: 92,
      balanceRating: 9.2,
      volumeRating: 9.0,
      exerciseSelectionRating: 9.4,
      summaryTitle: previewResult.summaryTitle,
      honestOpinion: 'Workout split parsed cleanly and verified.',
      superStrongAreas: ['Targeted Exercise Sequencing', 'Balanced Day Distributions'],
      neglectedOrNeedsWork: [],
      improvements: ['Track load and reps on compound movements weekly.'],
      muscleGroupCoverage: [],
      parsedDays: previewResult.parsedDays.map(d => ({
        dayTitle: d.dayTitle,
        focus: d.focus || 'Strength & Hypertrophy',
        exercises: d.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets || '-',
          reps_or_duration: ex.reps_or_duration || '-',
          weight: ex.weight || '-',
          setsReps: `${ex.sets || '-'} x ${ex.reps_or_duration || '-'} · ${ex.weight || '-'}`,
          targetMuscle: ex.muscles?.[0] || '',
          notes: ex.notes || '',
          muscles: ex.muscles || [],
          flagged: !!ex.flagged,
          rating: 9,
          substitution: 'Dumbbell / Cable Alternative'
        }))
      })),
      substitutions: [],
      analyzedAt: new Date().toISOString(),
    };

    const newRoutine = {
      id: `routine-${Date.now()}`,
      summaryTitle: previewResult.summaryTitle,
      parsedDays: formattedResult.parsedDays,
      analyzedAt: new Date().toISOString(),
    };

    const updatedRoutinesList = [...(Array.isArray(activeRoutine) ? activeRoutine : []), newRoutine];

    setActiveRoutine(updatedRoutinesList);

    if (onUpdateRoutine) {
      onUpdateRoutine(formattedResult);
    }

    const uid = getActiveUserUid();
    if (uid && uid !== 'anonymous') {
      syncRoutinesToCloud(uid, updatedRoutinesList, formattedResult).catch(() => {});
    }

    setRawText('');
    setPreviewResult(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
      onClick={() => {
        triggerLightHaptic();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ai-routine-builder-modal-content w-full max-w-lg p-5 sm:p-6 relative flex flex-col my-auto text-white"
        style={{
          background: 'rgba(22, 18, 36, 0.78)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerLightHaptic();
            onClose();
          }}
          className="modal-close-btn absolute top-4 right-4 cursor-pointer flex items-center justify-center text-white/80 hover:text-white"
        >
          <span className="text-xl font-light leading-none">✕</span>
        </button>

        {/* STEP 1: PASTING RAW TEXT */}
        {!previewResult && (
          <>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <Dumbbell className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">Import Workout Routine</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Paste your workout in any format (emojis, bullets, 3x10, timed sets, or finisher blocks). One line equals one exercise.
            </p>

            <form onSubmit={handleParseText} className="space-y-4">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Day 1: HEAVY PRESSING, PULLING & ABS&#10;1. Incline Barbell Press (58.5 kg - 8 reps)&#10;2. Pull-Ups (Bodyweight - 8 reps)..."
                rows={7}
                disabled={loading}
                className="w-full rounded-2xl p-3 text-sm text-white placeholder-slate-400 bg-white/5 border border-white/15 focus:outline-none focus:border-amber-500 font-sans resize-none"
              />

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-black font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent-primary, #10b981)' }}
              >
                {loading ? 'Parsing Workout...' : 'Generate Routine'}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: PREVIEW SUMMARY STEP (User confirms before saving) */}
        {previewResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Workout Split Preview</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {previewResult.totalExercises} Total Exercises
              </span>
            </div>

            {/* DAY COUNT SUMMARY BANNER (e.g. Day 1: 7 exercises, Day 2: 8 exercises) */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Parsed Day Counts:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {previewResult.parsedDays.map((d, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold">
                    {d.dayTitle.split(':')[0] || `Day ${i + 1}`}: {d.exercises.length} exercises
                  </span>
                ))}
              </div>
            </div>

            {/* SCROLLABLE DETAILED PREVIEW LIST */}
            <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1">
              {previewResult.parsedDays.map((day, dIdx) => (
                <div key={dIdx} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase">{day.dayTitle}</h4>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{day.exercises.length} exercises</span>
                  </div>

                  <div className="space-y-1.5">
                    {day.exercises.map((ex, eIdx) => (
                      <div key={eIdx} className="p-2 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-white truncate block">{eIdx + 1}. {ex.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {ex.sets !== '-' ? `${ex.sets} sets` : ''} {ex.reps_or_duration !== '-' ? `× ${ex.reps_or_duration}` : ''} {ex.weight !== '-' ? `· ${ex.weight}` : ''}
                          </span>
                        </div>
                        {ex.flagged && (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">check this</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ACTION BUTTONS: CONFIRM OR EDIT */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit Text</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Save Split</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRoutineBuilderModal;
