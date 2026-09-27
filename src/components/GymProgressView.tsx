import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dumbbell, 
  Trophy, 
  Flame, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Target,
  BarChart2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Exercise, ExerciseCategory, LiftRecord, UserProfile } from '../types/fitness';
import { calculate1RM, units } from '../utils/calculations';
import { playPRFanfare } from '../utils/audio';

interface GymProgressViewProps {
  profile: UserProfile;
  exercises: Exercise[];
  liftRecords: LiftRecord[];
  onAddLift: (lift: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => void;
  onDeleteLift: (id: string) => void;
  onAddCustomExercise: (name: string, category: ExerciseCategory) => void;
  onOpenTimer: () => void;
}

export const GymProgressView: React.FC<GymProgressViewProps> = ({
  profile,
  exercises,
  liftRecords,
  onAddLift,
  onDeleteLift,
  onAddCustomExercise,
  onOpenTimer,
}) => {
  const isMetric = profile.units === 'metric';

  // Calculator form state
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('bench-press');
  const [inputWeight, setInputWeight] = useState<number>(100);
  const [inputReps, setInputReps] = useState<number>(5);
  const [inputRpe, setInputRpe] = useState<number>(8.5);
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputNotes, setInputNotes] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('chest');

  // Convert input weight to KG for calculations
  const weightKg = isMetric ? inputWeight : units.lbsToKg(inputWeight);

  // Real-time 1RM calculations
  const rmBreakdown = calculate1RM(weightKg, inputReps);

  // Selected exercise info
  const currentExercise = exercises.find((e) => e.id === selectedExerciseId) || exercises[0];

  // Current PR for selected exercise
  const existingRecordsForExercise = liftRecords.filter((r) => r.exerciseId === selectedExerciseId);
  const currentPR = existingRecordsForExercise.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  const willBePR = rmBreakdown.average > currentPR;

  // Handle Save Lift
  const handleSaveLift = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0 || inputReps <= 0) return;

    if (willBePR) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
      playPRFanfare();
    }

    onAddLift({
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      weightKg: Number(weightKg.toFixed(1)),
      reps: inputReps,
      rpe: inputRpe,
      date: inputDate,
      notes: inputNotes,
    });

    setInputNotes('');
  };

  // Big 3 Calculation (Bench + Squat + Deadlift)
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };

  const benchPR = getBest1RM('bench-press');
  const squatPR = getBest1RM('back-squat');
  const deadliftPR = getBest1RM('deadlift');
  const ohpPR = getBest1RM('overhead-press');
  const bigThreeTotalKg = benchPR + squatPR + deadliftPR;
  const bigThreeTotalLbs = units.kgToLbs(bigThreeTotalKg);
  const strengthRatio = profile.weightKg > 0 ? (bigThreeTotalKg / profile.weightKg).toFixed(2) : '0';

  // Filtered lift records
  const filteredRecords = liftRecords.filter((r) => {
    if (filterCategory === 'all') return true;
    const ex = exercises.find((e) => e.id === r.exerciseId);
    return ex?.category === filterCategory;
  });

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustomExercise(customName.trim(), customCategory);
    setCustomName('');
    setShowAddCustomModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Gym Progress & 1-Rep Max Engine
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Log Max Weight & Reps</span>
            <span aria-hidden="true">·</span>
            <span>Multi-formula 1RM</span>
            <span aria-hidden="true">·</span>
            <span>PR Trophy Board</span>
            <span aria-hidden="true">·</span>
            <span>Big 3 Total: <strong className="text-emerald-400 font-mono tabular-nums">{isMetric ? `${bigThreeTotalKg} kg` : `${bigThreeTotalLbs} lbs`}</strong> ({strengthRatio}x Bodyweight)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTimer}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rest Timer</span>
          </button>
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Exercise</span>
          </button>
        </div>
      </div>

      {/* PR Trophy Shelf Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Personal Record (PR) Trophy Shelf</h2>
          </div>
          <div className="text-xs text-slate-400">
            Big 3 Power Score: <strong className="text-emerald-400 font-mono tabular-nums">{strengthRatio}x BW</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Bench Press */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bench Press</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
              {benchPR > 0 ? (isMetric ? `${benchPR} kg` : `${units.kgToLbs(benchPR)} lbs`) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {benchPR > 0 ? `${(benchPR / profile.weightKg).toFixed(2)}x Bodyweight` : 'No lift recorded'}
            </div>
          </div>

          {/* Back Squat */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Back Squat</div>
            <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1 tabular-nums">
              {squatPR > 0 ? (isMetric ? `${squatPR} kg` : `${units.kgToLbs(squatPR)} lbs`) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {squatPR > 0 ? `${(squatPR / profile.weightKg).toFixed(2)}x Bodyweight` : 'No lift recorded'}
            </div>
          </div>

          {/* Deadlift */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deadlift</div>
            <div className="text-2xl font-extrabold font-mono text-violet-400 mt-1 tabular-nums">
              {deadliftPR > 0 ? (isMetric ? `${deadliftPR} kg` : `${units.kgToLbs(deadliftPR)} lbs`) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {deadliftPR > 0 ? `${(deadliftPR / profile.weightKg).toFixed(2)}x Bodyweight` : 'No lift recorded'}
            </div>
          </div>

          {/* Overhead Press */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overhead Press</div>
            <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1 tabular-nums">
              {ohpPR > 0 ? (isMetric ? `${ohpPR} kg` : `${units.kgToLbs(ohpPR)} lbs`) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {ohpPR > 0 ? `${(ohpPR / profile.weightKg).toFixed(2)}x Bodyweight` : 'No lift recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 1RM Calculator & Live Percentages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Log Maximum Lift & Reps</h2>
              </div>
              {willBePR && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  New PR!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveLift} className="space-y-4">
              {/* Exercise Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exercise</label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none cursor-pointer"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Lifted & Reps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Weight ({isMetric ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={inputWeight}
                    onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-base font-mono text-white tabular-nums focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reps Completed</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="30"
                    value={inputReps}
                    onChange={(e) => setInputReps(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-base font-mono text-white tabular-nums focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Quick Rep Buttons */}
              <div className="flex items-center gap-1.5">
                {[1, 3, 5, 8, 10, 12].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInputReps(r)}
                    className={`flex-1 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      inputReps === r
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {r} rep{r > 1 ? 's' : ''}
                  </button>
                ))}
              </div>

              {/* RPE & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">RPE (Effort)</label>
                    <span className="text-xs font-mono text-slate-400 font-semibold">{inputRpe} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="10"
                    step="0.5"
                    value={inputRpe}
                    onChange={(e) => setInputRpe(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {inputRpe === 10 ? 'Max effort (0 RIR)' : inputRpe >= 9 ? 'Heavy (~1 RIR)' : 'Controlled (~2-3 RIR)'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Set Notes / Cues</label>
                <input
                  type="text"
                  placeholder="e.g. Paused on chest, felt explosive"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Lift & Update 1RM</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Calculated 1RM Breakdown & Percentages (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main 1RM Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Calculated 1-Rep Max</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{currentExercise.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Current All-Time PR:</span>
                <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  {currentPR > 0 ? (isMetric ? `${currentPR} kg` : `${units.kgToLbs(currentPR)} lbs`) : 'None yet'}
                </div>
              </div>
            </div>

            {/* Big 1RM Result */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5">
                <div className="text-[11px] text-emerald-400 font-medium">Estimated 1RM (Average)</div>
                <div className="text-3xl font-extrabold font-mono text-white mt-1 tabular-nums">
                  {isMetric ? `${rmBreakdown.average} kg` : `${units.kgToLbs(rmBreakdown.average)} lbs`}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Multi-equation consensus</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 font-medium">Brzycki Formula</div>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1 tabular-nums">
                  {isMetric ? `${rmBreakdown.brzycki} kg` : `${units.kgToLbs(rmBreakdown.brzycki)} lbs`}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Standard strength model</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 font-medium">Epley Formula</div>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1 tabular-nums">
                  {isMetric ? `${rmBreakdown.epley} kg` : `${units.kgToLbs(rmBreakdown.epley)} lbs`}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Powerlifting benchmark</div>
              </div>
            </div>

            {/* Training Load Percentages Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Working Weight Target Percentages</span>
                <span className="text-[11px] text-slate-400">Based on {rmBreakdown.average} kg 1RM</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {rmBreakdown.percentages.slice(0, 5).map((p) => (
                  <div key={p.percent} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <div className="text-[11px] font-bold text-emerald-400">{p.percent}% 1RM</div>
                    <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                      {isMetric ? `${p.weightKg} kg` : `${p.weightLbs} lbs`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.repsRange}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {rmBreakdown.percentages.slice(5, 10).map((p) => (
                  <div key={p.percent} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
                    <div className="text-[11px] font-bold text-cyan-400">{p.percent}% 1RM</div>
                    <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                      {isMetric ? `${p.weightKg} kg` : `${p.weightLbs} lbs`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.repsRange}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lift Log History */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Lift History & Sets</h3>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'chest', 'back', 'legs', 'shoulders', 'arms'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                      filterCategory === cat
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No lift records found for this category. Log your first set above!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredRecords.map((r) => {
                  const displayWeight = isMetric ? `${r.weightKg} kg` : `${units.kgToLbs(r.weightKg)} lbs`;
                  const display1RM = isMetric ? `${r.calculated1RM} kg` : `${units.kgToLbs(r.calculated1RM)} lbs`;

                  return (
                    <div
                      key={r.id}
                      className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{r.exerciseName}</span>
                          {r.isPR && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                              PR
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                            {displayWeight} × {r.reps} reps
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>1RM: <strong className="font-mono text-slate-200 tabular-nums">{display1RM}</strong></span>
                          {r.rpe && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>RPE {r.rpe}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500">{r.date}</span>
                        </div>

                        {r.notes && (
                          <div className="text-[11px] text-slate-400 italic">
                            "{r.notes}"
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteLift(r.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Exercise Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Add Custom Gym Exercise</h3>
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bulgarian Split Squat"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Muscle Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ExerciseCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="legs">Legs</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="core">Core</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
