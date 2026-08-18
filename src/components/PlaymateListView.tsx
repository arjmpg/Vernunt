import React from 'react';
import { ChildProfile, VerificationStatus } from '../types.ts';
import { calculateMatchScore } from './PlaymateCard.tsx';
import { getHaversineDistance, getProximityBadge } from '../utils/distance.ts';
import { Heart, ShieldCheck, MapPin, Sparkles, User, MessageSquare, ArrowRight, Check, Bookmark } from 'lucide-react';

interface PlaymateListViewProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  onSelectPlaymate: (profile: ChildProfile) => void;
  onOpenDetailModal: (profile: ChildProfile) => void;
  selectedPlaymateId?: string;
  connectedIds: string[];
  interestsSent: string[];
  interestsReceived: string[];
  savedProfileIds?: string[];
  onToggleSave?: (id: string) => void;
  onSendConnection: (partnerId: string) => void;
  onAcceptConnection: (partnerId: string) => void;
  maxDistanceKm: number;
}

export function PlaymateListView({
  playmates,
  userProfile,
  onSelectPlaymate,
  onOpenDetailModal,
  selectedPlaymateId,
  connectedIds,
  interestsSent,
  interestsReceived,
  savedProfileIds = [],
  onToggleSave,
  onSendConnection,
  onAcceptConnection,
  maxDistanceKm
}: PlaymateListViewProps) {
  const userLat = userProfile?.location?.lat ?? 19.0760;
  const userLng = userProfile?.location?.lng ?? 72.8777;

  if (!playmates || playmates.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400 space-y-3 shadow-xs">
        <span className="text-4xl block">🔍</span>
        <h4 className="text-base font-bold text-slate-700 font-serif">No Matching Friends Found</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Try expanding your search radius slider or clearing activity/age filters to discover nearby kids and parents!
        </p>
      </div>
    );
  }

  return (
    <div id="playmates-list-view-container" className="space-y-4">
      {/* List Header */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-serif uppercase tracking-wider">
              Matching Friends ({playmates.length})
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Verified local families within {maxDistanceKm.toFixed(1)} km
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Live Proximity</span>
        </span>
      </div>

      {/* Grid of Friends Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {playmates.map((p) => {
          const isSelected = selectedPlaymateId === p.id;
          const isConnected = connectedIds.includes(p.id);
          const isSent = interestsSent.includes(p.id);
          const isReceived = interestsReceived.includes(p.id);
          const dKm = getHaversineDistance(userLat, userLng, p.location.lat, p.location.lng);
          const proxBadge = getProximityBadge(dKm);
          const matchResult = calculateMatchScore(userProfile, p);

          return (
            <div
              key={p.id}
              id={`friend-card-${p.id}`}
              className={`bg-white rounded-3xl border p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-md relative overflow-hidden group ${
                isSelected 
                  ? 'border-orange-300 ring-2 ring-orange-100 bg-orange-50/20' 
                  : 'border-slate-100/90 hover:border-slate-200'
              }`}
            >
              {/* Top Accent Stripe / Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img 
                      src={p.parentPhotoUrl || p.photoUrl} 
                      alt={`Parent: ${p.parentName}`} 
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200/80 shadow-xs group-hover:scale-105 transition duration-200"
                      referrerPolicy="no-referrer"
                    />
                    {p.childPhotoUrl && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full overflow-hidden border-2 border-white shadow-xs bg-slate-100" title={`Child: ${p.childName}`}>
                        <img src={p.childPhotoUrl} alt={p.childName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {p.verificationStatus === VerificationStatus.VERIFIED && (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white shadow-xs" title="Aadhaar Verified Guardian">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-serif font-bold text-sm text-slate-900 group-hover:text-orange-600 transition">
                        {p.childName}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                        {p.childAge} yrs
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] mt-0.5">
                      Parent: <span className="text-slate-800 font-semibold">{p.parentName}</span>
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* Color-Coded Visual Distance Badge */}
                      <span 
                        id={`list-dist-badge-${p.id}`}
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-3xs ${proxBadge.badgeClass}`}
                        title={`Distance: ${proxBadge.distanceText} • ${proxBadge.subtext}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${proxBadge.dotColor} shrink-0`}></span>
                        <span>{proxBadge.distanceText}</span>
                        <span className="text-[8.5px] opacity-75 uppercase font-bold">({proxBadge.label})</span>
                      </span>

                      <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100/60 flex items-center gap-0.5 text-[10px]">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        {matchResult.score}% Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save & Like Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-save-friend-${p.id}`}
                    type="button"
                    title={savedProfileIds.includes(p.id) ? "Saved Profile" : "Save Profile"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleSave) onToggleSave(p.id);
                    }}
                    className={`p-2 rounded-xl transition ${
                      savedProfileIds.includes(p.id)
                        ? 'bg-amber-100 text-amber-700 font-bold'
                        : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedProfileIds.includes(p.id) ? 'fill-amber-600 text-amber-600' : ''}`} />
                  </button>

                  <button
                    id={`btn-like-friend-${p.id}`}
                  type="button"
                  title={
                    isConnected
                      ? "Connected Friend"
                      : isSent
                      ? "Connection Request Sent"
                      : isReceived
                      ? "Likes You - Click to Connect"
                      : "Like & Connect with Playmate"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReceived) {
                      onAcceptConnection(p.id);
                    } else if (!isSent && !isConnected) {
                      onSendConnection(p.id);
                    }
                  }}
                  className={`p-2.5 rounded-2xl transition duration-200 cursor-pointer border shadow-xs flex items-center justify-center shrink-0 ${
                    isConnected
                      ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                      : isSent
                      ? 'bg-rose-50 text-rose-500 border-rose-200'
                      : isReceived
                      ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 animate-bounce'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isConnected || isSent || isReceived ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

              {/* Bio & Interests */}
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-150/60 font-medium">
                "{p.bio || `${p.childName} is an active child who enjoys group play and creative activities.`}"
              </p>

              {/* Interests Pills */}
              {p.interests && p.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.interests.slice(0, 3).map((interest, i) => (
                    <span 
                      key={i} 
                      className="text-[9.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium border border-slate-200/50"
                    >
                      {interest}
                    </span>
                  ))}
                  {p.interests.length > 3 && (
                    <span className="text-[9px] text-slate-400 px-1 py-0.5 font-bold">
                      +{p.interests.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Action bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {p.playStyle || 'Playmate'}
                </span>

                <button
                  id={`btn-view-detailed-profile-${p.id}`}
                  type="button"
                  onClick={() => {
                    onSelectPlaymate(p);
                    onOpenDetailModal(p);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>Detailed Profile</span>
                  <ArrowRight className="w-3 h-3 text-orange-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
