import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Sparkles, 
  Crown, 
  User, 
  Mail, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';

interface GoogleAccountSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoogleAccount: (account: { email: string; displayName: string; photoURL?: string; role?: string }) => void;
}

const PRESET_ACCOUNTS = [
  {
    email: 'arjunmpgupta@gmail.com',
    displayName: 'Arjun Gupta',
    badge: 'System Administrator (Superuser)',
    role: 'Admin',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    admin: true
  },
  {
    email: 'ardha@vernunt.com',
    displayName: 'Ardha Vernunt Admin',
    badge: 'Safety & Audit Lead (Admin)',
    role: 'Admin',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    admin: true
  },
  {
    email: 'priya.sharma.parent@gmail.com',
    displayName: 'Priya Sharma (Parent & Kid)',
    badge: 'Verified Community Parent',
    role: 'Parent',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    admin: false
  },
  {
    email: 'vikram.mehta.events@gmail.com',
    displayName: 'Vikram Mehta (Art & Clay Camp)',
    badge: 'Verified Event Organizer',
    role: 'Event Organizer',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    admin: false
  }
];

export default function GoogleAccountSelectModal({
  isOpen,
  onClose,
  onSelectGoogleAccount
}: GoogleAccountSelectModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter a valid Gmail address.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address with @ domain.');
      return;
    }

    const derivedName = customName.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isAdmin = cleanEmail === 'arjunmpgupta@gmail.com' || cleanEmail === 'ardha@vernunt.com';

    onSelectGoogleAccount({
      email: cleanEmail,
      displayName: derivedName,
      role: isAdmin ? 'Admin' : 'Parent',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    });
  };

  return (
    <div 
      id="google-account-select-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-scale-up"
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 via-green-500 to-blue-500 w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-2">
          <div className="flex justify-center mb-1">
            <VernuntLogo size="md" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.55-4.437 10.55-10.714 0-.72-.08-1.265-.175-1.714H12.24z"/>
            </svg>
            <span>Google Identity Account Selector</span>
          </div>

          <h3 className="text-xl font-serif font-black text-slate-900">
            Choose an account to continue
          </h3>
          <p className="text-xs text-slate-500">
            Select a verified profile below or sign in with any custom Gmail ID:
          </p>
        </div>

        {/* Preset Google Accounts */}
        <div className="px-6 space-y-2.5">
          {PRESET_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              id={`btn-select-google-${acc.email.replace(/[@.]/g, '-')}`}
              onClick={() => onSelectGoogleAccount(acc)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                acc.admin 
                  ? 'bg-gradient-to-r from-amber-50/70 to-rose-50/70 border-amber-200 hover:border-amber-400 hover:shadow-md' 
                  : 'bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={acc.photoURL} 
                  alt={acc.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {acc.displayName}
                    </span>
                    {acc.admin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-wider">
                        <Crown className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{acc.email}</p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> {acc.badge}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or enter any Google ID</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Custom Gmail ID Input Form */}
        <form onSubmit={handleCustomSubmit} className="px-6 pb-6 space-y-3">
          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          <div className="space-y-2">
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Gmail / Google Email
              </label>
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setErrorMsg('');
                }}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Parent / Account Holder Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Arjun Gupta"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-custom-google-id"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Continue with this Google Account</span>
          </button>
        </form>
      </div>
    </div>
  );
}
