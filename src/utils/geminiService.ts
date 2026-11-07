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

export class CoachError extends Error {
  details: string;
  constructor(message: string, details: string) {
    super(message);
    this.name = 'CoachError';
    this.details = details;
  }
}

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
 * Normalizes user-facing model selection to valid Google AI Studio model IDs
 */
export function resolveGeminiModelId(modelChoice: string = 'gemini-2.5-flash'): string {
  const lower = (modelChoice || '').toLowerCase();
  if (lower.includes('lite')) {
    return 'gemini-2.5-flash-lite';
  }
  if (lower.includes('pro')) {
    return 'gemini-2.5-pro';
  }
  return 'gemini-2.5-flash';
}

/**
 * Test AI Connection diagnostic for Settings
 * Verifies API key presence (never exposes key) and executes a one-word ping call.
 */
export async function testAIConnection(modelChoice: string = 'gemini-2.5-flash'): Promise<{
  keyPresent: boolean;
  modelUsed: string;
  success: boolean;
  message: string;
  details?: string;
}> {
  const apiKey = getGeminiApiKey();
  const keyPresent = !!apiKey && apiKey.trim().length > 0;
  const modelToUse = resolveGeminiModelId(modelChoice);

  if (!keyPresent) {
    return {
      keyPresent: false,
      modelUsed: modelToUse,
      success: false,
      message: 'API Key Missing in Client Build',
      details: 'VITE_GEMINI_API_KEY is empty. Ensure VITE_GEMINI_API_KEY is configured in GitHub Actions secrets or your .env file.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const result = await model.generateContent('Reply with the single word "Operational"');
    const text = (result?.response?.text?.() || '').trim();
    return {
      keyPresent: true,
      modelUsed: modelToUse,
      success: true,
      message: `200 OK — "${text || 'Operational'}"`,
    };
  } catch (err: any) {
    console.error('Test AI Connection failed:', err);
    const status = err?.status || (err?.response?.status) || '';
    const errMsg = err?.message || String(err);
    return {
      keyPresent: true,
      modelUsed: modelToUse,
      success: false,
      message: status ? `HTTP ${status}: Failed` : 'Connection Failed',
      details: errMsg,
    };
  }
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
  const modelToUse = resolveGeminiModelId(modelChoice);

  if (!apiKey) {
    const detailMsg = 'VITE_GEMINI_API_KEY is not defined in this build. In GitHub Actions, verify VITE_GEMINI_API_KEY secret is passed to bun run build.';
    console.error('sendCoachMessage error:', detailMsg);
    throw new CoachError('Coach is unreachable. Check your connection.', detailMsg);
  }

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
1. GREETINGS & CASUAL QUESTIONS: "hello", "hi", "hey coach", "how are you" MUST receive a direct, friendly coaching reply in 1-2 sentences with empty tool_calls []. NEVER alter or modify the split for greetings!
2. UNDERSTAND MESSY INPUT & TYPOS: "delete the workoit" -> delete workout/split. "delete exercise Pull-Ups from Day 1" -> delete_exercise with day "Day 1", exercise "Pull-Ups".
3. EXPLANATION QUESTIONS: Questions like "why this exercise?", "why hammer curls?" get a normal, direct answer in at most 2 sentences with NO tool calls.
4. FUNCTION CALLING / TOOLS: When user asks to add, remove, move, edit, rename, or clear exercises or days, issue tool calls in the tool_calls array:
   - replace_split(days: Array<{ dayTitle: string, exercises: Array<{ name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string, muscles?: string[], secondaryMuscles?: string[] }> }>)
   - add_exercise(day: string, exercise: { name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string }, position?: number)
   - delete_exercise(day: string, exercise: string)
   - move_exercise(exercise: string, from_day: string, to_day: string, position?: number)
   - edit_exercise(day: string, exercise: string, fields: { name?: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string })
   - rename_day(day: string, new_name: string)
   - delete_day(day: string)
   - delete_all()
5. ONE-LINE CONFIRMATION: When performing an action, provide a concise one-line confirmation in "reply", e.g. "Removed Pull-Ups from Day 1 (6 exercises left)."
6. DESTRUCTIVE ACTIONS: Before delete_all or delete_day, ask for confirmation if not confirmed yet by setting requiresConfirmation: true and confirmationPrompt.
7. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching this schema:
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
      throw new Error('Empty response received from Gemini API');
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
    } catch (parseErr: any) {
      console.error('JSON parse error from Gemini text:', text, parseErr);
      return {
        reply: text,
        tool_calls: [],
        modelUsed: modelToUse,
      };
    }
  } catch (err: any) {
    console.error('Gemini Coach error:', err);
    const statusPart = err?.status ? `HTTP ${err.status}` : '';
    const msgPart = err?.message || String(err);
    const details = [statusPart, msgPart].filter(Boolean).join(' - ');
    throw new CoachError('Coach is unreachable. Check your connection.', details);
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
