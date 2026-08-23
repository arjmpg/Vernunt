import React, { useState } from 'react';
import { 
  Gift, Copy, Check, Users, Sparkles, Key, Share2, MessageCircle, RefreshCw, Send, ShieldCheck
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
  const referralCode = userProfile?.referralCode || `VERN-${(userProfile?.parentName || 'PARENT').split(' ')[0].toUpperCase()}-${(userProfile?.id || 'BLR').slice(-4).toUpperCase()}`;
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${referralCode}` 
    : `https://app.vernunt.com/?ref=${referralCode}`;

  const defaultReferralMessage = `Hey! This app (Vernunt) is so useful for kids to connect with nearby parents in Bangalore, and also for verified daycares, playhomes, and weekend classes. Please check this out and join our neighborhood circle: ${referralLink}`;

  const [customMessage, setCustomMessage] = useState(defaultReferralMessage);

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
    const textToSend = customMessage.trim() || defaultReferralMessage;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const resetMessage = () => {
    setCustomMessage(defaultReferralMessage);
  };

  return (
    <div id="referral-portal-wrapper" className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* Hero Banner: Refer & Earn 1-Year Free Access */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden text-center">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-amber-100 border border-white/20">
            <Gift className="w-4 h-4 animate-bounce" /> 1-Year Free Access Referral Program
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
              Refer a Parent & Get 1-Year Full Access Free!
            </h2>
            <p className="text-xs sm:text-sm text-orange-50 max-w-xl mx-auto leading-relaxed">
              Default access for parents is <strong>₹2,499/year</strong>. Refer just <strong>1 parent friend in Bangalore</strong>, and when they sign up with your referral link, you instantly unlock <strong>1 Full Year of 100% Free Access (₹2,499 Value) + Free Contact Credits!</strong>
            </p>
          </div>

          {/* Referral Code & Quick Link Box */}
          <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/25 max-w-md mx-auto space-y-3">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-100 block">
                Your Unique Bangalore Referral Code
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest my-1 select-all block text-white drop-shadow-xs">
                {referralCode}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/30 p-2 rounded-xl border border-white/20">
              <span className="text-[11px] font-mono text-amber-100 truncate flex-1 px-2 select-all">
                {referralLink}
              </span>
              <button
                type="button"
                id="btn-copy-referral-link"
                onClick={copyReferralLink}
                className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 text-xs font-extrabold rounded-lg transition active:scale-95 flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Generator & Customizer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-[#25D366]">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-800 font-serif">
              WhatsApp Referral Message Generator
            </h3>
          </div>
          <button
            type="button"
            onClick={resetMessage}
            className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Default Text
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Personalize your WhatsApp referral message below or use our dynamic template. Clicking <strong>"Send via WhatsApp"</strong> opens WhatsApp with your message and clickable referral link ready to share with friends, society groups, and school parent communities!
        </p>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
            Editable WhatsApp Message
          </label>
          <textarea
            id="textarea-whatsapp-referral-msg"
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your personal message to recommend Vernunt to your parent friends..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            id="btn-send-whatsapp-referral"
            onClick={shareOnWhatsApp}
            className="flex-1 py-3.5 px-6 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md border-b-2 border-emerald-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Share & Send via WhatsApp</span>
          </button>

          <button
            type="button"
            id="btn-copy-custom-msg"
            onClick={() => {
              navigator.clipboard.writeText(customMessage);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'Copied Message!' : 'Copy Message Text'}</span>
          </button>
        </div>
      </div>

      {/* Referral Statistics & Credit Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-100/60 rounded-2xl text-emerald-600">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400">1-Year Free Access</span>
            <span className="text-base font-serif font-black text-emerald-700">
              {userProfile?.subscriptionActive || (userProfile?.referralCount && userProfile.referralCount > 0) ? 'Unlocked (Active)' : '1 Referral Needed'}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Worth ₹2,499/year</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-orange-100/60 rounded-2xl text-orange-600">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400">Contact View Credits</span>
            <span className="text-2xl font-serif font-black text-slate-900">{userProfile?.contactViewCredits ?? 10}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">+1 bonus credit per signup</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-2xs">
          <div className="p-3 bg-indigo-100/60 rounded-2xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400">Referrals Converted</span>
            <span className="text-2xl font-serif font-black text-slate-900">{userProfile?.referralCount ?? 0}</span>
            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Friends joined platform</p>
          </div>
        </div>
      </div>

      {/* Referral Rules & Benefits */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2.5 text-slate-600 text-left">
        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-500" /> Program Terms & Instant Rewards:
        </span>
        <ul className="text-[11px] space-y-1.5 list-disc pl-4 leading-relaxed text-slate-600">
          <li><strong>₹2,499 Annual Pass Free:</strong> With 1 completed parent referral, your account automatically receives a full 365-day pass with zero recurring subscription charges.</li>
          <li><strong>WhatsApp Redirection:</strong> The invitation link immediately leads your friends to the Bangalore playdate directory.</li>
          <li><strong>Both Parties Benefit:</strong> Your invited friend gets bonus contact unlock credits on registration, and your account receives free credits in real-time.</li>
          <li><strong>No Limits:</strong> Refer as many society neighbors, school parents, and apartment groups as you wish!</li>
        </ul>
      </div>

    </div>
  );
}
