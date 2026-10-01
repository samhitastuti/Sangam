import express from 'express';

const router = express.Router();

/**
 * Common campus & metro presets for instant calibration
 */
const LOCATION_PRESETS = [
  {
    id: 'srm_ktr',
    name: 'SRM Kattankulathur Campus (Flagship)',
    city: 'Chennai',
    lat: 12.8230,
    lng: 80.0444,
    description: 'Potheri, GST Road, Chengalpattu'
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
    id: 'vellore_vit',
    name: 'VIT Vellore Campus',
    city: 'Vellore',
    lat: 12.9698,
    lng: 79.1559,
    description: 'Katpadi, Vellore'
  }
];

/**
 * GET /api/location/presets
 */
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: LOCATION_PRESETS
  });
});

/**
 * GET /api/location/detect
 * IP-based fallback when browser navigator.geolocation is restricted or times out
 */
router.get('/detect', async (req, res) => {
  try {
    // Check client headers
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // Default coordinate anchor (SRM KTR Campus) if IP lookup is private or unavailable
    let detectedLocation = {
      lat: 12.8230,
      lng: 80.0444,
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      source: 'network-fallback',
      label: 'Chennai (Default Collegiate Hub)'
    };

    // If we have an external non-loopback IP, attempt fast IP lookup with 2.5s timeout
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        const ipRes = await fetch(`https://freeipapi.com/api/json/${ip}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (ipRes.ok) {
          const geo = await ipRes.json();
          if (geo.latitude && geo.longitude) {
            detectedLocation = {
              lat: Number(geo.latitude),
              lng: Number(geo.longitude),
              city: geo.cityName || 'Current Region',
              region: geo.regionName || '',
              country: geo.countryName || 'India',
              source: 'ip-detected',
              label: `${geo.cityName || 'Local Area'} (IP-Detected)`
            };
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    res.json({
      success: true,
      data: detectedLocation
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        lat: 12.8230,
        lng: 80.0444,
        city: 'Chennai',
        source: 'srm-campus-default',
        label: 'SRM Kattankulathur Campus (Flagship)'
      }
    });
  }
});

export default router;
