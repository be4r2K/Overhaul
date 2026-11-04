import { ActivityLevel, FitnessGoal, Gender, MacroSplit, OneRepMaxBreakdown, SportType } from '../types/fitness';

/**
 * Calculates exact age in years, months, and days from Date of Birth string (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string): { years: number; months: number; totalDays: number; displayText: string } {
  if (!birthDateStr) return { years: 25, months: 0, totalDays: 9125, displayText: '25 yrs' };
  
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) {
    return { years: 25, months: 0, totalDays: 9125, displayText: '25 yrs' };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const displayText = months > 0 ? `${years}y ${months}m` : `${years} years`;

  return { years: Math.max(0, years), months: Math.max(0, months), totalDays, displayText };
}

/**
 * Calculates BMI (Body Mass Index) and WHO classification
 */
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese Class I' | 'Obese Class II' | 'Obese Class III';
  color: string;
  badgeBg: string;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  percentileText: string;
} {
  const heightM = heightCm / 100;
  if (heightM <= 0 || weightKg <= 0) {
    return {
      bmi: 0,
      category: 'Normal weight',
      color: 'text-slate-400',
      badgeBg: 'bg-slate-800/40 text-slate-400 border-slate-700/50',
      healthyWeightMinKg: 0,
      healthyWeightMaxKg: 0,
      percentileText: 'Log weight & height to calculate'
    };
  }

  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  const healthyWeightMinKg = Number((18.5 * (heightM * heightM)).toFixed(1));
  const healthyWeightMaxKg = Number((24.9 * (heightM * heightM)).toFixed(1));

  let category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese Class I' | 'Obese Class II' | 'Obese Class III' = 'Normal weight';
  let color = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let percentileText = 'Optimal healthy weight zone';

  if (bmi < 18.5) {
    category = 'Underweight';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    percentileText = 'Below standard weight index';
  } else if (bmi <= 24.9) {
    category = 'Normal weight';
    color = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    percentileText = 'Healthy standard metabolic zone';
  } else if (bmi <= 29.9) {
    category = 'Overweight';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    percentileText = 'Slightly above standard (common for muscular lifters)';
  } else if (bmi <= 34.9) {
    category = 'Obese Class I';
    color = 'text-orange-400';
    badgeBg = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    percentileText = 'Elevated health risk zone';
  } else if (bmi <= 39.9) {
    category = 'Obese Class II';
    color = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    percentileText = 'High health risk zone';
  } else {
    category = 'Obese Class III';
    color = 'text-rose-500';
    badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    percentileText = 'Very high clinical risk zone';
  }

  return { bmi, category, color, badgeBg, healthyWeightMinKg, healthyWeightMaxKg, percentileText };
}

/**
 * Calculates BMR using Mifflin-St Jeor and Revised Harris-Benedict equations
 */
export function calculateBMR(weightKg: number, heightCm: number, ageYears: number, gender: Gender): {
  mifflinStJeor: number;
  harrisBenedict: number;
  katchMcArdle?: number;
} {
  if (weightKg <= 0 || heightCm <= 0) {
    return {
      mifflinStJeor: 0,
      harrisBenedict: 0,
    };
  }

  // Mifflin-St Jeor formula
  let msj = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === 'male') {
    msj += 5;
  } else {
    msj -= 161;
  }

  // Revised Harris-Benedict
  let hb = 0;
  if (gender === 'male') {
    hb = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  } else {
    hb = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
  }

  return {
    mifflinStJeor: Math.max(0, Math.round(msj)),
    harrisBenedict: Math.max(0, Math.round(hb)),
  };
}

/**
 * Calculates TDEE (Total Daily Energy Expenditure) based on BMR and physical activity factor
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) return 0;

  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,        // Desk job, little/no exercise
    light: 1.375,         // 1-3 days gym / moderate walking
    moderate: 1.55,       // 3-5 days gym or intense sports
    very_active: 1.725,   // 6-7 days hard training
    extra_active: 1.9,    // Daily training + manual job / athlete
  };

  const mult = multipliers[activityLevel] || 1.375;
  return Math.round(bmr * mult);
}

/**
 * Calculates calorie targets and exact macronutrient grams for fitness goal
 */
export function calculateNutritionTargets(
  tdee: number,
  weightKg: number,
  goal: FitnessGoal,
  macroSplit: MacroSplit
): {
  targetCalories: number;
  deficitOrSurplus: number;
  goalLabel: string;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  proteinKcal: number;
  carbsKcal: number;
  fatsKcal: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
  recommendedWaterMl: number;
} {
  if (tdee <= 0 || weightKg <= 0) {
    return {
      targetCalories: 0,
      deficitOrSurplus: 0,
      goalLabel: 'Log Weight & Height to Calculate',
      proteinGrams: 0,
      carbsGrams: 0,
      fatsGrams: 0,
      proteinKcal: 0,
      carbsKcal: 0,
      fatsKcal: 0,
      proteinPct: 30,
      carbsPct: 40,
      fatsPct: 30,
      recommendedWaterMl: 0,
    };
  }

  let targetCalories = tdee;
  let deficitOrSurplus = 0;
  let goalLabel = 'Weight Maintenance';

  switch (goal) {
    case 'aggressive_cut':
      targetCalories = Math.round(tdee * 0.75); // -25%
      deficitOrSurplus = targetCalories - tdee;
      goalLabel = 'Aggressive Fat Cut (-25%)';
      break;
    case 'moderate_cut':
      targetCalories = Math.round(tdee * 0.82); // -18%
      deficitOrSurplus = targetCalories - tdee;
      goalLabel = 'Lean Fat Loss (-18%)';
      break;
    case 'maintenance':
      targetCalories = tdee;
      deficitOrSurplus = 0;
      goalLabel = 'Maintain & Recomposition';
      break;
    case 'lean_bulk':
      targetCalories = Math.round(tdee * 1.10); // +10%
      deficitOrSurplus = targetCalories - tdee;
      goalLabel = 'Lean Muscle Bulk (+10%)';
      break;
    case 'heavy_bulk':
      targetCalories = Math.round(tdee * 1.20); // +20%
      deficitOrSurplus = targetCalories - tdee;
      goalLabel = 'Power & Mass Bulk (+20%)';
      break;
  }

  // Macro splits
  // 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
  let proteinPct = 30;
  let carbsPct = 40;
  let fatsPct = 30;

  if (macroSplit === 'high_protein') {
    proteinPct = 35;
    carbsPct = 45;
    fatsPct = 20;
  } else if (macroSplit === 'low_carb') {
    proteinPct = 35;
    carbsPct = 25;
    fatsPct = 40;
  } else if (macroSplit === 'keto') {
    proteinPct = 25;
    carbsPct = 5;
    fatsPct = 70;
  }

  const proteinKcal = (targetCalories * proteinPct) / 100;
  const carbsKcal = (targetCalories * carbsPct) / 100;
  const fatsKcal = (targetCalories * fatsPct) / 100;

  const proteinGrams = Math.round(proteinKcal / 4);
  const carbsGrams = Math.round(carbsKcal / 4);
  const fatsGrams = Math.round(fatsKcal / 9);

  // Water intake: 35ml / kg + workout baseline
  const recommendedWaterMl = Math.round(weightKg * 35 + 500);

  return {
    targetCalories,
    deficitOrSurplus,
    goalLabel,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    proteinKcal: Math.round(proteinKcal),
    carbsKcal: Math.round(carbsKcal),
    fatsKcal: Math.round(fatsKcal),
    proteinPct,
    carbsPct,
    fatsPct,
    recommendedWaterMl,
  };
}

/**
 * Calculates 1-Rep Max (1RM) using multiple verified scientific formulas
 */
export function calculate1RM(weightKg: number, reps: number): OneRepMaxBreakdown {
  if (reps <= 0 || weightKg <= 0) {
    return {
      brzycki: 0,
      epley: 0,
      lombardi: 0,
      mayhew: 0,
      average: 0,
      percentages: [],
    };
  }

  if (reps === 1) {
    const percentages = generatePercentages(weightKg);
    return {
      brzycki: weightKg,
      epley: weightKg,
      lombardi: weightKg,
      mayhew: weightKg,
      average: weightKg,
      percentages,
    };
  }

  // Brzycki formula: W * (36 / (37 - r))
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : weightKg * (1 + 0.0333 * reps);
  // Epley formula: W * (1 + 0.0333 * r)
  const epley = weightKg * (1 + 0.0333 * reps);
  // Lombardi formula: W * (r ^ 0.1)
  const lombardi = weightKg * Math.pow(reps, 0.1);
  // Mayhew et al. formula: (100 * W) / (52.2 + 41.9 * e^(-0.055 * r))
  const mayhew = (100 * weightKg) / (52.2 + 41.9 * Math.exp(-0.055 * reps));

  const average = Number(((brzycki + epley + lombardi + mayhew) / 4).toFixed(1));

  return {
    brzycki: Number(brzycki.toFixed(1)),
    epley: Number(epley.toFixed(1)),
    lombardi: Number(lombardi.toFixed(1)),
    mayhew: Number(mayhew.toFixed(1)),
    average,
    percentages: generatePercentages(average),
  };
}

function generatePercentages(oneRepMaxKg: number) {
  const steps = [
    { percent: 100, repsRange: '1 Rep Max (PR)' },
    { percent: 95, repsRange: '2 Reps' },
    { percent: 90, repsRange: '3 - 4 Reps' },
    { percent: 85, repsRange: '5 - 6 Reps' },
    { percent: 80, repsRange: '7 - 8 Reps' },
    { percent: 75, repsRange: '9 - 10 Reps' },
    { percent: 70, repsRange: '11 - 12 Reps' },
    { percent: 65, repsRange: '15 Reps' },
    { percent: 60, repsRange: '18 - 20 Reps' },
    { percent: 50, repsRange: 'Speed / Warmup' },
  ];

  return steps.map(s => {
    const weightKg = Number(((oneRepMaxKg * s.percent) / 100).toFixed(1));
    const weightLbs = Number((weightKg * 2.20462).toFixed(1));
    return {
      percent: s.percent,
      weightKg,
      weightLbs,
      repsRange: s.repsRange,
    };
  });
}

/**
 * Calculates Body Composition: Body Fat %, Lean Body Mass (LBM), and Fat-Free Mass Index (FFMI)
 */
export function calculateBodyComposition(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: Gender
): {
  bodyFatPct: number;
  leanBodyMassKg: number;
  fatMassKg: number;
  ffmi: number;
  ffmiCategory: string;
  category: string;
} {
  const heightM = heightCm / 100;
  if (heightM <= 0 || weightKg <= 0) {
    return {
      bodyFatPct: 0,
      leanBodyMassKg: 0,
      fatMassKg: 0,
      ffmi: 0,
      ffmiCategory: 'Not logged',
      category: 'Not logged',
    };
  }

  const bmi = weightKg / (heightM * heightM);

  // Adult Deurenberg Body Fat Formula
  let bodyFatPct = 0;
  if (gender === 'male') {
    bodyFatPct = 1.20 * bmi + 0.23 * ageYears - 16.2;
  } else {
    bodyFatPct = 1.20 * bmi + 0.23 * ageYears - 5.4;
  }

  bodyFatPct = Math.max(5, Math.min(50, Number(bodyFatPct.toFixed(1))));
  const fatMassKg = Number(((weightKg * bodyFatPct) / 100).toFixed(1));
  const leanBodyMassKg = Number((weightKg - fatMassKg).toFixed(1));

  // Normalized Fat-Free Mass Index (FFMI)
  // Normalized FFMI = (LBM in kg / (height in m)^2) + 6.1 * (1.8 - height in m)
  const rawFfmi = leanBodyMassKg / (heightM * heightM);
  const normalizedFfmi = Number((rawFfmi + 6.1 * (1.8 - heightM)).toFixed(1));

  let ffmiCategory = 'Average Muscularity';
  if (gender === 'male') {
    if (normalizedFfmi < 18) ffmiCategory = 'Below Average';
    else if (normalizedFfmi <= 19.5) ffmiCategory = 'Average';
    else if (normalizedFfmi <= 21.5) ffmiCategory = 'Above Average / Fit';
    else if (normalizedFfmi <= 23.5) ffmiCategory = 'Athletic / Well Built';
    else if (normalizedFfmi <= 25) ffmiCategory = 'Elite Natural Lifter';
    else ffmiCategory = 'Superior / Genetic Peak';
  } else {
    if (normalizedFfmi < 14) ffmiCategory = 'Below Average';
    else if (normalizedFfmi <= 16) ffmiCategory = 'Average';
    else if (normalizedFfmi <= 18) ffmiCategory = 'Above Average / Fit';
    else if (normalizedFfmi <= 20) ffmiCategory = 'Athletic / Well Built';
    else ffmiCategory = 'Elite Natural Athlete';
  }

  let category = 'Normal';
  if (gender === 'male') {
    if (bodyFatPct < 6) category = 'Essential Fat';
    else if (bodyFatPct <= 13) category = 'Athletes';
    else if (bodyFatPct <= 17) category = 'Fitness';
    else if (bodyFatPct <= 24) category = 'Acceptable';
    else category = 'High';
  } else {
    if (bodyFatPct < 14) category = 'Essential Fat';
    else if (bodyFatPct <= 20) category = 'Athletes';
    else if (bodyFatPct <= 24) category = 'Fitness';
    else if (bodyFatPct <= 31) category = 'Acceptable';
    else category = 'High';
  }

  return {
    bodyFatPct,
    leanBodyMassKg,
    fatMassKg,
    ffmi: normalizedFfmi,
    ffmiCategory,
    category,
  };
}

/**
 * Calculates BPL (Body Performance Level) - A 0-100 composite 4-pillar athletic index
 * Pillar 1 (Strength): (Total 1RM / Bodyweight) / 2.5 * 100
 * Pillar 2 (Cardio): (Weekly Cardio Mins / 150) * 100
 * Pillar 3 (Body Comp): (Lean Mass Ratio) * 100
 * Pillar 4 (Consistency): (Logged Sessions / Target) * 100
 * Overall Score: Average(Pillars 1..4)
 */
export function calculateBPL(
  strengthRatio: number, // Total 1RM lifts / bodyweight
  weeklyStepsAvg: number,
  weeklyCardioMinutes: number,
  bmi: number,
  bodyFatPct: number,
  loggedSessions: number = 0,
  targetSessions: number = 5
): {
  score: number;
  tier: 'Novice Tier' | 'Intermediate Tier' | 'Advanced Tier' | 'Competitor Tier';
  color: string;
  summary: string;
  strengthScore: number;
  cardioScore: number;
  compositionScore: number;
  consistencyScore: number;
} {
  const hasStrength = strengthRatio > 0;
  const hasCardio = weeklyCardioMinutes > 0;
  const hasBiometrics = bmi > 0 && bodyFatPct > 0;
  const hasConsistency = loggedSessions > 0 && targetSessions > 0;

  if (!hasStrength && !hasCardio && !hasBiometrics && !hasConsistency) {
    return {
      score: 0,
      tier: 'Novice Tier',
      color: 'text-slate-400',
      summary: 'Log workouts, PRs, or biometrics to compute your BPL rank',
      strengthScore: 0,
      cardioScore: 0,
      compositionScore: 0,
      consistencyScore: 0,
    };
  }

  // Pillar 1 (Strength): (Total 1RM / Bodyweight) / 2.5 * 100
  const strengthScore = hasStrength
    ? Math.min(100, Math.max(0, Math.round((strengthRatio / 2.5) * 100)))
    : 0;

  // Pillar 2 (Cardio): (Weekly Cardio Mins / 150) * 100
  const cardioScore = hasCardio
    ? Math.min(100, Math.max(0, Math.round((weeklyCardioMinutes / 150) * 100)))
    : 0;

  // Pillar 3 (Body Comp): (Lean Mass Ratio) * 100
  const leanMassRatio = hasBiometrics ? Math.max(0, Math.min(1, (100 - bodyFatPct) / 100)) : 0;
  const compositionScore = hasBiometrics
    ? Math.min(100, Math.max(0, Math.round(leanMassRatio * 100)))
    : 0;

  // Pillar 4 (Consistency): (Logged Sessions / Target) * 100
  const consistencyScore = hasConsistency
    ? Math.min(100, Math.max(0, Math.round((loggedSessions / targetSessions) * 100)))
    : 0;

  // Overall Score: Average(Pillars 1..4)
  const totalScore = Math.min(
    100,
    Math.max(0, Math.round((strengthScore + cardioScore + compositionScore + consistencyScore) / 4))
  );

  let tier: 'Novice Tier' | 'Intermediate Tier' | 'Advanced Tier' | 'Competitor Tier' = 'Novice Tier';
  let color = 'text-slate-400';
  let summary = 'Foundational phase — log workouts, PRs, and biometrics to build your rank';

  if (totalScore <= 25) {
    tier = 'Novice Tier';
    color = 'text-slate-400';
    summary =
      totalScore === 0
        ? 'Log workouts, PRs, or biometrics to compute your BPL rank'
        : 'Foundational athletic phase — room for progressive overload and conditioning';
  } else if (totalScore <= 50) {
    tier = 'Intermediate Tier';
    color = 'text-cyan-400';
    summary = 'Solid athletic foundation with developing strength and aerobic work capacity';
  } else if (totalScore <= 75) {
    tier = 'Advanced Tier';
    color = 'text-emerald-400';
    summary = 'High physical performance with strong power-to-weight and conditioning';
  } else {
    tier = 'Competitor Tier';
    color = 'text-violet-400';
    summary = 'Top percentile athletic readiness across strength, cardio, lean mass, and consistency';
  }

  return {
    score: totalScore,
    tier,
    color,
    summary,
    strengthScore,
    cardioScore,
    compositionScore,
    consistencyScore,
  };
}

/**
 * Calculates accurate calories burned for sports activities based on MET values
 */
export function calculateSportCalories(
  type: SportType,
  durationMinutes: number,
  weightKg: number,
  distanceKm?: number,
  avgSpeedKmh?: number
): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0;
  const hours = durationMinutes / 60;

  // Formula: Calories = MET * weightKg * hours
  let met = 7.0;

  switch (type) {
    case 'bike':
      // Cycling MET scales with speed
      if (avgSpeedKmh && avgSpeedKmh > 25) met = 12.0;      // Fast / racing >16mph
      else if (avgSpeedKmh && avgSpeedKmh > 20) met = 10.0; // Vigorous 14-16mph
      else if (avgSpeedKmh && avgSpeedKmh > 16) met = 8.0;  // Moderate 12-14mph
      else met = 6.8;                                       // Leisure 10-12mph
      break;

    case 'run':
      // Running MET scales with pace / speed
      if (distanceKm && distanceKm > 0) {
        const speed = distanceKm / hours; // km/h
        if (speed >= 14) met = 12.8;      // 7:00 /mi
        else if (speed >= 12) met = 11.5; // 8:00 /mi
        else if (speed >= 10) met = 9.8;  // 9:40 /mi
        else if (speed >= 8) met = 8.3;   // 12:00 /mi
        else met = 7.0;                   // Jogging
      } else {
        met = 9.8; // standard running
      }
      break;

    case 'swim':
      met = 8.0; // moderate/vigorous laps
      break;

    case 'hiit':
      met = 8.5; // circuit / crossfit / hiit
      break;

    case 'walk':
      met = 3.8; // brisk walk ~5 km/h
      break;

    case 'sports':
      met = 7.5; // basketball, tennis, soccer
      break;

    case 'rowing':
      met = 7.0; // stationary rowing
      break;
  }

  return Math.round(met * weightKg * hours);
}

/**
 * Unit conversions
 */
export const units = {
  kgToLbs: (kg: number) => Number((kg * 2.20462).toFixed(1)),
  lbsToKg: (lbs: number) => Number((lbs / 2.20462).toFixed(1)),
  cmToFtIn: (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches, text: `${feet}'${inches}"` };
  },
  ftInToCm: (feet: number, inches: number) => Math.round((feet * 12 + inches) * 2.54),
  kmToMiles: (km: number) => Number((km * 0.621371).toFixed(1)),
  milesToKm: (miles: number) => Number((miles / 0.621371).toFixed(1)),
};
