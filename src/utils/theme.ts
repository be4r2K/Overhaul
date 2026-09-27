import { AppThemeSettings } from '../types/aiWorkout';
import { loadFromStorage, saveToStorage } from './storage';

export const DEFAULT_THEME: AppThemeSettings = {
  mode: 'dark',
  accent: 'emerald',
  font: 'sans',
};

export function getStoredTheme(): AppThemeSettings {
  return loadFromStorage('app_theme', DEFAULT_THEME);
}

export function setStoredTheme(theme: AppThemeSettings) {
  saveToStorage('app_theme', theme);
  applyThemeToDOM(theme);
}

export function applyThemeToDOM(theme: AppThemeSettings) {
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute('data-theme', theme.mode);
  root.setAttribute('data-accent', theme.accent);
  root.setAttribute('data-font', theme.font);

  if (body) {
    body.setAttribute('data-theme', theme.mode);
    body.setAttribute('data-accent', theme.accent);
    body.setAttribute('data-font', theme.font);
  }

  const pal = ACCENT_THEMES[theme.accent] || ACCENT_THEMES.emerald;
  root.style.setProperty('--accent-hex', pal.hex);
  root.style.setProperty('--accent-hover', pal.hoverHex);
  root.style.setProperty('--accent-light', pal.bgLightHex);
  root.style.setProperty('--accent-border', pal.bgLightHex.replace('0.12', '0.45'));

  if (body) {
    body.style.setProperty('--accent-hex', pal.hex);
    body.style.setProperty('--accent-hover', pal.hoverHex);
    body.style.setProperty('--accent-light', pal.bgLightHex);
    body.style.setProperty('--accent-border', pal.bgLightHex.replace('0.12', '0.45'));
  }

  // Mode: dark or light
  if (theme.mode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    if (body) {
      body.classList.remove('dark');
      body.classList.add('light');
    }
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    if (body) {
      body.classList.remove('light');
      body.classList.add('dark');
    }
  }

  // Font family
  if (theme.font === 'mono') {
    if (body) body.style.fontFamily = "'JetBrains Mono', monospace";
  } else if (theme.font === 'display') {
    if (body) body.style.fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";
  } else {
    if (body) body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
  }
}

// Accent Color Theme CSS mapping helper
export const ACCENT_THEMES = {
  emerald: {
    name: 'Emerald Green',
    primary: 'emerald',
    text: 'text-emerald-400',
    textDark: 'text-emerald-600',
    bg: 'bg-emerald-400',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-300',
    ring: 'focus:ring-emerald-500',
    hex: '#10b981',
    hoverHex: '#34d399',
    bgLightHex: 'rgba(16, 185, 129, 0.12)',
  },
  cyan: {
    name: 'Electric Cyan',
    primary: 'cyan',
    text: 'text-cyan-400',
    textDark: 'text-cyan-600',
    bg: 'bg-cyan-400',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-300',
    ring: 'focus:ring-cyan-500',
    hex: '#06b6d4',
    hoverHex: '#22d3ee',
    bgLightHex: 'rgba(6, 182, 212, 0.12)',
  },
  violet: {
    name: 'Neon Violet',
    primary: 'violet',
    text: 'text-violet-400',
    textDark: 'text-violet-600',
    bg: 'bg-violet-400',
    bgLight: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    hoverBg: 'hover:bg-violet-300',
    ring: 'focus:ring-violet-500',
    hex: '#8b5cf6',
    hoverHex: '#a78bfa',
    bgLightHex: 'rgba(139, 92, 246, 0.12)',
  },
  amber: {
    name: 'Gold Amber',
    primary: 'amber',
    text: 'text-amber-400',
    textDark: 'text-amber-600',
    bg: 'bg-amber-400',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-300',
    ring: 'focus:ring-amber-500',
    hex: '#f59e0b',
    hoverHex: '#fbbf24',
    bgLightHex: 'rgba(245, 158, 11, 0.12)',
  },
  rose: {
    name: 'Crimson Rose',
    primary: 'rose',
    text: 'text-rose-400',
    textDark: 'text-rose-600',
    bg: 'bg-rose-400',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-300',
    ring: 'focus:ring-rose-500',
    hex: '#f43f5e',
    hoverHex: '#fb7185',
    bgLightHex: 'rgba(244, 63, 94, 0.12)',
  },
  blue: {
    name: 'Sapphire Blue',
    primary: 'blue',
    text: 'text-blue-400',
    textDark: 'text-blue-600',
    bg: 'bg-blue-400',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-300',
    ring: 'focus:ring-blue-500',
    hex: '#3b82f6',
    hoverHex: '#60a5fa',
    bgLightHex: 'rgba(59, 130, 246, 0.12)',
  },
};
