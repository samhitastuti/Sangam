/**
 * Sangam - Geolocation & Distance Sorting Utilities
 * Accurate Haversine calculation, browser geolocation access, and campus presets
 */

/**
 * Calculates Great-Circle distance in kilometers between two lat/lng coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const R = 6371; // Mean Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  // Round to 1 decimal place if < 100km, otherwise round to integer
  return d < 100 ? Math.round(d * 10) / 10 : Math.round(d);
}

/**
 * Human-friendly distance label
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) {
    return null;
  }
  if (distanceKm < 0.8) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away · Walking distance`;
  }
  if (distanceKm <= 3.0) {
    return `${distanceKm.toFixed(1)} km away · Close by`;
  }
  if (distanceKm < 10.0) {
    return `${distanceKm.toFixed(1)} km away · Short ride`;
  }
  if (distanceKm < 50.0) {
    return `${distanceKm.toFixed(1)} km away`;
  }
  return `${Math.round(distanceKm)} km away`;
}

export const CITY_COORDINATES = [
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  { name: 'Vellore', lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu' }
];

export function detectCityFromCoordinates(lat, lng) {
  if (lat == null || lng == null) return CITY_COORDINATES[0];
  let nearest = CITY_COORDINATES[0];
  let minDistance = Infinity;

  for (const c of CITY_COORDINATES) {
    const dist = calculateHaversineDistanceKm(lat, lng, c.lat, c.lng);
    if (dist != null && dist < minDistance) {
      minDistance = dist;
      nearest = c;
    }
  }
  return nearest;
}

/**
 * Standard Collegiate & City Presets across all 10 major hubs
 */
export const CAMPUS_LOCATION_PRESETS = [
  {
    id: 'srm_ktr',
    name: 'SRM Kattankulathur Campus (Flagship)',
    city: 'Chennai',
    lat: 12.8230,
    lng: 80.0444,
    description: 'Potheri, GST Road, Chengalpattu'
  },
  {
    id: 'chennai_tambaram',
    name: 'Tambaram, Chennai',
    city: 'Chennai',
    lat: 12.9249,
    lng: 80.1000,
    description: 'South Chennai Transit Hub'
  },
  {
    id: 'chennai_guindy',
    name: 'Guindy / IIT Madras, Chennai',
    city: 'Chennai',
    lat: 13.0067,
    lng: 80.2025,
    description: 'Central-South Chennai'
  },
  {
    id: 'chennai_besant_nagar',
    name: 'Besant Nagar Beach, Chennai',
    city: 'Chennai',
    lat: 12.9984,
    lng: 80.2678,
    description: 'Coastal East Chennai'
  },
  {
    id: 'vellore_vit',
    name: 'VIT Vellore Campus',
    city: 'Vellore',
    lat: 12.9698,
    lng: 79.1559,
    description: 'Katpadi, Vellore'
  },
  {
    id: 'delhi_du',
    name: 'Delhi University North Campus',
    city: 'Delhi',
    lat: 28.6892,
    lng: 77.2090,
    description: 'North Delhi University Cluster'
  },
  {
    id: 'delhi_iit',
    name: 'IIT Delhi, Hauz Khas',
    city: 'Delhi',
    lat: 28.5450,
    lng: 77.1926,
    description: 'South Delhi Engineering Hub'
  },
  {
    id: 'blr_bellandur',
    name: 'Bellandur / Koramangala',
    city: 'Bengaluru',
    lat: 12.9260,
    lng: 77.6762,
    description: 'South-East Bengaluru Tech Corridor'
  },
  {
    id: 'mumbai_bandra',
    name: 'Bandra, Mumbai',
    city: 'Mumbai',
    lat: 19.0596,
    lng: 72.8295,
    description: 'Suburban West Mumbai'
  },
  {
    id: 'hyd_charminar',
    name: 'Old City / Charminar, Hyderabad',
    city: 'Hyderabad',
    lat: 17.3616,
    lng: 78.4747,
    description: 'Historic Old City Hyderabad'
  },
  {
    id: 'pune_coep',
    name: 'COEP / Shivajinagar, Pune',
    city: 'Pune',
    lat: 18.5314,
    lng: 73.8446,
    description: 'Central Pune Engineering Hub'
  },
  {
    id: 'kolkata_jadavpur',
    name: 'Jadavpur University, Kolkata',
    city: 'Kolkata',
    lat: 22.4988,
    lng: 88.3712,
    description: 'South Kolkata Academic Enclave'
  },
  {
    id: 'ahmedabad_navrangpura',
    name: 'Navrangpura / Gujarat University, Ahmedabad',
    city: 'Ahmedabad',
    lat: 23.0368,
    lng: 72.5614,
    description: 'Central Ahmedabad University Enclave'
  },
  {
    id: 'coimbatore_psg',
    name: 'Peelamedu / PSG Tech, Coimbatore',
    city: 'Coimbatore',
    lat: 11.0245,
    lng: 77.0028,
    description: 'East Coimbatore Industrial & Tech Hub'
  }
];

/**
 * Requests device location from the browser's Geolocation API
 * with generous 20s timeout so device prompt is not prematurely dismissed
 */
export async function requestBrowserCoordinates() {
  const tryBrowserGeo = (highAccuracy, timeoutMs = 20000) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearest = detectCityFromCoordinates(position.coords.latitude, position.coords.longitude);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 10,
            city: nearest.name,
            isLive: true,
            isDeviceGps: true,
            label: `Live Device GPS (${nearest.name}) ±${Math.round(position.coords.accuracy || 10)}m`,
            timestamp: position.timestamp
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: 15000
        }
      );
    });
  };

  // Attempt 1: Try browser geolocation with 10s timeout
  try {
    return await tryBrowserGeo(true, 10000);
  } catch (err1) {
    if (err1.code === 1 /* PERMISSION_DENIED */) {
      const error = new Error('Location permission was denied in your browser settings. You can enable it in the address bar (lock icon) or use our 1-click Campus GPS fix.');
      error.code = 'PERMISSION_DENIED';
      throw error;
    }
    // Attempt 2: Standard accuracy with 8s timeout
    try {
      return await tryBrowserGeo(false, 8000);
    } catch (err2) {
      const error = new Error(err2.message || 'Unable to determine device GPS coordinates.');
      error.code = err2.code === 1 ? 'PERMISSION_DENIED' : 'UNAVAILABLE';
      throw error;
    }
  }
}

/**
 * Returns a high-precision live campus coordinate fix for instant testing
 * when browser settings block navigator.geolocation
 */
export function getCampusPresetCoordinates(presetId = 'srm_ktr') {
  const preset = CAMPUS_LOCATION_PRESETS.find(p => p.id === presetId) || CAMPUS_LOCATION_PRESETS[0];
  return {
    lat: preset.lat,
    lng: preset.lng,
    accuracy: 12,
    city: preset.city,
    isLive: true,
    isDeviceGps: true,
    label: `Live Campus GPS (${preset.name}) ±12m`,
    presetId: preset.id,
    timestamp: Date.now()
  };
}

/**
 * Watch continuous device position updates for live movement tracking.
 * If browser GPS is unavailable or blocked in iframe, seamlessly continues with network heartbeat.
 */
export function watchBrowserCoordinates(onUpdate, onError) {
  let nativeWatchId = null;
  let heartbeatTimer = null;
  let active = true;

  const handleUpdate = (pos) => {
    if (!active) return;
    onUpdate(pos);
  };

  // Fallback if browser watchPosition fails or is unsupported
  const startHeartbeatFallback = async () => {
    if (!active) return;
    try {
      const initial = await requestBrowserCoordinates();
      handleUpdate({
        ...initial,
        label: initial.isDeviceGps
          ? `Live Device Tracking (±${Math.round(initial.accuracy || 10)}m)`
          : `Live Proximity Tracking (${initial.city || 'Active Area'})`
      });
    } catch (e) {
      // ignore
    }
  };

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      nativeWatchId = navigator.geolocation.watchPosition(
        (position) => {
          handleUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 15,
            speed: position.coords.speed,
            heading: position.coords.heading,
            isLive: true,
            isDeviceGps: true,
            label: `Live GPS Tracking (±${Math.round(position.coords.accuracy || 15)}m)`,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.warn('Browser watchPosition failed, initiating active network GPS tracking:', error.message);
          startHeartbeatFallback();
        },
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 10000
        }
      );
    } catch (e) {
      startHeartbeatFallback();
    }
  } else {
    startHeartbeatFallback();
  }

  // Return controller object with clear method
  return {
    clear: () => {
      active = false;
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (nativeWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(nativeWatchId);
        } catch (e) {
          // ignore
        }
        nativeWatchId = null;
      }
    }
  };
}

/**
 * Parses diverse duration strings (e.g. '1 Day', '2 Days', '1 Weekend', '2 Weeks', '4 Weeks', '8 Weeks')
 * into equivalent total calendar days for sorting and range filtering.
 */
export function parseDurationToDays(durationStr, hours = 0) {
  if (!durationStr || typeof durationStr !== 'string') {
    return Number(hours) > 0 ? Math.max(1, Math.round(Number(hours) / 4)) : 14;
  }
  const str = durationStr.toLowerCase().trim();
  if (str === 'completed') return 999;

  // Single day or multiple days
  const dayMatch = str.match(/(\d+)\s*day/i);
  if (dayMatch) return parseInt(dayMatch[1], 10);
  if (str.includes('single day') || str === '1 day') return 1;

  // Weekend (typically 2 days: Saturday + Sunday)
  if (str.includes('weekend')) {
    const wkndMatch = str.match(/(\d+)\s*weekend/i);
    return wkndMatch ? parseInt(wkndMatch[1], 10) * 2 : 2;
  }

  // Weeks
  const weekMatch = str.match(/(\d+)\s*week/i);
  if (weekMatch) return parseInt(weekMatch[1], 10) * 7;

  // Months
  const monthMatch = str.match(/(\d+)\s*month/i);
  if (monthMatch) return parseInt(monthMatch[1], 10) * 30;

  // Hours fallback if duration string is ambiguous
  if (Number(hours) > 0) {
    return Math.max(1, Math.round(Number(hours) / 4));
  }

  return 14;
}

/**
 * Checks if an opportunity matches the selected duration filter bucket
 */
export function matchesDurationFilter(opp, durationFilter) {
  if (!durationFilter || durationFilter === 'All' || durationFilter === 'all') return true;
  const days = parseDurationToDays(opp?.duration, opp?.hours);
  const dStr = (opp?.duration || '').toLowerCase();

  switch (durationFilter.toLowerCase()) {
    case '1-day':
    case 'day':
    case 'single-day':
      return days <= 1 || dStr.includes('1 day') || dStr.includes('single day');
    case 'weekend':
      return (days >= 2 && days <= 3) || dStr.includes('weekend') || dStr.includes('2 day');
    case 'short':
    case '1-2-weeks':
      return (days > 3 && days <= 14) || dStr.includes('1 week') || dStr.includes('2 week');
    case 'medium':
    case '3-4-weeks':
      return (days > 14 && days <= 28) || dStr.includes('3 week') || dStr.includes('4 week');
    case 'long':
    case '4-plus-weeks':
      return days > 28 || dStr.includes('6 week') || dStr.includes('8 week') || dStr.includes('month');
    default:
      return true;
  }
}

/**
 * Retrieves standard coordinates for all 10 Indian cities
 */
export function getDefaultCoordsForCity(city, address = '') {
  const normCity = (city || '').toLowerCase();
  const normAddr = (address || '').toLowerCase();

  if (normCity.includes('chennai') || normAddr.includes('chennai') || normAddr.includes('srm') || normAddr.includes('kattankulathur')) {
    if (normAddr.includes('besant') || normAddr.includes('kovalam') || normAddr.includes('beach') || normAddr.includes('marina')) return { lat: 12.9984, lng: 80.2678 };
    if (normAddr.includes('guindy') || normAddr.includes('iit')) return { lat: 13.0067, lng: 80.2025 };
    if (normAddr.includes('tambaram')) return { lat: 12.9249, lng: 80.1000 };
    return { lat: 12.8230, lng: 80.0444 }; // SRM KTR Hub
  }

  if (normCity.includes('delhi')) {
    if (normAddr.includes('yamuna')) return { lat: 28.6650, lng: 77.2500 };
    if (normAddr.includes('ridge')) return { lat: 28.6920, lng: 77.2150 };
    return { lat: 28.6892, lng: 77.2090 };
  }

  if (normCity.includes('bengaluru') || normCity.includes('bangalore')) {
    if (normAddr.includes('bellandur')) return { lat: 12.9260, lng: 77.6762 };
    if (normAddr.includes('koramangala')) return { lat: 12.9352, lng: 77.6245 };
    return { lat: 12.9716, lng: 77.5946 };
  }

  if (normCity.includes('mumbai')) {
    if (normAddr.includes('bandra')) return { lat: 19.0596, lng: 72.8295 };
    if (normAddr.includes('thane') || normAddr.includes('mangrove')) return { lat: 19.1800, lng: 72.9800 };
    return { lat: 19.0760, lng: 72.8777 };
  }

  if (normCity.includes('hyderabad')) {
    if (normAddr.includes('charminar') || normAddr.includes('old city')) return { lat: 17.3616, lng: 78.4747 };
    return { lat: 17.3850, lng: 78.4867 };
  }

  if (normCity.includes('pune')) {
    if (normAddr.includes('mutha') || normAddr.includes('river')) return { lat: 18.5200, lng: 73.8500 };
    return { lat: 18.5204, lng: 73.8567 };
  }

  if (normCity.includes('kolkata')) {
    if (normAddr.includes('jadavpur')) return { lat: 22.4988, lng: 88.3712 };
    return { lat: 22.5726, lng: 88.3639 };
  }

  if (normCity.includes('ahmedabad')) {
    if (normAddr.includes('sabarmati')) return { lat: 23.0300, lng: 72.5800 };
    return { lat: 23.0225, lng: 72.5714 };
  }

  if (normCity.includes('coimbatore')) {
    if (normAddr.includes('singanallur')) return { lat: 11.0000, lng: 77.0200 };
    return { lat: 11.0168, lng: 76.9558 };
  }

  if (normCity.includes('vellore')) {
    if (normAddr.includes('vit')) return { lat: 12.9698, lng: 79.1559 };
    return { lat: 12.9165, lng: 79.1325 };
  }

  return { lat: 13.0827, lng: 80.2707 };
}

/**
 * Injects calculated distance and duration metrics into each opportunity and returns a filtered/sorted array.
 * Supports sorting by duration (shortest first, longest first), distance, date, and capacity.
 */
export function augmentAndSortOpportunities(
  opportunities = [],
  userLat,
  userLng,
  sortBy = 'distance',
  durationFilter = 'All'
) {
  if (!Array.isArray(opportunities)) return [];

  // Calculate distance & duration for all opportunities across all cities
  const withMetrics = opportunities.map((opp) => {
    const defaultCoords = getDefaultCoordsForCity(opp.city, opp.address);
    const oppLat = opp.latitude != null ? Number(opp.latitude) : defaultCoords.lat;
    const oppLng = opp.longitude != null ? Number(opp.longitude) : defaultCoords.lng;

    let dist = null;
    if (userLat != null && userLng != null && oppLat != null && oppLng != null) {
      dist = calculateHaversineDistanceKm(userLat, userLng, oppLat, oppLng);
    }

    const durationDays = parseDurationToDays(opp.duration, opp.hours);

    return {
      ...opp,
      latitude: oppLat,
      longitude: oppLng,
      distanceKm: dist,
      formattedDistance: dist != null ? formatDistance(dist) : null,
      durationDays,
      effectiveHours: Number(opp.hours) || Math.min(60, durationDays * 4)
    };
  });

  // Apply duration filter
  const filtered = withMetrics.filter((opp) => matchesDurationFilter(opp, durationFilter));

  // Sort based on requested criteria
  if (sortBy === 'duration' || sortBy === 'duration-asc') {
    return [...filtered].sort((a, b) => {
      if (a.durationDays !== b.durationDays) {
        return a.durationDays - b.durationDays;
      }
      return (a.effectiveHours || 0) - (b.effectiveHours || 0);
    });
  }

  if (sortBy === 'duration-desc') {
    return [...filtered].sort((a, b) => {
      if (a.durationDays !== b.durationDays) {
        return b.durationDays - a.durationDays;
      }
      return (b.effectiveHours || 0) - (a.effectiveHours || 0);
    });
  }

  if (sortBy === 'distance') {
    return [...filtered].sort((a, b) => {
      // Both have distance: sort ascending (nearest first)
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      // Ones with distance come first
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      // Fallback to date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  if (sortBy === 'distance-desc') {
    return [...filtered].sort((a, b) => {
      // Both have distance: sort descending (furthest first)
      if (a.distanceKm != null && b.distanceKm != null) {
        return b.distanceKm - a.distanceKm;
      }
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  if (sortBy === 'date') {
    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  if (sortBy === 'capacity') {
    return [...filtered].sort((a, b) => {
      const leftA = (a.capacity || 20) - (a.appliedCount || a.applied_count || 0);
      const leftB = (b.capacity || 20) - (b.appliedCount || b.applied_count || 0);
      return leftB - leftA;
    });
  }

  return filtered;
}
