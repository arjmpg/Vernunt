import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface EventTicketPdfInput {
  passId: string;
  eventTitle: string;
  eventCategory?: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  hostName?: string;
  attendeeName: string;
  childName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  ticketTierName?: string;
  quantity?: number;
  amountPaid?: number;
  paymentId?: string;
  bookingId?: string;
  eventId?: string;
  ticketViewUrl: string;
}

export interface GeneratedEventTicketPdf {
  pdfBuffer: Buffer;
  pdfBase64: string;
  pdfFilename: string;
  qrPngBuffer: Buffer;
  qrDataUrl: string;
  qrPayload: string;
}

function sanitizeFilenameSegment(input: string): string {
  return String(input || 'PASS')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32) || 'PASS';
}

function safeAscii(input: string): string {
  return String(input || '')
    .replace(/₹/g, 'INR ')
    .replace(/[•·]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a scannable QR code PNG and a print-ready Vernunt Event Admission Pass PDF
 * with complete event details + embedded QR code for email attachment.
 */
export async function generateEventTicketPdfAndQr(
  input: EventTicketPdfInput
): Promise<GeneratedEventTicketPdf> {
  const passId = String(input.passId || `VERN-EVT-${Date.now().toString().slice(-6)}`);
  const eventTitle = String(input.eventTitle || 'Vernunt Community Event');
  const eventCategory = String(input.eventCategory || 'Kids & Family Event');
  const eventDate = String(input.eventDate || 'Scheduled Date');
  const eventTime = String(input.eventTime || 'Scheduled Time');
  const eventVenue = String(input.eventVenue || 'Event Venue');
  const hostName = String(input.hostName || 'Verified Vernunt Host');
  const attendeeName = String(input.attendeeName || 'Verified Parent');
  const childName = input.childName ? String(input.childName) : '';
  const tierName = String(input.ticketTierName || 'General Admission');
  const quantity = Math.max(1, Number(input.quantity || 1));
  const amountPaid = Math.max(0, Number(input.amountPaid || 0));
  const isFree = amountPaid === 0;
  const paymentRef = String(input.paymentId || input.bookingId || passId);
  const ticketViewUrl = String(input.ticketViewUrl || `https://app.vernunt.com/?tab=events&ticket=${encodeURIComponent(passId)}`);

  // Structured payload readable by Vernunt Gate Scanner & standard QR readers
  const qrPayload = JSON.stringify({
    app: 'VERNUNT',
    passId,
    bookingId: input.bookingId || passId,
    eventId: input.eventId || '',
    event: eventTitle.slice(0, 80),
    date: eventDate,
    attendee: attendeeName.slice(0, 60),
    qty: quantity,
    url: ticketViewUrl
  });

  const qrOptions = {
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const,
    width: 340,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  };

  const [qrDataUrl, qrPngBuffer] = await Promise.all([
    QRCode.toDataURL(qrPayload, qrOptions),
    QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 340,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
  ]);

  // Build A4 portrait PDF pass using jsPDF (dimensions in mm: 210 x 297)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const marginX = 16;
  const cardWidth = pageWidth - marginX * 2;

  // Background tint
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, 'F');

  // Outer ticket container card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.roundedRect(marginX, 14, cardWidth, 252, 6, 6, 'FD');

  // Branded Top Header Banner
  doc.setFillColor(190, 18, 60); // Vernunt Crimson/Rose (#be123c)
  doc.roundedRect(marginX, 14, cardWidth, 38, 6, 6, 'F');
  doc.rect(marginX, 42, cardWidth, 10, 'F'); // flatten bottom corners of banner

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('VERNUNT', marginX + 10, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('OFFICIAL EVENT ADMISSION PASS & GATE QR TICKET', marginX + 10, 35);

  doc.setFontSize(8.5);
  doc.text(`Category: ${safeAscii(eventCategory)}`, marginX + 10, 44);

  // Confirmed Pass ID Pill on Top Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - marginX - 66, 21, 56, 22, 3, 3, 'F');
  doc.setTextColor(190, 18, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONFIRMED PASS ID', pageWidth - marginX - 38, 28, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(safeAscii(passId).slice(0, 22), pageWidth - marginX - 38, 37, { align: 'center' });

  // Event Title Section
  let cursorY = 64;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const wrappedTitle = doc.splitTextToSize(safeAscii(eventTitle), cardWidth - 20);
  doc.text(wrappedTitle.slice(0, 3), marginX + 10, cursorY);
  cursorY += wrappedTitle.slice(0, 3).length * 7 + 2;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Hosted by: ${safeAscii(hostName)}`, marginX + 10, cursorY);
  cursorY += 7;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX + 10, cursorY, pageWidth - marginX - 10, cursorY);
  cursorY += 8;

  // Two-Column Body: Event Details (Left) + Scannable QR Code Frame (Right)
  const leftColX = marginX + 10;
  const leftColWidth = 96;
  const qrBoxX = marginX + cardWidth - 68;
  const qrBoxY = cursorY;
  const qrBoxW = 58;
  const qrBoxH = 74;

  // QR Code Box (Right Column)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(190, 18, 60);
  doc.setLineWidth(0.6);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 4, 4, 'FD');

  doc.addImage(qrDataUrl, 'PNG', qrBoxX + 5, qrBoxY + 5, 48, 48);

  doc.setTextColor(190, 18, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCAN AT GATE DESK', qrBoxX + qrBoxW / 2, qrBoxY + 59, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(safeAscii(passId).slice(0, 24), qrBoxX + qrBoxW / 2, qrBoxY + 65, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Instant Contactless Check-In', qrBoxX + qrBoxW / 2, qrBoxY + 70, { align: 'center' });

  // Details Rows (Left Column)
  const addDetailRow = (label: string, value: string) => {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), leftColX, cursorY + 4);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(safeAscii(value), leftColWidth);
    doc.text(lines.slice(0, 2), leftColX, cursorY + 9.5);
    cursorY += 9.5 + lines.slice(0, 2).length * 4.8 + 2.5;
  };

  addDetailRow('Date & Time', `${eventDate}  |  ${eventTime}`);
  addDetailRow('Venue / Location', eventVenue);
  addDetailRow('Attendee', childName && childName !== attendeeName ? `${childName} (Parent: ${attendeeName})` : attendeeName);
  addDetailRow('Ticket Tier & Quantity', `${tierName}  (Qty: ${quantity})`);

  // Move below whichever column is taller
  cursorY = Math.max(cursorY + 4, qrBoxY + qrBoxH + 10);

  // Payment & Contact Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX + 10, cursorY, cardWidth - 20, 38, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('BOOKING & PAYMENT SUMMARY', marginX + 15, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const amountLabel = isFree ? 'FREE (Complimentary Verified Pass)' : `INR ${amountPaid.toLocaleString('en-IN')}.00 (PAID & VERIFIED)`;
  doc.text(`Admission Fee:  ${amountLabel}`, marginX + 15, cursorY + 16);
  doc.text(`Booking / Payment Ref:  ${safeAscii(paymentRef)}`, marginX + 15, cursorY + 23);
  doc.text(
    `Registered Contact:  ${safeAscii(input.buyerEmail || 'Verified Account')}${input.buyerPhone ? `  |  ${safeAscii(input.buyerPhone)}` : ''}`,
    marginX + 15,
    cursorY + 30
  );

  cursorY += 46;

  // Gate Entry Instructions Box
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(marginX + 10, cursorY, cardWidth - 20, 30, 3, 3, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GATE ENTRY & SAFETY INSTRUCTIONS', marginX + 15, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const notes = [
    '1. Present this PDF ticket (on phone or printed) at the Vernunt Gate Desk for instant QR scan.',
    '2. Please arrive 10-15 minutes prior to the scheduled start time for smooth child check-in.',
    '3. Keep your Pass ID private; each QR ticket is validated uniquely at entry.'
  ];
  notes.forEach((line, idx) => {
    doc.text(line, marginX + 15, cursorY + 15 + idx * 5);
  });

  // Footer Bar
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX + 10, 250, pageWidth - marginX - 10, 250);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    `Issued by Vernunt Ventures Pvt. Ltd.  |  Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    marginX + 10,
    256
  );
  doc.setTextColor(190, 18, 60);
  doc.text(`Live Pass URL: ${safeAscii(ticketViewUrl).slice(0, 95)}`, marginX + 10, 261);

  const arrayBuffer = doc.output('arraybuffer');
  const pdfBuffer = Buffer.from(arrayBuffer);
  const pdfFilename = `Vernunt-Event-Ticket-${sanitizeFilenameSegment(passId)}.pdf`;

  return {
    pdfBuffer,
    pdfBase64: pdfBuffer.toString('base64'),
    pdfFilename,
    qrPngBuffer,
    qrDataUrl,
    qrPayload
  };
}
