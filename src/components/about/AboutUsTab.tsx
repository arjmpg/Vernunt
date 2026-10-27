import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  MapPin,
  Heart,
  Sparkles,
  CheckCircle2,
  Building2,
  Lock,
  FileCheck2,
  Users,
  ArrowRight,
  Compass,
  PhoneCall
} from 'lucide-react';
import { LEADERSHIP_TEAM, TeamMember } from './AboutUsModal';

interface AboutUsTabProps {
  onOpenSafetyCompliance?: () => void;
  onOpenContactUs?: () => void;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({
  onOpenSafetyCompliance,
  onOpenContactUs
}) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div className="space-y-10 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>India's 1st Verified Neighborhood Kids Ecosystem</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Building Trusted Neighborhoods for India's Next Generation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Vernunt connects verified parents, pediatric specialists, certified daycares, and local sports playmates within a safe walking radius. Founded in Bengaluru, we are driven by the belief that every child deserves active, outdoor playmates without safety compromises.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DigiLocker Govt ID Verification</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>DPDP Act 2023 Child Privacy Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Bengaluru Headquarters &bull; Pan-India Reach</span>
            </div>
          </div>
        </div>
      </div>

      {/* LEADERSHIP & OUR TEAM SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Meet Our Leadership Team
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Visionary Leadership &amp; Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Guided by top-tier investment banking, Chartered Accountancy audit mastery, and 15+ years of retail marketing excellence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              3 Senior Executives &bull; Bengaluru HQ
            </span>
          </div>
        </div>

        {/* 3 Executive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {LEADERSHIP_TEAM.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-indigo-300"
            >
              {/* Photo Banner with subtle zoom */}
              <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4F46E5&color=fff&size=512`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                {/* Overlay Text */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-block px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white mb-1.5 border border-white/20">
                    {member.titleBadge}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium mt-0.5">
                    {member.role}
                  </p>
                </div>

                {/* Top Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-bold shadow-md backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                
                {/* Meta details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{member.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{member.education}</span>
                  </div>

                  {/* Attractive, easy-to-read bio paragraphs */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {member.detailedParagraphs.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-xs text-slate-600 leading-relaxed font-normal">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Key competencies tags */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Core Specializations &amp; Leadership
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.coreCompetencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-900 text-[11px] font-medium border border-indigo-100"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verified credentials badge row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {member.verifiedBadges.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vernunt Values & Safety Pillar Section */}
      <section className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/80 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Our Core Pillars
          </span>
          <h3 className="text-2xl font-bold text-slate-900">
            Why Indian Families Trust Vernunt
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered from ground up with parent peace-of-mind, cryptographic child identity protection, and real-world neighborhood camaraderie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero Anonymous Profiles</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every parent profile connects through Aadhaar/DigiLocker identity attestation. Verified badge guarantees you are speaking with a real neighborhood parent.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">DPDP Act 2023 Compliance</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict compliance with India’s Digital Personal Data Protection Act. We never sell contact information, display phone numbers publicly, or run ad trackers.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Escrow-Backed Commerce</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Curated, non-toxic toys and certified kids’ essentials. Buyer funds stay protected in compliance escrow until items arrive verified and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Support Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h4 className="text-lg font-bold text-white">Have questions or want to partner with Vernunt?</h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Our leadership team and child safety officers are based at our Indiranagar, Bengaluru campus and are accessible to parents, pediatricians, and certified educators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenContactUs && (
            <button
              type="button"
              onClick={onOpenContactUs}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Contact Leadership
            </button>
          )}
          {onOpenSafetyCompliance && (
            <button
              type="button"
              onClick={onOpenSafetyCompliance}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 cursor-pointer"
            >
              Child Safety Protocol
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
