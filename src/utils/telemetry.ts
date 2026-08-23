/**
 * Client Telemetry & Geolocation Capture Service
 * Captures user IP address and precise GPS / IP Latitude & Longitude for admin audit & security oversight.
 * Visible ONLY to Administrators.
 */

export interface CapturedTelemetry {
  ipAddress: string;
  capturedLat?: number;
  capturedLng?: number;
  capturedLocationInfo?: string;
  capturedAt: string;
}

// In-memory cached telemetry for current browser session
let cachedTelemetry: CapturedTelemetry | null = null;

export async function captureUserTelemetry(): Promise<CapturedTelemetry> {
  if (cachedTelemetry) {
    return cachedTelemetry;
  }

  let ipAddress = '127.0.0.1';
  let capturedLat: number | undefined;
  let capturedLng: number | undefined;
  let capturedLocationInfo = '';

  // 1. Fetch IP & network location from internal server API or fallback public IP lookup
  try {
    const res = await fetch('/api/client-telemetry', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ip) ipAddress = data.ip;
      if (data.lat && typeof data.lat === 'number') capturedLat = data.lat;
      if (data.lng && typeof data.lng === 'number') capturedLng = data.lng;
      if (data.locationInfo) capturedLocationInfo = data.locationInfo;
    }
  } catch {
    // Try external fallback if server telemetry route had transient error
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.ip) ipAddress = ipData.ip;
      }
    } catch {
      // ignore
    }
  }

  // 2. High-precision browser GPS Geolocation capture (if permitted by user device)
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const gpsPos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000
        });
      });
      if (gpsPos && gpsPos.coords) {
        capturedLat = Number(gpsPos.coords.latitude.toFixed(6));
        capturedLng = Number(gpsPos.coords.longitude.toFixed(6));
        capturedLocationInfo = `GPS (Accuracy ±${Math.round(gpsPos.coords.accuracy || 10)}m)`;
      }
    } catch {
      // User may have denied or timed out; retain IP-based latitude/longitude if available
    }
  }

  // If no GPS coordinates detected, provide default regional center (Bangalore)
  if (capturedLat === undefined || capturedLng === undefined) {
    capturedLat = 12.9716; // Bangalore Central Hub default
    capturedLng = 77.5946;
    if (!capturedLocationInfo) capturedLocationInfo = 'IP Network Estimate (Bangalore)';
  }

  cachedTelemetry = {
    ipAddress: ipAddress.replace(/^::ffff:/, ''), // clean ipv6-mapped ipv4
    capturedLat,
    capturedLng,
    capturedLocationInfo,
    capturedAt: new Date().toISOString()
  };

  return cachedTelemetry;
}
