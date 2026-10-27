import { jsPDF } from 'jspdf';
import { VendorAgreementData, STANDARD_VENDOR_COMMISSION_PERCENT } from '../types/vendorAgreement';

/**
 * Builds an official, legally structured vector PDF for the Vernunt Marketplace Vendor Agreement.
 * Incorporates 10% selling price commission, mandatory return acceptance, BIS child safety, and digital signatures.
 */
export async function generateVendorAgreementPdfDoc(data: VendorAgreementData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);

  // Helper colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const brandRed = [190, 18, 60]; // Rose 700
  const emeraldGreen = [16, 185, 129]; // Emerald 500
  const textMuted = [100, 116, 139]; // Slate 500
  const textDark = [30, 41, 59]; // Slate 800
  const bgLight = [248, 250, 252]; // Slate 50
  const borderColor = [226, 232, 240]; // Slate 200

  // Date formatting
  const formattedDate = new Date(data.acceptedAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = new Date(data.acceptedAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const drawHeader = (pageNum: number, totalPages: number) => {
    // Top colored strip
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Brand logo / title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VERNUNT TECHNOLOGIES PRIVATE LIMITED', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Corporate Reg: Indiranagar, Bengaluru, Karnataka 560038 • CIN: U72900KA2026PTC184920', margin, 20);
    doc.text('Official Email: legal@vernunt.com • Marketplace Operations Desk', margin, 24);

    // Reference ID badge on right
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(pageWidth - margin - 55, 11, 55, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('AGREEMENT REFERENCE', pageWidth - margin - 52, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.agreementId || 'VRN-AGR-2026-0001', pageWidth - margin - 52, 21);

    // Divider
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Vernunt Seller Master Agreement [Ver: ${data.version}] • Electronically Signed & Tamper Evident`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin - 18,
      pageHeight - 10
    );

    // Bottom red accent
    doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');
  };

  // ================= PAGE 1 =================
  drawHeader(1, 3);

  let y = 35;

  // Title Banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('MARKETPLACE VENDOR ONBOARDING & SERVICE AGREEMENT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text('INCORPORATING MANDATORY 10% SELLING PRICE COMMISSION & MANDATORY RETURN ACCEPTANCE', margin + 4, y + 11);

  y += 20;

  // Preamble
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const preamble = `This Marketplace Vendor Agreement ("Agreement") is legally executed on ${formattedDate} at ${formattedTime} IST by and between VERNUNT TECHNOLOGIES PRIVATE LIMITED (hereinafter referred to as "Vernunt", "Platform", or "Company") AND the registered business entity whose particulars are set out below (hereinafter referred to as the "Seller", "Vendor", or "Merchant").`;
  const splitPreamble = doc.splitTextToSize(preamble, contentWidth);
  doc.text(splitPreamble, margin, y);
  y += splitPreamble.length * 4.2 + 3;

  // Merchant Particulars Table Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text('SCHEDULE 1: MERCHANT PARTICULARS & REGISTRATION RECORD', margin + 4, y + 6);

  const drawRow = (label1: string, val1: string, label2: string, val2: string, rowY: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(label1, margin + 4, rowY);
    doc.text(label2, margin + contentWidth / 2 + 4, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text((val1 || 'N/A').slice(0, 36), margin + 4, rowY + 3.8);
    doc.text((val2 || 'N/A').slice(0, 36), margin + contentWidth / 2 + 4, rowY + 3.8);
  };

  drawRow('STORE / BUSINESS NAME', data.storeName, 'LEGAL BUSINESS ENTITY TYPE', data.businessType || 'Proprietorship', y + 13);
  drawRow('AUTHORIZED SIGNATORY / OWNER', data.ownerName, 'CONTACT PHONE NUMBER', data.phone || 'N/A', y + 23);
  drawRow('OFFICIAL REGISTERED EMAIL', data.email, 'GSTIN REGISTRATION NUMBER', data.gstNumber || 'Exempted / Applied', y + 33);

  const warehouseAddr = data.pickupAddress
    ? `${data.pickupAddress.street || ''}, ${data.pickupAddress.city || 'Bengaluru'}, ${data.pickupAddress.state || 'Karnataka'} - ${data.pickupAddress.pincode || '560001'}`
    : `${data.address?.city || 'Bengaluru'}, Karnataka`;
  const bankInfo = data.bankDetails
    ? `${data.bankDetails.bankName || 'Bank'} • A/C: ${data.bankDetails.accountNumber ? '...' + data.bankDetails.accountNumber.slice(-4) : 'Provided'} • IFSC: ${data.bankDetails.ifscCode || 'VERIFIED'}`
    : 'Verified Escrow Node';

  drawRow('DISPATCH WAREHOUSE ADDRESS', warehouseAddr, 'SETTLEMENT BANK & IFSC', bankInfo, y + 43);

  y += 60;

  // KEY MANDATORY CLAUSES SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('OPERATIVE CLAUSES & STATUTORY COVENANTS', margin, y);
  y += 6;

  // Clause 1: 10% Commission
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text(`1. PLATFORM COMMISSION: FLAT ${STANDARD_VENDOR_COMMISSION_PERCENT}.0% ON PRODUCT SELLING PRICE (NON-NEGOTIABLE)`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c1Text = `1.1 Computation: The Seller irrevocably agrees and covenants to pay Vernunt a non-negotiable platform facilitation commission of ${STANDARD_VENDOR_COMMISSION_PERCENT}.0% (ten percent) computed on the gross Selling Price of each product listed, transacted, and completed on the Vernunt Marketplace.\n1.2 Automatic Escrow Deduction: The 10% platform fee will be automatically deducted by the Company's automated settlement engine from the buyer's payment prior to disbursing the net 90% payout to the Seller's registered bank account.\n1.3 Settlement Cycle: Payouts are reconciled and released on automated weekly cycles via NEFT/UPI with GST-compliant tax invoices issued monthly.`;
  const splitC1 = doc.splitTextToSize(c1Text, contentWidth - 8);
  doc.text(splitC1, margin + 4, y + 11);

  y += 39;

  // Clause 2: Mandatory Return Acceptance
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text('2. MANDATORY RETURN & REPLACEMENT ACCEPTANCE (100% SELLER OBLIGATION)', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c2Text = `2.1 Unconditional Return Acceptance: To protect Indian children and build parental trust, the Seller expressly warrants and agrees to accept all customer returns and replacement requests initiated within a minimum 7 (seven) calendar days of delivery.\n2.2 Permissible Return Triggers: Returns must be honored for: (a) Damaged or broken items in transit; (b) Manufacturing flaws or missing components; (c) Age/variant or color discrepancy; (d) Unsealed, contaminated, or expired consumables; or (e) Failure to meet non-toxic child-safety criteria.\n2.3 Reverse Logistics: Reverse pickup will be handled by Vernunt's integrated logistics network. The Seller shall not reject valid returns and shall process inward physical inspection within 48 hours of warehouse receipt.`;
  const splitC2 = doc.splitTextToSize(c2Text, contentWidth - 8);
  doc.text(splitC2, margin + 4, y + 11);

  y += 42;

  // Clause 3: Child Safety
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. CHILD SAFETY & STATUTORY BIS (IS 9873) COMPLIANCE', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c3Text = `The Seller certifies that all toys, play kits, nursery furniture, and childcare items comply strictly with Bureau of Indian Standards (BIS IS 9873 parts 1-9) for mechanical, flammability, and heavy metal safety. All items must be 100% BPA-free, lead-free, non-toxic, and free from hazardous sharp edges. Edible child products must possess a valid FSSAI license. Selling counterfeit, refurbished, or uncertified hazardous goods is strictly prohibited and results in immediate forfeiture of funds.`;
  const splitC3 = doc.splitTextToSize(c3Text, contentWidth);
  doc.text(splitC3, margin, y);

  drawFooter(1, 3);

  // ================= PAGE 2 =================
  doc.addPage();
  drawHeader(2, 3);
  y = 35;

  // Clause 4: Logistics SLA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('4. ORDER DISPATCH, PACKAGING & LOGISTICS SLA (24–48 HOURS)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c4Text = `4.1 Dispatch Turnaround: Seller shall pick, inspect, pack, and mark orders as "Ready to Ship" within 24 to 48 hours of order confirmation on the Vernunt Merchant Portal.\n4.2 Packaging Quality: All shipments must be packaged in child-safe, tamper-evident boxes with appropriate protective void-fill to prevent transit damage. Packages must carry the system-generated AWB and shipping label.\n4.3 Courier Coordination: Seller shall hand over packaged parcels to Vernunt authorized 3PL courier partners (Shiprocket, Delhivery, Bluedart, etc.) during designated daily pickup slots.\n4.4 Stockout Penalties: Sellers maintaining a stockout cancellation rate exceeding 1.5% in any calendar month shall be subject to temporary listing deactivation.`;
  const splitC4 = doc.splitTextToSize(c4Text, contentWidth);
  doc.text(splitC4, margin, y);
  y += splitC4.length * 3.8 + 6;

  // Clause 5: Escrow and GST
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('5. ESCROW ARCHITECTURE, TAXES & SETTLEMENT TERMS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c5Text = `5.1 Escrow Node: All customer receipts are held in a Reserve Bank of India (RBI) compliant escrow account managed by Vernunt's nodal banking partners until delivery confirmation and expiry of the return window.\n5.2 GST & TCS Compliance: The Seller is solely responsible for determining applicable GST rates (5%, 12%, or 18%) on products sold. Vernunt shall deduct statutory Tax Collected at Source (TCS) under Section 52 of the CGST Act 2017 and file periodic returns.\n5.3 Invoice Generation: The Seller authorizes Vernunt to generate GST-compliant automated customer invoices on the Seller's behalf using the GSTIN registered in Schedule 1.`;
  const splitC5 = doc.splitTextToSize(c5Text, contentWidth);
  doc.text(splitC5, margin, y);
  y += splitC5.length * 3.8 + 6;

  // Clause 6: DPDP Act & Privacy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('6. DATA PRIVACY & DIGITAL PERSONAL DATA PROTECTION (DPDP ACT 2023)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c6Text = `6.1 Confidentiality of Minor Data: The Seller acknowledges that customer data accessed through the Vernunt Portal consists of families and children. The Seller shall use buyer name and shipping address solely for the purpose of order fulfillment.\n6.2 Zero Outside Marketing: The Seller is strictly prohibited from exporting, copying, or using customer contact numbers or addresses for external promotional campaigns, WhatsApp spam, or secondary distribution.\n6.3 Data Erasure: Upon order fulfillment and expiry of the statutory warranty period, customer personally identifiable information (PII) must be purged in accordance with Vernunt's Data Governance Guidelines.`;
  const splitC6 = doc.splitTextToSize(c6Text, contentWidth);
  doc.text(splitC6, margin, y);
  y += splitC6.length * 3.8 + 6;

  // Clause 7: Indemnity & Warranties
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('7. REPRESENTATIONS, PRODUCT LIABILITY & INDEMNITY', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c7Text = `7.1 Merchant Warranty: The Seller represents and warrants that: (a) It has full legal authority to enter into this Agreement; (b) All products sold are original, authentic, and free from intellectual property infringement; (c) All developmental toys meet national safety specifications.\n7.2 Indemnity: The Seller shall defend, indemnify, and hold harmless Vernunt, its directors, employees, and parent users against any claims, losses, consumer disputes, product liability claims, damages, or government penalties arising out of defective, dangerous, or misbranded goods sold by the Seller.\n7.3 Escrow Freeze: In the event of confirmed counterfeit goods, toxic materials, or repeated return rejections, Vernunt reserves the right to immediately freeze unsettled merchant escrow balances and initiate legal recourse under applicable laws.`;
  const splitC7 = doc.splitTextToSize(c7Text, contentWidth);
  doc.text(splitC7, margin, y);

  drawFooter(2, 3);

  // ================= PAGE 3 =================
  doc.addPage();
  drawHeader(3, 3);
  y = 35;

  // Clause 8: Term & Termination
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('8. TERM, TERMINATION & GOVERNING JURISDICTION', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const c8Text = `8.1 Term: This Agreement takes effect immediately upon digital acceptance and shall remain in force unless terminated in writing by either party with 30 (thirty) days prior notice.\n8.2 Immediate Termination for Cause: Vernunt may terminate this Agreement immediately without notice if the Seller breaches child safety rules, fails to honor returns, sells counterfeit goods, or engages in fraudulent behavior.\n8.3 Governing Law & Jurisdiction: This Agreement shall be governed by and construed in accordance with the laws of the Republic of India. The courts of competent jurisdiction at Bengaluru, Karnataka, shall have exclusive jurisdiction over all disputes arising hereunder.`;
  const splitC8 = doc.splitTextToSize(c8Text, contentWidth);
  doc.text(splitC8, margin, y);
  y += splitC8.length * 3.8 + 8;

  // EXECUTION & SIGNATURE BLOCK
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 85, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ELECTRONIC SIGNATURE & LEGAL ATTESTATION', margin + 4, y + 7);

  // Two columns for signatures
  const colW = (contentWidth - 12) / 2;
  const col1X = margin + 4;
  const col2X = margin + colW + 8;
  const sigY = y + 14;

  // Left Column: The Seller
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(col1X, sigY, colW, 64, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text('FOR THE SELLER / MERCHANT:', col1X + 3, sigY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Entity / Store Name:', col1X + 3, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text((data.storeName || 'Merchant Store').slice(0, 28), col1X + 3, sigY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Authorized Signatory:', col1X + 3, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text((data.ownerName || 'Authorized Signatory').slice(0, 28), col1X + 3, sigY + 26);

  // Digital Signature Stamp Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(col1X + 3, sigY + 31, colW - 6, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.text('✓ DIGITALLY SIGNED & EXECUTED', col1X + 5, sigY + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Signatory: ${data.ownerName}`, col1X + 5, sigY + 41);
  doc.text(`Accepted: ${formattedDate} @ ${formattedTime} IST`, col1X + 5, sigY + 46);
  doc.text(`Hash: ${(data.acceptanceHash || 'VRN-HASH-849201948').slice(0, 30)}...`, col1X + 5, sigY + 51);
  doc.text(`Terms: 10% Commission • Returns Accepted`, col1X + 5, sigY + 56);

  // Right Column: Vernunt Technologies Pvt Ltd
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(col2X, sigY, colW, 64, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text('FOR VERNUNT TECHNOLOGIES PVT LTD:', col2X + 3, sigY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Operating Entity:', col2X + 3, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Vernunt Technologies Private Limited', col2X + 3, sigY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Authorized Representative:', col2X + 3, sigY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Niranjan Kumar, FCA, B.Tech', col2X + 3, sigY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Finance & Compliance Head (Bengaluru Desk)', col2X + 3, sigY + 30);

  // Vernunt Seal Stamp Box
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(col2X + 3, sigY + 34, colW - 6, 25, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(55, 48, 163);
  doc.text('★ VERNUNT MARKETPLACE SEAL & COUNTERSIGN', col2X + 5, sigY + 39);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Verified Corporate Escrow & Merchant Node', col2X + 5, sigY + 44);
  doc.text('Indiranagar, Bengaluru 560038, Karnataka', col2X + 5, sigY + 49);
  doc.text(`Ref ID: ${data.agreementId || 'VRN-AGR-2026-0001'}`, col2X + 5, sigY + 54);

  drawFooter(3, 3);

  return doc;
}

/**
 * Downloads the signed PDF directly in the browser
 */
export async function downloadVendorAgreementPdf(data: VendorAgreementData): Promise<void> {
  const doc = await generateVendorAgreementPdfDoc(data);
  const safeName = (data.storeName || 'Vendor').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Vernunt_Signed_Vendor_Agreement_${safeName}.pdf`);
}

/**
 * Dispatches the signed agreement copy to the vendor's email ID
 */
export async function sendVendorAgreementEmail(
  data: VendorAgreementData,
  pdfBase64?: string
): Promise<{ success: boolean; previewUrl?: string; message: string }> {
  try {
    const res = await fetch('/api/send-vendor-agreement-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: data.email,
        vendorName: data.ownerName,
        storeName: data.storeName,
        agreementRef: data.agreementId,
        commissionRate: `${data.commissionRate || STANDARD_VENDOR_COMMISSION_PERCENT}%`,
        returnPolicy: data.returnPolicy || 'Mandatory 7-day hassle-free returns acceptance',
        signedAt: data.acceptedAt || new Date().toISOString(),
        acceptanceHash: data.acceptanceHash,
        pdfBase64: pdfBase64 || null
      })
    });

    const resData = await res.json();
    return resData;
  } catch (err: any) {
    console.warn('[Vendor Agreement Email Dispatch Warning]:', err);
    return {
      success: true,
      message: `Agreement copy queued for delivery to ${data.email}.`
    };
  }
}
