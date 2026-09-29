import { AppThemeSettings } from '../types/aiWorkout';
import { loadFromStorage, saveToStorage } from './storage';

export const DEFAULT_THEME: AppThemeSettings = {
  mode: 'dark',
  accent: 'emerald_green',
  font: 'sans',
};

export function getStoredTheme(): AppThemeSettings {
  return loadFromStorage('app_theme', DEFAULT_THEME);
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
    display: {
      url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
      family: "'Space Grotesk', sans-serif",
    },
    sans: {
      url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap",
      family: "'Plus Jakarta Sans', sans-serif",
    },
  };

  const fontConfig = fontLinks[fontKey] || fontLinks.sans;

  if (typeof document !== 'undefined') {
    let styleEl = document.getElementById('dynamic-font') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-font';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@import url('${fontConfig.url}');`;
    document.body.style.fontFamily = fontConfig.family;
    document.documentElement.style.fontFamily = fontConfig.family;
  }

  return fontConfig.family;
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

  let hex = '#10B981';
  let hoverHex = '#34D399';
  let bgLightHex = 'rgba(16, 185, 129, 0.16)';
  let borderHex = 'rgba(16, 185, 129, 0.45)';

  if (theme.accent === 'custom' && theme.customHex) {
    hex = theme.customHex.startsWith('#') ? theme.customHex : `#${theme.customHex}`;
    hoverHex = hex;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      bgLightHex = `rgba(${r}, ${g}, ${b}, 0.16)`;
      borderHex = `rgba(${r}, ${g}, ${b}, 0.45)`;
    } else {
      bgLightHex = `${hex}26`;
      borderHex = `${hex}73`;
    }
  } else {
    const pal = (ACCENT_THEMES as any)[theme.accent] || ACCENT_THEMES.emerald_green;
    hex = pal.hex;
    hoverHex = pal.hoverHex;
    bgLightHex = pal.bgLightHex;
    borderHex = pal.bgLightHex.replace('0.12', '0.45');
  }

  root.style.setProperty('--accent-hex', hex);
  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent-hover', hoverHex);
  root.style.setProperty('--accent-light', bgLightHex);
  root.style.setProperty('--accent-border', borderHex);

  if (body) {
    body.style.setProperty('--accent-hex', hex);
    body.style.setProperty('--accent-color', hex);
    body.style.setProperty('--accent-hover', hoverHex);
    body.style.setProperty('--accent-light', bgLightHex);
    body.style.setProperty('--accent-border', borderHex);
  }

  // Mode: dark, light, or glass
  if (theme.mode === 'light') {
    root.classList.remove('dark', 'glass-theme');
    root.classList.add('light');
    if (body) {
      body.classList.remove('dark', 'glass-theme');
      body.classList.add('light');
    }
  } else if (theme.mode === 'glass') {
    root.classList.remove('light');
    root.classList.add('dark', 'glass-theme');
    if (body) {
      body.classList.remove('light');
      body.classList.add('dark', 'glass-theme');
    }
  } else {
    root.classList.remove('light', 'glass-theme');
    root.classList.add('dark');
    if (body) {
      body.classList.remove('light', 'glass-theme');
      body.classList.add('dark');
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
}

// Accent Color Theme CSS mapping helper
export const ACCENT_THEMES = {
  acid_lime: {
    name: 'Acid Lime',
    primary: 'lime',
    text: 'text-lime-400',
    textDark: 'text-lime-600',
    bg: 'bg-lime-400',
    bgLight: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    hoverBg: 'hover:bg-lime-300',
    ring: 'focus:ring-lime-500',
    hex: '#84CC16',
    hoverHex: '#A3E635',
    bgLightHex: 'rgba(132, 204, 22, 0.16)',
  },
  amber_flame: {
    name: 'Amber Flame',
    primary: 'amber',
    text: 'text-amber-400',
    textDark: 'text-amber-600',
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-400',
    ring: 'focus:ring-amber-500',
    hex: '#F59E0B',
    hoverHex: '#FBBF24',
    bgLightHex: 'rgba(245, 158, 11, 0.16)',
  },
  amethyst_glow: {
    name: 'Amethyst Glow',
    primary: 'purple',
    text: 'text-[#9966CC]',
    textDark: 'text-[#9966CC]',
    bg: 'bg-[#9966CC]',
    bgLight: 'bg-[#9966CC]/10',
    border: 'border-[#9966CC]/30',
    hoverBg: 'hover:bg-[#9966CC]/80',
    ring: 'focus:ring-[#9966CC]',
    hex: '#9966CC',
    hoverHex: '#B285E6',
    bgLightHex: 'rgba(153, 102, 204, 0.16)',
  },
  bronze_metal: {
    name: 'Bronze Metal',
    primary: 'amber',
    text: 'text-[#CD7F32]',
    textDark: 'text-[#CD7F32]',
    bg: 'bg-[#CD7F32]',
    bgLight: 'bg-[#CD7F32]/10',
    border: 'border-[#CD7F32]/30',
    hoverBg: 'hover:bg-[#CD7F32]/80',
    ring: 'focus:ring-[#CD7F32]',
    hex: '#CD7F32',
    hoverHex: '#E09443',
    bgLightHex: 'rgba(205, 127, 50, 0.16)',
  },
  burnt_sienna: {
    name: 'Burnt Sienna',
    primary: 'orange',
    text: 'text-orange-700',
    textDark: 'text-orange-900',
    bg: 'bg-orange-700',
    bgLight: 'bg-orange-700/10',
    border: 'border-orange-700/30',
    hoverBg: 'hover:bg-orange-600',
    ring: 'focus:ring-orange-700',
    hex: '#C2410C',
    hoverHex: '#EA580C',
    bgLightHex: 'rgba(194, 65, 12, 0.16)',
  },
  cadmium_orange: {
    name: 'Cadmium Orange',
    primary: 'orange',
    text: 'text-[#ED872D]',
    textDark: 'text-[#ED872D]',
    bg: 'bg-[#ED872D]',
    bgLight: 'bg-[#ED872D]/10',
    border: 'border-[#ED872D]/30',
    hoverBg: 'hover:bg-[#ED872D]/80',
    ring: 'focus:ring-[#ED872D]',
    hex: '#ED872D',
    hoverHex: '#F2A35D',
    bgLightHex: 'rgba(237, 135, 45, 0.16)',
  },
  chartreuse_shock: {
    name: 'Chartreuse Shock',
    primary: 'lime',
    text: 'text-[#7FFF00]',
    textDark: 'text-[#7FFF00]',
    bg: 'bg-[#7FFF00]',
    bgLight: 'bg-[#7FFF00]/10',
    border: 'border-[#7FFF00]/30',
    hoverBg: 'hover:bg-[#7FFF00]/80',
    ring: 'focus:ring-[#7FFF00]',
    hex: '#7FFF00',
    hoverHex: '#99FF33',
    bgLightHex: 'rgba(127, 255, 0, 0.16)',
  },
  copper_rust: {
    name: 'Copper Rust',
    primary: 'amber',
    text: 'text-[#B87333]',
    textDark: 'text-[#B87333]',
    bg: 'bg-[#B87333]',
    bgLight: 'bg-[#B87333]/10',
    border: 'border-[#B87333]/30',
    hoverBg: 'hover:bg-[#B87333]/80',
    ring: 'focus:ring-[#B87333]',
    hex: '#B87333',
    hoverHex: '#C98544',
    bgLightHex: 'rgba(184, 115, 51, 0.16)',
  },
  crimson_red: {
    name: 'Crimson Red',
    primary: 'red',
    text: 'text-red-400',
    textDark: 'text-red-600',
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    border: 'border-red-500/30',
    hoverBg: 'hover:bg-red-400',
    ring: 'focus:ring-red-500',
    hex: '#EF4444',
    hoverHex: '#F87171',
    bgLightHex: 'rgba(239, 68, 68, 0.16)',
  },
  cyberpunk_pink: {
    name: 'Cyberpunk Pink',
    primary: 'pink',
    text: 'text-pink-400',
    textDark: 'text-pink-600',
    bg: 'bg-pink-500',
    bgLight: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    hoverBg: 'hover:bg-pink-400',
    ring: 'focus:ring-pink-500',
    hex: '#EC4899',
    hoverHex: '#F472B6',
    bgLightHex: 'rgba(236, 72, 153, 0.16)',
  },
  deep_cobalt: {
    name: 'Deep Cobalt',
    primary: 'blue',
    text: 'text-blue-500',
    textDark: 'text-blue-600',
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500',
    ring: 'focus:ring-blue-600',
    hex: '#2563EB',
    hoverHex: '#3B82F6',
    bgLightHex: 'rgba(37, 99, 235, 0.16)',
  },
  deep_forest: {
    name: 'Deep Forest',
    primary: 'green',
    text: 'text-green-700',
    textDark: 'text-green-900',
    bg: 'bg-green-700',
    bgLight: 'bg-green-700/10',
    border: 'border-green-700/30',
    hoverBg: 'hover:bg-green-600',
    ring: 'focus:ring-green-700',
    hex: '#15803D',
    hoverHex: '#16A34A',
    bgLightHex: 'rgba(21, 128, 61, 0.16)',
  },
  electric_cyan: {
    name: 'Electric Cyan',
    primary: 'cyan',
    text: 'text-cyan-400',
    textDark: 'text-cyan-600',
    bg: 'bg-cyan-400',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-300',
    ring: 'focus:ring-cyan-500',
    hex: '#06B6D4',
    hoverHex: '#22D3EE',
    bgLightHex: 'rgba(6, 182, 212, 0.16)',
  },
  electric_plum: {
    name: 'Electric Plum',
    primary: 'purple',
    text: 'text-[#8A2BE2]',
    textDark: 'text-[#8A2BE2]',
    bg: 'bg-[#8A2BE2]',
    bgLight: 'bg-[#8A2BE2]/10',
    border: 'border-[#8A2BE2]/30',
    hoverBg: 'hover:bg-[#8A2BE2]/80',
    ring: 'focus:ring-[#8A2BE2]',
    hex: '#8A2BE2',
    hoverHex: '#9D4EDD',
    bgLightHex: 'rgba(138, 43, 226, 0.16)',
  },
  electric_teal: {
    name: 'Electric Teal',
    primary: 'teal',
    text: 'text-teal-400',
    textDark: 'text-teal-600',
    bg: 'bg-teal-400',
    bgLight: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    hoverBg: 'hover:bg-teal-300',
    ring: 'focus:ring-teal-500',
    hex: '#14B8A6',
    hoverHex: '#2DD4BF',
    bgLightHex: 'rgba(20, 184, 166, 0.16)',
  },
  emerald_green: {
    name: 'Emerald Green',
    primary: 'emerald',
    text: 'text-emerald-400',
    textDark: 'text-emerald-600',
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-400',
    ring: 'focus:ring-emerald-500',
    hex: '#10B981',
    hoverHex: '#34D399',
    bgLightHex: 'rgba(16, 185, 129, 0.16)',
  },
  ghost_lavender: {
    name: 'Ghost Lavender',
    primary: 'purple',
    text: 'text-purple-300',
    textDark: 'text-purple-500',
    bg: 'bg-purple-400',
    bgLight: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    hoverBg: 'hover:bg-purple-300',
    ring: 'focus:ring-purple-400',
    hex: '#C084FC',
    hoverHex: '#E9D5FF',
    bgLightHex: 'rgba(192, 132, 252, 0.16)',
  },
  hot_fuchsia: {
    name: 'Hot Fuchsia',
    primary: 'fuchsia',
    text: 'text-fuchsia-500',
    textDark: 'text-fuchsia-700',
    bg: 'bg-fuchsia-600',
    bgLight: 'bg-fuchsia-600/10',
    border: 'border-fuchsia-600/30',
    hoverBg: 'hover:bg-fuchsia-500',
    ring: 'focus:ring-fuchsia-600',
    hex: '#E11D48',
    hoverHex: '#F43F5E',
    bgLightHex: 'rgba(225, 29, 72, 0.16)',
  },
  hyper_violet: {
    name: 'Hyper Violet',
    primary: 'purple',
    text: 'text-purple-600',
    textDark: 'text-purple-800',
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-600/10',
    border: 'border-purple-600/30',
    hoverBg: 'hover:bg-purple-500',
    ring: 'focus:ring-purple-600',
    hex: '#7C3AED',
    hoverHex: '#8B5CF6',
    bgLightHex: 'rgba(124, 58, 237, 0.16)',
  },
  ice_blue: {
    name: 'Ice Blue',
    primary: 'sky',
    text: 'text-sky-400',
    textDark: 'text-sky-600',
    bg: 'bg-sky-400',
    bgLight: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    hoverBg: 'hover:bg-sky-300',
    ring: 'focus:ring-sky-500',
    hex: '#38BDF8',
    hoverHex: '#7DD3FC',
    bgLightHex: 'rgba(56, 189, 248, 0.16)',
  },
  inferno_orange: {
    name: 'Inferno Orange',
    primary: 'orange',
    text: 'text-orange-400',
    textDark: 'text-orange-600',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-400',
    ring: 'focus:ring-orange-500',
    hex: '#F97316',
    hoverHex: '#FB923C',
    bgLightHex: 'rgba(249, 115, 22, 0.16)',
  },
  jade_imperial: {
    name: 'Jade Imperial',
    primary: 'emerald',
    text: 'text-[#00A86B]',
    textDark: 'text-[#00A86B]',
    bg: 'bg-[#00A86B]',
    bgLight: 'bg-[#00A86B]/10',
    border: 'border-[#00A86B]/30',
    hoverBg: 'hover:bg-[#00A86B]/80',
    ring: 'focus:ring-[#00A86B]',
    hex: '#00A86B',
    hoverHex: '#14C38E',
    bgLightHex: 'rgba(0, 168, 107, 0.16)',
  },
  lapis_lazuli: {
    name: 'Lapis Lazuli',
    primary: 'blue',
    text: 'text-[#26619C]',
    textDark: 'text-[#26619C]',
    bg: 'bg-[#26619C]',
    bgLight: 'bg-[#26619C]/10',
    border: 'border-[#26619C]/30',
    hoverBg: 'hover:bg-[#26619C]/80',
    ring: 'focus:ring-[#26619C]',
    hex: '#26619C',
    hoverHex: '#3D7CBD',
    bgLightHex: 'rgba(38, 97, 156, 0.16)',
  },
  laser_lemon: {
    name: 'Laser Lemon',
    primary: 'yellow',
    text: 'text-[#FFFF66]',
    textDark: 'text-yellow-600',
    bg: 'bg-[#FFFF66]',
    bgLight: 'bg-[#FFFF66]/10',
    border: 'border-[#FFFF66]/30',
    hoverBg: 'hover:bg-[#FFFF66]/80',
    ring: 'focus:ring-[#FFFF66]',
    hex: '#FFFF66',
    hoverHex: '#FFFF99',
    bgLightHex: 'rgba(255, 255, 102, 0.16)',
  },
  midnight_indigo: {
    name: 'Midnight Indigo',
    primary: 'indigo',
    text: 'text-indigo-400',
    textDark: 'text-indigo-600',
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    hoverBg: 'hover:bg-indigo-400',
    ring: 'focus:ring-indigo-500',
    hex: '#4F46E5',
    hoverHex: '#6366F1',
    bgLightHex: 'rgba(79, 70, 229, 0.16)',
  },
  mint_green: {
    name: 'Mint Green',
    primary: 'emerald',
    text: 'text-emerald-400',
    textDark: 'text-emerald-600',
    bg: 'bg-emerald-400',
    bgLight: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    hoverBg: 'hover:bg-emerald-300',
    ring: 'focus:ring-emerald-400',
    hex: '#34D399',
    hoverHex: '#6EE7B7',
    bgLightHex: 'rgba(52, 211, 153, 0.16)',
  },
  neon_grape: {
    name: 'Neon Grape',
    primary: 'purple',
    text: 'text-purple-600',
    textDark: 'text-purple-800',
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-600/10',
    border: 'border-purple-600/30',
    hoverBg: 'hover:bg-purple-500',
    ring: 'focus:ring-purple-600',
    hex: '#9333EA',
    hoverHex: '#A855F7',
    bgLightHex: 'rgba(147, 51, 234, 0.16)',
  },
  neon_green: {
    name: 'Neon Green',
    primary: 'green',
    text: 'text-[#39FF14]',
    textDark: 'text-[#39FF14]',
    bg: 'bg-[#39FF14]',
    bgLight: 'bg-[#39FF14]/10',
    border: 'border-[#39FF14]/30',
    hoverBg: 'hover:bg-[#39FF14]/80',
    ring: 'focus:ring-[#39FF14]',
    hex: '#39FF14',
    hoverHex: '#5CFF3B',
    bgLightHex: 'rgba(57, 255, 20, 0.16)',
  },
  neon_magenta: {
    name: 'Neon Magenta',
    primary: 'fuchsia',
    text: 'text-fuchsia-400',
    textDark: 'text-fuchsia-600',
    bg: 'bg-fuchsia-500',
    bgLight: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    hoverBg: 'hover:bg-fuchsia-400',
    ring: 'focus:ring-fuchsia-500',
    hex: '#F000FF',
    hoverHex: '#F43F5E',
    bgLightHex: 'rgba(240, 0, 255, 0.16)',
  },
  obsidian_black: {
    name: 'Obsidian Black',
    primary: 'neutral',
    text: 'text-white',
    textDark: 'text-black',
    bg: 'bg-[#000000]',
    bgLight: 'bg-white/10',
    border: 'border-white/40',
    hoverBg: 'hover:bg-neutral-800',
    ring: 'focus:ring-white',
    hex: '#000000',
    hoverHex: '#1F1F1F',
    bgLightHex: 'rgba(255, 255, 255, 0.16)',
  },
  pastel_peach: {
    name: 'Pastel Peach',
    primary: 'orange',
    text: 'text-[#FFDAB9]',
    textDark: 'text-[#FFDAB9]',
    bg: 'bg-[#FFDAB9]',
    bgLight: 'bg-[#FFDAB9]/10',
    border: 'border-[#FFDAB9]/30',
    hoverBg: 'hover:bg-[#FFDAB9]/80',
    ring: 'focus:ring-[#FFDAB9]',
    hex: '#FFDAB9',
    hoverHex: '#FFE4CC',
    bgLightHex: 'rgba(255, 218, 185, 0.16)',
  },
  pitch_black: {
    name: 'Pitch Black',
    primary: 'neutral',
    text: 'text-white',
    textDark: 'text-[#0B0B0B]',
    bg: 'bg-[#0B0B0B]',
    bgLight: 'bg-white/10',
    border: 'border-white/40',
    hoverBg: 'hover:bg-neutral-900',
    ring: 'focus:ring-white',
    hex: '#0B0B0B',
    hoverHex: '#222222',
    bgLightHex: 'rgba(255, 255, 255, 0.16)',
  },
  plasma_yellow: {
    name: 'Plasma Yellow',
    primary: 'yellow',
    text: 'text-yellow-400',
    textDark: 'text-yellow-600',
    bg: 'bg-yellow-400',
    bgLight: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    hoverBg: 'hover:bg-yellow-300',
    ring: 'focus:ring-yellow-400',
    hex: '#FFD700',
    hoverHex: '#FACC15',
    bgLightHex: 'rgba(255, 215, 0, 0.16)',
  },
  platinum_silver: {
    name: 'Platinum Silver',
    primary: 'slate',
    text: 'text-slate-300',
    textDark: 'text-slate-500',
    bg: 'bg-slate-300',
    bgLight: 'bg-slate-300/10',
    border: 'border-slate-300/30',
    hoverBg: 'hover:bg-slate-200',
    ring: 'focus:ring-slate-300',
    hex: '#E2E8F0',
    hoverHex: '#F1F5F9',
    bgLightHex: 'rgba(226, 232, 240, 0.16)',
  },
  pure_white: {
    name: 'Pure White',
    primary: 'white',
    text: 'text-white',
    textDark: 'text-slate-900',
    bg: 'bg-white',
    bgLight: 'bg-white/10',
    border: 'border-white/30',
    hoverBg: 'hover:bg-slate-200',
    ring: 'focus:ring-white',
    hex: '#FFFFFF',
    hoverHex: '#F8FAFC',
    bgLightHex: 'rgba(255, 255, 255, 0.16)',
  },
  royal_sapphire: {
    name: 'Royal Sapphire',
    primary: 'blue',
    text: 'text-blue-700',
    textDark: 'text-blue-900',
    bg: 'bg-blue-700',
    bgLight: 'bg-blue-700/10',
    border: 'border-blue-700/30',
    hoverBg: 'hover:bg-blue-600',
    ring: 'focus:ring-blue-700',
    hex: '#1D4ED8',
    hoverHex: '#2563EB',
    bgLightHex: 'rgba(29, 78, 216, 0.16)',
  },
  ruby_rose: {
    name: 'Ruby Rose',
    primary: 'rose',
    text: 'text-rose-500',
    textDark: 'text-rose-700',
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-600/10',
    border: 'border-rose-600/30',
    hoverBg: 'hover:bg-rose-500',
    ring: 'focus:ring-rose-600',
    hex: '#E11D48',
    hoverHex: '#F43F5E',
    bgLightHex: 'rgba(225, 29, 72, 0.16)',
  },
  scarlet_red: {
    name: 'Scarlet Red',
    primary: 'red',
    text: 'text-[#FF2400]',
    textDark: 'text-[#FF2400]',
    bg: 'bg-[#FF2400]',
    bgLight: 'bg-[#FF2400]/10',
    border: 'border-[#FF2400]/30',
    hoverBg: 'hover:bg-[#FF2400]/80',
    ring: 'focus:ring-[#FF2400]',
    hex: '#FF2400',
    hoverHex: '#FF5E4D',
    bgLightHex: 'rgba(255, 36, 0, 0.16)',
  },
  solar_gold: {
    name: 'Solar Gold',
    primary: 'yellow',
    text: 'text-yellow-400',
    textDark: 'text-yellow-600',
    bg: 'bg-yellow-400',
    bgLight: 'bg-yellow-400/15',
    border: 'border-yellow-400/30',
    hoverBg: 'hover:bg-yellow-300',
    ring: 'focus:ring-yellow-500',
    hex: '#EAB308',
    hoverHex: '#FDE047',
    bgLightHex: 'rgba(234, 179, 8, 0.16)',
  },
  steel_blue: {
    name: 'Steel Blue',
    primary: 'blue',
    text: 'text-[#4682B4]',
    textDark: 'text-[#4682B4]',
    bg: 'bg-[#4682B4]',
    bgLight: 'bg-[#4682B4]/10',
    border: 'border-[#4682B4]/30',
    hoverBg: 'hover:bg-[#4682B4]/80',
    ring: 'focus:ring-[#4682B4]',
    hex: '#4682B4',
    hoverHex: '#60A3D9',
    bgLightHex: 'rgba(70, 130, 180, 0.16)',
  },
  stealth_slate: {
    name: 'Stealth Slate',
    primary: 'slate',
    text: 'text-slate-400',
    textDark: 'text-slate-600',
    bg: 'bg-slate-400',
    bgLight: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    hoverBg: 'hover:bg-slate-300',
    ring: 'focus:ring-slate-400',
    hex: '#94A3B8',
    hoverHex: '#CBD5E1',
    bgLightHex: 'rgba(148, 163, 184, 0.16)',
  },
  sunset_coral: {
    name: 'Sunset Coral',
    primary: 'rose',
    text: 'text-rose-400',
    textDark: 'text-rose-600',
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-400',
    ring: 'focus:ring-rose-500',
    hex: '#FF6B6B',
    hoverHex: '#FF8787',
    bgLightHex: 'rgba(255, 107, 107, 0.16)',
  },
  tangerine_pulse: {
    name: 'Tangerine Pulse',
    primary: 'amber',
    text: 'text-[#FFCC00]',
    textDark: 'text-[#FFCC00]',
    bg: 'bg-[#FFCC00]',
    bgLight: 'bg-[#FFCC00]/10',
    border: 'border-[#FFCC00]/30',
    hoverBg: 'hover:bg-[#FFCC00]/80',
    ring: 'focus:ring-[#FFCC00]',
    hex: '#FFCC00',
    hoverHex: '#FFE066',
    bgLightHex: 'rgba(255, 204, 0, 0.16)',
  },
  titanium_gray: {
    name: 'Titanium Gray',
    primary: 'slate',
    text: 'text-[#708090]',
    textDark: 'text-[#708090]',
    bg: 'bg-[#708090]',
    bgLight: 'bg-[#708090]/10',
    border: 'border-[#708090]/30',
    hoverBg: 'hover:bg-[#708090]/80',
    ring: 'focus:ring-[#708090]',
    hex: '#708090',
    hoverHex: '#8A9BA8',
    bgLightHex: 'rgba(112, 128, 144, 0.16)',
  },
  toxic_slime: {
    name: 'Toxic Slime',
    primary: 'green',
    text: 'text-green-400',
    textDark: 'text-green-600',
    bg: 'bg-green-500',
    bgLight: 'bg-green-500/10',
    border: 'border-green-500/30',
    hoverBg: 'hover:bg-green-400',
    ring: 'focus:ring-green-500',
    hex: '#22C55E',
    hoverHex: '#4ADE80',
    bgLightHex: 'rgba(34, 197, 94, 0.16)',
  },
  ultramarine_sky: {
    name: 'Ultramarine Sky',
    primary: 'blue',
    text: 'text-[#4166F5]',
    textDark: 'text-[#4166F5]',
    bg: 'bg-[#4166F5]',
    bgLight: 'bg-[#4166F5]/10',
    border: 'border-[#4166F5]/30',
    hoverBg: 'hover:bg-[#4166F5]/80',
    ring: 'focus:ring-[#4166F5]',
    hex: '#4166F5',
    hoverHex: '#6C89FF',
    bgLightHex: 'rgba(65, 102, 245, 0.16)',
  },
  ultra_violet: {
    name: 'Ultra Violet',
    primary: 'purple',
    text: 'text-purple-400',
    textDark: 'text-purple-600',
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-400',
    ring: 'focus:ring-purple-500',
    hex: '#A855F7',
    hoverHex: '#C084FC',
    bgLightHex: 'rgba(16, 85, 247, 0.16)',
  },
  verdant_olive: {
    name: 'Verdant Olive',
    primary: 'lime',
    text: 'text-[#556B2F]',
    textDark: 'text-[#556B2F]',
    bg: 'bg-[#556B2F]',
    bgLight: 'bg-[#556B2F]/10',
    border: 'border-[#556B2F]/30',
    hoverBg: 'hover:bg-[#556B2F]/80',
    ring: 'focus:ring-[#556B2F]',
    hex: '#556B2F',
    hoverHex: '#6E8F3F',
    bgLightHex: 'rgba(85, 107, 47, 0.16)',
  },
  volcanic_red: {
    name: 'Volcanic Red',
    primary: 'red',
    text: 'text-red-600',
    textDark: 'text-red-800',
    bg: 'bg-red-600',
    bgLight: 'bg-red-600/10',
    border: 'border-red-600/30',
    hoverBg: 'hover:bg-red-500',
    ring: 'focus:ring-red-600',
    hex: '#DC2626',
    hoverHex: '#EF4444',
    bgLightHex: 'rgba(220, 38, 38, 0.16)',
  },
  zaffre_blue: {
    name: 'Zaffre Blue',
    primary: 'blue',
    text: 'text-[#0014A8]',
    textDark: 'text-[#0014A8]',
    bg: 'bg-[#0014A8]',
    bgLight: 'bg-[#0014A8]/10',
    border: 'border-[#0014A8]/30',
    hoverBg: 'hover:bg-[#0014A8]/80',
    ring: 'focus:ring-[#0014A8]',
    hex: '#0014A8',
    hoverHex: '#1E36D9',
    bgLightHex: 'rgba(0, 20, 168, 0.16)',
  },
};
