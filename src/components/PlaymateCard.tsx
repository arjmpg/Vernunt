import React, { useState } from 'react';
import { ChildProfile, VerificationStatus } from '../types.ts';
import { BadgeAlert, ShieldCheck, Heart, MessageSquare, CalendarPlus, User, ShieldAlert, Lock, Unlock, Phone, Sparkles, Zap, Activity, Bookmark, Clock } from 'lucide-react';
import { getHaversineDistance, getProximityBadge } from '../utils/distance.ts';

export function formatLastActive(timestamp?: string): string {
  if (!timestamp) return 'Recently active';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs <= 0) return 'Active now';
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 5) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return 'Over a month ago';
}

export function calculateMatchScore(p1: ChildProfile | null, p2: ChildProfile): {
  score: number;
  breakdown: { interests: number; age: number; playStyle: number };
  matchingInterests: string[];
  isSimulated: boolean;
} {
  // If no user profile exists, we provide a consistent simulated/default match score based on names
  if (!p1) {
    const seedStr = (p2.id || '') + (p2.childName || '') + (p2.parentName || '');
    const charSum = seedStr.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const simulatedScore = 70 + (charSum % 26); // stable value between 70% and 95%
    
    // Pick 1-2 fallback interests from the child profile for UI relevance
    const displayInterests = p2.interests && p2.interests.length > 0
      ? p2.interests.slice(0, Math.min(2, p2.interests.length))
      : ['Playtime Hobbies'];

    return {
      score: simulatedScore,
      breakdown: { 
        interests: Math.min(40, 20 + (charSum % 16)), 
        age: 25, 
        playStyle: Math.min(30, 20 + (charSum % 11)) 
      },
      matchingInterests: displayInterests,
      isSimulated: true
    };
  }

  // 1. Interests Overlap Score (Max 40 points)
  let matchingInterests: string[] = [];
  if (p1.interests && p2.interests) {
    matchingInterests = p2.interests.filter(i => 
      p1.interests.some(ci => {
        const ciClean = ci.toLowerCase().trim();
        const iClean = i.toLowerCase().trim();
        return ciClean === iClean || ciClean.includes(iClean) || iClean.includes(ciClean);
      })
    );
  }
  
  const interestOverlapCount = matchingInterests.length;
  let interestsScore = 10; // default base for potential compatibility
  if (interestOverlapCount > 0) {
    interestsScore = Math.min(20 + interestOverlapCount * 10, 40);
  }

  // 2. Age Group Score (Max 30 points)
  const age1 = p1.childAge * (p1.ageUnit === 'months' ? 1/12 : 1);
  const age2 = p2.childAge * (p2.ageUnit === 'months' ? 1/12 : 1);
  const ageDiff = Math.abs(age1 - age2);
  let ageScore = 5;
  if (ageDiff <= 1) {
    ageScore = 30; // Perfect age peer match
  } else if (ageDiff <= 2) {
    ageScore = 20; // Very close age peer
  } else if (ageDiff <= 3.5) {
    ageScore = 15; // Moderate age peer compatibility
  }

  // 3. Play Style Score (Max 30 points)
  const ps1 = (p1.playStyle || '').toLowerCase().trim();
  const ps2 = (p2.playStyle || '').toLowerCase().trim();
  let playStyleScore = 10;
  if (ps1 === ps2 && ps1.length > 0) {
    playStyleScore = 30;
  } else if (
    (ps1.includes('social') && ps2.includes('social')) ||
    (ps1.includes('active') && ps2.includes('active')) ||
    (ps1.includes('creative') && ps2.includes('creative')) ||
    (ps1.includes('sporty') && ps2.includes('sporty')) ||
    (ps1.includes('educational') && ps2.includes('educational'))
  ) {
    playStyleScore = 25;
  } else if (
    (ps1.includes('social') && ps2.includes('active')) ||
    (ps1.includes('active') && ps2.includes('sporty')) ||
    (ps1.includes('creative') && ps2.includes('educational')) ||
    (ps1.includes('cooperative') && ps2.includes('social'))
  ) {
    playStyleScore = 20;
  }

  const finalScore = Math.min(100, Math.max(30, interestsScore + ageScore + playStyleScore));
  return {
    score: finalScore,
    breakdown: { interests: interestsScore, age: ageScore, playStyle: playStyleScore },
    matchingInterests,
    isSimulated: false
  };
}

interface PlaymateCardProps {
  profile: ChildProfile;
  onInitiatePlaydate: (profile: ChildProfile) => void;
  onOpenChat: (profile: ChildProfile) => void;
  onOpenReport: (profile: ChildProfile) => void;
  onOpenVerify: (profile: ChildProfile) => void;
  isConnected?: boolean;
  isInterestSent?: boolean;
  isInterestReceived?: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onAcceptConnection?: (id: string) => void;
  onSendConnection?: (id: string) => void;
  currentUserLat?: number;
  currentUserLng?: number;
  currentUserProfile?: ChildProfile | null;
  onUnlockPhone?: (targetProfileId: string) => void;
  onNavigateToReferrals?: () => void;
  onBlockProfile?: (id: string) => void;
}

export default function PlaymateCard({ 
  profile, 
  onInitiatePlaydate, 
  onOpenChat, 
  onOpenReport, 
  onOpenVerify,
  isConnected = false,
  isInterestSent = false,
  isInterestReceived = false,
  isSaved = false,
  onToggleSave,
  onAcceptConnection,
  onSendConnection,
  currentUserLat,
  currentUserLng,
  currentUserProfile = null,
  onUnlockPhone,
  onNavigateToReferrals,
  onBlockProfile
}: PlaymateCardProps) {
  const [liked, setLiked] = useState(isInterestSent || isConnected);
  const [activePhotoTab, setActivePhotoTab] = useState<'parent' | 'child'>('parent');

  const isProfileUnlocked = isConnected || !!currentUserProfile?.subscriptionActive;
  const uLat = currentUserLat || 19.0760;
  const uLng = currentUserLng || 72.8777;
  const distKm = getHaversineDistance(uLat, uLng, profile.location.lat, profile.location.lng);
  const proxBadge = getProximityBadge(distKm);

  const parentPhoto = profile.parentPhotoUrl || profile.photoUrl;
  const childPhoto = profile.childPhotoUrl;
  const hasChildPhoto = !!childPhoto && childPhoto.trim().length > 0;
  const currentDisplayPhoto = activePhotoTab === 'parent' ? parentPhoto : (hasChildPhoto ? childPhoto : parentPhoto);

  return (
    <div id={`playmate-card-${profile.id}`} className="bg-white rounded-2xl border border-rose-100/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden hover:border-rose-300">
      {/* Premium Verified Top Badge Bar */}
      <div className="bg-gradient-to-r from-rose-800 via-red-800 to-rose-900 text-white px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="text-[11px] tracking-wide">app.vernunt.com Verified Playmate Proximity</span>
        </div>
        {profile.verificationStatus === VerificationStatus.VERIFIED && (
          <span className="bg-emerald-500 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 fill-white text-emerald-500" /> 100% Aadhaar Verified
          </span>
        )}
      </div>

      {/* Photo Header with Dual Parent (Mandatory) & Child (Optional) Toggle */}
      <div id="card-photo-wrapper" className="relative h-52 bg-slate-900 overflow-hidden group">
        {activePhotoTab === 'parent' ? (
          // Parent Photo Display (MANDATORY VERIFIED)
          <img 
            src={parentPhoto} 
            alt={`Parent/Guardian: ${profile.parentName}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            referrerPolicy="no-referrer"
          />
        ) : (
          // Child Photo Display (OPTIONAL UNDER PRIVACY POLICY)
          hasChildPhoto ? (
            <img 
              src={childPhoto} 
              alt={isProfileUnlocked ? profile.childName : "[🔒 Child Identity Securely Locked]"} 
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isProfileUnlocked ? 'blur-xl saturate-[0.15] brightness-75 select-none' : ''}`} 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-900 flex flex-col items-center justify-center p-4 text-center select-none text-white space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 max-w-[220px]">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-200 block">Child Photo Protected</span>
                <p className="text-[9.5px] text-slate-300 leading-snug">
                  Child photo is optional for privacy. Verified parent photo is active.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoTab('parent');
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-[9px] font-bold transition"
              >
                View Parent Photo 👤
              </button>
            </div>
          )
        )}

        {/* Lock mask for child photo when profile is locked */}
        {activePhotoTab === 'child' && hasChildPhoto && !isProfileUnlocked && (
          <div className="absolute inset-0 bg-slate-950/45 flex flex-col items-center justify-center p-4 text-center select-none z-10 font-serif">
            <Lock className="w-6 h-6 text-amber-400 mb-1.5 animate-pulse" />
            <span className="text-[10px] text-white uppercase font-black tracking-widest font-mono">Pediatric Security Mask</span>
            <span className="text-[9px] text-slate-300 leading-tight max-w-[180px] mt-1">Connect with parent {profile.parentName} to reveal full profile</span>
          </div>
        )}

        {/* Top-Left: Color-Coded Proximity Badge Overlay */}
        <div 
          id={`proximity-pill-overlay-${profile.id}`} 
          className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs ${proxBadge.badgeOverlayClass}`}
          title={`Proximity distance: ${proxBadge.distanceText} (${proxBadge.subtext})`}
        >
          <span className={`w-2 h-2 rounded-full ${proxBadge.dotColor} animate-pulse shrink-0`} />
          <span className="font-mono">{proxBadge.distanceText}</span>
          <span className="text-[8.5px] font-black opacity-90 tracking-normal">({proxBadge.label})</span>
        </div>

        {/* Top Photo Switcher Pills: Parent (Mandatory) & Child (Optional) */}
        <div className="absolute top-11 left-3 z-20 flex items-center bg-slate-950/80 backdrop-blur-md p-0.5 rounded-xl border border-white/20 shadow-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoTab('parent');
            }}
            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
              activePhotoTab === 'parent' 
                ? 'bg-amber-400 text-slate-950 shadow-xs' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Parent Photo (Mandatory Verified Adult)"
          >
            <User className="w-3 h-3" />
            <span>Parent*</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoTab('child');
            }}
            className={`px-2 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
              activePhotoTab === 'child' 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={hasChildPhoto ? "Child Photo (Optional)" : "Child Photo (Optional - Protected)"}
          >
            <Heart className="w-3 h-3" />
            <span>Child {hasChildPhoto ? '' : '(Optional)'}</span>
          </button>
        </div>

        {/* Action Buttons: Save & Favorite */}
        <div id="card-top-actions" className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          <button
            id={`btn-save-profile-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSave) onToggleSave(profile.id);
            }}
            type="button"
            title={isSaved ? "Saved Profile" : "Save Profile"}
            className={`p-2 rounded-full backdrop-blur-sm shadow-md transition-all ${
              isSaved 
                ? 'bg-amber-500 text-white hover:bg-amber-600 scale-105' 
                : 'bg-white/80 hover:bg-white text-slate-700 hover:text-amber-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>

          <button
            id={`btn-favorite-${profile.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            type="button"
            title={liked ? "Liked Profile" : "Like Profile"}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white text-rose-600 active:scale-90 transition-all"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-600 text-rose-600' : 'text-slate-700'}`} />
          </button>
        </div>

        {/* Photo View Tag in Bottom Left */}
        <div id="owner-tag" className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-rose-950/85 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-lg border border-rose-800/50 shadow-sm z-20">
          {activePhotoTab === 'parent' ? (
            <>
              <User className="w-3.5 h-3.5 text-amber-300" />
              <span>Parent: <strong>{profile.parentName}</strong> <span className="text-[9px] text-amber-300 uppercase font-black tracking-wider ml-1">[Mandatory]</span></span>
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5 text-rose-300" />
              <span>Child: <strong>{isProfileUnlocked ? profile.childName : '🔒 Child'}</strong> <span className="text-[9px] text-rose-200 uppercase font-bold tracking-wider ml-1">{hasChildPhoto ? '[Optional]' : '[Protected]'}</span></span>
            </>
          )}
        </div>

        {/* Dual Thumbnail Picture-in-Picture Button to easily swap between Parent and Child */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoTab(activePhotoTab === 'parent' ? 'child' : 'parent');
          }}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 hover:bg-slate-900 text-white p-1 rounded-xl border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer"
          title={`Switch to view ${activePhotoTab === 'parent' ? 'Child Photo (Optional)' : 'Parent Photo (Mandatory)'}`}
        >
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/40 bg-slate-800 flex items-center justify-center shrink-0">
            {activePhotoTab === 'parent' ? (
              hasChildPhoto ? (
                <img src={childPhoto} alt="Child Mini" className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-rose-300" />
              )
            ) : (
              <img src={parentPhoto} alt="Parent Mini" className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-[9px] font-black uppercase pr-1 text-amber-300">
            {activePhotoTab === 'parent' ? 'Child 🧒' : 'Parent 👤'}
          </span>
        </button>

        {/* Immediate Playdate Hunt Overlay Badge */}
        {profile.lookingForImmediatePlaydate && (
          <div id={`immediate-hunt-badge-${profile.id}`} className="absolute top-11 right-3 flex items-center gap-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-lg shadow-lg border border-rose-400/20 animate-pulse z-20">
            <Zap className="w-3 h-3 fill-amber-300 text-amber-300 shrink-0" />
            <span>Instant Playdate</span>
          </div>
        )}
      </div>

      {/* Main Details Body */}
      <div id="card-body-content" className="p-5 flex-1 flex flex-col space-y-3.5 bg-[#FAF8F6]">
        {/* Primary Row: Name, grade, age */}
        <div id="card-basics" className="flex justify-between items-start">
          <div>
            <h3 id="child-id-name" className="text-xl font-bold font-serif text-rose-950 hover:text-rose-700 transition-colors flex items-center gap-1.5 flex-wrap">
              {isProfileUnlocked ? profile.childName : "🔒 Hidden Child Identity"}
              {isProfileUnlocked && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  profile.childGender === 'Boy' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                  profile.childGender === 'Girl' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {profile.childGender}
                </span>
              )}
            </h3>
            <p id="child-id-grade" className="text-xs font-semibold text-slate-600 mt-0.5">
              {isProfileUnlocked ? `${profile.gradeLevel} • ${profile.childAge} ${profile.ageUnit === 'months' ? 'months' : 'yrs'} old` : "🔒 Connect to reveal age & grade"}
            </p>
          </div>

          {/* Color-Coded Proximity Badge */}
          <div 
            id="proximity-badge" 
            className={`text-right text-[10.5px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all ${proxBadge.badgeClass}`}
            title={`Distance: ${proxBadge.distanceText} • Category: ${proxBadge.label} (${proxBadge.subtext})`}
          >
            <span className={`w-2 h-2 rounded-full ${proxBadge.dotColor} shrink-0`}></span>
            <div className="flex flex-col text-right leading-none">
              <span className="font-mono">{proxBadge.distanceText} away</span>
              <span className="text-[8.5px] font-bold opacity-80 uppercase tracking-wider mt-0.5">{proxBadge.label} • {proxBadge.subtext}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Presence Indicator Section */}
        {(() => {
          const actStatus = profile.activityStatus || 'Available for Play';
          let bgClass = 'bg-sky-50 text-sky-800 border-sky-100';
          let dotColor = 'bg-sky-500';
          let textLabel = 'Available for Play';

          if (actStatus === 'Currently Active') {
            bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-150';
            dotColor = 'bg-emerald-500';
            textLabel = 'Currently Active';
          } else if (actStatus === 'Away') {
            bgClass = 'bg-slate-50 text-slate-500 border-slate-200';
            dotColor = 'bg-slate-400';
            textLabel = 'Away';
          }

          return (
            <div id={`activity-presence-${profile.id}`} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-2xl p-2 px-3 shadow-3xs">
              <div id={`status-badge-container-${profile.id}`} className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${bgClass} font-bold`}>
                <span className="relative flex h-2 w-2">
                  {actStatus === 'Currently Active' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                </span>
                <span className="tracking-tight text-[10px] uppercase font-bold">{textLabel}</span>
              </div>

              {profile.lookingForImmediatePlaydate ? (
                <div id={`immediate-hunt-text-${profile.id}`} className="flex items-center gap-1 text-[9.5px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg animate-pulse uppercase tracking-wider">
                  <Activity className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>Immediate Play</span>
                </div>
              ) : (
                <div id={`last-active-time-${profile.id}`} className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatLastActive(profile.lastActiveAt)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Playdate Chemistry Match Score */}
        {(() => {
          const match = calculateMatchScore(currentUserProfile, profile);
          
          let themeClasses = 'from-emerald-50 to-teal-50/30 border-emerald-150 text-emerald-900';
          let percentageColor = 'text-emerald-700';
          let progressColor = 'bg-emerald-500';
          let matchLabel = 'Excellent Match';
          
          if (match.score < 70) {
            themeClasses = 'from-amber-55/60 to-orange-50/30 border-amber-200 text-amber-900';
            percentageColor = 'text-amber-700';
            progressColor = 'bg-amber-500';
            matchLabel = 'Friendly Harmony';
          } else if (match.score < 85) {
            themeClasses = 'from-indigo-50 to-pink-50/20 border-indigo-150 text-indigo-900';
            percentageColor = 'text-indigo-700';
            progressColor = 'bg-indigo-500';
            matchLabel = 'Great Supermatch';
          }

          return (
            <div id={`match-score-widget-${profile.id}`} className={`bg-gradient-to-br ${themeClasses} border rounded-2xl p-4.5 space-y-3.5 shadow-2xs`}>
              <div className="flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest text-slate-400 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Playmate Chemistry Match
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black font-serif tracking-tight">{matchLabel}</span>
                    {match.isSimulated && (
                      <span className="text-[7.5px] bg-slate-200/70 text-slate-500 px-1.5 py-0.5 rounded font-black font-mono">
                        Global Fit
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`text-2xl font-serif font-black tracking-tighter ${percentageColor} block leading-none`}>
                    {match.score}%
                  </span>
                  <span className="text-[7.5px] text-slate-400 font-black uppercase tracking-wider block mt-0.5">Compatibility</span>
                </div>
              </div>

              {/* Progress bar representing score */}
              <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                  style={{ width: `${match.score}%` }}
                />
              </div>

              {/* Breakdown details */}
              <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                <div className="bg-white/80 rounded-lg p-1.5 border border-slate-100 flex flex-col justify-center items-center">
                  <span className="text-slate-400 font-bold uppercase text-[7.5px]">Interests</span>
                  <span className="font-extrabold text-slate-700 mt-0.5">+{match.breakdown.interests} Pts</span>
                </div>
                <div className="bg-white/80 rounded-lg p-1.5 border border-slate-100 flex flex-col justify-center items-center">
                  <span className="text-slate-400 font-bold uppercase text-[7.5px]">Age peer</span>
                  <span className="font-extrabold text-slate-700 mt-0.5">+{match.breakdown.age} Pts</span>
                </div>
                <div className="bg-white/80 rounded-lg p-1.5 border border-slate-100 flex flex-col justify-center items-center">
                  <span className="text-slate-400 font-bold uppercase text-[7.5px]">Play Style</span>
                  <span className="font-extrabold text-slate-700 mt-0.5">+{match.breakdown.playStyle} Pts</span>
                </div>
              </div>

              {/* Shared hobbies tag line */}
              {match.matchingInterests.length > 0 && (
                <div className="pt-2 flex items-center gap-1.5 text-[10px] text-slate-600 border-t border-dashed border-slate-200">
                  <span className="font-extrabold uppercase text-[7.5px] tracking-wide text-slate-400 shrink-0">Shared Interests:</span>
                  <div className="flex flex-wrap gap-1">
                    {match.matchingInterests.map(interest => (
                      <span key={interest} className="px-2 py-0.5 bg-white rounded text-slate-700 border border-slate-150/70 font-bold shadow-3xs uppercase text-[8px]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Play style and Indian Demographic chips */}
        <div id="metrics-bar" className="grid grid-cols-1 gap-1.5 text-xs">
          <div id="metric-playstyle" className="p-2.5 bg-amber-55/40 rounded-xl border border-amber-100">
            <span className="block text-slate-400 font-medium text-[10px] uppercase">Play Interaction Style:</span>
            <span className="font-bold text-amber-800 text-xs">
              {isProfileUnlocked ? profile.playStyle : "🔒 Locked Profile"}
            </span>
          </div>

          {/* Weekly Availability and Slots details */}
          <div className="p-2.5 bg-sky-55/40 rounded-xl border border-sky-100 flex flex-col gap-1">
            <span className="block text-slate-400 font-medium text-[10px] uppercase">🗓️ Playdate Availability:</span>
            {isProfileUnlocked ? (
              <div className="flex flex-col gap-1 mt-1">
                {profile.availableDays && profile.availableDays.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-500 text-[10px] min-w-[36px] uppercase">Days:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.availableDays.map(d => (
                        <span key={d} className="px-1.5 py-0.5 bg-white text-sky-700 text-[9px] font-extrabold rounded-md border border-sky-100">
                          {d.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.availableTimes && profile.availableTimes.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-500 text-[10px] min-w-[36px] uppercase">Times:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.availableTimes.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-white text-orange-700 text-[9px] font-extrabold rounded-md border border-orange-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="font-mono text-[9px] text-slate-400 italic">🔒 Protected until connected</span>
            )}
          </div>

          {(profile.parentProfession || profile.religion || profile.motherTongue || (profile.languagesKnown && profile.languagesKnown.length > 0)) && (
            <div id="demographics-panel" className="p-2.5 bg-slate-50/85 rounded-xl border border-slate-100 space-y-1.5">
              {profile.parentProfession && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Profession (Unlocked):</span>
                  <span className="font-bold text-slate-700">{profile.parentProfession}</span>
                </div>
              )}
              {profile.motherTongue && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Mother Tongue (Unlocked):</span>
                  <span className="font-bold text-slate-700">{profile.motherTongue}</span>
                </div>
              )}
              {profile.languagesKnown && profile.languagesKnown.length > 0 && (
                <div className="text-[11px]">
                  <span className="text-slate-400 block mb-0.5">Languages Spoken (Unlocked):</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {profile.languagesKnown.map(lang => (
                      <span key={lang} className="px-1.5 py-0.5 text-[9px] font-bold bg-white border border-slate-200 text-slate-600 rounded-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(profile.religion || profile.caste) && (
                <div className="flex justify-between text-[11px] border-t border-slate-100/50 pt-1.5">
                  <span className="text-slate-400 font-semibold text-slate-500">Caste & Religion (Locked):</span>
                  <span className="font-bold text-slate-600">
                    {isProfileUnlocked ? (
                      `${profile.religion || 'General'} ${profile.caste ? '• ' + profile.caste : ''}`
                    ) : (
                      "🔒 Locked communities"
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Biography text */}
        <p id="child-bio-p" className="text-xs text-slate-600 leading-relaxed italic line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-50">
          {isProfileUnlocked ? `"${profile.bio}"` : "🔒 [Biography profile description is locked and requires parent-to-parent connect approval]"}
        </p>

        {/* Interests Badges */}
        <div id="interests-tags-flex" className="flex flex-wrap gap-1">
          {isProfileUnlocked ? (
            profile.interests.map((tag) => (
              <span id={`badge-tag-${tag}-${profile.id}`} key={tag} className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 py-1 px-2 rounded-lg">
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-400 py-1 px-2.5 rounded-lg flex items-center gap-1 select-none">
              🔒 Playtime Hobbies Secured
            </span>
          )}
        </div>

        {/* Preferred Activities Badges */}
        {profile.preferredActivities && profile.preferredActivities.length > 0 && (
          <div id="activities-tags-flex" className="flex flex-wrap gap-1 mt-1">
            {profile.preferredActivities.map((act) => (
              <span id={`badge-act-${act}-${profile.id}`} key={act} className="text-[10px] font-bold bg-orange-50 hover:bg-orange-100 transition-colors text-orange-700 py-1 px-2 rounded-lg border border-orange-100/50 flex items-center gap-0.5">
                ⭐ {act}
              </span>
            ))}
          </div>
        )}

        {/* Secure Phone Privacy Revelations Section */}
        {(() => {
          const phonePref = profile.phonePrivacyOption || 'show_after_acceptance';
          const isUnlockedByCredit = (currentUserProfile?.unlockedPhoneIds || []).includes(profile.id);
          
          if (phonePref === 'lock_permanently') {
            return (
              <div id="phone-widget-locked-permanently" className="p-3 bg-rose-50 border border-rose-100/70 rounded-2xl flex flex-col gap-1 animate-fade-in text-left">
                <span className="text-[9px] uppercase font-black tracking-widest text-rose-600 flex items-center gap-1 font-mono">
                  📵 Restricted Security Protocol
                </span>
                <span className="text-xs font-bold text-rose-800 font-serif">Contact Number Locked Permanently</span>
                <p className="text-[10px] text-slate-500 leading-snug">
                  This guardian has opted for absolute telephone anonymity. Contacts cannot be revealed under any circumstances.
                </p>
              </div>
            );
          } else if (phonePref === 'show_after_acceptance') {
            if (isProfileUnlocked) {
              const cleanedPhone = (profile.phoneNumber || '+91 80737 49074').replace(/\D/g, '');
              const waPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
              const waText = encodeURIComponent(`Hello ${profile.parentName || 'Parent'}! We connected on Vernunt for a playtime. I'd love to organize a playdate for ${profile.childName}!`);
              const whatsappUrl = `https://wa.me/${waPhone}?text=${waText}`;

              return (
                <div id="phone-widget-visible-accepted" className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col gap-2.5 text-left animate-fade-in shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 block">📱 Guardian Mobile Number</span>
                      <span className="block text-sm font-mono font-black text-slate-800 select-all tracking-wider mt-0.5">
                        {profile.phoneNumber || '+91 80737 49074'}
                      </span>
                    </div>
                    <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">Connected</span>
                  </div>
                  <a
                    id={`whatsapp-link-accepted-${profile.id}`}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-md"
                  >
                    <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.42 1.258 4.877L2 22l5.244-1.378a9.92 9.92 0 004.76 1.218c5.518 0 9.996-4.478 9.996-9.996S17.522 2 12.004 2zm5.468 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              );
            } else {
              return (
                <div id="phone-widget-locked-accepted" className="p-3 bg-slate-55 border border-slate-100 rounded-2xl flex flex-col gap-1 text-left animate-fade-in text-slate-500">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">📱 Companion Mobile Link</span>
                  <span className="text-xs font-bold font-mono text-slate-650 flex items-center gap-1">🔒 Revealed on Connection Approval</span>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    This phone resets to release automatically once Ramesh / Sarah Jenkins accepts your connections request.
                  </p>
                </div>
              );
            }
          } else {
            // 'show_after_referral' Option!
            if (isProfileUnlocked || isUnlockedByCredit) {
              const cleanedPhone = (profile.phoneNumber || '+91 80737 49074').replace(/\D/g, '');
              const waPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
              const waText = encodeURIComponent(`Hello ${profile.parentName || 'Parent'}! We connected on Vernunt for a playtime. I'd love to organize a playdate for ${profile.childName}!`);
              const whatsappUrl = `https://wa.me/${waPhone}?text=${waText}`;

              return (
                <div id="phone-widget-visible-referral" className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col gap-2.5 text-left animate-fade-in shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 block">📱 Guardian Mobile Number</span>
                      <span className="block text-sm font-mono font-black text-slate-800 select-all tracking-wider mt-0.5">
                        {profile.phoneNumber || '+91 80737 49074'}
                      </span>
                    </div>
                    <span className="text-[9px] bg-emerald-600 text-white font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {isProfileUnlocked ? "Connected" : "Credit Unlocked"}
                    </span>
                  </div>
                  <a
                    id={`whatsapp-link-referral-${profile.id}`}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-md"
                  >
                    <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.42 1.258 4.877L2 22l5.244-1.378a9.92 9.92 0 004.76 1.218c5.518 0 9.996-4.478 9.996-9.996S17.522 2 12.004 2zm5.468 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              );
            } else {
              const currentCredits = currentUserProfile?.contactViewCredits || 0;
              return (
                <div id="phone-widget-unlocked-credit" className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl flex flex-col gap-2.5 text-left animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-orange-600 block">📱 Secure Mobile Link</span>
                      <span className="block text-xs font-serif font-black text-slate-800 mt-0.5">🔒 Contact Anonymity Shield</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-orange-700 bg-orange-100/50 border border-orange-200/40 px-2 py-0.5 rounded uppercase">
                      Referral Success option
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    This parent allows contact view sharing! Unlock their phone number right now using **1 View Credit**, or wait for connection approval safely.
                  </p>
                  
                  {currentCredits > 0 ? (
                    <button
                      type="button"
                      onClick={() => onUnlockPhone && onUnlockPhone(profile.id)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-md"
                    >
                      🔑 Spend 1 Credit to Reveal (Balance: {currentCredits})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNavigateToReferrals}
                      className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-inner"
                    >
                      🎁 Refer & Earn Free Contacts (Credits: 0)
                    </button>
                  )}
                </div>
              );
            }
          }
        })()}

        {/* Connection Privacy Verification Center */}
        <div id="secure-connection-status-block" className="space-y-2 mt-2">
          {isConnected ? (
            <div id={`connected-badge-${profile.id}`} className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl text-[11px] font-bold border border-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
              <span>🤝 Connection established • Private chat approved</span>
            </div>
          ) : isInterestReceived ? (
            <div id={`incoming-badge-${profile.id}`} className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span>📬 Connection request from {profile.parentName.split(' ')[0]}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Likes your child's profile and wants to exchange private group coordinates and messages safely.
              </p>
              <button
                id={`btn-accept-req-${profile.id}`}
                type="button"
                onClick={() => onAcceptConnection && onAcceptConnection(profile.id)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
              >
                Approve & Connect
              </button>
            </div>
          ) : isInterestSent ? (
            <div id={`pending-badge-${profile.id}`} className="p-2.5 bg-indigo-50 text-indigo-900 rounded-xl text-[11px] font-bold border border-indigo-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                <span>⏳ Request pending guardian approval...</span>
              </span>
            </div>
          ) : (
            <div id={`locked-badge-${profile.id}`} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-semibold border border-slate-100 flex items-center gap-1">
              <span>🔒 Child security lock active • Connection required to message</span>
            </div>
          )}
        </div>

        {/* Primary Interaction Buttons Grid */}
        <div id="interaction-buttons-grid" className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-auto">
          <button
            id={`btn-card-planner-${profile.id}`}
            onClick={() => {
              if (isConnected) {
                onInitiatePlaydate(profile);
              } else {
                alert(`Pediatric Safety Lock: Please establish a secure parent-to-parent connection before planning structured dates with ${profile.childName}. Click "Request Connection" or heart the profile to get started!`);
              }
            }}
            type="button"
            className={`py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
              isConnected 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/5 active:scale-95' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CalendarPlus className="w-4 h-4" /> Book Playdate
          </button>
          
          {isConnected ? (
            <button
              id={`btn-card-message-${profile.id}`}
              onClick={() => onOpenChat(profile)}
              type="button"
              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          ) : currentUserProfile?.subscriptionActive ? (
            <button
              id={`btn-card-quick-connect-${profile.id}`}
              onClick={() => onOpenChat(profile)}
              type="button"
              className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-200 fill-current" /> Quick Connect
            </button>
          ) : isInterestSent ? (
            <button
              id={`btn-card-pending-msg-${profile.id}`}
              disabled
              type="button"
              className="py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4 text-slate-300" /> Pending...
            </button>
          ) : isInterestReceived ? (
            <button
              id={`btn-card-approve-action-${profile.id}`}
              onClick={() => onAcceptConnection && onAcceptConnection(profile.id)}
              type="button"
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Connect to Chat
            </button>
          ) : (
            <button
              id={`btn-card-connect-p-${profile.id}`}
              onClick={() => onSendConnection && onSendConnection(profile.id)}
              type="button"
              className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Connect Parents
            </button>
          )}
        </div>

        {/* Flag & Block Actions */}
        <div id="flag-row" className="flex items-center justify-between pt-1.5 border-t border-slate-100/50 mt-2 text-[10px] text-slate-400 font-semibold">
          <button
            id={`btn-card-report-${profile.id}`}
            onClick={() => onOpenReport(profile)}
            type="button"
            className="hover:text-red-500 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ShieldAlert className="w-3 h-3" /> Parents' Flags & Report
          </button>

          <button
            id={`btn-card-block-${profile.id}`}
            onClick={() => {
              if (window.confirm(`🚫 Are you sure you want to block ${profile.parentName || "this parent"}?\n\nThis will instantly disconnect your chat, hide all their playmate profiles, and isolate your playground coordinates.`)) {
                onBlockProfile && onBlockProfile(profile.id);
              }
            }}
            type="button"
            className="hover:text-rose-600 flex items-center gap-1 hover:underline font-extrabold cursor-pointer"
          >
            <span>🚫 Block Parent</span>
          </button>
        </div>
      </div>
    </div>
  );
}
