import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ChevronLeft, ChevronRight, Sparkles, Award, Instagram, 
  Share2, Compass, ShieldCheck, X, Volume2, VolumeX, Eye, Plus, 
  Layers, Bookmark, CornerDownRight, CheckCircle2, UserCheck, Heart,
  BookmarkCheck, Check
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

interface SavedBookmark {
  kidName: string;
  pageIndex: number;
  storyId: string;
  chapterNumber: number;
  timestamp: number;
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
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  // Bookmark tracking for each kid
  const [savedBookmark, setSavedBookmark] = useState<SavedBookmark | null>(null);

  // Load bookmark for current child from localStorage
  useEffect(() => {
    if (!activeKidName || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`vernunt_story_bookmark_${activeKidName}`);
      if (raw) {
        setSavedBookmark(JSON.parse(raw));
      } else {
        setSavedBookmark(null);
      }
    } catch {
      setSavedBookmark(null);
    }
  }, [activeKidName]);

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

  // Multi-layered subtle paper-texture sound effect synthesized with Web Audio API
  const playPageTurnSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // Layer 1: Textured paper grain friction (high-pass filtered white noise)
      const bufferSize = Math.floor(ctx.sampleRate * 0.28); // 280ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Natural pink/brownish curve for dry paper leaf rustle
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.32));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const frictionFilter = ctx.createBiquadFilter();
      frictionFilter.type = 'bandpass';
      frictionFilter.frequency.setValueAtTime(1400, now);
      frictionFilter.frequency.exponentialRampToValueAtTime(320, now + 0.24);
      frictionFilter.Q.setValueAtTime(2.2, now);

      const frictionGain = ctx.createGain();
      frictionGain.gain.setValueAtTime(0.14, now);
      frictionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      noiseSource.connect(frictionFilter);
      frictionFilter.connect(frictionGain);
      frictionGain.connect(ctx.destination);
      noiseSource.start(now);

      // Layer 2: Subtle paper body air swoop (low-mid displacement)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.05, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);

      // Layer 3: Paper settle click at the end (~220ms)
      const settleOsc = ctx.createOscillator();
      settleOsc.type = 'triangle';
      settleOsc.frequency.setValueAtTime(220, now + 0.18);
      settleOsc.frequency.exponentialRampToValueAtTime(80, now + 0.24);

      const settleGain = ctx.createGain();
      settleGain.gain.setValueAtTime(0.0001, now);
      settleGain.gain.setValueAtTime(0.04, now + 0.18);
      settleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      settleOsc.connect(settleGain);
      settleGain.connect(ctx.destination);
      settleOsc.start(now + 0.18);
      settleOsc.stop(now + 0.25);
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
      }, 520);
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
      }, 520);
    }
  };

  // Toggle Bookmark Handler
  const handleToggleBookmark = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentStory) return;

    const isCurrentBookmarked = savedBookmark?.pageIndex === currentPageIndex;

    if (isCurrentBookmarked) {
      // Remove bookmark
      try {
        localStorage.removeItem(`vernunt_story_bookmark_${activeKidName}`);
        setSavedBookmark(null);
        setBookmarkToast(`Bookmark removed from Page ${currentPageIndex + 1}`);
        setTimeout(() => setBookmarkToast(null), 2500);
      } catch (err) {
        console.warn(err);
      }
    } else {
      // Save bookmark
      const newBm: SavedBookmark = {
        kidName: activeKidName,
        pageIndex: currentPageIndex,
        storyId: currentStory.id,
        chapterNumber: currentStory.chapterNumber || currentPageIndex + 1,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem(`vernunt_story_bookmark_${activeKidName}`, JSON.stringify(newBm));
        setSavedBookmark(newBm);
        playPageTurnSound();
        setBookmarkToast(`🔖 Bookmark saved for ${activeKidName} on Page ${currentPageIndex + 1}!`);
        setTimeout(() => setBookmarkToast(null), 3000);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Jump to saved bookmark
  const handleJumpToBookmark = () => {
    if (savedBookmark && savedBookmark.pageIndex < currentKidStories.length) {
      const targetIdx = savedBookmark.pageIndex;
      if (targetIdx !== currentPageIndex && !isFlipping) {
        setFlipDirection(targetIdx > currentPageIndex ? 'next' : 'prev');
        setIsFlipping(true);
        playPageTurnSound();
        setTimeout(() => {
          setCurrentPageIndex(targetIdx);
          setIsFlipping(false);
        }, 520);
      }
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

  const isCurrentPageBookmarked = savedBookmark?.pageIndex === currentPageIndex;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md overflow-y-auto p-2 sm:p-4 select-none font-sans">
      
      {/* Floating Bookmark Toast Feedback */}
      <AnimatePresence>
        {bookmarkToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-serif font-bold text-xs rounded-full shadow-2xl border border-amber-300 flex items-center gap-2"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-200" />
            <span>{bookmarkToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                          }, 520);
                        } else {
                          setShowToc(false);
                        }
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                        sIdx === currentPageIndex
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">Ch {story.chapterNumber || sIdx + 1}: {story.title}</span>
                      {savedBookmark?.pageIndex === sIdx && (
                        <span className="text-[10px] text-amber-400 shrink-0">🔖 Saved</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Jump to Saved Bookmark */}
          {savedBookmark && savedBookmark.pageIndex !== currentPageIndex && (
            <button
              type="button"
              onClick={handleJumpToBookmark}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 animate-pulse"
              title={`Jump to your saved place on Chapter ${savedBookmark.chapterNumber}`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Resume Ch {savedBookmark.chapterNumber}</span>
            </button>
          )}

        </div>

        {/* Right Controls: Sound Toggle & Close */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              soundEnabled ? 'text-amber-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-800'
            }`}
            title={soundEnabled ? "Paper Sound Effects: Enabled" : "Paper Sound Effects: Muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
            title="Close Storybook Reader (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main 3D Book Experience Stage */}
      <div className="flex-1 flex items-center justify-center relative w-full my-auto px-1 sm:px-4 py-2">
        
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

          {/* Realistic 3D Page Body with Dynamic Page-Curl & Shadow Transition */}
          <div className="relative w-full overflow-hidden rounded-2xl" style={{ perspective: '2400px' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeKidName}-${currentStory.id}-${currentPageIndex}`}
                initial={{
                  rotateY: flipDirection === 'next' ? 70 : -70,
                  rotateZ: flipDirection === 'next' ? -2.5 : 2.5,
                  skewY: flipDirection === 'next' ? -2 : 2,
                  scale: 0.95,
                  opacity: 0.6,
                  filter: 'brightness(0.9)'
                }}
                animate={{
                  rotateY: 0,
                  rotateZ: 0,
                  skewY: 0,
                  scale: 1,
                  opacity: 1,
                  filter: 'brightness(1)'
                }}
                exit={{
                  rotateY: flipDirection === 'next' ? -70 : 70,
                  rotateZ: flipDirection === 'next' ? 2.5 : -2.5,
                  skewY: flipDirection === 'next' ? 2 : -2,
                  scale: 0.95,
                  opacity: 0.5,
                  filter: 'brightness(0.85)'
                }}
                transition={{
                  duration: 0.52,
                  ease: [0.25, 1, 0.35, 1]
                }}
                className="w-full bg-[#fdfbf7] text-stone-900 rounded-2xl shadow-inner border border-[#e6dfd1] relative overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: flipDirection === 'next' ? '0% 50%' : '100% 50%',
                  backgroundImage: 'radial-gradient(#e5ded0 0.8px, transparent 0.8px)',
                  backgroundSize: '22px 22px',
                  boxShadow: 'inset 0 0 50px rgba(180, 160, 130, 0.2), 0 12px 36px rgba(0,0,0,0.38)'
                }}
              >
                
                {/* DYNAMIC SHADOW TRANSITION OVERLAY: Sweeps across the page curl hinge */}
                <motion.div 
                  initial={{ opacity: 0.5, scaleX: 1.4 }}
                  animate={{ opacity: 0, scaleX: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 pointer-events-none z-25 bg-gradient-to-r from-black/25 via-stone-700/15 to-transparent"
                />

                {/* VISUAL BOOKMARK ELEMENT ANCHORED TO TOP-RIGHT EDGE OF BOOK PAGE */}
                <div 
                  id="page-visual-bookmark"
                  onClick={handleToggleBookmark}
                  className="absolute top-0 right-4 sm:right-7 z-30 cursor-pointer select-none group"
                  title={isCurrentPageBookmarked ? "Click to remove bookmark" : "Click to save bookmark on this page"}
                >
                  <div className={`transition-all duration-300 transform ${
                    isCurrentPageBookmarked 
                      ? 'translate-y-0 opacity-100 shadow-xl' 
                      : '-translate-y-2.5 opacity-80 group-hover:translate-y-0 group-hover:opacity-100'
                  }`}>
                    {/* Ribbon Body with Swallowtail Notch */}
                    <div 
                      className={`w-7 sm:w-9 h-14 sm:h-16 flex flex-col items-center justify-start pt-2 px-1 text-white shadow-md transition-colors ${
                        isCurrentPageBookmarked
                          ? 'bg-gradient-to-b from-red-700 via-rose-700 to-amber-600 border-x border-amber-300/40'
                          : 'bg-gradient-to-b from-stone-500/80 via-stone-600/80 to-amber-700/80 border-x border-white/20'
                      }`}
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)'
                      }}
                    >
                      {isCurrentPageBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-200 fill-amber-300 drop-shadow-xs" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5 text-stone-200 group-hover:text-amber-200 transition-colors" />
                      )}
                      <span className="text-[8px] font-black uppercase tracking-tighter mt-1 font-mono text-amber-100 hidden sm:inline">
                        {isCurrentPageBookmarked ? `P.${currentPageIndex + 1}` : 'SAVE'}
                      </span>
                    </div>

                    {/* Bookmark Hover Tooltip */}
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-stone-900 text-white text-[10px] font-sans font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap border border-amber-400/40 z-40">
                      {isCurrentPageBookmarked 
                        ? `🔖 Saved Bookmark (Page ${currentPageIndex + 1}) • Tap to remove` 
                        : `🔖 Save Bookmark on Page ${currentPageIndex + 1}`}
                    </div>
                  </div>
                </div>

                {/* Tactile Page Spine Shadow overlay for authentic lighting */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-400/25 via-stone-400/10 to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-400/25 via-stone-400/10 to-transparent pointer-events-none z-10" />

                {/* Tactile Bottom Corner Dog-Ear / Page Peel Graphic */}
                <div 
                  onClick={handleTurnNext}
                  className="absolute bottom-0 right-0 w-10 h-10 cursor-pointer z-20 group hidden sm:block"
                  title="Turn to next page"
                >
                  <div 
                    className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, #e2d7c3 50%)',
                      filter: 'drop-shadow(-2px -2px 3px rgba(0,0,0,0.15))'
                    }}
                  />
                </div>

                {/* Page Content Container: Dual-Page Grid on Desktop */}
                <div className="p-4 sm:p-7 md:p-9 max-h-[75vh] overflow-y-auto space-y-6">
                  
                  {/* Top Chapter Header Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-300/80 pr-10 sm:pr-14">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-900 font-serif">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Chapter {currentStory.chapterNumber || currentPageIndex + 1} of {currentKidStories.length} • {currentStory.category}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-serif italic">
                        {activeKidName}'s Chronicles • Published &amp; Verified in Vernunt Gazette
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

                      {/* Achievements and Medals Box */}
                      {currentStory.achievements && currentStory.achievements.length > 0 && (
                        <div className="bg-stone-100/90 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-stone-600 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Hall of Achievements</span>
                          </div>
                          <div className="space-y-1">
                            {currentStory.achievements.map((ach, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-1.5 text-xs text-stone-800">
                                <span className="text-amber-600 text-[10px]">🏆</span>
                                <span className="font-semibold">{ach}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Playmate Radar Call to Action */}
                      {onConnectRadar && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLoggedInParent) {
                              onConnectRadar(currentStory.kidName, currentStory.kidCity);
                              onClose();
                            } else if (onRadarAuthRequired) {
                              onRadarAuthRequired(currentStory.kidName);
                            }
                          }}
                          className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span>Find {currentStory.kidName} on Playmate Radar</span>
                        </button>
                      )}

                    </div>

                    {/* RIGHT PAGE WING: Story Title, Narrative, Family Reflections */}
                    <div className="md:col-span-7 space-y-5">
                      
                      {/* Chapter Title in Classic Serif Typography */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-800">
                          <span>Chapter {currentStory.chapterNumber || currentPageIndex + 1}</span>
                          <span>•</span>
                          <span>{currentStory.datePublished}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                          {currentStory.title}
                        </h2>
                      </div>

                      {/* Full Story Content Body with Classic Initial Letter Dropcap */}
                      <div className="prose prose-stone max-w-none text-stone-800 font-serif text-sm sm:text-base leading-relaxed space-y-3">
                        <p className="first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-amber-900 whitespace-pre-line">
                          {currentStory.content}
                        </p>
                      </div>

                      {/* Parent Reflection Callout */}
                      <div className="bg-[#f2ede4] border border-[#e0d6c4] rounded-2xl p-4 text-xs font-serif space-y-2">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                          <span>From {currentStory.parentName} ({currentStory.kidName}'s Parent):</span>
                        </div>
                        <p className="text-stone-700 italic leading-relaxed">
                          "Watching {currentStory.kidName} dedicate time to {currentStory.category.toLowerCase()} has brought immense joy. We hope sharing this story in the Vernunt Gazette inspires other neighborhood kids!"
                        </p>
                        {kidHandle && (
                          <div className="text-[11px] text-stone-600 font-sans pt-1">
                            Follow their journey on Instagram: <strong className="text-pink-700">@{kidHandle}</strong>
                          </div>
                        )}
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
                }, 520);
              }
            }}
            className={`transition-all rounded-full cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold relative ${
              idx === currentPageIndex
                ? 'bg-amber-400 text-stone-950 shadow-md scale-105'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
            }`}
            title={`Go to Chapter ${idx + 1}: ${story.title}`}
          >
            <span>Ch {story.chapterNumber || idx + 1}</span>
            {savedBookmark?.pageIndex === idx && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Bookmark Saved" />
            )}
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
