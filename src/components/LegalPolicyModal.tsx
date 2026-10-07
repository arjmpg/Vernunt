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
  Info,
  Scale,
  HeartPulse,
  Mail,
  UserCheck,
  ShieldAlert,
  Store,
  MessageSquare,
  Cookie
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';

export type LegalPolicyTab = 'terms' | 'privacy' | 'cookie' | 'safety' | 'shipping' | 'refund' | 'disclaimer' | 'grievance' | 'child-safety' | 'seller-terms' | 'groups-privacy';

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
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto font-sans animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        id="legal-box" 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 transform transition-all flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div id="legal-header" className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shrink-0 shadow-xs">
              <VernuntLogo size="xs" animated={false} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                  Vernunt Legal &amp; Compliance Center
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                  IT Act Sec 79 &bull; DPDP 2023 &bull; COPPA
                </span>
                <span className="text-[10px] text-amber-300 font-mono">
                  v2.4.0 &bull; Effective: Oct 1, 2026 &bull; Updated: Oct 7, 2026
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base font-serif text-white flex items-center gap-1.5">
                Official Platform Policies, Intermediary Disclaimers &amp; Safeguards
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

        {/* Policy Tabs Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-5 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'terms' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Terms &amp; Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${activeTab === 'privacy' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Privacy Policy (DPDP Act)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cookie')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'cookie'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Cookie className={`w-3.5 h-3.5 ${activeTab === 'cookie' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Cookie Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'safety' ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Safety &amp; Meetup Release</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${activeTab === 'shipping' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Shipping &amp; Logistics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${activeTab === 'refund' ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Returns &amp; Refunds</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <HeartPulse className={`w-3.5 h-3.5 ${activeTab === 'disclaimer' ? 'text-red-600' : 'text-slate-400'}`} />
            <span>Medical &amp; Health Disclaimer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'grievance'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Scale className={`w-3.5 h-3.5 ${activeTab === 'grievance' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Grievance Officer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('child-safety')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'child-safety'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === 'child-safety' ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>POCSO &amp; Child Protection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seller-terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'seller-terms'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Store className={`w-3.5 h-3.5 ${activeTab === 'seller-terms' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>Marketplace Seller Indemnity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups-privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'groups-privacy'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'groups-privacy' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Groups &amp; Chat Safe Harbor</span>
          </button>
        </div>

        {/* Policy Body */}
        <div id="legal-body" className="p-5 sm:p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed flex-1 space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: TERMS & CONDITIONS                                 */}
          {/* ========================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Critical Legal Safe Harbor Box */}
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3 text-amber-950 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Statutory Intermediary Safe Harbor &bull; Section 79 Information Technology Act, 2000</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  <strong>VERNUNT TECHNOLOGIES PRIVATE LIMITED</strong> ("Vernunt", "Platform", "We", "Us") operates strictly as an <strong>Intermediary Telecommunications &amp; Software Platform</strong> under Section 79 of the Information Technology Act, 2000 (India) and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Vernunt provides a peer-to-peer digital discovery technology connecting independent parents, activity organizers, daycare operators, and merchant vendors.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11.5px]">
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1">
                    <strong>1. Complete "AS IS" Disclaimers:</strong>
                    <p className="text-amber-900">All services, communications, connections, listings, and directories are provided strictly "AS IS" and "AS AVAILABLE" without warranties of any kind.</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1">
                    <strong>2. Zero Platform Liability:</strong>
                    <p className="text-amber-900">Vernunt bears ZERO liability for any in-person playdate, bodily injury, altercation, transport incident, property loss, or transaction dispute between users.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Eligibility &amp; Mandatory Parental Authority</h4>
                  <p className="mt-1">
                    Direct account creation or usage by minors under the age of 18 is strictly prohibited. By registering on Vernunt, you affirmatively warrant that you are at least 18 years of age, have legal competence under the Indian Contract Act, 1872, and are the legal parent or court-appointed legal guardian of every child added to your account. You warrant that you have sole legal authority to manage their profiles, playdate requests, and bookings.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Absolute Release &amp; Limitation of Liability</h4>
                  <p className="mt-1">
                    To the maximum extent permissible under applicable law, in no event shall Vernunt Technologies Pvt Ltd, its founders, directors, officers, employees, affiliates, investors, or licensors be liable for any direct, indirect, punitive, incidental, special, consequential, or exemplary damages, including but not limited to damages for personal injury, pain and suffering, emotional distress, loss of child supervision, illness, accident, loss of profits, goodwill, data, or other intangible losses arising from:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2 text-slate-600">
                    <li>Any in-person interactions, meetings, playdates, neighborhood groups, rides, or travel arranged via the platform.</li>
                    <li>Conduct, actions, omissions, statements, or representations of any third party (parents, sitters, doctors, drivers, vendors, attendees).</li>
                    <li>Any product purchased from third-party vendors or events hosted by independent organizers.</li>
                    <li>Unauthorized access to or alteration of your transmissions or data.</li>
                  </ul>
                  <p className="mt-2 font-semibold text-slate-800">
                    In all events, Vernunt's aggregate cumulative liability to any user for all claims, causes of action, or disputes shall never exceed the total amount actually paid by the user to Vernunt in the thirty (30) days preceding the claim or ₹100 INR (One Hundred Indian Rupees), whichever is lower. If you have paid zero fees, your sole and exclusive remedy is to discontinue use of the platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Comprehensive User Indemnification</h4>
                  <p className="mt-1">
                    You agree to defend, indemnify, and hold harmless Vernunt, its directors, officers, employees, contractors, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, debts, and legal fees arising from: (a) your use of and access to the platform; (b) any physical or digital interaction between you and another user or third party; (c) your violation of any term of these Terms; (d) your violation of any third-party right, including child custody rights, privacy rights, or intellectual property rights; or (e) any claim that content submitted by you caused damage to a third party.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">4. Surface Verification Disclaimer (No Character Warranty)</h4>
                  <p className="mt-1">
                    Verification badges (including "DigiLocker Govt ID Match", "Phone OTP Verified", "Parent Badge") indicate only that automated cryptographic checks confirmed user-provided credentials against government records at the moment of verification. <strong>Verification DOES NOT constitute an investigation of criminal history, psychological evaluation, character warranty, or moral guarantee.</strong> Parents must independently verify all credentials before leaving any child in another's company.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">5. Class Action Waiver &amp; Exclusive Jurisdiction</h4>
                  <p className="mt-1">
                    All claims must be brought in the parties' individual capacity and not as a plaintiff or class member in any purported class, collective, or representative proceeding. Any dispute, controversy, or claim arising out of or relating to these Terms shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India. The seat and venue of arbitration shall be <strong>Bengaluru, Karnataka</strong>. The courts of Bengaluru shall have exclusive jurisdiction over any court proceedings.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">6. Modification of Platform Tiers &amp; Termination</h4>
                  <p className="mt-1">
                    Vernunt reserves the unconditional right to modify, adjust, introduce pricing for, suspend, or terminate any free features, groups, sitemaps, directories, or the entire application at any time without prior notice or compensation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRIVACY POLICY                                     */}
          {/* ========================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-emerald-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Digital Personal Data Protection (DPDP) Act 2023 &bull; COPPA Certified</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Vernunt strictly adheres to India's <strong>Digital Personal Data Protection Act, 2023</strong>, the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, and the <strong>Children's Online Privacy Protection Act (COPPA, 16 CFR Part 312)</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Verifiable Parental Consent (VPC)</h4>
                  <p className="mt-1">
                    Under Section 9 of the DPDP Act 2023, processing of any child's data is carried out strictly upon obtaining verifiable consent from the parent or lawful guardian via authenticated multi-factor mobile OTP and government credentials.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Zero Biometric &amp; Zero Aadhaar Number Storage</h4>
                  <p className="mt-1">
                    Vernunt utilizes Government-approved DigiLocker / UIDAI verification gateways via tokenized cryptography. <strong>Vernunt NEVER stores raw Aadhaar numbers, biometric fingerprints, or iris scans on its servers.</strong> Verification generates a transient cryptographic hash that affirms government identity match without retaining sensitive citizen credentials.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Zero Third-Party Advertising &amp; No Sale of Data</h4>
                  <p className="mt-1">
                    Vernunt enforces a strict, unconditional <strong>Zero-Ad-Network Policy</strong>. Children's activities, names, ages, milestones, health notes, and locations are <strong>NEVER sold, rented, leased, or licensed</strong> to any commercial advertisers, data brokers, or profiling agencies.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">4. Vernunt Groups Confidentiality Shield</h4>
                  <p className="mt-1">
                    Group chat messages, member rosters, shared media, and parent discussions are strictly confidential. <strong>Group chat contents and member personal numbers are permanently blocked from search engines via robots.txt, noindex headers, and cryptographic session tokens.</strong> Google Search and Googlebot are permitted to index only public group names and categories in the search directory.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">5. Right to Erasure &amp; The Right to be Forgotten</h4>
                  <p className="mt-1">
                    Parents hold the unconditional legal right under Section 12 of the DPDP Act to access, correct, export, or permanently erase all child profiles, chat history, and uploaded images. Deletion requests are processed and irreversibly purged across all active clusters within forty-eight (48) hours upon request to <code>privacy@vernunt.com</code> or via Account Settings &gt; Privacy &amp; Data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COOKIE & TRACKING TECHNOLOGIES POLICY              */}
          {/* ========================================================= */}
          {activeTab === 'cookie' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                  <Cookie className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cookie Policy &bull; DPDP Act 2023 &bull; IT Act 2000 Section 43A</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Vernunt uses strictly necessary and privacy-preserving cookies and localStorage records to ensure secure parent authentication, child profile privacy barriers, and seamless session integrity. <strong>Vernunt NEVER uses cross-site ad tracking, behavioural profiling, or third-party marketing beacons on children.</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Cookie Classification &amp; Purpose</h4>
                  <p className="mt-1">
                    In compliance with international and Indian privacy guidelines, our cookies are classified into four distinct operational tiers:
                  </p>
                  
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-3">Category</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Purpose</th>
                          <th className="p-3">Retention</th>
                          <th className="p-3">Consent Required?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Strictly Necessary</td>
                          <td className="p-3 font-mono text-[11px]">First-Party</td>
                          <td className="p-3">Parent login session, CSRF security, encrypted token caching</td>
                          <td className="p-3">Session / 30 Days</td>
                          <td className="p-3 text-emerald-700 font-bold">Exempt (Essential)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Functional &amp; Voice</td>
                          <td className="p-3 font-mono text-[11px]">First-Party</td>
                          <td className="p-3">Kannada/Hindi voice agent settings, radar locality cache</td>
                          <td className="p-3">90 Days</td>
                          <td className="p-3 text-amber-700 font-bold">User Opt-In</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Privacy Analytics</td>
                          <td className="p-3 font-mono text-[11px]">First-Party</td>
                          <td className="p-3">Aggregated page rendering times, zero PII or IP stored</td>
                          <td className="p-3">30 Days</td>
                          <td className="p-3 text-amber-700 font-bold">User Opt-In</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-900">Marketing &amp; Events</td>
                          <td className="p-3 font-mono text-[11px]">First-Party</td>
                          <td className="p-3">Community family workshop and children sports class alerts</td>
                          <td className="p-3">30 Days</td>
                          <td className="p-3 text-rose-700 font-bold">Explicit Opt-In Only</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Zero Third-Party Advertising Beacons</h4>
                  <p className="mt-1">
                    Unlike commercial social networks, Vernunt does not embed Facebook Pixel, Google Ads remarketing beacons, or third-party data tracking trackers. Children’s profiles and playdates are never monetized through behavioral ad networks.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Managing and Withdrawing Cookie Consent</h4>
                  <p className="mt-1">
                    You can inspect, modify, or withdraw your cookie consent at any time by clicking <strong>"Cookie Preferences"</strong> in the platform footer or visiting <em>Account Settings &gt; Privacy &amp; Data</em>. You can also configure your browser (Chrome, Safari, Firefox, Edge) to reject all non-essential cookies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SAFETY & MEETUP LIABILITY RELEASE                  */}
          {/* ========================================================= */}
          {activeTab === 'safety' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-900">
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Assumption of Risk &bull; Physical Meetups &bull; Zero Platform Supervision</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  Vernunt is solely a digital software communications tool. Vernunt does NOT organize, staff, manage, police, inspect, or oversee in-person playdates, park meetups, sports sessions, or daycare premises.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Mandatory Continuous Parental Custody &amp; Supervision</h4>
                  <p className="mt-1">
                    Parents and legal guardians warrant that they or their designated adult representative shall physically accompany and directly supervise their minor children at all times during any meetup, playdate, or class arranged through the platform. <strong>Vernunt is not a child care agency, baby sitting employer, or security guard service.</strong> Leaving a minor unattended with another family or provider is undertaken entirely at the guardian's sole risk and discretion.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Absolute Assumption of Risk</h4>
                  <p className="mt-1">
                    You acknowledge that physical play, sports, swimming, outdoor adventures, cycling, and playground activities involve inherent risks of physical injury, illness, allergic reaction, animal bites, environmental hazards, accidents, and property damage. By using Vernunt to discover activities or playmates, you voluntarily and knowingly assume all risks on behalf of yourself and your minor dependents.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Emergency SOS Feature Disclaimer</h4>
                  <p className="mt-1">
                    The platform's in-app Emergency SOS button is an auxiliary digital convenience tool designed solely to dispatch automated SMS and location coordinates to pre-selected personal family emergency contacts. <strong>The SOS feature is NOT a substitute for municipal emergency services. In any acute emergency, always immediately dial 112 (National Emergency Number), 100 (Police), or 108 (Ambulance).</strong> Vernunt guarantees no response time, cellular network connectivity, or dispatch service.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">4. Third-Party Premises &amp; Daycares</h4>
                  <p className="mt-1">
                    All daycare listings, playhome facilities, and private venues are independently owned and operated by third parties. Vernunt conducts no health inspections, structural engineering assessments, fire safety checks, or CCTV audits of listed facilities. Parents must physically inspect and evaluate all centers independently before enrolling any child.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SHIPPING & LOGISTICS POLICY                        */}
          {/* ========================================================= */}
          {activeTab === 'shipping' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 text-blue-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-blue-900">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Marketplace Courier Logistics &bull; Third-Party Fulfillment</span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Vernunt Store operates as a curated intermediary marketplace connecting independent merchant vendors with customers. Physical products are packaged and dispatched by independent certified vendors and transported by third-party logistics aggregators.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Dispatch Timelines &amp; Courier Aggregators</h4>
                  <p className="mt-1">
                    Standard in-stock merchandise is packed and handed over to independent courier partners (National Logistics Network, BlueDart, Delhivery, DTDC, India Post) within <strong>24 to 48 business hours</strong> of payment verification. Personalized hardcover achievement storybooks undergo printing and binding and dispatch within <strong>3 to 4 business days</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Estimated Delivery Windows &amp; Force Majeure</h4>
                  <p className="mt-1">
                    Estimated delivery times (2-4 business days for metros, 4-7 business days for regional towns) are estimates provided by courier companies and are <strong>not legally binding guarantees</strong>. Vernunt and its merchants shall not be held liable for shipment delays caused by Force Majeure events, including severe weather, flooding, strikes, transport blockages, customs holds, or regional civil unrest.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Mandatory Unboxing Video Proof for Transit Damage</h4>
                  <p className="mt-1">
                    To prevent fraudulent claims and establish courier fault, <strong>all transit damage claims, broken item reports, or missing item complaints REQUIRE a clear, unedited continuous video recording of the outer parcel package being opened from its original sealed state</strong>. Claims submitted without unboxing video proof cannot be entertained by logistics carriers.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">4. Non-Manufacturing Intermediary Disclaimer</h4>
                  <p className="mt-1">
                    Vernunt does not design, manufacture, or chemically produce store merchandise. All warranties regarding product safety, BIS certification, FSSAI compliance, material non-toxicity, and hypoallergenic claims are strictly between the consumer and the respective product manufacturer/brand.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: RETURNS & REFUNDS POLICY                           */}
          {/* ========================================================= */}
          {activeTab === 'refund' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 sm:p-5 text-purple-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-purple-900">
                  <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Returns, Replacements &amp; Refund Guidelines (7-Day Sealed Window)</span>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  Vernunt facilitates a fair, transparent return and replacement process for eligible physical store purchases and community event passes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. 7-Day Return Eligibility (Physical Items)</h4>
                  <p className="mt-1">
                    Eligible non-perishable goods (Montessori STEM kits, unopened clothing sets, sealed books) can be returned within <strong>seven (7) calendar days of delivery</strong> provided the item is strictly unused, unwashed, and in its pristine original packaging with all security tags intact.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Strictly Non-Returnable Hygiene &amp; Safety Categories</h4>
                  <p className="mt-1">
                    For the vital health, hygiene, and medical safety of babies and toddlers, the following product categories are <strong>strictly NON-RETURNABLE and NON-REFUNDABLE once delivered</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 mt-1.5 text-slate-600">
                    <li>Organic infant porridge mixes, baby purees, snacks, and consumable food items.</li>
                    <li>Diaper packs, baby wipes, bath soaps, and rash creams if the protective seal is broken.</li>
                    <li>Teething toys, pacifiers, feeding bottles, and breast pumps.</li>
                    <li>Worn or pierced baby earrings, silver nazariya bangles, or custom-engraved jewelry.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Refund Method &amp; Timelines</h4>
                  <p className="mt-1">
                    Upon receipt and warehouse inspection of returned items, approved refunds are initiated within <strong>24 business hours</strong> directly to the original payment source (UPI, Debit/Credit Card, Net Banking). Bank reflection typically takes 5 to 7 business days. Shipping fees and express courier charges are non-refundable.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">4. Digital Event Passes &amp; Ticket Cancellations</h4>
                  <p className="mt-1">
                    Paid event passes are eligible for 100% refund if cancelled at least 24 hours prior to scheduled event commencement. If an organizer cancels an event, ticket holders receive an automatic 100% refund within 3 business days. Vernunt bears no liability for travel, lodging, or ancillary expenses incurred by attendees.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: MEDICAL & HEALTH DISCLAIMER                        */}
          {/* ========================================================= */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 text-red-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-red-900">
                  <HeartPulse className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Educational Informational Reference &bull; Not Medical Advice</span>
                </div>
                <p className="text-xs text-red-900 leading-relaxed">
                  <strong>IMPORTANT HEALTH NOTICE:</strong> The Vernunt platform, its 1,000+ child growth guides, milestone trackers, nutritional articles, developmental milestones, and specialist portfolios DO NOT constitute medical advice, clinical diagnosis, pediatric treatment, or prescription therapy.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. No Doctor-Patient Relationship</h4>
                  <p className="mt-1">
                    Accessing articles, using milestone trackers, or viewing doctor directory cards on Vernunt DOES NOT establish a doctor-patient relationship between you and Vernunt or any listed healthcare professional. Any consultations booked with verified pediatricians are independent professional transactions governed solely by the provider's professional code of conduct.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Mandatory Clinical Consultation</h4>
                  <p className="mt-1">
                    Always seek the advice of your licensed pediatrician, family physician, or qualified medical specialist regarding any medical condition, infant fever, acute illness, feeding intolerance, behavioral concern, or vaccination schedule. Never disregard professional clinical advice or delay seeking medical care based on content read on this platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Acute Medical Emergencies</h4>
                  <p className="mt-1">
                    If your child is experiencing a medical emergency, difficulty breathing, seizures, severe allergic reaction (anaphylaxis), trauma, or high unresponsive fever, <strong>DO NOT use the app. Call 112 / 108 or proceed immediately to the nearest hospital emergency room.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: GRIEVANCE OFFICER & STATUTORY NOTICE               */}
          {/* ========================================================= */}
          {activeTab === 'grievance' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 text-indigo-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-indigo-900">
                  <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Statutory Grievance Redressal Mechanism &bull; Rule 3(2) IT Rules, 2021</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  In compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the DPDP Act 2023, Vernunt has appointed a dedicated Nodal &amp; Grievance Officer in India.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Designated Grievance &amp; Compliance Officer</h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p><strong>Name / Designation:</strong> Nodal Grievance Redressal Officer, Vernunt Technologies Pvt Ltd</p>
                  <p><strong>Corporate Address:</strong> Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India</p>
                  <p><strong>Customer Care Support:</strong> <a href="mailto:support@vernunt.com" className="text-rose-600 font-bold underline">support@vernunt.com</a></p>
                  <p><strong>Grievance Redressal Contact:</strong> <a href="mailto:grievance@vernunt.com" className="text-indigo-600 font-bold underline">grievance@vernunt.com</a> &bull; <a href="mailto:legal@vernunt.com" className="text-indigo-600 font-bold underline">legal@vernunt.com</a></p>
                  <p><strong>Real Estate Support Email:</strong> <a href="mailto:estate@vernunt.com" className="text-emerald-700 font-bold underline">estate@vernunt.com</a></p>
                  <p><strong>Child Safety Escalations:</strong> <a href="mailto:safety@vernunt.com" className="text-rose-600 font-bold underline">safety@vernunt.com</a></p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm font-serif">Statutory Turnaround Timelines</h4>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                  <li><strong>Acknowledgment of Grievance:</strong> Within twenty-four (24) hours of receipt.</li>
                  <li><strong>Redressal &amp; Investigation:</strong> Within fifteen (15) days of receipt.</li>
                  <li><strong>Emergency Child Safety &amp; Non-Consensual Content Takedowns:</strong> Within twenty-four (24) hours of prima facie notification under Rule 3(2)(b).</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Notice &amp; Takedown Procedure:</strong> Any copyright owner, parent, or government authority seeking content removal must submit a formal notice detailing the URL, exact content description, and basis of infringement or violation to <code>grievance@vernunt.com</code>.
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: POCSO ACT 2012 & CHILD PROTECTION POLICY           */}
          {/* ========================================================= */}
          {activeTab === 'child-safety' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Zero-Tolerance Child Protection &bull; POCSO Act 2012 &bull; IT Act Sec 67B</span>
                </div>
                <p className="text-xs text-rose-950 leading-relaxed">
                  Vernunt enforces an unconditional zero-tolerance protocol towards child abuse material (CSAM), grooming, sexual exploitation, or endangerment under the Protection of Children from Sexual Offences (POCSO) Act, 2012, and Section 67B of the Information Technology Act, 2000.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Mandatory Statutory Reporting</h4>
                  <p className="mt-1">
                    Any suspected child exploitation, predatory messaging, or inappropriate contact triggers immediate account suspension, permanent cryptographic blacklisting, and automatic reporting to law enforcement authorities including the National Cyber Crime Reporting Portal (cybercrime.gov.in) and local police cyber cells.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Automated Safety Filtering &amp; Aadhaar Verification</h4>
                  <p className="mt-1">
                    Vernunt deploys automated heuristics, phone OTP binding, and Aadhaar-based cryptographic ID matching to verify parent accounts. Parents retain sole custody and physical responsibility for children at all times.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Emergency Child Protection Contacts</h4>
                  <p className="mt-1">
                    National Emergency: <strong>112</strong> &bull; Childline India: <strong>1098</strong> &bull; Cyber Crime Helpline: <strong>1930</strong>. Platform Safety Escalations: <code>safety@vernunt.com</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: MARKETPLACE SELLER TERMS & PRODUCT INDEMNITY       */}
          {/* ========================================================= */}
          {activeTab === 'seller-terms' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5 text-teal-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-teal-900">
                  <Store className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Marketplace Intermediary Safe Harbor &bull; Consumer Protection Rules, 2020</span>
                </div>
                <p className="text-xs text-teal-950 leading-relaxed">
                  Vernunt operates as an independent marketplace platform. All developmental kits, Montessori toys, apparel, and baby products are sold, packaged, and fulfilled by independent vetted third-party sellers, merchants, and brands.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Absolute Product Defect Release</h4>
                  <p className="mt-1">
                    Vernunt does not design, manufacture, inspect individual units, hold inventory title, or warrant fitness for a particular purpose of any merchandise. You expressly agree that Vernunt bears <strong>ZERO product liability</strong> for manufacturing defects, choking hazards, material allergic reactions, or delivery errors. All warranty and defect claims are solely between the buyer and the merchant vendor.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. Mandatory Seller Warranty &amp; BIS Compliance</h4>
                  <p className="mt-1">
                    All sellers on Vernunt contractually warrant that their toys, infant care items, and baby gear comply with Bureau of Indian Standards (BIS) safety norms, non-toxic paint certifications, and applicable consumer laws. Sellers agree to fully indemnify Vernunt against any third-party claims, consumer forum proceedings, or regulatory penalties.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Vernunt Merchant Hub &amp; Catalog Feed Accuracy</h4>
                  <p className="mt-1">
                    Product prices, stock availability, and specifications published on Vernunt Store and synchronized across Vernunt Merchant Hub feeds are maintained with high automated fidelity. In the event of pricing discrepancies or stockouts, merchants reserve the right to cancel orders with full refund of the amount paid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: GROUPS & COMMUNICATIONS SAFE HARBOR               */}
          {/* ========================================================= */}
          {activeTab === 'groups-privacy' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-950 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Groups Safe Harbor &bull; Google Search Privacy Architecture</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  Vernunt Parenting Groups are peer-to-peer discussion spaces. Vernunt acts as a passive intermediary telecommunications carrier and does not curate, author, verify, endorse, or pre-screen user messages, parent opinions, or group announcements.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">1. Absolute Exclusion of Chat Messages from Search Engines</h4>
                  <p className="mt-1">
                    To strictly safeguard parental privacy and family conversations, <strong>all internal group chat messages, discussion threads, member conversations, and user posts are completely blocked from Google Search Engine indexing</strong>. Vernunt implements server-level <code>robots.txt</code> disallow rules, dynamic <code>noindex</code> meta directives, and HTML5 <code>data-nosnippet</code> tags to ensure that ONLY high-level public group names and categories are discoverable on Google Search.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">2. User Sole Liability for Statements &amp; Defamation</h4>
                  <p className="mt-1">
                    Each group participant and author is solely legally responsible for the truthfulness, legality, and consequences of their messages, recommendations, or complaints. Defamatory speech, harassment, hate speech, medical malpractice claims, or commercial spam are strictly prohibited.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm font-serif">3. Offline In-Person Meetup Safe Harbor</h4>
                  <p className="mt-1">
                    Vernunt does not organize, supervise, staff, monitor, or insure group meetups arranged by parents (e.g., park stroller walks, playgroups, cycling trips). Attendees participate entirely at their own risk and waive all claims against Vernunt.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div id="legal-footer" className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Vernunt is an intermediary discovery technology. Parents maintain absolute custody &amp; supervision.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-agree-legal-footer"
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              I Acknowledge &amp; Accept Platform Terms
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
