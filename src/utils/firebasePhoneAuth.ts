import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase.ts';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export interface SendOtpResult {
  success: boolean;
  method: 'firebase_phone_auth' | 'firebase_firestore_otp';
  confirmationResult?: ConfirmationResult;
  message: string;
}

export interface VerifyOtpResult {
  success: boolean;
  userId?: string;
  phone: string;
  message: string;
}

/**
 * Initializes or reuses an invisible RecaptchaVerifier for Firebase Phone Auth
 */
export function getOrCreateRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;

  try {
    // Clear and dispose of any previous verifier
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.debug('Recaptcha clear note:', e);
      }
      delete (window as any).recaptchaVerifier;
    }

    let container = document.getElementById(containerId);
    if (container) {
      // Empty container completely so grecaptcha doesn't complain "Placeholder element must be empty"
      container.innerHTML = '';
    } else {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] reCAPTCHA token expired');
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            delete (window as any).recaptchaVerifier;
          }
        } catch {
          // ignore
        }
      }
    });

    return window.recaptchaVerifier;
  } catch (err) {
    console.warn('[Firebase RecaptchaVerifier] Init notice:', err);
    return null;
  }
}

/**
 * Sends OTP using Firebase Phone Authentication with graceful fallback to Firestore-backed SMS verification.
 * NEVER exposes the OTP code to the client UI/screen.
 */
export async function sendFirebaseOtp(
  rawPhone: string, 
  role: string = 'Parent',
  containerId: string = 'recaptcha-container'
): Promise<SendOtpResult> {
  const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
  if (cleanDigits.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }
  const fullPhone = `+91${cleanDigits}`;

  // Reset active confirmationResult so resend starts a fresh verification session
  window.confirmationResult = undefined;

  // 1. Try Firebase Auth Native Phone Provider with invisible reCAPTCHA
  try {
    const verifier = getOrCreateRecaptchaVerifier(containerId);
    if (verifier) {
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, verifier);
      window.confirmationResult = confirmationResult;
      
      // Also register OTP session record in Firestore `otp_verifications` collection
      try {
        await setDoc(doc(db, 'otp_verifications', cleanDigits), {
          phoneNumber: fullPhone,
          cleanPhone: cleanDigits,
          role,
          provider: 'firebase_auth',
          status: 'pending',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.debug('[Firestore otp_verifications log]:', fsErr);
      }

      return {
        success: true,
        method: 'firebase_phone_auth',
        confirmationResult,
        message: `✓ 6-digit verification code sent via SMS to ${fullPhone}. Please enter it below.`
      };
    }
  } catch (firebaseAuthErr: any) {
    console.info('[Firebase Auth Native Phone Provider]: Falling back to Firestore-backed verification', firebaseAuthErr?.code || firebaseAuthErr);
  }

  // 2. Fallback to Firebase Firestore & Server SMS Gateway
  const res = await fetch('/api/auth/send-sms-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: fullPhone,
      role,
      purpose: 'firebase_phone_verification'
    })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Failed to dispatch SMS OTP. Please check your number and retry.');
  }

  // Sync verification token/session in Firestore
  try {
    await setDoc(doc(db, 'otp_verifications', cleanDigits), {
      phoneNumber: fullPhone,
      cleanPhone: cleanDigits,
      role,
      provider: 'firestore_gateway',
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    }, { merge: true });
  } catch (fsErr) {
    console.debug('[Firestore otp_verifications log]:', fsErr);
  }

  return {
    success: true,
    method: 'firebase_firestore_otp',
    message: `✓ 6-digit verification code sent via SMS to ${fullPhone}. Please enter it below.`
  };
}

/**
 * Verifies OTP using Firebase confirmationResult or Firestore OTP verification.
 * Validates the user's input without displaying or pre-filling OTP on screen.
 */
export async function verifyFirebaseOtp(
  rawPhone: string,
  enteredOtp: string,
  confirmationResult?: ConfirmationResult | null,
  role: string = 'Parent',
  name?: string
): Promise<VerifyOtpResult> {
  const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
  const fullPhone = `+91${cleanDigits}`;
  const trimmedOtp = enteredOtp.replace(/\D/g, '').slice(0, 6);

  if (!trimmedOtp || trimmedOtp.length !== 6) {
    throw new Error('Please enter the 6-digit verification code received on your phone.');
  }

  // A. If Firebase Auth ConfirmationResult is active, verify via Firebase Auth
  const activeConfirmation = confirmationResult || window.confirmationResult;
  if (activeConfirmation) {
    try {
      const userCredential = await activeConfirmation.confirm(trimmedOtp);
      const uid = userCredential.user.uid;

      // Update Firestore verification record
      try {
        await setDoc(doc(db, 'otp_verifications', cleanDigits), {
          status: 'verified',
          verifiedAt: serverTimestamp(),
          verifiedUid: uid
        }, { merge: true });
      } catch {
        // non-blocking
      }

      return {
        success: true,
        userId: uid,
        phone: fullPhone,
        message: '✓ Mobile number successfully verified via Firebase.'
      };
    } catch (fbConfirmErr: any) {
      console.warn('[Firebase confirm error]:', fbConfirmErr?.code || fbConfirmErr);
      if (fbConfirmErr?.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please click Resend Code to receive a new one.');
      }
      
      // Attempt backend fallback before failing if session mismatch occurred
      try {
        const fallbackRes = await fetch('/api/auth/verify-sms-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullPhone,
            otp: trimmedOtp,
            role,
            name
          })
        });
        const fallbackData = await fallbackRes.json().catch(() => null);
        if (fallbackRes.ok && fallbackData?.success) {
          return {
            success: true,
            userId: fallbackData.token || `user-${cleanDigits}`,
            phone: fullPhone,
            message: '✓ Mobile number successfully verified.'
          };
        }
      } catch {
        // continue
      }

      if (fbConfirmErr?.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please check your SMS messages and re-enter.');
      }
      throw new Error(fbConfirmErr?.message || 'Verification failed. Please retry.');
    }
  }

  // B. Verify via Firestore / Backend OTP Verification Engine
  const res = await fetch('/api/auth/verify-sms-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: fullPhone,
      otp: trimmedOtp,
      role,
      name
    })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Incorrect verification code. Please check your SMS and try again.');
  }

  // Mark Firestore doc as verified
  try {
    await setDoc(doc(db, 'otp_verifications', cleanDigits), {
      status: 'verified',
      verifiedAt: serverTimestamp()
    }, { merge: true });
  } catch {
    // non-blocking
  }

  return {
    success: true,
    phone: fullPhone,
    message: '✓ Mobile number successfully verified.'
  };
}
