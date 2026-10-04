import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Dumbbell, Activity, Users, Settings } from 'lucide-react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { t } from '../utils/i18n';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language?: string;
  isVisible?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  language = 'en',
  isVisible = true,
}) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let showListener: any = null;
    let hideListener: any = null;

    if (Capacitor.isNativePlatform()) {
      try {
        Keyboard.addListener('keyboardWillShow', () => {
          setIsKeyboardVisible(true);
          document.body.classList.add('keyboard-open');
        }).then((l: any) => { showListener = l; }).catch(() => {});

        Keyboard.addListener('keyboardDidShow', () => {
          setIsKeyboardVisible(true);
          document.body.classList.add('keyboard-open');
        }).catch(() => {});

        Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
          document.body.classList.remove('keyboard-open');
        }).then((l: any) => { hideListener = l; }).catch(() => {});

        Keyboard.addListener('keyboardDidHide', () => {
          setIsKeyboardVisible(false);
          document.body.classList.remove('keyboard-open');
        }).catch(() => {});
      } catch (e) {
        console.warn('Capacitor Keyboard listener bypassed:', e);
      }
    }

    const handleViewportResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight * 0.75;
        setIsKeyboardVisible(isShrunk);
        if (isShrunk) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      if (showListener && typeof showListener.remove === 'function') showListener.remove();
      if (hideListener && typeof hideListener.remove === 'function') hideListener.remove();
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  const tabs = [
    { id: 'gym', label: 'Tracker', icon: Dumbbell },
    { id: 'biometrics', label: t('biometrics', language), icon: Activity },
    { id: 'dashboard', label: t('dashboard', language), icon: LayoutDashboard },
    { id: 'friends', label: 'Social', icon: Users },
    { id: 'settings', label: t('settings', language), icon: Settings },
  ];

  return (
    <div
      className="bottom-nav-container keyboard-auto-hide fixed bottom-0 inset-x-0 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 px-3 pointer-events-none transition-transform duration-300 ease-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      <div className={`max-w-md mx-auto ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Unified 5-Tab Liquid Glass Navigation Bar */}
        <nav className="nav-bar glass-nav-bar card pill rounded-2xl p-1.5 flex items-center justify-around relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl cursor-pointer border-0 outline-none ring-0 transition-transform duration-150 ${
                  isActive
                    ? 'text-inherit font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-inherit'
                }`}
              >
                <div
                  className="p-2 rounded-xl flex items-center justify-center border-0 outline-none ring-0 transition-all duration-150"
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--accent-hex)',
                          color: '#000000',
                          boxShadow: '0 4px 14px var(--accent-glow, rgba(16, 185, 129, 0.35))',
                        }
                      : {
                          backgroundColor: 'transparent',
                        }
                  }
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.9]'}`} />
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] text-center ${
                    isActive ? 'font-black accent-text' : 'font-semibold'
                  }`}
                  style={isActive ? { color: 'var(--accent-hex)' } : undefined}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
