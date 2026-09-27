import React from 'react';
import { Flame, Plus, RefreshCw, LogIn, CheckCircle2, Sliders, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { UnitSystem, UserProfile } from '../types/fitness';
import { AppThemeSettings } from '../types/aiWorkout';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
  onOpenQuickLog: () => void;
  onResetData: () => void;
  onGoogleSignIn: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  profile: UserProfile;
  onOpenSettings: () => void;
  theme: AppThemeSettings;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  units,
  onToggleUnits,
  onOpenQuickLog,
  onResetData,
  onGoogleSignIn,
  isAuthenticated,
  authLoading,
  profile,
  onOpenSettings,
  theme,
}) => {
  // Navigation layout ordered with Main Page in center
  const navItems = [
    { id: 'biometrics', label: 'Biometrics' },
    { id: 'nutrition', label: 'Fuel' },
    { id: 'dashboard', label: 'Main', isCenter: true },
    { id: 'ai-workouts', label: 'AI Notes & Splits', isAi: true },
    { id: 'gym', label: 'Gym & 1RM' },
    { id: 'sports', label: 'Sports' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-black/40 dark:bg-black/50 backdrop-blur-2xl border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand: Overhaul with Instagram story ring icon */}
        <div className="flex items-center gap-2.5">
          <div className="p-[2px] rounded-2xl ig-story-ring shrink-0 shadow-md">
            <div className="w-8 h-8 rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
              <Flame className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            </div>
          </div>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-left group cursor-pointer"
          >
            <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Overhaul
            </span>
          </button>
        </div>

        {/* Center navigation links - Instagram translucent glass pill bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.05] p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : item.isCenter
                    ? 'text-emerald-400 hover:text-emerald-300 font-extrabold'
                    : item.isAi
                    ? 'text-violet-400 hover:text-violet-300 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.isAi && <Sparkles className="w-3 h-3 text-violet-400" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Google Connect Button */}
          {!isAuthenticated ? (
            <button
              onClick={onGoogleSignIn}
              disabled={authLoading}
              title="Connect Google Account"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{authLoading ? '...' : 'Connect'}</span>
            </button>
          ) : (
            <div
              title={`Connected as ${profile.name} (${profile.email || ''})`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[90px]">{profile.name}</span>
            </div>
          )}

          {/* Unit Toggle */}
          <button
            onClick={onToggleUnits}
            title={`Switch unit system`}
            className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 border border-white/15 transition-all cursor-pointer"
          >
            <span className="font-extrabold text-emerald-400 uppercase">{units}</span>
          </button>

          {/* Customization Settings Button */}
          <button
            onClick={onOpenSettings}
            title="App customization: Dark/Light mode, Accent color, Font & Phone GPS"
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-all cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quick Action Button */}
          <button
            onClick={onOpenQuickLog}
            className="px-3.5 py-2 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log</span>
          </button>
        </div>
      </div>
    </header>
  );
};
