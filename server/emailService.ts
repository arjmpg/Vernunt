import type { Express, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
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

// Unified Email Log Entry covering all triggers, notifications & transactional emails
export type EmailLogType =
  | 'otp'
  | 'welcome_signup'
  | 'password_changed'
  | 'playdate_request'
  | 'playdate_accepted'
  | 'playdate_declined'
  | 'playdate_session_joined'
  | 'event_ticket'
  | 'event_published'
  | 'shop_order'
  | 'product_purchase'
  | 'payment_receipt'
  | 'payment_paid'
  | 'payment_pending'
  | 'payment_failed'
  | 'product_shipped'
  | 'product_out_for_delivery'
  | 'product_delivered'
  | 'product_cancelled'
  | 'profile_approved'
  | 'profile_rejected'
  | 'kyc_submitted'
  | 'specialist_booking'
  | 'daycare_booking'
  | 'vendor_agreement'
  | 'subscription_activated'
  | 'emergency_sos'
  | 'admin_new_signup'
  | 'admin_kyc_alert'
  | 'test_email'
  | 'general';

export type EmailDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
export type EmailTransportMode = 'smtp_gmail' | 'smtp_custom' | 'firestore_queue';

export interface EmailLogEntry {
  id: string;
  trackingToken: string;
  to: string;
  from: string;
  subject: string;
  type: EmailLogType;
  category: string;
  triggerSource: string;
  status: 'sent' | 'delivered' | 'queued' | 'fallback_delivered' | 'bounced' | 'failed';
  deliveryStatus: EmailDeliveryStatus;
  deliveryTransport: EmailTransportMode;
  messageId?: string;
  smtpResponse?: string;
  accepted?: string[];
  rejected?: string[];
  readStatus: 'unread' | 'read';
  readAt?: string;
  lastReadAt?: string;
  openCount: number;
  lastReadUserAgent?: string;
  previewUrl?: string;
  textPreview?: string;
  htmlContent?: string;
  otpCode?: string;
  timestamp: string;
  updatedAt: string;
  error?: string;
}

const EMAIL_LOGS_FILE = path.resolve(process.cwd(), 'data', 'email_logs.json');
const MAX_EMAIL_LOGS = 1000;

// 1x1 transparent GIF buffer (43 bytes) for live open/read tracking pixel
const TRANSPARENT_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

let observedPublicOrigin =
  (process.env.APP_URL || process.env.PUBLIC_APP_URL || '').replace(/\/$/, '') ||
  'https://ais-pre-4clczmui7ahhbseqcspodh-548716619253.asia-east1.run.app';

function loadEmailLogsFromDisk(): EmailLogEntry[] {
  try {
    if (fs.existsSync(EMAIL_LOGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_EMAIL_LOGS).map((item: any) => ({
          id: item.id || `mail-${Date.now()}`,
          trackingToken: item.trackingToken || crypto.randomBytes(10).toString('hex'),
          to: String(item.to || '').toLowerCase(),
          from: item.from || `"Vernunt Play Time" <${DEFAULT_SMTP_SENDER_EMAIL}>`,
          subject: item.subject || 'Vernunt Email',
          type: (item.type || 'general') as EmailLogType,
          category: item.category || classifyEmailType(item.type || 'general').category,
          triggerSource: item.triggerSource || classifyEmailType(item.type || 'general').triggerSource,
          status: item.status || 'sent',
          deliveryStatus: item.deliveryStatus || (item.status === 'failed' ? 'failed' : item.status === 'queued' ? 'queued' : 'sent'),
          deliveryTransport: item.deliveryTransport || 'firestore_queue',
          messageId: item.messageId,
          smtpResponse: item.smtpResponse,
          accepted: Array.isArray(item.accepted) ? item.accepted : undefined,
          rejected: Array.isArray(item.rejected) ? item.rejected : undefined,
          readStatus: item.readStatus === 'read' ? 'read' : 'unread',
          readAt: item.readAt,
          lastReadAt: item.lastReadAt,
          openCount: typeof item.openCount === 'number' ? item.openCount : 0,
          lastReadUserAgent: item.lastReadUserAgent,
          previewUrl: item.previewUrl,
          textPreview: item.textPreview,
          htmlContent: item.htmlContent,
          otpCode: item.otpCode,
          timestamp: item.timestamp || new Date().toISOString(),
          updatedAt: item.updatedAt || item.timestamp || new Date().toISOString(),
          error: item.error
        }));
      }
    }
  } catch (err) {
    console.warn('[EmailService] Disk email log load notice:', err);
  }
  return [];
}

function saveEmailLogsToDisk(logs: EmailLogEntry[]) {
  try {
    const dir = path.dirname(EMAIL_LOGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify(logs.slice(0, MAX_EMAIL_LOGS), null, 2), 'utf8');
  } catch (err) {
    console.warn('[EmailService] Failed saving email logs to disk:', err);
  }
}

function classifyEmailType(type: EmailLogType | string): { category: string; triggerSource: string } {
  switch (type) {
    case 'admin_new_signup':
      return { category: 'Admin Trigger', triggerSource: 'New User Sign-Up Trigger' };
    case 'admin_kyc_alert':
      return { category: 'Admin Trigger', triggerSource: 'KYC Submission Alert' };
    case 'welcome_signup':
      return { category: 'Account & Onboarding', triggerSource: 'New Account Welcome' };
    case 'password_changed':
      return { category: 'Security Alert', triggerSource: 'Password Changed / Set' };
    case 'otp':
      return { category: 'Auth / OTP', triggerSource: 'Email OTP Verification' };
    case 'playdate_request':
      return { category: 'Playtime Connect', triggerSource: 'Playtime Request Received' };
    case 'playdate_accepted':
      return { category: 'Playtime Connect', triggerSource: 'Playtime Request Accepted' };
    case 'playdate_declined':
      return { category: 'Playtime Connect', triggerSource: 'Playtime Request Declined' };
    case 'playdate_session_joined':
      return { category: 'Playtime Connect', triggerSource: 'Group Playtime Joined' };
    case 'event_ticket':
      return { category: 'Events & Passes', triggerSource: 'Event Booking Confirmed' };
    case 'event_published':
      return { category: 'Events & Passes', triggerSource: 'Event Published Live' };
    case 'product_purchase':
    case 'shop_order':
      return { category: 'Store & Orders', triggerSource: 'Product Purchased' };
    case 'payment_receipt':
    case 'payment_paid':
      return { category: 'Payments', triggerSource: 'Payment Paid & Verified' };
    case 'payment_pending':
      return { category: 'Payments', triggerSource: 'Payment Pending / COD' };
    case 'payment_failed':
      return { category: 'Payments', triggerSource: 'Payment Failed / Action Needed' };
    case 'product_shipped':
      return { category: 'Store & Orders', triggerSource: 'Order Dispatched / Shipped' };
    case 'product_out_for_delivery':
      return { category: 'Store & Orders', triggerSource: 'Order Out for Delivery' };
    case 'product_delivered':
      return { category: 'Store & Orders', triggerSource: 'Order Delivered' };
    case 'product_cancelled':
      return { category: 'Store & Orders', triggerSource: 'Order Cancelled / Refund' };
    case 'profile_approved':
      return { category: 'Verification & KYC', triggerSource: 'Profile Approved' };
    case 'profile_rejected':
      return { category: 'Verification & KYC', triggerSource: 'Profile Review Update' };
    case 'kyc_submitted':
      return { category: 'Verification & KYC', triggerSource: 'KYC Documents Submitted' };
    case 'specialist_booking':
      return { category: 'Specialists', triggerSource: 'Specialist Appointment Booked' };
    case 'daycare_booking':
      return { category: 'Child Care', triggerSource: 'Daycare Slot Reserved' };
    case 'vendor_agreement':
      return { category: 'Merchant / Legal', triggerSource: 'Vendor Agreement Executed' };
    case 'subscription_activated':
      return { category: 'Membership', triggerSource: 'Club Plan Activated' };
    case 'emergency_sos':
      return { category: 'Emergency SOS', triggerSource: 'Child Safety Distress Beacon' };
    case 'test_email':
      return { category: 'Admin Test', triggerSource: 'Manual Test Dispatch' };
    default:
      return { category: 'General Notification', triggerSource: 'Platform Notification' };
  }
}

const DEFAULT_ADMIN_SIGNUP_RECIPIENTS = ['arjunmpgupta@gmail.com', 'ardha@vernunt.com'];
const DEFAULT_SMTP_SENDER_EMAIL = 'vernunt@gmail.com';
const ADMIN_TRIGGER_SETTINGS_FILE = path.resolve(process.cwd(), 'data', 'admin_notification_settings.json');

const emailLogs: EmailLogEntry[] = loadEmailLogsFromDisk();

// Real-Time SSE Subscribers for Admin Email Logs
const emailLogSseClients = new Set<Response>();

function serializeLogForStream(entry: EmailLogEntry): Omit<EmailLogEntry, 'htmlContent'> & { hasHtmlPreview: boolean } {
  const { htmlContent, ...rest } = entry;
  return {
    ...rest,
    hasHtmlPreview: Boolean(htmlContent)
  };
}

export function getEmailLogStats() {
  const total = emailLogs.length;
  let delivered = 0;
  let sent = 0;
  let queued = 0;
  let failed = 0;
  let bounced = 0;
  let read = 0;
  let totalOpens = 0;

  for (const log of emailLogs) {
    if (log.deliveryStatus === 'delivered') delivered += 1;
    else if (log.deliveryStatus === 'sent') sent += 1;
    else if (log.deliveryStatus === 'queued') queued += 1;
    else if (log.deliveryStatus === 'bounced') bounced += 1;
    else if (log.deliveryStatus === 'failed') failed += 1;

    if (log.readStatus === 'read') read += 1;
    totalOpens += log.openCount || 0;
  }

  const openRatePercent = total > 0 ? Math.round((read / total) * 100) : 0;
  return {
    total,
    delivered,
    sent,
    queued,
    failed,
    bounced,
    read,
    unread: Math.max(0, total - read),
    totalOpens,
    openRatePercent
  };
}

function getSmtpRuntimeInfo() {
  const host = (process.env.SMTP_HOST || process.env.MAIL_HOST || '').trim();
  const user = (process.env.SMTP_USER || process.env.MAIL_USER || process.env.GMAIL_USER || DEFAULT_SMTP_SENDER_EMAIL).trim();
  const pass = (process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
  const transportMode: EmailTransportMode =
    host && user && pass
      ? 'smtp_custom'
      : user && pass && user.includes('@gmail.com')
        ? 'smtp_gmail'
        : 'firestore_queue';

  return {
    smtpConfigured: transportMode !== 'firestore_queue',
    transportMode,
    senderEmail: user,
    host: host || (transportMode === 'smtp_gmail' ? 'smtp.gmail.com' : 'Firestore Mail Queue')
  };
}

function broadcastEmailLogEvent(eventName: 'email:created' | 'email:updated' | 'email:cleared', payload: any) {
  if (emailLogSseClients.size === 0) return;
  const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of emailLogSseClients) {
    try {
      client.write(serialized);
    } catch {
      emailLogSseClients.delete(client);
    }
  }
}

function injectReadTrackingPixel(html: string, logId: string, trackingToken: string): string {
  const pixelUrl = `${observedPublicOrigin}/api/emails/track/open/${encodeURIComponent(logId)}/${encodeURIComponent(trackingToken)}.gif`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0;opacity:0;" />`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${pixelTag}</body>`);
  }
  return `${html}\n${pixelTag}`;
}

export interface AdminEmailTriggerSettings {
  newUserSignupEnabled: boolean;
  recipients: string[];
  updatedAt: string;
}

function parseAdminEmailsList(input?: string | string[] | null): string[] {
  const rawList = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[\s,;]+/)
      : [];
  const cleaned = rawList
    .map(e => String(e || '').trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return Array.from(new Set(cleaned));
}

export function getAdminEmailTriggerSettings(): AdminEmailTriggerSettings {
  const envRecipients = parseAdminEmailsList(
    process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL || ''
  );
  const fallbackRecipients = envRecipients.length > 0 ? envRecipients : DEFAULT_ADMIN_SIGNUP_RECIPIENTS;

  try {
    if (fs.existsSync(ADMIN_TRIGGER_SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_TRIGGER_SETTINGS_FILE, 'utf8'));
      const savedRecipients = parseAdminEmailsList(parsed?.recipients);
      return {
        newUserSignupEnabled: parsed?.newUserSignupEnabled !== false,
        recipients: savedRecipients.length > 0 ? savedRecipients : fallbackRecipients,
        updatedAt: parsed?.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.debug('[EmailService] Admin trigger settings read note:', err);
  }

  return {
    newUserSignupEnabled: true,
    recipients: fallbackRecipients,
    updatedAt: new Date().toISOString()
  };
}

export function saveAdminEmailTriggerSettings(settings: {
  newUserSignupEnabled?: boolean;
  recipients?: string | string[];
}): AdminEmailTriggerSettings {
  const current = getAdminEmailTriggerSettings();
  const parsedRecipients = settings.recipients !== undefined
    ? parseAdminEmailsList(settings.recipients)
    : current.recipients;

  const next: AdminEmailTriggerSettings = {
    newUserSignupEnabled: settings.newUserSignupEnabled !== undefined
      ? Boolean(settings.newUserSignupEnabled)
      : current.newUserSignupEnabled,
    recipients: parsedRecipients.length > 0 ? parsedRecipients : current.recipients,
    updatedAt: new Date().toISOString()
  };

  try {
    const dir = path.dirname(ADMIN_TRIGGER_SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ADMIN_TRIGGER_SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  } catch (err) {
    console.warn('[EmailService] Failed saving admin email trigger settings:', err);
  }

  return next;
}

function escapeHtml(val: any): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Lazy-initialized Nodemailer transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // 1. Production SMTP Configuration (via Environment Variables)
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
  const user = (process.env.SMTP_USER || process.env.MAIL_USER || process.env.GMAIL_USER || DEFAULT_SMTP_SENDER_EMAIL).trim();
  const pass = (process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();

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

  // 2. Gmail SMTP Direct Service (defaults to vernunt@gmail.com when SMTP_PASS / Google App Password is set)
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
 * Record email directly into Firebase Firestore `mail` & `email_notifications` collections
 * (Official Firebase Trigger Email extension format + real-time delivery/read audit log)
 */
async function syncToFirestoreMail(
  adminInstance: any,
  to: string,
  subject: string,
  html: string,
  text: string,
  logEntry?: EmailLogEntry
) {
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
      logId: logEntry?.id,
      status: logEntry?.deliveryStatus || 'pending',
      dispatchedAt: logEntry?.timestamp || new Date().toISOString(),
      source: 'vernunt-server-email-engine'
    });

    if (logEntry) {
      await db.collection('email_notifications').doc(logEntry.id).set({
        id: logEntry.id,
        recipient: to,
        from: logEntry.from,
        subject,
        type: logEntry.type,
        category: logEntry.category,
        triggerSource: logEntry.triggerSource,
        deliveryStatus: logEntry.deliveryStatus,
        deliveryTransport: logEntry.deliveryTransport,
        readStatus: logEntry.readStatus,
        readAt: logEntry.readAt || null,
        openCount: logEntry.openCount || 0,
        timestamp: logEntry.timestamp,
        updatedAt: logEntry.updatedAt,
        status: logEntry.deliveryStatus
      }, { merge: true });
    }
  } catch (firestoreErr: any) {
    console.warn('[EmailService] Firestore Trigger Email sync notice:', firestoreErr?.message || firestoreErr);
  }
}

async function syncReadStatusToFirestore(adminInstance: any, logEntry: EmailLogEntry) {
  if (!adminInstance) return;
  try {
    const db = firebaseConfig.firestoreDatabaseId
      ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
      : adminInstance.firestore();
    await db.collection('email_notifications').doc(logEntry.id).set({
      readStatus: logEntry.readStatus,
      readAt: logEntry.readAt || null,
      lastReadAt: logEntry.lastReadAt || null,
      openCount: logEntry.openCount,
      deliveryStatus: logEntry.deliveryStatus,
      updatedAt: logEntry.updatedAt
    }, { merge: true });
  } catch (err: any) {
    console.debug('[EmailService] Firestore read receipt sync note:', err?.message || err);
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
export function buildVernuntEmailTemplate(options: {
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
      <p>© ${new Date().getFullYear()} Vernunt Ventures Pvt. Ltd. • Bangalore, India • <a href="https://app.vernunt.com">app.vernunt.com</a></p>
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
  const payMethod = order.paymentMethod || details?.paymentMethod || 'Online Gateway / UPI';
  const txnRef = order.paymentReferenceId || details?.transactionId || `PAY-GW-${Date.now().toString().slice(-8)}`;
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
      <strong>🏢 Issued By:</strong> Vernunt Ventures Pvt. Ltd., Sector 2, HSR Layout, Bengaluru, Karnataka 560102.<br>
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
 * Unified Email Dispatch Function with Real-Time Log Broadcast & Read-Receipt Pixel Injection
 */
export async function sendEmailMessage(options: {
  to: string;
  subject: string;
  type: EmailLogEntry['type'];
  htmlContent: string;
  textContent: string;
  triggerSource?: string;
  otpCode?: string;
  attachments?: any[];
  adminInstance?: any;
}): Promise<{ success: boolean; logId?: string; deliveryStatus?: EmailDeliveryStatus; messageId?: string; previewUrl?: string; error?: string }> {
  const cleanTo = String(options.to || '').trim().toLowerCase();
  const runtimeInfo = getSmtpRuntimeInfo();
  const fromAddress = process.env.SMTP_FROM || `"Vernunt Play Time" <${runtimeInfo.senderEmail}>`;
  const logId = `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const trackingToken = crypto.randomBytes(12).toString('hex');
  const nowIso = new Date().toISOString();
  const classification = classifyEmailType(options.type);

  // Inject invisible 1x1 open/read tracking pixel into every HTML email
  const trackedHtml = injectReadTrackingPixel(options.htmlContent, logId, trackingToken);
  const textPreview = String(options.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 260);

  try {
    const mailTransporter = await getTransporter();

    const info: any = await mailTransporter.sendMail({
      from: fromAddress,
      to: cleanTo,
      subject: options.subject,
      text: options.textContent,
      html: trackedHtml,
      attachments: options.attachments
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    const acceptedList = Array.isArray(info?.accepted) ? info.accepted.map(String) : [];
    const rejectedList = Array.isArray(info?.rejected) ? info.rejected.map(String) : [];
    const smtpResponse = typeof info?.response === 'string' ? info.response : undefined;

    let deliveryStatus: EmailDeliveryStatus;
    let legacyStatus: EmailLogEntry['status'];

    if (runtimeInfo.transportMode === 'firestore_queue') {
      deliveryStatus = 'queued';
      legacyStatus = 'queued';
    } else if (rejectedList.length > 0 && acceptedList.length === 0) {
      deliveryStatus = 'bounced';
      legacyStatus = 'bounced';
    } else if (acceptedList.length > 0 || (smtpResponse && /^250\b/.test(smtpResponse))) {
      deliveryStatus = 'delivered';
      legacyStatus = 'delivered';
    } else {
      deliveryStatus = 'sent';
      legacyStatus = 'sent';
    }

    const logEntry: EmailLogEntry = {
      id: logId,
      trackingToken,
      to: cleanTo,
      from: fromAddress,
      subject: options.subject,
      type: options.type,
      category: classification.category,
      triggerSource: options.triggerSource || classification.triggerSource,
      status: legacyStatus,
      deliveryStatus,
      deliveryTransport: runtimeInfo.transportMode,
      messageId: info?.messageId,
      smtpResponse: smtpResponse || (runtimeInfo.transportMode === 'firestore_queue' ? 'Queued via Firestore mail engine (set SMTP_PASS for live Gmail SMTP)' : 'Accepted by SMTP relay'),
      accepted: acceptedList.length > 0 ? acceptedList : undefined,
      rejected: rejectedList.length > 0 ? rejectedList : undefined,
      readStatus: 'unread',
      openCount: 0,
      previewUrl,
      textPreview,
      htmlContent: options.htmlContent.slice(0, 48000),
      otpCode: options.otpCode,
      timestamp: nowIso,
      updatedAt: nowIso
    };

    emailLogs.unshift(logEntry);
    if (emailLogs.length > MAX_EMAIL_LOGS) emailLogs.length = MAX_EMAIL_LOGS;
    saveEmailLogsToDisk(emailLogs);

    // Broadcast real-time creation event to all connected Admin Email Log viewers
    broadcastEmailLogEvent('email:created', {
      log: serializeLogForStream(logEntry),
      stats: getEmailLogStats()
    });

    console.log(`[EmailService] ✓ Email logged (${deliveryStatus}/${runtimeInfo.transportMode}) to ${cleanTo} [${options.type}] | ID: ${logId}`);

    // Record in Firestore Trigger Email queue & email_notifications collection
    await syncToFirestoreMail(options.adminInstance, cleanTo, options.subject, trackedHtml, options.textContent, logEntry);

    return {
      success: deliveryStatus !== 'bounced',
      logId,
      deliveryStatus,
      messageId: info?.messageId,
      previewUrl
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[EmailService] ❌ Delivery Error to ${cleanTo}:`, errMsg);

    // Reset cached transporter if auth/connection failed so next attempt can recover if env updated
    if (/auth|EAUTH|ECONN|ETIMEDOUT|greeting/i.test(errMsg)) {
      transporter = null;
    }

    const logEntry: EmailLogEntry = {
      id: logId,
      trackingToken,
      to: cleanTo,
      from: fromAddress,
      subject: options.subject,
      type: options.type,
      category: classification.category,
      triggerSource: options.triggerSource || classification.triggerSource,
      status: 'failed',
      deliveryStatus: 'failed',
      deliveryTransport: runtimeInfo.transportMode,
      smtpResponse: errMsg,
      readStatus: 'unread',
      openCount: 0,
      textPreview,
      htmlContent: options.htmlContent.slice(0, 48000),
      otpCode: options.otpCode,
      timestamp: nowIso,
      updatedAt: nowIso,
      error: errMsg
    };

    emailLogs.unshift(logEntry);
    if (emailLogs.length > MAX_EMAIL_LOGS) emailLogs.length = MAX_EMAIL_LOGS;
    saveEmailLogsToDisk(emailLogs);

    broadcastEmailLogEvent('email:created', {
      log: serializeLogForStream(logEntry),
      stats: getEmailLogStats()
    });

    // Still queue in Firestore fallback so delivery audit is preserved
    await syncToFirestoreMail(options.adminInstance, cleanTo, options.subject, trackedHtml, options.textContent, logEntry);

    return {
      success: false,
      logId,
      deliveryStatus: 'failed',
      previewUrl: undefined,
      error: errMsg
    };
  }
}

/**
 * Send Welcome Email to every newly registered user on Vernunt
 */
export async function sendWelcomeSignupEmail(options: {
  user: Record<string, any>;
  adminInstance?: any;
}): Promise<{ success: boolean; logId?: string }> {
  const u = options.user || {};
  const toEmail = String(u.email || '').trim().toLowerCase();
  if (!toEmail || !toEmail.includes('@')) return { success: false };

  const userName = String(u.parentName || u.name || 'Vernunt Member').trim();
  const userRole = String(u.userRole || 'Parent').trim();
  const subject = `🎉 Welcome to Vernunt, ${userName}! Your ${userRole} Account is Ready`;

  const mainHtml = `
    <p>Hi <strong>${escapeHtml(userName)}</strong>,</p>
    <p>Welcome to <strong>Vernunt Play Time Connect</strong>! Your <strong>${escapeHtml(userRole)}</strong> account has been created successfully.</p>
    <div class="details-card">
      <div class="details-row"><span class="details-label">Account Name</span><span class="details-value">${escapeHtml(userName)}</span></div>
      <div class="details-row"><span class="details-label">Account Role</span><span class="details-value">${escapeHtml(userRole)}</span></div>
      <div class="details-row"><span class="details-label">Registered Email</span><span class="details-value">${escapeHtml(toEmail)}</span></div>
      <div class="details-row"><span class="details-label">Joined On</span><span class="details-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
    </div>
    <p>You can now discover verified neighborhood playmates, book kids events &amp; workshops, consult pediatric specialists, and shop BIS-certified Montessori toys.</p>
  `;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: '🎉 Welcome to Vernunt',
    mainContentHtml: mainHtml,
    callToAction: { label: 'Explore Vernunt Now', url: observedPublicOrigin },
    footerNote: 'You received this welcome email because a new account was registered with your email on Vernunt.'
  });

  const res = await sendEmailMessage({
    to: toEmail,
    subject,
    type: 'welcome_signup',
    triggerSource: 'New Account Sign-Up',
    htmlContent,
    textContent: `Welcome to Vernunt, ${userName}!\nYour ${userRole} account is now active.\nExplore Vernunt: ${observedPublicOrigin}`,
    adminInstance: options.adminInstance
  });
  return { success: res.success, logId: res.logId };
}

/**
 * Send Instant Security Notification Email whenever an Admin or User changes/sets their password
 */
export async function sendPasswordChangedEmail(options: {
  email: string;
  userName?: string;
  userRole?: string;
  isFirstTimeSet?: boolean;
  adminInstance?: any;
}): Promise<{ success: boolean; logId?: string }> {
  const cleanEmail = String(options.email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return { success: false };

  const targetName = String(options.userName || 'Vernunt Member').trim();
  const roleLabel = String(options.userRole || 'Account').trim();
  const actionLabel = options.isFirstTimeSet ? 'Password Set' : 'Password Changed';
  const changedAtIst = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const subject = `🔐 Security Alert: Your Vernunt Account ${actionLabel}`;

  const mainHtml = `
    <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
    <p>This is a security confirmation that your Vernunt account password was <strong>${options.isFirstTimeSet ? 'newly set' : 'changed'}</strong>.</p>
    <div class="details-card">
      <div class="details-row"><span class="details-label">Account</span><span class="details-value">${escapeHtml(cleanEmail)}</span></div>
      <div class="details-row"><span class="details-label">Role</span><span class="details-value">${escapeHtml(roleLabel)}</span></div>
      <div class="details-row"><span class="details-label">Action</span><span class="details-value">${actionLabel}</span></div>
      <div class="details-row"><span class="details-label">Time (IST)</span><span class="details-value">${escapeHtml(changedAtIst)}</span></div>
    </div>
    <div class="safety-callout">
      🛡️ <strong>Didn&apos;t make this change?</strong> Immediately open your Vernunt Profile &rarr; Security &amp; Password to update your password or contact <a href="mailto:support@vernunt.com">support@vernunt.com</a>.
    </div>
  `;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: '🔐 Account Security Alert',
    mainContentHtml: mainHtml,
    callToAction: { label: 'Review Account Security', url: `${observedPublicOrigin}/?tab=profile` },
    footerNote: 'Automated Vernunt Account Security Notification. Passwords are stored using salted scrypt hashing.'
  });

  const res = await sendEmailMessage({
    to: cleanEmail,
    subject,
    type: 'password_changed',
    triggerSource: actionLabel,
    htmlContent,
    textContent: `Security Alert: Your Vernunt account password was ${options.isFirstTimeSet ? 'set' : 'changed'} on ${changedAtIst}.\nAccount: ${cleanEmail}\nIf you did not make this change, contact support@vernunt.com immediately.`,
    adminInstance: options.adminInstance
  });
  return { success: res.success, logId: res.logId };
}

/**
 * Send Instant Admin Alert Email whenever a new user signs up on Vernunt
 */
export async function sendAdminNewSignupEmail(options: {
  user: Record<string, any>;
  adminInstance?: any;
  recipientsOverride?: string[];
  isTest?: boolean;
}): Promise<{ success: boolean; skipped?: boolean; recipients: string[]; results: Array<{ to: string; success: boolean; previewUrl?: string; error?: string }> }> {
  const settings = getAdminEmailTriggerSettings();
  if (!options.isTest && !settings.newUserSignupEnabled) {
    return { success: true, skipped: true, recipients: [], results: [] };
  }

  const recipients = options.recipientsOverride && options.recipientsOverride.length > 0
    ? parseAdminEmailsList(options.recipientsOverride)
    : settings.recipients;

  if (recipients.length === 0) {
    return { success: false, recipients: [], results: [] };
  }

  const u = options.user || {};
  const userName = String(u.parentName || u.name || u.companyName || 'New Vernunt Member').trim();
  const userRole = String(u.userRole || 'Parent').trim();
  const userEmail = u.email ? String(u.email).trim() : 'Not provided';
  const userPhone = u.phoneNumber ? String(u.phoneNumber).trim() : 'Not provided';
  const userId = String(u.id || `user-${Date.now()}`);
  const locationLabel =
    (typeof u.currentAddress === 'string' && u.currentAddress) ||
    (typeof u.location?.address === 'string' && u.location.address) ||
    (typeof u.neighbourhood === 'string' && u.neighbourhood) ||
    'Not specified';
  const referralSource = String(u.affiliateReferredBy || u.referredByCode || 'Organic Sign-up');
  const kycState = u.aadhaarVerified
    ? 'Verified'
    : u.kycSubmitted
      ? 'Pending Admin KYC Review'
      : u.kycSkipped
        ? 'Skipped KYC at Sign-Up'
        : String(u.verificationStatus || 'Standard');
  const registeredAtIst = new Date(u.registeredAt || u.createdAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const subjectPrefix = options.isTest ? '[TEST] ' : '';
  const subject = `${subjectPrefix}🆕 New User Sign-Up on Vernunt: ${userName} (${userRole})`;

  const mainHtml = `
    <p>Hello <strong>Vernunt Admin</strong>,</p>
    <p>A new user account has just signed up on the Vernunt platform${options.isTest ? ' <em>(Sample Test Alert)</em>' : ''}.</p>
    <div class="details-card">
      <div class="details-row"><span class="details-label">Account Name</span><span class="details-value">${escapeHtml(userName)}</span></div>
      <div class="details-row"><span class="details-label">Role</span><span class="details-value">${escapeHtml(userRole)}</span></div>
      <div class="details-row"><span class="details-label">Email</span><span class="details-value">${escapeHtml(userEmail)}</span></div>
      <div class="details-row"><span class="details-label">Mobile</span><span class="details-value">${escapeHtml(userPhone)}</span></div>
      <div class="details-row"><span class="details-label">Locality / Address</span><span class="details-value">${escapeHtml(locationLabel)}</span></div>
      <div class="details-row"><span class="details-label">KYC Status</span><span class="details-value">${escapeHtml(kycState)}</span></div>
      <div class="details-row"><span class="details-label">Attribution</span><span class="details-value">${escapeHtml(referralSource)}</span></div>
      <div class="details-row"><span class="details-label">Signed Up (IST)</span><span class="details-value">${escapeHtml(registeredAtIst)}</span></div>
      <div class="details-row"><span class="details-label">User ID</span><span class="details-value" style="font-family:monospace;">${escapeHtml(userId)}</span></div>
    </div>
    <p style="font-size:13px;color:#475569;">
      Open the Vernunt Admin Dashboard to inspect the new user profile, review verification documents if submitted, or manage role permissions.
    </p>
  `;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: options.isTest ? '🧪 Test Admin Sign-Up Trigger' : '🆕 New User Sign-Up',
    mainContentHtml: mainHtml,
    callToAction: { label: 'Open Admin Dashboard', url: 'https://app.vernunt.com/?tab=admin' },
    footerNote: 'Automated Admin Sign-Up Notification • Configure recipients inside Admin Dashboard > Settings.'
  });

  const textContent = [
    subject,
    '',
    `Account Name: ${userName}`,
    `Role: ${userRole}`,
    `Email: ${userEmail}`,
    `Mobile: ${userPhone}`,
    `Locality / Address: ${locationLabel}`,
    `KYC Status: ${kycState}`,
    `Attribution: ${referralSource}`,
    `Signed Up (IST): ${registeredAtIst}`,
    `User ID: ${userId}`,
    '',
    'Review in Admin Dashboard: https://app.vernunt.com/?tab=admin',
    '- Vernunt Notification Engine'
  ].join('\n');

  const results: Array<{ to: string; success: boolean; previewUrl?: string; error?: string }> = [];
  for (const recipient of recipients) {
    const res = await sendEmailMessage({
      to: recipient,
      subject,
      type: 'admin_new_signup',
      htmlContent,
      textContent,
      adminInstance: options.adminInstance
    });
    results.push({
      to: recipient,
      success: res.success,
      previewUrl: res.previewUrl,
      error: res.error
    });
  }

  console.log(`[EmailService] 🆕 New user signup alert triggered for "${userName}" (${userId}) -> ${recipients.join(', ')}`);
  return {
    success: results.some(r => r.success),
    recipients,
    results
  };
}

// 30-second deduplication caches so submitting/approving from multiple sync hooks never double-emails
const recentAdminKycAlertMap = new Map<string, number>();
const recentUserKycApprovalMap = new Map<string, number>();
const DEDUP_WINDOW_MS = 30 * 1000;

/**
 * Send Instant Admin Alert Email whenever any user submits their profile for KYC verification
 */
export async function sendAdminKycSubmittedEmail(options: {
  applicant: Record<string, any>;
  adminInstance?: any;
  recipientsOverride?: string[];
  force?: boolean;
}): Promise<{ success: boolean; deduplicated?: boolean; recipients: string[]; results: Array<{ to: string; success: boolean; logId?: string; error?: string }> }> {
  const a = options.applicant || {};
  const dedupKey = String(a.id || a.userId || a.applicantId || a.email || a.applicantEmail || '').trim().toLowerCase();
  const nowMs = Date.now();
  if (!options.force && dedupKey) {
    const lastSent = recentAdminKycAlertMap.get(dedupKey);
    if (lastSent && nowMs - lastSent < DEDUP_WINDOW_MS) {
      return { success: true, deduplicated: true, recipients: [], results: [] };
    }
    recentAdminKycAlertMap.set(dedupKey, nowMs);
  }

  const settings = getAdminEmailTriggerSettings();
  const recipients = options.recipientsOverride && options.recipientsOverride.length > 0
    ? parseAdminEmailsList(options.recipientsOverride)
    : settings.recipients;

  if (recipients.length === 0) {
    return { success: false, recipients: [], results: [] };
  }

  const applicantName = String(a.parentName || a.applicantName || a.name || 'Vernunt Applicant').trim();
  const applicantRole = String(a.userRole || a.applicantRole || 'Parent').trim();
  const applicantEmail = String(a.email || a.applicantEmail || 'Not provided').trim();
  const applicantPhone = String(a.phoneNumber || a.applicantPhone || 'Not provided').trim();
  const applicantId = String(a.id || a.userId || a.applicantId || `user-${Date.now()}`);
  const childInfo = a.childName ? `${a.childName}${a.childAge ? ` (${a.childAge} yrs)` : ''}` : 'Not specified';
  const addressLabel = String(
    a.currentAddress ||
    (typeof a.location === 'string' ? a.location : a.location?.address) ||
    a.apartmentCommunityName ||
    'Not specified'
  ).trim();
  const idDocName = String(a.aadhaarDocName || a.idDocName || 'Uploaded Government ID / Aadhaar').trim();
  const addrDocName = String(a.addressProofDocName || a.addressProofDocType || 'Included with submission').trim();
  const submittedAtIst = new Date(a.submittedAt || a.kycSubmittedAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const subject = `🛡️ KYC Verification Submitted: ${applicantName} (${applicantRole}) — Action Required`;
  const mainHtml = `
    <p>Hello <strong>Vernunt Admin</strong>,</p>
    <p>A user has submitted their profile and identity documents for <strong>KYC Verification</strong> and is awaiting your approval.</p>
    <div class="details-card">
      <div class="details-row"><span class="details-label">Applicant Name</span><span class="details-value">${escapeHtml(applicantName)}</span></div>
      <div class="details-row"><span class="details-label">Role</span><span class="details-value">${escapeHtml(applicantRole)}</span></div>
      <div class="details-row"><span class="details-label">Email</span><span class="details-value">${escapeHtml(applicantEmail)}</span></div>
      <div class="details-row"><span class="details-label">Phone</span><span class="details-value">${escapeHtml(applicantPhone)}</span></div>
      <div class="details-row"><span class="details-label">Child Profile</span><span class="details-value">${escapeHtml(childInfo)}</span></div>
      <div class="details-row"><span class="details-label">Address / Community</span><span class="details-value">${escapeHtml(addressLabel)}</span></div>
      <div class="details-row"><span class="details-label">Identity Proof</span><span class="details-value">${escapeHtml(idDocName)}</span></div>
      <div class="details-row"><span class="details-label">Address Proof</span><span class="details-value">${escapeHtml(addrDocName)}</span></div>
      <div class="details-row"><span class="details-label">Submitted At (IST)</span><span class="details-value">${escapeHtml(submittedAtIst)}</span></div>
      <div class="details-row"><span class="details-label">Applicant ID</span><span class="details-value" style="font-family:monospace;">${escapeHtml(applicantId)}</span></div>
    </div>
    <p style="font-size:13px;color:#475569;">
      Please inspect the uploaded KYC documents in the Vernunt Admin Dashboard and approve or update the account verification status. Once approved, the user will automatically receive an approval notification email.
    </p>
  `;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: '🛡️ Admin KYC Verification Alert',
    mainContentHtml: mainHtml,
    callToAction: { label: 'Review & Approve KYC in Admin Dashboard', url: `${observedPublicOrigin}/?tab=admin` },
    footerNote: 'Automated Admin KYC Alert • Sent to configured Vernunt admin recipients.'
  });

  const textContent = [
    subject,
    '',
    `Applicant Name: ${applicantName}`,
    `Role: ${applicantRole}`,
    `Email: ${applicantEmail}`,
    `Phone: ${applicantPhone}`,
    `Child Profile: ${childInfo}`,
    `Address: ${addressLabel}`,
    `Identity Proof: ${idDocName}`,
    `Address Proof: ${addrDocName}`,
    `Submitted At (IST): ${submittedAtIst}`,
    `Applicant ID: ${applicantId}`,
    '',
    `Review in Admin Dashboard: ${observedPublicOrigin}/?tab=admin`,
    '- Vernunt Safety & KYC Engine'
  ].join('\n');

  const results: Array<{ to: string; success: boolean; logId?: string; error?: string }> = [];
  for (const recipient of recipients) {
    const res = await sendEmailMessage({
      to: recipient,
      subject,
      type: 'admin_kyc_alert',
      triggerSource: 'User Submitted Profile for KYC',
      htmlContent,
      textContent,
      adminInstance: options.adminInstance
    });
    results.push({
      to: recipient,
      success: res.success,
      logId: res.logId,
      error: res.error
    });
  }

  console.log(`[EmailService] 🛡️ Admin KYC submission alert sent for "${applicantName}" (${applicantId}) -> ${recipients.join(', ')}`);
  return {
    success: results.some(r => r.success),
    recipients,
    results
  };
}

/**
 * Send Confirmation Email to User when Admin Approves their Profile & KYC Verification
 */
export async function sendUserKycApprovedEmail(options: {
  user: Record<string, any>;
  loginUrl?: string;
  adminInstance?: any;
  force?: boolean;
}): Promise<{ success: boolean; deduplicated?: boolean; logId?: string; previewUrl?: string; error?: string }> {
  const u = options.user || {};
  const toEmail = String(u.email || '').trim().toLowerCase();
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'User email is missing or invalid.' };
  }

  const dedupKey = `${String(u.id || u.userId || '').trim().toLowerCase()}|${toEmail}`;
  const nowMs = Date.now();
  if (!options.force) {
    const lastSent = recentUserKycApprovalMap.get(dedupKey);
    if (lastSent && nowMs - lastSent < DEDUP_WINDOW_MS) {
      return { success: true, deduplicated: true };
    }
    recentUserKycApprovalMap.set(dedupKey, nowMs);
  }

  const targetName = String(u.parentName || u.name || 'Verified Member').trim();
  const targetRole = String(u.userRole || u.role || 'Parent').trim();
  const loginLink = String(options.loginUrl || `${observedPublicOrigin}/?action=login&user=${encodeURIComponent(u.id || u.userId || 'member')}`);
  const approvedAtIst = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const subject = `✅ Your Vernunt Profile & KYC Verification Have Been Approved!`;
  const mainHtml = `
    <p>Hello <strong>${escapeHtml(targetName)}</strong>,</p>
    <p>Congratulations! Your <strong>${escapeHtml(targetRole)}</strong> profile and KYC identity verification on <strong>Vernunt</strong> have been officially <strong>APPROVED</strong> by our verification team.</p>
    <div class="details-card">
      <div class="details-row"><span class="details-label">Account Name</span><span class="details-value">${escapeHtml(targetName)}</span></div>
      <div class="details-row"><span class="details-label">Role</span><span class="details-value">${escapeHtml(targetRole)}</span></div>
      <div class="details-row"><span class="details-label">KYC Status</span><span class="details-value"><span class="status-pill status-paid">VERIFIED &amp; APPROVED</span></span></div>
      <div class="details-row"><span class="details-label">Approved On (IST)</span><span class="details-value">${escapeHtml(approvedAtIst)}</span></div>
    </div>
    <p><strong>What is now unlocked on your account:</strong></p>
    <ul style="margin:8px 0 16px 18px;padding:0;font-size:13.5px;color:#334155;">
      <li>Verified Child-Safety Badge displayed on your profile</li>
      <li>Full access to connect with verified neighborhood playmates &amp; private parent chats</li>
      <li>Instant booking for kids events, workshops, daycare, and pediatric specialists</li>
    </ul>
  `;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: '✅ KYC Approved & Verified',
    mainContentHtml: mainHtml,
    callToAction: { label: 'Log In to Your Verified Vernunt Account', url: loginLink },
    footerNote: 'Welcome to our safe, verified neighborhood community!'
  });

  const textContent = [
    `Hello ${targetName},`,
    '',
    `Congratulations! Your ${targetRole} profile and KYC identity verification on Vernunt have been officially APPROVED by our admin team (${approvedAtIst}).`,
    '',
    `Log in now to access verified playdates, community events, and family connections:`,
    loginLink,
    '',
    '- The Vernunt Safety & Community Team'
  ].join('\n');

  const res = await sendEmailMessage({
    to: toEmail,
    subject,
    type: 'profile_approved',
    triggerSource: 'Admin Approved User KYC',
    htmlContent,
    textContent,
    adminInstance: options.adminInstance
  });

  console.log(`[EmailService] ✅ KYC approval email sent to "${targetName}" <${toEmail}>`);
  return {
    success: res.success,
    logId: res.logId,
    previewUrl: res.previewUrl,
    error: res.error
  };
}

/**
 * Send Review Update Email to User when Admin requests KYC re-submission or declines
 */
export async function sendUserKycRejectedEmail(options: {
  user: Record<string, any>;
  adminNotes?: string;
  adminInstance?: any;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  const u = options.user || {};
  const toEmail = String(u.email || '').trim().toLowerCase();
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'User email is missing or invalid.' };
  }
  const targetName = String(u.parentName || u.name || 'Member').trim();
  const reason = String(options.adminNotes || 'Please upload a clear government-issued photo ID so our safety team can approve your profile.').trim();
  const subject = `⚠️ Action Required: Update Your Vernunt KYC Verification`;

  const htmlContent = buildVernuntEmailTemplate({
    title: subject,
    badgeText: '🛡️ KYC Review Update',
    mainContentHtml: `
      <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
      <p>Our verification team reviewed your recent KYC submission and needs an updated document before approving your account.</p>
      <div class="details-card">
        <div class="details-row"><span class="details-label">Review Status</span><span class="details-value"><span class="status-pill status-pending">ACTION NEEDED</span></span></div>
        <div class="details-row"><span class="details-label">Reviewer Note</span><span class="details-value">${escapeHtml(reason)}</span></div>
      </div>
      <p>Please sign in to Vernunt and re-submit a clear Aadhaar or government ID photo for rapid approval.</p>
    `,
    callToAction: { label: 'Update KYC Documents', url: `${observedPublicOrigin}/?tab=profile` }
  });

  const res = await sendEmailMessage({
    to: toEmail,
    subject,
    type: 'profile_rejected',
    triggerSource: 'Admin KYC Review Update',
    htmlContent,
    textContent: `Hi ${targetName},\n\nOur verification team reviewed your KYC submission and needs an update: ${reason}\n\nPlease sign in to Vernunt to re-submit your KYC documents: ${observedPublicOrigin}/?tab=profile`,
    adminInstance: options.adminInstance
  });
  return { success: res.success, logId: res.logId, error: res.error };
}

/**
 * Register Email and Notification Express Routes
 */
export function registerEmailRoutes(app: Express, getAdmin: () => Promise<any>) {

  // Capture live public HTTPS origin automatically so read-tracking pixels always resolve externally
  app.use((req, _res, next) => {
    const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const rawProto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
    if (rawHost && !rawHost.startsWith('localhost') && !rawHost.startsWith('127.0.0.1')) {
      observedPublicOrigin = `${rawProto}://${rawHost}`;
    }
    next();
  });

  // =========================================================================
  // 0. REAL-TIME EMAIL OPEN / READ TRACKING PIXEL (1x1 TRANSPARENT GIF)
  // =========================================================================
  app.get('/api/emails/track/open/:id/:token.gif', async (req: Request, res: Response) => {
    const { id, token } = req.params;
    const cleanToken = String(token || '').replace(/\.gif$/i, '');

    try {
      const entry = emailLogs.find(l => l.id === id && l.trackingToken === cleanToken);
      if (entry) {
        const nowIso = new Date().toISOString();
        const ua = String(req.headers['user-agent'] || 'Email Client').slice(0, 180);
        entry.readStatus = 'read';
        if (!entry.readAt) entry.readAt = nowIso;
        entry.lastReadAt = nowIso;
        entry.openCount = (entry.openCount || 0) + 1;
        entry.lastReadUserAgent = ua;
        entry.updatedAt = nowIso;
        if (entry.deliveryStatus === 'sent' || entry.deliveryStatus === 'queued') {
          entry.deliveryStatus = 'delivered';
          entry.status = 'delivered';
        }
        saveEmailLogsToDisk(emailLogs);

        broadcastEmailLogEvent('email:updated', {
          log: serializeLogForStream(entry),
          stats: getEmailLogStats()
        });

        getAdmin()
          .then(adminInstance => syncReadStatusToFirestore(adminInstance, entry))
          .catch(() => {});
      }
    } catch (trackErr) {
      console.debug('[EmailService] Open tracking pixel note:', trackErr);
    }

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', String(TRANSPARENT_PIXEL_GIF.length));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).send(TRANSPARENT_PIXEL_GIF);
  });

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
            paymentMethod: details?.paymentMethod || 'Online Gateway / UPI',
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

        case 'playdate_accepted': {
          badge = '🤝 Playtime Request Accepted';
          emailSubject = subject || `🤝 Great News! ${details?.accepterName || 'A Parent'} Accepted Your Playtime Request`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p><strong>${escapeHtml(details?.accepterName || 'A verified parent')}</strong> (${escapeHtml(details?.childName || 'Playmate')}) has accepted your playmate connection / play time request on <strong>Vernunt</strong>!</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Connected Parent</span><span class="details-value">${escapeHtml(details?.accepterName || 'Vernunt Parent')}</span></div>
              ${details?.childName ? `<div class="details-row"><span class="details-label">Child</span><span class="details-value">${escapeHtml(details.childName)}</span></div>` : ''}
              ${details?.date ? `<div class="details-row"><span class="details-label">Scheduled Date</span><span class="details-value">${escapeHtml(details.date)} ${details?.time ? `• ${escapeHtml(details.time)}` : ''}</span></div>` : ''}
              ${details?.location || details?.neighborhood ? `<div class="details-row"><span class="details-label">Location</span><span class="details-value">${escapeHtml(details?.location || details?.neighborhood)}</span></div>` : ''}
            </div>
            <p>Open Vernunt now to start chatting directly, share safe pickup details, and finalize your playdate.</p>
          `;
          break;
        }

        case 'playdate_declined': {
          badge = '📅 Playtime Update';
          emailSubject = subject || `📅 Playtime Request Update from ${details?.responderName || 'Parent'}`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p><strong>${escapeHtml(details?.responderName || 'The invited parent')}</strong> is unable to make this play time slot right now.</p>
            ${details?.reason ? `<div class="details-card"><div class="details-row"><span class="details-label">Note</span><span class="details-value">${escapeHtml(details.reason)}</span></div></div>` : ''}
            <p>No worries — you can suggest another time or explore nearby verified families on Playtime Radar.</p>
          `;
          break;
        }

        case 'playdate_session_joined': {
          badge = '🎈 Group Playtime Confirmed';
          emailSubject = subject || `🎈 You Joined "${details?.sessionTitle || 'Group Playtime Session'}"`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>${customMessage || `Your family is confirmed on the roster for <strong>${escapeHtml(details?.sessionTitle || 'Vernunt Group Playtime')}</strong>.`}</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Session</span><span class="details-value">${escapeHtml(details?.sessionTitle || 'Group Playtime')}</span></div>
              ${details?.date ? `<div class="details-row"><span class="details-label">Date &amp; Time</span><span class="details-value">${escapeHtml(details.date)} ${details?.time ? `• ${escapeHtml(details.time)}` : ''}</span></div>` : ''}
              ${details?.venue ? `<div class="details-row"><span class="details-label">Venue</span><span class="details-value">${escapeHtml(details.venue)}</span></div>` : ''}
              ${details?.splitAmount !== undefined ? `<div class="details-row"><span class="details-label">Current Split Share</span><span class="details-value">₹${Number(details.splitAmount).toLocaleString('en-IN')}</span></div>` : ''}
            </div>
          `;
          break;
        }

        case 'payment_paid': {
          badge = '✅ Payment Confirmed';
          const paidAmt = Number(details?.amount || details?.totalAmount || 0);
          emailSubject = subject || `✅ Payment Paid: ₹${paidAmt.toLocaleString('en-IN')} Confirmed on Vernunt`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>We have received and verified your payment of <strong style="color:#15803d;">₹${paidAmt.toLocaleString('en-IN')}</strong>.</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Item / Purpose</span><span class="details-value">${escapeHtml(details?.itemTitle || details?.description || 'Vernunt Purchase')}</span></div>
              <div class="details-row"><span class="details-label">Amount Paid</span><span class="details-value">₹${paidAmt.toLocaleString('en-IN')}</span></div>
              <div class="details-row"><span class="details-label">Payment Method</span><span class="details-value">${escapeHtml(details?.paymentMethod || 'Online Payment')}</span></div>
              ${details?.transactionId || details?.paymentId ? `<div class="details-row"><span class="details-label">Reference ID</span><span class="details-value" style="font-family:monospace;">${escapeHtml(details?.transactionId || details?.paymentId)}</span></div>` : ''}
              <div class="details-row"><span class="details-label">Status</span><span class="details-value"><span class="status-pill status-paid">PAID</span></span></div>
            </div>
          `;
          break;
        }

        case 'payment_pending': {
          badge = '⏳ Payment Pending';
          const dueAmt = Number(details?.amount || details?.totalAmount || 0);
          emailSubject = subject || `⏳ Payment Pending: ₹${dueAmt.toLocaleString('en-IN')} for ${details?.itemTitle || details?.orderNumber || 'Your Order'}`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>${customMessage || `Your payment of <strong>₹${dueAmt.toLocaleString('en-IN')}</strong> is currently marked as <strong>PENDING</strong>.`}</p>
            <div class="details-card">
              ${details?.orderNumber ? `<div class="details-row"><span class="details-label">Order / Ref</span><span class="details-value" style="font-family:monospace;">#${escapeHtml(details.orderNumber)}</span></div>` : ''}
              <div class="details-row"><span class="details-label">Item</span><span class="details-value">${escapeHtml(details?.itemTitle || 'Vernunt Order')}</span></div>
              <div class="details-row"><span class="details-label">Amount Due</span><span class="details-value">₹${dueAmt.toLocaleString('en-IN')}</span></div>
              <div class="details-row"><span class="details-label">Mode</span><span class="details-value">${escapeHtml(details?.paymentMethod || 'Cash on Delivery / Pending Online')}</span></div>
              <div class="details-row"><span class="details-label">Payment Status</span><span class="details-value"><span class="status-pill status-pending">PENDING</span></span></div>
            </div>
            <p style="font-size:13px;color:#475569;">If this is a Cash on Delivery order, please keep the exact amount or UPI ready at doorstep delivery. If an online payment was interrupted, you can complete it anytime in your Vernunt account.</p>
          `;
          break;
        }

        case 'payment_failed': {
          badge = '⚠️ Payment Unsuccessful';
          const failAmt = Number(details?.amount || details?.totalAmount || 0);
          emailSubject = subject || `⚠️ Payment Not Completed (₹${failAmt.toLocaleString('en-IN')}) — Retry on Vernunt`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>Your recent payment attempt of <strong>₹${failAmt.toLocaleString('en-IN')}</strong> for <strong>${escapeHtml(details?.itemTitle || 'your Vernunt checkout')}</strong> could not be completed.</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Item</span><span class="details-value">${escapeHtml(details?.itemTitle || 'Vernunt Checkout')}</span></div>
              <div class="details-row"><span class="details-label">Amount</span><span class="details-value">₹${failAmt.toLocaleString('en-IN')}</span></div>
              <div class="details-row"><span class="details-label">Reason</span><span class="details-value">${escapeHtml(details?.reason || 'Gateway declined or timed out')}</span></div>
              <div class="details-row"><span class="details-label">Status</span><span class="details-value"><span class="status-pill status-cancelled">FAILED / PENDING</span></span></div>
            </div>
            <p style="font-size:13px;color:#475569;">If any amount was debited by your bank, it is automatically reversed within 3–5 business days. You can safely retry checkout inside Vernunt.</p>
          `;
          break;
        }

        case 'kyc_submitted': {
          badge = '🪪 KYC Received';
          emailSubject = subject || '🪪 Identity Verification Submitted — Under Admin Review';
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>Thank you for submitting your parent identity verification documents on Vernunt. Our Trust &amp; Safety team has received your submission and will review it shortly.</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Document Type</span><span class="details-value">${escapeHtml(details?.docType || 'Government ID / Aadhaar')}</span></div>
              <div class="details-row"><span class="details-label">Current Status</span><span class="details-value"><span class="status-pill status-pending">UNDER REVIEW</span></span></div>
              <div class="details-row"><span class="details-label">Submitted At</span><span class="details-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
            </div>
            <p>You will receive an instant email as soon as your Verified Parent badge is approved.</p>
          `;
          break;
        }

        case 'profile_rejected': {
          badge = '⚠️ Verification Action Needed';
          emailSubject = subject || '⚠️ Action Needed on Your Vernunt Verification Submission';
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>We could not complete verification for your submitted documents. ${escapeHtml(details?.reason || 'Please re-upload a clear, unobstructed ID copy in your Profile settings.')}</p>
          `;
          break;
        }

        case 'subscription_activated': {
          badge = '👑 Membership Active';
          emailSubject = subject || `👑 ${details?.planName || 'Vernunt Club Plan'} Activated!`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>Your <strong>${escapeHtml(details?.planName || 'Vernunt Membership')}</strong> is now active!</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Plan</span><span class="details-value">${escapeHtml(details?.planName || 'Vernunt Club')}</span></div>
              <div class="details-row"><span class="details-label">Amount</span><span class="details-value">₹${Number(details?.amount || 0).toLocaleString('en-IN')}</span></div>
              <div class="details-row"><span class="details-label">Status</span><span class="details-value"><span class="status-pill status-paid">ACTIVE</span></span></div>
            </div>
          `;
          break;
        }

        case 'password_changed': {
          badge = '🔐 Account Security Alert';
          emailSubject = subject || '🔐 Security Alert: Your Vernunt Password Was Updated';
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>${customMessage || 'Your Vernunt account password was updated successfully.'}</p>
          `;
          break;
        }

        case 'welcome_signup': {
          badge = '🎉 Welcome to Vernunt';
          emailSubject = subject || `🎉 Welcome to Vernunt, ${targetName}!`;
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
            <p>${customMessage || 'Welcome to Vernunt Play Time Connect! Your account is ready.'}</p>
          `;
          break;
        }

        case 'admin_new_signup':
        case 'admin_kyc_alert': {
          badge = type === 'admin_kyc_alert' ? '🛡️ Admin KYC Alert' : '🆕 New User Sign-Up';
          emailSubject = subject || `🆕 New User Sign-Up on Vernunt: ${details?.applicantName || targetName}`;
          mainHtml = `
            <p>Hello <strong>Vernunt Admin</strong>,</p>
            <p>${customMessage || `A new ${escapeHtml(details?.applicantRole || 'Parent')} registration alert has been triggered.`}</p>
            <div class="details-card">
              <div class="details-row"><span class="details-label">Name</span><span class="details-value">${escapeHtml(details?.applicantName || targetName)}</span></div>
              <div class="details-row"><span class="details-label">Role</span><span class="details-value">${escapeHtml(details?.applicantRole || 'Parent')}</span></div>
              <div class="details-row"><span class="details-label">Email</span><span class="details-value">${escapeHtml(details?.applicantEmail || 'Not provided')}</span></div>
              <div class="details-row"><span class="details-label">Mobile</span><span class="details-value">${escapeHtml(details?.applicantPhone || 'Not provided')}</span></div>
              ${details?.currentAddress ? `<div class="details-row"><span class="details-label">Address</span><span class="details-value">${escapeHtml(details.currentAddress)}</span></div>` : ''}
              ${details?.aadhaarDocName ? `<div class="details-row"><span class="details-label">ID Proof</span><span class="details-value">${escapeHtml(details.aadhaarDocName)}</span></div>` : ''}
            </div>
          `;
          break;
        }

        default: {
          mainHtml = `
            <p>Hi <strong>${escapeHtml(targetName)}</strong>,</p>
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
        paymentMethod: 'Online Gateway / UPI (GPay)',
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
        type: 'daycare_booking',
        triggerSource: 'Daycare Slot Reserved',
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
        type: 'event_published',
        triggerSource: 'Event Published Live',
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
  // 7. ADMIN EMAIL TRIGGER SETTINGS, TEST & LOGS
  // =========================================================================
  app.get('/api/admin/email-triggers', (_req: Request, res: Response) => {
    const settings = getAdminEmailTriggerSettings();
    const senderEmail = (process.env.SMTP_USER || process.env.MAIL_USER || process.env.GMAIL_USER || DEFAULT_SMTP_SENDER_EMAIL).trim();
    const smtpConfigured = Boolean(
      (process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim()
    );
    return res.json({
      success: true,
      enabled: settings.newUserSignupEnabled,
      recipients: settings.recipients,
      senderEmail,
      updatedAt: settings.updatedAt,
      smtpConfigured,
      logs: emailLogs.slice(0, 50)
    });
  });

  app.post('/api/admin/email-triggers', async (req: Request, res: Response) => {
    try {
      const { enabled, recipients } = req.body || {};
      const updated = saveAdminEmailTriggerSettings({
        newUserSignupEnabled: enabled,
        recipients
      });

      // Mirror config to Firestore system_config if Admin SDK is available
      try {
        const adminInstance = await getAdmin();
        if (adminInstance) {
          const db = firebaseConfig.firestoreDatabaseId
            ? adminInstance.firestore(firebaseConfig.firestoreDatabaseId)
            : adminInstance.firestore();
          await db.collection('system_config').doc('admin_email_triggers').set(updated, { merge: true });
        }
      } catch (fsErr) {
        console.debug('[EmailService] Admin trigger Firestore mirror note:', fsErr);
      }

      return res.json({
        success: true,
        enabled: updated.newUserSignupEnabled,
        recipients: updated.recipients,
        updatedAt: updated.updatedAt
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/admin/email-triggers/test', async (req: Request, res: Response) => {
    try {
      const { recipients } = req.body || {};
      const adminInstance = await getAdmin();
      const result = await sendAdminNewSignupEmail({
        user: {
          id: `test-signup-${Date.now()}`,
          parentName: 'Sample Parent Verification',
          userRole: 'Parent',
          email: 'sample.parent@example.com',
          phoneNumber: '+91 9876543210',
          currentAddress: 'Koramangala 4th Block, Bengaluru',
          kycSubmitted: false,
          verificationStatus: 'PENDING',
          registeredAt: new Date().toISOString()
        },
        adminInstance,
        recipientsOverride: Array.isArray(recipients) ? recipients : parseAdminEmailsList(recipients),
        isTest: true
      });
      return res.json({
        ...result,
        logs: emailLogs.slice(0, 20)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/admin/kyc-submitted-alert', async (req: Request, res: Response) => {
    try {
      const applicant = req.body || {};
      const adminInstance = await getAdmin();
      const result = await sendAdminKycSubmittedEmail({
        applicant,
        adminInstance
      });
      return res.json({
        success: result.success,
        deduplicated: result.deduplicated,
        recipients: result.recipients,
        results: result.results
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // =========================================================================
  // 8. REAL-TIME ADMIN EMAIL LOGS API, SSE STREAM, PREVIEW, RESEND & TEST
  // =========================================================================
  app.get('/api/admin/email-logs/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    emailLogSseClients.add(res);

    // Send initial authoritative state snapshot immediately
    const initPayload = {
      logs: emailLogs.slice(0, 200).map(serializeLogForStream),
      stats: getEmailLogStats(),
      smtp: getSmtpRuntimeInfo(),
      trackingOrigin: observedPublicOrigin
    };
    res.write(`event: init\ndata: ${JSON.stringify(initPayload)}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
        emailLogSseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      emailLogSseClients.delete(res);
    });
  });

  app.get('/api/admin/email-logs', (req: Request, res: Response) => {
    const statusFilter = String(req.query.status || 'all').toLowerCase();
    const readFilter = String(req.query.readStatus || 'all').toLowerCase();
    const typeFilter = String(req.query.type || 'all').toLowerCase();
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(500, Math.max(10, parseInt(String(req.query.limit || '200'), 10) || 200));

    let filtered = emailLogs;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.deliveryStatus === statusFilter);
    }
    if (readFilter === 'read' || readFilter === 'unread') {
      filtered = filtered.filter(l => l.readStatus === readFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(l => l.type.toLowerCase() === typeFilter || l.category.toLowerCase() === typeFilter);
    }
    if (q) {
      filtered = filtered.filter(l =>
        l.to.toLowerCase().includes(q) ||
        l.subject.toLowerCase().includes(q) ||
        l.triggerSource.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.messageId || '').toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      total: emailLogs.length,
      filteredTotal: filtered.length,
      stats: getEmailLogStats(),
      smtp: getSmtpRuntimeInfo(),
      trackingOrigin: observedPublicOrigin,
      logs: filtered.slice(0, limit).map(serializeLogForStream)
    });
  });

  app.get('/api/admin/email-logs/:id', (req: Request, res: Response) => {
    const entry = emailLogs.find(l => l.id === req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Email log record not found.' });
    }
    const pixelUrl = `${observedPublicOrigin}/api/emails/track/open/${encodeURIComponent(entry.id)}/${encodeURIComponent(entry.trackingToken)}.gif`;
    return res.json({
      success: true,
      log: entry,
      trackingPixelUrl: pixelUrl
    });
  });

  app.post('/api/admin/email-logs/send-test', async (req: Request, res: Response) => {
    try {
      const { toEmail, subject, message } = req.body || {};
      const cleanTo = String(toEmail || '').trim().toLowerCase();
      if (!cleanTo || !cleanTo.includes('@')) {
        return res.status(400).json({ success: false, error: 'Please provide a valid recipient email address.' });
      }
      const mailSubject = String(subject || '').trim() || `🧪 Vernunt Live Email Log & Read-Tracking Test`;
      const bodyText = String(message || '').trim() || 'This is a live test email dispatched from the Vernunt Admin Email Logs desk to verify SMTP delivery status and real-time read-receipt tracking.';

      const htmlContent = buildVernuntEmailTemplate({
        title: mailSubject,
        badgeText: '🧪 Live Delivery & Read Test',
        mainContentHtml: `
          <p>Hello,</p>
          <p>${escapeHtml(bodyText)}</p>
          <div class="details-card">
            <div class="details-row"><span class="details-label">Recipient</span><span class="details-value">${escapeHtml(cleanTo)}</span></div>
            <div class="details-row"><span class="details-label">Dispatched (IST)</span><span class="details-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
            <div class="details-row"><span class="details-label">Read Receipt Pixel</span><span class="details-value">Embedded Automatically</span></div>
          </div>
          <p style="font-size:12.5px;color:#64748b;">When you open this email with images enabled, the Vernunt Admin Email Log updates to <strong>Read</strong> in real time.</p>
        `,
        callToAction: { label: 'Open Vernunt App', url: observedPublicOrigin },
        footerNote: 'Sent from Vernunt Admin Email Logs Desk.'
      });

      const adminInstance = await getAdmin();
      const result = await sendEmailMessage({
        to: cleanTo,
        subject: mailSubject,
        type: 'test_email',
        triggerSource: 'Admin Email Logs Test',
        htmlContent,
        textContent: `${mailSubject}\n\n${bodyText}`,
        adminInstance
      });

      return res.json({
        success: true,
        logId: result.logId,
        deliveryStatus: result.deliveryStatus,
        error: result.error,
        stats: getEmailLogStats()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/admin/email-logs/:id/resend', async (req: Request, res: Response) => {
    try {
      const original = emailLogs.find(l => l.id === req.params.id);
      if (!original) {
        return res.status(404).json({ success: false, error: 'Original email log not found.' });
      }
      const adminInstance = await getAdmin();
      const result = await sendEmailMessage({
        to: original.to,
        subject: original.subject,
        type: original.type,
        triggerSource: `Resend: ${original.triggerSource}`,
        htmlContent: original.htmlContent || buildVernuntEmailTemplate({
          title: original.subject,
          badgeText: '🔁 Resent Notification',
          mainContentHtml: `<p>${escapeHtml(original.textPreview || original.subject)}</p>`
        }),
        textContent: original.textPreview || original.subject,
        adminInstance
      });
      return res.json({
        success: true,
        logId: result.logId,
        deliveryStatus: result.deliveryStatus,
        error: result.error
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.get('/api/notifications/email-logs', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      total: emailLogs.length,
      stats: getEmailLogStats(),
      smtp: getSmtpRuntimeInfo(),
      logs: emailLogs.slice(0, 100).map(serializeLogForStream)
    });
  });
}
