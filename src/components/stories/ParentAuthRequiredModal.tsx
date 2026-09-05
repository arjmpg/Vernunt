import React from 'react';
import { X, ShieldAlert, UserCheck, Lock, Sparkles, ArrowRight, HeartHandshake, Shield } from 'lucide-react';

interface ParentAuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  kidName: string;
  onLogin: () => void;
  onRegister: () => void;
}

export const ParentAuthRequiredModal: React.FC<ParentAuthRequiredModalProps> = ({
  isOpen,
  onClose,
  kidName,
  onLogin,
  onRegister
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Banner with Child Safety Aesthetic */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white p-6 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-orange-400" /> Child Safety Protocol
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xl font-bold font-serif leading-tight">
            Verified Parent Access Required for Search Radar
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Public milestone stories can be freely read by anyone. However, connecting with <span className="font-bold text-white">{kidName}</span> and viewing neighborhood radar coordinates requires a verified parent account.
          </p>
        </div>

        {/* Value Points */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Neighborhood Proximity Protection</h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Exact playmate GPS coordinates, parent phone numbers, and school routes are never exposed to anonymous guests.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">Verified Parent Community</h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  All playdate requests and radar connections are monitored under Bangalore's trusted parent safety framework.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4" /> Sign Up as a Verified Parent (Free)
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogin();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Already Registered? Log In to Connect on Radar
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            Guest reading is always 100% free • No login required to read kid stories
          </p>
        </div>

      </div>
    </div>
  );
};

export default ParentAuthRequiredModal;
