import React, { useState } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Sun,
  ShieldAlert,
  Footprints,
  Bike,
  Dumbbell,
  Trophy,
  Compass,
  MapPin,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { WeatherData, SportSuitability } from '../types';
import { evaluateSportsSuitability, fetchCurrentWeather } from '../utils/weather';

interface WeatherSuitabilityProps {
  weather: WeatherData | null;
  onRefreshWeather: (city: string, lat: number, lon: number) => void;
  isLoading: boolean;
}

const POPULAR_CITIES = [
  { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'New York, USA', lat: 40.7128, lon: -74.006 },
  { name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437 },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin, Germany', lat: 52.52, lon: 13.405 },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708 },
];

export const WeatherSuitability: React.FC<WeatherSuitabilityProps> = ({
  weather,
  onRefreshWeather,
  isLoading,
}) => {
  const [selectedCity, setSelectedCity] = useState(POPULAR_CITIES[0]);

  const sports = weather ? evaluateSportsSuitability(weather) : [];

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = POPULAR_CITIES.find((c) => c.name === e.target.value);
    if (found) {
      setSelectedCity(found);
      onRefreshWeather(found.name, found.lat, found.lon);
    }
  };

  const getStatusBadgeClass = (status: SportSuitability['status']) => {
    switch (status) {
      case 'Ideal':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Good':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Fair':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Poor':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/40';
    }
  };

  const getSportIcon = (sportName: string) => {
    if (sportName.includes('Running')) return <Footprints className="w-5 h-5 text-emerald-400" />;
    if (sportName.includes('Cycling')) return <Bike className="w-5 h-5 text-cyan-400" />;
    if (sportName.includes('Calisthenics')) return <Dumbbell className="w-5 h-5 text-purple-400" />;
    if (sportName.includes('Tennis')) return <Trophy className="w-5 h-5 text-amber-400" />;
    return <Compass className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CloudSun className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Weather & Outdoor Athletic Index
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time atmospheric insights and environmental suitability scores for outdoor training disciplines.
          </p>
        </div>

        {/* City Switcher */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="relative">
            <select
              value={selectedCity.name}
              onChange={handleCityChange}
              className="appearance-none px-4 py-2.5 pr-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={() => onRefreshWeather(selectedCity.name, selectedCity.lat, selectedCity.lon)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition"
            title="Refresh current weather"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Meteorological Card */}
      {weather && (
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Primary Temp */}
            <div className="md:col-span-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Conditions • {weather.city}</span>
              </div>

              <div className="flex items-baseline gap-4 mt-2">
                <span className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
                  {weather.temperature}°
                </span>
                <div>
                  <div className="text-lg font-bold text-zinc-200">{weather.conditionText}</div>
                  <div className="text-xs text-zinc-400 font-mono">Feels like {weather.feelsLike}°C</div>
                </div>
              </div>
            </div>

            {/* Environmental Metric Badges (6 cols) */}
            <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind
                </div>
                <div className="font-mono text-base font-bold text-white">{weather.windSpeedKmH} km/h</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity
                </div>
                <div className="font-mono text-base font-bold text-white">{weather.humidity}%</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> UV Index
                </div>
                <div className="font-mono text-base font-bold text-white">{weather.uvIndex} <span className="text-[10px] font-normal text-zinc-400">/ 11</span></div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-indigo-400" /> Rain Prob
                </div>
                <div className="font-mono text-base font-bold text-white">{weather.precipitationProbability}%</div>
              </div>
            </div>
          </div>

          {/* Hourly Forecast Strip */}
          <div className="mt-6 pt-6 border-t border-zinc-800/80">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Upcoming Training Window (Next 6 Hours)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {weather.forecast.map((fc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-center space-y-1"
                >
                  <div className="text-[11px] font-mono text-zinc-400">{fc.time}</div>
                  <div className="text-base font-extrabold text-white font-mono">{fc.temp}°C</div>
                  <div className="text-[10px] font-mono text-cyan-400">{fc.pop}% rain</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sport Suitability Matrix */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-100">Outdoor Discipline Suitability Matrix</h3>
            <p className="text-xs text-zinc-400">Algorithmic training ratings grounded in aerodynamic, thermal, and friction metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sports.map((sport: SportSuitability) => (
            <div
              key={sport.sport}
              className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {getSportIcon(sport.sport)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{sport.sport}</h4>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadgeClass(
                        sport.status
                      )}`}
                    >
                      {sport.status} ({sport.score}/100)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-white">{sport.score}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Score</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    sport.score >= 80
                      ? 'bg-emerald-500'
                      : sport.score >= 60
                      ? 'bg-cyan-500'
                      : sport.score >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${sport.score}%` }}
                />
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                <strong className="text-zinc-200">Coach Brief:</strong> {sport.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
