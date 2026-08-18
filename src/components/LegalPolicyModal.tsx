import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';

interface LegalPolicyModalProps {
  onKeepClose: () => void;
}

export default function LegalPolicyModal({ onKeepClose }: { onKeepClose: () => void }) {
  return (
    <div id="legal-policy-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div id="legal-box" className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all flex flex-col max-h-[85vh] my-auto">
        <div id="legal-header" className="px-6 py-4 bg-slate-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shrink-0">
              <VernuntLogo size="xs" animated={false} />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 font-serif">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Terms & Privacy Guard
            </h3>
          </div>
          <button 
            id="btn-close-legal"
            onClick={onKeepClose} 
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="legal-body" className="p-6 space-y-4 overflow-y-auto text-xs text-slate-600 leading-relaxed flex-1">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-[11px] font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>COPPA & DPDP Act 2023 Child Privacy Certified:</strong> Vernunt enforces zero-targeted advertising, verifiable guardian consent, and end-to-end PII obfuscation for all child data.
            </span>
          </div>

          <h4 className="font-bold text-slate-800 text-sm font-serif">1. Playground Respect & Supervised Playdate Mandate</h4>
          <p>
            By coordinating matches or playgroups on Vernunt, you represent that you are the verified parent or legal guardian of the dependent minor, that your child has received up-to-date pediatric boosters (including MMR & DTaP clearances), and that an adult guardian will remain in physical attendance for all offline playground meetings.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">2. COPPA & DPDP Verifiable Parental Consent (VPC)</h4>
          <p>
            In accordance with 16 CFR Part 312 (COPPA) and Section 9 of India's DPDP Act 2023, direct registration by minors under 13 is strictly prohibited. All dependent records are created solely with verifiable parental consent via government ID and Aadhaar multi-factor verification.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">3. Zero-Targeted-Advertising & Concentric Location Masking</h4>
          <p>
            Vernunt guarantees that child behavioral patterns and play preferences are never sold, rented, or monetized for commercial advertising. Furthermore, exact residential addresses are never stored or exposed; proximity radar is rounded to general public parks and verified school zones.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">4. Parental Rights: Right to Access, Export & Erase</h4>
          <p>
            Parents maintain unconditional rights to review dependent child records, download full portable data archives, or trigger immediate, permanent erasure (Right to be Forgotten) through the Child Safety & Compliance Center.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">5. Anti-Harassment & Automated Content Moderation</h4>
          <p>
            All communications are screened by real-time linguistic filters blocking cyberbullying, predatory secrecy cues, and unauthorized contact harvesting. Violating profiles are permanently banned and reported to relevant child protection authorities.
          </p>

          <p className="text-[10px] text-slate-400 italic pt-2">
            Last Audited & Certified: August 2026. Designated Child Safety Officer: safety@vernunt.com
          </p>
        </div>

        <div id="legal-footer" className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            id="btn-confirm-legal"
            onClick={onKeepClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition animate-pulse"
          >
            I Agree to Terms
          </button>
        </div>
      </div>
    </div>
  );
}
