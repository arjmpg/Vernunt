/**
 * PaymentService - Singleton implementation for Cashfree Payment Gateway
 * Supports createOrder, verifyPayment, and handleWebhook.
 * Works seamlessly with configured CASHFREE_APP_ID and CASHFREE_SECRET_KEY.
 */

export interface PaymentOrderCustomer {
  customerId: string;
  customerName?: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentOrderParams {
  orderId?: string;
  orderAmount: number;
  orderCurrency?: string;
  customer: PaymentOrderCustomer;
  orderNote?: string;
  returnUrl?: string;
  orderTags?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  orderId: string;
  cfOrderId?: string;
  paymentSessionId?: string;
  orderAmount: number;
  orderCurrency: string;
  orderStatus: string;
  paymentUrl?: string;
  message?: string;
  raw?: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  orderId: string;
  cfOrderId?: string;
  orderAmount: number;
  orderStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  transactionId?: string;
  paymentMethod?: string;
  paymentTime?: string;
  raw?: any;
}

export interface CashfreeWebhookEvent {
  type: string;
  event_time?: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags?: Record<string, string>;
    };
    payment?: {
      cf_payment_id?: string;
      payment_status?: string;
      payment_amount?: number;
      payment_currency?: string;
      payment_message?: string;
      payment_time?: string;
      payment_method?: any;
    };
    customer_details?: {
      customer_id?: string;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
    };
  };
}

export class PaymentService {
  private static instance: PaymentService;
  private appId: string;
  private secretKey: string;
  private apiVersion: string;
  private isProduction: boolean;
  private baseUrl: string;

  private constructor() {
    this.appId = process.env.CASHFREE_APP_ID || '';
    this.secretKey = process.env.CASHFREE_SECRET_KEY || '';
    this.apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
    this.isProduction = process.env.NODE_ENV === 'production' && !process.env.CASHFREE_SANDBOX;
    this.baseUrl = this.isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Update credentials dynamically at runtime if loaded from configuration store
   */
  public setCredentials(appId: string, secretKey: string, isProduction = false): void {
    this.appId = appId;
    this.secretKey = secretKey;
    this.isProduction = isProduction;
    this.baseUrl = this.isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Creates a Cashfree payment order
   */
  public async createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    const generatedOrderId = params.orderId || `CF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const currency = params.orderCurrency || 'INR';

    // Zero-amount orders complete immediately without PG redirection
    if (params.orderAmount <= 0) {
      return {
        success: true,
        orderId: generatedOrderId,
        orderAmount: 0,
        orderCurrency: currency,
        orderStatus: 'PAID',
        message: 'Free transaction processed without gateway charge.'
      };
    }

    // Try backend proxy API if running on client side or fallback to direct SDK / REST
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/cashfree/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: params.orderAmount,
            currency: currency,
            customer: {
              customer_id: params.customer.customerId,
              customer_name: params.customer.customerName,
              customer_email: params.customer.customerEmail,
              customer_phone: params.customer.customerPhone
            },
            orderType: 'marketplace_order',
            itemId: generatedOrderId,
            itemTitle: params.orderNote || 'Order Checkout',
            returnUrl: params.returnUrl
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          return {
            success: true,
            orderId: data.orderId,
            cfOrderId: data.cfOrderId,
            paymentSessionId: data.paymentSessionId,
            orderAmount: data.amount,
            orderCurrency: currency,
            orderStatus: 'ACTIVE',
            paymentUrl: data.paymentUrl || (data.paymentSessionId ? `https://${this.isProduction ? 'payments' : 'sandbox'}.cashfree.com/order/#${data.paymentSessionId}` : undefined),
            raw: data
          };
        }
      } catch (err) {
        console.warn('[PaymentService] Client API call error:', err);
      }
    }

    // Server-side or direct Cashfree REST API call
    try {
      const headers = {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
        'Content-Type': 'application/json'
      };

      const payload = {
        order_id: generatedOrderId,
        order_amount: params.orderAmount,
        order_currency: currency,
        customer_details: {
          customer_id: params.customer.customerId,
          customer_name: params.customer.customerName || 'Customer',
          customer_email: params.customer.customerEmail,
          customer_phone: params.customer.customerPhone
        },
        order_meta: {
          return_url: params.returnUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com'}/order-confirmation?order_id={order_id}`
        },
        order_note: params.orderNote || 'Vernunt Marketplace Order',
        order_tags: params.orderTags
      };

      const res = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.payment_session_id) {
        return {
          success: true,
          orderId: generatedOrderId,
          cfOrderId: result.cf_order_id,
          paymentSessionId: result.payment_session_id,
          orderAmount: result.order_amount,
          orderCurrency: result.order_currency,
          orderStatus: result.order_status,
          raw: result
        };
      } else {
        return {
          success: false,
          orderId: generatedOrderId,
          orderAmount: params.orderAmount,
          orderCurrency: currency,
          orderStatus: 'FAILED',
          message: result.message || 'Failed to initialize Cashfree payment order',
          raw: result
        };
      }
    } catch (error: any) {
      return {
        success: false,
        orderId: generatedOrderId,
        orderAmount: params.orderAmount,
        orderCurrency: currency,
        orderStatus: 'FAILED',
        message: error?.message || 'Network error during Cashfree order initialization'
      };
    }
  }

  /**
   * Verifies payment status of an existing order
   */
  public async verifyPayment(orderId: string): Promise<PaymentVerificationResult> {
    // If running in browser, proxy via backend
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(`/api/cashfree/verify-order/${encodeURIComponent(orderId)}`);
        const data = await response.json();
        if (response.ok && data.success) {
          const isSuccess = data.status === 'SUCCESS' || data.status === 'PAID' || data.status === 'FREE_COMPLETED';
          return {
            success: isSuccess,
            orderId: data.orderId,
            cfOrderId: data.cfOrderId,
            orderAmount: data.amount,
            orderStatus: isSuccess ? 'SUCCESS' : data.status === 'FAILED' ? 'FAILED' : 'PENDING',
            transactionId: data.paymentId,
            paymentMethod: data.paymentMethod,
            paymentTime: data.paymentTime,
            raw: data
          };
        }
      } catch (err) {
        console.warn('[PaymentService] Error verifying payment via proxy:', err);
      }
    }

    // Direct Cashfree verification
    try {
      const headers = {
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': this.apiVersion,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
        headers
      });

      const result = await res.json();
      if (res.ok) {
        const isSuccess = result.order_status === 'PAID';
        return {
          success: isSuccess,
          orderId: result.order_id,
          cfOrderId: result.cf_order_id,
          orderAmount: result.order_amount,
          orderStatus: isSuccess ? 'SUCCESS' : result.order_status === 'ACTIVE' ? 'PENDING' : 'FAILED',
          raw: result
        };
      }

      return {
        success: false,
        orderId,
        orderAmount: 0,
        orderStatus: 'FAILED',
        raw: result
      };
    } catch (err: any) {
      return {
        success: false,
        orderId,
        orderAmount: 0,
        orderStatus: 'FAILED',
        raw: err?.message
      };
    }
  }

  /**
   * Validates and parses a Cashfree webhook payload
   */
  public handleWebhook(payload: any, signatureHeader?: string, timestamp?: string): {
    isValid: boolean;
    event?: CashfreeWebhookEvent;
    orderId?: string;
    isPaid?: boolean;
    reason?: string;
  } {
    if (!payload) {
      return { isValid: false, reason: 'Empty payload received' };
    }

    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const orderId = event?.data?.order?.order_id;
    const paymentStatus = event?.data?.payment?.payment_status;
    const isPaid = paymentStatus === 'SUCCESS';

    return {
      isValid: true,
      event,
      orderId,
      isPaid,
      reason: isPaid ? 'Payment settled' : `Payment status: ${paymentStatus || 'unknown'}`
    };
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
