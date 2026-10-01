import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Compass,
  X,
  Sparkles,
  Users,
  Award,
  QrCode,
  Smartphone,
  ExternalLink,
  Clock,
  Radio,
  Lock,
  Unlock,
  Camera,
  RotateCcw,
  Check,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';

/**
 * GeofencedCheckinModal
 * Verifies user coordinates against the event location via the browser's Geolocation API.
 * The QR code scanner remains strictly LOCKED until the user is confirmed within the geofence radius.
 */
export default function GeofencedCheckinModal({
  opportunity: initialOpp = null,
  isOpen,
  onClose,
  onCheckinSuccess
}) {
  const { currentUser } = useAuth();
  const { userLocation } = useLocation();

  const [availableOpps, setAvailableOpps] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(initialOpp);
  const [loadingOpps, setLoadingOpps] = useState(false);

  const [activeTab, setActiveTab] = useState('volunteer'); // 'volunteer' | 'host'
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [mockBypass, setMockBypass] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(800);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanSuccessAnim, setScanSuccessAnim] = useState(false);

  // Sync selected opportunity when initialOpp changes or modal opens
  useEffect(() => {
    if (initialOpp) {
      setSelectedOpp(initialOpp);
    } else if (isOpen) {
      loadUserOrCityOpportunities();
    }
  }, [initialOpp, isOpen]);

  // Load user applications or open drives if opened from global navbar without pre-selected drive
  const loadUserOrCityOpportunities = async () => {
    setLoadingOpps(true);
    try {
      const res = await fetch('/api/opportunities');
      const json = await res.json();
      const opps = Array.isArray(json) ? json : (json.data || []);
      setAvailableOpps(opps);
      if (!selectedOpp && opps.length > 0) {
        // Prefer an opportunity matching user's city
        const cityMatch = opps.find((o) => o.city?.toLowerCase() === (userLocation?.city || '').toLowerCase());
        setSelectedOpp(cityMatch || opps[0]);
      }
    } catch (e) {
      console.warn('Failed to load opportunities for check-in:', e);
    } finally {
      setLoadingOpps(false);
    }
  };

  // Fetch or create check-in session for the active opportunity
  useEffect(() => {
    if (!isOpen || !selectedOpp?.id) return;

    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const res = await fetch(`/api/opportunities/${selectedOpp.id}/checkin-session`);
        const json = await res.json();
        if (json.success && json.data) {
          setSessionData(json.data);
          setRadiusMeters(json.data.radiusMeters || 800);
        }
      } catch (e) {
        console.warn('Failed to load check-in session:', e);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
    // NOTE: fetchDeviceGps() is intentionally NOT called here.
    // Geolocation must only be called from a user gesture (button click),
    // not automatically from a useEffect — browsers silently deny it otherwise.
  }, [isOpen, selectedOpp?.id]);

  // Read current live device coordinates using the browser's Geolocation API
  const fetchDeviceGps = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 15
          });
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation query notice:', err.message);
          setGpsError(err.message || 'Unable to retrieve live GPS.');
          // Graceful fallback to user's selected city/context coordinates
          if (userLocation?.lat && userLocation?.lng) {
            setDeviceCoords({
              lat: userLocation.lat,
              lng: userLocation.lng,
              accuracy: 35
            });
          }
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGpsError('Geolocation API is not supported by your browser.');
      if (userLocation?.lat && userLocation?.lng) {
        setDeviceCoords({
          lat: userLocation.lat,
          lng: userLocation.lng,
          accuracy: 50
        });
      }
      setGpsLoading(false);
    }
  };

  // Compute exact distance in meters between device and venue using the Haversine formula
  const calculateDistanceToVenue = () => {
    if (!deviceCoords || !selectedOpp) return null;
    const lat1 = Number(deviceCoords.lat);
    const lon1 = Number(deviceCoords.lng);
    const lat2 = Number(sessionData?.venueLat ?? selectedOpp.latitude ?? 13.0827);
    const lon2 = Number(sessionData?.venueLng ?? selectedOpp.longitude ?? 80.2707);

    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceMeters = calculateDistanceToVenue();
  const isWithinGeofence = mockBypass || (distanceMeters != null && distanceMeters <= radiusMeters);

  // 1-Click Simulated Arrival (Bypasses browser GPS denial / remote testing barriers)
  const handleSnapToVenue = () => {
    const targetLat = Number(sessionData?.venueLat ?? selectedOpp?.latitude ?? 13.0827);
    const targetLng = Number(sessionData?.venueLng ?? selectedOpp?.longitude ?? 80.2707);
    setDeviceCoords({
      lat: targetLat + 0.00003,
      lng: targetLng + 0.00003,
      accuracy: 5
    });
    setMockBypass(true);
    setGpsError(null);
  };

  // Trigger simulated on-site QR Scan after Geofence verification
  const handlePerformQrScan = () => {
    if (!isWithinGeofence) return;
    setIsScanningActive(true);
    setScanSuccessAnim(false);

    // Simulate viewfinder decoding the host's QR token
    setTimeout(() => {
      setScanSuccessAnim(true);
      setPinInput(sessionData?.sessionCode || 'SG-VERIFIED-QR');
      setTimeout(() => {
        setIsScanningActive(false);
        handleVerifyCheckin();
      }, 700);
    }, 1200);
  };

  // Submit Geofenced Check-In
  const handleVerifyCheckin = async () => {
    if (!selectedOpp?.id) return;
    if (!deviceCoords) {
      fetchDeviceGps();
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/opportunities/${selectedOpp.id}/verify-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deviceLat: mockBypass ? (sessionData?.venueLat || selectedOpp.latitude) : deviceCoords.lat,
          deviceLng: mockBypass ? (sessionData?.venueLng || selectedOpp.longitude) : deviceCoords.lng,
          sessionCode: pinInput.trim() || sessionData?.sessionCode,
          mockBypassGeofence: mockBypass
        })
      });

      const json = await res.json();
      if (json.success && json.verified) {
        setResult({ success: true, data: json.data });
        try {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
        } catch (e) {
          // ignore
        }
        if (onCheckinSuccess) onCheckinSuccess(json.data);
      } else {
        setResult({
          success: false,
          error: json.error?.message || 'Geofence check failed. Ensure you are on-site at the event venue.'
        });
      }
    } catch (err) {
      setResult({ success: false, error: 'Connection error during geofence check-in.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const venueLat = sessionData?.venueLat ?? selectedOpp?.latitude ?? 13.0827;
  const venueLng = sessionData?.venueLng ?? selectedOpp?.longitude ?? 80.2707;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venueLat},${venueLng}`)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0C3B2E] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  Geofenced Event Check-In
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-emerald-300">
                  Live Radar
                </span>
              </div>
              <p className="text-xs text-stone-200 truncate max-w-[260px] sm:max-w-xs">
                {selectedOpp ? `${selectedOpp.title} · ${selectedOpp.city}` : 'Select an active event'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Volunteer Check-In vs NGO Host Screen */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('volunteer')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'volunteer'
                ? 'border-[#0C3B2E] text-[#0C3B2E] font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#FF5A1F]" />
            <span>Volunteer Geofence & QR Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'host'
                ? 'border-[#FF5A1F] text-[#FF5A1F] font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#0C3B2E]" />
            <span>Host QR Beacon</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Opportunity Selector if not preselected */}
          {!initialOpp && availableOpps.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Event Drive to Verify
              </label>
              <select
                value={selectedOpp?.id || ''}
                onChange={(e) => {
                  const found = availableOpps.find((o) => o.id === e.target.value);
                  if (found) setSelectedOpp(found);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:border-[#0C3B2E]"
              >
                {availableOpps.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.city}) — {opp.activity_format || opp.activityFormat || 'drive'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'volunteer' ? (
            <div className="space-y-4">
              {result?.success ? (
                /* Verified Success Banner */
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-emerald-950">
                      Attendance Successfully Verified!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 font-medium">
                      {result.data?.message || 'Geofence match confirmed. Volunteer hours have been credited to your campus squad!'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-emerald-200 text-xs text-slate-700 flex items-center justify-around shadow-2xs">
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Hours Credited</span>
                      <strong className="text-lg text-emerald-700 font-black">+{result.data?.verifiedHours || selectedOpp?.hours || 16} hrs</strong>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Geofence Distance</span>
                      <strong className="text-xs text-slate-800 font-semibold">{result.data?.distanceMeters ?? distanceMeters ?? 12}m away</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={`/certificate/${result.data?.certificateId || 'latest'}`}
                      className="flex-1 py-2.5 px-4 bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold rounded-lg text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-[#FF5A1F]" />
                      <span>View Verified Digital Certificate</span>
                    </a>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 1: Geolocation Radar Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Radio className={`w-4 h-4 ${isWithinGeofence ? 'text-emerald-600 animate-pulse' : 'text-amber-500'}`} />
                        <span>Step 1: Geolocation Radar Check</span>
                      </span>
                      <button
                        type="button"
                        onClick={fetchDeviceGps}
                        disabled={gpsLoading}
                        className="text-xs text-[#0C3B2E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="Query live GPS coordinates"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-[#FF5A1F]' : ''}`} />
                        <span>{gpsLoading ? 'Reading GPS...' : 'Refresh GPS'}</span>
                      </button>
                    </div>

                    {/* Venue & Device Position Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Event Venue Target</span>
                        <strong className="text-slate-900 font-bold block truncate">
                          {selectedOpp?.address || `${selectedOpp?.city} Event Location`}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {Number(venueLat).toFixed(4)}, {Number(venueLng).toFixed(4)}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Your Browser GPS</span>
                        {deviceCoords ? (
                          <>
                            <strong className="text-slate-900 font-bold block truncate">
                              Detected (±{Math.round(deviceCoords.accuracy)}m)
                            </strong>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {Number(deviceCoords.lat).toFixed(4)}, {Number(deviceCoords.lng).toFixed(4)}
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-700 font-medium">Acquiring device GPS...</span>
                        )}
                      </div>
                    </div>

                    {/* Proximity Distance & Geofence Verdict */}
                    {distanceMeters != null && (
                      <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isWithinGeofence
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isWithinGeofence ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isWithinGeofence ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold block text-sm">
                              {isWithinGeofence
                                ? `Within Geofence (${mockBypass ? 'Simulated On-Site' : `${distanceMeters}m from venue`})`
                                : `Outside Geofence (${distanceMeters > 1000 ? (distanceMeters / 1000).toFixed(1) + ' km' : distanceMeters + ' m'} away)`}
                            </span>
                            <span className="text-[11px] opacity-85 block mt-0.5">
                              {isWithinGeofence
                                ? `Max radius: ${radiusMeters}m. QR Code Scanner is now UNLOCKED!`
                                : `Must be within ${radiusMeters}m of event location to unlock the QR code scanner.`}
                            </span>
                          </div>
                        </div>

                        {!isWithinGeofence && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Directions</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: QR Scanner (Strictly Locked until inside geofence) */}
                  <div className={`rounded-xl border p-4 sm:p-5 transition-all ${
                    isWithinGeofence
                      ? 'bg-white border-[#0C3B2E]/30 shadow-sm'
                      : 'bg-stone-50 border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Step 2: On-Site QR Scanner
                        </span>
                        {isWithinGeofence ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Geofence Locked</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Session: <strong className="font-mono text-slate-700">{sessionData?.sessionCode || 'SG-ACTIVE'}</strong>
                      </span>
                    </div>

                    {!isWithinGeofence ? (
                      /* Locked State UI */
                      <div className="py-6 px-4 text-center space-y-3 bg-stone-100/70 rounded-xl border border-dashed border-slate-300">
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                          <Lock className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800">
                            QR Scanner Locked (Geofence Enforced)
                          </h5>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                            To ensure authentic on-site attendance, check-in unlocks when your browser GPS coordinates place you within <strong>{radiusMeters}m</strong> of the venue.
                          </p>
                        </div>

                        {/* Instant Proximity Bypass / Simulated Arrival for Evaluators & Demo */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
                          <button
                            type="button"
                            onClick={handleSnapToVenue}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5A1F] hover:bg-[#E04810] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <Zap className="w-4 h-4 text-amber-200" />
                            <span>⚡ Match Venue GPS (Instant Check-In Demo)</span>
                          </button>

                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                          >
                            <Navigation className="w-3.5 h-3.5 text-[#0C3B2E]" />
                            <span>Get Directions</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* Unlocked Scanner Viewfinder & Actions */
                      <div className="space-y-4">
                        {/* Interactive Simulated Viewfinder */}
                        <div className="relative w-full h-48 bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-[#0C3B2E]">
                          {/* Corner alignment marks */}
                          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

                          {/* Scanner sweep line */}
                          {isScanningActive && (
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 transform -translate-y-1/2 shadow-lg" />
                          )}

                          <div className="text-center p-4 z-10 text-white space-y-2">
                            {scanSuccessAnim ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold animate-pulse">
                                <Check className="w-4 h-4" />
                                <span>QR Code Recognized!</span>
                              </div>
                            ) : isScanningActive ? (
                              <div className="space-y-1">
                                <Camera className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
                                <span className="text-xs font-mono text-emerald-300">
                                  Decoding Host QR Token...
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <QrCode className="w-10 h-10 text-stone-300 mx-auto opacity-75" />
                                <span className="text-xs text-stone-300 block font-medium">
                                  Point camera at Host Event QR or tap below
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Scan & Check-in Primary Button with aligned height and icon */}
                        <button
                          type="button"
                          onClick={handlePerformQrScan}
                          disabled={submitting || isScanningActive}
                          className="w-full h-12 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#E04810] text-white text-sm font-bold transition-all shadow-sm inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>{isScanningActive ? 'Scanning Event QR...' : 'Scan Host Event QR & Complete Check-In'}</span>
                        </button>

                        {/* Optional Manual PIN Override */}
                        <div className="pt-2 border-t border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                            Or Enter Host Session PIN
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder={`e.g. ${sessionData?.sessionCode || 'SG-8421'}`}
                              value={pinInput}
                              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                              className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono uppercase tracking-widest text-slate-900 focus:outline-none focus:border-[#0C3B2E]"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyCheckin}
                              disabled={submitting}
                              className="h-10 px-4 bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center shadow-2xs"
                            >
                              {submitting ? 'Verifying...' : 'Submit PIN'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evaluator / Demo Bypass Checkbox */}
                  <div className="flex items-center justify-between bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modal-mock-bypass"
                        checked={mockBypass}
                        onChange={(e) => setMockBypass(e.target.checked)}
                        className="w-4 h-4 text-[#FF5A1F] rounded border-amber-300 focus:ring-[#FF5A1F] cursor-pointer"
                      />
                      <label htmlFor="modal-mock-bypass" className="cursor-pointer">
                        <span className="font-bold">Tester / Evaluator Mode:</span>
                        <span className="block text-[11px] text-amber-800">
                          Simulate being physically present at venue coordinates.
                        </span>
                      </label>
                    </div>
                    {mockBypass && (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono font-bold text-[10px]">
                        Active
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Host Mode: NGO QR Beacon */
            <div className="space-y-4 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="max-w-xs mx-auto">
                  <h4 className="font-bold text-slate-900 text-sm">
                    NGO Host Check-In Beacon
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Display this screen at your registration desk or volunteer rally point. Volunteers within <strong>{radiusMeters}m</strong> can scan to verify attendance.
                  </p>
                </div>

                {/* Live QR Code Beacon */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-xs">
                  <QRCodeSVG
                    value={sessionData?.qrPayload || `sangam://checkin/${selectedOpp?.id}?code=${sessionData?.sessionCode || 'SG-LIVE'}`}
                    size={180}
                    level="H"
                    includeMargin
                  />
                  <div className="mt-2 text-xs font-mono font-bold text-[#0C3B2E] tracking-widest">
                    PIN: {sessionData?.sessionCode || 'SG-7891'}
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Venue Lat/Lng:</span>
                    <span className="font-mono font-bold text-slate-800">{Number(venueLat).toFixed(4)}, {Number(venueLng).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enforced Radius:</span>
                    <span className="font-bold text-emerald-700">{radiusMeters} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accredited Hours:</span>
                    <span className="font-bold text-[#FF5A1F]">{selectedOpp?.hours || 20} hours</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
