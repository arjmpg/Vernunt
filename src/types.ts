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
  ticketPrice?: number; // Price in INR (e.g. 299). 0 or undefined means FREE
  commissionPercentage?: number; // Custom admin override percentage (default e.g. 10%)
  lat?: number;
  lng?: number;
  iconEmoji?: string;
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
  amountPaid: number;
  commissionPercentage: number;
  commissionEarned: number;
  hostEarned: number;
  dateStr: string;
  timeSelected: string;
  razorpayPaymentId: string;
  status: 'Paid' | 'Refunded';
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
