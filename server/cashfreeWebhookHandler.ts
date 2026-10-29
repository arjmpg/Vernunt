import type { Request, Response } from 'express';
import crypto from 'crypto';
import { getCashfreeConfig } from './cashfreeService.ts';
import { sendEmailMessage, buildPaymentReceiptHtml, buildProductPurchaseHtml } from './emailService.ts';

import { getMarketplaceOrdersList, updateMarketplaceOrderStatus } from './marketplaceService.ts';


export interface CashfreeWebhookEventData {
  order?: {
    order_id?: string;
    order_amount?: number;
    order_currency?: string;
    order_tags?: Record<string, any>;
  };
  payment?: {
    cf_payment_id?: string | number;
    payment_status?: string;
    payment_amount?: number;
    payment_currency?: string;
    payment_message?: string;
    payment_time?: string;
    bank_reference?: string;
    payment_group?: string;
    payment_method?: any;
  };
  customer_details?: {
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  };
}

export interface CashfreeWebhookPayload {
  data?: CashfreeWebhookEventData;
  event_time?: string;
  type?: string;
  // Legacy / Flat format
  order_id?: string;
  orderId?: string;
  order_amount?: number;
  orderAmount?: number;
  txStatus?: string;
  payment_status?: string;
  cf_payment_id?: string | number;
  referenceId?: string;
  paymentMode?: string;
  customer_email?: string;
  customerEmail?: string;
  customer_name?: string;
  customerName?: string;
  customer_phone?: string;
  customerPhone?: string;
}

/**
 * Validates Cashfree webhook signature using HMAC-SHA256
 */
export function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string | undefined,
  signature: string | undefined,
  secretKey: string
): boolean {
  if (!signature || !timestamp || !secretKey) {
    return false;
  }
  try {
    const signedData = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signedData)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(computedSignature, 'utf-8')
    );
  } catch (err) {
    console.warn('[Cashfree Webhook Signature Check]', err);
    return false;
  }
}

/**
 * Core processor for Cashfree Payment Events
 * Used identically by Firebase Cloud Functions and Express server endpoints
 */
export async function processCashfreePaymentWebhook(
  payload: CashfreeWebhookPayload,
  headers: Record<string, any> = {},
  adminInstance?: any
): Promise<{
  success: boolean;
  status: string;
  orderId?: string;
  paymentId?: string;
  emailDispatched?: boolean;
  message: string;
}> {
  const config = getCashfreeConfig();

  // Signature validation if headers are present
  const signature = headers['x-webhook-signature'] || headers['x-webhook-signature-256'];
  const timestamp = headers['x-webhook-timestamp'];
  if (signature && timestamp && config.webhookSecret) {
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const isValid = verifyCashfreeSignature(rawBody, String(timestamp), String(signature), config.webhookSecret);
    if (!isValid) {
      console.warn('[Cashfree Webhook] Invalid HMAC-SHA256 signature rejected.');
      return {
        success: false,
        status: 'UNAUTHORIZED_SIGNATURE',
        message: 'Invalid webhook signature.'
      };
    }
  }

  // Extract order and payment attributes across both API v3 and legacy webhooks
  const data = payload.data || {};
  const orderId = (
    data.order?.order_id ||
    payload.order_id ||
    payload.orderId ||
    ''
  ).trim();

  const eventType = payload.type || '';
  const paymentStatus = (
    data.payment?.payment_status ||
    payload.payment_status ||
    payload.txStatus ||
    (eventType.includes('SUCCESS') ? 'SUCCESS' : '')
  ).toUpperCase();

  const cfPaymentId = String(
    data.payment?.cf_payment_id ||
    payload.cf_payment_id ||
    payload.referenceId ||
    `CF_PAY_${Date.now()}`
  );

  const amountPaid = Number(
    data.payment?.payment_amount ||
    data.order?.order_amount ||
    payload.order_amount ||
    payload.orderAmount ||
    0
  );

  const paymentMethod =
    data.payment?.payment_group ||
    (data.payment?.payment_method?.upi?.channel ? `UPI (${data.payment.payment_method.upi.channel.toUpperCase()})` : null) ||
    payload.paymentMode ||
    'Cashfree UPI / Google Pay';

  const customerEmail = (
    data.customer_details?.customer_email ||
    payload.customer_email ||
    payload.customerEmail ||
    ''
  ).trim().toLowerCase();

  const customerName =
    data.customer_details?.customer_name ||
    payload.customer_name ||
    payload.customerName ||
    'Vernunt Customer';

  const customerPhone =
    data.customer_details?.customer_phone ||
    payload.customer_phone ||
    payload.customerPhone ||
    '';

  console.log(`[Cashfree Webhook Received] Order: ${orderId} | Status: ${paymentStatus} | Payment ID: ${cfPaymentId} | Amount: ₹${amountPaid}`);

  if (!orderId) {
    return {
      success: false,
      status: 'MISSING_ORDER_ID',
      message: 'No order identifier found in Cashfree webhook payload.'
    };
  }

  const isSuccess = paymentStatus === 'SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK';

  // 1. Synchronize to Firestore (orders collection)
  let firestoreUpdated = false;
  let orderDataFromDb: any = null;

  try {
    let admin = adminInstance;
    if (!admin) {
      try {
        const adminModule = await import('firebase-admin');
        admin = (adminModule as any).default || adminModule;
      } catch {
        // Fallback
      }
    }

    if (admin) {
      const db = admin.firestore(
        process.env.FIRESTORE_DATABASE_ID || 'ai-studio-vernunt-c6e46d49-7bd7-4206-a7d2-664cd30cdee5'
      );

      // Search order by ID or orderNumber
      const orderRef = db.collection('orders').doc(orderId);
      const docSnap = await orderRef.get();

      if (docSnap.exists) {
        orderDataFromDb = docSnap.data();
      } else {
        // Search by orderNumber
        const querySnap = await db.collection('orders').where('orderNumber', '==', orderId).limit(1).get();
        if (!querySnap.empty) {
          orderDataFromDb = querySnap.docs[0].data();
        }
      }

      const updatePayload: Record<string, any> = {
        paymentStatus: isSuccess ? 'paid' : (paymentStatus === 'FAILED' ? 'failed' : 'pending'),
        status: isSuccess ? 'paid' : paymentStatus.toLowerCase(),
        cashfreePaymentId: cfPaymentId,
        cashfreeOrderId: orderId,
        paymentReferenceId: cfPaymentId,
        paymentMethod: paymentMethod,
        updatedAt: new Date().toISOString(),
        lastPaymentWebhookReceivedAt: new Date().toISOString(),
        paymentAudit: {
          gateway: 'Cashfree',
          eventType: eventType || (isSuccess ? 'PAYMENT_SUCCESS_WEBHOOK' : 'PAYMENT_EVENT'),
          cfPaymentId,
          amount: amountPaid,
          status: paymentStatus,
          timestamp: new Date().toISOString()
        }
      };

      if (isSuccess) {
        updatePayload.paidAt = new Date().toISOString();
        // If order was pending, progress order status to confirmed
        if (!orderDataFromDb || orderDataFromDb.orderStatus === 'pending') {
          updatePayload.orderStatus = 'confirmed';
        }
      }

      await orderRef.set(updatePayload, { merge: true });
      firestoreUpdated = true;
      console.log(`[Cashfree Webhook] ✓ Firestore order ${orderId} updated to paymentStatus: '${updatePayload.paymentStatus}'`);
    }
  } catch (dbErr: any) {
    console.warn('[Cashfree Webhook] Firestore synchronization notice:', dbErr?.message || dbErr);
  }

  // 2. Synchronize in-memory and local mock marketplace orders
  try {
    updateMarketplaceOrderStatus(orderId, isSuccess ? 'paid' : 'pending', isSuccess ? 'confirmed' : 'pending', cfPaymentId);
  } catch {
    // In-memory sync notice
  }


  // 3. Trigger Customer Notification Email for Successful Payment
  let emailSent = false;
  const recipientEmail = customerEmail || orderDataFromDb?.customerEmail || orderDataFromDb?.shippingAddress?.email;

  if (isSuccess && recipientEmail && recipientEmail.includes('@')) {
    try {
      const mergedOrder = {
        ...(orderDataFromDb || {}),
        id: orderId,
        orderNumber: orderId,
        customerName: customerName || orderDataFromDb?.customerName || 'Valued Parent',
        customerEmail: recipientEmail,
        customerPhone: customerPhone || orderDataFromDb?.customerPhone,
        totalAmount: amountPaid || orderDataFromDb?.totalAmount || 0,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        paymentReferenceId: cfPaymentId,
        placedAt: orderDataFromDb?.placedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      // 1. Payment Receipt Email
      const receiptHtml = buildPaymentReceiptHtml(mergedOrder, {
        amount: amountPaid,
        transactionId: cfPaymentId,
        paymentMethod: paymentMethod
      });

      const emailSubject = `🎉 Payment Confirmed: Order #${orderId} (₹${amountPaid.toLocaleString('en-IN')}) Paid Successfully`;
      const emailText = `Hello ${mergedOrder.customerName},\n\nYour payment of ₹${amountPaid} for Order #${orderId} has been successfully verified via Cashfree (${paymentMethod}).\nTransaction Reference: ${cfPaymentId}\n\nYour order is now confirmed and sent for packaging.\n- Team Vernunt Playgear`;

      const emailResult = await sendEmailMessage({
        to: recipientEmail,
        subject: emailSubject,
        type: 'payment_receipt',
        htmlContent: receiptHtml,
        textContent: emailText,
        adminInstance
      });

      emailSent = emailResult.success;
      console.log(`[Cashfree Webhook] ✓ Customer notification email sent to ${recipientEmail} (Status: ${emailResult.success})`);
    } catch (emailErr: any) {
      console.warn('[Cashfree Webhook] Email notification notice:', emailErr?.message || emailErr);
    }
  }

  return {
    success: true,
    status: paymentStatus,
    orderId,
    paymentId: cfPaymentId,
    emailDispatched: emailSent,
    message: isSuccess
      ? `✓ Order ${orderId} successfully marked as Paid. Customer notification email triggered.`
      : `Webhook received with payment status: ${paymentStatus}.`
  };
}

/**
 * Standard Express / Cloud Function request handler wrapper
 */
export async function handleCashfreeWebhookRequest(req: Request, res: Response, adminInstance?: any) {
  try {
    const payload = req.body || {};
    const headers = req.headers || {};

    const result = await processCashfreePaymentWebhook(payload, headers, adminInstance);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (error: any) {
    console.error('[Cashfree Webhook Request Exception]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing Cashfree payment webhook.'
    });
  }
}
