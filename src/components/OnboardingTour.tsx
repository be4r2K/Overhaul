import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, X, HelpCircle } from 'lucide-react';
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
  onNavigateTab,
}) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const tourSteps = [
    {
      id: 1,
      title: "1. STATS & GRIDS TARGETS",
      targetTab: "dashboard",
      description: "Keep track of today's hydration, sports calorie burn, and steps. Tapping any grid panel expands it for detailed analytics.",
      tip: "Tap on any metric card to expand deep analytics!"
    },
    {
      id: 2,
      title: "2. BIOMETRICS & PHYSIQUE AUDIT",
      targetTab: "biometrics",
      description: "Monitor body weight, BMI, and BPL athletic scores. Launch the AI Physique Scanner directly for muscular audits.",
      tip: "Log lifts in the Tracker to unlock muscle ratings."
    },
    {
      id: 3,
      title: "3. HEALTH CONNECT & GPS SYNC",
      targetTab: "settings",
      description: "Manage native telemetry and sensor sync. Enable Samsung Health & GPS lock to pull real-time data seamlessly.",
      tip: "Accurate phone GPS gives real-time local weather."
    },
    {
      id: 4,
      title: "4. SOCIAL & ATHLETE PASSCODES",
      targetTab: "friends",
      description: "Share your dynamic athlete passcode to connect with friends, sync address book contacts, and maintain daily streaks.",
      tip: "Your dynamic passcode is derived from your name!"
    },
    {
      id: 5,
      title: "5. AI SPLIT COACH (FLOATING FAB)",
      targetTab: "dashboard",
      description: "The floating Sparkles FAB opens the AI Workout Split Adaptor to instantly adapt workouts and discuss routines.",
      tip: "Tap the spark FAB anytime to launch the coach."
    }
  ];

  const currentStepData = tourSteps[step - 1];

  const handleDismiss = () => {
    localStorage.setItem('hasCompletedTour', 'true');
    localStorage.setItem('overhaul_onboarding_completed_v4', 'true');
    onClose();
  };

  const handleNext = () => {
    if (step < tourSteps.length) {
      const nextStep = step + 1;
      setStep(nextStep);
      onNavigateTab(tourSteps[nextStep - 1].targetTab);
    } else {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      handleDismiss();
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
    <div className="fixed inset-0 z-50 select-none font-sans pointer-events-none">
      {/* Crisp, transparent light overlay without heavy blur */}
      <div 
        className="absolute inset-0 bg-black/30 pointer-events-auto transition-opacity" 
        onClick={handleDismiss} 
      />

      {/* Slim, Compact Tour Modal Card positioned near bottom above tab bar (No glowing spotlight rings) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[320px] w-[90vw] pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl p-3.5 space-y-2 border border-white/20 bg-neutral-950 text-white shadow-2xl relative"
          >
            {/* Header with Step indicator and explicit 'X' Close Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-hex, #10B981)' }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
                  QUICK TOUR · {step}/{tourSteps.length}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Tour"
                aria-label="Close Tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-tight font-sans">
                {currentStepData.title}
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                {currentStepData.description}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-medium italic pt-0.5">
                <HelpCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentStepData.tip}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 disabled:opacity-20 cursor-pointer transition-colors"
              >
                Back
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3 py-1.5 rounded-xl text-black font-extrabold text-[10px] uppercase flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--accent-hex, #10B981)' }}
                >
                  <span>{step === tourSteps.length ? 'Finish' : 'Next'}</span>
                  <ChevronRight className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
