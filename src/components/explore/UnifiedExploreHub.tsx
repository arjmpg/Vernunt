import React, { useState } from 'react';
import { 
  Compass, Users, ShoppingBag, BookOpen, Search, 
  Sparkles, Star, MapPin, ArrowRight, ShieldCheck, Filter
} from 'lucide-react';
import type { ChildProfile, SpecialistProfile, Booking } from '../../types.ts';
import { INITIAL_STORE_PRODUCTS } from '../../data/storeProducts.ts';
import SpecialistsTab from '../SpecialistsTab.tsx';
import { VernuntStore } from '../store/VernuntStore.tsx';
import { KnowledgeHub } from '../KnowledgeHub.tsx';

export interface UnifiedExploreHubProps {
  currentProfile: ChildProfile | null;
  initialSubTab?: 'all' | 'specialists' | 'store' | 'guides';
  specialistsList: SpecialistProfile[];
  bookingsList: Booking[];
  onAddBooking: (booking: Booking) => void;
  onUpdateRole: (role: any) => void;
  onAddNewSpecialist: (specialist: SpecialistProfile) => void;
  globalCommissionRate: number;
  onUpdateUserProfile?: (profile: ChildProfile) => void;
  onUpdateSpecialist?: (specialist: SpecialistProfile) => void;
  onNavigateToTab: (tabId: string) => void;
  onContactSupport?: () => void;
  onOpenGoogleMerchantModal?: () => void;
}

export const UnifiedExploreHub: React.FC<UnifiedExploreHubProps> = ({
  currentProfile,
  initialSubTab = 'all',
  specialistsList,
  bookingsList,
  onAddBooking,
  onUpdateRole,
  onAddNewSpecialist,
  globalCommissionRate,
  onUpdateUserProfile,
  onUpdateSpecialist,
  onNavigateToTab,
  onContactSupport,
  onOpenGoogleMerchantModal
}) => {
  const [subTab, setSubTab] = useState<'all' | 'store' | 'guides'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Top filtered products for "All" tab preview
  const previewProducts = React.useMemo(() => {
    let list = INITIAL_STORE_PRODUCTS || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 4);
  }, [searchQuery]);

  return (
    <div id="unified-explore-hub" className="w-full space-y-6 animate-fade-in pb-12">
      
      {/* Sub-Category Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSubTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              subTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>All Discovery</span>
          </button>


          <button
            type="button"
            onClick={() => setSubTab('store')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              subTab === 'store'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Vernunt Store</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              subTab === 'store' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
            }`}>
              Shop
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('guides')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              subTab === 'guides'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Parent Guides</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden md:block">
          Explore verified healthcare, Montessori learning essentials &amp; expert guides
        </div>
      </div>

      {/* SUB-VIEW 1: All Discovery (Combined Overview) */}
      {subTab === 'all' && (
        <div className="space-y-6">
          
          {/* Quick Search across Explore */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pediatricians, clinic specialties, Montessori toys, books..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>



          {/* Section: Vernunt Store Highlights */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Montessori &amp; Sensory Play Gear
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified wooden toys, cognitive puzzles, and child-safe essentials
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('store')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                <span>Browse Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {previewProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSubTab('store')}
                  className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-300 p-3 transition-all duration-200 hover:shadow-2xs cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-28 object-cover rounded-lg border border-slate-100"
                    />
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition mt-2 line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Age: {prod.ageRange}</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">₹{prod.price}</span>
                    <span className="text-[10px] font-bold text-indigo-600">Buy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Parent Guides Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                1,000+ Doctor-Reviewed Child Growth Guides
              </h3>
              <p className="text-xs text-slate-500">
                Evidence-based answers on nutrition, teething, sleep routines, speech milestones &amp; behavior.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('guides')}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Read Guides
            </button>
          </div>

        </div>
      )}

      {/* SUB-VIEW 3: Full Vernunt Store */}
      {subTab === 'store' && (
        <VernuntStore
          userProfile={currentProfile}
          onNavigateToTab={(t) => {
            if (t === 'radar') onNavigateToTab('radar');
            else if (t === 'events') onNavigateToTab('events');
            else onNavigateToTab(t);
          }}
          onContactSupport={onContactSupport}
          onOpenGoogleMerchantModal={onOpenGoogleMerchantModal}
        />
      )}

      {/* SUB-VIEW 4: Knowledge Guides Hub */}
      {subTab === 'guides' && (
        <KnowledgeHub
          onNavigateToRadar={() => onNavigateToTab('radar')}
        />
      )}

    </div>
  );
};

export default UnifiedExploreHub;
