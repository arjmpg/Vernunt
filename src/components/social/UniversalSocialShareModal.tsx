import React, { useState, useEffect } from 'react';
import {
  X, Share2, Copy, Check, MessageCircle, Twitter, Facebook,
  Linkedin, Send, Mail, QrCode, Globe, Shield, Sparkles,
  ExternalLink, ChevronRight, CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';

export interface ShareableItem {
  id: string;
  title: string;
  description: string;
  url: string;
  path: string;
  category: 'Platform Pages' | 'Partner Portals' | 'Trust & Legal' | 'Mobile Apps';
  badge?: string;
  icon?: string;
}

export const PLATFORM_SHAREABLE_LINKS: ShareableItem[] = [
  // Platform Pages
  {
    id: 'home',
    title: 'Vernunt - Verified Neighborhood Kids & Playmates',
    description: "India's verified neighborhood kids playmate radar, safe childcare network, and verified parent community.",
    path: '/home',
    url: 'https://app.vernunt.com/home',
    category: 'Platform Pages',
    badge: 'Core Network',
    icon: '🏠'
  },
  {
    id: 'radar',
    title: 'Playmate Radar - Nearby Verified Kids Matches',
    description: 'Find verified parents and nearby child playmates by age, interests, and neighborhood radius in Bangalore.',
    path: '/radar',
    url: 'https://app.vernunt.com/radar',
    category: 'Platform Pages',
    badge: 'Popular',
    icon: '🎯'
  },
  {
    id: 'parks',
    title: 'Bangalore Parks & Outdoor Play Guide',
    description: 'Discover child-friendly neighborhood parks, play areas, and weekend meetup spots verified by parents.',
    path: '/parks',
    url: 'https://app.vernunt.com/parks',
    category: 'Platform Pages',
    badge: 'Outdoor',
    icon: '🌳'
  },
  {
    id: 'events',
    title: 'Events, Workshops & Kids Camps',
    description: 'Explore verified robotics workshops, art pottery classes, and weekend sports camps with instant pass booking.',
    path: '/events',
    url: 'https://app.vernunt.com/events',
    category: 'Platform Pages',
    badge: 'Activities',
    icon: '🎉'
  },
  {
    id: 'groups',
    title: 'Vernunt Groups & Neighborhood Pods',
    description: 'Join verified parent chat groups, school carpool networks, and apartment society activity pods.',
    path: '/groups',
    url: 'https://app.vernunt.com/groups',
    category: 'Platform Pages',
    badge: 'Community',
    icon: '🌸'
  },
  {
    id: 'store',
    title: 'Vernunt Store - 100% Non-Toxic Playgear',
    description: 'Shop BIS-certified organic beechwood teethers, Montessori puzzles, and developmental learning gear.',
    path: '/store',
    url: 'https://app.vernunt.com/store',
    category: 'Platform Pages',
    badge: 'Store',
    icon: '🛍️'
  },
  {
    id: 'knowledge',
    title: '1,000+ Child Growth & Parenting Guides',
    description: 'Evidence-based developmental milestones, pediatric sleep guides, and nutrition advice authored by specialists.',
    path: '/knowledge',
    url: 'https://app.vernunt.com/knowledge',
    category: 'Platform Pages',
    badge: 'Pediatric Guides',
    icon: '📚'
  },
  {
    id: 'about',
    title: 'About Vernunt & Leadership Team',
    description: 'Learn about our mission, founding philosophy, and executive leadership team based in Indiranagar, Bengaluru.',
    path: '/about',
    url: 'https://app.vernunt.com/about',
    category: 'Platform Pages',
    badge: 'Founders',
    icon: '👥'
  },

  // Partner Portals
  {
    id: 'vendor',
    title: 'Marketplace Seller Registration & Portal',
    description: 'Partner with Vernunt to retail your certified developmental toys and baby essentials with 10% commission.',
    path: '/vendor',
    url: 'https://app.vernunt.com/vendor',
    category: 'Partner Portals',
    badge: '10% Commission',
    icon: '🏪'
  },
  {
    id: 'host',
    title: 'Event, Classes & Activity Host Portal',
    description: 'Host child workshops, summer camps, and developmental classes with automated UPI ticket sales & QR scan check-in.',
    path: '/host',
    url: 'https://app.vernunt.com/host',
    category: 'Partner Portals',
    badge: 'Instant Payouts',
    icon: '🎪'
  },
  {
    id: 'care',
    title: 'Daycare & Creche Operator Portal',
    description: 'List your verified childcare facility, showcase CCTV security, and connect with working parents nearby.',
    path: '/care',
    url: 'https://app.vernunt.com/care',
    category: 'Partner Portals',
    badge: 'Childcare Hub',
    icon: '🧸'
  },

  // Trust, Safety & Legal Governance (Footer Links)
  {
    id: 'child-safety',
    title: 'POCSO & Child Safety Protocols',
    description: 'Our zero-tolerance child protection framework, verified adult moderation, and statutory POCSO compliance.',
    path: '/legal/child-safety',
    url: 'https://app.vernunt.com/legal/child-safety',
    category: 'Trust & Legal',
    badge: 'Statutory Safety',
    icon: '🚨'
  },
  {
    id: 'contacts-privacy',
    title: 'Contacts Privacy & Zero-Knowledge Ghost Mode',
    description: 'How Vernunt protects family identity through cryptographic hashing without storing private contact lists.',
    path: '/privacy-mode',
    url: 'https://app.vernunt.com/privacy-mode',
    category: 'Trust & Legal',
    badge: 'Zero-Knowledge',
    icon: '🔒'
  },
  {
    id: 'terms',
    title: 'Terms & Conditions (Intermediary Safe Harbor)',
    description: 'Comprehensive platform terms of service compliant with Section 79 of the Information Technology Act 2000.',
    path: '/legal/terms',
    url: 'https://app.vernunt.com/legal/terms',
    category: 'Trust & Legal',
    badge: 'IT Act 2000',
    icon: '📄'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy (DPDP Act 2023 Compliant)',
    description: 'India Digital Personal Data Protection Act 2023 compliance, consent management, and data fiduciary commitments.',
    path: '/legal/privacy',
    url: 'https://app.vernunt.com/legal/privacy',
    category: 'Trust & Legal',
    badge: 'DPDP Act 2023',
    icon: '🛡️'
  },
  {
    id: 'safety',
    title: 'Safety Guidelines & Meetup Release',
    description: 'Safety best practices for parent meetups, public park gatherings, and mutual child supervision releases.',
    path: '/legal/safety',
    url: 'https://app.vernunt.com/legal/safety',
    category: 'Trust & Legal',
    badge: 'Parent Guidelines',
    icon: '🤝'
  },
  {
    id: 'shipping',
    title: 'Shipping, Delivery & Logistics Policy',
    description: 'Nationwide express courier fulfillment across 29,000+ Indian pincodes via BlueDart and Shiprocket.',
    path: '/legal/shipping',
    url: 'https://app.vernunt.com/legal/shipping',
    category: 'Trust & Legal',
    badge: 'Logistics',
    icon: '🚚'
  },
  {
    id: 'refund',
    title: 'Returns, Replacement & 100% Refund Policy',
    description: 'Mandatory 7-day hassle-free returns for damaged, defective, or incorrect marketplace toys and products.',
    path: '/legal/refund',
    url: 'https://app.vernunt.com/legal/refund',
    category: 'Trust & Legal',
    badge: 'Hassle-Free',
    icon: '🔄'
  },
  {
    id: 'seller-terms',
    title: 'Marketplace Seller Indemnity & Agreement',
    description: 'Merchant terms, 10% platform fee covenants, BIS quality mandates, and digital vendor onboarding agreements.',
    path: '/legal/seller-terms',
    url: 'https://app.vernunt.com/legal/seller-terms',
    category: 'Trust & Legal',
    badge: 'Seller Desk',
    icon: '⚖️'
  },
  {
    id: 'groups-privacy',
    title: 'Groups & Chat Safe Harbor Policy',
    description: 'Community moderation rules, AI content filtering, and anti-harassment covenants for neighborhood group chats.',
    path: '/legal/groups-privacy',
    url: 'https://app.vernunt.com/legal/groups-privacy',
    category: 'Trust & Legal',
    badge: 'Safe Harbor',
    icon: '💬'
  },
  {
    id: 'contact',
    title: 'Contact Support & Nodal Grievance Desk',
    description: 'Reach our executive leadership and grievance officer at Indiranagar, Bengaluru or via arjunmpgupta@gmail.com.',
    path: '/contact',
    url: 'https://app.vernunt.com/contact',
    category: 'Trust & Legal',
    badge: '24/7 Desk',
    icon: '☎️'
  },

  // Mobile Apps
  {
    id: 'android-apk',
    title: 'Vernunt Android App (Direct APK Download)',
    description: 'Download the official Vernunt Android App for smartphone push alerts, GPS radar, and encrypted local storage.',
    path: '/api/download/android-apk',
    url: 'https://app.vernunt.com/api/download/android-apk',
    category: 'Mobile Apps',
    badge: 'Android v1.0.0',
    icon: '🤖'
  },
  {
    id: 'ios-app',
    title: 'Vernunt iOS Web App Installation Guide',
    description: 'Install Vernunt on iPhone & iPad with offline caching and native home screen icon.',
    path: '/ios',
    url: 'https://app.vernunt.com/ios',
    category: 'Mobile Apps',
    badge: 'Apple iOS',
    icon: '🍎'
  }
];

export interface UniversalSocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: Partial<ShareableItem> | null;
  onNavigateToItem?: (item: ShareableItem) => void;
}

export const UniversalSocialShareModal: React.FC<UniversalSocialShareModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  onNavigateToItem
}) => {
  const [selectedItem, setSelectedItem] = useState<ShareableItem>(() => {
    if (initialItem && initialItem.title && initialItem.url) {
      return {
        id: initialItem.id || 'custom',
        title: initialItem.title,
        description: initialItem.description || "India's verified neighborhood kids playmate radar & safe childcare network.",
        path: initialItem.path || '/',
        url: initialItem.url,
        category: initialItem.category || 'Platform Pages',
        badge: initialItem.badge || 'Share',
        icon: initialItem.icon || '🔗'
      };
    }
    return PLATFORM_SHAREABLE_LINKS[0];
  });

  const [activeCategory, setActiveCategory] = useState<'All' | 'Platform Pages' | 'Partner Portals' | 'Trust & Legal' | 'Mobile Apps'>('All');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when initialItem changes
  useEffect(() => {
    if (initialItem && initialItem.title && initialItem.url) {
      const match = PLATFORM_SHAREABLE_LINKS.find(
        p => p.id === initialItem.id || p.path === initialItem.path || p.url === initialItem.url
      );
      if (match) {
        setSelectedItem(match);
      } else {
        setSelectedItem({
          id: initialItem.id || 'custom',
          title: initialItem.title,
          description: initialItem.description || "India's verified neighborhood kids playmate radar & safe childcare network.",
          path: initialItem.path || '/',
          url: initialItem.url,
          category: initialItem.category || 'Platform Pages',
          badge: initialItem.badge || 'Share',
          icon: initialItem.icon || '🔗'
        });
      }
    }
  }, [initialItem]);

  // Compute live absolute URL using origin when running in browser
  const shareUrl = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}${selectedItem.path}`
    : selectedItem.url;

  // Generate QR Code dynamically
  useEffect(() => {
    if (showQrCode && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code generation failed', err));
    }
  }, [shareUrl, showQrCode]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Formatted share message
  const shareText = `🌟 *${selectedItem.title}*
${selectedItem.description}

👉 *Explore on Vernunt:*
${shareUrl}

Verified neighborhood playmate radar, safe childcare, and parent network in India.`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'email' | 'native') => {
    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedItem.title)}&url=${encodeURIComponent(shareUrl)}&hashtags=Vernunt,Parenting,SafePlay,India`, '_blank', 'noopener,noreferrer');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(selectedItem.title)}`, '_blank', 'noopener,noreferrer');
        break;
      case 'email': {
        const subject = encodeURIComponent(`Vernunt: ${selectedItem.title}`);
        const body = encodeURIComponent(`${shareText}\n\nVisit: ${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: selectedItem.title,
              text: selectedItem.description,
              url: shareUrl
            });
          } catch (err) {
            console.debug('Native share dismissed', err);
          }
        } else {
          handleCopy();
        }
        break;
    }
  };

  const filteredLinks = PLATFORM_SHAREABLE_LINKS.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl shrink-0 border border-white/10">
              <Share2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                Share Vernunt &amp; Verified Links
              </h3>
              <p className="text-xs text-indigo-200">
                Share any page, legal policy, or portal with family, schools &amp; community
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Currently Selected Link Card */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedItem.icon || '🔗'}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900">
                      {selectedItem.title}
                    </h4>
                    {selectedItem.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {selectedItem.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {selectedItem.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct URL input with Copy & Open buttons */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl p-1.5 pl-3">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs font-mono text-slate-700 bg-transparent outline-none truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              {onNavigateToItem && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToItem(selectedItem);
                    onClose();
                  }}
                  className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  title="Open this page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </button>
              )}
            </div>

            {/* Social Share One-Click Buttons */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Share directly to:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => handleShare('whatsapp')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare('twitter')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 transition cursor-pointer"
                >
                  <Twitter className="w-5 h-5 text-slate-900 mb-1" />
                  <span className="text-[11px] font-bold">X / Twitter</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare('facebook')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition cursor-pointer"
                >
                  <Facebook className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-[11px] font-bold">Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare('linkedin')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition cursor-pointer"
                >
                  <Linkedin className="w-5 h-5 text-sky-700 mb-1" />
                  <span className="text-[11px] font-bold">LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare('telegram')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 transition cursor-pointer"
                >
                  <Send className="w-5 h-5 text-cyan-600 mb-1" />
                  <span className="text-[11px] font-bold">Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare('email')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 transition cursor-pointer"
                >
                  <Mail className="w-5 h-5 text-purple-600 mb-1" />
                  <span className="text-[11px] font-bold">Email</span>
                </button>
              </div>
            </div>

            {/* QR Code Toggle */}
            <div className="pt-1 flex items-center justify-between border-t border-indigo-100/80 text-xs">
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQrCode ? 'Hide QR Code' : 'Show Instant QR Code for In-Person Scanning'}</span>
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() => handleShare('native')}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Native Share Sheet</span>
                </button>
              )}
            </div>

            {showQrCode && qrDataUrl && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-2 animate-fade-in">
                <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-lg shadow-2xs border border-slate-100" />
                <p className="text-xs font-bold text-slate-800">Scan with any smartphone camera to open link</p>
                <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{shareUrl}</p>
              </div>
            )}
          </div>

          {/* Directory of All Platform Links & Footer Pages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Browse All Platform Links &amp; Footer Pages
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {filteredLinks.length} Links Available
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['All', 'Platform Pages', 'Partner Portals', 'Trust & Legal', 'Mobile Apps'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search links (e.g. Terms, Radar, Store, Shipping, Child Safety)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white transition"
            />

            {/* Links List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredLinks.map(link => {
                const isSelected = selectedItem.id === link.id;
                return (
                  <div
                    key={link.id}
                    onClick={() => setSelectedItem(link)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{link.icon || '🔗'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {link.title}
                          </p>
                          {link.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {link.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {link.path}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-indigo-600">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>DPDP Act 2023 Compliant Public Social Metadata</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default UniversalSocialShareModal;
