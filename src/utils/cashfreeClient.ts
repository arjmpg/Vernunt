/**
 * ============================================================================
 * CASHFREE PAYMENTS JAVASCRIPT SDK LOADER & CHECKOUT CONTROLLER
 * ============================================================================
 * Official SDK: https://sdk.cashfree.com/js/v3/cashfree.js
 * 
 * Production-ready Cashfree SDK controller.
 * Directly launches real Cashfree Modal Checkout with error handling and callbacks.
 * Never displays simulated sandbox overlays.
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
    // Check if script already exists in DOM
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
    script.onload = () => {
      console.log('✓ Cashfree Payments Web SDK successfully initialized.');
      resolve(true);
    };
    script.onerror = (err) => {
      console.error('Failed to load Cashfree SDK script:', err);
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return cashfreeSdkPromise;
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
 * Launches Real Cashfree SDK Checkout in production mode.
 */
export async function launchCashfreeCheckout({
  paymentSessionId,
  orderId,
  isProd = true,
  amount,
  currency = 'INR',
  onSuccess,
  onFailure,
  onPending,
  onClose
}: LaunchCashfreeCheckoutOptions) {
  if (!paymentSessionId) {
    onFailure(new Error('Missing valid payment session ID. Please try again.'));
    return;
  }

  // Load Real Cashfree JavaScript SDK v3
  const isLoaded = await loadCashfreeScript();

  if (isLoaded && (window as any).Cashfree) {
    try {
      // Determine production vs sandbox mode based on live keys (defaults to production)
      const cashfree = (window as any).Cashfree({
        mode: isProd ? 'production' : 'sandbox'
      });

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal' // Opens real responsive Cashfree modal checkout
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result?.error) {
          console.error('[Cashfree Checkout SDK Error]', result.error);
          onFailure(new Error(result.error.message || 'Payment could not be completed. Please try again.'));
          if (onClose) onClose();
        } else if (result?.redirect) {
          console.log('[Cashfree Checkout Redirecting]');
        } else if (result?.paymentDetails) {
          console.log('[Cashfree Payment Details]', result.paymentDetails);
          onSuccess(result.paymentDetails);
        } else {
          // Modal was dismissed or closed by user
          if (onClose) onClose();
        }
      }).catch((checkoutErr: any) => {
        console.error('[Cashfree Checkout Exception]', checkoutErr);
        onFailure(checkoutErr instanceof Error ? checkoutErr : new Error('Checkout encountered an error. Please try again.'));
        if (onClose) onClose();
      });
      return;
    } catch (e: any) {
      console.error('[Cashfree SDK Initialization Exception]', e);
      onFailure(new Error(e?.message || 'Failed to initialize Cashfree checkout.'));
      return;
    }
  }

  onFailure(new Error('Unable to connect to Cashfree Payments SDK. Please check your network connection and try again.'));
}
