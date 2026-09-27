import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

// AI Workout Analysis Endpoint
app.post('/api/ai/analyze-workout', async (req: Request, res: Response) => {
  try {
    const { rawNotes, userWeightKg, userGoal, experienceLevel } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
      return res.status(400).json({ error: 'Workout notes text is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prompt = `You are an elite sports scientist, biomechanist, and powerlifting/bodybuilding coach.
Analyze the following raw workout notes copied from a user's notes app.

User Context:
- Bodyweight: ${userWeightKg ? `${userWeightKg} kg` : 'Not specified'}
- Goal: ${userGoal || 'Strength & Hypertrophy'}
- Experience: ${experienceLevel || 'Intermediate'}

Raw Workout Notes:
"""
${rawNotes}
"""

Task:
1. Parse all distinct workout days (e.g. Day 1: Push / Chest & Triceps, Day 2: Pull / Back & Biceps, Day 3: Legs, etc.).
2. For each day, extract the exercises, planned/logged sets, reps, weight (if any), and targeted primary & secondary muscle groups.
3. Determine full biomechanical breakdown:
   - Specific muscle hit percentages (Chest, Upper Back, Lats, Quads, Hamstrings, Glutes, Front Delts, Side Delts, Rear Delts, Biceps, Triceps, Core, Calves).
   - What is super strong in this routine/profile (strengths).
   - What is weak or underworked / neglected muscles (e.g. rear delts, hamstrings, rotator cuffs, upper chest, neck/forearms).
   - Rating for overall workout split balance (1 to 10 score).
   - Rating for volume/recovery balance (1 to 10 score).
   - Rating for exercise selection & hypertrophy stimulus (1 to 10 score).
   - Overall composite program grade / score (1 to 100).
4. Honest, unfiltered coaching opinion (constructive, direct, actionable, scientifically sound).
5. Specific improvements to implement right away (e.g. add lateral raises, adjust rep ranges, order compound lifts first).
6. Smart exercise substitutions / alternatives: For exercises that are hard, cause joint pain, or if gym equipment is missing, provide direct drop-in replacement suggestions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: 'Composite program rating 1-100' },
            balanceRating: { type: Type.NUMBER, description: 'Balance rating 1.0-10.0' },
            volumeRating: { type: Type.NUMBER, description: 'Volume/stimulus rating 1.0-10.0' },
            exerciseSelectionRating: { type: Type.NUMBER, description: 'Exercise selection rating 1.0-10.0' },
            summaryTitle: { type: Type.STRING, description: 'Short punchy summary title of the routine' },
            honestOpinion: { type: Type.STRING, description: 'Honest expert coaching review and verdict' },
            superStrongAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key strengths and well-developed muscle groups/patterns in this routine'
            },
            neglectedOrNeedsWork: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Muscles or movement planes that are neglected or need serious work'
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Prioritized actionable improvements for the user'
            },
            muscleGroupCoverage: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  muscle: { type: Type.STRING },
                  intensity: { type: Type.STRING, description: 'High, Moderate, Low, or Neglected' },
                  percentage: { type: Type.INTEGER, description: '0 to 100 hit score' },
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
                  dayTitle: { type: Type.STRING, description: 'e.g., Day 1: Upper Body Power' },
                  focus: { type: Type.STRING, description: 'Primary focus of the session' },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        setsReps: { type: Type.STRING },
                        targetMuscle: { type: Type.STRING },
                        rating: { type: Type.INTEGER, description: 'Tier rating 1-10' },
                        substitution: { type: Type.STRING, description: 'Alternative exercise if user cannot do this one' }
                      },
                      required: ['name', 'targetMuscle', 'substitution']
                    }
                  }
                },
                required: ['dayTitle', 'focus', 'exercises']
              }
            },
            substitutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalExercise: { type: Type.STRING },
                  reasonToSwap: { type: Type.STRING },
                  replacement1: { type: Type.STRING },
                  replacement2: { type: Type.STRING },
                  equipmentNeeded: { type: Type.STRING }
                },
                required: ['originalExercise', 'replacement1', 'replacement2']
              }
            }
          },
          required: [
            'overallScore',
            'balanceRating',
            'volumeRating',
            'exerciseSelectionRating',
            'summaryTitle',
            'honestOpinion',
            'superStrongAreas',
            'neglectedOrNeedsWork',
            'improvements',
            'muscleGroupCoverage',
            'parsedDays',
            'substitutions'
          ]
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
    console.error('AI workout analysis error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze workout with AI.',
    });
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
