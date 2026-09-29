import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Compass, 
  Check, 
  Sliders, 
  Smartphone, 
  X, 
  Scale,
  Sparkles,
  Layers,
  Plus,
  Minus,
  Pipette,
  Disc
} from 'lucide-react';
import { AccentColor, AppThemeSettings, ThemeMode } from '../types/aiWorkout';
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

// HSL to RGB conversion helper
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
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
  const isMetric = profile.units === 'metric';
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Palette expand / collapse state (2-row compact default)
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(false);

  // Automatically expand if current theme accent is in extended palette (index >= 9)
  useEffect(() => {
    const allKeys = Object.keys(ACCENT_THEMES);
    const selectedIndex = allKeys.indexOf(theme.accent);
    if (selectedIndex >= 9) {
      setIsPaletteExpanded(true);
    }
  }, [theme.accent]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Body metrics local string state for fluid typing
  const [localWeight, setLocalWeight] = useState<string>(
    profile.weightKg > 0 ? (isMetric ? profile.weightKg.toString() : units.kgToLbs(profile.weightKg).toString()) : ''
  );
  const [localHeight, setLocalHeight] = useState<string>(
    profile.heightCm > 0 ? profile.heightCm.toString() : ''
  );

  // Real-time theme mode handler (Dark, Light, Translucent Glass)
  const handleModeChange = (mode: ThemeMode) => {
    onUpdateTheme({ ...theme, mode });
  };

  // Real-time accent color handler
  const handleAccentChange = (accent: AccentColor) => {
    onUpdateTheme({ ...theme, accent });
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Translucent Floating Modal */}
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl p-4 sm:p-5 space-y-3.5 animate-card-expand relative my-auto max-h-[90vh] flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Live Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-[2px] rounded-xl ig-story-ring shrink-0">
              <div className="w-8 h-8 rounded-[10px] bg-slate-950 flex items-center justify-center text-white">
                <Sliders className="w-4 h-4 accent-text" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">App Settings & Customization</h2>
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

        <div className="space-y-3 overflow-y-auto pr-0.5">
          {/* SECTION 1: BODY METRICS (WEIGHT & HEIGHT) */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 accent-text" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Body Metrics (Weight & Height)
                </label>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Live Biometrics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-500 font-mono">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/40"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-500 font-mono">
                    cm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: THEME & COLOR CUSTOMIZATION */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 accent-text" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Theme & Accent Color
                </label>
              </div>
              <span className="text-[10px] accent-text font-mono font-bold capitalize">
                {theme.mode} mode
              </span>
            </div>

            {/* 3-Way Mode Switcher: Dark OLED, Translucent Glass, Light Glass */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('dark')}
                className={`p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  theme.mode === 'dark'
                    ? 'bg-white/15 border-white/40 text-white shadow-md ring-1 ring-white/30'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Moon className="w-4 h-4 accent-text" />
                <span>Dark OLED</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('glass')}
                className={`p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
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
                className={`p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                  theme.mode === 'light'
                    ? 'bg-white/90 border-amber-400 text-slate-900 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Glass</span>
              </button>
            </div>

            {/* Accent Color Palette - 5-Column Swatch Grid with 2-Row Compact View & Expand Button */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Accent Color
                </label>
                <span className="text-[11px] accent-text font-mono font-black tracking-wider uppercase">
                  {((ACCENT_THEMES as any)[theme.accent]?.name || 'EMERALD GREEN').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-y-3 gap-x-2 pt-1">
                {/* Render Swatches (9 when collapsed, 20 when expanded) */}
                {(isPaletteExpanded
                  ? (Object.keys(ACCENT_THEMES) as Array<keyof typeof ACCENT_THEMES>)
                  : (Object.keys(ACCENT_THEMES) as Array<keyof typeof ACCENT_THEMES>).slice(0, 9)
                ).map((key) => {
                  const pal = ACCENT_THEMES[key];
                  const isSelected = theme.accent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAccentChange(key as AccentColor)}
                      className="group flex flex-col items-center gap-1 p-0.5 rounded-xl transition-all cursor-pointer"
                      title={pal.name}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shadow-md shrink-0 ${
                          isSelected
                            ? 'border-white scale-110 ring-2 ring-white/70 shadow-lg'
                            : (key === 'obsidian_black' || key === 'pitch_black')
                              ? 'border-white/40 hover:border-white/80 hover:scale-105'
                              : 'border-white/20 hover:border-white/60 hover:scale-105'
                        }`}
                        style={{ backgroundColor: pal.hex }}
                      >
                        {isSelected && (
                          <Check className={`w-4 h-4 drop-shadow-sm font-black ${pal.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                        )}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 group-hover:text-white leading-tight text-center max-w-full break-words">
                        {pal.name}
                      </span>
                    </button>
                  );
                })}

                {/* 10th slot toggle button: + Expand when collapsed, - Collapse when expanded */}
                <button
                  type="button"
                  onClick={() => setIsPaletteExpanded(!isPaletteExpanded)}
                  className="group flex flex-col items-center justify-center gap-1 p-0.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/20 transition-all cursor-pointer h-full min-h-[58px]"
                  title={isPaletteExpanded ? "Collapse color palette" : "Expand color palette"}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/30 text-white font-bold group-hover:scale-110 transition-transform shadow-sm">
                    {isPaletteExpanded ? (
                      <Minus className="w-4 h-4 text-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 group-hover:text-white leading-tight text-center">
                    {isPaletteExpanded ? '- Collapse' : '+ Expand'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Daily Step Target & Units */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
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
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Units</span>
                <span className="text-cyan-400 font-mono uppercase">{profile.units}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleUnits}
                className="w-full py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Switch to {profile.units === 'metric' ? 'Imperial' : 'Metric'}</span>
              </button>
            </div>
          </div>

          {/* Accurate Phone GPS Sensor */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 accent-text" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Accurate Phone GPS Sensor
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {profile.location || 'Current'}
              </span>
            </div>

            {gpsStatus && (
              <div className="text-[11px] accent-text accent-bg-light p-2 rounded-xl border border-white/15 font-mono">
                {gpsStatus}
              </div>
            )}

            <button
              onClick={handleRequestGPS}
              disabled={gpsLoading}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Locking Satellite GPS...' : 'Acquire High-Accuracy GPS'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
