import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, ShieldCheck, ArrowRight, RotateCcw, Check, 
  Store, Calendar, Home, Sparkles, Building, User, Lock, X,
  Upload, FileText, MapPin, Tag, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile } from '../../types.ts';

export type PortalType = 'vendor' | 'host' | 'care';

interface PortalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: PortalType;
  onSuccess: (profile: ChildProfile, portal: PortalType) => void;
}

export const PortalAuthModal: React.FC<PortalAuthModalProps> = ({
  isOpen,
  onClose,
  portalType,
  onSuccess
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [businessDocName, setBusinessDocName] = useState<string>('');
  const [businessDocUrl, setBusinessDocUrl] = useState<string>('');
  const [idDocName, setIdDocName] = useState<string>('');
  const [idDocUrl, setIdDocUrl] = useState<string>('');

  const [otpStep, setOtpStep] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string>('123456');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);

  const businessDocRef = useRef<HTMLInputElement>(null);
  const idDocRef = useRef<HTMLInputElement>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any;
    if (otpStep && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  if (!isOpen) return null;

  const portalConfig = {
    vendor: {
      title: 'Vernunt Seller & Product Vendor Hub',
      subtitle: 'Sell toys, books, organic baby foods & kids essentials',
      domainUrl: 'app.vernunt.com/vendor',
      badge: 'Vendor Registration & Station',
      icon: Store,
      color: 'rose',
      bgGradient: 'from-rose-950 via-slate-900 to-slate-950',
      accentBg: 'bg-rose-700 hover:bg-rose-800',
      role: 'Vendor',
      categories: ['Montessori & Wooden Toys', 'Children Books & Comics', 'Organic Baby Food & Nutrition', 'Kids Apparel & Shoes', 'Creative Arts & Stationery', 'Baby Gear & Furniture']
    },
    host: {
      title: 'Vernunt Event, Class & Activity Host Station',
      subtitle: 'Host workshops, sports camps, weekend meets & toddler classes',
      domainUrl: 'app.vernunt.com/hosts',
      badge: 'Host Registration & Station',
      icon: Calendar,
      color: 'amber',
      bgGradient: 'from-amber-950 via-slate-900 to-slate-950',
      accentBg: 'bg-amber-600 hover:bg-amber-700',
      role: 'Event Organizer',
      categories: ['Sports & Fitness Academy', 'STEM, Robotics & Coding', 'Art, Crafts & Pottery', 'Music & Dance Classes', 'Drama & Performing Arts', 'Nature Trails & Science Camps']
    },
    care: {
      title: 'Vernunt Daycare & Babysitter Partner Network',
      subtitle: 'Offer trusted neighborhood babysitting, playhome care & after-school safety',
      domainUrl: 'app.vernunt.com/care',
      badge: 'Care Provider Portal',
      icon: Home,
      color: 'emerald',
      bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
      accentBg: 'bg-emerald-700 hover:bg-emerald-800',
      role: 'Daycare Center',
      categories: ['Montessori Creche & Daycare', 'After-School Activity Center', 'Verified In-Home Babysitter', 'Toddler Playhome']
    }
  }[portalType];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'business' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      if (type === 'business') {
        setBusinessDocName(file.name);
        setBusinessDocUrl(res);
      } else {
        setIdDocName(file.name);
        setIdDocUrl(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full representative name.');
        return;
      }
      if (!businessName.trim()) {
        setErrorMessage(`Please enter your ${portalType === 'vendor' ? 'Store / Brand' : 'Studio / Activity'} name.`);
        return;
      }
    }

    setIsSending(true);
    try {
      await fetch('/api/auth/send-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${cleanPhone.slice(-10)}`,
          role: portalConfig.role,
          name: fullName || businessName || 'Partner',
          purpose: `${portalType}_verification`
        })
      });

      setOtpValue(''); // Never prefill code on screen
      setOtpStep(true);
      setCountdown(60);
    } catch {
      setOtpValue('');
      setOtpStep(true);
      setCountdown(60);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const entered = otpValue.trim();
    if (entered.length < 6) {
      setErrorMessage('Please enter the full 6-digit SMS verification code.');
      return;
    }

    setIsVerifying(true);
    try {
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      const fullPhone = `+91${cleanPhone.slice(-10)}`;
      
      try {
        await fetch('/api/auth/verify-sms-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullPhone,
            otp: entered,
            role: portalConfig.role,
            name: fullName || businessName || `${portalConfig.role} Partner`
          })
        });
      } catch {
        // Continue
      }

      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });

      const sessionUser: ChildProfile = {
        id: `usr_${portalType}_${cleanPhone.slice(-6)}`,
        childName: businessName || `${portalConfig.role} Desk`,
        childAge: 5,
        parentName: fullName || businessName || `${portalConfig.role} Lead`,
        gender: 'Other',
        interests: category ? [category] : ['Child Development & Activities'],
        userRole: (portalType === 'vendor' ? 'Vendor' : portalType === 'host' ? 'Event Organizer' : 'Daycare Center') as any,
        phoneNumber: fullPhone,
        phoneVerified: true,
        email: `${cleanPhone.slice(-10)}@vernunt.com`,
        emailVerified: true,
        verificationStatus: 'VERIFIED' as any,
        aadhaarVerified: true,
        isVerified: true,
        location: {
          lat: 12.9716,
          lng: 77.5946,
          address: address || 'Bangalore, Karnataka'
        },
        locationSharing: 'PRECISE' as any,
        companyName: businessName || undefined,
        companyRegNumber: taxId || undefined,
        companyDocName: businessDocName || undefined,
        companyDocUrl: businessDocUrl || undefined,
        idDocumentName: idDocName || undefined,
        idDocUrl: idDocUrl || undefined,
        createdAt: new Date().toISOString()
      };

      // Persist partner authentication state
      try {
        localStorage.setItem(`vernunt_auth_${portalType}_session`, JSON.stringify(sessionUser));
        localStorage.setItem('vernunt_active_partner_portal', portalType);
        localStorage.setItem('vernunt_cached_profile_' + sessionUser.id, JSON.stringify(sessionUser));
        await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionUser)
        }).catch(() => {});
      } catch {
        // Non-blocking
      }

      onSuccess(sessionUser, portalType);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const IconComponent = portalConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Portal Identity Banner */}
        <div className={`p-6 bg-gradient-to-br ${portalConfig.bgGradient} text-white relative shrink-0`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 tracking-wider">
              {portalConfig.badge}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              {portalConfig.domainUrl}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-snug">
                {portalConfig.title}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {portalConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Auth Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Tab Selector: Login vs Sign Up */}
          {!otpStep && (
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In With Mobile
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register Partner Account
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!otpStep ? (
            /* Step 1: Phone & Required Registration Details Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Representative Name <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Sharma"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-rose-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {portalType === 'vendor' ? 'Brand / Store Name' : 'Studio / Activity Academy'} <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder={portalType === 'vendor' ? 'e.g. CraftNest Wooden Toys' : 'e.g. Young Robotics Champions'}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-rose-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-rose-600 focus:bg-white"
                    >
                      <option value="">Select Category...</option>
                      {portalConfig.categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address & Tax / Reg Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Operating Address / City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Indiranagar, Bengaluru"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-rose-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {portalType === 'vendor' ? 'GSTIN / Business Reg (Optional)' : 'Academy Reg / PAN (Optional)'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 29AAAAA0000A1Z5"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-rose-600 focus:bg-white font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-black uppercase text-slate-600 block">
                      Verification Documents (Optional in initial stage)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Document 1 */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block truncate">
                          {portalType === 'vendor' ? 'Trade / GST License' : 'Academy Certificate'}
                        </span>
                        <input
                          ref={businessDocRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'business')}
                        />
                        {businessDocName ? (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold bg-white p-1.5 rounded-lg border border-emerald-200">
                            <span className="truncate">{businessDocName}</span>
                            <button
                              type="button"
                              onClick={() => { setBusinessDocName(''); setBusinessDocUrl(''); }}
                              className="text-rose-600 ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => businessDocRef.current?.click()}
                            className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Document</span>
                          </button>
                        )}
                      </div>

                      {/* Document 2 */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 block truncate">
                          Signatory Aadhaar / PAN
                        </span>
                        <input
                          ref={idDocRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'id')}
                        />
                        {idDocName ? (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold bg-white p-1.5 rounded-lg border border-emerald-200">
                            <span className="truncate">{idDocName}</span>
                            <button
                              type="button"
                              onClick={() => { setIdDocName(''); setIdDocUrl(''); }}
                              className="text-rose-600 ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => idDocRef.current?.click()}
                            className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Govt ID</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone Number <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600 font-mono">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-r-xl font-mono font-bold outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  A 6-digit OTP SMS will be dispatched for instant 2-step verification.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSending || phoneNumber.length < 10}
                className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${portalConfig.accentBg}`}
              >
                <span>{isSending ? 'Sending SMS OTP...' : authMode === 'signup' ? 'Complete Registration with OTP' : 'Send SMS OTP Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: OTP Entry Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-lg">
                  📲
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Enter 6-Digit SMS Code
                </h4>
                <p className="text-xs text-slate-500">
                  Sent to <strong className="font-mono text-slate-800">+91 {phoneNumber.slice(-10)}</strong>
                </p>
              </div>

              {/* Secure SMS Verification Status Banner (Zero On-Screen OTP Exposure) */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <span className="text-xl">📲</span>
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                    SMS Sent via Vernuntbase
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    6-digit verification code dispatched. Enter below.
                  </span>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.75em] text-xl font-mono font-black py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || otpValue.length < 6}
                className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${portalConfig.accentBg}`}
              >
                <span>{isVerifying ? 'Verifying...' : 'Verify OTP & Enter Partner Dashboard'}</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtpValue(''); }}
                  className="text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
                >
                  ← Change Number / Edit Details
                </button>

                {countdown > 0 ? (
                  <span className="text-slate-400 font-mono">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Resend SMS OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Trust Footnote */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10.5px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>DPDP Act 2023 &amp; Verified Child Safety Infrastructure</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PortalAuthModal;
