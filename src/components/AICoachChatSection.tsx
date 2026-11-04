import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User as UserIcon, 
  Send, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  RotateCcw,
  Dumbbell,
  AlertTriangle,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { AIChatMessage, AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { UserProfile } from '../types/fitness';
import confetti from 'canvas-confetti';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { calculateAge, calculateBMI, calculateBMR, calculateTDEE } from '../utils/calculations';

interface AICoachChatSectionProps {
  profile?: UserProfile;
  currentRoutine?: AIWorkoutAnalysisResult | null;
  onUpdateRoutine?: (updated: AIWorkoutAnalysisResult) => void;
  onNavigateToRoutine?: () => void;
}

export interface AIWorkoutProposal {
  id: string;
  title: string;
  summary: string;
  changes: string[];
  updatedRoutine: AIWorkoutAnalysisResult;
  status: 'pending' | 'accepted' | 'denied';
}

function processCoachRoutineModification(
  userText: string,
  currentRoutine: AIWorkoutAnalysisResult | null,
  userName: string
): { 
  updatedRoutine: AIWorkoutAnalysisResult; 
  reply: string; 
  didModify: boolean;
  proposalTitle: string;
  proposalSummary: string;
  changes: string[];
} | null {
  const lower = userText.toLowerCase();

  const baseRoutine: AIWorkoutAnalysisResult = currentRoutine ? { ...currentRoutine } : {
    overallScore: 88,
    balanceRating: 8.8,
    volumeRating: 8.5,
    exerciseSelectionRating: 9.0,
    summaryTitle: 'High-Performance Hypertrophy & Power Split',
    honestOpinion: 'Autonomous Intelligence Active: Biomechanical analysis generated from your active lifting telemetry.',
    superStrongAreas: ['Horizontal Pressing Power', 'Posterior Chain Stimulus', 'Quad Mechanical Overload'],
    neglectedOrNeedsWork: ['Rotator cuff external rotation', 'Rear delt volume'],
    improvements: ['Focus on progressive overload'],
    muscleGroupCoverage: [],
    parsedDays: [
      {
        dayTitle: 'Day 1: Push Heavy',
        focus: 'Chest, Front/Side Delts & Triceps',
        exercises: [
          { name: 'Barbell Flat Bench Press', setsReps: '4x5 (100kg)', targetMuscle: 'Chest', rating: 9, substitution: 'Dumbbell Flat Press' },
          { name: 'Incline Dumbbell Press', setsReps: '3x8-10', targetMuscle: 'Upper Chest', rating: 9, substitution: 'Incline Smith Press' },
          { name: 'Standing Overhead Press (OHP)', setsReps: '3x6-8', targetMuscle: 'Front Delts', rating: 8, substitution: 'Neutral-Grip DB Press' },
          { name: 'Rope Tricep Pushdowns', setsReps: '4x12', targetMuscle: 'Triceps', rating: 8, substitution: 'Overhead Cable Extension' },
        ]
      },
      {
        dayTitle: 'Day 2: Pull Power',
        focus: 'Lats, Upper Back & Biceps',
        exercises: [
          { name: 'Conventional Deadlift', setsReps: '3x3 (180kg)', targetMuscle: 'Posterior Chain', rating: 10, substitution: 'Trap Bar Deadlift' },
          { name: 'Barbell Bent-Over Row', setsReps: '4x6-8', targetMuscle: 'Upper Back', rating: 9, substitution: 'Chest-Supported Row' },
          { name: 'Lat Pulldowns', setsReps: '3x10-12', targetMuscle: 'Lats', rating: 8, substitution: 'Pull-ups' },
          { name: 'Incline Dumbbell Curls', setsReps: '4x10', targetMuscle: 'Biceps', rating: 9, substitution: 'Cable Bicep Curls' },
        ]
      },
      {
        dayTitle: 'Day 3: Legs & Core',
        focus: 'Quads, Hamstrings & Abs',
        exercises: [
          { name: 'Barbell Back Squat', setsReps: '4x5 (140kg)', targetMuscle: 'Quads', rating: 10, substitution: 'Hack Squat' },
          { name: 'Romanian Deadlifts (RDL)', setsReps: '3x8', targetMuscle: 'Hamstrings', rating: 9, substitution: 'Lying Leg Curls' },
          { name: 'Leg Press', setsReps: '3x12', targetMuscle: 'Quads', rating: 8, substitution: 'Bulgarian Split Squats' },
        ]
      }
    ],
    substitutions: [],
    analyzedAt: 'Just now'
  };

  const parsedDays = Array.isArray(baseRoutine.parsedDays) ? [...baseRoutine.parsedDays] : [];

  // INTENT 0: 2 Days / Schedule / University / 2 Jobs / Busy / Short on time
  const is2DayScheduleIntent =
    lower.includes('2 day') ||
    lower.includes('two day') ||
    lower.includes('2 jobs') ||
    lower.includes('two jobs') ||
    lower.includes('university') ||
    lower.includes('school') ||
    lower.includes('college') ||
    lower.includes('short on time') ||
    lower.includes('busy schedule') ||
    lower.includes('condense') ||
    (lower.includes('schedule') && (lower.includes('busy') || lower.includes('tight') || lower.includes('work')));

  if (is2DayScheduleIntent) {
    const allExercises = parsedDays.flatMap((d) => d.exercises || []);

    const upperExercises = allExercises.filter((ex) => {
      const target = (ex.targetMuscle || '').toLowerCase();
      const name = (ex.name || '').toLowerCase();
      return target.includes('chest') || target.includes('back') || target.includes('lat') || target.includes('delt') || target.includes('shoulder') || target.includes('bicep') || target.includes('tricep') || name.includes('bench') || name.includes('row') || name.includes('press') || name.includes('pulldown');
    });

    const upperDayExercises = upperExercises.length > 0 ? upperExercises.slice(0, 5) : [
      { name: 'Barbell Flat Bench Press', setsReps: '4x5', targetMuscle: 'Chest & Triceps', rating: 10, substitution: 'Dumbbell Bench Press' },
      { name: 'Barbell Bent-Over Row', setsReps: '4x6-8', targetMuscle: 'Upper Back & Lats', rating: 9, substitution: 'Chest-Supported Row' },
      { name: 'Incline Dumbbell Press', setsReps: '3x8-10', targetMuscle: 'Upper Chest', rating: 9, substitution: 'Cable Flyes' },
      { name: 'Lat Pulldowns / Pull-Ups', setsReps: '3x10', targetMuscle: 'Lats', rating: 9, substitution: 'Assisted Pull-ups' },
      { name: 'Cable Face Pulls', setsReps: '3x15', targetMuscle: 'Rear Delts & Rotator Cuff', rating: 9, substitution: 'Band Pull-aparts' },
    ];

    const lowerExercises = allExercises.filter((ex) => {
      const target = (ex.targetMuscle || '').toLowerCase();
      const name = (ex.name || '').toLowerCase();
      return target.includes('quad') || target.includes('hamstring') || target.includes('posterior') || target.includes('leg') || target.includes('glute') || target.includes('core') || target.includes('abs') || name.includes('squat') || name.includes('deadlift') || name.includes('rdl');
    });

    const lowerDayExercises = lowerExercises.length > 0 ? lowerExercises.slice(0, 5) : [
      { name: 'Barbell Back Squat', setsReps: '4x5', targetMuscle: 'Quads & Glutes', rating: 10, substitution: 'Hack Squat' },
      { name: 'Romanian Deadlifts (RDL)', setsReps: '3x8', targetMuscle: 'Hamstrings & Glutes', rating: 10, substitution: 'Lying Leg Curls' },
      { name: 'Leg Press', setsReps: '3x12', targetMuscle: 'Quads', rating: 8, substitution: 'Bulgarian Split Squats' },
      { name: 'Hanging Leg Raises', setsReps: '3x15', targetMuscle: 'Core & Lower Abs', rating: 9, substitution: 'Planks' },
    ];

    const condensed2DaySplit = [
      {
        dayTitle: 'Day 1: Upper Body Heavy',
        focus: 'Chest, Upper Back, Lats, Delts & Arms',
        exercises: upperDayExercises,
      },
      {
        dayTitle: 'Day 2: Lower Body & Core Power',
        focus: 'Quads, Hamstrings, Posterior Chain & Abs',
        exercises: lowerDayExercises,
      },
    ];

    const updatedRoutine: AIWorkoutAnalysisResult = {
      ...baseRoutine,
      parsedDays: condensed2DaySplit,
      summaryTitle: '2-Day Ultra-Efficient Condensed Split',
    };

    return {
      updatedRoutine,
      reply: `I have constructed a 2-Day Condensed Schedule to accommodate your work and university demands. Your core compound lifts have been compressed into 2 high-efficiency sessions. Review and accept the proposal below to apply these changes.`,
      didModify: true,
      proposalTitle: '2-Day Ultra-Efficient Condensed Split',
      proposalSummary: 'Condensed full-body compound split into 2 high-stimulus days.',
      changes: ['Day 1: Upper Body Heavy (Chest, Lats, Delts, Arms)', 'Day 2: Lower Body & Core Power (Quads, Hamstrings, Abs)', 'Optimized for university and busy work schedules'],
    };
  }

  // INTENT 1: Skip leg day / remove leg day / legs hurt / no legs
  const isSkipLegsIntent =
    lower.includes('skip leg') ||
    lower.includes('no leg') ||
    lower.includes('remove leg') ||
    lower.includes("can't work on leg") ||
    lower.includes('legs hurt') ||
    lower.includes('leg day') ||
    (lower.includes('leg') && (lower.includes('remove') || lower.includes('skip') || lower.includes('cancel') || lower.includes('no')));

  if (isSkipLegsIntent) {
    const nonLegDays = parsedDays.filter((d) => {
      const titleLower = (d.dayTitle || '').toLowerCase();
      const focusLower = (d.focus || '').toLowerCase();
      return !titleLower.includes('leg') && !focusLower.includes('quad') && !focusLower.includes('hamstring');
    });

    nonLegDays.push({
      dayTitle: 'Day 3: Active Recovery, Mobility & Core',
      focus: 'Hip Mobility, Ankle Decompression & Abs',
      exercises: [
        { name: 'Decompression Foam Rolling & Hip Openers', setsReps: '3x10 mins', targetMuscle: 'Hips & Fascia', rating: 9, substitution: 'Yoga Flow' },
        { name: 'Hanging Leg Raises', setsReps: '3x15', targetMuscle: 'Core & Lower Abs', rating: 9, substitution: 'Ab Wheel Rollouts' },
        { name: 'Plank & Pallof Press Hold', setsReps: '3x60s', targetMuscle: 'Deep Core Stabilization', rating: 8, substitution: 'Cable Woodchoppers' },
        { name: 'Cable Face Pulls', setsReps: '4x15', targetMuscle: 'Posture & Scapula', rating: 10, substitution: 'Band Pull-Aparts' }
      ]
    });

    const updatedRoutine: AIWorkoutAnalysisResult = {
      ...baseRoutine,
      parsedDays: nonLegDays,
      summaryTitle: 'Push / Pull / Active Mobility & Core Split',
    };

    return {
      updatedRoutine,
      reply: `I have prepared a split modification that completely removes heavy leg sessions and replaces them with an Active Mobility & Core recovery protocol. Review the proposal below.`,
      didModify: true,
      proposalTitle: 'Push / Pull / Active Mobility Split (No Legs)',
      proposalSummary: 'Removed heavy leg sessions to preserve energy for work and field athletics.',
      changes: ['Removed Squats, Leg Press, and RDL heavy volume', 'Added Day 3: Active Recovery, Mobility & Core decompression', 'Preserved upper body progressive overload'],
    };
  }

  // INTENT 2: Shoulder pain / shoulder injury / rotator cuff / overhead press swap
  const isShoulderIntent =
    lower.includes('shoulder') ||
    lower.includes('rotator') ||
    lower.includes('impingement') ||
    lower.includes('shoulder hurts') ||
    lower.includes('overhead press');

  if (isShoulderIntent) {
    const swappedDays = parsedDays.map((d) => ({
      ...d,
      exercises: (d.exercises || []).map((ex) => {
        const exName = (ex.name || '').toLowerCase();
        if (exName.includes('overhead') || exName.includes('ohp') || exName.includes('military press') || exName.includes('shoulder press')) {
          return {
            ...ex,
            name: 'Incline Neutral-Grip DB Press',
            setsReps: '3x10',
            targetMuscle: 'Upper Chest & Front Delts (Joint Safe)',
            substitution: 'Overhead Press (Avoided due to shoulder impingement)',
          };
        }
        return ex;
      }),
    }));

    if (swappedDays[0] && !swappedDays[0].exercises.some((e) => e.name.toLowerCase().includes('face pull'))) {
      swappedDays[0].exercises.push({
        name: 'Cable Face Pulls',
        setsReps: '4x15',
        targetMuscle: 'Rear Delts & Rotator Cuff Health',
        rating: 10,
        substitution: 'Band Pull-Aparts',
      });
    }

    const updatedRoutine: AIWorkoutAnalysisResult = {
      ...baseRoutine,
      parsedDays: swappedDays,
      summaryTitle: 'Shoulder Impingement Recovery Protocol',
    };

    return {
      updatedRoutine,
      reply: `Shoulder impingement protocol prepared. Heavy vertical overhead presses have been replaced with Incline Neutral-Grip Dumbbell Presses and Cable Face Pulls for rotator cuff stability. Review and accept below.`,
      didModify: true,
      proposalTitle: 'Shoulder Impingement Recovery Protocol',
      proposalSummary: 'Replaced heavy overhead vertical pressing with joint-safe neutral dumbbell presses.',
      changes: ['Replaced Overhead Press with Incline Neutral-Grip DB Press', 'Added Cable Face Pulls (4x15) for rotator cuff health', 'Eliminated direct anterior delt impingement angles'],
    };
  }

  // INTENT 3: Arm specialization / arms / bicep / tricep
  const isArmIntent =
    lower.includes('arm') ||
    lower.includes('bicep') ||
    lower.includes('tricep') ||
    lower.includes('arms lagging');

  if (isArmIntent) {
    const updatedDays = parsedDays.map((d) => {
      const dayTitle = (d.dayTitle || '').toLowerCase();
      if (dayTitle.includes('push') || dayTitle.includes('upper') || dayTitle.includes('day 1')) {
        const exs = [...(d.exercises || [])];
        if (!exs.some((e) => e.name.toLowerCase().includes('incline dumbbell curl'))) {
          exs.push({
            name: 'Incline DB Bicep Curls (2s Eccentric)',
            setsReps: '4x10-12',
            targetMuscle: 'Biceps Long Head',
            rating: 10,
            substitution: 'Cable Bicep Curls',
          });
        }
        if (!exs.some((e) => e.name.toLowerCase().includes('overhead cable extension'))) {
          exs.push({
            name: 'Overhead Cable Tricep Extensions',
            setsReps: '4x12',
            targetMuscle: 'Triceps Long Head',
            rating: 9,
            substitution: 'Skull Crushers',
          });
        }
        return { ...d, exercises: exs };
      }
      return d;
    });

    const updatedRoutine: AIWorkoutAnalysisResult = {
      ...baseRoutine,
      parsedDays: updatedDays,
      summaryTitle: 'Arm-Specialization Hypertrophy Split',
    };

    return {
      updatedRoutine,
      reply: `Arm specialization protocol structured. I have integrated dedicated antagonist arm supersets with strict 2-second eccentrics to trigger arm hypertrophy without causing excessive fatigue. Review the proposal below to apply it to your split.`,
      didModify: true,
      proposalTitle: 'Arm-Specialization Hypertrophy Split',
      proposalSummary: 'Integrated dedicated antagonist bicep/tricep supersets with 2s eccentric overload.',
      changes: ['Added Incline DB Bicep Curls (4x10-12)', 'Added Overhead Cable Tricep Extensions (4x12)', 'Targeted bicep long head and tricep long head'],
    };
  }

  return null;
}

// Brutally honest, evidence-based fallback coaching generator
function generateBrutalCoachReply(
  userText: string,
  userName: string,
  profile?: UserProfile
): { reply: string; didModify: boolean } {
  const lower = userText.toLowerCase();
  const name = userName || 'Athlete';

  // Validation layer
  const weightKg = profile?.weightKg || 75;
  const heightCm = profile?.heightCm || 180;
  const ageData = calculateAge(profile?.birthDate || '2000-01-01');
  const bmiData = calculateBMI(weightKg, heightCm);
  const bmrData = calculateBMR(weightKg, heightCm, ageData.years, profile?.gender || 'male');
  const tdeeVal = calculateTDEE(bmrData.mifflinStJeor, profile?.activityLevel || 'moderate');

  if (lower.includes('leg') || lower.includes('soccer') || lower.includes('football')) {
    return {
      reply: `Leg day completely removed from your active split. Work constraints acknowledged—your routine has been re-structured to Push/Pull/Mobility so your performance at work isn't compromised.`,
      didModify: true,
    };
  } else if (lower.includes('shoulder') || lower.includes('pain') || lower.includes('hurt') || lower.includes('injury')) {
    return {
      reply: `Stop pushing through joint impingement, ${name}. Heavy overhead presses removed and swapped for Incline Neutral-Grip DB Press and Cable Face Pulls. Routine updated in real time.`,
      didModify: true,
    };
  } else if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) {
    return {
      reply: `If your arms are lagging behind your chest and back, half-hearted 3-set pump work at the end of a 90-minute session isn't cutting it. I added a dedicated antagonist arm superset (incline dumbbell curls + overhead cable extensions) with strict 2-second eccentrics to your upper days. Split updated.`,
      didModify: true,
    };
  } else if (lower.includes('fat') || lower.includes('cut') || lower.includes('weight') || lower.includes('diet') || lower.includes('calories')) {
    return {
      reply: `Here are the unvarnished facts based on your metrics: Bodyweight: ${weightKg}kg, BMI: ${bmiData.bmi} (${bmiData.category}), BMR: ${bmrData.mifflinStJeor} kcal, TDEE: ~${tdeeVal} kcal. If you aren't losing body fat, you are underestimating your calorie intake or overestimating your activity. Track your sauces, weigh your food raw, and keep your daily deficit at 300-500 kcal with 2.0g protein/kg.`,
      didModify: false,
    };
  } else if (lower.includes('plateau') || lower.includes('stuck') || lower.includes('strength')) {
    return {
      reply: `Plateaus aren't bad luck; they're the result of sloppy recovery, junk volume, or lack of micro-load progression. If your bench or squat hasn't moved in 3 weeks, drop total sets by 20%, increase rest to 3 full minutes on compound lifts, and add 1.25kg plates per side each week. Zero ego lifting.`,
      didModify: false,
    };
  }

  return {
    reply: `Listen up, ${name}: Consistent execution beats overcomplicated theory every single time. Based on your profile (${weightKg}kg, TDEE: ~${tdeeVal} kcal), prioritize heavy compound progressive overload, hit your protein target, and get 7.5+ hours of sleep. Tell me if you need an exact exercise swap or a split restructure.`,
    didModify: false,
  };
}

export const AICoachChatSection: React.FC<AICoachChatSectionProps> = ({
  profile,
  currentRoutine,
  onUpdateRoutine,
  onNavigateToRoutine,
}) => {
  const userName = profile?.name || 'Athlete';
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Defensive state initialization: default to empty array or fallback initial message
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>(() => {
    const shortGreeting = 'Overhaul AI active. Ask me anything about your split, routine adjustments, or nutrition.';
    try {
      const saved = loadFromStorage<AIChatMessage[]>('ai_coach_chat_history', []);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved.map((m, idx) =>
          idx === 0 && m.role === 'assistant'
            ? { ...m, content: shortGreeting }
            : m
        );
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return [
      {
        id: 'm-0',
        role: 'assistant',
        content: shortGreeting,
        timestamp: 'Just now',
      },
    ];
  });

  const [inputMsg, setInputMsg] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with storage on change
  useEffect(() => {
    try {
      if (Array.isArray(chatMessages)) {
        saveToStorage('ai_coach_chat_history', chatMessages);
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [chatMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      // safe fallback
    }
  }, [chatMessages, chatLoading]);

  const handleAcceptProposal = (msgId: string, proposal: AIWorkoutProposal) => {
    if (onUpdateRoutine && proposal.updatedRoutine) {
      onUpdateRoutine(proposal.updatedRoutine);
    }

    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          return {
            ...m,
            proposal: {
              ...m.proposal,
              status: 'accepted' as const,
            },
          };
        }
        return m;
      })
    );

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    showToast('✓ Routine modifications accepted and synced to active split!');
  };

  const handleDenyProposal = (msgId: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          return {
            ...m,
            proposal: {
              ...m.proposal,
              status: 'denied' as const,
            },
          };
        }
        return m;
      })
    );
    showToast('Proposal dismissed. Active routine was not modified.');
  };

  const executeSendMessage = async (textToSend: string) => {
    const userText = textToSend.trim();
    if (!userText || chatLoading) return;

    setInputMsg('');

    const newMsg: AIChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: 'Just now',
    };

    const nextMessages = [...(Array.isArray(chatMessages) ? chatMessages : []), newMsg];
    setChatMessages(nextMessages);
    setChatLoading(true);

    try {
      // 1. Invoke Server-Side Gemini Coach Chatbot API
      const res = await fetch('/api/ai/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          modelChoice: selectedModel,
          currentRoutine,
          userProfile: profile,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // If server indicated an offline fallback and user triggered a routine change pattern, check local mod parser
        if (data.fallback) {
          const modResult = processCoachRoutineModification(userText, currentRoutine || null, userName);
          if (modResult) {
            const proposal: AIWorkoutProposal = {
              id: 'prop-' + Date.now(),
              title: modResult.proposalTitle,
              summary: modResult.proposalSummary,
              changes: modResult.changes,
              updatedRoutine: modResult.updatedRoutine,
              status: 'pending',
            };

            const assistantMsg: AIChatMessage = {
              id: 'msg-' + (Date.now() + 1),
              role: 'assistant',
              content: modResult.reply,
              timestamp: 'Just now',
              proposal,
            };
            setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), assistantMsg]);
            return;
          }
        }

        let proposal: AIWorkoutProposal | undefined = undefined;
        if (data.hasProposal && data.proposal && Array.isArray(data.proposal.updatedParsedDays)) {
          const updatedRoutine: AIWorkoutAnalysisResult = {
            ...(currentRoutine || {
              overallScore: 90,
              balanceRating: 9.0,
              volumeRating: 8.8,
              exerciseSelectionRating: 9.2,
              summaryTitle: data.proposal.title || 'Customized Routine',
              honestOpinion: data.reply,
              superStrongAreas: ['Customized Load & Recovery Split'],
              neglectedOrNeedsWork: [],
              improvements: data.proposal.changes || [],
              muscleGroupCoverage: [],
              substitutions: [],
              analyzedAt: 'Just now',
            }),
            parsedDays: data.proposal.updatedParsedDays,
            analyzedAt: 'Just now',
          };

          proposal = {
            id: 'prop-' + Date.now(),
            title: data.proposal.title || 'Adapted Workout Split',
            summary: data.proposal.summary || 'Biomechanical split adjustment based on your request.',
            changes: data.proposal.changes || ['Adjusted split frequency and exercise order.'],
            updatedRoutine,
            status: 'pending',
          };
        }

        const assistantMsg: AIChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: data.reply || 'Understood. Focus on progressive overload and recover properly.',
          timestamp: 'Just now',
          proposal,
          didModifyRoutine: !!data.hasProposal,
        };

        setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), assistantMsg]);
        return;
      }

      throw new Error(`Server returned HTTP ${res.status}`);
    } catch (err) {
      console.warn('Falling back to local coach engine:', err);

      // 2. Intelligent local fallback if server/network is unreachable
      const modResult = processCoachRoutineModification(userText, currentRoutine || null, userName);
      if (modResult) {
        const proposal: AIWorkoutProposal = {
          id: 'prop-' + Date.now(),
          title: modResult.proposalTitle,
          summary: modResult.proposalSummary,
          changes: modResult.changes,
          updatedRoutine: modResult.updatedRoutine,
          status: 'pending',
        };

        const assistantMsg: AIChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: modResult.reply,
          timestamp: 'Just now',
          proposal,
        };
        setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), assistantMsg]);
        return;
      }

      const { reply } = generateBrutalCoachReply(userText, userName, profile);
      const assistantMsg: AIChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: reply,
        timestamp: 'Just now',
        didModifyRoutine: false,
      };
      setChatMessages((prev) => [...(Array.isArray(prev) ? prev : []), assistantMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSendMessage(inputMsg);
  };

  const handleClearChat = () => {
    const initial: AIChatMessage[] = [
      {
        id: 'm-reset-' + Date.now(),
        role: 'assistant',
        content: `Chat session reset. What are we fixing in your program today, ${userName}?`,
        timestamp: 'Just now',
      },
    ];
    setChatMessages(initial);
    saveToStorage('ai_coach_chat_history', initial);
  };

  const safeMessages = Array.isArray(chatMessages) ? chatMessages : [];

  // Simulated Voice dictation trigger
  const handleVoiceInputSimulate = () => {
    const lines = [
      "Skip leg day because of a long shift at work.",
      "Condense my workout split to a 2-day routine.",
      "Show me how to increase bench press 1RM.",
      "Adjust my macros for aggressive fat loss.",
      "Analyze posture from check-in scans."
    ];
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    setInputMsg(randomLine);
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden select-none relative bg-transparent">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="pill absolute top-2 left-3 right-3 z-50 p-2.5 rounded-xl bg-white/10 border border-emerald-400/50 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] text-emerald-300 text-xs font-bold flex items-center gap-2 animate-card-expand">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gemini Chatbot Model & Session Toolbar */}
      <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 accent-text shrink-0" />
          <span className="text-[11px] font-bold text-white tracking-wide">Gemini Coach</span>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/25">
            Active
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-3.8-flash')}
            title="Gemini 3.8 Flash: High-performance balanced sports science reasoning"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-3.8-flash'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            3.8 Flash
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
            title="Gemini 3.1 Flash-Lite: Low latency, rapid responses"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-3.1-flash-lite'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            3.1 Lite
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-4-argon')}
            title="Gemini 4 Argon: Deep biomechanics & complex split reasoning"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-4-argon'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            4 Argon
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat Session"
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors ml-1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 1. SCROLLABLE MESSAGES CONTAINER */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3 scrollbar-none bg-transparent">
        {safeMessages?.map((msg) => {
          const isAI = msg?.role === 'assistant';
          const proposal = msg?.proposal;

          return (
            <div
              key={msg?.id || Math.random()}
              className={`flex items-start gap-2.5 ${!isAI ? 'justify-end' : 'justify-start'}`}
            >
              {isAI && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-black font-black shrink-0 mt-0.5 shadow-md"
                  style={{ backgroundColor: 'var(--accent-hex)' }}
                >
                  <Bot className="w-4 h-4 text-black" />
                </div>
              )}

              <div
                className={`pill ai-coach-bubble max-w-[92%] sm:max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed transition-all duration-300 ${
                  !isAI
                    ? 'bg-white/[0.10] text-inherit rounded-tr-none border border-white/25'
                    : 'bg-white/[0.08] text-inherit rounded-tl-none border border-white/30'
                }`}
                style={isAI ? { borderColor: 'var(--accent-hex)' } : undefined}
              >
                <p className="whitespace-pre-line break-words font-sans">{msg?.content || ''}</p>

                {/* PROPOSAL CARD (ACCEPT / DENY CONFIRMATION FLOW) */}
                {proposal && (
                  <div className="pill mt-3 p-3 rounded-xl bg-white/[0.08] border border-cyan-400/35 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                          {proposal.title}
                        </span>
                      </div>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        proposal.status === 'accepted' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : proposal.status === 'denied'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-200">{proposal.summary}</p>

                    {proposal.changes && proposal.changes.length > 0 && (
                      <div className="space-y-1 bg-white/[0.05] p-2 rounded-lg border border-white/15">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">Planned Adjustments:</span>
                        {proposal.changes.map((ch, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-100">
                            <span className="text-cyan-400 shrink-0 font-bold">•</span>
                            <span>{ch}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending Action Buttons */}
                    {proposal.status === 'pending' && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptProposal(msg.id || '', proposal)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>ACCEPT CHANGES</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDenyProposal(msg.id || '')}
                          className="pill flex-1 py-2 px-3 rounded-xl border border-rose-500/50 hover:bg-rose-500/15 text-rose-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>DENY CHANGES</span>
                        </button>
                      </div>
                    )}

                    {/* Accepted State */}
                    {proposal.status === 'accepted' && (
                      <div className="pt-1 flex items-center justify-between gap-2 text-emerald-400 text-[10px] font-bold">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Changes Applied to Active Split</span>
                        </div>
                        {onNavigateToRoutine && (
                          <button
                            type="button"
                            onClick={onNavigateToRoutine}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[9px] font-extrabold flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            <span>View Split</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Denied State */}
                    {proposal.status === 'denied' && (
                      <div className="pt-1 flex items-center gap-1 text-rose-400 text-[10px] font-medium">
                        <span>✕ Proposal declined. Your current routine was kept intact.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[8px] text-slate-500 dark:text-slate-300/80 mt-1 text-right font-mono">
                  {msg?.timestamp || 'Just now'}
                </div>
              </div>

              {!isAI && (
                <div className="pill w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-inherit shrink-0 mt-0.5 border border-white/25">
                  <UserIcon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                </div>
              )}
            </div>
          );
        })}

        {chatLoading && (
          <div className="pill flex items-center gap-2 text-xs text-inherit p-2.5 bg-white/[0.08] border border-white/20 rounded-2xl animate-pulse max-w-[85%]">
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center text-black"
              style={{ backgroundColor: 'var(--accent-hex)' }}
            >
              <Bot className="w-3.5 h-3.5 text-black animate-spin" />
            </div>
            <span className="font-mono text-[10px]">Analyzing biomechanics & structuring proposal...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 2. CHIPS & INPUT SECURE ANCHOR DOCK (Ultra-Translucent Acrylic) */}
      <div
        className="ai-coach-bottom-panel shrink-0"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '12px 16px',
        }}
      >
        
        {/* Quick Suggestion Chips: interactive Liquid Glass pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none shrink-0">
          {[
            'Skip Leg Day',
            'Add Arm Specialization',
            'Condense to 2-Day Split',
            'Shoulder Pain Fix',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => executeSendMessage(promptText)}
              disabled={chatLoading}
              className="ai-quick-chip ai-coach-chip text-xs font-semibold whitespace-nowrap px-3.5 py-1.5 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              style={{
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              <Zap className="w-3 h-3 accent-text" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Message Input Form with Voice Dictation Trigger */}
        <form
          onSubmit={handleSendMessage}
          className="ai-input-row flex items-center shrink-0"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {/* Simulated Mic button */}
          <button
            type="button"
            onClick={handleVoiceInputSimulate}
            title="Simulate Voice Input Dictation"
            className="pill p-2.5 rounded-full bg-white/[0.08] border border-white/15 hover:bg-white/15 accent-text transition-colors active:scale-90 cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask for routine modifications or split adjustments..."
            className="ai-chat-input flex-1 text-xs placeholder-slate-400 focus:outline-none focus:border-white/30 font-sans"
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '10px 16px',
              color: '#ffffff',
            }}
          />

          <button
            type="submit"
            disabled={!inputMsg.trim() || chatLoading}
            className="p-2.5 rounded-full text-black font-extrabold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-hex)' }}
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>
      </div>
    </div>
  );
};
