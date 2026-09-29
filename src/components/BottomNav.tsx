import React from 'react';
import { LayoutDashboard, Dumbbell, Activity, Users, Settings } from 'lucide-react';
import { t } from '../utils/i18n';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, language = 'en' }) => {
  const tabs = [
    { id: 'gym', label: 'Tracker', icon: Dumbbell },
    { id: 'biometrics', label: t('biometrics', language), icon: Activity },
    { id: 'dashboard', label: t('dashboard', language), icon: LayoutDashboard, isCenter: true },
    { id: 'friends', label: 'Social', icon: Users },
    { id: 'settings', label: t('settings', language), icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 px-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {/* Sticky Translucent Frosted Glass Dock */}
        <nav className="glass-panel rounded-2xl p-1.5 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || (tab.id === 'ai-coach' && currentTab.startsWith('ai-coach'));
            const isCenter = tab.isCenter;

            if (isCenter) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center -translate-y-2 relative z-10 transition-all cursor-pointer group"
                >
                  <div
                    className={`p-2.5 rounded-2xl transition-all flex items-center justify-center border ${
                      isActive
                        ? 'shadow-xl scale-105 ring-2 ring-white/25 border-white/30 text-black'
                        : 'bg-slate-850 bg-slate-800/90 text-slate-300 border-white/15 hover:bg-slate-700/90 hover:text-white shadow-lg'
                    }`}
                    style={isActive ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.8]' : 'stroke-[2]'}`} />
                  </div>
                  <span className={`text-[10px] tracking-tight mt-1 truncate max-w-[64px] text-center ${
                    isActive ? 'font-black accent-text' : 'font-semibold text-slate-400 group-hover:text-white'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? '-translate-y-1 text-white font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                    isActive
                      ? 'shadow-md ring-2 ring-white/20'
                      : 'bg-transparent hover:bg-white/5'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.9]'}`} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] text-center ${isActive ? 'font-black accent-text' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
