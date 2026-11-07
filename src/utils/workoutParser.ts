/**
 * Format-Agnostic Precision Workout Parser for OVERHAUL
 * Implements strict list-item preservation, ranges preservation, segment-split detection,
 * non-comma parenthesis muscle isolation, and sanity checking.
 */

export interface ParsedExerciseItem {
  name: string;
  sets: string; // "0" if unknown
  reps_or_duration: string;
  weight: string;
  notes: string;
  muscles: string[];
  secondaryMuscles?: string[];
  flagged?: boolean;
}

export interface ParsedDayItem {
  dayTitle: string;
  focus: string;
  exercises: ParsedExerciseItem[];
}

export interface ParseResult {
  splitName: string;
  parsedDays: ParsedDayItem[];
  totalExercises: number;
  summaryTitle: string;
  sanityHint?: string;
}

/**
 * Cleanly formats an exercise row according to user specification:
 * - "2 × 8 / 4 · Bodyweight / 10 kg"
 * - "3 × 30–45 sec"
 * - "5 reps · 20 kg"
 * - "2 × 12–15"
 * Never shows leading "×" or "-". Hides unknown values.
 */
export function formatExerciseRow(ex: {
  sets?: string | number;
  reps_or_duration?: string;
  weight?: string;
  setsReps?: string;
  [key: string]: any;
}): string {
  const setsNum = typeof ex.sets === 'number' ? ex.sets : parseInt(String(ex.sets || ex.setsReps?.split(/x|×/i)?.[0]?.trim() || '0'), 10);
  const reps = String(ex.reps_or_duration || ex.setsReps?.split(/x|×/i)?.[1]?.trim() || '').trim();
  const weight = String(ex.weight || '').trim();

  const parts: string[] = [];

  // Sets & Reps
  if (setsNum > 0 && reps && reps !== '-') {
    parts.push(`${setsNum} × ${reps}`);
  } else if (reps && reps !== '-') {
    // If reps is just a single number like "5" or "8", format as "5 reps"
    if (/^\d+$/.test(reps)) {
      parts.push(`${reps} reps`);
    } else {
      parts.push(reps);
    }
  } else if (setsNum > 0) {
    parts.push(`${setsNum} sets`);
  }

  // Weight
  const cleanWeight = weight.replace(/^[·\-\s]+|[·\-\s]+$/g, '');
  if (cleanWeight && cleanWeight !== '-' && cleanWeight !== '0' && cleanWeight.toLowerCase() !== 'unknown') {
    if (parts.length > 0) {
      parts.push(`· ${cleanWeight}`);
    } else {
      parts.push(cleanWeight);
    }
  }

  let formatted = parts.join(' ');
  // Clean up any double spaces or leading × or -
  formatted = formatted.replace(/^[\s×·\-]+/, '').trim();
  return formatted || '-';
}

export const KNOWN_BODYWEIGHT_EXERCISES = [
  'pull-up', 'pull up', 'pullup',
  'chin-up', 'chin up', 'chinup',
  'push-up', 'push up', 'pushup',
  'dip', 'dips',
  'hanging leg raise', 'hanging leg raises',
  'hanging raise', 'hanging raises',
  'handstand', 'handstand hold', 'handstand push-up', 'handstand pushup',
  'plank', 'side plank',
  'l-sit', 'lsit',
  'muscle-up', 'muscle up', 'muscleup'
];

/**
 * Checks if an exercise is strictly bodyweight:
 * Only returns true if text explicitly includes 'bodyweight' or 'bw', or matches known bodyweight exercises.
 * Missing weight does NOT make an exercise bodyweight.
 */
export function isBodyweightMovement(name: string, textHint: string = ''): boolean {
  const combined = `${name || ''} ${textHint || ''}`.toLowerCase();
  if (/\b(?:bodyweight|bw|calisthenic|calisthenics)\b/i.test(combined)) {
    return true;
  }
  const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim();
  return KNOWN_BODYWEIGHT_EXERCISES.some((kw) => {
    const regex = new RegExp(`\\b${kw.replace('-', '[- ]?')}\\b`, 'i');
    return regex.test(cleanName);
  });
}

/**
 * Parses muscle annotations with proper parenthesis handling:
 * e.g. "Upper Chest (Front Delts, Triceps)" ->
 * primary: ["Upper Chest"], secondary: ["Front Delts", "Triceps"]
 * Everything inside parentheses on a target line goes to secondaryMuscles, never to notes.
 */
export function parseMusclesWithSecondary(lineText: string): {
  primary: string[];
  secondary: string[];
  extraNotes: string;
} {
  const cleanLine = lineText.replace(/^[🎯\s*•\-:]+/, '').trim();
  if (!cleanLine) {
    return { primary: [], secondary: [], extraNotes: '' };
  }

  const parenMatch = cleanLine.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  let primaryStr = cleanLine;
  let secondaryStr = '';
  const extraNotes = '';

  if (parenMatch) {
    primaryStr = parenMatch[1].trim();
    // Everything in parentheses on a 🎯 line goes to secondaryMuscles (e.g. "Wrist Flexors", "Muscle-Up Power")
    secondaryStr = parenMatch[2].trim();
  }

  // Primary: split by & or / or , (only on outer string)
  const primary = primaryStr
    .split(/[,/&]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Secondary: split by comma or &
  const secondary = secondaryStr
    ? secondaryStr
        .split(/[,/&]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return { primary, secondary, extraNotes };
}

/**
 * Splits a line that lists multiple exercises separated by commas or semicolons
 * (e.g. "Bench 4x5, Rows 4x6"), while protecting commas inside parentheses.
 */
export function splitMultiExerciseLine(line: string): string[] {
  if (!line || !line.trim()) return [];

  // Check for semicolons first
  if (line.includes(';')) {
    const semiParts = line.split(';').map((p) => p.trim()).filter(Boolean);
    if (semiParts.length > 1) {
      return semiParts;
    }
  }

  // If comma is present, split outside parentheses
  if (line.includes(',')) {
    const parts: string[] = [];
    let current = '';
    let parenDepth = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);

      if (char === ',' && parenDepth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());

    // Only treat as multiple exercises if at least two parts contain exercise patterns
    // (e.g. sets/reps indicators or distinct exercise names)
    const exerciseLikeCount = parts.filter(
      (p) => /[a-zA-Z]{2,}/.test(p) && (/\d+\s*[x×]\s*\d+|\d+\s*reps?|\d+\s*(?:kg|lbs)|sets?/i.test(p) || p.length > 4)
    ).length;

    if (parts.length > 1 && exerciseLikeCount >= 2) {
      return parts;
    }
  }

  return [line];
}

export function parseWorkoutTextFormatAgnostic(rawText: string, defaultUnit: string = 'kg'): ParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      splitName: 'Workout',
      parsedDays: [],
      totalExercises: 0,
      summaryTitle: 'Workout',
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedDays: ParsedDayItem[] = [];
  let currentDay: ParsedDayItem | null = null;
  let splitTitle = 'Workout';

  // Count list lines for sanity check: lines starting with number or bullet followed by letters
  const listLineRegex = /^(?:\d+[\.)]|\*|-|•)\s+[A-Za-z]/;
  const countedListLines = lines.filter((l) => listLineRegex.test(l) && !l.includes('🎯')).length;

  const dayHeaderRegex = /^(?:day\s*\d+|push|pull|legs|upper|lower|full\s*body|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:\-–]*(.*)$/i;
  const finisherBlockRegex = /^(?:.*finisher.*|.*block.*|.*end of day \d+.*|.*superset.*)$/i;
  const targetMuscleRegex = /^(?:🎯|target|muscles?|focus)[\s:]*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for target muscle line
    const muscleMatch = line.match(targetMuscleRegex);
    if (muscleMatch && currentDay && currentDay.exercises.length > 0) {
      const lastEx = currentDay.exercises[currentDay.exercises.length - 1];
      const { primary, secondary, extraNotes } = parseMusclesWithSecondary(line);

      lastEx.muscles = Array.from(new Set([...(lastEx.muscles || []), ...primary]));
      if (secondary.length > 0) {
        lastEx.secondaryMuscles = Array.from(new Set([...(lastEx.secondaryMuscles || []), ...secondary]));
      }
      if (extraNotes && !lastEx.notes.includes(extraNotes)) {
        lastEx.notes = lastEx.notes ? `${lastEx.notes} · ${extraNotes}` : extraNotes;
      }
      continue;
    }

    // Check if line is a Day Header
    const isDayHeader = dayHeaderRegex.test(line) && !line.includes('x') && !/\d+\s*reps?/i.test(line);
    const isFinisherBlock = finisherBlockRegex.test(line) && !/\d+\s*[x×]\s*\d+/i.test(line) && !/\d+\s*kg/i.test(line);

    if (isDayHeader) {
      const cleanTitle = line.replace(/^[#\-*•\d.)]+\s*/, '').trim();
      currentDay = {
        dayTitle: cleanTitle,
        focus: '',
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
          focus: '',
          exercises: [],
        };
        parsedDays.push(currentDay);
      }
      continue;
    }

    if (!currentDay) {
      currentDay = {
        dayTitle: 'Day 1: Workout Split',
        focus: '',
        exercises: [],
      };
      parsedDays.push(currentDay);
    }

    // Clean line of leading numbering or bullets: e.g. "1.", "-", "•"
    const cleanLine = line.replace(/^[#\-*•\d.)\s🏋️‍♂️💪]+/, '').trim();
    if (!cleanLine) continue;

    // Handle lines that list multiple exercises separated by commas or semicolons ("Bench 4x5, Rows 4x6")
    const subExercises = splitMultiExerciseLine(cleanLine);
    for (const subEx of subExercises) {
      const parsedEx = parseSingleExerciseLine(subEx.trim(), defaultUnit);
      currentDay.exercises.push(parsedEx);
    }
  }

  const totalExercises = parsedDays.reduce((sum, d) => sum + d.exercises.length, 0);

  let sanityHint: string | undefined;
  if (countedListLines > 0 && countedListLines !== totalExercises) {
    sanityHint = `Found ${countedListLines} list lines, parsed ${totalExercises}. Check this.`;
  }

  return {
    splitName: splitTitle,
    parsedDays,
    totalExercises,
    summaryTitle: 'Workout',
    sanityHint,
  };
}

export function parseSingleExerciseLine(line: string, defaultUnit: string = 'kg'): ParsedExerciseItem {
  let name = line;
  let sets = '0';
  let reps_or_duration = '';
  let weight = '';
  let notes = '';
  let muscles: string[] = [];
  let secondaryMuscles: string[] = [];
  let flagged = false;

  // Extract parentheses content for details: e.g. "Incline Barbell Press (58.5 kg - 8 reps)"
  const parenMatch = line.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  let detailsText = '';

  if (parenMatch) {
    name = parenMatch[1].trim();
    detailsText = parenMatch[2].trim();
  } else {
    // Check for inline separator like ":" or "-" e.g. "Incline Barbell Press - 58.5 kg"
    const dashParts = line.split(/\s*[-–:]\s*/);
    if (dashParts.length > 1 && /\d+/i.test(dashParts[dashParts.length - 1])) {
      name = dashParts[0].trim();
      detailsText = dashParts.slice(1).join(' - ').trim();
    }
  }

  name = name.replace(/^[-*•:\s]+|[-*•:\s]+$/g, '');

  if (detailsText) {
    // Check for pipe notes: "20 kg - 5 | 5s hold"
    if (detailsText.includes('|')) {
      const pipeParts = detailsText.split('|');
      detailsText = pipeParts[0].trim();
      notes = pipeParts.slice(1).join(' ').trim();
    }

    // Check for slash-delimited segments with different values per set:
    // e.g. "Bodyweight - 8 Reps/10 kg - 4 reps"
    if (detailsText.includes('/')) {
      const segments = detailsText.split('/');
      const segWeights: string[] = [];
      const segReps: string[] = [];

      for (const seg of segments) {
        const segTrim = seg.trim();
        // Check for weight in segment
        const wMatch = segTrim.match(/(\d+(?:\.\d+)?\s*(?:kg|lbs)|bodyweight|bw)/i);
        if (wMatch) {
          segWeights.push(/bodyweight|bw/i.test(wMatch[1]) ? 'Bodyweight' : wMatch[1].trim());
        }
        // Check for reps in segment
        const rMatch = segTrim.match(/(\d+(?:[–-]\d+)?)\s*reps?/i);
        if (rMatch) {
          segReps.push(rMatch[1]);
        }
      }

      if (segments.length > 1 && (segWeights.length > 1 || segReps.length > 1)) {
        sets = String(segments.length);
        if (segReps.length > 0) reps_or_duration = segReps.join(' / ');
        if (segWeights.length > 0) weight = segWeights.join(' / ');
        return {
          name,
          sets,
          reps_or_duration,
          weight,
          notes,
          muscles,
          secondaryMuscles,
          flagged,
        };
      }
    }

    // Check for sets range: "2–3 x 12–15 reps" -> sets = 2, notes = "2–3 sets"
    const setsRangeMatch = detailsText.match(/^(\d+)[–-](\d+)\s*(?:sets?|\s*[x×])/i);
    if (setsRangeMatch) {
      sets = setsRangeMatch[1]; // Lower number
      const setRangeNote = `${setsRangeMatch[1]}–${setsRangeMatch[2]} sets`;
      notes = notes ? `${notes} · ${setRangeNote}` : setRangeNote;
    } else {
      // Single sets count: "3 sets x 30–45 sec" or "3x"
      const singleSetsMatch = detailsText.match(/(\d+)\s*(?:sets?|\s*[x×])/i);
      if (singleSetsMatch) {
        sets = singleSetsMatch[1];
      }
    }

    // Check for duration ranges or reps ranges (Never cut ranges: e.g. "30–45 sec", "12–15")
    const durationRangeMatch = detailsText.match(/(\d+[–-]\d+\s*(?:sec|secs|seconds|min|mins))/i);
    const durationSingleMatch = detailsText.match(/(\d+\s*(?:sec|secs|seconds|min|mins))/i);
    const repsRangeMatch = detailsText.match(/(\d+[–-]\d+)\s*(?:reps?)?/i);

    if (durationRangeMatch) {
      reps_or_duration = durationRangeMatch[1].replace('-', '–');
    } else if (durationSingleMatch) {
      reps_or_duration = durationSingleMatch[1];
    } else if (repsRangeMatch && !setsRangeMatch) {
      reps_or_duration = repsRangeMatch[1].replace('-', '–');
    } else {
      // Check after "x": "3 sets x 30–45 sec" or "2–3 x 12–15 reps"
      const afterXMatch = detailsText.match(/[x×]\s*([0-9–\-\s]+(?:sec|secs|seconds|min|mins|reps?)?)/i);
      if (afterXMatch) {
        const val = afterXMatch[1].replace(/reps?/i, '').trim();
        reps_or_duration = val;
      } else {
        const singleReps = detailsText.match(/(\d+)\s*reps?/i);
        if (singleReps) {
          reps_or_duration = singleReps[1];
        } else {
          // Check for trailing standalone number like "20 kg - 5"
          const trailingNum = detailsText.match(/[-–:]\s*(\d+)\s*$/);
          if (trailingNum) {
            reps_or_duration = trailingNum[1];
          }
        }
      }
    }

    // Weight extraction: "58.5 kg", "20 kg", "Bodyweight"
    const weightMatch = detailsText.match(/(\d+(?:\.\d+)?\s*(?:kg|lbs)|bodyweight|bw)/i);
    if (weightMatch) {
      weight = /bodyweight|bw/i.test(weightMatch[1]) ? 'Bodyweight' : weightMatch[1].trim();
    }

    // Any hold or tempo in notes
    const holdMatch = detailsText.match(/(?:\||\b)(.*(?:hold|tempo|pause|eccentric|isometric|behind the back).*)/i);
    if (holdMatch && !notes.includes(holdMatch[1].trim())) {
      const extra = holdMatch[1].replace(/^[|\s–-]+/, '').trim();
      notes = notes ? `${notes} · ${extra}` : extra;
    }
  }

  return {
    name,
    sets,
    reps_or_duration,
    weight,
    notes,
    muscles,
    secondaryMuscles,
    flagged,
  };
}
