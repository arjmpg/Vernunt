import { CommunityEvent } from '../types.ts';

/**
 * Slugifies a title or name into a clean, SEO-friendly string
 * e.g. "Cubbon Park Weekend Family Art & Nature Sketching" -> "cubbon-park-weekend-family-art-nature-sketching"
 */
export function slugifyEventTitle(title: string): string {
  if (!title) return 'event';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes event type for SEO URL segment
 * Categories: Event, Activity, Class, Workshop, Carnival, Competition
 */
export function normalizeEventType(category?: string, itemCategoryType?: string): string {
  if (itemCategoryType) {
    if (itemCategoryType === 'classes') return 'class';
    return itemCategoryType.toLowerCase();
  }
  const raw = (category || 'event').toLowerCase().trim();
  if (raw.includes('class') || raw.includes('workshop')) return 'class';
  if (raw.includes('activity') || raw.includes('sports') || raw.includes('drill')) return 'activity';
  if (raw.includes('carnival') || raw.includes('fair') || raw.includes('festival')) return 'carnival';
  if (raw.includes('competition') || raw.includes('tournament') || raw.includes('olympiad')) return 'competition';
  return 'event';
}

/**
 * Generates canonical path for Google SEO indexing
 * e.g. /events/activity/hsr-layout-junior-football-agility-drills
 */
export function getEventCanonicalPath(event: CommunityEvent): string {
  const type = normalizeEventType(event.category, event.itemCategoryType);
  const slug = slugifyEventTitle(event.title);
  return `/events/${type}/${slug}`;
}

/**
 * Generates full canonical URL for Google SEO indexing
 * e.g. https://app.vernunt.com/events/activity/hsr-layout-junior-football-agility-drills
 */
export function getEventDirectUrl(event: CommunityEvent, baseUrl: string = 'https://app.vernunt.com'): string {
  const path = getEventCanonicalPath(event);
  return `${baseUrl}${path}`;
}

/**
 * Generates Schema.org JSON-LD structured data for Google Rich Results
 */
export function generateEventJsonLd(event: CommunityEvent, baseUrl: string = 'https://app.vernunt.com') {
  const type = normalizeEventType(event.category, event.itemCategoryType);
  const canonicalUrl = getEventDirectUrl(event, baseUrl);

  let schemaType = 'Event';
  if (type === 'class') schemaType = 'Course';
  else if (type === 'activity') schemaType = 'SportsEvent';
  else if (type === 'carnival') schemaType = 'Festival';

  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: event.title,
    description: event.description,
    startDate: event.date ? `${event.date}T${event.time ? event.time.replace(/\s*[AP]M/i, ':00') : '09:00:00'}` : undefined,
    image: event.photoUrl ? [event.photoUrl] : undefined,
    url: canonicalUrl,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.deliveryMode === 'virtual' 
      ? 'https://schema.org/OnlineEventAttendanceMode' 
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.deliveryMode === 'virtual'
      ? {
          '@type': 'VirtualLocation',
          url: event.virtualMeetingDetails || event.googleChatLink || canonicalUrl
        }
      : {
          '@type': 'Place',
          name: event.location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Bangalore',
            addressRegion: 'Karnataka',
            addressCountry: 'IN'
          },
          geo: event.lat && event.lng ? {
            '@type': 'GeoCoordinates',
            latitude: event.lat,
            longitude: event.lng
          } : undefined
        },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price: event.ticketPrice ?? 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0]
    },
    organizer: {
      '@type': 'Person',
      name: event.hostName || 'Vernunt Community Host',
      url: 'https://app.vernunt.com'
    }
  };
}
