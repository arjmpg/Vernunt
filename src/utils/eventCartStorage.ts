import { EventSelectedMenuItem } from '../types.ts';
import { 
  enqueueOutboxItem, 
  registerServiceWorkerBackgroundSync, 
  getOutboxItems, 
  triggerBackgroundSync 
} from './syncOutbox.ts';

const CART_PREFIX = 'vernunt_event_cart_';

/**
 * Retrieves the persisted event cart items for a given event from localStorage.
 * Supports full offline availability.
 */
export function getStoredEventCart(eventId: string): EventSelectedMenuItem[] {
  if (typeof window === 'undefined' || !eventId) return [];
  try {
    const raw = localStorage.getItem(`${CART_PREFIX}${eventId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[EventCartStorage] Failed to read cart from localStorage:', err);
  }
  return [];
}

/**
 * Persists the event cart selection to localStorage and broadcasts the update.
 */
export function saveStoredEventCart(eventId: string, items: EventSelectedMenuItem[]): void {
  if (typeof window === 'undefined' || !eventId) return;
  try {
    localStorage.setItem(`${CART_PREFIX}${eventId}`, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent('vernunt_event_cart_updated', {
        detail: { eventId, items }
      })
    );
  } catch (err) {
    console.error('[EventCartStorage] Failed to persist cart to localStorage:', err);
  }
}

/**
 * Clears the stored event cart from localStorage.
 */
export function clearStoredEventCart(eventId: string): void {
  if (typeof window === 'undefined' || !eventId) return;
  try {
    localStorage.removeItem(`${CART_PREFIX}${eventId}`);
    window.dispatchEvent(
      new CustomEvent('vernunt_event_cart_updated', {
        detail: { eventId, items: [] }
      })
    );
  } catch (err) {
    console.warn('[EventCartStorage] Failed to clear cart:', err);
  }
}

/**
 * Calculates the total items count and monetary total for an event cart offline.
 */
export function calculateEventCartTotal(items: EventSelectedMenuItem[]): {
  itemCount: number;
  totalAmount: number;
} {
  if (!items || !Array.isArray(items)) {
    return { itemCount: 0, totalAmount: 0 };
  }

  const itemCount = items.reduce((acc, curr) => acc + (Math.max(0, Number(curr.quantity)) || 0), 0);
  const totalAmount = items.reduce(
    (acc, curr) => acc + (Math.max(0, Number(curr.price)) * Math.max(0, Number(curr.quantity))),
    0
  );

  return { itemCount, totalAmount };
}

/**
 * Synchronizes an offline event menu order to the sync outbox.
 * When connectivity returns or on reconnect, the outbox automatically flushes the order to the cloud.
 */
export function syncEventCartOrderToOutbox(
  eventId: string,
  eventTitle: string,
  cartItems: EventSelectedMenuItem[],
  buyerInfo: {
    name: string;
    email: string;
    phone?: string;
    bookingId?: string;
    paymentMethod?: string;
    paymentId?: string;
    walletDebited?: number;
    onlinePaid?: number;
  }
): string {
  const { totalAmount, itemCount } = calculateEventCartTotal(cartItems);
  const orderId = `evt-order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const orderPayload = {
    id: orderId,
    eventId,
    eventTitle,
    items: cartItems,
    itemCount,
    totalAmount,
    buyerName: buyerInfo.name,
    buyerEmail: buyerInfo.email,
    buyerPhone: buyerInfo.phone || '',
    bookingId: buyerInfo.bookingId || '',
    paymentMethod: buyerInfo.paymentMethod || 'VernuntWallet',
    paymentId: buyerInfo.paymentId || `OFFLINE-PAY-${Date.now().toString().slice(-6)}`,
    walletDebited: buyerInfo.walletDebited || 0,
    onlinePaid: buyerInfo.onlinePaid || 0,
    placedAt: new Date().toISOString(),
    isOfflineOrder: typeof navigator !== 'undefined' ? !navigator.onLine : false
  };

  enqueueOutboxItem(
    'EVENT_MENU_ORDER',
    orderPayload,
    `Pre-order ${itemCount} refreshments for "${eventTitle}" (₹${totalAmount})`
  );

  // Register service worker background sync tag
  registerServiceWorkerBackgroundSync('vernunt-outbox-sync').catch(() => {});

  return orderId;
}

/**
 * Queues the current EventMenuComponent cart state to the Service Worker Background Sync outbox.
 * Ensures selections made while offline are stored and automatically pushed to Firestore as soon as network returns.
 */
export function queueEventCartBackgroundSync(
  eventId: string,
  eventTitle: string,
  items: EventSelectedMenuItem[],
  userId?: string
): void {
  if (typeof window === 'undefined' || !eventId) return;

  const { totalAmount, itemCount } = calculateEventCartTotal(items);
  const cartDocId = `${userId || 'guest'}_${eventId}`;

  const cartPayload = {
    cartDocId,
    eventId,
    eventTitle,
    items,
    itemCount,
    totalAmount,
    userId: userId || 'guest',
    updatedAt: new Date().toISOString(),
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false
  };

  // Enqueue to background sync outbox
  enqueueOutboxItem(
    'EVENT_CART_SYNC',
    cartPayload,
    `Sync cart (${itemCount} items) for "${eventTitle}"`
  );

  // Register service worker background sync tag
  registerServiceWorkerBackgroundSync('vernunt-outbox-sync').catch(() => {});

  // Dispatch custom event for UI real-time indicator updates
  window.dispatchEvent(
    new CustomEvent('vernunt_event_cart_sync_state', {
      detail: {
        eventId,
        status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'pending'
      }
    })
  );

  // If currently online, trigger background sync
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    triggerBackgroundSync().catch(() => {});
  }
}

/**
 * Returns whether there are pending items queued for this event in the outbox
 */
export function isEventCartPendingUpload(eventId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const items = getOutboxItems();
    return items.some(
      i => (i.actionType === 'EVENT_CART_SYNC' || i.actionType === 'EVENT_MENU_ORDER') &&
           i.payload?.eventId === eventId &&
           (i.status === 'queued' || i.status === 'syncing')
    );
  } catch {
    return false;
  }
}

/**
 * Gets the current synchronization status for an event's cart.
 * Returns 'offline' | 'syncing' | 'pending' | 'synced'
 */
export function getEventCartSyncStatus(eventId: string): 'offline' | 'syncing' | 'pending' | 'synced' {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }

  try {
    const items = getOutboxItems();
    const eventItems = items.filter(
      i => (i.actionType === 'EVENT_CART_SYNC' || i.actionType === 'EVENT_MENU_ORDER') &&
           i.payload?.eventId === eventId
    );

    if (eventItems.some(i => i.status === 'syncing')) {
      return 'syncing';
    }

    if (eventItems.some(i => i.status === 'queued')) {
      return 'pending';
    }

    return 'synced';
  } catch {
    return 'synced';
  }
}

/**
 * Manually flushes the sync outbox immediately
 */
export async function triggerImmediateCartSync(): Promise<boolean> {
  try {
    const res = await triggerBackgroundSync(true);
    return res.successCount > 0;
  } catch {
    return false;
  }
}

