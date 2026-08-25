import { db, auth, handleFirestoreError, OperationType } from './firebase.ts';
import { doc, setDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { Message, ChildProfile, CareBookingRequest, CareBookingStatus } from '../types.ts';

export type OutboxActionType = 
  | 'SEND_MESSAGE'
  | 'SEND_CONNECTION_REQUEST'
  | 'ACCEPT_CONNECTION_REQUEST'
  | 'CARE_BOOKING_REQUEST'
  | 'CARE_STATUS_UPDATE'
  | 'SAVE_PROFILE_UPDATE';

export type OutboxItemStatus = 'queued' | 'syncing' | 'synced' | 'failed';

export interface OutboxItem {
  id: string;
  actionType: OutboxActionType;
  payload: any;
  createdAt: number;
  status: OutboxItemStatus;
  retryCount: number;
  lastError?: string;
  description: string;
  syncedAt?: number;
}

const STORAGE_KEY = 'vernunt_sync_outbox_v1';
let outboxCache: OutboxItem[] = [];
let listeners: Array<(items: OutboxItem[]) => void> = [];
let isSyncInProgress = false;

// Load persisted outbox from localStorage
function loadOutbox(): OutboxItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        outboxCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Sync Outbox] Failed to load outbox cache:', err);
  }
  outboxCache = [];
  return [];
}

// Save outbox to localStorage and notify listeners
function saveOutbox(items: OutboxItem[]) {
  outboxCache = items;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('[Sync Outbox] Failed to persist outbox:', err);
    }
  }
  notifyListeners();
}

function notifyListeners() {
  const items = [...outboxCache];
  listeners.forEach(fn => {
    try {
      fn(items);
    } catch (e) {
      console.debug('[Sync Outbox] Listener notification error:', e);
    }
  });
}

// Initialize on module load
if (typeof window !== 'undefined') {
  loadOutbox();
}

/**
 * Subscribe to outbox changes
 */
export function subscribeToOutbox(callback: (items: OutboxItem[]) => void): () => void {
  listeners.push(callback);
  callback([...outboxCache]);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Get current list of all outbox items
 */
export function getOutboxItems(): OutboxItem[] {
  if (outboxCache.length === 0) {
    loadOutbox();
  }
  return [...outboxCache];
}

/**
 * Get count of pending (queued, syncing, or failed) outbox items
 */
export function getPendingOutboxCount(): number {
  return outboxCache.filter(item => item.status !== 'synced').length;
}

/**
 * Enqueue a new action to the sync outbox
 */
export function enqueueOutboxAction(
  actionType: OutboxActionType,
  payload: any,
  description: string
): OutboxItem {
  const newItem: OutboxItem = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actionType,
    payload,
    createdAt: Date.now(),
    status: 'queued',
    retryCount: 0,
    description
  };

  const updated = [newItem, ...outboxCache];
  saveOutbox(updated);

  console.log(`📦 [Sync Outbox] Enqueued action: [${actionType}] - ${description}`);

  // If online, immediately attempt background sync
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    setTimeout(() => {
      triggerBackgroundSync();
    }, 100);
  }

  return newItem;
}

/**
 * Helper: Queue Chat Message
 */
export function queueMessage(chatId: string, message: Message, userProfile?: ChildProfile | null): OutboxItem {
  return enqueueOutboxAction(
    'SEND_MESSAGE',
    {
      chatId,
      message,
      senderId: userProfile?.id || auth.currentUser?.uid || 'user',
      senderName: userProfile?.parentName || 'Parent'
    },
    `Chat message to ${chatId}: "${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}"`
  );
}

/**
 * Helper: Queue Connection Request
 */
export function queueConnectionRequest(targetPlaymateId: string, senderProfile?: ChildProfile | null): OutboxItem {
  return enqueueOutboxAction(
    'SEND_CONNECTION_REQUEST',
    {
      targetPlaymateId,
      senderId: senderProfile?.id || auth.currentUser?.uid || 'user',
      senderName: senderProfile?.parentName || 'Parent',
      childName: senderProfile?.childName || 'Child',
      timestamp: Date.now()
    },
    `Connect request to playmate profile #${targetPlaymateId}`
  );
}

/**
 * Helper: Queue Accept Connection
 */
export function queueAcceptConnection(partnerId: string, userProfile?: ChildProfile | null): OutboxItem {
  return enqueueOutboxAction(
    'ACCEPT_CONNECTION_REQUEST',
    {
      partnerId,
      userId: userProfile?.id || auth.currentUser?.uid || 'user',
      timestamp: Date.now()
    },
    `Accept connection request from #${partnerId}`
  );
}

/**
 * Helper: Queue Care Booking
 */
export function queueCareBooking(booking: CareBookingRequest): OutboxItem {
  return enqueueOutboxAction(
    'CARE_BOOKING_REQUEST',
    booking,
    `Sitting booking for ${booking.childName} with ${booking.providerName}`
  );
}

/**
 * Helper: Queue Care Status Update
 */
export function queueCareStatusUpdate(bookingId: string, newStatus: CareBookingStatus, note?: string): OutboxItem {
  return enqueueOutboxAction(
    'CARE_STATUS_UPDATE',
    { bookingId, status: newStatus, note, timestamp: Date.now() },
    `Care booking #${bookingId.substring(0, 8)} status update -> ${newStatus}`
  );
}

/**
 * Execute an individual item against Firebase Firestore
 */
async function processOutboxItem(item: OutboxItem): Promise<boolean> {
  const currentUid = auth.currentUser?.uid;

  switch (item.actionType) {
    case 'SEND_MESSAGE': {
      const { chatId, message, senderId } = item.payload;
      try {
        const msgDocRef = doc(collection(db, 'chat_messages'));
        await setDoc(msgDocRef, {
          id: message.id || msgDocRef.id,
          chatId,
          senderId: senderId || currentUid || 'user',
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
          createdAt: Date.now()
        });
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
        return false;
      }
    }

    case 'SEND_CONNECTION_REQUEST': {
      const { targetPlaymateId, senderId, senderName, childName } = item.payload;
      try {
        const reqDocRef = doc(collection(db, 'connection_requests'));
        await setDoc(reqDocRef, {
          id: reqDocRef.id,
          targetId: targetPlaymateId,
          fromUserId: senderId || currentUid,
          fromParentName: senderName,
          fromChildName: childName,
          status: 'pending',
          createdAt: Date.now()
        });

        // Also record in user profile interestSent array if logged in
        if (currentUid) {
          const userRef = doc(db, 'users', currentUid);
          await updateDoc(userRef, {
            interestsSent: arrayUnion(targetPlaymateId)
          }).catch(() => {});
        }
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'connection_requests');
        return false;
      }
    }

    case 'ACCEPT_CONNECTION_REQUEST': {
      const { partnerId, userId } = item.payload;
      try {
        const targetUid = userId || currentUid;
        if (targetUid) {
          const userRef = doc(db, 'users', targetUid);
          await updateDoc(userRef, {
            connectedIds: arrayUnion(partnerId)
          }).catch(() => {});
        }
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, 'users');
        return false;
      }
    }

    case 'CARE_BOOKING_REQUEST': {
      const booking = item.payload as CareBookingRequest;
      try {
        const bookingRef = doc(db, 'care_bookings', booking.id);
        await setDoc(bookingRef, {
          ...booking,
          syncedAt: new Date().toISOString()
        }, { merge: true });
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'care_bookings');
        return false;
      }
    }

    case 'CARE_STATUS_UPDATE': {
      const { bookingId, status, note, timestamp } = item.payload;
      try {
        const bookingRef = doc(db, 'care_bookings', bookingId);
        const updatePayload: any = {
          status,
          updatedAt: new Date(timestamp || Date.now()).toISOString()
        };
        if (note) {
          updatePayload.careActivityLog = arrayUnion({
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            activity: status,
            note
          });
        }
        await updateDoc(bookingRef, updatePayload);
        return true;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, 'care_bookings');
        return false;
      }
    }

    case 'SAVE_PROFILE_UPDATE': {
      const profile = item.payload as ChildProfile;
      try {
        const targetId = profile.id || currentUid;
        if (targetId) {
          const userRef = doc(db, 'users', targetId);
          await setDoc(userRef, profile, { merge: true });
          return true;
        }
        return false;
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
        return false;
      }
    }

    default:
      console.warn('[Sync Outbox] Unknown action type:', (item as any).actionType);
      return true;
  }
}

/**
 * Triggers background sync of all queued items
 */
export async function triggerBackgroundSync(): Promise<{ successCount: number; failedCount: number }> {
  if (isSyncInProgress) {
    return { successCount: 0, failedCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('📡 [Sync Outbox] Device is offline. Skipping sync attempt.');
    return { successCount: 0, failedCount: 0 };
  }

  const pendingItems = outboxCache.filter(item => item.status === 'queued' || item.status === 'failed');
  if (pendingItems.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  isSyncInProgress = true;
  let successCount = 0;
  let failedCount = 0;

  console.log(`🚀 [Sync Outbox] Starting background push of ${pendingItems.length} queued action(s) to Firebase...`);

  // Process items sequentially in chronological order
  const currentItems = [...outboxCache];

  for (let i = currentItems.length - 1; i >= 0; i--) {
    const item = currentItems[i];
    if (item.status === 'queued' || item.status === 'failed') {
      // Mark as syncing
      item.status = 'syncing';
      saveOutbox([...currentItems]);

      try {
        const ok = await processOutboxItem(item);
        if (ok) {
          item.status = 'synced';
          item.syncedAt = Date.now();
          item.lastError = undefined;
          successCount++;
          console.log(`✅ [Sync Outbox] Synced: ${item.description}`);
        } else {
          item.status = 'failed';
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = 'Remote sync failed or timed out';
          failedCount++;
        }
      } catch (err: any) {
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err?.message || 'Network error during sync';
        failedCount++;
      }

      saveOutbox([...currentItems]);
    }
  }

  isSyncInProgress = false;
  console.log(`✨ [Sync Outbox] Batch sync finished. Success: ${successCount}, Failed: ${failedCount}`);
  return { successCount, failedCount };
}

/**
 * Retry an individual failed outbox item
 */
export async function retryOutboxItem(itemId: string): Promise<boolean> {
  const items = [...outboxCache];
  const target = items.find(i => i.id === itemId);
  if (!target) return false;

  target.status = 'queued';
  saveOutbox(items);
  await triggerBackgroundSync();
  return true;
}

/**
 * Clear all completed/synced items from outbox history
 */
export function clearSyncedOutboxItems() {
  const filtered = outboxCache.filter(item => item.status !== 'synced');
  saveOutbox(filtered);
}

/**
 * Clear all outbox items entirely
 */
export function clearEntireOutbox() {
  saveOutbox([]);
}

// Attach automatic browser connection listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 [Sync Outbox] Internet connection detected! Automatically flushing queued outbox actions...');
    setTimeout(() => {
      triggerBackgroundSync();
    }, 500);
  });

  // Periodic heartbeat every 45 seconds to check and push if online
  setInterval(() => {
    if (navigator.onLine && getPendingOutboxCount() > 0) {
      triggerBackgroundSync();
    }
  }, 45000);
}
