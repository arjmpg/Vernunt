import { EventTicketPurchase } from '../types.ts';

const PURCHASES_STORAGE_KEY = 'vernunt_event_ticket_purchases_v2';

export const INITIAL_EVENT_PURCHASES: EventTicketPurchase[] = [
  {
    id: 'tkt-demo-upcoming-1',
    eventId: 'blr-event-1',
    eventTitle: 'Cubbon Park Weekend Family Art & Nature Sketching',
    eventType: 'event',
    eventDate: '2026-10-15',
    eventTime: '09:00 AM',
    eventLocation: 'Cubbon Park Bamboo Grove Lawn, Bangalore',
    venueAddress: 'Kasturba Road, Sampangi Rama Nagar, Bengaluru, Karnataka 560001',
    ticketTierName: 'Family General Admission Pass',
    ticketQuantity: 2,
    ticketPrice: 0,
    totalPaid: 0,
    purchasedAt: '2026-09-24T10:15:00.000Z',
    buyerName: 'Vikram Mehta',
    buyerPhone: '9845012345',
    buyerEmail: 'vikram.mehta@example.com',
    buyerRole: 'eventbuyers',
    status: 'confirmed',
    registrationStatus: 'Upcoming',
    checkInStatus: 'Upcoming',
    isPastEvent: false,
    qrPassCode: 'PASS-CP-882190',
    bookingReference: 'VERN-EVT-7721',
    childName: 'Aarav Mehta',
    childAge: 6,
    organizerName: 'Bangalore Sketchers Guild',
    organizerPhone: '+91 98450 99881',
    seatNumber: 'Zone A - Lawn Spot 14',
    notes: 'Bring water bottle & sketch pad; pastels will be provided at the registration desk.'
  },
  {
    id: 'tkt-demo-upcoming-2',
    eventId: 'blr-event-2',
    eventTitle: 'Lalbagh Botanical Tree Walk & Kids Flora Journaling',
    eventType: 'activity',
    eventDate: '2026-10-02',
    eventTime: '07:30 AM',
    eventLocation: 'Lalbagh West Gate Entrance, Bangalore',
    venueAddress: 'Mavalli, Bengaluru, Karnataka 560004',
    ticketTierName: 'Junior Naturalist Pass + Discovery Kit',
    ticketQuantity: 1,
    ticketPrice: 299,
    totalPaid: 299,
    purchasedAt: '2026-09-25T14:30:00.000Z',
    buyerName: 'Vikram Mehta',
    buyerPhone: '9845012345',
    buyerEmail: 'vikram.mehta@example.com',
    buyerRole: 'eventbuyers',
    status: 'confirmed',
    registrationStatus: 'Checking In',
    checkInStatus: 'Checking In',
    isPastEvent: false,
    qrPassCode: 'PASS-LB-449102',
    bookingReference: 'VERN-EVT-8842',
    childName: 'Aarav Mehta',
    childAge: 6,
    organizerName: 'Urban Ecologists Club',
    organizerPhone: '+91 99001 22334',
    seatNumber: 'Batch 1 - Morning Flora Tour',
    notes: 'Gate check-in opens 15 mins prior. OTP mobile verified pass.'
  },
  {
    id: 'tkt-demo-past-1',
    eventId: 'blr-past-101',
    eventTitle: 'Bangalore Inter-School Robotics & AI Junior Championship',
    eventType: 'event',
    eventDate: '2026-08-20',
    eventTime: '10:00 AM',
    eventLocation: 'Koramangala Indoor Arena, 8th Block, Bangalore',
    venueAddress: '80 Feet Road, Koramangala 8th Block, Bengaluru, Karnataka 560095',
    ticketTierName: 'RoboBuilder Competitor + Parent Arena Pass',
    ticketQuantity: 2,
    ticketPrice: 499,
    totalPaid: 499,
    purchasedAt: '2026-08-05T09:00:00.000Z',
    buyerName: 'Vikram Mehta',
    buyerPhone: '9845012345',
    buyerEmail: 'vikram.mehta@example.com',
    buyerRole: 'eventbuyers',
    status: 'attended',
    registrationStatus: 'Completed',
    checkInStatus: 'Completed',
    isPastEvent: true,
    qrPassCode: 'PASS-ROBO-9921',
    bookingReference: 'VERN-EVT-6104',
    childName: 'Aarav Mehta',
    childAge: 6,
    organizerName: 'StemMinds Academy Bangalore',
    organizerPhone: '+91 97410 88219',
    seatNumber: 'Arena Table 12',
    notes: 'Certificate of Excellence issued. Check-in validated at Gate 2.'
  },
  {
    id: 'tkt-demo-past-2',
    eventId: 'blr-past-102',
    eventTitle: 'Summer Clay Sculpting & Traditional Pottery Circle',
    eventType: 'classes',
    eventDate: '2026-07-14',
    eventTime: '04:00 PM',
    eventLocation: 'Clay Station Art Studio, Indiranagar, Bangalore',
    venueAddress: '12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
    ticketTierName: 'Hands-on Wheel Pottery Pass',
    ticketQuantity: 1,
    ticketPrice: 350,
    totalPaid: 350,
    purchasedAt: '2026-07-02T16:20:00.000Z',
    buyerName: 'Vikram Mehta',
    buyerPhone: '9845012345',
    buyerEmail: 'vikram.mehta@example.com',
    buyerRole: 'eventbuyers',
    status: 'attended',
    registrationStatus: 'Completed',
    checkInStatus: 'Completed',
    isPastEvent: true,
    qrPassCode: 'PASS-CLAY-3301',
    bookingReference: 'VERN-EVT-5519',
    childName: 'Aarav Mehta',
    childAge: 6,
    organizerName: 'Master Potter Rameshwar',
    organizerPhone: '+91 94480 11928',
    seatNumber: 'Wheel Station 4',
    notes: 'Terracotta cup firing completed and collected.'
  }
];

export function getStoredEventPurchases(): EventTicketPurchase[] {
  if (typeof window === 'undefined') return INITIAL_EVENT_PURCHASES;
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_EVENT_PURCHASES));
      return INITIAL_EVENT_PURCHASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all records have valid registrationStatus
      return parsed.map(item => ({
        ...item,
        registrationStatus: item.registrationStatus || (item.isPastEvent ? 'Completed' : 'Upcoming'),
        isPastEvent: item.isPastEvent !== undefined ? item.isPastEvent : (new Date(item.eventDate) < new Date())
      }));
    }
    return INITIAL_EVENT_PURCHASES;
  } catch (err) {
    console.error('Failed to load event purchases:', err);
    return INITIAL_EVENT_PURCHASES;
  }
}

export function saveEventPurchase(purchase: Omit<EventTicketPurchase, 'id' | 'purchasedAt' | 'qrPassCode' | 'bookingReference'>): EventTicketPurchase {
  const all = getStoredEventPurchases();
  const id = `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrPassCode = `PASS-${(purchase.eventId || 'EVT').slice(-4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const bookingReference = `VERN-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const record: EventTicketPurchase = {
    ...purchase,
    id,
    purchasedAt: new Date().toISOString(),
    qrPassCode,
    bookingReference,
    status: purchase.status || 'confirmed',
    registrationStatus: purchase.registrationStatus || 'Upcoming',
    checkInStatus: purchase.checkInStatus || 'Upcoming',
    isPastEvent: false
  };
  
  const updated = [record, ...all];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage limit reached when saving purchase', e);
    }
  }
  return record;
}

export function getUserEventPurchases(phone?: string, email?: string): EventTicketPurchase[] {
  const all = getStoredEventPurchases();
  if (!phone && !email) return all;
  
  const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
  return all.filter(p => {
    const pPhone = p.buyerPhone ? p.buyerPhone.replace(/\D/g, '').slice(-10) : '';
    const phoneMatch = cleanPhone && pPhone && (pPhone === cleanPhone || pPhone.includes(cleanPhone));
    const emailMatch = email && p.buyerEmail && p.buyerEmail.toLowerCase() === email.toLowerCase();
    // Default fallback: return all demo records if phone is generic demo user
    if (!cleanPhone && !email) return true;
    return phoneMatch || emailMatch || cleanPhone === '9845012345' || cleanPhone === '9876543210';
  });
}

/**
 * Downloads a high-definition, printable offline digital ticket pass as an HTML/SVG document.
 */
export function downloadTicketPass(ticket: EventTicketPurchase): void {
  if (typeof window === 'undefined') return;

  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    ticket.qrPassCode || ticket.bookingReference
  )}&color=0f172a&bgcolor=ffffff`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vernunt Event Pass - ${ticket.eventTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #f1f5f9; padding: 24px; display: flex; justify-content: center; }
    .ticket-card { width: 100%; max-width: 520px; background: #ffffff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #e11d48, #ea580c); color: white; padding: 28px 24px; position: relative; }
    .badge { display: inline-block; background: rgba(255,255,255,0.25); color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.5px; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 900; line-height: 1.3; }
    .ref-bar { display: flex; justify-content: space-between; font-size: 12px; margin-top: 12px; opacity: 0.95; font-family: monospace; }
    .notch-container { position: relative; height: 24px; background: #ffffff; }
    .notch-left, .notch-right { position: absolute; top: -12px; width: 24px; height: 24px; background: #f1f5f9; border-radius: 50%; }
    .notch-left { left: -12px; }
    .notch-right { right: -12px; }
    .dashed-line { border-top: 2px dashed #cbd5e1; position: absolute; top: 0; left: 16px; right: 16px; }
    .body { padding: 24px; }
    .qr-box { text-align: center; padding: 18px; background: #f8fafc; border-radius: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
    .qr-img { width: 180px; height: 180px; margin: 0 auto; display: block; border-radius: 12px; }
    .qr-code-text { font-family: monospace; font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .cell { background: #f8fafc; padding: 12px 14px; border-radius: 12px; border: 1px solid #f1f5f9; }
    .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; }
    .status-upcoming { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .status-checking { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .status-completed { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .ticket-card { box-shadow: none; border: 1px solid #ccc; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <span class="badge">Official Admission E-Pass</span>
      <h1 class="title">${ticket.eventTitle}</h1>
      <div class="ref-bar">
        <span>Booking: <strong>${ticket.bookingReference}</strong></span>
        <span>Pass Code: <strong>${ticket.qrPassCode}</strong></span>
      </div>
    </div>
    <div class="notch-container">
      <div class="notch-left"></div>
      <div class="dashed-line"></div>
      <div class="notch-right"></div>
    </div>
    <div class="body">
      <div class="qr-box">
        <img class="qr-img" src="${qrSvgUrl}" alt="Check-in QR Code" />
        <div class="qr-code-text">${ticket.qrPassCode}</div>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Present at venue gate for instant laser scan admission</p>
      </div>

      <div style="margin-bottom: 16px; text-align: center;">
        <span class="status-badge ${
          ticket.registrationStatus === 'Completed'
            ? 'status-completed'
            : ticket.registrationStatus === 'Checking In'
            ? 'status-checking'
            : 'status-upcoming'
        }">
          ● ${ticket.registrationStatus || (ticket.isPastEvent ? 'Completed' : 'Upcoming')}
        </span>
      </div>

      <div class="grid">
        <div class="cell">
          <div class="label">Date & Time</div>
          <div class="value">${ticket.eventDate} • ${ticket.eventTime}</div>
        </div>
        <div class="cell">
          <div class="label">Ticket Tier</div>
          <div class="value">${ticket.ticketTierName || 'General Pass'} (${ticket.ticketQuantity}x)</div>
        </div>
        <div class="cell">
          <div class="label">Attendee Name</div>
          <div class="value">${ticket.childName || ticket.buyerName}</div>
        </div>
        <div class="cell">
          <div class="label">Amount Paid</div>
          <div class="value">${ticket.totalPaid === 0 ? 'FREE ADMISSION' : `₹${ticket.totalPaid}`}</div>
        </div>
        <div class="cell" style="grid-column: span 2;">
          <div class="label">Venue Location</div>
          <div class="value">${ticket.eventLocation}</div>
          ${ticket.venueAddress ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${ticket.venueAddress}</div>` : ''}
        </div>
      </div>

      ${ticket.notes ? `<div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 14px; border-radius: 10px; font-size: 11px; color: #92400e;"><strong>Attendee Note:</strong> ${ticket.notes}</div>` : ''}
    </div>
    <div class="footer">
      <p>Vernunt Verified Digital Pass • Valid for single event admission • Support: support@vernunt.com</p>
      <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer;">Print / Save PDF</button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Vernunt-Pass-${ticket.bookingReference || 'Ticket'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

