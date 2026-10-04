import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Compass,
  Check,
  Smartphone,
  Scale,
  Sparkles,
  Plus,
  Minus,
  Activity,
  Users,
  RotateCcw,
  Loader2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Toast } from '@capacitor/toast';
import { AccentColor, AppThemeSettings, ThemeMode } from '../types/aiWorkout';
import { ACCENT_COLOR_FAMILIES, ACCENT_THEMES } from '../utils/theme';
import { getAccurateDeviceGPS } from '../utils/weather';
import { UserProfile } from '../types/fitness';
import { units } from '../utils/calculations';
import {
  checkHealthConnectPermissionsGranted,
  requestHealthConnectPermissions,
} from '../utils/healthConnect';
import {
  checkContactsPermissionsGranted,
  requestContactsPermissions,
} from '../utils/contacts';

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
}) => {
  const isMetric = profile.units === 'metric';
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Native Sensor Sync states: strictly default to false until verified by native OS permission check
  const [hcEnabled, setHcSupportedEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);
  const [hcLoading, setHcLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Verify actual native OS permission state on mount and when returning from Android System Settings / Play Store
  useEffect(() => {
    async function verifyNativePermissions() {
      const hcGranted = await checkHealthConnectPermissionsGranted();
      setHcSupportedEnabled(hcGranted);
      localStorage.setItem('overhaul_hc_linked', hcGranted ? 'true' : 'false');

      const contactsGranted = await checkContactsPermissionsGranted();
      setContactsEnabled(contactsGranted);
      localStorage.setItem('overhaul_contacts_linked', contactsGranted ? 'true' : 'false');
    }
    verifyNativePermissions();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyNativePermissions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', verifyNativePermissions);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', verifyNativePermissions);
    };
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

  const handleToggleLiquidGlass = () => {
    const current = theme.liquidGlass !== false;
    onUpdateTheme({ ...theme, liquidGlass: !current });
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
    setGpsStatus('Acquiring GPS...');
    try {
      const coords = await getAccurateDeviceGPS();
      if (coords) {
        onGpsUpdated(coords);
        onUpdateProfile({
          ...profile,
          location: coords.cityName || `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
        });
        setGpsStatus(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${coords.cityName || 'Local'})`);
      } else {
        setGpsStatus('Location permission denied or timed out.');
      }
    } catch {
      setGpsStatus('Error acquiring device location.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Samsung Health Sync:
  // Directly invokes native Health Connect authorization; if uninstalled, launches Google Play Store intent directly.
  const handleHealthButtonClick = async () => {
    if (hcEnabled) {
      setHcSupportedEnabled(false);
      localStorage.setItem('overhaul_hc_linked', 'false');
      Toast.show({ text: 'Samsung Health unlinked.', duration: 'short' }).catch(() => {});
      return;
    }

    setHcLoading(true);
    const safetyTimer = setTimeout(() => {
      setHcLoading(false);
    }, 12000);

    try {
      const permitted = await Promise.race([
        requestHealthConnectPermissions(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 12000)),
      ]);

      if (permitted === true) {
        setHcSupportedEnabled(true);
        localStorage.setItem('overhaul_hc_linked', 'true');
        Toast.show({ text: 'Samsung Health linked.', duration: 'short' }).catch(() => {});
      } else {
        setHcSupportedEnabled(false);
        localStorage.setItem('overhaul_hc_linked', 'false');
      }
    } catch {
      setHcSupportedEnabled(false);
      localStorage.setItem('overhaul_hc_linked', 'false');
    } finally {
      clearTimeout(safetyTimer);
      setHcLoading(false);
    }
  };

  // Address Book Sync:
  // Executes Capacitor's native runtime permission request directly: `await Contacts.requestPermissions()`.
  // If permanently blocked by Android, opens `NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails })`.
  const handleContactsButtonClick = async () => {
    if (contactsEnabled) {
      setContactsEnabled(false);
      localStorage.setItem('overhaul_contacts_linked', 'false');
      Toast.show({ text: 'Address book unlinked.', duration: 'short' }).catch(() => {});
      return;
    }

    setContactsLoading(true);
    const safetyTimer = setTimeout(() => {
      setContactsLoading(false);
    }, 12000);

    try {
      const permitted = await Promise.race([
        requestContactsPermissions(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 12000)),
      ]);
      if (permitted === true) {
        setContactsEnabled(true);
        localStorage.setItem('overhaul_contacts_linked', 'true');
        const { fetchDeviceContacts } = await import('../utils/contacts');
        await fetchDeviceContacts();
        Toast.show({ text: 'Address Book linked.', duration: 'short' }).catch(() => {});
      } else {
        setContactsEnabled(false);
        localStorage.setItem('overhaul_contacts_linked', 'false');
      }
    } catch {
      setContactsEnabled(false);
      localStorage.setItem('overhaul_contacts_linked', 'false');
    } finally {
      clearTimeout(safetyTimer);
      setContactsLoading(false);
    }
  };

  // Hard Reset App Cache and Data state
  const handleResetAllData = () => {
    if (
      window.confirm(
        'DANGER: Wiping all local storage data, lift history, step counts, and metrics. This resets Overhaul to a zeroed-out state and reloads. Proceed?'
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const activeAccentName = ((ACCENT_THEMES as any)[theme.accent]?.name || 'Emerald Green').toUpperCase();

  return (
    <div className="flex-1 min-h-full flex flex-col justify-start overflow-y-auto p-2 sm:p-3 pb-16 max-w-7xl mx-auto w-full gap-2.5 select-none font-sans bg-transparent">
      {/* Compact 44px Inline Settings Top Header Pill */}
      <div
        className="card pill dashboard-item ig-glass-card glass-card-light rounded-2xl flex items-center justify-start gap-2.5 shrink-0"
        style={{ height: '44px', minHeight: '44px', padding: '0 16px' }}
      >
        <SettingsIcon className="w-[18px] h-[18px] accent-text shrink-0" />
        <h1 className="text-[14px] font-semibold uppercase tracking-wider text-inherit leading-none">
          SETTINGS
        </h1>
      </div>

      {/* Scrollable Settings Controls resting directly on the main canvas */}
      <div className="space-y-4 bg-transparent">
        {/* SECTION 1: BODY METRICS (Direct on Canvas) */}
        <section className="space-y-2 bg-transparent">
          <div className="flex items-center gap-2 px-1 pb-1 border-b border-black/10 dark:border-white/10">
            <Scale className="w-4 h-4 accent-text" />
            <h2 className="text-xs font-black uppercase text-inherit">Body Metrics & Unit Configurations</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 bg-transparent">
            {/* Weight Card */}
            <div className="card dashboard-item ig-glass-card glass-card-light p-3 rounded-2xl">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                Body Weight ({isMetric ? 'kg' : 'lbs'})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={localWeight}
                  onChange={(e) => handleWeightUpdate(e.target.value)}
                  placeholder="e.g. 75"
                  className="pill glass-input-light w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-inherit font-mono focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                  {isMetric ? 'kg' : 'lbs'}
                </span>
              </div>
            </div>

            {/* Height Card */}
            <div className="card dashboard-item ig-glass-card glass-card-light p-3 rounded-2xl">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                Height (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={localHeight}
                  onChange={(e) => handleHeightUpdate(e.target.value)}
                  placeholder="e.g. 180"
                  className="pill glass-input-light w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-inherit font-mono focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">cm</span>
              </div>
            </div>

            {/* Steps Target Card */}
            <div className="card dashboard-item ig-glass-card glass-card-light p-3 rounded-2xl">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                Daily Step Goal
              </label>
              <div className="pill glass-input-light flex items-center gap-1 rounded-xl p-1 justify-between border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleStepGoalChange(Math.max(1000, profile.stepGoal - 1000))}
                  className="p-1.5 rounded-lg hover:opacity-80 text-inherit active:scale-90 transition-all cursor-pointer font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold font-mono text-inherit tabular-nums">
                  {profile.stepGoal.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleStepGoalChange(profile.stepGoal + 1000)}
                  className="p-1.5 rounded-lg hover:opacity-80 text-inherit active:scale-90 transition-all cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Unit System Card */}
            <div className="card dashboard-item ig-glass-card glass-card-light p-3 rounded-2xl">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                System of Units
              </label>
              <button
                type="button"
                onClick={handleToggleUnits}
                className="pill glass-input-light w-full py-2 rounded-xl text-xs font-bold text-inherit border border-black/10 dark:border-white/10 transition-colors uppercase cursor-pointer text-center"
              >
                {profile.units === 'metric' ? 'Metric (kg, cm, km)' : 'Imperial (lbs, in, mi)'}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: THEMES & ACCENTS (Direct on Canvas) */}
        <section className="space-y-2.5 bg-transparent">
          <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-black/10 dark:border-white/10 flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              <Palette className="w-4 h-4 accent-text shrink-0" />
              <h2 className="text-xs font-black uppercase text-inherit whitespace-nowrap">THEMES & ACCENTS</h2>
            </div>
            <span
              className="text-xs font-black uppercase tracking-wider font-mono whitespace-nowrap shrink-0"
              style={{ color: 'var(--accent-hex)' }}
            >
              {activeAccentName}
            </span>
          </div>

          {/* Appearance Mode Switcher: Dark Mode vs Light Mode */}
          <div className="grid grid-cols-2 gap-2.5 bg-transparent">
            <button
              type="button"
              onClick={() => handleModeChange('dark')}
              className={`card pill settings-item ig-glass-card glass-card-light p-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                theme.mode === 'dark' ? 'ring-1 ring-current font-black shadow-sm' : 'opacity-75 hover:opacity-100'
              }`}
              style={theme.mode === 'dark' ? { borderColor: 'var(--accent-hex)' } : undefined}
            >
              <Moon className="w-3.5 h-3.5 accent-text" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('light')}
              className={`card pill settings-item ig-glass-card glass-card-light p-2.5 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                theme.mode === 'light' ? 'ring-1 ring-current font-black shadow-sm' : 'opacity-75 hover:opacity-100'
              }`}
              style={theme.mode === 'light' ? { borderColor: 'var(--accent-hex)' } : undefined}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
            </button>
          </div>

          {/* Liquid Glass Toggle: ON in vibrant green, OFF in bold red */}
          <div className="card pill settings-item ig-glass-card glass-card-light flex items-center justify-between p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 accent-text" />
              <div>
                <div className="text-xs font-bold text-inherit">Liquid Glass</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Frosted blur & specular rim highlights</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleLiquidGlass}
              className={`px-3.5 py-1 rounded-xl text-xs font-mono font-black transition-all cursor-pointer border ${
                theme.liquidGlass !== false
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 dark:text-emerald-400'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              {theme.liquidGlass !== false ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 36-Swatch Color Palette Grid resting directly on the main canvas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-transparent">
            {ACCENT_COLOR_FAMILIES.map((fam) => {
              const tones = [
                { ...fam.light, label: 'Light' },
                { ...fam.normal, label: 'Normal' },
                { ...fam.dark, label: 'Dark' },
              ];
              const activeTone = tones.find((tItem) => theme.accent === tItem.key);
              const singleLineTitle = activeTone
                ? `${fam.family} ${activeTone.label}`.toUpperCase()
                : fam.family.toUpperCase();
              return (
                <div
                  key={fam.family}
                  className="card dashboard-item settings-item ig-glass-card glass-card-light p-2.5 rounded-2xl flex flex-col gap-1.5"
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider text-inherit whitespace-nowrap overflow-hidden text-ellipsis block"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {singleLineTitle}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {tones.map((tItem) => {
                      const isSelected = theme.accent === tItem.key;
                      return (
                        <button
                          key={tItem.key}
                          type="button"
                          onClick={() => handleAccentChange(tItem.key)}
                          className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-md z-10'
                              : 'hover:scale-95 opacity-90 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: tItem.hex }}
                          title={`${tItem.name} (${tItem.label} Tone)`}
                          aria-label={`Select ${tItem.name}`}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 stroke-[3] ${
                                tItem.label === 'Dark' ? 'text-white' : 'text-slate-950'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: SENSOR SYNCS (Direct on Canvas) */}
        <section className="space-y-2 bg-transparent">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 accent-text" />
              <h2 className="text-xs font-black uppercase text-inherit">SENSOR SYNCS</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-transparent">
            {/* Samsung Health */}
            <div className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card flex items-center justify-between p-3 rounded-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="pill w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-inherit truncate">Samsung Health</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Steps & Sleep</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleHealthButtonClick}
                disabled={hcLoading}
                className={`pill px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  hcEnabled
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-inherit hover:opacity-90'
                }`}
                style={!hcEnabled ? { borderColor: 'var(--accent-border)' } : undefined}
              >
                {hcLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{hcEnabled ? 'LINKED' : 'ENABLE SYNC'}</span>
              </button>
            </div>

            {/* Address Book */}
            <div className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card flex items-center justify-between p-3 rounded-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="pill w-8 h-8 rounded-xl flex items-center justify-center text-violet-500 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-inherit truncate">Address Book</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Match Friends</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContactsButtonClick}
                disabled={contactsLoading}
                className={`pill px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  contactsEnabled
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-inherit hover:opacity-90'
                }`}
                style={!contactsEnabled ? { borderColor: 'var(--accent-border)' } : undefined}
              >
                {contactsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{contactsEnabled ? 'LINKED' : 'ENABLE SYNC'}</span>
              </button>
            </div>

            {/* Phone GPS Lock */}
            <div className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card flex flex-col justify-center gap-1.5 p-3 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="pill w-8 h-8 rounded-xl flex items-center justify-center text-cyan-500 shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-inherit truncate">Phone GPS Lock</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Coordinates</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestGPS}
                  disabled={gpsLoading}
                  className="pill px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-inherit border transition-colors disabled:opacity-50 cursor-pointer text-center shrink-0"
                  style={{ borderColor: 'var(--accent-border)' }}
                >
                  {gpsLoading ? 'Locking...' : 'Lock GPS'}
                </button>
              </div>
              {gpsStatus && (
                <p className="text-[9px] font-mono accent-text border-t border-black/5 dark:border-white/5 pt-1 mt-0.5 truncate">
                  {gpsStatus}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: STORAGE, CACHE, AND CACHE INVALIDATION (Direct on Canvas) */}
        <section className="space-y-2 bg-transparent">
          <div className="flex items-center gap-2 px-1 pb-1 border-b border-rose-500/20">
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-black uppercase text-rose-500">DANGER ZONE & CACHE INVALIDATION</h2>
          </div>

          <div className="card dashboard-item ig-glass-card glass-card-light flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 rounded-2xl">
            <div>
              <h3 className="text-[11px] font-black text-inherit">Reset Local App Cache</h3>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                Wipe custom routines, logged exercises, steps progress, sleep history and re-initialize state.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAllData}
              className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors active:scale-95 cursor-pointer text-center shrink-0 self-end sm:self-auto"
            >
              Wipe State
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
