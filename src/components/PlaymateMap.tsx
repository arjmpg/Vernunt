import React, { useState, useMemo } from 'react';
import { ChildProfile, CommunityEvent } from '../types.ts';
import { 
  MapPin, Compass, Star, Navigation, Sparkles, Calendar, Clock, 
  Users, X, Check, ExternalLink, BookOpen, Trophy, 
  Palette, Layers, Share2, Zap, RotateCcw, 
  Maximize2, Minimize2, Eye, EyeOff, Filter, Activity, Flame,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { getHaversineDistance } from '../utils/distance.ts';

interface PlaymateMapProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  onSelectPlaymate: (profile: ChildProfile) => void;
  selectedPlaymateId?: string;
  maxDistanceKm: number;
  events?: CommunityEvent[];
  onToggleJoinEvent?: (eventId: string, join: boolean) => void;
  onNavigateToEventsTab?: (category?: string, eventId?: string) => void;
}

// Unified map item representation for clustering
export type MapItemType = 'event' | 'playmate';

export interface MapItem {
  id: string;
  type: MapItemType;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  title: string;
  category?: string;
  date?: string;
  time?: string;
  attendeesCount?: number;
  ticketPrice?: number;
  photoUrl?: string;
  iconEmoji?: string;
  joined?: boolean;
  eventData?: CommunityEvent;
  playmateData?: ChildProfile;
}

export interface MapCluster {
  id: string;
  x: number;
  y: number;
  items: MapItem[];
  eventItems: MapItem[];
  playmateItems: MapItem[];
  hasConcurrentEvents: boolean;
  concurrentTimeSlot?: string;
  dominantCategory?: string;
}

export default function PlaymateMap({ 
  playmates, 
  userProfile, 
  onSelectPlaymate, 
  selectedPlaymateId, 
  maxDistanceKm,
  events = [],
  onToggleJoinEvent,
  onNavigateToEventsTab
}: PlaymateMapProps) {
  const ourNeighborhood = userProfile?.location?.address || 'Mumbai, Maharashtra, India';
  const centerLat = userProfile?.location?.lat || 19.0760;
  const centerLng = userProfile?.location?.lng || 72.8777;

  // Overlay state: Toggle showing community events & classes
  const [showEventsOverlay, setShowEventsOverlay] = useState<boolean>(true);
  const [showPlaymatesOverlay, setShowPlaymatesOverlay] = useState<boolean>(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  
  // Clustering Configuration
  const [isClusteringEnabled, setIsClusteringEnabled] = useState<boolean>(true);
  const [clusterDensityRadius, setClusterDensityRadius] = useState<'tight' | 'balanced' | 'wide'>('balanced');
  const [onlyConcurrentFilter, setOnlyConcurrentFilter] = useState<boolean>(false);

  // Map Zoom State (0.75x to 2.0x, default 1.0x)
  const [mapZoom, setMapZoom] = useState<number>(1.0);

  const handleMapZoomIn = () => {
    setMapZoom((prev) => Math.min(2.0, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleMapZoomOut = () => {
    setMapZoom((prev) => Math.max(0.75, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleMapResetZoom = () => {
    setMapZoom(1.0);
  };

  // Spiderfy / Expanded Cluster State
  const [spiderfiedClusterId, setSpiderfiedClusterId] = useState<string | null>(null);
  const [inspectedCluster, setInspectedCluster] = useState<MapCluster | null>(null);
  
  // In-map inspection details modal for a single event
  const [inspectedEvent, setInspectedEvent] = useState<CommunityEvent | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Radius values in percentage for clustering
  const clusterRadiusValue = useMemo(() => {
    switch (clusterDensityRadius) {
      case 'tight': return 12;
      case 'wide': return 25;
      case 'balanced':
      default: return 18;
    }
  }, [clusterDensityRadius]);

  // Predefined anchor layout positions to guarantee balanced aesthetic distribution
  const playmateAnchorPositions = [
    { x: 76, y: 24 }, // Liam
    { x: 26, y: 68 }, // Chloe
    { x: 20, y: 18 }, // Leo
    { x: 78, y: 78 }, // Emma
    { x: 84, y: 38 },
    { x: 38, y: 82 },
  ];

  const eventAnchorPositions = [
    { x: 44, y: 22 }, // Event 1 (Art) - Central Park
    { x: 80, y: 48 }, // Event 2 (Soccer) - Westside Grass
    { x: 16, y: 74 }, // Event 3 (Botanical) - Nature Sanctuary
    { x: 60, y: 16 }, // Event 4 (Lego) - Community Hall
    { x: 62, y: 82 }, // Event 5 (Math) - Symphony Prep
    { x: 14, y: 32 }, // Event 6 (Sanskrit) - Heritage Studio
    { x: 60, y: 56 }, // Event 7 (Robotics) - TechHub
    { x: 32, y: 38 }, // Event 8 (Puppet) - Riverside Park
    { x: 46, y: 64 }, // Event 9 (Pottery) - Clay Arts
    { x: 46, y: 25 }, // Event 10 (Toddler Bubble - Concurrent with Art)
    { x: 82, y: 45 }, // Event 11 (Youth Sprint - Concurrent with Soccer)
    { x: 62, y: 18 }, // Event 12 (Duplo Free-play - Concurrent with Lego)
  ];

  // Filter events by active category
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (selectedCategoryFilter === 'All') return true;
      if (selectedCategoryFilter === 'Class' && (evt.category === 'Class' || evt.title.toLowerCase().includes('class') || evt.title.toLowerCase().includes('camp'))) return true;
      if (selectedCategoryFilter === 'Activity' && (evt.category === 'Activity' || evt.category === 'Sports & Outdoors')) return true;
      if (selectedCategoryFilter === 'Competition' && evt.category === 'Competition') return true;
      if (selectedCategoryFilter === 'Event' && (evt.category === 'Event' || evt.category === 'Arts & Crafts')) return true;
      return evt.category === selectedCategoryFilter;
    });
  }, [events, selectedCategoryFilter]);

  // Convert raw entities into normalized MapItem objects with percentage coordinates
  const allMapItems = useMemo<MapItem[]>(() => {
    const items: MapItem[] = [];

    // 1. Playmates
    if (showPlaymatesOverlay) {
      playmates.forEach((p, idx) => {
        let x = 50;
        let y = 50;
        if (p.location?.lat && p.location?.lng) {
          // Project relative to center
          const deltaLat = p.location.lat - centerLat;
          const deltaLng = p.location.lng - centerLng;
          x = Math.max(12, Math.min(88, 50 + deltaLng * 1200));
          y = Math.max(12, Math.min(88, 50 - deltaLat * 1200));
        } else {
          const anchor = playmateAnchorPositions[idx % playmateAnchorPositions.length];
          x = anchor.x;
          y = anchor.y;
        }

        items.push({
          id: `playmate-${p.id}`,
          type: 'playmate',
          x,
          y,
          title: p.childName,
          category: 'Playmate',
          photoUrl: p.photoUrl,
          playmateData: p
        });
      });
    }

    // 2. Community Events & Classes
    if (showEventsOverlay) {
      filteredEvents.forEach((evt, idx) => {
        let x = 50;
        let y = 50;
        if (evt.lat && evt.lng) {
          const deltaLat = evt.lat - centerLat;
          const deltaLng = evt.lng - centerLng;
          x = Math.max(12, Math.min(88, 50 + deltaLng * 1200));
          y = Math.max(12, Math.min(88, 50 - deltaLat * 1200));
        } else {
          const anchor = eventAnchorPositions[idx % eventAnchorPositions.length];
          x = anchor.x;
          y = anchor.y;
        }

        items.push({
          id: `event-${evt.id}`,
          type: 'event',
          x,
          y,
          title: evt.title,
          category: evt.category,
          date: evt.date,
          time: evt.time,
          attendeesCount: evt.attendeesCount,
          ticketPrice: evt.ticketPrice,
          photoUrl: evt.photoUrl,
          iconEmoji: evt.iconEmoji,
          joined: evt.joined,
          eventData: evt
        });
      });
    }

    return items;
  }, [playmates, filteredEvents, showPlaymatesOverlay, showEventsOverlay, centerLat, centerLng]);

  // Spatial Marker Clustering Engine
  const { clusters, unclusteredItems } = useMemo(() => {
    if (!isClusteringEnabled) {
      return { clusters: [], unclusteredItems: allMapItems };
    }

    const unvisited = [...allMapItems];
    const computedClusters: MapCluster[] = [];
    const singles: MapItem[] = [];

    while (unvisited.length > 0) {
      const current = unvisited.shift()!;
      const clusterGroup: MapItem[] = [current];

      // Find all neighbors within the cluster distance threshold
      for (let i = unvisited.length - 1; i >= 0; i--) {
        const other = unvisited[i];
        const dist = Math.hypot(current.x - other.x, current.y - other.y);
        if (dist <= clusterRadiusValue) {
          clusterGroup.push(other);
          unvisited.splice(i, 1);
        }
      }

      if (clusterGroup.length > 1) {
        // Calculate Centroid (Mean X & Y)
        const avgX = clusterGroup.reduce((sum, item) => sum + item.x, 0) / clusterGroup.length;
        const avgY = clusterGroup.reduce((sum, item) => sum + item.y, 0) / clusterGroup.length;

        const eventItems = clusterGroup.filter(i => i.type === 'event');
        const playmateItems = clusterGroup.filter(i => i.type === 'playmate');

        // Detect concurrent events (events happening on the same date or similar time)
        let hasConcurrentEvents = false;
        let concurrentTimeSlot: string | undefined;

        if (eventItems.length >= 2) {
          const dates = eventItems.map(e => e.date).filter(Boolean);
          const uniqueDates = new Set(dates);
          if (uniqueDates.size < dates.length || dates.length >= 2) {
            hasConcurrentEvents = true;
            const primaryDate = eventItems[0]?.date;
            const primaryTime = eventItems[0]?.time;
            concurrentTimeSlot = `${primaryDate} @ ${primaryTime}`;
          }
        }

        const clusterId = `cluster-${clusterGroup.map(c => c.id).sort().join('-').slice(0, 32)}`;

        computedClusters.push({
          id: clusterId,
          x: Math.round(avgX * 10) / 10,
          y: Math.round(avgY * 10) / 10,
          items: clusterGroup,
          eventItems,
          playmateItems,
          hasConcurrentEvents,
          concurrentTimeSlot,
          dominantCategory: eventItems[0]?.category || 'Community'
        });
      } else {
        singles.push(current);
      }
    }

    // Apply "Concurrent Events Only" filter if toggled
    if (onlyConcurrentFilter) {
      const concurrentClusters = computedClusters.filter(c => c.hasConcurrentEvents);
      return { clusters: concurrentClusters, unclusteredItems: [] };
    }

    return { clusters: computedClusters, unclusteredItems: singles };
  }, [allMapItems, isClusteringEnabled, clusterRadiusValue, onlyConcurrentFilter]);

  // Spiderfy positions generator: Radial distribution around cluster center
  const getSpiderfiedPosition = (cluster: MapCluster, itemIndex: number, totalItems: number) => {
    const spiderRadius = Math.min(18, 9 + totalItems * 1.5); // Spread radius in %
    const angleStep = (2 * Math.PI) / totalItems;
    const startAngle = -Math.PI / 2; // Start from top
    const currentAngle = startAngle + itemIndex * angleStep;

    const targetX = Math.max(10, Math.min(90, cluster.x + spiderRadius * Math.cos(currentAngle)));
    const targetY = Math.max(10, Math.min(90, cluster.y + spiderRadius * Math.sin(currentAngle)));

    return { x: targetX, y: targetY };
  };

  const getCategoryIcon = (category?: string, title?: string) => {
    const text = ((category || '') + ' ' + (title || '')).toLowerCase();
    if (text.includes('class') || text.includes('sanskrit') || text.includes('pottery') || text.includes('math') || text.includes('robotics')) {
      return <BookOpen className="w-3.5 h-3.5" />;
    }
    if (text.includes('soccer') || text.includes('sport') || text.includes('relay') || text.includes('trail') || text.includes('walk') || text.includes('sprint')) {
      return <Navigation className="w-3.5 h-3.5" />;
    }
    if (text.includes('cup') || text.includes('competition') || text.includes('lego') || text.includes('showdown')) {
      return <Trophy className="w-3.5 h-3.5" />;
    }
    if (text.includes('art') || text.includes('craft') || text.includes('clay') || text.includes('drawing')) {
      return <Palette className="w-3.5 h-3.5" />;
    }
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Class':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Activity':
      case 'Sports & Outdoors':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Competition':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Arts & Crafts':
      case 'Event':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const handleShareEvent = (evt: CommunityEvent) => {
    const shareText = `Check out "${evt.title}" on Vernunt Playdates! Date: ${evt.date} at ${evt.time}, Location: ${evt.location}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const totalConcurrentClustersCount = useMemo(() => {
    return clusters.filter(c => c.hasConcurrentEvents).length;
  }, [clusters]);

  return (
    <div id="playmate-map-component" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col space-y-4 text-left">
      
      {/* Map Header & Interactive Clustering Bar */}
      <div id="map-header" className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 id="map-title" className="text-lg font-bold text-slate-800 flex items-center gap-2 font-serif">
              <Compass id="map-compass-icon" className="w-5 h-5 text-amber-500 animate-spin-slow" /> 
              <span>Neighborhood Playgroups & Events Interactive Radar</span>
            </h3>
            {isClusteringEnabled && clusters.length > 0 && (
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-2xs">
                <Layers className="w-3 h-3 text-indigo-500" />
                {clusters.length} Active Clusters ({allMapItems.length} Pins Grouped)
              </span>
            )}
          </div>
          <p id="map-subtitle" className="text-xs text-slate-500 mt-0.5">
            Real-time clustering & high-density event overlay around <strong className="text-slate-700">{ourNeighborhood}</strong> ({maxDistanceKm} km radius)
          </p>
        </div>

        {/* Top Control Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Marker Clustering */}
          <button
            id="btn-toggle-clustering-engine"
            type="button"
            onClick={() => {
              setIsClusteringEnabled(!isClusteringEnabled);
              setSpiderfiedClusterId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isClusteringEnabled
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-300/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle intelligent marker clustering for dense activity zones"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Marker Clustering</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
              isClusteringEnabled ? 'bg-white text-indigo-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {isClusteringEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Events Overlay */}
          <button
            id="btn-toggle-events-overlay"
            type="button"
            onClick={() => setShowEventsOverlay(!showEventsOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showEventsOverlay 
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300/60' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle display of local classes, workshops, and community events"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Events</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
              showEventsOverlay ? 'bg-white text-rose-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {filteredEvents.length}
            </span>
          </button>

          {/* Toggle Playmates Overlay */}
          <button
            id="btn-toggle-playmates-overlay"
            type="button"
            onClick={() => setShowPlaymatesOverlay(!showPlaymatesOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showPlaymatesOverlay 
                ? 'bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300/60' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Toggle display of nearby playmates on the map"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Playmates</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
              showPlaymatesOverlay ? 'bg-white text-orange-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {playmates.length}
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Cluster Configuration & Sub-Filters Bar */}
      <div id="clustering-controls-bar" className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
        
        {/* Left: Category Filters */}
        {showEventsOverlay && (
          <div id="events-overlay-filters" className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'All', label: `All (${events.length})` },
              { id: 'Class', label: 'Classes' },
              { id: 'Activity', label: 'Sports & Active' },
              { id: 'Competition', label: 'Competitions' },
              { id: 'Event', label: 'Gatherings' }
            ].map((cat) => (
              <button
                key={cat.id}
                id={`filter-overlay-cat-${cat.id}`}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: Clustering Precision & Concurrent Filter */}
        {isClusteringEnabled && (
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            
            {/* Concurrent High-Density Filter Toggle */}
            <button
              type="button"
              id="btn-filter-concurrent-clusters"
              onClick={() => setOnlyConcurrentFilter(!onlyConcurrentFilter)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border ${
                onlyConcurrentFilter
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-200'
              }`}
              title="Filter to show only clusters with multiple simultaneous playgroups"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Concurrent Playgroups</span>
              <span className="text-[9px] bg-black/20 px-1.5 py-0.2 rounded-full font-black">
                {totalConcurrentClustersCount}
              </span>
            </button>

            {/* Density Clustering Radius Presets */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              <span className="text-slate-400 px-1.5">Cluster Radius:</span>
              {(['tight', 'balanced', 'wide'] as const).map(radius => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setClusterDensityRadius(radius)}
                  className={`px-2 py-0.5 rounded-md uppercase transition cursor-pointer ${
                    clusterDensityRadius === radius
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {radius}
                </button>
              ))}
            </div>

            {/* Reset Spiderfy if active */}
            {spiderfiedClusterId && (
              <button
                type="button"
                id="btn-collapse-spiderfy"
                onClick={() => setSpiderfiedClusterId(null)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Collapse Spiderfy</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Interactive Sandbox Canvas */}
      <div 
        id="map-sandbox" 
        className="relative w-full h-[440px] sm:h-[480px] bg-emerald-50/75 rounded-3xl border border-emerald-200 overflow-hidden shadow-inner flex items-center justify-center select-none"
      >
        
        {/* Scalable Map Canvas Layer */}
        <div 
          id="map-scalable-canvas-layer"
          className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out flex items-center justify-center"
          style={{
            transform: `scale(${mapZoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Pasture landscape background grid decoration */}
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px), radial-gradient(#10b981 1.5px, #ecfdf5 1.5px)', 
            backgroundSize: '32px 32px', 
            backgroundPosition: '0 0, 16px 16px' 
          }}></div>

          {/* Central Park Lake Vector Mock */}
          <div id="lake-mock" className="absolute top-1/4 left-1/3 w-36 h-24 bg-cyan-150 border-2 border-cyan-200 opacity-60 rounded-full blur-xs pointer-events-none transform -rotate-12 flex items-center justify-center text-[10px] text-cyan-600 font-bold tracking-widest uppercase">
            Meadow Lake
          </div>

          {/* Play Group Parks Mock Path */}
          <div id="track-mock" className="absolute bottom-16 left-8 w-56 h-10 rounded-full border-2 border-dashed border-emerald-300 pointer-events-none transform rotate-12 flex items-center justify-center">
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider opacity-60">Community Lawn Trail</span>
          </div>

          {/* User Location Center Marker */}
          <div id="user-location-marker" className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div id="user-location-pin" className="p-2 bg-slate-900 border-2 border-white rounded-full shadow-lg scale-105 animate-bounce">
              <MapPin id="user-pin" className="w-5 h-5 text-orange-500" />
            </div>
            <span id="user-location-lbl" className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-lg mt-1 font-bold shadow-lg whitespace-nowrap">
              YOU (Family Base)
            </span>
          </div>

        {/* SVG Connector Lines for Spiderfied Clusters */}
        {spiderfiedClusterId && (() => {
          const activeCluster = clusters.find(c => c.id === spiderfiedClusterId);
          if (!activeCluster) return null;

          return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
              {activeCluster.items.map((item, idx) => {
                const pos = getSpiderfiedPosition(activeCluster, idx, activeCluster.items.length);
                return (
                  <line
                    key={`spider-line-${item.id}`}
                    x1={`${activeCluster.x}%`}
                    y1={`${activeCluster.y}%`}
                    x2={`${pos.x}%`}
                    y2={`${pos.y}%`}
                    stroke="#4338ca"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="opacity-70 animate-pulse"
                  />
                );
              })}
            </svg>
          );
        })()}

        {/* ============================================================ */}
        {/* RENDER 1: CLUSTERED MARKERS (High-Density Event & Playmate Groups) */}
        {/* ============================================================ */}
        {clusters.map((cluster) => {
          const isSpiderfied = spiderfiedClusterId === cluster.id;
          const isHighDensity = cluster.items.length >= 3;
          const hasConcurrent = cluster.hasConcurrentEvents;

          return (
            <React.Fragment key={cluster.id}>
              {/* Central Cluster Marker Node */}
              <div
                id={`map-cluster-node-${cluster.id}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 flex flex-col items-center group cursor-pointer ${
                  isSpiderfied ? 'z-20 scale-90 opacity-60' : 'z-30 hover:scale-110'
                }`}
                style={{ top: `${cluster.y}%`, left: `${cluster.x}%` }}
                onClick={() => {
                  if (isSpiderfied) {
                    setSpiderfiedClusterId(null);
                  } else {
                    setSpiderfiedClusterId(cluster.id);
                  }
                  setInspectedCluster(cluster);
                }}
              >
                {/* Cluster Hover Summary Tooltip */}
                <div className="absolute bottom-[calc(100%+10px)] opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] p-3 rounded-2xl flex flex-col gap-1.5 shadow-2xl whitespace-nowrap pointer-events-none z-40 transform translate-y-1 group-hover:translate-y-0 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      High-Density Activity Zone
                    </span>
                    <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[8.5px] rounded-md font-bold">
                      {cluster.items.length} Pins
                    </span>
                  </div>

                  {/* Summary counts */}
                  <div className="text-[9.5px] text-slate-300 space-y-0.5">
                    {cluster.eventItems.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>🎪 Playgroup Events:</span>
                        <strong className="text-white">{cluster.eventItems.length} Sessions</strong>
                      </div>
                    )}
                    {cluster.playmateItems.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>👶 Nearby Families:</span>
                        <strong className="text-white">{cluster.playmateItems.length} Playmates</strong>
                      </div>
                    )}
                  </div>

                  {/* Concurrent Highlight in Tooltip */}
                  {hasConcurrent && (
                    <div className="p-1.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-300 text-[9px] font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{cluster.eventItems.length} Concurrent Playgroups Running!</span>
                    </div>
                  )}

                  <div className="pt-1 text-[8px] text-slate-400 uppercase tracking-wider text-center font-bold">
                    Click to Spiderfy & Inspect ({cluster.items.length})
                  </div>
                </div>

                {/* Cluster Interactive Badge */}
                <div
                  className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-xl ${
                    hasConcurrent
                      ? 'bg-gradient-to-br from-amber-600 via-rose-600 to-indigo-700 border-amber-300 ring-4 ring-amber-400/40 text-white'
                      : isHighDensity
                      ? 'bg-gradient-to-br from-indigo-700 to-purple-800 border-white ring-4 ring-indigo-400/40 text-white'
                      : 'bg-slate-900 border-white text-white ring-2 ring-slate-400/30'
                  } ${
                    cluster.items.length >= 5 ? 'w-13 h-13 text-sm' : cluster.items.length >= 3 ? 'w-11 h-11 text-xs' : 'w-10 h-10 text-xs'
                  }`}
                >
                  {/* Dynamic Pulsing Halo for Concurrent & Dense Clusters */}
                  {(hasConcurrent || isHighDensity) && (
                    <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none"></span>
                  )}

                  {/* Cluster Inner Content */}
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="font-black font-mono tracking-tight">{cluster.items.length}</span>
                    <span className="text-[7.5px] font-bold uppercase opacity-90 mt-0.5">
                      {hasConcurrent ? '⚡ HUB' : 'PINS'}
                    </span>
                  </div>

                  {/* Top-Right Badge: Category Emojis preview */}
                  <div className="absolute -top-1.5 -right-1.5 flex items-center -space-x-1">
                    {cluster.eventItems.slice(0, 2).map((evt, i) => (
                      <span key={i} className="text-[10px] bg-slate-900/90 rounded-full w-4 h-4 flex items-center justify-center border border-white/50 shadow-2xs">
                        {evt.iconEmoji || '🎪'}
                      </span>
                    ))}
                  </div>

                  {/* Bottom-Left Badge: Concurrent Lightning Indicator */}
                  {hasConcurrent && (
                    <div className="absolute -bottom-1 -left-1 bg-amber-400 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center shadow-xs border border-white font-black text-[9px]">
                      ⚡
                    </div>
                  )}
                </div>

                {/* Cluster Label Pill */}
                <div className="mt-1 flex items-center gap-1 bg-slate-950/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-slate-700 shadow-sm text-[8.5px] font-extrabold whitespace-nowrap">
                  <span>{hasConcurrent ? '⚡ Concurrent Hub' : `${cluster.items.length} Nearby Activities`}</span>
                </div>
              </div>

              {/* Spiderfied Fanned-Out Markers */}
              {isSpiderfied && cluster.items.map((item, idx) => {
                const pos = getSpiderfiedPosition(cluster, idx, cluster.items.length);

                if (item.type === 'event' && item.eventData) {
                  const evt = item.eventData;
                  const isInspected = inspectedEvent?.id === evt.id;

                  return (
                    <div
                      key={`spider-item-${item.id}`}
                      id={`spider-event-node-${evt.id}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-35 transition-all duration-300 flex flex-col items-center group animate-fade-in"
                      style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                    >
                      {/* Interactive Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedEvent(evt);
                        }}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-2xl border-2 transition-all duration-200 shadow-xl cursor-pointer hover:scale-110 active:scale-95 ${
                          isInspected
                            ? 'bg-rose-700 text-white border-white ring-4 ring-rose-400/50 scale-110'
                            : evt.joined
                            ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-white border-amber-300'
                        }`}
                      >
                        <span className="text-xs">{evt.iconEmoji || getCategoryIcon(evt.category, evt.title)}</span>
                        <span className="text-[9.5px] font-black max-w-[90px] truncate">{evt.title}</span>
                        {evt.joined && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>}
                      </button>

                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md uppercase">
                          {evt.time || '10:00 AM'}
                        </span>
                        <span className="text-[8px] font-extrabold bg-slate-950 text-white px-1.5 py-0.2 rounded-md">
                          {evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE'}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'playmate' && item.playmateData) {
                  const p = item.playmateData;
                  const isSelected = selectedPlaymateId === p.id;

                  return (
                    <div
                      key={`spider-item-${item.id}`}
                      id={`spider-playmate-node-${p.id}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-35 transition-all duration-300 flex flex-col items-center group animate-fade-in"
                      style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlaymate(p);
                        }}
                        className={`relative p-0.5 rounded-full border-2 transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95 ${
                          isSelected ? 'border-orange-500 ring-4 ring-orange-500/30 scale-110' : 'border-white bg-white'
                        }`}
                      >
                        <img 
                          src={p.photoUrl} 
                          alt={p.childName} 
                          className="w-9 h-9 rounded-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </button>
                      <span className="text-[9px] font-bold bg-white text-slate-800 px-1.5 py-0.2 rounded-md shadow-2xs mt-0.5 border border-slate-200 truncate max-w-[65px]">
                        {p.childName} ({p.childAge}y)
                      </span>
                    </div>
                  );
                }

                return null;
              })}
            </React.Fragment>
          );
        })}

        {/* ============================================================ */}
        {/* RENDER 2: UNCLUSTERED STANDALONE MARKERS */}
        {/* ============================================================ */}
        {unclusteredItems.map((item) => {
          // A. Standalone Event Marker
          if (item.type === 'event' && item.eventData) {
            const evt = item.eventData;
            const isInspected = inspectedEvent?.id === evt.id;
            const isJoined = evt.joined;

            return (
              <div
                key={evt.id}
                id={`map-event-standalone-node-${evt.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 transition-all duration-300 flex flex-col items-center group animate-fade-in"
                style={{ top: `${item.y}%`, left: `${item.x}%` }}
              >
                {/* Event Hover Quick Tooltip */}
                <div className="absolute bottom-[calc(100%+8px)] opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] p-2.5 rounded-2xl flex flex-col gap-1 shadow-2xl whitespace-nowrap pointer-events-none z-40 transform translate-y-1 group-hover:translate-y-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{evt.iconEmoji || '🎪'}</span>
                    <span className="font-extrabold text-amber-300">{evt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-300">
                    <span>📅 {evt.date} @ {evt.time}</span>
                    <span>•</span>
                    <span>👥 {evt.attendeesCount} RSVP'd</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">
                      {evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE Entry'}
                    </span>
                    <span className="text-[8.5px] bg-rose-900/80 text-rose-200 px-1.5 py-0.2 rounded font-bold uppercase">
                      Click to inspect
                    </span>
                  </div>
                </div>

                {/* Event Pin Button */}
                <button
                  id={`btn-map-event-pin-${evt.id}`}
                  type="button"
                  onClick={() => setInspectedEvent(evt)}
                  className={`relative flex items-center gap-1 px-2 py-1 rounded-2xl border-2 transition-all duration-200 shadow-md cursor-pointer hover:scale-110 active:scale-95 ${
                    isInspected
                      ? 'bg-rose-700 text-white border-white ring-4 ring-rose-400/50 scale-110'
                      : isJoined
                      ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-300'
                      : 'bg-slate-900 hover:bg-slate-850 text-white border-amber-300 hover:border-amber-400'
                  }`}
                  title={`Event: ${evt.title}`}
                >
                  <span className="text-xs shrink-0">{evt.iconEmoji || getCategoryIcon(evt.category, evt.title)}</span>
                  <span className="text-[9.5px] font-black tracking-tight max-w-[85px] sm:max-w-[100px] truncate">
                    {evt.title.replace(/^[^\w\s]+/, '').trim()}
                  </span>
                  {isJoined && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>}
                </button>

                {/* Price / Category mini Pill below */}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-md shadow-2xs ${
                    evt.ticketPrice && evt.ticketPrice > 0 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE'}
                  </span>
                  <span className="text-[7.5px] bg-slate-900/80 text-white px-1 py-0.2 rounded font-bold uppercase truncate max-w-[50px]">
                    {evt.category || 'Class'}
                  </span>
                </div>
              </div>
            );
          }

          // B. Standalone Playmate Marker
          if (item.type === 'playmate' && item.playmateData) {
            const p = item.playmateData;
            const isSelected = selectedPlaymateId === p.id;

            const rawDistKm = getHaversineDistance(
              centerLat,
              centerLng,
              p.location?.lat || centerLat,
              p.location?.lng || centerLng
            );
            const distLabel = rawDistKm > 1000 ? "Nearby" : `${rawDistKm.toFixed(1)} km away`;
            const destinationStr = encodeURIComponent(p.location?.address || `${p.location?.lat},${p.location?.lng}`);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${centerLat},${centerLng}&destination=${destinationStr}`;

            return (
              <div
                id={`map-marker-${p.id}`}
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-15 transition-all duration-300 flex flex-col items-center group"
                style={{ top: `${item.y}%`, left: `${item.x}%` }}
              >
                {/* Tooltip on hover */}
                <div 
                  id={`map-marker-popup-${p.id}`}
                  className="absolute bottom-[calc(100%+8px)] opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-950 text-white text-[10px] p-2.5 rounded-2xl flex flex-col gap-1.5 shadow-2xl whitespace-nowrap pointer-events-none group-hover:pointer-events-auto z-40 transform translate-y-1 group-hover:translate-y-0"
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-extrabold">{p.childName} ({p.childAge}y) • {distLabel}</span>
                  </div>
                  {p.location?.address && (
                    <p className="text-[8.5px] text-slate-300 max-w-[150px] truncate leading-normal italic text-left">
                      {p.location.address}
                    </p>
                  )}
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectPlaymate(p)}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-md font-bold text-[9px] uppercase cursor-pointer"
                    >
                      View Profile
                    </button>
                    <a
                      id={`directions-btn-${p.id}`}
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider text-center flex items-center justify-center gap-0.5 transition cursor-pointer"
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>

                {/* Pin with Kid Avatar */}
                <button
                  id={`map-avatar-btn-${p.id}`}
                  onClick={() => onSelectPlaymate(p)}
                  type="button"
                  className={`relative p-0.5 rounded-full border-2 transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95 ${
                    isSelected 
                      ? 'border-orange-500 ring-4 ring-orange-500/30 scale-110' 
                      : 'border-white bg-white hover:border-orange-300'
                  }`}
                  title={`Playmate: ${p.childName} (${p.childAge}y)`}
                >
                  <img 
                    src={p.photoUrl} 
                    alt={p.childName} 
                    className="w-9 h-9 rounded-full object-cover" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = p.childGender === 'Girl'
                        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
                        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </button>

                <span className="text-[9px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 px-1.5 py-0.2 rounded-md shadow-2xs mt-0.5 border border-slate-200/60 truncate max-w-[65px]">
                  {p.childName}
                </span>
              </div>
            );
          }

          return null;
        })}
        </div>

        {/* Floating On-Screen Map Zoom Controls (Bottom Right of Map Sandbox) */}
        <div 
          id="map-floating-zoom-controls"
          className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-lg"
        >
          {/* Zoom Out Button */}
          <button
            id="btn-floating-map-zoom-out"
            type="button"
            onClick={handleMapZoomOut}
            disabled={mapZoom <= 0.75}
            className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              mapZoom <= 0.75
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 active:scale-95 shadow-2xs'
            }`}
            title="Zoom Out Map (-0.25x)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Indicator / Reset */}
          <button
            id="btn-floating-map-zoom-reset"
            type="button"
            onClick={handleMapResetZoom}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-mono text-[10px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Click to reset map zoom to 100%"
          >
            <span>{Math.round(mapZoom * 100)}%</span>
            {mapZoom !== 1.0 && (
              <RotateCcw className="w-2.5 h-2.5 text-emerald-600 animate-spin-once" />
            )}
          </button>

          {/* Zoom In Button */}
          <button
            id="btn-floating-map-zoom-in"
            type="button"
            onClick={handleMapZoomIn}
            disabled={mapZoom >= 2.0}
            className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              mapZoom >= 2.0
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 active:scale-95 shadow-2xs'
            }`}
            title="Zoom In Map (+0.25x)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ============================================================ */}
        {/* RENDER 3: CLUSTER EXPLORER DRAWER (Deep-dive into concurrent events) */}
        {/* ============================================================ */}
        {inspectedCluster && !inspectedEvent && (
          <div
            id="map-cluster-explorer-drawer"
            className="absolute inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 z-40 bg-slate-950/98 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl border-2 border-indigo-500 shadow-2xl p-4 sm:p-5 max-h-[85%] overflow-y-auto animate-fade-in text-left"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    High-Density Cluster
                  </span>
                  {inspectedCluster.hasConcurrentEvents && (
                    <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Simultaneous / Concurrent Playgroups
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total {inspectedCluster.items.length} Activities & Families
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black font-serif text-white flex items-center gap-2">
                  <span>📍 Clustered Activity & Playgroups Hub</span>
                </h4>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (spiderfiedClusterId === inspectedCluster.id) {
                      setSpiderfiedClusterId(null);
                    } else {
                      setSpiderfiedClusterId(inspectedCluster.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    spiderfiedClusterId === inspectedCluster.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{spiderfiedClusterId === inspectedCluster.id ? 'Spiderfy Active' : 'Spiderfy on Map'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedCluster(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close Cluster Explorer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clustered Items Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              {/* Event Cards */}
              {inspectedCluster.eventItems.map((item) => {
                const evt = item.eventData!;
                return (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between gap-2.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                        {evt.iconEmoji || '🎪'}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded ${getCategoryBadgeClass(evt.category)}`}>
                            {evt.category || 'Event'}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">
                            {evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE'}
                          </span>
                          {evt.joined && (
                            <span className="text-[8.5px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Attending
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs text-white truncate">{evt.title}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>📅 {evt.date}</span>
                          <span>•</span>
                          <span>⏰ {evt.time}</span>
                          <span>•</span>
                          <span>👥 {evt.attendeesCount} RSVP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setInspectedEvent(evt)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        View Full Details ↗
                      </button>

                      {onToggleJoinEvent && (
                        <button
                          type="button"
                          onClick={() => onToggleJoinEvent(evt.id, !evt.joined)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            evt.joined
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          }`}
                        >
                          {evt.joined ? 'Cancel RSVP' : 'RSVP Now'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Playmate Cards */}
              {inspectedCluster.playmateItems.map((item) => {
                const p = item.playmateData!;
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-2.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={p.photoUrl} 
                        alt={p.childName} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block">Nearby Family</span>
                        <h5 className="font-bold text-xs text-white">{p.childName} ({p.childAge}y)</h5>
                        <p className="text-[10px] text-slate-400">{p.playStyle || 'Active & Social'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectPlaymate(p)}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                    >
                      Profile
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RENDER 4: SINGLE EVENT DETAILS SHEET (In-Map Drawer) */}
        {/* ============================================================ */}
        {inspectedEvent && (
          <div 
            id="map-event-detail-drawer" 
            className="absolute inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 z-40 bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-rose-300 shadow-2xl p-4 sm:p-5 max-h-[85%] overflow-y-auto animate-fade-in text-left"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl shrink-0">
                  {inspectedEvent.iconEmoji || '🎪'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(inspectedEvent.category)}`}>
                      {inspectedEvent.category || 'Community Event'}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      inspectedEvent.ticketPrice && inspectedEvent.ticketPrice > 0 
                        ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {inspectedEvent.ticketPrice && inspectedEvent.ticketPrice > 0 ? `Ticket: ₹${inspectedEvent.ticketPrice}` : '✓ Free Community Event'}
                    </span>
                    {inspectedEvent.joined && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                        <Check className="w-3 h-3" /> You are Attending
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-serif font-black text-slate-900 mt-1 leading-snug">
                    {inspectedEvent.title}
                  </h4>
                </div>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-map-event-detail"
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="p-1.5 hover:bg-slate-150 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                title="Close Event Details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Body Content */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3">
              {/* Event Cover Photo */}
              <div className="sm:col-span-1 h-28 sm:h-auto rounded-2xl overflow-hidden bg-slate-100 relative">
                <img 
                  src={inspectedEvent.photoUrl} 
                  alt={inspectedEvent.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" />
                  <span>{inspectedEvent.attendeesCount} Families RSVP'd</span>
                </div>
              </div>

              {/* Event Description & Metadata */}
              <div className="sm:col-span-2 space-y-2.5 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {inspectedEvent.description}
                  </p>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-semibold truncate">{inspectedEvent.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-semibold truncate">{inspectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-semibold truncate">{inspectedEvent.location}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inspectedEvent.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-700 hover:text-rose-900 text-[10px] font-bold underline ml-auto shrink-0 flex items-center gap-0.5"
                      >
                        Map ↗
                      </a>
                    </div>
                  </div>

                  {/* Tags */}
                  {inspectedEvent.tags && inspectedEvent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {inspectedEvent.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drawer Interactive Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {/* RSVP / Join Toggle */}
                  {onToggleJoinEvent && (
                    <button
                      id={`btn-map-drawer-rsvp-${inspectedEvent.id}`}
                      type="button"
                      onClick={() => onToggleJoinEvent(inspectedEvent.id, !inspectedEvent.joined)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        inspectedEvent.joined
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-rose-700 hover:bg-rose-800 text-white'
                      }`}
                    >
                      {inspectedEvent.joined ? (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-700" />
                          <span>Cancel RSVP</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>{inspectedEvent.ticketPrice && inspectedEvent.ticketPrice > 0 ? `RSVP (₹${inspectedEvent.ticketPrice})` : 'Join & RSVP (Free)'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={() => handleShareEvent(inspectedEvent)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="Copy details to share"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{copyFeedback ? 'Copied!' : 'Share'}</span>
                  </button>

                  {/* Navigate to full Events Tab */}
                  {onNavigateToEventsTab && (
                    <button
                      id="btn-map-drawer-view-in-tab"
                      type="button"
                      onClick={() => {
                        onNavigateToEventsTab(inspectedEvent.category, inspectedEvent.id);
                        setInspectedEvent(null);
                      }}
                      className="ml-auto px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Schedule</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Footer Bar & Legend */}
      <div id="map-footer-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-3 flex-wrap font-semibold">
          <span className="text-slate-400 font-bold uppercase text-[9px]">Legend:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-rose-600 text-white text-[8px] flex items-center justify-center font-bold">
              ⚡
            </span>
            <span>Clustered High-Density Hubs ({clusters.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-900 border border-amber-300 shadow-2xs flex items-center justify-center text-[7px] text-white">★</span>
            <span>Community Events ({filteredEvents.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-2xs"></span>
            <span>Family Playmates ({playmates.length})</span>
          </div>
        </div>

        <p id="map-footer-spec" className="text-[10px] text-slate-400 italic">
          * Click any cluster node to spiderfy or expand concurrent events in that playground zone.
        </p>
      </div>
    </div>
  );
}
