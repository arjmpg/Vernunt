import { db } from './firebase.ts';
import { 
  collection, doc, setDoc, updateDoc, getDoc, getDocs, 
  onSnapshot, increment, arrayUnion, query, orderBy, limit 
} from 'firebase/firestore';
import { CommunityEvent, ChildProfile, SocialShareRecord, SocialSharePlatform } from '../types.ts';

const SHARES_STORAGE_KEY = 'vernunt_social_shares_history';
const ACTIVE_SHARE_ID_KEY = 'vernunt_active_share_id';

/**
 * Generate a clean, unique share token
 */
export function generateShareToken(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `sh_${timePart}_${randomPart}`;
}

/**
 * Record an outbound social share into Firestore & local storage
 * Tracks:
 * - SENDER: account name, phone number, email, user role, user ID
 * - RECIPIENT: recipient mobile number / contact (when direct send is selected)
 * - EVENT: event ID, title, date, location
 * - CHANNEL: WhatsApp Direct, WhatsApp General, Facebook, Twitter, Telegram, Email, etc.
 * - METRICS: initial clicks: 0, conversions: 0
 */
export async function recordSocialShare(params: {
  event: CommunityEvent;
  userProfile?: ChildProfile | null;
  platform: SocialSharePlatform;
  recipientPhone?: string;
  recipientName?: string;
}): Promise<{ record: SocialShareRecord; trackedUrl: string }> {
  const { event, userProfile, platform, recipientPhone, recipientName } = params;

  const shareToken = generateShareToken();
  const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://app.vernunt.com';

  const referralCode = userProfile?.affiliateCode || userProfile?.referralCode || undefined;
  
  // Format clean sender phone
  const rawSenderPhone = userProfile?.phoneNumber || '';
  const cleanSenderPhone = rawSenderPhone.replace(/\D/g, '').slice(-10);
  const formattedSenderPhone = cleanSenderPhone ? `+91${cleanSenderPhone}` : undefined;

  // Format clean recipient phone
  let cleanRecipientPhone: string | undefined = undefined;
  if (recipientPhone) {
    const digits = recipientPhone.replace(/\D/g, '').slice(-10);
    if (digits.length === 10) {
      cleanRecipientPhone = `+91${digits}`;
    }
  }

  // Construct URL with unique share token & attribution parameters
  const shareUrlObj = new URL('/?tab=events', origin);
  shareUrlObj.searchParams.set('eventId', event.id);
  shareUrlObj.searchParams.set('shareId', shareToken);
  if (referralCode) {
    shareUrlObj.searchParams.set('ref', referralCode);
    shareUrlObj.searchParams.set('aff', referralCode);
  }
  if (formattedSenderPhone) {
    shareUrlObj.searchParams.set('sharedBy', cleanSenderPhone);
  }
  if (cleanRecipientPhone) {
    shareUrlObj.searchParams.set('targetTo', cleanRecipientPhone.slice(-4)); // masked in URL
  }
  shareUrlObj.searchParams.set('utm_source', platform);
  shareUrlObj.searchParams.set('utm_medium', 'social');
  shareUrlObj.searchParams.set('utm_campaign', `event_${event.id}`);

  const trackedUrl = shareUrlObj.toString();

  const record: SocialShareRecord = {
    id: shareToken,
    eventId: event.id,
    eventTitle: event.title,
    eventCategory: event.category,
    eventDate: event.date,
    eventLocation: event.location,
    
    // SENDER details
    senderUserId: userProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('vernunt_active_user_id') || 'guest' : 'guest'),
    senderName: userProfile?.parentName || 'Community Member',
    senderPhone: formattedSenderPhone || userProfile?.phoneNumber,
    senderEmail: userProfile?.email,
    senderRole: userProfile?.userRole || 'Parent',

    // RECIPIENT details
    recipientPhone: cleanRecipientPhone || recipientPhone,
    recipientName: recipientName?.trim() || undefined,

    // CHANNEL & URL
    platform,
    shareToken,
    shareUrl: trackedUrl,
    referralCode,

    // METRICS
    clicksCount: 0,
    conversionsCount: 0,
    attributedBookings: [],

    // TELEMETRY
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  };

  // 1. Save locally immediately for 100% instant retrieval
  try {
    const rawLocal = localStorage.getItem(SHARES_STORAGE_KEY);
    const existing: SocialShareRecord[] = rawLocal ? JSON.parse(rawLocal) : [];
    const updated = [record, ...existing.filter(s => s.id !== record.id)].slice(0, 300);
    localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(updated));
  } catch (localErr) {
    console.debug('Local share save note:', localErr);
  }

  // 2. Persist to Firestore cloud database
  try {
    await setDoc(doc(db, 'social_shares', shareToken), record);
    console.log('✅ Outbound social share logged in Firestore:', shareToken, 'From:', record.senderPhone, 'To:', record.recipientPhone);
  } catch (cloudErr) {
    console.warn('Firestore social share write note (proceeding with local store):', cloudErr);
  }

  // 3. Dispatch client event for real-time UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vernunt_share_recorded', { detail: record }));
  }

  return { record, trackedUrl };
}

/**
 * Track an inbound click when someone opens the shared link
 */
export async function trackInboundShareClick(shareId: string): Promise<void> {
  if (!shareId) return;

  const sessionGuardKey = `vernunt_click_counted_${shareId}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionGuardKey)) {
    return; // Already counted this session
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(sessionGuardKey, 'true');
      sessionStorage.setItem(ACTIVE_SHARE_ID_KEY, shareId);
      localStorage.setItem(ACTIVE_SHARE_ID_KEY, shareId);
    }

    // Increment click count in Firestore
    const shareRef = doc(db, 'social_shares', shareId);
    await updateDoc(shareRef, {
      clicksCount: increment(1)
    });
    console.log('📈 [Share Tracking] Inbound click registered for share:', shareId);
  } catch (err) {
    console.debug('Share click tracking notice:', err);
  }
}

/**
 * Track an event ticket booking or registration conversion back to the shared link
 */
export async function trackShareConversion(bookingId: string): Promise<void> {
  const activeShareId = typeof sessionStorage !== 'undefined' 
    ? sessionStorage.getItem(ACTIVE_SHARE_ID_KEY) || localStorage.getItem(ACTIVE_SHARE_ID_KEY)
    : null;

  if (!activeShareId) return;

  try {
    const shareRef = doc(db, 'social_shares', activeShareId);
    await updateDoc(shareRef, {
      conversionsCount: increment(1),
      attributedBookings: arrayUnion(bookingId)
    });
    console.log('🎉 [Share Tracking] Conversion attributed to share:', activeShareId, 'Booking:', bookingId);
  } catch (err) {
    console.debug('Share conversion tracking note:', err);
  }
}

/**
 * Retrieve all tracked social shares for admin audit
 */
export async function getTrackedSocialShares(): Promise<SocialShareRecord[]> {
  const localList: SocialShareRecord[] = (() => {
    try {
      const raw = localStorage.getItem(SHARES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  try {
    const q = query(collection(db, 'social_shares'), orderBy('timestamp', 'desc'), limit(150));
    const snapshot = await getDocs(q);
    const cloudList: SocialShareRecord[] = snapshot.docs.map(d => d.data() as SocialShareRecord);
    
    // Merge cloud and local deduplicating by ID
    const mergedMap = new Map<string, SocialShareRecord>();
    cloudList.forEach(item => mergedMap.set(item.id, item));
    localList.forEach(item => {
      if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
    });

    return Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.warn('Firestore fetch shares note, using local audit cache:', err);
    return localList;
  }
}

/**
 * Subscribe to real-time social share audit updates
 */
export function subscribeToSocialShares(callback: (shares: SocialShareRecord[]) => void): () => void {
  try {
    const q = query(collection(db, 'social_shares'), orderBy('timestamp', 'desc'), limit(150));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as SocialShareRecord);
      callback(list);
    }, (err) => {
      console.warn('Real-time shares listener notice:', err);
      getTrackedSocialShares().then(callback);
    });
  } catch (err) {
    console.warn('Subscribe to shares error:', err);
    getTrackedSocialShares().then(callback);
    return () => {};
  }
}
