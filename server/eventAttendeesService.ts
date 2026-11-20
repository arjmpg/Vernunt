import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';
import QRCode from 'qrcode';
import { generateEventTicketPdfAndQr } from './ticketPdfService.ts';
import { buildVernuntEmailTemplate, sendEmailMessage } from './emailService.ts';

export interface StoredEventAttendee {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  hostName: string;
  hostId?: string;
  organizerEmail?: string;
  userId?: string;
  name: string;
  childName?: string;
  email: string;
  mobile: string;
  ticketNumber: string;
  bookingReference: string;
  ticketTierName: string;
  quantity: number;
  amountPaid: number;
  paymentStatus: 'PAID' | 'COMPLIMENTARY' | 'IMPORTED';
  checkedIn: boolean;
  checkedInAt?: string;
  source: 'booking' | 'host_import' | 'admin_bulk_upload';
  emailSent?: boolean;
  emailSentAt?: string;
  qrDataUrl?: string;
  createdAt: string;
}

const ATTENDEES_DATA_FILE = path.join(process.cwd(), 'data', 'event_attendees.json');
const AUTHORIZED_ADMIN_EMAILS = ['arjunmpgupta@gmail.com', 'ardha@vernunt.com'];

function normalizeEmail(email?: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeMobile(mobile?: string): string {
  const digits = String(mobile || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function formatMobileDisplay(mobile?: string): string {
  const raw = String(mobile || '').trim();
  const last10 = normalizeMobile(raw);
  if (!last10) return raw;
  return raw.startsWith('+') ? raw : `+91 ${last10}`;
}

function csvEscape(val: unknown): string {
  const str = String(val ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function loadAllEventAttendees(): StoredEventAttendee[] {
  try {
    if (fs.existsSync(ATTENDEES_DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ATTENDEES_DATA_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[EventAttendees] Read warning:', err);
  }
  return [];
}

export function saveAllEventAttendees(list: StoredEventAttendee[]): void {
  try {
    const dir = path.dirname(ATTENDEES_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ATTENDEES_DATA_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('[EventAttendees] Write error:', err);
  }
}

export function getAttendeesForEvent(eventId: string): StoredEventAttendee[] {
  const all = loadAllEventAttendees();
  return all
    .filter((a) => a.eventId === eventId)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function generateAttendeeQrDataUrl(params: {
  passId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  attendeeName: string;
  quantity: number;
}): Promise<string> {
  const qrPayload = JSON.stringify({
    app: 'VERNUNT',
    passId: params.passId,
    bookingId: params.bookingId,
    eventId: params.eventId,
    event: params.eventTitle.slice(0, 60),
    date: params.eventDate,
    attendee: params.attendeeName.slice(0, 50),
    qty: params.quantity,
    url: `https://app.vernunt.com/?tab=events&ticket=${encodeURIComponent(params.passId)}`
  });
  return QRCode.toDataURL(qrPayload, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' }
  });
}

export async function upsertEventAttendee(record: Partial<StoredEventAttendee> & {
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  mobile?: string;
}): Promise<StoredEventAttendee> {
  const all = loadAllEventAttendees();
  const cleanEmail = normalizeEmail(record.email);
  const cleanMobile = normalizeMobile(record.mobile);

  const existingIdx = all.findIndex((item) => {
    if (item.eventId !== record.eventId) return false;
    if (record.ticketNumber && item.ticketNumber === record.ticketNumber) return true;
    if (cleanEmail && normalizeEmail(item.email) === cleanEmail) return true;
    if (cleanMobile && normalizeMobile(item.mobile) === cleanMobile) return true;
    return false;
  });

  const eventCode = (record.eventId || 'EVT').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'EVT';
  const passId =
    record.ticketNumber ||
    (existingIdx >= 0 ? all[existingIdx].ticketNumber : `VERN-${eventCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const id = record.id || (existingIdx >= 0 ? all[existingIdx].id : `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const qrDataUrl =
    record.qrDataUrl ||
    (existingIdx >= 0 && all[existingIdx].qrDataUrl
      ? all[existingIdx].qrDataUrl
      : await generateAttendeeQrDataUrl({
          passId,
          bookingId: id,
          eventId: record.eventId,
          eventTitle: record.eventTitle,
          eventDate: record.eventDate || '',
          attendeeName: record.childName || record.name,
          quantity: Math.max(1, Number(record.quantity || 1))
        }));

  const merged: StoredEventAttendee = {
    ...(existingIdx >= 0 ? all[existingIdx] : {}),
    id,
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    eventDate: record.eventDate || all[existingIdx]?.eventDate || '',
    eventTime: record.eventTime || all[existingIdx]?.eventTime || '10:00 AM',
    eventVenue: record.eventVenue || all[existingIdx]?.eventVenue || 'Bengaluru, India',
    hostName: record.hostName || all[existingIdx]?.hostName || 'Verified Vernunt Host',
    hostId: record.hostId || all[existingIdx]?.hostId,
    organizerEmail: record.organizerEmail ? normalizeEmail(record.organizerEmail) : all[existingIdx]?.organizerEmail,
    userId: record.userId || all[existingIdx]?.userId,
    name: record.name.trim(),
    childName: record.childName || all[existingIdx]?.childName || record.name.trim(),
    email: cleanEmail || all[existingIdx]?.email || '',
    mobile: formatMobileDisplay(record.mobile || all[existingIdx]?.mobile || ''),
    ticketNumber: passId,
    bookingReference: record.bookingReference || passId,
    ticketTierName: record.ticketTierName || all[existingIdx]?.ticketTierName || 'General Admission Pass',
    quantity: Math.max(1, Number(record.quantity || all[existingIdx]?.quantity || 1)),
    amountPaid: Number(record.amountPaid ?? all[existingIdx]?.amountPaid ?? 0),
    paymentStatus: record.paymentStatus || all[existingIdx]?.paymentStatus || 'COMPLIMENTARY',
    checkedIn: record.checkedIn ?? all[existingIdx]?.checkedIn ?? false,
    checkedInAt: record.checkedInAt || all[existingIdx]?.checkedInAt,
    source: record.source || all[existingIdx]?.source || 'booking',
    emailSent: record.emailSent ?? all[existingIdx]?.emailSent ?? false,
    emailSentAt: record.emailSentAt || all[existingIdx]?.emailSentAt,
    qrDataUrl,
    createdAt: all[existingIdx]?.createdAt || record.createdAt || new Date().toISOString()
  };

  if (existingIdx >= 0) {
    all[existingIdx] = merged;
  } else {
    all.unshift(merged);
  }
  saveAllEventAttendees(all);
  return merged;
}

interface EventAttendeeRouteDeps {
  loadRegisteredUsers: () => any[];
  saveRegisteredUsers: (users: any[]) => void;
  persistUserToFirestore: (user: any) => Promise<void>;
  getFirebaseAdmin: () => Promise<any>;
}

const GENERIC_HOST_NAMES = new Set([
  'community organizer',
  'organizer',
  'verified vernunt host',
  'vernunt event host',
  'vernunt community host',
  'guest',
  'parent',
  'user',
  'admin'
]);

function isRequesterEventOwnerOrAdmin(params: {
  requesterRole?: string;
  requesterId?: string;
  requesterEmail?: string;
  requesterName?: string;
  eventHostId?: string;
  eventOrganizerEmail?: string;
  eventHostName?: string;
  storedAttendees?: StoredEventAttendee[];
}): boolean {
  const cleanReqEmail = normalizeEmail(params.requesterEmail);
  if (params.requesterRole === 'Admin' || AUTHORIZED_ADMIN_EMAILS.includes(cleanReqEmail)) {
    return true;
  }

  const cleanReqId = String(params.requesterId || '').trim();
  const cleanReqName = String(params.requesterName || '').trim().toLowerCase();
  if (!cleanReqId && !cleanReqEmail && !cleanReqName) {
    return false;
  }

  // Gather known owner identifiers from event metadata and any previously stored records for this event
  const storedFirst = params.storedAttendees?.find((a) => a.hostId || a.organizerEmail || a.hostName);
  const hostId = String(params.eventHostId || storedFirst?.hostId || '').trim();
  const orgEmail = normalizeEmail(params.eventOrganizerEmail || storedFirst?.organizerEmail);
  const hostName = String(params.eventHostName || storedFirst?.hostName || '').trim().toLowerCase();

  if (cleanReqId && hostId && cleanReqId === hostId) return true;
  if (cleanReqEmail && orgEmail && cleanReqEmail === orgEmail) return true;
  if (cleanReqName && hostName && !GENERIC_HOST_NAMES.has(hostName) && cleanReqName === hostName) return true;

  return false;
}

export function registerEventAttendeeRoutes(app: Express, deps: EventAttendeeRouteDeps): void {
  // 1. List all attendees/users booked or imported for a single event (Admin or owning Event Host ONLY)
  app.get('/api/events/:eventId/attendees', (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      if (!eventId) {
        return res.status(400).json({ success: false, error: 'Event ID is required.' });
      }
      const attendees = getAttendeesForEvent(eventId);

      // Strictly enforce Event Host or Admin authorization on every request
      const allowed = isRequesterEventOwnerOrAdmin({
        requesterRole: String(req.query.requesterRole || '').trim(),
        requesterId: String(req.query.requesterId || '').trim(),
        requesterEmail: String(req.query.requesterEmail || '').trim(),
        requesterName: String(req.query.requesterName || '').trim(),
        eventHostId: String(req.query.eventHostId || '').trim(),
        eventOrganizerEmail: String(req.query.eventOrganizerEmail || '').trim(),
        eventHostName: String(req.query.eventHostName || '').trim(),
        storedAttendees: attendees
      });
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Event Users CSV is restricted exclusively to the Event Host and Admin.'
        });
      }

      res.json({ success: true, eventId, count: attendees.length, attendees });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch event attendees.' });
    }
  });

  // 2. Export event-wise users list as CSV (Admin or owning Event Host ONLY)
  app.get('/api/events/:eventId/attendees/export.csv', (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      const eventTitle = String(req.query.eventTitle || eventId).trim();
      const attendees = getAttendeesForEvent(eventId);

      const allowed = isRequesterEventOwnerOrAdmin({
        requesterRole: String(req.query.requesterRole || '').trim(),
        requesterId: String(req.query.requesterId || '').trim(),
        requesterEmail: String(req.query.requesterEmail || '').trim(),
        requesterName: String(req.query.requesterName || '').trim(),
        eventHostId: String(req.query.eventHostId || '').trim(),
        eventOrganizerEmail: String(req.query.eventOrganizerEmail || '').trim(),
        eventHostName: String(req.query.eventHostName || '').trim(),
        storedAttendees: attendees
      });
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Event Users CSV export is restricted exclusively to the Event Host and Admin.'
        });
      }

      const header = [
        'Name',
        'Email ID',
        'Mobile Number',
        'Child Name',
        'Ticket Tier',
        'Quantity',
        'Booking Reference',
        'QR Pass Code',
        'Payment Status',
        'Check-In Status',
        'Source',
        'Email Notification',
        'Registered At'
      ];

      const lines = [
        header.map(csvEscape).join(','),
        ...attendees.map((a) =>
          [
            a.name,
            a.email,
            a.mobile,
            a.childName || a.name,
            a.ticketTierName,
            a.quantity,
            a.bookingReference,
            a.ticketNumber,
            a.paymentStatus,
            a.checkedIn ? 'Checked In' : 'Pending Check-In',
            a.source,
            a.emailSent ? 'Sent' : 'Not Sent',
            a.createdAt
          ]
            .map(csvEscape)
            .join(',')
        )
      ];

      const safeSlug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="vernunt-event-users-${safeSlug}.csv"`);
      res.send(lines.join('\r\n'));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'CSV export failed.' });
    }
  });

  // 3. Record a single booking into the event-wise attendee ledger
  app.post('/api/events/:eventId/attendees/record', async (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      const payload = req.body || {};
      if (!eventId || !payload.name) {
        return res.status(400).json({ success: false, error: 'eventId and attendee name are required.' });
      }
      const saved = await upsertEventAttendee({
        ...payload,
        eventId,
        eventTitle: payload.eventTitle || 'Vernunt Event',
        name: payload.name,
        email: payload.email || '',
        mobile: payload.mobile || ''
      });
      res.json({ success: true, attendee: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to record attendee.' });
    }
  });

  // 4. Host & Admin Roster Import (event-wise CSV import — strictly restricted to Admin or the event's own host)
  app.post('/api/events/:eventId/attendees/import', async (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      const { event, rows, requesterRole, requesterId, requesterEmail, requesterName } = req.body || {};
      if (!eventId || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Event ID and at least one attendee row are required.' });
      }

      const existingForEvent = getAttendeesForEvent(eventId);
      const allowed = isRequesterEventOwnerOrAdmin({
        requesterRole,
        requesterId,
        requesterEmail,
        requesterName,
        eventHostId: event?.hostId,
        eventOrganizerEmail: event?.organizerEmail,
        eventHostName: event?.hostName,
        storedAttendees: existingForEvent
      });
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Event hosts can only import users into events they have organized.'
        });
      }

      const existingEmails = new Set(existingForEvent.map((a) => normalizeEmail(a.email)).filter(Boolean));
      const existingMobiles = new Set(existingForEvent.map((a) => normalizeMobile(a.mobile)).filter(Boolean));

      let importedCount = 0;
      let skippedDuplicates = 0;
      let invalidRows = 0;
      const importedAttendees: StoredEventAttendee[] = [];

      for (const rawRow of rows.slice(0, 500)) {
        const name = String(rawRow?.name || '').trim();
        const email = normalizeEmail(rawRow?.email);
        const mobile = normalizeMobile(rawRow?.mobile);
        if (!name || (!email && !mobile)) {
          invalidRows++;
          continue;
        }
        if ((email && existingEmails.has(email)) || (mobile && existingMobiles.has(mobile))) {
          skippedDuplicates++;
          continue;
        }

        const saved = await upsertEventAttendee({
          eventId,
          eventTitle: String(event?.title || 'Vernunt Event'),
          eventDate: String(event?.date || ''),
          eventTime: String(event?.time || '10:00 AM'),
          eventVenue: String(event?.location || 'Bengaluru, India'),
          hostName: String(event?.hostName || 'Verified Vernunt Host'),
          hostId: event?.hostId ? String(event.hostId) : undefined,
          organizerEmail: event?.organizerEmail ? String(event.organizerEmail) : undefined,
          name,
          childName: String(rawRow?.childName || name).trim(),
          email,
          mobile: formatMobileDisplay(rawRow?.mobile || mobile),
          ticketTierName: String(rawRow?.ticketTierName || 'General Admission Pass').trim(),
          quantity: Math.max(1, Number(rawRow?.quantity || 1)),
          amountPaid: Number(rawRow?.amountPaid || 0),
          paymentStatus: 'IMPORTED',
          source: 'host_import',
          emailSent: false
        });

        if (email) existingEmails.add(email);
        if (mobile) existingMobiles.add(mobile);
        importedCount++;
        importedAttendees.push(saved);
      }

      const attendees = getAttendeesForEvent(eventId);
      res.json({
        success: true,
        summary: {
          totalSubmitted: rows.length,
          importedCount,
          skippedDuplicates,
          invalidRows
        },
        importedAttendees,
        attendees
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to import event attendees.' });
    }
  });

  // 5. ADMIN-ONLY Event-Wise Bulk Upload:
  //    Automatically creates user accounts + generates booking QR codes for the selected event
  //    + dispatches PDF ticket & QR code email notifications to all uploaded users.
  app.post('/api/events/:eventId/admin-bulk-upload', async (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      const { event, rows, requesterRole, requesterEmail, sendEmails = true } = req.body || {};

      // Enforce Admin-Only permission on the server
      const cleanReqEmail = normalizeEmail(requesterEmail);
      const isAdmin =
        requesterRole === 'Admin' || AUTHORIZED_ADMIN_EMAILS.includes(cleanReqEmail);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin authorization required. Only Admin can auto-create users and send bulk booking QR emails.'
        });
      }

      if (!eventId || !event?.title || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid single event details and at least one user row (name, email, mobile) are required.'
        });
      }

      const registeredUsers = deps.loadRegisteredUsers();
      const existingEventAttendees = getAttendeesForEvent(eventId);
      const adminInstance = await deps.getFirebaseAdmin().catch(() => null);

      let usersCreated = 0;
      let existingUsersLinked = 0;
      let bookingsGenerated = 0;
      let emailsSent = 0;
      let emailsFailed = 0;
      let skippedInvalid = 0;

      const createdUsers: any[] = [];
      const results: Array<{
        name: string;
        email: string;
        mobile: string;
        userId: string;
        accountAction: 'created' | 'linked';
        ticketNumber: string;
        bookingReference: string;
        qrDataUrl: string;
        emailSent: boolean;
        emailStatus: string;
        error?: string;
      }> = [];

      const eventTitle = String(event.title || 'Vernunt Event').trim();
      const eventCategory = String(event.category || 'Kids & Family Event').trim();
      const eventDate = String(event.date || new Date().toISOString().split('T')[0]).trim();
      const eventTime = String(event.time || '10:00 AM').trim();
      const eventVenue = String(event.location || 'Bengaluru, India').trim();
      const hostName = String(event.hostName || 'Verified Vernunt Host').trim();
      const eventCode = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'EVT';

      for (const rawRow of rows.slice(0, 250)) {
        const name = String(rawRow?.name || '').trim();
        const email = normalizeEmail(rawRow?.email);
        const mobile10 = normalizeMobile(rawRow?.mobile);
        const mobileFormatted = formatMobileDisplay(rawRow?.mobile || mobile10);
        const childName = String(rawRow?.childName || name).trim();
        const ticketTierName = String(rawRow?.ticketTierName || 'Verified Event Pass').trim();
        const quantity = Math.max(1, Number(rawRow?.quantity || 1));

        if (!name || (!email && !mobile10)) {
          skippedInvalid++;
          continue;
        }

        // Step A: Find or Auto-Create User Account
        let matchedUser = registeredUsers.find((u: any) => {
          const uEmail = normalizeEmail(u?.email);
          const uMobile = normalizeMobile(u?.phoneNumber || u?.phone);
          return (email && uEmail && uEmail === email) || (mobile10 && uMobile && uMobile === mobile10);
        });

        let accountAction: 'created' | 'linked' = 'linked';
        if (!matchedUser) {
          accountAction = 'created';
          const newUserId = `usr_evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          matchedUser = {
            id: newUserId,
            parentName: name,
            childName,
            email: email || `${mobile10}@attendee.vernunt.com`,
            phoneNumber: mobileFormatted,
            phone: mobile10,
            userRole: 'eventbuyers',
            verificationStatus: 'VERIFIED',
            aadhaarVerified: false,
            neighbourhood: eventVenue.slice(0, 120),
            registeredAt: new Date().toISOString(),
            createdByAdminEventUpload: true,
            sourceEventId: eventId,
            sourceEventTitle: eventTitle
          };
          registeredUsers.unshift(matchedUser);
          createdUsers.push(matchedUser);
          usersCreated++;

          // Best-effort Firestore cloud sync
          await deps.persistUserToFirestore(matchedUser).catch(() => {});
        } else {
          existingUsersLinked++;
        }

        // Step B: Create/Reuse Event Booking & Generate Scannable QR Code + Printable PDF Pass
        const existingAttendee = existingEventAttendees.find((a) => {
          return (
            (email && normalizeEmail(a.email) === email) ||
            (mobile10 && normalizeMobile(a.mobile) === mobile10)
          );
        });

        const passId =
          existingAttendee?.ticketNumber ||
          `VERN-${eventCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const bookingId = existingAttendee?.id || `bkg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const viewUrl = `https://app.vernunt.com/?tab=events&ticket=${encodeURIComponent(passId)}`;

        const ticketAssets = await generateEventTicketPdfAndQr({
          passId,
          eventTitle,
          eventCategory,
          eventDate,
          eventTime,
          eventVenue,
          hostName,
          attendeeName: name,
          childName,
          buyerEmail: email || undefined,
          buyerPhone: mobileFormatted || undefined,
          ticketTierName,
          quantity,
          amountPaid: 0,
          paymentId: `ADMIN_INV_${passId}`,
          bookingId,
          eventId,
          ticketViewUrl: viewUrl
        });

        bookingsGenerated++;

        // Step C: Send Email Notification with Event Details + Inline QR Code + Attached PDF Pass
        let emailSentOk = false;
        let emailStatus = 'Skipped (no valid email)';
        let emailErrMsg: string | undefined;

        if (sendEmails && email && email.includes('@')) {
          try {
            const subject = `🎟️ Your Vernunt Event Pass & QR Code (PDF) #${passId} — ${eventTitle}`;
            const accountNoticeHtml =
              accountAction === 'created'
                ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 14px;margin:14px 0;font-size:13px;color:#1e3a8a;">
                    <strong>🎉 Your Vernunt Account is Ready:</strong> We created your verified Vernunt attendee profile using <strong>${email}</strong>${mobileFormatted ? ` (${mobileFormatted})` : ''}. Sign in anytime to access your digital passes &amp; community events.
                  </div>`
                : '';

            const mainHtml = `
              <p>Hi <strong>${name}</strong>,</p>
              <p>You have been registered for <strong>${eventTitle}</strong>! Your official booking QR code and printable <strong>PDF Admission Pass</strong> (${ticketAssets.pdfFilename}) are ready below and attached to this email.</p>
              ${accountNoticeHtml}
              <div class="details-card">
                <div class="details-row"><span class="details-label">Ticket Pass ID</span><span class="details-value font-mono">#${passId}</span></div>
                <div class="details-row"><span class="details-label">Event</span><span class="details-value">${eventTitle}</span></div>
                <div class="details-row"><span class="details-label">Date &amp; Time</span><span class="details-value">${eventDate} • ${eventTime}</span></div>
                <div class="details-row"><span class="details-label">Venue</span><span class="details-value">${eventVenue}</span></div>
                <div class="details-row"><span class="details-label">Attendee</span><span class="details-value">${childName && childName !== name ? `${childName} (Parent: ${name})` : name}</span></div>
                <div class="details-row"><span class="details-label">Pass Tier &amp; Qty</span><span class="details-value">${ticketTierName} × ${quantity}</span></div>
                <div class="details-row"><span class="details-label">Organizer</span><span class="details-value">${hostName}</span></div>
              </div>

              <div style="text-align:center;background:#ffffff;border:2px dashed #be123c;border-radius:16px;padding:20px;margin:20px 0;">
                <div style="font-size:11px;font-weight:800;color:#be123c;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">
                  📱 Gate Check-In QR Code
                </div>
                <img src="cid:vernunt-ticket-qr@vernunt.com" alt="Event Check-in QR Code #${passId}" width="180" height="180" style="display:block;margin:0 auto;border-radius:10px;border:1px solid #e2e8f0;" />
                <div style="margin-top:10px;font-family:monospace;font-size:13px;font-weight:800;color:#0f172a;">#${passId}</div>
                <div style="margin-top:6px;font-size:12px;color:#475569;">📎 Printable PDF Pass attached: <strong>${ticketAssets.pdfFilename}</strong></div>
              </div>

              <div class="safety-callout">
                🛡️ <strong>Check-In Tip:</strong> Present the QR code above or the attached PDF pass at the venue entrance for instant contactless scanning.
              </div>
            `;

            const htmlContent = buildVernuntEmailTemplate({
              title: subject,
              badgeText: '🎟️ Confirmed Event Pass + QR',
              mainContentHtml: mainHtml,
              callToAction: { label: 'Open My Digital Pass in Vernunt', url: viewUrl },
              footerNote: 'Vernunt Event Registration • Official PDF Admission Pass & QR Code attached.'
            });

            const textContent = [
              `Hi ${name},`,
              '',
              `You are booked for "${eventTitle}"!`,
              accountAction === 'created'
                ? `Your Vernunt account has been created with ${email}${mobileFormatted ? ` / ${mobileFormatted}` : ''}.`
                : '',
              `Ticket Pass ID: #${passId}`,
              `Date & Time: ${eventDate} at ${eventTime}`,
              `Venue: ${eventVenue}`,
              `Pass Tier: ${ticketTierName} x ${quantity}`,
              `View Pass: ${viewUrl}`,
              '',
              `Your printable PDF Ticket Pass (${ticketAssets.pdfFilename}) with scannable QR code is attached.`,
              '- Team Vernunt'
            ]
              .filter(Boolean)
              .join('\n');

            const sendRes = await sendEmailMessage({
              to: email,
              subject,
              type: 'event_ticket',
              triggerSource: 'Admin Event Bulk Upload (Auto User + Booking QR)',
              textContent,
              htmlContent,
              attachments: [
                {
                  filename: ticketAssets.pdfFilename,
                  content: ticketAssets.pdfBuffer,
                  contentType: 'application/pdf'
                },
                {
                  filename: `qr-${passId}.png`,
                  content: ticketAssets.qrPngBuffer,
                  contentType: 'image/png',
                  cid: 'vernunt-ticket-qr@vernunt.com'
                }
              ],
              adminInstance,
              metadata: {
                eventId,
                eventTitle,
                passId,
                userId: matchedUser.id,
                accountAction,
                pdfAttached: true
              }
            });

            emailSentOk = Boolean(sendRes.success);
            emailStatus = emailSentOk
              ? sendRes.provider === 'smtp'
                ? 'Delivered via SMTP (PDF + QR)'
                : `Logged (${sendRes.provider})`
              : sendRes.error || 'Email delivery failed';
            if (emailSentOk) emailsSent++;
            else emailsFailed++;
          } catch (mailErr: any) {
            emailsFailed++;
            emailSentOk = false;
            emailStatus = mailErr?.message || 'Email send failed';
            emailErrMsg = mailErr?.message;
          }
        } else if (!sendEmails) {
          emailStatus = 'Email dispatch disabled by Admin';
        }

        // Persist event attendee record with QR & email status
        await upsertEventAttendee({
          id: bookingId,
          eventId,
          eventTitle,
          eventDate,
          eventTime,
          eventVenue,
          hostName,
          userId: matchedUser.id,
          name,
          childName,
          email,
          mobile: mobileFormatted,
          ticketNumber: passId,
          bookingReference: passId,
          ticketTierName,
          quantity,
          amountPaid: 0,
          paymentStatus: 'COMPLIMENTARY',
          source: 'admin_bulk_upload',
          emailSent: emailSentOk,
          emailSentAt: emailSentOk ? new Date().toISOString() : undefined,
          qrDataUrl: ticketAssets.qrDataUrl
        });

        results.push({
          name,
          email,
          mobile: mobileFormatted,
          userId: matchedUser.id,
          accountAction,
          ticketNumber: passId,
          bookingReference: passId,
          qrDataUrl: ticketAssets.qrDataUrl,
          emailSent: emailSentOk,
          emailStatus,
          error: emailErrMsg
        });
      }

      // Persist updated registered users cache once after loop
      if (usersCreated > 0) {
        deps.saveRegisteredUsers(registeredUsers);
      }

      const updatedEventAttendees = getAttendeesForEvent(eventId);
      console.log(
        `[Admin Event Bulk Upload] Event "${eventTitle}" (${eventId}): ${usersCreated} users created, ${existingUsersLinked} linked, ${bookingsGenerated} QR bookings generated, ${emailsSent} emails sent.`
      );

      res.json({
        success: true,
        eventId,
        eventTitle,
        summary: {
          totalProcessed: results.length,
          usersCreated,
          existingUsersLinked,
          bookingsGenerated,
          emailsSent,
          emailsFailed,
          skippedInvalid
        },
        createdUsers,
        results,
        attendees: updatedEventAttendees
      });
    } catch (err: any) {
      console.error('[Admin Event Bulk Upload] Error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Bulk upload failed.' });
    }
  });
}
