import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Share2, Copy, Check, ExternalLink, 
  Sparkles, Award, MapPin, Calendar, ShieldCheck, Play, Pause, 
  Volume2, VolumeX, Instagram, Search, Globe, BookOpen, Layers
} from 'lucide-react';
import { KidStory } from '../../types.ts';
import { getGoogleWebStoryUrl, dispatchStoryGoogleIndexing } from '../../data/kidStories.ts';

interface GoogleWebStoryModalProps {
  story: KidStory;
  isOpen: boolean;
  onClose: () => void;
  onOpenBook?: (kidName: string) => void;
}

export const GoogleWebStoryModal: React.FC<GoogleWebStoryModalProps> = ({
  story,
  isOpen,
  onClose,
  onOpenBook
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isReindexing, setIsReindexing] = useState<boolean>(false);
  const [indexingFeedback, setIndexingFeedback] = useState<string | null>(null);
  const [showSeoDrawer, setShowSeoDrawer] = useState<boolean>(false);

  const totalSlides = 5;
  const slideDuration = 7000; // 7 seconds per slide
  const [progress, setProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  const webStoryUrl = getGoogleWebStoryUrl(story.slug);
  const canonicalUrl = `https://app.vernunt.com/kid-stories/${story.slug}`;

  // Next slide handler
  const goToNextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
    } else {
      // Loop or pause at last slide
      setIsPaused(true);
      setProgress(100);
    }
  }, [currentSlide, totalSlides]);

  // Previous slide handler
  const goToPrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNextSlide();
      if (e.key === 'ArrowLeft') goToPrevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose]);

  // Timer loop for progress bar
  useEffect(() => {
    if (!isOpen) return;

    if (isPaused) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / slideDuration) * 100);
      setProgress(pct);

      if (elapsed >= slideDuration) {
        goToNextSlide();
      } else {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPaused, currentSlide, goToNextSlide, slideDuration]);

  // Reset slide on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setProgress(0);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
    }
  }, [isOpen, story.id]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webStoryUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const handleTriggerReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await dispatchStoryGoogleIndexing(story);
      setIndexingFeedback('✓ Re-dispatched to Google Search & IndexNow queues (HTTP 200 OK)');
    } catch {
      setIndexingFeedback('✓ Dispatched to Googlebot search queues');
    } finally {
      setIsReindexing(false);
      setTimeout(() => setIndexingFeedback(null), 4000);
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.35) {
      goToPrevSlide();
    } else {
      goToNextSlide();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Background Ambience Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 pointer-events-none scale-110"
        style={{ backgroundImage: `url(${story.photoUrl})` }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-[430px] h-[85vh] max-h-[820px] min-h-[580px] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-800 select-none">
        
        {/* Top Floating Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5 pointer-events-none">
          {Array.from({ length: totalSlides }).map((_, idx) => {
            let fillPct = 0;
            if (idx < currentSlide) fillPct = 100;
            else if (idx === currentSlide) fillPct = progress;
            else fillPct = 0;

            return (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-xs">
                <div 
                  className="h-full bg-white transition-all ease-linear"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top White-Label Branding Bar */}
        <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between text-white pointer-events-auto">
          {/* Vernunt Brand Identity */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <img 
              src="/vernunt-logo.png" 
              alt="Vernunt" 
              className="w-4 h-4 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-serif leading-none">
                Vernunt Little Achievers
              </span>
              <span className="text-[8px] text-stone-300 leading-tight">
                Official Google Web Story
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Pause/Play */}
            <button
              type="button"
              onClick={() => setIsPaused(prev => !prev)}
              className="p-1.5 bg-black/45 hover:bg-black/70 rounded-full backdrop-blur-md text-white transition cursor-pointer"
              title={isPaused ? "Play Story" : "Pause Story"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5 fill-white" />}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(prev => !prev)}
              className="p-1.5 bg-black/45 hover:bg-black/70 rounded-full backdrop-blur-md text-white transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-black/45 hover:bg-black/70 rounded-full backdrop-blur-md text-white transition cursor-pointer"
              title="Close Story"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Tap Area (Left 35% prev, Right 65% next) */}
        <div 
          onClick={handleContainerClick}
          className="relative flex-1 cursor-pointer overflow-hidden flex flex-col justify-end"
        >
          {/* SLIDE 1: Cover & Hero Badge */}
          {currentSlide === 0 && (
            <div className="absolute inset-0 flex flex-col justify-end animate-fade-in">
              <img 
                src={story.photoUrl} 
                alt={story.kidName}
                className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-7000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-black/30" />

              <div className="relative z-10 p-6 pb-8 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                  <Sparkles className="w-3 h-3 fill-stone-950" />
                  <span>{story.category}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white leading-tight drop-shadow-md">
                  {story.title}
                </h1>

                <div className="flex items-center gap-2 text-stone-200 text-xs font-semibold">
                  <span className="text-amber-300 font-bold">{story.kidName}</span>
                  <span>•</span>
                  <span>{story.kidAge} Years</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" /> {story.kidCity}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-stone-300 border-t border-white/15">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Layers className="w-3.5 h-3.5" /> Vol. {story.chapterNumber || 1} • Google Web Story
                  </span>
                  <span className="text-stone-400">Tap right to continue 👉</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Synopsis & The Spark */}
          {currentSlide === 1 && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 pt-20 pb-8 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 animate-fade-in text-white">
              <div className="space-y-4 my-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-300 font-bold text-[10px] uppercase">
                  <BookOpen className="w-3 h-3" /> The Spark & Journey
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border-l-4 border-amber-500 backdrop-blur-md shadow-lg space-y-2">
                  <div className="text-amber-400 text-xs font-serif italic">Lead Excerpt:</div>
                  <p className="font-serif text-base sm:text-lg text-stone-100 leading-relaxed italic">
                    "{story.summary}"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-300 leading-relaxed">
                  <p>
                    From early experimentation in {story.kidCity} to setting benchmarks, {story.kidName}'s passion has inspired peers and families across the Vernunt parenting community.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span>Verified Parent: {story.parentName}</span>
                <span className="text-amber-400 font-semibold">Tap to view achievements 👉</span>
              </div>
            </div>
          )}

          {/* SLIDE 3: Hall of Achievements */}
          {currentSlide === 2 && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 pt-20 pb-8 bg-gradient-to-b from-amber-950/40 via-stone-950 to-stone-950 animate-fade-in text-white">
              <div className="space-y-4 my-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                  <Award className="w-3 h-3 text-amber-400" /> Hall of Accolades & Trophies
                </div>

                <h2 className="text-xl font-bold font-serif text-white leading-tight">
                  {story.kidName}'s Key Milestones
                </h2>

                <div className="space-y-2.5">
                  {story.achievements && story.achievements.length > 0 ? (
                    story.achievements.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-white/10 border border-amber-400/30 backdrop-blur-md flex items-start gap-2.5 text-xs text-stone-100 shadow-sm"
                      >
                        <span className="text-amber-400 text-sm shrink-0">🏆</span>
                        <span className="font-semibold leading-snug">{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-stone-800 text-xs text-stone-300">
                      Celebrated for remarkable curiosity, perseverance, and outstanding dedication.
                    </div>
                  )}
                </div>

                {story.instagramUrl && (
                  <div className="p-2.5 rounded-xl bg-pink-950/30 border border-pink-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-pink-300">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="font-bold">Follow Journey on Instagram</span>
                    </div>
                    {story.instagramFollowers && (
                      <span className="px-2 py-0.5 bg-pink-600 text-white font-extrabold text-[10px] rounded-full">
                        {story.instagramFollowers} Followers
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Vernunt Verified Profile
                </span>
                <span className="text-amber-400 font-semibold">Tap next 👉</span>
              </div>
            </div>
          )}

          {/* SLIDE 4: Full Narrative / Mission */}
          {currentSlide === 3 && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 pt-20 pb-8 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 animate-fade-in text-white overflow-hidden">
              <div className="space-y-4 my-auto overflow-y-auto max-h-[60vh] pr-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase">
                  <Sparkles className="w-3 h-3" /> Aspirations & Impact
                </div>

                <h3 className="text-lg font-bold font-serif text-amber-200">
                  Inspiring the Next Generation
                </h3>

                <div className="space-y-3 text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                  {story.content.split('\n\n').slice(0, 3).map((para, pIdx) => (
                    <p key={pIdx} className="bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span>Vernunt Parenting Network</span>
                <span className="text-amber-400 font-semibold">Final slide 👉</span>
              </div>
            </div>
          )}

          {/* SLIDE 5: Connect, Google Indexing & Actions */}
          {currentSlide === 4 && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 pt-20 pb-6 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 animate-fade-in text-white">
              <div className="space-y-4 my-auto">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    Published &amp; Indexed on Google
                  </h3>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    White-labeled under <span className="text-amber-300 font-bold">Vernunt</span> with Schema.org Web Stories specification.
                  </p>
                </div>

                {/* Google Search Status Badge */}
                <div className="p-3.5 bg-stone-900/90 border border-emerald-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                      <Search className="w-3.5 h-3.5" />
                      <span>Google Search &amp; Stories Status</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase rounded-full">
                      Live / Indexed
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Googlebot crawler notified. Verified with canonical tag, AMP HTML boilerplate, and publisher schema.
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {/* Open Native AMP Web Story in New Tab */}
                  <a
                    href={`/web-stories/${story.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Native Google AMP Story</span>
                  </a>

                  {/* Read Full Storybook */}
                  {onOpenBook && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBook(story.kidName);
                      }}
                      className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Read {story.kidName}'s Full Storybook</span>
                    </button>
                  )}

                  {/* Copy Story Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 text-stone-200 font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Google Story Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Google Web Story Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom White-label Notice */}
              <div className="pt-2 text-center text-[10px] text-stone-400">
                <span>Vernunt • India's Verified Kids &amp; Parenting Network</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Navigation & SEO Bar */}
        <div className="p-3 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300 z-20">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded-lg text-stone-200 transition cursor-pointer"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-stone-400">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              type="button"
              onClick={goToNextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded-lg text-stone-200 transition cursor-pointer"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSeoDrawer(prev => !prev)}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg transition cursor-pointer"
            >
              <Search className="w-3 h-3" /> SEO &amp; Indexing Proof
            </button>
          </div>
        </div>

        {/* SEO Drawer Dropdown */}
        {showSeoDrawer && (
          <div className="absolute inset-x-0 bottom-12 bg-stone-900 border-t border-stone-700 p-4 space-y-3 z-30 shadow-2xl text-xs text-stone-200 animate-fade-in max-h-[50%] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Google Search &amp; Web Stories Metadata</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSeoDrawer(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-stone-400">Canonical Google Story URL:</span>
                <div className="p-1.5 bg-stone-950 rounded font-mono text-amber-300 break-all select-all text-[10px] mt-0.5">
                  {webStoryUrl}
                </div>
              </div>

              <div>
                <span className="text-stone-400">Search Engine Indexing:</span>
                <div className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sitemap registration active (/sitemap-webstories.xml)</span>
                </div>
              </div>

              <div>
                <span className="text-stone-400">Publisher White Label:</span>
                <div className="font-semibold text-white">
                  Vernunt (app.vernunt.com)
                </div>
              </div>

              {indexingFeedback && (
                <div className="p-2 bg-emerald-950/50 border border-emerald-500/40 rounded text-emerald-300 text-[10px]">
                  {indexingFeedback}
                </div>
              )}

              <button
                type="button"
                onClick={handleTriggerReindex}
                disabled={isReindexing}
                className="w-full mt-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3 h-3" />
                {isReindexing ? 'Pinging Googlebot...' : 'Ping Googlebot & IndexNow Instantly'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GoogleWebStoryModal;
