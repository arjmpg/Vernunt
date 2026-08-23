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
  Layers,
  Building2,
  Baby,
  FileCheck
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';
import { LanguageCode } from '../utils/dictionary.ts';

export type UserPlatformRole = 'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        id="role-selection-modal-card" 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto animate-scale-up"
      >
        {/* Top decorative gradient bar */}
        <div className="h-2 sm:h-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500 w-full shrink-0"></div>

        {/* Modal close button (if dismissible) */}
        {onClose && (
          <button
            id="btn-close-role-modal"
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1">
          {/* Header Section */}
          <div className="p-5 sm:p-6 md:p-8 pb-3 sm:pb-4 text-center space-y-2.5 sm:space-y-3">
            <div className="flex justify-center">
              <VernuntLogo size="md" animated={true} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified: <span className="font-mono font-semibold">{contactLabel}</span></span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-slate-900 tracking-tight leading-tight">
              Select Your Registration Profile
            </h2>
            <p className="text-[11.5px] sm:text-xs md:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Welcome to Vernunt! Your identity credentials have been verified. Please select how you wish to participate on the network:
            </p>
          </div>

          {/* 4 Role Selection Cards */}
          <div className="p-4 sm:p-6 md:p-8 pt-1 sm:pt-2 space-y-3 sm:space-y-3.5">
            
            {/* Card 1: Parent & Child Profile */}
            <button
              id="role-btn-parent"
              type="button"
              onClick={() => onSelectRole('Parent')}
              className="w-full text-left p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 border-rose-150 hover:border-rose-500 bg-gradient-to-br from-white to-rose-50/40 hover:from-rose-50/70 hover:to-orange-50/70 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-3 sm:gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform mt-0.5">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-rose-700 transition leading-snug">
                      Parent & Child Profile
                    </h3>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200 whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                </div>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
                  Connect with verified neighborhood families, match playmates, book local sitters, coordinate safe playdates, or host your own home daycare co-op.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 w-full">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    🎁 1 Year 100% Free Pass
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Aadhaar Trust Badging</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Playmate & Daycare Access</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Card 2: Daycare Center & Pre-school Registration */}
            <button
              id="role-btn-daycare-center"
              type="button"
              onClick={() => onSelectRole('Daycare Center')}
              className="w-full text-left p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 border-teal-150 hover:border-teal-500 bg-gradient-to-br from-white to-teal-50/40 hover:from-teal-50/70 hover:to-emerald-50/70 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-3 sm:gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform mt-0.5">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition leading-snug">
                      Daycare Center / Pre-school / Creche
                    </h3>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-850 px-2 py-0.5 rounded-md border border-teal-200 whitespace-nowrap">
                      Daycare & Playhome
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                </div>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
                  Register commercial daycares, Montessori early learning centers, infant creches, or certified playhomes. Upload government licenses, set hourly/monthly fees, and accept verified bookings.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 w-full">
                  <span className="inline-flex items-center gap-1 font-bold text-teal-850 bg-teal-50 border border-teal-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    🎁 6 Months 100% Free Listing
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <FileCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Govt License & Safety Docs</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Baby className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct Admissions & Care</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Card 3: Event & Activity Host */}
            <button
              id="role-btn-host"
              type="button"
              onClick={() => onSelectRole('Event Organizer')}
              className="w-full text-left p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 border-amber-150 hover:border-amber-500 bg-gradient-to-br from-white to-amber-50/40 hover:from-amber-50/70 hover:to-orange-50/70 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-3 sm:gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform mt-0.5">
                <CalendarRange className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-amber-700 transition leading-snug">
                      Events, Class and Activities Host
                    </h3>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-850 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                      Business / Clubs
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                </div>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
                  Publish kids workshops, weekend activity camps, sports clinics, pottery, robotics, and birthday events. Collect registrations with secure QR entry passes.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 w-full">
                  <span className="inline-flex items-center gap-1 font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    🎁 6 Months 100% Free Pass
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Direct Ticketing</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Briefcase className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Host Hub</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Card 4: Portfolio Specialist & Mentor */}
            <button
              id="role-btn-specialist"
              type="button"
              onClick={() => onSelectRole('Portfolio Professional')}
              className="w-full text-left p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 border-indigo-150 hover:border-indigo-500 bg-gradient-to-br from-white to-indigo-50/40 hover:from-indigo-50/70 hover:to-blue-50/70 transition-all duration-200 shadow-sm hover:shadow-md group flex items-start gap-3 sm:gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform mt-0.5">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition leading-snug">
                      Portfolio Specialist / Mentor
                    </h3>
                    <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded-md border border-indigo-200 whitespace-nowrap">
                      Specialist
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
                </div>
                <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
                  Showcase your expertise as a child psychologist, pediatric nutrition counselor, music/art instructor, academic tutor, or sports trainer to local parents.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 w-full">
                  <span className="inline-flex items-center gap-1 font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    🎁 6 Months 100% Free Listing
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Verified Certifications</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-[11px] whitespace-nowrap shadow-2xs">
                    <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Booking Portal</span>
                  </span>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10.5px] sm:text-xs text-slate-500 shrink-0">
          🔒 Vernunt uses end-to-end encrypted child safety standards & strict guardian verification.
        </div>
      </div>
    </div>
  );
}
