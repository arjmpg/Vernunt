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
 * Returns color-coded proximity metadata for cards (Green for < 1km, Amber for < 5km, etc.)
 */
export function getProximityBadge(distanceKm: number): ProximityBadgeData {
  if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
    distanceKm = 0.5;
  }

  if (distanceKm > 1000) {
    return {
      distanceText: "Nearby",
      distanceKm: 0.8,
      tier: 'immediate',
      label: "< 1 km",
      subtext: "Walking distance",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30",
      badgeOverlayClass: "bg-emerald-600/95 text-white border border-emerald-400/50 shadow-sm",
      dotColor: "bg-emerald-500",
      accentBorder: "border-emerald-500"
    };
  }

  if (distanceKm < 1.0) {
    return {
      distanceText: `${distanceKm.toFixed(1)} km`,
      distanceKm,
      tier: 'immediate',
      label: "< 1 km",
      subtext: "Walking distance",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30",
      badgeOverlayClass: "bg-emerald-600/95 text-white border border-emerald-400/50 shadow-sm",
      dotColor: "bg-emerald-500",
      accentBorder: "border-emerald-500"
    };
  }

  if (distanceKm < 3.0) {
    return {
      distanceText: `${distanceKm.toFixed(1)} km`,
      distanceKm,
      tier: 'nearby',
      label: "< 3 km",
      subtext: "Nearby / 5m stroll",
      badgeClass: "bg-emerald-50/90 text-emerald-850 border-emerald-300/80 ring-1 ring-emerald-300/30",
      badgeOverlayClass: "bg-emerald-600/90 text-white border border-emerald-300/40 shadow-sm",
      dotColor: "bg-emerald-400",
      accentBorder: "border-emerald-400"
    };
  }

  if (distanceKm < 5.0) {
    return {
      distanceText: `${distanceKm.toFixed(1)} km`,
      distanceKm,
      tier: 'moderate',
      label: "< 5 km",
      subtext: "Neighborhood radius",
      badgeClass: "bg-amber-50 text-amber-850 border-amber-300 ring-1 ring-amber-400/30",
      badgeOverlayClass: "bg-amber-500/95 text-white border border-amber-300/50 shadow-sm",
      dotColor: "bg-amber-500",
      accentBorder: "border-amber-500"
    };
  }

  return {
    distanceText: `${distanceKm.toFixed(1)} km`,
    distanceKm,
    tier: 'extended',
    label: "5+ km",
    subtext: "Extended area",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-400/20",
    badgeOverlayClass: "bg-slate-800/95 text-white border border-slate-600/50 shadow-sm",
    dotColor: "bg-slate-400",
    accentBorder: "border-slate-400"
  };
}
