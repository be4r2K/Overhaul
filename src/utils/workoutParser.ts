/**
 * Format-Agnostic Deterministic Workout Parser
 * Follows strict 1-line-item = 1-exercise rule, preserving exact order,
 * day headings, finisher blocks attached to preceding day, and uninvented numbers.
 */

export interface ParsedExerciseItem {
  name: string;
  sets: string;
  reps_or_duration: string;
  weight: string;
  notes: string;
  muscles: string[];
  flagged?: boolean;
}

export interface ParsedDayItem {
  dayTitle: string;
  focus: string;
  exercises: ParsedExerciseItem[];
}

export interface ParseResult {
  parsedDays: ParsedDayItem[];
  totalExercises: number;
  summaryTitle: string;
}

export function parseWorkoutTextFormatAgnostic(rawText: string, defaultUnit: string = 'kg'): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { parsedDays: [], totalExercises: 0, summaryTitle: 'Empty Routine' };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const parsedDays: ParsedDayItem[] = [];
  let currentDay: ParsedDayItem | null = null;

  // Regex patterns
  const dayHeaderRegex = /^(?:day\s*\d+|push|pull|legs|upper|lower|full\s*body|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:\-–]*(.*)$/i;
  const finisherBlockRegex = /^(?:.*finisher.*|.*block.*|.*end of day \d+.*|.*superset.*)$/i;
  const targetMuscleRegex = /^(?:🎯|target|muscles?|focus)[\s:]*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if line is a target muscle line for previous exercise
    const muscleMatch = line.match(targetMuscleRegex);
    if (muscleMatch && currentDay && currentDay.exercises.length > 0) {
      const lastEx = currentDay.exercises[currentDay.exercises.length - 1];
      const tags = muscleMatch[1].split(/[,/&]/).map(s => s.trim()).filter(Boolean);
      lastEx.muscles = Array.from(new Set([...lastEx.muscles, ...tags]));
      continue;
    }

    // Check if line is a Day Header (or Finisher block that belongs to current day)
    const isDayHeader = dayHeaderRegex.test(line) && !line.includes('x') && !/\d+\s*reps?/i.test(line);
    const isFinisherBlock = finisherBlockRegex.test(line) && !/\d+\s*[x×]\s*\d+/i.test(line) && !/\d+\s*kg/i.test(line);

    if (isDayHeader) {
      // Strip leading bullet/numbering
      const cleanTitle = line.replace(/^[#\-*•\d.)]+\s*/, '').trim();
      currentDay = {
        dayTitle: cleanTitle,
        focus: 'Strength & Hypertrophy',
        exercises: [],
      };
      parsedDays.push(currentDay);
      continue;
    }

    if (isFinisherBlock) {
      // Finisher blocks belong to current day as extra exercises at the end
      if (!currentDay) {
        currentDay = {
          dayTitle: 'Day 1: Workout Split',
          focus: 'Strength & Hypertrophy',
          exercises: [],
        };
        parsedDays.push(currentDay);
      }
      // Note: do not create a new day, just continue parsing items into current day!
      continue;
    }

    // If we reach here without a currentDay, create Day 1
    if (!currentDay) {
      currentDay = {
        dayTitle: 'Day 1: Workout Split',
        focus: 'Strength & Hypertrophy',
        exercises: [],
      };
      parsedDays.push(currentDay);
    }

    // Clean line of leading numbers/bullets/emojis: e.g. "1.", "-", "•", "🎯"
    let cleanLine = line.replace(/^[#\-*•\d.)\s🎯🏋️‍♂️💪]+/, '').trim();
    if (!cleanLine) continue;

    // Parse single exercise item from line
    const parsedEx = parseSingleExerciseLine(cleanLine, defaultUnit);
    currentDay.exercises.push(parsedEx);
  }

  // Count total exercises
  const totalExercises = parsedDays.reduce((sum, d) => sum + d.exercises.length, 0);

  return {
    parsedDays,
    totalExercises,
    summaryTitle: `${parsedDays.length}-Day Split (${totalExercises} exercises)`,
  };
}

function parseSingleExerciseLine(line: string, defaultUnit: string): ParsedExerciseItem {
  let name = line;
  let sets = '-';
  let reps_or_duration = '-';
  let weight = '-';
  let notes = '';
  let muscles: string[] = [];
  let flagged = false;

  // Extract parentheses content for reps/weights/notes e.g. "Incline Barbell Press (58.5 kg - 8 reps)"
  const parenMatch = line.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  let detailsText = '';

  if (parenMatch) {
    name = parenMatch[1].trim();
    detailsText = parenMatch[2].trim();
  } else {
    // Check for inline separator like ":" or "-" e.g. "Incline Barbell Press - 3x8"
    const dashParts = line.split(/\s*[-–:]\s*/);
    if (dashParts.length > 1 && (/\d+/i.test(dashParts[dashParts.length - 1]))) {
      name = dashParts[0].trim();
      detailsText = dashParts.slice(1).join(' - ').trim();
    }
  }

  // Clean name of leftover punctuation
  name = name.replace(/^[-*•:\s]+|[-*•:\s]+$/g, '');

  if (detailsText) {
    // Check for sets e.g. "3 sets", "3x", "2-3 x"
    const setsMatch = detailsText.match(/(\d+(?:-\d+)?)\s*(?:sets?|\s*[x×])/i);
    if (setsMatch) {
      sets = setsMatch[1].trim();
    }

    // Check for reps or duration e.g. "8 reps", "30-45 sec", "12-15 reps", "8 Reps/10 kg"
    const repsMatch = detailsText.match(/(\d+(?:-\d+)?\s*(?:reps?|sec|secs|seconds|min|mins)?)\b/i);

    // Check for weight e.g. "58.5 kg", "10 kg", "Bodyweight", "20 kg - 5 | 5s hold"
    const weightMatch = detailsText.match(/(\d+(?:\.\d+)?\s*(?:kg|lbs)|bodyweight|bw)/i);
    if (weightMatch) {
      weight = weightMatch[1].trim();
      if (/bodyweight|bw/i.test(weight)) {
        weight = 'Bodyweight';
      }
    }

    // Check for hold/tempo notes e.g. "5s hold", "tempo 3010", "iso-hold"
    const notesMatch = detailsText.match(/(?:\||\b)(.*(?:hold|tempo|pause|eccentric|iso|behind the back|deficit|handstand).*)/i);
    if (notesMatch) {
      notes = notesMatch[1].replace(/^[|–\s]+/, '').trim();
    }

    // Fill reps_or_duration
    const explicitReps = detailsText.match(/(\d+(?:-\d+)?\s*(?:reps?|sec|secs|seconds|min|mins))/i);
    if (explicitReps) {
      reps_or_duration = explicitReps[1].trim();
    } else {
      const srPattern = detailsText.match(/\d+\s*[x×]\s*(\d+(?:-\d+)?(?:\s*sec)?)/i);
      if (srPattern) {
        reps_or_duration = srPattern[1].trim();
      } else {
        const standaloneNum = detailsText.match(/(\d+(?:-\d+)?)\s*reps?/i);
        if (standaloneNum) reps_or_duration = standaloneNum[1].trim();
      }
    }
  }

  // If name contains words like "Hold", "Press", "Flyes", but no details parsed, keep line cleanly as exercise name
  if (!name || name.length < 2) {
    name = line;
    flagged = true;
  }

  return {
    name,
    sets,
    reps_or_duration,
    weight,
    notes,
    muscles,
    flagged,
  };
}
