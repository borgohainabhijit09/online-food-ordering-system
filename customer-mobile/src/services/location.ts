import * as Location from 'expo-location';

export interface LocationResult {
  success: boolean;
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'ip' | 'fallback';
  error?: string;
}

/**
 * Cleanly format reverse geocode result from expo-location
 */
function formatExpoAddress(addr: Location.LocationGeocodedAddress): string {
  const parts: string[] = [];

  if (addr.name && addr.name !== addr.street) {
    parts.push(addr.name);
  }
  if (addr.street) {
    parts.push(addr.street);
  }
  if (addr.district && !parts.includes(addr.district)) {
    parts.push(addr.district);
  }
  if (addr.subregion && !parts.includes(addr.subregion)) {
    parts.push(addr.subregion);
  }
  if (addr.city && !parts.includes(addr.city)) {
    parts.push(addr.city);
  }
  if (addr.postalCode) {
    parts.push(addr.postalCode);
  }

  return parts.length > 0 ? parts.join(', ') : addr.city || addr.region || 'Current Location';
}

/**
 * IP-based fallback if GPS permissions are denied or GPS times out (e.g. in emulators)
 */
async function fetchIpLocation(): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    const parts = [data.city, data.region, data.postal].filter(Boolean);
    const address = parts.length > 0 ? parts.join(', ') : data.city || data.country_name;

    if (address) {
      return {
        success: true,
        address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        source: 'ip',
      };
    }
  } catch {
    // Silently proceed
  }
  return null;
}

/**
 * Capture current location and reverse geocode it to a human-readable street/city address.
 */
export async function captureCurrentLocation(): Promise<LocationResult> {
  try {
    // 1. Request foreground permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      // Fallback to IP geolocation if permission was not granted
      const ipResult = await fetchIpLocation();
      if (ipResult) return ipResult;

      return {
        success: false,
        address: '',
        source: 'fallback',
        error: 'Location permission was denied. Please select or enter an address.',
      };
    }

    // 2. Fetch coordinates with a 7-second timeout
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 7000)
    );

    const position = await Promise.race([locationPromise, timeoutPromise]);

    if (!position || !position.coords) {
      // GPS timed out, try IP fallback
      const ipResult = await fetchIpLocation();
      if (ipResult) return ipResult;

      return {
        success: false,
        address: '',
        source: 'fallback',
        error: 'Could not obtain GPS lock. Please enter address manually.',
      };
    }

    const { latitude, longitude } = position.coords;

    // 3. Reverse geocode coordinates to street address
    const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (geocoded && geocoded.length > 0) {
      const formatted = formatExpoAddress(geocoded[0]);
      return {
        success: true,
        address: formatted,
        city: geocoded[0].city || undefined,
        latitude,
        longitude,
        source: 'gps',
      };
    }

    // If reverse geocoding returned empty, try IP fallback
    const ipResult = await fetchIpLocation();
    if (ipResult) return ipResult;

    return {
      success: true,
      address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      source: 'gps',
    };
  } catch (err: any) {
    const ipResult = await fetchIpLocation();
    if (ipResult) return ipResult;

    return {
      success: false,
      address: '',
      source: 'fallback',
      error: err.message || 'Failed to detect location',
    };
  }
}
