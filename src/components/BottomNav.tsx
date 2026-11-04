import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Dumbbell, Activity, Users, Settings } from 'lucide-react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { t } from '../utils/i18n';

import { AppThemeSettings } from '../types/aiWorkout';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language?: string;
  isVisible?: boolean;
  theme?: AppThemeSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  language = 'en',
  isVisible = true,
  theme,
}) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isLight = theme?.mode === 'light';
  const isGlassOn = theme?.liquidGlass !== false;

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
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="bottom-nav-container nav-bar-container keyboard-auto-hide fixed z-[100] pointer-events-none"
          style={{
            position: 'fixed',
            bottom: '12px',
            left: '12px',
            right: '12px',
            width: 'calc(100% - 24px)',
            maxWidth: '440px',
            margin: '0 auto',
            zIndex: 100,
            boxShadow: 'none',
            filter: 'none',
            background: 'transparent',
          }}
        >
      {/* Unified 5-Tab Floating Island Navigation Bar */}
      <nav
        className="nav-bar glass-nav-bar flex items-center justify-around pointer-events-auto w-full"
        style={{
          borderRadius: '28px',
          height: '60px',
          padding: '0 8px',
          boxSizing: 'border-box',
          background: isLight
            ? isGlassOn
              ? 'rgba(255, 255, 255, 0.45)'
              : '#ffffff'
            : isGlassOn
            ? 'rgba(18, 14, 28, 0.85)'
            : '#120e1c',
          WebkitBackdropFilter: isGlassOn ? (isLight ? 'blur(18px) saturate(180%)' : 'blur(20px)') : 'none',
          backdropFilter: isGlassOn ? (isLight ? 'blur(18px) saturate(180%)' : 'blur(20px)') : 'none',
          border: isLight
            ? isGlassOn
              ? '1px solid rgba(255, 255, 255, 0.8)'
              : '1px solid #cbd5e1'
            : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isLight
            ? isGlassOn
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 8px 32px rgba(15, 23, 42, 0.08)'
              : '0 2px 8px rgba(15, 23, 42, 0.06)'
            : '0 12px 32px rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isCenterDashboard = tab.id === 'dashboard';

          if (isCenterDashboard) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`nav-item nav-dashboard-button flex-1 flex flex-col items-center justify-center py-0.5 px-1 rounded-xl cursor-pointer border-0 outline-none ring-0 ${
                  isActive ? 'nav-tab-active nav-dashboard-active' : 'nav-tab-inactive'
                }`}
                style={{
                  margin: 0,
                  top: 0,
                  transform: isActive ? (isLight ? 'translateY(-2px)' : 'translateY(-4px)') : 'translateY(0px)',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  backgroundImage: 'none',
                  boxShadow: 'none',
                  filter: 'none',
                }}
              >
                <div
                  className="flex items-center justify-center transition-all duration-150 shrink-0"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    margin: '0 auto',
                    background: isActive
                      ? isLight
                        ? '#7c3aed'
                        : 'var(--accent-color, var(--accent-hex))'
                      : 'transparent',
                    color: isActive ? '#FFFFFF' : isLight ? '#64748b' : '#FFFFFF',
                    boxShadow: 'none',
                    filter: 'none',
                    border: isActive
                      ? 'none'
                      : isLight
                      ? '1.5px solid #cbd5e1'
                      : '1.5px solid rgba(255, 255, 255, 0.22)',
                  }}
                >
                  <Icon
                    className={`w-[18px] h-[18px] stroke-[2.5] ${
                      isActive ? 'keep-white text-white' : isLight ? 'text-slate-500' : 'text-slate-200'
                    }`}
                    style={{ color: isActive ? '#FFFFFF' : isLight ? '#64748b' : '#E2E8F0' }}
                  />
                </div>
                <span
                  className={`text-[10px] leading-tight tracking-tight mt-0.5 truncate max-w-[68px] text-center ${
                    isActive ? 'font-black' : 'font-semibold'
                  }`}
                  style={{
                    color: isActive
                      ? isLight
                        ? '#7c3aed'
                        : '#ffffff'
                      : isLight
                      ? '#64748b'
                      : '#94a3b8',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`nav-item flex-1 flex flex-col items-center justify-center py-0.5 px-1 rounded-xl cursor-pointer bg-transparent border-0 outline-none ring-0 ${
                isActive
                  ? 'nav-tab-active nav-item-active font-extrabold'
                  : 'nav-tab-inactive'
              }`}
              style={{
                margin: 0,
                top: 0,
                transform: isActive ? (isLight ? 'translateY(-2px)' : 'translateY(-4px)') : 'translateY(0px)',
                transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: 'transparent',
                backgroundImage: 'none',
                color: isActive
                  ? isLight
                    ? '#7c3aed'
                    : 'var(--accent-color, var(--accent-hex))'
                  : isLight
                  ? '#64748b'
                  : '#94a3b8',
                boxShadow: 'none',
                filter: 'none',
              }}
            >
              <div
                className="flex items-center justify-center border-0 outline-none ring-0 transition-all duration-150"
                style={{
                  width: '32px',
                  height: '28px',
                  margin: '0 auto',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: isActive
                    ? isLight
                      ? '#7c3aed'
                      : 'var(--accent-color, var(--accent-hex))'
                    : isLight
                    ? '#64748b'
                    : '#94a3b8',
                  boxShadow: 'none',
                  filter: 'none',
                }}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${
                    isActive
                      ? isLight
                        ? 'stroke-[2.5]'
                        : 'stroke-[2.5] accent-text'
                      : 'stroke-[2]'
                  }`}
                  style={{
                    color: isActive
                      ? isLight
                        ? '#7c3aed'
                        : 'var(--accent-color, var(--accent-hex))'
                      : isLight
                      ? '#64748b'
                      : '#94a3b8',
                  }}
                />
              </div>
              <span
                className={`text-[10px] leading-tight tracking-tight mt-0.5 truncate max-w-[64px] text-center ${
                  isActive
                    ? isLight
                      ? 'font-bold'
                      : 'font-bold accent-text'
                    : 'font-medium'
                }`}
                style={{
                  color: isActive
                    ? isLight
                      ? '#7c3aed'
                      : 'var(--accent-color, var(--accent-hex))'
                    : isLight
                    ? '#64748b'
                    : '#94a3b8',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
