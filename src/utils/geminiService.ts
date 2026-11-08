import { AIWorkoutAnalysisResult, AIOverviewData, AIBodyVisionData } from '../types/aiWorkout';
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

export interface CoachResponse {
  reply: string;
  tool_calls: ToolCall[];
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  modelUsed?: string;
}

export async function testAIConnection(): Promise<{
  keyPresent: boolean;
  modelUsed: string;
  success: boolean;
  message: string;
  details?: string;
}> {
  try {
    const response = await fetch('/api/ai/test');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    return {
      keyPresent: true,
      modelUsed: 'server-side',
      success: data.success,
      message: data.message,
    };
  } catch (err: any) {
    return {
      keyPresent: false,
      modelUsed: 'server-side',
      success: false,
      message: 'Connection Failed',
      details: err.message,
    };
  }
}

export async function sendCoachMessage(
  messages: Array<{ role: string; content: string }>,
  currentRoutine: AIWorkoutAnalysisResult | null,
  userProfile?: UserProfile,
  modelChoice: string = 'gemini-2.5-flash',
  liftRecords: any[] = []
): Promise<CoachResponse> {
  try {
    const response = await fetch('/api/ai/coach-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, currentRoutine, userProfile, modelChoice, liftRecords }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new CoachError('Coach is unreachable.', errorData.error || 'Server error');
    }
    return await response.json();
  } catch (err: any) {
    console.error('sendCoachMessage error:', err);
    throw err instanceof CoachError ? err : new CoachError('Coach is unreachable.', String(err));
  }
}

export async function parseRoutineWithAI(
  rawText: string,
  userGoal: string = 'Hypertrophy',
  userWeightKg: number = 75
): Promise<any> {
  try {
    const response = await fetch('/api/ai/analyze-workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawNotes: rawText, userGoal, userWeightKg }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }
    return await response.json();
  } catch (err: any) {
    console.error('parseRoutineWithAI error:', err);
    throw err;
  }
}

export async function generateAIOverview(
  period: string,
  profile: UserProfile,
  stats: { streakCount: number },
  language: string = 'en'
): Promise<AIOverviewData> {
  try {
    const response = await fetch('/api/ai/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, profile, stats, language }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }
    return await response.json();
  } catch (err: any) {
    console.error('generateAIOverview error:', err);
    throw err;
  }
}

export async function analyzeBodyVision(
  currentImageBase64: string,
  userGoal: string = 'Hypertrophy',
  mimeType: string = 'image/jpeg'
): Promise<AIBodyVisionData> {
  try {
    const response = await fetch('/api/ai/body-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentImageBase64, userGoal, mimeType }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }
    return await response.json();
  } catch (err: any) {
    console.error('analyzeBodyVision error:', err);
    throw err;
  }
}
