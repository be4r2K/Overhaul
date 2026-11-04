/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getActiveUserUid } from './storage';

export interface StreakInfo {
  currentStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  bestStreak: number;
}

/**
 * Generates and persists a unique, randomly generated alphanumeric passcode string (e.g., OS-8924-X7)
 * stored in user session state.
 */
export function generateUserPasscode(_name?: string, _familyName?: string, existingCode?: string): string {
  const uid = getActiveUserUid();
  const storageKey = `overhaul_user_${uid}_passcode`;
  const validFormat = /^OS-\d{4}-[A-Z0-9]{2}$/;

  if (existingCode && validFormat.test(existingCode.trim().toUpperCase())) {
    const normalized = existingCode.trim().toUpperCase();
    try {
      localStorage.setItem(storageKey, normalized);
    } catch {}
    return normalized;
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && validFormat.test(saved.trim().toUpperCase())) {
      return saved.trim().toUpperCase();
    }
  } catch {}

  const digits = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const c1 = chars.charAt(Math.floor(Math.random() * chars.length));
  const c2 = chars.charAt(Math.floor(Math.random() * chars.length));
  const generated = `OS-${digits}-${c1}${c2}`;

  try {
    localStorage.setItem(storageKey, generated);
  } catch {}

  return generated;
}

/**
 * Calculates and updates real daily streak strictly evaluating consecutive completed workout days
 * from workout logs and session history.
 */
export function getAndUpdateDailyStreak(): StreakInfo {
  const uid = getActiveUserUid();
  const today = new Date().toISOString().split('T')[0];

  let allLogs: any[] = [];
  try {
    const rawWorkouts = localStorage.getItem(`overhaul_user_${uid}_workout_history_list`);
    if (rawWorkouts) {
      const parsed = JSON.parse(rawWorkouts);
      if (Array.isArray(parsed)) allLogs.push(...parsed);
    }
  } catch {}

  try {
    const rawLifts = localStorage.getItem(`overhaul_user_${uid}_lifts`);
    if (rawLifts) {
      const parsed = JSON.parse(rawLifts);
      if (Array.isArray(parsed)) allLogs.push(...parsed);
    }
  } catch {}

  try {
    const rawSports = localStorage.getItem(`overhaul_user_${uid}_sports`);
    if (rawSports) {
      const parsed = JSON.parse(rawSports);
      if (Array.isArray(parsed)) allLogs.push(...parsed);
    }
  } catch {}

  const completedDateSet = new Set<string>();
  allLogs.forEach((log) => {
    if (!log) return;
    const d = log.date || (log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : null);
    if (d) completedDateSet.add(d);
  });

  if (completedDateSet.size === 0) {
    const zeroStreak: StreakInfo = {
      currentStreak: 0,
      lastActiveDate: today,
      bestStreak: 0,
    };
    try {
      localStorage.setItem(`overhaul_user_${uid}_daily_streak`, JSON.stringify(zeroStreak));
    } catch {}
    return zeroStreak;
  }

  // Calculate consecutive active workout days
  const hasToday = completedDateSet.has(today);
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  if (!hasToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const scheduledRestDays = ['Wed', 'Sun'];
  let currentStreak = 0;
  let consecutiveRest = 0;

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = (checkDate.getDay() + 6) % 7;
    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek];
    const isRest = scheduledRestDays.includes(dayName);

    if (completedDateSet.has(dateStr)) {
      currentStreak++;
      consecutiveRest = 0;
    } else if (isRest && currentStreak > 0 && consecutiveRest < 2) {
      consecutiveRest++;
    } else {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate historic best streak
  const sortedDates = Array.from(completedDateSet).sort();
  let maxStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays === 2) {
        const intervening = new Date(prevDate);
        intervening.setDate(intervening.getDate() + 1);
        const dayOfWeek = (intervening.getDay() + 6) % 7;
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek];
        if (scheduledRestDays.includes(dayName)) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }
    }
    prevDate = curDate;
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }

  const bestStreak = Math.max(maxStreak, currentStreak);
  const streakData: StreakInfo = {
    currentStreak,
    lastActiveDate: today,
    bestStreak,
  };

  try {
    localStorage.setItem(`overhaul_user_${uid}_daily_streak`, JSON.stringify(streakData));
  } catch {}

  return streakData;
}
