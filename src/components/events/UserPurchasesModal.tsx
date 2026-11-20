import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Ticket, Calendar, Clock, MapPin, QrCode, CheckCircle2,
  Download, Search, Printer, Sparkles, Radio, History, User,
  Check, ShieldCheck, ScanLine
} from 'lucide-react';
import QRCode from 'qrcode';
import { Booking, ChildProfile, CommunityEvent, EventTicketPurchase } from '../../types.ts';
import { getUserEventPurchases, downloadTicketPass } from '../../data/eventPurchases.ts';

interface UserPurchasesModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser?: ChildProfile | null;
  userProfile?: ChildProfile | null;
  onBrowseEvents?: () => void;
  liveBookings?: Booking[];
  eventsList?: CommunityEvent[];
  isEventHost?: boolean;
  onOpenHostDynamicQr?: (evt: CommunityEvent) => void;
  onOpenGateDesk?: (evt: CommunityEvent) => void;
}

function bookingToTicketPurchase(b: Booking, eventsList: CommunityEvent[] = []): EventTicketPurchase {
  const matchedEvt = eventsList.find((e) => e.id === b.itemId || e.title === b.itemTitle);
  const code = b.ticketNumber || `VERN-EVT-${b.id.slice(-6).toUpperCase()}`;
  const eventDate = b.dateStr || matchedEvt?.date || new Date().toISOString().split('T')[0];
  const isPast = Boolean(eventDate && new Date(eventDate) < new Date(new Date().toDateString()));

  return {
    id: b.id,
    eventId: b.itemId,
    eventTitle: b.itemTitle || matchedEvt?.title || 'Vernunt Community Event',
    eventType: (matchedEvt?.category as any) || 'event',
    eventDate,
    eventTime: b.timeSelected || matchedEvt?.time || '10:00 AM',
    eventLocation: b.eventVenue || matchedEvt?.location || 'Bangalore, Karnataka',
    venueAddress: matchedEvt?.location || b.eventVenue,
    ticketTierName: b.ticketTierName || (b as any).tierName || 'General Pass',
    ticketQuantity: b.quantity || (b as any).ticketQuantity || 1,
    ticketPrice: b.amountPaid || 0,
    totalPaid: b.amountPaid || 0,
    purchasedAt: b.createdAt || new Date().toISOString(),
    buyerName: b.buyerName || 'Event Attendee',
    buyerPhone: b.buyerPhone || b.emergencyPhone || '',
    buyerEmail: b.buyerEmail || '',
    buyerRole: 'eventbuyers',
    status: b.checkedIn ? 'attended' : 'confirmed',
    registrationStatus: b.checkedIn ? 'Completed' : isPast ? 'Completed' : 'Upcoming',
    checkInStatus: b.checkedIn ? 'Completed' : isPast ? 'Completed' : 'Upcoming',
    isPastEvent: isPast,
    qrPassCode: code,
    bookingReference: code,
    childName: b.childName || b.buyerName,
    childAge: b.childAge,
    organizerName: matchedEvt?.hostName || 'Vernunt Event Host',
    notes: b.specialRequirements
  };
}

export const UserPurchasesModal: React.FC<UserPurchasesModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  userProfile,
  onBrowseEvents,
  liveBookings = [],
  eventsList = [],
  isEventHost = false,
  onOpenHostDynamicQr,
  onOpenGateDesk
}) => {
  const activeUser = currentUser || userProfile;

  const [purchases, setPurchases] = useState<EventTicketPurchase[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicketPurchase | null>(null);
  const [selectedTicketQrUrl, setSelectedTicketQrUrl] = useState<string>('');
  const [cardQrMap, setCardQrMap] = useState<Record<string, string>>({});

  // Top mode switcher for hosts: 'passes' (Attendee Passes & Check-in QR) | 'host_checkin' (Host Gate Check-in QR)
  const [modalMode, setModalMode] = useState<'passes' | 'host_checkin'>('passes');

  // History tab filters: 'all' | 'upcoming' | 'past'
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const phone = activeUser?.phone || activeUser?.phoneNumber;
    const email = (activeUser as any)?.email;
    const storedPurchases = getUserEventPurchases(phone, email);

    // Also load any bookings persisted in vernunt_user_event_tickets or passed via liveBookings
    let localBookings: Booking[] = [];
    try {
      const raw = localStorage.getItem('vernunt_user_event_tickets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localBookings = parsed;
      }
    } catch {
      // Ignore storage read errors
    }

    const combinedLiveBookings: Booking[] = [...liveBookings, ...localBookings];
    const seenKeys = new Set<string>();
    const merged: EventTicketPurchase[] = [];

    // 1. Prioritize live/newly booked tickets first so they always show up immediately
    for (const b of combinedLiveBookings) {
      if (!b || !b.itemTitle) continue;
      const converted = bookingToTicketPurchase(b, eventsList);
      const dedupeKey = (converted.qrPassCode || converted.bookingReference || converted.id).toLowerCase();
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        merged.push(converted);
      }
    }

    // 2. Append persisted real purchases for this user from vernunt_event_ticket_purchases_v2
    // Exclude synthetic demo seed records so only events actually booked by the user appear
    const isDemoVikram = (email || '').toLowerCase() === 'vikram.mehta@example.com';
    for (const p of storedPurchases) {
      if (!isDemoVikram && p.id && p.id.startsWith('tkt-demo-')) continue;
      const dedupeKey = (p.qrPassCode || p.bookingReference || p.id).toLowerCase();
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        merged.push(p);
      }
    }

    // Sort newest bookings first
    merged.sort((a, b) => {
      const timeA = new Date(a.purchasedAt || 0).getTime();
      const timeB = new Date(b.purchasedAt || 0).getTime();
      return timeB - timeA;
    });

    setPurchases(merged);
  }, [isOpen, activeUser, liveBookings, eventsList]);

  // Generate inline scannable QR codes for every visible pass card
  useEffect(() => {
    if (!isOpen || purchases.length === 0) return;
    let cancelled = false;

    const buildQrCodes = async () => {
      const nextMap: Record<string, string> = {};
      for (const p of purchases) {
        const key = p.qrPassCode || p.bookingReference || p.id;
        const payload = JSON.stringify({
          app: 'VERNUNT',
          ticketNumber: p.qrPassCode,
          bookingReference: p.bookingReference,
          eventId: p.eventId,
          title: p.eventTitle,
          attendee: p.childName || p.buyerName,
          date: p.eventDate,
          time: p.eventTime,
          venue: p.eventLocation,
          qty: p.ticketQuantity || 1
        });
        try {
          nextMap[key] = await QRCode.toDataURL(payload, {
            width: 220,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M'
          });
        } catch {
          nextMap[key] = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(key)}`;
        }
      }
      if (!cancelled) {
        setCardQrMap(nextMap);
      }
    };

    buildQrCodes();
    return () => {
      cancelled = true;
    };
  }, [isOpen, purchases]);

  // Generate high-res QR code whenever selectedTicket changes
  useEffect(() => {
    if (!selectedTicket) {
      setSelectedTicketQrUrl('');
      return;
    }

    const payload = JSON.stringify({
      app: 'VERNUNT',
      ticketNumber: selectedTicket.qrPassCode,
      bookingReference: selectedTicket.bookingReference,
      eventId: selectedTicket.eventId,
      title: selectedTicket.eventTitle,
      attendee: selectedTicket.childName || selectedTicket.buyerName,
      date: selectedTicket.eventDate,
      time: selectedTicket.eventTime,
      venue: selectedTicket.eventLocation,
      qty: selectedTicket.ticketQuantity || 1,
      status: selectedTicket.registrationStatus || 'Upcoming'
    });

    QRCode.toDataURL(payload, {
      width: 340,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url: string) => setSelectedTicketQrUrl(url))
      .catch(() => {
        setSelectedTicketQrUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            selectedTicket.qrPassCode
          )}`
        );
      });
  }, [selectedTicket]);

  // Only show events the user has actually booked in Host Gate Check-in QR
  const hostEvents = useMemo(() => {
    if (!isEventHost || purchases.length === 0) return [];

    const bookedEventIds = new Set(purchases.map((p) => p.eventId).filter(Boolean));
    const bookedEventTitles = new Set(
      purchases.map((p) => (p.eventTitle || '').toLowerCase().trim()).filter(Boolean)
    );

    const matchedFromList = eventsList.filter((evt) => {
      const titleNorm = (evt.title || '').toLowerCase().trim();
      return bookedEventIds.has(evt.id) || (titleNorm && bookedEventTitles.has(titleNorm));
    });

    // If a booked event isn't currently in eventsList (e.g. older booking), synthesize a lightweight event entry from the booking
    const matchedIds = new Set(matchedFromList.map((e) => e.id));
    const matchedTitles = new Set(matchedFromList.map((e) => (e.title || '').toLowerCase().trim()));
    const extraFromBookings: CommunityEvent[] = [];

    for (const p of purchases) {
      const tNorm = (p.eventTitle || '').toLowerCase().trim();
      if (!matchedIds.has(p.eventId) && !matchedTitles.has(tNorm)) {
        matchedIds.add(p.eventId);
        matchedTitles.add(tNorm);
        extraFromBookings.push({
          id: p.eventId,
          title: p.eventTitle,
          description: '',
          category: (p.eventType as any) || 'Event',
          date: p.eventDate,
          time: p.eventTime,
          location: p.eventLocation,
          hostName: p.organizerName || 'Vernunt Event Host',
          attendeesCount: p.ticketQuantity || 1,
          joined: true,
          photoUrl: '',
          ticketPrice: p.ticketPrice
        } as CommunityEvent);
      }
    }

    return [...matchedFromList, ...extraFromBookings];
  }, [isEventHost, purchases, eventsList]);

  if (isOpen === false) return null;

  const handleDownload = (ticket: EventTicketPurchase, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadTicketPass(ticket);
    setDownloadToast(`Downloaded pass for "${ticket.eventTitle}"`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  // Filter purchases according to current tab and search query
  const filteredPurchases = purchases.filter((p) => {
    const isPast = p.isPastEvent || (p.eventDate && new Date(p.eventDate) < new Date(new Date().toDateString()));
    if (activeTab === 'upcoming' && isPast) return false;
    if (activeTab === 'past' && !isPast) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.eventTitle.toLowerCase().includes(q);
      const matchRef = p.bookingReference.toLowerCase().includes(q);
      const matchPass = p.qrPassCode.toLowerCase().includes(q);
      const matchVenue = p.eventLocation.toLowerCase().includes(q);
      const matchDate = p.eventDate.includes(q);
      const matchTier = (p.ticketTierName || '').toLowerCase().includes(q);
      const matchChild = (p.childName || '').toLowerCase().includes(q);
      return matchTitle || matchRef || matchPass || matchVenue || matchDate || matchTier || matchChild;
    }
    return true;
  });

  const upcomingCount = purchases.filter(
    (p) => !p.isPastEvent && new Date(p.eventDate) >= new Date(new Date().toDateString())
  ).length;
  const pastCount = purchases.length - upcomingCount;

  const renderStatusBadge = (ticket: EventTicketPurchase) => {
    const isPast = ticket.isPastEvent || (ticket.eventDate && new Date(ticket.eventDate) < new Date(new Date().toDateString()));
    const status = ticket.registrationStatus || (isPast ? 'Completed' : 'Upcoming');

    if (status === 'Upcoming') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Upcoming</span>
        </span>
      );
    }

    if (status === 'Checking In') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs animate-pulse">
          <Radio className="w-2.5 h-2.5 text-purple-700" />
          <span>Checking In</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
        <span>{isPast ? 'Completed' : 'Verified'}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 p-5 text-white shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase rounded-full flex items-center gap-1">
              <QrCode className="w-3 h-3" /> My Passes &amp; Check-in QR
            </span>
            <span className="px-2 py-0.5 bg-black/20 text-white font-mono text-[10px] font-bold rounded-md">
              {purchases.length} {purchases.length === 1 ? 'Pass' : 'Passes'}
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif leading-tight">
            My Passes &amp; Check-in QR
          </h2>
          <p className="text-xs text-rose-100 mt-0.5">
            {activeUser?.parentName || activeUser?.childName || 'Event Attendee'}
            {(activeUser as any)?.email ? ` • ${(activeUser as any).email}` : ''}
            {activeUser?.phone || activeUser?.phoneNumber ? ` • +91 ${activeUser?.phone || activeUser?.phoneNumber}` : ''}
          </p>

          {/* Merged Host Switcher: Attendee Booked Passes vs Host Gate Check-in QR */}
          {isEventHost && onOpenHostDynamicQr && (
            <div className="mt-3.5 inline-flex items-center gap-1 bg-black/20 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setModalMode('passes');
                  setSelectedTicket(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modalMode === 'passes'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>My Booked Passes ({purchases.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode('host_checkin');
                  setSelectedTicket(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modalMode === 'host_checkin'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Host Gate Check-in QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Download Toast Notification */}
        {downloadToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 shadow-md">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {downloadToast}
            </span>
            <button onClick={() => setDownloadToast(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">

          {modalMode === 'host_checkin' && isEventHost ? (
            /* Merged Host Gate Check-in QR Generator Tab */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Host Gate Check-in QR Station</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Generate a temporary, single-use rotating Check-in QR code for your event entrance or open the Gate Desk scanner to verify attendee passes.
                  </p>
                </div>
              </div>

              {hostEvents.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No booked events yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Only events you have booked appear here. Book an event to see its Check-in QR code and details.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hostEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 bg-white border border-slate-200 hover:border-rose-300 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{evt.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" /> {evt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-500" /> {evt.time}
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> {evt.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {onOpenGateDesk && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenGateDesk(evt);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <ScanLine className="w-3.5 h-3.5 text-orange-600" />
                            <span>Gate Scanner</span>
                          </button>
                        )}
                        {onOpenHostDynamicQr && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenHostDynamicQr(evt);
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Launch Check-in QR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedTicket ? (
            /* Detailed Full-Screen Digital Check-in QR Pass View */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  ← Back to All Booked Passes
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedTicket)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Digital Pass Presentation Card */}
              <div className="border-2 border-dashed border-rose-300 rounded-3xl p-6 bg-gradient-to-b from-rose-50/50 via-white to-orange-50/30 text-center space-y-4 relative overflow-hidden shadow-sm">

                <div className="flex items-center justify-center gap-2">
                  {renderStatusBadge(selectedTicket)}
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                    {selectedTicket.isPastEvent ? 'Past Event Pass' : 'Active Check-in QR Pass'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-serif">
                    {selectedTicket.eventTitle}
                  </h3>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2">
                    <span>Booking Ref: <strong className="font-mono text-slate-800">{selectedTicket.bookingReference}</strong></span>
                    <span>•</span>
                    <span>Pass ID: <strong className="font-mono text-slate-800">{selectedTicket.qrPassCode}</strong></span>
                  </div>
                </div>

                {/* Large Scannable Check-in QR Visual */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl w-56 h-56 mx-auto flex flex-col items-center justify-center shadow-xs">
                  {selectedTicketQrUrl ? (
                    <img
                      src={selectedTicketQrUrl}
                      alt="Event Check-in QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 text-slate-900" />
                  )}
                  <div className="text-[10px] font-mono text-slate-700 font-bold mt-2">
                    {selectedTicket.qrPassCode}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Present this Check-in QR code at the venue gate for instant entry verification
                </p>

                {/* Pass Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DATE &amp; TIME</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.eventDate} at {selectedTicket.eventTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PASS TIER</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.ticketTierName || 'General Pass'} ({selectedTicket.ticketQuantity}x)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ATTENDEE NAME</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.childName || selectedTicket.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">AMOUNT PAID</span>
                    <span className="font-semibold text-emerald-700">{selectedTicket.totalPaid === 0 ? 'FREE ADMISSION' : `₹${selectedTicket.totalPaid}`}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">VENUE LOCATION</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.eventLocation}</span>
                    {selectedTicket.venueAddress && selectedTicket.venueAddress !== selectedTicket.eventLocation && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">{selectedTicket.venueAddress}</span>
                    )}
                  </div>
                  {selectedTicket.seatNumber && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block">RESERVED SEAT / POSITION</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedTicket.seatNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedTicket)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>Download Offline Pass</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Booked Passes List with Inline Check-in QR Code & Full Event Details */
            <div className="space-y-4">

              {/* Toolbar: Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({purchases.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'upcoming' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Upcoming ({upcomingCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('past')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      activeTab === 'past' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span>Past ({pastCount})</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search passes by event, pass ID, venue..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              {/* Passes List */}
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {searchQuery ? 'No passes match your search query' : 'No booked event passes yet'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {searchQuery
                      ? 'Try searching by different keywords or clear your search filter.'
                      : 'Once you book an event, your scannable Check-in QR code and complete event details will appear right here.'}
                  </p>
                  {onBrowseEvents && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onBrowseEvents();
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Browse Upcoming Events
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredPurchases.map((purchase) => {
                    const isPast =
                      purchase.isPastEvent ||
                      (purchase.eventDate && new Date(purchase.eventDate) < new Date(new Date().toDateString()));
                    const qrKey = purchase.qrPassCode || purchase.bookingReference || purchase.id;
                    const inlineQrUrl = cardQrMap[qrKey];

                    return (
                      <div
                        key={purchase.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md ${
                          isPast
                            ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            : 'bg-white border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        {/* Inline Scannable Check-in QR Preview */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(purchase)}
                          title="Tap to enlarge Check-in QR Pass"
                          className="shrink-0 mx-auto sm:mx-0 p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-2xl flex flex-col items-center justify-center w-28 transition cursor-pointer group"
                        >
                          {inlineQrUrl ? (
                            <img
                              src={inlineQrUrl}
                              alt={`Check-in QR for ${purchase.eventTitle}`}
                              className="w-22 h-22 object-contain rounded-lg bg-white p-1"
                            />
                          ) : (
                            <div className="w-22 h-22 flex items-center justify-center bg-white rounded-lg">
                              <QrCode className="w-12 h-12 text-slate-800" />
                            </div>
                          )}
                          <span className="text-[9px] font-mono font-bold text-slate-600 group-hover:text-rose-700 mt-1 truncate max-w-full">
                            {purchase.qrPassCode}
                          </span>
                        </button>

                        {/* Event Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {renderStatusBadge(purchase)}

                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200">
                              {purchase.ticketTierName || 'General Pass'} × {purchase.ticketQuantity || 1}
                            </span>

                            <span className="text-[10px] font-mono text-slate-500">
                              Ref: {purchase.bookingReference}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {purchase.eventTitle}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {purchase.eventDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {purchase.eventTime}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{purchase.eventLocation}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              Attendee: <strong>{purchase.childName || purchase.buyerName}</strong>
                              {purchase.childAge ? ` (${purchase.childAge} yrs)` : ''}
                            </span>
                            <span className="font-bold text-emerald-700">
                              {purchase.totalPaid === 0 ? 'FREE PASS' : `Paid ₹${purchase.totalPaid}`}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(purchase)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer w-full sm:w-auto justify-center"
                          >
                            <QrCode className="w-3.5 h-3.5 text-rose-400" />
                            <span>Full Check-in QR</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownload(purchase, e)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                            title="Download digital pass for offline access"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Show your Check-in QR code at the event entrance for instant entry
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserPurchasesModal;
