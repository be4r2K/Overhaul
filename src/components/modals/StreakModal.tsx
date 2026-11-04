import React from 'react';
import { Flame, X, Calendar, ShieldCheck } from 'lucide-react';
import { useApp, calculateStreakFromWorkoutLogs, getWeekDaysActivity } from '../../context/AppContext';
import { LiftRecord, SportActivity, DailyStepLog } from '../../types/fitness';

export interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutLogs?: any[];
  liftRecords?: LiftRecord[];
  sportsHistory?: SportActivity[];
  stepsHistory?: DailyStepLog[];
  scheduledRestDays?: string[];
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  workoutLogs: propWorkoutLogs,
  liftRecords = [],
  sportsHistory = [],
  scheduledRestDays = ['Wed', 'Sun'],
}) => {
  if (!isOpen) return null;

  const appContext = useApp();
  const logsFromContext = appContext ? appContext.workoutLogs : [];
  const combinedLogs = [
    ...(propWorkoutLogs || logsFromContext || []),
    ...liftRecords.map((l) => ({ id: l.id, date: l.date, title: l.exerciseName })),
    ...sportsHistory.map((s) => ({ id: s.id, date: s.date, title: s.title })),
  ];

  const streakCalc = calculateStreakFromWorkoutLogs(combinedLogs, scheduledRestDays);
  const activeStreak = streakCalc.activeStreak;
  const bestStreak = streakCalc.bestStreak;
  const weekDays = getWeekDaysActivity(combinedLogs, scheduledRestDays);
  const activeDaysThisWeek = weekDays.filter((w) => w.hasWorkout).length;
  const consistencyRate = Math.round((activeDaysThisWeek / 7) * 100);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="social-modal-card streak-stats-modal glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 my-auto"
        style={{
          background: 'var(--glass-card-bg, rgba(22, 18, 36, 0.75))',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--glass-card-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Header - Clean: Title only, no badges, clean ✕ button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="modal-title text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Consistency & Workout Streak Stats
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Daily training momentum & weekly cadence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn p-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            title="Close streak details"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Highlight Stats Grid - Restructured Pill Typography */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="streak-stat-pill p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between items-center">
            <span className="streak-pill-header text-[11px] font-mono text-amber-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
              ACTIVE
            </span>
            <span className="streak-pill-value text-[32px] font-extrabold font-mono text-amber-400 text-center leading-[1.1] my-1">
              {activeStreak}
            </span>
            <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
              {activeStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="streak-stat-pill p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex flex-col justify-between items-center">
            <span className="streak-pill-header text-[11px] font-mono text-violet-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
              BEST
            </span>
            <span className="streak-pill-value text-[32px] font-extrabold font-mono text-violet-400 text-center leading-[1.1] my-1">
              {bestStreak}
            </span>
            <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
              {bestStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="streak-stat-pill p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between items-center">
            <span className="streak-pill-header text-[11px] font-mono text-emerald-300 uppercase block font-bold tracking-[0.5px] text-center whitespace-nowrap">
              CONSISTENCY
            </span>
            <span className="streak-pill-value text-[32px] font-extrabold font-mono text-emerald-400 text-center leading-[1.1] my-1">
              {consistencyRate}%
            </span>
            <span className="streak-pill-subtitle text-[13px] text-white/70 block text-center">
              {activeDaysThisWeek}/7 Days
            </span>
          </div>
        </div>

        {/* Dynamic 7-Day Weekly Calendar Tracker (Mon-Sun indicator bubbles ONLY) */}
        <div className="weekly-activity-grid p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">THIS WEEK'S ACTIVITY</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {activeDaysThisWeek}/7 Targets Hit
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {weekDays.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-mono font-bold ${item.isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.day}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {item.dateNum}
                  </span>
                </div>

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    item.status === 'done'
                      ? 'bg-emerald-500 text-black font-black'
                      : item.status === 'rest'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : item.isToday
                      ? 'accent-bg text-black font-black ring-2 ring-white/50 scale-105'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                  style={item.isToday && item.status !== 'done' && item.status !== 'rest' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                  title={
                    item.status === 'done'
                      ? 'Workout Completed'
                      : item.status === 'rest'
                      ? 'Rest Day Protected'
                      : item.isToday
                      ? 'Today'
                      : 'Rest'
                  }
                >
                  {item.status === 'done' ? '✔' : item.status === 'rest' ? 'R' : item.isToday ? '⚡' : '○'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safeguard Card */}
        <div className="safeguard-card p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Rest Day Safeguard Active</span>
            </div>
            <p className="text-[11px] text-slate-400">Scheduled recovery days on your custom split do not break your streak.</p>
          </div>
          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 shrink-0">
            Active
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const WorkoutStreakModal = StreakModal;
export default StreakModal;
