import React, { useState, useMemo, useEffect } from 'react';
import { 
  KnowledgeArticle, 
  KNOWLEDGE_CATEGORIES, 
  FLAGSHIP_KNOWLEDGE_ARTICLES, 
  generateProgrammaticKnowledgeIndex, 
  getKnowledgeArticleBySlug 
} from '../data/knowledgeBase.ts';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Share2, 
  Bookmark, 
  Check, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  HelpCircle, 
  Lightbulb, 
  AlertTriangle, 
  ChevronRight, 
  Tag, 
  Filter, 
  Compass, 
  Download, 
  Printer, 
  Copy,
  Baby,
  Brain,
  GraduationCap,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface KnowledgeHubProps {
  initialSlug?: string;
  onNavigateToRadar?: (interestKeyword?: string) => void;
}

export function KnowledgeHub({ initialSlug, onNavigateToRadar }: KnowledgeHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('All');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(initialSlug || null);
  const [savedArticles, setSavedArticles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vernunt_saved_articles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Generate full 1,000+ programmatic SEO articles index
  const allArticlesIndex = useMemo(() => {
    return generateProgrammaticKnowledgeIndex();
  }, []);

  // Filtered list based on search & filters
  const filteredArticles = useMemo(() => {
    return allArticlesIndex.filter(art => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesAge = selectedAgeGroup === 'All' || art.ageGroup === selectedAgeGroup || art.ageGroup === 'All Ages';
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        art.title.toLowerCase().includes(q) || 
        art.summary.toLowerCase().includes(q) || 
        art.categoryLabel.toLowerCase().includes(q) ||
        art.keywords.some(k => k.toLowerCase().includes(q));

      return matchesCategory && matchesAge && matchesSearch;
    });
  }, [allArticlesIndex, selectedCategory, selectedAgeGroup, searchQuery]);

  // Paginated articles
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Selected full article object
  const currentArticle: KnowledgeArticle | null = useMemo(() => {
    if (!selectedArticleSlug) return null;
    return getKnowledgeArticleBySlug(selectedArticleSlug);
  }, [selectedArticleSlug]);

  const toggleSaveArticle = (slug: string) => {
    setSavedArticles(prev => {
      const updated = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem('vernunt_saved_articles', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed saving article locally:', err);
      }
      return updated;
    });
  };

  const handleCopyShareLink = (slug: string) => {
    const url = `https://app.vernunt.com/knowledge/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const toggleStepCompleted = (stepIdx: number) => {
    const key = `${selectedArticleSlug}_step_${stepIdx}`;
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Nutrition': return '🍎';
      case 'Psychology': return '🧠';
      case 'Education': return '📚';
      case 'Sports': return '⚽';
      case 'Care': return '🍼';
      case 'Future': return '🚀';
      default: return '📖';
    }
  };

  // If viewing a single article deep-dive
  if (currentArticle) {
    return (
      <div id="knowledge-article-view" className="max-w-4xl mx-auto space-y-6 pb-16">
        
        {/* Back Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedArticleSlug(null)}
            className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition cursor-pointer border border-rose-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Knowledge Library ({allArticlesIndex.length}+ Guides)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSaveArticle(currentArticle.slug)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer ${
                savedArticles.includes(currentArticle.slug)
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedArticles.includes(currentArticle.slug) ? 'fill-current' : ''}`} />
              <span>{savedArticles.includes(currentArticle.slug) ? 'Saved' : 'Save Guide'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyShareLink(currentArticle.slug)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Article Header Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1">
              <span>{getCategoryIcon(currentArticle.category)}</span> {currentArticle.categoryLabel}
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] px-3 py-1 rounded-full">
              👶 Age: {currentArticle.ageGroup}
            </span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" /> {currentArticle.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif leading-tight">
            {currentArticle.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
            "{currentArticle.summary}"
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <img
              src={currentArticle.author.avatar}
              alt={currentArticle.author.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-rose-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="text-xs font-black text-slate-900">{currentArticle.author.name}</h4>
              <p className="text-[11px] text-slate-500">{currentArticle.author.role}</p>
            </div>
            <span className="ml-auto text-[10px] text-slate-400 font-mono">
              Published: {currentArticle.publishedDate}
            </span>
          </div>

          {/* Table of Contents */}
          {currentArticle.tableOfContents && currentArticle.tableOfContents.length > 0 && (
            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-3">
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-700" /> In this Comprehensive Guide
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {currentArticle.tableOfContents.map((toc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-mono font-bold text-[10px] mt-0.5">{idx + 1}.</span>
                    <span>{toc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Clinical Takeaways */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 space-y-3">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-700" /> Key Developmental Takeaways
            </h4>
            <div className="space-y-2">
              {currentArticle.content.keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-emerald-900 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Dive Sections */}
          <div className="space-y-8 pt-4">
            {currentArticle.content.deepDiveSections.map((sec, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-lg font-black text-slate-900 font-serif border-b border-slate-100 pb-2">
                  {sec.heading}
                </h2>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {sec.body.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {sec.proTip && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black text-amber-950 block mb-0.5">Clinical Pro-Tip:</strong>
                      <span>{sec.proTip}</span>
                    </div>
                  </div>
                )}

                {sec.warningOrAlert && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black text-red-950 block mb-0.5">Safety & Health Notice:</strong>
                      <span>{sec.warningOrAlert}</span>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Actionable Daily Step Checklist */}
          {currentArticle.content.actionableSteps && currentArticle.content.actionableSteps.length > 0 && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-rose-400" /> Actionable 3-Step Execution Checklist
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Check off steps as you implement them with your child</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {currentArticle.content.actionableSteps.map((step, idx) => {
                  const key = `${currentArticle.slug}_step_${idx}`;
                  const isDone = !!completedSteps[key];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStepCompleted(idx)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        isDone
                          ? 'bg-emerald-900/40 border-emerald-500/60 text-emerald-100 line-through opacity-80'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black mt-0.5 flex-shrink-0 border ${
                        isDone ? 'bg-emerald-500 text-white border-emerald-400' : 'border-slate-500 text-slate-400'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className="text-xs leading-relaxed font-medium">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frequently Asked Questions */}
          {currentArticle.content.faq && currentArticle.content.faq.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-700" /> Parent FAQs on {currentArticle.title.split(':')[0]}
              </h3>
              <div className="space-y-3">
                {currentArticle.content.faq.map((f, fIdx) => (
                  <div key={fIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-start gap-2">
                      <span className="text-rose-600 font-mono">Q:</span> {f.question}
                    </h4>
                    <p className="text-xs text-slate-600 pl-5 leading-relaxed">
                      {f.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vernunt Community Playmate Connection Callout */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-6 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-black text-rose-950 font-serif">
                Connect with Nearby Families Practicing {currentArticle.categoryLabel}
              </h4>
              <p className="text-xs text-rose-800/80">
                Discover verified parents and kids in your neighborhood matching this age group on the live Radar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToRadar) {
                  onNavigateToRadar(currentArticle.category);
                }
              }}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Compass className="w-4 h-4" /> Find Matching Playmates
            </button>
          </div>

          {/* Search Keywords & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-slate-100">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Indexed Keywords:</span>
            {currentArticle.keywords.map((kw, kwIdx) => (
              <button
                key={kwIdx}
                type="button"
                onClick={() => {
                  setSelectedArticleSlug(null);
                  setSearchQuery(kw);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium px-2.5 py-0.5 rounded-md transition cursor-pointer"
              >
                #{kw}
              </button>
            ))}
          </div>

        </article>
      </div>
    );
  }

  // Main Knowledge Library Search & Topic Catalog Browser (1,000+ SEO pages)
  return (
    <div id="knowledge-hub-container" className="space-y-6 pb-16">
      
      {/* Hero Search Header */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-black px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> 1,000+ Evidence-Based Guides & Child Development Blueprints
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-serif leading-tight tracking-tight">
            The Vernunt Child Development & Parenting Knowledge Base
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            Comprehensive expert research on infant and toddler nutrition, child neuroscience and psychology, homeschooling futures, youth athletic motor skills, and AI-era family life skills.
          </p>

          {/* Master Search Input */}
          <div className="relative pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
            <input
              id="input-knowledge-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search 1,000+ topics (e.g. Brain foods, toddler tantrums, baby swimming, homeschooling, Montessori...)"
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:ring-4 focus:ring-rose-500/40 focus:bg-slate-900 transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick stats banner */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
            <span>📚 {allArticlesIndex.length.toLocaleString()}+ Guides Indexed</span>
            <span>•</span>
            <span>🔬 Pediatric & M.Ed Verified</span>
            <span>•</span>
            <span>🔍 Google-Optimized Sitemaps</span>
          </div>
        </div>
      </div>

      {/* 6 Category Pillar Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KNOWLEDGE_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(isSelected ? 'All' : cat.id);
                setCurrentPage(1);
              }}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-rose-700 text-white border-rose-700 shadow-md scale-102'
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-rose-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-rose-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cat.topicCount}+
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black font-serif leading-tight">{cat.name}</h4>
                <p className={`text-[10px] line-clamp-2 mt-0.5 ${isSelected ? 'text-rose-100' : 'text-slate-500'}`}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Age Group Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-rose-700" /> Filter Age:
          </span>
          {['All', '0-12 Months', '1-3 Years', '4-6 Years', '7-10 Years', '11-14 Years'].map(age => (
            <button
              key={age}
              type="button"
              onClick={() => {
                setSelectedAgeGroup(age);
                setCurrentPage(1);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                selectedAgeGroup === age
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {age === 'All' ? 'All Stages' : age}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-rose-700 font-mono font-black">{filteredArticles.length}</span> matching guides
        </div>
      </div>

      {/* Flagship Spotlight Articles (When no search query is active) */}
      {!searchQuery && selectedCategory === 'All' && selectedAgeGroup === 'All' && currentPage === 1 && (
        <div className="space-y-3">
          <h3 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Editors' Spotlight & Flagship Deep Dives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLAGSHIP_KNOWLEDGE_ARTICLES.map(flagship => (
              <div
                key={flagship.slug}
                onClick={() => setSelectedArticleSlug(flagship.slug)}
                className="bg-white rounded-3xl p-5 border border-rose-200/80 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {getCategoryIcon(flagship.category)} {flagship.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {flagship.readTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 font-serif group-hover:text-rose-700 transition leading-snug">
                    {flagship.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {flagship.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={flagship.author.avatar}
                      alt={flagship.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] font-bold text-slate-700">{flagship.author.name.split(',')[0]}</span>
                  </div>
                  <span className="text-rose-700 font-black flex items-center gap-0.5 group-hover:translate-x-1 transition text-xs">
                    Read Guide <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Grid of Guides (1000+ permutations) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-700" /> Knowledge Library Directory ({filteredArticles.length} Available)
          </h3>

          {savedArticles.length > 0 && (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              🔖 {savedArticles.length} Saved Guides
            </span>
          )}
        </div>

        {paginatedArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-slate-200">
            <span className="text-4xl block">🔍</span>
            <h4 className="text-base font-bold text-slate-700 font-serif">No Guides Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your search keywords or clearing the category and age group filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedAgeGroup('All');
              }}
              className="bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedArticles.map(art => {
              const isSaved = savedArticles.includes(art.slug);
              return (
                <div
                  key={art.slug}
                  onClick={() => setSelectedArticleSlug(art.slug)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {getCategoryIcon(art.category)} {art.categoryLabel}
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/60">
                        {art.ageGroup}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-serif group-hover:text-rose-700 transition leading-snug line-clamp-2">
                      {art.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ⏱ {art.readTime}
                    </span>
                    <span className="text-rose-700 font-black text-xs flex items-center gap-1 group-hover:translate-x-1 transition">
                      Explore Blueprint <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous
            </button>

            <span className="text-xs font-mono font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
