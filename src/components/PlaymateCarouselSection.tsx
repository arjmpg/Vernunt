import React, { useRef } from 'react';
import { ChildProfile } from '../types.ts';
import { 
  ChevronLeft, ChevronRight, Navigation, 
  ShieldCheck, ArrowRight, Bookmark, Sparkles, MessageSquare, EyeOff
} from 'lucide-react';
import { getHaversineDistance, getProximityBadge, openDeviceNavigation } from '../utils/distance.ts';

interface PlaymateCarouselSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  playmates: ChildProfile[];
  onSelectPlaymate: (profile: ChildProfile) => void;
  onQuickChat?: (profile: ChildProfile, templateMessage?: string) => void;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  connectedIds?: string[];
  savedProfileIds?: string[];
  onToggleSave?: (id: string) => void;
  userLat?: number;
  userLng?: number;
  badgeType?: 'VERIFIED' | 'TOP MATCH' | 'NEARBY' | 'ACTIVE';
  isAadhaarVerified?: boolean;
  currentUserProfile?: ChildProfile | null;
}

export default function PlaymateCarouselSection({
  id,
  title,
  subtitle,
  playmates,
  onSelectPlaymate,
  onQuickChat,
  onSeeAll,
  seeAllLabel = 'See All',
  connectedIds = [],
  savedProfileIds = [],
  onToggleSave,
  userLat = 12.9716,
  userLng = 77.5946,
  badgeType,
  isAadhaarVerified,
  currentUserProfile
}: PlaymateCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!playmates || playmates.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="space-y-3 relative group/section">
      {/* Section Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-sans font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {playmates.length}
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Left / Right Navigation Arrows */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1.5 rounded-full bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1.5 rounded-full bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <span>{seeAllLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Carousel View (BookMyShow / Events style) */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 px-1 snap-x snap-mandatory"
      >
        {playmates.map((p) => {
          const isConnected = connectedIds.includes(p.id);
          const isSaved = savedProfileIds.includes(p.id);
          const dKm = getHaversineDistance(
            userLat, 
            userLng, 
            p.location?.lat || 12.9716, 
            p.location?.lng || 77.5946
          );
          const proxBadge = getProximityBadge(dKm);
          const isVerified = p.aadhaarVerified || p.digilockerVerified;
          const isWithin500m = dKm <= 0.5;
          const isPhotoUnlocked = isConnected || isAadhaarVerified || !!currentUserProfile?.aadhaarVerified || currentUserProfile?.userRole === 'Admin';

          return (
            <div
              key={p.id}
              id={`playmate-card-${p.id}`}
              onClick={() => onSelectPlaymate(p)}
              className="w-[170px] sm:w-[210px] md:w-[230px] shrink-0 snap-start flex flex-col group cursor-pointer transition-all duration-200"
            >
              {/* Vertical Poster Container (Aspect Ratio ~2:3 as seen in BookMyShow) */}
              <div className={`relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-300 border ${
                isWithin500m 
                  ? 'border-emerald-500 ring-2 ring-emerald-400/40 shadow-emerald-500/10' 
                  : 'border-slate-200/80'
              }`}>
                <img
                  src={p.photoUrl}
                  alt={p.childName}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                    !isPhotoUnlocked ? 'blur-2xl saturate-[0.15] brightness-75 select-none pointer-events-none' : ''
                  }`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = p.childGender === 'Girl'
                      ? 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400&crop=faces'
                      : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400&crop=faces';
                  }}
                />

                {/* Locked state overlay with EyeOff icon until Aadhaar KYC is verified */}
                {!isPhotoUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center select-none z-10 font-serif">
                    <div className="w-10 h-10 rounded-full bg-amber-500/25 border border-amber-400/60 flex items-center justify-center mb-1.5 shadow-md">
                      <EyeOff className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <span className="text-[10px] text-white uppercase font-black tracking-widest font-mono flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-amber-400" />
                      <span>Photo Locked</span>
                    </span>
                    <span className="text-[8.5px] text-slate-200 leading-tight mt-1 font-sans">
                      Aadhaar KYC Required
                    </span>
                  </div>
                )}

                {/* Gradient overlay on bottom of poster */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/25 pointer-events-none" />

                {/* Top Status, Proximity & Verification Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 z-10">
                  {isWithin500m ? (
                    <span 
                      id={`nearby-pulse-badge-${p.id}`}
                      className="bg-emerald-600/95 backdrop-blur-xs text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-md flex items-center gap-1.5 border border-emerald-300 ring-1 ring-emerald-300/60 animate-pulse"
                      title="Within 500 meters of your location • Great for spontaneous park meetups"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      <span>NEARBY &bull; &lt;0.5KM</span>
                    </span>
                  ) : isVerified ? (
                    <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider shadow-md flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      VERIFIED
                    </span>
                  ) : badgeType === 'TOP MATCH' ? (
                    <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider shadow-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      TOP MATCH
                    </span>
                  ) : (
                    <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider">
                      {p.gradeLevel || 'PLAYMATE'}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {isConnected && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-md">
                        Connected ✓
                      </span>
                    )}
                    {onToggleSave && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(p.id);
                        }}
                        className={`p-1 rounded-full backdrop-blur-xs transition shadow-sm ${
                          isSaved 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-900/60 hover:bg-slate-900 text-white/90 hover:text-white'
                        }`}
                        title={isSaved ? 'Saved' : 'Save profile'}
                        aria-label="Save profile"
                      >
                        <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Overlay Info (Exact Distance & Age) */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-extrabold z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeviceNavigation(p.location?.lat || 12.9716, p.location?.lng || 77.5946, `${p.childName}'s Play Area`);
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] flex items-center gap-1 font-black cursor-pointer transition hover:scale-105 active:scale-95 ${
                      isWithin500m
                        ? 'bg-emerald-600/95 hover:bg-emerald-600 text-white border-emerald-300/80 shadow-xs'
                        : 'bg-slate-950/85 hover:bg-slate-900 backdrop-blur-xs text-emerald-400 border-white/20'
                    }`}
                    title="Click to Start Navigation in Map"
                  >
                    <Navigation className={`w-2.5 h-2.5 fill-current ${isWithin500m ? 'animate-pulse' : ''}`} />
                    <span>{proxBadge.exactText}</span>
                  </button>

                  <div className="bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/20 text-[10px] text-amber-300">
                    <span>{p.childAge}y • {p.childGender}</span>
                  </div>
                </div>
              </div>

              {/* Poster Meta Content */}
              <div className="mt-2.5 px-0.5 space-y-1">
                {/* Child Title */}
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 leading-snug group-hover:text-rose-600 transition-colors">
                  {p.childName}, {p.childAge} yrs
                </h4>

                {/* Parent & Neighborhood */}
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Parent: {p.parentName} {p.location?.address ? `• ${p.location.address.split(',')[0]}` : ''}
                </p>

                {/* Shared Hobbies / Interests */}
                {p.interests && p.interests.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden pt-0.5">
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md truncate max-w-full">
                      #{p.interests[0]}
                    </span>
                    {p.interests.length > 1 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        +{p.interests.length - 1}
                      </span>
                    )}
                  </div>
                )}

                {/* Quick Chat & Fast Action */}
                <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100 mt-1.5">
                  <button
                    id={`btn-card-quick-chat-${p.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const template = isWithin500m 
                        ? 'Hi! Saw you are nearby (<500m). Would you like to meet at the park?' 
                        : 'Hi! Would you like to meet at the park?';
                      if (onQuickChat) {
                        onQuickChat(p, template);
                      } else {
                        onSelectPlaymate(p);
                      }
                    }}
                    className="flex-1 py-1.5 px-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-xs shadow-orange-500/20 transition-all cursor-pointer"
                    title="Quick Chat with pre-filled message: 'Hi! Would you like to meet at the park?'"
                  >
                    <MessageSquare className="w-3 h-3 fill-white/20 shrink-0" />
                    <span className="truncate">Quick Chat</span>
                  </button>
                  <button
                    id={`btn-card-navigate-${p.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeviceNavigation(p.location?.lat || 12.9716, p.location?.lng || 77.5946, `${p.childName}'s Play Area`);
                    }}
                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer border border-emerald-200/60 shrink-0"
                    title="Start Navigation: Open device's map app with pinned location"
                    aria-label="Start Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-emerald-600/30" />
                  </button>
                  <button
                    id={`btn-card-view-profile-${p.id}`}
                    type="button"
                    onClick={() => onSelectPlaymate(p)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-slate-200/60 shrink-0"
                    title="View full profile"
                    aria-label="View full profile"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
