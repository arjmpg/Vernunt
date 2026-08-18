import React, { useState, useEffect, useRef } from 'react';
import { ChildProfile } from '../types.ts';
import { 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Sliders, 
  Crosshair, 
  Radio,
  Eye,
  Info
} from 'lucide-react';
import { getHaversineDistance, getProximityBadge } from '../utils/distance.ts';

interface PlaymateRadarProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  onSelectPlaymate: (profile: ChildProfile) => void;
  selectedPlaymateId?: string;
  maxDistanceKm: number;
}

export default function PlaymateRadar({ 
  playmates, 
  userProfile, 
  onSelectPlaymate, 
  selectedPlaymateId, 
  maxDistanceKm 
}: PlaymateRadarProps) {
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  
  // Custom Radar Zoom state (0.5x to 2.5x, default 1.0x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
  const radarScreenRef = useRef<HTMLDivElement>(null);

  // Sweep animation
  useEffect(() => {
    const handle = setInterval(() => {
      setSweepAngle((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(handle);
  }, []);

  // Zoom In handler (step +0.25x up to 2.5x)
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100));
  };

  // Zoom Out handler (step -0.25x down to 0.5x)
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  };

  // Reset Zoom to 1.0x
  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Preset zoom levels
  const zoomPresets = [
    { label: '0.5x', value: 0.5, name: 'Wide' },
    { label: '1.0x', value: 1.0, name: 'Standard' },
    { label: '1.5x', value: 1.5, name: 'Close-Up' },
    { label: '2.0x', value: 2.0, name: 'Dense' }
  ];

  // Mouse wheel zoom over radar screen
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      // Scrolling up -> Zoom In
      setZoomLevel((prev) => Math.min(2.5, Math.round((prev + 0.1) * 100) / 100));
    } else if (e.deltaY > 0) {
      // Scrolling down -> Zoom Out
      setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.1) * 100) / 100));
    }
  };

  // Center coordinates based on user profile or default
  const centerLat = userProfile?.location.lat || 19.0760;
  const centerLng = userProfile?.location.lng || 72.8777;

  // Effective visible distance range calculated with current zoom
  const effectiveScanRadiusKm = (maxDistanceKm / zoomLevel).toFixed(1);

  return (
    <div id="playmate-radar-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-left">
      
      {/* Radar Section Header */}
      <div id="radar-head" className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="radar-title" className="text-lg font-bold text-slate-800 flex items-center gap-1.5 font-serif">
              <Navigation id="radar-heading-icon" className="w-5 h-5 text-orange-500 animate-pulse" /> 
              <span>Active Playmate Radar</span>
            </h3>
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-black uppercase rounded-full">
              {playmates.length} In Range
            </span>
          </div>
          <p id="radar-subtitle" className="text-xs text-slate-500 mt-0.5">
            Concentric proximity mapping of child playmates based on parent location settings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Scan Pulse Badge */}
          <div id="radar-status-dot" className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Live Scan</span>
          </div>
        </div>
      </div>

      {/* Radar Top Toolbar: Zoom Controls & Presets Bar */}
      <div 
        id="radar-zoom-controls-toolbar" 
        className="w-full mb-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        {/* Left: Quick Zoom Presets */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Radio className="w-3 h-3 text-orange-500" />
            <span>Radar Zoom:</span>
          </span>
          {zoomPresets.map((preset) => (
            <button
              key={preset.value}
              id={`btn-radar-preset-${preset.label.replace('.', '')}`}
              type="button"
              onClick={() => setZoomLevel(preset.value)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                zoomLevel === preset.value
                  ? 'bg-orange-500 text-white shadow-xs scale-105 font-extrabold'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
              title={`${preset.name} radar zoom scale (${preset.label})`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Right: Zoom In / Zoom Out / Reset Buttons & Level Badge */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Out Button */}
          <button
            id="btn-radar-zoom-out"
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              zoomLevel <= 0.5
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200 hover:border-orange-200 active:scale-95 shadow-2xs'
            }`}
            title="Zoom Out Radar Scan (-0.25x)"
            aria-label="Zoom out radar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Indicator / Reset Button */}
          <button
            id="btn-radar-zoom-reset"
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-mono text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Click to reset zoom to 100% (1.0x)"
          >
            <span>{Math.round(zoomLevel * 100)}%</span>
            {zoomLevel !== 1.0 && (
              <RotateCcw className="w-3 h-3 text-orange-500 animate-spin-once" />
            )}
          </button>

          {/* Zoom In Button */}
          <button
            id="btn-radar-zoom-in"
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            className={`p-1.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
              zoomLevel >= 2.5
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200 hover:border-orange-200 active:scale-95 shadow-2xs'
            }`}
            title="Zoom In Radar Scan (+0.25x)"
            aria-label="Zoom in radar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Slider Toggle */}
          <button
            id="btn-radar-toggle-slider"
            type="button"
            onClick={() => setShowZoomSlider(!showZoomSlider)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showZoomSlider 
                ? 'bg-orange-500 text-white border-orange-500 shadow-2xs' 
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Toggle fine precision zoom slider"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fine-Tuning Zoom Slider Bar (when toggled) */}
      {showZoomSlider && (
        <div 
          id="radar-fine-zoom-slider-container"
          className="w-full mb-4 p-3 bg-orange-50/60 border border-orange-200/80 rounded-2xl flex items-center gap-3 animate-fade-in text-xs"
        >
          <span className="text-[11px] font-extrabold text-orange-950 whitespace-nowrap flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-orange-600" /> Precision Zoom:
          </span>
          <input
            id="slider-radar-precision-zoom"
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="flex-1 accent-orange-600 h-2 bg-orange-200/70 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-orange-900 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shrink-0">
            {zoomLevel.toFixed(2)}x ({Math.round(zoomLevel * 100)}%)
          </span>
        </div>
      )}

      {/* Radar Container with Floating Visual Zoom Controls */}
      <div className="relative flex flex-col items-center">
        
        {/* Main Radar Screen */}
        <div 
          ref={radarScreenRef}
          id="radar-screen" 
          onWheel={handleWheel}
          className="relative w-80 h-80 bg-slate-900 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center select-none cursor-crosshair group"
          title="Scroll with mouse wheel to zoom in/out"
        >
          {/* Dynamic sweeping overlay */}
          <div 
            id="radar-sweep"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `conic-gradient(from ${sweepAngle}deg, rgba(249, 115, 22, 0.18) 0deg, rgba(249, 115, 22, 0.04) 90deg, transparent 180deg)`,
              borderRadius: '50%'
            }}
          ></div>

          {/* Concentric grid lines (dynamically scaled by zoomLevel) */}
          <div 
            id="ring-1" 
            className="absolute border border-orange-500/20 rounded-full transition-all duration-300 pointer-events-none"
            style={{
              width: `${Math.min(290, 80 * zoomLevel)}px`,
              height: `${Math.min(290, 80 * zoomLevel)}px`,
            }}
          >
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-orange-400/60 bg-slate-900/90 px-1 rounded">
              {(maxDistanceKm * 0.33 / zoomLevel).toFixed(1)}km
            </span>
          </div>

          <div 
            id="ring-2" 
            className="absolute border border-orange-500/25 rounded-full transition-all duration-300 pointer-events-none"
            style={{
              width: `${Math.min(290, 160 * zoomLevel)}px`,
              height: `${Math.min(290, 160 * zoomLevel)}px`,
            }}
          >
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-orange-400/60 bg-slate-900/90 px-1 rounded">
              {(maxDistanceKm * 0.66 / zoomLevel).toFixed(1)}km
            </span>
          </div>

          <div 
            id="ring-3" 
            className="absolute border border-orange-500/30 rounded-full transition-all duration-300 pointer-events-none"
            style={{
              width: `${Math.min(290, 240 * zoomLevel)}px`,
              height: `${Math.min(290, 240 * zoomLevel)}px`,
            }}
          >
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono text-orange-400/70 bg-slate-900/90 px-1 rounded">
              {(maxDistanceKm / zoomLevel).toFixed(1)}km
            </span>
          </div>
          
          {/* Crosshair grids */}
          <div id="axis-v" className="absolute inset-x-0 h-[1px] bg-orange-500/15 pointer-events-none"></div>
          <div id="axis-h" className="absolute inset-y-0 w-[1px] bg-orange-500/15 pointer-events-none"></div>

          {/* Central user profile node */}
          <div 
            id="user-center-node" 
            className="absolute z-20 w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 border-2 border-white shadow-xl flex items-center justify-center hover:scale-115 transition-transform duration-200 cursor-pointer" 
            title="You / Your Family (Home Base)"
          >
            <span id="center-paw" className="text-sm select-none" role="img" aria-label="family-home">🏠</span>
            <span className="absolute -bottom-5 text-[8px] font-bold text-orange-300 font-mono tracking-wider whitespace-nowrap bg-slate-950/80 px-1.5 py-0.2 rounded-md">
              YOU
            </span>
          </div>

          {/* Other playmate nodes (Coordinates calculated and scaled with zoomLevel) */}
          {playmates.map((p, index) => {
            // Calculate relative projection
            const dLat = (p.location.lat - centerLat) * 800; // Scaled
            const dLng = (p.location.lng - centerLng) * 800; // Scaled

            // Distance calculation
            const rawDistKm = getHaversineDistance(
              centerLat,
              centerLng,
              p.location.lat,
              p.location.lng
            );
            const proxBadge = getProximityBadge(rawDistKm);

            // Scale radius according to zoomLevel
            const baseDist = Math.sqrt(dLat * dLat + dLng * dLng);
            const scaledRadius = Math.min(135, (baseDist * zoomLevel) + (28 * zoomLevel));
            const angle = Math.atan2(dLat, dLng) + (index * 0.2); // Add slight shift

            // Coordinate calculation centered on (160, 160)
            const x = 160 + scaledRadius * Math.cos(angle);
            const y = 160 + scaledRadius * Math.sin(angle);

            const isSelected = selectedPlaymateId === p.id;
            const distLabel = `${proxBadge.distanceText} (${proxBadge.label})`;

            return (
              <button
                id={`radar-node-${p.id}`}
                key={p.id}
                onClick={() => onSelectPlaymate(p)}
                type="button"
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 cursor-pointer"
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                <span className={`absolute -inset-1.5 rounded-full animate-ping pointer-events-none opacity-40 ${proxBadge.dotColor}`}></span>
                
                <div className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-125 transition-transform duration-200 overflow-hidden ${
                  isSelected 
                    ? 'border-orange-500 scale-115 ring-4 ring-orange-500/40' 
                    : `${proxBadge.accentBorder} bg-slate-800`
                }`}>
                  <img 
                    src={p.photoUrl} 
                    alt={p.childName} 
                    className="w-full h-full object-cover animate-fade-in" 
                    referrerPolicy="no-referrer" 
                  />
                </div>

                {/* Dynamic tag hint */}
                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700/80 text-white text-[10px] py-1 px-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl flex flex-col items-center gap-0.5 whitespace-nowrap z-30">
                  <span className="font-bold text-orange-400">{p.childName} ({p.gradeLevel})</span>
                  <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-black uppercase ${proxBadge.badgeOverlayClass}`}>{distLabel}</span>
                </div>
              </button>
            );
          })}

          {/* Floating On-Screen Zoom Controls (Bottom Right of Radar) */}
          <div className="absolute bottom-2.5 right-2.5 z-25 flex flex-col gap-1 bg-slate-950/70 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
            <button
              id="btn-floating-radar-zoom-in"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoomLevel >= 2.5}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-floating-radar-zoom-out"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoomLevel <= 0.5}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Floating On-Screen Zoom Level Indicator (Bottom Left of Radar) */}
          <div className="absolute bottom-2.5 left-2.5 z-25 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60 text-[9px] font-mono font-bold text-orange-300">
            {Math.round(zoomLevel * 100)}% ZOOM
          </div>
        </div>
      </div>

      {/* Quick radar specs & Dynamic Distance Metrics */}
      <div id="radar-footer-labels" className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <div id="radar-metric-1">
          <span className="block text-slate-800 font-bold font-serif text-sm">{playmates.length}</span>
          <span className="text-[11px]">Kids Nearby</span>
        </div>
        <div id="radar-metric-2">
          <span className="block text-slate-800 font-bold font-serif text-sm">{effectiveScanRadiusKm} km</span>
          <span className="text-[11px]">Visible Horizon</span>
        </div>
        <div id="radar-metric-3">
          <span className="block text-orange-600 font-bold font-serif text-sm">{zoomLevel.toFixed(1)}x</span>
          <span className="text-[11px]">Proximity Scale</span>
        </div>
      </div>

    </div>
  );
}

