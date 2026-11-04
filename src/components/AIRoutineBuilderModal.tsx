import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Dumbbell } from 'lucide-react';
import { useRoutine } from '../context/RoutineContext';
import { UserProfile } from '../types/fitness';
import { triggerLightHaptic } from '../utils/audio';
import { syncRoutinesToCloud } from '../utils/cloudSyncService';
import { getActiveUserUid } from '../utils/storage';

interface AIRoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateRoutine?: (routine: any) => void;
}

function parseRawTextFallback(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsedDays: {
    dayTitle: string;
    focus: string;
    exercises: {
      name: string;
      setsReps: string;
      targetMuscle: string;
      rating: number;
      substitution: string;
    }[];
  }[] = [];

  let currentDay: (typeof parsedDays)[0] | null = null;

  for (const line of lines) {
    const dayHeaderMatch = line.match(/^(?:day\s*\d+|push|pull|legs|upper|lower|full\s*body)[\s:\-–]*(.*)$/i);
    if (dayHeaderMatch && (line.toLowerCase().startsWith('day') || !line.match(/\d+\s*[x×]\s*\d+/i))) {
      const cleanTitle = line.replace(/^[-*•]\s*/, '').trim();
      const colonIdx = cleanTitle.indexOf(':');
      const afterColon = colonIdx !== -1 ? cleanTitle.slice(colonIdx + 1).trim() : '';
      const hasInlineExercises = afterColon && (afterColon.includes(',') || /\d+\s*[x×]\s*\d+/i.test(afterColon));

      currentDay = {
        dayTitle: hasInlineExercises ? cleanTitle.slice(0, colonIdx).trim() : cleanTitle,
        focus: hasInlineExercises ? 'Custom Split Session' : (dayHeaderMatch[1]?.trim() || 'Strength & Hypertrophy'),
        exercises: [],
      };
      parsedDays.push(currentDay);

      if (hasInlineExercises) {
        const items = afterColon.split(',').map((s) => s.trim()).filter(Boolean);
        for (const item of items) {
          const srMatch = item.match(/(\d+\s*[x×]\s*\d+(?:-\d+)?(?:\s*\([^)]+\))?)/i);
          const setsReps = srMatch ? srMatch[1].trim() : '3x8-10';
          const exName = item.replace(srMatch ? srMatch[0] : '', '').replace(/^[-*•]\s*/, '').trim() || item;
          currentDay.exercises.push({
            name: exName,
            setsReps,
            targetMuscle: 'Primary Muscle Group',
            rating: 9,
            substitution: 'Dumbbell / Machine Variation',
          });
        }
      }
      continue;
    }

    if (!currentDay) {
      currentDay = {
        dayTitle: 'Day 1: Custom Workout Split',
        focus: 'Strength & Hypertrophy',
        exercises: [],
      };
      parsedDays.push(currentDay);
    }

    const parts = line.includes(',') && /\d+\s*[x×]\s*\d+/i.test(line)
      ? line.split(',').map((s) => s.trim()).filter(Boolean)
      : [line];

    for (const part of parts) {
      const cleanPart = part.replace(/^[-*•\d.)]+\s*/, '').trim();
      if (!cleanPart) continue;
      const srMatch = cleanPart.match(/(\d+\s*(?:sets?\s*[x×]|\s*[x×])\s*\d+(?:-\d+)?(?:\s*reps?)?(?:\s*\([^)]+\))?)/i);
      const setsReps = srMatch ? srMatch[1].trim() : '3x8-10';
      const exName = cleanPart.replace(srMatch ? srMatch[0] : '', '').replace(/[-–:]+$/, '').trim() || cleanPart;
      currentDay.exercises.push({
        name: exName,
        setsReps,
        targetMuscle: 'Targeted Muscle',
        rating: 9,
        substitution: 'Biomechanically Equivalent Alternative',
      });
    }
  }

  return {
    overallScore: 90,
    balanceRating: 9.0,
    volumeRating: 8.8,
    exerciseSelectionRating: 9.2,
    summaryTitle: `${parsedDays.length}-Day AI Custom Workout Split`,
    honestOpinion: 'Structured directly from your raw workout notes.',
    superStrongAreas: ['Custom Compound Selection', 'Structured Progression'],
    neglectedOrNeedsWork: [],
    improvements: ['Track progressive overload weekly across all primary lifts.'],
    muscleGroupCoverage: [],
    parsedDays,
    substitutions: [],
  };
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerLightHaptic();
    
    if (!rawText.trim()) {
      setError('Please paste your workout routine text first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = parseRawTextFallback(rawText);

      const newRoutine = {
        id: `routine-${Date.now()}`,
        summaryTitle: result.summaryTitle || 'AI Custom Split',
        parsedDays: result.parsedDays,
        analyzedAt: new Date().toISOString(),
      };

      const updatedRoutinesList = [...(Array.isArray(activeRoutine) ? activeRoutine : []), newRoutine];

      // 1. Save to activeRoutine list in state
      setActiveRoutine(updatedRoutinesList);

      // 2. Set as active execution program
      if (onUpdateRoutine) {
        onUpdateRoutine(result);
      }

      // 3. Sync directly to Google Cloud
      const uid = getActiveUserUid();
      if (uid && uid !== 'anonymous') {
        syncRoutinesToCloud(uid, updatedRoutinesList, result).catch(() => {});
      }

      setRawText('');
      onClose();
    } catch (err: any) {
      console.warn(err);
      setError(err?.message || 'An unexpected error occurred during AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={() => {
        triggerLightHaptic();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ai-routine-builder-modal-content w-full max-w-lg p-5 sm:p-6 relative flex flex-col my-auto text-white animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(22, 18, 36, 0.68)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '24px',
        }}
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerLightHaptic();
            onClose();
          }}
          className="modal-close-btn absolute top-4 right-4 cursor-pointer flex items-center justify-center"
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '4px',
            color: '#ffffff',
          }}
        >
          <span className="text-xl font-light leading-none">✕</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-black tracking-tight keep-white">Import Workout Routine</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4 keep-white">
          Paste your routine notes below. The parser will automatically format your training split, sets, and reps.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., Push Day: Bench Press 4x5, Overhead Press 3x8&#10;Pull Day: Weighted Pull-Ups 4x6, Barbell Rows 3x10..."
              rows={6}
              disabled={loading}
              className="raw-routine-textarea w-full rounded-2xl p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col w-full">
            <button
              type="submit"
              disabled={loading}
              className="generate-routine-btn"
              style={{
                width: '100%',
                marginTop: '16px',
                marginBottom: '0',
                borderRadius: '14px',
                fontWeight: 700,
                background: 'var(--accent-primary, #10b981)',
                color: '#ffffff',
                padding: '14px',
                border: 'none',
              }}
            >
              {loading ? 'Generating Routine...' : 'Generate Routine'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
