// src/components/seo/RankMathFloatingBadge.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';

interface RankMathFloatingBadgeProps {
  score?: number;
  onClick: () => void;
  className?: string;
}

export const RankMathFloatingBadge: React.FC<RankMathFloatingBadgeProps> = ({
  score = 94,
  onClick,
  className = ''
}) => {
  const isGood = score >= 80;
  const isFair = score >= 50 && score < 80;

  return (
    <button
      onClick={onClick}
      id="rank-math-seo-trigger-badge"
      title="Open Rank Math SEO Suite Analyzer"
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md transition-all duration-200 hover:scale-105 active:scale-95 ${
        isGood
          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
          : isFair
          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
      } ${className}`}
    >
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
        RM
      </div>
      <span className="text-xs font-bold">SEO {score}/100</span>
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
    </button>
  );
};
