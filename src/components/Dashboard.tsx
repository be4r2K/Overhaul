import React from 'react';
import {
  Activity,
  Flame,
  CloudSun,
  Dumbbell,
  Heart,
  Moon,
  Footprints,
  Droplet,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { OneRepMaxRecord, BiometricLog, WorkoutLog, WeatherData, UserProfile } from '../types';

interface DashboardProps {
  records: OneRepMaxRecord[];
  biometrics: BiometricLog[];
  workouts: WorkoutLog[];
  weather: WeatherData | null;
  profile: UserProfile;
  onNavigate: (tab: 'dashboard' | '1rm' | 'biometrics' | 'weather' | 'workouts') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  biometrics,
  workouts,
  weather,
  profile,
  onNavigate,
}) => {
  // Current vitals from most recent biometric entry
  const latestBio = biometrics[0] || {};
  const prevBio = biometrics[1] || {};

  // Calculate Big 3 / SBD total
  const squatPR = records.find((r) => r.exercise.toLowerCase().includes('squat'))?.estimated1RM || 0;
  const benchPR = records.find((r) => r.exercise.toLowerCase().includes('bench'))?.estimated1RM || 0;
  const deadliftPR = records.find((r) => r.exercise.toLowerCase().includes('deadlift'))?.estimated1RM || 0;
  const ohpPR = records.find((r) => r.exercise.toLowerCase().includes('overhead') || r.exercise.toLowerCase().includes('press'))?.estimated1RM || 0;
  const bigThreeTotal = Math.round(squatPR + benchPR + deadliftPR);

  // Weekly workouts count
  const thisWeekWorkouts = workouts.filter((w) => {
    const diff = Date.now() - new Date(w.date).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });

  const totalWeeklyMinutes = thisWeekWorkouts.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalWeeklyCalories = thisWeekWorkouts.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);

  // Weight delta
  const currentWeight = latestBio.weightKg ?? 79.2;
  const weightDelta = prevBio.weightKg ? Math.round((currentWeight - prevBio.weightKg) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Athletic Command Center Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to execute, {(profile?.name || 'Athlete').split(' ')[0]}?
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Your recovery score is optimal at <strong className="text-emerald-400 font-mono">{latestBio.recoveryScore || 90}%</strong>. Weather conditions are prime for training, and your Big 3 strength total sits at <strong className="text-zinc-200 font-mono">{bigThreeTotal} kg</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('1rm')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-emerald-950 flex items-center gap-2"
            >
              <Flame className="w-4 h-4" />
              1RM Calculator
            </button>
            <button
              onClick={() => onNavigate('biometrics')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition border border-zinc-700 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Log Vitals
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recovery Score */}
        <div
          onClick={() => onNavigate('biometrics')}
          className="group cursor-pointer rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 hover:border-emerald-500/50 transition-all shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Recovery Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{latestBio.recoveryScore || 92}</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">/ 100</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Prime CNS Readiness</span> • Ready for peak strain
          </p>
        </div>

        {/* Big 3 Total */}
        <div
          onClick={() => onNavigate('1rm')}
          className="group cursor-pointer rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 hover:border-cyan-500/50 transition-all shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Strength SBD Total</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{bigThreeTotal}</span>
            <span className="text-sm font-semibold text-zinc-400 font-mono">{profile.preferredUnit}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Squat {squatPR} | Bench {benchPR} | Dead {deadliftPR}
          </p>
        </div>

        {/* Sleep & HRV */}
        <div
          onClick={() => onNavigate('biometrics')}
          className="group cursor-pointer rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 hover:border-indigo-500/50 transition-all shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sleep & Autonomic</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{latestBio.sleepHours || 7.8}h</span>
            <span className="text-xs font-semibold text-indigo-400 font-mono">HRV {latestBio.hrvMs || 74}ms</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Quality score: {latestBio.sleepQuality || 88}% • RHR: {latestBio.restingHeartRate || 52} bpm
          </p>
        </div>

        {/* Outdoor Weather & Sports */}
        <div
          onClick={() => onNavigate('weather')}
          className="group cursor-pointer rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 hover:border-amber-500/50 transition-all shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Weather & Outdoors</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CloudSun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{weather?.temperature ?? 19}°C</span>
            <span className="text-xs font-semibold text-amber-400 font-mono truncate max-w-[120px]">
              {weather?.conditionText || 'Crisp & Clear'}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 truncate">
            {weather?.city || 'London'} • Rain prob: {weather?.precipitationProbability ?? 10}%
          </p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 1RM Hall of Fame & Training Streak */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1RM PR Showcase */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base text-zinc-100">Personal Record Command Stand</h2>
              </div>
              <button
                onClick={() => onNavigate('1rm')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>Full PR Board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {records.slice(0, 6).map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-3.5 hover:border-zinc-700 transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-medium text-zinc-300 line-clamp-1">{record.exercise}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {record.category}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-extrabold text-white font-mono">
                      {record.estimated1RM}{' '}
                      <span className="text-xs font-medium text-zinc-400">{record.unit}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Rep Max: {record.weight}{record.unit} × {record.reps} reps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity & Workouts Highlights */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-base text-zinc-100">Recent Activity Highlights</h2>
              </div>
              <button
                onClick={() => onNavigate('workouts')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <span>Workout Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {workouts.slice(0, 3).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                      {w.sportCategory === 'Strength' ? (
                        <Dumbbell className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Footprints className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{w.title}</h4>
                      <p className="text-xs text-zinc-400">
                        {w.date} • {w.durationMinutes} mins • {w.caloriesBurned || 450} kcal
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      RPE {w.rpeAverage || 8.0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Biometric Summary & Daily Goals */}
        <div className="space-y-6">
          {/* Daily Goals Progress */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Daily Health Targets</span>
            </h3>

            {/* Steps Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-cyan-400" /> Steps
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {latestBio.stepCount?.toLocaleString() || '8,420'} / {(profile?.dailyStepGoal || 10000).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((latestBio.stepCount || 8420) / (profile?.dailyStepGoal || 10000)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Hydration Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" /> Hydration
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {latestBio.hydrationLiters || 2.8}L / {profile?.dailyWaterGoalLiters ?? 3.5}L
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((latestBio.hydrationLiters || 2.8) / (profile?.dailyWaterGoalLiters || 3.5)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Calorie Burn Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Active Burn
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  580 / {profile?.dailyCalorieBurnGoal || 650} kcal
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (580 / (profile?.dailyCalorieBurnGoal || 650)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Body Weight Status */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400">Current Weight:</span>
                <div className="font-mono font-bold text-zinc-100 text-sm">
                  {currentWeight} kg{' '}
                  <span className={`text-xs ${weightDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ({weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-zinc-400">Target Weight:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {profile?.targetWeightKg ?? 78.5} kg
                </div>
              </div>
            </div>
          </div>

          {/* Quick Weather / Outdoor Recommendation card */}
          {weather && (
            <div
              onClick={() => onNavigate('weather')}
              className="cursor-pointer rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                  Sport Recommendation
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-sm font-bold text-zinc-200">
                Optimal time for Outdoor Running & Cycling
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Temperature is {weather.temperature}°C with low wind ({weather.windSpeedKmH} km/h). Check complete conditions matrix.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
