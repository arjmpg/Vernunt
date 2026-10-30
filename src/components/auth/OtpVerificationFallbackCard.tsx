import React, { useState } from 'react';
import { 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Smartphone,
  HelpCircle,
  ArrowRight,
  Radio
} from 'lucide-react';
import { executeFirebasePnv, isPnvSupported } from '../../utils/firebasePnvAuth.ts';

interface OtpVerificationFallbackCardProps {
  phone: string;
  email?: string;
  otpCountdown: number;
  otpSent: boolean;
  onYesReceived: () => void;
  onInitiateVoiceCall: () => void;
  onSelectGoogleLogin: () => void;
  onSelectEmailOtp?: () => void;
  onSelectWhatsApp?: () => void;
  onPnvSuccess?: (result: any) => void;
  context?: 'auth' | 'checkout';
}

export default function OtpVerificationFallbackCard({
  phone,
  email,
  otpCountdown,
  otpSent,
  onYesReceived,
  onInitiateVoiceCall,
  onSelectGoogleLogin,
  onSelectEmailOtp,
  onSelectWhatsApp,
  onPnvSuccess,
  context = 'auth'
}: OtpVerificationFallbackCardProps) {
  const [userResponse, setUserResponse] = useState<'none' | 'yes' | 'no'>('none');
  const [isCalling, setIsCalling] = useState(false);
  const [isVerifyingPnv, setIsVerifyingPnv] = useState(false);
  const [pnvSuccessMessage, setPnvSuccessMessage] = useState<string | null>(null);

  if (!otpSent) return null;

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const isPost1Min = otpCountdown === 0;

  const handleYes = () => {
    setUserResponse('yes');
    onYesReceived();
  };

  const handleNo = () => {
    setUserResponse('no');
  };

  const handleVoiceCallClick = () => {
    setIsCalling(true);
    onInitiateVoiceCall();
    setTimeout(() => setIsCalling(false), 2000);
  };

  const handleFirebasePnvClick = async () => {
    setIsVerifyingPnv(true);
    setPnvSuccessMessage(null);
    try {
      const pnvResult = await executeFirebasePnv(cleanPhone, 'Parent');
      if (pnvResult.verified) {
        setPnvSuccessMessage(pnvResult.message);
        if (onPnvSuccess) {
          onPnvSuccess(pnvResult);
        }
      }
    } catch (err: any) {
      console.warn('PNV Verification error:', err);
    } finally {
      setIsVerifyingPnv(false);
    }
  };

  return (
    <div className="w-full space-y-3 animate-fade-in text-left">
      {/* 1-Minute Inquiry Banner: Activated after 1 min (countdown === 0) */}
      {isPost1Min && userResponse === 'none' && (
        <div className="p-3.5 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-2.5 animate-bounce-short">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4 text-amber-800" />
            </div>
            <div className="space-y-0.5 flex-1">
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                Did you receive the SMS OTP on your phone?
              </h4>
              <p className="text-[11px] text-slate-600 font-medium">
                We sent a 6-digit code via SMS to <span className="font-mono font-bold text-slate-800">+91 {cleanPhone}</span> 1 minute ago.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleYes}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yes, I got it</span>
            </button>

            <button
              type="button"
              onClick={handleNo}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No, didn't receive</span>
            </button>
          </div>
        </div>
      )}

      {/* User answered YES: friendly confirmation */}
      {userResponse === 'yes' && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">Great! Please type the 6-digit OTP in the input field above.</span>
          </div>
          <button
            type="button"
            onClick={() => setUserResponse('no')}
            className="text-[10px] font-black text-emerald-700 underline hover:text-emerald-900"
          >
            Need alternative?
          </button>
        </div>
      )}

      {/* User answered NO: Show all alternate verification options */}
      {userResponse === 'no' && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl space-y-3 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <div>
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Alternative Verification Methods
                </h4>
                <p className="text-[10px] text-slate-400">
                  Carrier SMS delivery delays happen. Select a secure verification method:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUserResponse('yes')}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
            >
              Back to SMS
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {/* 1. Firebase Phone Number Verification (PNV) - Carrier SIM Level */}
            <button
              type="button"
              onClick={handleFirebasePnvClick}
              disabled={isVerifyingPnv}
              className="w-full p-2.5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-left transition flex items-center justify-between shadow-md active:scale-98 cursor-pointer group border border-indigo-400/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Radio className={`w-4 h-4 text-white ${isVerifyingPnv ? 'animate-spin' : 'group-hover:scale-110'}`} />
                </div>
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>Firebase Phone Number Verification (PNV)</span>
                    <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      1-Tap SIM
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-100 mt-0.5">
                    Single-tap verification directly from SIM card &amp; mobile carrier without SMS delays.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition" />
            </button>

            {pnvSuccessMessage && (
              <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pnvSuccessMessage}</span>
              </div>
            )}

            {/* 2. Automated Voice Call Verification */}
            <button
              type="button"
              onClick={handleVoiceCallClick}
              disabled={isCalling}
              className="w-full p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-left transition flex items-center justify-between shadow-md active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4 text-white group-hover:animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>Verify through Automated Voice Call</span>
                    <span className="bg-emerald-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Voice Call
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100 mt-0.5">
                    We will call +91 {cleanPhone} and speak your verification code aloud.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition" />
            </button>

            {/* 3. Google Sign-In (Available in auth flows) */}
            {context === 'auth' && (
              <button
                type="button"
                onClick={onSelectGoogleLogin}
                className="w-full p-2.5 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-left transition flex items-center justify-between border border-slate-200 shadow-sm active:scale-98 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      Sign In with Google Account
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Verify instantly using your 1-tap Google parent profile
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            )}

            {/* 4. Verify via Email OTP */}
            {onSelectEmailOtp && (
              <button
                type="button"
                onClick={onSelectEmailOtp}
                className="w-full p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-left transition flex items-center justify-between border border-slate-700 active:scale-98 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-100">
                      Receive OTP via Registered Email
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Send 6-digit code to {email || 'your email inbox'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            )}

            {/* 5. WhatsApp Verification */}
            {onSelectWhatsApp && (
              <button
                type="button"
                onClick={onSelectWhatsApp}
                className="w-full p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-left transition flex items-center justify-between border border-slate-700 active:scale-98 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-100">
                      Send Code via WhatsApp
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Receive instant message on WhatsApp (+91 {cleanPhone})
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual trigger visible before 1 min */}
      {!isPost1Min && userResponse === 'none' && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setUserResponse('no')}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition underline cursor-pointer"
          >
            Didn't receive SMS? Try SIM PNV, Voice Call or Google
          </button>
        </div>
      )}
    </div>
  );
}
