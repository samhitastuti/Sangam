import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  CAMPUS_LOCATION_PRESETS,
  CITY_COORDINATES,
  requestBrowserCoordinates,
  watchBrowserCoordinates,
  detectCityFromCoordinates
} from '../utils/distance.js';
import { useAuth } from './AuthContext.jsx';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { currentUser } = useAuth();

  // Initial location resolution from localStorage or default
  const getInitialLocation = () => {
    try {
      const saved = localStorage.getItem('sangam_location_choice');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.lat && parsed.lng) return parsed;
      }
    } catch (e) {
      // ignore
    }
    // Default initial hub (can be switched instantly to any city)
    const defaultPreset = CAMPUS_LOCATION_PRESETS[0];
    return {
      lat: defaultPreset.lat,
      lng: defaultPreset.lng,
      label: defaultPreset.name,
      city: defaultPreset.city,
      isLive: false,
      hasExplicitChoice: false,
      presetId: defaultPreset.id,
      accuracy: null,
      source: 'default'
    };
  };

  const [userLocation, setUserLocation] = useState(getInitialLocation);
  const [showLocationModal, setShowLocationModal] = useState(() => {
    // Show location picker on first load if user has never chosen their location
    try {
      return !localStorage.getItem('sangam_location_choice');
    } catch {
      return false;
    }
  });

  const [sortBy, setSortBy] = useState('distance');
  const [isRequestingLive, setIsRequestingLive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [hasPrompted, setHasPrompted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showLocationBanner, setShowLocationBanner] = useState(true);

  const watchIdRef = useRef(null);

  // If user belongs to a specific college or home city, adjust default preset if no explicit choice exists
  useEffect(() => {
    if (currentUser?.college && !userLocation.hasExplicitChoice && !userLocation.isLive) {
      const col = currentUser.college.toLowerCase();
      let matchedPreset = null;
      if (col.includes('vit') || col.includes('vellore')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'vellore_vit');
      } else if (col.includes('delhi')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'delhi_du');
      } else if (col.includes('pune') || col.includes('coep')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'pune_coep');
      } else if (col.includes('kolkata') || col.includes('jadavpur')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'kolkata_jadavpur');
      } else if (col.includes('bengaluru') || col.includes('bangalore') || col.includes('iisc') || col.includes('rv')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'blr_bellandur');
      } else if (col.includes('mumbai') || col.includes('bombay')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'mumbai_bandra');
      } else if (col.includes('hyderabad')) {
        matchedPreset = CAMPUS_LOCATION_PRESETS.find(p => p.id === 'hyd_charminar');
      }

      if (matchedPreset) {
        const updated = {
          lat: matchedPreset.lat,
          lng: matchedPreset.lng,
          label: matchedPreset.name,
          city: matchedPreset.city,
          isLive: false,
          hasExplicitChoice: false,
          presetId: matchedPreset.id,
          source: 'college-profile'
        };
        setUserLocation(updated);
      }
    }
  }, [currentUser?.college]);

  const [locationErrorCode, setLocationErrorCode] = useState(null); // 'denied' | 'unavailable' | 'timeout' | 'insecure' | 'unsupported'

  // Whether we have confirmed the user was actually prompted and denied (not just a stale cache)
  const [confirmedDenied, setConfirmedDenied] = useState(false);

  // Exact requestLocation function conforming to specifications
  const requestLocation = ({ onSuccess, onError }) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return onError('unsupported', 'Geolocation is not supported in this browser.');
    }

    // Only block on insecure context if we are SURE — localhost is always secure,
    // and some browsers don't set isSecureContext correctly for 127.0.0.1 or 0.0.0.0.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const hostname = window.location.hostname;
      // 0.0.0.0 is NOT considered a secure context by most browsers and will silently deny geolocation.
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      if (!isLocalhost) {
        return onError('insecure', 'Please use http://localhost:3000 instead of 0.0.0.0 or network IP to use location.');
      }
    }

    // Always call getCurrentPosition — this is the ONLY way to trigger the browser
    // permission prompt. Do NOT gate this behind navigator.permissions.query()
    // because the Permissions API can report stale/cached 'denied' state even when
    // the browser would actually show a prompt if getCurrentPosition is called.
    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (err) => {
        console.log('Geolocation error:', err.code, err.message);
        if (err.code === 1) {
          setConfirmedDenied(true);
          onError('denied', 'Location is blocked for this site. Allow it from the lock icon in the address bar, then reload.');
        } else if (err.code === 2) {
          onError('unavailable', 'Your device could not determine a location. Check that system location is on.');
        } else {
          onError('timeout', 'Location request timed out. Try again.');
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Request single live coordinate fix from the device (triggered by user button click)
  const requestLiveLocation = () => {
    setIsRequestingLive(true);
    setLocationError(null);
    setLocationErrorCode(null);

    return new Promise((resolve) => {
      requestLocation({
        onSuccess: (lat, lng, accuracy = 10) => {
          setIsRequestingLive(false);
          const detectedCity = detectCityFromCoordinates(lat, lng);
          const updated = {
            lat,
            lng,
            label: `Live Device GPS (${detectedCity.name})`,
            city: detectedCity.name,
            isLive: true,
            hasExplicitChoice: true,
            accuracy: accuracy || 10,
            presetId: 'live',
            source: 'device'
          };
          setUserLocation(updated);
          setSortBy('distance');
          setPermissionState('granted');
          setLocationError(null);
          setLocationErrorCode(null);
          setShowLocationBanner(false);
          setShowLocationModal(false);
          setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          try {
            localStorage.setItem('sangam_location_choice', JSON.stringify(updated));
          } catch (e) {}
          resolve(updated);
        },
        onError: (code, message) => {
          setIsRequestingLive(false);
          setLocationErrorCode(code);
          setLocationError(message);
          if (code === 'denied') {
            setPermissionState('denied');
          }
          resolve(null);
        }
      });
    });
  };

  // Do not pre-check navigator.permissions and bail out early on denied.
  // Only listen to permission change event so the UI updates without a reload.
  // IMPORTANT: We only trust 'granted' from the Permissions API. A 'denied' result
  // may be stale (cached from a previous session) and the browser might still show
  // the prompt if getCurrentPosition is called from a user gesture. So we keep
  // permissionState as 'prompt' unless we get 'granted' or we have confirmedDenied
  // from an actual getCurrentPosition error.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((status) => {
          // Only trust 'granted' — treat 'denied' and 'prompt' both as 'prompt'
          // so the UI doesn't prematurely show the blocked state
          if (status.state === 'granted') {
            setPermissionState('granted');
          }
          // Listen for future changes (e.g. user allows from site settings)
          status.onchange = () => {
            if (status.state === 'granted') {
              setPermissionState('granted');
              setLocationError(null);
              setLocationErrorCode(null);
              setConfirmedDenied(false);
            } else if (status.state === 'denied') {
              // Only mark as denied if we also have confirmation from getCurrentPosition
              if (confirmedDenied) {
                setPermissionState('denied');
              }
            }
          };
        })
        .catch(() => {});
    }
  }, [confirmedDenied]);

  const openLocationModal = () => setShowLocationModal(true);
  const closeLocationModal = () => setShowLocationModal(false);

  // Switch active city seamlessly across all 10 cities
  const switchCity = (cityName) => {
    stopGpsTracking();
    const cityCoord = CITY_COORDINATES.find(c => c.name.toLowerCase() === cityName.toLowerCase()) || { lat: 13.0827, lng: 80.2707, name: cityName };
    const matchingPreset = CAMPUS_LOCATION_PRESETS.find(p => p.city.toLowerCase() === cityName.toLowerCase());

    const lat = matchingPreset ? matchingPreset.lat : cityCoord.lat;
    const lng = matchingPreset ? matchingPreset.lng : cityCoord.lng;
    const label = matchingPreset ? matchingPreset.name : `${cityName} City Hub`;

    const updated = {
      lat,
      lng,
      label,
      city: cityName,
      isLive: false,
      hasExplicitChoice: true,
      presetId: matchingPreset ? matchingPreset.id : 'city-' + cityName.toLowerCase(),
      accuracy: null,
      source: 'city-selection'
    };

    setUserLocation(updated);
    setSortBy('distance');
    setLocationError(null);
    setShowLocationModal(false);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

    try {
      localStorage.setItem('sangam_location_choice', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Start continuous GPS tracking via watchPosition / active network pulse
  const startGpsTracking = () => {
    if (watchIdRef.current !== null) return;
    setIsTracking(true);
    setLocationError(null);

    const watcher = watchBrowserCoordinates(
      (pos) => {
        const detected = detectCityFromCoordinates(pos.lat, pos.lng);
        setUserLocation((prev) => ({
          ...prev,
          lat: pos.lat,
          lng: pos.lng,
          city: pos.city || detected.name,
          accuracy: pos.accuracy,
          isLive: true,
          label: pos.label || (pos.isDeviceGps ? `Live Device GPS (${pos.city || detected.name}) ±${Math.round(pos.accuracy)}m` : `Live Network GPS (${pos.city || 'Local Area'})`),
          presetId: 'live',
          source: pos.isDeviceGps ? 'device' : 'ip'
        }));
        setSortBy('distance');
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      },
      (err) => {
        console.warn('GPS continuous watch notice:', err.message);
      }
    );

    watchIdRef.current = watcher;
  };

  // Stop continuous GPS tracking
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      if (typeof watchIdRef.current?.clear === 'function') {
        watchIdRef.current.clear();
      } else if (typeof navigator !== 'undefined' && navigator.geolocation && typeof watchIdRef.current === 'number') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Toggle tracking mode
  const toggleGpsTracking = () => {
    if (isTracking) {
      stopGpsTracking();
    } else {
      startGpsTracking();
    }
  };

  // 1-Click Campus / Simulated GPS Fix (Unblocks user immediately if browser settings deny GPS)
  const useCampusGpsFix = (presetId = 'srm_ktr') => {
    stopGpsTracking();
    const found = CAMPUS_LOCATION_PRESETS.find(p => p.id === presetId) || CAMPUS_LOCATION_PRESETS[0];
    const updated = {
      lat: found.lat,
      lng: found.lng,
      label: `Live Campus GPS (${found.name})`,
      city: found.city,
      isLive: true,
      hasExplicitChoice: true,
      presetId: found.id,
      accuracy: 12,
      source: 'campus-fix'
    };
    setUserLocation(updated);
    setLocationError(null);
    setPermissionState('granted');
    setShowLocationModal(false);
    setShowLocationBanner(false);
    setSortBy('distance');
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    try {
      localStorage.setItem('sangam_location_choice', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    return updated;
  };

  // Set predefined campus/city preset
  const setPreset = (presetId) => {
    stopGpsTracking();
    const found = CAMPUS_LOCATION_PRESETS.find(p => p.id === presetId);
    if (found) {
      setUserLocation({
        lat: found.lat,
        lng: found.lng,
        label: found.name,
        city: found.city,
        isLive: false,
        presetId: found.id,
        accuracy: null,
        source: 'preset'
      });
      setLocationError(null);
      setSortBy('distance');
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Set custom coordinates (e.g. manually entered or geocoded)
  const setCustomLocation = (lat, lng, label = 'Custom Pinned Venue', city = 'Custom') => {
    stopGpsTracking();
    const nearest = detectCityFromCoordinates(Number(lat), Number(lng));
    setUserLocation({
      lat: Number(lat),
      lng: Number(lng),
      label,
      city: city !== 'Custom' ? city : nearest.name,
      isLive: true,
      presetId: 'custom',
      accuracy: 25,
      source: 'custom'
    });
    setLocationError(null);
    setSortBy('distance');
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  };

  const clearError = () => setLocationError(null);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        setUserLocation,
        requestLiveLocation,
        startGpsTracking,
        stopGpsTracking,
        toggleGpsTracking,
        isTracking,
        setPreset,
        useCampusGpsFix,
        switchCity,
        setCustomLocation,
        isRequestingLive,
        locationError,
        locationErrorCode,
        clearError,
        hasPrompted,
        permissionState,
        showLocationBanner,
        setShowLocationBanner,
        showLocationModal,
        openLocationModal,
        closeLocationModal,
        sortBy,
        setSortBy,
        lastUpdated,
        presets: CAMPUS_LOCATION_PRESETS,
        allCities: CITY_COORDINATES.map(c => c.name)
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
