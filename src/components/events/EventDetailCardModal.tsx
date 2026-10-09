import React, { useEffect } from 'react';
import { CommunityEvent, ChildProfile } from '../../types.ts';
import { 
  X, Calendar, Clock, MapPin, Ticket, Share2, 
  UserCheck, ExternalLink, Sparkles, Navigation, 
  CheckCircle2, ShieldCheck, Tag, Users, ArrowRight,
  Layers, Info, Award
} from 'lucide-react';
import { getGatheringSubCategory, GATHERING_SUBCATEGORIES } from '../../utils/gatheringCategories.ts';

interface EventDetailCardModalProps {
  event: CommunityEvent | null;
  onClose: () => void;
  onBookEvent: (event: CommunityEvent) => void;
  onShareEvent: (event: CommunityEvent) => void;
  userProfile?: ChildProfile | null;
}

export default function EventDetailCardModal({
  event,
  onClose,
  onBookEvent,
  onShareEvent,
  userProfile
}: EventDetailCardModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const subCategoryKey = getGatheringSubCategory(event);
  const subCategoryMeta = GATHERING_SUBCATEGORIES[subCategoryKey];

  const isFree = !event.ticketPrice || event.ticketPrice === 0;
  const priceDisplay = isFree ? 'FREE Entry' : `₹${event.ticketPrice}`;
  const isFull = event.status === 'Full';

  const defaultTiers = event.ticketTiers && event.ticketTiers.length > 0 
    ? event.ticketTiers 
    : [
        {
          id: 'tier-general',
          name: 'General Admission Pass',
          price: event.ticketPrice || 0,
          capacity: 50,
          remainingStock: 24,
          description: 'Standard event access with entrance to all gathering sessions.',
          maxPerOrder: 5
        }
      ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + ', Bangalore')}`;

  return (
    <div 
      id="modal-event-detail-card"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-left flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Poster & Header Hero */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 overflow-hidden shrink-0">
          <img 
            src={event.photoUrl || '/bhagavad-geeta-class.svg'} 
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/bhagavad-geeta-class.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Floating Top Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            {/* Category / Subcategory Badge */}
            <span className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-md flex items-center gap-1.5 ${
              subCategoryKey === 'classes'
                ? 'bg-purple-900/90 text-purple-200 border-purple-400/40'
                : subCategoryKey === 'activity'
                ? 'bg-emerald-900/90 text-emerald-200 border-emerald-400/40'
                : 'bg-orange-900/90 text-orange-200 border-orange-400/40'
            }`}>
              <span>{subCategoryMeta.emoji}</span>
              <span>{subCategoryMeta.label}</span>
            </span>

            {/* Top Right Action Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-detail-share-event-top"
                onClick={() => onShareEvent(event)}
                className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-orange-600 font-extrabold text-xs shadow-md backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer"
                title="Share this event on social media or WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Share</span>
              </button>

              <button
                type="button"
                id="btn-close-event-detail"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition shadow-md cursor-pointer border border-white/20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Overlay Title & Host Info */}
          <div className="absolute bottom-3 left-4 right-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-orange-500/90 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                {event.category || 'Event'}
              </span>
              {isFull ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                  Housefull
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Bookings Open
                </span>
              )}
              {event.distance !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-black/60 text-emerald-300 font-bold text-[10px] border border-white/20 flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" />
                  {event.distance < 1 ? '< 1 km away' : `${event.distance.toFixed(1)} km away`}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight drop-shadow-md">
              {event.title}
            </h2>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Organized by <strong className="text-white font-bold">{event.hostName || 'Community Host'}</strong></span>
              <span className="text-slate-400">•</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-[11px] font-semibold">Verified Vernunt Host</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Quick Key Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Date Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                <span className="text-xs font-black text-slate-800 block truncate">{event.date}</span>
              </div>
            </div>

            {/* Time Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Timing</span>
                <span className="text-xs font-black text-slate-800 block truncate">{event.time || 'Schedule in info'}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Entry Fee</span>
                <span className="text-xs font-black text-emerald-700 block truncate">{priceDisplay}</span>
              </div>
            </div>

            {/* RSVP Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Attending</span>
                <span className="text-xs font-black text-purple-700 block truncate">{event.attendeesCount || 0} Families</span>
              </div>
            </div>
          </div>

          {/* Venue & Location Strip */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                  Venue & Location
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {event.location}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Family-friendly venue with accessible parking and kid amenities.
                </p>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" />
              <span>Get Directions ↗</span>
            </a>
          </div>

          {/* External Free Online Program Banner (if applicable e.g. Geeta Classes) */}
          {event.externalRegistrationUrl && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-purple-50 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs">
                  ★ 100% Free Online Program ★
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  Live on Zoom
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">
                Official Free Online Program by {event.hostName || 'Geeta Pariwar'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {event.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={event.externalRegistrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Register for Free Program (New Tab) ↗</span>
                </a>
                {event.externalPortalUrl && (
                  <a
                    href={event.externalPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>Portal ↗</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Full Description & Program Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>Full Event Details &amp; Overview</span>
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Recurring Schedule / Sessions (if available) */}
          {event.recurringSlots && event.recurringSlots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Available Batches &amp; Time Slots</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.recurringSlots.map((slot, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs font-semibold text-blue-950 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{slot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Ticket Tiers Preview */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-emerald-500" />
              <span>Available Ticket Options &amp; Passes</span>
            </h3>
            <div className="space-y-2">
              {defaultTiers.map((tier) => (
                <div 
                  key={tier.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900">{tier.name}</span>
                      {tier.includesKit && (
                        <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                          Includes Kit 🎨
                        </span>
                      )}
                    </div>
                    {tier.description && (
                      <p className="text-[11px] text-slate-500">{tier.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      {tier.price === 0 ? 'FREE' : `₹${tier.price}`}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {tier.remainingStock > 0 ? `${tier.remainingStock} spots left` : 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags & Sub-categories */}
          {event.tags && event.tags.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Categories &amp; Tags</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust & Safety Assurance */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Vernunt Community Protection:</strong> All listed organizers undergo identity validation and safety audits. Digital tickets with dynamic QR security are delivered instantly to your account.
            </p>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-card-footer-share"
              onClick={() => onShareEvent(event)}
              className="px-3.5 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Share event on WhatsApp, Telegram, X, Facebook, etc."
            >
              <Share2 className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">Share Event</span>
              <span className="sm:hidden">Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-close-detail-modal-footer"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>

            {event.externalRegistrationUrl ? (
              <a
                href={event.externalRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Register for Free Class ↗</span>
              </a>
            ) : (
              <button
                type="button"
                id="btn-detail-proceed-booking"
                onClick={() => {
                  onClose();
                  onBookEvent(event);
                }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Ticket className="w-4 h-4" />
                <span>{isFree ? 'Book Free Pass' : `Book Pass (${priceDisplay})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
