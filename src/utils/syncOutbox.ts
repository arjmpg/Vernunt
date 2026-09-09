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
let syncStatusListeners: Array<(status: SyncServiceWorkerStatus) => void> = [];
let isSyncInProgress = false;
let lastSyncTimestamp = 0;
let lastSwSyncTriggerTime = 0;

export interface SyncServiceWorkerStatus {
  swRegistered: boolean;
  backgroundSyncSupported: boolean;
  lastSwTriggerTime: number;
  lastSuccessfulSyncTime: number;
  isSyncing: boolean;
}

/**
 * Register Background Sync with Service Worker
 * Triggered automatically when offline items are queued or when operations fail
 */
export async function registerServiceWorkerBackgroundSync(tag = 'vernunt-outbox-sync'): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && 'sync' in reg) {
      await (reg as any).sync.register(tag);
      console.log(`📡 [Sync Outbox] Service Worker Background Sync registered tag: "${tag}"`);
      return true;
    }
  } catch (err) {
    console.debug('[Sync Outbox] Background Sync registration note:', err);
  }
  return false;
}

/**
 * Get current Service Worker Background Sync integration status
 */
export function getServiceWorkerSyncStatus(): SyncServiceWorkerStatus {
  const hasSw = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const hasSyncManager = typeof window !== 'undefined' && 'SyncManager' in window;
  return {
    swRegistered: hasSw,
    backgroundSyncSupported: hasSyncManager,
    lastSwTriggerTime: lastSwSyncTriggerTime,
    lastSuccessfulSyncTime: lastSyncTimestamp,
    isSyncing: isSyncInProgress
  };
}

/**
 * Subscribe to Service Worker sync status changes
 */
export function subscribeToSyncStatus(callback: (status: SyncServiceWorkerStatus) => void): () => void {
  syncStatusListeners.push(callback);
  callback(getServiceWorkerSyncStatus());
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== callback);
  };
}

function notifySyncStatusListeners() {
  const status = getServiceWorkerSyncStatus();
  syncStatusListeners.forEach(cb => {
    try {
      cb(status);
    } catch (e) {
      console.debug('[Sync Outbox] Status listener error:', e);
    }
  });
}

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

  // Register Service Worker Background Sync
  registerServiceWorkerBackgroundSync('vernunt-outbox-sync');

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
 * @param autoRetryFailed If true, automatically resets failed operations to 'queued' so they are retried
 */
export async function triggerBackgroundSync(autoRetryFailed: boolean = false): Promise<{ successCount: number; failedCount: number }> {
  if (isSyncInProgress) {
    return { successCount: 0, failedCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('📡 [Sync Outbox] Device is offline. Registering Service Worker background sync for reconnect...');
    registerServiceWorkerBackgroundSync('vernunt-outbox-sync');
    return { successCount: 0, failedCount: 0 };
  }

  // If autoRetryFailed is enabled or on reconnect, promote failed items to queued
  if (autoRetryFailed) {
    const hasFailed = outboxCache.some(item => item.status === 'failed');
    if (hasFailed) {
      outboxCache.forEach(item => {
        if (item.status === 'failed' && (item.retryCount || 0) < 5) {
          item.status = 'queued';
        }
      });
      saveOutbox([...outboxCache]);
    }
  }

  const pendingItems = outboxCache.filter(item => item.status === 'queued' || item.status === 'failed');
  if (pendingItems.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  isSyncInProgress = true;
  notifySyncStatusListeners();
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
      notifySyncStatusListeners();

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
  lastSyncTimestamp = Date.now();
  notifySyncStatusListeners();

  if (failedCount > 0) {
    console.warn(`⚠️ [Sync Outbox] ${failedCount} item(s) failed to sync. Registering Service Worker Background Sync retry...`);
    registerServiceWorkerBackgroundSync('firebase-outbox-sync');
  }

  console.log(`✨ [Sync Outbox] Batch sync finished. Success: ${successCount}, Failed: ${failedCount}`);
  return { successCount, failedCount };
}

/**
 * Retry all failed items in the outbox
 */
export async function retryAllFailedOutboxItems(): Promise<{ successCount: number; failedCount: number }> {
  const items = [...outboxCache];
  let markedCount = 0;
  items.forEach(i => {
    if (i.status === 'failed') {
      i.status = 'queued';
      markedCount++;
    }
  });

  if (markedCount > 0) {
    saveOutbox(items);
    console.log(`🔄 [Sync Outbox] Reset ${markedCount} failed item(s) to queued for retry.`);
  }

  return triggerBackgroundSync(false);
}

/**
 * Trigger an explicit sync via the active Service Worker
 */
export async function triggerServiceWorkerSync(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: 'REQUEST_SW_OUTBOX_FLUSH' });
      return true;
    }
  } catch (err) {
    console.warn('[Sync Outbox] Could not postMessage to active Service Worker:', err);
  }
  return false;
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
  await triggerBackgroundSync(false);
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

// Attach automatic browser connection and Service Worker listeners
if (typeof window !== 'undefined') {
  // 1. Online event listener: Automatically retry failed Firebase write operations when network returns
  window.addEventListener('online', () => {
    console.log('🌐 [Sync Outbox] Internet connection restored! Automatically retrying failed Firebase writes...');
    setTimeout(() => {
      retryAllFailedOutboxItems();
    }, 300);
  });

  // 2. Service Worker Message Listener
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TRIGGER_OUTBOX_SYNC') {
        console.log(`⚡ [Sync Outbox] Received Service Worker Background Sync event [${event.data.tag || 'sync'}]! Auto-retrying failed writes...`);
        lastSwSyncTriggerTime = Date.now();
        notifySyncStatusListeners();
        // Auto-retry failed items upon Service Worker sync signal
        triggerBackgroundSync(true);
      }
    });

    // Ping Service Worker to confirm active background sync capability
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({ type: 'PING_SYNC' });
      }
      registerServiceWorkerBackgroundSync('vernunt-outbox-sync');
    }).catch(() => {});
  }

  // 3. Periodic heartbeat check every 45 seconds
  setInterval(() => {
    if (navigator.onLine && getPendingOutboxCount() > 0) {
      triggerBackgroundSync(false);
    }
  }, 45000);
}
