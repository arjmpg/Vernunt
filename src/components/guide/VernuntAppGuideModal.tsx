import React, { useState } from 'react';
import { 
  Compass, 
  Users, 
  Radio, 
  Baby, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VernuntAppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const GUIDE_STEPS = [
  {
    stepNumber: 1,
    title: 'Playmate Radar & Dating-App Style Swipe',
    subtitle: 'Discover verified neighborhood children for playdates',
    badge: 'Step 1 of 5 • Discovery',
    icon: Compass,
    emoji: '🧭',
    accentColor: 'from-rose-700 to-red-800',
    description: 'Find local children nearby matching your child’s age, languages, and favorite hobbies like Lego, cycling, or arts.',
    highlights: [
      'Swipe Right 💖 on a playmate card to send a playdate connection request.',
      'Swipe Left ✕ to smoothly pass to the next nearby neighborhood profile.',
      'Use the Rewind ↺ button anytime to bring back a profile you passed.',
      'Toggle easily between modern Swipe Deck, traditional List, and Map views.'
    ],
    targetTab: 'radar'
  },
  {
    stepNumber: 2,
    title: 'Vernunt Circles & Groups (Peanut-Style)',
    subtitle: 'Moms & Dads safe spaces with 3 privacy tiers',
    badge: 'Step 2 of 5 • Community',
    icon: Users,
    emoji: '🌸',
    accentColor: 'from-amber-600 to-rose-700',
    description: 'Join local parenting circles or create your own neighborhood community with granular privacy and gender controls.',
    highlights: [
      'Public Groups: Anyone joins immediately and chats freely.',
      'Private Groups: Discoverable in search; requests require admin approval.',
      'Invite-Only: Secret circles accessible exclusively via QR code / link.',
      'Strict Gender Privacy: Moms-only groups are completely hidden from male users.'
    ],
    targetTab: 'groups'
  },
  {
    stepNumber: 3,
    title: 'Vernunt Pages & Live Audio Pods',
    subtitle: 'Raw storytelling, anonymous sharing & live conversations',
    badge: 'Step 3 of 5 • Voice & Expression',
    icon: Radio,
    emoji: '🎙️',
    accentColor: 'from-purple-700 to-indigo-900',
    description: 'An open micro-blogging timeline where parents share uncensored birth stories, parenting hacks, and emotional support.',
    highlights: [
      'Vernunt Safe Shield: Post 100% anonymously for sensitive topics like postpartum mental health or marriage stress.',
      'Vernunt Audio Pods: Drop into live podcast-style audio broadcasts on sleep training, weaning, or toddler tantrums.',
      'Writer Submission Portal: Submit pitches or articles directly to Vernunt’s editorial team for wide community distribution.'
    ],
    targetTab: 'pages'
  },
  {
    stepNumber: 4,
    title: 'Pregnancy & Baby Milestone Tracker',
    subtitle: 'Follow official IAP & WHO pediatric guidelines',
    badge: 'Step 4 of 5 • Child Health',
    icon: Baby,
    emoji: '👶',
    accentColor: 'from-emerald-700 to-teal-900',
    description: 'Track baby immunization schedules, monitor fetal kicks, and log weight/height percentiles from birth to 5 years.',
    highlights: [
      'Complete Indian Academy of Pediatrics (IAP) vaccine timeline from birth to 18 months and beyond.',
      'Toggle doses as received, log clinic details, and print immunization cards.',
      'Gestational week-by-week fruit size comparison and built-in kick counter with timer.',
      'Growth logs with WHO benchmark charts for weight, height, and head circumference.'
    ],
    targetTab: 'tracker'
  },
  {
    stepNumber: 5,
    title: 'Safety Matrix & Privacy Shield',
    subtitle: 'Aadhaar verified parents & zero child data indexing',
    badge: 'Step 5 of 5 • Trust & Security',
    icon: ShieldCheck,
    emoji: '🛡️',
    accentColor: 'from-slate-900 to-slate-800',
    description: 'India’s most secure parenting network, engineered to protect child privacy and parent peace of mind.',
    highlights: [
      'Multi-Factor Auth: Verified Mobile OTP & secure password authentication.',
      'SEO Shield: All sensitive child data, photos, and location coordinates are completely unindexed from search engines.',
      'Profile Visibility: Toggle your representation as Mom, Dad, or Mom & Dad.',
      '4-Digit Drop-Off Handshake PIN for trusted babysitting and playdates.'
    ],
    targetTab: 'profile'
  }
];

export function VernuntAppGuideModal({ isOpen, onClose, onNavigateToTab }: VernuntAppGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === GUIDE_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      confetti({ particleCount: 50, spread: 60 });
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleExploreTab = () => {
    if (onNavigateToTab && currentStep.targetTab) {
      onNavigateToTab(currentStep.targetTab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl animate-fade-in text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentStep.emoji}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                {currentStep.badge}
              </span>
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Vernunt App Walkthrough
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Card for Current Step */}
        <div className={`bg-gradient-to-r ${currentStep.accentColor} text-white rounded-2xl p-5 space-y-2 shadow-xs`}>
          <h2 className="text-xl font-black font-serif tracking-tight">
            {currentStep.title}
          </h2>
          <p className="text-xs text-white/90 leading-relaxed font-medium">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Description & Highlights */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            {currentStep.description}
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Key Capabilities
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {currentStep.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Progress Dots & Buttons */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-1.5">
            {GUIDE_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex ? 'w-6 bg-rose-700' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleExploreTab}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 px-3 py-2 cursor-pointer"
            >
              Try This Feature →
            </button>

            <button
              type="button"
              id="btn-guide-next"
              onClick={handleNext}
              className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{isLast ? "Finish Tour 🎉" : "Next"}</span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
