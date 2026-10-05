import React, { useState } from 'react';
import { 
  Store, Building, Truck, ShieldCheck, Check, Sparkles, 
  MapPin, Phone, Mail, CreditCard, Award, FileText, 
  AlertCircle, Upload, CheckCircle2, ChevronRight, Barcode,
  Lock, Calendar, Package
} from 'lucide-react';

interface VendorRegistrationFlowProps {
  step: number;
  // Step 1: Contact & Identity
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  phoneVerified: boolean;
  onSendPhoneOtp: () => void;
  onVerifyPhoneOtp: () => void;
  phoneVerificationCode: string;
  setPhoneVerificationCode: (v: string) => void;
  isSendingPhoneOtp: boolean;
  isVerifyingPhoneOtp: boolean;
  phoneOtpSent: boolean;
  phoneOtpMsg: { text: string; type: 'info' | 'error' | 'success' };
  
  email: string;
  setEmail: (v: string) => void;
  emailVerified: boolean;
  onSendEmailOtp: () => void;
  onVerifyEmailOtp: () => void;
  emailVerificationCode: string;
  setEmailVerificationCode: (v: string) => void;
  isSendingEmailOtp: boolean;
  isVerifyingEmailOtp: boolean;
  emailOtpSent: boolean;
  emailOtpMsg: { text: string; type: 'info' | 'error' | 'success' };

  ownerName: string;
  setOwnerName: (v: string) => void;
  storeName: string;
  setStoreName: (v: string) => void;

  // Step 2: Store, Compliance, Warehouse & Shiprocket Logistics, Bank
  brandSlug: string;
  setBrandSlug: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  gstin: string;
  setGstin: (v: string) => void;
  pan: string;
  setPan: (v: string) => void;
  fssaiOrBis: string;
  setFssaiOrBis: (v: string) => void;

  pickupLocation: string;
  setPickupLocation: (v: string) => void;
  warehouseStreet: string;
  setWarehouseStreet: (v: string) => void;
  warehouseCity: string;
  setWarehouseCity: (v: string) => void;
  warehouseState: string;
  setWarehouseState: (v: string) => void;
  warehousePincode: string;
  setWarehousePincode: (v: string) => void;
  dispatchContactName: string;
  setDispatchContactName: (v: string) => void;
  dispatchContactPhone: string;
  setDispatchContactPhone: (v: string) => void;

  bankName: string;
  setBankName: (v: string) => void;
  accountHolder: string;
  setAccountHolder: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  ifscCode: string;
  setIfscCode: (v: string) => void;
  upiId: string;
  setUpiId: (v: string) => void;

  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;

  // Step 3: Verification & Legal
  aadhaarDocName: string;
  setAadhaarDocName: (v: string) => void;
  aadhaarDocPreview: string;
  setAadhaarDocPreview: (v: string) => void;
  aadhaarVerified: boolean;
  setAadhaarVerified: (v: boolean) => void;
  gstCertificateName: string;
  setGstCertificateName: (v: string) => void;
  agreementAccepted: boolean;
  setAgreementAccepted: (v: boolean) => void;

  errors: Record<string, string>;
}

export const AVAILABLE_STORE_CATEGORIES = [
  'Montessori & STEM',
  'Wooden Toys & Blocks',
  'Sensory & Baby Care',
  'Kids Books & Flashcards',
  'Art, Craft & Clay',
  'Playdate Activity Kits',
  'Child Safety & Health Gear',
  'Organic Kids Snacks & Nutrition'
];

export const VendorRegistrationFlow: React.FC<VendorRegistrationFlowProps> = (props) => {
  const {
    step,
    phoneNumber, setPhoneNumber, phoneVerified, onSendPhoneOtp, onVerifyPhoneOtp,
    phoneVerificationCode, setPhoneVerificationCode, isSendingPhoneOtp, isVerifyingPhoneOtp,
    phoneOtpSent, phoneOtpMsg,
    email, setEmail, emailVerified, onSendEmailOtp, onVerifyEmailOtp,
    emailVerificationCode, setEmailVerificationCode, isSendingEmailOtp, isVerifyingEmailOtp,
    emailOtpSent, emailOtpMsg,
    ownerName, setOwnerName,
    storeName, setStoreName,
    brandSlug, setBrandSlug,
    tagline, setTagline,
    bio, setBio,
    businessType, setBusinessType,
    gstin, setGstin,
    pan, setPan,
    fssaiOrBis, setFssaiOrBis,
    pickupLocation, setPickupLocation,
    warehouseStreet, setWarehouseStreet,
    warehouseCity, setWarehouseCity,
    warehouseState, setWarehouseState,
    warehousePincode, setWarehousePincode,
    dispatchContactName, setDispatchContactName,
    dispatchContactPhone, setDispatchContactPhone,
    bankName, setBankName,
    accountHolder, setAccountHolder,
    accountNumber, setAccountNumber,
    ifscCode, setIfscCode,
    upiId, setUpiId,
    selectedCategories, setSelectedCategories,
    aadhaarDocName, setAadhaarDocName,
    aadhaarDocPreview, setAadhaarDocPreview,
    aadhaarVerified, setAadhaarVerified,
    gstCertificateName, setGstCertificateName,
    agreementAccepted, setAgreementAccepted,
    errors
  } = props;

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div id="vendor-registration-flow" className="space-y-5 text-left text-slate-800">
      
      {/* ============================================================== */}
      {/* STEP 1: REPRESENTATIVE CONTACT & STORE IDENTITY VERIFICATION   */}
      {/* ============================================================== */}
      {step === 1 && (
        <div id="vendor-step-1" className="space-y-4 animate-fade-in">
          <div className="bg-indigo-50/90 border border-indigo-200/80 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-indigo-950 text-sm">
                Step 1: Seller Contact &amp; Brand Authorization
              </h3>
              <p className="text-xs text-indigo-900/80 leading-relaxed mt-0.5">
                Verify your primary mobile and business email to secure your Vernunt Seller account. Shiprocket logistics courier notifications and order alerts are dispatched to these credentials.
              </p>
            </div>
          </div>

          {/* Store / Brand Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Brand / Store Trade Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              id="vendor-store-name-input"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (!brandSlug) {
                  setBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              placeholder="e.g. Tiny Wonders Wooden Toys"
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none shadow-xs"
            />
            {errors.vendorStoreName && <p className="text-xs font-bold text-rose-600">{errors.vendorStoreName}</p>}
          </div>

          {/* Authorized Representative Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>👤 Authorized Representative / Owner Full Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              id="vendor-owner-name-input"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Priya Sundaram (Proprietor / Director)"
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none shadow-xs"
            />
            {errors.parentName && <p className="text-xs font-bold text-rose-600">{errors.parentName}</p>}
          </div>

          {/* Mobile Number & OTP Verification */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-indigo-600" />
                <span>Primary Mobile Number (+91) <span className="text-rose-500">*</span></span>
              </label>
              {phoneVerified && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP Verified
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                maxLength={10}
                value={phoneNumber}
                disabled={phoneVerified}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
              />
              {!phoneVerified && (
                <button
                  type="button"
                  onClick={onSendPhoneOtp}
                  disabled={isSendingPhoneOtp || phoneNumber.length !== 10}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isSendingPhoneOtp ? 'Sending...' : phoneOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              )}
            </div>

            {phoneOtpSent && !phoneVerified && (
              <div className="flex gap-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  maxLength={6}
                  value={phoneVerificationCode}
                  onChange={(e) => setPhoneVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit SMS OTP"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={onVerifyPhoneOtp}
                  disabled={isVerifyingPhoneOtp || phoneVerificationCode.length < 4}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingPhoneOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
            {phoneOtpMsg.text && (
              <p className={`text-xs font-semibold ${phoneOtpMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
                {phoneOtpMsg.text}
              </p>
            )}
            {errors.phoneNumber && <p className="text-xs font-bold text-rose-600">{errors.phoneNumber}</p>}
          </div>

          {/* Business Email & Email OTP Verification */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Operational Business Email <span className="text-rose-500">*</span></span>
              </label>
              {emailVerified && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Email Verified
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                disabled={emailVerified}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@yourbrand.com"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={onSendEmailOtp}
                  disabled={isSendingEmailOtp || !email.includes('@')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isSendingEmailOtp ? 'Sending...' : emailOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              )}
            </div>

            {emailOtpSent && !emailVerified && (
              <div className="flex gap-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  maxLength={6}
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Email OTP"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={onVerifyEmailOtp}
                  disabled={isVerifyingEmailOtp || emailVerificationCode.length < 4}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingEmailOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
            {emailOtpMsg.text && (
              <p className={`text-xs font-semibold ${emailOtpMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
                {emailOtpMsg.text}
              </p>
            )}
            {errors.email && <p className="text-xs font-bold text-rose-600">{errors.email}</p>}
            {errors.emailVerified && <p className="text-xs font-bold text-rose-600">{errors.emailVerified}</p>}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: DETAILS REQUIRED FOR VENDOR TO SELL PRODUCTS IN APP    */}
      {/* ============================================================== */}
      {step === 2 && (
        <div id="vendor-step-2" className="space-y-5 animate-fade-in">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-200/90 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-indigo-950 text-sm">
                Step 2: Required Selling Details, Tax &amp; Shiprocket Logistics
              </h3>
              <p className="text-xs text-indigo-900/80 leading-relaxed mt-0.5">
                Every detail below is legally mandatory under Indian eCommerce &amp; Consumer Protection (E-Commerce) Rules, 2020 and required for automated courier pickup with Shiprocket.
              </p>
            </div>
          </div>

          {/* 1. Legal Entity & Tax Compliance */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>1. Business Entity &amp; Tax Compliance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Business Legal Entity</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Pvt Ltd">Private Limited Company (Pvt Ltd)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  15-Digit GSTIN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:border-indigo-500"
                />
                {errors.vendorGstin && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorGstin}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Business / Proprietor PAN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. AAAAA0000A"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:border-indigo-500"
                />
                {errors.vendorPan && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorPan}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  BIS Certification or FSSAI License No.
                </label>
                <input
                  type="text"
                  value={fssaiOrBis}
                  onChange={(e) => setFssaiOrBis(e.target.value)}
                  placeholder="BIS/IS 9873 (Toys) or FSSAI 14-digit (Food)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
                <span className="text-[9.5px] text-slate-400 block mt-0.5">Required for kid food or safety-marked toys</span>
              </div>
            </div>
          </div>

          {/* 2. Warehouse & Shiprocket Dispatch Hub */}
          <div className="p-4 bg-white border-2 border-indigo-200/90 rounded-2xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>2. Warehouse &amp; Shiprocket Dispatch Hub</span>
              </h4>
              <span className="text-[9.5px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Doorstep Pickup Enabled
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              This address is synced with <strong>Shiprocket</strong> so courier partners (Delhivery, BlueDart, Shadowfax) can pick up packed cartons directly from your doorstep.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Pickup Hub Nickname
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Primary-Bengaluru-Warehouse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Warehouse Street Address &amp; Landmark <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseStreet}
                  onChange={(e) => setWarehouseStreet(e.target.value)}
                  placeholder="Plot/Building number, Industrial Area or Locality"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
                />
                {errors.vendorWarehouseStreet && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorWarehouseStreet}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">City <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={warehouseCity}
                  onChange={(e) => setWarehouseCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">State <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={warehouseState}
                  onChange={(e) => setWarehouseState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  6-Digit Dispatch Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={warehousePincode}
                  onChange={(e) => setWarehousePincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 560102"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
                {errors.vendorWarehousePincode && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorWarehousePincode}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Dispatch Manager Contact</label>
                <input
                  type="text"
                  value={dispatchContactName}
                  onChange={(e) => setDispatchContactName(e.target.value)}
                  placeholder="Warehouse supervisor name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex items-center gap-2 text-xs text-indigo-950 font-medium">
              <Barcode className="w-4 h-4 text-indigo-600 shrink-0" />
              <span><strong>Shiprocket Feature:</strong> Automatic Air Waybill (AWB) generation &amp; printable PDF shipping labels with live tracking included free.</span>
            </div>
          </div>

          {/* 3. Bank Account & Weekly Payouts */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>3. Bank Account &amp; Sales Settlement Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Beneficiary Account Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Name as per bank passbook"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Bank account number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
                {errors.vendorAccountNumber && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorAccountNumber}</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Bank IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001042"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:border-indigo-500"
                />
                {errors.vendorIfscCode && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.vendorIfscCode}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Instant UPI ID for Rapid Payouts (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourstore@okhdfcbank"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 4. Product Categories Selection */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Package className="w-4 h-4 text-purple-600" />
              <span>4. Target Product Categories You Sell</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-1">
              {AVAILABLE_STORE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: IDENTITY VERIFICATION & SELLER ONBOARDING AGREEMENT    */}
      {/* ============================================================== */}
      {step === 3 && (
        <div id="vendor-step-3" className="space-y-5 animate-fade-in">
          <div className="bg-emerald-50/90 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-950 text-sm">
                Step 3: Identity Verification &amp; Seller Agreement
              </h3>
              <p className="text-xs text-emerald-900/80 leading-relaxed mt-0.5">
                Every seller is vetted to ensure all products delivered to kids in India are authentic, safe, non-toxic, and adhere to BIS standards.
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Authorized Signatory Identity Check</span>
              </span>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Aadhaar / DigiLocker
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your verified mobile (+91 {phoneNumber}) and business email ({email}) will be used as the authorized contact for this seller profile.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-left text-xs">
                  <span className="font-bold text-slate-900 block">{ownerName || 'Store Proprietor'}</span>
                  <span className="text-slate-500 font-mono text-[11px]">Representative of {storeName}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready to Activate
              </span>
            </div>
          </div>

          {/* Vernunt Marketplace & Shiprocket Logistics Agreement */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              📜 Vernunt Marketplace Seller Agreement &amp; Logistics SLA
            </h4>
            
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto p-2.5 bg-white border border-slate-200 rounded-xl text-[11.5px]">
              <p>1. <strong>Child Safety Standards:</strong> Seller certifies that all toys, books, and child care products are 100% non-toxic, BPA-free, and comply with BIS (Bureau of Indian Standards) regulations.</p>
              <p>2. <strong>Shiprocket Dispatch SLA:</strong> Orders must be packed and ready for Shiprocket courier pickup within 24–48 hours of order confirmation.</p>
              <p>3. <strong>Commission &amp; Settlements:</strong> Enjoy 60-day Zero Commission trial. Weekly settlements are transferred directly to your registered bank account via NEFT/UPI.</p>
              <p>4. <strong>Customer Returns:</strong> Seller agrees to accept returns for defective, damaged, or mismatched items within 7 days of delivery.</p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                id="vendor-terms-checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-800 leading-snug">
                I accept the Vernunt Marketplace Seller Terms, 60-day free trial, and Shiprocket Courier Dispatch SLA. <span className="text-rose-500">*</span>
              </span>
            </label>
            {errors.vendorAgreement && <p className="text-xs font-bold text-rose-600">{errors.vendorAgreement}</p>}
          </div>

        </div>
      )}

    </div>
  );
};
export default VendorRegistrationFlow;
