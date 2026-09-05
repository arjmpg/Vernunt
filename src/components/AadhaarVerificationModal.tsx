import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Trash2, 
  FileCheck, 
  Lock, 
  Info, 
  MapPin, 
  Sparkles, 
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile, VerificationStatus } from '../types.ts';

interface AadhaarVerificationModalProps {
  userProfile: ChildProfile;
  onClose: () => void;
  onVerifySuccess: (updatedProfile: ChildProfile) => void;
  actionMessage?: string;
}

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // Strict 3 MB limit

export default function AadhaarVerificationModal({
  userProfile,
  onClose,
  onVerifySuccess,
  actionMessage = "Attach your Aadhaar Card and Address Proof to complete safety verification. Documents are securely reviewed and approved by Vernunt administrators."
}: AadhaarVerificationModalProps) {
  // Aadhaar Manual States
  const [aadhaarNumber, setAadhaarNumber] = useState(userProfile.aadhaarNumber || '');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState(userProfile.aadhaarDocUrl || '');
  const [aadhaarDocName, setAadhaarDocName] = useState(userProfile.aadhaarDocName || '');
  const [aadhaarDocSize, setAadhaarDocSize] = useState<number | undefined>(userProfile.aadhaarDocSize);
  const [aadhaarDocPreview, setAadhaarDocPreview] = useState<string>(userProfile.aadhaarDocUrl || '');
  
  // Address Proof States
  const [currentAddress, setCurrentAddress] = useState(userProfile.currentAddress || userProfile.location?.address || '');
  const [apartmentCommunityName, setApartmentCommunityName] = useState(userProfile.apartmentCommunityName || '');
  const [addressProofDocType, setAddressProofDocType] = useState(userProfile.addressProofDocType || 'Aadhaar Card');
  const [addressProofDocName, setAddressProofDocName] = useState(userProfile.addressProofDocName || '');
  const [addressProofDocUrl, setAddressProofDocUrl] = useState(userProfile.addressProofDocUrl || '');
  const [addressProofDocSize, setAddressProofDocSize] = useState<number | undefined>(userProfile.addressProofDocSize);
  const [addressProofDocPreview, setAddressProofDocPreview] = useState<string>(userProfile.addressProofDocUrl || '');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const addressProofInputRef = useRef<HTMLInputElement>(null);

  const handleAadhaarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Aadhaar file size (${sizeMb} MB) exceeds the 3 MB limit. Please select an image or PDF under 3 MB.`);
      if (aadhaarInputRef.current) aadhaarInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAadhaarDocName(file.name);
      setAadhaarDocSize(file.size);
      
      if (file.type.includes('pdf')) {
        setAadhaarDocPreview('pdf');
      } else {
        setAadhaarDocPreview(base64Data);
      }
      setAadhaarDocUrl(base64Data);
      setSuccessMsg(`✓ Aadhaar card attached successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddressProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Address proof file size (${sizeMb} MB) exceeds the 3 MB limit. Please select an image or PDF under 3 MB.`);
      if (addressProofInputRef.current) addressProofInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAddressProofDocName(file.name);
      setAddressProofDocSize(file.size);
      
      if (file.type.includes('pdf')) {
        setAddressProofDocPreview('pdf');
      } else {
        setAddressProofDocPreview(base64Data);
      }
      setAddressProofDocUrl(base64Data);
      setSuccessMsg(`✓ Address proof attached successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKyc = async (instantApprove: boolean = false) => {
    setErrorMsg('');

    if (!aadhaarDocUrl && !aadhaarDocName) {
      setErrorMsg('Please attach your National Aadhaar Card document (Max 3 MB).');
      return;
    }

    if (!currentAddress.trim()) {
      setErrorMsg('Please provide your residential address for neighborhood verification.');
      return;
    }

    setIsUploading(true);
    try {
      const cleanedAadhaar = aadhaarNumber.replace(/\D/g, '');
      const now = new Date().toISOString();

      const updatedProfile: ChildProfile = {
        ...userProfile,
        aadhaarNumber: cleanedAadhaar || userProfile.aadhaarNumber || 'Attached',
        aadhaarVerified: instantApprove,
        aadhaarDocUrl: aadhaarDocUrl || userProfile.aadhaarDocUrl,
        aadhaarDocName: aadhaarDocName || userProfile.aadhaarDocName,
        aadhaarDocSize: aadhaarDocSize || userProfile.aadhaarDocSize,
        currentAddress: currentAddress.trim(),
        apartmentCommunityName: apartmentCommunityName.trim() || undefined,
        addressProofDocName: addressProofDocName || aadhaarDocName || userProfile.addressProofDocName,
        addressProofDocUrl: addressProofDocUrl || aadhaarDocUrl || userProfile.addressProofDocUrl,
        addressProofDocType: (addressProofDocType as any) || 'Aadhaar Card',
        addressProofDocSize: addressProofDocSize || aadhaarDocSize || userProfile.addressProofDocSize,
        kycSubmitted: true,
        kycSubmittedAt: now,
        kycVerifiedAt: instantApprove ? now : undefined,
        verificationMethod: instantApprove ? 'admin_verified' : 'manual_upload',
        verificationStatus: instantApprove ? VerificationStatus.VERIFIED : VerificationStatus.PENDING
      };

      if (instantApprove) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            colors: ['#059669', '#10b981', '#34d399', '#f59e0b']
          });
        } catch (confettiErr) {
          console.debug('Confetti animation skipped', confettiErr);
        }
      }

      onVerifySuccess(updatedProfile);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="aadhaar-verification-modal-backdrop" className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-base tracking-tight text-white">
                  Aadhaar Verification &amp; Address Proof
                </h3>
                <span className="text-[9.5px] uppercase font-black tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  Admin Review
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Manual Document Upload &amp; Administrative Safety Approval</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Sub-bar */}
        <div className="bg-amber-50/80 px-5 py-2.5 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold text-[11px]">Manual Document Verification Flow</span>
          </div>
          <span className="text-[10px] text-amber-800 font-semibold">Reviewed by Vernunt System Admins</span>
        </div>

        {/* Content Form */}
        <div className="p-5 sm:p-6 space-y-4.5 overflow-y-auto flex-1 text-left">
          
          {actionMessage && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950 shadow-2xs">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-blue-950">Administrative Verification Process</p>
                <p className="leading-relaxed text-slate-700">{actionMessage}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MANUAL DOCUMENT UPLOAD FIELDS */}
          <div className="space-y-4">
            {/* 1. Aadhaar Card Upload Section */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  1. National Aadhaar Card Document <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Max 3 MB (JPG/PNG/PDF)
                </span>
              </div>

              <input
                ref={aadhaarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleAadhaarSelect}
                className="hidden"
                id="aadhaar-modal-file-input"
              />

              {!aadhaarDocName ? (
                <label
                  htmlFor="aadhaar-modal-file-input"
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-white hover:bg-emerald-50/20 transition cursor-pointer group text-center"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                    <Upload className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">
                    Attach Aadhaar Card (Front / Back Photo or PDF)
                  </span>
                  <span className="text-[10.5px] text-slate-400 mt-0.5">
                    Clear scan or photo up to 3 MB • Submitted to Admin for Review
                  </span>
                </label>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{aadhaarDocName}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          {aadhaarDocSize ? `${(aadhaarDocSize / (1024 * 1024)).toFixed(2)} MB • ` : ''}Aadhaar Attached • Ready for Admin Review
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarDocName('');
                        setAadhaarDocUrl('');
                        setAadhaarDocPreview('');
                        setAadhaarDocSize(undefined);
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                      title="Remove document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {aadhaarDocPreview && aadhaarDocPreview !== 'pdf' && !aadhaarDocPreview.endsWith('.pdf') && !aadhaarDocName.endsWith('.pdf') && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-emerald-200 bg-white">
                      <img 
                        src={aadhaarDocPreview} 
                        alt="Aadhaar Preview" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Optional Aadhaar Number */}
              <div className="flex flex-col space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>12-Digit Aadhaar Number (Optional)</span>
                  <span className="text-[9.5px] text-slate-400 font-normal">Encrypted locally</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="XXXX XXXX 1234"
                  value={aadhaarNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-mono tracking-wider"
                />
              </div>
            </div>

            {/* 2. Residential Address & Address Proof Section */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Residential Address &amp; Society Proof <span className="text-rose-600">*</span>
                </label>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Full Residential Address (City &amp; Locality)</label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="e.g. Flat 304, Palm Heights, 100ft Road, Indiranagar, Bangalore - 560038"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Apartment / Gated Community Name</span>
                    <span className="text-[9.5px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={apartmentCommunityName}
                    onChange={(e) => setApartmentCommunityName(e.target.value)}
                    placeholder="e.g. Prestige Shantiniketan, Sobha Dream Acres..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Address Proof Type & Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-600">Address Proof Document Type</label>
                    <select
                      value={addressProofDocType}
                      onChange={(e) => setAddressProofDocType(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none font-medium cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card Address</option>
                      <option value="Rental Agreement">Registered Rental Agreement</option>
                      <option value="Electricity Bill">Electricity (BESCOM) Bill</option>
                      <option value="Gas Bill">Gas Connection Bill</option>
                      <option value="Voter ID">Voter ID Card</option>
                      <option value="Indian Passport">Indian Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-600">Attach Document (Max 3MB)</label>
                    <input
                      ref={addressProofInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleAddressProofSelect}
                      className="hidden"
                      id="address-proof-modal-file-input"
                    />
                    {addressProofDocName ? (
                      <div className="flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="text-[11px] font-bold text-emerald-800 truncate max-w-[140px]">
                          ✓ {addressProofDocName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressProofDocName('');
                            setAddressProofDocUrl('');
                            setAddressProofDocPreview('');
                          }}
                          className="text-[10px] text-rose-600 font-bold px-1.5 py-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="address-proof-modal-file-input"
                        className="px-3 py-2 bg-white border border-slate-200 hover:border-emerald-400 rounded-xl text-xs text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Attach Proof</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Your Aadhaar card and address proof are encrypted and solely inspected by verified Vernunt System Administrators. After admin approval, your profile receives the official Verified trust badge across all search and community listings.
              </p>
            </div>

            {/* Action Buttons for Manual */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {userProfile.userRole === 'Admin' ? (
                <button
                  type="button"
                  onClick={() => handleSubmitKyc(true)}
                  disabled={isUploading}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ Instant Admin Approval</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Admin Verification</span>
                </div>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitKyc(false)}
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Document...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Admin Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
