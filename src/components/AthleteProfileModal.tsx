import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Flame, 
  Dumbbell, 
  Scale, 
  MapPin, 
  User as UserIcon, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  Shield,
  Save
} from 'lucide-react';
import { UserProfile, LiftRecord, SportActivity, DailyStepLog } from '../types/fitness';
import { calculateBPL, calculateAge, calculateBMI, calculateBodyComposition } from '../utils/calculations';

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

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const hadLift = liftRecords.some((l) => l.date === dStr);
      const hadSport = sportsHistory.some((s) => s.date === dStr);
      const hadSteps = (stepsHistory.find((s) => s.date === dStr)?.steps || 0) >= (profile.stepGoal || 8000);
      if (hadLift || hadSport || hadSteps) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return Math.max(streak, 1);
  };
  const activeStreak = calculateStreak();

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
    onUpdateProfile({
      ...profile,
      name: newName.trim() || 'Athlete',
      familyName: newFamilyName.trim(),
      location: newLocation.trim(),
      hasExplicitlyLogged: true,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-[2px] rounded-full ig-story-ring shrink-0 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-white font-black text-lg">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'O'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Athlete Career Profile</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider accent-text bg-white/10 px-2 py-0.5 rounded-full border border-white/15 font-mono">
                  {bplData.tier} Tier
                </span>
              </div>
              <p className="text-xs text-slate-400">Lifetime Training Telemetry & Credentials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Training Status & Account Details */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Account Status</span>
            <span className={`font-mono font-bold flex items-center gap-1 ${isAuthenticated ? 'text-emerald-400' : 'text-amber-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAuthenticated ? 'Google Cloud Synced' : 'Local Guest Profile'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Email Identifier</span>
            <span className="text-white font-mono">{profile.email || 'guest@overhaul.app'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Primary Goal</span>
            <span className="accent-text font-bold capitalize">{profile.goal || 'Hypertrophy'}</span>
          </div>
        </div>

        {/* Lifetime Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <Dumbbell className="w-4 h-4 text-cyan-400 mx-auto" />
            <div className="text-base font-black text-white font-mono">{totalSetsLogged}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Sets Logged</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <Scale className="w-4 h-4 text-amber-400 mx-auto" />
            <div className="text-base font-black text-white font-mono">{totalTonnageDisplay}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Tonnage</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <Flame className="w-4 h-4 text-orange-400 mx-auto" />
            <div className="text-base font-black text-white font-mono">{activeStreak}d</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Streak</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <Award className="w-4 h-4 accent-text mx-auto" />
            <div className="text-base font-black text-white font-mono">{bplData.score}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">BPL Score</div>
          </div>
        </div>

        {/* Edit Name & Location Form */}
        <form onSubmit={handleSaveChanges} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/40 font-sans"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Family Name</label>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/40 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Training Location / City</span>
            </label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Los Angeles, CA"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/40 font-sans"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 accent-bg text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
            >
              <Save className="w-4 h-4 text-black" />
              <span>{savedSuccess ? 'Saved Career Profile!' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/15 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
