import React, { useState } from 'react';
import { SpecialistProfile, SpecialistClaimRequest } from '../types.ts';
import { 
  X, ShieldCheck, Upload, CheckCircle2, FileText, 
  AlertCircle, Building2, User, Phone, Mail, Award, Lock
} from 'lucide-react';
import { submitSpecialistClaim } from '../utils/specialistClaims.ts';

interface ClaimSpecialistModalProps {
  specialist: SpecialistProfile | null;
  onClose: () => void;
  onClaimSubmitted: (specialistId: string) => void;
  currentUserEmail?: string;
  currentUserPhone?: string;
}

export default function ClaimSpecialistModal({
  specialist,
  onClose,
  onClaimSubmitted,
  currentUserEmail = '',
  currentUserPhone = ''
}: ClaimSpecialistModalProps) {
  const [applicantName, setApplicantName] = useState(specialist?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUserEmail || specialist?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(currentUserPhone || specialist?.phone || '');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [idCardDocName, setIdCardDocName] = useState('');
  const [idCardDocUrl, setIdCardDocUrl] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!specialist) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB.');
      return;
    }

    setErrorMessage('');
    setIdCardDocName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setIdCardDocUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!applicantName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!registrationNumber.trim()) {
      setErrorMessage('Please enter your Medical Council or Professional Registration Number.');
      return;
    }
    if (!idCardDocUrl) {
      setErrorMessage('Please upload a scanned copy or photo of your Doctor ID card / Council Registration certificate.');
      return;
    }
    if (!declarationAccepted) {
      setErrorMessage('Please accept the verification declaration checkbox to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const claimRequest: SpecialistClaimRequest = {
        id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        specialistId: specialist.id,
        specialistName: specialist.name,
        specialistCategory: specialist.category,
        specialistHospital: specialist.hospitalAffiliation || specialist.clinicAddress,
        specialistLocation: specialist.location,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim().toLowerCase(),
        applicantPhone: applicantPhone.trim(),
        registrationNumber: registrationNumber.trim(),
        idCardDocName,
        idCardDocUrl,
        declarationAccepted,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      await submitSpecialistClaim(claimRequest);
      setIsSuccess(true);
      onClaimSubmitted(specialist.id);
    } catch (err) {
      setErrorMessage('Failed to submit claim request. Please try again or reach out to support@vernunt.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-850 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Specialist Identity Verification</span>
          </div>

          <h3 className="text-xl font-bold font-serif leading-tight">
            Claim Your Specialist Portfolio
          </h3>
          <p className="text-xs text-rose-100/90 mt-1">
            Link this verified profile to your personal doctor account to manage fees, slots & appointments.
          </p>

          {/* Specialist Quick Card */}
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10">
            <img 
              src={specialist.photoUrl} 
              alt={specialist.name} 
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold truncate text-white">{specialist.name}</h4>
              <p className="text-[11px] text-rose-200 truncate">{specialist.title}</p>
              <div className="flex items-center gap-1 text-[10px] text-white/80 mt-0.5 truncate">
                <Building2 className="w-3 h-3 text-rose-300 shrink-0" />
                <span className="truncate">{specialist.hospitalAffiliation || specialist.clinicAddress || specialist.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">Claim Submitted Successfully!</h4>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{applicantName}</strong>. Our clinical verification team will inspect your Medical Council ID and match it with State Medical Registers.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Claim Status:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">⏳ Under Admin Verification</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Linked Email:</span>
                  <span className="font-bold text-slate-800">{applicantEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Linked Mobile:</span>
                  <span className="font-bold text-slate-800">{applicantPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registration No:</span>
                  <span className="font-mono font-bold text-slate-800">{registrationNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                You will receive confirmation once the Vernunt Admin approves your claim.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
              >
                Close & Return to Directory
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Claimant Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor / Applicant Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Dr. Ashok M V"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Medical Council Reg No *
                  </label>
                  <div className="relative">
                    <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. KMC-12345 / MCI-78901"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Doctor Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number (for OTP & Bookings) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ID Card Upload Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Doctor ID Card / Registration Certificate *
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-rose-400 transition rounded-2xl p-4 text-center relative bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {idCardDocUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      {idCardDocUrl.startsWith('data:image') ? (
                        <img 
                          src={idCardDocUrl} 
                          alt="ID Preview" 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-300 shadow-xs"
                        />
                      ) : (
                        <FileText className="w-10 h-10 text-rose-600" />
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{idCardDocName}</p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for verification
                        </p>
                        <span className="text-[10px] text-rose-600 hover:underline">Click to change file</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Upload Doctor ID Card, Medical Council Reg, or Clinic Letterhead
                      </p>
                      <p className="text-[10px] text-slate-400">PNG, JPG, WebP or PDF (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-slate-300"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    I declare under penalty of perjury that I am <strong>{specialist.name}</strong> or their officially authorized clinic administrator. I consent to Vernunt verifying my medical credentials against state council records.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting Claim...' : 'Submit Claim for Approval'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
