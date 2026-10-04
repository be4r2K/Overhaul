/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserProfile, 
  Exercise, 
  LiftRecord, 
  SportActivity, 
  DailyStepLog, 
  DailyNutritionLog, 
  ExerciseCategory, 
  MealItem, 
  SleepLog, 
  Friend, 
  FriendPost 
} from './types/fitness';
import { AIWorkoutAnalysisResult, AppThemeSettings } from './types/aiWorkout';
import { 
  DEFAULT_PROFILE, 
  DEFAULT_EXERCISES, 
  DEFAULT_LIFTS, 
  DEFAULT_SPORTS, 
  DEFAULT_STEPS, 
  DEFAULT_NUTRITION, 
  DEFAULT_SLEEP,
  DEFAULT_FRIENDS,
  DEFAULT_FRIEND_POSTS,
  loadFromStorage, 
  saveToStorage 
} from './utils/storage';
import { calculate1RM, calculateSportCalories } from './utils/calculations';
import { fetchWeatherForLocation, WeatherData, getAccurateDeviceGPS } from './utils/weather';
import { GoogleSignin, statusCodes, getAutoWebClientId, getActiveWebClientId, initGoogleAuth, useAuthObserver, getStoredAuthSession } from './utils/googleSignin';
import firebaseConfig from '../firebase-applet-config.json';
import { fetchGooglePeopleProfile } from './utils/googlePeople';
import { applyThemeToDOM, getStoredTheme, setStoredTheme } from './utils/theme';
import { isHealthConnectAvailable, requestHealthConnectPermissions, queryHealthConnectData } from './utils/healthConnect';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeMainView } from './components/HomeMainView';
import { BiometricsView } from './components/BiometricsView';
import { GymProgressView } from './components/GymProgressView';
import { SportsTrackerView } from './components/SportsTrackerView';
import { NutritionView } from './components/NutritionView';
import { Sparkles } from 'lucide-react';
import { AICoachChatSection } from './components/AICoachChatSection';
import { FriendsView } from './components/FriendsView';
import { RestTimerWidget } from './components/RestTimerWidget';
import { QuickLogModal } from './components/QuickLogModal';
import { SettingsView } from './components/SettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGateway } from './components/AuthGateway';
import { OnboardingTour } from './components/OnboardingTour';
import { PhysiqueScannerModal, AiPhysiqueScannerModal } from './components/PhysiqueScannerModal';
import { isContactsAvailable, requestContactsPermissions } from './utils/contacts';
import { generateUserPasscode, getAndUpdateDailyStreak } from './utils/streak';
import { useScrollDirection } from './utils/useScrollDirection';
import { Geolocation } from '@capacitor/geolocation';
import { Toast } from '@capacitor/toast';

export default function App() {
  // Application State backed by localStorage
  const [profile, setProfile] = useState<UserProfile>(() => {
    const p = loadFromStorage('profile', DEFAULT_PROFILE);
    if (p) {
      if (!p.personalFriendCode || p.personalFriendCode.startsWith('ATHLETE-7')) {
        p.personalFriendCode = generateUserPasscode(p.name, p.familyName);
      }
    }
    // User requested: "if i didn't log in like my weight or height or steps or anything keep them at 0 and let them update in real time"
    if (p && (!p.hasExplicitlyLogged && (p.weightKg === 80 || p.heightCm === 180))) {
      return { ...p, weightKg: 0, heightCm: 0, location: p.location === 'London' ? '' : (p.location || '') };
    }
    return p;
  });
  const [exercises, setExercises] = useState<Exercise[]>(() => 
    loadFromStorage('exercises', DEFAULT_EXERCISES)
  );
  const [liftRecords, setLiftRecords] = useState<LiftRecord[]>(() => {
    const l = loadFromStorage('lifts', DEFAULT_LIFTS);
    // Reset old template mock lifts if present
    if (l && l.length > 0 && l[0].id === 'lift-1' && l[0].weightKg === 100) {
      return [];
    }
    return l;
  });
  const [sportsHistory, setSportsHistory] = useState<SportActivity[]>(() => {
    const sp = loadFromStorage('sports', DEFAULT_SPORTS);
    if (sp && sp.length > 0 && sp[0].id === 'sport-1') {
      return [];
    }
    return sp;
  });
  const [stepsHistory, setStepsHistory] = useState<DailyStepLog[]>(() => {
    const s = loadFromStorage('steps', DEFAULT_STEPS);
    if (s && s.length > 0 && s[0].steps === 8420) {
      return DEFAULT_STEPS;
    }
    return s;
  });
  const [nutritionLog, setNutritionLog] = useState<DailyNutritionLog>(() => {
    const n = loadFromStorage('nutrition', DEFAULT_NUTRITION);
    if (n && n.meals && n.meals.length > 0 && n.meals[0].id === 'meal-1') {
      return DEFAULT_NUTRITION;
    }
    return n;
  });
  const [aiWorkoutAnalysis, setAiWorkoutAnalysis] = useState<AIWorkoutAnalysisResult | null>(() =>
    loadFromStorage('ai_workout_analysis', null)
  );

  const [sleepHistory, setSleepHistory] = useState<SleepLog[]>(() =>
    loadFromStorage('sleep', DEFAULT_SLEEP)
  );
  const [friends, setFriends] = useState<Friend[]>(() => {
    const stored = loadFromStorage<Friend[]>('friends', DEFAULT_FRIENDS) || [];
    // Absolute purge of mock athletes from storage
    const MOCK_NAMES = ['Alex Rivera', 'Liam Carter', 'Sophia Martinez', 'Sarah Jenkins', 'Coach Marcus', 'David Goggins', 'John Doe', 'Jane Miller'];
    const cleanList = stored.filter(
      (f) =>
        f &&
        !MOCK_NAMES.some((m) => f.name.toLowerCase().includes(m.toLowerCase())) &&
        !['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode) &&
        !['friend-1', 'friend-2', 'friend-3', 'friend-4'].includes(f.id) &&
        !f.id.includes('ATHLETE-A3') &&
        !f.id.includes('ATHLETE-L1') &&
        !f.id.includes('ATHLETE-S2')
    );
    if (cleanList.length !== stored.length) {
      saveToStorage('friends', cleanList);
    }
    return cleanList;
  });
  const [friendPosts, setFriendPosts] = useState<FriendPost[]>(() => {
    const stored = loadFromStorage<FriendPost[]>('friend_posts', DEFAULT_FRIEND_POSTS);
    const MOCK_NAMES = ['Alex Rivera', 'Liam Carter', 'Sophia Martinez', 'Sarah Jenkins', 'Coach Marcus', 'David Goggins', 'John Doe', 'Jane Miller'];
    const cleanPosts = stored.filter(
      (p) =>
        p &&
        !['post-1', 'post-2', 'post-3'].includes(p.id) &&
        !MOCK_NAMES.some((m) => (p.friendName || '').toLowerCase().includes(m.toLowerCase()))
    );
    if (cleanPosts.length !== stored.length) {
      saveToStorage('friend_posts', cleanPosts);
    }
    return cleanPosts;
  });
  const [language, setLanguage] = useState<string>(() =>
    loadFromStorage('app_language', 'en')
  );

  // Theme settings (Dark/Light, Accent color, Font)
  const [theme, setTheme] = useState<AppThemeSettings>(() => getStoredTheme());

  // Tab & Modal State - Default is 'dashboard' (Overhaul Main page in the center)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const { showTopBar, showBottomBar } = useScrollDirection(currentTab);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState<boolean>(false);
  const [isPhysiqueScannerOpen, setIsPhysiqueScannerOpen] = useState<boolean>(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [explicitCoords, setExplicitCoords] = useState<{ latitude: number; longitude: number; cityName?: string } | undefined>(undefined);

  // Auth state with local session persistence check on launch/reload
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getStoredAuthSession();
    return Boolean(session && (session.user || session.token) || profile.authProvider === 'google');
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Interactive Onboarding Tour state: stored in localStorage ('hasCompletedTour')
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    const isDone = localStorage.getItem('hasCompletedTour') === 'true' || localStorage.getItem('overhaul_onboarding_completed_v4') === 'true';
    return !isDone;
  });

  // Track daily login streak on app mount
  useEffect(() => {
    getAndUpdateDailyStreak();
  }, []);

  // 1. Navigation on Success: Transition to app dashboard and sync user profile
  const navigateToHome = useCallback((firebaseUser?: any) => {
    setIsAuthenticated(true);
    setCurrentTab('dashboard');
    if (firebaseUser) {
      const displayName = firebaseUser.displayName || '';
      const names = displayName ? displayName.split(' ') : [];
      setProfile((prev) => ({
        ...prev,
        name: names[0] || prev.name || 'Athlete',
        familyName: names.slice(1).join(' ') || prev.familyName || '',
        email: firebaseUser.email || prev.email,
        photoUrl: firebaseUser.photoURL || prev.photoUrl,
        authProvider: 'google',
        personalFriendCode: generateUserPasscode(names[0] || prev.name, names.slice(1).join(' ') || prev.familyName, prev.personalFriendCode),
      }));
    }
  }, []);

  // 3. Auth State Observer: Bind listener at root level so any successful credential check automatically redirects
  useAuthObserver(navigateToHome);

  // Apply theme to DOM on mount and changes
  useEffect(() => {
    applyThemeToDOM(theme);
    const isGlassOn = theme.liquidGlass !== false;
    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        document.documentElement.classList.toggle('liquid-glass-enabled', isGlassOn);
        document.documentElement.classList.toggle('liquid-glass-active', isGlassOn);
      }
      if (document.body) {
        document.body.classList.toggle('liquid-glass-enabled', isGlassOn);
        document.body.classList.toggle('liquid-glass-active', isGlassOn);
      }
    }
  }, [theme]);

  // Sync text direction for RTL languages (Arabic)
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language || 'en';
  }, [language]);

  // First-launch initialization check (isFirstLaunch)
  useEffect(() => {
    const hasLaunched = localStorage.getItem('overhaul_first_launch_v3');
    if (!hasLaunched) {
      // Clear legacy storage items
      localStorage.removeItem('apex_fitness_profile');
      localStorage.removeItem('apex_fitness_lifts');
      localStorage.removeItem('apex_fitness_sports');
      localStorage.removeItem('apex_fitness_steps');
      localStorage.removeItem('apex_fitness_nutrition');
      localStorage.removeItem('apex_fitness_sleep');
      localStorage.removeItem('apex_fitness_friends');
      localStorage.removeItem('apex_fitness_friend_posts');
      localStorage.removeItem('apex_fitness_ai_workout_analysis');
      
      // Set first launch completed tag
      localStorage.setItem('overhaul_first_launch_v3', 'true');
      
      // Reset react state variables immediately to zeroed/empty defaults!
      setProfile({
        name: 'Christian',
        familyName: 'Salameh',
        birthDate: '2001-05-18',
        gender: 'male',
        heightCm: 0,
        weightKg: 0,
        activityLevel: 'moderate',
        goal: 'lean_bulk',
        macroSplit: 'high_protein',
        stepGoal: 10000,
        units: 'metric',
        targetWaterMl: 0,
        location: '',
        email: 'christiansalameh7@gmail.com',
        authProvider: 'local',
      });
      setLiftRecords([]);
      setSportsHistory([]);
      setStepsHistory([{
        date: new Date().toISOString().split('T')[0],
        steps: 0,
        target: 10000,
        distanceKm: 0,
        caloriesBurned: 0,
      }]);
      setNutritionLog({
        date: new Date().toISOString().split('T')[0],
        waterConsumedMl: 0,
        meals: [],
      });
      setSleepHistory([]);
      setFriends([]);
      setFriendPosts([]);
    }
  }, []);

  const handleUpdateTheme = (updated: AppThemeSettings) => {
    setTheme(updated);
    setStoredTheme(updated);
    applyThemeToDOM(updated);
  };

  // Fetch weather for location or accurate GPS
  const loadWeather = useCallback(async (locationQuery?: string, coords?: { latitude: number; longitude: number; cityName?: string }) => {
    setWeatherLoading(true);
    try {
      const w = await fetchWeatherForLocation(locationQuery || profile.location, coords || explicitCoords);
      setWeather(w);
    } catch (e) {
      console.warn('Weather load non-fatal fallback:', e);
    } finally {
      setWeatherLoading(false);
    }
  }, [profile.location, explicitCoords]);

  // Initial weather load and auto-GPS attempt
  useEffect(() => {
    loadWeather(profile.location, explicitCoords);
  }, [loadWeather, profile.location, explicitCoords]);

  // Configure GoogleSignin at root app lifecycle level before any user interaction
  useEffect(() => {
    try {
      const activeId = getAutoWebClientId();
      GoogleSignin.configure({
        webClientId: activeId,
        offlineAccess: true,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/user.birthday.read',
          'https://www.googleapis.com/auth/user.addresses.read',
        ],
      });
      console.log('[Root Lifecycle] GoogleSignin configured with active Web Client ID:', activeId);
    } catch (e) {
      console.error('[Root Lifecycle] Failed to configure GoogleSignin:', e);
    }
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = GoogleSignin.initAuth(
      (user) => {
        setIsAuthenticated(true);
      },
      () => {
        // Not signed in
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    saveToStorage('profile', profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage('exercises', exercises);
  }, [exercises]);

  useEffect(() => {
    saveToStorage('lifts', liftRecords);
  }, [liftRecords]);

  useEffect(() => {
    saveToStorage('sports', sportsHistory);
  }, [sportsHistory]);

  useEffect(() => {
    saveToStorage('steps', stepsHistory);
  }, [stepsHistory]);

  useEffect(() => {
    saveToStorage('nutrition', nutritionLog);
  }, [nutritionLog]);

  useEffect(() => {
    if (aiWorkoutAnalysis) {
      saveToStorage('ai_workout_analysis', aiWorkoutAnalysis);
    }
  }, [aiWorkoutAnalysis]);

  useEffect(() => {
    saveToStorage('sleep', sleepHistory);
  }, [sleepHistory]);

  useEffect(() => {
    saveToStorage('friends', friends);
  }, [friends]);

  useEffect(() => {
    saveToStorage('friend_posts', friendPosts);
  }, [friendPosts]);

  useEffect(() => {
    saveToStorage('app_language', language);
  }, [language]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Handle Google Sign In & Dynamic Zero-State Initializations
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const activeClientId = getActiveWebClientId();
    console.log("Active Web Client ID:", activeClientId);

    try {
      GoogleSignin.configure({
        webClientId: activeClientId,
        offlineAccess: true,
      });

      // 1. Verify Google Play Services availability
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 2. Force signOut() before signIn() to reset any cached/broken implicit state and ensure account picker pops up
      await GoogleSignin.signOut();

      // 3. Initiate native Google Sign In with Web Client ID
      const result = await GoogleSignin.signIn();
      if (!result || !result.user) {
        console.error("Google Sign-In returned no user (handled silently).");
        return;
      }
      const { user, accessToken } = result;
      setIsAuthenticated(true);
      if (!localStorage.getItem('hasCompletedTour')) {
        setIsTourOpen(true);
      }

      // Generate strictly unique permanent passcode for new user
      const athleteCode = generateUserPasscode(user.displayName ? user.displayName.split(' ')[0] : 'Christian', user.displayName ? user.displayName.split(' ').slice(1).join(' ') : 'Salameh');

      // STRICT ZERO-STATE INITIALIZATION FOR THE NEWLY SIGNED IN ACCOUNT
      setLiftRecords([]);
      setSportsHistory([]);
      setStepsHistory([{
        date: todayStr,
        steps: 0,
        target: 10000,
        distanceKm: 0,
        caloriesBurned: 0,
      }]);
      setNutritionLog({
        date: todayStr,
        waterConsumedMl: 0,
        meals: [],
      });
      setSleepHistory([]);
      setFriends([]);
      setFriendPosts([]);
      
      // Clear physique visual scanner results to reset assessments
      localStorage.removeItem('ai_body_vision_result');
      localStorage.removeItem('ai_body_vision_history');
      setAiWorkoutAnalysis(null);

      // Request All Required Native Permissions on Sign-In with robust try-catch
      try {
        try {
          const geoPerms = await Geolocation.requestPermissions();
          if (geoPerms.location === 'granted') {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000
            });
            const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            handleGpsUpdated(coords);
          }
        } catch (e) {
          console.warn('Geolocation setup failed:', e);
        }

        try {
          if ('Notification' in window) {
            Notification.requestPermission();
          }
        } catch (e) {}

        try {
          const hcAvailable = await isHealthConnectAvailable();
          if (hcAvailable) {
            await requestHealthConnectPermissions();
          }
        } catch (e) {
          console.warn('Health Connect setup failed:', e);
        }

        try {
          const conAvailable = await isContactsAvailable();
          if (conAvailable) {
            await requestContactsPermissions();
          }
        } catch (e) {
          console.warn('Contacts setup failed:', e);
        }
      } catch (err) {
        console.warn('Native permissions master block failure:', err);
      }

      // Fetch people profile (Name, Family name, Birthday, Location)
      try {
        if (accessToken) {
          const peopleData = await fetchGooglePeopleProfile(accessToken);
          
          setProfile((prev) => {
            const updated: UserProfile = {
              ...prev,
              name: peopleData.firstName || prev.name,
              familyName: peopleData.familyName || prev.familyName,
              birthDate: peopleData.birthDate || prev.birthDate,
              location: peopleData.locationName || prev.location,
              photoUrl: peopleData.photoUrl || user.photoURL || prev.photoUrl,
              email: peopleData.email || user.email || prev.email,
              authProvider: 'google',
              personalFriendCode: athleteCode,
            };
            return updated;
          });

          if (peopleData.locationName) {
            loadWeather(peopleData.locationName);
          }
        }
      } catch (err) {
        console.warn('Google People API profile enrichment non-fatal:', err);
        if (user.displayName) {
          const names = user.displayName.split(' ');
          setProfile((prev) => ({
            ...prev,
            name: names[0] || prev.name,
            familyName: names.slice(1).join(' ') || prev.familyName,
            email: user.email || prev.email,
            photoUrl: user.photoURL || prev.photoUrl,
            authProvider: 'google',
            personalFriendCode: athleteCode,
          }));
        }
      }
    } catch (error: any) {
      // Log silently for debugging; do NOT trigger popups, alerts, or UI banners
      console.error("Google Sign-In Error (Handled Silently):", error);
    } finally {
      setAuthLoading(false);
    }
  };


  // Unit toggle
  const handleToggleUnits = () => {
    setProfile((prev) => ({
      ...prev,
      units: prev.units === 'metric' ? 'imperial' : 'metric',
    }));
  };

  const handleLogout = async () => {
    await GoogleSignin.signOut();
    setIsAuthenticated(false);
    // Profile reset
    setProfile(DEFAULT_PROFILE);
  };

  // Reset to sample default data
  const handleResetData = () => {
    if (window.confirm('Reset all fitness and biometric data to default athlete profile?')) {
      setProfile(DEFAULT_PROFILE);
      setExercises(DEFAULT_EXERCISES);
      setLiftRecords(DEFAULT_LIFTS);
      setSportsHistory(DEFAULT_SPORTS);
      setStepsHistory(DEFAULT_STEPS);
      setNutritionLog(DEFAULT_NUTRITION);
    }
  };

  // Lift Handlers
  const handleAddLift = (liftData: Omit<LiftRecord, 'id' | 'calculated1RM' | 'isPR'>) => {
    const calc = calculate1RM(liftData.weightKg, liftData.reps);
    const existingLifts = liftRecords.filter((r) => r.exerciseId === liftData.exerciseId);
    const previousPR = existingLifts.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
    const isNewPR = calc.average > previousPR;

    const newRecord: LiftRecord = {
      ...liftData,
      id: `lift-${Date.now()}`,
      calculated1RM: calc.average,
      isPR: isNewPR,
    };

    setLiftRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteLift = (id: string) => {
    setLiftRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddCustomExercise = (name: string, category: ExerciseCategory) => {
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name,
      category,
      isCustom: true,
    };
    setExercises((prev) => [...prev, newEx]);
  };

  const handleImportExercisesToGym = (items: { name: string; category: ExerciseCategory }[]) => {
    setExercises((prev) => {
      const existingNames = new Set(prev.map((e) => e.name.toLowerCase()));
      const toAdd: Exercise[] = [];
      items.forEach((item) => {
        if (!existingNames.has(item.name.toLowerCase())) {
          toAdd.push({
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: item.name,
            category: item.category,
            isCustom: true,
          });
          existingNames.add(item.name.toLowerCase());
        }
      });
      return [...prev, ...toAdd];
    });
  };

  // Sports Handlers
  const handleAddSportActivity = (activityData: Omit<SportActivity, 'id' | 'caloriesBurned'>) => {
    const caloriesBurned = calculateSportCalories(
      activityData.type,
      activityData.durationMinutes,
      profile.weightKg,
      activityData.distanceKm,
      activityData.avgSpeedKmh
    );

    const newSport: SportActivity = {
      ...activityData,
      id: `sport-${Date.now()}`,
      caloriesBurned,
    };

    setSportsHistory((prev) => [newSport, ...prev]);
  };

  const handleDeleteSportActivity = (id: string) => {
    setSportsHistory((prev) => prev.filter((s) => s.id !== id));
  };

  // Steps Handlers
  const handleUpdateTodaySteps = (newSteps: number) => {
    setStepsHistory((prev) => {
      const existingIndex = prev.findIndex((s) => s.date === todayStr);
      const target = profile.stepGoal || 10000;
      const distanceKm = Number((newSteps * 0.00078).toFixed(2));
      const caloriesBurned = Math.round(newSteps * 0.04);

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          steps: newSteps,
          distanceKm,
          caloriesBurned,
        };
        return copy;
      } else {
        return [
          ...prev,
          {
            date: todayStr,
            steps: newSteps,
            target,
            distanceKm,
            caloriesBurned,
          },
        ];
      }
    });
  };

  const handleQuickAddSteps = (increment: number) => {
    const todayLog = stepsHistory.find((s) => s.date === todayStr);
    const current = todayLog ? todayLog.steps : 8420;
    handleUpdateTodaySteps(current + increment);
  };

  // Nutrition Handlers
  const handleAddMeal = (mealData: Omit<MealItem, 'id' | 'time'>) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMeal: MealItem = {
      ...mealData,
      id: `meal-${Date.now()}`,
      time: timeStr,
    };

    setNutritionLog((prev) => ({
      ...prev,
      meals: [newMeal, ...prev.meals],
    }));
  };

  const handleDeleteMeal = (mealId: string) => {
    setNutritionLog((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== mealId),
    }));
  };

  const handleUpdateWater = (amountMl: number) => {
    setNutritionLog((prev) => ({
      ...prev,
      waterConsumedMl: Math.max(0, amountMl),
    }));
  };

  // Handle accurate phone GPS locked from Settings or button
  const handleGpsUpdated = (coords: { latitude: number; longitude: number; cityName?: string }) => {
    setExplicitCoords(coords);
    if (coords.cityName) {
      setProfile((prev) => ({ ...prev, location: coords.cityName }));
    }
    loadWeather(coords.cityName || profile.location, coords);
  };

  const handleAcquirePhoneGps = async () => {
    try {
      const coords = await getAccurateDeviceGPS();
      if (coords) {
        handleGpsUpdated(coords);
      }
    } catch (e) {
      console.warn('GPS acquire error:', e);
    }
  };

  // Calculations for cross-view insights
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };
  const benchPR1RM = getBest1RM('bench-press');
  const squatPR1RM = getBest1RM('back-squat');
  const deadliftPR1RM = getBest1RM('deadlift');

  const weeklyStepsAvg = Math.round(
    stepsHistory.reduce((sum, s) => sum + s.steps, 0) / Math.max(1, stepsHistory.length)
  );
  const weeklyCardioMinutes = sportsHistory.reduce((sum, s) => sum + s.durationMinutes, 0);

  const todayStepLog = stepsHistory.find((s) => s.date === todayStr) || {
    date: todayStr,
    steps: 0,
    target: profile.stepGoal || 10000,
    distanceKm: 0,
    caloriesBurned: 0,
  };
  const todaySports = sportsHistory.filter((s) => s.date === todayStr);
  const totalCaloriesBurnedToday =
    todayStepLog.caloriesBurned + todaySports.reduce((sum, s) => sum + s.caloriesBurned, 0);

  // 1. Google OAuth Gateway Access Protection Block
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto font-sans text-slate-100">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-10 right-0 w-96 h-96 rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute bottom-10 left-0 w-96 h-96 rounded-full bg-indigo-500/20 blur-[120px]" />
        </div>

        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl text-center space-y-6 animate-card-expand">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">OVERHAUL</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">Health, Gym & Biometric Intelligence</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-slate-300 text-xs text-left leading-normal font-medium font-sans">
            <p className="font-bold text-white mb-1">Welcome! Sign in with your Google Account to unlock:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Automatic background Samsung Health sync</li>
              <li>Accurate location weather forecasts & GPS tracking</li>
              <li>Autonomous AI training critiques & 3D body scans</li>
              <li>Address book contact matching and Community friends</li>
            </ul>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full py-3.5 rounded-2xl text-black font-black text-xs flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent-hex, #10B981)',
              boxShadow: '0 0 15px var(--accent-hex, #10B981)'
            }}
          >
            {authLoading ? (
              <span className="font-mono text-xs animate-pulse">Establishing Secure OAuth connection...</span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>CONTINUE WITH GOOGLE SIGN-IN</span>
              </>
            )}
          </button>

          <p className="text-[9px] text-slate-500 font-mono">Secured by Google OAuth and Firebase encryption.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-active-tab={currentTab}
      data-theme={theme.mode === 'light' ? 'light' : 'dark'}
      data-glass={theme.liquidGlass !== false ? 'true' : 'false'}
      className={`min-h-screen h-screen max-h-screen flex flex-col justify-between app-root-container ${
        theme.mode === 'light' ? 'text-slate-900' : 'text-slate-100'
      } ${theme.liquidGlass !== false ? 'liquid-glass-enabled liquid-glass-active liquid-glass glass-theme' : 'solid-flat'} font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative`}
      style={{
        minHeight: '100vh',
        paddingBottom: 0,
        paddingTop: currentTab === 'dashboard' ? 0 : 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Top Bar with Overhaul cursive wordmark: rendered EXCLUSIVELY on Dashboard */}
      {currentTab === 'dashboard' && (
        <TopBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          units={profile.units}
          onToggleUnits={handleToggleUnits}
          onResetData={handleResetData}
          onGoogleSignIn={handleGoogleSignIn}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          profile={profile}
          onOpenSettings={() => setIsSettingsOpen(true)}
          theme={theme}
          language={language}
          isVisible={showTopBar}
        />
      )}

      {/* Main Content Area expanding to 100% viewport height when bars hide */}
      <main
        className="relative z-10 flex-1 min-h-0 overflow-x-hidden max-w-7xl w-full mx-auto px-2 sm:px-4 py-1 flex flex-col justify-between transition-[padding-bottom] duration-200"
        style={{
          paddingBottom: showBottomBar ? 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' : 0,
          paddingTop: currentTab === 'dashboard' ? undefined : 'max(0.25rem, env(safe-area-inset-top, 0px))',
        }}
      >
        <ErrorBoundary>
          <div
            key={currentTab.startsWith('ai-coach') || currentTab === 'ai-workouts' ? 'ai-coach' : currentTab}
            className="h-full w-full flex flex-col flex-1 min-h-0 overflow-x-hidden"
          >
              {/* Center / Front Page: Overhaul Main Hub with Hello Christian, Weather, Highlights, Progress, Weight & Goals */}
              {currentTab === 'dashboard' && (
            <HomeMainView
              profile={profile}
              onUpdateProfile={setProfile}
              weather={weather}
              weatherLoading={weatherLoading}
              onRefreshWeather={() => loadWeather(profile.location, explicitCoords)}
              onRequestGps={handleAcquirePhoneGps}
              liftRecords={liftRecords}
              sportsHistory={sportsHistory}
              stepsHistory={stepsHistory}
              sleepHistory={sleepHistory}
              onUpdateSleep={(s) => setSleepHistory((prev) => [s, ...prev.filter((p) => p.date !== s.date)])}
              friends={friends}
              friendPosts={friendPosts}
              onUpdateFriendPosts={setFriendPosts}
              nutritionLog={nutritionLog}
              onNavigateTab={setCurrentTab}
              onQuickAddSteps={handleQuickAddSteps}
              onOpenTimer={() => setIsRestTimerOpen(true)}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onGoogleSignIn={handleGoogleSignIn}
              authLoading={authLoading}
              isAuthenticated={isAuthenticated}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPhysiqueScanner={() => setIsPhysiqueScannerOpen(true)}
              theme={theme}
              language={language}
            />
          )}

          {/* Friends & Social Community Page */}
          {currentTab === 'friends' && (
            <FriendsView
              profile={profile}
              friends={friends}
              onUpdateFriends={setFriends}
              friendPosts={friendPosts}
              onUpdateFriendPosts={setFriendPosts}
              liftRecords={liftRecords}
              sportsHistory={sportsHistory}
              stepsHistory={stepsHistory}
              aiWorkoutAnalysis={aiWorkoutAnalysis}
              language={language}
            />
          )}

          {/* Left Section: Biometrics, Age, BMI, BPL, Body Comp & Sleep */}
          {currentTab === 'biometrics' && (
            <BiometricsView
              profile={profile}
              onUpdateProfile={setProfile}
              benchPR1RM={benchPR1RM}
              squatPR1RM={squatPR1RM}
              deadliftPR1RM={deadliftPR1RM}
              weeklyStepsAvg={weeklyStepsAvg}
              weeklyCardioMinutes={weeklyCardioMinutes}
              nutritionLog={nutritionLog}
              language={language}
              onOpenPhysiqueScanner={() => setIsPhysiqueScannerOpen(true)}
            />
          )}

          {/* Left Section: Daily Calorie Engine, Meals & Hydration */}
          {currentTab === 'nutrition' && (
            <NutritionView
              profile={profile}
              nutritionLog={nutritionLog}
              totalCaloriesBurnedToday={totalCaloriesBurnedToday}
              onAddMeal={handleAddMeal}
              onDeleteMeal={handleDeleteMeal}
              onUpdateWater={handleUpdateWater}
              language={language}
            />
          )}

          {/* Right Section: Gym Workout 1RM, Max Weight & Reps, PR Trophy Shelf */}
          {currentTab === 'gym' && (
            <GymProgressView
              profile={profile}
              exercises={exercises}
              liftRecords={liftRecords}
              onAddLift={handleAddLift}
              onDeleteLift={handleDeleteLift}
              onAddCustomExercise={handleAddCustomExercise}
              onOpenTimer={() => setIsRestTimerOpen(true)}
              aiWorkoutAnalysis={aiWorkoutAnalysis}
              stepsHistory={stepsHistory}
              sleepHistory={sleepHistory}
              sportsHistory={sportsHistory}
              nutritionLog={nutritionLog}
              totalCaloriesBurnedToday={totalCaloriesBurnedToday}
              onNavigateToTab={(tab) => setCurrentTab(tab as any)}
              language={language}
              onOpenPhysiqueScanner={() => setIsPhysiqueScannerOpen(true)}
            />
          )}

          {/* Right Section: Sports, Bicycle Rides, Runs & Steps */}
          {currentTab === 'sports' && (
            <SportsTrackerView
              profile={profile}
              stepsHistory={stepsHistory}
              sportsHistory={sportsHistory}
              onUpdateTodaySteps={handleUpdateTodaySteps}
              onAddSportActivity={handleAddSportActivity}
              onDeleteSportActivity={handleDeleteSportActivity}
              language={language}
            />
          )}

          {/* Dedicated full screen Settings Page Tab Route */}
          {currentTab === 'settings' && (
            <SettingsView
              theme={theme}
              onUpdateTheme={handleUpdateTheme}
              profile={profile}
              onUpdateProfile={setProfile}
              onGpsUpdated={handleGpsUpdated}
              language={language}
            />
          )}
          </div>
        </ErrorBoundary>
      </main>

      {/* Floating or Docked Gym Rest Timer */}
      {isRestTimerOpen && (
        <RestTimerWidget onDismiss={() => setIsRestTimerOpen(false)} />
      )}

      {/* Quick Action Modal */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        profile={profile}
        onUpdateProfile={setProfile}
        exercises={exercises}
        onAddLift={handleAddLift}
        onAddSportActivity={handleAddSportActivity}
        onUpdateSteps={handleUpdateTodaySteps}
        currentSteps={todayStepLog.steps}
      />

      {/* Mobile Bottom Navigation Bar with Main in the center */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        isVisible={showBottomBar && !isAiCoachOpen}
      />

      {/* Floating AI Coach Button (FAB) - Dynamic Liquid Glass & elevated bottom offset (96px) */}
      {!isAiCoachOpen && !isQuickLogOpen && !isSettingsOpen && !isRestTimerOpen && !isPhysiqueScannerOpen && !isTourOpen && (
        <div className="floating-ai-fab keyboard-auto-hide fixed bottom-[96px] right-[20px] z-40 pointer-events-auto transition-all duration-200">
          <button
            onClick={() => setIsAiCoachOpen(true)}
            className="ai-fab pill w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 hover:scale-105"
            title="Open AI Coach & Real-Time Split Adaptor"
            aria-label="Open AI Coach"
          >
            <Sparkles
              className="w-4 h-4 stroke-[2.5]"
              style={{
                color: theme.mode === 'light' ? '#0F172A' : 'var(--accent-hex, #10b981)',
              }}
            />
          </button>
        </div>
      )}

      {/* Slide-Up AI Coach Chat Modal */}
      <AnimatePresence>
        {isAiCoachOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-2 sm:px-4 pt-4 pointer-events-auto"
            style={{ paddingBottom: '24px' }}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="card w-full max-w-lg h-[82vh] flex flex-col liquid-glass rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">AI Coach & Split Adaptor</h2>
                    <p className="text-[10px] text-slate-400">Real-Time Routine Synchronization Active</p>
                  </div>
                </div>
                {/* Close Button */}
                <button
                  onClick={() => setIsAiCoachOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close AI Coach"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat View content */}
              <div className="flex-1 min-h-0 p-2 overflow-y-auto">
                <AICoachChatSection
                  profile={profile}
                  currentRoutine={aiWorkoutAnalysis}
                  onUpdateRoutine={(updated) => {
                    setAiWorkoutAnalysis(updated);
                    saveToStorage('ai_workout_analysis', updated);
                  }}
                  onNavigateToRoutine={() => {
                    setIsAiCoachOpen(false);
                    setCurrentTab('gym');
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Step-by-Step Onboarding Tour Overlay with Persistent State & Glow */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentTab={currentTab}
        onNavigateTab={setCurrentTab}
      />
      {/* 3. AI Physique Multi-Photo Scanner Modal */}
      <PhysiqueScannerModal
        isOpen={isPhysiqueScannerOpen}
        onClose={() => setIsPhysiqueScannerOpen(false)}
        onUpdateRatings={(ratings) => {
          // In a real app, this would persist to DB
          console.log('AI Muscle Ratings Processed:', ratings);
          Toast.show({ text: 'AI Physique Audit Complete. Muscle ratings updated.', duration: 'long' });
        }}
      />
    </div>
  );
}
