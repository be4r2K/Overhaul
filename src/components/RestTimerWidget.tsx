import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX, X, ChevronUp, ChevronDown } from 'lucide-react';
import { playTimerBeep } from '../utils/audio';

interface RestTimerWidgetProps {
  onDismiss?: () => void;
}

export const RestTimerWidget: React.FC<RestTimerWidgetProps> = ({ onDismiss }) => {
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const next = prev - 1;
          if (soundEnabled && next <= 3 && next > 0) {
            playTimerBeep(false);
          } else if (soundEnabled && next === 0) {
            playTimerBeep(true);
          }
          return next;
        });
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, soundEnabled]);

  const setPreset = (sec: number) => {
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
  };

  const toggleRun = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const adjustSeconds = (delta: number) => {
    const updated = Math.max(10, remainingSeconds + delta);
    setRemainingSeconds(updated);
    if (updated > totalSeconds) setTotalSeconds(updated);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPct = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 z-30">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border shadow-lg transition-all cursor-pointer ${
            isRunning
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400 animate-pulse'
              : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}
        >
          <Timer className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tabular-nums">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-30 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-2xl shadow-black/60 transition-all">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Timer className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white uppercase">Gym Rest Timer</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute sound' : 'Enable audio beeps'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Minimize"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-center justify-between my-2 px-1">
        <div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white tabular-nums">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <div className="text-[11px] text-slate-400">
            {remainingSeconds === 0 ? 'Rest complete - Next set!' : isRunning ? 'Resting between sets' : 'Paused'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustSeconds(-15)}
            className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="-15 seconds"
          >
            -15s
          </button>
          <button
            onClick={toggleRun}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => adjustSeconds(15)}
            className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="+15 seconds"
          >
            +15s
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
        <div
          className={`h-full transition-all duration-300 ${
            remainingSeconds === 0
              ? 'bg-rose-500'
              : remainingSeconds <= 10
              ? 'bg-amber-400 animate-pulse'
              : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.min(100, progressPct)}%` }}
        />
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-4 gap-1 pt-1">
        {[30, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            onClick={() => setPreset(sec)}
            className={`py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer ${
              totalSeconds === sec && remainingSeconds > 0
                ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>
    </div>
  );
};
