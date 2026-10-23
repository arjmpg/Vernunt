import React from 'react';
import { 
  Navigation, Trees, Sparkles, ShoppingBag, Users, Calendar, 
  MapPin, ShieldCheck, ArrowRight, Heart, Star, ChevronRight,
  BookOpen, Plus, Clock, MessageSquare, Award
} from 'lucide-react';
import type { ChildProfile, CommunityEvent } from '../../types.ts';
import { BANGALORE_PARKS } from '../../data/bangaloreParks.ts';
import { INITIAL_STORE_PRODUCTS } from '../../data/storeProducts.ts';

export interface HomeDashboardFeedProps {
  userProfile: ChildProfile;
  isGuest?: boolean;
  onGoogleSignIn?: () => void;
  onStartSignUp?: () => void;
  playmates: ChildProfile[];
  events: CommunityEvent[];
  connectedIds: string[];
  savedProfileIds: string[];
  onNavigateTab: (tabId: string, subCategory?: string) => void;
  onSelectPlaymate: (playmate: ChildProfile) => void;
  onQuickChat: (playmate: ChildProfile) => void;
  onToggleSaveProfile: (profileId: string) => void;
  onOpenParksSubcategory: () => void;
  onOpenStoreProduct?: (productId: string) => void;
  onOpenEventDetail?: (eventId: string) => void;
}

export const HomeDashboardFeed: React.FC<HomeDashboardFeedProps> = ({
  userProfile,
  isGuest = false,
  onGoogleSignIn,
  onStartSignUp,
  playmates,
  events,
  connectedIds,
  savedProfileIds,
  onNavigateTab,
  onSelectPlaymate,
  onQuickChat,
  onToggleSaveProfile,
  onOpenParksSubcategory,
  onOpenEventDetail
}) => {
  const isGuestMode = isGuest || userProfile.id === 'guest-explorer' || !userProfile.email;

  // Filter top 4 playmates near child's age
  const recommendedPlaymates = React.useMemo(() => {
    return playmates
      .filter(p => p.id !== userProfile.id)
      .slice(0, 6);
  }, [playmates, userProfile.id]);

  // Featured Bangalore Parks
  const featuredParks = React.useMemo(() => {
    return (BANGALORE_PARKS || []).slice(0, 4);
  }, []);

  // Featured upcoming events
  const featuredEvents = React.useMemo(() => {
    return (events || []).slice(0, 3);
  }, [events]);

  // Featured toys & products
  const featuredProducts = React.useMemo(() => {
    return (INITIAL_STORE_PRODUCTS || []).slice(0, 4);
  }, []);

  return (
    <div id="home-dashboard-feed" className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
      
      {/* Guest Callout Banner */}
      {isGuestMode && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6D3FE8]">
              <Sparkles className="w-4 h-4 text-[#6D3FE8]" />
              <span>Vernunt · Play Time Connect Bengaluru</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Join 5,000+ verified parents in Bengaluru to schedule playdates, discover neighborhood parks, and connect securely.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {onGoogleSignIn && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Sign In
              </button>
            )}
            {onStartSignUp && (
              <button
                type="button"
                onClick={onStartSignUp}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#6D3FE8] hover:bg-[#5930C7] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Join Free
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Welcoming Hero Banner (Clean Minimal Pure White) */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Play Time Connect · Bengaluru</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isGuestMode ? 'Welcome to Vernunt 👋' : `Hello, ${userProfile.parentName || 'Parent'} 👋`}
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              {isGuestMode 
                ? 'Discover verified play partners for your children, explore 140+ neighborhood parks across Bangalore, and discover weekend workshops.'
                : <>Discover verified play partners for <span className="font-semibold text-slate-800">{userProfile.childName}</span> ({userProfile.childAge} yrs), explore 140+ neighborhood parks, and discover weekend family workshops.</>
              }
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center min-w-[90px]">
              <span className="block text-lg font-black text-indigo-600">{playmates.length}</span>
              <span className="text-[11px] font-medium text-slate-500">Playmates</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center min-w-[90px]">
              <span className="block text-lg font-black text-emerald-600">140+</span>
              <span className="text-[11px] font-medium text-slate-500">Parks &amp; Play</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center min-w-[90px]">
              <span className="block text-lg font-black text-amber-600">{events.length}</span>
              <span className="text-[11px] font-medium text-slate-500">Events</span>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-5 mt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigateTab('radar', 'playmates')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700">Find Playmates</p>
              <p className="text-[10px] text-slate-500 truncate">Nearby kids radar</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenParksSubcategory}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Trees className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">Bangalore Parks</p>
              <p className="text-[10px] text-slate-500 truncate">140+ playgrounds</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('events')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-700">Family Events</p>
              <p className="text-[10px] text-slate-500 truncate">Classes &amp; workshops</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('explore', 'store')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 transition text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700">Kids Store</p>
              <p className="text-[10px] text-slate-500 truncate">Montessori &amp; STEM</p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Playmates Discovery Section (Core Play Time Connect) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Verified Playmates Near You
            </h2>
            <p className="text-xs text-slate-500">
              Connect with Aadhaar-verified parents and match children by age &amp; hobbies
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('radar', 'playmates')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            <span>View All ({playmates.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recommendedPlaymates.map((p) => {
            const isSaved = savedProfileIds.includes(p.id);
            const isConnected = connectedIds.includes(p.id);

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 transition-all duration-200 hover:shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={p.photoUrl || `https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=160&q=80`} 
                          alt={p.childName} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Verified Parent">
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                            {p.childName}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-500">({p.childAge}y)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{p.neighbourhood || p.location?.address || 'Bengaluru'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSaveProfile(p.id)}
                      className={`p-1.5 rounded-full border transition cursor-pointer ${
                        isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500'
                      }`}
                      title="Save Profile"
                    >
                      <Heart className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Interests tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(p.interests || []).slice(0, 3).map((interest, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {interest}
                      </span>
                    ))}
                    {(p.interests?.length || 0) > 3 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500">
                        +{(p.interests?.length || 0) - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectPlaymate(p)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition text-center cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickChat(p)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isConnected 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isConnected ? 'Chat' : 'Connect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Bangalore Parks & Playgrounds Section (Integrated Subcategory of Playtime) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Bangalore Family Parks &amp; Play
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                140+ Directory
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Verified neighborhood parks with kid-safe play areas, sandpits, swings &amp; live rosters
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenParksSubcategory}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
          >
            <span>Explore All Parks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredParks.map((park) => (
            <div
              key={park.id}
              onClick={onOpenParksSubcategory}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 transition-all duration-200 hover:shadow-xs flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                    {park.neighborhood}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Free Entry</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                  {park.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {park.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(park.amenities || []).slice(0, 2).map((amenity: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>View Live Playmates</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Upcoming Weekend Events & Fun Classes */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Weekend Events &amp; Workshops
            </h2>
            <p className="text-xs text-slate-500">
              Sports camps, robotics, creative arts, and pottery sessions for kids
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('events')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
          >
            <span>See All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {featuredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onOpenEventDetail ? onOpenEventDetail(evt.id) : onNavigateTab('events')}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-300 p-4 transition-all duration-200 hover:shadow-xs flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100">
                    {evt.category || 'Workshop'}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {evt.price ? `₹${evt.price}` : 'Free'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition line-clamp-1">
                  {evt.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {evt.description}
                </p>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.date || 'Upcoming Weekend'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{evt.location?.address || 'Bengaluru'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Book Pass</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Kids Store & Learning Gear (Under Explore) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Curated Montessori &amp; STEM Toys
            </h2>
            <p className="text-xs text-slate-500">
              Verified non-toxic play essentials and cognitive development kits
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('explore', 'store')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
          >
            <span>Browse Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigateTab('explore', 'store')}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 p-3 sm:p-3.5 transition-all duration-200 hover:shadow-xs flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <img 
                  src={prod.image} 
                  alt={prod.name} 
                  className="w-full h-32 object-cover rounded-xl border border-slate-100 group-hover:scale-102 transition"
                />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-700 transition mt-2.5 line-clamp-1">
                  {prod.name}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  Age: {prod.ageRange}
                </p>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-xs sm:text-sm text-slate-900">₹{prod.price}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                  Shop
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomeDashboardFeed;
