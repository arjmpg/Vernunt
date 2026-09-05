import { SpecialistProfile } from '../types.ts';

// Haversine formula for spherical distance in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

// City center coordinates for Pan-India Metros
export const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
  'delhi-ncr': { lat: 28.6139, lng: 77.209, name: 'Delhi NCR' },
  mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai' },
  hyderabad: { lat: 17.385, lng: 78.4867, name: 'Hyderabad' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  chandigarh: { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  kochi: { lat: 9.9312, lng: 76.2673, name: 'Kochi' },
  indore: { lat: 22.7196, lng: 75.8577, name: 'Indore' },
  patna: { lat: 25.5941, lng: 85.1376, name: 'Patna' },
  coimbatore: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar' },
  guwahati: { lat: 26.1445, lng: 91.7362, name: 'Guwahati' },
};

// Popular locality coordinates for accurate micro-distance calculations
export const LOCALITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Bangalore
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  jayanagar: { lat: 12.9308, lng: 77.5838 },
  whitefield: { lat: 12.9698, lng: 77.7499 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  malleshwaram: { lat: 13.0031, lng: 77.5643 },
  bellandur: { lat: 12.9304, lng: 77.6784 },
  'jp nagar': { lat: 12.9063, lng: 77.5857 },
  'electronic city': { lat: 12.8452, lng: 77.6602 },
  'sarjapur road': { lat: 12.9116, lng: 77.6744 },
  yelahanka: { lat: 13.1007, lng: 77.5963 },
  rajajinagar: { lat: 12.9982, lng: 77.553 },
  hebbal: { lat: 13.0358, lng: 77.597 },
  marathahalli: { lat: 12.9591, lng: 77.6974 },
  'bannerghatta road': { lat: 12.8876, lng: 77.597 },
  'kanakapura road': { lat: 12.9081, lng: 77.5583 },
  banashankari: { lat: 12.9255, lng: 77.5468 },
  basavanagudi: { lat: 12.9438, lng: 77.5738 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  'kalyan nagar': { lat: 13.0238, lng: 77.6433 },
  'frazer town': { lat: 12.9986, lng: 77.6133 },
  'richmond town': { lat: 12.9644, lng: 77.6015 },
  vijayanagar: { lat: 12.9719, lng: 77.5306 },
  domlur: { lat: 12.9609, lng: 77.6387 },
  sadashivanagar: { lat: 13.0068, lng: 77.5813 },
  'rt nagar': { lat: 13.0184, lng: 77.5934 },
  mahadevapura: { lat: 12.9922, lng: 77.6974 },
  'cv raman nagar': { lat: 12.9855, lng: 77.6639 },
  varthur: { lat: 12.9406, lng: 77.7471 },
  kengeri: { lat: 12.9081, lng: 77.4851 },
  nagarbhavi: { lat: 12.9603, lng: 77.5112 },
  'kasturi nagar': { lat: 13.0084, lng: 77.6628 },
  // Mumbai
  'bandra west': { lat: 19.0596, lng: 72.8295 },
  'santacruz west': { lat: 19.0818, lng: 72.8368 },
  juhu: { lat: 19.1075, lng: 72.8263 },
  'andheri west': { lat: 19.1363, lng: 72.8277 },
  powai: { lat: 19.1176, lng: 72.906 },
  'dadar west': { lat: 19.0178, lng: 72.8478 },
  worli: { lat: 19.0166, lng: 72.8167 },
  chembur: { lat: 19.0622, lng: 72.8994 },
  'thane west': { lat: 19.2183, lng: 72.9781 },
  vashi: { lat: 19.0771, lng: 72.9986 },
  // Delhi NCR
  'south extension': { lat: 28.5727, lng: 77.2201 },
  saket: { lat: 28.5244, lng: 77.2167 },
  'gurgaon dlf phase 5': { lat: 28.4595, lng: 77.0945 },
  'gurgaon golf course road': { lat: 28.4682, lng: 77.1025 },
  'noida sector 50': { lat: 28.5708, lng: 77.3685 },
  'noida sector 62': { lat: 28.6279, lng: 77.3688 },
  'vasant vihar': { lat: 28.5583, lng: 77.1583 },
  'dwarka sector 12': { lat: 28.5921, lng: 77.046 },
  'greater kailash': { lat: 28.5393, lng: 77.2343 },
  // Hyderabad
  'banjara hills': { lat: 17.4156, lng: 78.4357 },
  'jubilee hills': { lat: 17.4319, lng: 78.4073 },
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  kondapur: { lat: 17.4689, lng: 78.3578 },
  hitec: { lat: 17.4474, lng: 78.3762 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  // Chennai
  'anna nagar': { lat: 13.085, lng: 80.2101 },
  't. nagar': { lat: 13.0418, lng: 80.2341 },
  adyar: { lat: 13.0012, lng: 80.2565 },
  alwarpet: { lat: 13.0334, lng: 80.252 },
  nungambakkam: { lat: 13.0569, lng: 80.2425 },
  // Pune
  kothrud: { lat: 18.5074, lng: 73.8077 },
  baner: { lat: 18.559, lng: 73.7868 },
  aundh: { lat: 18.5599, lng: 73.8074 },
  wakad: { lat: 18.5987, lng: 73.7661 },
  hinjewadi: { lat: 18.5913, lng: 73.7389 },
  // Kolkata
  'salt lake': { lat: 22.5867, lng: 88.4172 },
  'new town': { lat: 22.5937, lng: 88.4828 },
  ballygunge: { lat: 22.528, lng: 88.3659 },
  alipore: { lat: 22.5312, lng: 88.3304 },
};

/**
 * Resolves doctor geographic coordinates with intelligent fallback to their locality or city center
 */
export function getDoctorCoordinates(spec: SpecialistProfile): { lat: number; lng: number } {
  if (typeof spec.lat === 'number' && typeof spec.lng === 'number') {
    return { lat: spec.lat, lng: spec.lng };
  }

  const locText = `${spec.clinicAddress || ''} ${spec.location || ''}`.toLowerCase();

  // 1. Try matching known locality
  for (const [localityKey, coords] of Object.entries(LOCALITY_COORDINATES)) {
    if (locText.includes(localityKey)) {
      return coords;
    }
  }

  // 2. Try matching city
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    if (locText.includes(cityKey) || locText.includes(coords.name.toLowerCase())) {
      return coords;
    }
  }

  // Default fallback to Bangalore Central
  return CITY_COORDINATES.bangalore;
}

/**
 * Calculates distance from user's coordinates to specialist
 */
export function calculateDoctorDistance(
  userLat: number,
  userLng: number,
  spec: SpecialistProfile
): number {
  const doctorCoords = getDoctorCoordinates(spec);
  return calculateDistanceKm(userLat, userLng, doctorCoords.lat, doctorCoords.lng);
}

/**
 * Formats distance in km nicely
 */
export function formatDistanceKm(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Browser geolocation request with high accuracy
 */
export async function getCurrentUserLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy?: number;
  cityGuess?: string;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Guess closest city
        let closestCity = 'bangalore';
        let minDistance = Infinity;
        for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
          const dist = calculateDistanceKm(lat, lng, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = key;
          }
        }

        resolve({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
          cityGuess: closestCity,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 min cache
      }
    );
  });
}
