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
 */
export function getEventDirectUrl(event: CommunityEvent, baseUrl: string = 'https://app.vernunt.com'): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const path = getEventCanonicalPath(event);
  return `${cleanBase}${path}`;
}

/**
 * Generates direct checkout deep-link URL to Vernunt Event Booking checkout
 */
export function getEventDirectCheckoutUrl(
  event: CommunityEvent,
  baseUrl: string = 'https://app.vernunt.com',
  tierId?: string
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    tab: 'events',
    eventId: event.id,
    checkout: 'true'
  });
  if (tierId) params.set('tier', tierId);
  return `${cleanBase}/?${params.toString()}`;
}

/**
 * Parses human-readable event date & time strings into strict ISO-8601 IST (+05:30) startDate & endDate
 * per https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function resolveEventIsoDates(event: Partial<CommunityEvent>): { startDate: string; endDate: string } {
  const fallbackStart = new Date();
  fallbackStart.setDate(fallbackStart.getDate() + 3);
  const fallbackDateStr = fallbackStart.toISOString().split('T')[0];

  const rawDate = String(event.date || '').trim();
  let dateIso = fallbackDateStr;
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    dateIso = rawDate.slice(0, 10);
  } else if (rawDate) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      dateIso = parsed.toISOString().split('T')[0];
    }
  }

  // Parse start & optional end time (e.g., "10:00 AM - 12:30 PM", "09:30 AM", "16:00")
  const parseClock = (clockStr: string, defaultHour: number, defaultMin: number): { hh: number; mm: number } => {
    const m = clockStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return { hh: defaultHour, mm: defaultMin };
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2] || '0', 10);
    const meridiem = (m[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;
    return { hh: Math.min(23, Math.max(0, hh)), mm: Math.min(59, Math.max(0, mm)) };
  };

  const rawTime = String(event.time || '').trim();
  const timeParts = rawTime.split(/\s*(?:-|–|to)\s*/i);
  const startClock = timeParts[0] ? parseClock(timeParts[0], 10, 0) : { hh: 10, mm: 0 };
  const endClock = timeParts[1]
    ? parseClock(timeParts[1], Math.min(22, startClock.hh + 2), startClock.mm)
    : { hh: Math.min(23, startClock.hh + 2), mm: startClock.mm };

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${dateIso}T${pad(startClock.hh)}:${pad(startClock.mm)}:00+05:30`;

  let endDateIso = dateIso;
  if (event.endDate && /^\d{4}-\d{2}-\d{2}/.test(event.endDate)) {
    endDateIso = event.endDate.slice(0, 10);
  }
  const endDate = `${endDateIso}T${pad(endClock.hh)}:${pad(endClock.mm)}:00+05:30`;

  return { startDate, endDate };
}

/**
 * Computes real-time ticket availability, pricing & direct checkout offers for an event
 */
export function computeEventRealTimeTicketing(
  event: CommunityEvent,
  baseUrl: string = 'https://app.vernunt.com'
) {
  const tiers = Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0
    ? event.ticketTiers
    : [
        {
          id: 'general',
          name: event.ticketPrice && event.ticketPrice > 0 ? 'General Admission Pass' : 'Free Community Pass',
          price: Number(event.ticketPrice || 0),
          capacity: Number(event.maxAttendees || 50),
          remainingStock: Math.max(
            0,
            Number(event.maxAttendees || 50) - Number(event.attendeesCount || 0)
          ),
          description: 'Standard event entry pass booked directly on Vernunt.'
        }
      ];

  const totalCapacity = tiers.reduce((sum, t) => sum + Number(t.capacity || 0), 0) || Number(event.maxAttendees || 50);
  const availableTickets = event.status === 'Full'
    ? 0
    : tiers.reduce((sum, t) => sum + Math.max(0, Number(t.remainingStock ?? t.capacity ?? 0)), 0);
  const bookedCount = Math.max(Number(event.attendeesCount || 0), Math.max(0, totalCapacity - availableTickets));

  const prices = tiers.map(t => Number(t.price || 0));
  const minPrice = prices.length > 0 ? Math.min(...prices) : Number(event.ticketPrice || 0);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : Number(event.ticketPrice || 0);

  const availabilityStatus: 'InStock' | 'LimitedAvailability' | 'SoldOut' =
    event.status === 'Full' || availableTickets <= 0
      ? 'SoldOut'
      : availableTickets <= Math.max(5, Math.round(totalCapacity * 0.15))
        ? 'LimitedAvailability'
        : 'InStock';

  const mappedTiers = tiers.map(t => {
    const stock = event.status === 'Full' ? 0 : Math.max(0, Number(t.remainingStock ?? t.capacity ?? 0));
    const tierAvailability: 'InStock' | 'LimitedAvailability' | 'SoldOut' =
      stock <= 0 ? 'SoldOut' : stock <= 5 ? 'LimitedAvailability' : 'InStock';
    return {
      id: t.id,
      name: t.name,
      price: Number(t.price || 0),
      currency: 'INR',
      capacity: Number(t.capacity || 0),
      remainingStock: stock,
      availability: tierAvailability,
      schemaAvailability: `https://schema.org/${tierAvailability}`,
      checkoutUrl: getEventDirectCheckoutUrl(event, baseUrl, t.id)
    };
  });

  return {
    directCheckoutUrl: getEventDirectCheckoutUrl(event, baseUrl),
    eventPageUrl: getEventDirectUrl(event, baseUrl),
    currency: 'INR',
    minPrice,
    maxPrice,
    isFree: maxPrice === 0,
    totalCapacity,
    bookedCount,
    availableTickets,
    availabilityStatus,
    schemaAvailability: `https://schema.org/${availabilityStatus}`,
    ticketTiers: mappedTiers
  };
}

/**
 * Generates official Schema.org Event JSON-LD structured data conforming to:
 * https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function generateEventJsonLd(event: CommunityEvent, baseUrl: string = 'https://app.vernunt.com') {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const canonicalUrl = getEventDirectUrl(event, cleanBase);
  const { startDate, endDate } = resolveEventIsoDates(event);
  const ticketing = computeEventRealTimeTicketing(event, cleanBase);

  const isVirtual = event.deliveryMode === 'virtual';
  const isHybrid = event.deliveryMode === 'hybrid';

  const eventAttendanceMode = isVirtual
    ? 'https://schema.org/OnlineEventAttendanceMode'
    : isHybrid
      ? 'https://schema.org/MixedEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode';

  const physicalLocation = {
    '@type': 'Place',
    name: event.location || 'Bengaluru Family Venue',
    address: {
      '@type': 'PostalAddress',
      streetAddress: event.location || 'Bengaluru',
      addressLocality: event.city || 'Bengaluru',
      addressRegion: 'Karnataka',
      postalCode: event.pincode || '560034',
      addressCountry: 'IN'
    },
    ...(event.lat && event.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: event.lat,
            longitude: event.lng
          }
        }
      : {})
  };

  const virtualLocation = {
    '@type': 'VirtualLocation',
    url: event.virtualMeetingDetails || event.googleChatLink || ticketing.directCheckoutUrl
  };

  const location = isHybrid
    ? [physicalLocation, virtualLocation]
    : isVirtual
      ? virtualLocation
      : physicalLocation;

  const images: string[] = [];
  if (event.photoUrl) {
    images.push(event.photoUrl.startsWith('http') ? event.photoUrl : `${cleanBase}${event.photoUrl}`);
  }
  if (Array.isArray((event as any).galleryImages)) {
    for (const img of (event as any).galleryImages) {
      if (typeof img === 'string' && !images.includes(img)) {
        images.push(img.startsWith('http') ? img : `${cleanBase}${img}`);
      }
    }
  }
  if (images.length === 0) {
    images.push(`${cleanBase}/vernunt-logo.png`);
  }

  const validFromIso = (event as any).createdAt || new Date().toISOString();

  const offers = ticketing.ticketTiers.map(tier => ({
    '@type': 'Offer',
    name: tier.name,
    url: tier.checkoutUrl,
    price: tier.price,
    priceCurrency: 'INR',
    availability: tier.schemaAvailability,
    validFrom: validFromIso,
    inventoryLevel: {
      '@type': 'QuantitativeValue',
      value: tier.remainingStock
    }
  }));

  const eventStatus =
    event.status === 'Cancelled'
      ? 'https://schema.org/EventCancelled'
      : event.status === 'Postponed'
        ? 'https://schema.org/EventPostponed'
        : 'https://schema.org/EventScheduled';

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${canonicalUrl}#event`,
    identifier: event.id,
    name: event.title,
    description: event.description || `${event.title} — Kids & Family Event hosted on Vernunt.`,
    startDate,
    endDate,
    eventStatus,
    eventAttendanceMode,
    isAccessibleForFree: ticketing.isFree,
    location,
    image: images,
    url: canonicalUrl,
    offers: offers.length === 1 ? offers[0] : offers,
    performer: {
      '@type': 'PerformingGroup',
      name: event.hostName || 'Vernunt Certified Kids Educator & Host'
    },
    organizer: {
      '@type': 'Organization',
      name: event.hostName ? `${event.hostName} via Vernunt` : 'Vernunt Kids & Family Events',
      url: cleanBase
    }
  };
}
