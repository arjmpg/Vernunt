/**
 * ============================================================================
 * VERNUNT NANNY & BABYSITTING SERVICES DATA MODELS & TYPES
 * ============================================================================
 */

export type NannyLivePreference = 'live-in' | 'live-out' | 'flexible';
export type NannyWorkType = 'full-time' | 'part-time' | 'on-demand' | 'all';
export type NannyVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface NannyServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  icon: string;
  isActive: boolean;
  order: number;
  tags?: string[];
  suggestedRates?: {
    hourlyMin?: number;
    hourlyMax?: number;
    monthlyMin?: number;
    monthlyMax?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface NannyCertification {
  id: string;
  title: string; // e.g., "Pediatric First Aid & CPR", "Montessori Infant Diploma"
  issuingBody: string; // e.g., "Indian Red Cross Society", "St. John Ambulance"
  issueYear: number;
  expiryDate?: string;
  docUrl?: string; // Stored securely - admin only!
  docName?: string;
  verified: boolean;
}

export interface NannyReference {
  id: string;
  familyOrEmployer: string; // e.g. "The Mehra Family, Indiranagar"
  relationship: string; // e.g., "Full-time Nanny for 2 Toddlers (2023-2025)"
  contactPhone?: string; // Masked / admin only
  contactEmail?: string; // Masked / admin only
  feedbackQuote?: string;
  rating?: number;
  isVerified: boolean;
}

export interface NannyReview {
  id: string;
  bookingId?: string;
  parentId: string;
  parentName: string;
  parentPhotoUrl?: string;
  rating: number; // 1-5
  comment: string;
  serviceCategoryName: string;
  createdAt: string;
  isVerifiedBooking: boolean;
}

export interface NannyProfile {
  id: string;
  userId?: string; // Linked account UID (if independent nanny or user profile)
  agencyId?: string; // Linked agency ID if managed by agency; null/undefined if independent
  agencyName?: string;
  agencyLogo?: string;
  isIndependent: boolean;

  // Basic Information
  fullName: string;
  photoUrl: string;
  galleryPhotos?: string[];
  bio: string;
  gender?: 'Female' | 'Male' | 'Other';
  age?: number;
  yearsOfExperience: number;
  previousExperienceSummary?: string;

  // Services & Categories
  serviceCategoryIds: string[]; // List of category IDs/slugs offered
  serviceCategoryNames?: string[];
  preferredAgeGroups: string[]; // e.g. ["Newborn (0-6m)", "Infant (6-18m)", "Toddler (18m-3y)", "Preschool (3-6y)", "School Age (6y+)"]

  // Skills & Daily Routine Capabilities
  skills: string[]; // ["Bathing & Hygiene", "Feeding & Purees", "Diaper Changing", "Sleep & Nap Training", "Milestone Activities", "Outdoor Stroller Walks", "Infant CPR", "Potty Training", "Toddler Meal Prep", "Homework Assistance"]
  languages: string[]; // ["English", "Hindi", "Kannada", "Tamil", "Marathi", etc.]
  educationLevel?: string; // e.g., "High School", "Childcare Diploma", "B.A. Child Psychology", "Nursing Certificate"
  
  // Work Preferences & Schedule
  livePreference: NannyLivePreference; // 'live-in' | 'live-out' | 'flexible'
  workType: NannyWorkType; // 'full-time' | 'part-time' | 'on-demand' | 'all'
  maxChildrenSimultaneously: number; // e.g. 1, 2, 3
  preferredHours?: string; // e.g. "8:00 AM - 6:00 PM"
  availableDays?: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  availableSlots?: string[]; // ["Morning (8 AM - 12 PM)", "Afternoon (12 PM - 5 PM)", "Evening (5 PM - 9 PM)", "Night Stay"]

  // Location & Service Area
  primaryCity: string; // e.g. "Bangalore", "Mumbai", "Delhi NCR"
  serviceAreas: string[]; // e.g. ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield"]
  approxTravelRadiusKm: number; // e.g. 10
  locationCoordinates?: {
    lat: number;
    lng: number;
  };

  // Pricing Structure (INR)
  rates: {
    hourlyRate?: number;
    dailyRate?: number; // 8-hour day
    monthlyRate?: number; // Full-time monthly
    perBookingRate?: number;
    nightCareRate?: number; // Over-night rate
  };

  // Certifications & Experience Proofs
  certifications: NannyCertification[];
  hasFirstAidCpr: boolean;
  references: NannyReference[];

  // Verification Badges (Distinct & Truthful)
  identityVerificationStatus: NannyVerificationStatus; // Govt ID / Aadhaar verification
  backgroundVerificationStatus: NannyVerificationStatus; // Police verification / criminal record check
  qualificationsVerificationStatus: NannyVerificationStatus; // Certs and training documents verified
  agencyVerifiedStatus: NannyVerificationStatus; // Agency attested verification
  overallStatus: 'draft' | 'pending_approval' | 'published' | 'paused' | 'rejected' | 'suspended';
  rejectionReason?: string;
  adminNotes?: string;

  // Private Verification Documents (ADMIN ONLY - NEVER EXPOSED TO PARENTS)
  privateDocuments?: {
    aadhaarNumberMasked?: string;
    aadhaarDocUrl?: string;
    policeClearanceDocUrl?: string;
    addressProofDocUrl?: string;
    medicalFitnessDocUrl?: string;
  };
  privateContactPhone?: string; // Only shared after confirmed & accepted booking
  privateContactEmail?: string;

  // Ratings & Performance
  rating: number; // e.g. 4.9
  reviewsCount: number;
  completedBookingsCount: number;
  reviews?: NannyReview[];

  // SLA & Regulatory acceptance
  slaAccepted?: boolean;
  slaAcceptedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface NannyAgencyProfile {
  id: string;
  userId: string; // Agency owner account ID
  agencyName: string;
  brandSlug: string;
  logoUrl: string;
  coverPhotoUrl?: string;
  description: string;
  establishedYear?: number;
  
  // Office location & Service Area
  officeAddress: string;
  city: string;
  serviceAreas: string[];
  websiteUrl?: string;

  // Contact Info
  authorizedRepName: string;
  authorizedRepDesignation: string;
  officialEmail: string;
  officialPhone: string;

  // Business Documents (Admin Only)
  registrationNumber?: string; // GSTIN / ROC / Shops & Establishments
  registrationDocUrl?: string;
  repAadhaarDocUrl?: string;

  // Verification & Status
  verificationStatus: NannyVerificationStatus;
  rejectionReason?: string;
  adminNotes?: string;
  isPublished: boolean;

  // Stats
  totalNanniesCount?: number;
  activeNanniesCount?: number;
  completedBookingsCount?: number;
  rating?: number;
  reviewsCount?: number;

  termsAccepted: boolean;
  termsAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type NannyBookingStatus = 
  | 'Pending Acceptance'
  | 'Accepted'
  | 'Rejected'
  | 'Awaiting Payment'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancellation Requested'
  | 'Cancelled'
  | 'Refunded';

export interface NannyBookingRecord {
  id: string;
  bookingReference: string; // e.g. "NANNY-2026-X89B"
  
  // Nanny & Agency
  nannyId: string;
  nannyName: string;
  nannyPhotoUrl: string;
  agencyId?: string;
  agencyName?: string;
  isAgencyManaged: boolean;

  // Parent & Child
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  childName?: string;
  childAge: number;
  numberOfChildren: number;

  // Service Details
  serviceCategoryId: string;
  serviceCategoryName: string;
  isRecurring: boolean;
  recurringDays?: string[];
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "05:00 PM"
  durationHours: number;
  serviceLocationAddress: string;
  serviceLocationLandmark?: string;
  specialInstructions?: string;
  preferredLanguage?: string;
  parentContactPreference?: 'Phone Call' | 'In-App Chat' | 'WhatsApp';

  // Financial Breakdown (INR)
  pricingRateType: 'hourly' | 'daily' | 'monthly' | 'custom';
  appliedRate: number;
  serviceSubtotal: number;
  platformFee: number;
  taxesGst: number;
  discountAmount?: number;
  totalPayable: number;
  
  // Payment
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentSessionId?: string;
  paymentTransactionId?: string;
  paymentMethod?: string;
  paidAt?: string;

  // Workflow & Status
  status: NannyBookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: 'parent' | 'nanny' | 'agency' | 'admin';
  cancelledAt?: string;
  
  timeline: {
    status: NannyBookingStatus;
    timestamp: string;
    note?: string;
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface NannyEnquiryRecord {
  id: string;
  parentId: string;
  parentName: string;
  parentPhotoUrl?: string;
  parentPhone?: string;
  nannyId: string;
  nannyName: string;
  nannyPhotoUrl?: string;
  agencyId?: string;
  agencyName?: string;
  
  requestedService: string;
  childAge?: number;
  preferredSchedule?: string;
  message: string;
  
  status: 'Open' | 'Replied' | 'Converted to Booking' | 'Archived';
  replies?: {
    id: string;
    senderId: string;
    senderRole: 'parent' | 'nanny' | 'agency';
    senderName: string;
    message: string;
    timestamp: string;
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface NannyShortlistRecord {
  id: string;
  parentId: string;
  nannyId: string;
  createdAt: string;
}
