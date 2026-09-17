/**
 * LocalStorage caching utility for Event Dynamic QR Passes
 * Enables families to access their entrance tickets, high-resolution QR codes,
 * and attendee credentials even without an active internet connection at venues.
 */

export interface CachedQrPass {
  id: string;
  ticketNumber: string;
  eventId: string;
  eventTitle: string;
  eventCategory?: string;
  eventEmoji?: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  safeArea?: string;
  attendeeName: string;
  parentName: string;
  phone: string;
  tierName: string;
  ticketPrice?: number;
  qrDataUrl: string; // Base64 data URL for offline image display
  qrPayload: string; // Encrypted JSON payload for scanners
  cachedAt: number; // Unix timestamp in ms
  cachedAtFormatted: string; // Human-friendly date string
  status: 'Upcoming' | 'Used' | 'Expired';
  offlinePasscode: string; // 6-digit emergency gate code for manual operator entry
  gateLocation?: string;
  usedAt?: string;
  usedGate?: string;
  usedMethod?: string;
}

const STORAGE_KEY_PASSES = 'vernunt_offline_cached_qr_passes_v1';
const STORAGE_KEY_ACTIVE_PASS = 'vernunt_active_offline_pass_id_v1';

/**
 * Generates a consistent 6-digit numeric backup gate code derived from ticket number
 */
export function generateOfflinePasscode(ticketNumber: string): string {
  let hash = 0;
  for (let i = 0; i < ticketNumber.length; i++) {
    hash = (hash << 5) - hash + ticketNumber.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const code = (positive % 900000) + 100000;
  return code.toString();
}

/**
 * Retrieve all cached QR passes from localStorage
 */
export function getOfflineCachedPasses(): CachedQrPass[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse offline cached passes from localStorage:', err);
    return [];
  }
}

/**
 * Retrieve a specific cached pass by ticketNumber or ID
 */
export function getOfflineCachedPass(idOrTicketNumber: string): CachedQrPass | null {
  const passes = getOfflineCachedPasses();
  return passes.find(p => p.id === idOrTicketNumber || p.ticketNumber === idOrTicketNumber) || null;
}

/**
 * Retrieve cached pass by eventId
 */
export function getOfflineCachedPassByEventId(eventId: string): CachedQrPass | null {
  const passes = getOfflineCachedPasses();
  return passes.find(p => p.eventId === eventId) || null;
}

/**
 * Save or update a QR pass into offline localStorage cache
 */
export function savePassToOfflineCache(
  pass: Omit<CachedQrPass, 'cachedAt' | 'cachedAtFormatted' | 'offlinePasscode'> & Partial<CachedQrPass>
): CachedQrPass {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      ...pass,
      cachedAt: Date.now(),
      cachedAtFormatted: new Date().toLocaleTimeString(),
      offlinePasscode: generateOfflinePasscode(pass.ticketNumber)
    } as CachedQrPass;
  }

  const existing = getOfflineCachedPasses();
  const now = Date.now();
  const dateObj = new Date(now);
  const formatted = `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const finalRecord: CachedQrPass = {
    ...pass,
    cachedAt: now,
    cachedAtFormatted: formatted,
    offlinePasscode: pass.offlinePasscode || generateOfflinePasscode(pass.ticketNumber),
    status: pass.status || 'Upcoming'
  };

  // Find existing index by ticketNumber or id
  const index = existing.findIndex(p => p.ticketNumber === pass.ticketNumber || p.id === pass.id);
  let updatedList: CachedQrPass[];

  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = finalRecord;
  } else {
    updatedList = [finalRecord, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY_PASSES, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEY_ACTIVE_PASS, finalRecord.ticketNumber);
  } catch (err) {
    console.warn('Failed to save pass to offline cache in localStorage:', err);
  }

  return finalRecord;
}

/**
 * Check if a ticket has already been cached in offline storage
 */
export function isPassCachedOffline(ticketNumber: string): boolean {
  const passes = getOfflineCachedPasses();
  return passes.some(p => p.ticketNumber === ticketNumber && Boolean(p.qrDataUrl));
}

/**
 * Get the active offline pass ID
 */
export function getActiveOfflinePassId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_PASS);
}

/**
 * Set the active offline pass ID
 */
export function setActiveOfflinePassId(ticketNumber: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PASS, ticketNumber);
  } catch (err) {
    console.warn('Failed to set active offline pass ID:', err);
  }
}

/**
 * Remove a pass from the offline cache
 */
export function removePassFromOfflineCache(idOrTicketNumber: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const existing = getOfflineCachedPasses();
  const filtered = existing.filter(p => p.id !== idOrTicketNumber && p.ticketNumber !== idOrTicketNumber);
  try {
    localStorage.setItem(STORAGE_KEY_PASSES, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove pass from offline cache:', err);
  }
}

/**
 * Clear all offline cached passes
 */
export function clearAllOfflinePasses(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEY_PASSES);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_PASS);
  } catch (err) {
    console.warn('Failed to clear offline passes:', err);
  }
}
