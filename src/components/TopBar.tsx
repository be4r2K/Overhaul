import React from 'react';
import { UnitSystem, UserProfile } from '../types/fitness';
import { AppThemeSettings } from '../types/aiWorkout';

interface TopBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  units?: UnitSystem;
  onToggleUnits?: () => void;
  onResetData?: () => void;
  onGoogleSignIn?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  authLoading?: boolean;
  profile?: UserProfile;
  onOpenSettings?: () => void;
  theme?: AppThemeSettings;
  language?: string;
  isVisible?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSelectTab,
  theme,
}) => {
  const isLight = theme?.mode === 'light';

  return (
    <header
      className="top-overhaul-header sticky top-0 z-50 w-full bg-transparent select-none overflow-visible shrink-0 h-9 opacity-100"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: '36px',
        minHeight: '36px',
      }}
    >
      {/* Permanently pinned Top Header with Clean Plus Jakarta Sans Logo */}
      <div className="w-full px-3 h-9 flex items-center justify-center relative max-w-md mx-auto">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="group cursor-pointer focus:outline-none transition-transform active:scale-95 flex items-center justify-center gap-2"
          aria-label="Overhaul Home"
        >
          <img
            src="/icon.png"
            alt="Overhaul Icon"
            className="w-5 h-5 rounded-md shadow-sm border border-emerald-500/30 object-cover shrink-0 select-none pointer-events-none"
            loading="eager"
          />
          <span
            className="overhaul-logo-wordmark brand-wordmark-enter text-center antialiased select-none uppercase inline-block align-baseline"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '19px',
              letterSpacing: '3.5px',
              fontWeight: 900,
              lineHeight: 1,
              textTransform: 'uppercase',
              transform: 'none',
              width: 'auto',
              color: isLight ? '#0f172a' : '#ffffff',
              textShadow: 'none',
              filter: 'none',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            <span 
              className="brand-accent" 
              style={{ 
                color: 'var(--accent-hex, var(--accent-color, #10b981))',
                display: 'inline-block',
                verticalAlign: 'baseline',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                lineHeight: 'inherit',
                letterSpacing: 'inherit',
                transform: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              O
            </span>
            VERHAUL
          </span>
        </button>
      </div>
    </header>
  );
};
