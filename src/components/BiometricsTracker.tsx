import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Moon,
  Droplet,
  Footprints,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Scale,
  Zap,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { BiometricLog } from '../types';

interface BiometricsTrackerProps {
  logs: BiometricLog[];
  onAddLog: (log: BiometricLog) => void;
  onDeleteLog: (id: string) => void;
}

export const BiometricsTracker: React.FC<BiometricsTrackerProps> = ({
  logs,
  onAddLog,
  onDeleteLog,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'hrv' | 'sleep' | 'rhr' | 'steps'>('weight');

  // New Log Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWeight, setFormWeight] = useState<number>(79.0);
  const [formBodyFat, setFormBodyFat] = useState<number>(13.5);
  const [formRhr, setFormRhr] = useState<number>(52);
  const [formSysBp, setFormSysBp] = useState<number>(118);
  const [formDiaBp, setFormDiaBp] = useState<number>(76);
  const [formSleepHours, setFormSleepHours] = useState<number>(7.8);
  const [formSleepQuality, setFormSleepQuality] = useState<number>(85);
  const [formHrv, setFormHrv] = useState<number>(75);
  const [formSteps, setFormSteps] = useState<number>(10000);
  const [formHydration, setFormHydration] = useState<number>(3.2);
  const [formNotes, setFormNotes] = useState<string>('');

  const latest = logs[0] || {};
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate Recovery Score formula based on Sleep, HRV, and RHR
  const calculateDerivedRecovery = (sleep: number, hrv: number, rhr: number) => {
    let score = 50;
    score += (sleep - 7) * 8; // sleep bonus/penalty
    score += (hrv - 60) * 0.5; // hrv bonus
    score -= (rhr - 55) * 0.8; // lower RHR is better
    return Math.max(10, Math.min(100, Math.round(score)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recovery = calculateDerivedRecovery(formSleepHours, formHrv, formRhr);

    const newLog: BiometricLog = {
      id: 'bio-' + Date.now(),
      date: formDate,
      weightKg: formWeight,
      bodyFatPercent: formBodyFat,
      restingHeartRate: formRhr,
      systolicBp: formSysBp,
      diastolicBp: formDiaBp,
      sleepHours: formSleepHours,
      sleepQuality: formSleepQuality,
      hrvMs: formHrv,
      stepCount: formSteps,
      hydrationLiters: formHydration,
      recoveryScore: recovery,
      notes: formNotes.trim() || undefined,
    };

    onAddLog(newLog);
    setShowLogModal(false);
  };

  // SVG Chart points calculation
  const getChartData = () => {
    return sortedLogs.map((l) => {
      let val = 0;
      if (selectedMetric === 'weight') val = l.weightKg || 0;
      if (selectedMetric === 'hrv') val = l.hrvMs || 0;
      if (selectedMetric === 'sleep') val = l.sleepHours || 0;
      if (selectedMetric === 'rhr') val = l.restingHeartRate || 0;
      if (selectedMetric === 'steps') val = l.stepCount || 0;
      return { date: l.date.slice(5), value: val };
    });
  };

  const chartData = getChartData();
  const minVal = Math.min(...chartData.map((d) => d.value)) * 0.95;
  const maxVal = Math.max(...chartData.map((d) => d.value)) * 1.05 || 100;
  const range = maxVal - minVal || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Biometric & Autonomic Vitals Tracker
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Monitor recovery scores, HRV trends, resting heart rate, sleep architecture, and body composition.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-emerald-950 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Vitals</span>
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Recovery */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recovery</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latest.recoveryScore || 92}<span className="text-xs text-emerald-400">/100</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Optimal Status</div>
        </div>

        {/* Body Weight */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Weight</span>
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latest.weightKg || 79.2} <span className="text-xs text-zinc-500 font-normal">kg</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">BF: {latest.bodyFatPercent || 13.8}%</div>
        </div>

        {/* Resting Heart Rate */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Resting HR</span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latest.restingHeartRate || 52} <span className="text-xs text-zinc-500 font-normal">bpm</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Athletic Bradycardia</div>
        </div>

        {/* HRV */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>HRV (rMSSD)</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latest.hrvMs || 74} <span className="text-xs text-zinc-500 font-normal">ms</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Parasympathetic Active</div>
        </div>

        {/* Blood Pressure */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Blood Pressure</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {latest.systolicBp || 118}/{latest.diastolicBp || 76}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Normal / Ideal</div>
        </div>

        {/* Sleep Duration */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sleep</span>
            <Moon className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latest.sleepHours || 7.8} <span className="text-xs text-zinc-500 font-normal">hrs</span>
          </div>
          <div className="text-[10px] text-purple-400 font-mono">Score: {latest.sleepQuality || 88}%</div>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-zinc-100">Longitudinal Biometric Trends</h3>
            <p className="text-xs text-zinc-400">Historical physiological adaptations across entries</p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setSelectedMetric('weight')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedMetric === 'weight' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400'
              }`}
            >
              Weight
            </button>
            <button
              onClick={() => setSelectedMetric('hrv')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedMetric === 'hrv' ? 'bg-zinc-800 text-indigo-400 font-bold' : 'text-zinc-400'
              }`}
            >
              HRV
            </button>
            <button
              onClick={() => setSelectedMetric('rhr')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedMetric === 'rhr' ? 'bg-zinc-800 text-rose-400 font-bold' : 'text-zinc-400'
              }`}
            >
              RHR
            </button>
            <button
              onClick={() => setSelectedMetric('sleep')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedMetric === 'sleep' ? 'bg-zinc-800 text-purple-400 font-bold' : 'text-zinc-400'
              }`}
            >
              Sleep
            </button>
            <button
              onClick={() => setSelectedMetric('steps')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedMetric === 'steps' ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400'
              }`}
            >
              Steps
            </button>
          </div>
        </div>

        {/* SVG Sparkline chart */}
        <div className="h-64 w-full bg-zinc-950/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>High: {Math.round(maxVal * 10) / 10}</span>
            <span>Low: {Math.round(minVal * 10) / 10}</span>
          </div>

          <div className="relative h-44 w-full">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="gradientBio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.5" />

              {/* Polyline */}
              {chartData.length > 1 && (
                <>
                  <polygon
                    fill="url(#gradientBio)"
                    points={`
                      0,100
                      ${chartData
                        .map((d, i) => {
                          const x = (i / (chartData.length - 1)) * 100;
                          const y = 100 - ((d.value - minVal) / range) * 100;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      100,100
                    `}
                  />
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData
                      .map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 100 - ((d.value - minVal) / range) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                </>
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-800">
            {chartData.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-base text-zinc-100">Biometrics Journal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider font-sans">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Weight</th>
                <th className="py-3 px-4 font-semibold">Resting HR</th>
                <th className="py-3 px-4 font-semibold">HRV</th>
                <th className="py-3 px-4 font-semibold">BP (mmHg)</th>
                <th className="py-3 px-4 font-semibold">Sleep</th>
                <th className="py-3 px-4 font-semibold">Steps</th>
                <th className="py-3 px-4 font-semibold">Recovery</th>
                <th className="py-3 px-4 font-semibold text-right font-sans">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 px-4 font-bold text-zinc-200">{log.date}</td>
                  <td className="py-3 px-4 text-cyan-400">{log.weightKg || '—'} kg</td>
                  <td className="py-3 px-4 text-rose-400">{log.restingHeartRate || '—'} bpm</td>
                  <td className="py-3 px-4 text-indigo-400">{log.hrvMs || '—'} ms</td>
                  <td className="py-3 px-4 text-zinc-300">
                    {log.systolicBp && log.diastolicBp ? `${log.systolicBp}/${log.diastolicBp}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-purple-400">{log.sleepHours || '—'} hrs</td>
                  <td className="py-3 px-4 text-zinc-300">{log.stepCount?.toLocaleString() || '—'}</td>
                  <td className="py-3 px-4 text-emerald-400 font-extrabold">{log.recoveryScore || '—'}%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Log Daily Biometrics & Vitals</span>
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formWeight}
                    onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formBodyFat}
                    onChange={(e) => setFormBodyFat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={formRhr}
                    onChange={(e) => setFormRhr(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">HRV (ms)</label>
                  <input
                    type="number"
                    value={formHrv}
                    onChange={(e) => setFormHrv(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Sleep (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formSleepHours}
                    onChange={(e) => setFormSleepHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Blood Pressure (Sys / Dia)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="120"
                      value={formSysBp}
                      onChange={(e) => setFormSysBp(parseInt(e.target.value, 10) || 0)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="80"
                      value={formDiaBp}
                      onChange={(e) => setFormDiaBp(parseInt(e.target.value, 10) || 0)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Step Count</label>
                  <input
                    type="number"
                    value={formSteps}
                    onChange={(e) => setFormSteps(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Hydration (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formHydration}
                  onChange={(e) => setFormHydration(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Daily Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Subjective feeling, caffeine intake, soreness..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition"
                >
                  Save Vitals Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
