import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Search, Award, Instagram, ArrowRight, Share2, Heart, Eye, 
  CheckCircle2, ChevronLeft, BookOpen, Plus, ShieldCheck, MapPin, Calendar,
  Book, Trash2, Lock, Gift, Users, ExternalLink, AlertTriangle, Layers
} from 'lucide-react';
import { KidStory, ChildProfile } from '../../types.ts';
import { 
  getApprovedKidStories, 
  getStoredKidStories, 
  incrementStoryViews,
  getStoriesByKid,
  deleteKidStory,
  isKidStoryLifetimeUnlocked,
  unlockKidStoryLifetimeReferral,
  getKidBooks,
  KidBookProfile
} from '../../data/kidStories.ts';
import KidStoryBookReader from './KidStoryBookReader.tsx';
import KidBookCard from './KidBookCard.tsx';
import InstagramShareModal from './InstagramShareModal.tsx';
import StoryReferralModal from './StoryReferralModal.tsx';

interface KidStoriesPortalProps {
  currentUser: ChildProfile | null;
  onOpenWriteModal: (kidName?: string, chapter?: number) => void;
  selectedSlug?: string;
  onSelectStory?: (slug?: string) => void;
  onOpenReferral?: () => void;
}

const CATEGORIES = [
  'All',
  'Young Innovators',
  'Coding & Tech',
  'Sports',
  'Arts & Culture',
  'Chess & Mind Sports',
  'Music & Dance',
  'Social Impact'
];

export const KidStoriesPortal: React.FC<KidStoriesPortalProps> = ({
  currentUser,
  onOpenWriteModal,
  selectedSlug,
  onSelectStory,
  onOpenReferral
}) => {
  const [stories, setStories] = useState<KidStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStory, setActiveStory] = useState<KidStory | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals state
  const [portalViewMode, setPortalViewMode] = useState<'books' | 'articles'>('books');
  const [showBookReader, setShowBookReader] = useState(false);
  const [bookReaderStories, setBookReaderStories] = useState<KidStory[]>([]);
  const [bookReaderInitialIndex, setBookReaderInitialIndex] = useState(0);
  const [readerTargetKidName, setReaderTargetKidName] = useState<string | undefined>(undefined);
  const [readerTargetStoryId, setReaderTargetStoryId] = useState<string | undefined>(undefined);

  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramTargetStory, setInstagramTargetStory] = useState<KidStory | null>(null);

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isLifetimeUnlocked, setIsLifetimeUnlocked] = useState(isKidStoryLifetimeUnlocked());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load approved stories from storage
  const loadStories = () => {
    const approved = getApprovedKidStories();
    setStories(approved);
    setIsLifetimeUnlocked(isKidStoryLifetimeUnlocked());
    
    // If slug provided in props or URL
    if (selectedSlug) {
      const found = approved.find(s => s.slug === selectedSlug || s.id === selectedSlug);
      if (found) {
        setActiveStory(found);
        incrementStoryViews(found.id);
      }
    }
  };

  useEffect(() => {
    loadStories();
  }, [selectedSlug]);

  // Update SEO meta tags & Structured Data when viewing an active story
  useEffect(() => {
    if (activeStory) {
      document.title = `${activeStory.kidName} - ${activeStory.title} | Vernunt Achievers`;
      
      // Inject Schema.org JSON-LD for Google SEO Indexing
      const schemaScriptId = 'kid-story-jsonld';
      let scriptTag = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = schemaScriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': activeStory.title,
        'description': activeStory.summary,
        'image': [activeStory.photoUrl],
        'datePublished': activeStory.approvedAt || activeStory.submittedAt,
        'dateModified': activeStory.approvedAt || activeStory.submittedAt,
        'author': {
          '@type': 'Person',
          'name': activeStory.parentName,
          'jobTitle': 'Parent'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Vernunt Achievers',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://app.vernunt.com/logo.png'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://app.vernunt.com/kid-stories/${activeStory.slug}`
        },
        'about': {
          '@type': 'Person',
          'name': activeStory.kidName,
          'description': `${activeStory.kidAge}-year-old achiever from ${activeStory.kidCity}`
        }
      };

      scriptTag.textContent = JSON.stringify(structuredData);

      return () => {
        const el = document.getElementById(schemaScriptId);
        if (el) el.remove();
        document.title = 'Vernunt - Bengaluru Child Care, Daycares & Verified Specialists';
      };
    }
  }, [activeStory]);

  const handleSelectStory = (story: KidStory) => {
    setActiveStory(story);
    incrementStoryViews(story.id);
    if (onSelectStory) {
      onSelectStory(story.slug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveStory(null);
    if (onSelectStory) {
      onSelectStory(undefined);
    }
  };

  const handleShare = (story: KidStory) => {
    const url = `${window.location.origin}/kid-stories/${story.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      story.kidName.toLowerCase().includes(q) ||
      story.title.toLowerCase().includes(q) ||
      story.summary.toLowerCase().includes(q) ||
      story.kidCity.toLowerCase().includes(q) ||
      story.achievements.some(a => a.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Group stories into physical book collections for each child
  const kidBooks = useMemo(() => {
    return getKidBooks(stories);
  }, [stories]);

  const filteredKidBooks = useMemo(() => {
    return kidBooks.filter(book => {
      const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        book.kidName.toLowerCase().includes(q) ||
        book.kidCity.toLowerCase().includes(q) ||
        book.stories.some(s => 
          s.title.toLowerCase().includes(q) || 
          s.summary.toLowerCase().includes(q) ||
          s.achievements.some(a => a.toLowerCase().includes(q))
        );
      return matchesCategory && matchesSearch;
    });
  }, [kidBooks, selectedCategory, searchQuery]);

  const featuredStory = stories.find(s => s.featured) || stories[0];

  // Helper to open interactive book reader
  const handleOpenBookReader = (storyList: KidStory[], startIndex: number = 0, kidName?: string) => {
    const listToUse = storyList && storyList.length > 0 ? storyList : stories;
    if (listToUse.length === 0) return;
    setBookReaderStories(listToUse);
    setBookReaderInitialIndex(startIndex);
    setReaderTargetStoryId(listToUse[startIndex]?.id);
    setReaderTargetKidName(kidName || listToUse[startIndex]?.kidName);
    setShowBookReader(true);
  };

  // Helper to open a specific child's book directly
  const handleOpenKidBook = (book: KidBookProfile) => {
    setReaderTargetKidName(book.kidName);
    setReaderTargetStoryId(book.stories[0]?.id);
    setBookReaderStories(book.stories);
    setBookReaderInitialIndex(0);
    setShowBookReader(true);
  };

  // Helper to open Instagram Share Modal
  const handleOpenInstagramShare = (story: KidStory) => {
    setInstagramTargetStory(story);
    setShowInstagramModal(true);
  };

  // Check if current user is the author/parent of active story
  const isCurrentUserAuthor = useMemo(() => {
    if (!currentUser || !activeStory) return false;
    const cleanUserEmail = (currentUser.email || '').trim().toLowerCase();
    const cleanUserPhone = (currentUser.phoneNumber || currentUser.phone || '').replace(/[^0-9]/g, '');
    const cleanStoryEmail = (activeStory.parentEmail || '').trim().toLowerCase();
    const cleanStoryPhone = (activeStory.parentPhone || '').replace(/[^0-9]/g, '');

    return Boolean(
      (cleanUserEmail && cleanUserEmail === cleanStoryEmail) ||
      (cleanUserPhone && cleanStoryPhone && cleanUserPhone === cleanStoryPhone) ||
      (activeStory.parentId && activeStory.parentId === currentUser.id) ||
      (currentUser.parentName && activeStory.parentName && currentUser.parentName.toLowerCase().includes(activeStory.parentName.toLowerCase()))
    );
  }, [currentUser, activeStory]);

  // Find all chapters / milestone stories of this kid
  const kidOtherStories = useMemo(() => {
    if (!activeStory) return [];
    return getStoriesByKid(activeStory.kidName);
  }, [activeStory, stories]);

  // Parent deletion action
  const handleDeleteActiveStory = () => {
    if (!activeStory) return;
    deleteKidStory(activeStory.id);
    setShowDeleteConfirm(false);
    setActiveStory(null);
    loadStories();
  };

  // -------------------------------------------------------------
  // SINGLE STORY ARTICLE VIEW (YourStory style)
  // -------------------------------------------------------------
  if (activeStory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in font-sans">
        
        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 transition bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Stories
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Flipbook Reader Button */}
            <button
              type="button"
              onClick={() => {
                const list = kidOtherStories.length > 0 ? kidOtherStories : stories;
                const idx = list.findIndex(s => s.id === activeStory.id);
                handleOpenBookReader(list, Math.max(0, idx));
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Book className="w-3.5 h-3.5 text-amber-600" />
              <span>Read as Flipbook</span>
            </button>

            {/* Instagram 1-Click Share Button */}
            <button
              type="button"
              onClick={() => handleOpenInstagramShare(activeStory)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:opacity-95 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Share to Instagram</span>
            </button>

            <button
              type="button"
              onClick={() => handleShare(activeStory)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? '✓ Link Copied!' : 'Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWriteModal}
              className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-rose-600 px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Write Story
            </button>
          </div>
        </div>

        {/* Multi-Chapter Journey Navigation for this Kid */}
        {kidOtherStories.length > 1 && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                <h4 className="font-bold text-xs text-slate-900">
                  {activeStory.kidName}'s Milestone Chapters ({kidOtherStories.length} Published)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBookReader(kidOtherStories, kidOtherStories.findIndex(s => s.id === activeStory.id))}
                className="text-[11px] font-bold text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Book className="w-3.5 h-3.5" /> Flip Through Chapters ↗
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {kidOtherStories.map((ch, chIdx) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectStory(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    ch.id === activeStory.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50'
                  }`}
                >
                  <span>Chapter {ch.chapterNumber || chIdx + 1}</span>
                  {ch.id === activeStory.id && <span className="text-[10px] text-amber-300">●</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editorial Article Container */}
        <article className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Cover Hero Photo */}
          <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden">
            <img
              src={activeStory.photoUrl}
              alt={activeStory.kidName}
              className="w-full h-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                  {activeStory.category}
                </span>
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified by Vernunt Editorial Team
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Indexed for Google Search
                </span>
                {activeStory.chapterNumber && (
                  <span className="px-2.5 py-1 bg-amber-500/40 text-amber-100 text-[10px] font-bold rounded-full">
                    Chapter {activeStory.chapterNumber}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-bold font-serif leading-tight">
                {activeStory.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> {activeStory.kidCity}
                </span>
                <span>•</span>
                <span>Age: <strong className="text-white">{activeStory.kidAge} Years</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Published {new Date(activeStory.approvedAt || activeStory.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Article Body */}
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Lead synopsis (YourStory Style) */}
            <div className="p-4 sm:p-5 bg-orange-50/60 border-l-4 border-orange-500 rounded-r-2xl">
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed italic">
                "{activeStory.summary}"
              </p>
            </div>

            {/* Kid Profile Snapshot & Instagram Link Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Achiever Profile</div>
                <div className="text-lg font-bold text-slate-900">{activeStory.kidName}</div>
                <div className="text-xs text-slate-600">
                  {activeStory.kidAge} Years Old • {activeStory.kidCity} • Story shared by {activeStory.parentName}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeStory.instagramUrl && (
                  <a
                    href={activeStory.instagramUrl.startsWith('http') ? activeStory.instagramUrl : `https://${activeStory.instagramUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition shrink-0 cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>View Instagram Profile</span>
                    {activeStory.instagramFollowers && (
                      <span className="bg-white/25 px-1.5 py-0.2 text-[10px] rounded-full">
                        {activeStory.instagramFollowers}
                      </span>
                    )}
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenInstagramShare(activeStory)}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-pink-50 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-pink-600" />
                  <span>Share Flyer</span>
                </button>
              </div>
            </div>

            {/* Key Achievements Highlight Box */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-150 pb-2">
                <Award className="w-5 h-5 text-amber-500" /> Key Milestones & Accolades
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {activeStory.achievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-200/80 text-amber-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      {achievement}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative Editorial Text */}
            <div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-150 pb-2">
                The Journey & Story
              </h2>
              {activeStory.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Parent Story Rights & Editorial Protection Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">
                    Vernunt Editorial Integrity & Verification Policy
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Once approved by administrators, child milestone stories can only be edited by the Vernunt Editorial Desk to preserve verifiable achievement authenticity and Google search engine authority. If you need to revise any facts, please contact the admin team. Parents can write additional chapters as their child hits new milestones, or delete their story anytime.
                  </p>
                </div>
              </div>

              {/* If user is the author, allow deletion */}
              {isCurrentUserAuthor && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    You authored this published story as verified parent {activeStory.parentName}.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete My Story
                  </button>
                </div>
              )}
            </div>

            {/* Author Credit & Google SEO Notice */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-700">Author:</span> {activeStory.parentName}
                <span className="mx-2">•</span>
                <span>Reviewed by Vernunt Child Development Editors</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenInstagramShare(activeStory)}
                  className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(activeStory)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Published Story?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete "{activeStory.title}"? This will permanently remove the story and its Google SEO indexing link.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteActiveStory}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showBookReader && (
          <KidStoryBookReader
            isOpen={showBookReader}
            onClose={() => setShowBookReader(false)}
            stories={bookReaderStories.length > 0 ? bookReaderStories : (activeStory ? [activeStory, ...kidOtherStories] : stories)}
            initialStoryIndex={bookReaderInitialIndex}
            onOpenShareModal={(s) => {
              setShowBookReader(false);
              handleOpenInstagramShare(s);
            }}
            onOpenInstagramShare={(s) => {
              setShowBookReader(false);
              handleOpenInstagramShare(s);
            }}
            isLoggedInParent={Boolean(currentUser)}
            currentParentIdentifier={currentUser?.email || currentUser?.phoneNumber}
          />
        )}

        <InstagramShareModal
          isOpen={showInstagramModal}
          onClose={() => setShowInstagramModal(false)}
          story={instagramTargetStory}
        />

        <StoryReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          userProfile={currentUser}
          onReferralSuccess={() => {
            unlockKidStoryLifetimeReferral();
            setIsLifetimeUnlocked(true);
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN STORIES PORTAL VIEW (YourStory style)
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 font-sans">
      
      {/* Hero Header (YourStory for Kids style) */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Vernunt Little Achievers • YourStory for Kids</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight leading-tight">
            Inspiring Stories of Young Minds & Future Leaders
          </h1>

          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
            Every child has a remarkable spark. Discover real stories of junior innovators, chess prodigies, robotics builders, and young athletes written by their parents and published after editorial review.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenWriteModal}
              className="px-5 py-2.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Write & Submit Your Kid's Story</span>
            </button>

            {/* Read in Interactive Flipbook */}
            <button
              type="button"
              onClick={() => handleOpenBookReader(filteredStories, 0)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl transition backdrop-blur-xs flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <Book className="w-4 h-4 text-amber-300" />
              <span>Read in Book Mode</span>
            </button>

            <div className="text-[11px] text-orange-100/90 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Admin approved & Google SEO indexed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Referral & Lifetime Free Writing Incentive Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 mt-0.5">
            <Gift className="w-5 h-5 text-amber-200" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-amber-100">
                Parent Referral Reward
              </span>
              {isLifetimeUnlocked && (
                <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                  ✓ Lifetime Free Access Unlocked
                </span>
              )}
            </div>
            <h3 className="text-base font-bold">
              Refer Parents: Unlock Free Lifetime Story Publishing & 1-Year Free Search Radar!
            </h3>
            <p className="text-xs text-orange-100 leading-relaxed">
              Invite other parents to document their child's achievements. As soon as your referee signs up, you immediately unlock permanent free lifetime access to publish multiple stories and get one full year free of child radar discovery.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenReferral) {
              onOpenReferral();
            } else {
              setShowReferralModal(true);
            }
          }}
          className="px-5 py-3 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Users className="w-4 h-4 text-orange-600" />
          <span>{isLifetimeUnlocked ? 'View Referral Hub' : 'Invite & Unlock Lifetime Access'}</span>
        </button>
      </div>

      {/* Search, View Mode Switcher & Category Filter Navigation */}
      <div className="space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by kid name, achievement, or city (e.g. Aarav, Chess, Bangalore)..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Book Style vs Gazette Articles */}
            <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 shadow-inner">
              <button
                type="button"
                onClick={() => setPortalViewMode('books')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  portalViewMode === 'books'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Book className="w-3.5 h-3.5 text-amber-600" />
                <span>Kid Storybooks ({filteredKidBooks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPortalViewMode('articles')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  portalViewMode === 'articles'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>Gazette Feed ({filteredStories.length})</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span><strong>{filteredKidBooks.length}</strong> Children • <strong>{filteredStories.length}</strong> Stories</span>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW MODE 1: KID STORYBOOKS (BOOK UI/UX STYLE - PRIMARY) */}
      {/* ------------------------------------------------------------- */}
      {portalViewMode === 'books' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 via-orange-50/50 to-stone-50 border border-amber-200/80 rounded-2xl p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <h2 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                  Child Storybook Library — Personal Hardcover Books
                </h2>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                Every child has their own dedicated hardcover book with multiple milestone chapters. Click any book cover to flip pages with realistic 3D paper turns and audio sound effects!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenWriteModal()}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Story for Child</span>
            </button>
          </div>

          {filteredKidBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Book className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No storybooks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No published child books match your current search or category filter. Document your child's achievement to create their first hardcover book!
              </p>
              <button
                type="button"
                onClick={() => onOpenWriteModal()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Write First Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-1">
              {filteredKidBooks.map((book) => (
                <KidBookCard
                  key={book.kidName}
                  book={book}
                  onOpenBook={handleOpenKidBook}
                  onAddStoryToKid={(kidName, nextChapter) => onOpenWriteModal(kidName, nextChapter)}
                  onOpenInstagram={(b) => handleOpenInstagramShare(b.latestStory)}
                  currentUser={currentUser}
                  isAdmin={currentUser?.userRole === 'Admin' || currentUser?.email === 'ardha@vernunt.com' || currentUser?.email === 'arjunmpgupta@gmail.com'}
                  onEditStory={(b) => {
                    handleSelectStory(b.latestStory);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW MODE 2: GAZETTE FEED (TRADITIONAL ARTICLES) */}
      {/* ------------------------------------------------------------- */}
      {portalViewMode === 'articles' && (
        <div className="space-y-6 animate-fade-in">
          {/* Featured Story Lead (YourStory Style) */}
          {featuredStory && selectedCategory === 'All' && !searchQuery && (
            <div
              onClick={() => handleSelectStory(featuredStory)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer grid grid-cols-1 lg:grid-cols-12 group"
            >
              <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden bg-slate-100">
                <img
                  src={featuredStory.photoUrl}
                  alt={featuredStory.kidName}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    Featured Cover Story
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <span>{featuredStory.category}</span>
                    <span>•</span>
                    <span className="text-slate-400">{featuredStory.kidCity}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 group-hover:text-orange-600 transition leading-snug">
                    {featuredStory.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {featuredStory.summary}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-1.5 pt-1">
                    {featuredStory.achievements.slice(0, 2).map((ach, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex items-center justify-between text-xs text-slate-500">
                  <div className="font-semibold text-slate-800">
                    {featuredStory.kidName}, {featuredStory.kidAge} yrs
                  </div>
                  <span className="font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Read Full Story <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stories Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span>Latest Child Achiever Publications</span>
            </h2>

            {filteredStories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No stories found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No published stories match your current search or category filter. Be the first to share your child's achievement!
                </p>
                <button
                  type="button"
                  onClick={() => onOpenWriteModal()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Write First Story
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleSelectStory(story)}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col group"
                  >
                    {/* Image */}
                    <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                      <img
                        src={story.photoUrl}
                        alt={story.kidName}
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                          {story.category}
                        </span>
                      </div>
                      {story.instagramUrl && (
                        <div className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full text-pink-600 shadow-xs">
                          <Instagram className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">{story.kidName}</span>
                          <span>•</span>
                          <span>{story.kidAge} yrs</span>
                          <span>•</span>
                          <span className="truncate">{story.kidCity}</span>
                        </div>

                        <h3 className="text-sm font-bold font-serif text-slate-900 group-hover:text-orange-600 transition leading-snug line-clamp-2">
                          {story.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {story.summary}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Eye className="w-3 h-3" /> {story.viewsCount || 1} views
                          </span>
                          {story.chapterNumber && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Ch {story.chapterNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInstagramShare(story);
                            }}
                            title="Share on Instagram"
                            className="p-1 text-pink-600 hover:bg-pink-50 rounded-md transition"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                            Read Story <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Flipbook Reader Modal */}
      {showBookReader && (
        <KidStoryBookReader
          isOpen={showBookReader}
          onClose={() => setShowBookReader(false)}
          stories={bookReaderStories.length > 0 ? bookReaderStories : stories}
          initialStoryIndex={bookReaderInitialIndex}
          initialKidName={readerTargetKidName}
          initialStoryId={readerTargetStoryId}
          onOpenShareModal={(s) => {
            setShowBookReader(false);
            handleOpenInstagramShare(s);
          }}
          onOpenInstagramShare={(s) => {
            setShowBookReader(false);
            handleOpenInstagramShare(s);
          }}
          onAddStoryToKid={(kidName, nextChapter) => {
            setShowBookReader(false);
            onOpenWriteModal(kidName, nextChapter);
          }}
          isLoggedInParent={Boolean(currentUser)}
          currentParentIdentifier={currentUser?.email || currentUser?.phoneNumber}
        />
      )}

      {/* One-Click Instagram Share Modal */}
      <InstagramShareModal
        isOpen={showInstagramModal}
        onClose={() => setShowInstagramModal(false)}
        story={instagramTargetStory}
      />

      {/* Parent Referral & Lifetime Free Writing Modal */}
      <StoryReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        userProfile={currentUser}
        onReferralSuccess={() => {
          unlockKidStoryLifetimeReferral();
          setIsLifetimeUnlocked(true);
        }}
      />

    </div>
  );
};

export default KidStoriesPortal;
