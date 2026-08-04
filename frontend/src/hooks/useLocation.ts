import { useState, useCallback } from 'react';

// Radius of the Earth in km
const R = 6371;

// Helper to convert degrees to radians
const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (lat1: number | string, lon1: number | string, lat2: number | string, lon2: number | string) => {
  const l1 = Number(lat1);
  const ln1 = Number(lon1);
  const l2 = Number(lat2);
  const ln2 = Number(lon2);

  if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) {
    return Infinity;
  }

  const dLat = deg2rad(l2 - l1);
  const dLon = deg2rad(ln2 - ln1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(l1)) * Math.cos(deg2rad(l2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

export const useLocation = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  return { location, error, loading, requestLocation, calculateDistance };
};
