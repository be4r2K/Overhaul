export type FormulaType = 'epley' | 'brzycki' | 'lombardi' | 'oconner' | 'mayhew' | 'wathan';

export function calculate1RM(weight: number, reps: number, formula: FormulaType = 'epley'): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;

  let max = 0;
  switch (formula) {
    case 'epley':
      // Epley: w * (1 + r / 30)
      max = weight * (1 + reps / 30);
      break;
    case 'brzycki':
      // Brzycki: w * (36 / (37 - r))
      max = reps >= 37 ? weight * 2 : weight * (36 / (37 - reps));
      break;
    case 'lombardi':
      // Lombardi: w * r^0.10
      max = weight * Math.pow(reps, 0.1);
      break;
    case 'oconner':
      // O'Conner: w * (1 + 0.025 * r)
      max = weight * (1 + 0.025 * reps);
      break;
    case 'mayhew':
      // Mayhew et al.: (100 * w) / (52.2 + 41.9 * e^(-0.055 * r))
      max = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
      break;
    case 'wathan':
      // Wathan: (100 * w) / (48.8 + 53.8 * e^(-0.075 * r))
      max = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
      break;
    default:
      max = weight * (1 + reps / 30);
  }

  return Math.round(max * 10) / 10;
}

export function getAllFormulas1RM(weight: number, reps: number) {
  return {
    epley: calculate1RM(weight, reps, 'epley'),
    brzycki: calculate1RM(weight, reps, 'brzycki'),
    lombardi: calculate1RM(weight, reps, 'lombardi'),
    oconner: calculate1RM(weight, reps, 'oconner'),
    mayhew: calculate1RM(weight, reps, 'mayhew'),
    wathan: calculate1RM(weight, reps, 'wathan'),
  };
}

export interface PercentageRow {
  percentage: number;
  weight: number;
  expectedReps: number;
  purpose: string;
}

export function getRepPercentages(oneRepMax: number): PercentageRow[] {
  const table: { percentage: number; reps: number; purpose: string }[] = [
    { percentage: 100, reps: 1, purpose: 'Max Single / Competition PR' },
    { percentage: 95, reps: 2, purpose: 'Heavy Strength Test' },
    { percentage: 90, reps: 3, purpose: 'Peak Strength / Triples' },
    { percentage: 85, reps: 5, purpose: 'Core Strength Block (5x5)' },
    { percentage: 80, reps: 8, purpose: 'Strength & Myofibrillar Hypertrophy' },
    { percentage: 75, reps: 10, purpose: 'Hypertrophy Work (3-4 sets)' },
    { percentage: 70, reps: 12, purpose: 'Volume & Muscle Endurance' },
    { percentage: 65, reps: 15, purpose: 'Endurance & Form Tempo' },
    { percentage: 60, reps: 20, purpose: 'Explosive Speed & Technique' },
    { percentage: 50, reps: 25, purpose: 'Active Recovery & Warm-up' },
  ];

  return table.map((item) => ({
    percentage: item.percentage,
    weight: Math.round((oneRepMax * item.percentage) / 100 * 2) / 2, // round to nearest 0.5
    expectedReps: item.reps,
    purpose: item.purpose,
  }));
}

export interface WarmupSet {
  stage: string;
  percentage: number;
  weight: number;
  reps: number;
  restSec: number;
}

export function generateWarmupLadder(targetWeight: number, barWeight = 20): WarmupSet[] {
  if (targetWeight <= barWeight) {
    return [{ stage: 'Target Lift', percentage: 100, weight: targetWeight, reps: 5, restSec: 60 }];
  }

  const stages: WarmupSet[] = [
    { stage: 'Empty Bar Warmup', percentage: 0, weight: barWeight, reps: 10, restSec: 45 },
    { stage: 'Stage 1 (Light)', percentage: 40, weight: Math.max(barWeight, Math.round((targetWeight * 0.4) / 2.5) * 2.5), reps: 8, restSec: 60 },
    { stage: 'Stage 2 (Moderate)', percentage: 60, weight: Math.max(barWeight, Math.round((targetWeight * 0.6) / 2.5) * 2.5), reps: 5, restSec: 90 },
    { stage: 'Stage 3 (Building)', percentage: 75, weight: Math.max(barWeight, Math.round((targetWeight * 0.75) / 2.5) * 2.5), reps: 3, restSec: 120 },
    { stage: 'Stage 4 (Potentiation)', percentage: 88, weight: Math.max(barWeight, Math.round((targetWeight * 0.88) / 2.5) * 2.5), reps: 1, restSec: 150 },
    { stage: 'Working Set / PR', percentage: 100, weight: targetWeight, reps: 1, restSec: 180 },
  ];

  return stages;
}

export interface PlateBreakdown {
  plate: number;
  countEachSide: number;
}

export function calculateBarbellPlates(targetTotalWeight: number, barWeight = 20, unit: 'kg' | 'lbs' = 'kg'): PlateBreakdown[] {
  const availablePlates = unit === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
  
  const weightPerSide = Math.max(0, (targetTotalWeight - barWeight) / 2);
  let remainder = weightPerSide;
  const result: PlateBreakdown[] = [];

  for (const plate of availablePlates) {
    if (remainder >= plate) {
      const count = Math.floor(remainder / plate);
      result.push({ plate, countEachSide: count });
      remainder = Math.round((remainder - count * plate) * 100) / 100;
    }
  }

  return result;
}
