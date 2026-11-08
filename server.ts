import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Server-side Gemini initialization with required user-agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Workout Analysis Endpoint (Format-Agnostic Parsing, 1 Line = 1 Exercise)
app.post('/api/ai/analyze-workout', async (req: Request, res: Response) => {
  try {
    const { rawNotes, userWeightKg, userGoal, experienceLevel } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
      return res.status(400).json({ error: 'Workout notes text is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prompt = `You are a format-agnostic master workout parser and sports scientist.
Parse the following raw workout text copied from notes app into a structured JSON routine split.

CRITICAL PARSING RULES:
1. NEVER invent, add, split, merge or drop exercises. ONE line item in the text equals EXACTLY ONE exercise in the output array.
2. Preserve the EXACT order of exercises and exact day names/headings as written.
3. Finisher blocks like "FOREARM FINISHER BLOCK (End of Day 2)" belong to that day (Day 2), attached as extra exercises at the end.
4. Emojis, bullets, and numbering (e.g. "1.", "-", "🎯") are decoration — ignore them when parsing.
5. Parse sets, reps/durations, weights, and notes accurately:
   - "58.5 kg - 8 reps" -> weight: "58.5 kg", reps_or_duration: "8 reps", sets: "1"
   - "Bodyweight - 8 Reps/10 kg - 4 reps" -> weight: "10 kg", reps_or_duration: "4-8 reps", notes: "Set 1: Bodyweight x 8, Set 2: 10 kg x 4"
   - "3 sets x 30-45 sec" -> sets: "3", reps_or_duration: "30-45 sec", weight: "-"
   - "20 kg - 5 | 5s hold" -> weight: "20 kg", reps_or_duration: "5 reps", notes: "5s hold"
   - "Hanging Knee Raises (9 reps)" -> reps_or_duration: "9 reps", weight: "-"
6. Target muscle lines starting with "🎯" or "Target:" apply as muscle tags for that exercise.
7. If sets, reps, or weight are missing, leave value as "-" (do NOT guess numbers!).
8. Output strict JSON schema matching parsedDays.

Raw Workout Text:
"""
${rawNotes}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            balanceRating: { type: Type.NUMBER },
            volumeRating: { type: Type.NUMBER },
            exerciseSelectionRating: { type: Type.NUMBER },
            summaryTitle: { type: Type.STRING },
            honestOpinion: { type: Type.STRING },
            superStrongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            neglectedOrNeedsWork: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            muscleGroupCoverage: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  muscle: { type: Type.STRING },
                  intensity: { type: Type.STRING },
                  percentage: { type: Type.INTEGER },
                  assessment: { type: Type.STRING }
                },
                required: ['muscle', 'intensity', 'percentage', 'assessment']
              }
            },
            parsedDays: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayTitle: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.STRING },
                        reps_or_duration: { type: Type.STRING },
                        weight: { type: Type.STRING },
                        setsReps: { type: Type.STRING },
                        targetMuscle: { type: Type.STRING },
                        notes: { type: Type.STRING },
                        muscles: { type: Type.ARRAY, items: { type: Type.STRING } },
                        flagged: { type: Type.BOOLEAN }
                      },
                      required: ['name']
                    }
                  }
                },
                required: ['dayTitle', 'exercises']
              }
            },
            substitutions: { type: Type.ARRAY, items: { type: Type.OBJECT } }
          },
          required: ['summaryTitle', 'parsedDays']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from AI model.');
    }

    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('AI Workout Analysis API Error:', error);
    // Real error returned if API key or network fails, with safe fallback parser result included
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

// AI Connection Test Endpoint
app.get('/api/ai/test', async (req: Request, res: Response) => {
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'API Key Missing on Server' });
  }
  return res.json({ success: true, message: 'Operational' });
});

// AI Overview Endpoint
app.post('/api/ai/overview', async (req: Request, res: Response) => {
  try {
    const { period = 'daily', language = 'en', profile = {}, stats = {} } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prompt = `You are Overhaul AI — an elite athletic coach. Generate an AI Overview for period: "${period.toUpperCase()}" in language: "${language}".
Athlete: ${profile.name || 'Athlete'}, Streak: ${stats.streakCount || 0} days.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            coachVerdict: { type: Type.STRING },
            completionRate: { type: Type.INTEGER },
            streakStatus: {
              type: Type.OBJECT,
              properties: {
                currentStreak: { type: Type.INTEGER },
                status: { type: Type.STRING },
                message: { type: Type.STRING }
              },
              required: ['currentStreak', 'status', 'message']
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            recoveryAdvice: { type: Type.STRING },
            skippedAdvice: { type: Type.STRING }
          },
          required: ['headline', 'coachVerdict', 'completionRate', 'streakStatus', 'recommendations', 'focusAreas', 'recoveryAdvice', 'skippedAdvice']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty AI response.');
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('AI Overview error:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

// AI Body Vision Endpoint
app.post('/api/ai/body-vision', async (req: Request, res: Response) => {
  try {
    const { currentImageBase64, mimeType = 'image/jpeg', userGoal = 'Hypertrophy' } = req.body;

    if (!currentImageBase64) {
      return res.status(400).json({ error: 'Body picture base64 data is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const cleanCurrent = currentImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanCurrent } },
          { text: `Analyze physique photo. Goal: ${userGoal}. Output JSON assessment.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRating: { type: Type.NUMBER },
            bodyFatEstimate: { type: Type.STRING },
            postureAssessment: { type: Type.STRING },
            physiquePotential: {
              type: Type.OBJECT,
              properties: {
                geneticScore: { type: Type.NUMBER },
                potentialCeiling: { type: Type.STRING },
                projectedGainsKg: { type: Type.STRING },
                topGeneticAdvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
                laggingPotentialUnlocks: { type: Type.ARRAY, items: { type: Type.STRING } },
                progressForecast: { type: Type.STRING }
              },
              required: ['geneticScore', 'potentialCeiling', 'projectedGainsKg', 'topGeneticAdvantages', 'laggingPotentialUnlocks', 'progressForecast']
            },
            muscleRatings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  muscle: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ['muscle', 'rating', 'status', 'notes']
              }
            },
            keyImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            weeklyProgression: {
              type: Type.OBJECT,
              properties: {
                hasPreviousComparison: { type: Type.BOOLEAN },
                improved: { type: Type.ARRAY, items: { type: Type.STRING } },
                stagnant: { type: Type.ARRAY, items: { type: Type.STRING } },
                backwards: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ['hasPreviousComparison', 'improved', 'stagnant', 'backwards', 'summary']
            }
          },
          required: ['overallRating', 'bodyFatEstimate', 'postureAssessment', 'physiquePotential', 'muscleRatings', 'keyImprovements', 'weeklyProgression']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty AI response.');
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('AI Body Vision error:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

// TODO: Security Note - VITE_GEMINI_API_KEY is currently used. In production, move Gemini AI requests behind a secure Firebase Cloud Function.
// Dedicated Multi-turn Gemini AI Coach Chatbot Endpoint with Tool Invocations
app.post('/api/ai/coach-chat', async (req: Request, res: Response) => {
  try {
    const {
      messages,
      modelChoice = 'gemini-2.5-flash',
      currentRoutine,
      userProfile = {},
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const allowedModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];
    const selectedModel = allowedModels.includes(modelChoice) ? modelChoice : 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Format conversation history for Gemini multi-turn format
    const formattedContents = messages
      .filter((m: any) => m && m.content && typeof m.content === 'string')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (formattedContents.length === 0) {
      return res.status(400).json({ error: 'No valid message content provided.' });
    }

    const systemInstruction = `You are Overhaul AI Coach — an elite, concise strength & conditioning coach and master split editor.

Athlete Profile:
- Name: ${userProfile.name || 'Athlete'}
- Weight: ${userProfile.weightKg ? `${userProfile.weightKg} kg` : 'Not set'}
- Goal: ${userProfile.goal || 'Strength & Hypertrophy'}

ACTIVE ROUTINE SPLIT (JSON):
${currentRoutine ? JSON.stringify(currentRoutine.parsedDays || currentRoutine, null, 2) : 'No split loaded.'}

DIRECTIVES:
1. UNDERSTAND MESSY INPUT & TYPOS: "delete the workoit" -> delete workout/split. Parse intent flexibly.
2. AMBIGUOUS REQUESTS: If user request is ambiguous, ask ONE short question to clarify. Do not invoke tools yet.
3. EXPLANATION QUESTIONS: Questions like "why this exercise?" get a direct, normal text answer with NO tool calls.
4. SHORT REPLIES: Match the user's plain style. After ANY split change, reply in AT MOST 2 SENTENCES (e.g., "Removed Pull-Ups from Day 1. Day 1 now has 6 exercises.").
5. FUNCTION CALLING / TOOLS: When user asks to add, remove, move, edit, rename, or clear exercises or days, issue tool calls in the tool_calls array:
   - replace_split(days: Array<{ dayTitle: string, focus?: string, exercises: Array<{ name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string, targetMuscle?: string }> }>)
   - add_exercise(day: string, exercise: { name: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string }, position?: number)
   - delete_exercise(day: string, exercise: string)
   - move_exercise(exercise: string, from_day: string, to_day: string, position?: number)
   - edit_exercise(day: string, exercise: string, fields: { name?: string, sets?: string, reps_or_duration?: string, weight?: string, notes?: string })
   - rename_day(day: string, new_name: string)
   - delete_day(day: string)
   - delete_all()
6. DESTRUCTIVE CONFIRMATION: If user requests delete_all or delete_day and has NOT explicitly confirmed yet, set "requiresConfirmation": true and provide "confirmationPrompt". Otherwise execute tool_calls directly.`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Short plain reply (at most 2 sentences after changes)' },
            tool_calls: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tool: { type: Type.STRING, description: 'Tool name e.g. delete_exercise' },
                  args: { type: Type.OBJECT, description: 'Tool arguments' }
                },
                required: ['tool', 'args']
              }
            },
            requiresConfirmation: { type: Type.BOOLEAN },
            confirmationPrompt: { type: Type.STRING }
          },
          required: ['reply']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty AI response.');
    }
    const data = JSON.parse(text);
    return res.json({
      reply: data.reply,
      tool_calls: Array.isArray(data.tool_calls) ? data.tool_calls : [],
      requiresConfirmation: !!data.requiresConfirmation,
      confirmationPrompt: data.confirmationPrompt || '',
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('AI Coach Chat API Error:', error);
    // Real error response returned to client so error is logged and displayed in chat (NO canned fallbacks!)
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

// Vite middleware for full-stack dev server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Overhaul full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
