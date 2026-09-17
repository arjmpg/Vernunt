import { PlaydateReview } from '../types.ts';
import { db, auth } from '../utils/firebase.ts';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY = 'vernunt_playdate_reviews_v1';

// Initial realistic seed reviews for neighborhood playmates
export const INITIAL_SEED_REVIEWS: PlaydateReview[] = [
  {
    id: 'rev-seed-1',
    targetProfileId: 'blr-playmate-0',
    targetChildName: 'Aarav',
    targetParentName: 'Priya & Rajesh Sharma',
    reviewerProfileId: 'playmate-1',
    reviewerParentName: 'Deepa & Karthik Rao',
    reviewerChildName: 'Liam',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateId: 'date-1',
    playdateTitle: 'Lego Building at Central Park',
    rating: 5,
    reviewText: 'Wonderful playdate! Aarav was so welcoming and generously shared his Lego bricks with Liam. Priya prepared healthy fruit snacks and the kids had a blast. Very polite, safe, and lovely family!',
    experienceTags: ['Kind & Sharing', 'Safe Supervision', 'Punctual', 'Great Communicator'],
    childInteractionRating: 5,
    parentHospitalityRating: 5,
    safetyRating: 5,
    status: 'approved',
    createdAt: '2026-06-03T11:30:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 6,
    helpfulVoters: ['user-blr-1', 'user-blr-2']
  },
  {
    id: 'rev-seed-2',
    targetProfileId: 'blr-playmate-0',
    targetChildName: 'Aarav',
    targetParentName: 'Priya & Rajesh Sharma',
    reviewerProfileId: 'blr-playmate-2',
    reviewerParentName: 'Ananya & Vikram Hegde',
    reviewerChildName: 'Diya',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateTitle: 'Montessori Drawing & Clay Modeling',
    rating: 5,
    reviewText: 'Priya is an amazing host. The play space was clean and child-proofed. Aarav and Diya connected right away and made clay sculptures together. Can not wait for the next playdate!',
    experienceTags: ['Super Clean Space', 'Kind & Sharing', 'Creative Play'],
    childInteractionRating: 5,
    parentHospitalityRating: 5,
    safetyRating: 5,
    status: 'approved',
    createdAt: '2026-06-07T16:45:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 4,
    helpfulVoters: []
  },
  {
    id: 'rev-seed-3',
    targetProfileId: 'blr-playmate-1',
    targetChildName: 'Ananya',
    targetParentName: 'Sneha & Rohan Iyer',
    reviewerProfileId: 'blr-playmate-3',
    reviewerParentName: 'Meera & Siddharth Nair',
    reviewerChildName: 'Kabir',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateTitle: 'Indiranagar Park Frisbee & Tag',
    rating: 5,
    reviewText: 'Sneha arrived right on time at the park. Ananya is full of joyful energy and taught Kabir some fun dance moves. Great communication prior to meeting!',
    experienceTags: ['Punctual', 'High Energy Fun', 'Friendly & Welcoming'],
    childInteractionRating: 5,
    parentHospitalityRating: 5,
    safetyRating: 5,
    status: 'approved',
    createdAt: '2026-06-10T09:15:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 3,
    helpfulVoters: []
  },
  {
    id: 'rev-seed-4',
    targetProfileId: 'blr-playmate-2',
    targetChildName: 'Vivaan',
    targetParentName: 'Pooja & Amit Verma',
    reviewerProfileId: 'blr-playmate-4',
    reviewerParentName: 'Swati & Nitin Patel',
    reviewerChildName: 'Rhea',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateTitle: 'HSR Layout Playground Swings & Slides',
    rating: 4,
    reviewText: 'Very pleasant evening. The kids got along well on the jungle gym and slides. Amit was attentive and kept close eye on playground safety.',
    experienceTags: ['Safe Supervision', 'Friendly & Welcoming', 'Respectful Family'],
    childInteractionRating: 4,
    parentHospitalityRating: 5,
    safetyRating: 5,
    status: 'approved',
    createdAt: '2026-06-11T17:20:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 2,
    helpfulVoters: []
  },
  {
    id: 'rev-seed-5',
    targetProfileId: 'blr-playmate-3',
    targetChildName: 'Diya',
    targetParentName: 'Kavita & Arvind Menon',
    reviewerProfileId: 'blr-playmate-0',
    reviewerParentName: 'Priya & Rajesh Sharma',
    reviewerChildName: 'Aarav',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateTitle: 'Whitefield STEM & Building Blocks',
    rating: 5,
    reviewText: 'Diya and Aarav spent 2 hours quietly building towering castles with magnetic tiles. Kavita even packed allergen-free cookies. Outstanding experience!',
    experienceTags: ['Creative Play', 'Kind & Sharing', 'Super Clean Space', 'Punctual'],
    childInteractionRating: 5,
    parentHospitalityRating: 5,
    safetyRating: 5,
    status: 'approved',
    createdAt: '2026-06-12T14:10:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 5,
    helpfulVoters: []
  },
  // Seed sample for flagged review in Admin Review Moderation Queue
  {
    id: 'rev-seed-flagged-1',
    targetProfileId: 'blr-playmate-1',
    targetChildName: 'Ananya',
    targetParentName: 'Sneha & Rohan Iyer',
    reviewerProfileId: 'user-anon-test',
    reviewerParentName: 'Disgruntled Neighbor',
    reviewerChildName: 'Anonymous',
    reviewerPhotoUrl: '',
    reviewerAadhaarVerified: false,
    playdateTitle: 'Apartment Courtyard Play',
    rating: 1,
    reviewText: 'Terrible! They cancelled at the last minute and refused to answer my WhatsApp messages. Check out my telegram t.me/spamdeals for real parenting groups!',
    experienceTags: ['Unreliable'],
    childInteractionRating: 1,
    parentHospitalityRating: 1,
    safetyRating: 2,
    status: 'flagged',
    flagReason: 'Automated Abuse Shield: Retaliatory 1-Star & External Spam Link Detected (t.me)',
    moderationNotes: 'Contains promotional telegram link and 1-star retaliation without verified playdate proof.',
    createdAt: '2026-06-14T08:00:00.000Z',
    verifiedPlaydate: false,
    helpfulCount: 0,
    helpfulVoters: []
  },
  // Seed sample for pending review
  {
    id: 'rev-seed-pending-1',
    targetProfileId: 'blr-playmate-0',
    targetChildName: 'Aarav',
    targetParentName: 'Priya & Rajesh Sharma',
    reviewerProfileId: 'blr-playmate-5',
    reviewerParentName: 'Sunita & Rahul Kulkarni',
    reviewerChildName: 'Vihaan',
    reviewerPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    reviewerAadhaarVerified: true,
    playdateTitle: 'Weekend Cricket in the Park',
    rating: 4,
    reviewText: 'Great evening cricket practice. Aarav was enthusiastic and shared his bats. Awaiting standard community safety review.',
    experienceTags: ['Punctual', 'High Energy Fun'],
    childInteractionRating: 4,
    parentHospitalityRating: 4,
    safetyRating: 5,
    status: 'pending',
    flagReason: 'Standard New Parent Review Queue',
    createdAt: '2026-06-15T18:00:00.000Z',
    verifiedPlaydate: true,
    helpfulCount: 0,
    helpfulVoters: []
  }
];

// In-memory state cache
let cachedReviews: PlaydateReview[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying review listener', e);
    }
  });
}

export function subscribeToReviews(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Load cached reviews from localStorage or seeds
export function initializeReviews(): PlaydateReview[] {
  if (isInitialized && cachedReviews.length > 0) {
    return cachedReviews;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedReviews = parsed;
        isInitialized = true;
        return cachedReviews;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached reviews from localStorage', e);
  }

  // Fallback to initial seeds
  cachedReviews = [...INITIAL_SEED_REVIEWS];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedReviews));
  } catch (e) {
    // Ignore storage quota
  }
  isInitialized = true;
  return cachedReviews;
}

function persistReviews(reviews: PlaydateReview[]) {
  cachedReviews = [...reviews];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedReviews));
  } catch (e) {
    console.warn('Failed to persist reviews', e);
  }
  notifyListeners();
}

// ============================================================================
// AUTOMATED MODERATION & ABUSE SHIELD
// ============================================================================
const BANNED_KEYWORDS = [
  'idiot', 'stupid', 'hate', 'moron', 'scam', 'fraud', 'cheat', 'bastard',
  'kill', 'shut up', 'abuse', 'bully', 'ugly', 'disgusting', 'bitch', 'asshole',
  'dumb', 'loser', 'freak', 'pedophile', 'predator', 'fake'
];

const SPAM_PATTERNS = [
  /t\.me\//i,
  /telegram/i,
  /whatsapp\.com\/channel/i,
  /bit\.ly\//i,
  /tinyurl\.com/i,
  /cashapp/i,
  /gpay to \d+/i,
  /crypto/i,
  /forex/i,
  /discount code/i,
  /buy cheap/i
];

// Scan for phone number or email leaks to prevent PII exposure / harassment
const PHONE_PATTERN = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export interface ModerationResult {
  status: 'approved' | 'pending' | 'flagged';
  flagReason?: string;
  moderationNotes?: string;
}

export function moderateReviewContent(reviewText: string, rating: number): ModerationResult {
  const lower = reviewText.toLowerCase();

  // 1. Check for abusive language
  const detectedBannedWords = BANNED_KEYWORDS.filter(word => lower.includes(word));
  if (detectedBannedWords.length > 0) {
    return {
      status: 'flagged',
      flagReason: `Language Shield Alert: Potentially offensive or hostile words detected (${detectedBannedWords.join(', ')})`,
      moderationNotes: 'Automated content filter flagged review for abusive vocabulary.'
    };
  }

  // 2. Check for spam or external promotion
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(reviewText)) {
      return {
        status: 'flagged',
        flagReason: 'Anti-Spam Alert: Review contains external promotional or messaging links',
        moderationNotes: 'External referral link or commercial advertisement detected.'
      };
    }
  }

  // 3. Check for private phone numbers or emails (COPPA & Child Safety Guard)
  if (PHONE_PATTERN.test(reviewText) || EMAIL_PATTERN.test(reviewText)) {
    return {
      status: 'flagged',
      flagReason: 'Privacy Protection Alert: Personal phone number or email detected in review text',
      moderationNotes: 'Private contact information must not be exposed in public reviews.'
    };
  }

  // 4. Low rating retaliation guard (1 or 2 stars)
  if (rating <= 2) {
    return {
      status: 'pending',
      flagReason: 'Retaliatory Protection Guard: Low rating (≤ 2 stars) held for human guardian/admin review before public display',
      moderationNotes: 'Low ratings are audited to prevent malicious retaliatory bombing after scheduling conflicts.'
    };
  }

  // 5. Clean review with 3-5 stars
  return {
    status: 'approved',
    moderationNotes: 'Passed all automated safety and community language standards.'
  };
}

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

/**
 * Get all reviews stored in system (for Admin Review Moderation Console)
 */
export function getAllReviews(): PlaydateReview[] {
  return initializeReviews();
}

/**
 * Get approved reviews for a specific profile (plus any pending review authored by viewerId)
 */
export function getReviewsForProfile(profileId: string, viewerProfileId?: string): PlaydateReview[] {
  const all = initializeReviews();
  return all.filter(r => {
    if (r.targetProfileId !== profileId) return false;
    if (r.status === 'approved') return true;
    // Allow the reviewer to see their own pending/flagged review with a badge
    if (viewerProfileId && r.reviewerProfileId === viewerProfileId) return true;
    return false;
  });
}

/**
 * Calculate average rating and statistics for a given profile
 */
export function getAverageRatingForProfile(profileId: string): {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  topTags: { tag: string; count: number }[];
  verifiedCount: number;
} {
  const reviews = initializeReviews().filter(
    r => r.targetProfileId === profileId && r.status === 'approved'
  );

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      topTags: [],
      verifiedCount: 0
    };
  }

  const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const average = Number((sum / reviews.length).toFixed(1));

  const dist: { 5: number; 4: number; 3: number; 2: number; 1: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const tagCounts: Record<string, number> = {};
  let verified = 0;

  reviews.forEach(r => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    dist[star] = (dist[star] || 0) + 1;
    if (r.verifiedPlaydate) verified += 1;
    if (r.experienceTags) {
      r.experienceTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    averageRating: average,
    totalReviews: reviews.length,
    ratingDistribution: dist,
    topTags,
    verifiedCount: verified
  };
}

/**
 * Submit a new review for a family/child with automated abuse moderation
 */
export async function submitPlaydateReview(
  data: Omit<PlaydateReview, 'id' | 'createdAt' | 'status' | 'flagReason' | 'moderationNotes'>
): Promise<{ review: PlaydateReview; moderation: ModerationResult }> {
  const currentReviews = initializeReviews();

  // Run automated moderation
  const moderation = moderateReviewContent(data.reviewText, data.rating);

  const newReview: PlaydateReview = {
    ...data,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: moderation.status,
    flagReason: moderation.flagReason,
    moderationNotes: moderation.moderationNotes,
    helpfulCount: 0,
    helpfulVoters: []
  };

  const updated = [newReview, ...currentReviews];
  persistReviews(updated);

  // Sync to Firestore if network available
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, 'reviews', newReview.id), newReview);
    }
  } catch (err) {
    console.warn('Firestore review sync note:', err);
  }

  return { review: newReview, moderation };
}

/**
 * Admin action: update review status (approve, reject, flag)
 */
export async function updateReviewModerationStatus(
  reviewId: string,
  newStatus: 'approved' | 'rejected' | 'flagged',
  moderatorName = 'Admin',
  notes?: string
): Promise<boolean> {
  const currentReviews = initializeReviews();
  const index = currentReviews.findIndex(r => r.id === reviewId);
  if (index === -1) return false;

  const target = currentReviews[index];
  const updatedReview: PlaydateReview = {
    ...target,
    status: newStatus,
    moderatedAt: new Date().toISOString(),
    moderatedBy: moderatorName,
    moderationNotes: notes || target.moderationNotes
  };

  currentReviews[index] = updatedReview;
  persistReviews(currentReviews);

  try {
    if (auth.currentUser) {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: newStatus,
        moderatedAt: updatedReview.moderatedAt,
        moderatedBy: updatedReview.moderatedBy,
        moderationNotes: updatedReview.moderationNotes
      });
    }
  } catch (e) {
    console.warn('Firestore update status failed', e);
  }

  return true;
}

/**
 * Parent action: Report a review for community abuse / harassment
 */
export async function reportPlaydateReview(
  reviewId: string,
  reporterId: string,
  reason: string
): Promise<boolean> {
  const currentReviews = initializeReviews();
  const index = currentReviews.findIndex(r => r.id === reviewId);
  if (index === -1) return false;

  const target = currentReviews[index];
  const existingReporters = target.reportedBy || [];
  if (existingReporters.includes(reporterId)) return true; // already reported

  const updatedReporters = [...existingReporters, reporterId];
  const updatedReview: PlaydateReview = {
    ...target,
    status: 'flagged',
    reportedBy: updatedReporters,
    reportReason: reason,
    flagReason: `Community Reported by ${updatedReporters.length} parent(s): "${reason}"`
  };

  currentReviews[index] = updatedReview;
  persistReviews(currentReviews);

  try {
    if (auth.currentUser) {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status: 'flagged',
        reportedBy: updatedReporters,
        reportReason: reason,
        flagReason: updatedReview.flagReason
      });
    }
  } catch (e) {
    console.warn('Firestore report review sync note', e);
  }

  return true;
}

/**
 * Toggle Helpful vote on a review
 */
export async function toggleHelpfulVote(
  reviewId: string,
  voterId: string
): Promise<{ helpfulCount: number; isVoted: boolean }> {
  const currentReviews = initializeReviews();
  const index = currentReviews.findIndex(r => r.id === reviewId);
  if (index === -1) return { helpfulCount: 0, isVoted: false };

  const target = currentReviews[index];
  const voters = target.helpfulVoters || [];
  const alreadyVoted = voters.includes(voterId);

  const updatedVoters = alreadyVoted
    ? voters.filter(id => id !== voterId)
    : [...voters, voterId];

  const updatedCount = updatedVoters.length;

  currentReviews[index] = {
    ...target,
    helpfulCount: updatedCount,
    helpfulVoters: updatedVoters
  };

  persistReviews(currentReviews);

  try {
    if (auth.currentUser) {
      await updateDoc(doc(db, 'reviews', reviewId), {
        helpfulCount: updatedCount,
        helpfulVoters: updatedVoters
      });
    }
  } catch (e) {
    // Ignore
  }

  return { helpfulCount: updatedCount, isVoted: !alreadyVoted };
}

/**
 * Delete a review permanently (admin only)
 */
export async function deletePlaydateReview(reviewId: string): Promise<boolean> {
  const currentReviews = initializeReviews();
  const updated = currentReviews.filter(r => r.id !== reviewId);
  persistReviews(updated);

  try {
    if (auth.currentUser) {
      await deleteDoc(doc(db, 'reviews', reviewId));
    }
  } catch (e) {
    // Ignore
  }

  return true;
}
