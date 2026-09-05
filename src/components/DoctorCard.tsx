import React, { memo } from 'react';
import { SpecialistProfile } from '../types.ts';
import { 
  Star, Building2, GraduationCap, MapPin, ShieldCheck, 
  Stethoscope, Briefcase, Phone, Share2, Navigation, CheckCircle
} from 'lucide-react';
import { formatVernuntReviewText, FALLBACK_DOCTOR_PHOTO } from '../utils/specialistUrls.ts';
import { formatDistanceKm } from '../utils/geoDistance.ts';

interface DoctorCardProps {
  spec: SpecialistProfile;
  onOpenPortfolio: (spec: SpecialistProfile) => void;
  onStartBooking: (spec: SpecialistProfile) => void;
  onWhatsAppShare: (spec: SpecialistProfile) => void;
  onClaimProfile?: (spec: SpecialistProfile) => void;
}

const DoctorCardComponent: React.FC<DoctorCardProps> = ({
  spec,
  onOpenPortfolio,
  onStartBooking,
  onWhatsAppShare,
  onClaimProfile,
}) => {
  return (
    <div
      id={`spec-card-${spec.id}`}
      className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group relative"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '460px' }}
    >
      {/* Top background aesthetic aura */}
      <div className="h-24 bg-gradient-to-tr from-slate-50 to-orange-50/50 p-4 flex justify-between items-start">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase bg-white/80 backdrop-blur-xs text-orange-600 tracking-wider px-2.5 py-1 rounded-lg border border-orange-100/30">
            {spec.category}
          </span>
          {spec.distanceKm !== undefined && (
            <span 
              title="Distance from your detected location"
              className="text-[10px] font-bold text-slate-700 bg-white/85 backdrop-blur-xs px-2 py-0.8 rounded-lg border border-slate-200/80 flex items-center gap-1 text-slate-800"
            >
              <Navigation className="w-2.5 h-2.5 text-rose-500 fill-rose-500 shrink-0" />
              {formatDistanceKm(spec.distanceKm)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-100">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-slate-700">{spec.rating}</span>
          <span className="text-[9px] text-slate-400">({spec.reviewsCount})</span>
        </div>
      </div>

      {/* Face and Details */}
      <div className="px-6 pb-5 pt-0 flex-1 flex flex-col -mt-10">
        <div className="flex items-end gap-3 mb-3">
          <img
            src={spec.photoUrl}
            alt={spec.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_DOCTOR_PHOTO;
            }}
            className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-extrabold text-slate-800 text-sm font-serif truncate">{spec.name}</h4>
              {spec.claimed && (
                <span title="Claimed and Verified by Doctor" className="text-emerald-600 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" />
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-orange-500 leading-tight truncate">{spec.title}</p>
          </div>
        </div>

        {/* Hospital Affiliation, Qualifications & Location if present */}
        {(spec.hospitalAffiliation || spec.qualifications || spec.location) && (
          <div className="mb-3 p-2.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-xs">
            {spec.hospitalAffiliation && (
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{spec.hospitalAffiliation}</span>
              </div>
            )}
            {spec.qualifications && (
              <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{spec.qualifications}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{spec.clinicAddress || spec.location}</span>
            </div>
          </div>
        )}

        <p className="text-[11.5px] text-slate-600 leading-relaxed mb-3 line-clamp-2">
          {spec.bio}
        </p>

        {/* Vernunt Verified Clinical Review & Direct Clinic Care */}
        <div className="mb-3 space-y-1">
          {spec.googleRatingText && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-rose-800 bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-200/60 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">Vernunt Verified • {formatVernuntReviewText(spec.googleRatingText)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] text-teal-800 bg-teal-50/70 px-2 py-0.5 rounded-lg border border-teal-200/50 font-bold">
            <span>✓ Direct Clinic Appointment</span>
            <span className="text-teal-600 font-medium">Zero Convenience Markups</span>
          </div>
        </div>

        {/* Badges/Tags of Speciality */}
        <div className="flex flex-wrap gap-1 mb-4">
          {spec.specialties.slice(0, 3).map((tag, tIdx) => (
            <span
              key={tIdx}
              className="bg-slate-50 text-slate-600 border border-slate-100 text-[9.5px] font-bold px-2 py-0.5 rounded-md truncate max-w-[130px]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Pricing, Experience, and Actions at bottom */}
        <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Experience</span>
            <span className="font-black text-slate-700">{spec.experienceYears} Years Prof</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Session Fee</span>
            <span className="font-black text-rose-600 text-sm">₹{spec.sessionFee} <span className="text-[9px] text-slate-500 font-medium">/ slot</span></span>
          </div>
        </div>

        {/* Multi-action controls */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              id={`btn-view-portfolio-${spec.id}`}
              onClick={() => onOpenPortfolio(spec)}
              type="button"
              className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-rose-600" /> View Portfolio
            </button>

            <button
              id={`btn-book-session-${spec.id}`}
              onClick={() => onStartBooking(spec)}
              type="button"
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" /> Book Slot
            </button>
          </div>

          <div className="flex items-center gap-2">
            {spec.phone && (
              <a
                href={`tel:${spec.phone}`}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1"
                title="Call reception"
              >
                <Phone className="w-3 h-3 text-emerald-600" /> Call Clinic
              </a>
            )}

            <button
              id={`btn-share-spec-whatsapp-${spec.id}`}
              type="button"
              onClick={() => onWhatsAppShare(spec)}
              className={`${spec.phone ? 'flex-1' : 'w-full'} py-1.5 px-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-[11px] font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5`}
              title="Share consultant on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" /> Share WhatsApp
            </button>
          </div>

          {/* Claim Portfolio Button / Trust Status */}
          <div className="mt-1 pt-1 border-t border-slate-100 text-center">
            {spec.claimed ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified &amp; Claimed by Doctor
              </span>
            ) : spec.claimStatus === 'pending' ? (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                ⏳ Claim Under Verification
              </span>
            ) : onClaimProfile ? (
              <button
                type="button"
                id={`btn-claim-portfolio-${spec.id}`}
                onClick={() => onClaimProfile(spec)}
                className="text-[10.5px] font-semibold text-slate-400 hover:text-rose-600 transition inline-flex items-center gap-1 cursor-pointer"
                title="Verify medical credentials and manage appointments"
              >
                Are you {spec.name.replace(/^(Dr\.?\s*)/i, 'Dr. ')}? <span className="underline underline-offset-2 font-bold text-rose-600">Claim Portfolio</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DoctorCard = memo(DoctorCardComponent);
