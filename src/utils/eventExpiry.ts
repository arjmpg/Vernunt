import { CommunityEvent } from '../types.ts';

function toDayKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

function getTodayDayKey(referenceDate: Date = new Date()): number {
  return toDayKey(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    referenceDate.getDate()
  );
}

/**
 * Parses an event date string (ISO YYYY-MM-DD, range "YYYY-MM-DD to YYYY-MM-DD",
 * or natural label like "Starts from Dec 5, 2026" / "Oct 25, 2026") into a YYYYMMDD integer.
 * For ranges, returns the END date so multi-day events stay visible through their final day.
 */
function parseDateStringToDayKey(raw?: string): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Handle "YYYY-MM-DD to YYYY-MM-DD" or "start - end" ranges by checking the last ISO date first
  const isoMatches = Array.from(trimmed.matchAll(/(\d{4})-(\d{2})-(\d{2})/g));
  if (isoMatches.length > 0) {
    const last = isoMatches[isoMatches.length - 1];
    return toDayKey(Number(last[1]), Number(last[2]), Number(last[3]));
  }

  // Strip natural prefixes like "Starts from Dec 5, 2026" and ordinal suffixes ("5th")
  const cleaned = trimmed
    .replace(/^starts?\s*(from\s*)?/i, '')
    .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
    .trim();

  // If there's a " to " range with natural dates, evaluate the end side
  const rangeParts = cleaned.split(/\s+to\s+/i);
  const candidate = rangeParts[rangeParts.length - 1].trim();
  const parsed = new Date(candidate);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000) {
    return toDayKey(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return null;
}

/**
 * Returns true if the event's effective date (endDate, or date, or startDate)
 * is strictly before today's local calendar date.
 */
export function isEventExpired(evt: CommunityEvent | null | undefined, now: Date = new Date()): boolean {
  if (!evt) return true;
  const todayKey = getTodayDayKey(now);

  const endKey = parseDateStringToDayKey(evt.endDate);
  if (endKey !== null) {
    return endKey < todayKey;
  }

  const dateKey = parseDateStringToDayKey(evt.date);
  if (dateKey !== null) {
    return dateKey < todayKey;
  }

  const startKey = parseDateStringToDayKey(evt.startDate);
  if (startKey !== null) {
    return startKey < todayKey;
  }

  return false;
}

/**
 * Filters out all expired events so post-event-date listings are hidden completely.
 */
export function filterActiveEvents<T extends CommunityEvent>(events: T[], now: Date = new Date()): T[] {
  if (!Array.isArray(events)) return [];
  return events.filter((evt) => !isEventExpired(evt, now));
}
