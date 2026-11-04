import React, { useState } from 'react';
import { 
  BangalorePark, ParkVisitBroadcast, ChildProfile 
} from '../../types.ts';
import { 
  getParkGallery, getParkEquipment, getParkAccessibilityFeatures 
} from '../../utils/parkEnrichment.ts';
import { 
  X, MapPin, Navigation, Clock, ShieldCheck, ExternalLink, 
  Share2, Check, CheckCircle2, Heart, Users, Sparkles, 
  Baby, Footprints, Trees, ChevronLeft, ChevronRight, 
  Layers, RotateCcw, ArrowUpDown, Filter, Eye, Maximize2,
  Calendar, Info
} from 'lucide-react';

interface ParkDetailModalProps {
  park: BangalorePark;
  onClose: () => void;
  userProfile: ChildProfile | null;
  parkVisits: ParkVisitBroadcast[];
  checkedInParkId: string | null;
  checkingInParkId: string | null;
  liveCount?: number;
  onCheckin: (park: BangalorePark) => void;
  onCheckout: (park: BangalorePark) => void;
  onBroadcastVisit: (park: BangalorePark) => void;
  onInspectVisits: (park: BangalorePark) => void;
  onRequireAuth?: () => void;
}

export default function ParkDetailModal({
  park,
  onClose,
  userProfile,
  parkVisits,
  checkedInParkId,
  checkingInParkId,
  liveCount,
  onCheckin,
  onCheckout,
  onBroadcastVisit,
  onInspectVisits,
  onRequireAuth
}: ParkDetailModalProps) {
  // Navigation Tabs inside Detail View
  const [activeTab, setActiveTab] = useState<'gallery_overview' | 'equipment' | 'accessibility' | 'playdates'>('gallery_overview');
  
  // Gallery state
  const gallery = getParkGallery(park);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Equipment category filter
  const equipment = getParkEquipment(park);
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'swings' | 'slides' | 'sandbox' | 'climbing' | 'sensory' | 'sports'>('all');

  // Accessibility data
  const { features: accessibilityFeatures, rating: accRating, summary: accSummary } = getParkAccessibilityFeatures(park);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vernunt_favorite_parks_v1');
      const list = saved ? JSON.parse(saved) : [];
      return list.includes(park.id);
    } catch {
      return false;
    }
  });

  // Copied share alert
  const [copiedShare, setCopiedShare] = useState(false);

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem('vernunt_favorite_parks_v1');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(park.id)) {
        list = list.filter(id => id !== park.id);
        setIsFavorite(false);
      } else {
        list.push(park.id);
        setIsFavorite(true);
      }
      localStorage.setItem('vernunt_favorite_parks_v1', JSON.stringify(list));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleShare = () => {
    const text = `🌳 Check out ${park.name} (${park.locality}, Bangalore) on Vernunt! It features safe toddler swings, slides, sandpit, and stroller-friendly paved tracks. Let's plan a playdate here!`;
    if (navigator.share) {
      navigator.share({
        title: `${park.name} - Bangalore Kids Park`,
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text}\n${window.location.href}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const filteredEquipment = equipmentFilter === 'all' 
    ? equipment 
    : equipment.filter(eq => eq.category === equipmentFilter);

  const currentPhoto = gallery[activePhotoIndex] || gallery[0];
  const activeVisits = parkVisits.filter(v => v.parkId === park.id);
  const effectiveLiveCount = liveCount ?? park.live_visitor_count ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {park.locality} • {park.zone} Bangalore
              </span>
              {park.bbmpWard && (
                <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                  BBMP: {park.bbmpWard}
                </span>
              )}
              {effectiveLiveCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <span>🟢 {effectiveLiveCount} Live</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-serif leading-tight mt-1 text-white">
              {park.name}
            </h2>
            {park.kannadaName && (
              <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                {park.kannadaName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleFavorite}
              title={isFavorite ? 'Remove from saved parks' : 'Save park to favorites'}
              className={`p-2 rounded-full transition cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-500 text-white shadow-sm' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current text-white' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              title="Share Park"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative"
            >
              <Share2 className="w-4.5 h-4.5" />
              {copiedShare && (
                <span className="absolute -bottom-7 right-0 bg-slate-900 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 sm:px-5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gallery_overview')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gallery_overview'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Photo Gallery &amp; Info</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {gallery.length} Photos
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'equipment'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-emerald-600" />
            <span>Playground Equipment</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {equipment.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accessibility')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'accessibility'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accessibility Features</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              accRating === 'High' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {accRating}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playdates')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'playdates'
                ? 'border-emerald-600 text-emerald-900 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Playdates &amp; Visitors</span>
            {activeVisits.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                {activeVisits.length} Today
              </span>
            )}
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: PHOTO GALLERY & OVERVIEW */}
          {activeTab === 'gallery_overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Photo Gallery Showcase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>Park Photo Gallery</span>
                    <span className="text-slate-400 font-mono font-medium">({gallery.length} photos)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Fullscreen</span>
                  </button>
                </div>

                {/* Hero Photo Carousel View */}
                <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm group">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Tag badge on image */}
                  {currentPhoto.tag && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-emerald-600/90 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{currentPhoto.tag}</span>
                      </span>
                    </div>
                  )}

                  {/* Photo Index Counter */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {activePhotoIndex + 1} / {gallery.length}
                  </div>

                  {/* Left / Right Carousel Controls */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition cursor-pointer backdrop-blur-xs"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition cursor-pointer backdrop-blur-xs"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Caption on image bottom */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs sm:text-sm font-bold drop-shadow-md">
                      {currentPhoto.caption}
                    </p>
                  </div>
                </div>

                {/* Thumbnail Strip */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                  {gallery.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-102'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 truncate text-center">
                        {photo.tag || `Photo ${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Park Quick Summary & Key Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Timings</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">{park.timings}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Entry Fee</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 truncate">{park.entryFee}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Park Area</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Trees className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {park.areaAcres ? `${park.areaAcres} Acres` : 'Neighborhood Park'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Accessibility</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-blue-900 truncate">{accRating} Accessible</span>
                  </div>
                </div>
              </div>

              {/* Location & Address Bar */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        Address &amp; Landmark
                      </h4>
                      <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                        {park.address}
                        {park.pincode ? ` - ${park.pincode}` : ''}
                      </p>
                    </div>
                  </div>

                  <a
                    href={park.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${park.name} ${park.locality} Bangalore`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Highlights & Parent Play Tip */}
              {park.playTip && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Vernunt Parent Play Tip</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {park.playTip.replace(/^Vernunt Play Tip:\s*/i, '')}
                  </p>
                </div>
              )}

              {/* Key Features & Facilities Pills */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Verified Park Facilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {park.facilities.map((fac, idx) => (
                    <span 
                      key={idx}
                      className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{fac}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYGROUND EQUIPMENT (SLIDES, SWINGS, SANDBOX, CLIMBERS) */}
          {activeTab === 'equipment' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Available Playground Equipment ({equipment.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspected play structures, swing sets, sandpits, and child safety flooring.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'All Equipment' },
                    { id: 'swings', label: 'Swings' },
                    { id: 'slides', label: 'Slides' },
                    { id: 'sandbox', label: 'Sandbox' },
                    { id: 'climbing', label: 'Climbers' },
                    { id: 'sensory', label: 'Sensory Panels' },
                    { id: 'sports', label: 'Sports & Lawns' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setEquipmentFilter(btn.id as any)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        equipmentFilter === btn.id
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredEquipment.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 transition shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {item.category === 'swings' && '🪑'}
                          {item.category === 'slides' && '🛝'}
                          {item.category === 'sandbox' && '🏖️'}
                          {item.category === 'climbing' && '🧗'}
                          {item.category === 'spinners' && '🎠'}
                          {item.category === 'sensory' && '🧩'}
                          {item.category === 'sports' && '⚽'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                            {item.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Category: {item.category}
                          </span>
                        </div>
                      </div>

                      {item.status && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          ✓ {item.status}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] gap-2 flex-wrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Baby className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Age: <strong>{item.ageRange}</strong></span>
                      </div>
                      <div className="text-[10.5px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        🛡️ {item.safetySurface}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Safety & BBMP Maintenance Notice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  Equipment is maintained by the Bangalore City Corporation (BBMP) and neighborhood Residents Welfare Associations (RWA). If you notice any damaged swings or worn safety tiles, report it to the neighborhood parent community to alert authorities.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ACCESSIBILITY FEATURES */}
          {activeTab === 'accessibility' && (
            <div className="space-y-5 animate-fade-in">
              {/* Overall Score Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-400/20 text-blue-200 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Inclusive Bangalore Playgrounds
                    </span>
                    <span className="text-xs font-black text-amber-300">
                      ★ {accRating} Accessibility Rating
                    </span>
                  </div>
                  <h4 className="text-base font-black">
                    Barrier-Free &amp; Stroller Access Assessment
                  </h4>
                  <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                    {accSummary}
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-3xl shrink-0 backdrop-blur-xs">
                  ♿
                </div>
              </div>

              {/* Accessibility Feature List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Verified Accessibility Amenities
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessibilityFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        feat.available 
                          ? 'bg-white border-slate-200' 
                          : 'bg-slate-50 border-slate-200/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            feat.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {feat.available ? '✓' : '—'}
                          </div>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                            {feat.title}
                          </h5>
                        </div>

                        {feat.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            feat.available 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {feat.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Parent Accessibility Tips */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-950">
                <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tips for Stroller &amp; Special Needs Visits</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
                  <li><strong>Stroller Access:</strong> Use the primary gate ramp rather than side turnstiles for double strollers.</li>
                  <li><strong>Sensory Respite:</strong> If your child is sensitive to playground noise, the shaded peripheral walking tracks offer quiet nature spots for calm decompression.</li>
                  <li><strong>Weather Notice:</strong> Pathways are paved and well-drained during Bangalore monsoon showers, but check sandpits for dampness after heavy rain.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: PLAYDATES & COMMUNITY VISITS */}
          {activeTab === 'playdates' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Kids &amp; Families Visiting {park.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect with neighborhood verified parents for outdoor playtime.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!userProfile && onRequireAuth) {
                      onRequireAuth();
                      return;
                    }
                    onBroadcastVisit(park);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Footprints className="w-3.5 h-3.5 text-amber-300" />
                  <span>I&apos;m Going! Broadcast</span>
                </button>
              </div>

              {activeVisits.length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-xl mx-auto">
                    👶
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 font-serif">
                    No active playdate announcements for today yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Be the first parent to announce a visit to {park.name}! Verified parents in {park.locality} will see your announcement.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userProfile && onRequireAuth) {
                        onRequireAuth();
                        return;
                      }
                      onBroadcastVisit(park);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span>Broadcast Playdate Announcement</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeVisits.map((visit) => (
                    <div 
                      key={visit.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={visit.parentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}
                            alt={visit.parentName}
                            className="w-9 h-9 rounded-full object-cover border border-emerald-300"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {visit.childName} ({visit.childAge} yrs)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Parent: {visit.parentName}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded-lg">
                          ⏰ {visit.timeSlot}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                        🎯 {visit.plannedActivity}
                      </p>

                      {visit.notes && (
                        <p className="text-xs text-slate-500 italic">
                          &ldquo;{visit.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onInspectVisits(park)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Full Schedule by Date &amp; Time</span>
              </button>
            </div>
          )}

        </div>

        {/* MODAL ACTION BAR FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Check-in / Checkout button */}
            {checkedInParkId === park.id ? (
              <button
                type="button"
                onClick={() => onCheckout(park)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Checked In • Tap to Check Out</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={checkingInParkId === park.id}
                onClick={() => onCheckin(park)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {checkingInParkId === park.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Boundary...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <span>Check-in at Park</span>
                  </>
                )}
              </button>
            )}

            {/* Broadcast My Visit */}
            <button
              type="button"
              onClick={() => {
                if (!userProfile && onRequireAuth) {
                  onRequireAuth();
                  return;
                }
                onBroadcastVisit(park);
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Footprints className="w-4 h-4 text-amber-300" />
              <span>I&apos;m Going!</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Get Directions Link */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&destination_place_id=&travelmode=walking&dir_action=navigate`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-white" />
              <span>Get Directions</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-300"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* LIGHTBOX FULLSCREEN PREVIEW */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white p-2">
            <span className="text-sm font-bold truncate max-w-md">
              {park.name} - {currentPhoto.caption}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs">
                {activePhotoIndex + 1} / {gallery.length}
              </span>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 flex items-center justify-center p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="text-center text-slate-300 text-xs p-2">
            {currentPhoto.caption} • Tag: {currentPhoto.tag || 'General View'}
          </div>
        </div>
      )}
    </div>
  );
}
