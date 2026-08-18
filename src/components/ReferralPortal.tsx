import React, { useState } from 'react';
import { 
  Gift, Copy, Check, Users, Sparkles, Key, Share2
} from 'lucide-react';
import { ChildProfile } from '../types.ts';
import confetti from 'canvas-confetti';

interface ReferralPortalProps {
  userProfile: ChildProfile | null;
  onUpdateUserProfile: (profile: ChildProfile) => void;
  allPlaymates: ChildProfile[];
}

export default function ReferralPortal({ userProfile, onUpdateUserProfile, allPlaymates }: ReferralPortalProps) {
  const [copied, setCopied] = useState(false);
  
  // Dynamic referral code generation
  const referralCode = userProfile?.referralCode || `REF-${(userProfile?.parentName || 'PARENT').split(' ')[0].toUpperCase()}-${(userProfile?.id || 'UID').slice(0, 4).toUpperCase()}`;
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 40,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = `Hey! Join the Vernunt Parents & Playmates network to find safe, verified local playmates. Use my referral link to sign up and get a free contact view credit instantly! 🎁\n\n👉 Join here: ${referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="referral-portal-wrapper" className="max-w-2xl mx-auto space-y-6">
      
      {/* Redesigned Minimalist & Premium Referral Alliance Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden text-center">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-100">
            <Gift className="w-4 h-4 animate-bounce" /> Vernunt Referral Alliance
          </span>
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">Refer Parents, Earn Safe Contacts!</h2>
            <p className="text-xs sm:text-sm text-orange-50 max-w-lg mx-auto leading-relaxed">
              Invite other parents. When a new parent signs up using your link, <strong>they get 1 free contact view credit</strong> instantly, and you unlock <strong>1 contact view credit per referral</strong> to view non-connected parents' contact coordinates safely.
            </p>
          </div>

          {/* Core Referral Code & Share Block */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 max-w-sm mx-auto flex flex-col items-center justify-center space-y-4">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-200 block">Your Personal Referral Code</span>
              <span className="text-3xl font-mono font-black tracking-widest my-1 select-all block text-white drop-shadow-xs">
                {referralCode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button
                onClick={shareOnWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-b-2 border-emerald-700"
              >
                <Share2 className="w-4 h-4" />
                Refer on WhatsApp
              </button>

              <button
                onClick={copyReferralLink}
                className="w-full py-3 bg-white hover:bg-orange-50 text-orange-600 font-extrabold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied URL!' : 'Copy invite link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Stats Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-100/50 rounded-2xl text-orange-600">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">View Credits Available</span>
            <span className="text-3xl font-serif font-black text-slate-900">{userProfile?.contactViewCredits ?? 0}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Used to view verified phone numbers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-100/50 rounded-2xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Successful Referrals</span>
            <span className="text-3xl font-serif font-black text-slate-900">{userProfile?.referralCount ?? 0}</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">+{userProfile?.referralCount ?? 0} total bonus credits earned</p>
          </div>
        </div>
      </div>

      {/* Help Instructions section */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150/70 space-y-2.5 text-slate-600">
        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-500" /> Active System Benefits & Guidelines:
        </span>
        <ul className="text-[11px] space-y-1.5 list-disc pl-4 leading-relaxed text-slate-550">
          <li>Your unique WhatsApp invitation link embeds your referral security key automatically.</li>
          <li>New parents arriving through your link receive <strong>1 standard Contact Unlock credit</strong> immediately upon creating their first child profile.</li>
          <li>For each completed registration, our security router transfers <strong>1 unlock credit</strong> back into your parent wallet instantly in real-time.</li>
          <li>There is absolutely no cap on referral invite credits. Enjoy safe connection paths!</li>
        </ul>
      </div>

    </div>
  );
}
