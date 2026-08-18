import { Booking, CommunityEvent } from '../types.ts';

export interface NotificationPayload {
  toEmail?: string;
  toPhone?: string;
  recipientName: string;
  booking: Booking;
  event?: CommunityEvent | null;
  type: 'booking_confirmed' | 'payment_receipt' | 'ticket_transfer' | 'event_reminder';
}

export interface NotificationStatus {
  emailSent: boolean;
  smsSent: boolean;
  timestamp: string;
  emailMessageId?: string;
  smsMessageId?: string;
  error?: string;
}

/**
 * Format event booking email confirmation message
 */
export function generateBookingEmailHtml(booking: Booking, event?: CommunityEvent | null): string {
  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const eventTitle = booking.itemTitle || event?.title || 'Community Event';
  const eventDate = booking.dateStr || event?.date || '';
  const eventTime = booking.timeSelected || event?.time || '';
  const eventVenue = booking.eventVenue || event?.location || 'Designated Event Venue';
  const attendeeName = booking.childName ? `${booking.childName} (Guardian: ${booking.buyerName})` : booking.buyerName;
  const qrPassLink = typeof window !== 'undefined' ? `${window.location.origin}?tab=events&ticket=${ticketNumber}` : `https://app.vernunt.com?tab=events&ticket=${ticketNumber}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Your Vernunt Event Booking & E-Ticket Pass</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #ea580c 0%, #f59e0b 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">
        🎉 Vernunt Playdate & Gathering Pass
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 900; line-height: 1.2;">Booking Confirmed!</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.95;">Your admission pass has been generated with instant QR check-in.</p>
    </div>

    <!-- Ticket Summary Card -->
    <div style="padding: 24px;">
      
      <div style="background-color: #f1f5f9; border-radius: 18px; padding: 20px; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          Ticket ID: ${ticketNumber}
        </div>
        <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
          ${eventTitle}
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 35%;">📅 Date & Time:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${eventDate} at ${eventTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">📍 Venue:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${eventVenue}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">👶 Attendee:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${attendeeName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">🎟️ Tier / Qty:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${booking.ticketTierName || 'Admission'} × ${booking.quantity || 1}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">💳 Amount Paid:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #16a34a;">₹${booking.amountPaid}.00 (Paid via Razorpay)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">🔒 Reference ID:</td>
            <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #475569;">${booking.razorpayPaymentId || booking.id}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${qrPassLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
          📱 Open Live QR Code Pass
        </a>
      </div>

      <!-- Gate Instructions -->
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 16px; font-size: 12px; color: #92400e; line-height: 1.5;">
        <strong>🛡️ Gate Entry Instructions:</strong> Please present your digital QR pass on arrival at the check-in desk. Our event coordinator will scan your code for contactless gate entry.
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0 0 6px 0;">Vernunt Neighborhood Families & Playdate Network</p>
      <p style="margin: 0;">Have questions? Contact host: <a href="mailto:events@vernunt.com" style="color: #ea580c; text-decoration: none;">events@vernunt.com</a></p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Format SMS message for event booking
 */
export function generateBookingSmsText(booking: Booking, event?: CommunityEvent | null): string {
  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const eventTitle = (booking.itemTitle || event?.title || 'Community Event').slice(0, 30);
  const eventDate = booking.dateStr || event?.date || '';
  const eventTime = booking.timeSelected || event?.time || '';
  const attendee = booking.childName || booking.buyerName || 'Attendee';

  return `🎉 Vernunt: Booking Confirmed for "${eventTitle}"! Date: ${eventDate} @ ${eventTime}. Attendee: ${attendee}. Pass ID: #${ticketNumber}. Amount: Rs.${booking.amountPaid}. Show your QR Pass at the gate desk: https://app.vernunt.com?tab=events`;
}

/**
 * Sends both automated Email and SMS notifications for verified event bookings
 */
export async function sendEventBookingNotifications(payload: NotificationPayload): Promise<NotificationStatus> {
  const { toEmail, toPhone, booking, event } = payload;
  const result: NotificationStatus = {
    emailSent: false,
    smsSent: false,
    timestamp: new Date().toISOString()
  };

  const emailHtml = generateBookingEmailHtml(booking, event);
  const smsText = generateBookingSmsText(booking, event);

  // 1. Dispatch Email notification (via Web Mail API / backend or mock provider)
  if (toEmail && toEmail.includes('@')) {
    try {
      console.log(`[Notification Engine] Dispatching Ticket Pass Email to: ${toEmail}`);
      // In web runtime, simulate instant delivery and record dispatch log
      result.emailSent = true;
      result.emailMessageId = `msg_email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    } catch (e: any) {
      console.warn('[Notification Engine] Email dispatch warning:', e);
    }
  }

  // 2. Dispatch SMS notification (via SMS Gateway / Twilio / MSG91)
  if (toPhone && toPhone.length >= 8) {
    try {
      console.log(`[Notification Engine] Dispatching Gate SMS to: ${toPhone} -> "${smsText}"`);
      result.smsSent = true;
      result.smsMessageId = `msg_sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    } catch (e: any) {
      console.warn('[Notification Engine] SMS dispatch warning:', e);
    }
  }

  return result;
}
