import { ChildProfile, Booking, AffiliateReferralTransaction, AffiliateCampaign } from '../types.ts';
import { db } from './firebase.ts';
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, where } from 'firebase/firestore';

const AFFILIATE_SESSION_KEY = 'vernunt_active_affiliate_ref';
const AFFILIATE_CAMPAIGN_KEY = 'vernunt_active_campaign_slug';

/**
 * Capture and store affiliate referral parameters from the URL
 */
export function captureAffiliateFromUrl(): { affiliateCode: string | null; campaignSlug: string | null } {
  if (typeof window === 'undefined') return { affiliateCode: null, campaignSlug: null };
  try {
    const params = new URLSearchParams(window.location.search);
    
    // Support various affiliate query parameter formats (ref, affiliate, aff, partner)
    const affiliateCode = params.get('aff') || params.get('affiliate') || params.get('partner') || params.get('ref');
    const campaignSlug = params.get('campaign') || params.get('camp') || null;

    if (affiliateCode) {
      const cleanedCode = affiliateCode.trim().toUpperCase();
      sessionStorage.setItem(AFFILIATE_SESSION_KEY, cleanedCode);
      localStorage.setItem(AFFILIATE_SESSION_KEY, cleanedCode); // 30-day cookie style localStorage persistence
      localStorage.setItem(AFFILIATE_SESSION_KEY + '_timestamp', Date.now().toString());

      if (campaignSlug) {
        sessionStorage.setItem(AFFILIATE_CAMPAIGN_KEY, campaignSlug);
        localStorage.setItem(AFFILIATE_CAMPAIGN_KEY, campaignSlug);
      }

      console.log('⚡ [Affiliate Engine] Active affiliate referral tracking locked:', cleanedCode, campaignSlug ? `Campaign: ${campaignSlug}` : '');
      return { affiliateCode: cleanedCode, campaignSlug };
    }
  } catch (err) {
    console.warn('[Affiliate Engine] URL parse note:', err);
  }

  // Check existing session or cached 30-day cookie
  const cachedCode = sessionStorage.getItem(AFFILIATE_SESSION_KEY) || localStorage.getItem(AFFILIATE_SESSION_KEY);
  const cachedCamp = sessionStorage.getItem(AFFILIATE_CAMPAIGN_KEY) || localStorage.getItem(AFFILIATE_CAMPAIGN_KEY);

  // Check 30 days validity
  const stamp = localStorage.getItem(AFFILIATE_SESSION_KEY + '_timestamp');
  if (stamp && cachedCode) {
    const ageDays = (Date.now() - parseInt(stamp, 10)) / (1000 * 60 * 60 * 24);
    if (ageDays <= 30) {
      return { affiliateCode: cachedCode, campaignSlug: cachedCamp };
    }
  }

  return { affiliateCode: cachedCode || null, campaignSlug: cachedCamp || null };
}

/**
 * Generate a personalized Affiliate referral link for any Event, Class, Activity or Specialist
 */
export function generateAffiliateShareUrl(options: {
  affiliateCode?: string;
  tab?: 'events' | 'specialists' | 'radar' | 'business';
  itemId?: string;
  itemType?: 'event' | 'specialist' | 'activity' | 'class';
  campaignSlug?: string;
}): string {
  const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://app.vernunt.com';
  
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const url = new URL(path, origin);

  if (options.tab) {
    url.searchParams.set('tab', options.tab);
  }
  if (options.itemId) {
    url.searchParams.set('eventId', options.itemId);
    url.searchParams.set('id', options.itemId);
  }
  if (options.itemType) {
    url.searchParams.set('type', options.itemType);
  }
  if (options.affiliateCode) {
    url.searchParams.set('aff', options.affiliateCode);
    url.searchParams.set('ref', options.affiliateCode); // backward compatibility
  }
  if (options.campaignSlug) {
    url.searchParams.set('campaign', options.campaignSlug);
  }

  return url.toString();
}

/**
 * Format a rich WhatsApp share message with Affiliate Tracking link embedded
 */
export function generateWhatsAppShareText(options: {
  title: string;
  category: string;
  date?: string;
  time?: string;
  location?: string;
  price?: number;
  description?: string;
  hostName?: string;
  affiliateCode?: string;
  shareUrl: string;
  isAffiliate?: boolean;
}): string {
  const priceDisplay = options.price && options.price > 0 ? `₹${options.price}` : 'FREE Entry';
  const categoryIcon = 
    options.category === 'Class' ? '🎓' :
    options.category === 'Activity' ? '🧸' :
    options.category === 'Competition' ? '🏆' : '🌟';

  return `${categoryIcon} *${options.title.trim()}* ${categoryIcon}
📂 *Category:* ${options.category}
📅 *Date & Time:* ${options.date || 'Upcoming'} ${options.time ? `at ${options.time}` : ''}
📍 *Location:* ${options.location || 'Local Community Arena'}
👤 *Hosted By:* ${options.hostName || 'Vernunt Community'}
🎟️ *Pass / Admission:* ${priceDisplay}

${options.description ? `📝 ${options.description.slice(0, 180)}...` : ''}

👉 *Join & Book passes directly here:*
${options.shareUrl}

${options.isAffiliate ? `🎁 _Book via this verified partner link for instant pass confirmation & verified community check-in._` : ''}`;
}

/**
 * Open WhatsApp Share directly with pre-composed message
 */
export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Process and Attribute Affiliate Commission upon successful Booking / Checkout
 */
export async function attributeAffiliateBooking(booking: Booking, eventOrItemTitle?: string): Promise<AffiliateReferralTransaction | null> {
  const { affiliateCode, campaignSlug } = captureAffiliateFromUrl();
  if (!affiliateCode) return null;

  try {
    // 1. Locate affiliate in Firestore by affiliateCode or referralCode
    const usersRef = collection(db, 'users');
    let affiliateDocSnap: any = null;

    // Search by affiliateCode
    const q1 = query(usersRef, where('affiliateCode', '==', affiliateCode));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      affiliateDocSnap = snap1.docs[0];
    } else {
      // Fallback search by referralCode
      const q2 = query(usersRef, where('referralCode', '==', affiliateCode));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        affiliateDocSnap = snap2.docs[0];
      }
    }

    if (!affiliateDocSnap) {
      console.log('[Affiliate Engine] No affiliate user account matched code:', affiliateCode);
      return null;
    }

    const affiliateData = affiliateDocSnap.data() as ChildProfile;
    const affiliateId = affiliateDocSnap.id;
    const affiliateName = affiliateData.parentName || 'Affiliate Partner';
    const commRate = affiliateData.affiliateCommissionRate || 15; // default 15% commission
    const orderTotal = booking.amountPaid || 0;
    const commissionAmount = Math.round((orderTotal * commRate) / 100);

    const transactionRecord: AffiliateReferralTransaction = {
      id: `aff-tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      affiliateId,
      affiliateName,
      affiliateCode,
      orderId: booking.id,
      bookingId: booking.id,
      itemType: booking.type === 'SpecialistAppointment' ? 'Specialist' : 'Event',
      itemTitle: booking.itemTitle || eventOrItemTitle || 'Community Pass',
      itemId: booking.itemId,
      buyerName: booking.buyerName,
      buyerEmail: booking.buyerEmail,
      orderTotal,
      commissionRate: commRate,
      commissionAmount,
      status: 'Paid',
      payoutStatus: 'Unpaid',
      createdAt: new Date().toISOString(),
      campaignSlug: campaignSlug || undefined
    };

    // 2. Persist transaction into Firestore collection
    await setDoc(doc(db, 'affiliate_transactions', transactionRecord.id), transactionRecord);

    // 3. Increment affiliate's financial ledger in Firestore
    await updateDoc(doc(db, 'users', affiliateId), {
      isAffiliate: true,
      affiliateEarningsTotal: increment(commissionAmount),
      affiliateEarningsUnpaid: increment(commissionAmount),
      affiliateTotalConversions: increment(1)
    });

    console.log(`🎉 [Affiliate Engine] Successfully credited ₹${commissionAmount} commission to ${affiliateName} (${affiliateCode})!`);
    return transactionRecord;

  } catch (err) {
    console.error('[Affiliate Engine] Failed to record affiliate conversion:', err);
    return null;
  }
}
