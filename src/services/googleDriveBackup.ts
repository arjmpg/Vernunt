import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth, getGoogleAccessToken, setGoogleAccessToken, triggerGoogleSignIn } from '../utils/firebase.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import { logSecurityThreat } from '../utils/security.ts';
import { ChildProfile, CommunityEvent } from '../types.ts';

export type BackupType = 'MANUAL_PERMANENT' | 'DAILY_ROLLING' | 'FULL_CODEBASE' | 'MASTER_FULL_ARCHIVE';

export interface BackupMetadata {
  version: string;
  backupType: BackupType;
  createdAt: string;
  backupDate: string; // YYYY-MM-DD
  exportedBy: string;
  appName: string;
  isPermanent: boolean;
  note?: string;
  stats: {
    totalDocuments: number;
    usersCount: number;
    eventsCount: number;
    chatsCount: number;
    referralsCount: number;
    bannersCount: number;
    securityLogsCount: number;
    codebaseFilesCount?: number;
    codebaseLinesOfCode?: number;
  };
}

export interface CodebaseFileEntry {
  path: string;
  filename: string;
  extension: string;
  category: string;
  size: number;
  lines: number;
  content: string;
}

export interface CodebaseManifest {
  appName: string;
  version: string;
  exportedAt: string;
  totalFiles: number;
  totalLinesOfCode: number;
  totalBytes: number;
  fileCategories: Record<string, number>;
  nodeVersion: string;
  platform: string;
  summary: string;
}

export interface CodebaseBundle {
  success: boolean;
  manifest: CodebaseManifest;
  files: CodebaseFileEntry[];
}

export interface MasterArchiveSnapshot {
  archiveType: 'MASTER_FULL_APP_AND_CODEBASE';
  createdAt: string;
  version: string;
  appName: string;
  exportedBy: string;
  summary: {
    totalFiles: number;
    totalLinesOfCode: number;
    totalDocuments: number;
  };
  codebase: CodebaseBundle;
  database: FullAppBackupSnapshot;
}

export interface FullAppBackupSnapshot {
  metadata: BackupMetadata;
  database: {
    childProfiles: any[];
    users: any[];
    community_events: any[];
    chats: any[];
    referrals: any[];
    banners: any[];
    security_logs: any[];
    system_config: any[];
  };
  localStorageSnapshot?: Record<string, string>;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  backupType: BackupType;
  isPermanent: boolean;
  note?: string;
  stats?: BackupMetadata['stats'];
  webViewLink?: string;
}

const BACKUP_FOLDER_NAME = 'Vernunt Playdates App Backups - Official';
const OAUTH_CLIENT_ID = (firebaseConfig as any).oAuthClientId || '';

/**
 * Ensures a valid Google Drive access token is available.
 * Tries cached token, Firebase Auth token, or Google Identity Services prompt.
 */
export async function getValidDriveAccessToken(interactive = true): Promise<string> {
  const cached = getGoogleAccessToken();
  if (cached) {
    // Quick probe to check if token is valid
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${cached}` }
      });
      if (res.ok) {
        return cached;
      }
    } catch (e) {
      console.debug('Token probe note:', e);
    }
  }

  if (!interactive) {
    throw new Error('Google Drive is not connected. Please connect your Google Account.');
  }

  // Use Google Identity Services token client for incremental Drive scope
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      // If GIS script is not present, inject it dynamically
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        requestTokenViaGis(resolve, reject);
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
      document.head.appendChild(script);
    } else {
      requestTokenViaGis(resolve, reject);
    }
  });
}

function requestTokenViaGis(resolve: (token: string) => void, reject: (err: any) => void) {
  try {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: OAUTH_CLIENT_ID || '440135393217-b7dorboh9nqi4rh7q4v5jo28bg7susqv.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        if (tokenResponse.access_token) {
          setGoogleAccessToken(tokenResponse.access_token);
          resolve(tokenResponse.access_token);
        } else {
          reject(new Error('No access token received from Google'));
        }
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  } catch (error) {
    reject(error);
  }
}

/**
 * Checks connection status and gets Google user information
 */
export async function getDriveAccountInfo(): Promise<{ email: string; name: string; photo?: string } | null> {
  try {
    const token = await getValidDriveAccessToken(false);
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      email: data.user?.emailAddress || auth.currentUser?.email || '',
      name: data.user?.displayName || auth.currentUser?.displayName || 'Google Drive User',
      photo: data.user?.photoLink || auth.currentUser?.photoURL || ''
    };
  } catch (_) {
    return null;
  }
}

/**
 * Finds or creates the dedicated Vernunt Backup folder in Google Drive
 */
export async function getOrCreateDriveBackupFolder(accessToken: string): Promise<string> {
  // Search for existing folder
  const query = encodeURIComponent(`name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Official backup archive directory for Vernunt Playdates platform data & Firestore collections.'
    })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Drive backup directory: ${err}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Collects a full live snapshot from Firestore collections and local storage state
 */
export async function collectFullAppSnapshot(backupType: BackupType, note?: string): Promise<FullAppBackupSnapshot> {
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  
  // 1. Fetch Firestore Collections safely
  const fetchCollection = async (collName: string) => {
    try {
      const snap = await getDocs(collection(db, collName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn(`Backup: Note reading collection "${collName}":`, err);
      return [];
    }
  };

  const [
    childProfiles,
    users,
    community_events,
    chats,
    referrals,
    banners,
    security_logs,
    system_config
  ] = await Promise.all([
    fetchCollection('childProfiles'),
    fetchCollection('users'),
    fetchCollection('community_events'),
    fetchCollection('chats'),
    fetchCollection('referrals'),
    fetchCollection('banners'),
    fetchCollection('security_logs'),
    fetchCollection('system_config')
  ]);

  // 2. Collect local state fallback
  const localStorageSnapshot: Record<string, string> = {};
  try {
    const keys = [
      'vernunt_user_profile',
      'vernunt_contacts_directory',
      'vernunt_custom_categories',
      'vernunt_platform_settings',
      'vernunt_local_events'
    ];
    keys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) localStorageSnapshot[k] = val;
    });
  } catch (e) {
    console.debug('Local storage collection note:', e);
  }

  const totalDocuments = 
    childProfiles.length + 
    users.length + 
    community_events.length + 
    chats.length + 
    referrals.length + 
    banners.length + 
    security_logs.length + 
    system_config.length;

  const metadata: BackupMetadata = {
    version: '1.0.0',
    backupType,
    createdAt: now.toISOString(),
    backupDate: todayDateStr,
    exportedBy: auth.currentUser?.email || 'admin@vernunt.com',
    appName: 'Vernunt Playdates',
    isPermanent: backupType === 'MANUAL_PERMANENT',
    note: note || (backupType === 'MANUAL_PERMANENT' ? 'Manual Full App Snapshot' : 'Daily Automated Rolling Backup'),
    stats: {
      totalDocuments,
      usersCount: childProfiles.length || users.length,
      eventsCount: community_events.length,
      chatsCount: chats.length,
      referralsCount: referrals.length,
      bannersCount: banners.length,
      securityLogsCount: security_logs.length
    }
  };

  return {
    metadata,
    database: {
      childProfiles,
      users,
      community_events,
      chats,
      referrals,
      banners,
      security_logs,
      system_config
    },
    localStorageSnapshot
  };
}

/**
 * Uploads a file to Google Drive using multipart upload
 */
async function uploadJsonFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  snapshot: FullAppBackupSnapshot,
  isPermanent: boolean
): Promise<any> {
  const fileContent = JSON.stringify(snapshot, null, 2);
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: JSON.stringify({
      backupType: snapshot.metadata.backupType,
      isPermanent,
      createdAt: snapshot.metadata.createdAt,
      backupDate: snapshot.metadata.backupDate,
      totalDocuments: snapshot.metadata.stats.totalDocuments,
      note: snapshot.metadata.note
    }),
    mimeType: 'application/json'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errorTxt = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${errorTxt}`);
  }

  return uploadRes.json();
}

/**
 * 1. MANUAL PERMANENT FULL BACKUP
 * Creates a permanent snapshot that will NEVER be deleted automatically by daily routines.
 */
export async function createManualPermanentBackup(note?: string): Promise<{ file: any; snapshot: FullAppBackupSnapshot }> {
  const accessToken = await getValidDriveAccessToken(true);
  const folderId = await getOrCreateDriveBackupFolder(accessToken);
  const snapshot = await collectFullAppSnapshot('MANUAL_PERMANENT', note);

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Vernunt_MANUAL_PERMANENT_Backup_${timestampStr}.json`;

  const file = await uploadJsonFileToDrive(accessToken, folderId, fileName, snapshot, true);

  // Record security audit log
  await logSecurityThreat(
    'DRIVE_BACKUP_CREATED',
    `Manual Google Drive Permanent Backup Created: ${fileName} (${snapshot.metadata.stats.totalDocuments} documents preserved).`,
    'LOW',
    false
  );

  return { file, snapshot };
}

/**
 * 2. DAILY AUTOMATED ROLLING BACKUP
 * Uploads today's backup and permanently deletes yesterday's / older daily rolling backups.
 */
export async function createDailyRollingBackup(): Promise<{ file: any; snapshot: FullAppBackupSnapshot; purgedFiles: string[] }> {
  const accessToken = await getValidDriveAccessToken(true);
  const folderId = await getOrCreateDriveBackupFolder(accessToken);
  const snapshot = await collectFullAppSnapshot('DAILY_ROLLING');

  const todayStr = snapshot.metadata.backupDate; // YYYY-MM-DD
  const fileName = `Vernunt_DAILY_ROLLING_Backup_${todayStr}.json`;

  // Step A: Upload today's fresh backup
  const file = await uploadJsonFileToDrive(accessToken, folderId, fileName, snapshot, false);

  // Step B: Query Google Drive folder for old daily rolling backups to delete
  const purgedFiles: string[] = [];
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and name contains 'Vernunt_DAILY_ROLLING_Backup_' and trashed = false`);
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (listRes.ok) {
      const data = await listRes.json();
      const files: any[] = data.files || [];

      // Keep only today's new file; delete all previous rolling backups (yesterday, etc.)
      for (const oldFile of files) {
        if (oldFile.id !== file.id) {
          try {
            const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${oldFile.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (delRes.ok || delRes.status === 204) {
              purgedFiles.push(oldFile.name || oldFile.id);
            }
          } catch (delErr) {
            console.warn(`Backup Cleaner: Failed to delete older rolling backup ${oldFile.id}:`, delErr);
          }
        }
      }
    }
  } catch (cleanErr) {
    console.warn('Backup Cleaner: Note during rolling purge cycle:', cleanErr);
  }

  // Update local daily checkpoint
  try {
    localStorage.setItem('vernunt_last_daily_drive_backup_date', todayStr);
    localStorage.setItem('vernunt_last_daily_drive_backup_time', new Date().toISOString());
  } catch (e) {
    console.debug('Checkpoint write note:', e);
  }

  // Record audit log
  await logSecurityThreat(
    'DRIVE_BACKUP_CREATED',
    `Daily Rolling Google Drive Backup Executed: "${fileName}". Purged ${purgedFiles.length} older daily backup(s).`,
    'LOW',
    false
  );

  return { file, snapshot, purgedFiles };
}

/**
 * Lists all existing Vernunt backup files in Google Drive
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const accessToken = await getValidDriveAccessToken(false);
  const folderId = await getOrCreateDriveBackupFolder(accessToken);

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,description,webViewLink)&orderBy=createdTime desc`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve backup list from Google Drive');
  }

  const data = await res.json();
  const rawFiles: any[] = data.files || [];

  return rawFiles.map(f => {
    let parsedDesc: any = {};
    try {
      if (f.description) {
        parsedDesc = JSON.parse(f.description);
      }
    } catch (e) {
      console.debug('Drive description parse note:', e);
    }

    let detectedType: BackupType = 'MANUAL_PERMANENT';
    if (parsedDesc.backupType) {
      detectedType = parsedDesc.backupType;
    } else if (f.name?.includes('FULL_CODEBASE')) {
      detectedType = 'FULL_CODEBASE';
    } else if (f.name?.includes('MASTER_FULL_APP') || f.name?.includes('MASTER_ARCHIVE')) {
      detectedType = 'MASTER_FULL_ARCHIVE';
    } else if (f.name?.includes('DAILY_ROLLING')) {
      detectedType = 'DAILY_ROLLING';
    }

    const isPermanent = parsedDesc.isPermanent ?? (detectedType !== 'DAILY_ROLLING');

    return {
      id: f.id,
      name: f.name,
      size: f.size ? formatBytes(parseInt(f.size, 10)) : 'Unknown',
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
      backupType: detectedType,
      isPermanent,
      note: parsedDesc.note,
      stats: parsedDesc.stats || {
        totalDocuments: parsedDesc.totalDocuments || 0,
        usersCount: 0,
        eventsCount: 0,
        chatsCount: 0,
        referralsCount: 0,
        bannersCount: 0,
        securityLogsCount: 0,
        codebaseFilesCount: parsedDesc.totalFiles,
        codebaseLinesOfCode: parsedDesc.totalLinesOfCode
      },
      webViewLink: f.webViewLink
    };
  });
}

/**
 * Downloads and parses a backup file content from Google Drive
 */
export async function fetchDriveBackupContent(fileId: string): Promise<FullAppBackupSnapshot> {
  const accessToken = await getValidDriveAccessToken(false);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Failed to download backup snapshot from Google Drive');
  }

  return res.json();
}

/**
 * Deletes a specific backup file from Google Drive (Requires explicit confirmation)
 */
export async function deleteDriveBackupFile(fileId: string): Promise<void> {
  const accessToken = await getValidDriveAccessToken(true);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Failed to delete backup file: ${err}`);
  }
}

/**
 * Restores the entire database & local state from a backup snapshot
 */
export async function restoreFullAppFromSnapshot(snapshot: FullAppBackupSnapshot): Promise<{ restoredCount: number; errors: string[] }> {
  const errors: string[] = [];
  let restoredCount = 0;

  if (!snapshot || !snapshot.database) {
    throw new Error('Invalid backup file structure: missing database payload.');
  }

  const collectionsMap: Record<string, any[]> = {
    childProfiles: snapshot.database.childProfiles || [],
    community_events: snapshot.database.community_events || [],
    chats: snapshot.database.chats || [],
    referrals: snapshot.database.referrals || [],
    banners: snapshot.database.banners || [],
    system_config: snapshot.database.system_config || []
  };

  for (const [collName, docs] of Object.entries(collectionsMap)) {
    for (const docData of docs) {
      if (docData && docData.id) {
        try {
          const { id, ...dataWithoutId } = docData;
          await setDoc(doc(db, collName, id), dataWithoutId, { merge: true });
          restoredCount++;
        } catch (err: any) {
          errors.push(`Failed restoring ${collName}/${docData.id}: ${err?.message || err}`);
        }
      }
    }
  }

  // Restore local storage keys if present
  if (snapshot.localStorageSnapshot) {
    try {
      Object.entries(snapshot.localStorageSnapshot).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
    } catch (e) {
      console.debug('Local storage restore note:', e);
    }
  }

  // Record audit log
  await logSecurityThreat(
    'DRIVE_BACKUP_RESTORED',
    `Full Database & App State Restored from Google Drive Backup: Restored ${restoredCount} records from backup dated ${snapshot.metadata.createdAt} (${snapshot.metadata.backupType}).`,
    'HIGH',
    false
  );

  return { restoredCount, errors };
}

/**
 * Fetches the complete source codebase bundle from the backend
 */
export async function fetchCodebaseBundle(): Promise<CodebaseBundle> {
  const res = await fetch('/api/codebase/bundle');
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to bundle codebase: ${errText}`);
  }
  return res.json();
}

/**
 * 3. FULL CODEBASE EXPORT TO GOOGLE DRIVE
 * Packages the entire application source code (components, services, configs, server)
 * and uploads it directly to the user's Google Drive backup folder.
 */
export async function exportCodebaseToGoogleDrive(
  isPermanent: boolean = true,
  note?: string
): Promise<{ file: any; bundle: CodebaseBundle }> {
  const accessToken = await getValidDriveAccessToken(true);
  const folderId = await getOrCreateDriveBackupFolder(accessToken);
  const bundle = await fetchCodebaseBundle();

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Vernunt_FULL_CODEBASE_v1.0.0_${timestampStr}.json`;

  const fileContent = JSON.stringify(bundle, null, 2);
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: JSON.stringify({
      backupType: 'FULL_CODEBASE',
      isPermanent,
      createdAt: bundle.manifest.exportedAt,
      totalFiles: bundle.manifest.totalFiles,
      totalLinesOfCode: bundle.manifest.totalLinesOfCode,
      totalBytes: bundle.manifest.totalBytes,
      note: note || 'Full Codebase Source Snapshot'
    }),
    mimeType: 'application/json'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errorTxt = await uploadRes.text();
    throw new Error(`Google Drive codebase upload failed: ${errorTxt}`);
  }

  const file = await uploadRes.json();

  // Record audit log
  await logSecurityThreat(
    'DRIVE_BACKUP_CREATED',
    `Full Codebase exported to Google Drive: "${fileName}" (${bundle.manifest.totalFiles} files, ${bundle.manifest.totalLinesOfCode} lines of code).`,
    'LOW',
    false
  );

  return { file, bundle };
}

/**
 * 4. MASTER FULL ARCHIVE (CODEBASE + FULL DATABASE STATE)
 * Combines the entire source codebase AND all Firestore collections into a monolithic disaster recovery snapshot.
 */
export async function exportMasterArchiveToGoogleDrive(
  note?: string
): Promise<{ file: any; masterSnapshot: MasterArchiveSnapshot }> {
  const accessToken = await getValidDriveAccessToken(true);
  const folderId = await getOrCreateDriveBackupFolder(accessToken);

  // Fetch both codebase and database simultaneously
  const [bundle, databaseSnapshot] = await Promise.all([
    fetchCodebaseBundle(),
    collectFullAppSnapshot('MANUAL_PERMANENT', note || 'Master Full App & Codebase Snapshot')
  ]);

  const masterSnapshot: MasterArchiveSnapshot = {
    archiveType: 'MASTER_FULL_APP_AND_CODEBASE',
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    appName: 'Vernunt Playdates & Community',
    exportedBy: auth.currentUser?.email || 'admin@vernunt.com',
    summary: {
      totalFiles: bundle.manifest.totalFiles,
      totalLinesOfCode: bundle.manifest.totalLinesOfCode,
      totalDocuments: databaseSnapshot.metadata.stats.totalDocuments
    },
    codebase: bundle,
    database: databaseSnapshot
  };

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Vernunt_MASTER_FULL_APP_AND_CODE_${timestampStr}.json`;

  const fileContent = JSON.stringify(masterSnapshot, null, 2);
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: JSON.stringify({
      backupType: 'MASTER_FULL_ARCHIVE',
      isPermanent: true,
      createdAt: masterSnapshot.createdAt,
      totalFiles: masterSnapshot.summary.totalFiles,
      totalLinesOfCode: masterSnapshot.summary.totalLinesOfCode,
      totalDocuments: masterSnapshot.summary.totalDocuments,
      note: note || 'Master Full App & Codebase Disaster Recovery Snapshot'
    }),
    mimeType: 'application/json'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errorTxt = await uploadRes.text();
    throw new Error(`Google Drive master upload failed: ${errorTxt}`);
  }

  const file = await uploadRes.json();

  // Record audit log
  await logSecurityThreat(
    'DRIVE_BACKUP_CREATED',
    `Master Archive exported to Google Drive: "${fileName}" (${bundle.manifest.totalFiles} code files, ${databaseSnapshot.metadata.stats.totalDocuments} database records).`,
    'LOW',
    false
  );

  return { file, masterSnapshot };
}

/**
 * Export codebase bundle as local JSON download
 */
export function downloadCodebaseLocally(bundle: CodebaseBundle, filename?: string) {
  const fname = filename || `Vernunt_Codebase_v1.0.0_${new Date().toISOString().slice(0, 10)}.json`;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fname);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export master archive as local JSON download
 */
export function downloadMasterArchiveLocally(archive: MasterArchiveSnapshot, filename?: string) {
  const fname = filename || `Vernunt_MASTER_APP_AND_CODE_${new Date().toISOString().slice(0, 10)}.json`;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archive, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fname);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export backup as local JSON download
 */
export function downloadBackupLocally(snapshot: FullAppBackupSnapshot, filename: string) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
