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
  AlertTriangle,
  CheckCircle2,
  Undo2
} from 'lucide-react';
import { AIChatMessage, AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { UserProfile } from '../types/fitness';
import confetti from 'canvas-confetti';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { executeToolCalls, RoutineState, ToolCall } from '../utils/routineTools';
import { sendCoachMessage } from '../utils/geminiService';

// TODO: Security Recommendation - Move client Gemini AI calls behind a secure Firebase Cloud Function before release.
// TODO: Restrict the API key to the Generative Language API in Google Cloud Console.

interface AICoachChatSectionProps {
  profile?: UserProfile;
  currentRoutine?: AIWorkoutAnalysisResult | null;
  onUpdateRoutine?: (updated: AIWorkoutAnalysisResult) => void;
  onNavigateToRoutine?: () => void;
  liftRecords?: any[];
}

export const AICoachChatSection: React.FC<AICoachChatSectionProps> = ({
  profile,
  currentRoutine,
  onUpdateRoutine,
  onNavigateToRoutine,
  liftRecords,
}) => {
  const userName = profile?.name || 'Athlete';
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Undo stack (1-step undo)
  const [undoState, setUndoState] = useState<AIWorkoutAnalysisResult | null>(null);

  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>(() => {
    const greeting = 'Overhaul AI active. Ask me to modify your split, swap exercises, or ask any training question.';
    try {
      const saved = loadFromStorage<AIChatMessage[]>('ai_coach_chat_history', []);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return [
      {
        id: 'm-0',
        role: 'assistant',
        content: greeting,
        timestamp: 'Just now',
      },
    ];
  });

  const [inputMsg, setInputMsg] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite'>('gemini-2.5-flash');
  const [expandedErrorIds, setExpandedErrorIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleErrorDetails = (id: string) => {
    setExpandedErrorIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    try {
      if (Array.isArray(chatMessages)) {
        saveToStorage('ai_coach_chat_history', chatMessages);
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {}
  }, [chatMessages, chatLoading]);

  const handleUndo = () => {
    if (undoState && onUpdateRoutine) {
      onUpdateRoutine(undoState);
      setUndoState(null);
      showToast('✓ Undo successful. Restored previous routine split.');
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  const handleExecuteTools = (toolCalls: ToolCall[], coachReply: string) => {
    if (!toolCalls || toolCalls.length === 0) return;

    const { updatedRoutine, previousState } = executeToolCalls((currentRoutine as unknown as RoutineState) || null, toolCalls);

    if (previousState && onUpdateRoutine) {
      setUndoState(previousState as any);
      onUpdateRoutine(updatedRoutine as any);
      confetti({ particleCount: 50, spread: 60 });
    }
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
      const storedLifts = liftRecords || loadFromStorage('overhaul_lifts_records', []);

      const data = await sendCoachMessage(
        nextMessages.map((m) => ({ role: m.role || 'user', content: m.content || '' })),
        currentRoutine || null,
        profile,
        selectedModel,
        storedLifts
      );

      let replyContent = data.reply || 'Routine updated.';

      // Handle confirmation request for destructive tools
      if (data.requiresConfirmation) {
        const confirmMsg: AIChatMessage = {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: data.confirmationPrompt || data.reply || 'Are you sure you want to proceed with this destructive split modification?',
          timestamp: 'Just now',
          proposal: {
            id: 'conf-' + Date.now(),
            title: 'Confirmation Required',
            summary: data.confirmationPrompt || 'Destructive split operation requested.',
            changes: ['This will delete day(s) or clear your workout split.'],
            updatedRoutine: (currentRoutine || {}) as any,
            status: 'pending',
          },
          pendingToolCalls: data.tool_calls,
        } as any;
        setChatMessages((prev) => [...prev, confirmMsg]);
        return;
      }

      // Execute tool calls if returned
      if (Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
        handleExecuteTools(data.tool_calls, replyContent);
      }

      const assistantMsg: AIChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: replyContent,
        timestamp: 'Just now',
        didModifyRoutine: Array.isArray(data.tool_calls) && data.tool_calls.length > 0,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Coach Error:', err);
      // Clean user-facing error message with detailed diagnostics available via toggle
      const errorMsg: AIChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: '⚠️ Coach is unreachable. Check your connection.',
        timestamp: 'Just now',
        errorDetails: err?.details || err?.message || String(err),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleConfirmAction = (msgId: string, toolCalls?: ToolCall[]) => {
    if (toolCalls && toolCalls.length > 0) {
      handleExecuteTools(toolCalls, 'Action confirmed.');
    }
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          return {
            ...m,
            content: 'Confirmed. Workout split updated.',
            proposal: { ...m.proposal, status: 'accepted' as const },
          };
        }
        return m;
      })
    );
  };

  const handleCancelAction = (msgId: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.proposal) {
          return {
            ...m,
            content: 'Cancelled action. No changes were made.',
            proposal: { ...m.proposal, status: 'denied' as const },
          };
        }
        return m;
      })
    );
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

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden select-none relative bg-transparent">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="pill absolute top-2 left-3 right-3 z-50 p-2.5 rounded-xl bg-white/10 border border-emerald-400/50 backdrop-blur-xl shadow-lg text-emerald-300 text-xs font-bold flex items-center gap-2 animate-card-expand">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Model & Session Control Toolbar */}
      <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 accent-text shrink-0" />
          <span className="text-[11px] font-bold text-white tracking-wide">AI Coach</span>
          {undoState && (
            <button
              type="button"
              onClick={handleUndo}
              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/30 transition-all cursor-pointer"
              title="Undo last routine change"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo 1-Step</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-2.5-flash')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-2.5-flash'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            2.5 Flash
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-2.5-pro')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-2.5-pro'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            2.5 Pro
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-2.5-flash-lite')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
              selectedModel === 'gemini-2.5-flash-lite'
                ? 'bg-cyan-500 text-black font-black shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            2.5 Lite
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat"
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-3 scrollbar-none bg-transparent">
        {chatMessages.map((msg) => {
          const isAI = msg.role === 'assistant';
          const proposal = msg.proposal;
          const isErr = msg.content?.startsWith('⚠️');

          return (
            <div
              key={msg.id || Math.random()}
              className={`flex items-start gap-2.5 ${!isAI ? 'justify-end' : 'justify-start'}`}
            >
              {isAI && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-black font-black shrink-0 mt-0.5 shadow-md"
                  style={{ backgroundColor: isErr ? '#f43f5e' : 'var(--accent-hex)' }}
                >
                  <Bot className="w-4 h-4 text-black" />
                </div>
              )}

              <div
                className={`pill ai-coach-bubble max-w-[92%] sm:max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed transition-all duration-300 ${
                  !isAI
                    ? 'bg-white/[0.10] text-inherit rounded-tr-none border border-white/25'
                    : isErr
                    ? 'bg-rose-500/10 text-rose-300 rounded-tl-none border border-rose-500/30'
                    : 'bg-white/[0.08] text-inherit rounded-tl-none border border-white/30'
                }`}
              >
                <p className="whitespace-pre-line break-words font-sans">{msg.content || ''}</p>

                {/* Show details toggle for coach errors */}
                {isErr && (
                  <div className="mt-2 pt-1.5 border-t border-rose-500/20">
                    <button
                      type="button"
                      onClick={() => toggleErrorDetails(msg.id || '')}
                      className="text-[10px] text-rose-300 hover:text-rose-200 underline font-semibold cursor-pointer"
                    >
                      {expandedErrorIds[msg.id || ''] ? 'Hide details' : 'Show details'}
                    </button>
                    {expandedErrorIds[msg.id || ''] && (
                      <div className="mt-1.5 p-2 rounded-lg bg-black/50 border border-rose-500/30 font-mono text-[9px] text-rose-200 break-words select-text">
                        {msg.errorDetails || 'HTTP status / connection details unavailable. Verify VITE_GEMINI_API_KEY in build.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Undo Button on messages that modified routine */}
                {msg.didModifyRoutine && undoState && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-400 font-semibold">Split modified</span>
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>Undo</span>
                    </button>
                  </div>
                )}

                {/* Confirmation Card for Destructive Actions */}
                {proposal && (
                  <div className="pill mt-3 p-3 rounded-xl bg-white/[0.08] border border-amber-400/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{proposal.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-200">{proposal.summary}</p>

                    {proposal.status === 'pending' && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(msg.id || '', (msg as any).pendingToolCalls)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase flex items-center justify-center gap-1 shadow cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>CONFIRM & EXECUTE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelAction(msg.id || '')}
                          className="flex-1 py-1.5 px-3 rounded-xl border border-white/20 hover:bg-white/10 text-slate-300 font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>CANCEL</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[8px] text-slate-500 dark:text-slate-300/80 mt-1 text-right font-mono">
                  {msg.timestamp || 'Just now'}
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
            <span className="font-mono text-[10px]">Evaluating message & split tool execution...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock & Suggestion Chips */}
      <div className="ai-coach-bottom-panel shrink-0 p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none shrink-0">
          {(() => {
            const firstEx = currentRoutine?.parsedDays?.[0]?.exercises?.[0]?.name || 'Bench Press';
            const secondDay = currentRoutine?.parsedDays?.[1]?.dayTitle
              ? (currentRoutine.parsedDays[1].dayTitle.split(/[:\-–]/)[0].trim() || 'Day 2')
              : 'Day 2';
            const dynamicChips = [
              `Swap ${firstEx}`,
              `Add an exercise to ${secondDay}`,
              'Why this split?',
              'Make Day 1 shorter',
            ];

            return dynamicChips.map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => executeSendMessage(promptText)}
                disabled={chatLoading}
                className="ai-quick-chip text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Zap className="w-3 h-3 text-emerald-400 inline-block mr-1" />
                <span>{promptText}</span>
              </button>
            ));
          })()}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask coach to modify split, swap exercises, or ask a training question..."
            className="flex-1 text-xs rounded-full bg-white/10 border border-white/15 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-white/30 font-sans"
          />

          <button
            type="submit"
            disabled={!inputMsg.trim() || chatLoading}
            className="p-2.5 rounded-full text-black font-extrabold transition-all cursor-pointer disabled:opacity-40 shadow-md shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-hex)' }}
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICoachChatSection;
