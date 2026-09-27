/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Exercise, LiftRecord, SportActivity, DailyStepLog, DailyNutritionLog, ExerciseCategory, MealItem } from './types/fitness';
import { AIWorkoutAnalysisResult, AppThemeSettings } from './types/aiWorkout';
import { 
  DEFAULT_PROFILE, 
  DEFAULT_EXERCISES, 
  DEFAULT_LIFTS, 
  DEFAULT_SPORTS, 
  DEFAULT_STEPS, 
  DEFAULT_NUTRITION, 
  loadFromStorage, 
  saveToStorage 
} from './utils/storage';
import { calculate1RM, calculateSportCalories } from './utils/calculations';
import { fetchWeatherForLocation, WeatherData, getAccurateDeviceGPS } from './utils/weather';
import { googleSignIn, initAuth, logout } from './utils/auth';
import { fetchGooglePeopleProfile } from './utils/googlePeople';
import { applyThemeToDOM, getStoredTheme, setStoredTheme } from './utils/theme';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeMainView } from './components/HomeMainView';
import { BiometricsView } from './components/BiometricsView';
import { GymProgressView } from './components/GymProgressView';
import { SportsTrackerView } from './components/SportsTrackerView';
import { NutritionView } from './components/NutritionView';
import { AIWorkoutSection } from './components/AIWorkoutSection';
import { RestTimerWidget } from './components/RestTimerWidget';
import { QuickLogModal } from './components/QuickLogModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Application State backed by localStorage
  const [profile, setProfile] = useState<UserProfile>(() => {
    const p = loadFromStorage('profile', DEFAULT_PROFILE);
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

  // Theme settings (Dark/Light, Accent color, Font)
  const [theme, setTheme] = useState<AppThemeSettings>(() => getStoredTheme());

  // Tab & Modal State - Default is 'dashboard' (Overhaul Main page in the center)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isRestTimerOpen, setIsRestTimerOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [explicitCoords, setExplicitCoords] = useState<{ latitude: number; longitude: number; cityName?: string } | undefined>(undefined);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(profile.authProvider === 'google');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Apply theme to DOM on mount and changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

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
      console.error('Weather load error:', e);
    } finally {
      setWeatherLoading(false);
    }
  }, [profile.location, explicitCoords]);

  // Initial weather load and auto-GPS attempt
  useEffect(() => {
    loadWeather(profile.location, explicitCoords);
  }, [loadWeather, profile.location, explicitCoords]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
      },
      () => {
        // Not signed in with cached token
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

  const todayStr = new Date().toISOString().split('T')[0];

  // Handle Google Sign In & Information extraction
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const { user, accessToken } = await googleSignIn();
      setIsAuthenticated(true);

      // Fetch people profile (Name, Family name, Birthday, Location)
      try {
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
          };
          return updated;
        });

        // Trigger weather refresh for new location if found
        if (peopleData.locationName) {
          loadWeather(peopleData.locationName);
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
          }));
        }
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
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

  return (
    <div className={`min-h-screen ${theme.mode === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-black text-slate-100'} flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300 relative transition-colors duration-200`}>
      {/* Ambient Instagram-style colorful glowing gradient orbs for high-transparency glass shimmer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20 blur-3xl opacity-75" />
        <div className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-bl from-cyan-500/15 via-violet-500/20 to-rose-500/15 blur-3xl opacity-70" />
        <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-indigo-500/15 blur-3xl opacity-65" />
      </div>

      {/* Top Bar with Overhaul title, AI Notes, Google Sync & Settings */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        units={profile.units}
        onToggleUnits={handleToggleUnits}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onResetData={handleResetData}
        onGoogleSignIn={handleGoogleSignIn}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        profile={profile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 md:pb-12">
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
            nutritionLog={nutritionLog}
            onNavigateTab={setCurrentTab}
            onQuickAddSteps={handleQuickAddSteps}
            onOpenTimer={() => setIsRestTimerOpen(true)}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onGoogleSignIn={handleGoogleSignIn}
            authLoading={authLoading}
            isAuthenticated={isAuthenticated}
            onOpenSettings={() => setIsSettingsOpen(true)}
            theme={theme}
          />
        )}

        {/* AI Workout Intelligence & Notes Split Parser */}
        {currentTab === 'ai-workouts' && (
          <AIWorkoutSection
            profile={profile}
            cachedAnalysis={aiWorkoutAnalysis}
            onSaveAnalysis={setAiWorkoutAnalysis}
            onImportExercisesToGym={handleImportExercisesToGym}
          />
        )}

        {/* Left Section: Biometrics, Age, BMI, BPL, Body Comp */}
        {currentTab === 'biometrics' && (
          <BiometricsView
            profile={profile}
            onUpdateProfile={setProfile}
            benchPR1RM={benchPR1RM}
            squatPR1RM={squatPR1RM}
            deadliftPR1RM={deadliftPR1RM}
            weeklyStepsAvg={weeklyStepsAvg}
            weeklyCardioMinutes={weeklyCardioMinutes}
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
          />
        )}
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
        exercises={exercises}
        onAddLift={handleAddLift}
        onAddSportActivity={handleAddSportActivity}
        onUpdateSteps={handleUpdateTodaySteps}
        currentSteps={todayStepLog.steps}
      />

      {/* Customization & Settings Modal (Dark/Light, Accent color, Font, Phone GPS) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onUpdateTheme={handleUpdateTheme}
        profile={profile}
        onUpdateProfile={setProfile}
        onGpsUpdated={handleGpsUpdated}
      />

      {/* Mobile Bottom Navigation Bar with Main in the center */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
    </div>
  );
}
