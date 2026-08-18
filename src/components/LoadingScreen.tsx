import React, { useState, useEffect } from 'react';
import VernuntLogo from './VernuntLogo.tsx';
import { Sparkles, ArrowRight } from 'lucide-react';

interface LoadingScreenProps {
  onFinished: () => void;
  title?: string;
}

export default function LoadingScreen({ onFinished, title }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const StatusMessages = [
    '🧸 Pinging neighborhood playmate radars...',
    '🎒 Packing backpack lunchboxes with safe allergy checks...',
    '🏫 Checking preschool & toddler playgroup grades...',
    '🎨 Dusting off sketching paintbrushes and lego cups...',
    '🌻 Preparing secure child-friendly safety protocols...',
    '⚽ Aligning nearby outdoor playground drills...'
  ];

  useEffect(() => {
    // Progress speed simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinished();
          }, 450);
          return 100;
        }
        // Multi-stage random increments
        const increment = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onFinished]);

  // Status index rotator
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % StatusMessages.length);
    }, 600);

    return () => clearInterval(statusInterval);
  }, []);

  return (
    <div
      id="loading-screen-backdrop"
      className="fixed inset-0 z-50 bg-gradient-to-b from-amber-50 to-orange-50/50 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
    >
      {/* Playful Floating Sparkles */}
      <div className="absolute top-20 left-10 text-orange-200 animate-bounce pointer-events-none">
        <Sparkles className="w-12 h-12" />
      </div>
      <div className="absolute bottom-24 right-12 text-blue-200 animate-pulse pointer-events-none">
        <Sparkles className="w-16 h-16" strokeWidth={1} />
      </div>
      <div className="absolute top-1/3 right-1/4 text-emerald-200 animate-[bounce_4s_infinite] pointer-events-none">
        <span className="text-4xl">⚽</span>
      </div>
      <div className="absolute bottom-1/3 left-1/5 text-purple-200 animate-pulse pointer-events-none">
        <span className="text-4xl">🎨</span>
      </div>

      <div id="loading-card" className="max-w-md w-full bg-white/60 backdrop-blur-md border border-white p-8 md:p-10 rounded-[3xl] shadow-2xl shadow-orange-500/5 space-y-8 flex flex-col items-center relative animate-fade-in">
        {/* Custom Logo representation */}
        <VernuntLogo size="lg" animated={true} />

        {/* Loading title if defined */}
        {title && (
          <div className="text-center space-y-1">
            <h3 className="text-slate-800 font-bold text-sm font-sans uppercase tracking-widest">{title}</h3>
          </div>
        )}

        {/* Progress & Message indicators */}
        <div className="w-full space-y-4">
          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-orange-400 to-orange-500 transition-all duration-150 ease-out rounded-full"
              style={{ width: `${progress}%` }}
              id="progress-bar-fill"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>SYNCING RADARS</span>
            <span className="font-bold text-slate-700">{progress}%</span>
          </div>
        </div>

        {/* Dynamic Rotating Fun Status Messages */}
        <div className="h-6 flex items-center justify-center">
          <p
            id="loading-status-message"
            className="text-xs font-bold text-slate-600 transition-all duration-300 transform"
            key={statusIndex}
          >
            {StatusMessages[statusIndex]}
          </p>
        </div>

        {/* Quick Skip button */}
        <button
          id="btn-skip-loading"
          onClick={onFinished}
          type="button"
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
          title="Instant load skip"
        >
          <span>Skip Loading</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      <p className="text-[10px] font-bold tracking-widest text-slate-400 mt-6 uppercase">
        VERNUNT • SAFETY SECURED PRIVACY SYSTEM
      </p>
    </div>
  );
}
