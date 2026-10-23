/**
 * Real-Time Geolocation & Locality Auto-Capture Engine for Vernunt
 * Seamlessly auto-captures user GPS coordinates, reverse-geocodes neighborhood/suburb,
 * and syncs across Vernunt App and app.vernunt.com.
 */

export interface LocalityItem {
  name: string;
  pincode: string;
  city: string;
  lat?: number;
  lng?: number;
  isAutoCaptured?: boolean;
}

export const BANGALORE_LOCALITIES_GPS: Array<LocalityItem & { lat: number; lng: number }> = [
  { name: 'Indiranagar', pincode: '560038', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala', pincode: '560034', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout', pincode: '560102', city: 'Bengaluru', lat: 12.9121, lng: 77.6446 },
  { name: 'Whitefield', pincode: '560066', city: 'Bengaluru', lat: 12.9698, lng: 77.7500 },
  { name: 'Jayanagar', pincode: '560041', city: 'Bengaluru', lat: 12.9308, lng: 77.5838 },
  { name: 'Malleshwaram', pincode: '560003', city: 'Bengaluru', lat: 13.0031, lng: 77.5643 },
  { name: 'Bellandur', pincode: '560103', city: 'Bengaluru', lat: 12.9260, lng: 77.6762 },
  { name: 'Sarjapur Road', pincode: '560035', city: 'Bengaluru', lat: 12.9103, lng: 77.6845 },
  { name: 'JP Nagar', pincode: '560078', city: 'Bengaluru', lat: 12.9063, lng: 77.5857 },
  { name: 'Electronic City', pincode: '560100', city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  { name: 'Marathahalli', pincode: '560037', city: 'Bengaluru', lat: 12.9591, lng: 77.6974 },
  { name: 'Hebbal', pincode: '560024', city: 'Bengaluru', lat: 13.0358, lng: 77.5970 },
  { name: 'Banashankari', pincode: '560050', city: 'Bengaluru', lat: 12.9255, lng: 77.5468 },
  { name: 'BTM Layout', pincode: '560068', city: 'Bengaluru', lat: 12.9166, lng: 77.6101 },
  { name: 'Rajajinagar', pincode: '560010', city: 'Bengaluru', lat: 12.9982, lng: 77.5530 },
  { name: 'Yelahanka', pincode: '560064', city: 'Bengaluru', lat: 13.1007, lng: 77.5963 },
  { name: 'Kalyan Nagar', pincode: '560043', city: 'Bengaluru', lat: 13.0280, lng: 77.6394 },
  { name: 'Frazer Town', pincode: '560005', city: 'Bengaluru', lat: 12.9968, lng: 77.6133 },
  { name: 'Richmond Town', pincode: '560025', city: 'Bengaluru', lat: 12.9634, lng: 77.6047 },
  { name: 'Basavanagudi', pincode: '560004', city: 'Bengaluru', lat: 12.9416, lng: 77.5755 }
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Automatically captures GPS coordinates and determines the user's locality
 */
export async function autoDetectUserLocality(): Promise<LocalityItem | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. Check if user is in/near Bangalore by finding closest known Bangalore locality
        let closestBangalore = BANGALORE_LOCALITIES_GPS[0];
        let minDistance = Infinity;

        for (const loc of BANGALORE_LOCALITIES_GPS) {
          const dist = getDistanceKm(latitude, longitude, loc.lat, loc.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestBangalore = loc;
          }
        }

        // If within 25 km of a Bangalore neighborhood, prefer the clean Bangalore locality
        if (minDistance <= 25) {
          const result: LocalityItem = {
            name: closestBangalore.name,
            pincode: closestBangalore.pincode,
            city: closestBangalore.city,
            lat: Number(latitude.toFixed(6)),
            lng: Number(longitude.toFixed(6)),
            isAutoCaptured: true
          };
          saveLocalityPreference(result);
          resolve(result);
          return;
        }

        // 2. Otherwise query fast client-side reverse geocoding API
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (response.ok) {
            const data = await response.json();
            const areaName = data.locality || data.localityInfo?.administrative?.[3]?.name || data.suburb || data.city || 'My Neighborhood';
            const city = data.city || data.principalSubdivision || 'Bengaluru';
            const pincode = data.postcode || closestBangalore.pincode;

            const result: LocalityItem = {
              name: areaName,
              pincode: pincode,
              city: city,
              lat: Number(latitude.toFixed(6)),
              lng: Number(longitude.toFixed(6)),
              isAutoCaptured: true
            };
            saveLocalityPreference(result);
            resolve(result);
            return;
          }
        } catch (e) {
          console.debug('Reverse geocoding note:', e);
        }

        // Fallback to closest match
        const result: LocalityItem = {
          ...closestBangalore,
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          isAutoCaptured: true
        };
        saveLocalityPreference(result);
        resolve(result);
      },
      (error) => {
        console.debug('Auto-capture geolocation note:', error.message);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 }
    );
  });
}

export function saveLocalityPreference(loc: LocalityItem) {
  try {
    localStorage.setItem('vernunt_user_locality', JSON.stringify(loc));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vernunt-locality-changed', { detail: loc }));
    }
  } catch (err) {
    console.debug('Locality storage note:', err);
  }
}
