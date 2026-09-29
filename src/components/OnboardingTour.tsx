import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigateTab,
}) => {
  const [step, setStep] = React.useState(1);

  if (!isOpen) return null;

  const tourSteps = [
    {
      id: 1,
      title: "Step 1: Overhaul Fitness Dashboard",
      targetTab: "dashboard",
      description: "Welcome to your command center! Tapping any status widget (Water, Calorie rings, Steps ring) immediately expands it to display detailed metrics, suggestions, and logging tools.",
      tip: "Try tapping on the Water widget later to test it out!"
    },
    {
      id: 2,
      title: "Step 2: Biometrics & AI Muscle Audits",
      targetTab: "biometrics",
      description: "Navigate to the Biometrics tab to track your weight, lean muscle percentages, and upload multi-angle physical check-in photos for instant AI Posture audits and dynamic strength rating scans.",
      tip: "Unlogged muscle groups will display as 'Unassessed' until you log relevant exercises in the Tracker."
    },
    {
      id: 3,
      title: "Step 3: Native Samsung Health Connect",
      targetTab: "settings",
      description: "Manage real-time hardware telemetry! Link your Google Account and Samsung Health Connect natively to fetch steps counts and sleep records in the background.",
      tip: "Toggles are readily accessible inside your App Control Center settings page."
    },
    {
      id: 4,
      title: "Step 4: Social & Address Book Sync",
      targetTab: "friends",
      description: "Sync with your fitness crew! Tap 'Sync Contacts' in the Social page to request native permission and discover address book contacts already registered as verified Overhaul athletes.",
      tip: "Compete on the leaderboards based on your BPL scores!"
    },
    {
      id: 5,
      title: "Step 5: Overhaul AI Fitness Coach",
      targetTab: "dashboard",
      description: "Tap the floating Sparkles button at the bottom-right of any screen to slide up the real-time AI Workout Split Adaptor. Instruct the AI to skip leg day or adapt to your busy schedule.",
      tip: "Try simulating voice dictation by clicking the Mic icon in the chat dock!"
    }
  ];

  const currentStepData = tourSteps[step - 1];

  const handleNext = () => {
    if (step < 5) {
      const nextStep = step + 1;
      setStep(nextStep);
      onNavigateTab(tourSteps[nextStep - 1].targetTab);
    } else {
      // Complete Tour
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      onNavigateTab(tourSteps[prevStep - 1].targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none pointer-events-none font-sans">
      {/* Dim overlay without heavy blur */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />
      
      {/* Spotlight Effect - Purely visual focus */}
      <div 
        className="absolute w-40 h-40 rounded-full border-2 border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out pointer-events-none z-10"
        style={{
          top: currentStepData.targetTab === 'dashboard' ? '50%' : currentStepData.targetTab === 'biometrics' ? '30%' : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderColor: 'var(--accent-hex)',
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px var(--accent-hex)`
        }}
      />

      {/* Directional Arrow */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute z-20 pointer-events-none"
        style={{
          top: 'calc(50% - 120px)',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <ArrowRight className="w-8 h-8 rotate-90" style={{ color: 'var(--accent-hex)' }} />
      </motion.div>

      {/* Tour Modal - Sharp and Compact */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl p-4 space-y-3 border bg-slate-900/95 border-white/20 shadow-2xl relative pointer-events-auto z-50 mt-40"
        style={{
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
        }}
      >
        {/* Step Indicator Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-hex)' }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              System Tour
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {step} / 5
          </span>
        </div>

        {/* Tour Title */}
        <div className="space-y-1">
          <h2 className="text-sm font-black text-white uppercase tracking-tight">
            {currentStepData.title}
          </h2>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${(step / 5) * 100}%`,
                backgroundColor: 'var(--accent-hex)'
              }}
            />
          </div>
        </div>

        {/* Tour Description Body */}
        <div className="space-y-2 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <p className="text-[11px] text-slate-200 leading-normal font-medium">
            {currentStepData.description}
          </p>
          <div className="flex items-start gap-1 text-[10px] text-amber-300/80 font-medium italic">
            <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{currentStepData.tip}</span>
          </div>
        </div>

        {/* Tour Action Dock */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 disabled:opacity-30 cursor-pointer"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg text-black font-black text-[10px] uppercase flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
              style={{ backgroundColor: 'var(--accent-hex)' }}
            >
              <span>{step === 5 ? 'Start' : 'Next'}</span>
              <ChevronRight className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
