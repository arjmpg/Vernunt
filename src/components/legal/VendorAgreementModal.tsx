import React, { useState } from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Download,
  Mail,
  Send,
  Building2,
  Percent,
  RotateCcw,
  Sparkles,
  Printer,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import VernuntLogo from '../VernuntLogo.tsx';
import { 
  VendorAgreementData, 
  CURRENT_VENDOR_AGREEMENT_VERSION, 
  STANDARD_VENDOR_COMMISSION_PERCENT 
} from '../../types/vendorAgreement';
import { 
  downloadVendorAgreementPdf, 
  sendVendorAgreementEmail, 
  generateVendorAgreementPdfDoc 
} from '../../utils/vendorAgreementPdf';

interface VendorAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (agreementData: VendorAgreementData) => void;
  isAccepted?: boolean;
  storeName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  pickupAddress?: any;
  bankDetails?: any;
}

export const VendorAgreementModal: React.FC<VendorAgreementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  isAccepted = false,
  storeName = 'My Kids Store',
  ownerName = 'Authorized Signatory',
  email = 'seller@company.com',
  phone = '+91 98765 43210',
  gstNumber = '',
  panNumber = '',
  businessType = 'Proprietorship',
  pickupAddress,
  bankDetails
}) => {
  const [agreementChecked, setAgreementChecked] = useState(isAccepted);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [activeClauseTab, setActiveClauseTab] = useState<'commission' | 'returns' | 'safety' | 'logistics' | 'fullText'>('commission');

  if (!isOpen) return null;

  const currentAgreementId = `VRN-AGR-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const agreementData: VendorAgreementData = {
    agreementId: currentAgreementId,
    storeName: storeName || 'Verified Seller',
    ownerName: ownerName || 'Authorized Signatory',
    email: email || 'seller@vernunt.com',
    phone: phone || '+91 98765 43210',
    businessType: businessType || 'Proprietorship',
    pickupAddress,
    gstNumber,
    panNumber,
    bankDetails,
    commissionRate: STANDARD_VENDOR_COMMISSION_PERCENT,
    commissionTerms: `Flat ${STANDARD_VENDOR_COMMISSION_PERCENT}% on product selling price deducted automatically via platform escrow.`,
    returnPolicy: 'Mandatory 7-day hassle-free customer returns and replacements acceptance.',
    acceptedAt: new Date().toISOString(),
    acceptanceHash: `VRN-SIG-${Math.random().toString(36).substring(2, 12).toUpperCase()}-${Date.now().toString().slice(-6)}`,
    version: CURRENT_VENDOR_AGREEMENT_VERSION
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadVendorAgreementPdf(agreementData);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Unable to generate PDF document at this moment.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAcceptAndExecute = async () => {
    if (!agreementChecked) {
      alert('Please check the box confirming your acceptance of the 10% commission on selling price and mandatory return policy.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // 1. Generate PDF doc and base64
      const doc = await generateVendorAgreementPdfDoc(agreementData);
      const pdfBase64 = doc.output('datauristring');

      // 2. Automatically download a copy for the seller
      const safeName = (agreementData.storeName || 'Vendor').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Vernunt_Signed_Vendor_Agreement_${safeName}.pdf`);

      // 3. Dispatch PDF copy to vendor email
      const emailRes = await sendVendorAgreementEmail(agreementData, pdfBase64);
      setEmailDispatched(true);
      setEmailStatusMsg(emailRes.message || `Signed agreement PDF copy dispatched to ${agreementData.email}`);

      // 4. Trigger callback
      if (onAccept) {
        onAccept(agreementData);
      }
    } catch (err) {
      console.error('Agreement acceptance error:', err);
      // Still proceed with acceptance callback even if email server had hiccup
      if (onAccept) {
        onAccept(agreementData);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <VernuntLogo size="sm" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-400/30 uppercase tracking-wider">
                  Mandatory Seller Terms
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Ref: {currentAgreementId}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Vernunt Marketplace Merchant &amp; Seller Agreement</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download draft PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlight Banner: 10% Commission + Mandatory Returns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          {/* Card 1: 10% Commission */}
          <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Percent className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                Platform Facilitation Fee
              </span>
              <h4 className="text-sm font-extrabold text-slate-900">
                10% Commission on Selling Price
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A flat 10.0% fee is deducted from the product's selling price on completed sales. Weekly bank settlements remit the remaining 90% net of taxes.
              </p>
            </div>
          </div>

          {/* Card 2: Mandatory Returns */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                Customer Protection Mandate
              </span>
              <h4 className="text-sm font-extrabold text-slate-900">
                Mandatory Return Acceptance (7 Days)
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Every seller must unconditionally accept customer returns and replacements within 7 days for defective, damaged, or child-safety mismatched items.
              </p>
            </div>
          </div>
        </div>

        {/* Clause Selector Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 bg-white border-b border-slate-200 text-xs font-semibold overflow-x-auto shrink-0 select-none no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveClauseTab('commission')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeClauseTab === 'commission'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>1. 10% Commission Clause</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClauseTab('returns')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeClauseTab === 'returns'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>2. Mandatory Returns Clause</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClauseTab('safety')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeClauseTab === 'safety'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. BIS Child Safety &amp; Non-Toxic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClauseTab('logistics')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeClauseTab === 'logistics'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>4. 24–48h Dispatch &amp; Logistics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClauseTab('fullText')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeClauseTab === 'fullText'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Legal Agreement Text</span>
          </button>
        </div>

        {/* Scrollable Agreement Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* TAB 1: 10% COMMISSION CLAUSE */}
          {activeClauseTab === 'commission' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <Percent className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Clause 1: 10% Platform Facilitation Fee on Gross Selling Price
                  </h3>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong>1.1 Statutory Covenant:</strong> The Seller irrevocably agrees and covenants to pay Vernunt Technologies Private Limited a non-negotiable platform fee of <strong>10.0% (ten percent)</strong> computed on the gross Selling Price of each developmental toy, book, kit, or childcare essential listed and sold through the Vernunt Marketplace platform.
                  </p>
                  <p>
                    <strong>1.2 Automated Escrow Deduction:</strong> The 10% platform fee is automatically deducted at the time of transaction settlement by the Vernunt escrow engine. The remaining 90% (net of any applicable logistics fees or statutory TCS/TDS) is credited to the Seller's registered bank account.
                  </p>
                  <p>
                    <strong>1.3 Reconciled Weekly Cycles:</strong> Payout reconciliations are processed weekly on automated settlement cycles directly via NEFT/UPI. Monthly GST tax invoices detailing the 10% service commission are generated for your input tax credit (ITC) filings.
                  </p>
                  <p>
                    <strong>1.4 No Hidden Listing Fees:</strong> Vernunt charges zero upfront product listing charges, zero subscription fee, and zero monthly catalog maintenance fees. The 10% commission applies strictly when a customer purchase is successfully completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANDATORY RETURNS CLAUSE */}
          {activeClauseTab === 'returns' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <RotateCcw className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Clause 2: Mandatory Return Acceptance &amp; 7-Day Replacement Guarantee
                  </h3>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong>2.1 Non-Negotiable Return Acceptance:</strong> Because Vernunt operates exclusively for children, toddlers, and parents, all Sellers <strong>MUST unconditionally accept returns and replacements</strong> for delivered items within a mandatory minimum window of <strong>7 (seven) calendar days</strong> from the delivery timestamp.
                  </p>
                  <p>
                    <strong>2.2 Eligible Return Reasons:</strong> The Seller agrees to accept returns for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Damaged, broken, or crushed items caused during transit.</li>
                    <li>Manufacturing flaws, missing components, or non-functional parts.</li>
                    <li>Incorrect variant, wrong size, mismatched age recommendation, or wrong color delivered.</li>
                    <li>Unsealed, expired, or compromised baby care or consumable essentials.</li>
                    <li>Products failing non-toxic safety inspection or differing materially from catalog description.</li>
                  </ul>
                  <p>
                    <strong>2.3 Reverse Courier Handling:</strong> Reverse pickup is coordinated automatically via Shiprocket/Delhivery integrated couriers. The Seller agrees to inspect returned shipments within 48 hours of warehouse receipt. Rejection of valid customer returns is strictly prohibited and constitutes an immediate breach of platform trust.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIS CHILD SAFETY */}
          {activeClauseTab === 'safety' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-800 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Clause 3: Child Safety, BIS IS 9873 Certification &amp; Non-Toxic Guarantee
                  </h3>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong>3.1 BIS Compliance:</strong> The Seller guarantees that all toys manufactured, imported, or distributed comply fully with the mandatory Bureau of Indian Standards (BIS IS 9873 parts 1-9 and IS 15644) Quality Control Orders.
                  </p>
                  <p>
                    <strong>3.2 Chemical &amp; Material Purity:</strong> All products must be 100% lead-free, BPA-free, phthalate-free, and coated exclusively with child-safe water-based paints. Baby teethers must be medical/food-grade silicone.
                  </p>
                  <p>
                    <strong>3.3 Zero Counterfeits:</strong> The Seller warrants that all items are 100% genuine, brand-new, and factory sealed. Selling counterfeit, refurbished, or uncertified dangerous items leads to immediate permanent termination, forfeiture of escrow balances, and legal prosecution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOGISTICS SLA */}
          {activeClauseTab === 'logistics' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Clause 4: 24–48 Hours Dispatch SLA &amp; Protective Packaging
                  </h3>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong>4.1 Handover SLA:</strong> Sellers must pack, label, and hand over ordered packages to the assigned courier partner within 24 to 48 hours of order confirmation.
                  </p>
                  <p>
                    <strong>4.2 Packaging Integrity:</strong> Every parcel must be packed in sturdy, child-safe corrugated cartons with tamper-evident security tape to ensure safe transit to neighborhood families across India.
                  </p>
                  <p>
                    <strong>4.3 Stockout Limit:</strong> Sellers must maintain live inventory to keep stockout cancellations below 1.5% monthly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FULL LEGAL TEXT */}
          {activeClauseTab === 'fullText' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 animate-fadeIn bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">
                FULL TEXT: VERNUNT MARKETPLACE MERCHANT SERVICE &amp; SELLER AGREEMENT
              </h4>
              <p>
                This Agreement is between <strong>Vernunt Technologies Private Limited</strong>, having its registered office in Indiranagar, Bengaluru 560038, Karnataka ("Vernunt") AND the registered Seller specified below ("Merchant").
              </p>
              <p>
                <strong>1. Non-Exclusive Listing:</strong> Vernunt grants the Merchant a non-exclusive license to list and sell approved child-centric products on the Vernunt Marketplace platform.
              </p>
              <p>
                <strong>2. Platform Commission (10% on Selling Price):</strong> The Merchant irrevocably agrees to pay a flat 10.0% facilitation commission on the gross selling price of each product transacted. Settlements will be disbursed weekly net of the 10% commission and statutory deductions.
              </p>
              <p>
                <strong>3. Mandatory Return Acceptance:</strong> The Merchant agrees to accept customer returns within 7 days of delivery for defective, damaged, mismatched, or returnable goods without unjustified refusal.
              </p>
              <p>
                <strong>4. Product Safety &amp; BIS Standards:</strong> The Merchant certifies all toys adhere to BIS IS 9873, are non-toxic, lead-free, and safe for child play.
              </p>
              <p>
                <strong>5. Dispatch SLA:</strong> Orders shall be processed and dispatched within 24 to 48 hours.
              </p>
              <p>
                <strong>6. Data Privacy:</strong> Merchant shall adhere to the Digital Personal Data Protection (DPDP) Act 2023 and shall not harvest or market to child/parent contact data.
              </p>
              <p>
                <strong>7. Governing Law:</strong> Courts in Bengaluru, Karnataka, shall have exclusive jurisdiction.
              </p>
            </div>
          )}

          {/* Signatory Details Summary Box */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Signatory Profile Details
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {ownerName} &bull; <span className="text-slate-600">{storeName}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                Email: {email} &bull; Phone: {phone} &bull; {businessType}
              </p>
            </div>
            <div className="text-right sm:shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready for Execution</span>
              </span>
            </div>
          </div>

          {/* Digital Signature Confirmation Checkbox */}
          <div className="p-4 bg-white border-2 border-indigo-200 rounded-2xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="vendor-agreement-confirm-checkbox"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs text-slate-800 leading-snug">
                <span className="font-bold block text-slate-900">
                  I accept the Vernunt Seller Agreement, the 10% platform commission on selling price, and the mandatory return acceptance policy. *
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  By checking this box, I electronically execute this Agreement as an authorized representative of <strong>{storeName}</strong>. A signed PDF copy will be generated and dispatched directly to <strong>{email}</strong>.
                </span>
              </div>
            </label>
          </div>

          {/* Success Banner if Dispatched */}
          {emailDispatched && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-emerald-950">Signed Agreement Successfully Dispatched!</h5>
                <p className="text-emerald-800">
                  {emailStatusMsg || `An official signed PDF copy has been sent to ${email}.`}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1 font-bold text-emerald-900 underline hover:text-emerald-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed PDF Again</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Signature Compliant with IT Act 2000 &amp; DPDP Act 2023</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAcceptAndExecute}
              disabled={!agreementChecked || isGeneratingPdf}
              className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                !agreementChecked || isGeneratingPdf
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating &amp; Emailing Signed PDF...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Agreement &amp; Email PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorAgreementModal;
