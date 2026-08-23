import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Sparkles, X, ArrowRight, UserPlus, Calendar, Radio } from 'lucide-react';

export interface ProximityAlert {
  id: string;
  type: 'playmate' | 'event';
  title: string;
  subtitle: string;
  distanceKm: number;
  distanceText: string;
  photoUrl?: string;
  avatarEmoji?: string;
  timestamp: number;
  targetId: string;
  address?: string;
  metaBadge?: string;
}

interface ProximityAlertToastProps {
  alerts: ProximityAlert[];
  onDismiss: (alertId: string) => void;
  onView: (alert: ProximityAlert) => void;
}

/**
 * Plays a gentle, subtle audio chime when a new 1km proximity alert arrives
 */
export function playSubtleProximityChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // High, soft chime 1 (G5: 783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // High, soft chime 2 (C6: 1046.50 Hz) - uplifting resolution
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.1);
    gain2.gain.setValueAtTime(0.09, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.debug('Proximity chime audio note:', err);
  }
}

export default function ProximityAlertToast({
  alerts,
  onDismiss,
  onView
}: ProximityAlertToastProps) {
  // Show up to 2 active alerts at once to keep it compact and non-intrusive
  const visibleAlerts = alerts.slice(0, 2);

  if (visibleAlerts.length === 0) return null;

  return (
    <div
      id="proximity-alerts-container"
      aria-live="polite"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[120] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {visibleAlerts.map((alert) => (
        <ProximityAlertItem
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onView={onView}
        />
      ))}
    </div>
  );
}

function ProximityAlertItem({
  alert,
  onDismiss,
  onView
}: {
  alert: ProximityAlert;
  onDismiss: (alertId: string) => void;
  onView: (alert: ProximityAlert) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const DURATION_MS = 6500;
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now() - elapsedRef.current;
    
    const interval = setInterval(() => {
      if (isHovered) {
        // Paused on hover
        startTimeRef.current = Date.now() - elapsedRef.current;
        return;
      }
      
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        onDismiss(alert.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, alert.id, onDismiss]);

  const isPlaymate = alert.type === 'playmate';

  return (
    <div
      id={`proximity-alert-${alert.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto relative overflow-hidden bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 transition-all duration-300 transform hover:scale-[1.01] animate-fade-in ring-1 ring-emerald-400/20"
    >
      {/* Header Tag / Live Proximity Beacon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-300">
            {isPlaymate ? 'New Playmate within 1km' : 'New Event within 1km'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-mono">
            <MapPin className="w-2.5 h-2.5" />
            {alert.distanceText}
          </span>
          <button
            id={`dismiss-proximity-alert-${alert.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            title="Dismiss notification"
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="flex items-center gap-3">
        {/* Avatar / Photo */}
        <div className="relative shrink-0">
          {alert.photoUrl ? (
            <img
              src={alert.photoUrl}
              alt={alert.title}
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-xl shadow-sm border border-emerald-400/40">
              {alert.avatarEmoji || (isPlaymate ? '🧸' : '🎉')}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-emerald-500/40">
            {isPlaymate ? (
              <UserPlus className="w-3 h-3 text-emerald-400" />
            ) : (
              <Calendar className="w-3 h-3 text-amber-400" />
            )}
          </div>
        </div>

        {/* Text descriptions */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-white truncate font-serif">
            {alert.title}
          </h4>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            {alert.subtitle}
          </p>
          {alert.address && (
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
              <span className="truncate">{alert.address}</span>
            </p>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Immediate Walking Radius</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`view-proximity-target-${alert.id}`}
            onClick={() => onView(alert)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg text-[11px] font-black tracking-tight transition shadow-sm"
          >
            <span>{isPlaymate ? 'View Playmate' : 'View Event'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
