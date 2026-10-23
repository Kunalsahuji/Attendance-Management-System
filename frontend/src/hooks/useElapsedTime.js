import { useState, useEffect } from 'react';

/**
 * Hook to compute real-time elapsed working hours, formatted time,
 * and dynamic progress toward the 8.0-hour standard shift target.
 *
 * @param {string|Date} punchInTime - Server punch-in timestamp
 * @param {boolean} isActive - Whether session is currently IN_PROGRESS
 * @param {number} staticHours - Completed hours when shift is already closed
 */
export function useElapsedTime(punchInTime, isActive, staticHours = 0) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive || !punchInTime) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, punchInTime]);

  if (!isActive || !punchInTime) {
    return {
      formatted: staticHours > 0 ? `${staticHours} hrs` : '00:00:00',
      decimalHours: staticHours,
      progressPercent: Math.min(100, Math.round((staticHours / 8.0) * 100)),
      isTargetReached: staticHours >= 8.0
    };
  }

  const startTime = new Date(punchInTime).getTime();
  const diffMs = Math.max(0, now - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n) => String(n).padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const decimalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  const progressPercent = Math.min(100, Math.round((decimalHours / 8.0) * 100));

  return {
    formatted,
    decimalHours,
    progressPercent,
    isTargetReached: decimalHours >= 8.0
  };
}
