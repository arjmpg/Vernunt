import React, { useState, useRef, useEffect } from 'react';
import { ChildProfile } from '../types.ts';
import { calculateMatchScore } from './PlaymateCard.tsx';
import { getHaversineDistance, getProximityBadge } from '../utils/distance.ts';
import { 
  Heart, 
  X, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  MapPin, 
  Info, 
  MessageCircle, 
  Bookmark, 
  Check, 
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Award,
  Maximize2,
  Minimize2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlaymateSwipeDeckProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  onSelectPlaymate?: (profile: ChildProfile) => void;
  onOpenDetailModal: (profile: ChildProfile) => void;
  connectedIds?: string[];
  interestsSent?: string[];
  interestsReceived?: string[];
  savedProfileIds?: string[];
  onToggleSave?: (id: string) => void;
  onSendConnection: (partnerId: string) => void;
  onAcceptConnection: (partnerId: string) => void;
  maxDistanceKm?: number;
  onExpandDistance?: () => void;
}

export function PlaymateSwipeDeck({
  playmates = [],
  userProfile,
  onSelectPlaymate,
  onOpenDetailModal,
  connectedIds = [],
  interestsSent = [],
  interestsReceived = [],
  savedProfileIds = [],
  onToggleSave,
  onSendConnection,
  onAcceptConnection,
  maxDistanceKm = 10,
  onExpandDistance
}: PlaymateSwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ profile: ChildProfile; action: 'pass' | 'wave' | 'super' }[]>([]);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [swipeFeedback, setSwipeFeedback] = useState<'wave' | 'pass' | 'super' | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const userLat = userProfile?.location?.lat ?? 12.9716;
  const userLng = userProfile?.location?.lng ?? 77.5946;

  // Handle body scrolling lock when in fullscreen mode
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullScreen(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        triggerPass();
      } else if (e.key === 'ArrowRight') {
        triggerWave();
      } else if (e.key === 'ArrowUp') {
        triggerSuperWave();
      } else if (e.key === 'Backspace') {
        triggerRewind();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, currentIndex]);

  // Profiles left in current deck
  const activeDeck = (playmates || []).slice(currentIndex);
  const currentProfile = activeDeck[0] as ChildProfile | undefined;
  const nextProfile = activeDeck[1] as ChildProfile | undefined;
  const thirdProfile = activeDeck[2] as ChildProfile | undefined;

  // Calculate stats for current profile
  const matchResult = currentProfile ? calculateMatchScore(userProfile, currentProfile, userLat, userLng) : null;
  const matchScore = matchResult ? matchResult.score : 85;
  const distance = currentProfile 
    ? getHaversineDistance(userLat, userLng, currentProfile.location.lat, currentProfile.location.lng)
    : 0;
  const proxBadge = getProximityBadge(distance);

  const isConnected = currentProfile && Array.isArray(connectedIds) ? connectedIds.includes(currentProfile.id) : false;
  const isSent = currentProfile && Array.isArray(interestsSent) ? interestsSent.includes(currentProfile.id) : false;
  const isReceived = currentProfile && Array.isArray(interestsReceived) ? interestsReceived.includes(currentProfile.id) : false;
  const isSaved = currentProfile && Array.isArray(savedProfileIds) ? savedProfileIds.includes(currentProfile.id) : false;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!currentProfile) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragOffset({ x: dx, y: dy });

    if (dy < -80 && Math.abs(dx) < 70) {
      setSwipeFeedback('super');
    } else if (dx > 50) {
      setSwipeFeedback('wave');
    } else if (dx < -50) {
      setSwipeFeedback('pass');
    } else {
      setSwipeFeedback(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 90;
    if (dragOffset.y < -110 && Math.abs(dragOffset.x) < 80) {
      triggerSuperWave();
    } else if (dragOffset.x > threshold) {
      triggerWave();
    } else if (dragOffset.x < -threshold) {
      triggerPass();
    }

    setDragOffset({ x: 0, y: 0 });
    setSwipeFeedback(null);
    if (cardRef.current && cardRef.current.hasPointerCapture(e.pointerId)) {
      cardRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const triggerPass = () => {
    if (!currentProfile) return;
    setHistory(prev => [...prev, { profile: currentProfile, action: 'pass' }]);
    setCurrentIndex(prev => prev + 1);
  };

  const triggerWave = () => {
    if (!currentProfile) return;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 }
    });

    if (isReceived) {
      onAcceptConnection(currentProfile.id);
    } else if (!isConnected && !isSent) {
      onSendConnection(currentProfile.id);
    }

    setHistory(prev => [...prev, { profile: currentProfile, action: 'wave' }]);
    setCurrentIndex(prev => prev + 1);
  };

  const triggerSuperWave = () => {
    if (!currentProfile) return;
    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.6 }
    });

    if (isReceived) {
      onAcceptConnection(currentProfile.id);
    } else if (!isConnected && !isSent) {
      onSendConnection(currentProfile.id);
    }

    setHistory(prev => [...prev, { profile: currentProfile, action: 'super' }]);
    setCurrentIndex(prev => prev + 1);
  };

  const triggerRewind = () => {
    if (history.length === 0 || currentIndex === 0) return;
    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setHistory([]);
  };

  // Rotation and transform calculation
  const rotateDeg = dragOffset.x * 0.08;

  return (
    <div 
      id="playmate-swipe-container" 
      className={
        isFullScreen
          ? "fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden animate-fade-in"
          : "w-full max-w-lg sm:max-w-xl mx-auto flex flex-col items-center select-none pt-1 pb-6 px-2 sm:px-4"
      }
    >
      {/* Top Deck Stats & Counter */}
      <div className={`w-full flex items-center justify-between px-2 mb-3 text-xs font-semibold ${isFullScreen ? 'text-white/80 max-w-xl mx-auto' : 'text-slate-500'}`}>
        <div className="flex items-center gap-1.5 bg-rose-500/15 text-rose-600 px-3 py-1 rounded-full font-extrabold border border-rose-500/20 backdrop-blur-md">
          <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Neighborhood Playmates</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-mono text-[11px] ${isFullScreen ? 'text-white/70' : 'text-slate-400'}`}>
            {playmates.length > 0 ? `${Math.min(currentIndex + 1, playmates.length)} of ${playmates.length}` : '0 of 0'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isFullScreen ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
            ≤ {maxDistanceKm} km
          </span>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            id="btn-toggle-fullscreen-swipe"
            onClick={() => setIsFullScreen(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer active:scale-95 shadow-xs ${
              isFullScreen
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title={isFullScreen ? "Exit Full Screen (Esc)" : "Expand Swipe Card to Full Screen (F)"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Deck Stack Arena - Fullscreen or Full-Height */}
      <div 
        className={
          isFullScreen
            ? "relative w-full max-w-lg sm:max-w-xl h-[calc(100dvh-140px)] mx-auto flex items-center justify-center"
            : "relative w-full h-[calc(100dvh-220px)] min-h-[580px] max-h-[760px] sm:max-h-[820px] flex items-center justify-center"
        }
      >
        {currentProfile ? (
          <>
            {/* Third Card in Stack */}
            {thirdProfile && (
              <div 
                className="absolute w-full h-full rounded-[32px] bg-slate-900/60 border border-slate-700/50 shadow-xs pointer-events-none transition-all duration-300 transform scale-90 translate-y-7 opacity-30 overflow-hidden"
              />
            )}

            {/* Second Card in Stack (Full bleed preview) */}
            {nextProfile && (
              <div 
                className="absolute w-full h-full rounded-[32px] bg-slate-900 border border-slate-800 shadow-lg pointer-events-none transition-all duration-300 transform scale-95 translate-y-3.5 opacity-85 overflow-hidden"
              >
                <img 
                  src={nextProfile.photoUrl || nextProfile.parentPhotoUrl} 
                  alt={nextProfile.parentName}
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h3 className="text-xl font-black">{nextProfile.parentName}</h3>
                  <p className="text-xs text-white/80">{nextProfile.childName}'s {nextProfile.parentGender || 'Parent'}</p>
                </div>
              </div>
            )}

            {/* Top Active Interactive Card (Full Bleed Edge-to-Edge Canvas) */}
            <div
              ref={cardRef}
              id={`swipe-card-${currentProfile.id}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotateDeg}deg)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
              className={`absolute w-full h-full rounded-[32px] bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between transition-transform select-none ${
                isDragging ? 'duration-0' : 'duration-300 ease-out'
              }`}
            >
              {/* Full Screen Background Image */}
              <img
                src={currentProfile.photoUrl || currentProfile.parentPhotoUrl}
                alt={currentProfile.parentName}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Protective Layers */}
              {/* Top Vignette for Badges */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none" />
              {/* Bottom Gradient for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 via-45% to-transparent pointer-events-none" />

              {/* Visual Swipe Feedback Badges */}
              {swipeFeedback === 'wave' && (
                <div className="absolute top-8 left-8 z-30 transform -rotate-12 border-4 border-emerald-500 bg-emerald-500/90 text-white font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-2xl shadow-lg animate-pulse">
                  WAVE 👋
                </div>
              )}
              {swipeFeedback === 'pass' && (
                <div className="absolute top-8 right-8 z-30 transform rotate-12 border-4 border-rose-500 bg-rose-500/90 text-white font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-2xl shadow-lg animate-pulse">
                  PASS ✕
                </div>
              )}
              {swipeFeedback === 'super' && (
                <div className="absolute top-12 inset-x-0 mx-auto w-max z-30 border-4 border-amber-400 bg-amber-400 text-slate-900 font-black text-xl uppercase tracking-widest px-5 py-1.5 rounded-2xl shadow-lg animate-bounce">
                  SUPER WAVE ⭐
                </div>
              )}

              {/* Top Floating Badges Area */}
              <div className="relative z-20 pt-4 px-4 sm:px-5 flex items-center justify-between pointer-events-none">
                {/* Proximity Pill */}
                <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{distance.toFixed(1)} km • {proxBadge.label}</span>
                </span>

                {/* Compatibility Score & Quick Fullscreen Button */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>{matchScore}% Match</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullScreen(prev => !prev);
                    }}
                    className="p-2 bg-black/60 hover:bg-black/85 backdrop-blur-md text-white rounded-full border border-white/20 shadow-md transition cursor-pointer active:scale-90"
                    title={isFullScreen ? "Exit Fullscreen" : "Full Screen"}
                  >
                    {isFullScreen ? (
                      <Minimize2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mother / Safety Badge */}
              {currentProfile.parentGender === 'Mother' && (
                <div className="relative z-20 px-4 sm:px-5 mt-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-rose-400/40">
                    👩 Mom Verified
                  </span>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1 pointer-events-none" />

              {/* Bottom Card Content Overlaid on Full Screen Photo */}
              <div className="relative z-20 p-5 sm:p-6 text-white space-y-3">
                <div>
                  {/* Parent Name & Verification */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                      {currentProfile.parentName}
                    </h2>
                    {(currentProfile.aadhaarVerified || currentProfile.digilockerVerified) && (
                      <span title="Aadhaar / DigiLocker Verified Indian Guardian">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 fill-emerald-500/30 drop-shadow" />
                      </span>
                    )}
                  </div>

                  {/* Child & Relation Info */}
                  <p className="text-sm font-semibold text-rose-200/95 mt-1 drop-shadow-sm flex items-center gap-2 flex-wrap">
                    <span>{currentProfile.childName}'s {currentProfile.parentGender || 'Parent'}</span>
                    <span className="text-white/50">•</span>
                    <span>Kid: {currentProfile.childAge} yrs ({currentProfile.gradeLevel})</span>
                  </p>

                  {/* Location Address / Area */}
                  {currentProfile.location?.address && (
                    <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{currentProfile.location.address}</span>
                    </p>
                  )}
                </div>

                {/* Hobbies / Interests Pills (Glassmorphic) */}
                <div className="flex flex-wrap gap-1.5">
                  {currentProfile.interests?.slice(0, 5).map((interest, i) => {
                    const isMatching = matchResult?.matchingInterests?.some(
                      mi => mi.toLowerCase().trim() === interest.toLowerCase().trim()
                    );
                    return (
                      <span 
                        key={i} 
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md transition ${
                          isMatching
                            ? 'bg-rose-500/85 text-white border border-rose-400/50 shadow-xs'
                            : 'bg-white/20 text-white/95 border border-white/25'
                        }`}
                      >
                        {isMatching && '✨ '}{interest}
                      </span>
                    );
                  })}
                  {(currentProfile.interests?.length ?? 0) > 5 && (
                    <span className="text-[10px] text-white/70 font-bold self-center">
                      +{(currentProfile.interests?.length ?? 0) - 5} more
                    </span>
                  )}
                </div>

                {/* Bio snippet */}
                <p className="text-xs sm:text-sm text-white/85 line-clamp-2 leading-relaxed font-medium drop-shadow-xs">
                  {currentProfile.bio || "Friendly local parent looking to connect for active weekend park playdates and creative games."}
                </p>

                {/* Quick Info Bar & Tap for full modal */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-white/80">
                    <span className="font-semibold text-white/60">Play Style:</span>
                    <span className="bg-amber-400/25 text-amber-300 border border-amber-400/35 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                      {currentProfile.playStyle || 'Creative & Outdoor'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetailModal(currentProfile);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span>Full Profile</span>
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty Deck State */
          <div className="w-full h-full rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">You've Explored All Nearby Parents!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                You've swiped through all verified profiles within {maxDistanceKm} km. Expand your radar range or shuffle to revisit again.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
              {onExpandDistance && (
                <button
                  type="button"
                  onClick={onExpandDistance}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Expand Radius</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetDeck}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revisit Profiles</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Controls Dock */}
      <div 
        id="swipe-action-dock" 
        className={`flex items-center justify-between mt-4 px-5 ${
          isFullScreen 
            ? 'w-full max-w-sm mx-auto bg-black/60 backdrop-blur-xl py-2.5 rounded-full border border-white/15 shadow-2xl' 
            : 'w-full max-w-xs'
        }`}
      >
        {/* Rewind */}
        <button
          type="button"
          id="btn-swipe-rewind"
          onClick={triggerRewind}
          disabled={history.length === 0 || currentIndex === 0}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-sm ${
            history.length > 0 && currentIndex > 0
              ? isFullScreen 
                ? 'bg-white/20 hover:bg-white/30 text-amber-300 border-white/20 hover:scale-110 active:scale-95' 
                : 'bg-white hover:bg-amber-50 text-amber-600 border-amber-200 hover:scale-110 active:scale-95'
              : isFullScreen
                ? 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
          }`}
          title="Rewind previous card (Backspace)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pass (Left) */}
        <button
          type="button"
          id="btn-swipe-pass"
          onClick={triggerPass}
          disabled={!currentProfile}
          className="w-14 h-14 rounded-full bg-white hover:bg-rose-50 text-rose-500 border-2 border-rose-200 hover:border-rose-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Pass profile (Swipe Left / ←)"
        >
          <X className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Super Wave (Up) */}
        <button
          type="button"
          id="btn-swipe-superwave"
          onClick={triggerSuperWave}
          disabled={!currentProfile}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 border border-amber-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Super Wave Priority (Swipe Up / ↑)"
        >
          <Sparkles className="w-5 h-5 fill-slate-950" />
        </button>

        {/* Wave / Connect (Right) */}
        <button
          type="button"
          id="btn-swipe-wave"
          onClick={triggerWave}
          disabled={!currentProfile}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Wave & Connect (Swipe Right / →)"
        >
          <Heart className="w-6 h-6 fill-white stroke-[2.5]" />
        </button>

        {/* Save / Bookmark */}
        {currentProfile && onToggleSave && (
          <button
            type="button"
            id="btn-swipe-save"
            onClick={() => onToggleSave(currentProfile.id)}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-sm ${
              isSaved 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : isFullScreen
                  ? 'bg-white/20 hover:bg-white/30 text-white border-white/20 hover:scale-110 active:scale-95'
                  : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200 hover:scale-110 active:scale-95'
            }`}
            title={isSaved ? "Saved to Favorites" : "Save Profile"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Swipe Tips for Users */}
      <div className={`mt-2.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider ${isFullScreen ? 'text-white/60' : 'text-slate-400'}`}>
        <span>← Pass</span>
        <span>•</span>
        <span>Wave →</span>
        <span>•</span>
        <span>{isFullScreen ? 'Esc to Exit' : 'F for Full Screen'}</span>
      </div>
    </div>
  );
}
