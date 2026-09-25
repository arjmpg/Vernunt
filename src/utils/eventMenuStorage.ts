import { EventMenuItem } from '../types.ts';

const EVENT_MENU_STORAGE_KEY_PREFIX = 'vernunt_event_menu_';

/**
 * Gets menu items for a specific event from localStorage (supports host offline updates)
 * falls back to event.menuItems or default items.
 */
export function getStoredEventMenu(eventId: string, initialItems?: EventMenuItem[]): EventMenuItem[] {
  if (typeof window === 'undefined') return initialItems || [];
  try {
    const raw = localStorage.getItem(`${EVENT_MENU_STORAGE_KEY_PREFIX}${eventId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse offline event menu:', e);
  }

  // Fallback to event provided items or empty array
  return initialItems || [];
}

/**
 * Saves event menu items to offline localStorage and broadcasts update
 */
export function saveStoredEventMenu(eventId: string, items: EventMenuItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${EVENT_MENU_STORAGE_KEY_PREFIX}${eventId}`, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('vernunt_event_menu_updated', {
      detail: { eventId, items }
    }));
  } catch (e) {
    console.error('Failed to store event menu offline:', e);
  }
}
