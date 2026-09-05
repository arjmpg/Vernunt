import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ChevronLeft, ChevronRight, Sparkles, Award, Instagram, 
  Share2, Compass, ShieldCheck, X, Volume2, VolumeX, Eye, Plus, 
  Layers, Bookmark, CornerDownRight, CheckCircle2, UserCheck, Heart
} from 'lucide-react';
import { KidStory } from '../../types.ts';
import { extractInstagramHandle, incrementStoryViews, getBookThemeForCategory } from '../../data/kidStories.ts';

interface KidStoryBookReaderProps {
  isOpen?: boolean;
  stories: KidStory[];
  initialStoryId?: string;
  initialStoryIndex?: number;
  initialKidName?: string;
  onClose: () => void;
  onConnectRadar?: (kidName: string, kidCity: string) => void;
  onRadarAuthRequired?: (kidName: string) => void;
  isLoggedInParent?: boolean;
  onOpenInstagramShare?: (story: KidStory) => void;
  onOpenShareModal?: (story: KidStory) => void;
  onContactAdmin?: (story: KidStory) => void;
  onDeleteStory?: (storyId: string) => void;
  onAddStoryToKid?: (kidName: string, nextChapter: number) => void;
  currentParentIdentifier?: string;
}

export const KidStoryBookReader: React.FC<KidStoryBookReaderProps> = ({
  isOpen = true,
  stories = [],
  initialStoryId,
  initialStoryIndex = 0,
  initialKidName,
  onClose,
  onConnectRadar,
  onRadarAuthRequired,
  isLoggedInParent = false,
  onOpenInstagramShare,
  onOpenShareModal,
  onContactAdmin,
  onDeleteStory,
  onAddStoryToKid,
  currentParentIdentifier
}) => {
  if (!isOpen) return null;

  // Group stories by kidName
  const kidsMap = useMemo(() => {
    const map = new Map<string, KidStory[]>();
    for (const s of stories) {
      const name = s.kidName.trim();
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(s);
    }
    // Sort each kid's stories chronologically by chapter
    for (const [_, list] of map.entries()) {
      list.sort((a, b) => (a.chapterNumber || 1) - (b.chapterNumber || 1));
    }
    return map;
  }, [stories]);

  const uniqueKidNames = useMemo(() => Array.from(kidsMap.keys()), [kidsMap]);

  // Determine starting kid
  const defaultKid = useMemo(() => {
    if (initialKidName && kidsMap.has(initialKidName)) return initialKidName;
    if (initialStoryId) {
      const match = stories.find(s => s.id === initialStoryId || s.slug === initialStoryId);
      if (match) return match.kidName.trim();
    }
    if (uniqueKidNames.length > 0) return uniqueKidNames[0];
    return '';
  }, [initialKidName, initialStoryId, kidsMap, uniqueKidNames, stories]);

  const [activeKidName, setActiveKidName] = useState<string>(defaultKid);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showToc, setShowToc] = useState<boolean>(false);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Sync when initialStoryId or initialKidName changes
  useEffect(() => {
    if (initialStoryId) {
      const targetStory = stories.find(s => s.id === initialStoryId || s.slug === initialStoryId);
      if (targetStory) {
        const kid = targetStory.kidName.trim();
        setActiveKidName(kid);
        const kidStories = kidsMap.get(kid) || [];
        const idx = kidStories.findIndex(s => s.id === targetStory.id);
        setCurrentPageIndex(idx >= 0 ? idx : 0);
      }
    } else if (initialKidName && kidsMap.has(initialKidName)) {
      setActiveKidName(initialKidName);
      setCurrentPageIndex(0);
    }
  }, [initialStoryId, initialKidName, kidsMap, stories]);

  // Active kid's stories (each page is one story of this kid)
  const currentKidStories = useMemo(() => {
    return kidsMap.get(activeKidName) || [];
  }, [kidsMap, activeKidName]);

  const currentStory: KidStory | undefined = currentKidStories[currentPageIndex] || currentKidStories[0];

  useEffect(() => {
    if (currentStory) {
      incrementStoryViews(currentStory.id);
    }
  }, [currentStory?.id]);

  // Realistic paper rustle acoustic synthesis using Web Audio API
  const playPageTurnSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Page rustle synthesis using white noise buffer + bandpass filter
      const bufferSize = ctx.sampleRate * 0.22; // 220ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.18);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleTurnNext = () => {
    if (currentPageIndex < currentKidStories.length - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      playPageTurnSound();
      setTimeout(() => {
        setCurrentPageIndex(prev => prev + 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  const handleTurnPrev = () => {
    if (currentPageIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      playPageTurnSound();
      setTimeout(() => {
        setCurrentPageIndex(prev => prev - 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleTurnNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handleTurnPrev();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, currentKidStories.length, isFlipping]);

  if (!currentStory || currentKidStories.length === 0) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <div 
          className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-2xl border border-stone-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-stone-900 font-serif">Storybook Collection</h4>
          <p className="text-stone-600 text-xs leading-relaxed">No stories found for this young achiever yet.</p>
          <button 
            type="button"
            onClick={onClose} 
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Storybook
          </button>
        </div>
      </div>
    );
  }

  const theme = getBookThemeForCategory(currentStory.category, currentStory.kidName);
  const kidHandle = currentStory.instagramUrl ? extractInstagramHandle(currentStory.instagramUrl) : '';
  const isOwnerParent = currentParentIdentifier && (
    currentStory.parentEmail.toLowerCase() === currentParentIdentifier.toLowerCase() ||
    (currentStory.parentPhone && currentStory.parentPhone.includes(currentParentIdentifier))
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md overflow-y-auto p-2 sm:p-4 select-none font-sans">
      
      {/* Top Leather Trim Navigation Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 py-2.5 px-4 bg-stone-900/90 text-stone-200 rounded-2xl border border-stone-800 shadow-2xl mb-2 shrink-0">
        
        {/* Child Storybook Picker */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold shrink-0 border border-amber-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storybook Mode</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-400 text-[11px] hidden md:inline">Current Child:</span>
            <select
              value={activeKidName}
              onChange={(e) => {
                setActiveKidName(e.target.value);
                setCurrentPageIndex(0);
              }}
              aria-label="Select Kid Storybook"
              className="bg-stone-800 text-amber-200 font-serif font-bold text-xs py-1.5 px-3 rounded-xl border border-stone-700 outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[180px] sm:max-w-[240px] truncate shadow-inner"
            >
              {uniqueKidNames.map(kid => {
                const count = kidsMap.get(kid)?.length || 0;
                return (
                  <option key={kid} value={kid}>
                    📖 {kid}'s Book ({count} {count > 1 ? 'Chapters' : 'Chapter'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Chapter Selector Table of Contents */}
          {currentKidStories.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowToc(!showToc)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl border border-stone-700 transition cursor-pointer"
                title="View Chapters Index"
              >
                <Layers className="w-3 h-3 text-amber-400" />
                <span className="text-[11px]">Chapter {currentStory.chapterNumber || currentPageIndex + 1}</span>
              </button>

              {showToc && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-stone-900 border border-stone-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-fade-in text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    {activeKidName}'s Chapters
                  </div>
                  {currentKidStories.map((story, sIdx) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => {
                        if (sIdx !== currentPageIndex && !isFlipping) {
                          setFlipDirection(sIdx > currentPageIndex ? 'next' : 'prev');
                          setIsFlipping(true);
                          playPageTurnSound();
                          setTimeout(() => {
                            setCurrentPageIndex(sIdx);
                            setIsFlipping(false);
                            setShowToc(false);
                          }, 450);
                        } else {
                          setShowToc(false);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                        sIdx === currentPageIndex
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">Ch {story.chapterNumber || sIdx + 1}: {story.title}</span>
                      {sIdx === currentPageIndex && <span className="text-amber-400 text-[10px]">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Sound, Write Next Chapter, Close */}
        <div className="flex items-center gap-2 shrink-0">
          {onAddStoryToKid && (
            <button
              type="button"
              onClick={() => {
                onAddStoryToKid(activeKidName, currentKidStories.length + 1);
                onClose();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Add a new milestone chapter to this child's book"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Chapter</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${soundEnabled ? 'text-amber-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-800'}`}
            title={soundEnabled ? 'Page flip sound on' : 'Page flip sound muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <span className="text-xs font-mono text-stone-400 px-1 hidden md:inline">
            Story {currentPageIndex + 1} of {currentKidStories.length}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Close Book (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3D Physical Storybook Stage */}
      <div 
        ref={pageContainerRef}
        className="flex-1 max-w-5xl w-full mx-auto flex items-center justify-center relative select-none"
        style={{ perspective: '2200px' }}
      >
        
        {/* Previous Page Turn Button (Floating on Left) */}
        <button
          type="button"
          onClick={handleTurnPrev}
          disabled={currentPageIndex === 0 || isFlipping}
          className={`absolute left-0 sm:left-2 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl ${
            currentPageIndex === 0
              ? 'opacity-0 pointer-events-none'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white cursor-pointer active:scale-95 shadow-black/60 ring-2 ring-white/20'
          }`}
          title="Turn Page Previous (Arrow Left / Page Up)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Page Turn Button (Floating on Right) */}
        <button
          type="button"
          onClick={handleTurnNext}
          disabled={currentPageIndex >= currentKidStories.length - 1 || isFlipping}
          className={`absolute right-0 sm:right-2 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl ${
            currentPageIndex >= currentKidStories.length - 1
              ? 'opacity-0 pointer-events-none'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white cursor-pointer active:scale-95 shadow-black/60 ring-2 ring-white/20'
          }`}
          title="Turn Page Next (Arrow Right / Space / Page Down)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Hardcover Storybook Exterior Shell */}
        <div 
          className="w-full max-w-4xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-2 sm:p-4 md:p-5 rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] border-2 border-amber-900/50 relative overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 25px 60px rgba(0,0,0,0.85)'
          }}
        >
          {/* Ornate Gold Border Lining around Book Edges */}
          <div className="absolute inset-2 border border-amber-500/20 rounded-2xl pointer-events-none" />

          {/* Book Spine Crease & Shadow in the Center */}
          <div className="absolute left-1/2 top-0 bottom-0 w-10 -translate-x-1/2 bg-gradient-to-r from-black/50 via-black/20 to-black/50 pointer-events-none z-30 hidden md:block" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-amber-500/30 pointer-events-none z-30 hidden md:block" />

          {/* Top Spine Bookmark Ribbon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-10 bg-gradient-to-b from-amber-600 to-amber-700 rounded-b-sm shadow-md z-35 pointer-events-none hidden md:block">
            <div className="absolute bottom-0 inset-x-0 h-2 bg-black/20" />
          </div>

          {/* Realistic 3D Page Body with Framer-Motion Page-Flip Animation */}
          <div className="relative w-full overflow-hidden rounded-2xl" style={{ perspective: '1800px' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeKidName}-${currentStory.id}-${currentPageIndex}`}
                initial={{
                  rotateY: flipDirection === 'next' ? 45 : -45,
                  opacity: 0.7,
                  scale: 0.98,
                  filter: 'brightness(0.9)'
                }}
                animate={{
                  rotateY: 0,
                  opacity: 1,
                  scale: 1,
                  filter: 'brightness(1)'
                }}
                exit={{
                  rotateY: flipDirection === 'next' ? -45 : 45,
                  opacity: 0.6,
                  scale: 0.98,
                  filter: 'brightness(0.85)'
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.25, 1, 0.5, 1]
                }}
                className="w-full bg-[#fdfbf7] text-stone-900 rounded-2xl shadow-inner border border-[#e6dfd1] relative overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                  backgroundImage: 'radial-gradient(#e5ded0 0.8px, transparent 0.8px)',
                  backgroundSize: '22px 22px',
                  boxShadow: 'inset 0 0 50px rgba(180, 160, 130, 0.2), 0 10px 30px rgba(0,0,0,0.35)'
                }}
              >
                
                {/* Dynamic Page Spine Shadow overlay for authentic lighting */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-400/25 via-stone-400/10 to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-400/25 via-stone-400/10 to-transparent pointer-events-none z-10" />

                {/* Page Content Container: Dual-Page Grid on Desktop */}
                <div className="p-4 sm:p-7 md:p-9 max-h-[75vh] overflow-y-auto space-y-6">
                  
                  {/* Top Chapter Header Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-300/80">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-900 font-serif">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Chapter {currentStory.chapterNumber || currentPageIndex + 1} of {currentKidStories.length} • {currentStory.category}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-serif italic">
                        {activeKidName}'s Chronicles • Published & Verified in Vernunt Gazette
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Google Indexed
                      </span>
                      <span className="text-xs font-serif font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                        Page {currentPageIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Two-Column Open Book Layout on Medium/Large Screens */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PAGE WING: Child Portrait, Summary Quote, Accolades Plaque */}
                    <div className="md:col-span-5 space-y-4">
                      
                      {/* Portrait with Antique Gilded Frame */}
                      <div className="relative group">
                        <div className="w-full aspect-4/3 rounded-2xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-stone-300 relative bg-stone-200">
                          <img
                            src={currentStory.photoUrl}
                            alt={currentStory.kidName}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-900/40 to-transparent p-3 text-white flex items-end justify-between">
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-amber-300 font-serif">{currentStory.kidName}</div>
                              <div className="text-[10px] text-stone-300 font-medium">{currentStory.kidCity}</div>
                            </div>
                            <span className="text-[10px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
                              {currentStory.kidAge} Yrs
                            </span>
                          </div>
                        </div>

                        {/* 1-Click Instagram Share Button under Photo */}
                        <button
                          type="button"
                          onClick={() => {
                            const shareFn = onOpenInstagramShare || onOpenShareModal;
                            if (shareFn) shareFn(currentStory);
                          }}
                          className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          <span>Share Chapter to Instagram</span>
                        </button>
                      </div>

                      {/* Pull Quote */}
                      <div className="bg-amber-500/10 border-l-4 border-amber-600 p-3 rounded-r-xl font-serif text-stone-800 text-xs sm:text-sm leading-relaxed italic">
                        "{currentStory.summary}"
                      </div>

                      {/* Verified Accolades Plaque */}
                      <div className="space-y-2 bg-stone-100/90 p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-serif">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Key Accolades in this Chapter</span>
                        </div>

                        <div className="space-y-1.5">
                          {currentStory.achievements.map((ach, idx) => (
                            <div key={idx} className="text-xs text-stone-700 flex items-start gap-2 leading-tight">
                              <span className="text-amber-600 font-bold shrink-0 mt-0.5">✦</span>
                              <span>{ach}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT PAGE WING: Story Title & Complete Editorial Narrative */}
                    <div className="md:col-span-7 space-y-4">
                      
                      {/* Chapter Title */}
                      <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug">
                          {currentStory.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-medium">
                          <span>Parent: <strong className="text-stone-700">{currentStory.parentName}</strong></span>
                          <span>•</span>
                          <span>{new Date(currentStory.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      {/* Editorial Narrative Text with Illuminated Drop Cap */}
                      <div className="font-serif text-sm sm:text-base text-stone-800 leading-relaxed space-y-3 pt-2">
                        <p className="whitespace-pre-line text-justify first-letter:text-5xl first-letter:font-bold first-letter:text-amber-800 first-letter:mr-2.5 first-letter:float-left first-letter:font-serif first-letter:leading-none">
                          {currentStory.content}
                        </p>
                      </div>

                      {/* Connect on Search Radar Box */}
                      <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-orange-600" />
                            <span>Connect with {currentStory.kidName} on Search Radar</span>
                          </div>
                          <p className="text-[11px] text-stone-600">
                            Coordinate playdates & swap coaching tips in {currentStory.kidCity}.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isLoggedInParent) {
                              onConnectRadar?.(currentStory.kidName, currentStory.kidCity);
                            } else {
                              onRadarAuthRequired?.(currentStory.kidName);
                            }
                          }}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                        >
                          Find on Radar
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* Bottom Actions & Page Flip Inviter */}
                  <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left: Verification & Edit info */}
                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Verified story. (To edit,{' '}
                        <button
                          type="button"
                          onClick={() => onContactAdmin?.(currentStory)}
                          className="text-amber-800 font-bold underline hover:text-amber-900 cursor-pointer"
                        >
                          Contact Admin
                        </button>
                        )
                      </span>

                      {isOwnerParent && onDeleteStory && (
                        <button
                          type="button"
                          onClick={() => onDeleteStory(currentStory.id)}
                          className="text-red-600 hover:text-red-700 font-bold text-xs cursor-pointer ml-2"
                        >
                          Delete Story
                        </button>
                      )}
                    </div>

                    {/* Right: Page Navigation or Turn Prompt with Dog-Ear */}
                    <div className="flex items-center gap-2 ml-auto">
                      {currentPageIndex > 0 && (
                        <button
                          type="button"
                          onClick={handleTurnPrev}
                          disabled={isFlipping}
                          className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-serif text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous Story</span>
                        </button>
                      )}

                      {currentPageIndex < currentKidStories.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleTurnNext}
                          disabled={isFlipping}
                          className="group relative px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-serif text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Turn Page to Chapter {currentPageIndex + 2}</span>
                          <CornerDownRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                      ) : (
                        onAddStoryToKid && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddStoryToKid(activeKidName, currentKidStories.length + 1);
                              onClose();
                            }}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-serif text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Write Chapter {currentKidStories.length + 1} (New Achievement)</span>
                          </button>
                        )
                      )}
                    </div>

                  </div>

                  {/* Classic Book Bottom Page Folio */}
                  <div className="text-center pt-2 text-xs font-serif text-stone-400">
                    — {activeKidName} • Chapter {currentStory.chapterNumber || currentPageIndex + 1} of {currentKidStories.length} —
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Bottom Thumbnails / Chapter Pips Bar */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 py-2 overflow-x-auto shrink-0">
        {currentKidStories.map((story, idx) => (
          <button
            key={story.id}
            type="button"
            onClick={() => {
              if (idx !== currentPageIndex && !isFlipping) {
                setFlipDirection(idx > currentPageIndex ? 'next' : 'prev');
                setIsFlipping(true);
                playPageTurnSound();
                setTimeout(() => {
                  setCurrentPageIndex(idx);
                  setIsFlipping(false);
                }, 450);
              }
            }}
            className={`transition-all rounded-full cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold ${
              idx === currentPageIndex
                ? 'bg-amber-400 text-stone-950 shadow-md scale-105'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
            }`}
            title={`Go to Chapter ${idx + 1}: ${story.title}`}
          >
            <span>Ch {story.chapterNumber || idx + 1}</span>
          </button>
        ))}

        {onAddStoryToKid && (
          <button
            type="button"
            onClick={() => {
              onAddStoryToKid(activeKidName, currentKidStories.length + 1);
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-stone-800/80 hover:bg-stone-700 text-amber-300 rounded-full border border-amber-500/30 transition cursor-pointer"
            title="Write next milestone chapter for this child"
          >
            <Plus className="w-3 h-3" />
            <span>New Chapter</span>
          </button>
        )}
      </div>

    </div>
  );
};

export default KidStoryBookReader;
