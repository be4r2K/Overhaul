/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StreakInfo {
  currentStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  bestStreak: number;
}

/**
 * Derives a dynamic athlete social passcode from user's name/family name.
 * e.g., 'CHRISTIAN-94' or 'SALAMEH-82'
 */
export function generateUserPasscode(name?: string, familyName?: string, existingCode?: string): string {
  // If user already has a valid personalized code adhering to the pattern, preserve it
  if (existingCode && existingCode.includes('-') && !existingCode.startsWith('ATHLETE-7') && !existingCode.startsWith('ATHLETE-A3')) {
    return existingCode.toUpperCase();
  }

  const primaryName = (familyName && familyName.trim().length > 0)
    ? familyName.trim()
    : (name && name.trim().length > 0)
      ? name.trim()
      : 'ATHLETE';

  const cleanName = primaryName.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ATHLETE';
  
  // Deterministic 2-digit number based on name hash if existingCode not present, or random 10-99
  let hash = 0;
  for (let i = 0; i < primaryName.length; i++) {
    hash = (hash * 31 + primaryName.charCodeAt(i)) % 90;
  }
  const suffix = 10 + Math.abs(hash);

  return `${cleanName}-${suffix}`;
}

/**
 * Calculates and updates real daily streak based on local calendar dates.
 * - Increments +1 day if active on consecutive calendar days.
 * - Resets to 1 if a full calendar day is missed between logins.
 * - Retains current count if accessed on the same calendar day.
 */
export function getAndUpdateDailyStreak(): StreakInfo {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = 'overhaul_daily_streak_data';
  
  let streakData: StreakInfo = {
    currentStreak: 1,
    lastActiveDate: today,
    bestStreak: 1,
  };

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lastActiveDate) {
        const lastDate = new Date(parsed.lastActiveDate + 'T00:00:00');
        const currDate = new Date(today + 'T00:00:00');
        
        // Calculate difference in whole calendar days
        const diffMs = currDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Logged in on same day: keep current streak
          streakData = {
            currentStreak: Math.max(1, parsed.currentStreak || 1),
            lastActiveDate: today,
            bestStreak: Math.max(parsed.bestStreak || 1, parsed.currentStreak || 1),
          };
        } else if (diffDays === 1) {
          // Logged in on consecutive day: increment streak by 1
          const newStreak = (parsed.currentStreak || 1) + 1;
          streakData = {
            currentStreak: newStreak,
            lastActiveDate: today,
            bestStreak: Math.max(parsed.bestStreak || 1, newStreak),
          };
        } else if (diffDays > 1) {
          // Missed at least 1 full calendar day: reset streak to 1
          streakData = {
            currentStreak: 1,
            lastActiveDate: today,
            bestStreak: Math.max(parsed.bestStreak || 1, 1),
          };
        }
      }
    }
  } catch (e) {
    console.warn('Streak tracking calculation error, initializing to 1:', e);
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(streakData));
  } catch {}

  return streakData;
}
