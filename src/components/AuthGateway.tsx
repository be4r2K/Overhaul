import React from 'react';
import { Flame, Sparkles, LogIn, ShieldCheck, Heart, Users } from 'lucide-react';

interface AuthGatewayProps {
  onSignIn: () => void;
  isLoading: boolean;
  theme: any;
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onSignIn,
  isLoading,
  theme,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950 p-4 sm:p-6 font-sans overflow-hidden">
      
      {/* Dynamic Ambient Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ backgroundColor: 'var(--accent-hex)' }}
        />
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ backgroundColor: 'var(--accent-hex)' }}
        />
      </div>

      {/* 1. TOP DOCK: LOGO BRANDING */}
      <div className="flex justify-center select-none pt-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-[2.5px] rounded-2xl ig-story-ring shrink-0 shadow-lg">
            <div className="w-10 h-10 rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
              <Flame className="w-5 h-5 accent-text stroke-[2.5]" />
            </div>
          </div>
          <span 
            className="text-xl sm:text-2xl font-black tracking-widest uppercase inline-block text-white"
            style={{
              textShadow: '0 1px 0 #bbb, 0 2px 0 #aaa, 0 3px 0 #999, 0 4px 1px rgba(0,0,0,.15), 0 0 12px var(--accent-hex)',
              WebkitTextStroke: '0.4px rgba(255,255,255,0.15)'
            }}
          >
            Overhaul
          </span>
        </div>
      </div>

      {/* 2. CORE CENTERPIECE: INTENSITY CAPABILITIES */}
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-md mx-auto space-y-6 shrink-0 z-10 py-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Health intelligence</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
            Overhaul Your Strength, Weather & Biometrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            The ultimate native companion. Monitor live step counts, posture audits, weather-based adaptive cardiovascular splits, and strength tracking in one high-performance interface.
          </p>
        </div>

        {/* Feature Grid Highlights */}
        <div className="w-full grid grid-cols-2 gap-2.5 max-w-sm text-left">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 shadow-sm">
            <Heart className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase">Health Connect</h3>
            <p className="text-[10px] text-slate-400 leading-normal">Live background Samsung sync.</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 shadow-sm">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white uppercase">Social Sync</h3>
            <p className="text-[10px] text-slate-400 leading-normal">Instantly link verified friends.</p>
          </div>
        </div>

        {/* GOOGLE SIGN IN ACTION CTA */}
        <div className="w-full pt-4 max-w-sm">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-5 rounded-2xl text-slate-900 bg-white hover:bg-slate-100 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google Sign-In</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER TERMS */}
      <div className="text-center pb-2 shrink-0 z-10">
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by Google OAuth and Firebase Core encryption</span>
        </div>
      </div>

    </div>
  );
};
