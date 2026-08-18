import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize core Firebase elements
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust connection settings (auto-detect long-polling for iframe/proxy environments)
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  // Fallback to standard getFirestore if already initialized
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Standard Google Authentication Provider for Login & Identity
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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

// Standard login popup trigger with fallback handling and clean provider initialization
export async function triggerGoogleSignIn() {
  try {
    // Create dedicated provider instance with prompt to ensure Google Account selector displays
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      setGoogleAccessToken(credential.accessToken);
    }
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // User closed popup deliberately or cancelled - return null gracefully without displaying error
    if (
      errorCode === 'auth/popup-closed-by-user' || 
      errorCode === 'auth/cancelled-popup-request' ||
      errorMessage.includes('popup-closed-by-user') ||
      errorMessage.includes('cancelled')
    ) {
      console.log('Google login window closed or cancelled by user.');
      return null;
    }

    console.error('Google Sign-In error:', error);

    // Popup blocked by browser popup blocker
    if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
      const popupBlockErr = new Error('The Google login popup was blocked by your browser. Please allow popups for this site or open in a new tab.');
      (popupBlockErr as any).code = 'auth/popup-blocked';
      throw popupBlockErr;
    }

    // Explicitly identify and handle unauthorized domain errors (for popups, reCAPTCHA, and general auth)
    if (
      errorCode === 'auth/unauthorized-domain' ||
      errorMessage.includes('unauthorized-domain') ||
      errorMessage.includes('unauthorized domain') ||
      errorMessage.includes('auth/unauthorized-domain')
    ) {
      const detailedDiagnostic = `
🚨 FIREBASE AUTHENTICATION: UNAUTHORIZED DOMAIN DETECTED 🚨
------------------------------------------------------------------
The current domain "${currentDomain}" has not been added to your Authorized Domains in Firebase Authentication.

TO FIX IN 1 MINUTE:
1. Open the Firebase Console (https://console.firebase.google.com).
2. Select your project: "${firebaseConfig.projectId}".
3. Go to "Authentication" in the left sidebar menu -> Click the "Settings" tab at the top.
4. In the left sub-menu, click "Authorized Domains".
5. Click "Add domain" and enter:
   👉   ${currentDomain}
6. Also make sure "app.vernunt.com" and "vernunt.com" are listed.
7. Click "Add" to save.
------------------------------------------------------------------
`;
      console.error(detailedDiagnostic);
      const domainErr = new Error(`Domain "${currentDomain}" is not in Firebase Authorized Domains. Add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      (domainErr as any).code = 'auth/unauthorized-domain';
      (domainErr as any).diagnostic = detailedDiagnostic;
      throw domainErr;
    }

    // Handle standard initialization/operation-not-allowed mismatch errors
    if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
      const providerDiagnostic = `
🚨 FIREBASE AUTHENTICATION: GOOGLE PROVIDER NOT ENABLED 🚨
------------------------------------------------------------------
Google Sign-In is not enabled in your Firebase Project configuration.

TO FIX:
1. Open Firebase Console -> "Authentication" -> "Sign-in method" tab.
2. Click on "Google" under Sign-in providers.
3. Toggle "Enable", configure project support email, and click Save.
------------------------------------------------------------------
`;
      console.error(providerDiagnostic);
      const opErr = new Error('Google Sign-In is not enabled in your Firebase Project Console. Please enable "Google" under Authentication -> Sign-in method.');
      (opErr as any).code = 'auth/operation-not-allowed';
      throw opErr;
    }
    
    throw error;
  }
}

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
