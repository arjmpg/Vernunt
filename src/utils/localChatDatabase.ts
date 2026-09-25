import { db, auth, handleFirestoreError, OperationType } from './firebase.ts';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Message, ChildProfile } from '../types.ts';

export type MessageSyncStatus = 'pending' | 'synced' | 'failed';

export interface LocalChatMessage extends Message {
  createdAt?: number;
  syncStatus?: MessageSyncStatus;
  syncedAt?: number;
  senderName?: string;
  recipientName?: string;
  errorNote?: string;
}

const DB_NAME = 'vernunt_chat_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'chat_messages';
const LOCAL_STORAGE_BACKUP_KEY = 'vernunt_local_chat_messages_backup_v1';

let indexedDbPromise: Promise<IDBDatabase> | null = null;
let dbSubscribers: Array<(messagesByChat: Record<string, LocalChatMessage[]>) => void> = [];
let syncStatusSubscribers: Array<(status: LocalChatSyncStatus) => void> = [];

export interface LocalChatSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTimestamp: number | null;
  lastSyncError: string | null;
}

let currentSyncStatus: LocalChatSyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTimestamp: null,
  lastSyncError: null
};

/**
 * Initial historical seed messages to ensure rich conversations exist immediately
 */
const SEED_CONVERSATIONS: Record<string, LocalChatMessage[]> = {
  'playmate-1': [
    { 
      id: 'seed-1-1', 
      chatId: 'playmate-1', 
      senderId: 'playmate-1', 
      senderName: 'Sarah (Liam\'s Mom)',
      content: 'Hi! I saw you just moved to the neighborhood. Liam would love to meet up at the park playground for some Lego building sometime soon!', 
      timestamp: '2:12 PM',
      createdAt: Date.now() - 3600000 * 24,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 24
    },
    { 
      id: 'seed-1-2', 
      chatId: 'playmate-1', 
      senderId: 'user', 
      senderName: 'Arjun Gupta',
      content: 'Oh that would be amazing! He is very friendly and loves board games.', 
      timestamp: '2:15 PM',
      createdAt: Date.now() - 3600000 * 23,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 23
    },
    { 
      id: 'seed-1-3', 
      chatId: 'playmate-1', 
      senderId: 'playmate-1', 
      senderName: 'Sarah (Liam\'s Mom)',
      content: 'Fantastic! Liam is obsessed with drawing space rockets too. Let us know when you would like to arrange a joint park playtime.', 
      timestamp: '2:16 PM',
      createdAt: Date.now() - 3600000 * 22,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 22
    },
  ],
  'playmate-2': [
    { 
      id: 'seed-2-1', 
      chatId: 'playmate-2', 
      senderId: 'playmate-2', 
      senderName: 'David (Chloe\'s Dad)',
      content: 'Hello! Is your child comfortable with energetic outdoor games? Chloe is active but incredibly cooperative and loves tag.', 
      timestamp: 'Yesterday',
      createdAt: Date.now() - 3600000 * 48,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 48
    }
  ],
  'playmate-3': [
    { 
      id: 'seed-3-1', 
      chatId: 'playmate-3', 
      senderId: 'playmate-3', 
      senderName: 'Elena (Leo\'s Mom)',
      content: 'Oh, hi Arjun! Thank you for accepting my connection request. Leo is a bit quiet but would love to do some finger-painting at Central Park with Ayaan! 🎨', 
      timestamp: 'Just now',
      createdAt: Date.now() - 3600000 * 2,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 2
    }
  ],
  'playmate-4': [
    { 
      id: 'seed-4-1', 
      chatId: 'playmate-4', 
      senderId: 'playmate-4', 
      senderName: 'Marcus (Emma\'s Dad)',
      content: "Hello Arjun! Emma is very excited to meet Ayaan. She was reading about your space rocket drawing idea. Let's plan a playdate!", 
      timestamp: 'Just now',
      createdAt: Date.now() - 3600000 * 1,
      syncStatus: 'synced',
      syncedAt: Date.now() - 3600000 * 1
    }
  ]
};

/**
 * Initialize IndexedDB Local Database
 */
export function openLocalChatDB(): Promise<IDBDatabase> {
  if (indexedDbPromise) {
    return indexedDbPromise;
  }

  indexedDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('⚠️ [LocalChatDB] IndexedDB not available in current context. Using LocalStorage fallback.');
      return reject(new Error('IndexedDB not supported'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('chatId', 'chatId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('senderId', 'senderId', { unique: false });
          console.log('📦 [LocalChatDB] Created object store "chat_messages" with indexes');
        }
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('✅ [LocalChatDB] Local IndexedDB connected successfully');
        
        // Check if database needs initial seeding
        try {
          await seedInitialConversationsIfEmpty(db);
        } catch (seedErr) {
          console.debug('[LocalChatDB] Seed check note:', seedErr);
        }

        resolve(db);
        refreshSyncStatus();
      };

      request.onerror = (event) => {
        console.warn('❌ [LocalChatDB] IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      console.warn('❌ [LocalChatDB] Unexpected exception opening IndexedDB:', err);
      reject(err);
    }
  });

  return indexedDbPromise;
}

/**
 * Populate default seed conversations if local DB is newly created
 */
async function seedInitialConversationsIfEmpty(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();

    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        console.log('🌱 [LocalChatDB] Populating initial local conversation seeds...');
        const writeTx = db.transaction(STORE_NAME, 'readwrite');
        const writeStore = writeTx.objectStore(STORE_NAME);
        
        Object.values(SEED_CONVERSATIONS).forEach((msgs) => {
          msgs.forEach((m) => writeStore.put(m));
        });

        writeTx.oncomplete = () => {
          console.log('✨ [LocalChatDB] Initial conversation seeds populated');
          resolve();
        };
        writeTx.onerror = () => resolve();
      } else {
        resolve();
      }
    };

    countReq.onerror = () => resolve();
  });
}

// LocalStorage Fallback Helpers
function getLocalStorageBackup(): Record<string, LocalChatMessage> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug('LocalStorage read error:', e);
  }
  return {};
}

function saveLocalStorageBackup(data: Record<string, LocalChatMessage>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(data));
  } catch (e) {
    console.debug('LocalStorage write error:', e);
  }
}

/**
 * Save or update a message in the local database
 */
export async function saveMessageToLocalDB(message: LocalChatMessage): Promise<LocalChatMessage> {
  const preparedMsg: LocalChatMessage = {
    ...message,
    createdAt: message.createdAt || Date.now(),
    syncStatus: message.syncStatus || 'pending'
  };

  // Always update LocalStorage backup
  const backup = getLocalStorageBackup();
  backup[preparedMsg.id] = preparedMsg;
  saveLocalStorageBackup(backup);

  try {
    const db = await openLocalChatDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(preparedMsg);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('[LocalChatDB] Saving via LocalStorage fallback:', err);
  }

  // Refresh status and notify subscribers
  await refreshSyncStatus();
  notifyAllSubscribers();

  // If online, immediately initiate background sync with Firebase
  if (typeof navigator !== 'undefined' && navigator.onLine && preparedMsg.syncStatus === 'pending') {
    setTimeout(() => {
      syncPendingMessagesWithFirebase().catch(() => {});
    }, 150);
  }

  return preparedMsg;
}

/**
 * Get all messages for a specific chat ID from the local database
 */
export async function getLocalMessagesForChat(chatId: string): Promise<LocalChatMessage[]> {
  try {
    const db = await openLocalChatDB();
    return new Promise<LocalChatMessage[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('chatId');
      const req = index.getAll(IDBKeyRange.only(chatId));

      req.onsuccess = () => {
        const msgs = (req.result || []) as LocalChatMessage[];
        msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        resolve(msgs);
      };

      req.onerror = () => {
        // Fallback to LocalStorage
        const backup = getLocalStorageBackup();
        const fallbackMsgs = Object.values(backup).filter(m => m.chatId === chatId);
        fallbackMsgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        resolve(fallbackMsgs.length > 0 ? fallbackMsgs : (SEED_CONVERSATIONS[chatId] || []));
      };
    });
  } catch {
    // Fallback to LocalStorage
    const backup = getLocalStorageBackup();
    const fallbackMsgs = Object.values(backup).filter(m => m.chatId === chatId);
    fallbackMsgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return fallbackMsgs.length > 0 ? fallbackMsgs : (SEED_CONVERSATIONS[chatId] || []);
  }
}

/**
 * Get all messages across all conversations from the local database
 */
export async function getAllLocalConversations(): Promise<Record<string, LocalChatMessage[]>> {
  const result: Record<string, LocalChatMessage[]> = {};

  try {
    const db = await openLocalChatDB();
    const allMsgs = await new Promise<LocalChatMessage[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as LocalChatMessage[]);
      req.onerror = () => resolve([]);
    });

    if (allMsgs.length === 0) {
      return SEED_CONVERSATIONS;
    }

    allMsgs.forEach(msg => {
      if (!result[msg.chatId]) result[msg.chatId] = [];
      result[msg.chatId].push(msg);
    });

    // Sort messages in each chat chronologically
    Object.keys(result).forEach(chatId => {
      result[chatId].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    });

    return result;
  } catch {
    const backup = getLocalStorageBackup();
    const fallbackList = Object.values(backup);
    if (fallbackList.length === 0) {
      return SEED_CONVERSATIONS;
    }
    fallbackList.forEach(msg => {
      if (!result[msg.chatId]) result[msg.chatId] = [];
      result[msg.chatId].push(msg);
    });
    return result;
  }
}

/**
 * Retrieve all pending messages that need to be synced with Firebase
 */
export async function getPendingSyncMessages(): Promise<LocalChatMessage[]> {
  try {
    const db = await openLocalChatDB();
    return new Promise<LocalChatMessage[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const req = index.getAll(IDBKeyRange.only('pending'));

      req.onsuccess = () => resolve((req.result || []) as LocalChatMessage[]);
      req.onerror = () => {
        const backup = getLocalStorageBackup();
        resolve(Object.values(backup).filter(m => m.syncStatus === 'pending'));
      };
    });
  } catch {
    const backup = getLocalStorageBackup();
    return Object.values(backup).filter(m => m.syncStatus === 'pending');
  }
}

/**
 * Mark a message's sync status in the local database
 */
export async function updateLocalMessageSyncStatus(
  id: string, 
  status: MessageSyncStatus, 
  errorNote?: string
): Promise<void> {
  const backup = getLocalStorageBackup();
  if (backup[id]) {
    backup[id].syncStatus = status;
    if (status === 'synced') backup[id].syncedAt = Date.now();
    if (errorNote) backup[id].errorNote = errorNote;
    saveLocalStorageBackup(backup);
  }

  try {
    const db = await openLocalChatDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const msg = getReq.result as LocalChatMessage | undefined;
        if (msg) {
          msg.syncStatus = status;
          if (status === 'synced') msg.syncedAt = Date.now();
          if (errorNote) msg.errorNote = errorNote;
          store.put(msg);
        }
        resolve();
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.debug('[LocalChatDB] Status update note:', err);
  }

  await refreshSyncStatus();
  notifyAllSubscribers();
}

/**
 * Core Synchronization Function: Pushes all pending messages to Firebase Firestore
 * Called automatically when online, upon network reconnection, or via manual sync action
 */
export async function syncPendingMessagesWithFirebase(): Promise<{ syncedCount: number; failedCount: number }> {
  if (currentSyncStatus.isSyncing) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    console.log('📡 [LocalChatDB] Device is offline. Queued in local database for auto-sync on reconnect.');
    updateSyncStatusState({ isOnline: false, isSyncing: false });
    return { syncedCount: 0, failedCount: 0 };
  }

  const pendingMessages = await getPendingSyncMessages();
  if (pendingMessages.length === 0) {
    updateSyncStatusState({ isOnline: true, isSyncing: false, pendingCount: 0 });
    return { syncedCount: 0, failedCount: 0 };
  }

  updateSyncStatusState({ isOnline: true, isSyncing: true, pendingCount: pendingMessages.length });
  console.log(`🚀 [LocalChatDB] Synchronizing ${pendingMessages.length} offline chat message(s) with Firebase...`);

  let syncedCount = 0;
  let failedCount = 0;
  let lastErrText: string | null = null;

  for (const msg of pendingMessages) {
    try {
      // 1. Write to top-level chat_messages collection in Firestore
      const msgDocRef = doc(collection(db, 'chat_messages'), msg.id);
      await setDoc(msgDocRef, {
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderName: msg.senderName || 'Parent',
        content: msg.content,
        timestamp: msg.timestamp,
        createdAt: msg.createdAt || Date.now(),
        syncedAt: Date.now()
      }, { merge: true });

      // 2. Also write to nested /chats/{chatId}/messages/{messageId} subcollection for full schema compatibility
      try {
        const subMsgRef = doc(db, 'chats', msg.chatId, 'messages', msg.id);
        await setDoc(subMsgRef, {
          id: msg.id,
          chatId: msg.chatId,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.timestamp
        }, { merge: true });
      } catch (nestedErr) {
        console.debug('[LocalChatDB] Subcollection sync note:', nestedErr);
      }

      // Mark locally as successfully synced
      await updateLocalMessageSyncStatus(msg.id, 'synced');
      syncedCount++;
      console.log(`✅ [LocalChatDB] Synced message "${msg.content.substring(0, 25)}..." to Firebase Firestore`);
    } catch (err: any) {
      console.warn(`⚠️ [LocalChatDB] Error syncing message ${msg.id} to Firebase:`, err);
      lastErrText = err?.message || 'Sync failed';
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
      await updateLocalMessageSyncStatus(msg.id, 'failed', lastErrText || undefined);
      failedCount++;
    }
  }

  updateSyncStatusState({
    isOnline: true,
    isSyncing: false,
    pendingCount: await getPendingCount(),
    lastSyncTimestamp: Date.now(),
    lastSyncError: lastErrText
  });

  return { syncedCount, failedCount };
}

/**
 * Get count of pending unsynced messages
 */
async function getPendingCount(): Promise<number> {
  const pending = await getPendingSyncMessages();
  return pending.length;
}

/**
 * Update internal sync status and notify status listeners
 */
function updateSyncStatusState(patch: Partial<LocalChatSyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...patch };
  syncStatusSubscribers.forEach(cb => {
    try {
      cb(currentSyncStatus);
    } catch (e) {
      console.debug('Status subscriber error:', e);
    }
  });
}

export async function refreshSyncStatus(): Promise<LocalChatSyncStatus> {
  const pending = await getPendingCount();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  updateSyncStatusState({ isOnline, pendingCount: pending });
  return currentSyncStatus;
}

export function getCurrentSyncStatus(): LocalChatSyncStatus {
  return currentSyncStatus;
}

/**
 * Subscribe to local chat sync status changes (online/offline, syncing, pending count)
 */
export function subscribeToChatSyncStatus(callback: (status: LocalChatSyncStatus) => void): () => void {
  syncStatusSubscribers.push(callback);
  callback(currentSyncStatus);
  return () => {
    syncStatusSubscribers = syncStatusSubscribers.filter(cb => cb !== callback);
  };
}

/**
 * Subscribe to conversation data changes
 */
export function subscribeToLocalConversations(
  callback: (conversations: Record<string, LocalChatMessage[]>) => void
): () => void {
  dbSubscribers.push(callback);
  getAllLocalConversations().then(data => callback(data));
  return () => {
    dbSubscribers = dbSubscribers.filter(cb => cb !== callback);
  };
}

async function notifyAllSubscribers() {
  const allConversations = await getAllLocalConversations();
  dbSubscribers.forEach(cb => {
    try {
      cb(allConversations);
    } catch (e) {
      console.debug('Subscriber notification error:', e);
    }
  });
}

// Set up automatic network reconnection listeners
if (typeof window !== 'undefined') {
  // Listen for online event to immediately synchronize with Firebase
  window.addEventListener('online', () => {
    console.log('🌐 [LocalChatDB] Internet connection restored! Auto-synchronizing offline messages with Firebase...');
    updateSyncStatusState({ isOnline: true });
    setTimeout(() => {
      syncPendingMessagesWithFirebase().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          console.log(`🎉 [LocalChatDB] Auto-sync complete: ${syncedCount} message(s) synced to Firebase upon reconnection.`);
        }
      });
    }, 200);
  });

  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('📴 [LocalChatDB] Network connection lost. Chat operating in offline Local Database mode.');
    updateSyncStatusState({ isOnline: false });
  });

  // Periodic check every 30 seconds when online to ensure no pending message stays behind
  setInterval(() => {
    if (navigator.onLine && currentSyncStatus.pendingCount > 0) {
      syncPendingMessagesWithFirebase().catch(() => {});
    }
  }, 30000);
}
