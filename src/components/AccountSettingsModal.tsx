import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Save,
  Flame,
  Activity,
  Heart,
  Settings,
} from 'lucide-react';
import { UserProfile, OneRepMaxRecord, BiometricLog, WorkoutLog } from '../types';
import {
  INITIAL_1RM_RECORDS,
  INITIAL_BIOMETRICS,
  INITIAL_WORKOUTS,
  INITIAL_USER_PROFILE,
} from '../utils/storage';

interface AccountSettingsModalProps {
  profile: UserProfile;
  records: OneRepMaxRecord[];
  biometrics: BiometricLog[];
  workouts: WorkoutLog[];
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onImportAllData: (data: {
    profile: UserProfile;
    records: OneRepMaxRecord[];
    biometrics: BiometricLog[];
    workouts: WorkoutLog[];
  }) => void;
  onResetDemoData: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  profile,
  records,
  biometrics,
  workouts,
  isOpen,
  onClose,
  onSaveProfile,
  onImportAllData,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...INITIAL_USER_PROFILE, ...profile });
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...INITIAL_USER_PROFILE, ...profile });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const handleSyncGoogle = () => {
    setSyncStatus('Syncing with Google Account...');
    setTimeout(() => {
      const now = new Date().toISOString();
      const updated = { ...formData, isGoogleConnected: true, lastSyncedAt: now };
      setFormData(updated);
      onSaveProfile(updated);
      setSyncStatus('Successfully synced biometrics & activities!');
      setTimeout(() => setSyncStatus(null), 3000);
    }, 1000);
  };

  const handleExportJson = () => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: formData,
      records,
      biometrics,
      workouts,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overhaul-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.profile && parsed.records && parsed.biometrics) {
          onImportAllData({
            profile: parsed.profile,
            records: parsed.records,
            biometrics: parsed.biometrics,
            workouts: parsed.workouts || [],
          });
          alert('Data successfully imported!');
          onClose();
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Overhaul Account & Integrations</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>

        {/* Google Account Integration Card */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Google Account Linked</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">{formData.email}</div>
              </div>
            </div>

            <button
              onClick={handleSyncGoogle}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Sync Now
            </button>
          </div>

          {syncStatus && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 font-medium">
              {syncStatus}
            </div>
          )}

          {formData.lastSyncedAt && (
            <div className="text-[10px] text-zinc-500 font-mono">
              Last synced: {new Date(formData.lastSyncedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* User Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Unit Preference</label>
              <select
                value={formData.preferredUnit}
                onChange={(e) => setFormData({ ...formData, preferredUnit: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs uppercase"
              >
                <option value="kg">Kilograms (KG)</option>
                <option value="lbs">Pounds (LBS)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: parseInt(e.target.value, 10) || 180 })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Target Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={formData.targetWeightKg}
                onChange={(e) => setFormData({ ...formData, targetWeightKg: parseFloat(e.target.value) || 75 })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Daily Step Goal</label>
              <input
                type="number"
                value={formData.dailyStepGoal}
                onChange={(e) => setFormData({ ...formData, dailyStepGoal: parseInt(e.target.value, 10) || 10000 })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Water Target (Liters)</label>
              <input
                type="number"
                step="0.1"
                value={formData.dailyWaterGoalLiters}
                onChange={(e) => setFormData({ ...formData, dailyWaterGoalLiters: parseFloat(e.target.value) || 3.0 })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Data Backup & Restore */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Data Management</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={handleExportJson}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </button>

            <label className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={onResetDemoData}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 text-rose-400 font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
