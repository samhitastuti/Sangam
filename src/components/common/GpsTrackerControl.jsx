import React, { useState } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crosshair,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function GpsTrackerControl({ className = '', variant = 'full' }) {
  const {
    userLocation,
    requestLiveLocation,
    isRequestingLive,
    isTracking,
    toggleGpsTracking,
    setPreset,
    setCustomLocation,
    presets,
    locationError,
    clearError,
    lastUpdated
  } = useLocation();

  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customLat, setCustomLat] = useState('12.8230');
  const [customLng, setCustomLng] = useState('80.0444');
  const [customLabel, setCustomLabel] = useState('My Field Location');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!isNaN(Number(customLat)) && !isNaN(Number(customLng))) {
      setCustomLocation(Number(customLat), Number(customLng), customLabel);
      setShowCustomModal(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={requestLiveLocation}
          disabled={isRequestingLive}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
            userLocation?.isLive
              ? 'bg-emerald-700 text-white'
              : 'bg-[#0C3B2E] hover:bg-[#07251D] text-white'
          }`}
          title="Detect and sort opportunities by your live GPS coordinates"
        >
          <Navigation className={`w-3.5 h-3.5 ${isRequestingLive ? 'animate-spin' : ''}`} />
          <span>
            {isRequestingLive
              ? 'Acquiring GPS...'
              : userLocation?.isLive
              ? 'GPS Active'
              : 'Use GPS'}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleGpsTracking}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
            isTracking
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
              : 'bg-white text-[#57655F] border-[#0C3B2E]/20 hover:border-[#0C3B2E]'
          }`}
          title={isTracking ? 'Continuous live movement tracking is enabled' : 'Enable real-time continuous GPS tracking'}
        >
          <Radio className={`w-3 h-3 ${isTracking ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
          <span>{isTracking ? 'Tracking ON' : 'Live Track'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-xl border border-[#0C3B2E]/20 bg-gradient-to-r from-[#0C3B2E]/5 via-[#0C3B2E]/[0.02] to-white shadow-2xs ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: GPS Status & Coordinates */}
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors ${
            userLocation?.isLive ? 'bg-emerald-700 text-white' : 'bg-[#0C3B2E] text-white'
          }`}>
            {isTracking ? (
              <Radio className="w-5 h-5 text-emerald-200 animate-pulse" />
            ) : (
              <Compass className="w-5 h-5 text-[#FF5A1F]" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-bold text-sm sm:text-base text-[#141C18]">
                GPS Location & Proximity Tracking
              </h3>
              
              {userLocation?.isLive ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  <span>{userLocation?.source === 'device' ? 'Live Device GPS Active' : 'Network Geolocation (IP)'}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0C3B2E]/10 text-[#0C3B2E]">
                  Campus Reference Anchor
                </span>
              )}

              {isTracking && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  Continuous Tracking
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#57655F] mt-1">
              <span>
                Anchor: <strong className="text-[#141C18]">{userLocation?.label || 'SRM KTR Campus'}</strong>
              </span>
              <span>·</span>
              <span className="font-mono text-[11px] text-[#0C3B2E] font-semibold">
                {userLocation?.lat != null ? userLocation.lat.toFixed(4) : '--'}°N, {userLocation?.lng != null ? userLocation.lng.toFixed(4) : '--'}°E
              </span>
              {userLocation?.accuracy && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">±{Math.round(userLocation.accuracy)}m accuracy</span>
                </>
              )}
              {lastUpdated && (
                <>
                  <span>·</span>
                  <span className="text-[10px] text-stone-500">Updated {lastUpdated}</span>
                </>
              )}
            </div>

            {locationError && (
              <div className="mt-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between gap-2">
                <span>{locationError}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-[10px] font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: GPS Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* 1. Request GPS fix */}
          <button
            type="button"
            onClick={requestLiveLocation}
            disabled={isRequestingLive}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              userLocation?.isLive
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-[#0C3B2E] hover:bg-[#07251D] text-white'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isRequestingLive ? 'animate-spin' : ''}`} />
            <span>
              {isRequestingLive
                ? 'Acquiring GPS...'
                : userLocation?.isLive
                ? '✓ Refresh GPS'
                : 'Acquire Live GPS'}
            </span>
          </button>

          {/* 2. Continuous Tracking Toggle */}
          <button
            type="button"
            onClick={toggleGpsTracking}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isTracking
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-white text-[#141C18] border-[#0C3B2E]/25 hover:border-[#0C3B2E]'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTracking ? 'animate-pulse text-white' : 'text-[#FF5A1F]'}`} />
            <span>{isTracking ? 'Tracking: ON' : 'Live Tracking'}</span>
          </button>

          {/* 3. Preset Selector */}
          <select
            value={userLocation?.presetId || (userLocation?.isLive ? 'live' : 'custom')}
            onChange={(e) => {
              if (e.target.value === 'live') {
                requestLiveLocation();
              } else if (e.target.value === 'custom') {
                setShowCustomModal(true);
              } else {
                setPreset(e.target.value);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-[#0C3B2E]/25 text-[#141C18] text-xs font-semibold focus:outline-none focus:border-[#0C3B2E] cursor-pointer shadow-2xs"
          >
            {userLocation?.isLive && (
              <option value="live">📍 Live GPS Coordinates</option>
            )}
            <optgroup label="Collegiate Campus Presets">
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            <option value="custom">✏️ Enter Custom Coordinates...</option>
          </select>
        </div>

      </div>

      {/* Custom Coordinates Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-300 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-[#141C18] flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-[#FF5A1F]" />
                <span>Calibrate Custom Coordinates</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Location Label</label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded"
                  placeholder="e.g. My Hostel / SRM Kattankulathur"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded border text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#0C3B2E] text-white font-bold hover:bg-[#07251D]"
                >
                  Apply Coordinates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
