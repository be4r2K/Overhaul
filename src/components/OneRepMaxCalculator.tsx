import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Plus,
  Trash2,
  Dumbbell,
  Calculator,
  Percent,
  Layers,
  Sparkles,
  HelpCircle,
  Award,
  ChevronDown,
  Info,
} from 'lucide-react';
import { OneRepMaxRecord, WeightUnit } from '../types';
import {
  calculate1RM,
  getAllFormulas1RM,
  getRepPercentages,
  generateWarmupLadder,
  calculateBarbellPlates,
  FormulaType,
} from '../utils/oneRepMax';

interface OneRepMaxCalculatorProps {
  records: OneRepMaxRecord[];
  onAddRecord: (record: OneRepMaxRecord) => void;
  onDeleteRecord: (id: string) => void;
  preferredUnit: WeightUnit;
}

export const OneRepMaxCalculator: React.FC<OneRepMaxCalculatorProps> = ({
  records,
  onAddRecord,
  onDeleteRecord,
  preferredUnit,
}) => {
  const [weight, setWeight] = useState<number>(100);
  const [reps, setReps] = useState<number>(5);
  const [unit, setUnit] = useState<WeightUnit>(preferredUnit);
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>('epley');
  const [exerciseName, setExerciseName] = useState<string>('Barbell Back Squat');
  const [category, setCategory] = useState<'Barbell' | 'Dumbbell' | 'Bodyweight' | 'Machine' | 'Cable'>('Barbell');
  const [notes, setNotes] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'percentages' | 'warmup' | 'plates' | 'formulas'>('percentages');

  const estimatedMax = calculate1RM(weight, reps, selectedFormula);
  const allFormulas = getAllFormulas1RM(weight, reps);
  const percentages = getRepPercentages(estimatedMax);
  const warmupLadder = generateWarmupLadder(weight, unit === 'kg' ? 20 : 45);
  const plates = calculateBarbellPlates(weight, unit === 'kg' ? 20 : 45, unit);

  const handleSaveAsPR = () => {
    if (weight <= 0 || reps <= 0 || !exerciseName.trim()) return;

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Ignore if confetti fails
    }

    const newRecord: OneRepMaxRecord = {
      id: 'pr-' + Date.now(),
      exercise: exerciseName.trim(),
      category,
      weight,
      reps,
      unit,
      estimated1RM: estimatedMax,
      formula: selectedFormula,
      date: new Date().toISOString().split('T')[0],
      rpe: 9,
      notes: notes.trim() || undefined,
      isPersonalRecord: true,
    };

    onAddRecord(newRecord);
    setNotes('');
  };

  const commonExercises = [
    'Barbell Back Squat',
    'Flat Barbell Bench Press',
    'Conventional Deadlift',
    'Standing Overhead Press',
    'Barbell Bent Over Row',
    'Weighted Pull-Up',
    'Incline Dumbbell Press',
    'Leg Press',
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              1-Rep Max Science Engine & PR Vault
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Calculate your theoretical ceiling across multiple kinetic formulas, generate warmup ladders, and manage your records.
          </p>
        </div>

        {/* Unit switch */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setUnit('kg')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              unit === 'kg' ? 'bg-emerald-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            KG
          </button>
          <button
            onClick={() => setUnit('lbs')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              unit === 'lbs' ? 'bg-emerald-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LBS
          </button>
        </div>
      </div>

      {/* Main Grid: Left Calculator, Right Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Interactive Inputs & Save Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Lift Parameters</span>
            </h2>

            {/* Exercise Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Exercise Name</label>
              <input
                type="text"
                list="exercises-list"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition font-medium"
                placeholder="e.g., Barbell Back Squat"
              />
              <datalist id="exercises-list">
                {commonExercises.map((ex) => (
                  <option key={ex} value={ex} />
                ))}
              </datalist>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Equipment / Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition font-medium"
              >
                <option value="Barbell">Barbell</option>
                <option value="Dumbbell">Dumbbell</option>
                <option value="Bodyweight">Bodyweight / Calisthenics</option>
                <option value="Machine">Machine</option>
                <option value="Cable">Cable</option>
              </select>
            </div>

            {/* Weight & Reps inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Weight ({unit})</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Reps Performed</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={reps || ''}
                  onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Formula choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <span>Calculation Formula</span>
                <span title="Epley is standard for 1-10 reps; Brzycki is ideal for sub-max strength." className="cursor-help">
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                </span>
              </label>
              <select
                value={selectedFormula}
                onChange={(e) => setSelectedFormula(e.target.value as FormulaType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition font-medium capitalize"
              >
                <option value="epley">Epley (Most Popular & Universal)</option>
                <option value="brzycki">Brzycki (High Accuracy for 2-10 reps)</option>
                <option value="lombardi">Lombardi (Power Curve)</option>
                <option value="oconner">O'Conner (Linear Scaling)</option>
                <option value="mayhew">Mayhew (Exponential Fit)</option>
                <option value="wathan">Wathan (Powerlifter Calibrated)</option>
              </select>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Session Notes / RPE</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Felt light, clean pauses, RPE 8.5"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Save to PR Vault Button */}
            <button
              onClick={handleSaveAsPR}
              disabled={weight <= 0 || reps <= 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Record to PR Hall of Fame</span>
            </button>
          </div>
        </div>

        {/* Right Col: 1RM Hero Value & Analytics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Big Result Card */}
          <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Estimated 1-Rep Maximum
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                    {estimatedMax}
                  </span>
                  <span className="text-xl font-bold text-zinc-400 font-mono">{unit}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Based on <strong className="text-zinc-200">{weight}{unit}</strong> × <strong className="text-zinc-200">{reps} reps</strong> via {selectedFormula.toUpperCase()} formula.
                </p>
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2 min-w-[160px]">
                <div className="text-zinc-400 font-semibold uppercase text-[10px]">Training Load Zones</div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">85% (5RM):</span>
                  <span className="font-mono text-zinc-200 font-bold">{Math.round(estimatedMax * 0.85 * 2) / 2} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">75% (10RM):</span>
                  <span className="font-mono text-zinc-200 font-bold">{Math.round(estimatedMax * 0.75 * 2) / 2} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">65% (15RM):</span>
                  <span className="font-mono text-zinc-200 font-bold">{Math.round(estimatedMax * 0.65 * 2) / 2} {unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subtabs for detailed breakdowns */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveSubTab('percentages')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSubTab === 'percentages'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percentage Matrix</span>
              </button>

              <button
                onClick={() => setActiveSubTab('warmup')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSubTab === 'warmup'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Warmup Ladder</span>
              </button>

              <button
                onClick={() => setActiveSubTab('plates')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSubTab === 'plates'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Plate Math</span>
              </button>

              <button
                onClick={() => setActiveSubTab('formulas')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSubTab === 'formulas'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Formula Comparison</span>
              </button>
            </div>

            {/* Subtab 1: Percentage Matrix */}
            {activeSubTab === 'percentages' && (
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">% 1RM</th>
                        <th className="py-2.5 px-4 font-semibold">Load ({unit})</th>
                        <th className="py-2.5 px-4 font-semibold">Est. Reps</th>
                        <th className="py-2.5 px-4 font-semibold">Training Focus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {percentages.map((p) => (
                        <tr
                          key={p.percentage}
                          className={`hover:bg-zinc-800/40 transition ${
                            p.percentage === 100 ? 'bg-emerald-500/5 text-emerald-300' : 'text-zinc-200'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-bold">{p.percentage}%</td>
                          <td className="py-2.5 px-4 font-extrabold text-white text-sm">
                            {p.weight} {unit}
                          </td>
                          <td className="py-2.5 px-4 text-zinc-300">{p.expectedReps}</td>
                          <td className="py-2.5 px-4 font-sans text-zinc-400 text-[11px]">{p.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subtab 2: Warmup Ladder */}
            {activeSubTab === 'warmup' && (
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3">
                <div className="text-xs text-zinc-400">
                  Target working weight: <strong className="text-white font-mono">{weight} {unit}</strong>
                </div>
                <div className="space-y-2">
                  {warmupLadder.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/70 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-zinc-200">{step.stage}</div>
                          <div className="text-[11px] text-zinc-500">{step.percentage}% intensity</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-mono">
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {step.weight} {unit}
                          </span>
                          <span className="text-zinc-400 ml-1.5">× {step.reps} reps</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 hidden sm:block">
                          Rest: {step.restSec}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtab 3: Plate Math */}
            {activeSubTab === 'plates' && (
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    Barbell Weight: <strong className="text-zinc-200 font-mono">{unit === 'kg' ? '20 kg' : '45 lbs'}</strong>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    Per Side: {Math.max(0, (weight - (unit === 'kg' ? 20 : 45)) / 2)} {unit}
                  </div>
                </div>

                {plates.length === 0 ? (
                  <div className="text-xs text-zinc-500 text-center py-6">
                    Target weight is equal to or lighter than the Olympic barbell.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-300">Stack on EACH side:</div>
                    <div className="flex flex-wrap gap-2">
                      {plates.map((pl, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-black text-xs">
                            {pl.plate}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-mono">× {pl.countEachSide}</div>
                            <div className="text-[10px] text-zinc-500">{pl.plate} {unit} plate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subtab 4: Formulas */}
            {activeSubTab === 'formulas' && (
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3">
                <div className="text-xs text-zinc-400">
                  Cross-comparison across 6 validated scientific kinesiology formulas:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  {Object.entries(allFormulas).map(([fKey, fVal]) => (
                    <div
                      key={fKey}
                      className={`p-3 rounded-lg border transition ${
                        fKey === selectedFormula
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="uppercase text-[10px] font-bold text-zinc-500 tracking-wider">
                        {fKey}
                      </div>
                      <div className="text-lg font-black mt-1">
                        {fVal} <span className="text-xs font-normal text-zinc-400">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PR Hall of Fame Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-zinc-100">Personal Record (PR) Hall of Fame</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {records.length} saved records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Exercise</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Est. 1RM</th>
                <th className="py-3 px-4 font-semibold">Tested Rep Max</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-4 font-bold text-zinc-100 flex items-center gap-2">
                    <span>{r.exercise}</span>
                    {r.isPersonalRecord && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold">
                        PR
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{r.category}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-400 font-mono text-sm">
                    {r.estimated1RM} {r.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {r.weight}{r.unit} × {r.reps} reps
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{r.date}</td>
                  <td className="py-3 px-4 text-zinc-400 text-xs max-w-xs truncate">
                    {r.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
