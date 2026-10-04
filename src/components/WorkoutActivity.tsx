import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Flame,
  Star,
  Footprints,
  Bike,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { WorkoutLog, WorkoutExercise, ExerciseSet } from '../types';

interface WorkoutActivityProps {
  workouts: WorkoutLog[];
  onAddWorkout: (workout: WorkoutLog) => void;
  onDeleteWorkout: (id: string) => void;
}

export const WorkoutActivity: React.FC<WorkoutActivityProps> = ({
  workouts,
  onAddWorkout,
  onDeleteWorkout,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<WorkoutLog['sportCategory']>('Strength');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formCalories, setFormCalories] = useState<number>(450);
  const [formRpe, setFormRpe] = useState<number>(8.0);
  const [formRating, setFormRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [formNotes, setFormNotes] = useState('');

  // Exercises builder for strength sessions
  const [formExercises, setFormExercises] = useState<WorkoutExercise[]>([
    {
      id: 'ex-1',
      name: 'Barbell Back Squat',
      category: 'Legs',
      sets: [
        { setNumber: 1, reps: 8, weight: 100, completed: true, rpe: 7.5 },
        { setNumber: 2, reps: 6, weight: 120, completed: true, rpe: 8.5 },
      ],
    },
  ]);

  const handleAddExercise = () => {
    setFormExercises([
      ...formExercises,
      {
        id: 'ex-' + Date.now(),
        name: 'New Exercise',
        category: 'Strength',
        sets: [{ setNumber: 1, reps: 10, weight: 60, completed: true, rpe: 8 }],
      },
    ]);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...formExercises];
    const sets = updated[exerciseIndex].sets;
    const lastSet = sets[sets.length - 1] || { reps: 8, weight: 60, rpe: 8 };
    sets.push({
      setNumber: sets.length + 1,
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: true,
      rpe: lastSet.rpe,
    });
    setFormExercises(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newWorkout: WorkoutLog = {
      id: 'wo-' + Date.now(),
      title: formTitle.trim(),
      date: formDate,
      sportCategory: formCategory,
      durationMinutes: formDuration,
      caloriesBurned: formCalories,
      rpeAverage: formRpe,
      rating: formRating,
      notes: formNotes.trim() || undefined,
      exercises: formCategory === 'Strength' ? formExercises : [],
    };

    onAddWorkout(newWorkout);
    setShowModal(false);
    setFormTitle('');
    setFormNotes('');
  };

  const filteredWorkouts = workouts.filter((w) => {
    if (filterCategory === 'All') return true;
    return w.sportCategory === filterCategory;
  });

  const totalMinutes = workouts.reduce((a, b) => a + (b.durationMinutes || 0), 0);
  const totalCalories = workouts.reduce((a, b) => a + (b.caloriesBurned || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Workout & Activity Command Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Log athletic sessions, track sets/reps/load volume, and review aerobic exertion.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-cyan-950 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Session</span>
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Training Volume</span>
          <div className="text-3xl font-black text-white font-mono">{workouts.length} <span className="text-sm text-zinc-400">Sessions</span></div>
          <div className="text-xs text-cyan-400 font-medium">Logged in Overhaul</div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Accumulated Duration</span>
          <div className="text-3xl font-black text-white font-mono">{Math.round((totalMinutes / 60) * 10) / 10} <span className="text-sm text-zinc-400">Hours</span></div>
          <div className="text-xs text-zinc-400 font-mono">{totalMinutes} active minutes</div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Caloric Expenditure</span>
          <div className="text-3xl font-black text-white font-mono">{totalCalories.toLocaleString()} <span className="text-sm text-zinc-400">kcal</span></div>
          <div className="text-xs text-orange-400 font-medium">Estimated Metabolic Burn</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 text-xs font-semibold">
        {['All', 'Strength', 'Running', 'Cycling', 'HIIT', 'Calisthenics', 'Mobility'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              filterCategory === cat
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-500 text-sm">
            No workouts found in this category. Click "Log New Session" to record your workout.
          </div>
        ) : (
          filteredWorkouts.map((w) => {
            const isExpanded = expandedWorkoutId === w.id;
            return (
              <div
                key={w.id}
                className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                      {w.sportCategory === 'Strength' ? (
                        <Dumbbell className="w-6 h-6 text-emerald-400" />
                      ) : w.sportCategory === 'Running' ? (
                        <Footprints className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <Bike className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-zinc-100">{w.title}</h3>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                          {w.sportCategory}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
                        <span>{w.date}</span>
                        <span>•</span>
                        <span>{w.durationMinutes} mins</span>
                        <span>•</span>
                        <span>{w.caloriesBurned || 400} kcal</span>
                        <span>•</span>
                        <span className="text-zinc-300">RPE {w.rpeAverage || 8.0}</span>
                      </div>
                      {w.notes && (
                        <p className="text-xs text-zinc-400 mt-2 italic font-sans">{w.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {w.exercises && w.exercises.length > 0 && (
                      <button
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <span>{w.exercises.length} Exercises</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteWorkout(w.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                      title="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Exercise Breakdown */}
                {isExpanded && w.exercises && (
                  <div className="bg-zinc-950/60 p-5 border-t border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Exercise Breakdown & Set Log
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {w.exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-200">{ex.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{ex.category}</span>
                          </div>
                          <div className="space-y-1">
                            {ex.sets.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-zinc-950/40 px-2.5 py-1.5 rounded"
                              >
                                <span>Set {s.setNumber}:</span>
                                <span className="font-bold text-zinc-200">
                                  {s.weight} kg × {s.reps} reps
                                </span>
                                <span className="text-[10px] text-emerald-400">RPE {s.rpe || 8}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                <span>Log Training Session</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Session Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Heavy Lower Body Power"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Running">Running</option>
                    <option value="Cycling">Cycling</option>
                    <option value="HIIT">HIIT</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Calisthenics">Calisthenics</option>
                    <option value="Mobility">Mobility</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Calories Burned</label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={(e) => setFormCalories(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Average RPE (1-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={formRpe}
                    onChange={(e) => setFormRpe(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Session Rating (1-5)</label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(parseInt(e.target.value, 10) as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Phenomenal</option>
                    <option value="4">⭐⭐⭐⭐ Solid</option>
                    <option value="3">⭐⭐⭐ Standard</option>
                    <option value="2">⭐⭐ Tough / Sluggish</option>
                    <option value="1">⭐ Bad / Fatigued</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Notes & Reflections</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Technique cues, pump, equipment used..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition"
                >
                  Save Workout Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
