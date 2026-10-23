import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export interface EmailOtpResponse {
  success: boolean;
  message: string;
  previewUrl?: string;
  expiresInSeconds?: number;
  firebaseLinkSent?: boolean;
  error?: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  error?: string;
}

export interface NotificationEmailPayload {
  toEmail: string;
  recipientName?: string;
  type:
    | 'playdate_request'
    | 'event_ticket'
    | 'shop_order'
    | 'product_purchase'
    | 'payment_receipt'
    | 'product_shipped'
    | 'product_out_for_delivery'
    | 'product_delivered'
    | 'product_cancelled'
    | 'profile_approved'
    | 'specialist_booking'
    | 'emergency_sos'
    | 'general';
  subject?: string;
  details?: Record<string, any>;
  customMessage?: string;
  callToAction?: { label: string; url: string };
}

/**
 * 1. Dual-Channel Firebase Email OTP Dispatcher:
 * - Dispatches 6-digit verification code via backend engine (saved to Firestore `email_otps` & `mail` queue)
 * - Concurrently invokes Firebase Auth `sendSignInLinkToEmail` for Google-delivered passwordless login
 */
export async function sendFirebaseEmailOtp(
  email: string,
  userName?: string,
  role: string = 'Parent'
): Promise<EmailOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      success: false,
      message: 'Please provide a valid email address.',
      error: 'Invalid email address'
    };
  }

  let backendSuccess = false;
  let previewUrl: string | undefined;
  let backendMessage = '';
  let firebaseLinkSent = false;

  // A. Dispatch backend 6-digit OTP code (recorded in Firestore + dispatched via Nodemailer)
  try {
    const resp = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, userName, role })
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data.success) {
      backendSuccess = true;
      backendMessage = data.message;
      previewUrl = data.previewUrl;
    } else {
      backendMessage = data.error || 'Failed to dispatch verification code';
    }
  } catch (err: any) {
    console.warn('[FirebaseEmailAuth] Backend dispatch network note:', err);
  }

  // B. Concurrently trigger Native Firebase Auth passwordless sign-in email
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}/?emailAuth=true&email=${encodeURIComponent(cleanEmail)}`,
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
    window.localStorage.setItem('vernunt_email_for_sign_in', cleanEmail);
    firebaseLinkSent = true;
    console.log(`[FirebaseEmailAuth] Native Firebase Auth sign-in link sent to ${cleanEmail}`);
  } catch (fbAuthErr: any) {
    // If domain isn't authorized or offline, non-blocking fallback
    console.debug('[FirebaseEmailAuth] Native Firebase email link notice:', fbAuthErr?.message || fbAuthErr);
  }

  // C. Also write directly to Firestore client collections if online
  try {
    if (db) {
      await addDoc(collection(db, 'email_notifications'), {
        recipient: cleanEmail,
        type: 'email_otp_request',
        role,
        timestamp: new Date().toISOString()
      });
    }
  } catch (dbErr) {
    console.debug('[FirebaseEmailAuth] Client Firestore log note:', dbErr);
  }

  return {
    success: backendSuccess || firebaseLinkSent,
    message: backendMessage || `✓ Verification email dispatched to ${cleanEmail}. Check your inbox or spam folder.`,
    previewUrl,
    firebaseLinkSent,
    expiresInSeconds: 600
  };
}

/**
 * 2. Verify 6-Digit Email OTP Code
 */
export async function verifyFirebaseEmailOtp(
  email: string,
  otpCode: string
): Promise<EmailVerificationResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otpCode.trim();

  if (!cleanEmail || !cleanOtp) {
    return {
      success: false,
      verified: false,
      message: 'Email address and 6-digit verification code are required.'
    };
  }

  try {
    const resp = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
    });
    const data = await resp.json().catch(() => ({}));

    if (resp.ok && (data.success || data.verified)) {
      return {
        success: true,
        verified: true,
        message: '✓ Email address verified successfully!'
      };
    } else {
      return {
        success: false,
        verified: false,
        message: data.error || 'Invalid 6-digit code. Please check your email and try again.',
        error: data.error
      };
    }
  } catch (err: any) {
    console.warn('[FirebaseEmailAuth] Verify OTP network error:', err);
    return {
      success: false,
      verified: false,
      message: 'Network error verifying email code. Please try again.',
      error: err.message || String(err)
    };
  }
}

/**
 * 3. Automatic Check & Sign-in when user opens Firebase Email Link
 */
export async function checkAndCompleteEmailLinkSignIn(
  onSuccess?: (user: any) => void
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('vernunt_email_for_sign_in');
      if (!email) {
        // Prompt user for confirmation if missing from localStorage
        const urlParams = new URLSearchParams(window.location.search);
        email = urlParams.get('email') || window.prompt('Please confirm your email address for sign-in:');
      }

      if (email) {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('vernunt_email_for_sign_in');
        console.log('[FirebaseEmailAuth] ✓ Successfully signed in via Firebase Email Link:', result.user.email);
        if (onSuccess) {
          onSuccess(result.user);
        }
        // Clean URL parameter
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        return true;
      }
    }
  } catch (err: any) {
    console.warn('[FirebaseEmailAuth] Complete email link sign-in error:', err);
  }
  return false;
}

/**
 * 4. Dispatch Email Notification Across App Modules
 * (Playdate requests, Event pass delivery, Shop order confirmation, SOS alerts)
 */
export async function dispatchEmailNotification(payload: NotificationEmailPayload): Promise<boolean> {
  try {
    const cleanTo = payload.toEmail.trim().toLowerCase();
    if (!cleanTo || !cleanTo.includes('@')) return false;

    // A. Dispatch via Backend API (triggers HTML email via Nodemailer & Firestore Trigger Email)
    const resp = await fetch('/api/notifications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // B. Record in Client Firestore `mail` collection (Firebase Trigger Email Extension format)
    if (db) {
      try {
        await addDoc(collection(db, 'mail'), {
          to: [cleanTo],
          message: {
            subject: payload.subject || 'Vernunt Notification',
            text: payload.customMessage || 'You have a new update on Vernunt.'
          },
          type: payload.type,
          details: payload.details || {},
          timestamp: new Date().toISOString()
        });
      } catch (fbErr) {
        console.debug('[FirebaseEmailAuth] Client mail collection write notice:', fbErr);
      }
    }

    return resp.ok;
  } catch (err: any) {
    console.warn('[FirebaseEmailAuth] Notification dispatch notice:', err);
    return false;
  }
}

/**
 * 5. Specialized Store & Marketplace Order Email Dispatcher
 */
export async function sendOrderEmailNotification(options: {
  order: any;
  notificationType: 'purchase' | 'payment_receipt' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  cancellationReason?: string;
  refundInfo?: any;
  details?: Record<string, any>;
}): Promise<{ success: boolean; message: string; previewUrl?: string }> {
  try {
    const { order, notificationType, cancellationReason, refundInfo, details } = options;
    const recipient = order.customerEmail || order.shippingAddress?.email;
    if (!recipient || !recipient.includes('@')) {
      return { success: false, message: 'Invalid recipient email address on order.' };
    }

    // Call dedicated server order email endpoint
    const resp = await fetch('/api/store/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order,
        notificationType,
        cancellationReason,
        refundInfo,
        details
      })
    });

    const data = await resp.json().catch(() => ({}));

    // Also mirror to client Firestore `email_notifications`
    if (db) {
      try {
        await addDoc(collection(db, 'email_notifications'), {
          recipient: recipient.trim().toLowerCase(),
          type: `order_${notificationType}`,
          orderId: order.orderNumber || order.id,
          totalAmount: order.totalAmount,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.debug('[FirebaseEmailAuth] Firestore notification mirror note:', e);
      }
    }

    if (resp.ok && data.success) {
      return {
        success: true,
        message: data.message || `✓ Notification email sent to ${recipient}.`,
        previewUrl: data.previewUrl
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to dispatch order email notification.'
      };
    }
  } catch (err: any) {
    console.warn('[FirebaseEmailAuth] Send order email network notice:', err);
    return {
      success: false,
      message: err.message || 'Network error triggering order notification.'
    };
  }
}

/**
 * Convenience helper: Product Purchase Order Confirmation Email
 */
export async function sendProductPurchaseEmail(order: any, details?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'purchase', details });
}

/**
 * Convenience helper: Official Payment Receipt & Tax Invoice Email
 */
export async function sendProductPaymentReceiptEmail(order: any, details?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'payment_receipt', details });
}

/**
 * Convenience helper: Product Dispatched / Courier Shipped Email
 */
export async function sendProductShippedEmail(order: any, details?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'shipped', details });
}

/**
 * Convenience helper: Product Out for Delivery Email
 */
export async function sendProductOutForDeliveryEmail(order: any, details?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'out_for_delivery', details });
}

/**
 * Convenience helper: Product Delivered Confirmation Email
 */
export async function sendProductDeliveredEmail(order: any, details?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'delivered', details });
}

/**
 * Convenience helper: Product Cancelled & Refund Notification Email
 */
export async function sendProductCancelledEmail(order: any, cancellationReason?: string, refundInfo?: any) {
  return sendOrderEmailNotification({ order, notificationType: 'cancelled', cancellationReason, refundInfo });
}
