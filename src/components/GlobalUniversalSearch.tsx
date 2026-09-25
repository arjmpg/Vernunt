import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, X, User, Stethoscope, Calendar, Home, ShoppingBag, 
  ArrowRight, Sparkles, MapPin, Tag, CheckCircle2, ChevronRight,
  Filter
} from 'lucide-react';
import { ChildProfile, Specialist, CommunityEvent, DaycarePlayhomeProfile, MarketItem } from '../types.ts';

export interface GlobalUniversalSearchResult {
  id: string;
  type: 'playmate' | 'specialist' | 'event' | 'daycare' | 'store';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  tabId: string;
  extraInfo?: string;
  meta?: any;
}

interface GlobalUniversalSearchProps {
  playmates: ChildProfile[];
  specialists: Specialist[];
  events: CommunityEvent[];
  daycares?: DaycarePlayhomeProfile[];
  storeProducts?: MarketItem[];
  onSelectResult: (type: string, tabId: string, item: any) => void;
  className?: string;
}

export default function GlobalUniversalSearch({
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'playmates' | 'specialists' | 'events' | 'daycares' | 'store'>('all');
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

  // Fast search index calculation
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: GlobalUniversalSearchResult[] = [];

    // 1. Search Playmates
    if (activeFilter === 'all' || activeFilter === 'playmates') {
      for (const p of playmates) {
        const matchesChildName = p.childName?.toLowerCase().includes(q);
        const matchesParentName = p.parentName?.toLowerCase().includes(q);
        const matchesLocation = p.location?.toLowerCase().includes(q);
        const matchesSchool = p.school?.toLowerCase().includes(q);
        const matchesInterests = p.interests?.some(i => i.toLowerCase().includes(q));
        const matchesLanguages = p.languagesSpoken?.some(l => l.toLowerCase().includes(q));

        if (matchesChildName || matchesParentName || matchesLocation || matchesSchool || matchesInterests || matchesLanguages) {
          results.push({
            id: p.id,
            type: 'playmate',
            title: `${p.childName} (${p.childAge}y)`,
            subtitle: `Parent: ${p.parentName} • ${p.location || 'Bangalore'}`,
            badge: 'Playmate',
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
            icon: User,
            tabId: 'radar',
            extraInfo: p.interests?.slice(0, 3).join(', '),
            meta: p
          });
          if (results.length > 50) break;
        }
      }
    }

    // 2. Search Specialists
    if (activeFilter === 'all' || activeFilter === 'specialists') {
      for (const s of specialists) {
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesCategory = s.category?.toLowerCase().includes(q);
        const matchesSpecialty = s.specialties?.some(sp => sp.toLowerCase().includes(q));
        const matchesClinic = s.clinicAddress?.toLowerCase().includes(q);
        const matchesHospital = s.hospitalAffiliation?.toLowerCase().includes(q);
        const matchesBio = s.bio?.toLowerCase().includes(q);

        if (matchesName || matchesCategory || matchesSpecialty || matchesClinic || matchesHospital || matchesBio) {
          results.push({
            id: s.id,
            type: 'specialist',
            title: s.name,
            subtitle: `${s.category} • ${s.hospitalAffiliation || s.clinicAddress || 'Clinic'}`,
            badge: s.category || 'Specialist',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: Stethoscope,
            tabId: 'specialists',
            extraInfo: s.experienceYears ? `${s.experienceYears}y exp • ₹${s.consultationFee}` : undefined,
            meta: s
          });
          if (results.length > 75) break;
        }
      }
    }

    // 3. Search Events
    if (activeFilter === 'all' || activeFilter === 'events') {
      for (const e of events) {
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesHost = e.hostName?.toLowerCase().includes(q);
        const matchesLocation = e.location?.toLowerCase().includes(q);
        const matchesCategory = e.category?.toLowerCase().includes(q);
        const matchesTags = e.tags?.some(t => t.toLowerCase().includes(q));

        if (matchesTitle || matchesDesc || matchesHost || matchesLocation || matchesCategory || matchesTags) {
          results.push({
            id: e.id,
            type: 'event',
            title: e.title,
            subtitle: `${e.date} • ${e.location}`,
            badge: e.category || 'Event',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
            icon: Calendar,
            tabId: 'events',
            extraInfo: e.ticketPrice ? `₹${e.ticketPrice}` : 'FREE',
            meta: e
          });
          if (results.length > 100) break;
        }
      }
    }

    // 4. Search Daycares
    if (activeFilter === 'all' || activeFilter === 'daycares') {
      for (const d of daycares) {
        const matchesTitle = d.title?.toLowerCase().includes(q);
        const matchesHost = d.hostName?.toLowerCase().includes(q);
        const matchesAddress = d.address?.toLowerCase().includes(q);
        const matchesCity = d.city?.toLowerCase().includes(q);
        const matchesAmenities = d.amenities?.some(a => a.toLowerCase().includes(q));

        if (matchesTitle || matchesHost || matchesAddress || matchesCity || matchesAmenities) {
          results.push({
            id: d.id,
            type: 'daycare',
            title: d.title,
            subtitle: `${d.hostName} • ${d.city || d.address}`,
            badge: 'Daycare Playhome',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            icon: Home,
            tabId: 'daycare',
            extraInfo: d.verifiedByAdmin ? 'Verified Safe' : undefined,
            meta: d
          });
          if (results.length > 120) break;
        }
      }
    }

    // 5. Search Store Products
    if (activeFilter === 'all' || activeFilter === 'store') {
      for (const sp of storeProducts) {
        const matchesTitle = sp.title?.toLowerCase().includes(q);
        const matchesDesc = sp.description?.toLowerCase().includes(q);

        if (matchesTitle || matchesDesc) {
          results.push({
            id: sp.id,
            type: 'store',
            title: sp.title,
            subtitle: `₹${sp.price} • ${sp.description?.slice(0, 60)}...`,
            badge: 'Vernunt Store',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
            icon: ShoppingBag,
            tabId: 'store',
            extraInfo: `₹${sp.price}`,
            meta: sp
          });
          if (results.length > 140) break;
        }
      }
    }

    return results;
  }, [query, activeFilter, playmates, specialists, events, daycares, storeProducts]);

  // Handle item click
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
          <Search className="w-5 h-5 animate-pulse" />
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
          placeholder="Search anything: playmates, doctors, events, daycares, toys, locations, schools..."
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
          {/* Filter Pills Bar */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 pl-1 pr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            {(['all', 'playmates', 'specialists', 'events', 'daycares', 'store'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(filterKey)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black capitalize transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === filterKey
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {filterKey === 'all' ? `All (${searchResults.length})` : filterKey}
              </button>
            ))}
          </div>

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
                        <div className="flex items-center gap-2">
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
                  Try searching with doctor specialty, parent name, area like &ldquo;HSR Layout&rdquo;, or &ldquo;Robotics&rdquo;.
                </p>
              </div>
            )}
          </div>

          {/* Quick Footer summary */}
          {searchResults.length > 0 && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-4">
              <span>Found {searchResults.length} fast results across the whole network</span>
              <span className="font-mono">Press Esc to close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
