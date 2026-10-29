/**
 * ============================================================================
 * CASHFREE OFFICIAL JS SDK WEB CHECKOUT (v3)
 * ============================================================================
 * Reference: https://www.cashfree.com/devstudio/preview/pg/web/checkout
 * Official Documentation: https://www.cashfree.com/docs/api-reference/payments/overview
 * Official Script: https://sdk.cashfree.com/js/v3/cashfree.js
 *
 * Implements:
 * function initiateCheckout() {
 *     const cashfree = Cashfree({
 *         "mode": "sandbox"
 *     });
 *     cashfree.checkout({
 *         paymentSessionId: "your-payment-session-id",
 *         redirectTarget: "_modal"
 *     });
 * }
 * ============================================================================
 */

let cashfreeSdkPromise: Promise<boolean> | null = null;

export async function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ((window as any).Cashfree) {
    return true;
  }

  if (cashfreeSdkPromise) {
    return cashfreeSdkPromise;
  }

  cashfreeSdkPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector('script[src*="cashfree.js"]');
    if (existing) {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Cashfree SDK] Failed to load https://sdk.cashfree.com/js/v3/cashfree.js');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return cashfreeSdkPromise;
}

export interface InitiateCheckoutParams {
  paymentSessionId: string;
  mode?: 'sandbox' | 'production';
  redirectTarget?: '_modal' | '_self' | '_blank';
}

/**
 * Official Cashfree DevStudio Web Checkout Initializer
 * Usage:
 * function initiateCheckout(){
 *     const cashfree = Cashfree({
 *         "mode":"sandbox"
 *     });
 *     cashfree.checkout({
 *         paymentSessionId: "your-payment-session-id",
 *         redirectTarget: "_modal"
 *     });
 * }
 */
export function initiateCheckout({
  paymentSessionId,
  mode = 'sandbox',
  redirectTarget = '_modal'
}: InitiateCheckoutParams) {
  if (typeof (window as any).Cashfree !== 'function') {
    throw new Error('Cashfree JS SDK is not loaded on window.');
  }

  const cashfree = (window as any).Cashfree({
    mode
  });

  return cashfree.checkout({
    paymentSessionId,
    redirectTarget
  });
}

export interface LaunchCashfreeCheckoutOptions {
  paymentSessionId: string;
  orderId: string;
  isProd?: boolean;
  amount?: number;
  currency?: string;
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: any) => void;
  onPending?: (paymentDetails: any) => void;
  onClose?: () => void;
}

/**
 * High-level checkout invoker that handles script bootstrapping,
 * invokes initiateCheckout, and wires up success, failure, and close listeners.
 */
export async function launchCashfreeCheckout({
  paymentSessionId,
  orderId,
  isProd = false,
  amount,
  currency = 'INR',
  onSuccess,
  onFailure,
  onClose
}: LaunchCashfreeCheckoutOptions): Promise<void> {
  if (!paymentSessionId) {
    onFailure(new Error('Missing valid payment session ID. Please try again.'));
    return;
  }

  // Ensure official Cashfree SDK is loaded
  const isLoaded = await loadCashfreeScript();
  if (!isLoaded || typeof (window as any).Cashfree !== 'function') {
    onFailure(new Error('Failed to load official Cashfree SDK. Please check your internet connection.'));
    return;
  }

  try {
    const mode: 'sandbox' | 'production' = isProd ? 'production' : 'sandbox';
    console.log(`[Cashfree Checkout] Launching official modal checkout for order ${orderId} in ${mode} mode...`);

    const checkoutPromise = initiateCheckout({
      paymentSessionId,
      mode,
      redirectTarget: '_modal'
    });

    if (checkoutPromise && typeof checkoutPromise.then === 'function') {
      checkoutPromise
        .then((result: any) => {
          console.log('[Cashfree Checkout Result]:', result);
          if (result?.error) {
            console.warn('[Cashfree Modal Result Error]:', result.error);
            onFailure(result.error);
          } else if (result?.redirect) {
            console.log('[Cashfree Modal Redirect Initiated]');
          } else if (result?.paymentDetails) {
            console.log('[Cashfree Modal Payment Completed]:', result.paymentDetails);
            onSuccess(result.paymentDetails);
          } else {
            // Modal was closed by user
            if (onClose) onClose();
          }
        })
        .catch((checkoutErr: any) => {
          console.warn('[Cashfree Checkout Exception]:', checkoutErr);
          onFailure(checkoutErr);
        });
    }
  } catch (err: any) {
    console.error('[Cashfree Initiate Checkout Exception]:', err);
    onFailure(err);
  }
}
