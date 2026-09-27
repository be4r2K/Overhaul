import React, { useState } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Type, 
  Compass, 
  MapPin, 
  Check, 
  RefreshCw, 
  Sparkles,
  Sliders,
  Shield,
  Smartphone,
  X,
  Gauge,
  SlidersHorizontal,
  Flame,
  Scale,
  Ruler
} from 'lucide-react';
import { AccentColor, AppThemeSettings, FontFamily, ThemeMode } from '../types/aiWorkout';
import { ACCENT_THEMES } from '../utils/theme';
import { getAccurateDeviceGPS } from '../utils/weather';
import { UserProfile } from '../types/fitness';
import { units } from '../utils/calculations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppThemeSettings;
  onUpdateTheme: (updated: AppThemeSettings) => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onGpsUpdated: (coords: { latitude: number; longitude: number; cityName?: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onUpdateTheme,
  profile,
  onUpdateProfile,
  onGpsUpdated,
}) => {
  if (!isOpen) return null;

  const isMetric = profile.units === 'metric';
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Body metrics local string state for fluid typing
  const [localWeight, setLocalWeight] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [localHeight, setLocalHeight] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );

  // Real-time theme mode handler
  const handleModeChange = (mode: ThemeMode) => {
    onUpdateTheme({ ...theme, mode });
  };

  // Real-time accent color handler
  const handleAccentChange = (accent: AccentColor) => {
    onUpdateTheme({ ...theme, accent });
  };

  // Real-time font handler
  const handleFontChange = (font: FontFamily) => {
    onUpdateTheme({ ...theme, font });
  };

  // Real-time units toggle
  const handleToggleUnits = () => {
    const nextUnits = profile.units === 'metric' ? 'imperial' : 'metric';
    onUpdateProfile({ ...profile, units: nextUnits });
  };

  // Real-time step target change
  const handleStepGoalChange = (goal: number) => {
    onUpdateProfile({ ...profile, stepGoal: goal });
  };

  // Real-time weight update
  const handleWeightUpdate = (valStr: string) => {
    setLocalWeight(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const weightKg = isMetric ? parsed : units.lbsToKg(parsed);
      onUpdateProfile({ ...profile, weightKg: Number(weightKg.toFixed(1)), hasExplicitlyLogged: true });
    } else if (valStr === '' || valStr === '0') {
      onUpdateProfile({ ...profile, weightKg: 0, hasExplicitlyLogged: true });
    }
  };

  // Real-time height update
  const handleHeightUpdate = (valStr: string) => {
    setLocalHeight(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateProfile({ ...profile, heightCm: Math.round(parsed), hasExplicitlyLogged: true });
    } else if (valStr === '' || valStr === '0') {
      onUpdateProfile({ ...profile, heightCm: 0, hasExplicitlyLogged: true });
    }
  };

  const handleRequestGPS = async () => {
    setGpsLoading(true);
    setGpsStatus('Accessing phone GPS sensor...');
    try {
      const coords = await getAccurateDeviceGPS();
      if (coords) {
        onGpsUpdated(coords);
        if (coords.cityName) {
          onUpdateProfile({ ...profile, location: coords.cityName });
        }
        setGpsStatus(`Accurate GPS locked: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${coords.cityName || 'Local'})`);
      } else {
        setGpsStatus('Location permission denied or timed out.');
      }
    } catch (err: any) {
      setGpsStatus('Error acquiring device location.');
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Instagram-style Translucent Floating Modal */}
      <div 
        className="w-full max-w-lg ig-glass-card bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-card-expand relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Instagram Header with Live Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-[2px] rounded-xl ig-story-ring shrink-0">
              <div className="w-8 h-8 rounded-[10px] bg-slate-950 flex items-center justify-center text-white">
                <Sliders className="w-4 h-4 accent-text" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">App Settings & Customization</h2>
                <span className="text-[9px] font-bold accent-text bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Updates apply immediately in real time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SECTION 1: BODY METRICS (WEIGHT & HEIGHT) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 accent-text" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Body Metrics (Weight & Height)
              </label>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Biometrics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weight Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Body Weight ({isMetric ? 'kg' : 'lbs'})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={localWeight}
                  onChange={(e) => handleWeightUpdate(e.target.value)}
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
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Height (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={localHeight}
                  onChange={(e) => handleHeightUpdate(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                  cm
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            Updating your weight or height recalculates BMI, BMR, TDEE caloric targets and strength ratios across the entire app immediately.
          </p>
        </div>

        {/* Real-time Dark Mode vs Light Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Appearance Theme
            </label>
            <span className="text-[11px] text-slate-400 capitalize font-mono">
              Current: {theme.mode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('dark')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme.mode === 'dark'
                  ? 'bg-white/15 border-white/40 text-white shadow-md ring-1 ring-white/30'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Moon className="w-4 h-4 accent-text" />
              <span>Dark (Instagram Black)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('light')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme.mode === 'light'
                  ? 'bg-white/90 border-amber-400 text-slate-900 shadow-md ring-1 ring-amber-400/50'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light (Instagram Glass)</span>
            </button>
          </div>
        </div>

        {/* Real-time Accent Color Palette */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Accent Color
            </label>
            <span className="text-xs accent-text font-mono font-bold capitalize">
              {ACCENT_THEMES[theme.accent].name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ACCENT_THEMES) as AccentColor[]).map((key) => {
              const pal = ACCENT_THEMES[key];
              const isSelected = theme.accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAccentChange(key)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-white/20 border-white/60 text-white shadow-md ring-2 ring-white/40'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <span className="truncate">{pal.name.split(' ')[0]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-auto accent-text" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Typography Font Style */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Font Family
            </label>
            <span className="text-xs text-slate-400 font-mono capitalize">
              {theme.font === 'mono' ? 'JetBrains Mono' : theme.font === 'display' ? 'Display Rounded' : 'Plus Jakarta'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sans', label: 'Plus Jakarta', desc: 'Modern & Clean' },
              { id: 'mono', label: 'JetBrains', desc: 'Technical Mono' },
              { id: 'display', label: 'Display', desc: 'Athletic Bold' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFontChange(f.id as FontFamily)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                  theme.font === f.id
                    ? 'bg-white/15 border-white/40 text-white shadow-md ring-1 ring-white/30'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-bold truncate">{f.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Daily Step Target & Units */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Daily Step Goal</span>
              <span className="accent-text font-mono">{(profile.stepGoal || 10000).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="4000"
              max="25000"
              step="500"
              value={profile.stepGoal || 10000}
              onChange={(e) => handleStepGoalChange(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 font-mono text-center">
              Drags update steps immediately
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Units</span>
              <span className="text-cyan-400 font-mono uppercase">{profile.units}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleUnits}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Switch to {profile.units === 'metric' ? 'Imperial (lbs, mi)' : 'Metric (kg, km)'}</span>
            </button>
            <div className="text-[10px] text-slate-500 font-mono text-center">
              Instantly converts all lifts
            </div>
          </div>
        </div>

        {/* Accurate Phone GPS Sensor */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 accent-text" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Accurate Phone GPS Sensor
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {profile.location || 'Current'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Requests precise device latitude & longitude from your phone's GPS for outdoor cycling & running conditions.
          </p>

          {gpsStatus && (
            <div className="text-xs accent-text accent-bg-light p-2.5 rounded-xl border border-white/15 font-mono">
              {gpsStatus}
            </div>
          )}

          <button
            onClick={handleRequestGPS}
            disabled={gpsLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>{gpsLoading ? 'Acquiring Phone GPS...' : 'Get Accurate GPS From Phone'}</span>
          </button>
        </div>

        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 accent-bg text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            style={{ backgroundColor: 'var(--accent-hex)', color: '#000000' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
