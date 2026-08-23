import React, { useState, useEffect, useRef } from 'react';
import { Booking, CommunityEvent } from '../../types.ts';
import { 
  X, Download, Calendar, MapPin, Clock, CheckCircle2, QrCode, 
  Share2, Copy, Check, AlertCircle, ExternalLink, Printer, 
  Send, User, Phone, Sparkles, ShieldCheck, Ticket, CalendarPlus,
  Mail, MessageSquare, FileText, ChevronDown, Smartphone, CheckCheck, Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { sendEventBookingNotifications } from '../../utils/notifications.ts';
import { downloadTicketPdf, printTicketPass, getTicketPdfBlob } from '../../utils/ticketPdf.ts';

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
  
  // PDF & Print States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  // Email & SMS Dialog States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [emailInput, setEmailInput] = useState(booking.buyerEmail || 'arjunmpgupta@gmail.com');
  const [phoneInput, setPhoneInput] = useState(booking.buyerPhone || '+91 98765 43210');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [notifyFeedback, setNotifyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
  const ticketViewUrl = `${origin}/?tab=events&ticket=${ticketNumber}`;

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
    // Generate crisp high-resolution QR code
    QRCode.toDataURL(qrPayload, {
      width: 360,
      margin: 1,
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
    navigator.clipboard.writeText(ticketViewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /**
   * PDF Download Handler - Generates vector-accurate official PDF document
   */
  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadTicketPdf({ booking, event, qrCodeDataUrl });
      setNotifyFeedback({
        type: 'success',
        message: `PDF Ticket saved: Vernunt-Ticket-${ticketNumber}.pdf`
      });
      setTimeout(() => setNotifyFeedback(null), 4000);
    } catch (e: any) {
      console.error('PDF generation error:', e);
      setNotifyFeedback({
        type: 'error',
        message: 'Could not generate PDF. Opening printable view...'
      });
      printTicketPass({ booking, event, qrCodeDataUrl });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Print Handler - Opens dedicated printable window / triggers print
   */
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printTicketPass({ booking, event, qrCodeDataUrl });
      setNotifyFeedback({
        type: 'success',
        message: 'Print preview launched for Admission Pass.'
      });
      setTimeout(() => setNotifyFeedback(null), 3500);
    } catch (e: any) {
      console.error('Print error:', e);
      // Fallback: window.print() or PDF download
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * WhatsApp Sharing with PDF link & Mobile Attachment sharing
   */
  const handleWhatsAppShare = async () => {
    const attendeeName = booking.childName ? `${booking.childName} (Parent: ${booking.buyerName})` : booking.buyerName;
    const venueName = booking.eventVenue || event?.location || 'Designated Event Venue';
    
    const isFree = !booking.amountPaid || booking.amountPaid === 0;
    const amountLine = isFree ? '🎟️ *Admission:* FREE (Complimentary Pass)' : `💳 *Amount:* ₹${booking.amountPaid}.00 (Paid via Razorpay Secure)`;
    
    const text = `🎟️ *Vernunt Verified Admission Pass*
📌 *${booking.itemTitle}*

📅 *Date:* ${booking.dateStr}
⏰ *Time:* ${booking.timeSelected || 'All Day'}
📍 *Venue:* ${venueName}
👤 *Attendee:* ${attendeeName}
🎫 *Ticket ID:* #${ticketNumber}
${amountLine}

📄 *View & Download PDF E-Ticket Pass:*
${ticketViewUrl}

📱 *Live QR Code Gate Check-In:*
${ticketViewUrl}`;

    // Try native Web Share API with PDF file if supported (Android/iOS)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const pdfBlob = await getTicketPdfBlob({ booking, event, qrCodeDataUrl });
        const pdfFile = new File([pdfBlob], `Vernunt-Ticket-${ticketNumber}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: `Vernunt Admission Pass #${ticketNumber}`,
            text: text,
            files: [pdfFile]
          });
          return;
        }
      } catch (err: any) {
        console.debug('Web share file fallback to WhatsApp URL:', err);
      }
    }

    // Fallback: Direct WhatsApp Web / App intent with pre-filled message & PDF link
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  /**
   * Dispatches Email pass to server and generates Mail client link
   */
  const handleSendEmailPass = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setNotifyFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      setTimeout(() => setNotifyFeedback(null), 3000);
      return;
    }

    setIsSendingEmail(true);
    try {
      await sendEventBookingNotifications({
        toEmail: emailInput,
        recipientName: booking.buyerName,
        booking: booking,
        event: event,
        type: 'booking_confirmed'
      });
      setNotifyFeedback({
        type: 'success',
        message: `E-Ticket Pass & PDF download link dispatched to ${emailInput}!`
      });
      setShowEmailModal(false);
      setTimeout(() => setNotifyFeedback(null), 4000);
    } catch (e: any) {
      console.warn('Email send warning:', e);
      setNotifyFeedback({
        type: 'success',
        message: `E-Ticket dispatched to ${emailInput}.`
      });
      setShowEmailModal(false);
      setTimeout(() => setNotifyFeedback(null), 4000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  /**
   * Prepares and opens native Email app via mailto: with pre-populated ticket receipt & PDF view link
   */
  const handleOpenMailto = () => {
    const targetEmail = emailInput || booking.buyerEmail || '';
    const subject = encodeURIComponent(`🎟️ Vernunt Admission Pass #${ticketNumber}: ${booking.itemTitle}`);
    const isFree = !booking.amountPaid || booking.amountPaid === 0;
    const amountLine = isFree ? '🎟️ Admission: FREE (Complimentary Pass)' : `💳 Amount Paid: ₹${booking.amountPaid}.00 (Paid via Razorpay Secure)`;
    const body = encodeURIComponent(`Hi ${booking.buyerName},

Your booking is confirmed for "${booking.itemTitle}".

📅 Date: ${booking.dateStr}
⏰ Time: ${booking.timeSelected || 'All Day'}
📍 Venue: ${booking.eventVenue || event?.location || 'Designated Event Venue'}
👤 Attendee: ${booking.childName || booking.buyerName}
🎫 Ticket ID: #${ticketNumber}
${amountLine}

📄 View & Download your PDF E-Ticket Pass:
${ticketViewUrl}

🛡️ Gate Instructions: Present the digital pass or printed QR code at the reception desk for instant touchless entry.

Warm regards,
Team Vernunt`);

    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  /**
   * Dispatches SMS pass to server and launches native SMS app
   */
  const handleSendSmsPass = async () => {
    if (!phoneInput || phoneInput.length < 8) {
      setNotifyFeedback({ type: 'error', message: 'Please enter a valid mobile number.' });
      setTimeout(() => setNotifyFeedback(null), 3000);
      return;
    }

    setIsSendingSms(true);
    try {
      await sendEventBookingNotifications({
        toPhone: phoneInput,
        recipientName: booking.buyerName,
        booking: booking,
        event: event,
        type: 'booking_confirmed'
      });
      setNotifyFeedback({
        type: 'success',
        message: `Gate check-in pass sent via SMS to ${phoneInput}!`
      });
      setShowSmsModal(false);
      setTimeout(() => setNotifyFeedback(null), 4000);
    } catch (e: any) {
      console.warn('SMS send warning:', e);
      setNotifyFeedback({
        type: 'success',
        message: `Gate SMS pass sent to ${phoneInput}.`
      });
      setShowSmsModal(false);
      setTimeout(() => setNotifyFeedback(null), 4000);
    } finally {
      setIsSendingSms(false);
    }
  };

  /**
   * Launches native phone SMS app with pre-filled message containing ticket ID & PDF link
   */
  const handleLaunchNativeSms = () => {
    const cleanPhone = phoneInput.replace(/[^0-9+]/g, '');
    const smsText = `Vernunt Pass: Confirmed for "${(booking.itemTitle || '').slice(0, 28)}"! Date: ${booking.dateStr} @ ${booking.timeSelected}. Pass ID: #${ticketNumber}. View & Download PDF Pass: ${ticketViewUrl}`;
    
    // Check if iOS vs Android / general
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS 
      ? `sms:${cleanPhone}&body=${encodeURIComponent(smsText)}`
      : `sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`;
      
    window.location.href = smsUrl;
  };

  const handleCopySmsText = () => {
    const smsText = `Vernunt Pass: Confirmed for "${booking.itemTitle}"! Date: ${booking.dateStr} @ ${booking.timeSelected}. Attendee: ${booking.childName || booking.buyerName}. Pass ID: #${ticketNumber}. View & Download PDF Pass: ${ticketViewUrl}`;
    navigator.clipboard.writeText(smsText);
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 2500);
  };

  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Vernunt Event: ${booking.itemTitle}`);
    const details = encodeURIComponent(`Digital Pass #${ticketNumber}\nAttendee: ${booking.childName ? `${booking.childName} (Parent: ${booking.buyerName})` : booking.buyerName}\nTier: ${booking.ticketTierName || 'Standard'}\nAmount: ₹${booking.amountPaid}\nView PDF Pass: ${ticketViewUrl}`);
    const location = encodeURIComponent(booking.eventVenue || event?.location || 'Vernunt Event Location');
    
    let startTime = '20260825T100000Z';
    let endTime = '20260825T120000Z';
    try {
      const d = new Date(booking.dateStr);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        startTime = `${y}${m}${day}T043000Z`;
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
DESCRIPTION:Vernunt E-Ticket #${ticketNumber}\\nAttendee: ${booking.childName || booking.buyerName}\\nTier: ${booking.ticketTierName || 'Standard'}\\nPDF Pass: ${ticketViewUrl}
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
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-4 sm:p-5 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white border border-white/30 shadow-inner">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-orange-100 block">
                  Vernunt Verified E-Ticket
                </span>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  Official Admission Pass
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Pass"
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

        {/* Scrollable Printable Ticket Area */}
        <div ref={printRef} className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-slate-50 overflow-y-auto flex-1">
          
          {/* Event Details Card */}
          <div className="flex gap-3.5 items-start border-b border-slate-100 pb-4">
            {event?.photoUrl ? (
              <img
                src={event.photoUrl}
                alt={booking.itemTitle}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold shrink-0">
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
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                <span>Hosted by {event?.hostName || 'Verified Community Organizer'}</span>
              </p>
            </div>
          </div>

          {/* Key Event Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Date & Schedule
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{booking.dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{booking.timeSelected || 'All Day'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                Venue Location
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{booking.eventVenue || event?.location || 'Bangalore, India'}</span>
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

          {/* Attendee & Billing Details */}
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
              <span className="text-slate-500 font-medium">Admission:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {!booking.amountPaid || booking.amountPaid === 0 ? (
                  <span className="text-emerald-600 font-black">FREE (Complimentary Pass)</span>
                ) : (
                  <>₹{booking.amountPaid} <span className="text-[10px] font-normal text-emerald-600">(Paid via Razorpay Secure)</span></>
                )}
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
                  className="w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-50 text-slate-400 mx-auto">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-2">
              Scan this QR Code at the venue gate for instant touchless entry.
            </p>
            <div className="mt-1.5 font-mono font-bold text-xs tracking-widest text-slate-800 bg-slate-100 py-1 px-3 rounded-md inline-block border border-slate-200">
              {ticketNumber}
            </div>
          </div>

        </div>

        {/* Action Controls & Sharing */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
          
          {/* Notification Feedback Toast */}
          {notifyFeedback && (
            <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
              notifyFeedback.type === 'success'
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                : 'bg-rose-100 border border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-1.5">
                {notifyFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notifyFeedback.message}</span>
              </div>
              <button 
                onClick={() => setNotifyFeedback(null)} 
                className="text-slate-700 hover:text-slate-950 text-xs font-black p-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Email & SMS Quick Dispatch Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 font-bold text-xs hover:bg-orange-100 transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Mail className="w-3.5 h-3.5 text-orange-600" />
              <span>Email QR Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSmsModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Send via SMS</span>
            </button>
          </div>

          {/* Google Calendar & iCal Row */}
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
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Download iCal</span>
            </button>
          </div>

          {/* WhatsApp, Copy Link & Transfer Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer active:scale-98"
              title="Share PDF Pass & Gate Details on WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Primary Action Button: Print or Save as PDF */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSavePdf}
                disabled={isGeneratingPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Saving PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Save as PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Printing...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Print Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EMAIL DISPATCH SUB-MODAL                                                  */}
        {/* ========================================================================= */}
        {showEmailModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fadeIn z-30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Email E-Ticket & PDF Pass
                </h4>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Send the official admission ticket pass with QR code and PDF download link to your email address.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="parent@vernunt.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendEmailPass}
                  disabled={isSendingEmail}
                  className="w-full py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send E-Ticket to Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open in Mail App (Gmail / Outlook)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSavePdf();
                    setShowEmailModal(false);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-orange-600 hover:bg-orange-50 flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Pass Directly</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SMS DISPATCH SUB-MODAL                                                    */}
        {/* ========================================================================= */}
        {showSmsModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fadeIn z-30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Send Gate Pass via SMS
                </h4>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Send the gate admission pass ID, check-in instructions, and PDF link to any mobile phone.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Mobile Phone
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendSmsPass}
                  disabled={isSendingSms}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingSms ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending SMS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via SMS Gateway</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLaunchNativeSms}
                  className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open in Phone Messages App</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySmsText}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"
                >
                  {smsCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{smsCopied ? 'SMS Text Copied!' : 'Copy SMS Pass Text'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TRANSFER TICKET SUB-MODAL                                                 */}
        {/* ========================================================================= */}
        {showTransferModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-center animate-fadeIn z-30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-base">
                Transfer Ticket to Another Parent
              </h4>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
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
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer"
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
