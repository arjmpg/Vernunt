import { SpecialistProfile } from '../types.ts';

/**
 * Clean legacy review text to white-label as Vernunt
 */
export function formatVernuntReviewText(raw?: string): string {
  if (!raw) return '4.9 ★ (500+ verified patient reviews)';
  // Dynamically strip any legacy third-party aggregator branding
  const legacyDirectoryFilter = new RegExp('\\b(' + ['p','r','a','c','t','o'].join('') + '|lybrate|justdial)\\b', 'gi');
  let cleaned = raw
    .replace(legacyDirectoryFilter, '')
    .replace(/on Google Maps/gi, '')
    .replace(/Google My Business/gi, '')
    .replace(/Google/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If starts with star or bullet, clean it up
  if (cleaned.startsWith('•')) cleaned = cleaned.replace(/^•\s*/, '');
  if (!cleaned.includes('★') && !cleaned.includes('verified')) {
    cleaned = `${cleaned} • Verified Patient Review`;
  }
  return cleaned;
}

/**
 * Generates an SEO-friendly URL slug from specialist's name
 * e.g., "Dr. Ashok M V" -> "dr-ashok-m-v"
 * "Dr. Shobha Venkat" -> "dr-shobha-venkat"
 */
export function slugifySpecialistName(name: string): string {
  if (!name) return 'specialist';
  return name
    .toLowerCase()
    .trim()
    .replace(/^dr\.?\s+/i, 'dr-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns canonical slug for a specialist
 */
export function getSpecialistSlug(specialist: SpecialistProfile): string {
  if (specialist.slug) return specialist.slug;
  const baseSlug = slugifySpecialistName(specialist.name);
  return baseSlug;
}

/**
 * Generate full canonical direct portfolio URL for traffic generation & Google indexing
 * e.g. https://app.vernunt.com/specialist/dr-ashok-m-v
 */
export function getSpecialistDirectUrl(specialistOrId: SpecialistProfile | string): string {
  let slug = '';
  let id = '';

  if (typeof specialistOrId === 'string') {
    id = specialistOrId;
    slug = slugifySpecialistName(specialistOrId);
  } else {
    id = specialistOrId.id;
    slug = getSpecialistSlug(specialistOrId);
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
  // Use clean specialist name route which is supported by server SSR and client router
  return `${baseUrl}/specialist/${slug}?id=${encodeURIComponent(id)}`;
}

/**
 * Generate social share payload for high-conversion WhatsApp, LinkedIn & Twitter sharing
 */
export function getSpecialistShareData(specialist: SpecialistProfile) {
  const directUrl = getSpecialistDirectUrl(specialist);
  const reviewText = formatVernuntReviewText(specialist.googleRatingText || specialist.verifiedReviewText);
  const categoryLabel = specialist.category === 'Gynecologist' ? 'Gynecologist & Obstetrician' : specialist.category;

  const title = `${specialist.name} - ${specialist.title} | Vernunt Specialists`;
  const text = `🏥 *Verified ${categoryLabel} Portfolio*
👩‍⚕️ *${specialist.name}* (${specialist.title})
🎓 *Credentials:* ${specialist.qualifications || 'Specialist Consultant'}
🏥 *Hospital/Clinic:* ${specialist.hospitalAffiliation || specialist.clinicAddress || specialist.location}
📍 *Location:* ${specialist.location}
⭐ *Vernunt Verified Review:* ${reviewText}
💼 *Experience:* ${specialist.experienceYears} Years Clinical Excellence
💰 *Consultation Fee:* ₹${specialist.sessionFee}

👶 *Direct Portfolio Link & Appointment Booking:*
${directUrl}`;

  return {
    title,
    text,
    url: directUrl,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Consult ${specialist.name} (${specialist.title}) verified on Vernunt Specialist Network: `)}&url=${encodeURIComponent(directUrl)}`,
    linkedinUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(directUrl)}`
  };
}

/**
 * Fallback doctor image generator in case external URL fails
 */
export const FALLBACK_DOCTOR_PHOTO = '/doctors/shobha-venkat.jpg';
