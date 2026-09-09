import React, { useEffect, useState } from 'react';
import { Bell, HeartHandshake, Calendar, X, ArrowRight } from 'lucide-react';
import { subscribeToForegroundPush, PushNotificationPayload } from '../../utils/fcmMessaging.ts';

interface ForegroundPushToastProps {
  onNavigateTab?: (tab: string, meta?: any) => void;
}

export default function ForegroundPushToast({ onNavigateTab }: ForegroundPushToastProps) {
  const [activeNotification, setActiveNotification] = useState<PushNotificationPayload | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToForegroundPush((notification) => {
      setActiveNotification(notification);

      // Audio notification chime (synthesized gentle chime)
      try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch (e) {
        // Silent catch for autoplay restrictions
      }

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        setActiveNotification((prev) => (prev === notification ? null : prev));
      }, 8000);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!activeNotification) return null;

  const isPlaydate = activeNotification.type === 'playdate_request' || activeNotification.type === 'playdate_confirmed';
  const isEvent = activeNotification.type === 'event_reminder';

  const handleAction = () => {
    if (onNavigateTab) {
      if (isPlaydate) {
        onNavigateTab('planner', activeNotification.metadata);
      } else if (isEvent) {
        onNavigateTab('events', activeNotification.metadata);
      } else {
        onNavigateTab('planner');
      }
    } else if (activeNotification.url) {
      window.location.href = activeNotification.url;
    }
    setActiveNotification(null);
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-[100] animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-orange-500/30 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-orange-500/30">
          {isPlaydate ? (
            <HeartHandshake className="w-5 h-5" />
          ) : isEvent ? (
            <Calendar className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isPlaydate ? 'Playdate Alert' : isEvent ? 'Event Reminder' : 'Vernunt Notification'}
            </span>
            <button
              onClick={() => setActiveNotification(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-white line-clamp-1">
            {activeNotification.title}
          </h4>
          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
            {activeNotification.body}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
            >
              <span>{isPlaydate ? 'View Playdate' : isEvent ? 'View Pass' : 'Open'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveNotification(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
