import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize core Firebase elements
const app = initializeApp(firebaseConfig);

// CRITICAL: Prevent passing undefined to getFirestore, fallback to default database
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure scopes required for Workspace / Google Chat & Google Drive integration
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory & local cache for Google OAuth Access Token
let cachedAccessToken: string | null = null;
try {
  cachedAccessToken = localStorage.getItem('vernunt_google_oauth_token');
} catch (e) {
  console.debug('Token read cache note:', e);
}

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function setGoogleAccessToken(token: string | null) {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('vernunt_google_oauth_token', token);
    } else {
      localStorage.removeItem('vernunt_google_oauth_token');
    }
  } catch (e) {
    console.debug('Token write cache note:', e);
  }
}

// Clear token on sign out
auth.onAuthStateChanged((user) => {
  if (!user) {
    setGoogleAccessToken(null);
  }
});

// Standard login popup trigger
export async function triggerGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // Explicitly identify and handle unauthorized domain errors (for popups, reCAPTCHA, and general auth)
    if (
      errorCode === 'auth/unauthorized-domain' ||
      errorMessage.includes('unauthorized-domain') ||
      errorMessage.includes('unauthorized domain') ||
      errorMessage.includes('auth/unauthorized-domain')
    ) {
      const detailedDiagnostic = `
🚨 FIREBASE AUTHENTICATION ERROR: UNAUTHORIZED DOMAIN DETECTED 🚨
------------------------------------------------------------------
The current domain "${currentDomain}" has not been authorized in your Firebase Project Console.

TO FIX THIS ERROR:
1. Open the Firebase Console (https://console.firebase.google.com).
2. Select your project (with Project ID: "${firebaseConfig.projectId}").
3. Go to "Authentication" in the left sidebar menu.
4. Click on the "Settings" tab at the top.
5. In the left sub-menu, click "Authorized Domains".
6. Click the "Add domain" button.
7. Enter this exact domain name:
   👉   ${currentDomain}
8. Click "Add" to save your selection.

Note: The primary default application URL is https://app.vernunt.com (app.vernunat.com) deployed on the Asia East (asia-east1) primary region (Asia South deleted/deprecated). Ensure app.vernunt.com and active hostnames are added to your Authorized Domains list!
------------------------------------------------------------------
`;
      console.error(detailedDiagnostic);
      throw new Error(detailedDiagnostic);
    }

    // Handle standard initialization/operation-not-allowed mismatch errors
    if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
      const providerDiagnostic = `
🚨 FIREBASE AUTHENTICATION ERROR: PROVIDER NOT ENABLED 🚨
------------------------------------------------------------------
Google Sign-In or Phone/Email Provider is not enabled in your Firebase Project configuration.

TO FIX THIS ERROR:
1. Open the Firebase Console.
2. Go to "Authentication" -> "Sign-in method" tab.
3. Enable the "Google" provider (and "Phone"/"Email" if utilized) under the Native providers list.
4. Save the configuration changes.
------------------------------------------------------------------
`;
      console.error(providerDiagnostic);
      throw new Error(providerDiagnostic);
    }
    
    throw error;
  }
}

// Connection test on boot:
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn("Firebase Connection check warning (expected in offline sandbox):", errorMsg);
  }
}
testConnection();

// Error structures
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || '';
  const isPermissionDenied = code === 'permission-denied' || msg.toLowerCase().includes('permission-denied') || msg.toLowerCase().includes('insufficient permissions');

  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionDenied) {
    console.error('Firestore Error Occurred (Permission Denied):', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Non-Fatal Error (e.g. offline/network):', JSON.stringify(errInfo));
  }
}
