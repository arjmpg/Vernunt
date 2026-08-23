import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking, CommunityEvent } from '../types.ts';

export interface TicketPdfOptions {
  booking: Booking;
  event?: CommunityEvent | null;
  qrCodeDataUrl?: string;
}

/**
 * Generates a high-resolution, vector-accurate jsPDF document for the Vernunt Event Ticket Pass
 */
export async function generateTicketPdfDoc({ booking, event, qrCodeDataUrl }: TicketPdfOptions): Promise<jsPDF> {
  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const eventTitle = booking.itemTitle || event?.title || 'Vernunt Community Event';
  const eventDate = booking.dateStr || event?.date || 'Scheduled Date';
  const eventTime = booking.timeSelected || event?.time || 'All Day';
  const eventVenue = booking.eventVenue || event?.location || 'Designated Event Venue, Bangalore';
  const hostName = event?.hostName || 'Vernunt Verified Organizer';
  const parentName = booking.buyerName || 'Valued Parent';
  const childName = booking.childName ? `${booking.childName}${booking.childAge ? ` (${booking.childAge} yrs)` : ''}` : 'General Attendee';
  const tierName = booking.ticketTierName || 'Standard Admission';
  const isFree = !booking.amountPaid || booking.amountPaid === 0;
  const amountStr = isFree ? 'FREE (Complimentary Entry)' : `₹${booking.amountPaid || 0}.00 (Paid via Razorpay Secure)`;
  const paymentRef = isFree ? 'COMMUNITY_VERIFIED' : (booking.razorpayPaymentId || booking.id);

  // Ensure high-res QR code
  let finalQr = qrCodeDataUrl;
  if (!finalQr) {
    const qrPayload = booking.qrPayload || JSON.stringify({
      type: 'VERNUNT_EVENT_PASS',
      ticketNumber,
      bookingId: booking.id,
      eventId: booking.itemId,
      buyerName: parentName,
      childName: booking.childName || '',
      tier: tierName,
      date: eventDate,
      time: eventTime,
      amountPaid: booking.amountPaid,
      issuedAt: booking.createdAt || new Date().toISOString()
    });

    try {
      finalQr = await QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });
    } catch (e) {
      console.warn('QR code generation warning:', e);
    }
  }

  // Create A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Background canvas tint
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 297, 'F');

  // Main White Ticket Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 14, contentWidth, 268, 6, 6, 'FD');

  // Top Header Banner (Amber/Orange Gradient representation)
  doc.setFillColor(234, 88, 12); // #ea580c (Orange-600)
  doc.roundedRect(margin, 14, contentWidth, 34, 6, 6, 'F');
  doc.rect(margin, 40, contentWidth, 8, 'F'); // Square bottom corners of banner

  // Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VERNUNT KIDS & NEIGHBORHOOD NETWORK', margin + 8, 24);

  doc.setFontSize(16);
  doc.text('OFFICIAL ADMISSION E-TICKET PASS', margin + 8, 33);

  // Status Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, 20, 44, 16, 3, 3, 'F');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIED PASS', pageWidth - margin - 44, 27);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.checkedIn ? 'CHECKED IN' : 'ACTIVE', pageWidth - margin - 42, 33);

  // Ticket ID Ribbon
  let currentY = 54;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 6, currentY, contentWidth - 12, 12, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TICKET PASS ID:', margin + 12, currentY + 7.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('courier', 'bold');
  doc.text(ticketNumber, margin + 44, currentY + 8);

  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(isFree ? '✓ Free Admission Pass' : '✓ Razorpay Confirmed', pageWidth - margin - 48, currentY + 7.5);

  // Event Title Section
  currentY += 18;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  // Wrap event title if long
  const splitTitle = doc.splitTextToSize(eventTitle, contentWidth - 16);
  doc.text(splitTitle, margin + 8, currentY);
  currentY += splitTitle.length * 6;

  // Host info
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Organized & Hosted by: ${hostName}`, margin + 8, currentY);
  currentY += 8;

  // Thin Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 8, currentY, pageWidth - margin - 8, currentY);
  currentY += 8;

  // 2-Column Schedule & Venue Grid
  const col1X = margin + 8;
  const col2X = margin + (contentWidth / 2) + 2;
  const colWidth = (contentWidth / 2) - 10;

  // Box 1: Schedule
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col1X, currentY, colWidth, 24, 3, 3, 'F');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE & TIME', col1X + 4, currentY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(eventDate, col1X + 4, currentY + 13);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Time: ${eventTime}`, col1X + 4, currentY + 19);

  // Box 2: Venue
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, currentY, colWidth, 24, 3, 3, 'F');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VENUE / LOCATION', col2X + 4, currentY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  const splitVenue = doc.splitTextToSize(eventVenue, colWidth - 8);
  doc.text(splitVenue, col2X + 4, currentY + 13);

  currentY += 30;

  // Attendee & Billing Details Grid
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 8, currentY, contentWidth - 16, 42, 3, 3, 'F');

  // Row 1: Attendee & Parent
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDING CHILD:', margin + 12, currentY + 7);
  doc.text('PARENT / GUARDIAN:', margin + (contentWidth / 2), currentY + 7);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(childName, margin + 12, currentY + 13);
  doc.text(parentName, margin + (contentWidth / 2), currentY + 13);

  // Row 2: Tier & Amount Paid
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ADMISSION TIER:', margin + 12, currentY + 22);
  doc.text('TOTAL AMOUNT PAID:', margin + (contentWidth / 2), currentY + 22);

  doc.setFontSize(9.5);
  doc.setTextColor(234, 88, 12);
  doc.text(tierName, margin + 12, currentY + 28);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(amountStr, margin + (contentWidth / 2), currentY + 28);

  // Row 3: Reference & Contact
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(isFree ? `Pass Ref: ${ticketNumber}` : `Payment Ref: ${paymentRef}`, margin + 12, currentY + 36);
  if (booking.buyerEmail || booking.buyerPhone) {
    doc.text(`Contact: ${booking.buyerEmail || booking.buyerPhone}`, margin + (contentWidth / 2), currentY + 36);
  }

  currentY += 48;

  // QR Code & Gate Scanner Card
  const qrCardHeight = 64;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 8, currentY, contentWidth - 16, qrCardHeight, 3, 3, 'FD');

  if (finalQr) {
    try {
      doc.addImage(finalQr, 'PNG', margin + 14, currentY + 6, 52, 52);
    } catch (e) {
      console.warn('Failed to add QR image to PDF:', e);
    }
  }

  // QR Instructions column
  const qrTextX = margin + 72;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOUCHLESS GATE CHECK-IN QR', qrTextX, currentY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Present this QR code to the gate coordinator upon', qrTextX, currentY + 19);
  doc.text('arrival at the venue for instant touchless verification.', qrTextX, currentY + 24);

  // Security Gate PIN
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(qrTextX, currentY + 30, contentWidth - 84, 16, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GATE ENTRY PASSCODE:', qrTextX + 4, currentY + 36);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(ticketNumber.replace('VERN-EVT-', 'GATE-PIN: '), qrTextX + 4, currentY + 42);

  currentY += qrCardHeight + 8;

  // Gate Entry Terms & Safety Notice
  doc.setFillColor(255, 251, 235); // Amber-50
  doc.setDrawColor(254, 243, 199);
  doc.roundedRect(margin + 8, currentY, contentWidth - 16, 18, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('🛡️ CHILD SAFETY & VENUE PROTOCOLS:', margin + 12, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text('• Accompanying adults must remain on-site during playdates and children classes.', margin + 12, currentY + 10.5);
  doc.text('• Digital or printed pass is valid for 1 registered attendee only. Transferable via Vernunt portal.', margin + 12, currentY + 14.5);

  // Footer Branding
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Vernunt Verified Community Playdate & Development Network • https://app.vernunt.com', pageWidth / 2, 276, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Support: support@vernunt.com`, pageWidth / 2, 280, { align: 'center' });

  return doc;
}

/**
 * Directly downloads the PDF ticket file to user's device
 */
export async function downloadTicketPdf(options: TicketPdfOptions): Promise<void> {
  const doc = await generateTicketPdfDoc(options);
  const ticketNumber = options.booking.ticketNumber || `VERN-EVT-${options.booking.id.slice(-6).toUpperCase()}`;
  const safeFilename = `Vernunt-Ticket-${ticketNumber}.pdf`;
  doc.save(safeFilename);
}

/**
 * Returns a Blob of the generated PDF document
 */
export async function getTicketPdfBlob(options: TicketPdfOptions): Promise<Blob> {
  const doc = await generateTicketPdfDoc(options);
  return doc.output('blob');
}

/**
 * High-reliability print function that works inside iframes, sandboxes, mobile, and webviews
 */
export async function printTicketPass({ booking, event, qrCodeDataUrl }: TicketPdfOptions): Promise<void> {
  const ticketNumber = booking.ticketNumber || `VERN-EVT-${booking.id.slice(-6).toUpperCase()}`;
  const eventTitle = booking.itemTitle || event?.title || 'Vernunt Community Event';
  const eventDate = booking.dateStr || event?.date || 'Scheduled Date';
  const eventTime = booking.timeSelected || event?.time || 'All Day';
  const eventVenue = booking.eventVenue || event?.location || 'Designated Event Venue';
  const hostName = event?.hostName || 'Vernunt Verified Organizer';
  const parentName = booking.buyerName || 'Valued Parent';
  const childName = booking.childName ? `${booking.childName}${booking.childAge ? ` (${booking.childAge} yrs)` : ''}` : 'General Attendee';
  const tierName = booking.ticketTierName || 'Standard Admission';
  const isFree = !booking.amountPaid || booking.amountPaid === 0;
  const amountStr = isFree ? 'FREE (Complimentary Entry)' : `₹${booking.amountPaid || 0}.00 (Paid via Razorpay Secure)`;

  // Generate QR if needed
  let finalQr = qrCodeDataUrl;
  if (!finalQr) {
    try {
      finalQr = await QRCode.toDataURL(booking.qrPayload || ticketNumber, {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    } catch (e) {
      console.warn('QR error:', e);
    }
  }

  // Create dedicated printable HTML document
  const printableHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print E-Ticket - ${ticketNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background: #f8fafc;
      color: #0f172a;
    }
    .ticket-card {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #ea580c 0%, #f59e0b 100%);
      color: white;
      padding: 24px;
      position: relative;
    }
    .header-tag {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .header-title {
      font-size: 22px;
      font-weight: 900;
      margin: 4px 0 0 0;
    }
    .badge {
      position: absolute;
      top: 24px;
      right: 24px;
      background: white;
      color: #ea580c;
      font-weight: 800;
      font-size: 11px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .content {
      padding: 24px;
    }
    .ticket-id-bar {
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-family: monospace;
      font-weight: bold;
      font-size: 13px;
    }
    .event-title {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .host-info {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      font-size: 12px;
    }
    .box-label {
      font-size: 10px;
      font-weight: bold;
      color: #ea580c;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .box-value {
      font-weight: 700;
      color: #0f172a;
    }
    .qr-section {
      text-align: center;
      background: white;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 20px;
      margin-top: 16px;
    }
    .qr-img {
      width: 180px;
      height: 180px;
      margin: 0 auto;
      display: block;
    }
    .instructions {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
      font-size: 11px;
      border-radius: 12px;
      padding: 12px;
      margin-top: 16px;
      line-height: 1.4;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      padding: 16px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div class="header-tag">Vernunt Verified Admission</div>
      <div class="header-title">Official E-Ticket Pass</div>
      <div class="badge">Active & Confirmed</div>
    </div>
    <div class="content">
      <div class="ticket-id-bar">
        <span>TICKET ID: ${ticketNumber}</span>
        <span style="color: #16a34a;">${isFree ? '✓ Free Admission Pass' : '✓ Razorpay Paid'}</span>
      </div>

      <div class="event-title">${eventTitle}</div>
      <div class="host-info">Hosted by ${hostName}</div>

      <div class="grid">
        <div class="box">
          <div class="box-label">📅 Date & Time</div>
          <div class="box-value">${eventDate}</div>
          <div style="color: #64748b; font-size: 11px;">${eventTime}</div>
        </div>
        <div class="box">
          <div class="box-label">📍 Venue Location</div>
          <div class="box-value">${eventVenue}</div>
        </div>
      </div>

      <div class="grid">
        <div class="box">
          <div class="box-label">👶 Attendee Child</div>
          <div class="box-value">${childName}</div>
          <div style="color: #64748b; font-size: 11px;">Parent: ${parentName}</div>
        </div>
        <div class="box">
          <div class="box-label">🎟️ Admission Tier</div>
          <div class="box-value" style="color: #ea580c;">${tierName}</div>
          <div style="color: #16a34a; font-weight: bold; font-size: 11px;">${amountStr}</div>
        </div>
      </div>

      <div class="qr-section">
        <img src="${finalQr}" class="qr-img" alt="QR Gate Pass" />
        <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 8px;">
          Scan for Instant Touchless Entry
        </div>
        <div style="font-family: monospace; font-size: 11px; color: #64748b; margin-top: 2px;">
          ${ticketNumber}
        </div>
      </div>

      <div class="instructions">
        <strong>🛡️ Gate Verification Notice:</strong> Please display this printed pass or phone QR code at the reception desk. Child safety protocols apply.
      </div>
    </div>

    <div class="footer">
      Vernunt Verified Neighborhood Playdate Network • https://app.vernunt.com
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  // Try opening printable popup window
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
  } else {
    // Fallback if popup blocked: create hidden iframe in current window and trigger print
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printableHtml);
      doc.close();
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print fallback note:', e);
          // If all printing fails, automatically trigger PDF download!
          downloadTicketPdf({ booking, event, qrCodeDataUrl: finalQr });
        } finally {
          setTimeout(() => document.body.removeChild(printIframe), 2000);
        }
      }, 500);
    } else {
      // Auto download PDF
      downloadTicketPdf({ booking, event, qrCodeDataUrl: finalQr });
    }
  }
}
