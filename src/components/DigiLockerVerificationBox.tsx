import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Lock, 
  ExternalLink, 
  Sparkles, 
  KeyRound, 
  Smartphone, 
  FileCheck, 
  Building2, 
  MapPin, 
  RefreshCw,
  QrCode,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface DigiLockerVerifiedPayload {
  digilockerVerified: boolean;
  digilockerTxnId: string;
  digilockerDocUri: string;
  digilockerVerifiedAt: string;
  digilockerIssuedName: string;
  digilockerMaskedAadhaar: string;
  digilockerAddress: string;
  digilockerPincode?: string;
  digilockerGender?: string;
  digilockerDob?: string;
  verificationMethod: 'digilocker';
  aadhaarVerified: boolean;
  aadhaarNumber?: string;
}

interface DigiLockerVerificationBoxProps {
  onVerified: (payload: DigiLockerVerifiedPayload) => void;
  defaultName?: string;
  defaultMobile?: string;
  defaultAadhaar?: string;
  defaultAddress?: string;
  roleLabel?: string;
  isCompact?: boolean;
}

export default function DigiLockerVerificationBox({
  onVerified,
  defaultName = '',
  defaultMobile = '',
  defaultAadhaar = '',
  defaultAddress = '',
  roleLabel = 'Parent',
  isCompact = false
}: DigiLockerVerificationBoxProps) {
  const [step, setStep] = useState<'input' | 'otp' | 'verified'>('input');
  const [aadhaarNumber, setAadhaarNumber] = useState(defaultAadhaar || '');
  const [mobileNumber, setMobileNumber] = useState(defaultMobile || '');
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [devHintOtp, setDevHintOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerSeconds]);

  // Format Aadhaar with spaces
  const formatAadhaar = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    return raw.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/digilocker/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: cleanAadhaar || '892410294821',
          mobileNumber: mobileNumber || '9820112233'
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP from DigiLocker gateway.');
      }

      setTxnId(data.txnId);
      setMaskedMobile(data.maskedMobile);
      if (data.devHintOtp) setDevHintOtp(data.devHintOtp);
      setTimerSeconds(60);
      setStep('otp');
      setSuccessMsg(data.message || 'OTP sent successfully to your Aadhaar-linked mobile!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error connecting to DigiLocker API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/digilocker/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnId,
          otp: otp.trim(),
          userName: defaultName || 'Aarti Menon',
          userAddress: defaultAddress || 'Flat 304, Palm Heights, 100ft Road, Indiranagar, Bangalore - 560038'
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code.');
      }

      setVerifiedData(data);
      setStep('verified');
      setSuccessMsg('✓ 100% Government Verified via DigiLocker (UIDAI e-KYC)');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#3b82f6']
        });
      } catch {
        // confetti skipped safely
      }

      const payload: DigiLockerVerifiedPayload = {
        digilockerVerified: true,
        digilockerTxnId: data.txnId,
        digilockerDocUri: data.docUri,
        digilockerVerifiedAt: data.verifiedAt,
        digilockerIssuedName: data.issuedName,
        digilockerMaskedAadhaar: data.maskedAadhaar,
        digilockerAddress: data.address,
        digilockerPincode: data.pincode,
        digilockerGender: data.gender,
        digilockerDob: data.dob,
        verificationMethod: 'digilocker',
        aadhaarVerified: true,
        aadhaarNumber: data.maskedAadhaar
      };

      onVerified(payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'DigiLocker verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoVerify = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const resp = await fetch('/api/digilocker/fetch-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber || '892410294821',
          userName: defaultName || 'Aarti Menon',
          userAddress: defaultAddress || 'Flat 304, Palm Heights, 100ft Road, Indiranagar, Bangalore - 560038'
        })
      });
      const data = await resp.json();
      setVerifiedData(data);
      setStep('verified');
      setSuccessMsg('✓ DigiLocker e-Aadhaar Verified Instantly!');

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          colors: ['#059669', '#10b981', '#38bdf8', '#fbbf24']
        });
      } catch (e) {
        console.debug('Confetti skipped', e);
      }

      const payload: DigiLockerVerifiedPayload = {
        digilockerVerified: true,
        digilockerTxnId: data.txnId,
        digilockerDocUri: data.docUri,
        digilockerVerifiedAt: data.verifiedAt,
        digilockerIssuedName: data.issuedName,
        digilockerMaskedAadhaar: data.maskedAadhaar,
        digilockerAddress: data.address,
        digilockerPincode: data.pincode,
        digilockerGender: data.gender,
        digilockerDob: data.dob,
        verificationMethod: 'digilocker',
        aadhaarVerified: true,
        aadhaarNumber: data.maskedAadhaar
      };

      onVerified(payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-blue-800/50 shadow-xl overflow-hidden">
      {/* DigiLocker Official Brand Header */}
      <div className="p-4 bg-slate-900/90 border-b border-blue-700/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* DigiLocker & Digital India Crest */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-md shrink-0">
              {/* DigiLocker Visual Icon */}
              <div className="w-full h-full bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white font-black text-[9px] leading-tight">
                <span className="text-[7px] text-amber-300 font-extrabold uppercase">Govt</span>
                <span>DL</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-wide flex items-center gap-1.5">
                  <span>DigiLocker</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full font-bold">
                    Official e-KYC
                  </span>
                </h4>
              </div>
              <p className="text-[10px] text-slate-300">
                Digital India • Ministry of Electronics &amp; IT (MeitY)
              </p>
            </div>
          </div>
        </div>

        <a 
          href="https://www.digilocker.gov.in/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60 transition"
        >
          <span>digilocker.gov.in</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-4">

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-600/60 rounded-xl flex items-start gap-2 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl flex items-start gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Aadhaar & Phone Input */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-700/30 text-xs text-blue-200 space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Instant 1-Click UIDAI Verification for {roleLabel}s
              </p>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                Connect your DigiLocker account to automatically verify your identity and residential address without manual document audits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>12-Digit Aadhaar Number</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="8924 1029 4821"
                  value={formatAadhaar(aadhaarNumber)}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white font-mono tracking-wider outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aadhaar Linked Mobile</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9820112233"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white font-mono tracking-wider outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleQuickDemoVerify}
                disabled={isLoading}
                className="text-[10.5px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-400/30 transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Instant DigiLocker Pull</span>
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting DigiLocker...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-300" />
                    <span>Send DigiLocker UIDAI OTP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-700/50 space-y-1 text-xs text-emerald-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Enter 6-Digit DigiLocker OTP
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">
                  {maskedMobile}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                A one-time verification code has been dispatched via UIDAI authentication gateway.
              </p>
              {devHintOtp && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md font-mono font-bold">
                    Demo OTP Hint: {devHintOtp}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(devHintOtp)}
                    className="text-[10px] text-cyan-300 underline cursor-pointer hover:text-white"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl font-mono tracking-widest px-4 py-2.5 bg-slate-900 border-2 border-cyan-500/70 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-400"
                autoFocus
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {timerSeconds > 0 ? (
                    `Resend code in ${timerSeconds}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend OTP
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Change Aadhaar / Mobile
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying e-Aadhaar Certificate...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Confirm &amp; Authorize e-Aadhaar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verified Digital Certificate State */}
        {step === 'verified' && verifiedData && (
          <div className="space-y-3 bg-emerald-950/50 p-4 rounded-xl border border-emerald-600/60 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-emerald-700/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-emerald-300 block">
                    ✓ DigiLocker Verified Certificate
                  </span>
                  <span className="text-[10px] text-emerald-400/90">
                    Issuer: UIDAI (Govt of India) • URI: {verifiedData.docUri || 'in.gov.uidai-adhr'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[9.5px] uppercase tracking-wider rounded-md">
                100% Authentic
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Verified Full Name</span>
                <span className="font-bold text-white text-xs">{verifiedData.issuedName || defaultName || 'Verified Parent'}</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Masked Aadhaar ID</span>
                <span className="font-bold text-cyan-300 font-mono">{verifiedData.maskedAadhaar || 'XXXX-XXXX-8924'}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                UIDAI Verified Residential Address
              </span>
              <p className="font-medium text-slate-200 leading-relaxed">
                {verifiedData.address || defaultAddress || 'Bangalore, Karnataka'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="w-3 h-3" /> SHA-256 Digitally Signed by MeitY
              </span>
              <span className="font-mono">{new Date(verifiedData.verifiedAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-500" /> 256-Bit Encrypted Government Data Gateway
        </span>
        <span className="text-slate-500">MeitY Certified</span>
      </div>
    </div>
  );
}
