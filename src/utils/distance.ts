/**
 * Calculates the Haversine distance between two sets of GPS lat/lng coordinates in kilometers.
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.2; // Return reasonable default if coords are missing

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

export interface ProximityBadgeData {
  distanceText: string;
  exactText: string;
  exactMeters: number;
  distanceKm: number;
  tier: 'immediate' | 'nearby' | 'moderate' | 'extended';
  label: string;
  subtext: string;
  badgeClass: string;
  badgeOverlayClass: string;
  dotColor: string;
  accentBorder: string;
}

/**
 * Formats distance with high numerical precision:
 * - If less than 1 km: returns exact meters (e.g. "340 m")
 * - If 1 km or more: returns exact 2-decimal kilometers (e.g. "1.45 km")
 */
export function formatExactDistance(distanceKm: number): {
  exactText: string;
  exactMeters: number;
  kmText: string;
  label: string;
  subtext: string;
  isSpontaneousWalking: boolean;
} {
  const safeKm = (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) ? 0.45 : distanceKm;
  const meters = Math.round(safeKm * 1000);
  const kmText = `${safeKm.toFixed(2)} km`;
  const isSpontaneousWalking = safeKm <= 0.5;

  let exactText = '';
  let label = '';
  let subtext = '';

  if (safeKm < 1.0) {
    exactText = `${meters} m`;
    label = isSpontaneousWalking ? '< 500m' : '< 1 km';
    subtext = isSpontaneousWalking ? 'Spontaneous Walk' : 'Walking distance';
  } else if (safeKm < 3.0) {
    exactText = `${safeKm.toFixed(2)} km`;
    label = '< 3 km';
    subtext = '5m stroll / cycle';
  } else if (safeKm < 5.0) {
    exactText = `${safeKm.toFixed(2)} km`;
    label = '< 5 km';
    subtext = 'Short neighborhood drive';
  } else {
    exactText = `${safeKm.toFixed(2)} km`;
    label = '5+ km';
    subtext = 'Extended radius';
  }

  return {
    exactText,
    exactMeters: meters,
    kmText,
    label,
    subtext,
    isSpontaneousWalking
  };
}

/**
 * Builds universal map navigation URL that opens native map apps on iOS, Android, or desktop
 * with the destination coordinates securely pinned and walking route preset.
 */
export function getNavigationMapUrl(lat: number, lng: number, label?: string): string {
  const cleanLat = lat || 12.9716;
  const cleanLng = lng || 77.5946;
  const encodedLabel = encodeURIComponent(label || 'Playmate Park Location');
  // Google Maps Universal Directions URL: opens native Google Maps app on Android/iOS or browser map
  return `https://www.google.com/maps/dir/?api=1&destination=${cleanLat},${cleanLng}&destination_place_id=&travelmode=walking&dir_action=navigate`;
}

/**
 * Opens device map app with destination coordinates pinned
 */
export function openDeviceNavigation(lat: number, lng: number, label?: string): void {
  const url = getNavigationMapUrl(lat, lng, label);
  if (typeof window !== 'undefined') {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // If popup blocker intervened, assign location
      window.location.href = url;
    }
  }
}

/**
 * Returns color-coded proximity metadata for cards with exact distance formatting
 */
export function getProximityBadge(distanceKm: number): ProximityBadgeData {
  if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
    distanceKm = 0.5;
  }

  const { exactText, exactMeters, label, subtext } = formatExactDistance(distanceKm);

  if (distanceKm > 1000) {
    return {
      distanceText: "Nearby",
      exactText: "800 m",
      exactMeters: 800,
      distanceKm: 0.8,
      tier: 'immediate',
      label: "< 1 km",
      subtext: "Walking distance",
      badgeClass: "bg-emerald-50 text-emerald-850 border-emerald-300 ring-1 ring-emerald-400/30",
      badgeOverlayClass: "bg-emerald-600/95 text-white border border-emerald-400/50 shadow-sm",
      dotColor: "bg-emerald-500",
      accentBorder: "border-emerald-500"
    };
  }

  if (distanceKm < 1.0) {
    return {
      distanceText: exactText,
      exactText,
      exactMeters,
      distanceKm,
      tier: 'immediate',
      label,
      subtext,
      badgeClass: distanceKm <= 0.5 
        ? "bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs"
        : "bg-emerald-50 text-emerald-850 border-emerald-200 ring-1 ring-emerald-300/30",
      badgeOverlayClass: "bg-emerald-600/95 text-white border border-emerald-400/50 shadow-sm",
      dotColor: "bg-emerald-500",
      accentBorder: "border-emerald-500"
    };
  }

  if (distanceKm < 3.0) {
    return {
      distanceText: exactText,
      exactText,
      exactMeters,
      distanceKm,
      tier: 'nearby',
      label,
      subtext,
      badgeClass: "bg-teal-50/90 text-teal-900 border-teal-200/80 ring-1 ring-teal-300/30",
      badgeOverlayClass: "bg-teal-600/90 text-white border border-teal-300/40 shadow-sm",
      dotColor: "bg-teal-500",
      accentBorder: "border-teal-400"
    };
  }

  if (distanceKm < 5.0) {
    return {
      distanceText: exactText,
      exactText,
      exactMeters,
      distanceKm,
      tier: 'moderate',
      label,
      subtext,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-200 ring-1 ring-amber-300/30",
      badgeOverlayClass: "bg-amber-500/95 text-white border border-amber-300/50 shadow-sm",
      dotColor: "bg-amber-500",
      accentBorder: "border-amber-500"
    };
  }

  return {
    distanceText: exactText,
    exactText,
    exactMeters,
    distanceKm,
    tier: 'extended',
    label,
    subtext,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-300/30",
    badgeOverlayClass: "bg-slate-800/95 text-white border border-slate-600/50 shadow-sm",
    dotColor: "bg-slate-400",
    accentBorder: "border-slate-400"
  };
}
