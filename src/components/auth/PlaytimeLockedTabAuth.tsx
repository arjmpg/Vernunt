import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, Lock, KeyRound, ShieldCheck, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase.ts';
import { sendFirebaseOtp, verifyFirebaseOtp } from '../../utils/firebasePhoneAuth.ts';
import VernuntLogo from '../VernuntLogo.tsx';

interface PlaytimeLockedTabAuthProps {
  onSuccessLogin: (userProfile: any) => void;
  onStartSignup: (details: { phone?: string; email?: string; phoneVerified?: boolean; emailVerified?: boolean; password?: string }) => void;
  onGoogleSignIn: () => void;
}

type AuthMethod = 'phone' | 'email';
type Mode = 'otp' | 'password';
type AuthAction = 'login' | 'signup';

export const PlaytimeLockedTabAuth: React.FC<PlaytimeLockedTabAuthProps> = ({
  onSuccessLogin,
  onStartSignup,
  onGoogleSignIn
}) => {
  const [authAction, setAuthAction] = useState<AuthAction>('login');
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [mode, setMode] = useState<Mode>('otp');
  
  // Inputs
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

  // Status
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [confirmationResult, setConfirmationResult] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const cleanEmail = email.trim().toLowerCase();

  // Check if contact is registered
  const checkContactRegistration = async (): Promise<{ registered: boolean; profile?: any }> => {
    try {
      if (method === 'phone') {
        if (cleanPhone.length !== 10) {
          setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
          return { registered: false };
        }
        
        // 1. Check local storage cache
        const localCachedUsers = localStorage.getItem('vernunt_users_directory');
        if (localCachedUsers) {
          try {
            const parsed = JSON.parse(localCachedUsers);
            const found = parsed.find((u: any) => {
              const p = (u.phoneNumber || '').replace(/\D/g, '').slice(-10);
              return p === cleanPhone;
            });
            if (found) return { registered: true, profile: found };
          } catch (e) {
            console.debug('Cache check error:', e);
          }
        }

        // 2. Query Firestore
        try {
          const q1 = query(collection(db, 'users'), where('phoneNumber', '==', `+91${cleanPhone}`), limit(1));
          const snap1 = await getDocs(q1);
          if (!snap1.empty) {
            const docData = snap1.docs[0].data();
            return { registered: true, profile: { id: snap1.docs[0].id, ...docData } };
          }
        } catch (e) {
          console.debug('Firestore phone lookup note:', e);
        }

        return { registered: false };
      } else {
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          setErrorMessage('Please enter a valid email address.');
          return { registered: false };
        }

        // 1. Check local storage
        const localCachedUsers = localStorage.getItem('vernunt_users_directory');
        if (localCachedUsers) {
          try {
            const parsed = JSON.parse(localCachedUsers);
            const found = parsed.find((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail);
            if (found) return { registered: true, profile: found };
          } catch (e) {
            console.debug('Email cache check note:', e);
          }
        }

        // 2. Query Firestore
        try {
          const q2 = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            const docData = snap2.docs[0].data();
            return { registered: true, profile: { id: snap2.docs[0].id, ...docData } };
          }
        } catch (e) {
          console.debug('Firestore email check note:', e);
        }

        return { registered: false };
      }
    } catch (err: any) {
      console.warn('Contact check error:', err);
      return { registered: false };
    }
  };

  // Dispatch OTP via Firebase Phone Auth / Firestore (Zero on-screen OTP exposure)
  const handleSendOtp = async () => {
    setErrorMessage('');
    setInfoMessage('');
    
    if (method === 'phone' && cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (method === 'email' && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      if (method === 'phone') {
        const result = await sendFirebaseOtp(cleanPhone, 'Parent', 'locked-tab-recaptcha');
        if (result.confirmationResult) {
          setConfirmationResult(result.confirmationResult);
        }
        setOtpSent(true);
        setOtpCode(''); // Never prefill code on screen
        setCountdown(60);
        setInfoMessage(`✓ 6-digit verification code sent via SMS to +91 ${cleanPhone}. Please enter it below.`);
      } else {
        await fetch('/api/auth/send-sms-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            role: 'Parent',
            purpose: authAction === 'login' ? 'parent_login' : 'parent_registration'
          })
        });
        setOtpSent(true);
        setOtpCode(''); // Never prefill code on screen
        setCountdown(60);
        setInfoMessage(`✓ 6-digit verification code sent to ${cleanEmail}. Please enter it below.`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch verification code. Please check details and retry.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign In or Sign Up submission via Firebase OTP verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const { registered, profile } = await checkContactRegistration();

      if (authAction === 'login') {
        if (mode === 'otp') {
          if (!otpSent) {
            await handleSendOtp();
            return;
          }

          if (!otpCode || otpCode.length !== 6) {
            setErrorMessage('Please enter the 6-digit verification code received on your mobile phone.');
            setLoading(false);
            return;
          }

          if (method === 'phone') {
            await verifyFirebaseOtp(cleanPhone, otpCode, confirmationResult, 'Parent');
          } else {
            const res = await fetch('/api/auth/verify-sms-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: cleanEmail,
                otp: otpCode.trim(),
                role: 'Parent'
              })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.success) {
              throw new Error(data?.error || 'Incorrect verification code. Please check your email and try again.');
            }
          }

          if (registered && profile) {
            onSuccessLogin(profile);
            return;
          } else {
            // New user registering via OTP
            onStartSignup({
              phone: method === 'phone' ? `+91${cleanPhone}` : undefined,
              email: method === 'email' ? cleanEmail : undefined,
              phoneVerified: method === 'phone',
              emailVerified: method === 'email'
            });
            return;
          }
        } else {
          // Password mode
          if (!password || password.length < 4) {
            setErrorMessage('Please enter your password.');
            setLoading(false);
            return;
          }

          if (registered && profile) {
            onSuccessLogin(profile);
            return;
          } else {
            setErrorMessage('No account found with these credentials. Please switch to Create Account or Sign In with OTP.');
            setLoading(false);
            return;
          }
        }
      } else {
        // Sign up action
        if (mode === 'otp' && !otpSent) {
          await handleSendOtp();
          return;
        }

        if (mode === 'otp') {
          if (!otpCode || otpCode.length !== 6) {
            setErrorMessage('Please enter the 6-digit verification code.');
            setLoading(false);
            return;
          }
          if (method === 'phone') {
            await verifyFirebaseOtp(cleanPhone, otpCode, confirmationResult, 'Parent');
          }
        }

        onStartSignup({
          phone: method === 'phone' ? `+91${cleanPhone}` : undefined,
          email: method === 'email' ? cleanEmail : undefined,
          phoneVerified: method === 'phone',
          emailVerified: method === 'email',
          password: password || undefined
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-rose-600 p-6 sm:p-8 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/30">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Parent Identity &amp; Child Safety First</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Unlock Playtime Connect
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-md mx-auto leading-relaxed">
            Sign in or create your verified parent profile to view nearby neighborhood kids, schedule playtimes, and split venue costs safely.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Toggle Login vs Sign Up */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthAction('login');
              setErrorMessage('');
              setOtpSent(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              authAction === 'login'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parent Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthAction('signup');
              setErrorMessage('');
              setOtpSent(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              authAction === 'signup'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Free Account
          </button>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Or with Mobile / Email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Method Switcher: Mobile Number vs Email */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              setErrorMessage('');
              setOtpSent(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              method === 'phone'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Number</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setErrorMessage('');
              setOtpSent(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              method === 'email'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email ID</span>
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {method === 'phone' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Indian Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    setOtpSent(false);
                  }}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Parent Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setOtpSent(false);
                  }}
                  placeholder="parent@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
                />
              </div>
            </div>
          )}

          {/* Mode switch for Email (Password vs OTP) */}
          {method === 'email' && authAction === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Sign in with:</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className={`font-bold transition cursor-pointer ${mode === 'otp' ? 'text-indigo-600 underline' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className={`font-bold transition cursor-pointer ${mode === 'password' ? 'text-indigo-600 underline' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Password
                </button>
              </div>
            </div>
          )}

          {/* Password Input */}
          {(mode === 'password' || (authAction === 'signup' && method === 'email')) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
                />
              </div>
            </div>
          )}

          {/* OTP Section */}
          {mode === 'otp' && otpSent && (
            <div className="space-y-3 pt-2 animate-fade-in">
              {/* Secure SMS Verification Status Banner (Zero On-Screen OTP Exposure) */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2.5">
                <span className="text-base">📲</span>
                <div>
                  <p className="font-bold">SMS Sent via Firebase</p>
                  <p className="text-[11px] text-indigo-700">
                    Verification code dispatched to {method === 'phone' ? `+91 ${cleanPhone}` : cleanEmail}. Enter below.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    6-Digit Verification Code
                  </label>
                  {countdown > 0 ? (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'otp' && !otpSent ? (
              <>
                <span>Send Verification OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : authAction === 'login' ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; Unlock Playtime</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Account &amp; Unlock</span>
              </>
            )}
          </button>
        </form>

        {/* Safety Note */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Aadhaar-compliant, zero ad trackers &amp; child identity protection.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaytimeLockedTabAuth;
