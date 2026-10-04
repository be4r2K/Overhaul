import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Flame, 
  Dumbbell, 
  Scale, 
  MapPin, 
  CheckCircle2, 
  Save
} from 'lucide-react';
import { UserProfile, LiftRecord, SportActivity, DailyStepLog } from '../types/fitness';
import { calculateBPL, calculateAge, calculateBMI, calculateBodyComposition } from '../utils/calculations';
import { generateUserPasscode, getAndUpdateDailyStreak } from '../utils/streak';

interface AthleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  liftRecords: LiftRecord[];
  sportsHistory: SportActivity[];
  stepsHistory: DailyStepLog[];
  isAuthenticated?: boolean;
  bplScore?: number;
  bplTier?: string;
  currentStreak?: number;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  liftRecords = [],
  sportsHistory = [],
  stepsHistory = [],
  isAuthenticated,
}) => {
  const [newName, setNewName] = useState(profile.name || 'Athlete');
  const [newFamilyName, setNewFamilyName] = useState(profile.familyName || '');
  const [newLocation, setNewLocation] = useState(profile.location || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(profile.name || 'Athlete');
      setNewFamilyName(profile.familyName || '');
      setNewLocation(profile.location || '');
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Calculate lifetime stats
  const totalSetsLogged = liftRecords.length;
  const totalTonnageKg = liftRecords.reduce((sum, l) => sum + ((l.weightKg || 0) * (l.reps || 0) * 3), 0);
  const totalTonnageDisplay = totalTonnageKg > 1000 ? `${(totalTonnageKg / 1000).toFixed(1)}k kg` : `${Math.round(totalTonnageKg)} kg`;

  // Calculate streak from real daily tracking
  const activeStreak = getAndUpdateDailyStreak().currentStreak;

  // BPL Tier
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };
  const strengthRatio = profile.weightKg > 0 ? (getBest1RM('bench-press') + getBest1RM('back-squat') + getBest1RM('deadlift')) / profile.weightKg : 0;
  const weeklyStepsAvg = stepsHistory.length > 0 ? Math.round(stepsHistory.reduce((a, b) => a + b.steps, 0) / stepsHistory.length) : 0;
  const weeklyCardioMin = sportsHistory.reduce((sum, s) => sum + s.durationMinutes, 0);
  const bmiData = calculateBMI(profile.weightKg, profile.heightCm);
  const bodyComp = calculateBodyComposition(profile.weightKg, profile.heightCm, calculateAge(profile.birthDate).years, profile.gender);
  const bplData = calculateBPL(strengthRatio, weeklyStepsAvg, weeklyCardioMin, bmiData.bmi, bodyComp.bodyFatPct);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim() || 'Athlete';
    const trimmedFamily = newFamilyName.trim();
    onUpdateProfile({
      ...profile,
      name: trimmedName,
      familyName: trimmedFamily,
      location: newLocation.trim(),
      personalFriendCode: generateUserPasscode(trimmedName, trimmedFamily, profile.personalFriendCode),
      hasExplicitlyLogged: true,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-[2px] rounded-full ig-story-ring shrink-0 shadow-md">
              <div className="avatar-circle w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-950 border border-black/15 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg shadow-xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'O'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-inherit modal-title">Athlete Career Profile</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider accent-text bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/10 dark:border-white/15 font-mono">
                  {bplData.tier} Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lifetime Training Telemetry & Credentials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Training Status & Account Details */}
        <div className="p-3.5 rounded-2xl glass-card-nested space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Account Status</span>
            <span className={`font-mono font-bold flex items-center gap-1 ${isAuthenticated ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAuthenticated ? 'Google Cloud Synced' : 'Local Guest Profile'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Email Identifier</span>
            <span className="font-mono font-semibold text-inherit">{profile.email || 'guest@overhaul.app'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Primary Goal</span>
            <span className="accent-text font-bold capitalize">{profile.goal || 'Hypertrophy'}</span>
          </div>
        </div>

        {/* Lifetime Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl glass-card-nested text-center space-y-1">
            <Dumbbell className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mx-auto" />
            <div className="text-base font-black font-mono text-inherit">{totalSetsLogged}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sets Logged</div>
          </div>

          <div className="p-3 rounded-2xl glass-card-nested text-center space-y-1">
            <Scale className="w-4 h-4 text-amber-500 dark:text-amber-400 mx-auto" />
            <div className="text-base font-black font-mono text-inherit">{totalTonnageDisplay}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tonnage</div>
          </div>

          <div className="p-3 rounded-2xl glass-card-nested text-center space-y-1">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400 mx-auto" />
            <div className="text-base font-black font-mono text-inherit">{activeStreak}d</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Streak</div>
          </div>

          <div className="p-3 rounded-2xl glass-card-nested text-center space-y-1">
            <Award className="w-4 h-4 accent-text mx-auto" />
            <div className="text-base font-black font-mono text-inherit">{bplData.score}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">BPL Score</div>
          </div>
        </div>

        {/* Edit Name & Location Form */}
        <form onSubmit={handleSaveChanges} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="modal-input w-full rounded-xl px-3 py-2 text-xs font-sans focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Family Name</label>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Optional"
                className="modal-input w-full rounded-xl px-3 py-2 text-xs font-sans focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Training Location / City</span>
            </label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Los Angeles, CA"
              className="modal-input w-full rounded-xl px-3 py-2 text-xs font-sans focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 accent-bg text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-md hover:opacity-95 active:scale-95 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              <Save className="w-4 h-4 text-black" />
              <span>{savedSuccess ? 'Saved Career Profile!' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="modal-secondary-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
