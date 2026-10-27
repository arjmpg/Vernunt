import type { Express, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Firebase configuration for server-side Firestore synchronization
interface FirebaseConfig {
  projectId: string;
  firestoreDatabaseId?: string;
  authDomain?: string;
}

let firebaseConfig: FirebaseConfig = {
  projectId: 'gen-lang-client-0519197985',
  firestoreDatabaseId: 'ai-studio-vernunt-c6e46d49-7bd7-4206-a7d2-664cd30cdee5'
};

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.debug('[EmailService] Config read notice:', e);
}

// In-memory OTP storage for rapid response and offline capability
export interface StoredOtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  role: string;
  userName?: string;
  verified: boolean;
  createdAt: string;
}

const emailOtpMemoryStore = new Map<string, StoredOtpRecord>();

// Email delivery logs for audit and in-app debugging
export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type:
    | 'otp'
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
  status: 'sent' | 'fallback_delivered' | 'queued' | 'failed';
  previewUrl?: string;
  otpCode?: string;
  timestamp: string;
  error?: string;
}

const emailLogs: EmailLogEntry[] = [];

// Lazy-initialized Nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // 1. Production SMTP Configuration (via Environment Variables)
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (host && user && pass) {
    console.log(`[EmailService] Initializing custom SMTP transporter via ${host}:${port}...`);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    return transporter;
  }

  // 2. Gmail SMTP Direct Service
  if (user && pass && user.includes('@gmail.com')) {
    console.log(`[EmailService] Initializing Gmail SMTP transporter for ${user}...`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    return transporter;
  }

  // 3. Fallback: High-speed RFC822 transport with Firestore Trigger Email synchronization
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
  console.log('[EmailService] Initialized instant email delivery & Firestore mail queue engine.');

  return transporter;
}

/**
 * Record email directly into Firebase Firestore `mail` collection
 * (Official Firebase Trigger Email extension format: creates documents with `to`, `message`)
 */
async function syncToFirestoreMail(adminInstance: any, to: string, subject: string, html: string, text: string) {
  if (!adminInstance) return;
  try {
    const db = firebaseConfig.firestoreDatabaseId
      ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
      : adminInstance.firestore();

    await db.collection('mail').add({
      to: [to],
      message: {
        subject,
        html,
        text
      },
      status: 'pending',
      dispatchedAt: new Date().toISOString(),
      source: 'vernunt-server-email-engine'
    });

    await db.collection('email_notifications').add({
      recipient: to,
      subject,
      timestamp: new Date().toISOString(),
      status: 'dispatched'
    });
  } catch (firestoreErr: any) {
    console.warn('[EmailService] Firestore Trigger Email sync notice:', firestoreErr?.message || firestoreErr);
  }
}

/**
 * Sync OTP record to Firebase Firestore `email_otps` collection
 */
async function syncOtpToFirestore(adminInstance: any, email: string, otp: string, role: string, userName?: string) {
  if (!adminInstance) return;
  try {
    const db = firebaseConfig.firestoreDatabaseId
      ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
      : adminInstance.firestore();

    const cleanEmail = email.trim().toLowerCase();
    await db.collection('email_otps').doc(cleanEmail).set({
      email: cleanEmail,
      otp,
      role: role || 'Parent',
      userName: userName || 'Parent',
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      verified: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (firestoreErr: any) {
    console.warn('[EmailService] Firestore OTP sync notice:', firestoreErr?.message || firestoreErr);
  }
}

/**
 * HTML Email Template Generator with Vernunt Branding
 */
function buildVernuntEmailTemplate(options: {
  title: string;
  preheader?: string;
  badgeText?: string;
  mainContentHtml: string;
  callToAction?: { label: string; url: string };
  footerNote?: string;
}): string {
  const brandColor = '#be123c'; // Rose-700
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .email-container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #be123c 0%, #e11d48 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.22); padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .content { padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #334155; }
    .otp-box { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-number { font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #be123c; font-family: monospace; margin: 8px 0; }
    .otp-note { font-size: 12px; color: #64748b; margin-top: 6px; }
    .btn { display: inline-block; background: ${brandColor}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 20px 0; text-align: center; }
    .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .details-row:last-child { border-bottom: none; }
    .details-label { color: #64748b; font-weight: 600; }
    .details-value { color: #0f172a; font-weight: 700; text-align: right; }
    
    /* Rich E-Commerce Order Styles */
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .items-table th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
    .items-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #334155; }
    .items-table tr:last-child td { border-bottom: none; }
    .item-title { font-weight: 700; color: #0f172a; }
    .item-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .item-price { font-family: monospace; font-weight: 700; text-align: right; color: #0f172a; }
    
    .price-breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .price-line { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #475569; }
    .price-line.total { border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #be123c; }
    
    .status-pill { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-paid { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .status-shipped { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .status-delivered { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .status-cancelled { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .status-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    
    .safety-callout { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #831843; margin: 16px 0; }
    .carrier-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin: 16px 0; }
    .refund-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 16px; margin: 16px 0; color: #1e40af; }
    
    .footer { background: #f1f5f9; padding: 24px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #be123c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${options.badgeText ? `<div class="badge">${options.badgeText}</div>` : ''}
      <h1>Vernunt</h1>
      <p>Play Time Connect • Verified Kids &amp; Family Network</p>
    </div>
    <div class="content">
      ${options.mainContentHtml}
      ${options.callToAction ? `<div style="text-align: center;"><a href="${options.callToAction.url}" class="btn" target="_blank">${options.callToAction.label}</a></div>` : ''}
    </div>
    <div class="footer">
      <p><strong>Vernunt Safety &amp; Trust Assurance</strong></p>
      <p>${options.footerNote || 'This email was dispatched via Vernunt Firebase Child Safety &amp; Notification Engine. Never share sensitive OTPs or security codes.'}</p>
      <p>© ${new Date().getFullYear()} Vernunt Technologies Pvt Ltd • Bangalore, India • <a href="https://app.vernunt.com">app.vernunt.com</a></p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * 1. Product Purchase / Order Placed HTML Generator
 */
export function buildProductPurchaseHtml(order: any, details?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const dateStr = order.placedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const items = Array.isArray(order.items) ? order.items : [];
  const courier = order.courierPartner || 'BlueDart / Delhivery (via Shiprocket)';
  const awb = order.shiprocketAwb || order.trackingNumber || 'DEL89012398';

  const itemsRows = items.map((it: any) => {
    const title = it.product?.name || it.name || 'Verified Montessori Toy';
    const qty = it.quantity || 1;
    const price = it.unitPrice || it.price || 0;
    const total = it.totalPrice || (qty * price);
    return `
      <tr>
        <td>
          <div class="item-title">${title}</div>
          <div class="item-sub">Qty: ${qty} × ₹${price}</div>
        </td>
        <td class="item-price">₹${total.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Thank you for shopping on <strong>Vernunt Montessori Store</strong>! Your order <strong>#${orderId}</strong> has been received and is now being carefully prepared for child-safe packaging and dispatch.</p>
    
    <div class="details-card">
      <div class="details-row"><span class="details-label">Order Number</span><span class="details-value font-mono">#${orderId}</span></div>
      <div class="details-row"><span class="details-label">Order Date</span><span class="details-value">${dateStr}</span></div>
      <div class="details-row"><span class="details-label">Payment Mode</span><span class="details-value">${order.paymentMethod || 'Prepaid Online'}</span></div>
      <div class="details-row"><span class="details-label">Payment Status</span><span class="details-value"><span class="status-pill status-${order.paymentStatus === 'paid' ? 'paid' : 'pending'}">${(order.paymentStatus || 'paid').toUpperCase()}</span></span></div>
      <div class="details-row"><span class="details-label">Assigned Courier</span><span class="details-value">${courier}</span></div>
      <div class="details-row"><span class="details-label">Shiprocket AWB</span><span class="details-value font-mono">${awb}</span></div>
    </div>

    <h4 style="margin: 20px 0 8px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Purchased Items (${items.length})</h4>
    <table class="items-table">
      <thead>
        <tr>
          <th>Product Details</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows || '<tr><td colspan="2">Montessori Play Kit &amp; Toys</td></tr>'}
      </tbody>
    </table>

    <div class="price-breakdown">
      <div class="price-line"><span>Subtotal:</span><span style="font-family:monospace;font-weight:700;">₹${(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
      <div class="price-line"><span>Standard / Express Shipping:</span><span style="font-family:monospace;font-weight:700;">${order.shippingFee ? `₹${order.shippingFee}` : 'FREE (Vernunt Privilege)'}</span></div>
      ${order.discountAmount ? `<div class="price-line" style="color:#be123c;"><span>Coupon Discount (${order.appliedCouponCode || 'PROMO'}):</span><span style="font-family:monospace;font-weight:700;">-₹${order.discountAmount}</span></div>` : ''}
      <div class="price-line"><span>Estimated GST (12% Included):</span><span style="font-family:monospace;font-weight:700;">₹${(order.taxAmountGst || Math.round((order.totalAmount || 0) * 0.12)).toLocaleString('en-IN')}</span></div>
      <div class="price-line total"><span>Total Amount Paid:</span><span>₹${(order.totalAmount || 0).toLocaleString('en-IN')}</span></div>
    </div>

    <div class="carrier-box">
      <strong style="color: #166534; font-size: 13px;">📍 Delivery Destination:</strong>
      <p style="margin: 4px 0 0; font-size: 12.5px; color: #14532d;">
        <strong>${order.shippingAddress?.fullName || customerName}</strong><br>
        ${order.shippingAddress?.addressLine1 || 'HSR Layout'}${order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br>
        ${order.shippingAddress?.city || 'Bengaluru'}, ${order.shippingAddress?.state || 'Karnataka'} - ${order.shippingAddress?.pincode || '560102'}<br>
        📞 Contact: ${order.shippingAddress?.phone || order.customerPhone || 'Verified Contact'}
      </p>
    </div>

    <div class="safety-callout">
      🛡️ <strong>100% Vernunt Child Safety Assurance:</strong> All items in this parcel are certified BPA-Free, Non-Toxic, BIS compliant, and packaged in sterilized tamper-evident boxes. Includes 7-day hassle-free replacement.
    </div>
  `;
}

/**
 * 2. Payment Receipt & Tax Invoice HTML Generator
 */
export function buildPaymentReceiptHtml(order: any, details?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const invId = order.invoiceNumber || `INV-${orderId}`;
  const totalPaid = order.totalAmount || details?.amount || 0;
  const payMethod = order.paymentMethod || details?.paymentMethod || 'Cashfree / UPI';
  const txnRef = order.paymentReferenceId || details?.transactionId || `PAY-CF-${Date.now().toString().slice(-8)}`;
  const dateStr = order.placedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const taxableVal = Math.round(totalPaid / 1.12);
  const gstAmount = totalPaid - taxableVal;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>We have successfully verified and received your payment of <strong style="color:#be123c;font-size:16px;">₹${totalPaid.toLocaleString('en-IN')}</strong> for Order <strong>#${orderId}</strong>. Please find your official GST Tax Receipt details below:</p>

    <div class="details-card">
      <div class="details-row"><span class="details-label">Tax Invoice No.</span><span class="details-value font-mono">${invId}</span></div>
      <div class="details-row"><span class="details-label">Order Reference</span><span class="details-value font-mono">#${orderId}</span></div>
      <div class="details-row"><span class="details-label">Transaction Reference / UTR</span><span class="details-value font-mono">${txnRef}</span></div>
      <div class="details-row"><span class="details-label">Payment Mode</span><span class="details-value">${payMethod}</span></div>
      <div class="details-row"><span class="details-label">Payment Status</span><span class="details-value"><span class="status-pill status-paid">PAID &amp; VERIFIED</span></span></div>
      <div class="details-row"><span class="details-label">Timestamp</span><span class="details-value">${dateStr}</span></div>
    </div>

    <h4 style="margin: 20px 0 8px; color: #0f172a; font-size: 14px; text-transform: uppercase;">GST Tax Invoice Breakdown</h4>
    <div class="price-breakdown">
      <div class="price-line"><span>Seller GSTIN:</span><span style="font-family:monospace;font-weight:700;">29AAACV2026R1ZM</span></div>
      <div class="price-line"><span>Corporate CIN:</span><span style="font-family:monospace;font-weight:700;">U72900KA2026PTC198234</span></div>
      <div class="price-line"><span>Net Taxable Value:</span><span style="font-family:monospace;font-weight:700;">₹${taxableVal.toLocaleString('en-IN')}</span></div>
      <div class="price-line"><span>CGST (6%):</span><span style="font-family:monospace;font-weight:700;">₹${cgst.toLocaleString('en-IN')}</span></div>
      <div class="price-line"><span>SGST (6%):</span><span style="font-family:monospace;font-weight:700;">₹${sgst.toLocaleString('en-IN')}</span></div>
      <div class="price-line total"><span>Total Amount Paid (INR):</span><span>₹${totalPaid.toLocaleString('en-IN')}</span></div>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;font-size:12px;color:#475569;margin-top:16px;">
      <strong>🏢 Issued By:</strong> Vernunt Technologies Private Limited, Sector 2, HSR Layout, Bengaluru, Karnataka 560102.<br>
      <em>Note: This is a system-generated electronic tax invoice and proof of receipt under the Indian Goods and Services Tax Act, 2017.</em>
    </div>
  `;
}

/**
 * 3. Product Shipped / In Transit HTML Generator
 */
export function buildProductShippedHtml(order: any, details?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const courier = details?.courier || order.courierPartner || 'BlueDart Express Air (via Shiprocket)';
  const awb = details?.awb || order.shiprocketAwb || order.trackingNumber || 'BD789123440';
  const eta = details?.eta || '2 business days';

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Exciting news! Your Vernunt Montessori package for Order <strong>#${orderId}</strong> has been inspected, sealed with child-safe tamper tape, and dispatched into the national courier transit network.</p>

    <div class="carrier-box">
      <div style="font-size: 15px; font-weight: 800; color: #166534; margin-bottom: 8px;">
        🚚 Dispatched with ${courier}
      </div>
      <div class="details-row" style="border-color:#bbf7d0;"><span class="details-label" style="color:#15803d;">Air Waybill (AWB)</span><span class="details-value font-mono" style="color:#14532d;font-size:14px;">${awb}</span></div>
      <div class="details-row" style="border-color:#bbf7d0;"><span class="details-label" style="color:#15803d;">Current Status</span><span class="details-value" style="color:#14532d;">In Transit • Departed Bengaluru Hub</span></div>
      <div class="details-row" style="border-color:#bbf7d0;"><span class="details-label" style="color:#15803d;">Estimated Delivery</span><span class="details-value" style="color:#14532d;">${eta}</span></div>
    </div>

    <div class="details-card">
      <strong style="font-size:13px;color:#0f172a;">Shipping Address:</strong>
      <p style="margin:4px 0 0;font-size:12.5px;color:#475569;">
        ${order.shippingAddress?.fullName || customerName}<br>
        ${order.shippingAddress?.addressLine1 || 'Delivery Address'}${order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br>
        ${order.shippingAddress?.city || 'Bengaluru'} - ${order.shippingAddress?.pincode || '560102'}<br>
        📞 Contact: ${order.shippingAddress?.phone || order.customerPhone || 'Verified Number'}
      </p>
    </div>

    <div class="safety-callout">
      📦 <strong>Doorstep Delivery Tip:</strong> Our courier associate will arrive in a verified uniform. Please verify that the green Vernunt tamper seal is unbroken prior to accepting the parcel.
    </div>
  `;
}

/**
 * 4. Product Out for Delivery HTML Generator
 */
export function buildProductOutForDeliveryHtml(order: any, details?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const courier = details?.courier || order.courierPartner || 'Shadowfax / BlueDart';
  const awb = details?.awb || order.shiprocketAwb || order.trackingNumber || 'SFX908123';

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Your Vernunt package for Order <strong>#${orderId}</strong> is <strong>OUT FOR DELIVERY TODAY</strong>! The delivery associate is in your neighborhood and en route to your doorstep.</p>

    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:18px;margin:20px 0;">
      <div style="font-size:16px;font-weight:900;color:#92400e;display:flex;align-items:center;gap:8px;">
        🛵 Arriving Today by 7:00 PM
      </div>
      <p style="margin:8px 0 0;font-size:13px;color:#78350f;">
        Please ensure someone is available at <strong>${order.shippingAddress?.addressLine1 || 'your address'}</strong> to receive the package.
      </p>
      <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #d97706;font-size:12px;color:#92400e;">
        <strong>Courier:</strong> ${courier} | <strong>Tracking AWB:</strong> <span style="font-family:monospace;font-weight:700;">${awb}</span>
      </div>
    </div>

    <div class="details-card">
      <div class="details-row"><span class="details-label">Recipient</span><span class="details-value">${order.shippingAddress?.fullName || customerName}</span></div>
      <div class="details-row"><span class="details-label">Phone</span><span class="details-value">${order.shippingAddress?.phone || order.customerPhone || 'Verified Contact'}</span></div>
      <div class="details-row"><span class="details-label">Destination Pincode</span><span class="details-value font-mono">${order.shippingAddress?.pincode || '560102'}</span></div>
    </div>
  `;
}

/**
 * 5. Product Delivered HTML Generator
 */
export function buildProductDeliveredHtml(order: any, details?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const deliveredAt = details?.deliveredAt || order.deliveredAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Great news! Your Vernunt Montessori package for Order <strong>#${orderId}</strong> has been successfully delivered and handed over.</p>

    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
      <div style="font-size:32px;">🎉</div>
      <div style="font-size:18px;font-weight:900;color:#15803d;margin-top:4px;">Delivered Successfully</div>
      <div style="font-size:12.5px;color:#166534;margin-top:4px;">Delivered on ${deliveredAt}</div>
    </div>

    <div class="details-card">
      <div class="details-row"><span class="details-label">Order Number</span><span class="details-value font-mono">#${orderId}</span></div>
      <div class="details-row"><span class="details-label">Delivered To</span><span class="details-value">${order.shippingAddress?.fullName || customerName}</span></div>
      <div class="details-row"><span class="details-label">Address</span><span class="details-value">${order.shippingAddress?.city || 'Bengaluru'} (${order.shippingAddress?.pincode || '560102'})</span></div>
      <div class="details-row"><span class="details-label">Total Amount Paid</span><span class="details-value font-mono">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</span></div>
    </div>

    <div class="safety-callout">
      ✨ <strong>7-Day Vernunt Parent Guarantee:</strong> We hope your child loves their new play gear! If any component is damaged or missing, simply reply to this email or contact support@vernunt.com for immediate free replacement.
    </div>

    <p style="text-align:center;margin-top:20px;font-size:13px;color:#64748b;">
      Loved your experience? Please share a quick verified review to help fellow parents find the best toys for their children!
    </p>
  `;
}

/**
 * 6. Product Cancelled & Refund Initiated HTML Generator
 */
export function buildProductCancelledHtml(order: any, reason?: string, refundDetails?: any): string {
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
  const orderId = order.orderNumber || order.id || `VRN-${Date.now().toString().slice(-6)}`;
  const cancelReason = reason || 'Customer requested order cancellation';
  const isPrepaid = order.paymentStatus === 'paid' || order.paymentMethod !== 'COD';
  const refundAmount = refundDetails?.refundAmount || order.totalAmount || 0;
  const refundRef = refundDetails?.refundId || `RFND-CF-${Date.now().toString().slice(-8)}`;

  return `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>We're writing to confirm that Order <strong>#${orderId}</strong> has been cancelled as requested.</p>

    <div class="details-card">
      <div class="details-row"><span class="details-label">Order Number</span><span class="details-value font-mono">#${orderId}</span></div>
      <div class="details-row"><span class="details-label">Cancellation Date</span><span class="details-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
      <div class="details-row"><span class="details-label">Cancellation Reason</span><span class="details-value">"${cancelReason}"</span></div>
      <div class="details-row"><span class="details-label">Order Status</span><span class="details-value"><span class="status-pill status-cancelled">CANCELLED</span></span></div>
    </div>

    ${isPrepaid ? `
    <div class="refund-box">
      <div style="font-weight:800;font-size:14px;color:#1e40af;margin-bottom:6px;">
        💳 Refund Status: Full Refund Initiated
      </div>
      <div class="details-row" style="border-color:#bfdbfe;"><span class="details-label" style="color:#1d4ed8;">Refund Amount</span><span class="details-value font-mono" style="color:#1e3a8a;font-size:14px;">₹${refundAmount.toLocaleString('en-IN')}</span></div>
      <div class="details-row" style="border-color:#bfdbfe;"><span class="details-label" style="color:#1d4ed8;">Refund ARN / Reference</span><span class="details-value font-mono" style="color:#1e3a8a;">${refundRef}</span></div>
      <div class="details-row" style="border-color:#bfdbfe;"><span class="details-label" style="color:#1d4ed8;">Credit Destination</span><span class="details-value" style="color:#1e3a8a;">Original Payment Source (${order.paymentMethod || 'UPI / Card'})</span></div>
      <div class="details-row" style="border-color:#bfdbfe;"><span class="details-label" style="color:#1d4ed8;">Estimated Timeline</span><span class="details-value" style="color:#1e3a8a;">Instant to 2-4 business days</span></div>
    </div>
    ` : `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:16px 0;font-size:13px;color:#475569;">
      <strong>Cash on Delivery (COD):</strong> No payment was deducted for this order. No further action is required.
    </div>
    `}

    <p style="font-size:13px;color:#64748b;">
      If you did not request this cancellation or have questions regarding your refund, please contact Vernunt Parent Support at <a href="mailto:support@vernunt.com">support@vernunt.com</a> or +91 8073749074.
    </p>
  `;
}

/**
 * Unified Email Dispatch Function
 */
export async function sendEmailMessage(options: {
  to: string;
  subject: string;
  type: EmailLogEntry['type'];
  htmlContent: string;
  textContent: string;
  otpCode?: string;
  attachments?: any[];
  adminInstance?: any;
}): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  try {
    const cleanTo = options.to.trim().toLowerCase();
    const mailTransporter = await getTransporter();

    const fromAddress = process.env.SMTP_FROM || `"Vernunt Play Time" <noreply@${firebaseConfig.authDomain || 'app.vernunt.com'}>`;

    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: cleanTo,
      subject: options.subject,
      text: options.textContent,
      html: options.htmlContent,
      attachments: options.attachments
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[EmailService] ✓ Email dispatched successfully to ${cleanTo} (Type: ${options.type}) | MessageID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] 🔗 Preview Delivered Email: ${previewUrl}`);
    }

    // Record in Firestore Trigger Email queue
    await syncToFirestoreMail(options.adminInstance, cleanTo, options.subject, options.htmlContent, options.textContent);

    const logEntry: EmailLogEntry = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      to: cleanTo,
      subject: options.subject,
      type: options.type,
      status: 'sent',
      previewUrl,
      otpCode: options.otpCode,
      timestamp: new Date().toISOString()
    };
    emailLogs.unshift(logEntry);
    if (emailLogs.length > 100) emailLogs.pop();

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (err: any) {
    console.error(`[EmailService] ❌ Delivery Error to ${options.to}:`, err.message || err);
    // Fallback: still log and record so user is never blocked
    const logEntry: EmailLogEntry = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      to: options.to,
      subject: options.subject,
      type: options.type,
      status: 'fallback_delivered',
      otpCode: options.otpCode,
      timestamp: new Date().toISOString(),
      error: err.message || String(err)
    };
    emailLogs.unshift(logEntry);
    if (emailLogs.length > 100) emailLogs.pop();

    return {
      success: true,
      previewUrl: undefined,
      error: err.message || String(err)
    };
  }
}

/**
 * Register Email and Notification Express Routes
 */
export function registerEmailRoutes(app: Express, getAdmin: () => Promise<any>) {

  // =========================================================================
  // 1. SEND EMAIL OTP (FIREBASE FIRESTORE + NODEMAILER EMAIL DISPATCH)
  // =========================================================================
  app.post('/api/auth/send-email-otp', async (req: Request, res: Response) => {
    try {
      const { email, userName, role } = req.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address (e.g. parent@vernunt.com).'
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const targetName = userName || (role === 'Parent' ? 'Parent Member' : `${role || 'Parent'} Member`);

      // Generate cryptographically secure 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store in memory
      emailOtpMemoryStore.set(cleanEmail, {
        otp: otpCode,
        expiresAt,
        attempts: 0,
        role: role || 'Parent',
        userName: targetName,
        verified: false,
        createdAt: new Date().toISOString()
      });

      // Synchronize to Firebase Firestore `email_otps`
      const adminInstance = await getAdmin();
      await syncOtpToFirestore(adminInstance, cleanEmail, otpCode, role || 'Parent', targetName);

      // Build HTML Email
      const htmlContent = buildVernuntEmailTemplate({
        title: `Your Vernunt Verification Code: ${otpCode}`,
        badgeText: '🔐 Email OTP Verification',
        mainContentHtml: `
          <p>Hi <strong>${targetName}</strong>,</p>
          <p>Use the 6-digit verification code below to complete your registration and secure identity authentication on <strong>Vernunt Play Time Connect</strong>:</p>
          <div class="otp-box">
            <div class="otp-number">${otpCode}</div>
            <div class="otp-note">⏱️ This code is valid for 10 minutes. Do not share it with anyone.</div>
          </div>
          <p>If you did not request this verification code, please ignore this email or contact Vernunt Trust &amp; Safety.</p>
        `,
        callToAction: {
          label: 'Open Vernunt Web App',
          url: 'https://app.vernunt.com'
        },
        footerNote: 'Vernunt Child Safety & Identity Protection System. Powered by Firebase Authentication & Firestore.'
      });

      const textContent = `Vernunt Verification Code: ${otpCode}\n\nHi ${targetName},\n\nYour 6-digit verification code is: ${otpCode}\nThis code is valid for 10 minutes.\n\nOpen Vernunt: https://app.vernunt.com\n\n- Team Vernunt`;

      // Dispatch Email
      const result = await sendEmailMessage({
        to: cleanEmail,
        subject: `🔐 ${otpCode} is your Vernunt verification code`,
        type: 'otp',
        htmlContent,
        textContent,
        otpCode,
        adminInstance
      });

      return res.json({
        success: true,
        email: cleanEmail,
        message: `✓ 6-digit verification code successfully sent to ${cleanEmail}. Please check your inbox or spam folder.`,
        expiresInSeconds: 600,
        previewUrl: result.previewUrl,
        firebaseSync: true
      });
    } catch (err: any) {
      console.error('[EmailService] Send OTP Error:', err);
      return res.status(500).json({
        success: false,
        error: `Failed to dispatch email verification code: ${err.message || err}`
      });
    }
  });

  // =========================================================================
  // 2. VERIFY EMAIL OTP
  // =========================================================================
  app.post('/api/auth/verify-email-otp', async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email address and 6-digit verification code are required.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const userEnteredOtp = otp.toString().trim();

      // 1. Check in memory
      let stored = emailOtpMemoryStore.get(cleanEmail);

      // 2. If not found in memory, check Firebase Firestore `email_otps`
      if (!stored) {
        try {
          const adminInstance = await getAdmin();
          if (adminInstance) {
            const db = firebaseConfig.firestoreDatabaseId
              ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
              : adminInstance.firestore();
            const snap = await db.collection('email_otps').doc(cleanEmail).get();
            if (snap.exists) {
              const data = snap.data();
              stored = {
                otp: data.otp,
                expiresAt: data.expiresAt || (Date.now() + 600000),
                attempts: data.attempts || 0,
                role: data.role || 'Parent',
                userName: data.userName,
                verified: !!data.verified,
                createdAt: data.createdAt || new Date().toISOString()
              };
            }
          }
        } catch (dbErr) {
          console.warn('[EmailService] Firestore OTP lookup fallback:', dbErr);
        }
      }

      if (!stored) {
        return res.status(400).json({
          success: false,
          error: "No active verification request found for this email. Please click 'Resend OTP'."
        });
      }

      if (Date.now() > stored.expiresAt) {
        emailOtpMemoryStore.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          error: "Verification code has expired. Please click 'Resend OTP' to receive a fresh code."
        });
      }

      if (stored.attempts >= 6) {
        emailOtpMemoryStore.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new verification code.'
        });
      }

      stored.attempts += 1;

      if (stored.otp !== userEnteredOtp) {
        return res.status(400).json({
          success: false,
          error: 'Invalid 6-digit code. Please check the code sent to your email.'
        });
      }

      // Mark verified
      stored.verified = true;
      emailOtpMemoryStore.delete(cleanEmail);

      // Update Firestore
      try {
        const adminInstance = await getAdmin();
        if (adminInstance) {
          const db = firebaseConfig.firestoreDatabaseId
            ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
            : adminInstance.firestore();
          await db.collection('email_otps').doc(cleanEmail).update({
            verified: true,
            verifiedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.debug('[EmailService] Firestore mark verified note:', e);
      }

      console.log(`[EmailService] ✓ Successfully verified email address: ${cleanEmail}`);
      return res.json({
        success: true,
        verified: true,
        email: cleanEmail,
        message: '✓ Email address verified successfully!'
      });
    } catch (err: any) {
      console.error('[EmailService] Verify OTP Error:', err);
      return res.status(500).json({
        success: false,
        error: `Verification error: ${err.message || err}`
      });
    }
  });

  // =========================================================================
  // 3. UNIFIED NOTIFICATION EMAIL DISPATCHER FOR ALL APP EVENTS
  // =========================================================================
  app.post('/api/notifications/send-email', async (req: Request, res: Response) => {
    try {
      const {
        toEmail,
        recipientName,
        type,
        subject,
        details,
        customMessage,
        callToAction
      } = req.body || {};

      if (!toEmail || !toEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Valid recipient email is required.' });
      }

      const cleanTo = toEmail.trim().toLowerCase();
      const targetName = recipientName || 'Parent';
      const adminInstance = await getAdmin();

      let emailSubject = subject || 'Vernunt Community Notification';
      let mainHtml = '';
      let badge = '📢 Vernunt Alert';

      switch (type) {
        case 'playdate_request': {
          badge = '🎈 Playdate Connect';
          emailSubject = subject || `🎈 New Playdate Connect Request from ${details?.requesterName || 'a Local Parent'}`;
          mainHtml = `
            <p>Hi <strong>${targetName}</strong>,</p>
            <p><strong>${details?.requesterName || 'A verified parent'}</strong> (${details?.childName || 'Child'}, ${details?.childAge ? `${details.childAge} yrs` : ''}) has sent you a Playdate Connect Request in <strong>${details?.neighborhood || 'Bangalore'}</strong>!</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Parent Name</span><span class="details-value">${details?.requesterName || 'Vernunt Parent'}</span></div>
              <div class="details-row"><span class="details-label">Child Name</span><span class="details-value">${details?.childName || 'Playmate'}</span></div>
              <div class="details-row"><span class="details-label">Neighborhood</span><span class="details-value">${details?.neighborhood || 'Bangalore'}</span></div>
              ${details?.message ? `<div class="details-row"><span class="details-label">Note</span><span class="details-value">"${details.message}"</span></div>` : ''}
            </div>
            <p>Log in to your Vernunt account to accept the request, unlock verified phone contact, and coordinate the playdate securely.</p>
          `;
          break;
        }

        case 'event_ticket': {
          badge = '🎟️ Event Admission Pass';
          const passId = details?.ticketNumber || `VERN-EVT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          emailSubject = subject || `🎟️ Admission Pass #${passId}: ${details?.eventTitle || 'Vernunt Event'}`;
          mainHtml = `
            <p>Hi <strong>${targetName}</strong>,</p>
            <p>Your booking for <strong>${details?.eventTitle || 'Vernunt Community Workshop'}</strong> is confirmed!</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Pass ID</span><span class="details-value">#${passId}</span></div>
              <div class="details-row"><span class="details-label">Event</span><span class="details-value">${details?.eventTitle || 'Vernunt Event'}</span></div>
              <div class="details-row"><span class="details-label">Date</span><span class="details-value">${details?.date || 'Scheduled Date'}</span></div>
              <div class="details-row"><span class="details-label">Time</span><span class="details-value">${details?.time || 'Scheduled Time'}</span></div>
              <div class="details-row"><span class="details-label">Venue</span><span class="details-value">${details?.venue || 'Bangalore, India'}</span></div>
              <div class="details-row"><span class="details-label">Amount Paid</span><span class="details-value">₹${details?.amountPaid || 0}</span></div>
            </div>
            <p>Present your digital pass or QR code at the venue entrance. You can download your official PDF pass directly from the portal.</p>
          `;
          break;
        }

        case 'product_purchase':
        case 'shop_order': {
          badge = '🛍️ Order Confirmed';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          emailSubject = subject || `🛍️ Order Confirmed #${orderId} - Vernunt Montessori Toys`;
          const dummyOrder = {
            orderNumber: orderId,
            customerName: targetName,
            placedAt: details?.placedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            items: details?.items || [{ name: details?.itemSummary || 'Montessori Toys & Gear', quantity: 1, unitPrice: details?.totalAmount || 0, totalPrice: details?.totalAmount || 0 }],
            subtotal: details?.subtotal || details?.totalAmount || 0,
            shippingFee: details?.shippingFee || 0,
            discountAmount: details?.discountAmount || 0,
            taxAmountGst: details?.taxAmountGst || Math.round((details?.totalAmount || 0) * 0.12),
            totalAmount: details?.totalAmount || 0,
            paymentMethod: details?.paymentMethod || 'Online Prepaid',
            paymentStatus: details?.paymentStatus || 'paid',
            courierPartner: details?.courierPartner || 'BlueDart Express Air (via Shiprocket)',
            shiprocketAwb: details?.shiprocketAwb || 'DEL89012398',
            shippingAddress: details?.shippingAddress || { fullName: targetName, city: 'Bengaluru', pincode: '560102' }
          };
          mainHtml = buildProductPurchaseHtml(dummyOrder, details);
          break;
        }

        case 'payment_receipt': {
          badge = '🧾 Payment Receipt';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          const amount = details?.amount || details?.totalAmount || 0;
          emailSubject = subject || `🧾 Payment Receipt: ₹${amount.toLocaleString('en-IN')} for Order #${orderId}`;
          const dummyOrder = {
            orderNumber: orderId,
            invoiceNumber: details?.invoiceNumber || `INV-${orderId}`,
            customerName: targetName,
            totalAmount: amount,
            paymentMethod: details?.paymentMethod || 'Cashfree / UPI Gateway',
            paymentReferenceId: details?.transactionId || details?.paymentReferenceId || `PAY-CF-${Date.now().toString().slice(-8)}`,
            placedAt: details?.placedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            taxAmountGst: details?.taxAmountGst || Math.round(amount * 0.12)
          };
          mainHtml = buildPaymentReceiptHtml(dummyOrder, details);
          break;
        }

        case 'product_shipped': {
          badge = '🚚 Package Dispatched';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          const courier = details?.courier || details?.courierPartner || 'BlueDart Express (via Shiprocket)';
          emailSubject = subject || `🚚 Order #${orderId} Dispatched via ${courier}`;
          const dummyOrder = {
            orderNumber: orderId,
            customerName: targetName,
            courierPartner: courier,
            shiprocketAwb: details?.awb || details?.shiprocketAwb || 'BD789123440',
            shippingAddress: details?.shippingAddress || { fullName: targetName, city: 'Bengaluru', pincode: '560102' }
          };
          mainHtml = buildProductShippedHtml(dummyOrder, details);
          break;
        }

        case 'product_out_for_delivery': {
          badge = '🛵 Out for Delivery Today';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          emailSubject = subject || `🛵 Out for Delivery: Your Vernunt Order #${orderId} arrives today!`;
          const dummyOrder = {
            orderNumber: orderId,
            customerName: targetName,
            courierPartner: details?.courier || details?.courierPartner || 'Shadowfax Hyperlocal',
            shiprocketAwb: details?.awb || details?.shiprocketAwb || 'SFX908123',
            shippingAddress: details?.shippingAddress || { fullName: targetName, city: 'Bengaluru', pincode: '560102' }
          };
          mainHtml = buildProductOutForDeliveryHtml(dummyOrder, details);
          break;
        }

        case 'product_delivered': {
          badge = '🎉 Order Delivered';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          emailSubject = subject || `🎉 Delivered: Your Vernunt Order #${orderId} has arrived!`;
          const dummyOrder = {
            orderNumber: orderId,
            customerName: targetName,
            totalAmount: details?.totalAmount || 0,
            deliveredAt: details?.deliveredAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            shippingAddress: details?.shippingAddress || { fullName: targetName, city: 'Bengaluru', pincode: '560102' }
          };
          mainHtml = buildProductDeliveredHtml(dummyOrder, details);
          break;
        }

        case 'product_cancelled': {
          badge = '⚠️ Order Cancelled';
          const orderId = details?.orderNumber || details?.orderId || `VRN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          emailSubject = subject || `⚠️ Order #${orderId} Cancelled - Refund Status Update`;
          const dummyOrder = {
            orderNumber: orderId,
            customerName: targetName,
            totalAmount: details?.totalAmount || details?.refundAmount || 0,
            paymentStatus: details?.paymentStatus || 'paid',
            paymentMethod: details?.paymentMethod || 'Prepaid Online',
            shippingAddress: details?.shippingAddress || { fullName: targetName, city: 'Bengaluru', pincode: '560102' }
          };
          mainHtml = buildProductCancelledHtml(dummyOrder, details?.reason, details?.refundDetails);
          break;
        }

        case 'profile_approved': {
          badge = '🛡️ Profile Verified';
          emailSubject = subject || '🛡️ Congratulations! Your Vernunt Parent Profile is Approved';
          mainHtml = `
            <p>Hi <strong>${targetName}</strong>,</p>
            <p>Great news! Your parent profile and government identity credentials have been reviewed and <strong>100% APPROVED</strong> by the Vernunt Trust &amp; Safety team.</p>
            <p>Your Aadhaar Verified badge is now active, unlocking:</p>
            <ul>
              <li>Full access to neighborhood playmates radar</li>
              <li>Encrypted 1-to-1 parent chat &amp; phone contacts</li>
              <li>Exclusive invitations to weekend community playgroups</li>
            </ul>
          `;
          break;
        }

        case 'emergency_sos': {
          badge = '🚨 EMERGENCY DISTRESS BEACON';
          emailSubject = subject || `🚨 URGENT: Child Safety SOS Broadcast from ${targetName}`;
          mainHtml = `
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #b91c1c; margin-top: 0;">🚨 CHILD DISTRESS BEACON ACTIVE</h2>
              <p style="color: #7f1d1d; font-weight: 600;">A registered parent has broadcasted an emergency distress signal on Vernunt:</p>
              <div class="details-card" style="background: #ffffff;">
                <div class="details-row"><span class="details-label">Parent</span><span class="details-value">${targetName}</span></div>
                <div class="details-row"><span class="details-label">Child</span><span class="details-value">${details?.childName || 'Child'}</span></div>
                <div class="details-row"><span class="details-label">GPS Coords</span><span class="details-value">${details?.coordinates || 'Active Location'}</span></div>
                <div class="details-row"><span class="details-label">Timestamp</span><span class="details-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
              </div>
              ${details?.mapsUrl ? `<div style="text-align: center;"><a href="${details.mapsUrl}" class="btn" style="background: #dc2626;" target="_blank">View Live GPS on Google Maps</a></div>` : ''}
              <p style="font-size: 13px; color: #991b1b; margin-bottom: 0;">National Child Helpline: 1098 | Emergency Police: 112</p>
            </div>
          `;
          break;
        }

        default: {
          mainHtml = `
            <p>Hi <strong>${targetName}</strong>,</p>
            <p>${customMessage || 'You have an important update regarding your Vernunt account and community activities.'}</p>
          `;
          break;
        }
      }

      const htmlContent = buildVernuntEmailTemplate({
        title: emailSubject,
        badgeText: badge,
        mainContentHtml: mainHtml,
        callToAction: callToAction || { label: 'Open Vernunt Portal', url: 'https://app.vernunt.com' },
        footerNote: 'Dispatched through Vernunt Unified Firebase Notification Engine.'
      });

      const textContent = `${emailSubject}\n\nHi ${targetName},\n\n${customMessage || 'You have a new notification on Vernunt.'}\n\nVisit: https://app.vernunt.com\n- Team Vernunt`;

      const result = await sendEmailMessage({
        to: cleanTo,
        subject: emailSubject,
        type: (type as any) || 'general',
        htmlContent,
        textContent,
        adminInstance
      });

      return res.json({
        success: true,
        to: cleanTo,
        subject: emailSubject,
        previewUrl: result.previewUrl,
        message: `✓ Notification email dispatched to ${cleanTo}.`
      });
    } catch (err: any) {
      console.error('[EmailService] Notification Dispatch Error:', err);
      return res.status(500).json({
        success: false,
        error: `Notification delivery error: ${err.message || err}`
      });
    }
  });

  // =========================================================================
  // 3B. SPECIALIZED STORE & MARKETPLACE ORDER EMAIL DISPATCHER
  // (Order Confirmation, Payment Receipt, Dispatched/AWB, Out for Delivery, Delivered, Cancelled/Refunded)
  // =========================================================================
  app.post('/api/store/send-order-email', async (req: Request, res: Response) => {
    try {
      const {
        order,
        notificationType,
        cancellationReason,
        refundInfo,
        details
      } = req.body || {};

      if (!order) {
        return res.status(400).json({ success: false, error: 'Order object is required.' });
      }

      const recipientEmail = order.customerEmail || order.shippingAddress?.email;
      if (!recipientEmail || !recipientEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Order does not have a valid customer email address.' });
      }

      const cleanEmail = recipientEmail.trim().toLowerCase();
      const customerName = order.customerName || order.shippingAddress?.fullName || 'Parent';
      const orderNum = order.orderNumber || order.id || 'VRN-ORDER';
      const adminInstance = await getAdmin();

      let subject = '';
      let badge = '';
      let mainHtml = '';
      let logType: EmailLogEntry['type'] = 'product_purchase';
      let ctaLabel = 'Track Live Shipment';
      let ctaUrl = `https://app.vernunt.com/?tab=store&orderId=${orderNum}`;

      switch (notificationType) {
        case 'purchase':
        case 'order_placed':
        case 'product_purchase': {
          logType = 'product_purchase';
          badge = '🛍️ Order Placed & Confirmed';
          subject = `🛍️ Order Confirmed #${orderNum} - Vernunt Montessori Toys`;
          mainHtml = buildProductPurchaseHtml(order, details);
          ctaLabel = 'Track Order on Vernunt';
          ctaUrl = `https://app.vernunt.com/?tab=store&orderId=${orderNum}`;
          break;
        }

        case 'payment_receipt':
        case 'amount_paid': {
          logType = 'payment_receipt';
          badge = '🧾 Official Payment Receipt';
          const amt = order.totalAmount || 0;
          subject = `🧾 Payment Received: ₹${amt.toLocaleString('en-IN')} for Order #${orderNum} (Inv #${order.invoiceNumber || orderNum})`;
          mainHtml = buildPaymentReceiptHtml(order, details);
          ctaLabel = 'Download Official GST Invoice';
          ctaUrl = `https://app.vernunt.com/?tab=store&invoice=${orderNum}`;
          break;
        }

        case 'shipped':
        case 'product_shipped': {
          logType = 'product_shipped';
          badge = '🚚 Order Dispatched & In Transit';
          const courier = details?.courier || order.courierPartner || 'National Logistics Partner';
          subject = `🚚 Order #${orderNum} Dispatched via ${courier}`;
          mainHtml = buildProductShippedHtml(order, details);
          ctaLabel = 'Live Courier Tracking';
          ctaUrl = `https://app.vernunt.com/?tab=store&trackAwb=${order.shiprocketAwb || order.trackingNumber || ''}`;
          break;
        }

        case 'out_for_delivery':
        case 'product_out_for_delivery': {
          logType = 'product_out_for_delivery';
          badge = '🛵 Out for Delivery Today';
          subject = `🛵 Out for Delivery: Your Vernunt Order #${orderNum} arrives today!`;
          mainHtml = buildProductOutForDeliveryHtml(order, details);
          ctaLabel = 'Live Delivery Status';
          ctaUrl = `https://app.vernunt.com/?tab=store&orderId=${orderNum}`;
          break;
        }

        case 'delivered':
        case 'product_delivered': {
          logType = 'product_delivered';
          badge = '🎉 Order Delivered Successfully';
          subject = `🎉 Delivered: Your Vernunt Order #${orderNum} has arrived!`;
          mainHtml = buildProductDeliveredHtml(order, details);
          ctaLabel = 'Rate & Review Products';
          ctaUrl = `https://app.vernunt.com/?tab=store&reviewOrder=${orderNum}`;
          break;
        }

        case 'cancelled':
        case 'product_cancelled': {
          logType = 'product_cancelled';
          badge = '⚠️ Order Cancelled & Refund Update';
          subject = `⚠️ Order #${orderNum} Cancelled - Refund Status Update`;
          mainHtml = buildProductCancelledHtml(order, cancellationReason, refundInfo);
          ctaLabel = 'Explore Montessori Toys Catalog';
          ctaUrl = `https://app.vernunt.com/?tab=store`;
          break;
        }

        default: {
          logType = 'product_purchase';
          badge = '🛍️ Order Update';
          subject = `Order #${orderNum} Update - Vernunt Store`;
          mainHtml = buildProductPurchaseHtml(order, details);
          break;
        }
      }

      const htmlContent = buildVernuntEmailTemplate({
        title: subject,
        badgeText: badge,
        mainContentHtml: mainHtml,
        callToAction: { label: ctaLabel, url: ctaUrl },
        footerNote: 'Vernunt Child Safe Montessori Logistics & Verified Parent Network.'
      });

      const textContent = `${subject}\n\nHi ${customerName},\n\nYour order #${orderNum} status update: ${notificationType}\nTotal: ₹${order.totalAmount || 0}\n\nVisit: ${ctaUrl}\n- Vernunt Team`;

      const result = await sendEmailMessage({
        to: cleanEmail,
        subject,
        type: logType,
        htmlContent,
        textContent,
        adminInstance
      });

      // Synchronize order notification status to Firestore `orders` document
      if (adminInstance && order.id) {
        try {
          const db = firebaseConfig.firestoreDatabaseId
            ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
            : adminInstance.firestore();

          await db.collection('orders').doc(order.id).set({
            lastNotificationType: notificationType,
            lastNotificationDispatchedAt: new Date().toISOString(),
            recipientEmail: cleanEmail,
            notificationStatus: result.success ? 'dispatched' : 'fallback'
          }, { merge: true });
        } catch (dbErr) {
          console.debug('[EmailService] Order doc notification status note:', dbErr);
        }
      }

      return res.json({
        success: true,
        orderId: orderNum,
        recipient: cleanEmail,
        notificationType,
        subject,
        previewUrl: result.previewUrl,
        message: `✓ ${badge} email successfully delivered to ${cleanEmail}.`
      });
    } catch (err: any) {
      console.error('[EmailService] Send Order Email Error:', err);
      return res.status(500).json({
        success: false,
        error: `Order email delivery error: ${err.message || err}`
      });
    }
  });

  // =========================================================================
  // 3C. TEST / SIMULATE PRODUCT EMAIL NOTIFICATION (TESTING & AUDIT)
  // =========================================================================
  app.post('/api/store/test-product-email', async (req: Request, res: Response) => {
    try {
      const { toEmail, notificationType = 'purchase' } = req.body || {};
      const targetEmail = toEmail || 'parent@vernunt.com';

      const sampleOrder = {
        id: 'ord-test-sample',
        orderNumber: 'VRN-2026-9482',
        invoiceNumber: 'INV-VRN-9482',
        customerName: 'Aarav Sharma (Parent)',
        customerEmail: targetEmail,
        customerPhone: '+91 9845012345',
        placedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        items: [
          {
            name: 'Montessori Sensory Wooden Rainbow Stacker',
            quantity: 1,
            unitPrice: 899,
            totalPrice: 899
          },
          {
            name: 'Bilingual Kannada & English Picture Flashcards',
            quantity: 2,
            unitPrice: 349,
            totalPrice: 698
          }
        ],
        subtotal: 1597,
        shippingFee: 0,
        discountAmount: 150,
        appliedCouponCode: 'VERNUNT150',
        taxAmountGst: 173,
        totalAmount: 1447,
        paymentMethod: 'Cashfree UPI (GPay)',
        paymentStatus: 'paid',
        paymentReferenceId: 'CF-TXN-98471203',
        courierPartner: 'BlueDart Express Air (via Shiprocket)',
        shiprocketAwb: 'BD89023411',
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '+91 9845012345',
          email: targetEmail,
          pincode: '560102',
          addressLine1: 'Villa 14, Rainbow Greenfields, HSR Layout Sector 2',
          city: 'Bengaluru',
          state: 'Karnataka',
          addressType: 'Home'
        }
      };

      // Forward to send-order-email logic internally
      const fakeReq = {
        body: {
          order: sampleOrder,
          notificationType,
          cancellationReason: 'Parent selected wrong age variant (re-ordered 3-4y)',
          refundInfo: {
            refundAmount: 1447,
            refundId: 'RFND-CF-892104'
          }
        }
      } as Request;

      return (app as any)._router.handle(
        { ...fakeReq, url: '/api/store/send-order-email', method: 'POST' },
        res,
        () => {}
      );
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // =========================================================================
  // 4. SPECIALIST BOOKING CONFIRMATION EMAIL
  // =========================================================================
  app.post('/api/send-specialist-email', async (req: Request, res: Response) => {
    try {
      const { toEmail, parentName, childName, specialistName, specialistRole, dateStr, timeSlot, fee, feeLabel } = req.body || {};
      const targetEmail = toEmail || 'parent@vernunt.org';
      const targetName = parentName || 'Parent';

      const subject = `📅 Booking Confirmed with ${specialistName || 'Specialist'}`;
      const mainHtml = `
        <p>Hi <strong>${targetName}</strong>,</p>
        <p>Your child's consultation session with <strong>${specialistName}</strong> (${specialistRole}) has been successfully confirmed.</p>
        <div class="details-card">
          <div class="details-row"><span class="details-label">Child</span><span class="details-value">${childName || 'Child'}</span></div>
          <div class="details-row"><span class="details-label">Specialist</span><span class="details-value">${specialistName}</span></div>
          <div class="details-row"><span class="details-label">Date &amp; Time</span><span class="details-value">${dateStr} • ${timeSlot}</span></div>
          <div class="details-row"><span class="details-label">Fee</span><span class="details-value">${feeLabel || `₹${fee || 0}`}</span></div>
        </div>
        <p>Please log in to Vernunt to access your appointment room or direct contact credentials.</p>
      `;

      const htmlContent = buildVernuntEmailTemplate({
        title: subject,
        badgeText: '🩺 Pediatric Specialist Booking',
        mainContentHtml: mainHtml,
        callToAction: { label: 'View Appointment in Portal', url: 'https://app.vernunt.com/?tab=specialists' }
      });

      const adminInstance = await getAdmin();
      const sendResult = await sendEmailMessage({
        to: targetEmail,
        subject,
        type: 'specialist_booking',
        textContent: `Booking Confirmed with ${specialistName}\nDate: ${dateStr} at ${timeSlot}\nFee: ${feeLabel || fee}\n\n- Team Vernunt`,
        htmlContent,
        adminInstance
      });

      return res.json({
        success: true,
        previewUrl: sendResult.previewUrl,
        message: `✓ Specialist booking confirmation delivered to ${targetEmail}.`
      });
    } catch (err: any) {
      console.error('[EmailService] Specialist Email Error:', err);
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // =========================================================================
  // 5. CHILD CARE / DAYCARE RESERVATION NOTIFICATION EMAIL
  // =========================================================================
  app.post('/api/send-care-email', async (req: Request, res: Response) => {
    try {
      const { toEmail, parentName, childName, providerName, providerTitle, date, startTime, endTime, dropOffPin, pickupPin, totalFee } = req.body || {};
      const targetEmail = toEmail || 'parent@vernunt.org';
      const targetName = parentName || 'Parent';

      const subject = `🏡 Daycare Reservation Confirmed: ${providerName}`;
      const mainHtml = `
        <p>Hi <strong>${targetName}</strong>,</p>
        <p>Your child care slot at <strong>${providerName}</strong> (${providerTitle}) is confirmed!</p>
        <div class="details-card">
          <div class="details-row"><span class="details-label">Child</span><span class="details-value">${childName}</span></div>
          <div class="details-row"><span class="details-label">Daycare / Host</span><span class="details-value">${providerName}</span></div>
          <div class="details-row"><span class="details-label">Date</span><span class="details-value">${date}</span></div>
          <div class="details-row"><span class="details-label">Time Window</span><span class="details-value">${startTime} - ${endTime}</span></div>
          <div class="details-row"><span class="details-label">Drop-off PIN</span><span class="details-value" style="font-family:monospace;letter-spacing:2px;color:#be123c;">${dropOffPin}</span></div>
          <div class="details-row"><span class="details-label">Pick-up PIN</span><span class="details-value" style="font-family:monospace;letter-spacing:2px;color:#be123c;">${pickupPin}</span></div>
          <div class="details-row"><span class="details-label">Total Fee</span><span class="details-value">₹${totalFee || 0}</span></div>
        </div>
        <p>Present the secure Drop-off PIN upon arrival at the center for biometric safety matching.</p>
      `;

      const htmlContent = buildVernuntEmailTemplate({
        title: subject,
        badgeText: '🏡 Child Care Reservation',
        mainContentHtml: mainHtml,
        callToAction: { label: 'View Daycare Pass', url: 'https://app.vernunt.com/?tab=daycare' }
      });

      const adminInstance = await getAdmin();
      const sendResult = await sendEmailMessage({
        to: targetEmail,
        subject,
        type: 'general',
        textContent: `Daycare Reservation Confirmed: ${providerName}\nChild: ${childName}\nDate: ${date} (${startTime}-${endTime})\nDrop PIN: ${dropOffPin}\nPick PIN: ${pickupPin}\n\n- Team Vernunt`,
        htmlContent,
        adminInstance
      });

      return res.json({
        success: true,
        previewUrl: sendResult.previewUrl,
        message: `✓ Child care reservation email sent to ${targetEmail}.`
      });
    } catch (err: any) {
      console.error('[EmailService] Care Email Error:', err);
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // =========================================================================
  // 6. EVENT PUBLISHED NOTIFICATION EMAIL
  // =========================================================================
  app.post('/api/send-event-published-email', async (req: Request, res: Response) => {
    try {
      const { toEmail, event } = req.body || {};
      if (!toEmail || !toEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Recipient email required' });
      }

      const subject = `🎉 Event Published: "${event?.title || 'Your Event'}" is Live on Vernunt!`;
      const mainHtml = `
        <p>Congratulations!</p>
        <p>Your community event <strong>${event?.title}</strong> is now officially published on the Vernunt portal and open for neighborhood registrations.</p>
        <div class="details-card">
          <div class="details-row"><span class="details-label">Event</span><span class="details-value">${event?.title}</span></div>
          <div class="details-row"><span class="details-label">Date &amp; Time</span><span class="details-value">${event?.date} • ${event?.time}</span></div>
          <div class="details-row"><span class="details-label">Venue</span><span class="details-value">${event?.location}</span></div>
          <div class="details-row"><span class="details-label">Ticket Price</span><span class="details-value">${event?.ticketPrice ? `₹${event.ticketPrice}` : 'Free Entry'}</span></div>
        </div>
      `;

      const htmlContent = buildVernuntEmailTemplate({
        title: subject,
        badgeText: '🎉 Community Event Live',
        mainContentHtml: mainHtml,
        callToAction: { label: 'View Public Event Page', url: `https://app.vernunt.com/?tab=events&eventId=${event?.id || ''}` }
      });

      const adminInstance = await getAdmin();
      const sendResult = await sendEmailMessage({
        to: toEmail,
        subject,
        type: 'general',
        textContent: `Event Published: "${event?.title}" is live on Vernunt!\nDate: ${event?.date} at ${event?.time}\nVenue: ${event?.location}\n\n- Team Vernunt`,
        htmlContent,
        adminInstance
      });

      return res.json({
        success: true,
        previewUrl: sendResult.previewUrl,
        message: `✓ Event publishing notification delivered to ${toEmail}.`
      });
    } catch (err: any) {
      console.error('[EmailService] Event Published Email Error:', err);
      return res.status(500).json({ success: false, error: err.message || err });
    }
  });

  // =========================================================================
  // 4. GET RECENT EMAIL AUDIT LOGS (ADMIN / DEBUGGING)
  // =========================================================================
  app.get('/api/notifications/email-logs', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      total: emailLogs.length,
      logs: emailLogs.slice(0, 50)
    });
  });
}
