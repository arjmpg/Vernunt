import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Truck, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';

export type LegalPolicyTab = 'terms' | 'privacy' | 'shipping' | 'refund';

interface LegalPolicyModalProps {
  isOpen?: boolean;
  initialTab?: LegalPolicyTab;
  onClose?: () => void;
  onKeepClose?: () => void;
}

export default function LegalPolicyModal({ 
  isOpen = true, 
  initialTab = 'terms', 
  onClose,
  onKeepClose
}: LegalPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else if (typeof onKeepClose === 'function') {
      onKeepClose();
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="legal-policy-modal" 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto font-sans"
      onClick={handleClose}
    >
      <div 
        id="legal-box" 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 transform transition-all flex flex-col max-h-[90vh] my-auto animate-fade-in"
      >
        {/* Header */}
        <div id="legal-header" className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-stone-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shrink-0 shadow-xs">
              <VernuntLogo size="xs" animated={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                  Vernunt Legal &amp; Compliance Center
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                  Updated September 2026
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base font-serif text-white flex items-center gap-1.5">
                Official Platform Policies &amp; Guardian Safeguards
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Policy Document"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer hidden sm:flex items-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              id="btn-close-legal"
              type="button"
              onClick={handleClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Policy Tabs Navigation Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'terms' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>1. Terms &amp; Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${activeTab === 'privacy' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>2. Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${activeTab === 'shipping' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>3. Shipping Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${activeTab === 'refund' ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>4. Refund &amp; Shipping Policy</span>
          </button>
        </div>

        {/* Policy Body */}
        <div id="legal-body" className="p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed flex-1 space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: TERMS & CONDITIONS */}
          {/* ========================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Critical Disclaimers Callout Box */}
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-2.5 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Important Legal Disclaimers &amp; Marketplace Notice</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-900/90 leading-relaxed">
                  <li>
                    <strong>Free App Usage Policy:</strong> The Vernunt platform is currently provided <strong>100% Free</strong> for all users. Free app usage, complimentary features, quotas, and access levels can be modified, adjusted, paused, converted, or changed at any time by Vernunt with or without prior notice to users.
                  </li>
                  <li>
                    <strong>Marketplace Facilitator Disclaimer:</strong> Vernunt is strictly an online discovery technology marketplace and platform facilitator. Vernunt is <strong>NOT responsible or liable</strong> for any user conduct, offline playdates, physical interactions, safety occurrences, injuries, damages, transactions, or communications.
                  </li>
                  <li>
                    <strong>Basic Verification Only:</strong> Vernunt only performs <em>basic surface-level verification</em> (mobile OTP verification, email confirmation, self-declarations, optional basic identity checks). Basic verification does NOT constitute background investigation, criminal vetting, character guarantee, or safety warranty.
                  </li>
                  <li>
                    <strong>Mandatory Parent Supervision &amp; Due Diligence:</strong> Parents and legal guardians are strictly required to independently exercise thorough due diligence, verify credentials, supervise all meetups, accompany children at all times, and carefully get connected with other families and service providers.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm font-serif">1. Acceptance of Terms &amp; Eligibility</h4>
                <p>
                  By accessing or using Vernunt (including vernunt.com, app.vernunt.com, mobile web views, and related APIs), you agree to be bound by these Terms and Conditions. Direct account creation by minors under 18 years of age is strictly prohibited. All child profiles, playmate requests, and story submissions must be created solely by a verified parent or legal guardian.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">2. Marketplace Platform Status &amp; Complete Limitation of Liability</h4>
                <p>
                  Vernunt acts solely as an intermediary technology platform enabling independent guardians, daycare providers, activity specialists, and event organizers to discover each other. Vernunt does not employ, supervise, endorse, or manage any parents, children, daycares, or specialists listed on the platform.
                </p>
                <p>
                  To the maximum extent permitted by applicable law, Vernunt, its founders, directors, employees, and affiliates shall not be liable for any direct, indirect, incidental, punitive, or consequential damages arising out of in-person playdates, interactions at community venues, childcare sessions, advice provided by specialists, or transactions between users.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">3. Basic Verification &amp; Guardian Responsibility</h4>
                <p>
                  User badges (such as "Mobile Verified", "Aadhaar Match Indicator", "Parent Verified") signify only that automated technical checks were executed against user-supplied inputs. They do not constitute an exhaustive police verification or safety guarantee. Guardians must always:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li>Meet first in well-lit, public playgrounds, schools, or parks.</li>
                  <li>Personally supervise their minor children for the entire duration of any meetup.</li>
                  <li>Never disclose sensitive home addresses, financial credentials, or private travel plans.</li>
                  <li>Directly verify references and government identification of any service provider before engaging.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">4. Modification of Free Access &amp; Platform Features</h4>
                <p>
                  Vernunt provides free community discovery and publication features. Vernunt reserves the exclusive right, at its sole discretion, to modify, restrict, terminate, introduce paid tiers for, or discontinue any free features or the entire application at any time, with or without prior notification to users.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">5. Content Ownership &amp; Kid Storybook Gazette</h4>
                <p>
                  Parents retain ownership of the photos, achievements, and narratives submitted for their children. By submitting a child achievement story, you grant Vernunt a non-exclusive, royalty-free license to display, format, and index the story in the Vernunt Gazette and Google search indexing. Published stories undergo editorial review; to maintain integrity, modifications can only be requested through the Editorial Admin.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">6. Code of Conduct &amp; Immediate Termination</h4>
                <p>
                  Any fraudulent activity, harassment, bullying, unauthorized solicitations, child endangerment, or abusive behavior will result in immediate and permanent account termination, phone/device blocking, and referral to relevant cybercrime and law enforcement authorities under India's POCSO and IT Acts.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p><strong>Governing Law:</strong> These terms are governed by and construed in accordance with the laws of India, with exclusive jurisdiction in the courts of Bengaluru, Karnataka.</p>
                <p><strong>Contact Legal Desk:</strong> legal@vernunt.com • support@vernunt.com</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRIVACY POLICY */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Child Privacy &amp; Data Protection Certified</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  Vernunt strictly complies with India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and the <strong>Children's Online Privacy Protection Act (COPPA, 16 CFR Part 312)</strong>. We enforce zero behavioral ad tracking, verifiable parental consent, and concentric location masking.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm font-serif">1. Verifiable Parental Consent (VPC)</h4>
                <p>
                  No minor under 18 may directly create an account. Accounts are created solely by guardians using verified mobile OTP and email verification. Child profiles are managed exclusively under the parent's authenticated account.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">2. Information We Collect</h4>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li><strong>Parent Contact Details:</strong> Mobile number (verified via SMS OTP), email address, and optional city/pincode.</li>
                  <li><strong>Child Profile Details:</strong> First name/nickname, age, general play interests (e.g., Lego, football, chess), and parent-provided photos.</li>
                  <li><strong>Playground Radar Coordinates:</strong> Fuzzy, rounded geographic coordinates used strictly for neighborhood distance matching (e.g., within 2 km). Precise home street addresses are never stored or exposed to other users.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">3. Zero-Targeted-Advertising Policy</h4>
                <p>
                  Child behavioral patterns and play preferences are never sold, rented, or monetized for commercial advertising or third-party behavioral profiling.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">4. Data Security &amp; Encryption</h4>
                <p>
                  All data transmitted across Vernunt is secured using TLS 1.3 encryption in transit and AES-256 encryption at rest. Biometric authentication (fingerprint / Face ID / device screen lock) runs locally on user devices via the standard WebAuthn API; raw biometric data never leaves your device or touches our servers.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">5. Parental Rights: Access, Export &amp; Permanent Erasure</h4>
                <p>
                  Under the DPDP Act 2023, parents retain unconditional rights to review dependent child records, download data archives, or request immediate permanent deletion (Right to be Forgotten) at any time through our compliance desk.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                <p><strong>Designated Grievance &amp; Child Safety Officer:</strong></p>
                <p>Grievance Officer, Vernunt Technologies Pvt Ltd, Bengaluru, Karnataka • Email: safety@vernunt.com</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SHIPPING POLICY */}
          {/* ========================================================= */}
          {activeTab === 'shipping' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-blue-900">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Physical Orders &amp; Play Gear Shipping Guidelines</span>
                </div>
                <p className="text-xs text-blue-900/90 leading-relaxed">
                  This Shipping Policy applies to physical goods purchased via the Vernunt Store, including printed hardcover kid achievement storybooks, developmental toys, outdoor play kits, and event pass merchandise.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm font-serif">1. Order Processing &amp; Dispatch Time</h4>
                <p>
                  All standard orders are verified, packaged, and dispatched within <strong>24 to 48 business hours</strong> (excluding Sundays and national holidays) from our fulfillment centers. Custom printed hardcover kid storybooks undergo color calibration and binding and are dispatched within <strong>3 to 4 business days</strong>.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">2. Shipping Coverage &amp; Delivery Timelines</h4>
                <p>
                  We deliver across all serviceable pincodes in India through premier courier partners including Bluedart, Delhivery, DTDC, and India Post Speed Post:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-800 block text-xs">Metro Cities &amp; Tier 1</span>
                    <span className="text-[11px] text-slate-600">Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata, Pune: <strong>2 to 4 business days</strong></span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-800 block text-xs">Tier 2 &amp; Regional Towns</span>
                    <span className="text-[11px] text-slate-600">Rest of India &amp; regional districts: <strong>4 to 7 business days</strong></span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-sm font-serif">3. Shipping Rates</h4>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li><strong>Standard Shipping:</strong> Free shipping across India on all orders of ₹499 and above.</li>
                  <li><strong>Orders under ₹499:</strong> A nominal flat shipping charge of ₹49 is applied at checkout.</li>
                  <li><strong>Express Air Courier:</strong> Optional priority 24-hour dispatch available in select metros for ₹99.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">4. Real-Time Tracking</h4>
                <p>
                  As soon as your package is scanned by our logistics carrier, an automated SMS and email with the courier tracking ID and live tracking URL will be sent to the contact details provided.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">5. Transit Delays &amp; Damaged Deliveries</h4>
                <p>
                  While we work with leading carriers, unforeseen weather disruptions or local restrictions may cause slight delays. If a package arrives visibly tampered with or damaged, please take photos and notify our shipping desk at <strong>support@vernunt.com</strong> within 48 hours for immediate replacement.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: REFUND & SHIPPING POLICY */}
          {/* ========================================================= */}
          {activeTab === 'refund' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-900">
                  <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Comprehensive Refund, Return &amp; Shipping Policy</span>
                </div>
                <p className="text-xs text-purple-900/90 leading-relaxed">
                  We strive to ensure complete satisfaction for families. This policy details refund eligibility, return conditions, replacement steps, and shipping fee adjustments for both physical store merchandise and digital event passes.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm font-serif">1. Physical Goods Return &amp; Replacement (7-Day Guarantee)</h4>
                <p>
                  Physical merchandise (educational toys, sports play gear, reading materials) can be returned or exchanged within <strong>7 days of delivery</strong> under the following conditions:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li>Item arrived physically damaged, defective, or incomplete.</li>
                  <li>Item is in unused condition with all original tags, boxes, and accessories intact.</li>
                  <li>Custom printed hardcover kid storybooks with verified personalization errors made by our printing facility will be reprinted and reshipped at zero cost.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">2. Return Shipping Process &amp; Costs</h4>
                <p>
                  For verified defective, damaged, or incorrect items, Vernunt will arrange a free reverse pickup from your doorstep. If reverse pickup is unavailable at your pincode, you may courier the package back via India Post Speed Post, and we will reimburse the return shipping charges upon receipt of receipt.
                </p>

                <h4 className="font-bold text-slate-900 text-sm font-serif">3. Refund Processing &amp; Timelines</h4>
                <p>
                  Once the returned item is inspected at our fulfillment warehouse:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li>Approved refunds are initiated within <strong>24 business hours</strong>.</li>
                  <li>Funds will reflect back in your original source payment method (UPI, Bank Account, Debit/Credit Card) within <strong>5 to 7 business days</strong> depending on your bank.</li>
                  <li>For Cash on Delivery (COD) orders, refunds are issued via direct UPI transfer or NEFT upon providing verified account details.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">4. Digital Passes &amp; Community Event Tickets</h4>
                <p>
                  For paid tickets to community events, workshops, or festivals hosted by verified event organizers on Vernunt:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
                  <li>Cancellations requested up to <strong>24 hours prior</strong> to the scheduled start time are eligible for a 100% refund.</li>
                  <li>If an event is rescheduled or canceled by the organizer, attendees will receive an automatic 100% full refund within 3 business days.</li>
                </ul>

                <h4 className="font-bold text-slate-900 text-sm font-serif">5. Non-Refundable Items &amp; Free Services</h4>
                <p>
                  All complimentary free platform services, promotional credits, and referral reward bonuses hold no monetary cash value and cannot be redeemed for cash. As stated in our Terms, free app services can be modified or withdrawn at any time without monetary compensation.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                <p><strong>To Initiate a Return or Refund:</strong></p>
                <p>Email: returns@vernunt.com or support@vernunt.com with your Order ID, contact number, and photographs of the item. Support responds within 12 business hours.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div id="legal-footer" className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Vernunt is an intermediary marketplace. Parents must exercise careful independent verification.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-agree-legal-footer"
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
