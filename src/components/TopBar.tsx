import React from 'react';
import { Flame, CheckCircle2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { UnitSystem, UserProfile } from '../types/fitness';
import { AppThemeSettings } from '../types/aiWorkout';
import { t } from '../utils/i18n';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  units: UnitSystem;
  onToggleUnits: () => void;
  onResetData?: () => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  profile: UserProfile;
  onOpenSettings: () => void;
  theme: AppThemeSettings;
  language?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  units,
  onToggleUnits,
  onGoogleSignIn,
  onLogout,
  isAuthenticated,
  authLoading,
  profile,
  onOpenSettings,
  theme,
  language = 'en',
}) => {
  // Navigation layout with the 5 core tabs
  const navItems = [
    { id: 'dashboard', label: t('dashboard', language) },
    { id: 'gym', label: t('gym', language) },
    { id: 'biometrics', label: t('biometrics', language) },
    { id: 'ai-coach', label: t('aiCoach', language), isAi: true },
    { id: 'friends', label: t('friends', language) },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors ${
      theme.mode === 'light' ? 'bg-white/70 border-black/5' : 'bg-slate-950/80 border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-center relative">
        {/* Centered Brand Title with Modern 3D Typography */}
        <div className="flex items-center justify-center select-none z-20">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="group cursor-pointer focus:outline-none transition-transform active:scale-95"
          >
            <span 
              className={`text-xl sm:text-2xl font-extrabold tracking-tighter uppercase transition-all duration-300 inline-block ${
                theme.mode === 'light' ? 'text-slate-900' : 'text-white'
              }`}
              style={{
                fontFamily: "'Syncopate', 'Orbitron', sans-serif",
                textShadow: theme.mode === 'light' 
                  ? '0 0.5px 0 #bbb, 0 1px 0 #aaa, 0 1.5px 0 #999, 0 2px 0.5px rgba(0,0,0,.1), 0 0 10px var(--accent-hex)'
                  : '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15), 0 0 15px var(--accent-hex)',
                WebkitTextStroke: theme.mode === 'light' ? '0.3px rgba(0,0,0,0.1)' : '0.5px rgba(255,255,255,0.2)'
              }}
            >
              Overhaul
            </span>
          </button>
        </div>

        {/* Right side actions - Google Connect (Absolute right to keep title centered) */}
        <div className="absolute right-3 sm:right-6 lg:right-8 flex items-center gap-2 z-20">
          {/* Google Connect Button */}
          {!isAuthenticated ? (
            <button
              onClick={onGoogleSignIn}
              disabled={authLoading}
              title="Connect Google Account"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="hidden xs:inline">{authLoading ? '...' : t('connect', language)}</span>
            </button>
          ) : (
            <div
              title={`Connected as ${profile.name} (${profile.email || ''})`}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-white/10 text-emerald-300 border border-white/15 cursor-pointer hover:bg-white/15"
              onClick={() => {
                if (window.confirm(t('logoutConfirm', language) || 'Sign out of Google?')) {
                  onLogout();
                }
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[60px] sm:max-w-[100px]">{profile.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
