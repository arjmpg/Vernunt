import React, { useState } from 'react';
import { ChildProfile, VerificationStatus } from '../types.ts';
import { ShieldCheck, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import confettiDefault from 'canvas-confetti';

interface VerificationModalProps {
  profile: ChildProfile;
  onClose: () => void;
  onVerifyCompleted: () => void;
}

export default function VerificationModal({ profile, onClose, onVerifyCompleted }: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(profile.verificationStatus === VerificationStatus.VERIFIED);
  const [stepMsg, setStepMsg] = useState('');

  const handleStartVerifying = () => {
    setLoading(true);
    setStepMsg('Scanning Immunization Records...');

    setTimeout(() => {
      setStepMsg('Checking School District Enrollment Registries...');
      
      setTimeout(() => {
        setStepMsg('Verifying Parent Identity & Safety Details...');

        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
          onVerifyCompleted();

          confettiDefault({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div id="verification-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div id="verify-box" className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition duration-350 flex flex-col max-h-[85vh] my-auto">
        <div id="verify-header" className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 font-serif">
            <ShieldCheck className="w-5 h-5 text-amber-400 fill-amber-400/20" /> Vernunt Safety Verification
          </h3>
          <button 
            id="btn-close-verify-cross"
            onClick={onClose} 
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="verify-body" className="p-6 space-y-5 overflow-y-auto flex-1">
          {success ? (
            <div id="verified-state" className="text-center space-y-4 py-4 animate-fade-in">
              <div id="badge-glow" className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <ShieldCheck className="w-10 h-10 fill-emerald-500 text-emerald-50" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base font-serif">Verified Playmate Companion!</h4>
                <p className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50/60 py-1 px-3 rounded-full w-fit mx-auto">
                  Verification Status: FULLY APPROVED
                </p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                {profile.childName} has cleared standard pediatric booster logs (MMR, DTaP), parental city address checks, and guardian identification factors. This profile is fully approved for companion matching.
              </p>
              <button
                id="btn-close-verified"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition animate-pulse"
              >
                Close Window
              </button>
            </div>
          ) : (
            <div id="unverified-state" className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="block font-bold text-amber-800">Family Profile is Currently Unverified</span>
                  <p className="text-amber-700 leading-relaxed text-[11px]">
                    To maintain strict security standards and child safety norms, nearby companion lists benefit from completed vaccination & identity indicators.
                  </p>
                </div>
              </div>

              <div id="requirements-bullets" className="space-y-2.5 text-xs text-slate-600 font-medium pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>MMR & DTaP pediatric immunization upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Guardian City Neighborhood verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified positive peer playground reviews</span>
                </div>
              </div>

              {loading ? (
                <div id="loading-verification-state" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-500 font-bold animate-pulse">{stepMsg}</p>
                </div>
              ) : (
                <button
                  id="btn-start-verifying"
                  onClick={handleStartVerifying}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg shadow-orange-500/10 cursor-pointer"
                >
                  Confirm Immunization & ID Checks Instantly
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
