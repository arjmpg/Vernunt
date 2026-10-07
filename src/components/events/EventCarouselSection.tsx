import React, { useRef } from 'react';
import { CommunityEvent } from '../../types.ts';
import { 
  ChevronLeft, ChevronRight, Ticket, Navigation, 
  Sparkles, Flame, Users, Clock, Calendar, ArrowRight, QrCode 
} from 'lucide-react';
import { getEventStatus } from '../EventsTab.tsx';
import { getGatheringSubCategory, GATHERING_SUBCATEGORIES } from '../../utils/gatheringCategories.ts';

interface EventCarouselSectionProps {
  title: string;
  subtitle?: string;
  events: CommunityEvent[];
  onSeeAll?: () => void;
  seeAllLabel?: string;
  onSelectEvent: (event: CommunityEvent) => void;
  onBookEvent: (event: CommunityEvent) => void;
  onShareEvent?: (event: CommunityEvent) => void;
  onShareQr?: (event: CommunityEvent) => void;
  myTickets?: any[];
  defaultBadge?: 'PROMOTED' | 'FEATURED' | 'TOP RATED' | 'POPULAR';
}

export default function EventCarouselSection({
  title,
  subtitle,
  events,
  onSeeAll,
  seeAllLabel = 'See All',
  onSelectEvent,
  onBookEvent,
  onShareQr,
  myTickets = [],
  defaultBadge
}: EventCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!events || events.length === 0) return null;

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

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return 'Upcoming';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="space-y-3 relative group/section">
      {/* Section Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-sans font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {events.length}
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Left / Right Navigation Buttons */}
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

      {/* Horizontal Carousel View */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 px-1 snap-x snap-mandatory"
      >
        {events.map((evt) => {
          const userTicket = myTickets.find(t => t.itemId === evt.id);
          const isEventJoined = evt.joined || !!userTicket;
          const status = getEventStatus(evt);
          const formattedDate = formatEventDate(evt.date);
          const isPromoted = evt.featured || evt.isSponsored || defaultBadge === 'PROMOTED';
          const subCategoryKey = getGatheringSubCategory(evt);
          const subCategoryMeta = GATHERING_SUBCATEGORIES[subCategoryKey];

          return (
            <div
              key={evt.id}
              id={`event-card-${evt.id}`}
              onClick={() => onSelectEvent(evt)}
              className="w-[170px] sm:w-[210px] md:w-[230px] shrink-0 snap-start flex flex-col group cursor-pointer transition-all duration-200"
            >
              {/* Vertical Poster Container (Aspect Ratio ~2:3 as seen in BookMyShow) */}
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-300 border border-slate-200/80">
                <img
                  src={evt.photoUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Gradient overlay on bottom of poster */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                {/* Top Promoted / Status Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1 z-10 flex-wrap">
                  {/* Distinct Sub-Category Pill: Event (1-7 Days) vs Activity (Sports/Camp) vs Class (Permanent) */}
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs flex items-center gap-1 ${
                    subCategoryKey === 'classes'
                      ? 'bg-purple-700/90 text-white border border-purple-400/30'
                      : subCategoryKey === 'activity'
                      ? 'bg-emerald-700/90 text-white border border-emerald-400/30'
                      : 'bg-orange-600/90 text-white border border-orange-400/30'
                  }`}>
                    <span>{subCategoryMeta.emoji}</span>
                    <span>{subCategoryKey === 'classes' ? 'Class' : subCategoryKey === 'activity' ? 'Activity' : '1–7d Event'}</span>
                  </span>

                  {/* Joined / Ticket badge */}
                  {isEventJoined ? (
                    <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-md">
                      Booked ✓
                    </span>
                  ) : isPromoted ? (
                    <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider shadow-md">
                      PROMOTED
                    </span>
                  ) : null}
                </div>

                {/* Bottom Overlay Info (Price & Distance) */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-extrabold z-10">
                  <div className="bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/20 flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-orange-400" />
                    <span>{evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE'}</span>
                  </div>

                  {evt.distance !== undefined && (
                    <div className="bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/20 text-[10px] text-emerald-400 flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5" />
                      <span>{evt.distance < 1 ? '< 1 km' : `${evt.distance.toFixed(1)} km`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Poster Meta Content */}
              <div className="mt-2.5 px-0.5 space-y-1">
                {/* Subcategory & Duration Pill */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className={`px-1.5 py-0.2 rounded-md ${
                    subCategoryKey === 'classes' 
                      ? 'bg-purple-100 text-purple-700' 
                      : subCategoryKey === 'activity' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {subCategoryKey === 'classes' ? '🎓 Permanent Class' : subCategoryKey === 'activity' ? '🏊 Sports & Camp' : '🎪 1–7 Days Event'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 truncate">{evt.category || 'Gathering'}</span>
                </div>

                {/* Date */}
                <div className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{formattedDate} {evt.time ? `• ${evt.time}` : ''}</span>
                </div>

                {/* Title */}
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                  {evt.title}
                </h4>

                {/* Venue / Location & Category */}
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {evt.location || 'Bangalore'}
                </p>

                {/* Fast Action */}
                <div className="pt-1.5 flex items-center justify-between">
                  {evt.externalRegistrationUrl ? (
                    <a
                      href={evt.externalRegistrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1"
                      title="Open Free Online Registration (New Tab)"
                    >
                      <span>Free Register ↗</span>
                    </a>
                  ) : (
                    <span className="text-[11px] font-black text-rose-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Book Pass <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    {onShareQr && (
                      <button
                        type="button"
                        id={`btn-share-qr-${evt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareQr(evt);
                        }}
                        className="p-1 rounded-md bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 border border-slate-200 transition cursor-pointer"
                        title="Share Event QR Code (Direct Booking Link)"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {status === 'Full' ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        Housefull
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {evt.attendeesCount || 0} going
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
