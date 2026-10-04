import React, { useState } from 'react';
import { 
  Bike, 
  Flame, 
  Plus, 
  Trash2, 
  MapPin, 
  Timer, 
  Gauge, 
  Compass, 
  Heart, 
  Footprints, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Waves,
  Zap,
  Check,
  X,
  Sliders
} from 'lucide-react';
import { DailyStepLog, SportActivity, SportType, UserProfile } from '../types/fitness';
import { calculateSportCalories, units } from '../utils/calculations';

interface SportsTrackerViewProps {
  profile: UserProfile;
  stepsHistory: DailyStepLog[];
  sportsHistory: SportActivity[];
  onUpdateTodaySteps: (steps: number) => void;
  onAddSportActivity: (activity: Omit<SportActivity, 'id' | 'caloriesBurned'>) => void;
  onDeleteSportActivity: (id: string) => void;
  language?: string;
}

export const SportsTrackerView: React.FC<SportsTrackerViewProps> = ({
  profile,
  stepsHistory,
  sportsHistory,
  onUpdateTodaySteps,
  onAddSportActivity,
  onDeleteSportActivity,
  language = 'en',
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStepLog = stepsHistory.find((s) => s.date === todayStr) || {
    date: todayStr,
    steps: 0,
    target: profile.stepGoal || 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  };

  const [activeModal, setActiveModal] = useState<'log-sport' | 'sports-list' | 'steps-adjust' | 'analytics' | null>(null);

  // Enforce default collapsed state on tab switch / mount
  React.useEffect(() => {
    setActiveModal(null);
  }, []);

  // Form states
  const [activeFormTab, setActiveFormTab] = useState<SportType>('bike');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [distance, setDistance] = useState<number>(20);
  const [elevationM, setElevationM] = useState<number>(120);
  const [heartRateAvg, setHeartRateAvg] = useState<number>(145);
  const [notes, setNotes] = useState('');

  // Quick increment steps
  const handleAddSteps = (increment: number) => {
    const updated = todayStepLog.steps + increment;
    onUpdateTodaySteps(Math.max(0, updated));
  };

  // Distance in KM normalized for calculation
  const distanceKm = isMetric ? distance : units.milesToKm(distance);
  const avgSpeedKmh = durationMinutes > 0 && distanceKm > 0 ? Number(((distanceKm / (durationMinutes / 60))).toFixed(1)) : undefined;

  const estimatedCalories = calculateSportCalories(
    activeFormTab,
    durationMinutes,
    profile.weightKg,
    distanceKm,
    avgSpeedKmh
  );

  const handleSubmitSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) return;

    const defaultTitles: Record<SportType, string> = {
      bike: 'Bicycle Ride',
      run: 'Road Run',
      swim: 'Swim Session',
      hiit: 'HIIT & Circuit',
      walk: 'Outdoor Walk',
      sports: 'Recreational Sports',
      rowing: 'Rowing Workout',
    };

    onAddSportActivity({
      type: activeFormTab,
      title: title.trim() || defaultTitles[activeFormTab],
      date,
      durationMinutes,
      distanceKm: ['bike', 'run', 'swim', 'walk', 'rowing'].includes(activeFormTab) && distance > 0 ? distanceKm : undefined,
      avgSpeedKmh: activeFormTab === 'bike' ? avgSpeedKmh : undefined,
      elevationM: activeFormTab === 'bike' ? elevationM : undefined,
      heartRateAvg: heartRateAvg > 0 ? heartRateAvg : undefined,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
    setActiveModal(null);
  };

  const bikeActivities = sportsHistory.filter((s) => s.type === 'bike');
  const runActivities = sportsHistory.filter((s) => s.type === 'run');
  const totalBikeKm = bikeActivities.reduce((sum, b) => sum + (b.distanceKm || 0), 0);
  const totalRunKm = runActivities.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const totalSportCalories = sportsHistory.reduce((sum, s) => sum + s.caloriesBurned, 0);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 max-w-7xl mx-auto w-full gap-2 select-none">
      {/* 1. TOP HEADER & METADATA BAR (Compact) */}
      <div className="ig-glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight">Sports, Cardio & Steps Tracker</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/30 uppercase">
                {todayStepLog.steps.toLocaleString()} Steps Today
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Biking {totalBikeKm}km · Running {totalRunKm}km · Active Burn +{totalSportCalories} kcal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveModal('log-sport')}
            className="px-3 py-1.5 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            style={{ backgroundColor: 'var(--accent-hex)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 6-WIDGET ZERO-SCROLL BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 min-h-0 overflow-hidden">
        {/* WIDGET 1: Daily Steps Gauge & Quick Increment */}
        <div
          onClick={() => setActiveModal('steps-adjust')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Steps Ring</span>
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {todayStepLog.steps.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-emerald-300 mt-0.5 truncate">
              Target: {todayStepLog.target.toLocaleString()} steps
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>{todayStepLog.distanceKm}km</span>
            <span className="text-emerald-400 font-bold">+1000 Steps →</span>
          </div>
        </div>

        {/* WIDGET 2: Bicycle Ride Tracker */}
        <div
          onClick={() => {
            setActiveFormTab('bike');
            setActiveModal('log-sport');
          }}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Cycling</span>
            <Bike className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalBikeKm} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 mt-0.5 truncate">
              {bikeActivities.length} rides recorded
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>GPS Tracking</span>
            <span className="text-cyan-400 font-bold">Log Ride →</span>
          </div>
        </div>

        {/* WIDGET 3: Running & Pace */}
        <div
          onClick={() => {
            setActiveFormTab('run');
            setActiveModal('log-sport');
          }}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Running</span>
            <Timer className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {totalRunKm} <span className="text-xs text-slate-400 font-normal">km</span>
            </div>
            <div className="text-[11px] font-mono text-amber-300 mt-0.5 truncate">
              {runActivities.length} runs recorded
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Road & Trail</span>
            <span className="text-amber-400 font-bold">Log Run →</span>
          </div>
        </div>

        {/* WIDGET 4: Swimming & HIIT Circuits */}
        <div
          onClick={() => {
            setActiveFormTab('hiit');
            setActiveModal('log-sport');
          }}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>HIIT / Swim</span>
            <Waves className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {sportsHistory.filter((s) => ['swim', 'hiit', 'rowing'].includes(s.type)).length} <span className="text-xs text-slate-400 font-normal">Sessions</span>
            </div>
            <div className="text-[11px] font-mono text-violet-300 mt-0.5 truncate">
              High Intensity Burn
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Heart Rate</span>
            <span className="text-violet-400 font-bold">Log HIIT →</span>
          </div>
        </div>

        {/* WIDGET 5: Active Calories Burned */}
        <div
          onClick={() => setActiveModal('analytics')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Total Burn</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              +{todayStepLog.caloriesBurned + totalSportCalories} <span className="text-xs text-slate-400 font-normal">kcal</span>
            </div>
            <div className="text-[11px] font-mono text-rose-300 mt-0.5 truncate">
              Steps + Sport Workouts
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>METs Engine</span>
            <span className="text-rose-400 font-bold">Analytics →</span>
          </div>
        </div>

        {/* WIDGET 6: Activity History & Logs */}
        <div
          onClick={() => setActiveModal('sports-list')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-sky-400 font-bold uppercase">
            <span>History</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {sportsHistory.length} <span className="text-xs text-slate-400 font-normal">Logs</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {sportsHistory.length > 0 ? sportsHistory[0].title : 'No sports logged'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Session Logs</span>
            <span className="text-sky-400 font-bold">View All →</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS */}

      {/* MODAL 1: LOG SPORT FORM */}
      {activeModal === 'log-sport' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Log Sport / Cardio Session</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSport} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sport Type</label>
                <select
                  value={activeFormTab}
                  onChange={(e) => setActiveFormTab(e.target.value as SportType)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="bike">Bicycle Ride</option>
                  <option value="run">Road Run</option>
                  <option value="walk">Outdoor Walk</option>
                  <option value="swim">Swimming</option>
                  <option value="hiit">HIIT & Circuits</option>
                  <option value="sports">Recreational Sports</option>
                  <option value="rowing">Rowing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Hill Climbs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Distance ({isMetric ? 'km' : 'mi'})</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <span className="text-xs text-rose-300 font-bold">Estimated Calories Burned</span>
                <span className="text-xl font-black font-mono text-white">~{estimatedCalories} kcal</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-black font-black text-xs shadow-md mt-2"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                Save Activity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SPORTS LIST */}
      {activeModal === 'sports-list' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Logged Sports Activities ({sportsHistory.length})</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {sportsHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No sports activities logged yet.</div>
              ) : (
                sportsHistory.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">{s.title}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {s.durationMinutes}m · {s.distanceKm ? `${s.distanceKm}km · ` : ''}+{s.caloriesBurned} kcal ({s.date})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteSportActivity(s.id)}
                      className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: STEPS QUICK ADJUST */}
      {activeModal === 'steps-adjust' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Daily Steps Tracker</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-4xl font-black font-mono text-white">{todayStepLog.steps.toLocaleString()}</span>
              <span className="text-xs text-emerald-300 block">Goal: {todayStepLog.target.toLocaleString()} steps</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAddSteps(500)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +500
              </button>
              <button
                type="button"
                onClick={() => handleAddSteps(1000)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +1,000
              </button>
              <button
                type="button"
                onClick={() => handleAddSteps(2500)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                +2,500
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: ANALYTICS */}
      {activeModal === 'analytics' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Active Energy & METs Analytics</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block font-mono">Steps Calorie Burn</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">+{todayStepLog.caloriesBurned} kcal</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-400 block font-mono">Sport Session Burn</span>
                <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">+{totalSportCalories} kcal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
