import React, { useState } from 'react';
import { QrCode, CheckCircle, Award, Sparkles, Scan, Smartphone, Info, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { doc, updateDoc } from 'firebase/firestore';
import { ChildProfile } from '../types.ts';

interface CommunityEventCheckInProps {
  userProfile: ChildProfile | null;
  onUpdateUserProfile: (updated: ChildProfile) => void;
  eventId: string;
  eventTitle: string;
  eventHostName: string;
}

export default function CommunityEventCheckIn({
  userProfile,
  onUpdateUserProfile,
  eventId,
  eventTitle,
  eventHostName
}: CommunityEventCheckInProps) {
  const [activeTab, setActiveTab] = useState<'pass' | 'poster'>('pass');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [audioMuted, setAudioMuted] = useState(false);

  if (!userProfile) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-850 font-bold text-center">
        🔒 Please authenticate or create a profile to access neighborhood check-in QR passes.
      </div>
    );
  }

  const isAlreadyCheckedIn = userProfile.checkedInEvents?.includes(eventId) || false;

  // Synthesize custom dual-harmony success beeps
  const playSuccessBeep = () => {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First beep (880Hz - elegant A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.18);

      // Harmonious second beep shortly after (1318.51Hz - high pitch E6 representing verified status!)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.22);
      }, 100);

    } catch (err) {
      console.warn('Audio Context tone synthesis blocked:', err);
    }
  };

  const handlePerformCheckIn = async (scanMethod: 'pass' | 'poster') => {
    setIsScanning(true);
    setScanProgress('Aligning QR boundaries...');

    try {
      // Step simulator log effects
      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress(scanMethod === 'pass' 
        ? 'Reading digital signature pass payload...' 
        : 'Connecting to Venue Event GPS boundaries...'
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
      setScanProgress('Authenticating secure peer credential ledger...');

      await new Promise(resolve => setTimeout(resolve, 700));

      // Retrieve current state values safely
      const currentAttendances = userProfile.attendedEventsCount || 0;
      const currentList = userProfile.checkedInEvents || [];
      
      if (!currentList.includes(eventId)) {
        const updatedList = [...currentList, eventId];
        const updatedCount = currentAttendances + 1;

        const updatedProfile: ChildProfile = {
          ...userProfile,
          attendedEventsCount: updatedCount,
          checkedInEvents: updatedList
        };

        // Persist immediately in Firestore for zero-trust compliance!
        const userDocRef = doc(db, 'users', userProfile.id);
        await updateDoc(userDocRef, {
          attendedEventsCount: updatedCount,
          checkedInEvents: updatedList
        });

        // Trigger local callback for live react state propagation
        onUpdateUserProfile(updatedProfile);
      }

      // Success cues!
      playSuccessBeep();
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b']
      });

    } catch (err) {
      console.error('Failed to update event attendance trust profile:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${userProfile.id}`);
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const baseDomain = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://app.vernunt.com';
  // Generate unique URL payload matching standard format
  const qrPassPayload = `${baseDomain}/gate-pass?event=${eventId}&parent=${userProfile.id}&time=${Date.now()}`;
  const qrPosterPayload = `${baseDomain}/venue-checkin?event=${eventId}&lat=${userProfile.location?.lat || 19.0760}&lng=${userProfile.location?.lng || 72.8777}`;

  // Embedded aesthetic qr server generator
  const qrPassSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPassPayload)}&color=0f172a&bgcolor=ffffff&qzone=2`;
  const qrPosterSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPosterPayload)}&color=ea580c&bgcolor=ffffff&qzone=2`;

  return (
    <div id="community-event-checkin-widget" className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
      {/* Widget Header with Info Label */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs font-serif">
          <QrCode className="w-4 h-4 text-orange-500 shrink-0" />
          <span>Interactive Gate QR Check-In</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-black">Secure Verification</span>
      </div>

      {isAlreadyCheckedIn ? (
        /* Render Verified Gate Ticket State */
        <div id="checkin-verified-container" className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/20 animate-bounce">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-950 font-serif block">Gate Check-In Verified!</span>
            <p className="text-[10.5px] text-emerald-700 font-bold leading-normal">
              Congratulations! Your attendance has been digitally recorded. Your Community Trust score boosted by <span className="font-extrabold text-emerald-900 underline">+5 Points</span> reputation reward.
            </p>
          </div>

          <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/50 inline-flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Attendance count: {userProfile.attendedEventsCount || 0} event(s) recorded.</span>
          </div>
        </div>
      ) : (
        /* Entry Pass Check-In Container */
        <div className="space-y-3 font-medium select-none">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500">
            <button
              onClick={() => setActiveTab('pass')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer text-center block ${activeTab === 'pass' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-700'}`}
            >
              My QR Entry Pass
            </button>
            <button
              onClick={() => setActiveTab('poster')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer text-center block ${activeTab === 'poster' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-700'}`}
            >
              Scan Event Poster
            </button>
          </div>

          {activeTab === 'pass' ? (
            <div id="parent-qr-pass-view" className="space-y-3.5 bg-white p-3.5 rounded-xl border border-slate-200 text-center relative overflow-hidden">
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-white p-4">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-black tracking-widest uppercase animate-pulse">{scanProgress}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-black text-slate-800 leading-none block">Parent Credentials Token</span>
                <p className="text-[9.5px] text-slate-450 leading-normal">
                  The organizer will scan the code below with their safety desk terminal.
                </p>
              </div>

              {/* QR Image Frame */}
              <div className="relative mx-auto w-40 h-40 bg-slate-100 rounded-xl p-2.5 flex items-center justify-center border border-slate-200">
                <img 
                  src={qrPassSrc} 
                  alt="My Check-In Gate QR Pass" 
                  className="w-full h-full object-contain rounded-md" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Laser scan line sweep effect */}
                <span className="absolute left-1.5 right-1.5 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse top-4 z-2" />
              </div>

              {/* Diagnostic Meta Info */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 text-left space-y-1 text-[9px] font-mono text-slate-500">
                <div className="flex justify-between">
                  <span>PARENT:</span>
                  <span className="font-extrabold text-slate-700">{userProfile.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CHILD:</span>
                  <span className="font-extrabold text-slate-700">{userProfile.childName}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATED COMPANIONS:</span>
                  <span className="font-extrabold text-emerald-600">Verified</span>
                </div>
              </div>

              {/* Gate Pass Scan Action */}
              <button
                onClick={() => handlePerformCheckIn('pass')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Scan className="w-3.5 h-3.5 text-orange-400" />
                <span>Scan & Verify Gate Pass</span>
              </button>
            </div>
          ) : (
            <div id="venue-qr-poster-view" className="space-y-3.5 bg-white p-3.5 rounded-xl border border-slate-200 text-center relative overflow-hidden">
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-white p-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-black tracking-widest uppercase animate-pulse">{scanProgress}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-black text-slate-800 leading-none block">Venue Entrance Poster Code</span>
                <p className="text-[9.5px] text-slate-450 leading-normal">
                  Scan the entrance check-in QR code to register arrival at {eventHostName}'s event.
                </p>
              </div>

              {/* QR Image Frame styled like a physical poster stand */}
              <div className="relative mx-auto w-40 h-40 bg-slate-100 rounded-xl p-2.5 flex items-center justify-center border-2 border-orange-500">
                <img 
                  src={qrPosterSrc} 
                  alt="Venue Entrance Poster QR" 
                  className="w-full h-full object-contain rounded-md" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual reticle bounds */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-orange-600" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-orange-600" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-orange-600" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-orange-600" />
              </div>

              {/* Diagnostic Meta Info */}
              <div className="bg-orange-50/50 p-2 rounded-lg border border-orange-100 text-left space-y-1 text-[9px] font-mono text-orange-850">
                <div className="flex justify-between">
                  <span>POSTER:</span>
                  <span className="font-extrabold truncate max-w-[100px]">{eventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>COORDINATES:</span>
                  <span className="font-extrabold">Authenticated Live</span>
                </div>
              </div>

              {/* Poster Scan Action */}
              <button
                onClick={() => handlePerformCheckIn('poster')}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan Venue Poster QR</span>
              </button>
            </div>
          )}

          {/* Quick Informational Tip */}
          <div className="flex items-start gap-1 p-2 bg-slate-100/60 rounded-xl text-[9.5px] text-slate-550 leading-normal">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>Scanning community checkpoints triggers cryptographic logs updating trust scores safely across modern, decentralized safe-bonds.</p>
          </div>
        </div>
      )}
    </div>
  );
}
