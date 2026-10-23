import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LocationDisplay({ onLocationCaptured, location }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setLoading(false);
        onLocationCaptured(coords);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Location permission denied. Please allow location access to punch in/out.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationCaptured]);

  useEffect(() => {
    if (!location) {
      const timer = setTimeout(() => {
        fetchLocation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location, fetchLocation]);

  return (
    <div className="w-full max-w-md mx-auto mt-3 bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <MapPin className="w-4 h-4 text-indigo-400" /> GPS Geolocation Tracking
        </span>
        <button
          type="button"
          onClick={fetchLocation}
          disabled={loading}
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Locating...' : 'Refresh GPS'}
        </button>
      </div>

      <div className="mt-2">
        {error ? (
          <div className="flex items-start gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : location ? (
          <div className="flex items-center justify-between text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {location && typeof location.latitude === 'number' && isFinite(location.latitude) && typeof location.longitude === 'number' && isFinite(location.longitude)
                  ? `Lat: ${Number(location.latitude).toFixed(5)}, Lng: ${Number(location.longitude).toFixed(5)}`
                  : 'Location coordinates unavailable'}
              </span>
            </div>
            {location.accuracy && (
              <span className="text-slate-400 text-[10px]">
                ±{Math.round(location.accuracy)}m accuracy
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-400 flex items-center gap-2 p-2">
            <Navigation className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            Acquiring current GPS coordinates...
          </div>
        )}
      </div>
    </div>
  );
}
