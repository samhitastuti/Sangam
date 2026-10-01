import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  X,
  Compass,
  Check,
  Building2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { CITY_COORDINATES } from '../../utils/distance.js';

export default function LocationPromptModal() {
  const {
    showLocationModal,
    closeLocationModal,
    userLocation,
    requestLiveLocation,
    useCampusGpsFix,
    switchCity,
    isRequestingLive,
    locationError,
    locationErrorCode,
    clearError,
    permissionState
  } = useLocation();

  if (!showLocationModal) return null;

  const handleLiveGps = async () => {
    clearError();
    const updated = await requestLiveLocation();
    if (updated) {
      closeLocationModal();
    }
  };

  const handleCampusFix = (presetId = 'srm_ktr') => {
    useCampusGpsFix(presetId);
    closeLocationModal();
  };

  const handleCitySelect = (cityName) => {
    switchCity(cityName);
    closeLocationModal();
  };

  // Curated city list with landmark descriptions
  const cityCards = [
    { name: 'Bengaluru', landmark: 'IISc · Koramangala · Bellandur', state: 'Karnataka' },
    { name: 'Chennai', landmark: 'SRM KTR · IIT Madras · Guindy', state: 'Tamil Nadu' },
    { name: 'Delhi', landmark: 'DU North Campus · IIT Delhi · Hauz Khas', state: 'Delhi NCR' },
    { name: 'Mumbai', landmark: 'IIT Bombay · Bandra · South Mumbai', state: 'Maharashtra' },
    { name: 'Hyderabad', landmark: 'IIT Hyderabad · HITEC City · Charminar', state: 'Telangana' },
    { name: 'Pune', landmark: 'COEP · Symbiosis · Shivajinagar', state: 'Maharashtra' },
    { name: 'Kolkata', landmark: 'Jadavpur Univ · Presidency · Salt Lake', state: 'West Bengal' },
    { name: 'Ahmedabad', landmark: 'Gujarat Univ · Navrangpura · IIT Gandhinagar', state: 'Gujarat' },
    { name: 'Coimbatore', landmark: 'PSG Tech · Peelamedu · Amrita', state: 'Tamil Nadu' },
    { name: 'Vellore', landmark: 'VIT Flagship Campus · Katpadi', state: 'Tamil Nadu' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0C3B2E] text-white p-5 sm:p-6 relative">
          <button
            onClick={closeLocationModal}
            className="absolute top-4 right-4 text-stone-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-sm shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F] bg-[#FF5A1F]/15 px-2 py-0.5 rounded">
                Personalized Volunteer Experience
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Where are you volunteering from?
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed">
            Sangam calculates exact travel distance to community drives, pairs you into local campus squads, and enables geofenced venue check-in.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* 3 Geolocation States: prompt, granted, denied/error */}
          {locationError ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-amber-900 text-sm">
                    {locationErrorCode === 'denied' && 'Location Permission Blocked'}
                    {locationErrorCode === 'unavailable' && 'Location Position Unavailable'}
                    {locationErrorCode === 'timeout' && 'Location Request Timed Out'}
                    {locationErrorCode === 'insecure' && 'Insecure Context'}
                    {locationErrorCode === 'unsupported' && 'Geolocation Unsupported'}
                    {!['denied', 'unavailable', 'timeout', 'insecure', 'unsupported'].includes(locationErrorCode) && 'Location Notice'}
                  </div>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    {locationError}
                  </p>
                </div>
              </div>

              {/* Only show re-enable from lock icon instructions when code is 'denied' */}
              {locationErrorCode === 'denied' && (
                <div className="p-3 bg-white/90 rounded-lg border border-amber-200 text-xs text-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900">How to re-enable location:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Click the <strong>🔒 lock icon</strong> in the browser address bar (top left of URL).</li>
                    <li>Click <strong>Site settings</strong> &gt; <strong>Location</strong> &gt; set to <strong>Allow</strong>.</li>
                    <li><strong>Reload</strong> the page.</li>
                  </ol>
                </div>
              )}

              {/* "Try again" button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleLiveGps}
                  disabled={isRequestingLive}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C3B2E] text-white rounded-lg text-xs font-bold hover:bg-[#07251D] cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequestingLive ? 'animate-spin' : ''}`} />
                  <span>{isRequestingLive ? 'Checking location...' : 'Try again'}</span>
                </button>
                <span className="text-[11px] text-amber-800">or choose your city below as fallback</span>
              </div>
            </div>
          ) : userLocation.isLive && permissionState === 'granted' ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-emerald-900 text-sm">
                    GPS Active: Nearest City is {userLocation.city}
                  </div>
                  <p className="text-emerald-700 text-xs mt-0.5">
                    Real distances are calculated from your physical device coordinates (±{Math.round(userLocation.accuracy || 10)}m).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeLocationModal}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 cursor-pointer shrink-0"
              >
                Keep Active ✓
              </button>
            </div>
          ) : (
            /* Prompt State: Call getCurrentPosition directly */
            <div>
              <button
                onClick={handleLiveGps}
                disabled={isRequestingLive}
                className="w-full bg-[#FF5A1F] hover:bg-[#E04810] active:scale-[0.99] text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-75"
              >
                <Navigation className={`w-4 h-4 ${isRequestingLive ? 'animate-spin' : ''}`} />
                <span>{isRequestingLive ? 'Requesting Browser Location...' : 'Use my current location'}</span>
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-1.5">
                Calls browser geolocation to detect your nearest city and compute real driving & walking distances.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Or Choose Your City Hub
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {cityCards.map((c) => {
              const isSelected = userLocation.city?.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  onClick={() => handleCitySelect(c.name)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#0C3B2E] bg-[#0C3B2E]/5 ring-1 ring-[#0C3B2E]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{c.state}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.landmark}
                    </p>
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-[#0C3B2E] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 group-hover:text-slate-600 shrink-0">
                      Select →
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#0C3B2E]" />
            <span>Currently set to: <strong className="text-slate-900 font-bold">{userLocation.city}</strong> ({userLocation.label})</span>
          </div>
          <button
            onClick={closeLocationModal}
            className="text-xs font-semibold text-[#0C3B2E] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
