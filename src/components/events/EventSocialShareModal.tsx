import React, { useState } from 'react';
import { CommunityEvent, ChildProfile, SocialSharePlatform } from '../../types.ts';
import { 
  X, Share2, Copy, Check, MessageCircle, Twitter, Facebook, 
  Linkedin, Send, Mail, QrCode, Calendar, Clock, MapPin, 
  Ticket, Sparkles, ExternalLink, Phone, User, CheckCircle2, 
  ShieldCheck, BarChart3, ChevronRight, ArrowRight, Smartphone
} from 'lucide-react';
import { generateAffiliateShareUrl } from '../../utils/affiliate.ts';
import { recordSocialShare } from '../../utils/shareTracking.ts';
import EventShareTrackerView from './EventShareTrackerView.tsx';

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
  const [activeTab, setActiveTab] = useState<'quick' | 'direct_phone' | 'audit'>('quick');

  // Direct recipient input states
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // Tracking confirmation badge state
  const [lastLoggedShare, setLastLoggedShare] = useState<{
    id: string;
    from: string;
    to?: string;
    platform: string;
    time: string;
  } | null>(null);

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

  // Sender details display
  const senderDisplayName = userProfile?.parentName || 'Vernunt Member';
  const senderPhoneDisplay = userProfile?.phoneNumber || 'Account Logged';

  // 1. Direct WhatsApp Share to Specific Phone Number
  const handleDirectWhatsAppShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = recipientPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian recipient mobile number.');
      return;
    }

    setIsSendingDirect(true);
    try {
      const { record, trackedUrl } = await recordSocialShare({
        event,
        userProfile,
        platform: 'whatsapp_direct',
        recipientPhone: `+91${cleanPhone}`,
        recipientName: recipientName.trim() || undefined
      });

      setLastLoggedShare({
        id: record.id,
        from: record.senderPhone || record.senderName,
        to: `+91 ${cleanPhone}`,
        platform: 'WhatsApp Direct Phone',
        time: 'Just now'
      });

      const personalizedMessage = `🎟️ *Hello ${recipientName.trim() || 'Parent'}!*
*You're invited to:* *${event.title}*

📅 *Date & Time:* ${event.date} at ${event.time}
📍 *Venue:* ${event.location}
👤 *Sent by:* ${senderDisplayName} (${senderPhoneDisplay})
🎫 *Passes:* ${priceText}
🎯 *Category:* ${event.category || 'Kids Event'}

${event.description ? `_${event.description.slice(0, 160)}${event.description.length > 160 ? '...' : ''}_\n\n` : ''}👉 *Tap below to view details and book your passes directly:*
${trackedUrl}

_Powered by Vernunt Kids & Family Community_`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setRecipientPhone('');
      setRecipientName('');
    } catch (err) {
      console.warn('Direct share error:', err);
    } finally {
      setIsSendingDirect(false);
    }
  };

  // 2. Multi-Channel Share with Automatic Telemetry Logging
  const handleTrackedShare = async (platform: SocialSharePlatform) => {
    try {
      const { record, trackedUrl } = await recordSocialShare({
        event,
        userProfile,
        platform
      });

      setLastLoggedShare({
        id: record.id,
        from: record.senderPhone || record.senderName,
        platform: platform.replace('_', ' ').toUpperCase(),
        time: 'Just now'
      });

      const detailedText = `🎟️ *You're Invited: ${event.title}*

📅 *Date & Time:* ${event.date} at ${event.time}
📍 *Venue:* ${event.location}
👤 *Organizer:* ${organizerText}
🎫 *Tickets:* ${priceText}
🎯 *Category:* ${event.category || 'Kids Event'}

${event.description ? `_${event.description.slice(0, 180)}${event.description.length > 180 ? '...' : ''}_\n\n` : ''}👉 *View details & book passes on Vernunt:*
${trackedUrl}

_Powered by Vernunt Kids & Family Community_`;

      if (platform === 'whatsapp_general') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(detailedText)}`, '_blank', 'noopener,noreferrer');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackedUrl)}`, '_blank', 'noopener,noreferrer');
      } else if (platform === 'twitter') {
        const tweetText = `Join us for "${event.title}" on ${event.date} in ${event.location}! Book passes:`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(trackedUrl)}`, '_blank', 'noopener,noreferrer');
      } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(trackedUrl)}&text=${encodeURIComponent(event.title)}`, '_blank', 'noopener,noreferrer');
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(trackedUrl)}`, '_blank', 'noopener,noreferrer');
      } else if (platform === 'email') {
        const subject = encodeURIComponent(`Invitation to: ${event.title}`);
        const body = encodeURIComponent(`${detailedText}\n\nLink: ${trackedUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      } else if (platform === 'native_share') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({
              title: event.title,
              text: `Join us for "${event.title}" on ${event.date} at ${event.time}!`,
              url: trackedUrl
            });
          } catch (e) {
            // fallback
          }
        }
      } else if (platform === 'link_copy') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(trackedUrl);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Tracked share error:', e);
    }
  };

  return (
    <div 
      id="event-social-share-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-200" /> Tracked Social Share Hub
              </span>
              <h3 className="text-base font-black leading-tight text-white line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-social-share"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-100/90 p-1.5 border-b border-slate-200 flex items-center gap-1 text-xs font-bold text-slate-600 shrink-0">
          <button
            type="button"
            id="tab-btn-quick-share"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quick' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Social Platforms</span>
          </button>

          <button
            type="button"
            id="tab-btn-direct-phone"
            onClick={() => setActiveTab('direct_phone')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct_phone' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct to Mobile Number</span>
          </button>

          {(userProfile?.userRole === 'Admin' || userProfile?.userRole === 'Event Organizer') && (
            <button
              type="button"
              id="tab-btn-audit-shares"
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Audit Log</span>
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Active Sender Identity Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Sharing From Account:</span>
                <span className="font-extrabold text-slate-900">{senderDisplayName}</span>
                {userProfile?.phoneNumber && (
                  <span className="text-slate-500 font-mono text-[11px] ml-1.5">({userProfile.phoneNumber})</span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {userProfile?.userRole || 'Verified Member'}
            </span>
          </div>

          {/* Last Logged Share Confirmation Notice */}
          {lastLoggedShare && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <span>✓ Share Activity Tracked in Firestore Cloud!</span>
                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-emerald-200 text-slate-600">
                    ID: {lastLoggedShare.id}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  <strong>From:</strong> {lastLoggedShare.from} {lastLoggedShare.to ? <>➔ <strong>To:</strong> {lastLoggedShare.to}</> : null} • <span>Platform: {lastLoggedShare.platform}</span>
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: QUICK SOCIAL PLATFORMS */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Event Preview Card */}
              <div className="bg-gradient-to-br from-orange-50/70 to-amber-50/70 border border-orange-200/80 rounded-2xl p-3.5 flex gap-3 items-center">
                {event.imageUrl ? (
                  <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-orange-200 shadow-xs" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-xs">
                    🎟️
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      {event.category || 'Event'}
                    </span>
                    <span className="text-[9.5px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {priceText}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1 mt-1">{event.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{event.date} at {event.time} • {event.location.split(',')[0]}</p>
                </div>
              </div>

              {/* Social Channels Grid */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Choose Share Platform (Auto-Tracked):</span>
                  <span className="text-[10px] font-normal text-slate-400">Unique token attached</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* WhatsApp Broadcast */}
                  <button
                    type="button"
                    id="btn-social-share-whatsapp"
                    onClick={() => handleTrackedShare('whatsapp_general')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-emerald-900">WhatsApp</span>
                    <span className="text-[9.5px] text-emerald-600 font-semibold">Chats &amp; Groups</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    id="btn-social-share-facebook"
                    onClick={() => handleTrackedShare('facebook')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-blue-900">Facebook</span>
                    <span className="text-[9.5px] text-blue-600 font-semibold">Feed &amp; Story</span>
                  </button>

                  {/* X / Twitter */}
                  <button
                    type="button"
                    id="btn-social-share-twitter"
                    onClick={() => handleTrackedShare('twitter')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Twitter className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-900">X (Twitter)</span>
                    <span className="text-[9.5px] text-slate-600 font-semibold">Tweet Post</span>
                  </button>

                  {/* Telegram */}
                  <button
                    type="button"
                    id="btn-social-share-telegram"
                    onClick={() => handleTrackedShare('telegram')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-sky-900">Telegram</span>
                    <span className="text-[9.5px] text-sky-600 font-semibold">Channels &amp; DMs</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    type="button"
                    id="btn-social-share-linkedin"
                    onClick={() => handleTrackedShare('linkedin')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-indigo-900">LinkedIn</span>
                    <span className="text-[9.5px] text-indigo-600 font-semibold">Professional Feed</span>
                  </button>

                  {/* Email */}
                  <button
                    type="button"
                    id="btn-social-share-email"
                    onClick={() => handleTrackedShare('email')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-amber-900">Email</span>
                    <span className="text-[9.5px] text-amber-600 font-semibold">Direct Email</span>
                  </button>

                  {/* Device Native Web Share */}
                  <button
                    type="button"
                    id="btn-social-share-native"
                    onClick={() => handleTrackedShare('native_share')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer text-center group col-span-2 sm:col-span-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-rose-900">System Share Sheet</span>
                    <span className="text-[9.5px] text-rose-600 font-semibold">Instagram, Slack, Messages &amp; More</span>
                  </button>
                </div>
              </div>

              {/* Copy Tracked Link Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Tracked Booking Link</span>
                  {copied && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied &amp; Logged!</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directLink}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all outline-none"
                  />
                  <button
                    type="button"
                    id="btn-copy-event-share-link"
                    onClick={() => handleTrackedShare('link_copy')}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT TO MOBILE NUMBER (TRACK FROM NUMBER TO NUMBER) */}
          {activeTab === 'direct_phone' && (
            <form onSubmit={handleDirectWhatsAppShare} className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/80 border-2 border-emerald-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-black">Direct WhatsApp Send &amp; Recipient Phone Tracking</h4>
                    <p className="text-[11px] text-emerald-700">
                      Explicitly records <strong>From: {senderPhoneDisplay}</strong> ➔ <strong>To: [Recipient Mobile]</strong> in your cloud audit ledger.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                      Recipient 10-Digit Mobile Number (WhatsApp) *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-600">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 9876543210"
                        className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono tracking-wider font-bold outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Recipient Parent / Contact Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Rohan's Mom, Indiranagar Playmates"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-send-tracked-whatsapp-direct"
                  disabled={isSendingDirect || recipientPhone.length !== 10}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSendingDirect ? 'Logging & Dispatching...' : 'Send Tracked WhatsApp Invite to ' + (recipientPhone ? `+91 ${recipientPhone}` : 'Contact')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How This Number-to-Number Tracking Works:</span>
                </p>
                <p>
                  1. The sender profile (<strong>{senderDisplayName}</strong>, <strong>{senderPhoneDisplay}</strong>) is permanently recorded with timestamp.
                </p>
                <p>
                  2. The recipient mobile number is stored in your Firestore audit table under <code>recipientPhone</code>.
                </p>
                <p>
                  3. When the recipient opens the link, incoming clicks and any subsequent ticket purchases are tied to this exact share record.
                </p>
              </div>
            </form>
          )}

          {/* TAB 3: AUDIT DESK VIEW */}
          {activeTab === 'audit' && (
            <div className="space-y-3 animate-fade-in">
              <EventShareTrackerView userProfile={userProfile} />
            </div>
          )}

          {/* Footer Navigation CTAs */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            {onOpenQrModal && (
              <button
                type="button"
                id="btn-open-qr-from-social-share"
                onClick={() => {
                  onClose();
                  onOpenQrModal(event);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Show QR Flyer Station</span>
              </button>
            )}

            {onBookEvent && (
              <button
                type="button"
                id="btn-direct-book-from-share"
                onClick={() => {
                  onClose();
                  onBookEvent(event);
                }}
                className="ml-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Book Passes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
