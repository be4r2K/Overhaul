import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Compass, 
  Check, 
  Sliders, 
  Smartphone, 
  Scale,
  Sparkles,
  Layers,
  Plus,
  Minus,
  Pipette,
  Disc,
  Activity,
  Users,
  RotateCcw
} from 'lucide-react';
import { AccentColor, AppThemeSettings, ThemeMode } from '../types/aiWorkout';
import { ACCENT_THEMES } from '../utils/theme';
import { getAccurateDeviceGPS } from '../utils/weather';
import { UserProfile } from '../types/fitness';
import { units } from '../utils/calculations';
import { isHealthConnectAvailable, requestHealthConnectPermissions } from '../utils/healthConnect';
import { isContactsAvailable, requestContactsPermissions } from '../utils/contacts';

interface SettingsViewProps {
  theme: AppThemeSettings;
  onUpdateTheme: (updated: AppThemeSettings) => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onGpsUpdated: (coords: { latitude: number; longitude: number; cityName?: string }) => void;
  language?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onUpdateTheme,
  profile,
  onUpdateProfile,
  onGpsUpdated,
  language = 'en',
}) => {
  const isMetric = profile.units === 'metric';
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Health Connect integration states
  const [hcSupported, setHcSupported] = useState(false);
  const [hcEnabled, setHcSupportedEnabled] = useState(false);

  // Contacts integration states
  const [contactsSupported, setContactsSupported] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);

  // Palette expand / collapse state
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(false);

  useEffect(() => {
    // Automatically expand palette if theme index >= 9
    const allKeys = Object.keys(ACCENT_THEMES);
    const selectedIndex = allKeys.indexOf(theme.accent);
    if (selectedIndex >= 9) {
      setIsPaletteExpanded(true);
    }
  }, [theme.accent]);

  // Check integration availability on mount
  useEffect(() => {
    async function checkAvailability() {
      const hcAvail = await isHealthConnectAvailable();
      setHcSupported(hcAvail);
      if (hcAvail) {
        setHcSupportedEnabled(true);
      }

      const conAvail = await isContactsAvailable();
      setContactsSupported(conAvail);
      if (conAvail) {
        setContactsEnabled(true);
      }
    }
    checkAvailability();
  }, []);

  const [localWeight, setLocalWeight] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [localHeight, setLocalHeight] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );

  const handleModeChange = (mode: ThemeMode) => {
    onUpdateTheme({ ...theme, mode });
  };

  const handleAccentChange = (accent: AccentColor) => {
    onUpdateTheme({ ...theme, accent });
  };

  const handleToggleUnits = () => {
    const nextUnits = profile.units === 'metric' ? 'imperial' : 'metric';
    onUpdateProfile({ ...profile, units: nextUnits });
  };

  const handleStepGoalChange = (goal: number) => {
    onUpdateProfile({ ...profile, stepGoal: goal });
  };

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
    setGpsStatus('Requesting high-accuracy GPS...');
    try {
      const coords = await getAccurateDeviceGPS();
      if (coords) {
        onGpsUpdated(coords);
        onUpdateProfile({
          ...profile,
          location: coords.cityName || `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
        });
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

  // Health Connect Native permission trigger
  const handleToggleHealthConnect = async () => {
    if (!hcSupported) {
      // Prompt simulator mock toggle
      setHcSupportedEnabled(!hcEnabled);
      return;
    }

    const permitted = await requestHealthConnectPermissions();
    if (permitted) {
      setHcSupportedEnabled(true);
    } else {
      setHcSupportedEnabled(false);
    }
  };

  // Contacts Native permission trigger
  const handleToggleContacts = async () => {
    if (!contactsSupported) {
      // Prompt simulator mock toggle
      setContactsEnabled(!contactsEnabled);
      return;
    }

    const permitted = await requestContactsPermissions();
    if (permitted) {
      setContactsEnabled(true);
    } else {
      setContactsEnabled(false);
    }
  };

  // Hard Reset App Cache and Data state
  const handleResetAllData = () => {
    if (window.confirm("DANGER: Wiping all local storage data, lift history, step counts, and metrics. This resets Overhaul to a zeroed-out state and reloads. Proceed?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const allAccentKeys = Object.keys(ACCENT_THEMES) as AccentColor[];
  const visibleAccents = isPaletteExpanded ? allAccentKeys : allAccentKeys.slice(0, 10);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 max-w-7xl mx-auto w-full gap-2 select-none font-sans">
      
      {/* 1. DEDICATED HEADER & SUBTITLE */}
      <div className="ig-glass-card rounded-2xl p-3 sm:p-4 flex items-center justify-between border border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shrink-0">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">App Control Center</h1>
            <p className="text-[11px] text-slate-400">Manage biometrics, themes, native sensors, and cache</p>
          </div>
        </div>
        <div className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold shrink-0">
          Live System Active
        </div>
      </div>

      {/* 2. COMPREHENSIVE SETTINGS CONTROLS (Scrollable List Container) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5">
        
        {/* SECTION 1: BODY METRICS */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-black uppercase text-slate-200">Body Metrics & Unit Configurations</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weight */}
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
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                  {isMetric ? 'kg' : 'lbs'}
                </span>
              </div>
            </div>

            {/* Height */}
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
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                  cm
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Steps Target */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Daily Step Goal
              </label>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 rounded-xl p-1 justify-between">
                <button
                  type="button"
                  onClick={() => handleStepGoalChange(Math.max(1000, profile.stepGoal - 1000))}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white active:scale-90 transition-all cursor-pointer font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold font-mono text-white tabular-nums">
                  {profile.stepGoal.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleStepGoalChange(profile.stepGoal + 1000)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white active:scale-90 transition-all cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Unit System */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                System of Units
              </label>
              <button
                type="button"
                onClick={handleToggleUnits}
                className="w-full py-2 bg-slate-900 border border-slate-700/60 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-colors uppercase cursor-pointer text-center"
              >
                {profile.units === 'metric' ? 'Metric (kg, cm, km)' : 'Imperial (lbs, in, mi)'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: DEDICATED PALETTE & VISUAL THEMES */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
            <Palette className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-black uppercase text-slate-200">System Themes & Ambient Accent Swatches</h2>
          </div>

          {/* 3-Way Mode Switcher: Dark OLED, Translucent Glass, Light Glass */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('dark')}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                theme.mode === 'dark'
                  ? 'bg-white/15 border-white/40 text-white shadow-md ring-1 ring-white/30'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark OLED</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('glass')}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                theme.mode === 'glass'
                  ? 'bg-black/50 border-cyan-400/50 text-white shadow-md ring-1 ring-cyan-400/40 backdrop-blur-md'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Translucent Glass</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('light')}
              className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                theme.mode === 'light'
                  ? 'bg-white/80 border-slate-300 text-slate-900 shadow-md ring-1 ring-slate-400/20'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Glass</span>
            </button>
          </div>

          {/* Expanded Swatch Accent Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase font-mono">
              <span>Accent Glow Hue</span>
              <span className="accent-text font-black tracking-wider uppercase">{theme.accent.replace('_', ' ')}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {visibleAccents.map((key) => {
                const accentTheme = (ACCENT_THEMES as any)[key];
                const isSelected = theme.accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAccentChange(key)}
                    className="relative h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer overflow-hidden border border-white/10 shadow-sm"
                    style={{ backgroundColor: accentTheme.hex }}
                    title={`Select ${key} Theme Accent`}
                  >
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center shadow-inner">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
              className="w-full text-center py-2 text-xs font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer mt-1"
            >
              <span>{isPaletteExpanded ? '- Collapse' : '+ Expand'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: NATIVE SENSORS & HEALTH CONNECT INTEGRATIONS */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-black uppercase text-slate-200">Native Android Sensor Integrations</h2>
          </div>

          {/* Samsung Health via Health Connect permission switch */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-700/55 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate">Samsung Health Connect</h3>
                <p className="text-[10px] text-slate-400 truncate">Steps & Sleep Session reads</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleHealthConnect}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                hcEnabled 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                  : 'bg-white/10 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              {hcEnabled ? 'Active (Linked)' : 'Enable Sync'}
            </button>
          </div>

          {/* Contacts Sync sensor status */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-700/55 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate">Device Address Book Sync</h3>
                <p className="text-[10px] text-slate-400 truncate">Cross-reference verified friends</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleContacts}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                contactsEnabled 
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' 
                  : 'bg-white/10 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              {contactsEnabled ? 'Active (Linked)' : 'Enable Sync'}
            </button>
          </div>

          {/* Phone GPS Locking Sensor and Weather query */}
          <div className="flex flex-col gap-2 p-2.5 bg-slate-900 border border-slate-700/55 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">Accurate Phone GPS Lock</h3>
                  <p className="text-[10px] text-slate-400 truncate">Coordinates: {profile.location || 'Not set'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestGPS}
                disabled={gpsLoading}
                className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {gpsLoading ? 'Locking...' : 'Lock GPS'}
              </button>
            </div>
            {gpsStatus && (
              <p className="text-[9px] font-mono text-cyan-400 border-t border-white/5 pt-1.5 mt-0.5">{gpsStatus}</p>
            )}
          </div>
        </div>

        {/* SECTION 4: STORAGE, CACHE, AND CACHE INVALIDATION */}
        <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-rose-500/10 pb-1.5">
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-black uppercase text-rose-400">DANGER ZONE & CACHE INVALIDATION</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-2 bg-slate-900/60 rounded-xl">
            <div>
              <h3 className="text-[11px] font-black text-white">Reset Local App Cache</h3>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">Wipe custom routines, logged exercises, steps progress, sleep history and re-initialize state.</p>
            </div>
            <button
              type="button"
              onClick={handleResetAllData}
              className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors active:scale-95 cursor-pointer text-center shrink-0 self-end sm:self-auto"
            >
              Wipe State
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
