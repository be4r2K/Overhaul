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
  onGoogleSignIn?: () => Promise<void> | void;
  isAuthenticated?: boolean;
  authLoading?: boolean;
  language?: string;
  onScrollNavVisibilityChange?: (visible: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onUpdateTheme,
  profile,
  onUpdateProfile,
  onGpsUpdated,
  onGoogleSignIn,
  isAuthenticated = false,
  authLoading = false,
  onScrollNavVisibilityChange,
}) => {
  const isMetric = profile.units === 'metric';
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Restore bottom nav when leaving Settings
  useEffect(() => {
    return () => {
      onScrollNavVisibilityChange?.(true);
    };
  }, [onScrollNavVisibilityChange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    if (currentY > lastScrollY + 12 && currentY > 30) {
      // Scroll Down -> Hide bottom nav
      onScrollNavVisibilityChange?.(false);
    } else if (currentY < lastScrollY - 12 || currentY <= 15) {
      // Scroll Up -> Show bottom nav
      onScrollNavVisibilityChange?.(true);
    }
    setLastScrollY(currentY);
  };

  const isGoogleLinked = Boolean(profile.authProvider === 'google' || (isAuthenticated && profile.authProvider !== 'local'));

  const handleGoogleSyncToggle = async () => {
    if (isGoogleLinked) {
      onUpdateProfile({
        ...profile,
        authProvider: 'local',
      });
      Toast.show({ text: 'Google Account unlinked.', duration: 'short' }).catch(() => {});
      return;
    }

    setGoogleSyncLoading(true);
    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      }
      onUpdateProfile({
        ...profile,
        authProvider: 'google',
        email: profile.email || 'christian.salameh@gmail.com',
        photoUrl:
          profile.photoUrl ||
          `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#041318" font-family="sans-serif" font-weight="900" font-size="48">CS</text></svg>'
          )}`,
      });
      Toast.show({ text: 'Google Account linked.', duration: 'short' }).catch(() => {});
    } catch {
      // Handled silently
    } finally {
      setGoogleSyncLoading(false);
    }
  };

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
    const nextGlass = theme.liquidGlass === false;
    if (typeof document !== 'undefined') {
      const rootEl = document.getElementById('root');
      document.documentElement?.classList.toggle('liquid-glass-enabled', nextGlass);
      document.documentElement?.classList.toggle('liquid-glass-active', nextGlass);
      document.documentElement?.classList.toggle('solid-flat', !nextGlass);
      document.documentElement?.setAttribute('data-glass', nextGlass ? 'true' : 'false');
      document.body?.classList.toggle('liquid-glass-enabled', nextGlass);
      document.body?.classList.toggle('liquid-glass-active', nextGlass);
      document.body?.classList.toggle('solid-flat', !nextGlass);
      document.body?.setAttribute('data-glass', nextGlass ? 'true' : 'false');
      rootEl?.classList.toggle('liquid-glass-enabled', nextGlass);
      rootEl?.classList.toggle('liquid-glass-active', nextGlass);
      rootEl?.classList.toggle('solid-flat', !nextGlass);
      rootEl?.setAttribute('data-glass', nextGlass ? 'true' : 'false');
    }
    onUpdateTheme({ ...theme, liquidGlass: nextGlass });
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
    <div
      onScroll={handleScroll}
      className="page-container settings-page settings-page-container h-full max-h-full flex-1 min-h-0 flex flex-col justify-start overflow-y-auto overflow-x-hidden p-2 sm:p-3 pb-[120px] max-w-7xl mx-auto w-full gap-2.5 select-none font-sans bg-transparent"
      style={{ paddingBottom: '120px', background: 'transparent' }}
    >
      {/* Centered Settings Title (No gear icon, no background pill) */}
      <div className="w-full flex items-center justify-center py-3 shrink-0">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white text-center">
          Settings
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
                  className="settings-input pill glass-input-light w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-inherit font-mono focus:outline-none"
                  style={{
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
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
                  className="settings-input pill glass-input-light w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-inherit font-mono focus:outline-none"
                  style={{
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">cm</span>
              </div>
            </div>

            {/* Steps Target Card */}
            <div className="card dashboard-item ig-glass-card glass-card-light p-3 rounded-2xl">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                Daily Step Goal
              </label>
              <div
                className="pill glass-input-light flex items-center gap-1 rounded-xl p-1 justify-between border border-black/10 dark:border-white/10"
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
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
              className="active-theme-badge text-xs font-black uppercase tracking-wider font-mono whitespace-nowrap shrink-0"
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

          {/* 2x2 CSS Grid (Clean Icon-Only Sensor Pills with Far-Left Icon and Far-Right Single-Word Button) */}
          <div 
            className="sensor-sync-grid grid grid-cols-2 gap-2.5 bg-transparent w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              width: '100%',
            }}
          >
            {/* ROW 1 LEFT PILL: Google Sync */}
            <div 
              className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card rounded-2xl flex-1 min-w-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '46px',
                padding: '0 12px',
                borderRadius: '14px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Raw 26px Brand Icon */}
              <svg className="w-[26px] h-[26px] shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>

              {/* Dynamic Action Button: RED when Unlinked (#EF4444), GREEN when Linked (#10B981) */}
              <button
                type="button"
                onClick={handleGoogleSyncToggle}
                disabled={googleSyncLoading || authLoading}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 border-0 outline-none shadow-sm"
                style={{
                  background: isGoogleLinked ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {(googleSyncLoading || authLoading) && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{isGoogleLinked ? 'LINKED' : 'LINK'}</span>
              </button>
            </div>

            {/* ROW 1 RIGHT PILL: Health Sync */}
            <div 
              className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card rounded-2xl flex-1 min-w-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '46px',
                padding: '0 12px',
                borderRadius: '14px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Raw 26px Brand Icon */}
              <Activity className="w-[26px] h-[26px] text-rose-500 shrink-0" />

              {/* Dynamic Action Button: RED when Unlinked (#EF4444), GREEN when Linked (#10B981) */}
              <button
                type="button"
                onClick={handleHealthButtonClick}
                disabled={hcLoading}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 border-0 outline-none shadow-sm"
                style={{
                  background: hcEnabled ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {hcLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{hcEnabled ? 'LINKED' : 'SYNC'}</span>
              </button>
            </div>

            {/* ROW 2 LEFT PILL: Address Book Sync */}
            <div 
              className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card rounded-2xl flex-1 min-w-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '46px',
                padding: '0 12px',
                borderRadius: '14px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Raw 26px Brand Icon */}
              <Users className="w-[26px] h-[26px] text-violet-500 shrink-0" />

              {/* Dynamic Action Button: RED when Unlinked (#EF4444), GREEN when Linked (#10B981) */}
              <button
                type="button"
                onClick={handleContactsButtonClick}
                disabled={contactsLoading}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 border-0 outline-none shadow-sm"
                style={{
                  background: contactsEnabled ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {contactsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{contactsEnabled ? 'LINKED' : 'MATCH'}</span>
              </button>
            </div>

            {/* ROW 2 RIGHT PILL: Phone GPS Lock */}
            <div 
              className="card dashboard-item settings-item ig-glass-card glass-card-light sensor-card rounded-2xl flex-1 min-w-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '46px',
                padding: '0 12px',
                borderRadius: '14px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Raw 26px Brand Icon */}
              <Compass className="w-[26px] h-[26px] text-cyan-500 shrink-0" />

              {/* Dynamic Action Button: GREEN when Locked (#10B981), CYAN when Searching/Unlocking (#06B6D4) */}
              <button
                type="button"
                onClick={handleRequestGPS}
                disabled={gpsLoading}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 border-0 outline-none shadow-sm"
                style={{
                  background: (gpsStatus && (gpsStatus.includes('Locked') || gpsStatus.includes('°'))) ? '#10B981' : '#06B6D4',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {gpsLoading ? '...' : 'LOCK'}
              </button>
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
