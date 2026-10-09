import React, { useState } from 'react';
import { CommunityEvent, ChildProfile } from '../../types.ts';
import { 
  X, Calendar, Clock, MapPin, Share2, Ticket, Sparkles, 
  CheckCircle2, ShieldCheck, Users, ExternalLink, QrCode, 
  Copy, Check, ArrowRight, UserCheck, AlertCircle, Info, Heart
} from 'lucide-react';
import { getGatheringSubCategory, GATHERING_SUBCATEGORIES } from '../../utils/gatheringCategories.ts';

interface EventDetailModalProps {
  event: CommunityEvent | null;
  onClose: () => void;
  onBookPass: (event: CommunityEvent) => void;
  onShare: (event: CommunityEvent) => void;
  onOpenQrModal?: (event: CommunityEvent) => void;
  userProfile?: ChildProfile | null;
  isBooked?: boolean;
}

export default function EventDetailModal({
  event,
  onClose,
  onBookPass,
  onShare,
  onOpenQrModal,
  userProfile,
  isBooked = false
}: EventDetailModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!event) return null;

  const subCategoryKey = getGatheringSubCategory(event);
  const subCategoryMeta = GATHERING_SUBCATEGORIES[subCategoryKey];
  const isFree = !event.ticketPrice || event.ticketPrice === 0;

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
    const link = `${origin}/?tab=events&eventId=${event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div 
      id="modal-event-full-details" 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col transform transition-all text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Floating Action Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition cursor-pointer shadow-md"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => onShare(event)}
              className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-orange-600 font-bold text-xs shadow-md backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer"
              title="Share Event on WhatsApp, Facebook, X, etc."
            >
              <Share2 className="w-3.5 h-3.5 text-orange-600" />
              <span>Share</span>
            </button>
            {onOpenQrModal && (
              <button
                type="button"
                onClick={() => onOpenQrModal(event)}
                className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-orange-600 shadow-md backdrop-blur-md transition cursor-pointer"
                title="View QR Code Flyer"
              >
                <QrCode className="w-4 h-4 text-slate-700" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1">
          {/* Hero Poster Banner */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 overflow-hidden">
            <img
              src={event.photoUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Badges on bottom of Hero Image */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 flex-wrap z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-xl shadow-md backdrop-blur-md flex items-center gap-1.5 ${
                  subCategoryKey === 'classes'
                    ? 'bg-purple-600/90 text-white border border-purple-400/30'
                    : subCategoryKey === 'activity'
                    ? 'bg-emerald-600/90 text-white border border-emerald-400/30'
                    : 'bg-orange-600/90 text-white border border-orange-400/30'
                }`}>
                  <span>{subCategoryMeta.emoji}</span>
                  <span>{subCategoryKey === 'classes' ? 'Class' : subCategoryKey === 'activity' ? 'Activity' : '1–7d Event'}</span>
                </span>

                <span className="text-[10px] sm:text-xs font-extrabold uppercase px-2.5 py-1 rounded-xl bg-slate-900/80 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  {event.category || 'Community Gathering'}
                </span>

                {isBooked && (
                  <span className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass Booked ✓</span>
                  </span>
                )}
              </div>

              {/* Price Pill */}
              <div className="px-3 py-1 rounded-xl bg-white text-slate-900 font-black text-sm shadow-lg flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-orange-600" />
                <span>{isFree ? 'FREE Entry' : `₹${event.ticketPrice}`}</span>
              </div>
            </div>
          </div>

          {/* Main Details Body */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* Title & Host row */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif leading-tight">
                {event.title}
              </h2>
              
              <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {event.hostName ? event.hostName.slice(0, 1).toUpperCase() : 'V'}
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Organized by </span>
                    <span className="font-bold text-slate-800">{event.hostName || 'Vernunt Community Host'}</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Host
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.attendeesCount || 0} families attending</span>
                </div>
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Date</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">{event.date}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Time & Duration</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">{event.time || '10:00 AM onwards'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2 pt-2 border-t border-slate-200/60">
                <div className="w-9 h-9 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Venue Location</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">{event.location}</span>
                </div>
              </div>
            </div>

            {/* External Online Class Notice (e.g. Learn Geeta) */}
            {event.externalRegistrationUrl && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border border-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    ★ 100% Free Online Program ★
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    Live on Zoom
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  This class is hosted online across 18+ daily batches in 13 Indian languages with free audio tracks and certificates.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <a
                    href={event.externalRegistrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <span>Direct Online Form ↗</span>
                  </a>
                  {event.externalPortalUrl && (
                    <a
                      href={event.externalPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <span>Learner Portal ↗</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* About / Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                About this {subCategoryKey === 'classes' ? 'Class' : subCategoryKey === 'activity' ? 'Activity' : 'Event'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* What's Included / Highlights */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Event Features & Verification
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Age-Appropriate & Safe</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant Digital QR Pass</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>WhatsApp & SMS Updates</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified Organizer Gate Desk</span>
                </div>
              </div>
            </div>

            {/* Tags row */}
            {event.tags && event.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Share Callout Box */}
            <div className="p-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/50 rounded-2xl border border-orange-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    Invite Friends & Family
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Share directly on WhatsApp, X, Facebook or copy link
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShare(event)}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share 📤</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Strip */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200/80 shadow-lg flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              {isFree ? 'Admission' : 'Starting From'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-slate-900">
                {isFree ? 'FREE' : `₹${event.ticketPrice}`}
              </span>
              {!isFree && <span className="text-[10px] text-slate-500 font-medium">/ child</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShare(event)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Share Event"
            >
              <Share2 className="w-4 h-4 text-orange-600" />
            </button>

            <button
              type="button"
              id="btn-modal-action-book"
              onClick={() => onBookPass(event)}
              className="px-5 sm:px-7 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition transform hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>{isBooked ? 'View My Pass 🎟️' : isFree ? 'Register for Free 🎟️' : 'Book Passes 🎟️'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
