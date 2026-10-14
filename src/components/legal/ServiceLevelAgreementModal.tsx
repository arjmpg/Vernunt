import React, { useState } from 'react';
import { 
  X, ShieldCheck, Printer, CheckCircle2, AlertTriangle, 
  Clock, HeartHandshake, FileText, Scale, ExternalLink,
  ChevronRight, Building2, Sparkles, Award
} from 'lucide-react';
import VernuntLogo from '../VernuntLogo.tsx';
import { VERNUNT_SLA_DEFINITIONS, SLADefinition, getSLAForRole } from '../../data/slaAgreements.ts';

interface ServiceLevelAgreementModalProps {
  isOpen: boolean;
  roleOrType?: string;
  onClose: () => void;
  onAccept?: () => void;
  isAccepted?: boolean;
  acceptedAt?: string;
  showAcceptButton?: boolean;
}

export default function ServiceLevelAgreementModal({
  isOpen,
  roleOrType = 'daycare',
  onClose,
  onAccept,
  isAccepted = false,
  acceptedAt,
  showAcceptButton = false
}: ServiceLevelAgreementModalProps) {
  const initialSla = getSLAForRole(roleOrType);
  const [selectedSlaId, setSelectedSlaId] = useState<string>(initialSla.id);
  const currentSla: SLADefinition = VERNUNT_SLA_DEFINITIONS[selectedSlaId] || initialSla;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="sla-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[99999] overflow-y-auto font-sans animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="sla-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 transform transition-all flex flex-col max-h-[92vh] my-auto text-left"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shrink-0 shadow-xs">
              <VernuntLogo size="xs" animated={false} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 font-mono">
                  Vernunt B2B Regulatory &amp; Service Level Center
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                  {currentSla.version}
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  Effective: {currentSla.effectiveDate}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base font-serif text-white flex items-center gap-1.5 mt-0.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>{currentSla.officialName}</span>
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="Print SLA Document"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer hidden sm:flex items-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SLA Role Switcher Pills */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none no-scrollbar">
          {Object.values(VERNUNT_SLA_DEFINITIONS).map((def) => {
            const isCurrent = def.id === currentSla.id;
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setSelectedSlaId(def.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-indigo-950 shadow-xs border border-indigo-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{def.roleTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 leading-relaxed text-xs sm:text-sm">
          
          {/* Top Status & Statutory Alert Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-slate-50 to-emerald-50/80 border border-indigo-100 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentSla.badge}</span>
              </span>
              
              {isAccepted ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>SLA Accepted &bull; {acceptedAt ? new Date(acceptedAt).toLocaleDateString() : 'Signed Active'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mandatory Sign-Up Acceptance Required</span>
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-700 font-medium">
              {currentSla.overview}
            </p>
            
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Statutory Alignment: {currentSla.statutoryBacking}</span>
            </div>
          </div>

          {/* Key Binding Service Level Metrics Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Mandatory Service Delivery Targets &amp; Latency SLAs</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentSla.metrics.map((m, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 hover:border-indigo-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">{m.metric}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200 shrink-0 font-mono">
                      {m.target}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-normal">
                    {m.description}
                  </p>
                  <div className="pt-1.5 border-t border-slate-100 text-[10.5px] text-rose-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>Breach consequence: {m.consequence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contractual Clauses */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Operational Commitments &amp; Safety Governance</span>
            </h4>

            <div className="space-y-3">
              {currentSla.sections.map((sec, sIdx) => (
                <div key={sIdx} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>{sec.title}</span>
                  </h5>
                  <ul className="space-y-1.5 pl-3">
                    {sec.clauses.map((clause, cIdx) => (
                      <li key={cIdx} className="text-[11.5px] text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="text-indigo-500 font-bold mt-0.5">•</span>
                        <span>{clause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Breach Remedies & Dispute Resolution */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4.5 space-y-2">
            <h5 className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Graduated Escalation &amp; Breach Enforcement Policy</span>
            </h5>
            <ul className="space-y-1 pl-2 text-[11px] text-rose-900/90 leading-relaxed">
              {currentSla.breachRemedies.map((remedy, rIdx) => (
                <li key={rIdx} className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-600">&bull;</span>
                  <span>{remedy}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Signatory Legal Note */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200">Legal Binding &amp; Electronic Signature</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              By checking the agreement box during the Vernunt registration or portfolio publishing workflow, you represent that you are an authorized signatory of the registering entity, have reviewed the SLA metrics above, and agree to be bound by these performance standards and remedial actions under the Information Technology Act 2000 and applicable Indian laws.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close SLA Document
          </button>

          {showAcceptButton && onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept &amp; Bind to {currentSla.roleTitle} SLA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
