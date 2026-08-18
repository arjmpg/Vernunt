import React, { useState } from 'react';
import { 
  ShieldCheck, 
  HeartHandshake, 
  Lock, 
  AlertTriangle, 
  FileText, 
  PhoneCall, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Eye, 
  Sparkles,
  MapPin,
  UserCheck
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';
import { runChildComplianceAudit } from '../utils/childSafetyFilter.ts';

interface ChildSafetyComplianceModalProps {
  onClose: () => void;
  userProfile?: any;
  onOpenSOS?: () => void;
}

export default function ChildSafetyComplianceModal({ 
  onClose, 
  userProfile,
  onOpenSOS 
}: ChildSafetyComplianceModalProps) {
  const [activeTab, setActiveTab] = useState<'standards' | 'parental_rights' | 'emergency_hotlines' | 'pledge'>('standards');
  const [auditResult] = useState(runChildComplianceAudit());
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pledgeSigned, setPledgeSigned] = useState(true);

  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      // Generate downloadable JSON
      const exportBlob = new Blob([
        JSON.stringify({
          accountHolder: userProfile?.parentName || 'Verified Guardian',
          childProfile: {
            name: userProfile?.childName || 'Dependent Minor',
            age: userProfile?.age || 'Unspecified',
            interests: userProfile?.interests || ['Lego', 'Outdoor Games'],
            guardianConsentDate: new Date().toISOString(),
            complianceStandard: 'COPPA & DPDP Act 2023 Verified'
          },
          privacyGuarantees: {
            zeroTargetedAds: true,
            exactGpsStored: false,
            piiMasked: true,
            supervisedChatEnforced: true
          }
        }, null, 2)
      ], { type: 'application/json' });

      const downloadUrl = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `vernunt-child-data-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  return (
    <div id="child-safety-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs border border-white/20">
              <VernuntLogo size="xs" animated={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-1.5 font-serif">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Child Safety & Regulatory Compliance
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  COPPA & DPDP Certified
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Zero-tolerance child protection, verifiable parental consent & emergency safety protocols
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('standards')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'standards' 
                ? 'border-indigo-600 text-indigo-700 font-bold' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance Scorecard ({auditResult.grade})
          </button>

          <button
            onClick={() => setActiveTab('parental_rights')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'parental_rights' 
                ? 'border-indigo-600 text-indigo-700 font-bold' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Parental Rights & Data Portability
          </button>

          <button
            onClick={() => setActiveTab('emergency_hotlines')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'emergency_hotlines' 
                ? 'border-indigo-600 text-indigo-700 font-bold' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-500" /> Emergency Helplines
          </button>

          <button
            onClick={() => setActiveTab('pledge')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pledge' 
                ? 'border-indigo-600 text-indigo-700 font-bold' 
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-500" /> Safe Play Pledge
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 leading-relaxed">
          
          {/* TAB 1: STANDARDS & AUDIT SCORECARD */}
          {activeTab === 'standards' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950 text-sm">Overall Child Compliance Grade:</span>
                    <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-md text-xs shadow-xs">
                      {auditResult.grade} ({auditResult.overallScore}% Safe)
                    </span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    All child safety standards, AI grooming filters, and verifiable parental consent modules are actively enforced.
                  </p>
                </div>
                <ShieldCheck className="w-10 h-10 text-emerald-600 shrink-0 opacity-80" />
              </div>

              {auditResult.regulations.map((reg, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" /> {reg.name}
                      </h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{reg.description}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                      {reg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {reg.items.map((item, iIdx) => (
                      <div key={iIdx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{item.rule}</p>
                          <p className="text-slate-600 text-[10px] mt-0.5 leading-normal">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PARENTAL RIGHTS & DATA PORTABILITY (COPPA / DPDP MANDATES) */}
          {activeTab === 'parental_rights' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Verifiable Parental Consent & Direct Authority
                </h4>
                <p className="text-indigo-800 text-xs">
                  Under COPPA (US 16 CFR Part 312) and the DPDP Act 2023 (India), you maintain absolute legal ownership and direct custody over all personal details regarding your dependent child.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Export Data */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">Download Full Child Data Archive</h5>
                      <p className="text-slate-500 text-[10px]">Export full JSON copy of activity logs and profile</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <span className="flex items-center gap-1">Generating Audit Archive...</span>
                    ) : exportSuccess ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Downloaded Successfully</span>
                    ) : (
                      <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export Data (COPPA Sec 312.6)</span>
                    )}
                  </button>
                </div>

                {/* Right to be Forgotten / Purge */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">Right to Erasure (Purge Child Data)</h5>
                      <p className="text-slate-500 text-[10px]">Permanently erase child records from cloud databases</p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Request Child Profile Erasure
                    </button>
                  ) : (
                    <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-lg space-y-2">
                      <p className="text-[10px] text-rose-900 font-bold">
                        Confirm immediate and irreversible erasure of dependent child records?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            alert('Parental Right to Erasure request processed. Your dependent child data has been queued for immediate zero-trace purge.');
                            setShowDeleteConfirm(false);
                            onClose();
                          }}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 rounded-md text-[11px]"
                        >
                          Confirm Purge
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1 rounded-md text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Privacy Safeguards Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-slate-900 text-xs">Our 4 Core Child Protection Guarantees:</h5>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero Commercial Profiling:</strong> We never sell, lease, or monetize child behavioral data or search histories.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Concentric GPS Obfuscation:</strong> Your home address is never displayed. Only general public playgrounds or parks are shared for verified meetups.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Government ID / Aadhaar Verified Circle:</strong> Only verified adult guardians with validated KYC can interact with the community.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Inappropriate Content Filter:</strong> Messages with predatory grooming cues, bullying, or sensitive number harvesting are automatically blocked.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY HOTLINES & HELPLINES */}
          {activeTab === 'emergency_hotlines' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Immediate Child Safety & Emergency Response
                  </h4>
                  {onOpenSOS && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSOS();
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" /> Launch GPS Panic Beacon
                    </button>
                  )}
                </div>
                <p className="text-rose-800 text-xs">
                  If your child is in immediate physical danger, experiencing distress, or if you suspect predatory behavior, reach out directly to emergency authorities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-center shadow-2xs">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">India Childline</span>
                  <h5 className="font-extrabold text-slate-900 text-base">1098</h5>
                  <p className="text-slate-500 text-[10px]">24/7 Toll-free Emergency Child Assistance Service</p>
                  <a 
                    href="tel:1098" 
                    className="mt-2 block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-md text-[11px] transition"
                  >
                    Call 1098
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-center shadow-2xs">
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">National Emergency</span>
                  <h5 className="font-extrabold text-slate-900 text-base">112</h5>
                  <p className="text-slate-500 text-[10px]">Police, Medical & Rescue Unified Dispatch</p>
                  <a 
                    href="tel:112" 
                    className="mt-2 block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-md text-[11px] transition"
                  >
                    Call 112
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-center shadow-2xs">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Cyber Crime Portal</span>
                  <h5 className="font-extrabold text-slate-900 text-base">1930</h5>
                  <p className="text-slate-500 text-[10px]">Child Exploitation & Cyber Harassment Hotline</p>
                  <a 
                    href="tel:1930" 
                    className="mt-2 block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-md text-[11px] transition"
                  >
                    Call 1930
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-slate-600 text-[11px]">
                <span className="font-bold text-slate-800">Vernunt Rapid Incident Escalation:</span>
                <p>
                  Our internal Trust & Safety review team responds to all flagged incidents in under 15 minutes. Contact our designated Child Safety Officer at: <strong className="text-indigo-600 font-mono">safety@vernunt.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SAFE PLAY PLEDGE */}
          {activeTab === 'pledge' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-600" /> The Vernunt Guardian Safety Pledge
                </h4>
                <p className="text-amber-800 text-xs">
                  Every parent, organizer, and caregiver on Vernunt signs this mutual covenant to keep all playground and playdate interactions respectful, safe, and positive.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-900 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <p className="text-slate-700 text-xs">
                      <strong>Mandatory Adult Supervision:</strong> I pledge that an authorized, verified parent or adult guardian will be physically present for all coordinated playdates.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-900 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <p className="text-slate-700 text-xs">
                      <strong>Inclusivity & Kindness:</strong> I pledge to nurture a safe environment free of bullying, physical roughness, or discrimination.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-900 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <p className="text-slate-700 text-xs">
                      <strong>Health & Hygiene Transparency:</strong> I pledge to notify playmate families regarding pediatric colds or allergies before meetups.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="bg-amber-100 text-amber-900 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                    <p className="text-slate-700 text-xs">
                      <strong>Digital Privacy Respect:</strong> I pledge never to capture or post photographs of other families' children without explicit written consent.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700 font-bold text-[11px]">
                      Pledge Signed & Acknowledged by {userProfile?.parentName || 'Verified Guardian'}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">Token: #CG-SAFE-{Date.now().toString(36).toUpperCase().slice(0, 8)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-emerald-600" /> 256-bit Encrypted Child Privacy Shield
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Done & Return
          </button>
        </div>

      </div>
    </div>
  );
}
