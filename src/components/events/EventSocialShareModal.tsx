import React, { useState } from 'react';
import { CommunityEvent, ChildProfile } from '../../types.ts';
import { 
  X, Share2, Copy, Check, MessageCircle, Twitter, Facebook, 
  Linkedin, Send, Mail, QrCode, Calendar, Clock, MapPin, 
  Ticket, Sparkles, ExternalLink
} from 'lucide-react';
import { generateAffiliateShareUrl } from '../../utils/affiliate.ts';

interface EventSocialShareModalProps {
  event: CommunityEvent | null;
  onClose: () => void;
  onBookEvent?: (event: CommunityEvent) => void;
  userProfile?: ChildProfile | null;
  onOpenQrModal?: (event: CommunityEvent) => void;
}

export default function EventSocialShareModal({
  event,
  onClose,
  onBookEvent,
  userProfile,
  onOpenQrModal
}: EventSocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  React.useEffect(() => {
    if (!event) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const affiliateCode = userProfile?.affiliateCode || userProfile?.referralCode || undefined;
  const directLink = generateAffiliateShareUrl({
    affiliateCode,
    tab: 'events',
    itemId: event.id,
    itemType: 'event'
  });

  const priceText = event.ticketPrice && event.ticketPrice > 0 ? `₹${event.ticketPrice}.00` : 'FREE Entry';
  const organizerText = event.hostName || 'Vernunt Community Host';

  // Standard Invitation text
  const shareMessage = `🌟 *You're Invited:* *${event.title}* 🌟

📅 *Date & Time:* ${event.date} at ${event.time}
📍 *Venue:* ${event.location}
👤 *Organizer:* ${organizerText}
🎟️ *Admission:* ${priceText}
🎯 *Category:* ${event.category || 'Kids Gathering'}

${event.description ? `_${event.description.slice(0, 180)}${event.description.length > 180 ? '...' : ''}_\n\n` : ''}👉 *View details & book passes on Vernunt:*
${directLink}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = directLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy event link:', err);
    }
  };

  const handleSharePlatform = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'telegram' | 'linkedin' | 'email' | 'native') => {
    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directLink)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'twitter': {
        const tweetText = `Join us for "${event.title}" on ${event.date} in ${event.location}! Book passes:`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(directLink)}`, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(event.title)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(directLink)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'email': {
        const subject = encodeURIComponent(`Invitation to: ${event.title}`);
        const body = encodeURIComponent(`${shareMessage}\n\nLink: ${directLink}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        break;
      }
      case 'native':
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({
            title: event.title,
            text: `Join us for ${event.title} on ${event.date}!`,
            url: directLink
          }).catch(() => {
            handleCopyLink();
          });
        } else {
          handleCopyLink();
        }
        break;
    }
  };

  return (
    <div 
      id="modal-social-share-container"
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-left transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-200">
                Share Event
              </span>
              <h3 className="text-base sm:text-lg font-bold leading-tight line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-social-share"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Event Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
            <img 
              src={event.photoUrl || '/bhagavad-geeta-class.svg'} 
              alt={event.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {event.category || 'Event'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {priceText}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                {event.title}
              </h4>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span className="truncate max-w-[130px]">{event.location}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Social Platforms Action Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Share Directly to Apps &amp; Channels
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                id="btn-share-whatsapp"
                onClick={() => handleSharePlatform('whatsapp')}
                className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>WhatsApp</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                id="btn-share-twitter"
                onClick={() => handleSharePlatform('twitter')}
                className="p-3 rounded-2xl bg-black hover:bg-slate-900 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>X / Twitter</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                id="btn-share-facebook"
                onClick={() => handleSharePlatform('facebook')}
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Facebook</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                id="btn-share-telegram"
                onClick={() => handleSharePlatform('telegram')}
                className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Telegram</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                id="btn-share-linkedin"
                onClick={() => handleSharePlatform('linkedin')}
                className="p-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>LinkedIn</span>
              </button>

              {/* Email */}
              <button
                type="button"
                id="btn-share-email"
                onClick={() => handleSharePlatform('email')}
                className="p-3 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-95"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Email</span>
              </button>
            </div>

            {/* Native Mobile Share Sheet */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                id="btn-share-native-device"
                onClick={() => handleSharePlatform('native')}
                className="w-full mt-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <Share2 className="w-4 h-4 text-orange-600" />
                <span>Open Device Share Sheet (Instagram, Messages, etc.)</span>
              </button>
            )}
          </div>

          {/* Copy Direct Event Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Direct Event Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-direct-event-url"
                type="text"
                readOnly
                value={directLink}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none select-all"
              />
              <button
                type="button"
                id="btn-copy-direct-event-url"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Additional Actions: QR Poster & Booking */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            {onOpenQrModal && (
              <button
                type="button"
                id="btn-share-open-qr-flyer"
                onClick={() => onOpenQrModal(event)}
                className="w-full sm:w-auto flex-1 p-2.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-800 hover:text-orange-700 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Download Event QR Flyer / Poster</span>
              </button>
            )}

            {onBookEvent && (
              <button
                type="button"
                id="btn-share-direct-book"
                onClick={() => {
                  onClose();
                  onBookEvent(event);
                }}
                className="w-full sm:w-auto p-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Passes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
