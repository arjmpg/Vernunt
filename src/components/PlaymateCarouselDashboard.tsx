import React, { useState, useMemo } from 'react';
import { ChildProfile } from '../types.ts';
import { 
  SlidersHorizontal, ChevronDown, Search, RotateCcw, 
  Clock, UserCheck, Bookmark, Sparkles, Navigation,
  ShieldCheck, Users, HeartHandshake, Baby, School, Trophy
} from 'lucide-react';
import PlaymateCarouselSection from './PlaymateCarouselSection.tsx';
import { getHaversineDistance } from '../utils/distance.ts';

interface PlaymateCarouselDashboardProps {
  playmates: ChildProfile[];
  filteredPlaymates: ChildProfile[];
  userProfile: ChildProfile;
  userLat: number;
  userLng: number;
  connectedIds: string[];
  savedProfileIds: string[];
  onSelectPlaymate: (profile: ChildProfile) => void;
  onQuickChat?: (profile: ChildProfile, templateMessage?: string) => void;
  onToggleSave: (id: string) => void;

  // Filter props
  filterSearchQuery: string;
  setFilterSearchQuery: (val: string) => void;
  maxDistanceKm: number;
  setMaxDistanceKm: (val: number) => void;
  filterPlayStyle: string;
  setFilterPlayStyle: (val: string) => void;
  filterAgeGroup: string;
  setFilterAgeGroup: (val: string) => void;
  filterGender: string;
  setFilterGender: (val: string) => void;
  filterLanguage: string;
  setFilterLanguage: (val: string) => void;
  filterMinAge: number;
  setFilterMinAge: (val: number) => void;
  filterMaxAge: number;
  setFilterMaxAge: (val: number) => void;
  selectedInterests: string[];
  setSelectedInterests: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPreferredActivities: string[];
  setSelectedPreferredActivities: React.Dispatch<React.SetStateAction<string[]>>;
  filterAvailableDay: string;
  setFilterAvailableDay: (val: string) => void;
  filterAvailableTime: string;
  setFilterAvailableTime: (val: string) => void;
  filterOnlyConnected: boolean;
  setFilterOnlyConnected: (val: boolean) => void;
  filterOnlySaved: boolean;
  setFilterOnlySaved: (val: boolean) => void;
  filterActivityRecency: string;
  setFilterActivityRecency: (val: string) => void;
  radarRecentSearches: string[];
  commitRadarSearchQuery: (query: string) => void;
  clearRecentRadarSearches: () => void;
  onResetFilters: () => void;
}

export default function PlaymateCarouselDashboard({
  playmates,
  filteredPlaymates,
  userProfile,
  userLat,
  userLng,
  connectedIds,
  savedProfileIds,
  onSelectPlaymate,
  onQuickChat,
  onToggleSave,

  filterSearchQuery,
  setFilterSearchQuery,
  maxDistanceKm,
  setMaxDistanceKm,
  filterPlayStyle,
  setFilterPlayStyle,
  filterAgeGroup,
  setFilterAgeGroup,
  filterGender,
  setFilterGender,
  filterLanguage,
  setFilterLanguage,
  filterMinAge,
  setFilterMinAge,
  filterMaxAge,
  setFilterMaxAge,
  selectedInterests,
  setSelectedInterests,
  selectedPreferredActivities,
  setSelectedPreferredActivities,
  filterAvailableDay,
  setFilterAvailableDay,
  filterAvailableTime,
  setFilterAvailableTime,
  filterOnlyConnected,
  setFilterOnlyConnected,
  filterOnlySaved,
  setFilterOnlySaved,
  filterActivityRecency,
  setFilterActivityRecency,
  radarRecentSearches,
  commitRadarSearchQuery,
  clearRecentRadarSearches,
  onResetFilters
}: PlaymateCarouselDashboardProps) {
  // Collapsible Match Criteria & Proximity Filters - hidden by default as requested!
  const [showFilterHub, setShowFilterHub] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const hasActiveFilters = useMemo(() => {
    return (
      maxDistanceKm !== 3.0 ||
      filterPlayStyle !== 'All' ||
      filterAgeGroup !== 'All' ||
      filterGender !== 'All' ||
      filterLanguage !== 'All' ||
      filterSearchQuery.trim() !== '' ||
      filterMinAge !== 0 ||
      filterMaxAge !== 15 ||
      selectedInterests.length > 0 ||
      selectedPreferredActivities.length > 0 ||
      filterAvailableDay !== 'All' ||
      filterAvailableTime !== 'All' ||
      filterOnlyConnected ||
      filterOnlySaved ||
      filterActivityRecency !== 'All'
    );
  }, [
    maxDistanceKm,
    filterPlayStyle,
    filterAgeGroup,
    filterGender,
    filterLanguage,
    filterSearchQuery,
    filterMinAge,
    filterMaxAge,
    selectedInterests,
    selectedPreferredActivities,
    filterAvailableDay,
    filterAvailableTime,
    filterOnlyConnected,
    filterOnlySaved,
    filterActivityRecency
  ]);

  // Curated Carousel Collections based on user profiles
  // 1. Nearby Playmates & Neighbors (sorted by proximity distance)
  const nearbyPlaymates = useMemo(() => {
    return [...filteredPlaymates].sort((a, b) => {
      const distA = getHaversineDistance(userLat, userLng, a.location?.lat || 12.9716, a.location?.lng || 77.5946);
      const distB = getHaversineDistance(userLat, userLng, b.location?.lat || 12.9716, b.location?.lng || 77.5946);
      return distA - distB;
    });
  }, [filteredPlaymates, userLat, userLng]);

  // Spontaneous Meetups Nearby (< 0.5 km)
  const immediateNearbyPlaymates = useMemo(() => {
    return filteredPlaymates.filter(p => {
      const dist = getHaversineDistance(userLat, userLng, p.location?.lat || 12.9716, p.location?.lng || 77.5946);
      return dist <= 0.5;
    });
  }, [filteredPlaymates, userLat, userLng]);

  // 2. Verified Families & Star Parents (Aadhaar/DigiLocker verified or trusted)
  const verifiedPlaymates = useMemo(() => {
    return filteredPlaymates.filter(p => p.aadhaarVerified || p.digilockerVerified);
  }, [filteredPlaymates]);

  // 3. Top Compatible Matches (Matching child age ±2 yrs or shared playstyle)
  const compatiblePlaymates = useMemo(() => {
    const userAge = userProfile?.childAge || 5;
    const userPlayStyle = userProfile?.playStyle || '';
    return filteredPlaymates.filter(p => {
      const ageDiff = Math.abs((p.childAge || 5) - userAge);
      const matchStyle = userPlayStyle && p.playStyle && p.playStyle.toLowerCase() === userPlayStyle.toLowerCase();
      return ageDiff <= 2 || matchStyle;
    });
  }, [filteredPlaymates, userProfile]);

  // 4. Toddler & Early Years (Age 0 - 4 yrs)
  const toddlerPlaymates = useMemo(() => {
    return filteredPlaymates.filter(p => p.childAge >= 0 && p.childAge <= 4);
  }, [filteredPlaymates]);

  // 5. School-Age Buddies (Age 5+ yrs)
  const schoolAgePlaymates = useMemo(() => {
    return filteredPlaymates.filter(p => p.childAge >= 5);
  }, [filteredPlaymates]);

  // 6. Sports, STEM & Creative Hobbies
  const hobbyPlaymates = useMemo(() => {
    return filteredPlaymates.filter(p => 
      p.interests && p.interests.some(i => 
        ['lego', 'soccer', 'chess', 'cricket', 'art', 'dance', 'music', 'robotics', 'swimming', 'reading'].some(k => 
          i.toLowerCase().includes(k)
        )
      )
    );
  }, [filteredPlaymates]);

  return (
    <div id="playmate-carousel-dashboard" className="space-y-8 animate-fadeIn w-full">
      {/* Collapsible Match Criteria & Proximity Filters (Hidden by default, shows on click) */}
      <div id="filter-hub-container" className="bg-white rounded-2xl border border-rose-200/90 shadow-sm overflow-hidden transition-all duration-300">
        {/* Clickable Header Strip */}
        <button
          type="button"
          id="btn-toggle-match-criteria-filters"
          onClick={() => setShowFilterHub(prev => !prev)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-rose-50/40 transition cursor-pointer text-left gap-3"
          aria-expanded={showFilterHub}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 shadow-2xs">
              <SlidersHorizontal className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-rose-950 font-serif">
                  Match Criteria &amp; Proximity Filters
                </h4>
                {hasActiveFilters && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-mono">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {showFilterHub 
                  ? 'Click to collapse filter controls' 
                  : 'Click to filter playmates by radius, age group, play style, language & hobbies'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <span className="hidden sm:inline-block text-[10.5px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Radius: {maxDistanceKm >= 1000 ? 'Any' : `${maxDistanceKm} km`}
              </span>
            )}
            <span className="text-[10.5px] font-black bg-rose-700 text-white px-3 py-1 rounded-full shadow-xs">
              {filteredPlaymates.length} Compatible Matches
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilterHub ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Collapsible Body (Rendered only when user clicks header) */}
        {showFilterHub && (
          <div id="filter-hub-body" className="p-5 border-t border-rose-100 space-y-4 bg-white animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
              <span className="text-xs text-slate-600 font-medium">
                Adjust search criteria to find playmates tailored to your child's age, language, and interests.
              </span>

              {hasActiveFilters && (
                <button
                  id="btn-clear-all-filters-hub"
                  type="button"
                  onClick={onResetFilters}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10.5px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Criteria</span>
                </button>
              )}
            </div>

            {/* Row 1: Search keyword bar & Proximity Distance Range Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Bar Input */}
              <div className="flex flex-col space-y-1.5" id="filter-search-container">
                <label className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider">
                  Search Name / Language / Interest
                </label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600 group-focus-within:text-rose-700 transition z-10 pointer-events-none" />
                  <input
                    id="input-radar-search-query-hub"
                    type="text"
                    value={filterSearchQuery}
                    onChange={(e) => setFilterSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      if (filterSearchQuery.trim()) {
                        commitRadarSearchQuery(filterSearchQuery);
                      }
                      setTimeout(() => setIsSearchFocused(false), 220);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filterSearchQuery.trim()) {
                        commitRadarSearchQuery(filterSearchQuery);
                        setIsSearchFocused(false);
                      }
                    }}
                    placeholder="e.g. Ayaan, Lego, Hindi, Soccer, Doctor..."
                    className="w-full pl-9 pr-4 py-2 bg-rose-50/30 border border-rose-200 hover:border-rose-300 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 focus:bg-white transition"
                  />

                  {/* Dropdown showing user's last 3 recent search queries when input is focused */}
                  {isSearchFocused && radarRecentSearches.length > 0 && (
                    <div
                      id="dropdown-radar-recent-searches-hub"
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-rose-200 shadow-xl py-2 z-50 animate-fadeIn"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center justify-between px-3.5 py-1 text-[10px] font-black uppercase text-rose-900/80 border-b border-rose-100 pb-1.5 mb-1 tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-600" /> Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentRadarSearches}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-700 transition cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="divide-y divide-rose-50/80">
                        {radarRecentSearches.slice(0, 3).map((query, idx) => (
                          <div
                            key={idx}
                            className="px-3.5 py-2 hover:bg-rose-50 transition flex items-center justify-between group/item cursor-pointer"
                            onClick={() => {
                              setFilterSearchQuery(query);
                              commitRadarSearchQuery(query);
                              setIsSearchFocused(false);
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Search className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-rose-600" />
                              <span className="text-xs font-semibold text-slate-700 group-hover/item:text-rose-950 truncate">
                                {query}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 group-hover/item:text-rose-600 font-mono">
                              Apply ↵
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Distance Slider */}
              <div className="flex flex-col space-y-1.5" id="filter-distance-container">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider">
                    Maximum Search Radius
                  </label>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200/60 font-mono">
                    {maxDistanceKm >= 1000 ? 'Any distance (Global)' : `${maxDistanceKm.toFixed(1)} km`}
                  </span>
                </div>
                <input 
                  id="range-radar-max-distance-hub"
                  type="range" 
                  min="0.5" 
                  max="50" 
                  step="0.5"
                  value={maxDistanceKm > 50 ? 50 : maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-2 bg-rose-100 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>0.5 km</span>
                  <span>5 km</span>
                  <span>15 km</span>
                  <span>50 km</span>
                </div>
              </div>
            </div>

            {/* Quick Refinement Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Connected Friends Only */}
                <button
                  id="btn-filter-only-connected-hub"
                  type="button"
                  onClick={() => setFilterOnlyConnected(!filterOnlyConnected)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filterOnlyConnected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className={`w-3.5 h-3.5 ${filterOnlyConnected ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Connected Friends</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${filterOnlyConnected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {connectedIds.length}
                  </span>
                </button>

                {/* Saved Profiles Only */}
                <button
                  id="btn-filter-only-saved-hub"
                  type="button"
                  onClick={() => setFilterOnlySaved(!filterOnlySaved)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    filterOnlySaved
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${filterOnlySaved ? 'fill-white text-white' : 'text-amber-500'}`} />
                  <span>Saved Profiles</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${filterOnlySaved ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {savedProfileIds.length}
                  </span>
                </button>
              </div>

              {/* Recency Selector Chips */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                <button
                  id="btn-recency-all-hub"
                  type="button"
                  onClick={() => setFilterActivityRecency('All')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    filterActivityRecency === 'All' ? 'bg-slate-900 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  id="btn-recency-24h-hub"
                  type="button"
                  onClick={() => setFilterActivityRecency('active24h')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    filterActivityRecency === 'active24h' ? 'bg-orange-500 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active 24h
                </button>
                <button
                  id="btn-recency-active-now-hub"
                  type="button"
                  onClick={() => setFilterActivityRecency('currentlyActive')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    filterActivityRecency === 'currentlyActive' ? 'bg-emerald-500 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active Now
                </button>
              </div>
            </div>

            {/* Expandable Advanced Refinement (Age, Play Style, Language, Hobbies) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  id="btn-toggle-advanced-filters-hub"
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-xs font-bold text-slate-600 hover:text-rose-700 transition flex items-center gap-1 cursor-pointer self-start"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showAdvancedFilters ? 'Hide Advanced Match Keys ▲' : 'Show Advanced Match Keys (Age, Style, Language) ▼'}</span>
                </button>

                {/* Distance shortcut presets */}
                <div className="flex flex-wrap items-center gap-1 text-[10px]" id="filter-distance-presets-hub">
                  <span className="text-slate-400 font-semibold">Radius Presets:</span>
                  {[1.0, 3.0, 10.0, 25.0, 1000.0].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setMaxDistanceKm(dist)}
                      className={`px-2 py-0.5 rounded-lg font-mono cursor-pointer transition ${
                        maxDistanceKm === dist 
                          ? 'bg-rose-700 text-white font-bold' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {dist >= 1000 ? 'Any' : `${dist}km`}
                    </button>
                  ))}
                </div>
              </div>

              {showAdvancedFilters && (
                <div id="advanced-filters-grid-hub" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-100 animate-fadeIn">
                  {/* Play style */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Play Style
                    </label>
                    <select
                      value={filterPlayStyle}
                      onChange={(e) => setFilterPlayStyle(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100"
                    >
                      <option value="All">All styles</option>
                      <option value="Cooperative & Social">Cooperative & Shared</option>
                      <option value="Energetic & Sporty">Energetic & Outdoor</option>
                      <option value="Quiet & Creative">Quiet & Creative</option>
                      <option value="Inquisitive & Educational">Educational & Puzzles</option>
                    </select>
                  </div>

                  {/* Age bracket */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Age Bracket
                    </label>
                    <select
                      value={filterAgeGroup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilterAgeGroup(val);
                        if (val === 'Infant') {
                          setFilterMinAge(0);
                          setFilterMaxAge(1);
                        } else if (val === 'Toddler') {
                          setFilterMinAge(1);
                          setFilterMaxAge(2);
                        } else if (val === 'Preschool') {
                          setFilterMinAge(3);
                          setFilterMaxAge(4);
                        } else if (val === 'Kindergarten') {
                          setFilterMinAge(5);
                          setFilterMaxAge(6);
                        } else if (val === 'SchoolAge') {
                          setFilterMinAge(7);
                          setFilterMaxAge(15);
                        } else {
                          setFilterMinAge(0);
                          setFilterMaxAge(15);
                        }
                      }}
                      className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100"
                    >
                      <option value="All">All primary ages</option>
                      <option value="Infant">Infant / Baby (0–1 yr)</option>
                      <option value="Toddler">Toddler (1-2 yrs)</option>
                      <option value="Preschool">Preschool (3-4 yrs)</option>
                      <option value="Kindergarten">Kindergarten (5-6 yrs)</option>
                      <option value="SchoolAge">School-Age (7+ yrs)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Language Spoken
                    </label>
                    <select
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100 truncate"
                    >
                      <option value="All">All Languages</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi / हिन्दी</option>
                      <option value="Kannada">Kannada / ಕನ್ನಡ</option>
                      <option value="Tamil">Tamil / தமிழ்</option>
                      <option value="Telugu">Telugu / తెలుగు</option>
                      <option value="Malayalam">Malayalam / മലയാളം</option>
                      <option value="Marathi">Marathi / मराठी</option>
                      <option value="Bengali">Bengali / বাংলা</option>
                      <option value="Gujarati">Gujarati / ગુજરાતી</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Primary Carousel Exploration Views (like how Events are displayed) */}
      {filteredPlaymates.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 border border-dashed border-rose-200 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl">
            🧸
          </div>
          <h4 className="text-base font-black text-slate-900 font-serif">
            No Playmates Found Matching Active Filters
          </h4>
          <p className="text-xs text-slate-500 max-w-md">
            Try expanding your search distance radius or clearing selected filters to discover more families in your neighborhood.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        /* Carousel Rails View (BookMyShow / Events style) */
        <div id="playmates-carousel-container" className="space-y-10 sm:space-y-12">
          {/* ⚡ Spontaneous Meetups Nearby (< 0.5 km) */}
          {immediateNearbyPlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-spontaneous-meetups"
              title="⚡ Spontaneous Meetups Nearby (<0.5 km)"
              subtitle="Families and verified playmates living within 500 meters of you right now — ideal for spontaneous park playdates!"
              playmates={immediateNearbyPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              badgeType="NEARBY"
            />
          )}

          {/* If user searched or filtered, display the Active Filtered Results rail */}
          {hasActiveFilters && (
            <PlaymateCarouselSection
              id="carousel-filtered-results"
              title="Search & Filter Matches"
              subtitle={`Showing ${filteredPlaymates.length} playmates tailored to your search criteria`}
              playmates={filteredPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              badgeType="TOP MATCH"
            />
          )}

          {/* 1. Nearest Playmates & Neighbors */}
          {nearbyPlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-nearby-playmates"
              title="Nearest Playmates & Neighbors"
              subtitle="Families and kids living closest to your location"
              playmates={nearbyPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              badgeType="NEARBY"
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}

          {/* 2. Top Compatible Matches */}
          {compatiblePlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-compatible-matches"
              title="Highly Compatible Playmates"
              subtitle="Kids with matching age brackets, play styles, and shared social interests"
              playmates={compatiblePlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              badgeType="TOP MATCH"
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}

          {/* 3. Verified & Trusted Families */}
          {verifiedPlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-verified-families"
              title="Verified & Safe Family Profiles"
              subtitle="Families with completed Aadhaar or DigiLocker government trust checks"
              playmates={verifiedPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              badgeType="VERIFIED"
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}

          {/* 4. Toddler & Early Years Discovery (0 - 4 yrs) */}
          {toddlerPlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-toddler-playmates"
              title="Toddlers & Early Years Playmates"
              subtitle="Gentle sensory play, park walks & infant-toddler bonding groups"
              playmates={toddlerPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}

          {/* 5. School-Age Buddies (5+ yrs) */}
          {schoolAgePlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-school-playmates"
              title="School-Age Buddies & Peers"
              subtitle="Active primary and elementary school kids ready for after-school fun"
              playmates={schoolAgePlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}

          {/* 6. Creative & Sporty Hobbies */}
          {hobbyPlaymates.length > 0 && (
            <PlaymateCarouselSection
              id="carousel-hobby-playmates"
              title="Sports, STEM & Creative Hobbies"
              subtitle="Soccer, Lego builders, chess champions, arts & young explorers"
              playmates={hobbyPlaymates}
              onSelectPlaymate={onSelectPlaymate}
              onQuickChat={onQuickChat}
              connectedIds={connectedIds}
              savedProfileIds={savedProfileIds}
              onToggleSave={onToggleSave}
              userLat={userLat}
              userLng={userLng}
              isAadhaarVerified={!!userProfile?.aadhaarVerified}
              currentUserProfile={userProfile}
            />
          )}
        </div>
      )}
    </div>
  );
}
