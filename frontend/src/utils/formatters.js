/**
 * Utility functions for safely formatting coordinates, numbers, and dates.
 * Guarantees zero crashes on missing, null, partial, non-numeric, or non-finite inputs.
 */

export const hasValidCoordinates = (location) => {
  if (!location || typeof location !== 'object') return false;
  const lat = location.latitude;
  const lng = location.longitude;

  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const formatCoordinates = (location, decimals = 4, fallback = null) => {
  if (!hasValidCoordinates(location)) {
    return fallback;
  }
  return `${Number(location.latitude).toFixed(decimals)}, ${Number(location.longitude).toFixed(decimals)}`;
};

export const safeToFixed = (val, decimals = 2, fallback = '0.00') => {
  if (val == null || typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return val.toFixed(decimals);
};
