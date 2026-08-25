import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Sparkles, 
  Users, 
  Calendar, 
  Baby, 
  CheckCheck, 
  Filter, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  MessageSquare, 
  QrCode, 
  MapPin, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Send,
  Zap,
  SlidersHorizontal,
  UploadCloud
} from 'lucide-react';
import { ChildProfile, CommunityEvent, CareBookingRequest, CareBookingStatus } from '../types.ts';
import { ProximityAlert } from './ProximityAlertToast.tsx';

export type ActivityCategory = 'all' | 'playmates' | 'events' | 'care';

export interface ActivityItem {
  id: string;
  category: 'playmates' | 'events' | 'care';
  type: 
    | 'proximity_playmate' 
    | 'connection_request' 
    | 'connection_accepted' 
    | 'proximity_event' 
    | 'event_pass_ready' 
    | 'care_booking_request' 
    | 'care_status_update'
    | 'care_sitter_available';
  title: string;
  subtitle: string;
  description?: string;
  timestamp: number;
  isRead: boolean;
  urgency: 'high' | 'medium' | 'normal';
  photoUrl?: string;
  avatarEmoji?: string;
  distanceKm?: number;
  targetId?: string;
  metadata?: {
    partnerName?: string;
    childName?: string;
    age?: number;
    playStyle?: string;
    eventDate?: string;
    eventTime?: string;
    careStatus?: string;
    dropOffPin?: string;
    hourlyRate?: number;
  };
}

interface ActivityFeedWidgetProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  eventsList: CommunityEvent[];
  careBookings: CareBookingRequest[];
  connectedIds: string[];
  interestsReceived: string[];
  interestsSent: string[];
  proximityAlerts: ProximityAlert[];
  onSelectPlaymate: (playmate: ChildProfile) => void;
  onAcceptConnection: (playmateId: string) => void;
  onOpenChat: (playmate: ChildProfile) => void;
  onViewEvent: (event: CommunityEvent) => void;
  onGenerateQrPass: () => void;
  onViewCareBooking?: (booking: CareBookingRequest) => void;
  onUpdateCareStatus?: (bookingId: string, status: CareBookingStatus, note?: string) => void;
  onNavigateToTab: (tab: string) => void;
  onTriggerSimulatedAlert?: (type: 'playmate' | 'event') => void;
  onOpenOutboxDrawer?: () => void;
}

export default function ActivityFeedWidget({
  playmates,
  userProfile,
  eventsList,
  careBookings,
  connectedIds,
  interestsReceived,
  interestsSent,
  proximityAlerts,
  onSelectPlaymate,
  onAcceptConnection,
  onOpenChat,
  onViewEvent,
  onGenerateQrPass,
  onViewCareBooking,
  onUpdateCareStatus,
  onNavigateToTab,
  onTriggerSimulatedAlert,
  onOpenOutboxDrawer
}: ActivityFeedWidgetProps) {
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('all');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [readItemIds, setReadItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vernunt_activity_read_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedItemIds, setDismissedItemIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vernunt_activity_dismissed_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Mark single item as read
  const markAsRead = (id: string) => {
    setReadItemIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('vernunt_activity_read_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.debug('Read IDs storage note:', e);
      }
      return next;
    });
  };

  // Mark all currently visible items as read
  const markAllAsRead = () => {
    setReadItemIds(prev => {
      const next = new Set(prev);
      feedItems.forEach(item => next.add(item.id));
      try {
        localStorage.setItem('vernunt_activity_read_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.debug('Read all IDs note:', e);
      }
      return next;
    });
  };

  // Dismiss item
  const dismissItem = (id: string) => {
    setDismissedItemIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('vernunt_activity_dismissed_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.debug('Dismiss IDs note:', e);
      }
      return next;
    });
  };

  // Generate dynamic, categorized feed items from all app states
  const feedItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. CATEGORY: NEARBY PLAYMATES & CONNECTIONS
    // A. Incoming Connection Requests
    interestsReceived.forEach(reqId => {
      const sender = playmates.find(p => p.id === reqId);
      if (sender && !connectedIds.includes(reqId)) {
        items.push({
          id: `feed-conn-req-${reqId}`,
          category: 'playmates',
          type: 'connection_request',
          title: `Connection Request: ${sender.parentName}`,
          subtitle: `Wants to introduce ${sender.childName} (${sender.childAge}y) for neighborhood playdates`,
          description: `Play style: ${sender.playStyle || 'Active'} • Location: ${sender.location?.address || 'Near you'}`,
          timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
          isRead: readItemIds.has(`feed-conn-req-${reqId}`),
          urgency: 'high',
          photoUrl: sender.photoUrl || sender.childPhotoUrl || sender.parentPhotoUrl,
          avatarEmoji: '🧸',
          distanceKm: sender.location?.distance || 0.6,
          targetId: sender.id,
          metadata: {
            partnerName: sender.parentName,
            childName: sender.childName,
            age: sender.childAge,
            playStyle: sender.playStyle
          }
        });
      }
    });

    // B. Proximity alerts for nearby playmates (< 1km)
    proximityAlerts
      .filter(alert => alert.type === 'playmate')
      .forEach(alert => {
        items.push({
          id: `feed-prox-pm-${alert.id}`,
          category: 'playmates',
          type: 'proximity_playmate',
          title: `Nearby Playmate in Area: ${alert.title}`,
          subtitle: alert.subtitle,
          description: alert.address || 'Active within immediate walking distance',
          timestamp: alert.timestamp,
          isRead: readItemIds.has(`feed-prox-pm-${alert.id}`),
          urgency: alert.distanceKm <= 0.5 ? 'high' : 'medium',
          photoUrl: alert.photoUrl,
          avatarEmoji: alert.avatarEmoji || '🎈',
          distanceKm: alert.distanceKm,
          targetId: alert.targetId
        });
      });

    // C. Accepted Connection Milestones
    connectedIds.slice(0, 3).forEach(connId => {
      const partner = playmates.find(p => p.id === connId);
      if (partner) {
        items.push({
          id: `feed-conn-acc-${connId}`,
          category: 'playmates',
          type: 'connection_accepted',
          title: `Connected with ${partner.childName} & ${partner.parentName}`,
          subtitle: 'Direct family chat and playdate calendar unlocked',
          timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
          isRead: readItemIds.has(`feed-conn-acc-${connId}`),
          urgency: 'normal',
          photoUrl: partner.photoUrl,
          avatarEmoji: '🤝',
          distanceKm: partner.location?.distance || 1.2,
          targetId: partner.id
        });
      }
    });

    // 2. CATEGORY: EVENT ALERTS
    // A. Proximity alerts for events
    proximityAlerts
      .filter(alert => alert.type === 'event')
      .forEach(alert => {
        items.push({
          id: `feed-prox-evt-${alert.id}`,
          category: 'events',
          type: 'proximity_event',
          title: `Community Event Nearby: ${alert.title}`,
          subtitle: alert.subtitle,
          description: alert.address,
          timestamp: alert.timestamp,
          isRead: readItemIds.has(`feed-prox-evt-${alert.id}`),
          urgency: 'medium',
          photoUrl: alert.photoUrl,
          avatarEmoji: alert.avatarEmoji || '🎉',
          distanceKm: alert.distanceKm,
          targetId: alert.targetId
        });
      });

    // B. Featured or Joined Events
    eventsList.slice(0, 2).forEach(evt => {
      items.push({
        id: `feed-evt-${evt.id}`,
        category: 'events',
        type: 'event_pass_ready',
        title: evt.title,
        subtitle: `${evt.date} at ${evt.time} • ${evt.location}`,
        description: `Pass scanner ready: ${evt.attendeesCount} families RSVP'd`,
        timestamp: Date.now() - 1000 * 60 * 45,
        isRead: readItemIds.has(`feed-evt-${evt.id}`),
        urgency: evt.joined ? 'high' : 'normal',
        photoUrl: evt.photoUrl,
        avatarEmoji: '🎟️',
        targetId: evt.id,
        metadata: {
          eventDate: evt.date,
          eventTime: evt.time
        }
      });
    });

    // 3. CATEGORY: CARE REQUESTS & SITTING UPDATES
    careBookings.forEach(booking => {
      const isPending = booking.status === 'Pending';
      items.push({
        id: `feed-care-${booking.id}`,
        category: 'care',
        type: isPending ? 'care_booking_request' : 'care_status_update',
        title: isPending 
          ? `Sitting Request: ${booking.childName} with ${booking.providerName}`
          : `Care Session Update: ${booking.childName} is ${booking.status}`,
        subtitle: `${booking.date} (${booking.startTime} - ${booking.endTime}) • ₹${booking.totalAmount}`,
        description: booking.specialInstructions 
          ? `Notes: ${booking.specialInstructions}` 
          : `Security Drop-off PIN: ${booking.dropOffPin || '****'}`,
        timestamp: Date.now() - 1000 * 60 * 30,
        isRead: readItemIds.has(`feed-care-${booking.id}`),
        urgency: isPending ? 'high' : 'medium',
        avatarEmoji: '🍼',
        targetId: booking.id,
        metadata: {
          childName: booking.childName,
          partnerName: booking.providerName,
          careStatus: booking.status,
          dropOffPin: booking.dropOffPin
        }
      });
    });

    // Sort all by timestamp descending (newest first)
    return items
      .filter(item => !dismissedItemIds.has(item.id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [
    interestsReceived,
    connectedIds,
    playmates,
    proximityAlerts,
    eventsList,
    careBookings,
    readItemIds,
    dismissedItemIds
  ]);

  // Filtered by category, unread, urgent, and search query
  const filteredFeed = useMemo(() => {
    return feedItems.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Unread only filter
      if (filterUnreadOnly && item.isRead) {
        return false;
      }
      // Urgent only filter
      if (filterUrgentOnly && item.urgency !== 'high') {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSub = item.subtitle.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesDesc) return false;
      }
      return true;
    });
  }, [feedItems, activeCategory, filterUnreadOnly, filterUrgentOnly, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    return {
      all: feedItems.length,
      playmates: feedItems.filter(i => i.category === 'playmates').length,
      events: feedItems.filter(i => i.category === 'events').length,
      care: feedItems.filter(i => i.category === 'care').length,
      unreadTotal: feedItems.filter(i => !i.isRead).length
    };
  }, [feedItems]);

  const getTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'normal') => {
    switch (urgency) {
      case 'high':
        return (
          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.2 rounded-md font-mono shadow-2xs">
            Urgent Action
          </span>
        );
      case 'medium':
        return (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md font-mono">
            Proximity
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      id="activity-feed-widget" 
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-tight">
                  Activity Feed & Alerts
                </h3>
                {categoryCounts.unreadTotal > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-mono font-black px-2 py-0.2 rounded-full shadow-2xs animate-pulse">
                    {categoryCounts.unreadTotal} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Filtered proximity blips, connection requests & care notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-feed-mute-toggle"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl transition cursor-pointer text-xs ${
                isMuted 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
              title={isMuted ? 'Notifications Muted' : 'Sound Notifications Enabled'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {onOpenOutboxDrawer && (
              <button
                id="btn-feed-open-outbox"
                type="button"
                onClick={onOpenOutboxDrawer}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl transition cursor-pointer text-xs flex items-center gap-1"
                title="View background sync outbox"
              >
                <UploadCloud className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] font-bold hidden sm:inline">Outbox</span>
              </button>
            )}

            <button
              id="btn-feed-mark-all-read"
              type="button"
              onClick={markAllAsRead}
              className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl transition cursor-pointer text-xs flex items-center gap-1"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold hidden sm:inline">Read All</span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            id="tab-feed-all"
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <span>All Updates</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeCategory === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-white/20 text-white'
            }`}>
              {categoryCounts.all}
            </span>
          </button>

          <button
            id="tab-feed-playmates"
            type="button"
            onClick={() => setActiveCategory('playmates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'playmates'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nearby Playmates</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {categoryCounts.playmates}
            </span>
          </button>

          <button
            id="tab-feed-events"
            type="button"
            onClick={() => setActiveCategory('events')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'events'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Event Alerts</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {categoryCounts.events}
            </span>
          </button>

          <button
            id="tab-feed-care"
            type="button"
            onClick={() => setActiveCategory('care')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'care'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Care Requests</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {categoryCounts.care}
            </span>
          </button>
        </div>
      </div>

      {/* Noise Reduction & Search Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-feed-search"
            type="text"
            placeholder="Search proximity updates, playmates, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-filter-unread-toggle"
            type="button"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              filterUnreadOnly
                ? 'bg-orange-500 border-orange-500 text-white shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Unread Only</span>
          </button>

          <button
            id="btn-filter-urgent-toggle"
            type="button"
            onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              filterUrgentOnly
                ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🚨 Urgent Only</span>
          </button>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
        {filteredFeed.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CheckCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-slate-700 text-sm">No Updates in this Category</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchQuery || filterUnreadOnly || filterUrgentOnly 
                ? 'No alerts match your active noise reduction filters.'
                : 'All caught up! New neighborhood updates and requests will stream here dynamically.'}
            </p>
          </div>
        ) : (
          filteredFeed.map((item) => {
            const isConnReq = item.type === 'connection_request';
            const isProxPm = item.type === 'proximity_playmate';
            const isProxEvt = item.type === 'proximity_event';
            const isCareReq = item.type === 'care_booking_request' || item.type === 'care_status_update';

            return (
              <div
                key={item.id}
                id={`activity-card-${item.id}`}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 relative group hover:shadow-md ${
                  !item.isRead
                    ? 'bg-rose-50/40 border-rose-200/90 shadow-2xs'
                    : 'bg-white border-slate-150 text-slate-700 hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar / Photo */}
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {item.photoUrl ? (
                        <img 
                          src={item.photoUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg bg-slate-100">
                          {item.avatarEmoji || '🔔'}
                        </div>
                      )}
                      {item.distanceKm !== undefined && (
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7.5px] font-mono text-white text-center font-bold">
                          {item.distanceKm.toFixed(1)}km
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getUrgencyBadge(item.urgency)}
                        <span className="text-[10px] font-bold text-slate-400">
                          {getTimeAgo(item.timestamp)}
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Unread"></span>
                        )}
                      </div>

                      <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 truncate mt-0.5 leading-tight">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 font-medium leading-snug mt-0.5">
                        {item.subtitle}
                      </p>

                      {item.description && (
                        <p className="text-[10.5px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-150/70">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissItem(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contextual Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-150/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Action 1: Accept Connection */}
                    {isConnReq && item.targetId && (
                      <button
                        id={`btn-feed-accept-conn-${item.targetId}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                          onAcceptConnection(item.targetId!);
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-black rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept Connect</span>
                      </button>
                    )}

                    {/* Action 2: View Playmate Profile */}
                    {(isConnReq || isProxPm) && item.targetId && (
                      <button
                        id={`btn-feed-view-pm-${item.targetId}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                          const target = playmates.find(p => p.id === item.targetId);
                          if (target) onSelectPlaymate(target);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Action 3: Quick Chat */}
                    {connectedIds.includes(item.targetId || '') && (
                      <button
                        id={`btn-feed-chat-${item.targetId}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                          const target = playmates.find(p => p.id === item.targetId);
                          if (target) onOpenChat(target);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10.5px] font-bold rounded-lg border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-blue-600" />
                        <span>Chat</span>
                      </button>
                    )}

                    {/* Action 4: View Event / Generate QR Pass */}
                    {(isProxEvt || item.category === 'events') && (
                      <>
                        <button
                          id={`btn-feed-view-evt-${item.targetId}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                            const target = eventsList.find(evt => evt.id === item.targetId) || eventsList[0];
                            if (target) onViewEvent(target);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10.5px] font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Event Details</span>
                        </button>

                        <button
                          id="btn-feed-generate-qr-pass"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                            onGenerateQrPass();
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3 text-amber-400" />
                          <span>Get QR Pass</span>
                        </button>
                      </>
                    )}

                    {/* Action 5: Care Booking Details */}
                    {isCareReq && (
                      <button
                        id={`btn-feed-care-${item.targetId}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                          onNavigateToTab('daycare');
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Baby className="w-3 h-3" />
                        <span>Manage Sitting Session</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    #{item.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Simulation / Testing Action Bar */}
      {onTriggerSimulatedAlert && (
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Test Real-Time Categories:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="btn-sim-test-playmate-feed"
              type="button"
              onClick={() => onTriggerSimulatedAlert('playmate')}
              className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-extrabold transition cursor-pointer shadow-2xs"
            >
              + Test Playmate Blip
            </button>

            <button
              id="btn-sim-test-event-feed"
              type="button"
              onClick={() => onTriggerSimulatedAlert('event')}
              className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-extrabold transition cursor-pointer shadow-2xs"
            >
              + Test Event Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
