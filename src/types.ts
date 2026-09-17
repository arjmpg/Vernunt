export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum LocationSharing {
  PRECISE = 'PRECISE',
  APPROXIMATE = 'APPROXIMATE',
  HIDDEN = 'HIDDEN'
}

export type UserRole = 'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional' | 'Influencer' | 'Admin' | 'eventbuyers' | 'EventBuyer';

export type DevelopmentStage = 
  | 'Newborn (0-3 months)'
  | 'Infant (4-11 months)'
  | 'Toddler (1-2 years)'
  | 'Early Preschooler (3-4 years)'
  | 'School-Age (5-8 years)';

export interface ChildProfile {
  id: string;
  parentName: string;
  childName: string;
  childAge: number;
  childGender: 'Boy' | 'Girl' | 'Other';
  birthDate?: string; // YYYY-MM-DD format
  developmentStage?: DevelopmentStage;
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
  parentsIncome?: string; // Hidden in frontend - used strictly for intelligent matching
  caste?: string;
  religion?: string;
  generalAvailability?: string[]; // e.g. ['Weekdays After School', 'Weekends']
  childPrivacySetting?: 'full' | 'first_name_only' | 'connections_only'; // Child info privacy control
  parentProfession?: string;
  parentGender?: 'Mother' | 'Father' | 'Other';
  profileVisibilityAudience?: 'moms_only' | 'dads_only' | 'both_moms_and_dads';
  pregnancyDueDate?: string;
  pregnancyCurrentWeek?: number;
  isExpectingOrPregnant?: boolean;
  biometricCredentialId?: string;
  biometricEnabled?: boolean;
  motherTongue?: string;
  languagesKnown?: string[];
  phoneNumber?: string;
  phone?: string;
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
  aadhaarDocUrl?: string; // Uploaded Aadhaar card document URL / base64 proof
  aadhaarDocName?: string; // Uploaded Aadhaar card document filename
  aadhaarDocSize?: number; // File size in bytes (max 3MB)
  
  // Official DigiLocker (Government of India) e-Aadhaar verification
  digilockerVerified?: boolean;
  digilockerDocUri?: string; // e.g. "in.gov.uidai-adhr-XXXX1234"
  digilockerTxnId?: string; // DigiLocker Transaction Reference
  digilockerVerifiedAt?: string; // Timestamp of DigiLocker UIDAI verification
  digilockerIssuedName?: string; // Full name as per UIDAI DigiLocker
  digilockerMaskedAadhaar?: string; // e.g. "XXXX-XXXX-8924"
  digilockerUidaiTimestamp?: string;
  digilockerAddress?: string; // Verified residential address from DigiLocker repository
  digilockerPincode?: string;
  digilockerGender?: string;
  digilockerDob?: string;
  verificationMethod?: 'digilocker' | 'manual_upload' | 'admin_verified';
  userRole?: UserRole;
  
  // Influencer & Community Ambassador specific fields
  instagramHandle?: string; // e.g. "@bangalore_mommy_diaries"
  instagramUrl?: string; // e.g. "https://instagram.com/bangalore_mommy_diaries"
  influencerFollowers?: string; // e.g. "24.5K"
  influencerBio?: string;
  isInfluencerSpotlight?: boolean;
  freeTicketsQuota?: number; // Quota for 0% commission event ticketing (up to 1,000 tickets)
  freeTicketsUsed?: number;
  assignedCouponCodes?: string[]; // Coupon codes created for or managed by this influencer
  usedCouponCode?: string; // Coupon code applied by user to activate free pass
  
  // Address & Community parameters (Indian standard KYC)
  currentAddress?: string;
  permanentAddress?: string;
  isSameAddress?: boolean;
  apartmentCommunityName?: string;
  addressProofDocName?: string;
  addressProofDocUrl?: string;
  addressProofDocType?: 'Aadhaar Card' | 'Voter ID' | 'Indian Passport' | 'Electricity Bill' | 'Rental Agreement' | 'Gas Bill' | 'Driving License';
  addressProofDocSize?: number;
  kycSubmitted?: boolean;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycRejectionReason?: string;
  
  // Babysitting & Daycare hosting fields for parents
  offersBabysitting?: boolean;
  hourlyBabysittingRate?: number;
  hourlyRateNeighborHome?: number; // Rate at Neighbour / Sitter's premises (e.g. Rs.180/hr)
  hourlyRateParentHome?: number; // Rate at Parent's premises (e.g. Rs.260/hr)
  halfDayBabysittingRate?: number;
  fullDayBabysittingRate?: number;
  babysittingCapacity?: number;
  babysittingType?: CareProviderType;
  babysittingBio?: string;
  babysittingAmenities?: string[];
  babysittingPhotos?: string[];
  daycareProfileId?: string;
  
  // Security & Admin-Only Telemetry (Hidden from public users, visible ONLY to Administrators)
  ipAddress?: string; // Client IP address captured during login/registration
  capturedLat?: number; // Exact GPS / network latitude
  capturedLng?: number; // Exact GPS / network longitude
  capturedLocationInfo?: string; // Capture method / accuracy description
  capturedAt?: string; // Timestamp of IP & location capture
  createdAt?: string; // ISO 8601 registration / creation timestamp
  registeredAt?: string; // Alias timestamp for user onboarding date

  criminalRecordChecked?: boolean;
  positiveReviewsCount?: number;
  attendedEventsCount?: number;
  checkedInEvents?: string[];
  availableDays?: string[];
  availableTimes?: string[];
  
  // Custom Class & Activity / Portfolio Specialists Parameters
  hostingEntityType?: 'Individual' | 'Company' | 'center' | 'individual';
  specialistEntityType?: 'Individual' | 'Company' | 'center' | 'individual';
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
  idDocUrl?: string;
  companyDocName?: string;
  companyDocUrl?: string;
  
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
  stepAPhotoSource?: 'selfie' | 'gallery';
  facialAuditRequired?: boolean;
  faceVerificationStatus?: 'none' | 'verified' | 'failed' | 'pending_admin' | 'approved' | 'rejected';
  faceVerificationScore?: number;
  faceVerificationTimestamp?: string;

  // Real-time Availability & Dynamic Presence indicators
  activityStatus?: 'Currently Active' | 'Away' | 'Available for Play';
  lookingForImmediatePlaydate?: boolean;
  lastActiveAt?: string;
  savedProfileIds?: string[];
  preferredActivities?: string[];

  // Babysitting & Daycare Additional Care Options
  babysittingSlots?: string[];
  careProviderType?: CareProviderType;

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
  source?: 'sim' | 'gmail' | 'phone' | 'icloud' | 'whatsapp' | 'manual';
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
  silentSyncEnabled?: boolean; // Silent background synchronization
  blockedNumbers?: string[]; // Manually shielded/blocked numbers
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

export interface AdminCouponCode {
  id: string;
  code: string; // e.g. "INFLUENCER365", "VIPMOM", "VERNUNT1YEAR"
  title: string; // e.g. "1-Year Free VIP Parent Pass"
  benefitType: 'free_1_year_vip' | 'free_pass' | 'percentage' | 'flat';
  durationDays: number; // e.g. 365 days
  discountValue?: number;
  isActive: boolean;
  maxRedemptions?: number; // e.g. 500
  timesRedeemed: number;
  redeemedByUsers?: {
    userId: string;
    userName: string;
    userEmail?: string;
    redeemedAt: string;
  }[];
  validUntil?: string; // ISO date
  creatorRole?: string;
  assignedInfluencerName?: string; // e.g. "Priya Sharma (@bangalore_mommy)"
  notes?: string;
  createdAt: string;
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
  freeTicketsQuota?: number; // Admin-configured number of free tickets (0% platform commission)
  freeTicketsIssued?: number; // Count of free tickets issued/claimed so far
  isInfluencerHost?: boolean; // Whether hosted by verified influencer ambassador
  hostRole?: 'influencer' | 'parent' | 'daycare' | 'specialist' | string;
  customCommissionRate?: number; // Granular admin commission rate override (e.g. 2.5%)
  lat?: number;
  lng?: number;
  iconEmoji?: string;
  // Multi-day & Category Extensions
  startDate?: string;
  endDate?: string;
  itemCategoryType?: 'activity' | 'event' | 'classes';
  deliveryMode?: 'virtual' | 'physical';
  googleChatLink?: string;
  virtualPlatform?: string;
  virtualMeetingDetails?: string;
  subjectSkill?: string;
  batchSchedule?: string;
  batchSize?: number;
  prerequisites?: string;
  activityTheme?: string;
  suppliesProvided?: string;
  thingsToBring?: string;
  eventGenre?: string;
  chiefGuest?: string;
  dressCode?: string;
  refreshmentsIncluded?: string;
  isMock?: boolean;
  // Vernunt Events Advanced Parameters
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
  eventType?: 'event' | 'class' | 'activity' | 'workshop' | 'competition' | 'carnival' | string;
  slug?: string;
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
  category: 'Nutritionist' | 'Tutor' | 'Makeup Artist' | 'Pediatrician' | 'Therapist' | 'Coach' | 'Gynecologist' | 'Other' | string;
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
  qualifications?: string;
  hospitalAffiliation?: string;
  clinicAddress?: string;
  googleRatingText?: string;
  verifiedReviewText?: string;
  slug?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  claimed?: boolean;
  claimedByEmail?: string;
  claimedByPhone?: string;
  claimedAt?: string;
  claimStatus?: 'unclaimed' | 'pending' | 'approved' | 'rejected';
  claimRegistrationNumber?: string;
  claimIdDocUrl?: string;
}

export interface SpecialistClaimRequest {
  id: string;
  specialistId: string;
  specialistName: string;
  specialistCategory: string;
  specialistHospital?: string;
  specialistLocation: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  registrationNumber: string;
  idCardDocName: string;
  idCardDocUrl: string;
  idCardDocSize?: number;
  declarationAccepted: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
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
  // Vernunt Events E-Ticket & Pass Details
  ticketNumber?: string; // e.g. "VERN-EVT-9012-748"
  ticketTierName?: string;
  tierName?: string;
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

export type CareProviderType = 'Neighbour Parent' | 'Home Care Center' | 'Babysitter & Nanny' | 'Certified Playhome' | 'Home Daycare' | 'Montessori Daycare' | 'Pre-school & Daycare' | 'Infant Creche' | 'Experienced Sitter' | 'Independent Caregiver';

export interface DaycarePlayhomeProfile {
  id: string;
  userId?: string;
  title: string; // e.g. "Mrs. Sharma's Warm Playhome & Daycare" or "Bright Horizons Montessori Daycare"
  hostName: string; // Parent, Individual Caregiver or Director Name
  providerType: CareProviderType;
  providerEntityType?: 'Individual' | 'Company'; // Individual Home Provider vs Commercial Facility
  careServiceModes?: ('host_at_my_home' | 'visit_parents_home')[]; // Whether provider hosts at home, visits parent's home, or both
  hourlyRate: number; // In INR (e.g. 150, 300, 0 for free reciprocal exchange)
  hourlyRateNeighborHome?: number; // Rate at Provider's Home / Center premises (₹/hr)
  hourlyRateParentHome?: number; // Rate to visit Parent's premises / In-home care (₹/hr)
  visitingRadiusKm?: number; // Distance radius provider is willing to travel to visit parent's house (e.g. 5km)
  halfDayRate?: number; // In INR (e.g. 500)
  fullDayRate?: number; // In INR (e.g. 900)
  monthlyDaycareFee?: number; // In INR (e.g. 8500)
  bio: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    distance?: number; // Proximity from active parent
  };
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  maxCapacity: number;
  currentOccupancy: number;
  acceptedAgeGroups: string[]; // e.g. ["6m - 2 yrs", "2 - 5 yrs", "5 - 10 yrs"]
  availableDays: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  availableTimeSlots: string[]; // e.g. ["09:00 AM - 01:00 PM", "02:00 PM - 06:00 PM", "06:00 PM - 09:00 PM", "Full Day (9 AM - 6 PM)"]
  amenities: string[]; // e.g. ["CCTV Monitored", "AC & Childproofed", "Organic Snacks/Milk", "Baby Cribs/Cots", "Montessori Toys", "First Aid Certified", "Pet Free", "Soft Play Area"]
  photos: string[];
  avatarUrl: string;
  phone?: string;
  email?: string;
  aadhaarVerified: boolean;
  digilockerVerified?: boolean;
  digilockerDocUri?: string;
  digilockerTxnId?: string;
  digilockerVerifiedAt?: string;
  policeVerified?: boolean;
  isAcceptingNow: boolean;
  instantBooking: boolean;
  parentKidNames?: string; // If neighbour parent, e.g. "Mom of Aarav (4y)"
  emergencyContact?: string;
  
  // Daycare Center & Pre-school specific verification and operational specifications
  licenseNumber?: string; // Govt Registration / Municipal / Trust License No
  licenseDocName?: string; // Document filename
  licenseDocUrl?: string; // Uploaded License document base64/URL
  policeDocName?: string;
  policeDocUrl?: string;
  establishedYear?: number; // e.g. 2018
  directorName?: string;
  staffToChildRatio?: string; // e.g. "1:4"
  cctvAccessAvailable?: boolean;
  indoorSqft?: number;
  outdoorPlayArea?: boolean;
  medicalTieUp?: string; // e.g. "Cloudnine Pediatric Hospital (500m)"
  mealOptions?: string[]; // e.g. ["Organic Purees", "Vegetarian Home-Cooked", "Snacks & Milk"]
  
  reviews?: {
    id: string;
    parentName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export type CareBookingStatus = 'Pending' | 'Accepted' | 'Declined' | 'Dropped Off' | 'In Care' | 'Ready for Pickup' | 'Completed' | 'Cancelled';

export interface CareBookingRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentPhotoUrl?: string;
  childName: string;
  childAge: number;
  childGender?: string;
  providerId: string;
  providerName: string;
  providerTitle: string;
  providerType: CareProviderType;
  providerHourlyRate: number;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalAmount: number;
  serviceMode?: 'host_at_my_home' | 'visit_parents_home'; // Whether care takes place at provider's home/center or parent's home
  serviceLocationAddress?: string;
  status: CareBookingStatus;
  dropOffPin: string; // 4-digit security PIN for drop-off handshake
  pickupPin: string; // 4-digit security PIN for pickup handshake
  specialInstructions?: string; // e.g. "Allergic to peanuts, nap at 2 PM, bottle feeding formula packed"
  emergencyContact: string;
  dropOffTime?: string;
  pickupTime?: string;
  createdAt: string;
  updatedAt?: string;
  senderRole: 'parent' | 'provider';
  careActivityLog?: {
    timestamp: string;
    activity: string; // "Snack Time", "Story Reading", "Nap Time", "Lego Play"
    note?: string;
  }[];
}

export interface EventTicketPurchase {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType?: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketTierName?: string;
  ticketQuantity: number;
  ticketPrice: number;
  totalPaid: number;
  purchasedAt: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerRole?: 'eventbuyers' | 'EventBuyer' | 'Parent' | string;
  status: 'confirmed' | 'cancelled' | 'attended';
  qrPassCode: string;
  bookingReference: string;
}

export interface KidStory {
  id: string;
  kidName: string;
  kidAge: number;
  kidCity: string;
  title: string; // Catchy headline like YourStory
  summary: string; // Short lead synopsis (max 280 chars)
  content: string; // Rich editorial text & paragraphs
  achievements: string[]; // List of accolades, awards, milestones
  instagramUrl?: string; // e.g. https://instagram.com/kid_handle
  photoUrl: string; // Child portrait/achievement photo (max 1 MB limit enforced)
  category: 'Young Innovators' | 'Arts & Culture' | 'Sports' | 'Academics' | 'Music & Dance' | 'Coding & Tech' | 'Social Impact' | 'Chess & Mind Sports' | 'Other' | string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  submittedAt: string;
  approvedAt?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  slug: string; // e.g. "aarav-sharma-national-chess-prodigy-bangalore"
  viewsCount?: number;
  likesCount?: number;
  featured?: boolean;
  instagramFollowers?: number | string; // Extracted follower count e.g. "14.8K" or 14800
  kidRadarId?: string; // Reference to connect in Search Radar
  chapterNumber?: number; // Story chapter for the same child
  googleWebStoryUrl?: string; // Canonical Google AMP Web Story URL (e.g. "https://app.vernunt.com/web-stories/aarav-sharma-speedcubing-champion-bangalore")
  googleIndexedAt?: string; // Timestamp when story was dispatched to Googlebot & IndexNow
  googleIndexingStatus?: 'indexed' | 'queued' | 'verified';
}

// Vernunt Groups (Peanut style mom & parent communities)
export type GroupPrivacyTier = 'Public' | 'Private' | 'Invite-Only';
export type GroupGenderRestriction = 'Female Only' | 'Male Only' | 'Both';

export interface GroupEditor {
  id?: string;
  emailOrPhone: string;
  addedAt: string;
  addedBy: string;
}

export interface GroupPinnedAnnouncement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface GroupJoinRequest {
  userId: string;
  userName: string;
  userPhone?: string;
  userPhoto?: string;
  requestedAt: string;
  note?: string;
}

export interface VernuntGroup {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  avatarEmoji: string;
  privacyTier: GroupPrivacyTier;
  genderRestriction: GroupGenderRestriction;
  creatorId: string;
  creatorName: string;
  creatorRole: string;
  creatorGender?: 'Mother' | 'Father' | 'Other';
  createdAt: string;
  rules: string[];
  pinnedAnnouncements: GroupPinnedAnnouncement[];
  editors: GroupEditor[];
  memberIds: string[];
  membersCount: number;
  pendingJoinRequests: GroupJoinRequest[];
  category: string;
  tags?: string[];
  inviteSlug: string;
}

export interface VernuntGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderGender?: string;
  isAnonymous?: boolean;
  content: string;
  attachments?: string[];
  likesCount: number;
  likedBy?: string[];
  repliesCount?: number;
  createdAt: string;
}

// In-App Micro-Blogging: Vernunt Pages & Feed
export interface VernuntPagePost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorGender?: 'Mother' | 'Father' | 'Other';
  isAnonymous: boolean;
  anonymousAlias?: string; // e.g. "Anonymous Mom of 2"
  title: string;
  content: string;
  topic: string; // e.g. "Birth Stories", "Postpartum & Mental Health", "Parenting Hacks", "TTC & Fertility", "PCOS & Women's Health", "Menopause", "Toddler Tantrums", "Marriage Struggles"
  photos?: string[];
  tags?: string[];
  likesCount: number;
  likedBy?: string[];
  commentsCount: number;
  createdAt: string;
  comments?: {
    id: string;
    authorName: string;
    authorPhoto?: string;
    isAnonymous?: boolean;
    content: string;
    createdAt: string;
  }[];
}

// Vernunt Pods (Live Audio Broadcasting)
export interface VernuntAudioPod {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  category: string;
  isLive: boolean;
  listenersCount: number;
  speakers: {
    id: string;
    name: string;
    avatarUrl?: string;
    isSpeaking?: boolean;
    isMuted?: boolean;
  }[];
  raisedHands?: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  scheduledFor?: string;
}

// Writer & Mother Pitch Submission Portal
export interface WriterPitchSubmission {
  id: string;
  authorName: string;
  email: string;
  phone: string;
  coreTheme: string;
  title: string;
  pitchSynopsis: string;
  fullArticleDraft?: string;
  authorBio: string;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Published';
  submittedAt: string;
}

// Parents Created Meetups (Community Hosting)
export interface CommunityHostMeetup {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  deliveryMode: 'physical' | 'virtual';
  googleMeetLink?: string;
  venueAddress: string;
  date: string;
  time: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  hostGender?: 'Mother' | 'Father' | 'Other';
  maxCapacity: number;
  feeType: 'free' | 'contribution';
  contributionFee?: number;
  rsvpGoing: string[];
  rsvpMaybe: string[];
  rsvpWaitlist: string[];
  accessRestriction: 'open' | 'restricted_community' | 'restricted_school';
  restrictedAudienceName?: string;
  accessPasscode?: string;
  comments?: {
    id: string;
    userName: string;
    userPhoto?: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

// Baby Vaccine Tracker
export interface BabyVaccine {
  id: string;
  name: string;
  recommendedAge: string;
  dueAgeWeeks: number;
  protectsAgainst: string;
  mandatory: boolean;
  status: 'received' | 'upcoming' | 'pending';
  receivedDate?: string;
  clinicAdministered?: string;
  reminderEnabled?: boolean;
  reminderDate?: string;
  notes?: string;
}

// Baby Growth & Milestone
export type MilestoneCategory = 'Motor' | 'Cognitive' | 'Speech' | 'Social' | 'Self-Care' | 'Teething';

export type MilestoneStatus = 'achieved' | 'emerging' | 'upcoming';

export interface BabyMilestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description?: string;
  expectedAgeMonths: number;
  achieved: boolean;
  status?: MilestoneStatus;
  achievedDate?: string;
  notes?: string;
  redFlags?: string;
  parentTips?: string;
}


