export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED'
}

export enum LocationSharing {
  PRECISE = 'PRECISE',
  APPROXIMATE = 'APPROXIMATE',
  HIDDEN = 'HIDDEN'
}

export interface ChildProfile {
  id: string;
  parentName: string;
  childName: string;
  childAge: number;
  childGender: 'Boy' | 'Girl' | 'Other';
  gradeLevel: string; // e.g. "Toddler", "Preschool", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade"
  playStyle: string;
  bio: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    distance?: number; // Calculated proximity
  };
  locationSharing: LocationSharing;
  verificationStatus: VerificationStatus;
  interests: string[];
  photoUrl: string;
  parentPhotoUrl?: string; // Parent/Guardian photo (MANDATORY for trust & safety)
  childPhotoUrl?: string; // Child photo (OPTIONAL for child COPPA/DPDP privacy)
  ageUnit?: 'years' | 'months';
  parentsIncome?: string; // Hidden in frontend
  caste?: string;
  religion?: string;
  parentProfession?: string;
  motherTongue?: string;
  languagesKnown?: string[];
  phoneNumber?: string;
  phoneVerified?: boolean;
  phonePrivacyOption?: 'lock_permanently' | 'show_after_acceptance' | 'show_after_referral';
  referralCode?: string;
  referredByCode?: string;
  referralCount?: number;
  contactViewCredits?: number;
  unlockedPhoneIds?: string[];
  email?: string;
  aadhaarNumber?: string;
  aadhaarVerified?: boolean;
  criminalRecordChecked?: boolean;
  positiveReviewsCount?: number;
  attendedEventsCount?: number;
  checkedInEvents?: string[];
  userRole?: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin';
  availableDays?: string[];
  availableTimes?: string[];
  
  // Custom Class & Activity / Portfolio Specialists Parameters
  hostingEntityType?: 'Individual' | 'Company';
  specialistEntityType?: 'Individual' | 'Company';
  companyName?: string;
  companyRegNumber?: string;
  companyWebsite?: string;
  repDesignation?: string;
  specialistTitle?: string;
  experienceYears?: number;
  highestQualification?: string;
  consultFees?: number;
  clinicAddress?: string;
  hostingSpecialties?: string[];
  idDocumentName?: string;
  companyDocName?: string;
  addressProofDocName?: string;
  
  // Kids Connect Subscription Settings
  subscriptionActive?: boolean;
  subscriptionPlan?: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
  subscriptionExpiryDate?: string;

  // Premium Hosting & Listing Settings (Portfolio Professionals / Event Organizers)
  businessListingModel?: 'subscription' | 'commission'; // If subscription, upfront payment. If commission, booking fee split.
  businessSubscriptionActive?: boolean;
  businessSubscriptionPlan?: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
  businessSubscriptionExpiryDate?: string;
  businessCommissionRate?: number; // Custom commission rate override


  // Admin Lock & Block overrides
  isLocked?: boolean;
  isBlocked?: boolean;

  // Face-to-Selfie verification details for child safety
  selfiePhotoUrl?: string;
  faceVerificationStatus?: 'none' | 'verified' | 'failed' | 'pending_admin';
  faceVerificationScore?: number;
  faceVerificationTimestamp?: string;

  // Real-time Availability & Dynamic Presence indicators
  activityStatus?: 'Currently Active' | 'Away' | 'Available for Play';
  lookingForImmediatePlaydate?: boolean;
  lastActiveAt?: string;
  savedProfileIds?: string[];
  preferredActivities?: string[];

  // Mobile Phone Contacts Privacy & Visibility Settings
  contactsPrivacy?: UserContactsPrivacy;

  // WooCommerce Affiliate Model Settings & Stats
  isAffiliate?: boolean;
  affiliateStatus?: 'active' | 'pending' | 'rejected' | 'inactive';
  affiliateCode?: string; // Custom affiliate referral slug e.g. "SARAH-KIDS"
  affiliateCommissionRate?: number; // Custom commission percentage (e.g. 15%)
  affiliateTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Ambassador';
  affiliateEarningsTotal?: number; // Total INR earned through referral bookings
  affiliateEarningsPaid?: number; // Total INR paid out to affiliate
  affiliateEarningsUnpaid?: number; // Unpaid/pending balance in INR
  affiliateTotalClicks?: number; // Total clicks tracked through affiliate links
  affiliateTotalConversions?: number; // Total successful bookings generated
  affiliatePayoutMethod?: 'upi' | 'bank_transfer' | 'store_credit';
  affiliatePayoutDetails?: {
    upiId?: string;
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  affiliateCoupons?: string[]; // Coupons assigned specifically to this affiliate
  affiliateCampaigns?: AffiliateCampaign[];
  affiliateParentId?: string; // Multi-tier sub-affiliate parent
}

export interface AffiliateCampaign {
  id: string;
  title: string;
  slug: string;
  targetUrl: string;
  clicks: number;
  conversions: number;
  revenue: number;
  earnings: number;
  createdAt: string;
}

export interface AffiliateReferralTransaction {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateCode: string;
  orderId: string;
  bookingId?: string;
  itemType: 'Event' | 'Class' | 'Activity' | 'Competition' | 'Specialist' | 'Subscription';
  itemTitle: string;
  itemId: string;
  buyerName: string;
  buyerEmail?: string;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Pending' | 'Paid' | 'Rejected' | 'Refunded';
  payoutStatus?: 'Unpaid' | 'Processing' | 'Paid';
  payoutTransactionId?: string;
  payoutDate?: string;
  createdAt: string;
  campaignSlug?: string;
}

export interface AffiliatePayoutBatch {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  payoutMethod: 'upi' | 'bank_transfer' | 'store_credit';
  payoutDetails: string;
  referenceNumber: string;
  status: 'Completed' | 'Processing' | 'Failed';
  transactionCount: number;
  processedAt: string;
  processedBy?: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  popular?: boolean;
  saving?: string | null;
  color?: string;
  durationDays: number;
  description: string;
  capabilities: string[];
  isCustom?: boolean;
  isActive?: boolean;
}

export interface UserContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: 'Family' | 'Friend' | 'Neighbor' | 'School' | 'Work' | 'Other';
  visibility: 'visible' | 'hidden' | 'connected'; // 'visible' = can view profile, 'hidden' = ghost mode (profile hidden from this contact), 'connected' = connected/friends
  syncedAt: string;
  avatarUrl?: string;
  notes?: string;
}

export interface UserContactsPrivacy {
  autoHideFromAllContacts: boolean; // Hide child profile from entire mobile phone book by default
  allowContactsAutoConnect: boolean; // Automatically discover mutual contacts on Vernunt
  contactsPermissionGranted: boolean;
  lastSyncedAt?: string;
  contacts: UserContact[];
}

export interface Playdate {
  id: string;
  title: string;
  hostId: string;
  guestId: string;
  date: string;
  time: string;
  location: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  notes?: string;
  isGroup?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  opponentId: string;
  messages: Message[];
  lastUpdated: string;
}

export interface TicketTier {
  id: string;
  name: string; // e.g. "VIP Family Pass", "Standard Kid + 1 Parent", "Early Bird"
  price: number; // in INR (0 = Free)
  capacity: number;
  remainingStock: number;
  description?: string;
  maxPerOrder?: number;
  includesKit?: boolean;
  ageGroup?: string; // e.g. "3-6 years", "All Ages"
}

export interface EventScheduleItem {
  id: string;
  time: string; // e.g. "10:00 AM"
  title: string; // e.g. "Warm-up & Interactive Storytelling"
  speaker?: string;
  description?: string;
}

export interface EventCoupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // e.g. 15 for 15% or 100 for Rs.100 off
  minPurchase?: number;
  validUntil?: string;
  description?: string;
}

export interface EventAttendee {
  id: string;
  ticketNumber: string; // e.g. "VERN-EVT-8924-819"
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  childName?: string;
  childAge?: number;
  ticketTierName: string;
  tierId?: string;
  quantity: number;
  amountPaid: number;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  specialRequirements?: string;
  emergencyPhone?: string;
  qrPayload?: string;
  paymentId?: string;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  hostName: string;
  attendeesCount: number;
  joined: boolean;
  category: string;
  photoUrl: string;
  tags?: string[];
  ticketPrice?: number; // Base Price in INR (0 means FREE)
  commissionPercentage?: number; // Custom admin override percentage (default e.g. 10%)
  lat?: number;
  lng?: number;
  iconEmoji?: string;
  // WooEvents Advanced Parameters
  ticketTiers?: TicketTier[];
  scheduleAgenda?: EventScheduleItem[];
  targetAgeRange?: string; // e.g. "2 - 8 Years"
  maxCapacity?: number;
  venueAddressDetails?: string;
  googleMapsUrl?: string;
  organizerContact?: {
    name: string;
    phone?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
  };
  isRecurring?: boolean;
  recurringSlots?: string[]; // e.g. ["10:00 AM - 11:30 AM", "03:00 PM - 04:30 PM"]
  featured?: boolean;
  isSponsored?: boolean;
  sponsoredBy?: string;
  sponsorLogos?: string[];
  affiliateCommissionRate?: number; // Override commission for affiliates promoting this specific event/class
  distance?: number; // Calculated proximity from active parent coordinates
  customQuestions?: {
    askChildAge?: boolean;
    askDietaryAllergies?: boolean;
    askEmergencyPhone?: boolean;
    customNotePrompt?: string;
  };
}

export interface SpecialistProfile {
  id: string;
  name: string;
  title: string; // e.g., "Senior Child Nutritionist", "Lego Master & Creative Coach"
  category: 'Nutritionist' | 'Tutor' | 'Makeup Artist' | 'Pediatrician' | 'Therapist' | 'Coach' | 'Other';
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  bio: string;
  location: string;
  photoUrl: string;
  sessionFee: number; // consultation price (e.g. 499)
  availableSlots: string[]; // e.g. ["10:30 AM", "02:00 PM", "04:30 PM"]
  specialties: string[]; // ["Meal Design", "Allergy Friendly"]
  languages: string[]; // ["English", "Hindi"]
  commissionPercentage?: number; // bulk or individual commission percentage
  phone?: string;
  email?: string;
}

export interface Booking {
  id: string;
  itemId: string; // Event ID or Specialist ID
  itemTitle: string;
  type: 'EventTicket' | 'SpecialistAppointment';
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  amountPaid: number;
  commissionPercentage: number;
  commissionEarned: number;
  hostEarned: number;
  dateStr: string;
  timeSelected: string;
  razorpayPaymentId: string;
  status: 'Paid' | 'Refunded';
  // WooCommerce Affiliate Tracking & Attribution
  affiliateId?: string;
  affiliateName?: string;
  affiliateCode?: string;
  affiliateCommissionEarned?: number;
  affiliateCommissionRate?: number;
  // WooEvents E-Ticket & Pass Details
  ticketNumber?: string; // e.g. "VERN-EVT-9012-748"
  ticketTierName?: string;
  tierId?: string;
  childName?: string;
  childAge?: number;
  specialRequirements?: string;
  emergencyPhone?: string;
  eventVenue?: string;
  qrPayload?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  quantity?: number;
  createdAt?: string;
}

export interface MarketItem {
  id: string;
  title: string;
  price: number;
  description: string;
  sellerName: string;
  category: 'Toys & Lego' | 'Books & Comics' | 'Clothing & Gear' | 'Learning Kits' | 'Baby & Kids Food';
  imageUrl: string;
  contactEmail: string;
}
