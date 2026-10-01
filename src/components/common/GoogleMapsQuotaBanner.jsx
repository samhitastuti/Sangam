import React, { useState, useEffect } from 'react';

/**
 * Google Maps Platform Quota Exceeded Sticky Banner
 * Required by Google Maps Platform integration guidelines for demo key apps
 */
export default function GoogleMapsQuotaBanner() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  if (!quotaExceeded) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
      <span>
        Unable to load map data. Please check your network connection or Google Maps Platform API key quota.
      </span>
      <button
        onClick={() => setQuotaExceeded(false)}
        className="text-amber-800 hover:text-amber-950 text-xs ml-3 font-bold cursor-pointer"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
