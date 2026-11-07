/**
 * Tool Executor and Undo Manager for AI Coach Routine Modifications
 */

export interface ParsedExercise {
  name: string;
  sets?: string;
  reps_or_duration?: string;
  weight?: string;
  setsReps?: string;
  targetMuscle?: string;
  notes?: string;
  muscles?: string[];
  flagged?: boolean;
}

export interface ParsedDay {
  dayTitle: string;
  focus?: string;
  exercises: ParsedExercise[];
}

export interface RoutineState {
  id?: string;
  summaryTitle?: string;
  parsedDays: ParsedDay[];
  analyzedAt?: string;
}

export interface ToolCall {
  tool: 'replace_split' | 'add_exercise' | 'delete_exercise' | 'move_exercise' | 'edit_exercise' | 'rename_day' | 'delete_day' | 'delete_all';
  args: any;
}

/**
 * Normalizes day name matching (handles "Day 1", "Day 1: Heavy Pressing", "day 1", "push", etc.)
 */
function findDayIndex(days: ParsedDay[], targetDay: string): number {
  if (!targetDay) return -1;
  const targetLower = targetDay.toLowerCase().trim();
  
  // Exact match
  let idx = days.findIndex(d => d.dayTitle.toLowerCase().trim() === targetLower);
  if (idx !== -1) return idx;

  // Day number match e.g. "Day 1" vs "Day 1: HEAVY PRESSING"
  const dayNumMatch = targetLower.match(/day\s*(\d+)/i);
  if (dayNumMatch) {
    const num = dayNumMatch[1];
    idx = days.findIndex(d => d.dayTitle.toLowerCase().includes(`day ${num}`) || d.dayTitle.toLowerCase().includes(`day${num}`));
    if (idx !== -1) return idx;
  }

  // Partial match
  idx = days.findIndex(d => d.dayTitle.toLowerCase().includes(targetLower) || targetLower.includes(d.dayTitle.toLowerCase()));
  return idx;
}

/**
 * Normalizes exercise name matching (fuzzy match ignoring case and punctuation)
 */
function findExerciseIndex(exercises: ParsedExercise[], targetName: string): number {
  if (!targetName) return -1;
  const cleanTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let idx = exercises.findIndex(ex => ex.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
  if (idx !== -1) return idx;

  idx = exercises.findIndex(ex => {
    const cleanEx = ex.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanEx.includes(cleanTarget) || cleanTarget.includes(cleanEx);
  });
  return idx;
}

export function executeToolCalls(
  currentRoutine: RoutineState | null,
  toolCalls: ToolCall[]
): { updatedRoutine: RoutineState; summarySentences: string[]; previousState: RoutineState | null } {
  const previousState: RoutineState | null = currentRoutine ? JSON.parse(JSON.stringify(currentRoutine)) : null;

  let days: ParsedDay[] = currentRoutine?.parsedDays
    ? JSON.parse(JSON.stringify(currentRoutine.parsedDays))
    : [];

  const summarySentences: string[] = [];

  for (const call of toolCalls) {
    const { tool, args } = call;

    switch (tool) {
      case 'replace_split': {
        if (Array.isArray(args?.days)) {
          days = args.days.map((d: any) => ({
            dayTitle: d.dayTitle || 'Workout Day',
            focus: d.focus || '',
            exercises: Array.isArray(d.exercises) ? d.exercises.map((e: any) => ({
              name: e.name || 'Exercise',
              sets: e.sets || e.setsReps?.split('x')?.[0] || '-',
              reps_or_duration: e.reps_or_duration || e.setsReps?.split('x')?.[1] || '-',
              weight: e.weight || '-',
              setsReps: e.setsReps || `${e.sets || '-'} x ${e.reps_or_duration || '-'} · ${e.weight || '-'}`,
              targetMuscle: e.targetMuscle || (e.muscles?.[0] || ''),
              notes: e.notes || '',
              muscles: Array.isArray(e.muscles) ? e.muscles : (e.targetMuscle ? [e.targetMuscle] : []),
              flagged: !!e.flagged,
            })) : []
          }));
          summarySentences.push(`Replaced split with ${days.length} workout days.`);
        }
        break;
      }

      case 'add_exercise': {
        const { day, exercise, position } = args || {};
        let dayIdx = findDayIndex(days, day);
        if (dayIdx === -1) {
          days.push({ dayTitle: day || 'New Day', exercises: [] });
          dayIdx = days.length - 1;
        }

        const newEx: ParsedExercise = {
          name: exercise?.name || exercise || 'New Exercise',
          sets: exercise?.sets || '-',
          reps_or_duration: exercise?.reps_or_duration || exercise?.reps || '-',
          weight: exercise?.weight || '-',
          setsReps: exercise?.setsReps || `${exercise?.sets || '-'} x ${exercise?.reps || '-'} · ${exercise?.weight || '-'}`,
          targetMuscle: exercise?.targetMuscle || (exercise?.muscles?.[0] || ''),
          notes: exercise?.notes || '',
          muscles: Array.isArray(exercise?.muscles) ? exercise.muscles : [],
          flagged: !!exercise?.flagged,
        };

        const targetDayObj = days[dayIdx];
        if (typeof position === 'number' && position >= 0 && position <= targetDayObj.exercises.length) {
          targetDayObj.exercises.splice(position, 0, newEx);
        } else {
          targetDayObj.exercises.push(newEx);
        }

        summarySentences.push(`Added ${newEx.name} to ${targetDayObj.dayTitle}. ${targetDayObj.dayTitle} now has ${targetDayObj.exercises.length} exercises.`);
        break;
      }

      case 'delete_exercise': {
        const { day, exercise } = args || {};
        const dayIdx = findDayIndex(days, day);
        if (dayIdx !== -1) {
          const targetDayObj = days[dayIdx];
          const exIdx = findExerciseIndex(targetDayObj.exercises, exercise);
          if (exIdx !== -1) {
            const removedName = targetDayObj.exercises[exIdx].name;
            targetDayObj.exercises.splice(exIdx, 1);
            summarySentences.push(`Removed ${removedName} from ${targetDayObj.dayTitle}. ${targetDayObj.dayTitle} now has ${targetDayObj.exercises.length} exercises.`);
          }
        }
        break;
      }

      case 'move_exercise': {
        const { exercise, from_day, to_day, position } = args || {};
        const fromIdx = findDayIndex(days, from_day);
        let toIdx = findDayIndex(days, to_day);

        if (fromIdx !== -1) {
          const fromDayObj = days[fromIdx];
          const exIdx = findExerciseIndex(fromDayObj.exercises, exercise);

          if (exIdx !== -1) {
            const [movedEx] = fromDayObj.exercises.splice(exIdx, 1);
            if (toIdx === -1) {
              days.push({ dayTitle: to_day || 'New Day', exercises: [] });
              toIdx = days.length - 1;
            }
            const toDayObj = days[toIdx];
            if (typeof position === 'number' && position >= 0 && position <= toDayObj.exercises.length) {
              toDayObj.exercises.splice(position, 0, movedEx);
            } else {
              toDayObj.exercises.push(movedEx);
            }
            summarySentences.push(`Moved ${movedEx.name} to ${toDayObj.dayTitle}.`);
          }
        }
        break;
      }

      case 'edit_exercise': {
        const { day, exercise, fields } = args || {};
        const dayIdx = findDayIndex(days, day);
        if (dayIdx !== -1) {
          const targetDayObj = days[dayIdx];
          const exIdx = findExerciseIndex(targetDayObj.exercises, exercise);
          if (exIdx !== -1) {
            const exObj = targetDayObj.exercises[exIdx];
            if (fields?.name) exObj.name = fields.name;
            if (fields?.sets) exObj.sets = fields.sets;
            if (fields?.reps_or_duration) exObj.reps_or_duration = fields.reps_or_duration;
            if (fields?.weight) exObj.weight = fields.weight;
            if (fields?.notes) exObj.notes = fields.notes;
            if (fields?.setsReps) exObj.setsReps = fields.setsReps;
            if (fields?.targetMuscle) exObj.targetMuscle = fields.targetMuscle;
            summarySentences.push(`Updated ${exObj.name} in ${targetDayObj.dayTitle}.`);
          }
        }
        break;
      }

      case 'rename_day': {
        const { day, new_name } = args || {};
        const dayIdx = findDayIndex(days, day);
        if (dayIdx !== -1 && new_name) {
          const oldName = days[dayIdx].dayTitle;
          days[dayIdx].dayTitle = new_name;
          summarySentences.push(`Renamed ${oldName} to ${new_name}.`);
        }
        break;
      }

      case 'delete_day': {
        const { day } = args || {};
        const dayIdx = findDayIndex(days, day);
        if (dayIdx !== -1) {
          const removedDayTitle = days[dayIdx].dayTitle;
          days.splice(dayIdx, 1);
          summarySentences.push(`Deleted ${removedDayTitle}. Split now has ${days.length} days.`);
        }
        break;
      }

      case 'delete_all': {
        days = [];
        summarySentences.push('Cleared all workout days from active split.');
        break;
      }
    }
  }

  const updatedRoutine: RoutineState = {
    ...(currentRoutine || {}),
    parsedDays: days,
    summaryTitle: days.length > 0 ? `${days.length}-Day Split` : 'Empty Split',
    analyzedAt: new Date().toISOString(),
  };

  return { updatedRoutine, summarySentences, previousState };
}
