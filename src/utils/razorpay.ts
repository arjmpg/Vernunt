/**
 * Razorpay Standard Web Checkout Client Utility
 */

export interface RazorpayOrderResponse {
  success: boolean;
  order_id: string;
  id?: string;
  amount: number; // in paise
  currency: string;
  receipt?: string;
  status?: string;
  error?: string;
  details?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  order_id?: string;
  payment_id?: string;
  error?: string;
  details?: string;
}

export interface RazorpayCheckoutOptions {
  amountInPaise: number; // minimum 100 paise (₹1.00)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  themeColor?: string;
  name?: string;
  description?: string;
  image?: string;
  onSuccess: (verifyResult: RazorpayVerifyResponse, paymentResponse: RazorpaySuccessResponse) => void;
  onError?: (error: Error | { code?: string; description?: string; source?: string; step?: string; reason?: string }) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Load Razorpay Checkout.js script dynamically if not already present on page
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag exists
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Retrieve public Razorpay Key ID (never secret) from Vite env or server API
 */
export async function getRazorpayKeyId(): Promise<string> {
  // 1. Check Vite frontend environment variable
  const viteKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (viteKey && viteKey.trim()) {
    return viteKey.trim();
  }

  // 2. Fallback: fetch from server config endpoint
  try {
    const res = await fetch('/api/razorpay-config');
    if (res.ok) {
      const data = await res.json();
      if (data.key_id) {
        return data.key_id;
      }
    }
  } catch (err) {
    console.debug('[Razorpay] Server config fetch note:', err);
  }

  // 3. Fallback default test key from configuration
  return 'rzp_test_TuCXnPNjkAvczu';
}

/**
 * Create order on backend (POST /api/create-order)
 */
export async function createRazorpayOrder(
  amountInPaise: number,
  currency: string = 'INR',
  receipt?: string,
  notes?: Record<string, string>
): Promise<RazorpayOrderResponse> {
  if (amountInPaise < 100) {
    throw new Error('Order amount must be at least 100 paise (₹1.00)');
  }

  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.details || 'Failed to create Razorpay order');
  }

  return data;
}

/**
 * Verify payment signature on backend (POST /api/verify-payment)
 */
export async function verifyRazorpayPayment(
  paymentData: RazorpaySuccessResponse
): Promise<RazorpayVerifyResponse> {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Payment signature verification failed. Payment was not recorded as paid.');
  }

  return data;
}

/**
 * Execute full Razorpay Standard Web Checkout lifecycle
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  try {
    // 1. Ensure Razorpay SDK script is loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error('Unable to load Razorpay Checkout script. Please check your internet connection.');
    }

    // 2. Fetch public Key ID
    const keyId = await getRazorpayKeyId();
    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured.');
    }

    // 3. Create Order on backend
    const orderData = await createRazorpayOrder(
      options.amountInPaise,
      options.currency || 'INR',
      options.receipt,
      options.notes
    );

    if (!orderData || !orderData.order_id) {
      throw new Error(orderData.error || 'Could not initiate order with payment gateway.');
    }

    // 4. Construct Razorpay Modal Options
    const rzpOptions = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: options.name || 'Vernunt - Kids ECD Platform',
      description: options.description || 'Montessori Gear, Events & Child Development',
      image: options.image || '/icon.svg',
      order_id: orderData.order_id,
      prefill: {
        name: options.customer?.name || '',
        email: options.customer?.email || '',
        contact: options.customer?.contact || '',
      },
      notes: {
        ...options.notes,
        source: 'Vernunt Standard Web Checkout',
      },
      theme: {
        color: options.themeColor || '#be123c', // Vernunt Rose Brand color
      },
      modal: {
        ondismiss: () => {
          console.log('[Razorpay] Customer dismissed payment modal');
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          console.log('[Razorpay] Payment successful on frontend. Verifying signature on server...', response);
          
          // STEP 3: Verify Signature on Backend
          const verifyResult = await verifyRazorpayPayment(response);
          
          options.onSuccess(verifyResult, response);
        } catch (verifyError: any) {
          console.error('[Razorpay] Signature verification error:', verifyError);
          if (options.onError) {
            options.onError(verifyError);
          }
        }
      },
    };

    // 5. Open Modal
    const razorpayModal = new window.Razorpay(rzpOptions);

    // 6. Handle Payment Failed event
    razorpayModal.on('payment.failed', (response: any) => {
      console.warn('[Razorpay] Payment failed event:', response?.error);
      if (options.onError) {
        options.onError(response?.error || new Error('Payment transaction failed'));
      }
    });

    razorpayModal.open();
  } catch (err: any) {
    console.error('[Razorpay] Checkout launch error:', err);
    if (options.onError) {
      options.onError(err);
    } else {
      alert(`Payment Error: ${err.message || 'Unable to open payment modal'}`);
    }
  }
}
