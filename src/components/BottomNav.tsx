import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Activity, Dumbbell, Bike, Sparkles } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Fullscreen scroll listener: once scroll down, hide bottom bar; when scroll up, reveal it
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // If scrolled down by more than 10px and past top banner, hide bar for fullscreen view
      if (currentY > lastScrollY.current + 8 && currentY > 40) {
        setIsVisible(false);
      } 
      // If scrolled up by more than 8px or near top of page, reveal bar
      else if (currentY < lastScrollY.current - 8 || currentY <= 20) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'biometrics', label: 'Biometrics', icon: Activity },
    { id: 'ai-workouts', label: 'AI Notes', icon: Sparkles },
    { id: 'dashboard', label: 'Main', icon: LayoutDashboard, isCenter: true },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'sports', label: 'Sports', icon: Bike },
  ];

  return (
    <div 
      className={`fixed bottom-4 sm:bottom-6 inset-x-0 mx-auto w-[92%] max-w-md z-40 transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-28 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Floating Instagram Frosted Glass Dock */}
      <nav className="ig-glass-card rounded-full p-1.5 shadow-2xl border border-white/20 backdrop-blur-2xl flex items-center justify-between px-2 bg-slate-950/75 dark:bg-slate-950/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'text-white font-extrabold'
                  : tab.isCenter
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  isActive
                    ? 'accent-bg text-black shadow-md ring-2 ring-white/20'
                    : tab.isCenter
                    ? 'bg-white/10 hover:bg-white/15'
                    : 'bg-transparent hover:bg-white/5'
                }`}
                style={isActive ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.9]'}`} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${isActive ? 'font-black accent-text' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
