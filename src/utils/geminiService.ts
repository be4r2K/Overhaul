/**
 * Direct Client-Side Gemini AI Service for OVERHAUL
 * Uses @google/generative-ai SDK directly from the client without any backend /api routes.
 *
 * TODO: Security Recommendation - Move client Gemini AI calls behind a secure Firebase Cloud Function before release.
 * TODO: Restrict the API key to the Generative Language API in Google Cloud Console.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { UserProfile } from '../types/fitness';
import { ToolCall } from './routineTools';

export function getGeminiApiKey(): string {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
  return (
    metaEnv.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY) : '') ||
    ''
  );
}

export interface CoachResponse {
  reply: string;
  tool_calls: ToolCall[];
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  modelUsed?: string;
}

/**
 * Send coach message directly to Gemini API
 */
export async function sendCoachMessage(
  messages: Array<{ role: string; content: string }>,
  currentRoutine: AIWorkoutAnalysisResult | null,
  userProfile?: UserProfile,
  modelChoice: string = 'gemini-2.5-flash',
  liftRecords: any[] = []
): Promise<CoachResponse> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Coach is unreachable. Check your connection.');
  }

  const validModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  const modelToUse = validModels.includes(modelChoice) ? modelChoice : 'gemini-2.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);

  // Take the last 10 chat turns
  const recentTurns = messages.slice(-10);

  const formattedHistory = recentTurns.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content || '' }],
  }));

  const systemInstruction = `You are Overhaul AI Coach — an elite, direct, and concise strength & conditioning coach and master workout split editor.

Athlete Profile:
- Name: ${userProfile?.name || 'Athlete'}
- Weight: ${userProfile?.weightKg ? `${userProfile?.weightKg} kg` : 'Not set'}
- Goal: ${userProfile?.goal || 'Strength & Hypertrophy'}

ACTIVE ROUTINE SPLIT (JSON):
${currentRoutine ? JSON.stringify(currentRoutine.parsedDays || currentRoutine, null, 2) : 'No split loaded.'}

RECENT LOGGED EXERCISES / PRs:
${liftRecords && liftRecords.length > 0 ? JSON.stringify(liftRecords.slice(-5), null, 2) : 'None'}

DIRECTIVES:
1. UNDERSTAND MESSY INPUT & TYPOS: "delete the workoit" -> delete workout/split. "delete exercise Pull-Ups from Day 1" -> delete_exercise with day "Day 1", exercise "Pull-Ups".
2. EXPLANATION QUESTIONS: Questions like "hello", "hi", "why this exercise?", "why hammer curls?" get a normal, direct answer in at most 2 sentences with NO tool calls.
3. FUNCTION CALLING / TOOLS: When user asks to add, remove, move, edit, rename, or clear exercises or days, issue tool calls in the tool_calls array:
   - replace_split(days: Array<{ dayTitle: string, exercises: Array<{ name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string, muscles?: string[], secondaryMuscles?: string[] }> }>)
   - add_exercise(day: string, exercise: { name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string }, position?: number)
   - delete_exercise(day: string, exercise: string)
   - move_exercise(exercise: string, from_day: string, to_day: string, position?: number)
   - edit_exercise(day: string, exercise: string, fields: { name?: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string })
   - rename_day(day: string, new_name: string)
   - delete_day(day: string)
   - delete_all()
4. ONE-LINE CONFIRMATION: When performing an action, provide a concise one-line confirmation in "reply", e.g. "Removed Pull-Ups from Day 1 (6 exercises left)."
5. DESTRUCTIVE ACTIONS: Before delete_all or delete_day, ask for confirmation if not confirmed yet by setting requiresConfirmation: true and confirmationPrompt.
6. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching this schema:
{
  "reply": string,
  "tool_calls": [ { "tool": string, "args": object } ],
  "requiresConfirmation": boolean,
  "confirmationPrompt": string
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: modelToUse,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    // Gemini expects contents with valid roles
    const contents = formattedHistory.map((h) => ({
      role: h.role,
      parts: h.parts,
    }));

    const result = await model.generateContent({ contents });
    const text = result.response.text();

    if (!text) {
      throw new Error('Coach is unreachable. Check your connection.');
    }

    try {
      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply || 'Got it.',
        tool_calls: Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [],
        requiresConfirmation: !!parsed.requiresConfirmation,
        confirmationPrompt: parsed.confirmationPrompt || '',
        modelUsed: modelToUse,
      };
    } catch {
      throw new Error('Coach is unreachable. Check your connection.');
    }
  } catch (err: any) {
    console.error('Gemini Coach error:', err);
    throw new Error('Coach is unreachable. Check your connection.');
  }
}

/**
 * AI Workout Parsing with Gemini Structured JSON Output
 */
export async function parseRoutineWithAI(
  rawText: string,
  userGoal: string = 'Hypertrophy',
  userWeightKg: number = 75
): Promise<any> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `You are a precision sports science parser. Parse the following pasted workout routine notes into structured JSON.

CRITICAL RULES:
1. One list item = one exercise. Ignore emoji, bullets and numbering.
2. Never cut ranges. "30–45 sec" stays "30–45 sec". "12–15 reps" stays "12–15". For a sets range like "2–3": sets = "2" (the lower number) and notes = "2–3 sets".
3. Different values per set: sets = number of segments, reps = "8 / 4", weight = "Bodyweight / 10 kg".
4. "20 kg - 5 | 5s hold": reps = "5", weight = "20 kg", notes = "5s hold".
5. Never invent numbers. Unknown sets = 0 (hidden in the UI).
6. Muscles: a 🎯 line looks like "Primary (Secondary, Secondary)". Never split on commas inside parentheses.
   "Upper Chest (Front Delts, Triceps)" gives muscles ["Upper Chest"], secondaryMuscles ["Front Delts","Triceps"].
   "Lats & Upper Back (Biceps, Core)" gives muscles ["Lats","Upper Back"], secondaryMuscles ["Biceps","Core"].
   Parentheses that are not muscles (like "Muscle-Up Power") go into notes.
7. Keep day names exactly as written. Split name = "Workout" unless the text gives a title.
8. Finisher blocks like "FOREARM FINISHER BLOCK (End of Day 2)" belong to that day (Day 2), attached as extra exercises at the end.

Raw Notes:
"""
${rawText}
"""`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  const attemptCall = async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  };

  try {
    return await attemptCall();
  } catch (firstErr) {
    console.warn('First parse attempt failed, retrying once...', firstErr);
    // Retry once as specified
    return await attemptCall();
  }
}
