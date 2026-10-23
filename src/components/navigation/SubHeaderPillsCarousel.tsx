import React from 'react';
import { Calendar, BookOpen, Users, Sparkles, ChevronRight } from 'lucide-react';

interface SubHeaderPillsCarouselProps {
  activeTab: string;
  onNavigateToTab: (tab: string) => void;
}

export const SubHeaderPillsCarousel: React.FC<SubHeaderPillsCarouselProps> = ({
  activeTab,
  onNavigateToTab
}) => {
  // If activeTab is home, don't show (as user instructed "except home in all other tabs or pages")
  if (activeTab === 'home') return null;

  const quickLinks = [
    {
      id: 'community',
      label: 'Community Hosting',
      icon: Calendar,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-200/90',
      action: () => onNavigateToTab('community')
    },
    {
      id: 'kid_stories',
      label: 'Kids Stories',
      icon: BookOpen,
      iconColor: 'text-rose-600',
      bgColor: 'bg-white hover:bg-slate-50 border-slate-200/90',
      action: () => onNavigateToTab('kid_stories')
    },
    {
      id: 'groups',
      label: 'Vernunt Groups',
      icon: Users,
      iconColor: 'text-rose-600',
      bgColor: 'bg-white hover:bg-slate-50 border-slate-200/90',
      action: () => onNavigateToTab('groups')
    }
  ];

  return (
    <div className="w-full bg-white/95 border-b border-slate-200/80 shadow-2xs py-2.5 px-4 sticky top-14 sm:top-16 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 ${
                isActive 
                  ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/30'
                  : item.bgColor + ' text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${item.iconColor} shrink-0`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
