import React, { useState, useEffect, useRef } from 'react';
import { Booking, CommunityEvent } from '../../types.ts';
import { 
  X, Download, Calendar, MapPin, Clock, CheckCircle2, QrCode, 
  Share2, Copy, Check, AlertCircle, ExternalLink, Printer, 
  Send, User, Phone, Sparkles, ShieldCheck, Ticket, CalendarPlus,
  Mail, MessageSquare
} from 'lucide-react';
import QRCode from 'qrcode';
import { sendEventBookingNotifications } from '../../utils/notifications.ts';

interface EventTicketPassModalProps {
  booking: Booking;
  event?: CommunityEvent | null;
  onClose: () => void;
  onTransferTicket?: (bookingId: string, newEmail: string, newPhone: string) => void;
}

export default function EventTicketPassModal({
  booking,
  event,
  onClose,
  onTransferTicket
}: EventTicketPassModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [notifyFeedback, setNotifyFeedback] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const qrPayload = booking.qrPayload || JSON.stringify({
    type: 'VERNUNT_EVENT_PASS',
    ticketNumber: ticketNumber,
    bookingId: booking.id,
    eventId: booking.itemId,
    buyerName: booking.buyerName,
    childName: booking.childName || '',
    tier: booking.ticketTierName || 'Standard Admission',
    date: booking.dateStr,
    time: booking.timeSelected,
    amountPaid: booking.amountPaid,
    issuedAt: booking.createdAt || new Date().toISOString()
  });

  useEffect(() => {
    // Generate crisp QR code SVG/PNG
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: any) => console.error('Error generating QR code:', err));
  }, [qrPayload]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/ticket/${ticketNumber}?bookingId=${booking.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `🎟️ Here is my ticket for "${booking.itemTitle}" on Vernunt!%0A📅 Date: ${booking.dateStr} at ${booking.timeSelected}%0A📍 Venue: ${booking.eventVenue || event?.location || 'Venue details inside'}%0A🎫 Ticket ID: ${ticketNumber}%0AView verified digital pass: ${window.location.origin}/events?eventId=${booking.itemId}`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Vernunt Event: ${booking.itemTitle}`);
    const details = encodeURIComponent(`Digital Pass #${ticketNumber}\nAttendee: ${booking.childName ? `${booking.childName} (Parent: ${booking.buyerName})` : booking.buyerName}\nTier: ${booking.ticketTierName || 'Standard'}\nAmount: ₹${booking.amountPaid}`);
    const location = encodeURIComponent(booking.eventVenue || event?.location || 'Vernunt Event Location');
    
    // Parse date safely
    let startTime = '20260825T100000Z';
    let endTime = '20260825T120000Z';
    try {
      const d = new Date(booking.dateStr);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        startTime = `${y}${m}${day}T043000Z`; // Default 10:00 AM IST (+5:30)
        endTime = `${y}${m}${day}T063000Z`;
      }
    } catch (e) {
      // fallback
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTime}/${endTime}`;
  };

  const downloadICSFile = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vernunt//Event Ticket Pass//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${ticketNumber}@vernunt.com
SUMMARY:Vernunt Event: ${booking.itemTitle}
DESCRIPTION:Vernunt E-Ticket #${ticketNumber}\\nAttendee: ${booking.childName || booking.buyerName}\\nTier: ${booking.ticketTierName || 'Standard'}
LOCATION:${booking.eventVenue || event?.location || 'Event Venue'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `ticket-${ticketNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmailPass = async () => {
    const targetEmail = booking.buyerEmail || 'parent@vernunt.org';
    setIsSendingEmail(true);
    try {
      await sendEventBookingNotifications({
        toEmail: targetEmail,
        recipientName: booking.buyerName,
        booking: booking,
        event: event,
        type: 'booking_confirmed'
      });
      setNotifyFeedback(`E-Ticket & QR code pass sent to ${targetEmail}!`);
      setTimeout(() => setNotifyFeedback(null), 3500);
    } catch (e) {
      setNotifyFeedback(`Could not deliver email. Please try again.`);
      setTimeout(() => setNotifyFeedback(null), 3500);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendSmsPass = async () => {
    const targetPhone = booking.buyerPhone || '+91 98765 43210';
    setIsSendingSms(true);
    try {
      await sendEventBookingNotifications({
        toPhone: targetPhone,
        recipientName: booking.buyerName,
        booking: booking,
        event: event,
        type: 'booking_confirmed'
      });
      setNotifyFeedback(`Gate check-in pass sent via SMS to ${targetPhone}!`);
      setTimeout(() => setNotifyFeedback(null), 3500);
    } catch (e) {
      setNotifyFeedback(`Could not deliver SMS. Please try again.`);
      setTimeout(() => setNotifyFeedback(null), 3500);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail && !transferPhone) return;
    if (onTransferTicket) {
      onTransferTicket(booking.id, transferEmail, transferPhone);
    }
    setTransferSuccess(true);
    setTimeout(() => {
      setShowTransferModal(false);
      setTransferSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white border border-white/30">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-orange-100 block">
                  Vernunt Verified E-Ticket
                </span>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  Official Admission Pass
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
            <span className="font-mono font-bold tracking-wide">
              ID: {ticketNumber}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {booking.checkedIn ? 'Checked In' : 'Confirmed & Active'}
            </span>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div ref={printRef} className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50">
          
          {/* Event Details Card */}
          <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
            {event?.photoUrl ? (
              <img
                src={event.photoUrl}
                alt={booking.itemTitle}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                🎉
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 mb-1">
                {booking.ticketTierName || 'General Entry'}
              </span>
              <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                {booking.itemTitle}
              </h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                Hosted by {event?.hostName || 'Verified Community Organizer'}
              </p>
            </div>
          </div>

          {/* Key Event Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Date & Schedule
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>{booking.dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.timeSelected || 'All Day'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Venue Location
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span className="truncate">{booking.eventVenue || event?.location || 'Venue specified on radar'}</span>
              </div>
              {event?.googleMapsUrl && (
                <a
                  href={event.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:text-orange-700 text-[11px] font-semibold flex items-center gap-0.5"
                >
                  Get Directions <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* Attendee Details */}
          <div className="bg-slate-100/70 rounded-2xl p-3.5 space-y-2 border border-slate-200/60 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Primary Buyer / Parent:</span>
              <span className="font-bold text-slate-800">{booking.buyerName}</span>
            </div>
            {booking.childName && (
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Attending Child:</span>
                <span className="font-bold text-orange-600">
                  {booking.childName} {booking.childAge ? `(${booking.childAge} yrs)` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Amount Paid:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ₹{booking.amountPaid} <span className="text-[10px] font-normal text-emerald-600">(Paid via Razorpay)</span>
              </span>
            </div>
          </div>

          {/* Ticket Barcode & High-Res QR Code */}
          <div className="bg-white rounded-2xl p-4 border border-dashed-2 border-slate-300 text-center shadow-xs">
            <div className="inline-block p-2 bg-white rounded-xl shadow-inner border border-slate-100">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Ticket QR Code for ${ticketNumber}`}
                  className="w-44 h-44 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-50 text-slate-400">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-2">
              Scan this QR Code at the venue gate for instant touchless entry.
            </p>
            <div className="mt-1.5 font-mono font-bold text-xs tracking-widest text-slate-700 bg-slate-100 py-1 px-3 rounded-md inline-block">
              {ticketNumber}
            </div>
          </div>

        </div>

        {/* Action Controls & Sharing */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
          
          {/* Notification Feedback Toast */}
          {notifyFeedback && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{notifyFeedback}</span>
              </div>
              <button 
                onClick={() => setNotifyFeedback(null)} 
                className="text-emerald-700 hover:text-emerald-950 text-xs font-black p-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Email & SMS Quick Dispatch Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSendEmailPass}
              disabled={isSendingEmail}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 font-bold text-xs hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-orange-600" />
              <span>{isSendingEmail ? 'Sending...' : 'Email QR Ticket'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendSmsPass}
              disabled={isSendingSms}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{isSendingSms ? 'Sending...' : 'Send via SMS'}</span>
            </button>
          </div>

          {/* Top Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              <CalendarPlus className="w-4 h-4 text-orange-500" />
              <span>Google Calendar</span>
            </a>

            <button
              onClick={downloadICSFile}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Download iCal</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Transfer</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>

        {/* Transfer Ticket Sub-Modal */}
        {showTransferModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fadeIn z-20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base">
                Transfer Ticket to Another Parent
              </h4>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900">Transfer Initiated!</h5>
                <p className="text-xs text-slate-500">
                  We've sent the updated pass to {transferEmail || transferPhone}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTransferSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter the email address or mobile number of the parent you want to transfer this admission pass to.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="friend.parent@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={transferPhone}
                    onChange={(e) => setTransferPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
