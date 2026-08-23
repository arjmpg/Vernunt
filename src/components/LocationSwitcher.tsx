import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, ChevronDown, Compass, Crosshair, X } from 'lucide-react';
import { BANGALORE_LOCALITIES } from '../data/bangaloreProfiles.ts';

interface LocationSwitcherProps {
  currentCityOrArea: string;
  currentLat: number;
  currentLng: number;
  onLocationChange: (newLocation: { address: string; lat: number; lng: number }) => void;
  radiusKm?: number;
  onRadiusChange?: (radius: number) => void;
  className?: string;
  compact?: boolean;
}

export default function LocationSwitcher({
  currentCityOrArea,
  currentLat,
  currentLng,
  onLocationChange,
  radiusKm = 10,
  onRadiusChange,
  className = '',
  compact = false
}: LocationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [customManualAddress, setCustomManualAddress] = useState('');

  // Filtered Bangalore localities
  const filteredLocalities = BANGALORE_LOCALITIES.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.pincode.includes(searchQuery)
  );

  // Auto-capture GPS location using browser geolocation API
  const handleAutoLocate = () => {
    setIsLocating(true);
    setLocateError(null);

    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Find nearest Bangalore locality
        let nearestLoc = BANGALORE_LOCALITIES[0];
        let minDistance = Infinity;

        BANGALORE_LOCALITIES.forEach(loc => {
          const dLat = (loc.lat - lat) * 111;
          const dLng = (loc.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestLoc = loc;
          }
        });

        const addressText = minDistance < 15 
          ? `${nearestLoc.name}, Bangalore (GPS Exact: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
          : `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        onLocationChange({
          address: addressText,
          lat,
          lng
        });
        setIsLocating(false);
        setIsOpen(false);
      },
      (error) => {
        console.warn('Geolocation warning:', error);
        // Fallback default Indiranagar Bangalore
        setLocateError('Could not obtain GPS permission. Showing default Bangalore center.');
        onLocationChange({
          address: 'Indiranagar, Bangalore',
          lat: 12.9784,
          lng: 77.6408
        });
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectLocality = (loc: typeof BANGALORE_LOCALITIES[0]) => {
    onLocationChange({
      address: `${loc.name}, Bangalore - ${loc.pincode}`,
      lat: loc.lat,
      lng: loc.lng
    });
    setIsOpen(false);
  };

  const handleManualApply = () => {
    if (!customManualAddress.trim()) return;
    
    // Check if entered text matches a known locality
    const match = BANGALORE_LOCALITIES.find(l => 
      customManualAddress.toLowerCase().includes(l.name.toLowerCase())
    );

    const lat = match ? match.lat : 12.9716;
    const lng = match ? match.lng : 77.5946;

    onLocationChange({
      address: customManualAddress.trim(),
      lat,
      lng
    });
    setCustomManualAddress('');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Location Trigger Pill */}
      <button
        type="button"
        id="btn-location-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:bg-orange-50/30 transition cursor-pointer text-left ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <div className="w-6 h-6 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
          <MapPin className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
        </div>
        <div className="truncate max-w-[170px] sm:max-w-[240px]">
          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block leading-tight">
            Active Area
          </span>
          <span className="font-bold text-slate-800 text-xs truncate block leading-tight">
            {currentCityOrArea || 'Bangalore, Karnataka'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {/* Dropdown Modal / Popover */}
      {isOpen && (
        <div 
          id="location-switcher-popover" 
          className="fixed inset-0 sm:inset-auto sm:absolute sm:top-full sm:left-0 sm:mt-2 w-full sm:w-[380px] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 z-[120] p-4 sm:p-5 space-y-4 max-h-[90vh] sm:max-h-[520px] overflow-y-auto animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-500" />
              <h4 className="font-bold text-slate-900 text-sm font-serif">Switch Location</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* GPS Auto-Capture Button */}
          <button
            type="button"
            id="btn-auto-capture-gps"
            onClick={handleAutoLocate}
            disabled={isLocating}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Capturing GPS Location...' : 'Use Current GPS Location (Auto-Detect)'}
          </button>

          {locateError && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
              {locateError}
            </p>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-locality-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bangalore area, pincode (e.g. HSR, Whitefield)..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>

          {/* Popular Bangalore Hubs / Localities List */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 px-1 block mb-1">
              Bangalore Localities & Hubs ({filteredLocalities.length})
            </span>
            {filteredLocalities.slice(0, 15).map((loc) => {
              const isCurrent = currentCityOrArea.toLowerCase().includes(loc.name.toLowerCase());
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectLocality(loc)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition cursor-pointer ${
                    isCurrent 
                      ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-3 h-3 ${isCurrent ? 'text-orange-500' : 'text-slate-400'}`} />
                    <span>{loc.name}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({loc.zone})</span>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </button>
              );
            })}
          </div>

          {/* Manual Custom Address Entry */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Or Enter Custom Address / Apartment
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customManualAddress}
                onChange={(e) => setCustomManualAddress(e.target.value)}
                placeholder="e.g. Prestige Shantiniketan, Tower 5"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualApply();
                }}
              />
              <button
                type="button"
                onClick={handleManualApply}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Search Radius Slider (if onRadiusChange provided) */}
          {onRadiusChange && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Discovery Radius</span>
                <span className="text-orange-600 font-mono font-black">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={radiusKm}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>1 km (Society)</span>
                <span>10 km (Zone)</span>
                <span>25 km (All Bangalore)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
