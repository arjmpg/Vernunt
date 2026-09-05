import React, { useState } from 'react';
import { Instagram, Copy, Check, Share2, Sparkles, X, Download, ShieldCheck, Heart } from 'lucide-react';
import { KidStory } from '../../types.ts';
import { extractInstagramHandle } from '../../data/kidStories.ts';

interface InstagramShareModalProps {
  story: KidStory;
  isOpen: boolean;
  onClose: () => void;
}

export const InstagramShareModal: React.FC<InstagramShareModalProps> = ({
  story,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!isOpen) return null;

  const kidHandle = story.instagramUrl ? extractInstagramHandle(story.instagramUrl) : '';
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/kid-stories/${story.slug}`
    : `https://vernunt.com/kid-stories/${story.slug}`;

  const defaultCaption = `🌟 PROUD PARENT MOMENT! 🌟\nSo incredibly proud to share ${story.kidName}'s achievement on Vernunt (India's #1 Platform for Young Achievers)!\n\n"${story.title}"\n\n🏆 Key Milestones:\n${story.achievements.slice(0, 3).map(a => `• ${a}`).join('\n')}\n\n${kidHandle ? `Follow ${story.kidName}'s journey at @${kidHandle}\n` : ''}Read ${story.kidName}'s full verified story & talent portfolio:\n👉 ${shareUrl}\n\n#ProudParent #VernuntAchievers #YoungGenius #${story.kidName.replace(/[^a-zA-Z]/g, '')} #BangaloreKids #ChildProdigy #ParentingWin #FutureLeader`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(defaultCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${story.kidName}'s Achievement on Vernunt`,
          text: defaultCaption,
          url: shareUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } catch {
        // User dismissed or share failed
      }
    } else {
      handleCopyCaption();
    }
  };

  const handleOpenInstagram = () => {
    handleCopyCaption();
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                1-Click Instagram Share
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-extrabold">Parent Profile</span>
              </h3>
              <p className="text-xs text-rose-100">
                Post your child's story to your Instagram Feed or Story in seconds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Card Preview for Instagram Story */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-slate-200 relative bg-slate-800">
              <img src={story.photoUrl} alt={story.kidName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                <span className="text-[9px] font-black uppercase text-amber-300">Achiever</span>
                <span className="text-[10px] font-bold truncate">{story.kidName}</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">
                <Sparkles className="w-3 h-3" /> Ready-to-Post Instagram Format
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                {story.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Verified child achievement badge by Vernunt • Indexed on Google Search
              </p>
              {story.instagramFollowers && (
                <div className="text-[11px] font-semibold text-pink-600 flex items-center gap-1 justify-center sm:justify-start">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{story.instagramFollowers} Instagram Followers extracted</span>
                </div>
              )}
            </div>
          </div>

          {/* Formatted Instagram Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Optimized Instagram Caption & Hashtags</span>
              </label>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Caption'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-slate-800 shadow-inner">
              {defaultCaption}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenInstagram}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:from-pink-700 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>Copy Caption & Launch Instagram</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>{shared ? 'Shared!' : 'Share to Instagram Story'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyCaption}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-600" />
                <span>{copied ? '✓ Caption Copied!' : 'Copy Caption Only'}</span>
              </button>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Parent Tip:</strong> Tagging <strong>@vernunt.kids</strong> in your Instagram story allows our editorial team to re-share your child's achievement to our 50,000+ parent community across Bangalore!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default InstagramShareModal;
