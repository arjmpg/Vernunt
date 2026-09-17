import React from 'react';
import { ChildProfile } from '../types.ts';
import PlaymateCard from './PlaymateCard.tsx';
import { X, User } from 'lucide-react';

interface PlaymateDetailModalProps {
  profile: ChildProfile;
  onClose: () => void;
  onInitiatePlaydate: (profile: ChildProfile) => void;
  onOpenChat: (profile: ChildProfile) => void;
  onOpenReport: (profile: ChildProfile) => void;
  onOpenVerify: (profile: ChildProfile) => void;
  isConnected?: boolean;
  isInterestSent?: boolean;
  isInterestReceived?: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onAcceptConnection?: (partnerId: string) => void;
  onSendConnection?: (partnerId: string) => void;
  currentUserLat?: number;
  currentUserLng?: number;
  currentUserProfile?: ChildProfile | null;
  onUnlockPhone?: (targetId: string) => void;
  onNavigateToReferrals?: () => void;
  onBlockProfile?: (partnerId: string) => void;
  onOpenReviews?: (profile: ChildProfile) => void;
  onLeaveReview?: (profile: ChildProfile) => void;
}

export function PlaymateDetailModal({
  profile,
  onClose,
  onInitiatePlaydate,
  onOpenChat,
  onOpenReport,
  onOpenVerify,
  isConnected,
  isInterestSent,
  isInterestReceived,
  isSaved,
  onToggleSave,
  onAcceptConnection,
  onSendConnection,
  currentUserLat,
  currentUserLng,
  currentUserProfile,
  onUnlockPhone,
  onNavigateToReferrals,
  onBlockProfile,
  onOpenReviews,
  onLeaveReview
}: PlaymateDetailModalProps) {
  return (
    <div 
      id={`playmate-detail-modal-${profile.id}`} 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-fade-in space-y-0">
        {/* Sticky modal top bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500 rounded-xl text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight font-serif">
                {(!isConnected && profile.childPrivacySetting === 'connections_only')
                  ? `${profile.parentName}'s Family Profile`
                  : (!isConnected && profile.childPrivacySetting === 'first_name_only')
                  ? `${profile.childName.split(' ')[0]}'s Profile`
                  : `${profile.childName}'s Profile`}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Parent: {profile.parentName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-detail-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Card Container & AI Activity Suggestions */}
        <div className="p-4 sm:p-5 max-h-[82vh] overflow-y-auto space-y-5">
          <PlaymateCard 
            profile={profile}
            onInitiatePlaydate={(p) => {
              onInitiatePlaydate(p);
              onClose();
            }}
            onOpenChat={(p) => {
              onOpenChat(p);
              onClose();
            }}
            onOpenReport={onOpenReport}
            onOpenVerify={onOpenVerify}
            isConnected={isConnected}
            isInterestSent={isInterestSent}
            isInterestReceived={isInterestReceived}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            onAcceptConnection={onAcceptConnection}
            onSendConnection={onSendConnection}
            currentUserLat={currentUserLat}
            currentUserLng={currentUserLng}
            currentUserProfile={currentUserProfile}
            onUnlockPhone={onUnlockPhone}
            onNavigateToReferrals={() => {
              onNavigateToReferrals?.();
              onClose();
            }}
            onBlockProfile={(id) => {
              onBlockProfile?.(id);
              onClose();
            }}
            onOpenReviews={(p) => {
              onOpenReviews?.(p);
            }}
            onLeaveReview={(p) => {
              onLeaveReview?.(p);
            }}
          />
        </div>
      </div>
    </div>
  );
}
