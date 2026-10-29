import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { handleCashfreeWebhookRequest } from "../../server/cashfreeWebhookHandler.ts";

// Initialize Firebase Admin if not already active
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * ============================================================================
 * FIREBASE CLOUD FUNCTION: Cashfree Payment Webhook Handler Endpoint
 * ============================================================================
 * Listens for Cashfree payment webhook notifications (such as PAYMENT_SUCCESS_WEBHOOK).
 * Responsibilities:
 * 1. Verifies HMAC-SHA256 signature using Cashfree Webhook Secret.
 * 2. Automatically updates order status to 'Paid' (and 'confirmed') in Firestore ('orders' collection).
 * 3. Dispatches official customer notification email with tax receipt, items breakdown,
 *    and live tracking links via Vernunt's email notification engine.
 * 4. Responds with HTTP 200 to acknowledge idempotent receipt to Cashfree.
 * ============================================================================
 */
export const cashfreePaymentWebhook = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    maxInstances: 10,
    region: "asia-south1"
  },
  async (req, res) => {
    await handleCashfreeWebhookRequest(req, res, admin);
  }
);

// Alias: cashfreeWebhook
export const cashfreeWebhook = cashfreePaymentWebhook;
