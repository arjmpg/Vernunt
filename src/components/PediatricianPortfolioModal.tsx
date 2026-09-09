import React, { useState, useEffect } from 'react';
import { SpecialistProfile, ChildProfile } from '../types.ts';
import { 
  X, Star, MapPin, Calendar, Clock, Phone,
  Award, ShieldCheck, CheckCircle2, Share2, 
  Stethoscope, Building2, GraduationCap, Languages, HeartHandshake,
  Check, Camera, QrCode, ExternalLink, Globe, Sparkles, Upload, RefreshCw, AlertCircle
} from 'lucide-react';
import { openWhatsAppShare } from '../utils/affiliate.ts';
import { 
  formatVernuntReviewText, 
  getSpecialistDirectUrl, 
  getSpecialistShareData, 
  FALLBACK_DOCTOR_PHOTO 
} from '../utils/specialistUrls.ts';

interface PediatricianPortfolioModalProps {
  specialist: SpecialistProfile | null;
  onClose: () => void;
  onBookSlot: (specialist: SpecialistProfile) => void;
  currentProfile: ChildProfile | null;
  onUpdateSpecialist?: (updated: SpecialistProfile) => void;
  onClaimProfile?: (specialist: SpecialistProfile) => void;
}

export default function PediatricianPortfolioModal({
  specialist,
  onClose,
  onBookSlot,
  currentProfile: _currentProfile,
  onUpdateSpecialist,
  onClaimProfile
}: PediatricianPortfolioModalProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [photoError, setPhotoError] = useState(false);
  const [isSyncingPhoto, setIsSyncingPhoto] = useState(false);
  const [photoSyncMessage, setPhotoSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Clean specialist name formatting (preserves titles like Coach, Dt., Ms., Mr., and avoids double "Dr. Dr.")
  const cleanDocName = specialist 
    ? (
        specialist.name.startsWith('Dr.') || 
        specialist.name.startsWith('Coach') || 
        specialist.name.startsWith('Dt.') || 
        specialist.name.startsWith('Ms.') || 
        specialist.name.startsWith('Mr.') ||
        specialist.category === 'Coach' ||
        specialist.category === 'Nutritionist'
          ? specialist.name 
          : `Dr. ${specialist.name}`
      )
    : '';

  const directUrl = specialist ? getSpecialistDirectUrl(specialist.id) : '';
  const shareData = specialist ? getSpecialistShareData(specialist) : { title: '', text: '' };

  // Google SEO Canonical Tag, Dynamic Title & Schema.org JSON-LD structured data
  useEffect(() => {
    if (!specialist) return;
    const prevTitle = document.title;
    document.title = `${cleanDocName} (${specialist.title}) - Vernunt Child Specialists Bangalore`;

    // 1. Google SEO Canonical Tag (invisible in UI, indexed by Google)
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    let createdCanonical = false;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
      createdCanonical = true;
    }
    const prevCanonicalHref = canonicalLink.href;
    canonicalLink.href = directUrl;

    // 2. Google SEO Schema.org Physician JSON-LD
    const scriptId = 'seo-pediatrician-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Physician",
      "name": cleanDocName,
      "description": specialist.bio,
      "image": specialist.photoUrl,
      "medicalSpecialty": "Pediatrics",
      "telephone": specialist.phone,
      "priceRange": `₹${specialist.sessionFee}`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": specialist.clinicAddress || specialist.location,
        "addressLocality": "Bangalore",
        "addressRegion": "Karnataka",
        "addressCountry": "IN"
      },
      "url": directUrl
    });

    return () => {
      document.title = prevTitle;
      if (canonicalLink) {
        if (createdCanonical) {
          canonicalLink.remove();
        } else {
          canonicalLink.href = prevCanonicalHref;
        }
      }
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [specialist, directUrl, cleanDocName]);

  if (!specialist) return null;

  const handleWhatsAppShare = () => {
    openWhatsAppShare(shareData.text);
  };

  const handleSaveCustomPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhotoInput.trim()) return;
    if (onUpdateSpecialist) {
      onUpdateSpecialist({
        ...specialist,
        photoUrl: customPhotoInput.trim()
      });
    }
    setShowPhotoEditModal(false);
    setPhotoError(false);
    setPhotoSyncMessage(null);
  };

  // Real-time photo extraction from Clinic, Hospital, or Direct Image URL
  const handleExtractFromUrl = async () => {
    if (!customPhotoInput.trim()) {
      setPhotoSyncMessage({ type: 'error', text: 'Please enter a URL to extract doctor photo.' });
      return;
    }
    setIsSyncingPhoto(true);
    setPhotoSyncMessage(null);
    try {
      const resp = await fetch('/api/extract-doctor-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: specialist.id,
          doctorName: specialist.name,
          sourceUrl: customPhotoInput.trim(),
          imageUrl: customPhotoInput.trim()
        })
      });
      const data = await resp.json();
      if (data.success && data.photoUrl) {
        if (onUpdateSpecialist) {
          onUpdateSpecialist({
            ...specialist,
            photoUrl: data.photoUrl
          });
        }
        setPhotoError(false);
        setPhotoSyncMessage({ type: 'success', text: '✓ Real doctor photo synced and saved!' });
        setTimeout(() => {
          setShowPhotoEditModal(false);
          setPhotoSyncMessage(null);
        }, 1200);
      } else {
        if (onUpdateSpecialist) {
          onUpdateSpecialist({
            ...specialist,
            photoUrl: customPhotoInput.trim()
          });
        }
        setPhotoError(false);
        setPhotoSyncMessage({ type: 'success', text: '✓ Photo link updated successfully!' });
        setTimeout(() => {
          setShowPhotoEditModal(false);
          setPhotoSyncMessage(null);
        }, 1200);
      }
    } catch (err: any) {
      setPhotoSyncMessage({ type: 'error', text: err.message || 'Could not sync photo. Please upload image directly.' });
    } finally {
      setIsSyncingPhoto(false);
    }
  };

  // Direct Device Upload (Camera / Gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncingPhoto(true);
    setPhotoSyncMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const resp = await fetch('/api/extract-doctor-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: specialist.id,
            doctorName: specialist.name,
            imageBase64: base64
          })
        });
        const data = await resp.json();
        if (data.success && data.photoUrl) {
          if (onUpdateSpecialist) {
            onUpdateSpecialist({
              ...specialist,
              photoUrl: data.photoUrl
            });
          }
          setPhotoError(false);
          setPhotoSyncMessage({ type: 'success', text: '✓ Portrait photo uploaded and updated!' });
          setTimeout(() => {
            setShowPhotoEditModal(false);
            setPhotoSyncMessage(null);
          }, 1200);
        } else {
          setPhotoSyncMessage({ type: 'error', text: data.error || 'Failed to upload image.' });
        }
      } catch (err: any) {
        setPhotoSyncMessage({ type: 'error', text: 'Network error uploading image.' });
      } finally {
        setIsSyncingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(directUrl)}`;

  return (
    <div 
      id="pediatrician-portfolio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-fade-in flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 p-6 text-white shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              id="btn-modal-header-whatsapp-share"
              type="button"
              onClick={handleWhatsAppShare}
              className="p-2 sm:px-3.5 sm:py-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Share specialist on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              id="btn-close-portfolio-modal"
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Doctor Avatar with Update Photo button */}
            <div className="relative group">
              <img
                src={photoError ? FALLBACK_DOCTOR_PHOTO : specialist.photoUrl}
                alt={cleanDocName}
                onError={() => setPhotoError(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl bg-slate-800 shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </span>

              {/* Edit / Update Photo Action */}
              {onUpdateSpecialist && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPhotoInput(specialist.photoUrl);
                    setPhotoSyncMessage(null);
                    setShowPhotoEditModal(true);
                  }}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition cursor-pointer gap-1"
                  title="Sync or update doctor photo"
                >
                  <Camera className="w-4 h-4" />
                  <span>Sync Photo</span>
                </button>
              )}
            </div>

            <div className="space-y-1 flex-1 pr-16 sm:pr-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/40 text-rose-100 text-[10px] font-black uppercase tracking-wider border border-rose-300/30">
                  {specialist.category === 'Nutritionist'
                    ? 'Verified Child Nutritionist'
                    : specialist.category === 'Coach'
                    ? 'Verified Kids Coach'
                    : specialist.category === 'Gynecologist'
                    ? 'Verified Gynecologist'
                    : 'Vernunt Verified Pediatrician'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-300/30">
                  Bangalore Specialist
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
                {cleanDocName}
              </h3>
              <p className="text-xs sm:text-sm text-rose-100 font-medium">
                {specialist.title}
              </p>

              {/* Rating & Experience */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-rose-100">
                <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="font-black text-white">{specialist.rating}</span>
                  <span className="text-[11px] text-rose-200">({specialist.reviewsCount}+ reviews)</span>
                </div>
                <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-lg">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-black text-white">{specialist.experienceYears} Years</span>
                  <span className="text-[11px] text-rose-200">Clinical Exp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Vernunt Clinical Verification Badge (White-Labeled, Reviews Intact) */}
          <div className="bg-gradient-to-r from-rose-50 to-amber-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 block text-sm">
                    Vernunt Verified Specialist Portfolio
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black rounded-full uppercase tracking-wider">
                    Verified Record
                  </span>
                </div>
                <span className="text-xs text-rose-800 font-semibold block mt-0.5">
                  {formatVernuntReviewText(specialist.googleRatingText || specialist.verifiedReviewText)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title="Share portfolio on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Hospital Affiliation & Clinic Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hospital / Clinic Center</span>
              </div>
              <p className="font-bold text-xs text-slate-900">
                {specialist.hospitalAffiliation || specialist.location}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Locality & Address</span>
              </div>
              <p className="font-bold text-xs text-slate-900">
                {specialist.clinicAddress || specialist.location}
              </p>
            </div>
          </div>

          {/* Qualifications & Medical Credentials */}
          {specialist.qualifications && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Medical Qualifications & Fellowships
                </span>
                <p className="font-bold text-xs text-slate-800">
                  {specialist.qualifications}
                </p>
              </div>
            </div>
          )}

          {/* Bio & Approach */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-rose-600" /> Clinical Background & Child Care Philosophy
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {specialist.bio}
            </p>
          </div>

          {/* Specialties Pills */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Clinical Focus & Specialized Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {specialist.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold rounded-xl"
                >
                  #{spec}
                </span>
              ))}
            </div>
          </div>

          {/* Languages Spoken */}
          {specialist.languages && specialist.languages.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-indigo-600" /> Languages Spoken
              </h4>
              <div className="flex items-center gap-2">
                {specialist.languages.map((lang, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available Consultation Slots */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> Standard Daily Consultation Timings
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {specialist.availableSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-800"
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Contact Details */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Official Consultation Fee
              </span>
              <span className="text-2xl font-black text-amber-400">
                ₹{specialist.sessionFee} <span className="text-xs text-slate-300 font-normal">/ consultation</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Includes milestone evaluation & child wellness prescription
              </span>
            </div>

            <div className="flex items-center gap-2">
              {specialist.phone && (
                <a
                  href={`tel:${specialist.phone}`}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                  title="Call Clinic Reception"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Clinic</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Share or chat on WhatsApp"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="View Clinic Desk QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Direct SEO Share URL & Instant Link Copy */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
              <Globe className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Specialist Portfolio URL</span>
                <span className="font-mono text-slate-700 text-[11px] truncate block">{directUrl}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(directUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer text-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Claim Portfolio Section */}
          {specialist.claimed ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Doctor Portfolio • Claimed &amp; Managed by {specialist.claimedByEmail || cleanDocName}</span>
            </div>
          ) : specialist.claimStatus === 'pending' ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Identity Verification Pending • Our medical team is verifying the submitted doctor ID card.</span>
            </div>
          ) : onClaimProfile ? (
            <div className="p-3.5 bg-gradient-to-r from-rose-50 to-orange-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-slate-900">Are you {cleanDocName}?</p>
                  <p className="text-slate-600 text-[11px]">
                    Claim this portfolio to update clinic fees, manage appointment slots, and connect directly with parents.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClaimProfile(specialist)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Claim Profile
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-footer-share-whatsapp"
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Share portfolio on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              id="btn-book-consultation-slot"
              type="button"
              onClick={() => {
                onClose();
                onBookSlot(specialist);
              }}
              className="px-5 sm:px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Consultation (₹{specialist.sessionFee})</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Clinic Desk (No raw URL displayed) */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                Clinic Desk QR Code
              </span>
              <button 
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <img 
                src={qrApiUrl} 
                alt={`QR Code for ${cleanDocName}`}
                className="w-48 h-48 rounded-xl object-contain mx-auto"
              />
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-900">{cleanDocName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Scan with camera to open verified specialist portfolio</p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update / Real-Time Sync Doctor Photo Modal */}
      {showPhotoEditModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setShowPhotoEditModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-sm text-slate-900">Sync Doctor Portrait</h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowPhotoEditModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {photoSyncMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                photoSyncMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {photoSyncMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{photoSyncMessage.text}</span>
              </div>
            )}

            {/* Option 1: Direct File Upload from Device */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <div className="flex items-center justify-center text-slate-600">
                <Upload className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Upload Doctor Photo from Device</p>
                <p className="text-[11px] text-slate-500">Select an authentic clinic portrait from camera or gallery</p>
              </div>
              <label className="inline-block px-4 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition">
                <span>{isSyncingPhoto ? 'Uploading...' : 'Choose Photo File'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  disabled={isSyncingPhoto}
                  className="hidden" 
                />
              </label>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">or from web link</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* Option 2: Extract from Web URL / Clinic link / Image URL */}
            <form onSubmit={handleSaveCustomPhoto} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Clinic Website, Directory Profile, or Direct Image URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    placeholder="https://... profile or direct photo link"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    disabled={isSyncingPhoto}
                  />
                  <button
                    type="button"
                    onClick={handleExtractFromUrl}
                    disabled={isSyncingPhoto || !customPhotoInput.trim()}
                    className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer"
                    title="Extract photo via server"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPhoto ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* Preview */}
              {customPhotoInput && (
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <img
                    src={customPhotoInput}
                    alt="Preview"
                    onError={() => {}}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Photo Target</span>
                    <span className="text-[11px] text-slate-500">Will update across all pediatrician cards</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoEditModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncingPhoto || !customPhotoInput.trim()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Photo URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
