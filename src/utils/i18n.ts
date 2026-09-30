/**
 * Pure English Core Dictionary & String Resolver
 * The application runs strictly and permanently in English.
 */

export const ENGLISH_TRANSLATIONS: Record<string, string> = {
  // Navigation
  dashboard: 'Dashboard',
  gym: 'Tracker',
  'gym.1rm': 'Workout Tracker',
  biometrics: 'Biometrics',
  aiCoach: 'AI Coach',
  friends: 'Social',
  nutrition: 'Fuel',
  sports: 'Sports',
  settings: 'Settings',

  // Actions
  log: 'Log',
  quickLog: 'Quick Log',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  connect: 'Connect',
  connected: 'Connected',
  sync: 'Sync',
  syncing: 'Syncing...',
  done: 'Done',
  share: 'Share',
  logoutConfirm: 'Sign out of Google Account?',
  copy: 'Copy',
  copied: 'Copied!',
  sendRequest: 'Send Request',
  resetChat: 'Reset Chat',
  viewRoutine: 'View Routine',
  restTimer: 'Rest Timer',

  // Dashboard & Metrics
  appTitle: 'Overhaul',
  dailyStreak: 'Daily Streak',
  stepsRing: 'Steps Ring',
  steps: 'Steps',
  stepGoal: 'Step Goal',
  distance: 'Distance',
  activeBurn: 'Active Burn',
  liveWeatherGps: 'Live Weather & GPS',
  sleepRecovery: 'Sleep & Recovery',
  totalSleep: 'Total Sleep',
  deepSleep: 'Deep Sleep',
  remSleep: 'REM Sleep',
  sleepQuality: 'Sleep Quality',
  bodyComposition: 'Body Composition',
  dailyFuel: 'Daily Fuel',
  gymSets: 'Gym Sets',
  walks: 'Walks',
  cardio: 'Cardio',

  // 1RM & Gym
  maxLiftHeader: '1RM Strength Engine',
  exercise: 'Exercise',
  weight: 'Weight',
  reps: 'Reps',
  rpe: 'RPE',
  date: 'Date',
  notes: 'Notes',
  saveLift: 'Save Lift',
  calculated1RM: 'Estimated 1RM',
  allTimePR: 'All-Time PR',
  historyAndTrends: 'History & Trends',
  bigThreeTotal: 'Big 3 Power Total',
  newPR: 'New Personal Record!',

  // Biometrics
  biometricsProfile: 'Biometrics & Body Intelligence',
  firstName: 'First Name',
  familyName: 'Family Name',
  birthDate: 'Date of Birth',
  biologicalSex: 'Biological Sex',
  height: 'Height',
  bmiIndex: 'BMI Index',
  bplScore: 'BPL Athletic Score',
  leanMass: 'Lean Mass',
  fatMass: 'Fat Mass',
  ffmi: 'Normalized FFMI',

  // Social
  athleteCommunity: 'Athlete Community & Social',
  yourFriendCode: 'Your Athlete Code',
  incomingRequests: 'Incoming Requests',
  outgoingRequests: 'Outgoing Requests',
  noFriendsYet: 'No friends connected yet. Share your code to connect!',

  // AI Coach
  coachUnavailable: 'AI Coach Temporarily Offline',
  coachUnavailableDesc: 'An unexpected render glitch occurred. Tap Reset to restore your session.',
  askCoachPlaceholder: 'Ask anything or request a real-time split adjustment...',
  quickSuggestions: 'Quick Prompts',
  thinking: 'AI Coach is analyzing biomechanics...',

  // Settings
  units: 'Units',
  metric: 'Metric (kg, cm, km)',
  imperial: 'Imperial (lbs, in, mi)',
  accentColor: 'Accent Color',
  themeMode: 'Appearance Theme',
  dark: 'Dark (OLED Black)',
  light: 'Light (Clean Glass)',
  language: 'English',
};

/**
 * Universal English String Lookup Helper
 * Supports direct keys and dotted path lookups (e.g. "dashboard.steps" -> "Steps")
 */
export function t(key: string, _legacyLang?: string): string {
  if (!key) return '';

  // 1. Direct match
  if (key in ENGLISH_TRANSLATIONS) {
    return ENGLISH_TRANSLATIONS[key];
  }

  // 2. Normalized key (e.g. "dashboard.steps" -> "steps", "settings.title" -> "settings")
  const subKey = key.includes('.') ? key.split('.').pop()! : key;
  if (subKey in ENGLISH_TRANSLATIONS) {
    return ENGLISH_TRANSLATIONS[subKey];
  }

  // 3. Fallback to formatted key
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export const TRANSLATIONS = { en: ENGLISH_TRANSLATIONS };
export function getTranslation() {
  return ENGLISH_TRANSLATIONS;
}
