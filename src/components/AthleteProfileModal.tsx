import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Award, 
  Flame, 
  Dumbbell, 
  Scale, 
  MapPin, 
  CheckCircle2, 
  Save,
  Camera
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
  const [newPhotoUrl, setNewPhotoUrl] = useState(profile.photoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(profile.name || 'Athlete');
      setNewFamilyName(profile.familyName || '');
      setNewLocation(profile.location || '');
      setNewPhotoUrl(profile.photoUrl || '');
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const athletePasscode = generateUserPasscode(profile.name, profile.familyName, profile.personalFriendCode);
  const isGoogleLinked = Boolean(profile.authProvider === 'google' || (isAuthenticated && profile.authProvider !== 'local'));

  // Handle tapping the avatar image to pick a custom profile picture from device Camera / Gallery
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Resize image via canvas so it stores cleanly in localStorage session state
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
          setNewPhotoUrl(compressedUrl);
          onUpdateProfile({
            ...profile,
            name: newName.trim() || profile.name || 'Athlete',
            familyName: newFamilyName.trim(),
            photoUrl: compressedUrl,
            personalFriendCode: athletePasscode,
            hasExplicitlyLogged: true,
          });
        } else {
          setNewPhotoUrl(rawDataUrl);
          onUpdateProfile({
            ...profile,
            photoUrl: rawDataUrl,
            personalFriendCode: athletePasscode,
            hasExplicitlyLogged: true,
          });
        }
      };
      img.onerror = () => {
        setNewPhotoUrl(rawDataUrl);
        onUpdateProfile({
          ...profile,
          photoUrl: rawDataUrl,
          personalFriendCode: athletePasscode,
          hasExplicitlyLogged: true,
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const recentSessionDates = new Set([
    ...liftRecords.filter((l) => l.date >= sevenDaysAgoStr).map((l) => l.date),
    ...sportsHistory.filter((s) => s.date >= sevenDaysAgoStr).map((s) => s.date),
  ]);
  const loggedSessionsThisWeek =
    recentSessionDates.size > 0
      ? recentSessionDates.size
      : liftRecords.length + sportsHistory.length > 0
      ? Math.min(5, liftRecords.length + sportsHistory.length)
      : 0;
  const bplData = calculateBPL(strengthRatio, weeklyStepsAvg, weeklyCardioMin, bmiData.bmi, bodyComp.bodyFatPct, loggedSessionsThisWeek, 5);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim() || 'Athlete';
    const trimmedFamily = newFamilyName.trim();
    onUpdateProfile({
      ...profile,
      name: trimmedName,
      familyName: trimmedFamily,
      location: newLocation.trim(),
      photoUrl: newPhotoUrl || profile.photoUrl,
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
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="profile-modal-container profile-modal-content w-full max-w-lg glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl animate-in fade-in zoom-in-95 duration-200 relative my-auto overflow-hidden flex flex-col justify-between"
        style={{
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Native Device Photo Picker (Camera / Gallery) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarFileChange}
          className="hidden"
        />

        {/* Header - Fixed Top */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative p-[2px] rounded-full ig-story-ring shrink-0 shadow-md cursor-pointer group focus:outline-none"
              title="Tap to upload custom profile photo from Camera or Gallery"
              aria-label="Upload custom profile picture"
            >
              <div className="avatar-circle w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-950 border border-black/15 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg shadow-xs overflow-hidden">
                {newPhotoUrl || profile.photoUrl ? (
                  <img
                    src={newPhotoUrl || profile.photoUrl}
                    alt={newName || profile.name || 'Athlete'}
                    className="w-full h-full rounded-full object-cover group-hover:opacity-85 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (newName || profile.name || 'O').charAt(0).toUpperCase()
                )}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-black shadow-md border border-black/20 transition-transform group-hover:scale-110"
                style={{ backgroundColor: 'var(--accent-hex, #10B981)' }}
              >
                <Camera className="w-2.5 h-2.5 text-black" />
              </span>
            </button>
            <div>
              <h2 className="text-base font-black tracking-tight text-inherit modal-title">Athlete Career Profile</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tap avatar to customize photo • Lifetime Credentials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn p-1 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Middle Content Container */}
        <form onSubmit={handleSaveChanges} className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1 flex flex-col justify-between min-h-0">
          <div className="space-y-2.5">
            {/* Training Status & Account Details */}
            <div className="p-3 rounded-2xl glass-card-nested space-y-2 text-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">
                  Google Cloud
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-mono font-semibold text-emerald-500 dark:text-emerald-400">
                  {profile.email || 'christiansalameh7@gmail.com'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Athlete Passcode</span>
                <span className="font-mono font-black tracking-wider accent-text">{athletePasscode}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Primary Goal</span>
                <span className="accent-text font-bold capitalize">{(profile.goal || 'Hypertrophy').replace('_', ' ')}</span>
              </div>
            </div>

            {/* Lifetime Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-2xl glass-card-nested text-center space-y-0.5">
                <Dumbbell className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 mx-auto" />
                <div className="text-sm font-black font-mono text-inherit">{totalSetsLogged}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sets Logged</div>
              </div>

              <div className="p-2.5 rounded-2xl glass-card-nested text-center space-y-0.5">
                <Scale className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mx-auto" />
                <div className="text-sm font-black font-mono text-inherit">{totalTonnageDisplay}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tonnage</div>
              </div>

              <div className="p-2.5 rounded-2xl glass-card-nested text-center space-y-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 mx-auto" />
                <div className="text-sm font-black font-mono text-inherit">{activeStreak}d</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Streak</div>
              </div>

              <div className="p-2.5 rounded-2xl glass-card-nested text-center space-y-0.5">
                <Award className="w-3.5 h-3.5 accent-text mx-auto" />
                <div className="text-sm font-black font-mono text-inherit">{bplData.score}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">BPL Score</div>
              </div>
            </div>

            {/* Edit Name & Location Inputs */}
            <div className="space-y-2 pt-0.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">First Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="modal-input w-full rounded-xl px-2.5 py-1.5 text-xs font-sans focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">Family Name</label>
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="Optional"
                    className="modal-input w-full rounded-xl px-2.5 py-1.5 text-xs font-sans focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                  <span>Training Location / City</span>
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Los Angeles, CA"
                  className="modal-input w-full rounded-xl px-2.5 py-1.5 text-xs font-sans focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer Actions - Pinned at Bottom */}
          <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0 mt-2">
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
              className="modal-secondary-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
