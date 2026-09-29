export type UserPlatformRole = 'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional' | 'Influencer';

export interface RegistrationFieldItem {
  name: string;
  desc: string;
  icon: string;
  isMandatory: boolean;
}

export interface UserRoleMeta {
  role: UserPlatformRole;
  label: string;
  shortLabel: string;
  badge: string;
  icon: string;
  description: string;
  requiredFields: RegistrationFieldItem[];
}

export const USER_ROLES_CONFIG: Record<UserPlatformRole, UserRoleMeta> = {
  'Parent': {
    role: 'Parent',
    label: 'Parent & Kid Profile',
    shortLabel: 'Parent',
    badge: '1-Year Free Access',
    icon: '👪',
    description: 'Find verified neighborhood playmates, match kids by age and hobbies, book vetted sitters, and coordinate safe playdates.',
    requiredFields: [
      { name: 'Guardian Contact (Mobile / Email)', desc: '10-digit mobile number with OTP verification', icon: '📱', isMandatory: true },
      { name: 'Parent / Guardian Full Name', desc: 'Mother, father, or legal guardian name', icon: '👤', isMandatory: true },
      { name: 'Child Details (Name, Age & Gender)', desc: 'Age (0-17 yrs) and interests for peer matching', icon: '👶', isMandatory: true },
      { name: 'Playmate Interests & Preferred Activities', desc: 'Park play, Lego, sports, crafts, storytelling', icon: '🎨', isMandatory: true },
      { name: 'Neighborhood & Pincode', desc: 'Proximity radar location (strictly guardian protected)', icon: '📍', isMandatory: true },
      { name: 'Guardian Aadhaar ID Verification', desc: 'Secure zero-knowledge neighborhood trust badging', icon: '🛡️', isMandatory: true }
    ]
  },
  'Daycare Center': {
    role: 'Daycare Center',
    label: 'Daycare Center / Creche',
    shortLabel: 'Daycare Center',
    badge: '6 Months Free Listing',
    icon: '🏫',
    description: 'List commercial daycares, Montessori early learning centers, infant creches, or certified home playhomes with live CCTV slots.',
    requiredFields: [
      { name: 'Daycare / Creche Center Name', desc: 'Official registered entity name', icon: '🏢', isMandatory: true },
      { name: 'Director / In-charge Name & Phone', desc: 'Authorized administrator contact & OTP', icon: '👤', isMandatory: true },
      { name: 'Facility Address & Landmark', desc: 'Street address, city, and verified pincode', icon: '📍', isMandatory: true },
      { name: 'Operating Hours & Accepted Age Groups', desc: 'Full-day, half-day timings, and age limits', icon: '⏰', isMandatory: true },
      { name: 'Capacity & CCTV Parent Access', desc: 'Student capacity and live streaming security setup', icon: '📹', isMandatory: true },
      { name: 'Govt License / Identity Registration', desc: 'Facility registration certificate or director Aadhaar', icon: '📄', isMandatory: true }
    ]
  },
  'Event Organizer': {
    role: 'Event Organizer',
    label: 'Events, Activity & Classes Host',
    shortLabel: 'Event Host',
    badge: 'Zero Commission Ticketing',
    icon: '🎪',
    description: 'Publish weekend workshops, sports camps, arts and robotics classes, and validate entries with real-time QR scanners.',
    requiredFields: [
      { name: 'Organizer / Brand Name', desc: 'Official workshop or academy brand', icon: '🏷️', isMandatory: true },
      { name: 'Host Contact Details & Email OTP', desc: 'Verified mobile and operational email', icon: '📞', isMandatory: true },
      { name: 'Event Specialties & Domains', desc: 'STEM, arts, sports, drama, robotics, camps', icon: '🎯', isMandatory: true },
      { name: 'Activity Venue / Studio Address', desc: 'Address where sessions and camps are hosted', icon: '🗺️', isMandatory: true },
      { name: 'Pass Pricing & Check-In Station', desc: 'Ticket tiers, pass limits, and check-in config', icon: '🎟️', isMandatory: true },
      { name: 'Host Identity / Business Document', desc: 'Aadhaar ID or business verification certificate', icon: '🛡️', isMandatory: true }
    ]
  },
  'Portfolio Professional': {
    role: 'Portfolio Professional',
    label: 'Kids Specialist, Doctor & Pediatrician',
    shortLabel: 'Kids Specialist',
    badge: 'Verified Specialist Profile',
    icon: '🩺',
    description: 'Offer pediatric consultations, child therapy, nutrition guidance, and developmental coaching to local neighborhood families.',
    requiredFields: [
      { name: 'Specialist Full Name (Dr. / Consultant)', desc: 'Official doctor or healthcare professional name', icon: '👨‍⚕️', isMandatory: true },
      { name: 'Specialization Category', desc: 'Pediatrician, Speech Therapist, Psychologist, etc.', icon: '🩺', isMandatory: true },
      { name: 'Medical / Council Registration No.', desc: 'State medical council or board license number', icon: '📜', isMandatory: true },
      { name: 'Clinic / Hospital Consultation Address', desc: 'Physical clinic, chamber, or hospital location', icon: '🏥', isMandatory: true },
      { name: 'Professional Contact & Email OTP', desc: 'Direct doctor mobile number and email', icon: '📱', isMandatory: true },
      { name: 'Medical Degree / License Upload', desc: 'Mandatory clinical certificate verification', icon: '📑', isMandatory: true }
    ]
  },
  'Influencer': {
    role: 'Influencer',
    label: 'Community Creator & Influencer Ambassador',
    shortLabel: 'Creator Ambassador',
    badge: '1,000 Free Tickets VIP Pass',
    icon: '⭐',
    description: 'Parenting vloggers, family creators, and local ambassadors with VIP spotlight, priority radar placement, and zero platform commissions.',
    requiredFields: [
      { name: 'Creator Full Name & Display Name', desc: 'Personal and brand handle identity', icon: '✨', isMandatory: true },
      { name: 'Social Profile URL & Handle', desc: 'Instagram, YouTube, or family blog handle', icon: '📱', isMandatory: true },
      { name: 'Audience Reach & Follower Tier', desc: '10K+, 50K+, 100K+ reach bracket', icon: '📊', isMandatory: true },
      { name: 'Primary Family & Parenting Topics', desc: 'Play ideas, kid activities, education, nutrition', icon: '🎬', isMandatory: true },
      { name: 'Creator Mobile & Email Verification', desc: 'OTP-verified creator channels', icon: '📲', isMandatory: true },
      { name: 'Profile Avatar Photo & Bio', desc: 'Featured badge on community spotlight deck', icon: '🖼️', isMandatory: true }
    ]
  }
};
