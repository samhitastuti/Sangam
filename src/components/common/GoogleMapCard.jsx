import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Compass, Bus, Car } from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapCard({
  latitude,
  longitude,
  title,
  address,
  city,
  userLocation = null,
  height = '240px'
}) {
  const [mapError, setMapError] = useState(false);

  const lat = latitude != null ? Number(latitude) : 13.0827;
  const lng = longitude != null ? Number(longitude) : 80.2707;

  // Directions destination param
  const destCoords = `${lat},${lng}`;
  const originCoords = userLocation?.lat && userLocation?.lng 
    ? `${userLocation.lat},${userLocation.lng}` 
    : '';

  const directionsUrl = originCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originCoords)}&destination=${encodeURIComponent(destCoords)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ? `${address}, ${city}` : `${title}, ${city}`)}`;

  if (mapError || !MAPS_API_KEY) {
    return (
      <div className="rounded-xl border border-[#0C3B2E]/15 bg-[#FBF9F5] p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-bold text-[#0C3B2E] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FF5A1F]" />
            <span>Venue: {title}</span>
          </div>
          <span className="text-[11px] text-[#57655F]">📍 {city}</span>
        </div>
        <p className="text-[#57655F]">{address}</p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#FF5A1F] hover:text-[#E04810] font-bold"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#0C3B2E]/20 bg-white shadow-xs space-y-2">
      {/* Map viewport with explicit height to prevent height collapse */}
      <div style={{ height, width: '100%', position: 'relative' }} className="rounded-t-xl overflow-hidden bg-stone-100">
        <APIProvider apiKey={MAPS_API_KEY} onError={() => setMapError(true)}>
          <Map
            defaultCenter={{ lat, lng }}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            <AdvancedMarker position={{ lat, lng }} title={title}>
              <Pin background="#0C3B2E" glyphColor="#FFFFFF" borderColor="#FF5A1F" />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>

      {/* Footer bar with live navigation trigger */}
      <div className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="min-w-0">
          <div className="font-bold text-[#0C3B2E] truncate">{title}</div>
          <div className="text-[11px] text-[#57655F] truncate">{address}</div>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-[#FF5A1F] hover:bg-[#E04810] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Start Directions in Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
