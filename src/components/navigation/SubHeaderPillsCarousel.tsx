import React from 'react';
import { Calendar, BookOpen, Users, Shield } from 'lucide-react';

interface SubHeaderPillsCarouselProps {
  activeTab: string;
  onNavigateToTab: (tab: string) => void;
  isAdmin?: boolean;
}

export const SubHeaderPillsCarousel: React.FC<SubHeaderPillsCarouselProps> = ({
  activeTab,
  onNavigateToTab,
  isAdmin = false
}) => {
  // If activeTab is home and user is not admin, don't show (as user instructed "except home in all other tabs or pages")
  if (activeTab === 'home' && !isAdmin) return null;

  const quickLinks = [
    // Admin Dashboard link: Display ONLY to admin (arjunmpgupta@gmail.com) and hide from all others
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin Dashboard',
      badge: 'Admin',
      icon: Shield,
      iconColor: 'text-amber-500',
      bgColor: 'bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 hover:from-purple-100 hover:to-indigo-100 border-purple-300 text-purple-950 font-black ring-1 ring-purple-300/60',
      activeColor: 'bg-purple-600 border-purple-700 text-white ring-2 ring-purple-400 shadow-sm',
      action: () => onNavigateToTab('admin')
    }] : []),
    {
      id: 'community',
      label: 'Community Hosting',
      icon: Calendar,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-200/90 text-slate-800',
      activeColor: 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/30',
      action: () => onNavigateToTab('community')
    },
    {
      id: 'kid_stories',
      label: 'Kids Stories',
      icon: BookOpen,
      iconColor: 'text-rose-600',
      bgColor: 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800',
      activeColor: 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/30',
      action: () => onNavigateToTab('kid_stories')
    },
    {
      id: 'groups',
      label: 'Vernunt Groups',
      icon: Users,
      iconColor: 'text-rose-600',
      bgColor: 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800',
      activeColor: 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/30',
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
              id={`subheader-pill-${item.id}`}
              type="button"
              onClick={item.action}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 shrink-0 ${
                isActive 
                  ? item.activeColor
                  : item.bgColor
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive && item.id === 'admin' ? 'text-amber-300' : item.iconColor} shrink-0`} />
              <span>{item.label}</span>
              {item.id === 'admin' && (
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-purple-800 text-purple-200' : 'bg-purple-200/70 text-purple-900'
                }`}>
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
