import { AppThemeSettings, SignatureAccentColor } from '../types/aiWorkout';
import { loadFromStorage, saveToStorage } from './storage';

export const DEFAULT_THEME: AppThemeSettings = {
  mode: 'dark',
  accent: 'emerald_green',
  font: 'sans',
  liquidGlass: true,
};

export function getStoredTheme(): AppThemeSettings {
  const theme = loadFromStorage('app_theme', DEFAULT_THEME);
  if (theme.liquidGlass === undefined) {
    theme.liquidGlass = true;
  }
  return theme;
}

export function setStoredTheme(theme: AppThemeSettings) {
  saveToStorage('app_theme', theme);
  applyThemeToDOM(theme);
}

export function loadGoogleFontDynamically(fontKey: string) {
  const fontLinks: Record<string, { url: string; family: string }> = {
    inter: {
      url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap",
      family: "'Inter', sans-serif",
    },
    space_grotesk: {
      url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
      family: "'Space Grotesk', sans-serif",
    },
    cinzel: {
      url: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&display=swap",
      family: "'Cinzel', serif",
    },
    rubik: {
      url: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800&display=swap",
      family: "'Rubik', sans-serif",
    },
    mono: {
      url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap",
      family: "'JetBrains Mono', monospace",
    },
    sans: {
      url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap",
      family: "'Plus Jakarta Sans', sans-serif",
    },
  };

  const fontConfig = fontLinks[fontKey] || fontLinks.sans;

  if (typeof document !== 'undefined') {
    try {
      let styleEl = document.getElementById('dynamic-font') as HTMLStyleElement | null;
      if (!styleEl && document.head) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-font';
        document.head.appendChild(styleEl);
      }
      if (styleEl) {
        styleEl.textContent = `@import url('${fontConfig.url}');`;
      }
      if (document.body) {
        document.body.style.fontFamily = fontConfig.family;
      }
      if (document.documentElement) {
        document.documentElement.style.fontFamily = fontConfig.family;
      }
    } catch (e) {
      console.warn('Dynamic font load non-fatal:', e);
    }
  }

  return fontConfig.family;
}

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) || 16;
    const g = parseInt(clean.substring(2, 4), 16) || 185;
    const b = parseInt(clean.substring(4, 6), 16) || 129;
    return `${r}, ${g}, ${b}`;
  }
  return '16, 185, 129';
}

export function applyThemeToDOM(theme?: AppThemeSettings) {
  if (typeof document === 'undefined') return;
  if (!theme) return;

  try {
    const root = document.documentElement;
    const body = document.body;
    const isLiquidGlass = theme.liquidGlass !== false;
    const isLightMode = theme.mode === 'light';

    if (root) {
      root.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
      root.setAttribute('data-glass', isLiquidGlass ? 'true' : 'false');
      root.setAttribute('data-accent', theme.accent);
      root.setAttribute('data-font', theme.font);
    }

    if (body) {
      body.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
      body.setAttribute('data-glass', isLiquidGlass ? 'true' : 'false');
      body.setAttribute('data-accent', theme.accent);
      body.setAttribute('data-font', theme.font);
    }

    let hex = '#10B981';
    let hoverHex = '#34D399';

    if (theme.accent === 'custom' && theme.customHex) {
      hex = theme.customHex.startsWith('#') ? theme.customHex : `#${theme.customHex}`;
      hoverHex = hex;
    } else {
      const pal = (ACCENT_THEMES as any)[theme.accent] || ACCENT_THEMES.emerald_green;
      // Use the exact selected swatch hex (Light, Normal, or Dark tone)
      hex = pal.hex;
      hoverHex = pal.hoverHex || hex;
    }

    const rgb = hexToRgbString(hex);
    const bgLightHex = `rgba(${rgb}, 0.16)`;
    const borderHex = `rgba(${rgb}, 0.45)`;
    const glowHex = `rgba(${rgb}, 0.35)`;
    const specularHex = `rgba(${rgb}, 0.25)`;

    const cssVars = {
      '--accent-hex': hex,
      '--accent-rgb': rgb,
      '--accent-color': hex,
      '--accent-hover': hoverHex,
      '--accent-light': bgLightHex,
      '--accent-border': borderHex,
      '--accent-glow': glowHex,
      '--accent-specular': specularHex,
    };

    if (root) {
      Object.entries(cssVars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    if (body) {
      Object.entries(cssVars).forEach(([k, v]) => body.style.setProperty(k, v));
    }

    // Sync classList (including .liquid-glass-enabled and .light-mode / .dark-mode on html and body)
    if (root) {
      root.classList.remove('dark', 'light', 'dark-mode', 'light-mode', 'glass-theme', 'liquid-glass', 'liquid-glass-active', 'liquid-glass-enabled', 'solid-flat');
      if (isLightMode) {
        root.classList.add('light', 'light-mode');
      } else {
        root.classList.add('dark', 'dark-mode');
      }
      if (isLiquidGlass) {
        root.classList.add('liquid-glass-enabled', 'liquid-glass-active', 'liquid-glass', 'glass-theme');
      } else {
        root.classList.add('solid-flat');
      }
    }

    if (body) {
      body.classList.remove('dark', 'light', 'dark-mode', 'light-mode', 'glass-theme', 'liquid-glass', 'liquid-glass-active', 'liquid-glass-enabled', 'solid-flat');
      if (isLightMode) {
        body.classList.add('light', 'light-mode');
      } else {
        body.classList.add('dark', 'dark-mode');
      }
      if (isLiquidGlass) {
        body.classList.add('liquid-glass-enabled', 'liquid-glass-active', 'liquid-glass', 'glass-theme');
      } else {
        body.classList.add('solid-flat');
      }
    }

    // Font family injection & application
    const resolvedFamily = loadGoogleFontDynamically(theme.font);
    if (body) {
      body.style.fontFamily = resolvedFamily;
    }
    if (root) {
      root.style.fontFamily = resolvedFamily;
    }
  } catch (e) {
    console.warn('applyThemeToDOM error non-fatal:', e);
  }
}

export interface AccentColorFamily {
  family: string;
  light: { key: SignatureAccentColor; name: string; hex: string; hoverHex: string };
  normal: { key: SignatureAccentColor; name: string; hex: string; hoverHex: string };
  dark: { key: SignatureAccentColor; name: string; hex: string; hoverHex: string };
}

/**
 * 12 Color Families × 3 Tone Variations (Light Pastel, Normal Vibrant, Dark Muted) = 36 Swatches
 */
export const ACCENT_COLOR_FAMILIES: AccentColorFamily[] = [
  {
    family: 'Emerald',
    light: { key: 'emerald_light', name: 'Emerald Light', hex: '#6EE7B7', hoverHex: '#A7F3D0' },
    normal: { key: 'emerald_green', name: 'Emerald Green', hex: '#10B981', hoverHex: '#34D399' },
    dark: { key: 'emerald_dark', name: 'Emerald Dark', hex: '#047857', hoverHex: '#059669' },
  },
  {
    family: 'Cobalt',
    light: { key: 'cobalt_light', name: 'Cobalt Light', hex: '#93C5FD', hoverHex: '#BFDBFE' },
    normal: { key: 'deep_cobalt', name: 'Deep Cobalt', hex: '#3B82F6', hoverHex: '#60A5FA' },
    dark: { key: 'cobalt_dark', name: 'Cobalt Dark', hex: '#1D4ED8', hoverHex: '#2563EB' },
  },
  {
    family: 'Cyan',
    light: { key: 'cyan_light', name: 'Cyan Light', hex: '#67E8F9', hoverHex: '#A5F3FC' },
    normal: { key: 'electric_cyan', name: 'Electric Cyan', hex: '#06B6D4', hoverHex: '#22D3EE' },
    dark: { key: 'cyan_dark', name: 'Cyan Dark', hex: '#0E7490', hoverHex: '#0891B2' },
  },
  {
    family: 'Teal',
    light: { key: 'teal_light', name: 'Teal Light', hex: '#5EEAD4', hoverHex: '#99F6E4' },
    normal: { key: 'electric_teal', name: 'Electric Teal', hex: '#14B8A6', hoverHex: '#2DD4BF' },
    dark: { key: 'teal_dark', name: 'Teal Dark', hex: '#0F766E', hoverHex: '#0D9488' },
  },
  {
    family: 'Lime',
    light: { key: 'lime_light', name: 'Lime Light', hex: '#BEF264', hoverHex: '#D9F99D' },
    normal: { key: 'neon_lime', name: 'Neon Lime', hex: '#84CC16', hoverHex: '#A3E635' },
    dark: { key: 'lime_dark', name: 'Lime Dark', hex: '#4D7C0F', hoverHex: '#65A30D' },
  },
  {
    family: 'Amber',
    light: { key: 'amber_light', name: 'Amber Light', hex: '#FCD34D', hoverHex: '#FDE68A' },
    normal: { key: 'amber_gold', name: 'Amber Gold', hex: '#F59E0B', hoverHex: '#FBBF24' },
    dark: { key: 'amber_dark', name: 'Amber Dark', hex: '#B45309', hoverHex: '#D97706' },
  },
  {
    family: 'Coral',
    light: { key: 'coral_light', name: 'Coral Light', hex: '#FDBA74', hoverHex: '#FED7AA' },
    normal: { key: 'coral_orange', name: 'Coral Orange', hex: '#F97316', hoverHex: '#FB923C' },
    dark: { key: 'coral_dark', name: 'Coral Dark', hex: '#C2410C', hoverHex: '#EA580C' },
  },
  {
    family: 'Crimson',
    light: { key: 'crimson_light', name: 'Crimson Light', hex: '#FCA5A5', hoverHex: '#FECACA' },
    normal: { key: 'crimson_red', name: 'Crimson Red', hex: '#EF4444', hoverHex: '#F87171' },
    dark: { key: 'crimson_dark', name: 'Crimson Dark', hex: '#B91C1C', hoverHex: '#DC2626' },
  },
  {
    family: 'Pink',
    light: { key: 'pink_light', name: 'Pink Light', hex: '#F9A8D4', hoverHex: '#FBCFE8' },
    normal: { key: 'cyberpunk_pink', name: 'Neon Pink', hex: '#EC4899', hoverHex: '#F472B6' },
    dark: { key: 'pink_dark', name: 'Pink Dark', hex: '#BE185D', hoverHex: '#DB2777' },
  },
  {
    family: 'Amethyst',
    light: { key: 'amethyst_light', name: 'Amethyst Light', hex: '#D8B4FE', hoverHex: '#E9D5FF' },
    normal: { key: 'amethyst_purple', name: 'Amethyst Purple', hex: '#A855F7', hoverHex: '#C084FC' },
    dark: { key: 'amethyst_dark', name: 'Amethyst Dark', hex: '#6B21A8', hoverHex: '#7E22CE' },
  },
  {
    family: 'Indigo',
    light: { key: 'indigo_light', name: 'Indigo Light', hex: '#A5B4FC', hoverHex: '#C7D2FE' },
    normal: { key: 'midnight_indigo', name: 'Midnight Indigo', hex: '#6366F1', hoverHex: '#818CF8' },
    dark: { key: 'indigo_dark', name: 'Indigo Dark', hex: '#3730A3', hoverHex: '#4338CA' },
  },
  {
    family: 'Slate',
    light: { key: 'slate_light', name: 'Slate Light', hex: '#CBD5E1', hoverHex: '#E2E8F0' },
    normal: { key: 'slate_monochrome', name: 'Slate Monochrome', hex: '#64748B', hoverHex: '#94A3B8' },
    dark: { key: 'slate_dark', name: 'Slate Dark', hex: '#334155', hoverHex: '#475569' },
  },
];

export const SIGNATURE_ACCENT_KEYS: SignatureAccentColor[] = ACCENT_COLOR_FAMILIES.flatMap((fam) => [
  fam.light.key,
  fam.normal.key,
  fam.dark.key,
]);

export const ACCENT_THEMES: Record<string, {
  name: string;
  tone: 'Light' | 'Normal' | 'Dark';
  family: string;
  darkHex: string;
  lightHex: string;
  hex: string;
  hoverHex: string;
  bgLightHex: string;
}> = {};

ACCENT_COLOR_FAMILIES.forEach((fam) => {
  ACCENT_THEMES[fam.light.key] = {
    name: fam.light.name,
    tone: 'Light',
    family: fam.family,
    darkHex: fam.light.hex,
    lightHex: fam.light.hex,
    hex: fam.light.hex,
    hoverHex: fam.light.hoverHex,
    bgLightHex: `rgba(${hexToRgbString(fam.light.hex)}, 0.16)`,
  };
  ACCENT_THEMES[fam.normal.key] = {
    name: fam.normal.name,
    tone: 'Normal',
    family: fam.family,
    darkHex: fam.normal.hex,
    lightHex: fam.normal.hex,
    hex: fam.normal.hex,
    hoverHex: fam.normal.hoverHex,
    bgLightHex: `rgba(${hexToRgbString(fam.normal.hex)}, 0.16)`,
  };
  ACCENT_THEMES[fam.dark.key] = {
    name: fam.dark.name,
    tone: 'Dark',
    family: fam.family,
    darkHex: fam.dark.hex,
    lightHex: fam.dark.hex,
    hex: fam.dark.hex,
    hoverHex: fam.dark.hoverHex,
    bgLightHex: `rgba(${hexToRgbString(fam.dark.hex)}, 0.16)`,
  };
});

// Backward compatibility alias keys
ACCENT_THEMES.acid_lime = ACCENT_THEMES.neon_lime;
ACCENT_THEMES.amber_flame = ACCENT_THEMES.amber_gold;
ACCENT_THEMES.amethyst_glow = ACCENT_THEMES.amethyst_purple;
ACCENT_THEMES.stealth_slate = ACCENT_THEMES.slate_monochrome;
ACCENT_THEMES.sunset_coral = ACCENT_THEMES.coral_orange;
