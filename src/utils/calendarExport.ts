import { CommunityEvent } from '../types.ts';

interface CalendarRange {
  startLocal: string; // YYYYMMDDTHHMMSS (IST)
  endLocal: string;   // YYYYMMDDTHHMMSS (IST)
  startUtc: string;   // YYYYMMDDTHHMMSSZ
  endUtc: string;     // YYYYMMDDTHHMMSSZ
  dtStampUtc: string; // YYYYMMDDTHHMMSSZ
}

function pad2(n: number): string {
  return String(Math.floor(Math.abs(n))).padStart(2, '0');
}

function formatUtcTimestamp(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

function parseDateParts(event: CommunityEvent): { year: number; month: number; day: number } {
  const candidates = [event.startDate, event.date].filter(Boolean) as string[];

  for (const raw of candidates) {
    const clean = raw.trim();
    // Exact ISO YYYY-MM-DD
    const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]),
        day: Number(isoMatch[3])
      };
    }

    // Strip natural prefixes like "Starts from Dec 5, 2026" or "Starts Dec 5, 2026"
    const stripped = clean
      .replace(/^starts?\s*(from\s*)?/i, '')
      .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
      .trim();
    const parsed = new Date(stripped);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2024) {
      return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate()
      };
    }
  }

  // Fallback: next upcoming day
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return {
    year: tomorrow.getFullYear(),
    month: tomorrow.getMonth() + 1,
    day: tomorrow.getDate()
  };
}

function to24Hour(hour: number, minute: number, meridiem?: string): { h: number; m: number } {
  let h = hour;
  const m = Math.min(59, Math.max(0, minute));
  if (meridiem) {
    const upper = meridiem.toUpperCase();
    if (upper === 'PM' && h < 12) h += 12;
    if (upper === 'AM' && h === 12) h = 0;
  }
  return { h: Math.min(23, Math.max(0, h)), m };
}

function parseTimeRange(timeStr?: string): { startH: number; startM: number; endH: number; endM: number } {
  if (!timeStr) return { startH: 10, startM: 0, endH: 12, endM: 0 };

  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
  const matches: Array<{ h: number; m: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = timeRegex.exec(timeStr)) !== null) {
    matches.push(to24Hour(Number(match[1]), Number(match[2] || 0), match[3]));
  }

  if (matches.length >= 2) {
    const start = matches[0];
    const end = matches[1];
    // Handle valid same-day range (end > start)
    if (end.h * 60 + end.m > start.h * 60 + start.m) {
      return { startH: start.h, startM: start.m, endH: end.h, endM: end.m };
    }
  }

  if (matches.length >= 1) {
    const start = matches[0];
    const endTotalMins = Math.min(23 * 60 + 30, start.h * 60 + start.m + 120);
    return {
      startH: start.h,
      startM: start.m,
      endH: Math.floor(endTotalMins / 60),
      endM: endTotalMins % 60
    };
  }

  return { startH: 10, startM: 0, endH: 12, endM: 0 };
}

export function getEventCalendarRange(event: CommunityEvent): CalendarRange {
  const { year, month, day } = parseDateParts(event);
  const { startH, startM, endH, endM } = parseTimeRange(event.time);

  const startLocal = `${year}${pad2(month)}${pad2(day)}T${pad2(startH)}${pad2(startM)}00`;
  const endLocal = `${year}${pad2(month)}${pad2(day)}T${pad2(endH)}${pad2(endM)}00`;

  // Convert IST (UTC+05:30) to exact UTC Date for universal Apple/Outlook .ics compatibility
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const startUtcDate = new Date(Date.UTC(year, month - 1, day, startH, startM, 0) - istOffsetMs);
  const endUtcDate = new Date(Date.UTC(year, month - 1, day, endH, endM, 0) - istOffsetMs);

  return {
    startLocal,
    endLocal,
    startUtc: formatUtcTimestamp(startUtcDate),
    endUtc: formatUtcTimestamp(endUtcDate),
    dtStampUtc: formatUtcTimestamp(new Date())
  };
}

function buildCalendarDescription(event: CommunityEvent): string {
  const parts: string[] = [];
  if (event.hostName) parts.push(`Host: ${event.hostName}`);
  if (event.prerequisites) parts.push(`Eligibility: ${event.prerequisites}`);
  if (event.refreshmentsIncluded) parts.push(`Included: ${event.refreshmentsIncluded}`);
  if (event.bookingHelpPhone) parts.push(`Booking Help: ${event.bookingHelpPhone}`);
  if (event.description) {
    const trimmed = event.description.trim();
    parts.push(trimmed.length > 600 ? `${trimmed.slice(0, 597)}...` : trimmed);
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    parts.push(`Event Page: ${window.location.origin}/?tab=events&event=${encodeURIComponent(event.id)}`);
  }
  return parts.join('\n\n');
}

export function buildGoogleCalendarUrl(event: CommunityEvent): string {
  const range = getEventCalendarRange(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${range.startLocal}/${range.endLocal}`,
    ctz: 'Asia/Kolkata',
    details: buildCalendarDescription(event),
    location: event.venueAddressDetails || event.location || 'Bengaluru'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function buildAppleCalendarIcsContent(event: CommunityEvent): string {
  const range = getEventCalendarRange(event);
  const uid = `${event.id.replace(/[^a-zA-Z0-9-_]/g, '')}@vernunt.com`;
  const summary = escapeIcsText(event.title);
  const description = escapeIcsText(buildCalendarDescription(event));
  const location = escapeIcsText(event.venueAddressDetails || event.location || 'Bengaluru');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vernunt//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${range.dtStampUtc}`,
    `DTSTART:${range.startUtc}`,
    `DTEND:${range.endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${summary} starts in 1 hour`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadAppleCalendarIcs(event: CommunityEvent): void {
  const icsContent = buildAppleCalendarIcsContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = (event.title || event.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${slug || 'vernunt-event'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
