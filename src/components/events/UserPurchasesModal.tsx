import React, { useState, useEffect } from 'react';
import { 
  X, Ticket, Calendar, Clock, MapPin, QrCode, CheckCircle2, 
  Download, Search, AlertCircle, ArrowRight, Printer, Sparkles, 
  Radio, History, User, Check, Share2
} from 'lucide-react';
import QRCode from 'qrcode';
import { ChildProfile, EventTicketPurchase } from '../../types.ts';
import { getUserEventPurchases, downloadTicketPass } from '../../data/eventPurchases.ts';

interface UserPurchasesModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser?: ChildProfile | null;
  userProfile?: ChildProfile | null;
  onBrowseEvents?: () => void;
}

export const UserPurchasesModal: React.FC<UserPurchasesModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  userProfile,
  onBrowseEvents
}) => {
  const activeUser = currentUser || userProfile;

  const [purchases, setPurchases] = useState<EventTicketPurchase[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicketPurchase | null>(null);
  const [selectedTicketQrUrl, setSelectedTicketQrUrl] = useState<string>('');
  
  // History tab filters: 'all' | 'upcoming' | 'past'
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const phone = activeUser?.phone || activeUser?.phoneNumber;
      const email = (activeUser as any)?.email;
      const userPurchases = getUserEventPurchases(phone, email);
      setPurchases(userPurchases);
    }
  }, [isOpen, activeUser]);

  // Generate crisp QR code whenever selectedTicket changes
  useEffect(() => {
    if (!selectedTicket) {
      setSelectedTicketQrUrl('');
      return;
    }

    const payload = JSON.stringify({
      ticketNumber: selectedTicket.qrPassCode,
      bookingReference: selectedTicket.bookingReference,
      eventId: selectedTicket.eventId,
      title: selectedTicket.eventTitle,
      attendee: selectedTicket.childName || selectedTicket.buyerName,
      date: selectedTicket.eventDate,
      time: selectedTicket.eventTime,
      venue: selectedTicket.eventLocation,
      status: selectedTicket.registrationStatus || 'Completed'
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url: string) => setSelectedTicketQrUrl(url))
      .catch(() => {
        // Fallback to public QR API if local generation fails
        setSelectedTicketQrUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            selectedTicket.qrPassCode
          )}`
        );
      });
  }, [selectedTicket]);

  if (isOpen === false) return null;

  const handleDownload = (ticket: EventTicketPurchase, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadTicketPass(ticket);
    setDownloadToast(`Downloaded pass for "${ticket.eventTitle}"`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  // Filter purchases according to current tab and search query
  const filteredPurchases = purchases.filter(p => {
    // 1. Tab filter
    const isPast = p.isPastEvent || (p.eventDate && new Date(p.eventDate) < new Date());
    if (activeTab === 'upcoming' && isPast) return false;
    if (activeTab === 'past' && !isPast) return false;

    // 2. Keyword search
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

  const upcomingCount = purchases.filter(p => !p.isPastEvent && (new Date(p.eventDate) >= new Date())).length;
  const pastCount = purchases.length - upcomingCount;

  // Render a color-coded status badge for tickets
  const renderStatusBadge = (ticket: EventTicketPurchase) => {
    const isPast = ticket.isPastEvent || (ticket.eventDate && new Date(ticket.eventDate) < new Date());
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

    // Completed / Attended
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
              <Ticket className="w-3 h-3" /> My Tickets & Passes History
            </span>
            <span className="px-2 py-0.5 bg-black/20 text-white font-mono text-[10px] font-bold rounded-md">
              {purchases.length} Total Passes
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif leading-tight">
            My Event Passes & Admission Wallet
          </h2>
          <p className="text-xs text-rose-100 mt-0.5">
            Registered for {activeUser?.parentName || activeUser?.childName || 'Event Attendee'} • Mobile: +91 {activeUser?.phone || activeUser?.phoneNumber || '9845012345'}
          </p>
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
          
          {selectedTicket ? (
            /* Detailed Digital QR Pass View */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  ← Back to 'My Tickets' History
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
                    {selectedTicket.isPastEvent ? 'Past Event Pass' : 'Active Gate Pass'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 font-serif">
                    {selectedTicket.eventTitle}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center justify-center gap-3">
                    <span>Booking Ref: <strong className="font-mono text-slate-800">{selectedTicket.bookingReference}</strong></span>
                    <span>•</span>
                    <span>Pass ID: <strong className="font-mono text-slate-800">{selectedTicket.qrPassCode}</strong></span>
                  </div>
                </div>

                {/* QR Visual */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl w-52 h-52 mx-auto flex flex-col items-center justify-center shadow-xs">
                  {selectedTicketQrUrl ? (
                    <img 
                      src={selectedTicketQrUrl} 
                      alt="Digital Ticket QR Code" 
                      className="w-36 h-36 object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 text-slate-900" />
                  )}
                  <div className="text-[10px] font-mono text-slate-600 font-bold mt-2">
                    {selectedTicket.qrPassCode}
                  </div>
                </div>

                {/* Pass Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DATE & TIME</span>
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
                    {selectedTicket.venueAddress && (
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
                    <span>Download Offline HTML/SVG Pass</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* History Section List with Tabs & Search */
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
                    All Passes ({purchases.length})
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
                    <span>Past Events ({pastCount})</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search past passes by title, ref, venue..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              {/* Passes List */}
              {filteredPurchases.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 space-y-3 bg-slate-50/60 rounded-3xl border border-dashed-2 border-slate-200">
                  <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {searchQuery ? 'No passes match your search query' : 'No event passes in this category'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {searchQuery ? 'Try searching by different keywords or clear your search filter.' : 'Check back after booking passes or explore upcoming workshops.'}
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
                <div className="space-y-3">
                  {filteredPurchases.map((purchase) => {
                    const isPast = purchase.isPastEvent || (purchase.eventDate && new Date(purchase.eventDate) < new Date());

                    return (
                      <div
                        key={purchase.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-sm ${
                          isPast 
                            ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300' 
                            : 'bg-white border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Badges Bar */}
                          <div className="flex flex-wrap items-center gap-2">
                            {renderStatusBadge(purchase)}

                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200">
                              {purchase.ticketTierName || 'General Pass'}
                            </span>

                            <span className="text-[10px] font-mono text-slate-400">
                              Ref: {purchase.bookingReference}
                            </span>

                            {isPast && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                Past Event
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {purchase.eventTitle}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventTime}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventLocation}
                            </span>
                          </div>

                          {purchase.childName && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>Attendee: <strong>{purchase.childName}</strong> {purchase.childAge ? `(${purchase.childAge} yrs)` : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-150">
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              {purchase.totalPaid === 0 ? 'FREE PASS' : `₹${purchase.totalPaid}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {purchase.ticketQuantity} {purchase.ticketQuantity === 1 ? 'pass' : 'passes'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Download Pass Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDownload(purchase, e)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                              title="Download digital pass for quick access"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Download</span>
                            </button>

                            {/* View Pass QR */}
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(purchase)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-rose-400" />
                              <span>View Pass</span>
                            </button>
                          </div>
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
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Showing verified tickets for mobile +91 {activeUser?.phone || activeUser?.phoneNumber || '9845012345'}
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
