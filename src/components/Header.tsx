import React from 'react';
import { ShieldCheck, Dumbbell, CloudSun, Activity, Flame, RefreshCw, UserCheck } from 'lucide-react';
import { UserProfile, WeatherData } from '../types';

interface HeaderProps {
  profile: UserProfile;
  weather: WeatherData | null;
  recoveryScore?: number;
  onOpenSettings: () => void;
  onQuickLog: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  weather,
  recoveryScore = 90,
  onOpenSettings,
  onQuickLog,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Dumbbell className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-lg uppercase bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  Overhaul
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Health & Sports Command Center
              </p>
            </div>
          </div>

          {/* Center Quick Health Highlights */}
          <div className="hidden md:flex items-center gap-4">
            {/* Recovery Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Recovery:</span>
              <span className="font-bold text-emerald-400 font-mono">{recoveryScore}%</span>
            </div>

            {/* Weather Snapshot */}
            {weather && (
              <div
                onClick={() => onQuickLog('weather')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs cursor-pointer hover:border-zinc-700 transition"
                title="View outdoor sports weather forecast"
              >
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span className="text-zinc-300 font-mono font-medium">{weather.temperature}°C</span>
                <span className="text-zinc-500 text-[11px] hidden lg:inline">{weather.city}</span>
              </div>
            )}

            {/* Google Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-400 hidden lg:inline">Google Sync:</span>
              <span className="font-semibold text-zinc-200">Active</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuickLog('1rm')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 hover:from-emerald-400 hover:to-teal-400 transition shadow-sm flex items-center gap-1.5 font-mono"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calc</span> 1RM
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 transition flex items-center gap-2"
              title="Account & Settings"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-zinc-300 hidden sm:inline max-w-[100px] truncate">
                {profile?.name || 'Athlete'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
