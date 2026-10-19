/**
 * CASHFREE PAYMENTS UNIFIED SERVICE (SINGLETON)
 * ============================================================================
 * Official Cashfree Payments PG Node.js SDK Pattern & API Service
 * 
 * Provides centralized payment operations for Vernunt:
 * - createOrder(): Generates secure Cashfree orders with zero-amount bypass
 * - verifyPayment(): Authoritative server-side status verification
 * - handleWebhook(): Webhook signature verification & event parsing
 * 
 * Configured via:
 * - CASHFREE_APP_ID
 * - CASHFREE_SECRET_KEY
 * - CASHFREE_ENV ('SANDBOX' | 'PRODUCTION')
 * - CASHFREE_API_VERSION ('2023-08-01')
 * ============================================================================
 */

export interface CashfreeCustomerDetails {
  customerId: string;
  customerPhone: string;
  customerEmail: string;
  customerName?: string;
}

export interface CashfreeOrderMeta {
  returnUrl?: string;
  notifyUrl?: string;
  paymentMethods?: string;
}

export interface CreateOrderRequest {
  orderId?: string;
  orderAmount: number;
  orderCurrency?: string;
  customerDetails: CashfreeCustomerDetails;
  orderMeta?: CashfreeOrderMeta;
  orderNote?: string;
  orderTags?: Record<string, string>;
  orderType?: 'event_ticket' | 'marketplace_order' | 'specialist_booking' | 'daycare_booking' | 'wallet_deposit' | 'subscription' | 'custom';
}

export interface CreateOrderResponse {
  success: boolean;
  isFree?: boolean;
  orderId: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus?: string;
  environment: 'SANDBOX' | 'PRODUCTION' | 'ZERO_COST';
  message?: string;
  error?: string;
  rawResponse?: any;
}

export interface PaymentVerificationResponse {
  success: boolean;
  isPaid: boolean;
  orderId: string;
  cfOrderId?: string;
  cfPaymentId?: string;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'CANCELLED' | 'FREE_COMPLETED' | 'UNKNOWN';
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod?: string;
  paymentTime?: string;
  bankReference?: string;
  message?: string;
  error?: string;
  rawPayments?: any[];
}

export interface WebhookResult {
  isValidSignature: boolean;
  eventType?: string;
  orderId?: string;
  cfOrderId?: string;
  cfPaymentId?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentMethod?: string;
  paymentTime?: string;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * Helper to safely extract environment variables across Node.js & client runtimes
 */
function getEnv(key: string, defaultValue = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return String((import.meta as any).env[key]).trim();
  }
  return defaultValue;
}

/**
 * Computes HMAC-SHA256 signature in Base64 using Node.js crypto or Web Crypto API
 */
async function computeHmacSha256(secret: string, message: string): Promise<string> {
  // 1. Try Node.js crypto module
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = await import('crypto');
      return crypto.createHmac('sha256', secret).update(message).digest('base64');
    } catch {
      // Fall through to Web Crypto API
    }
  }

  // 2. Web Crypto API (Browser / modern Edge runtimes)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const bytes = new Uint8Array(signatureBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  throw new Error('No cryptographic engine available to verify Cashfree webhook signature.');
}

/**
 * Singleton PaymentService class implementing Cashfree Payments Node.js SDK pattern
 */
export class PaymentService {
  private static instance: PaymentService | null = null;
  private appId: string;
  private secretKey: string;
  private apiVersion: string;
  private environment: 'SANDBOX' | 'PRODUCTION';
  private baseUrl: string;

  /**
   * Private constructor enforcing singleton design pattern
   */
  private constructor() {
    this.appId = getEnv('CASHFREE_APP_ID') || getEnv('CASHFREE_CLIENT_ID');
    this.secretKey = getEnv('CASHFREE_SECRET_KEY') || getEnv('CASHFREE_CLIENT_SECRET');
    this.apiVersion = getEnv('CASHFREE_API_VERSION', '2023-08-01');

    const envSetting = (getEnv('CASHFREE_ENV') || '').toUpperCase();
    const isProd =
      envSetting === 'PRODUCTION' ||
      envSetting === 'PROD' ||
      this.secretKey.startsWith('cfsk_ma_prod_');

    this.environment = isProd ? 'PRODUCTION' : 'SANDBOX';
    this.baseUrl = isProd
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Returns the singleton instance of PaymentService
   */
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Allows dynamic runtime reconfiguration (e.g. for switching keys or testing)
   */
  public configure(config: {
    appId?: string;
    secretKey?: string;
    environment?: 'SANDBOX' | 'PRODUCTION';
    apiVersion?: string;
  }): void {
    if (config.appId) this.appId = config.appId.trim();
    if (config.secretKey) this.secretKey = config.secretKey.trim();
    if (config.apiVersion) this.apiVersion = config.apiVersion.trim();
    if (config.environment) {
      this.environment = config.environment;
      this.baseUrl = config.environment === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
    }
  }

  /**
   * Current configuration summary
   */
  public getConfig() {
    return {
      isConfigured: Boolean(this.appId && this.secretKey),
      environment: this.environment,
      baseUrl: this.baseUrl,
      apiVersion: this.apiVersion,
      appIdPrefix: this.appId ? this.appId.substring(0, 6) + '...' : 'NOT_SET'
    };
  }

  /**
   * Creates a Cashfree payment order using the official Cashfree PG API/SDK pattern.
   * 
   * Strict Zero-Amount Handling:
   * If orderAmount is 0 (free event pass, 100% coupon discount, promotional zero-cost),
   * this immediately confirms the transaction with FREE_COMPLETED without calling Cashfree gateway.
   */
  public async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const rawAmount = Number(orderData.orderAmount);
    if (isNaN(rawAmount) || rawAmount < 0) {
      throw new Error('Valid, non-negative order amount is required.');
    }

    const roundedAmount = Math.round(rawAmount * 100) / 100;
    const currency = orderData.orderCurrency || 'INR';
    const orderId = orderData.orderId || `CF_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Zero-Amount / Free Transaction Bypass
    if (roundedAmount === 0) {
      return {
        success: true,
        isFree: true,
        orderId,
        orderAmount: 0,
        orderCurrency: currency,
        orderStatus: 'FREE_COMPLETED',
        environment: 'ZERO_COST',
        message: 'Zero-amount order verified and confirmed directly without gateway invocation.'
      };
    }

    // Check credentials
    if (!this.appId || !this.secretKey) {
      console.error('[PaymentService] Cashfree credentials missing: CASHFREE_APP_ID or CASHFREE_SECRET_KEY not set.');
      return {
        success: false,
        orderId,
        orderAmount: roundedAmount,
        orderCurrency: currency,
        environment: this.environment,
        error: 'Cashfree Payment Gateway credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) are not configured on server.',
        message: 'Gateway configuration missing.'
      };
    }

    // Format customer details
    const cust = orderData.customerDetails;
    const customerId = (cust.customerId || `cust_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    let customerPhone = (cust.customerPhone || '9999999999').replace(/\D/g, '');
    if (customerPhone.length > 10) customerPhone = customerPhone.slice(-10);
    if (customerPhone.length < 10) customerPhone = customerPhone.padStart(10, '9');
    const customerEmail = cust.customerEmail || 'guest@vernunt.com';
    const customerName = cust.customerName || 'Vernunt Member';

    const orderPayload = {
      order_id: orderId,
      order_amount: roundedAmount,
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName
      },
      order_meta: {
        return_url: orderData.orderMeta?.returnUrl || `https://app.vernunt.com/?order_id=${orderId}&status={order_status}`,
        notify_url: orderData.orderMeta?.notifyUrl || 'https://app.vernunt.com/api/cashfree/webhook',
        payment_methods: orderData.orderMeta?.paymentMethods
      },
      order_note: orderData.orderNote || `${orderData.orderType || 'Order'} on Vernunt Platform`,
      order_tags: orderData.orderTags || {
        type: orderData.orderType || 'custom',
        platform: 'vernunt'
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion
        },
        body: JSON.stringify(orderPayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[PaymentService.createOrder Error]', responseData);
        return {
          success: false,
          orderId,
          orderAmount: roundedAmount,
          orderCurrency: currency,
          environment: this.environment,
          error: responseData.message || 'Cashfree payment session establishment failed.',
          message: responseData.message || 'Payment initiation rejected by Cashfree gateway.',
          rawResponse: responseData
        };
      }

      return {
        success: true,
        isFree: false,
        orderId,
        cfOrderId: responseData.cf_order_id,
        paymentSessionId: responseData.payment_session_id,
        orderAmount: roundedAmount,
        orderCurrency: currency,
        orderStatus: responseData.order_status || 'ACTIVE',
        environment: this.environment,
        message: 'Cashfree payment session established successfully.',
        rawResponse: responseData
      };
    } catch (err: any) {
      console.error('[PaymentService.createOrder Exception]', err);
      return {
        success: false,
        orderId,
        orderAmount: roundedAmount,
        orderCurrency: currency,
        environment: this.environment,
        error: err?.message || 'Network error reaching Cashfree gateway.',
        message: 'Could not contact Cashfree payment servers.'
      };
    }
  }

  /**
   * Verifies payment status directly with Cashfree's authoritative API
   * Calls GET /orders/{orderId}/payments using x-client-id and x-client-secret
   */
  public async verifyPayment(orderId: string): Promise<PaymentVerificationResponse> {
    if (!orderId || !orderId.trim()) {
      return {
        success: false,
        isPaid: false,
        orderId: '',
        paymentStatus: 'UNKNOWN',
        paymentAmount: 0,
        paymentCurrency: 'INR',
        error: 'Order ID is required for verification.'
      };
    }

    const trimmedOrderId = orderId.trim();

    // Check credentials
    if (!this.appId || !this.secretKey) {
      console.error('[PaymentService.verifyPayment] Cashfree credentials missing.');
      return {
        success: false,
        isPaid: false,
        orderId: trimmedOrderId,
        paymentStatus: 'UNKNOWN',
        paymentAmount: 0,
        paymentCurrency: 'INR',
        error: 'Cashfree credentials not configured.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(trimmedOrderId)}/payments`, {
        method: 'GET',
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion
        }
      });

      if (!response.ok) {
        // Fallback: check order status directly via GET /orders/{orderId}
        const orderRes = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(trimmedOrderId)}`, {
          method: 'GET',
          headers: {
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': this.apiVersion
          }
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const isPaid = orderData.order_status === 'PAID';
          return {
            success: true,
            isPaid,
            orderId: trimmedOrderId,
            cfOrderId: orderData.cf_order_id,
            paymentStatus: isPaid ? 'SUCCESS' : (orderData.order_status || 'PENDING'),
            paymentAmount: orderData.order_amount || 0,
            paymentCurrency: orderData.order_currency || 'INR',
            message: isPaid ? 'Order confirmed paid via Cashfree.' : `Order status: ${orderData.order_status}`
          };
        }

        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          isPaid: false,
          orderId: trimmedOrderId,
          paymentStatus: 'FAILED',
          paymentAmount: 0,
          paymentCurrency: 'INR',
          error: errData.message || 'Payment lookup failed on Cashfree.'
        };
      }

      const payments = await response.json();

      if (Array.isArray(payments) && payments.length > 0) {
        // Pick latest payment attempt
        const latestPayment = payments[0];
        const statusStr = (latestPayment.payment_status || '').toUpperCase();
        const isPaid = statusStr === 'SUCCESS';

        let mappedStatus: PaymentVerificationResponse['paymentStatus'] = 'PENDING';
        if (isPaid) mappedStatus = 'SUCCESS';
        else if (statusStr === 'FAILED') mappedStatus = 'FAILED';
        else if (statusStr === 'USER_DROPPED') mappedStatus = 'USER_DROPPED';
        else if (statusStr === 'CANCELLED') mappedStatus = 'CANCELLED';

        return {
          success: true,
          isPaid,
          orderId: trimmedOrderId,
          cfOrderId: latestPayment.order_id || trimmedOrderId,
          cfPaymentId: latestPayment.cf_payment_id ? String(latestPayment.cf_payment_id) : undefined,
          paymentStatus: mappedStatus,
          paymentAmount: Number(latestPayment.payment_amount) || 0,
          paymentCurrency: latestPayment.payment_currency || 'INR',
          paymentMethod: latestPayment.payment_group || latestPayment.payment_method?.payment_group || 'Cashfree',
          paymentTime: latestPayment.payment_completion_time || latestPayment.payment_time || new Date().toISOString(),
          bankReference: latestPayment.bank_reference || undefined,
          rawPayments: payments,
          message: isPaid ? 'Payment successfully verified by Cashfree gateway.' : `Payment status is ${mappedStatus}.`
        };
      }

      return {
        success: true,
        isPaid: false,
        orderId: trimmedOrderId,
        paymentStatus: 'PENDING',
        paymentAmount: 0,
        paymentCurrency: 'INR',
        message: 'No completed payments recorded yet for this order.'
      };
    } catch (err: any) {
      console.error('[PaymentService.verifyPayment Exception]', err);
      return {
        success: false,
        isPaid: false,
        orderId: trimmedOrderId,
        paymentStatus: 'UNKNOWN',
        paymentAmount: 0,
        paymentCurrency: 'INR',
        error: err?.message || 'Error reaching Cashfree verification API.'
      };
    }
  }

  /**
   * Handles and verifies Cashfree Webhooks according to the official SDK pattern:
   * - Validates HMAC-SHA256 signature using `x-webhook-timestamp` and `x-webhook-signature`
   * - Parses event payload (PAYMENT_SUCCESS_WEBHOOK, ORDER_PAID, PAYMENT_FAILED_WEBHOOK, etc.)
   * - Extracts order ID, payment ID, amount, and payment status safely
   */
  public async handleWebhook(
    payload: any,
    headers?: Record<string, string | string[] | undefined> | { timestamp?: string; signature?: string }
  ): Promise<WebhookResult> {
    const rawTimestamp = headers
      ? (headers['x-webhook-timestamp'] || (headers as any).timestamp)
      : undefined;
    const rawSignature = headers
      ? (headers['x-webhook-signature'] || (headers as any).signature)
      : undefined;

    const timestamp = Array.isArray(rawTimestamp) ? rawTimestamp[0] : (rawTimestamp || '');
    const signature = Array.isArray(rawSignature) ? rawSignature[0] : (rawSignature || '');

    const rawPayloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

    let parsedBody: any;
    try {
      parsedBody = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
      return {
        isValidSignature: false,
        error: 'Invalid JSON payload received in webhook.'
      };
    }

    // 1. Signature Verification
    let isValidSignature = false;
    const webhookSecret = getEnv('CASHFREE_WEBHOOK_SECRET') || this.secretKey;

    if (signature && timestamp && webhookSecret) {
      try {
        const signedPayload = timestamp + rawPayloadString;
        const expectedSignature = await computeHmacSha256(webhookSecret, signedPayload);
        isValidSignature = signature === expectedSignature;

        if (!isValidSignature) {
          console.warn('[PaymentService.handleWebhook] Webhook signature mismatch.');
        }
      } catch (cryptoErr: any) {
        console.error('[PaymentService.handleWebhook] Error calculating signature:', cryptoErr);
        isValidSignature = false;
      }
    } else if (!webhookSecret) {
      // If secret not configured in local development, record warning
      console.warn('[PaymentService.handleWebhook] CASHFREE_SECRET_KEY/CASHFREE_WEBHOOK_SECRET not provided, skipping HMAC signature verification.');
      isValidSignature = true;
    }

    // 2. Event Extraction
    const eventType = parsedBody?.type || parsedBody?.event || 'UNKNOWN_WEBHOOK';
    const data = parsedBody?.data || {};
    const order = data.order || {};
    const payment = data.payment || {};

    const orderId = order.order_id || parsedBody?.order_id || parsedBody?.orderId;
    const cfOrderId = order.cf_order_id || parsedBody?.cf_order_id;
    const cfPaymentId = payment.cf_payment_id ? String(payment.cf_payment_id) : undefined;
    const paymentStatus = payment.payment_status || order.order_status || parsedBody?.status;
    const paymentAmount = payment.payment_amount ?? order.order_amount;
    const paymentCurrency = payment.payment_currency || order.order_currency || 'INR';
    const paymentMethod = payment.payment_group || 'Cashfree';
    const paymentTime = payment.payment_completion_time || payment.payment_time;

    return {
      isValidSignature,
      eventType,
      orderId,
      cfOrderId,
      cfPaymentId,
      paymentStatus,
      paymentAmount: paymentAmount !== undefined ? Number(paymentAmount) : undefined,
      paymentCurrency,
      paymentMethod,
      paymentTime,
      data: parsedBody,
      message: isValidSignature
        ? `Successfully verified and parsed webhook event: ${eventType}`
        : 'Webhook received but signature verification failed.'
    };
  }
}

// Export singleton instance as default and named export
export const paymentService = PaymentService.getInstance();
export default PaymentService;
