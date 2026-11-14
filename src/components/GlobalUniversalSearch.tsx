import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, User, Stethoscope, Calendar, Home, ShoppingBag,
  Sparkles, ChevronRight, Filter, Trees, BookOpen, Tag
} from 'lucide-react';
import { ChildProfile, CommunityEvent, DaycarePlayhomeProfile, MarketItem } from '../types.ts';
import type { StoreProduct } from '../types/store.ts';
import { BANGALORE_PARKS } from '../data/bangaloreParks.ts';
import { getStoredProducts, getStoredCategories } from '../data/storeProducts.ts';
import {
  FLAGSHIP_KNOWLEDGE_ARTICLES,
  getAdminCustomKnowledgeArticles
} from '../data/knowledgeBase.ts';
import {
  semanticRankProducts,
  semanticRankEvents,
  semanticTextMatchScore,
  fetchAiSemanticSearch
} from '../utils/marketplaceAiEngine.ts';

export interface GlobalUniversalSearchResult {
  id: string;
  type: 'category' | 'store' | 'event' | 'specialist' | 'daycare' | 'park' | 'guide' | 'playmate';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  tabId: string;
  extraInfo?: string;
  score: number;
  meta?: any;
}

interface GlobalUniversalSearchProps {
  userProfile?: ChildProfile | null;
  playmates: ChildProfile[];
  specialists?: any[];
  events: CommunityEvent[];
  daycares?: DaycarePlayhomeProfile[];
  storeProducts?: MarketItem[];
  onSelectResult: (type: string, tabId: string, item: any) => void;
  className?: string;
}

function getLocationLabel(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return String(loc.address || loc.neighbourhood || loc.locality || loc.city || '');
  }
  return String(loc);
}

export default function GlobalUniversalSearch({
  userProfile,
  playmates = [],
  specialists = [],
  events = [],
  daycares = [],
  storeProducts = [],
  onSelectResult,
  className = ''
}: GlobalUniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'store' | 'events' | 'specialists' | 'parks' | 'daycares' | 'guides' | 'playmates'
  >('all');
  const [aiMatchedProductIds, setAiMatchedProductIds] = useState<string[]>([]);
  const [aiIntentHint, setAiIntentHint] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Store Catalog + Categories + Custom Parks + Knowledge Articles
  const catalogProducts = useMemo<StoreProduct[]>(() => {
    try {
      return getStoredProducts();
    } catch {
      return [];
    }
  }, [isOpen]);

  const storeCategories = useMemo(() => {
    try {
      return getStoredCategories().filter(c => c.id !== 'all');
    } catch {
      return [];
    }
  }, [isOpen]);

  const allParks = useMemo(() => {
    try {
      const savedCustom = localStorage.getItem('vernunt_custom_community_parks');
      const parsed = savedCustom ? JSON.parse(savedCustom) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...BANGALORE_PARKS];
      }
    } catch {
      // ignore storage error
    }
    return BANGALORE_PARKS;
  }, [isOpen]);

  const allGuides = useMemo(() => {
    try {
      const custom = getAdminCustomKnowledgeArticles();
      return [...custom, ...FLAGSHIP_KNOWLEDGE_ARTICLES];
    } catch {
      return FLAGSHIP_KNOWLEDGE_ARTICLES;
    }
  }, [isOpen]);

  // Debounced server-side Gemini AI semantic enrichment across Shop & Events
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setAiMatchedProductIds([]);
      setAiIntentHint('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAiLoading(true);
      const res = await fetchAiSemanticSearch({
        query: trimmed,
        targetType: 'product',
        accountId: userProfile?.id,
        items: catalogProducts.map(p => ({
          id: p.id,
          title: p.name,
          category: p.category,
          subcategory: p.subcategory,
          tags: p.tags,
          description: p.shortDescription || p.description?.slice(0, 100),
          ageLabel: p.ageLabel
        }))
      });
      if (!cancelled) {
        setIsAiLoading(false);
        if (res?.success) {
          setAiMatchedProductIds(Array.isArray(res.matchedIds) ? res.matchedIds : []);
          setAiIntentHint(res.interpretedIntent || '');
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, catalogProducts, userProfile?.id]);

  // Unified AI Semantic Search across ALL Vernunt sections
  const searchResults = useMemo(() => {
    const clean = query.trim();
    if (!clean) return [];

    const allMatches: GlobalUniversalSearchResult[] = [];
    const perCategoryCap = activeFilter === 'all' ? 12 : 40;

    // 1. Store Departments / Categories (e.g., "Kids Food & Organic Nutrition")
    if (activeFilter === 'all' || activeFilter === 'store') {
      const catHits: GlobalUniversalSearchResult[] = [];
      for (const cat of storeCategories) {
        const subStr = Array.isArray(cat.subcategories) ? cat.subcategories.join(' ') : '';
        const { score } = semanticTextMatchScore(clean, cat.name, `${cat.description || ''} ${subStr} ${cat.ageTag || ''}`);
        if (score > 0) {
          catHits.push({
            id: cat.id,
            type: 'category',
            title: `${cat.icon || '🛍️'} ${cat.name}`,
            subtitle: `${cat.description?.slice(0, 85) || 'Curated Vernunt Store Department'}`,
            badge: 'Shop Department',
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
            icon: Tag,
            tabId: 'store',
            extraInfo: cat.subcategories?.slice(0, 3).join(' · ') || cat.ageTag,
            score: score + 20, // Boost exact department matches so "Food" surfaces "Kids Food & Organic Nutrition" immediately
            meta: cat
          });
        }
      }
      allMatches.push(...catHits.sort((a, b) => b.score - a.score).slice(0, 6));
    }

    // 2. Real Vernunt Store Products + Legacy Marketplace Items (AI Semantic + Typo-Tolerant)
    if (activeFilter === 'all' || activeFilter === 'store') {
      const productHits: GlobalUniversalSearchResult[] = [];
      const rankedProducts = semanticRankProducts(clean, catalogProducts, userProfile?.id);
      const addedProdIds = new Set<string>();

      for (const prod of rankedProducts.items) {
        const score = rankedProducts.scores[prod.id] || 15;
        addedProdIds.add(prod.id);
        productHits.push({
          id: prod.id,
          type: 'store',
          title: prod.name,
          subtitle: `${prod.category}${prod.subcategory ? ` • ${prod.subcategory}` : ''} • ${prod.ageLabel || 'Kids'}`,
          badge: 'Vernunt Store',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ShoppingBag,
          tabId: 'store',
          extraInfo: `₹${prod.price.toLocaleString('en-IN')}`,
          score,
          meta: prod
        });
      }

      // Merge any Gemini server semantic matches not yet included
      if (aiMatchedProductIds.length > 0) {
        aiMatchedProductIds.forEach((id, idx) => {
          if (addedProdIds.has(id)) return;
          const prod = catalogProducts.find(p => p.id === id);
          if (!prod) return;
          addedProdIds.add(id);
          productHits.push({
            id: prod.id,
            type: 'store',
            title: prod.name,
            subtitle: `${prod.category} • ${prod.ageLabel || 'Kids'}`,
            badge: 'AI Store Match',
            badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            icon: ShoppingBag,
            tabId: 'store',
            extraInfo: `₹${prod.price.toLocaleString('en-IN')}`,
            score: Math.max(10, 40 - idx * 3),
            meta: prod
          });
        });
      }

      // Include any extra Store/Marketplace prop items if not already matched
      for (const sp of storeProducts) {
        if (addedProdIds.has(sp.id)) continue;
        const { score } = semanticTextMatchScore(clean, sp.title || '', sp.description || '');
        if (score > 0) {
          productHits.push({
            id: sp.id,
            type: 'store',
            title: sp.title,
            subtitle: `₹${sp.price} • ${(sp.description || '').slice(0, 65)}...`,
            badge: 'Vernunt Store',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
            icon: ShoppingBag,
            tabId: 'store',
            extraInfo: `₹${sp.price}`,
            score,
            meta: sp
          });
        }
      }

      allMatches.push(...productHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    // 3. Events, Classes & Activities (AI Semantic + Typo-Tolerant)
    if (activeFilter === 'all' || activeFilter === 'events') {
      const rankedEvents = semanticRankEvents(clean, events, userProfile?.id);
      const eventHits: GlobalUniversalSearchResult[] = rankedEvents.items
        .slice(0, perCategoryCap)
        .map(e => ({
          id: e.id,
          type: 'event',
          title: e.title,
          subtitle: `${e.date} • ${getLocationLabel(e.location) || 'Online'}`,
          badge: e.category || 'Event',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Calendar,
          tabId: 'events',
          extraInfo: e.ticketPrice ? `₹${e.ticketPrice}` : 'FREE',
          score: rankedEvents.scores[e.id] || 15,
          meta: e
        }));
      allMatches.push(...eventHits);
    }

    // 4. Specialists & Doctors (Pediatricians, Nutritionists, Coaches)
    if (activeFilter === 'all' || activeFilter === 'specialists') {
      const specHits: GlobalUniversalSearchResult[] = [];
      for (const s of specialists) {
        const secondary = `${s.specialty || ''} ${s.role || ''} ${getLocationLabel(s.location)} ${s.bio || ''} ${(s.languages || []).join(' ')}`;
        const { score } = semanticTextMatchScore(clean, s.name || '', secondary);
        if (score > 0) {
          specHits.push({
            id: s.id,
            type: 'specialist',
            title: s.name,
            subtitle: `${s.specialty || s.role || 'Specialist'} • ${getLocationLabel(s.location) || 'Bengaluru'}`,
            badge: 'Doctor / Specialist',
            badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
            icon: Stethoscope,
            tabId: 'specialists',
            extraInfo: s.consultationFee ? `₹${s.consultationFee} Consult` : undefined,
            score,
            meta: s
          });
        }
      }
      allMatches.push(...specHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    // 5. Daycares & Playhomes
    if (activeFilter === 'all' || activeFilter === 'daycares') {
      const dcHits: GlobalUniversalSearchResult[] = [];
      for (const d of daycares) {
        const amenities = Array.isArray(d.amenities) ? d.amenities.join(' ') : '';
        const { score } = semanticTextMatchScore(
          clean,
          d.title || '',
          `${d.hostName || ''} ${d.address || ''} ${d.city || ''} ${amenities}`
        );
        if (score > 0) {
          dcHits.push({
            id: d.id,
            type: 'daycare',
            title: d.title,
            subtitle: `${d.hostName} • ${d.city || d.address}`,
            badge: 'Daycare Playhome',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            icon: Home,
            tabId: 'daycare',
            extraInfo: d.verifiedByAdmin ? 'Verified Safe' : undefined,
            score,
            meta: d
          });
        }
      }
      allMatches.push(...dcHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    // 6. Neighborhood Parks & Play Areas
    if (activeFilter === 'all' || activeFilter === 'parks') {
      const parkHits: GlobalUniversalSearchResult[] = [];
      for (const park of allParks) {
        const fac = Array.isArray(park.facilities) ? park.facilities.join(' ') : '';
        const { score } = semanticTextMatchScore(
          clean,
          park.name || '',
          `${park.locality || ''} ${park.zone || ''} ${park.address || ''} ${fac}`
        );
        if (score > 0) {
          parkHits.push({
            id: park.id,
            type: 'park',
            title: park.name,
            subtitle: `${park.locality} • ${park.zone} Bangalore • ${park.timings || ''}`,
            badge: 'Park & Play',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            icon: Trees,
            tabId: 'radar',
            extraInfo: park.entryFee,
            score,
            meta: park
          });
        }
      }
      allMatches.push(...parkHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    // 7. Parenting Guides & Knowledge Hub
    if (activeFilter === 'all' || activeFilter === 'guides') {
      const guideHits: GlobalUniversalSearchResult[] = [];
      for (const g of allGuides) {
        const kw = Array.isArray(g.keywords) ? g.keywords.join(' ') : '';
        const { score } = semanticTextMatchScore(
          clean,
          g.title || '',
          `${g.category || ''} ${g.categoryLabel || ''} ${g.summary || ''} ${kw}`
        );
        if (score > 0) {
          guideHits.push({
            id: g.slug,
            type: 'guide',
            title: g.title,
            subtitle: `${g.categoryLabel || g.category} • ${g.ageGroup} • ${g.readTime}`,
            badge: 'Parenting Guide',
            badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
            icon: BookOpen,
            tabId: 'knowledge',
            score,
            meta: g
          });
        }
      }
      allMatches.push(...guideHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    // 8. Verified Playmates (Safe string/object parent location handling)
    if (activeFilter === 'all' || activeFilter === 'playmates') {
      const pmHits: GlobalUniversalSearchResult[] = [];
      for (const p of playmates) {
        const locStr = getLocationLabel(p.location);
        const interestsStr = Array.isArray(p.interests) ? p.interests.join(' ') : '';
        const langsStr = Array.isArray(p.languagesSpoken) ? p.languagesSpoken.join(' ') : '';
        const { score } = semanticTextMatchScore(
          clean,
          `${p.childName || ''} ${p.parentName || ''}`,
          `${locStr} ${p.school || ''} ${interestsStr} ${langsStr}`
        );
        if (score > 0) {
          pmHits.push({
            id: p.id,
            type: 'playmate',
            title: `${p.childName} (${p.childAge}y)`,
            subtitle: `Parent: ${p.parentName} • ${locStr || 'Bangalore'}`,
            badge: 'Playmate',
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
            icon: User,
            tabId: 'radar',
            extraInfo: Array.isArray(p.interests) ? p.interests.slice(0, 3).join(', ') : undefined,
            score,
            meta: p
          });
        }
      }
      allMatches.push(...pmHits.sort((a, b) => b.score - a.score).slice(0, perCategoryCap));
    }

    return allMatches.sort((a, b) => b.score - a.score);
  }, [
    query,
    activeFilter,
    userProfile?.id,
    storeCategories,
    catalogProducts,
    aiMatchedProductIds,
    storeProducts,
    events,
    specialists,
    daycares,
    allParks,
    allGuides,
    playmates
  ]);

  const handleSelect = (item: GlobalUniversalSearchResult) => {
    onSelectResult(item.type, item.tabId, item.meta);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-4xl mx-auto ${className}`}>
      {/* Search Input Box */}
      <div
        id="global-universal-search-box"
        className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
          isOpen ? 'ring-4 ring-rose-100 border-rose-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="pl-4 pr-2 text-rose-600 flex items-center pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          id="input-global-universal-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="AI search everything: shop categories, food, toys, doctors, events, parks, guides..."
          className="w-full py-2.5 sm:py-3 pr-24 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 bg-transparent outline-none"
        />

        {/* Action icons (Clear & Keyboard badge) */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200/80">
            /
          </span>
        </div>
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div
          id="global-search-results-overlay"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Filter Tabs Bar */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 pl-1 pr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            {([
              { id: 'all', label: `All (${searchResults.length})` },
              { id: 'store', label: 'Shop & Categories' },
              { id: 'events', label: 'Events' },
              { id: 'specialists', label: 'Doctors' },
              { id: 'parks', label: 'Parks' },
              { id: 'daycares', label: 'Daycares' },
              { id: 'guides', label: 'Guides' },
              { id: 'playmates', label: 'Playmates' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI Semantic Intent Strip */}
          {(isAiLoading || aiIntentHint) && (
            <div className="px-3.5 py-1.5 bg-indigo-50/70 border-b border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-1.5">
              <Sparkles className={`w-3 h-3 text-indigo-600 shrink-0 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span className="truncate">
                {isAiLoading ? 'Searching semantically across store, doctors, events & guides...' : aiIntentHint}
              </span>
            </div>
          )}

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 p-1">
            {searchResults.length > 0 ? (
              searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="p-3 hover:bg-rose-50/50 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-rose-100 group-hover:text-rose-700 text-slate-600 flex items-center justify-center shrink-0 transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-700 truncate">
                            {item.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider shrink-0 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                        {item.extraInfo && (
                          <span className="text-[10px] font-semibold text-rose-600 mt-0.5 inline-block">
                            {item.extraInfo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400 group-hover:text-rose-600 transition pr-1">
                      <span className="text-[10px] font-bold hidden sm:inline">View</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                <Search className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Try searching for kids food, Montessori toys, doctor specialty, BDA parks, or weekend events.
                </p>
              </div>
            )}
          </div>

          {/* Quick Footer summary */}
          {searchResults.length > 0 && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-4">
              <span>Found {searchResults.length} AI semantic results across Vernunt</span>
              <span className="font-mono">Press Esc to close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
