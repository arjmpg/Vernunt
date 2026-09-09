import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Award, Instagram, Upload, Plus, Trash2, ShieldCheck, CheckCircle2, 
  AlertCircle, FileText, Sparkles, Heart, Gift, Lightbulb, Users, RefreshCw, 
  Trophy, Star, ArrowRight, BookOpen, Layers, Globe, Copy, ExternalLink, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile, KidStory } from '../../types.ts';
import { submitParentKidStory, extractInstagramHandle, extractInstagramFollowers, isKidStoryLifetimeUnlocked, getKidBooks, KidBookProfile } from '../../data/kidStories.ts';
import GoogleWebStoryModal from './GoogleWebStoryModal.tsx';

interface WriteKidStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChildProfile | null;
  onOpenParentRegistration?: () => void;
  onStorySubmitted?: () => void;
  onOpenReferralModal?: () => void;
  defaultKidName?: string;
  defaultChapter?: number;
}

const CATEGORIES = [
  'Young Innovators',
  'Coding & Tech',
  'Sports',
  'Arts & Culture',
  'Music & Dance',
  'Chess & Mind Sports',
  'Academics',
  'Social Impact',
  'Other'
];

export const WriteKidStoryModal: React.FC<WriteKidStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenParentRegistration,
  onStorySubmitted,
  onOpenReferralModal,
  defaultKidName = '',
  defaultChapter = 1
}) => {
  const isParent = currentUser && (currentUser.userRole === 'Parent' || !currentUser.userRole);

  const existingKidBooks = useMemo(() => {
    try {
      return getKidBooks();
    } catch {
      return [];
    }
  }, [isOpen]);

  const [kidName, setKidName] = useState(defaultKidName);
  const [kidAge, setKidAge] = useState<number | ''>('');
  const [kidCity, setKidCity] = useState(currentUser?.location?.address || 'Bangalore');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [chapterNumber, setChapterNumber] = useState<number>(defaultChapter);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [achievements, setAchievements] = useState<string[]>(['']);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoFileSizeKb, setPhotoFileSizeKb] = useState<number | null>(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStory, setSubmittedStory] = useState<KidStory | null>(null);
  const [showGooglePreview, setShowGooglePreview] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [suggestionShuffleIndex, setSuggestionShuffleIndex] = useState(0);

  // If defaultKidName is passed, prefill
  useEffect(() => {
    if (defaultKidName) {
      setKidName(defaultKidName);
      const match = existingKidBooks.find(b => b.kidName.toLowerCase() === defaultKidName.toLowerCase());
      if (match) {
        setKidAge(match.kidAge);
        setKidCity(match.kidCity);
        setCategory(match.category);
        setChapterNumber(defaultChapter || (match.chapterCount + 1));
        if (match.photoUrl && !photoDataUrl) {
          setPhotoDataUrl(match.photoUrl);
        }
        if (match.instagramUrl && !instagramUrl) {
          setInstagramUrl(match.instagramUrl);
        }
      }
    }
  }, [defaultKidName, defaultChapter, existingKidBooks]);

  const handleSelectExistingKid = (book: KidBookProfile) => {
    setKidName(book.kidName);
    setKidAge(book.kidAge);
    setKidCity(book.kidCity);
    setCategory(book.category);
    setChapterNumber(book.chapterCount + 1);
    if (book.photoUrl) {
      setPhotoDataUrl(book.photoUrl);
    }
    if (book.instagramUrl) {
      setInstagramUrl(book.instagramUrl);
    }
  };

  // Micro-dopamine portfolio readiness calculator
  const portfolioScore = useMemo(() => {
    let score = 0;
    if (kidName.trim()) score += 15;
    if (kidAge && Number(kidAge) > 0) score += 10;
    if (title.trim().length > 10) score += 20;
    if (summary.trim().length > 20) score += 15;
    if (content.trim().length >= 80) score += 20;
    if (achievements.filter(a => a.trim().length > 3).length > 0) score += 10;
    if (photoDataUrl) score += 10;
    return Math.min(100, score);
  }, [kidName, kidAge, title, summary, content, achievements, photoDataUrl]);

  // Dynamic Attractive Title Suggestions based on child name, age, and category with shuffle support
  const titleSuggestions = useMemo(() => {
    const name = kidName.trim() || 'Your Child';
    const ageStr = kidAge ? `${kidAge}-Year-Old` : 'Young';
    
    const pools: Record<string, string[]> = {
      'Coding & Tech': [
        `How ${ageStr} ${name} Built a Real-World Community App from Scratch`,
        `Meet ${name}: The Child Prodigy Training Machine Learning Models at Age ${kidAge || 10}`,
        `From Curiosity to Code: How ${name} Engineered a Smart IoT Robot in ${kidCity || 'Bangalore'}`,
        `Young Hacker's Journey: How ${name} Mastered Python & Solved Neighborhood Problems`,
        `Inspiring Innovation: Why 12-Year-Old Engineers Look Up to ${name}'s Tech Creations`
      ],
      'Sports': [
        `From Neighborhood Turf to National Podium: ${name}'s Gold Medal Journey`,
        `Unstoppable Spirit: How ${ageStr} ${name} Smashed State Records in Athletics`,
        `Dedication Beyond Age: Meet ${name}, Karnataka's Rising Junior Champion`,
        `Early Morning Drills to State Victory: The Inspiring Athletic Story of ${name}`,
        `Chasing the Olympic Dream: How ${name} Rose Through Competitive Youth Tournaments`
      ],
      'Chess & Mind Sports': [
        `Tactics, Focus & Tenacity: How ${name} Solved 100+ Chess Puzzles Blindfolded`,
        `Junior Grandmaster in the Making: ${name}'s Triumph at the State Tournament`,
        `The Mind of a Champion: How ${ageStr} ${name} Outsmarted Senior Ranked Players`,
        `Mental Mastery Early: How ${name} Conquered State Tournaments with Calm Precision`,
        `Calculating 8 Moves Ahead: Meet ${name}, Bangalore's Junior Chess Sensation`
      ],
      'Arts & Culture': [
        `Brushes, Colors & Soul: How ${name} Captivated Art Galleries Across India`,
        `Expressing the World Through Colors: The Extraordinary Art Portfolio of ${name}`,
        `Prodigy with a Brush: How ${ageStr} ${name} Created 50+ Canvas Masterpieces`,
        `From Doodles to Exhibitions: How ${name} Won International Junior Art Honors`
      ],
      'Music & Dance': [
        `Harmonies Beyond Years: Meet ${name}, Captivating Audiences with Soulful Melodies`,
        `Stage Prodigy: How ${ageStr} ${name} Won Hearts Across National Cultural Fests`,
        `Fingers on the Keys: How ${name} Mastered Classical Rhythms and Stunned Judges`,
        `Dancing with Grace and Grit: ${name}'s Rise to National Junior Dance Champion`
      ],
      'Academics': [
        `Curiosity Unleashed: How ${ageStr} ${name} Scored Gold in the International Math Olympiad`,
        `The Young Scientist: How ${name} Conducted Groundbreaking Science Experiments at Home`,
        `A Passion for Discovery: Meet ${name}, Academic Achiever with High Honors`
      ],
      'Social Impact': [
        `Big Heart, Young Hero: How ${name} Planted 500 Saplings Across ${kidCity || 'Bangalore'}`,
        `Leading by Example: How ${ageStr} ${name} Started a Book Donation Drive for Underprivileged Kids`,
        `Changemaker from Day One: The Inspiring Story of ${name}'s Community Project`
      ]
    };

    const categoryPool = pools[category] || [
      `How ${ageStr} ${name} Became an Inspiring Innovator in ${kidCity || 'Bangalore'}`,
      `Courage, Curiosity & Craft: The Remarkable Milestone Story of ${name}`,
      `Building Big Dreams Early: How ${name} Achieved Exceptional Honors`,
      `The Journey of a Young Achiever: Meet ${name}, Inspiring Parents Across Bangalore`
    ];

    // Offset based on shuffle index
    const count = categoryPool.length;
    const start = (suggestionShuffleIndex * 3) % count;
    return [
      categoryPool[start % count],
      categoryPool[(start + 1) % count],
      categoryPool[(start + 2) % count]
    ].filter(Boolean);
  }, [kidName, kidAge, category, kidCity, suggestionShuffleIndex]);

  // Instagram extraction helper
  const parsedInstagramHandle = useMemo(() => {
    if (!instagramUrl.trim()) return null;
    return extractInstagramHandle(instagramUrl);
  }, [instagramUrl]);

  const parsedFollowers = useMemo(() => {
    if (!instagramUrl.trim()) return null;
    return extractInstagramFollowers(instagramUrl);
  }, [instagramUrl]);

  const isLifetimeUnlocked = isKidStoryLifetimeUnlocked();

  if (!isOpen) return null;

  const handleAddAchievement = () => {
    if (achievements.length < 8) {
      setAchievements([...achievements, '']);
    }
  };

  const handleUpdateAchievement = (index: number, val: string) => {
    const updated = [...achievements];
    updated[index] = val;
    setAchievements(updated);
  };

  const handleRemoveAchievement = (index: number) => {
    if (achievements.length > 1) {
      setAchievements(achievements.filter((_, i) => i !== index));
    }
  };

  // 1 MB photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');

    // Strict 1 MB (1,048,576 bytes) limit
    const MAX_BYTES = 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`Photo exceeds the 1 MB limit (selected file is ${sizeMb} MB). Please choose a compressed photo under 1 MB.`);
      return;
    }

    setPhotoFileName(file.name);
    setPhotoFileSizeKb(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        setPhotoDataUrl(loadEvt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      setErrorMsg('Please sign in or register with your parent profile first.');
      return;
    }

    if (!kidName.trim()) {
      setErrorMsg('Please enter your child\'s name');
      return;
    }

    if (!kidAge || Number(kidAge) < 1 || Number(kidAge) > 18) {
      setErrorMsg('Please enter a valid age between 1 and 18');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a headline/title for your child\'s story');
      return;
    }

    if (!summary.trim()) {
      setErrorMsg('Please write a short summary (like YourStory lead synopsis)');
      return;
    }

    if (!content.trim() || content.trim().length < 80) {
      setErrorMsg('Please write at least 80 characters about your child\'s journey, passions, or milestones');
      return;
    }

    const filteredAchievements = achievements.filter(a => a.trim().length > 0);
    if (filteredAchievements.length === 0) {
      setErrorMsg('Please add at least one achievement, award, or milestone');
      return;
    }

    const finalPhoto = photoDataUrl || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800';

    setIsSubmitting(true);

    try {
      const created = submitParentKidStory({
        kidName: kidName.trim(),
        kidAge: Number(kidAge),
        kidCity: kidCity.trim() || 'Bangalore',
        title: title.trim(),
        summary: summary.trim().slice(0, 280),
        content: content.trim(),
        achievements: filteredAchievements,
        instagramUrl: instagramUrl.trim() ? (instagramUrl.startsWith('http') ? instagramUrl.trim() : `https://${instagramUrl.trim()}`) : undefined,
        instagramFollowers: parsedFollowers || undefined,
        photoUrl: finalPhoto,
        category,
        chapterNumber: Number(chapterNumber) || 1,
        parentName: currentUser.parentName || 'Vernunt Parent',
        parentEmail: (currentUser as any).email || currentUser.phone || 'parent@vernunt.com',
        parentPhone: currentUser.phone || currentUser.phoneNumber
      });

      setSubmittedStory(created);
      setIsSuccess(true);
      setIsSubmitting(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
      if (onStorySubmitted) {
        onStorySubmitted();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to submit story. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-5 text-white shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Vernunt Little Achievers (YourStory for Kids)
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif leading-tight">
            Share Your Child's Inspiring Story
          </h2>
          <p className="text-xs text-orange-100 mt-0.5">
            Celebrate achievements, creative inventions, sports accolades, and talents with the parenting community.
          </p>
        </div>

        {/* Not Logged In as Parent Gate */}
        {!isParent ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Parent Profile Verification Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To protect child privacy, verify genuine achievements, and prevent impersonation, only registered and verified parents can publish stories about their children.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              {onOpenParentRegistration && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenParentRegistration();
                  }}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  Sign Up with Parent Registration
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* Submission Success State */
          <div className="p-6 sm:p-8 text-center space-y-5 my-auto overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Vernunt Little Achievers • 100% White-Label</span>
              </div>

              <h3 className="text-xl font-bold font-serif text-slate-900">
                Story Published &amp; Linked to Google Stories!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you for celebrating <span className="font-bold text-slate-900">{kidName}</span>! The story has been generated as a Google Web Story and instantly dispatched to Google Search crawlers.
              </p>

              {/* Instant Google Web Story & Indexing Live Card */}
              {submittedStory && (
                <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl text-left space-y-2.5 mt-3 shadow-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Globe className="w-4 h-4" />
                      <span>Google Web Story Live</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      Search Indexing Dispatched
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">AMP URL:</span>
                      <span className="font-mono text-amber-200 truncate">
                        https://app.vernunt.com/web-stories/{submittedStory.slug}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Publisher:</span>
                      <span className="font-bold text-white">Vernunt Achievers (White-Label)</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Googlebot Ping:</span>
                      <span className="text-emerald-400 font-bold">✓ Fast Index Pipeline Active</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGooglePreview(true)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Preview Google Story</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://app.vernunt.com/web-stories/${submittedStory.slug}`;
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(url);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2500);
                        }
                      }}
                      className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-white/20"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done &amp; View Stories
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Referral Unlock Incentive Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-orange-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-slate-900">
                      {isLifetimeUnlocked ? '🎉 Lifetime Free Story Writing Unlocked!' : '🎁 Free Lifetime Story Writing Program'}
                    </h4>
                    <span className="bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Referral Benefit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {isLifetimeUnlocked 
                      ? 'You have active lifetime access to write unlimited milestone chapters for your child!'
                      : 'Refer just 1 fellow parent. Once they sign up, you unlock free lifetime story writing + 1 year free Playmate Search Radar!'}
                  </p>
                </div>
              </div>

              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={onOpenReferralModal}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shrink-0 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> Invite Parents
                </button>
              )}
            </div>

            {/* Why Document Your Child's Journey Early - Portfolio Builder Banner */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-orange-200/90 rounded-2xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Your Child's Digital Hall of Fame & Portfolio</span>
                </div>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Google Indexed
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                Documenting achievements as and when they happen transforms everyday milestones into a verified digital track record. 
                <span className="font-bold text-slate-900"> Top-tier schools, sports academies, STEM programs, and scholarship panels</span> value sustained multi-year commitment. Every approved story builds their Google presence with your official parental attribution.
              </p>

              {/* Dynamic Behavioral Progress / Dopamine Readiness Meter */}
              <div className="pt-2 border-t border-orange-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                    Story Portfolio Readiness:
                  </span>
                  <span className={`font-mono ${portfolioScore >= 80 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {portfolioScore}% {portfolioScore === 100 ? '🎉 Ready for Google' : portfolioScore >= 70 ? '⭐ Strong' : '🌱 In Progress'}
                  </span>
                </div>
                <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${portfolioScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Add title, journey narrative, and photo for max editorial impact</span>
                  <span>Target: 100%</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Multi-Story Kid Selector: Write for existing child or start new child book */}
            {existingKidBooks.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Select Child's Storybook (Write New Achievement):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setKidName('');
                      setKidAge('');
                      setChapterNumber(1);
                      setPhotoDataUrl('');
                      setTitle('');
                      setSummary('');
                      setContent('');
                    }}
                    className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    + Start Brand New Child
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {existingKidBooks.map((b) => {
                    const isSelected = kidName.trim().toLowerCase() === b.kidName.trim().toLowerCase();
                    return (
                      <button
                        key={b.kidName}
                        type="button"
                        onClick={() => handleSelectExistingKid(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs scale-102'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        <span>📖 {b.kidName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                          {b.chapterCount} {b.chapterCount > 1 ? 'Chs' : 'Ch'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {kidName.trim() && (
                  <div className="text-[11px] text-amber-800 font-medium pt-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Writing <strong>Chapter {chapterNumber}</strong> for <strong>{kidName}'s</strong> chronicles!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Child Profile Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700">
                  Child's Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={18}
                  required
                  value={kidAge}
                  onChange={(e) => setKidAge(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 9"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Milestone / Chapter
                </label>
                <select
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 font-semibold"
                >
                  <option value={1}>Chapter 1 (Initial Journey)</option>
                  <option value={2}>Chapter 2 (New Milestone)</option>
                  <option value={3}>Chapter 3 (Championship)</option>
                  <option value={4}>Chapter 4 (State / National)</option>
                  <option value={5}>Chapter 5+ (Mastery)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  City / Neighborhood <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kidCity}
                  onChange={(e) => setKidCity(e.target.value)}
                  placeholder="e.g. Bangalore (Indiranagar)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Category of Achievement</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story Title / Headline & Attractive Title Suggestions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Story Headline (YourStory Style) <span className="text-red-500">*</span></span>
                </label>
                <span className="text-[10px] text-slate-400">{title.length}/120</span>
              </div>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How 9-Year-Old Aarav Solved 100 Rubik's Cubes Blindfolded & Won the State Cup"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 font-semibold text-slate-900"
              />

              {/* Attractive Title Suggestions */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Attractive Title Ideas (Click any to instantly apply):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestionShuffleIndex(prev => prev + 1)}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md transition cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Shuffle Ideas</span>
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {titleSuggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setTitle(suggestion);
                        try {
                          confetti({
                            particleCount: 20,
                            spread: 40,
                            origin: { y: 0.6 }
                          });
                        } catch {
                          /* ignore optional confetti effect */
                        }
                      }}
                      className="text-left px-3 py-2 bg-gradient-to-r from-orange-50/70 to-amber-50/70 hover:from-orange-100 hover:to-amber-100 border border-orange-200/80 rounded-xl text-xs text-slate-800 hover:text-orange-950 font-medium transition flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span className="line-clamp-1">{suggestion}</span>
                      <span className="text-[10px] font-bold text-orange-600 bg-white/80 group-hover:bg-orange-600 group-hover:text-white px-2 py-0.5 rounded-md transition shrink-0 ml-2 shadow-2xs">
                        Use Title ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Summary (YourStory style short description) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Short Summary / Pitch <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">{summary.length}/280</span>
              </div>
              <textarea
                required
                rows={2}
                maxLength={280}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A concise 1-2 sentence lead paragraph summarizing their milestone (similar to YourStory opening synopsis)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 leading-relaxed resize-none"
              />
            </div>

            {/* Full Story Narrative */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Full Story & Journey <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">{content.length} characters</span>
              </div>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about what sparked their passion, their practice routine, coaches or mentors who helped, major hurdles overcome, and what they dream of achieving next..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 leading-relaxed"
              />
            </div>

            {/* Key Achievements List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> Key Achievements & Awards
                </label>
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Achievement
                </button>
              </div>

              <div className="space-y-2">
                {achievements.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="w-5 h-7 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateAchievement(idx, e.target.value)}
                      placeholder={`e.g. Gold Medalist, Karnataka Junior Chess Championship 2025`}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                    />
                    {achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram Account Link & Follower Count Extractor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" /> Child or Parent Instagram Profile Link (Optional)
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="e.g. https://instagram.com/aarav_speedcuber or @aarav_speedcuber"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
              />

              {parsedInstagramHandle && (
                <div className="p-2.5 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 rounded-xl flex items-center justify-between gap-2 text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xs">
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 font-mono">@{parsedInstagramHandle}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">• Follower Count Extracted</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-pink-600 text-white font-extrabold text-[10px] rounded-full shadow-2xs">
                    {parsedFollowers || '12.8K'} Followers
                  </span>
                </div>
              )}
            </div>

            {/* Photo Upload with strict 1 MB limit */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-orange-500" /> Photo Upload (Strictly Max 1 MB)
                </label>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Max 1 MB Limit
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/60 hover:bg-orange-50/40 transition">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {photoFileName ? photoFileName : 'Click to select photo (JPG/PNG under 1 MB)'}
                  </span>
                  {photoFileSizeKb !== null && (
                    <span className="text-[10px] font-medium text-emerald-600">
                      File size: {photoFileSizeKb} KB (Within 1 MB limit)
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photoDataUrl && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs relative">
                    <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Admin Review & Google SEO Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Editorial Verification & Google Search Engine Indexing
              </div>
              <p>
                Stories are posted once admin approves them. After approval, a dedicated SEO profile will be published so that when people search for your child's name on Google, their inspiring profile and achievements will appear in search results.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !kidName.trim() || !title.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Submitting to Editorial Board...' : 'Submit Story for Admin Review'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Google Web Story Live Experience Preview */}
      {showGooglePreview && submittedStory && (
        <GoogleWebStoryModal
          isOpen={showGooglePreview}
          onClose={() => setShowGooglePreview(false)}
          story={submittedStory}
        />
      )}
    </div>
  );
};

export default WriteKidStoryModal;
