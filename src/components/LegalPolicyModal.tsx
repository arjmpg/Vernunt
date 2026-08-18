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
          <h4 className="font-bold text-slate-800 text-sm font-serif">1. Playground Respect & Safety Standards</h4>
          <p>
            By coordinating matches or playgroups on Vernunt, you represent that your child has received up-to-date pediatric boosters (including MMR & DTaP clearances) and that you respect regional daycare or playground guidelines. Parents or guardians must attend and supervise playground matches.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">2. High-Tech Proximity Mapping Guard</h4>
          <p>
            To prevent unsolicited address listing or coordinate leaks, Vernunt implements concentric coordinates rounding. Exact residential addresses are never shared; parents interact safely at public play areas.
          </p>

          <h4 className="font-bold text-slate-800 text-sm font-serif">3. Anti-Harassment & Safety Requirements</h4>
          <p>
            Any formal reports of bullying, inappropriate behaviors, or fraudulent guardian registrations are reviewed with priority. Violating profiles are subject to immediate and permanent exclusion.
          </p>

          <p className="text-[10px] text-slate-400 italic pt-2">
            Last Updated: May 2026. Vernunt values and respects your household safety. Happy playing!
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
