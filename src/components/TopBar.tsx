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
  currentTab,
  onSelectTab,
  theme,
  isVisible = true,
}) => {
  const isLight = theme?.mode === 'light';
  const isDashboard = currentTab === 'dashboard';

  if (!isDashboard) {
    return null;
  }

  return (
    <header
      className={`top-overhaul-header sticky top-0 z-40 w-full bg-transparent select-none transition-all duration-300 ease-out overflow-hidden shrink-0 ${
        isVisible ? 'h-14' : 'h-0 pointer-events-none'
      }`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Ultra-minimal Instagram-Style Header: ONLY the centered cursive wordmark on Dashboard */}
      <div className="w-full px-4 h-14 flex items-center justify-center relative max-w-7xl mx-auto">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="group cursor-pointer focus:outline-none transition-transform active:scale-95 flex items-center justify-center py-1"
          aria-label="Overhaul Home"
        >
          <span
            className={`brand-wordmark-enter text-[29px] sm:text-[32px] leading-none font-normal tracking-wide text-center antialiased select-none ${
              isLight ? 'text-[#0F172A]' : 'text-white'
            }`}
            style={{
              fontFamily: "'Grand Hotel', 'Billabong', 'Satisfy', 'Playfair Display', cursive, sans-serif",
              letterSpacing: '0.02em',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Overhaul
          </span>
        </button>
      </div>
    </header>
  );
};
