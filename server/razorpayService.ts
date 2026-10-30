import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Razorpay from 'razorpay';

// Helper to load .env variables if not already present in process.env
function loadEnvVariables() {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...rest] = trimmed.split('=');
          if (key && rest.length > 0) {
            const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = val;
            }
          }
        }
      });
    }
  } catch (err) {
    console.debug('[Razorpay] Note loading .env:', err);
  }
}

// Get Razorpay client instance
function getRazorpayInstance() {
  loadEnvVariables();

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment');
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Register Razorpay Standard Web Checkout API endpoints
 */
export function registerRazorpayRoutes(app: Express) {
  loadEnvVariables();

  // Public config endpoint to deliver public key_id to frontend (never KEY_SECRET)
  app.get('/api/razorpay-config', (_req: Request, res: Response) => {
    loadEnvVariables();
    const key_id = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
    if (!key_id) {
      return res.status(500).json({
        error: 'Razorpay Key ID is not configured on server',
      });
    }
    return res.json({
      key_id,
      currency: 'INR',
    });
  });

  /**
   * STEP 1: BACKEND - Create Order
   * Endpoint: POST /api/create-order
   * Minimum amount: 100 paise
   */
  app.post('/api/create-order', async (req: Request, res: Response) => {
    try {
      loadEnvVariables();
      const razorpay = getRazorpayInstance();

      if (!razorpay) {
        return res.status(401).json({
          error: 'Razorpay authentication failed: Missing or invalid API credentials',
        });
      }

      const { amount, currency = 'INR', receipt, notes } = req.body || {};

      // Validate amount
      const parsedAmount = typeof amount === 'number' ? amount : parseInt(String(amount), 10);

      if (isNaN(parsedAmount) || parsedAmount < 100) {
        return res.status(400).json({
          error: 'Invalid amount: Minimum order amount is 100 paise (₹1.00)',
          receivedAmount: amount,
        });
      }

      const options = {
        amount: parsedAmount, // amount in paise
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      };

      const order = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      });
    } catch (error: any) {
      console.error('[Razorpay] Create Order Error:', error);

      // Handle auth failures specifically (401)
      if (error?.statusCode === 401 || (error?.error?.code === 'BAD_REQUEST_ERROR' && error?.message?.includes('auth'))) {
        return res.status(401).json({
          error: 'Razorpay Authentication Failed',
          details: error?.error?.description || error?.message,
        });
      }

      // Handle general Razorpay API errors (return 500)
      return res.status(500).json({
        error: 'Failed to create Razorpay order',
        details: error?.error?.description || error?.message || 'Internal server error',
      });
    }
  });

  /**
   * STEP 3: BACKEND - Verify Signature
   * Endpoint: POST /api/verify-payment
   * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
   */
  app.post('/api/verify-payment', (req: Request, res: Response) => {
    try {
      loadEnvVariables();
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      if (!key_secret) {
        return res.status(500).json({
          error: 'Server configuration error: RAZORPAY_KEY_SECRET is not set',
        });
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        order_id,
        payment_id,
        signature,
      } = req.body || {};

      const effectiveOrderId = razorpay_order_id || order_id;
      const effectivePaymentId = razorpay_payment_id || payment_id;
      const effectiveSignature = razorpay_signature || signature;

      // Validate required fields
      if (!effectiveOrderId || !effectivePaymentId || !effectiveSignature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for signature verification: order_id, payment_id, and signature are required.',
        });
      }

      // Compute expected HMAC-SHA256 signature
      const textToSign = `${effectiveOrderId}|${effectivePaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(textToSign)
        .digest('hex');

      // Compare generated signature with razorpay_signature using timing-safe buffer comparison
      const isSignatureValid =
        generatedSignature.length === effectiveSignature.length &&
        crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(effectiveSignature));

      if (!isSignatureValid) {
        console.warn('[Razorpay] Signature mismatch detected for order:', effectiveOrderId);
        return res.status(400).json({
          success: false,
          verified: false,
          error: 'Signature verification failed. Potential payment tampering detected.',
        });
      }

      console.log(`[Razorpay] Payment verified successfully: order ${effectiveOrderId}, payment ${effectivePaymentId}`);

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment signature verified successfully',
        order_id: effectiveOrderId,
        payment_id: effectivePaymentId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Razorpay] Verify Payment Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error occurred during payment verification',
        details: error?.message,
      });
    }
  });

  console.log('[Razorpay] Standard Web Checkout API routes initialized (/api/create-order, /api/verify-payment, /api/razorpay-config)');
}
