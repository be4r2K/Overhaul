import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Dumbbell, 
  RefreshCw, 
  Layers, 
  Flame, 
  Sliders, 
  Check, 
  Copy, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Award,
  ShieldCheck,
  Percent,
  TrendingUp,
  BookmarkPlus
} from 'lucide-react';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { UserProfile, ExerciseCategory } from '../types/fitness';
import confetti from 'canvas-confetti';
import { playPRFanfare } from '../utils/audio';

interface AIWorkoutSectionProps {
  profile: UserProfile;
  cachedAnalysis: AIWorkoutAnalysisResult | null;
  onSaveAnalysis: (result: AIWorkoutAnalysisResult) => void;
  onImportExercisesToGym: (exercises: { name: string; category: ExerciseCategory }[]) => void;
}

const SAMPLE_NOTES = `Day 1 - Push Heavy
- Barbell Flat Bench Press 4x5 (100kg)
- Incline Dumbbell Press 3x8-10 (34kg)
- Overhead Dumbbell Shoulder Press 3x8
- Lateral Cable Raises 4x15
- Rope Tricep Pushdowns 4x12
- Skullcrushers 3x10

Day 2 - Pull Power
- Conventional Deadlift 3x3 (180kg)
- Barbell Bent-Over Row 4x6-8 (85kg)
- Lat Pulldowns 3x10-12
- Cable Face Pulls 3x15
- Dumbbell Incline Bicep Curls 4x10
- Hammer Curls 3x12

Day 3 - Legs & Core
- Barbell Back Squat 4x5 (140kg)
- Romanian Deadlifts (RDL) 3x8 (110kg)
- Leg Press 3x12 (240kg)
- Leg Extensions 3x15
- Standing Calf Raises 4x15
- Hanging Knee/Leg Raises 3x15`;

export const AIWorkoutSection: React.FC<AIWorkoutSectionProps> = ({
  profile,
  cachedAnalysis,
  onSaveAnalysis,
  onImportExercisesToGym,
}) => {
  const [rawNotes, setRawNotes] = useState(cachedAnalysis?.rawNotesSnippet || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIWorkoutAnalysisResult | null>(cachedAnalysis);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [copiedDay, setCopiedDay] = useState<number | null>(null);
  const [importedStatus, setImportedStatus] = useState<boolean>(false);

  const handlePasteSample = () => {
    setRawNotes(SAMPLE_NOTES);
  };

  const handleAnalyzeWorkout = async () => {
    if (!rawNotes.trim()) {
      setErrorMsg('Please paste or type your workout notes into the box first.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);

    try {
      const response = await fetch('/api/ai/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          userWeightKg: profile.weightKg,
          userGoal: profile.goal,
          experienceLevel: profile.activityLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze workout notes.');
      }

      const data: AIWorkoutAnalysisResult = await response.json();
      data.rawNotesSnippet = rawNotes;
      data.analyzedAt = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      setAnalysis(data);
      onSaveAnalysis(data);

      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'],
      });
      playPRFanfare();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI workout engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyDay = (dayIdx: number) => {
    if (!analysis) return;
    const day = analysis.parsedDays[dayIdx];
    const text = `${day.dayTitle} (${day.focus})\n` + day.exercises.map((e) => `• ${e.name} ${e.setsReps ? `(${e.setsReps})` : ''} - Targets: ${e.targetMuscle}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedDay(dayIdx);
    setTimeout(() => setCopiedDay(null), 2000);
  };

  const handleImportToGymTracker = () => {
    if (!analysis) return;
    const items: { name: string; category: ExerciseCategory }[] = [];
    analysis.parsedDays.forEach((day) => {
      day.exercises.forEach((ex) => {
        let cat: ExerciseCategory = 'chest';
        const m = ex.targetMuscle.toLowerCase();
        if (m.includes('back') || m.includes('lat') || m.includes('trap')) cat = 'back';
        else if (m.includes('leg') || m.includes('quad') || m.includes('ham') || m.includes('glute') || m.includes('calf')) cat = 'legs';
        else if (m.includes('shoulder') || m.includes('delt')) cat = 'shoulders';
        else if (m.includes('bicep') || m.includes('tricep') || m.includes('arm')) cat = 'arms';
        else if (m.includes('core') || m.includes('abs')) cat = 'core';
        items.push({ name: ex.name, category: cat });
      });
    });

    onImportExercisesToGym(items);
    setImportedStatus(true);
    setTimeout(() => setImportedStatus(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  AI Workout Intelligence & Notes Parser
                </h1>
                <span className="text-[10px] font-bold text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded-full border border-violet-500/30 uppercase font-mono">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste your raw notes from Apple Notes or Google Keep. AI splits into days, assesses muscles, rates balance, and provides substitutions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteSample}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Load Sample 3-Day Split
            </button>
          </div>
        </div>
      </div>

      {/* Input Notes Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Paste Your Workout Notes Here</span>
          </label>
          {analysis?.analyzedAt && (
            <span className="text-[11px] text-slate-400 font-mono">
              Last analyzed: {analysis.analyzedAt}
            </span>
          )}
        </div>

        <textarea
          rows={5}
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          placeholder={`Paste notes from your phone:
Day 1 - Chest & Arms
- Incline Bench Press 4x8 (80kg)
- Cable Crossover 3x12
- Preacher Curls 3x10
- Tricep Dips 3x12

Day 2 - Legs & Back
- Squats 4x6 (120kg)...`}
          className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500/80 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none transition-colors"
        />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Analyzed with biomechanical muscle volume & balance scoring</span>
          </div>

          <button
            onClick={handleAnalyzeWorkout}
            disabled={analyzing}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-emerald-400 hover:from-violet-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Analyzing Workouts & Split...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Parse & Analyze My Workout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Scorecard: Modular Bento Row (Circles, Squares & Rectangles) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Circle 1: Overall Composite Score */}
            <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Overall Program Rating
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 truncate max-w-[180px]">
                  {analysis.summaryTitle}
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
                  {analysis.overallScore >= 85 ? 'Elite Tier Routine' : analysis.overallScore >= 70 ? 'Solid Athletic Split' : 'Needs Optimization'}
                </span>
              </div>

              {/* Circle Badge */}
              <div className="relative w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-slate-950 shadow-inner shrink-0">
                <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {analysis.overallScore}
                </span>
                <span className="absolute -bottom-1 text-[8px] font-bold uppercase text-slate-400 bg-slate-900 px-1 rounded">
                  /100
                </span>
              </div>
            </div>

            {/* Rectangle 2: Balance Rating */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Muscle Balance</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums my-1">
                {analysis.balanceRating} <span className="text-xs text-slate-500 font-normal">/ 10</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${analysis.balanceRating * 10}%` }} />
              </div>
            </div>

            {/* Rectangle 3: Volume & Stimulus */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Volume Stimulus</span>
              <div className="text-2xl font-bold font-mono text-violet-400 tabular-nums my-1">
                {analysis.volumeRating} <span className="text-xs text-slate-500 font-normal">/ 10</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-violet-400 h-full rounded-full" style={{ width: `${analysis.volumeRating * 10}%` }} />
              </div>
            </div>

            {/* Rectangle 4: Exercise Selection */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Exercise Choice</span>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums my-1">
                {analysis.exerciseSelectionRating} <span className="text-xs text-slate-500 font-normal">/ 10</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${analysis.exerciseSelectionRating * 10}%` }} />
              </div>
            </div>

            {/* Square 5: Total Days Detected */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Days Split</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums my-1">
                {analysis.parsedDays.length} <span className="text-xs text-slate-500 font-normal">Days</span>
              </div>
              <span className="text-[10px] text-slate-400">Structured split</span>
            </div>
          </div>

          {/* Coaching Verdict & What Is Super Strong vs Neglected */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Honest Opinion & Improvements (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Honest Coach Review & Verdict</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                "{analysis.honestOpinion}"
              </p>

              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Actionable Improvements to Implement:
                </span>
                <div className="space-y-1.5">
                  {analysis.improvements.map((imp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: What Is Super Strong vs What Needs Work (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Super Strong Card */}
              <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">What Is Super Strong</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.superStrongAreas.map((area, i) => (
                    <div key={i} className="text-xs text-emerald-200 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Needs Work / Neglected Card */}
              <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Neglected / Needs Work</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.neglectedOrNeedsWork.map((neg, i) => (
                    <div key={i} className="text-xs text-amber-200 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{neg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Muscle Group Coverage Grid (Compact Modular Squares) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Full Muscle Group Hit Coverage</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">0-100% stimulus scale</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {analysis.muscleGroupCoverage.map((m) => {
                const isHigh = m.percentage >= 70;
                const isMod = m.percentage >= 40 && m.percentage < 70;
                const isLow = m.percentage < 40;

                return (
                  <div key={m.muscle} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white truncate">{m.muscle}</span>
                      <span className={`font-mono text-[11px] font-bold ${isHigh ? 'text-emerald-400' : isMod ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {m.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden my-1">
                      <div
                        className={`h-full rounded-full ${isHigh ? 'bg-emerald-400' : isMod ? 'bg-cyan-400' : 'bg-amber-400'}`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 truncate mt-0.5" title={m.assessment}>
                      {m.assessment}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parsed Workout Days & Exercises (Interactive Tabbed Viewer) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Parsed Workout Days</h3>
                <span className="text-xs text-slate-400">Click a day to view its exercises, sets, reps & suggestions</span>
              </div>

              {/* Day selection tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {analysis.parsedDays.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeDayIdx === idx
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Day {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Day Content */}
            {analysis.parsedDays[activeDayIdx] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {analysis.parsedDays[activeDayIdx].dayTitle}
                    </h4>
                    <span className="text-xs text-emerald-400 font-medium">
                      Focus: {analysis.parsedDays[activeDayIdx].focus}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyDay(activeDayIdx)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedDay === activeDayIdx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDay === activeDayIdx ? 'Copied' : 'Copy Day'}</span>
                    </button>
                  </div>
                </div>

                {/* Exercises list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.parsedDays[activeDayIdx].exercises.map((ex, eIdx) => (
                    <div key={eIdx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white truncate">{ex.name}</span>
                        {ex.rating && (
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {ex.rating}/10
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {ex.setsReps && <span className="font-mono text-emerald-300 font-semibold">{ex.setsReps}</span>}
                        {ex.setsReps && <span aria-hidden="true">·</span>}
                        <span className="text-cyan-300">{ex.targetMuscle}</span>
                      </div>

                      {ex.substitution && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                          <strong className="text-slate-300">If cannot perform:</strong> {ex.substitution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Exercise Substitutions & Replacements (Requested: "if there's a certain workout that I cannot do, it gives me suggestions") */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Smart Exercise Substitutions & Swap Recommendations</h3>
              </div>
              <span className="text-xs text-slate-400">Joint-friendly & missing equipment swaps</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysis.substitutions.map((sub, sIdx) => (
                <div key={sIdx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{sub.originalExercise}</span>
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Swap</span>
                  </div>

                  {sub.reasonToSwap && (
                    <div className="text-[11px] text-slate-400 italic">
                      Why: {sub.reasonToSwap}
                    </div>
                  )}

                  <div className="space-y-1 text-xs pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <span className="text-[10px] text-slate-500 font-mono">Option 1:</span>
                      <strong className="font-semibold">{sub.replacement1}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <span className="text-[10px] text-slate-500 font-mono">Option 2:</span>
                      <strong className="font-semibold">{sub.replacement2}</strong>
                    </div>
                  </div>

                  {sub.equipmentNeeded && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Equipment: {sub.equipmentNeeded}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Action to import into Gym & 1RM Tracker */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Save all parsed exercises to your Gym Exercise library</span>
              <button
                onClick={handleImportToGymTracker}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {importedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4 text-cyan-400" />}
                <span>{importedStatus ? 'Added to Gym Tracker!' : 'Import Exercises to Gym'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
