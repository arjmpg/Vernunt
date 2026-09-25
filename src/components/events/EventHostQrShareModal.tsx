import React, { useState, useEffect, useRef } from 'react';
import { CommunityEvent } from '../../types.ts';
import { 
  X, QrCode, Share2, Copy, Check, Download, Printer, 
  ExternalLink, Sparkles, Calendar, Clock, MapPin, Ticket,
  ShieldCheck, MessageCircle, AlertCircle, Eye
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface EventHostQrShareModalProps {
  event: CommunityEvent;
  onClose: () => void;
  onDirectBook?: (event: CommunityEvent) => void;
  isNewCreated?: boolean;
}

export default function EventHostQrShareModal({
  event,
  onClose,
  onDirectBook,
  isNewCreated = false
}: EventHostQrShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const flyerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute canonical direct booking URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
  const directBookingUrl = `${origin}/?tab=events&eventId=${event.id}&book=true`;

  useEffect(() => {
    let isMounted = true;

    if (isNewCreated) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#10b981', '#3b82f6', '#f59e0b', '#ec4899']
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }

    // Generate high-resolution QR code
    QRCode.toDataURL(directBookingUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate event QR Code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [directBookingUrl, isNewCreated]);

  // Copy Link with Visual Confirmation
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directBookingUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = directBookingUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy booking link:', err);
    }
  };

  // WhatsApp Share with Pre-composed Invitation Text
  const handleWhatsAppShare = () => {
    const priceText = event.ticketPrice && event.ticketPrice > 0 
      ? `₹${event.ticketPrice}` 
      : 'FREE Entry';

    const message = `🎉 *You're Invited!* 
*${event.title}*

📅 *Date & Time:* ${event.date} at ${event.time}
📍 *Venue:* ${event.location}
👤 *Host:* ${event.hostName}
🎟️ *Passes:* ${priceText}
🎯 *Category:* ${event.category || 'Community Gathering'}

${event.description ? `_${event.description}_\n\n` : ''}📲 *Scan the QR Code or tap the link below to open the event page and book your tickets directly:*
👉 ${directBookingUrl}

_Powered by Vernunt Playdates & Kids Community_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  // Native Device Share (Web Share API)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join us for "${event.title}" on ${event.date} at ${event.time}! Scan the QR or tap to book passes directly:`,
          url: directBookingUrl
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Download High-Resolution Printable Flyer / Poster (PNG)
  const handleDownloadFlyer = async () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // Poster Dimensions: 1200 x 1600 (High-Resolution Poster Flyer)
      canvas.width = 1200;
      canvas.height = 1600;

      // 1. Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#fff7ed');
      grad.addColorStop(0.3, '#ffffff');
      grad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Accent Header Banner
      const headerGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      headerGrad.addColorStop(0, '#ea580c');
      headerGrad.addColorStop(0.5, '#f59e0b');
      headerGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, canvas.width, 160);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('VERNUNT COMMUNITY EVENT PASS', canvas.width / 2, 95);

      // 2. Category Pill
      const catText = (event.category || 'EVENT').toUpperCase();
      ctx.fillStyle = '#ea580c';
      ctx.font = 'bold 26px sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(`★  ${catText}  ★`, canvas.width / 2, 230);

      // 3. Event Title (Auto-wrapping)
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 56px serif';
      ctx.textAlign = 'center';

      const words = event.title.split(' ');
      let line = '';
      let y = 305;
      const maxWidth = 1040;
      const lineHeight = 68;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += lineHeight;
          if (y > 450) {
            line = '...';
            break;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // 4. Meta Details Card
      const cardY = y + 40;
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(100, cardY, 1000, 150, 24);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📅 ${event.date}  •  ⏰ ${event.time}`, canvas.width / 2, cardY + 60);

      ctx.font = '28px sans-serif';
      ctx.fillStyle = '#64748b';
      const locDisplay = event.location.length > 55 ? event.location.slice(0, 52) + '...' : event.location;
      ctx.fillText(`📍 ${locDisplay}`, canvas.width / 2, cardY + 112);

      // 5. QR Code Card Container
      const qrBoxY = cardY + 200;
      const qrBoxSize = 580;
      const qrBoxX = (canvas.width - qrBoxSize) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 70, 36);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      const qrPadding = 40;
      ctx.drawImage(
        qrImg, 
        qrBoxX + qrPadding, 
        qrBoxY + qrPadding, 
        qrBoxSize - (qrPadding * 2), 
        qrBoxSize - (qrPadding * 2)
      );

      // "SCAN TO BOOK PASSES DIRECTLY" Badge below QR code
      ctx.fillStyle = '#ea580c';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText('📲 SCAN TO BOOK PASSES DIRECTLY', canvas.width / 2, qrBoxY + qrBoxSize + 35);

      // 6. Footer Information
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Host: ${event.hostName || 'Verified Organizer'}  •  Admission: ${event.ticketPrice ? `₹${event.ticketPrice}` : 'FREE'}`, canvas.width / 2, 1470);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px sans-serif';
      ctx.fillText('Instant Mobile Booking • Safe Parent Community • Vernunt Playdates', canvas.width / 2, 1520);

      // Export canvas to PNG blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Event_QR_Poster.png`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate downloadable poster:', err);
      setIsDownloading(false);
    }
  };

  // Print Flyer Sheet
  const handlePrintFlyer = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${event.title} - Official Event QR Flyer</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #0f172a;
              text-align: center;
            }
            .flyer-box {
              max-width: 600px;
              margin: 0 auto;
              border: 2px dashed #cbd5e1;
              padding: 30px;
              border-radius: 24px;
            }
            .header-tag {
              color: #ea580c;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            h1 {
              font-size: 28px;
              margin: 12px 0;
              line-height: 1.3;
            }
            .meta-pills {
              margin: 16px 0;
              font-size: 15px;
              color: #475569;
            }
            .qr-wrapper {
              margin: 24px auto;
              padding: 16px;
              background: #fff;
              display: inline-block;
              border: 3px solid #ea580c;
              border-radius: 20px;
            }
            .qr-wrapper img {
              width: 280px;
              height: 280px;
              display: block;
            }
            .scan-callout {
              font-size: 16px;
              font-weight: bold;
              color: #ea580c;
              margin-top: 8px;
            }
            .url-box {
              background: #f1f5f9;
              padding: 12px;
              border-radius: 12px;
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
              margin-top: 16px;
            }
            .footer-note {
              margin-top: 24px;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="flyer-box">
            <div class="header-tag">VERNUNT COMMUNITY EVENT PASS</div>
            <h1>${event.title}</h1>
            <div class="meta-pills">
              <div>📅 <strong>Date:</strong> ${event.date} at ${event.time}</div>
              <div>📍 <strong>Venue:</strong> ${event.location}</div>
              <div>👤 <strong>Host:</strong> ${event.hostName} &bull; <strong>Admission:</strong> ${event.ticketPrice ? `₹${event.ticketPrice}` : 'FREE'}</div>
            </div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Event QR Code" />
              <div class="scan-callout">SCAN TO BOOK PASSES DIRECTLY</div>
            </div>
            <p>Scan with any mobile camera to open the event page and book passes immediately.</p>
            <div class="url-box">${directBookingUrl}</div>
            <div class="footer-note">Powered by Vernunt Playdates &bull; Safe Parent Community</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      id="modal-host-event-qr"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header with celebratory gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200 block">
                {isNewCreated ? '🎉 Event Published Successfully!' : 'Official Event QR Pass'}
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                Share Event QR Code
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center">
          
          {/* Success Callout Banner */}
          {isNewCreated ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-left flex items-start gap-3 shadow-3xs animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-black text-emerald-950">Your event is live & ready for booking!</p>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  We've generated your custom <strong>Direct Booking QR Code</strong> below. Share it on WhatsApp, print flyers, or post on social media. Anyone who scans it will land straight on this event and can book passes directly!
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Share this dedicated QR Code with parents, attendees, and community groups. When scanned, it automatically opens this event page with the pass booking modal ready to book!
            </p>
          )}

          {/* Event Mini Card Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left flex items-center gap-3">
            {event.photoUrl ? (
              <img 
                src={event.photoUrl} 
                alt={event.title} 
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold">
                <Calendar className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                  {event.category || 'EVENT'}
                </span>
                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Host: {event.hostName}
                </span>
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                {event.title}
              </h4>
              <p className="text-[10.5px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{event.date} at {event.time}</span>
                <span className="text-slate-300">•</span>
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </p>
            </div>
          </div>

          {/* Central QR Code Display Card */}
          <div className="relative inline-block mx-auto bg-gradient-to-b from-white to-slate-50 p-4 rounded-3xl border-2 border-orange-200 shadow-lg">
            <div className="relative p-2 bg-white rounded-2xl border border-slate-100 shadow-inner">
              {isGenerating ? (
                <div className="w-60 h-60 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Generating QR Code...</span>
                </div>
              ) : (
                <img 
                  id="event-host-qr-image"
                  src={qrDataUrl} 
                  alt={`QR Code for ${event.title}`} 
                  className="w-56 h-56 sm:w-60 sm:h-60 object-contain mx-auto block rounded-lg"
                />
              )}
            </div>

            {/* Scan Prompt Tag */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-black text-orange-700 bg-orange-50/90 py-1.5 px-3 rounded-full border border-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>Scan to Open &amp; Book Passes Directly</span>
            </div>
          </div>

          {/* Direct Booking Link Copy Box */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Direct Booking Deep Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700 font-mono truncate select-all">
                {directBookingUrl}
              </div>
              <button
                type="button"
                id="btn-copy-event-qr-link"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95 ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Primary Quick-Share Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* WhatsApp Share */}
            <button
              type="button"
              id="btn-share-whatsapp-qr"
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-3xs"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <MessageCircle className="w-4 h-4 fill-white" />
              </div>
              <span>WhatsApp</span>
            </button>

            {/* Download Poster Flyer (PNG) */}
            <button
              type="button"
              id="btn-download-flyer-qr"
              onClick={handleDownloadFlyer}
              disabled={isDownloading || !qrDataUrl}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200/80 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-3xs disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                {isDownloading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </div>
              <span>{isDownloading ? 'Saving...' : 'Save Flyer'}</span>
            </button>

            {/* Native Mobile Share */}
            <button
              type="button"
              id="btn-native-share-qr"
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-3xs"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Share2 className="w-4 h-4" />
              </div>
              <span>Share App</span>
            </button>

            {/* Print Flyer Sheet */}
            <button
              type="button"
              id="btn-print-flyer-qr"
              onClick={handlePrintFlyer}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-3xs"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-xs">
                <Printer className="w-4 h-4" />
              </div>
              <span>Print Poster</span>
            </button>
          </div>

          {/* Test Direct Booking Experience Trigger */}
          {onDirectBook && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                id="btn-test-direct-booking-flow"
                onClick={() => onDirectBook(event)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Eye className="w-4 h-4 text-orange-400" />
                <span>Test Attendee Experience: Open Event Page &amp; Book Directly</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer with Done button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            QR code active 24/7 &bull; Real-time booking
          </span>
          <button
            type="button"
            id="btn-close-qr-share-modal"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {isNewCreated ? 'Done & View Events' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
