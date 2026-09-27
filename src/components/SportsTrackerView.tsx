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
  Check
} from 'lucide-react';
import { DailyStepLog, SportActivity, SportType, UserProfile } from '../types/fitness';
import { calculateSportCalories, units } from '../utils/calculations';
import { GpsActivityMapTracker } from './GpsActivityMapTracker';

interface SportsTrackerViewProps {
  profile: UserProfile;
  stepsHistory: DailyStepLog[];
  sportsHistory: SportActivity[];
  onUpdateTodaySteps: (steps: number) => void;
  onAddSportActivity: (activity: Omit<SportActivity, 'id' | 'caloriesBurned'>) => void;
  onDeleteSportActivity: (id: string) => void;
}

export const SportsTrackerView: React.FC<SportsTrackerViewProps> = ({
  profile,
  stepsHistory,
  sportsHistory,
  onUpdateTodaySteps,
  onAddSportActivity,
  onDeleteSportActivity,
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

  // Form states
  const [activeFormTab, setActiveFormTab] = useState<SportType>('bike');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [distance, setDistance] = useState<number>(20);
  const [elevationM, setElevationM] = useState<number>(120);
  const [heartRateAvg, setHeartRateAvg] = useState<number>(145);
  const [notes, setNotes] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Manual step adjustment state
  const [stepInputVal, setStepInputVal] = useState<string>(todayStepLog.steps.toString());

  // Quick increment steps
  const handleAddSteps = (increment: number) => {
    const updated = todayStepLog.steps + increment;
    onUpdateTodaySteps(Math.max(0, updated));
    setStepInputVal(updated.toString());
  };

  const handleStepInputBlur = () => {
    const parsed = parseInt(stepInputVal) || 0;
    onUpdateTodaySteps(Math.max(0, parsed));
  };

  // Distance in KM normalized for calculation
  const distanceKm = isMetric ? distance : units.milesToKm(distance);

  // Dynamic calculations for current form
  const avgSpeedKmh = durationMinutes > 0 && distanceKm > 0 ? Number(((distanceKm / (durationMinutes / 60))).toFixed(1)) : undefined;

  // Pace calculation for runs (min/km or min/mi)
  let calculatedPace = '';
  if (activeFormTab === 'run' && durationMinutes > 0 && distance > 0) {
    const totalPaceMinutes = durationMinutes / distance;
    const paceMin = Math.floor(totalPaceMinutes);
    const paceSec = Math.round((totalPaceMinutes - paceMin) * 60);
    calculatedPace = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /${isMetric ? 'km' : 'mi'}`;
  }

  // Live estimated calories for current form inputs
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
      paceMinPerKm: activeFormTab === 'run' ? calculatedPace : undefined,
      elevationM: activeFormTab === 'bike' ? elevationM : undefined,
      heartRateAvg: heartRateAvg > 0 ? heartRateAvg : undefined,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setNotes('');
  };

  // Weekly Stats
  const bikeActivities = sportsHistory.filter((s) => s.type === 'bike');
  const runActivities = sportsHistory.filter((s) => s.type === 'run');
  const totalBikeKm = bikeActivities.reduce((sum, b) => sum + (b.distanceKm || 0), 0);
  const totalRunKm = runActivities.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const totalSportCalories = sportsHistory.reduce((sum, s) => sum + s.caloriesBurned, 0);

  // Filtered sports
  const filteredSports = sportsHistory.filter((s) => (filterType === 'all' ? true : s.type === filterType));

  const stepPct = Math.min(100, Math.round((todayStepLog.steps / todayStepLog.target) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Header with clean unboxed metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sports & Daily Movement Engine
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Today's Steps: <strong className="text-emerald-400 font-mono tabular-nums">{todayStepLog.steps.toLocaleString()}</strong> ({stepPct}%)</span>
            <span aria-hidden="true">·</span>
            <span>Total Cycling: <strong className="text-cyan-400 font-mono tabular-nums">{isMetric ? `${totalBikeKm.toFixed(1)} km` : `${units.kmToMiles(totalBikeKm)} mi`}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Total Running: <strong className="text-amber-400 font-mono tabular-nums">{isMetric ? `${totalRunKm.toFixed(1)} km` : `${units.kmToMiles(totalRunKm)} mi`}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Sport Calories Burned: <strong className="text-rose-400 font-mono tabular-nums">{totalSportCalories.toLocaleString()} kcal</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFormTab('bike')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFormTab === 'bike'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Log Ride</span>
          </button>
          <button
            onClick={() => setActiveFormTab('run')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFormTab === 'run'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Log Run</span>
          </button>
        </div>
      </div>

      {/* Auto-detect GPS & Health Apps Tracker with Route Map in Accent Colors */}
      <GpsActivityMapTracker
        profile={profile}
        onAddSportActivity={onAddSportActivity}
        onAddSteps={onUpdateTodaySteps}
      />

      {/* Step Counter Hub & Weekly Step Trend (Answers: "It knows how many steps I do per day") */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Step Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Daily Steps Tracker</h2>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {stepPct}% of Goal
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-4xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {todayStepLog.steps.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Goal: <span className="font-mono text-slate-300">{todayStepLog.target.toLocaleString()}</span> steps/day
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                {isMetric ? `${todayStepLog.distanceKm} km` : `${units.kmToMiles(todayStepLog.distanceKm)} mi`}
              </div>
              <div className="text-xs text-rose-400 font-mono tabular-nums">
                ~{todayStepLog.caloriesBurned} kcal burned
              </div>
            </div>
          </div>

          {/* Visual Step Progress Bar */}
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stepPct)}%` }}
            />
          </div>

          {/* Quick Increment Buttons */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-medium text-slate-400">Quick Step Adjust:</div>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddSteps(inc)}
                  className="py-1.5 text-xs font-mono font-medium rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  +{inc >= 1000 ? `${inc / 1000}k` : inc}
                </button>
              ))}
            </div>

            {/* Exact manual input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                value={stepInputVal}
                onChange={(e) => setStepInputVal(e.target.value)}
                onBlur={handleStepInputBlur}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3 py-1.5 text-xs font-mono text-white tabular-nums focus:outline-none"
                placeholder="Set exact step count"
              />
              <button
                type="button"
                onClick={handleStepInputBlur}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Set Steps
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Steps Trend Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">7-Day Step History</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Avg: {Math.round(stepsHistory.reduce((a, b) => a + b.steps, 0) / stepsHistory.length).toLocaleString()} steps
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-2 items-end h-40 pb-2">
              {stepsHistory.slice(-7).map((log) => {
                const heightPct = Math.min(100, Math.max(12, (log.steps / 15000) * 100));
                const hitGoal = log.steps >= log.target;
                const d = new Date(log.date);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div key={log.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {(log.steps / 1000).toFixed(1)}k
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-lg transition-all ${
                        hitGoal
                          ? 'bg-gradient-to-t from-emerald-500/80 to-emerald-400 group-hover:brightness-125'
                          : 'bg-gradient-to-t from-slate-800 to-cyan-500/60 group-hover:brightness-125'
                      }`}
                      title={`${log.date}: ${log.steps.toLocaleString()} steps`}
                    />
                    <span className="text-[11px] font-medium text-slate-400">
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                <span>Goal Met ({profile.stepGoal || 10000}+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60 inline-block" />
                <span>Below Goal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sport Logger & Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sport Logger Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Log Sport & Cardio Activity</h2>

              {/* Sport Type Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/60">
                {[
                  { id: 'bike', label: 'Bicycle', icon: Bike },
                  { id: 'run', label: 'Running', icon: Zap },
                  { id: 'swim', label: 'Swimming', icon: Waves },
                  { id: 'sports', label: 'Sports', icon: Flame },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFormTab(tab.id as SportType)}
                      className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        activeFormTab === tab.id
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmitSport} className="space-y-4">
              {/* Activity Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder={
                    activeFormTab === 'bike'
                      ? 'e.g. Coastal Loop 25K'
                      : activeFormTab === 'run'
                      ? 'e.g. Morning 5K Pace'
                      : 'e.g. Basketball pickup match'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Duration and Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Distance ({isMetric ? 'km' : 'miles'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="200"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-sm font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Metrics for Bike / Run */}
              {activeFormTab === 'bike' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-[11px] text-slate-400">Avg Speed (calc):</span>
                    <div className="text-base font-bold font-mono text-cyan-400 tabular-nums">
                      {avgSpeedKmh ? `${avgSpeedKmh} km/h` : '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Elevation Gain (m)</label>
                    <input
                      type="number"
                      value={elevationM}
                      onChange={(e) => setElevationM(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'run' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-[11px] text-slate-400">Calculated Pace:</span>
                    <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
                      {calculatedPace || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Avg Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={heartRateAvg}
                      onChange={(e) => setHeartRateAvg(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {/* Live MET Calorie Estimate Banner */}
              <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-medium">Estimated Energy Burn:</span>
                </div>
                <span className="text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                  ~{estimatedCalories} kcal
                </span>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Route or conditions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Sport Activity</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Sport Activities History & Stats (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Sport Totals Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                <Bike className="w-3.5 h-3.5" />
                <span>Bicycle Distance</span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                {isMetric ? `${totalBikeKm.toFixed(1)} km` : `${units.kmToMiles(totalBikeKm)} mi`}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{bikeActivities.length} rides logged</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>Run Mileage</span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                {isMetric ? `${totalRunKm.toFixed(1)} km` : `${units.kmToMiles(totalRunKm)} mi`}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{runActivities.length} runs logged</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
                <Flame className="w-3.5 h-3.5" />
                <span>Total Burned</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {totalSportCalories.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Active sports kcal</div>
            </div>
          </div>

          {/* Activities Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Logged Sports & Rides</h3>

              {/* Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'bike', 'run', 'swim', 'sports'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                      filterType === f
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredSports.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No activities logged yet in this category. Log your first bicycle ride or run above!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredSports.map((sport) => {
                  const isBike = sport.type === 'bike';
                  const isRun = sport.type === 'run';

                  return (
                    <div
                      key={sport.id}
                      className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isBike
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : isRun
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isBike ? (
                            <Bike className="w-5 h-5" />
                          ) : isRun ? (
                            <Zap className="w-5 h-5" />
                          ) : (
                            <Flame className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{sport.title}</span>
                            <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                              {sport.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono font-semibold text-slate-200 tabular-nums">
                              {sport.durationMinutes} mins
                            </span>
                            {sport.distanceKm && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-cyan-300 tabular-nums">
                                  {isMetric ? `${sport.distanceKm} km` : `${units.kmToMiles(sport.distanceKm)} mi`}
                                </span>
                              </>
                            )}
                            {sport.avgSpeedKmh && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-slate-300 tabular-nums">
                                  {sport.avgSpeedKmh} km/h
                                </span>
                              </>
                            )}
                            {sport.paceMinPerKm && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-amber-300 tabular-nums">
                                  {sport.paceMinPerKm}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-rose-400 tabular-nums">
                              {sport.caloriesBurned} kcal
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500">{sport.date}</span>
                          </div>

                          {sport.notes && (
                            <div className="text-[11px] text-slate-400 italic">
                              "{sport.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSportActivity(sport.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete activity"
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
    </div>
  );
};
