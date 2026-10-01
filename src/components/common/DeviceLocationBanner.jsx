import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, Globe, RefreshCw } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function DeviceLocationBanner() {
  const {
    userLocation,
    requestLiveLocation,
    isRequestingLive,
    switchCity,
    openLocationModal,
    allCities = []
  } = useLocation();

  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-[#0C3B2E] text-white text-xs sm:text-sm px-4 sm:px-6 py-2.5 shadow-xs border-b border-[#0C3B2E]/20 relative z-30 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={`p-1.5 rounded-full text-white shrink-0 ${userLocation.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-[#FF5A1F]'}`}>
          {userLocation.isLive ? <Navigation className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
        </span>
        <span className="font-normal text-stone-200">
          {userLocation.isLive ? (
            <>
              Live Device GPS active: <strong className="text-white font-bold">{userLocation.city}</strong> (accurate to ±{Math.round(userLocation.accuracy || 10)}m).
              <span className="hidden md:inline text-stone-300 ml-1">Distances are calibrated to your physical location.</span>
            </>
          ) : (
            <>
              Volunteering Hub: <strong className="text-white font-bold">{userLocation.city}</strong> ({userLocation.label}).
              <span className="hidden md:inline text-stone-300 ml-1">Distances and collegiate squads are calculated from this hub.</span>
            </>
          )}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {!userLocation.isLive && (
          <button
            onClick={requestLiveLocation}
            disabled={isRequestingLive}
            className="bg-[#FF5A1F] hover:bg-[#E04810] text-white px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-75"
            title="Request browser GPS permission for high-precision live distance"
          >
            <Navigation className={`w-3.5 h-3.5 ${isRequestingLive ? 'animate-spin' : ''}`} />
            <span>{isRequestingLive ? 'Requesting Location...' : 'Use my current location'}</span>
          </button>
        )}

        {/* Change City Button that opens modal */}
        <button
          onClick={openLocationModal}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-md border border-white/25 focus:outline-none transition-colors cursor-pointer flex items-center gap-1.5"
          title="Switch active city (Bengaluru, Chennai, Delhi, Mumbai, Pune, etc.)"
        >
          <MapPin className="w-3 h-3 text-[#FF5A1F]" />
          <span>Switch City ({userLocation.city})</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-stone-300 hover:text-white p-1.5 cursor-pointer transition-colors rounded hover:bg-white/10"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
