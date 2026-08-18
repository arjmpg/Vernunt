import React from 'react';
import { 
  Users, 
  CalendarRange, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Heart,
  Briefcase,
  Layers
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';
import { LanguageCode } from '../utils/dictionary.ts';

export type UserPlatformRole = 'Parent' | 'Event Organizer' | 'Portfolio Professional';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserPlatformRole) => void;
  onClose?: () => void;
  verifiedEmail?: string;
  verifiedPhone?: string;
  language?: LanguageCode;
}

export default function RoleSelectionModal({
  isOpen,
  onSelectRole,
  onClose,
  verifiedEmail,
  verifiedPhone,
  language = 'en'
}: RoleSelectionModalProps) {
  if (!isOpen) return null;

  const contactLabel = verifiedPhone 
    ? verifiedPhone 
    : (verifiedEmail || 'Verified User');

  return (
    <div 
      id="role-selection-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        id="role-selection-modal-card" 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-8 animate-scale-up"
      >
        {/* Top decorative gradient bar */}
        <div className="h-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 w-full"></div>

        {/* Modal close button (if dismissible) */}
        {onClose && (
          <button
            id="btn-close-role-modal"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Section */}
        <div className="p-6 md:p-8 pb-4 text-center space-y-3">
          <div className="flex justify-center">
            <VernuntLogo size="lg" animated={true} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified: <span className="font-mono font-semibold">{contactLabel}</span></span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Select Your Registration Profile
          </h2>
          <p className="text-xs md:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Welcome to Vernunt! Your identity credentials have been verified. Please select how you wish to participate on the network to complete your profile setup:
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="p-6 md:p-8 pt-2 space-y-4">
          
          {/* Card 1: Parent & Child Profile */}
          <button
            id="role-btn-parent"
            type="button"
            onClick={() => onSelectRole('Parent')}
            className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-rose-150 hover:border-rose-500 bg-gradient-to-br from-white to-rose-50/40 hover:from-rose-50/60 hover:to-orange-50/60 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-rose-700 transition flex items-center gap-2">
                  Parent & Child Profile
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                    Most Popular
                  </span>
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect with verified neighborhood families, match children by age & play styles, coordinate safe playdates, and access our emergency SOS community network.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-rose-700">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Aadhaar Trust Badging</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Playmate Radar Matching</span>
              </div>
            </div>
          </button>

          {/* Card 2: Event & Activity Host */}
          <button
            id="role-btn-host"
            type="button"
            onClick={() => onSelectRole('Event Organizer')}
            className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-amber-150 hover:border-amber-500 bg-gradient-to-br from-white to-amber-50/40 hover:from-amber-50/60 hover:to-orange-50/60 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-amber-700 transition flex items-center gap-2">
                  Event & Activity Host
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-850 px-2 py-0.5 rounded-md border border-amber-200">
                    Business / Clubs
                  </span>
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Publish kids workshops, weekend activity camps, sports clinics, pottery, robotics, and birthday events. Collect registrations with secure QR entry passes.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-amber-800">
                <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Direct Community Ticketing</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Host Management Hub</span>
              </div>
            </div>
          </button>

          {/* Card 3: Portfolio Specialist & Mentor */}
          <button
            id="role-btn-specialist"
            type="button"
            onClick={() => onSelectRole('Portfolio Professional')}
            className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-indigo-150 hover:border-indigo-500 bg-gradient-to-br from-white to-indigo-50/40 hover:from-indigo-50/60 hover:to-blue-50/60 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition flex items-center gap-2">
                  Portfolio Specialist / Mentor
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded-md border border-indigo-200">
                    Specialist
                  </span>
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Showcase your expertise as a child psychologist, pediatric nutrition counselor, music/art instructor, academic tutor, or sports trainer to local parents.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-indigo-700">
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Verified Certifications</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Appointment Booking</span>
              </div>
            </div>
          </button>

        </div>

        {/* Footer Note */}
        <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          🔒 Vernunt uses end-to-end encrypted child safety standards & strict guardian verification.
        </div>
      </div>
    </div>
  );
}
