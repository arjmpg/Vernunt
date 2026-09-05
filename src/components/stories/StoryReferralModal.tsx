import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Check, Copy, Share2, Users, ShieldCheck, Trophy, ArrowRight, CheckCircle2, Star, Zap, X } from 'lucide-react';
import { isKidStoryLifetimeUnlocked, unlockKidStoryLifetimeReferral, getStoryReferralCode, getStoryReferralCount } from '../../data/kidStories.ts';

interface StoryReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentIdentifier?: string;
  userProfile?: any;
  onUnlockedSuccess?: () => void;
  onReferralSuccess?: () => void;
}

export const StoryReferralModal: React.FC<StoryReferralModalProps> = ({
  isOpen,
  onClose,
  parentIdentifier,
  userProfile,
  onUnlockedSuccess,
  onReferralSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const activeParentId = parentIdentifier || userProfile?.email || userProfile?.phoneNumber || userProfile?.parentName || 'PARENT';

  useEffect(() => {
    if (isOpen) {
      setIsUnlocked(isKidStoryLifetimeUnlocked());
      setReferralCount(getStoryReferralCount());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const referralCode = getStoryReferralCode(activeParentId);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://vernunt.com/?ref=${referralCode}`;

  const shareText = `Hey fellow parent! 👋 I'm documenting my child's achievements and projects on Vernunt (India's premier young talent network & YourStory for kids). 

Publishing stories builds our kids' official digital portfolio and ranks their name on Google! Use my special parent invite link to get your child featured:
${shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleSimulateRefereeSignUp = () => {
    unlockKidStoryLifetimeReferral();
    setIsUnlocked(true);
    setReferralCount(1);
    setJustUnlocked(true);
    if (onUnlockedSuccess) onUnlockedSuccess();
    if (onReferralSuccess) onReferralSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 text-white relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-amber-200" /> Parent Referral Rewards
              </div>
              <h3 className="text-xl font-bold font-serif">
                Refer 1 Parent, Unlock Lifetime Free Access
              </h3>
              <p className="text-xs text-amber-100 max-w-md leading-relaxed">
                Invite fellow parents to publish their children's achievements. When they register, you instantly unlock lifetime privileges!
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Unlock Status Ribbon */}
          {isUnlocked ? (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    🎉 VIP STATUS: UNLOCKED FOR LIFE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold">Active</span>
                </div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Lifetime Free Story Writing + 1 Year Free Search Radar
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Congratulations! You have active lifetime unlimited authoring access for all your children's stories, plus complimentary Search Radar and Playdate Planner access valid through September 2027!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  {referralCount}/1
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">1 Referral Needed to Unlock</div>
                  <div className="text-[11px] text-slate-600">Share your invite link with any parent friend or school WhatsApp group</div>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleSimulateRefereeSignUp}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer"
                  title="Test referee sign-up immediately"
                >
                  ⚡ Simulate Referee Sign-Up (Demo)
                </button>
              </div>
            </div>
          )}

          {/* Reward Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900">
                Lifetime Free Story Writing
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Publish unlimited stories and milestones as your kids win awards, master instruments, or achieve breakthroughs with zero renewal fees forever.
              </p>
              <div className="text-[10px] font-black text-amber-700 uppercase">
                Worth ₹4,999/yr • FREE FOR LIFE
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/50 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-900">
                1 Year Free Search Radar All-Access
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Full access to Bangalore Concentric Playmate Radar, neighborhood child directory, playdate planner, and direct verified parent messaging.
              </p>
              <div className="text-[10px] font-black text-orange-700 uppercase">
                Worth ₹2,400 • FREE 1 YEAR
              </div>
            </div>
          </div>

          {/* Share Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your Exclusive Referral Invite Link
            </label>
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copied ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>

          {/* Attractive Value Lines */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Why Tell Other Parents About Kid Achiever Stories?</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Academic Portfolio Advantage:</strong> Elite schools and international programs value verifiable digital achievement records over paper certificates.</li>
              <li><strong>Google Search Authority:</strong> Verified stories rank on Google for your child's full name, establishing lasting academic and extracurricular prestige.</li>
              <li><strong>Inspiring Bangalore's Next Gen:</strong> Every published milestone inspires other children in robotics, arts, sports, and social innovation.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default StoryReferralModal;
