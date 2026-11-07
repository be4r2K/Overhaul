import React, { useState } from 'react';
import { Dumbbell, AlertCircle, CheckCircle2, RotateCcw, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { useRoutine } from '../context/RoutineContext';
import { UserProfile } from '../types/fitness';
import { triggerLightHaptic } from '../utils/audio';
import { syncRoutinesToCloud } from '../utils/cloudSyncService';
import { getActiveUserUid } from '../utils/storage';
import { parseWorkoutTextFormatAgnostic, formatExerciseRow, ParseResult, ParsedExerciseItem } from '../utils/workoutParser';
import { parseRoutineWithAI } from '../utils/geminiService';

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
  const [splitTitle, setSplitTitle] = useState('Workout');

  // Exercise editing state in Preview
  const [editingItem, setEditingItem] = useState<{ dayIdx: number; exIdx: number; ex: ParsedExerciseItem } | null>(null);
  const [isAddingExerciseToDay, setIsAddingExerciseToDay] = useState<number | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState('3');
  const [newExReps, setNewExReps] = useState('8-10');
  const [newExWeight, setNewExWeight] = useState('');
  const [newExNotes, setNewExNotes] = useState('');

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
      // 1. First parse locally with precision deterministic parser
      const localResult = parseWorkoutTextFormatAgnostic(rawText, profile.units === 'imperial' ? 'lbs' : 'kg');

      // 2. Try calling client-side Gemini if API key is present
      try {
        const aiParsed = await parseRoutineWithAI(rawText, profile.goal, profile.weightKg);
        if (aiParsed && Array.isArray(aiParsed.parsedDays) && aiParsed.parsedDays.length > 0) {
          const totalEx = aiParsed.parsedDays.reduce((sum: number, d: any) => sum + (d.exercises?.length || 0), 0);
          setPreviewResult({
            splitName: aiParsed.splitName || 'Workout',
            parsedDays: aiParsed.parsedDays.map((d: any) => ({
              dayTitle: d.dayTitle || 'Day',
              focus: '',
              exercises: Array.isArray(d.exercises) ? d.exercises.map((e: any) => ({
                name: e.name || 'Exercise',
                sets: String(e.sets ?? '0'),
                reps_or_duration: String(e.reps_or_duration || e.reps || ''),
                weight: String(e.weight || ''),
                notes: String(e.notes || ''),
                muscles: Array.isArray(e.muscles) ? e.muscles : [],
                secondaryMuscles: Array.isArray(e.secondaryMuscles) ? e.secondaryMuscles : [],
                flagged: !!e.flagged,
              })) : []
            })),
            totalExercises: totalEx,
            summaryTitle: 'Workout',
            sanityHint: localResult.sanityHint,
          });
          setSplitTitle('Workout');
          setLoading(false);
          return;
        }
      } catch {
        // Fallback directly to precision local parser result
      }

      setPreviewResult(localResult);
      setSplitTitle(localResult.splitName || 'Workout');
    } catch (err: any) {
      console.warn('Workout parse fallback error:', err);
      const localResult = parseWorkoutTextFormatAgnostic(rawText, profile.units === 'imperial' ? 'lbs' : 'kg');
      setPreviewResult(localResult);
      setSplitTitle(localResult.splitName || 'Workout');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = () => {
    if (!previewResult) return;
    triggerLightHaptic();

    const formattedDays = previewResult.parsedDays.map((d) => ({
      dayTitle: d.dayTitle,
      focus: '', // Remove invented day subtitles
      exercises: d.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets || '0',
        reps_or_duration: ex.reps_or_duration || '',
        weight: ex.weight || '',
        setsReps: formatExerciseRow(ex),
        targetMuscle: ex.muscles?.[0] || '',
        notes: ex.notes || '',
        muscles: ex.muscles || [],
        secondaryMuscles: ex.secondaryMuscles || [],
        flagged: !!ex.flagged,
      })),
    }));

    const finalSplitName = splitTitle.trim() || 'Workout';

    const formattedResult = {
      splitName: finalSplitName,
      summaryTitle: finalSplitName,
      parsedDays: formattedDays,
      analyzedAt: new Date().toISOString(),
    };

    const newRoutine = {
      id: `routine-${Date.now()}`,
      splitName: finalSplitName,
      summaryTitle: finalSplitName,
      parsedDays: formattedDays,
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

  // Row update in preview
  const handleSaveExerciseEdit = () => {
    if (!editingItem || !previewResult) return;
    const { dayIdx, exIdx, ex } = editingItem;
    const updatedDays = [...previewResult.parsedDays];
    updatedDays[dayIdx].exercises[exIdx] = { ...ex };
    setPreviewResult({
      ...previewResult,
      parsedDays: updatedDays,
    });
    setEditingItem(null);
  };

  const handleDeleteExercise = (dayIdx: number, exIdx: number) => {
    if (!previewResult) return;
    const updatedDays = [...previewResult.parsedDays];
    updatedDays[dayIdx].exercises.splice(exIdx, 1);
    const newTotal = updatedDays.reduce((sum, d) => sum + d.exercises.length, 0);
    setPreviewResult({
      ...previewResult,
      parsedDays: updatedDays,
      totalExercises: newTotal,
    });
    setEditingItem(null);
  };

  const handleAddNewExercise = (dayIdx: number) => {
    if (!newExName.trim() || !previewResult) return;
    const updatedDays = [...previewResult.parsedDays];
    const newEx: ParsedExerciseItem = {
      name: newExName.trim(),
      sets: newExSets || '0',
      reps_or_duration: newExReps.trim(),
      weight: newExWeight.trim(),
      notes: newExNotes.trim(),
      muscles: [],
      secondaryMuscles: [],
    };
    updatedDays[dayIdx].exercises.push(newEx);
    const newTotal = updatedDays.reduce((sum, d) => sum + d.exercises.length, 0);
    setPreviewResult({
      ...previewResult,
      parsedDays: updatedDays,
      totalExercises: newTotal,
    });
    setNewExName('');
    setNewExSets('3');
    setNewExReps('8-10');
    setNewExWeight('');
    setNewExNotes('');
    setIsAddingExerciseToDay(null);
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
        {/* Borderless ✕ close button */}
        <button
          type="button"
          onClick={() => {
            triggerLightHaptic();
            onClose();
          }}
          className="modal-close-btn absolute top-4 right-4 cursor-pointer flex items-center justify-center text-white/80 hover:text-white transition-colors"
          title="Close modal"
        >
          <span className="text-xl font-light leading-none">✕</span>
        </button>

        {/* STEP 1: PASTING RAW TEXT */}
        {!previewResult && (
          <>
            <div className="flex items-center gap-2.5 mb-2 pr-8">
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
                placeholder="Day 1: HEAVY PRESSING, PULLING & ABS&#10;1. Incline Barbell Press (58.5 kg - 8 reps)&#10;2. Pull-Ups (Bodyweight - 8 Reps/10 kg - 4 reps)..."
                rows={8}
                disabled={loading}
                className="w-full rounded-2xl p-3 text-sm text-white placeholder-slate-400 bg-white/5 border border-white/15 focus:outline-none focus:border-amber-500 font-sans resize-none"
              />

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Importer footer has only the "Generate Routine" button */}
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

        {/* STEP 2: PREVIEW SCREEN */}
        {previewResult && (
          <div className="space-y-3.5">
            {/* Header: Title and under title "2 days · 15 exercises" (No overlapping pill, no parsed day box) */}
            <div className="border-b border-white/10 pb-2.5 pr-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  className="bg-transparent text-base font-black text-white outline-none border-b border-transparent focus:border-white/30 truncate"
                  placeholder="Workout"
                />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5 pl-6">
                {previewResult.parsedDays.length} days · {previewResult.totalExercises} exercises
              </p>
            </div>

            {/* Sanity hint banner if list line count differed */}
            {previewResult.sanityHint && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{previewResult.sanityHint}</span>
              </div>
            )}

            {/* Scrollable Days & Exercises List */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
              {previewResult.parsedDays.map((day, dIdx) => (
                <div key={dIdx} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                  {/* Day header: shows exact dayTitle and only "{count} exercises" */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{day.dayTitle}</h4>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{day.exercises.length} exercises</span>
                  </div>

                  {/* Exercises Rows */}
                  <div className="space-y-1.5">
                    {day.exercises.map((ex, eIdx) => {
                      const rowText = formatExerciseRow(ex);

                      return (
                        <div
                          key={eIdx}
                          onClick={() => setEditingItem({ dayIdx: dIdx, exIdx: eIdx, ex: { ...ex } })}
                          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between text-xs cursor-pointer group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate block">{ex.name}</span>
                              <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                              {rowText}
                            </span>
                            {ex.notes && (
                              <span className="text-[10px] text-amber-300/80 font-mono block">
                                Note: {ex.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Exercise Per Day Button */}
                  {isAddingExerciseToDay === dIdx ? (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/15 space-y-2 mt-2">
                      <span className="text-[10px] font-bold text-white uppercase block">Add Exercise to {day.dayTitle}</span>
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        className="w-full bg-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none border border-white/10"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Sets (e.g. 3)"
                          value={newExSets}
                          onChange={(e) => setNewExSets(e.target.value)}
                          className="bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/10"
                        />
                        <input
                          type="text"
                          placeholder="Reps (e.g. 8-10)"
                          value={newExReps}
                          onChange={(e) => setNewExReps(e.target.value)}
                          className="bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/10"
                        />
                        <input
                          type="text"
                          placeholder="Weight"
                          value={newExWeight}
                          onChange={(e) => setNewExWeight(e.target.value)}
                          className="bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/10"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={newExNotes}
                        onChange={(e) => setNewExNotes(e.target.value)}
                        className="w-full bg-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none border border-white/10"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingExerciseToDay(null)}
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNewExercise(dIdx)}
                          className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingExerciseToDay(dIdx)}
                      className="w-full py-1.5 rounded-lg border border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add exercise</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Edit Exercise Modal / Inline Sheet */}
            {editingItem && (
              <div className="p-3 rounded-2xl bg-slate-900/95 border border-white/20 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-xs font-bold text-white">Edit Exercise</span>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Name</label>
                  <input
                    type="text"
                    value={editingItem.ex.name}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        ex: { ...editingItem.ex, name: e.target.value },
                      })
                    }
                    className="w-full bg-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none border border-white/15"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Sets</label>
                    <input
                      type="text"
                      value={editingItem.ex.sets}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          ex: { ...editingItem.ex, sets: e.target.value },
                        })
                      }
                      className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/15"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Reps/Dur</label>
                    <input
                      type="text"
                      value={editingItem.ex.reps_or_duration}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          ex: { ...editingItem.ex, reps_or_duration: e.target.value },
                        })
                      }
                      className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/15"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Weight</label>
                    <input
                      type="text"
                      value={editingItem.ex.weight}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          ex: { ...editingItem.ex, weight: e.target.value },
                        })
                      }
                      className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none border border-white/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Notes</label>
                  <input
                    type="text"
                    value={editingItem.ex.notes}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        ex: { ...editingItem.ex, notes: e.target.value },
                      })
                    }
                    className="w-full bg-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none border border-white/15"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(editingItem.dayIdx, editingItem.exIdx)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExerciseEdit}
                      className="px-3.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BUTTONS ON ONE LINE: "Edit text" and "Save split" */}
            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit text</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 px-4 rounded-xl text-black font-black text-xs shadow-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary, #10b981)' }}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Save split</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRoutineBuilderModal;
