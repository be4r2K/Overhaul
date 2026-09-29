import React, { useState } from 'react';
import { X, Dumbbell, Bike, Footprints, Scale, Check, Sparkles, Ruler } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exercise, ExerciseCategory, LiftRecord, SportActivity, SportType, UserProfile } from '../types/fitness';
import { calculate1RM, calculateSportCalories, units } from '../utils/calculations';
import { playPRFanfare } from '../utils/audio';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  exercises: Exercise[];
  onAddLift: (lift: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => void;
  onAddSportActivity: (activity: Omit<SportActivity, 'id' | 'caloriesBurned'>) => void;
  onUpdateSteps: (steps: number) => void;
  currentSteps: number;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  exercises,
  onAddLift,
  onAddSportActivity,
  onUpdateSteps,
  currentSteps,
}) => {
  const isMetric = profile.units === 'metric';
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'lift' | 'sport' | 'steps' | 'body'>('body');

  // Body weight and height state
  const [inputWeight, setInputWeight] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [inputHeight, setInputHeight] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );
  const [bodyMetricsSaved, setBodyMetricsSaved] = useState(false);

  // Lift state
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id || 'bench-press');
  const [liftWeight, setLiftWeight] = useState<number>(100);
  const [liftReps, setLiftReps] = useState<number>(5);

  // Sport state
  const [sportType, setSportType] = useState<SportType>('bike');
  const [sportTitle, setSportTitle] = useState('');
  const [sportMinutes, setSportMinutes] = useState<number>(45);
  const [sportDistance, setSportDistance] = useState<number>(20);

  // Steps state
  const [stepAdd, setStepAdd] = useState<number>(1000);

  if (!isOpen) return null;

  const selectedExercise = exercises.find((e) => e.id === exerciseId) || exercises[0];
  const weightKg = isMetric ? liftWeight : units.lbsToKg(liftWeight);
  const calculated1RM = calculate1RM(weightKg, liftReps);

  const handleSaveBodyMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(inputWeight) || 0;
    const parsedHeight = parseFloat(inputHeight) || 0;

    const normalizedWeightKg = isMetric ? parsedWeight : units.lbsToKg(parsedWeight);
    const normalizedHeightCm = parsedHeight;

    onUpdateProfile({
      ...profile,
      weightKg: Number(normalizedWeightKg.toFixed(1)),
      heightCm: Math.round(normalizedHeightCm),
      hasExplicitlyLogged: true,
    });

    setBodyMetricsSaved(true);
    setTimeout(() => {
      setBodyMetricsSaved(false);
      onClose();
    }, 1200);
  };

  const handleSaveLift = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0 || liftReps <= 0) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    playPRFanfare();

    onAddLift({
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      weightKg: Number(weightKg.toFixed(1)),
      reps: liftReps,
      date: todayStr,
      notes: 'Logged via Quick Action',
    });

    onClose();
  };

  const handleSaveSport = (e: React.FormEvent) => {
    e.preventDefault();
    const distanceKm = isMetric ? sportDistance : units.milesToKm(sportDistance);
    const avgSpeed = sportMinutes > 0 && distanceKm > 0 ? Number((distanceKm / (sportMinutes / 60)).toFixed(1)) : undefined;

    onAddSportActivity({
      type: sportType,
      title: sportTitle.trim() || (sportType === 'bike' ? 'Bicycle Ride' : 'Road Run'),
      date: todayStr,
      durationMinutes: sportMinutes,
      distanceKm: distanceKm > 0 ? distanceKm : undefined,
      avgSpeedKmh: avgSpeed,
    });

    onClose();
  };

  const handleSaveSteps = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSteps(currentSteps + stepAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 space-y-4 animate-card-expand relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl accent-bg flex items-center justify-center text-black font-black" style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Quick Log</h2>
              <p className="text-[11px] text-slate-400">Add weight, height, lifts or activities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Tabs: Body (Weight/Height), Lift, Sport, Steps */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'body'
                ? 'accent-bg text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'body' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="truncate">Weight/Ht</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lift')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'lift'
                ? 'accent-bg text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'lift' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Gym Lift</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sport')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'sport'
                ? 'accent-bg text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'sport' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cardio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'steps'
                ? 'accent-bg text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            style={activeTab === 'steps' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Steps</span>
          </button>
        </div>

        {/* TAB 1: BODY METRICS (WEIGHT & HEIGHT) */}
        {activeTab === 'body' && (
          <form onSubmit={handleSaveBodyMetrics} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Log Body Weight & Height
                </span>
                <span className="text-[10px] accent-text font-mono font-bold">
                  Units: {isMetric ? 'Metric (kg, cm)' : 'Imperial (lbs, cm)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Weight Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Scale Weight ({isMetric ? 'kg' : 'lbs'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={inputWeight}
                      onChange={(e) => setInputWeight(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                      {isMetric ? 'kg' : 'lbs'}
                    </span>
                  </div>
                </div>

                {/* Height Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={inputHeight}
                      onChange={(e) => setInputHeight(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant BMI Preview */}
              {parseFloat(inputWeight) > 0 && parseFloat(inputHeight) > 0 && (
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Live BMI:</span>
                  <span className="font-mono font-black accent-text text-sm">
                    {(
                      (isMetric ? parseFloat(inputWeight) : units.lbsToKg(parseFloat(inputWeight))) /
                      Math.pow(parseFloat(inputHeight) / 100, 2)
                    ).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {bodyMetricsSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Body metrics saved! Recalculating dashboard...</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 accent-bg text-black font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              Save Body Metrics
            </button>
          </form>
        )}

        {/* TAB 2: LIFT */}
        {activeTab === 'lift' && (
          <form onSubmit={handleSaveLift} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Exercise</label>
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Weight ({isMetric ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={liftWeight}
                  onChange={(e) => setLiftWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reps</label>
                <input
                  type="number"
                  value={liftReps}
                  onChange={(e) => setLiftReps(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Estimated 1RM:</span>
              <span className="accent-text font-black text-sm">{Math.round(calculated1RM.average)} kg</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 accent-bg text-black font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              Log Lift Set
            </button>
          </form>
        )}

        {/* TAB 3: SPORT */}
        {activeTab === 'sport' && (
          <form onSubmit={handleSaveSport} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(['bike', 'run', 'walk'] as SportType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSportType(t)}
                  className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                    sportType === t
                      ? 'accent-bg text-black font-black border-transparent'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                  }`}
                  style={sportType === t ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                >
                  {t === 'bike' ? '🚴 Bicycle' : t === 'run' ? '🏃 Run' : '🚶 Walk'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={sportMinutes}
                  onChange={(e) => setSportMinutes(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Distance ({isMetric ? 'km' : 'mi'})</label>
                <input
                  type="number"
                  step="0.1"
                  value={sportDistance}
                  onChange={(e) => setSportDistance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 accent-bg text-black font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              Log Cardio Session
            </button>
          </form>
        )}

        {/* TAB 4: STEPS */}
        {activeTab === 'steps' && (
          <form onSubmit={handleSaveSteps} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block font-mono">Current Steps Today</span>
              <span className="text-2xl font-black font-mono text-white mt-0.5 block">{currentSteps.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2500].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setStepAdd(inc)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    stepAdd === inc
                      ? 'accent-bg text-black font-black'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                  }`}
                  style={stepAdd === inc ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                >
                  +{inc.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 accent-bg text-black font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              Add +{stepAdd.toLocaleString()} Steps
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
