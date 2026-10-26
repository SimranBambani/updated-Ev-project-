import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StationMarker } from './StationMarker';
import { UserLocationMarker } from './UserLocationMarker';
import { MapLegend } from './MapLegend';
import { FiLayers, FiRadio, FiNavigation, FiZap, FiAlertTriangle, FiRefreshCw, FiExternalLink } from 'react-icons/fi';

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#142c2e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2563eb' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1d4ed8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#60a5fa' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0f172a' }],
  },
];

// Helper to generate custom SVG map marker icons
function getStationPinSvg(isAvailable, isSelected) {
  const bgColor = isSelected ? '#3b82f6' : isAvailable ? '#10b981' : '#f43f5e';
  const strokeColor = isSelected ? '#ffffff' : '#0f172a';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M19 0C8.5 0 0 8.5 0 19c0 13.5 19 29 19 29s19-15.5 19-29C38 8.5 29.5 0 19 0z" 
            fill="${bgColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="19" cy="18" r="11" fill="#0f172a" />
      <path d="M19 10 L15 18 L19 18 L18 26 L23 17 L19 17 Z" fill="${bgColor}" />
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function getUserPinSvg() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="#3b82f6" fill-opacity="0.3" stroke="#60a5fa" stroke-width="2"/>
      <circle cx="18" cy="18" r="8" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
      <circle cx="18" cy="18" r="3" fill="#ffffff"/>
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export const MapContainer = ({
  stations = [],
  userLocation,
  selectedStation,
  onSelectStation,
}) => {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const infoWindowRef = useRef(null);

  const [mapStatus, setMapStatus] = useState('loading'); // 'loading' | 'ready' | 'error' | 'auth_error'
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'grid'

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. Script Loading for Google Maps API
  useEffect(() => {
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
      setMapStatus('error');
      setAuthErrorMessage('No valid Google Maps API Key found in .env');
      return;
    }

    // Google Maps authentication failure hook
    window.gm_authFailure = () => {
      console.error('Google Maps API Authentication Failed! Check key permissions & billing.');
      setMapStatus('auth_error');
      setAuthErrorMessage('Google Maps authentication failed. Ensure Maps JavaScript API is enabled and Billing is active on Google Cloud.');
    };

    if (window.google && window.google.maps) {
      setMapStatus('ready');
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setMapStatus('ready'));
      existingScript.addEventListener('error', () => {
        setMapStatus('error');
        setAuthErrorMessage('Failed to load Google Maps script from Google servers.');
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setMapStatus('ready');
    };

    script.onerror = () => {
      setMapStatus('error');
      setAuthErrorMessage('Network error loading Google Maps script. Check your internet or API key.');
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // 2. Initialize Google Map
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapElementRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      const initialLat = userLocation?.latitude ? parseFloat(userLocation.latitude) : 23.0225;
      const initialLng = userLocation?.longitude ? parseFloat(userLocation.longitude) : 72.5714;

      if (!mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapElementRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 12,
          styles: DARK_MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#38bdf8',
            strokeOpacity: 0.8,
            strokeWeight: 5,
          },
        });
      }
    } catch (err) {
      console.error('Error creating Google Map instance:', err);
      setMapStatus('error');
    }
  }, [mapStatus, userLocation]);

  // 3. Update User Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    if (userLocation?.latitude && userLocation?.longitude) {
      const pos = {
        lat: parseFloat(userLocation.latitude),
        lng: parseFloat(userLocation.longitude),
      };

      if (!userMarkerRef.current) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            url: getUserPinSvg(),
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          },
          zIndex: 100,
        });
      } else {
        userMarkerRef.current.setPosition(pos);
      }
    }
  }, [userLocation]);

  // 4. Update Station Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    if (userLocation?.latitude && userLocation?.longitude) {
      bounds.extend({
        lat: parseFloat(userLocation.latitude),
        lng: parseFloat(userLocation.longitude),
      });
      hasCoords = true;
    }

    stations.forEach((station) => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = selectedStation && (selectedStation._id === station._id || selectedStation.station_id === station.station_id || selectedStation.stationName === station.stationName);
      const isAvailable = (station.availableSlots || station.available_slots || 0) > 0;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: station.stationName,
        icon: {
          url: getStationPinSvg(isAvailable, isSelected),
          scaledSize: isSelected
            ? new window.google.maps.Size(44, 56)
            : new window.google.maps.Size(36, 46),
          anchor: isSelected
            ? new window.google.maps.Point(22, 56)
            : new window.google.maps.Point(18, 46),
        },
        zIndex: isSelected ? 50 : 20,
      });

      marker.addListener('click', () => {
        if (onSelectStation) {
          onSelectStation(station);
        }

        // Display InfoWindow
        const availSlots = station.availableSlots ?? station.available_slots ?? 0;
        const totalSlots = station.totalSlots ?? station.total_slots ?? 0;
        const price = station.pricingPerKWh ? `$${station.pricingPerKWh}/kWh` : '$0.35/kWh';

        const contentString = `
          <div style="background-color: #0f172a; color: #f8fafc; padding: 12px; border-radius: 12px; font-family: sans-serif; min-width: 200px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #38bdf8;">${station.stationName}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">${station.address || ''}, ${station.city || ''}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px;">
              <span style="background: ${availSlots > 0 ? '#065f46' : '#9f1239'}; color: ${availSlots > 0 ? '#6ee7b7' : '#fca5a5'}; padding: 2px 8px; border-radius: 6px; font-weight: 600;">
                ${availSlots}/${totalSlots} Slots Free
              </span>
              <span style="color: #cbd5e1; font-weight: bold;">${price}</span>
            </div>
            <div style="font-size: 11px; color: #38bdf8; text-align: center; font-weight: 600; cursor: pointer;">
              ✓ Selected Station
            </div>
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      bounds.extend({ lat, lng });
      hasCoords = true;
      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have stations and no specific station is selected
    if (hasCoords && !selectedStation && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  }, [stations, selectedStation, onSelectStation, userLocation]);

  // 5. Draw Navigation Route when Station is Selected
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    if (selectedStation && userLocation?.latitude && userLocation?.longitude) {
      const origin = {
        lat: parseFloat(userLocation.latitude),
        lng: parseFloat(userLocation.longitude),
      };
      const destination = {
        lat: parseFloat(selectedStation.latitude),
        lng: parseFloat(selectedStation.longitude),
      };

      if (!isNaN(destination.lat) && !isNaN(destination.lng)) {
        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);
            } else {
              // Clear route if driving directions not available
              if (directionsRendererRef.current) {
                directionsRendererRef.current.set('directions', null);
              }
            }
          }
        );

        // Center on the destination
        mapInstanceRef.current.panTo(destination);
      }
    } else {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
    }
  }, [selectedStation, userLocation]);

  const hasMapError = mapStatus === 'error' || mapStatus === 'auth_error';

  return (
    <div className="relative w-full h-[440px] lg:h-[520px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col justify-between select-none">
      {/* Top Header Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 flex-wrap pointer-events-none">
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-xs font-bold border border-slate-700/80 shadow-lg pointer-events-auto">
          <FiLayers className="text-primary-400 text-base" />
          <span>Google Maps EV Charging Network</span>
          {mapStatus === 'ready' && (
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Map SDK
            </span>
          )}
          {hasMapError && (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
              <FiAlertTriangle className="text-xs" /> Key Attention Needed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Toggle Button between Google Maps and Vector Grid */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-md flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('google')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                activeTab === 'google'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Map
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                activeTab === 'grid'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Spatial Grid
            </button>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-slate-300 text-xs font-semibold border border-slate-700/80 shadow-md flex items-center gap-1.5">
            <FiNavigation className="text-primary-400 text-xs" />
            <span>GPS: {userLocation?.city || 'Active'}</span>
          </div>
        </div>
      </div>

      {/* View 1: Real Interactive Google Map */}
      <div
        className={`w-full h-full relative ${activeTab === 'google' ? 'block' : 'hidden'}`}
      >
        <div ref={mapElementRef} className="w-full h-full" />

        {/* Loading Overlay */}
        {mapStatus === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 p-6">
            <FiRefreshCw className="animate-spin text-3xl text-primary-400 mb-3" />
            <p className="text-sm font-bold">Connecting to Google Maps Platform...</p>
            <p className="text-xs text-slate-400 mt-1">Initializing Maps JavaScript API & EV Spatial Pins</p>
          </div>
        )}

        {/* Error / Authentication Help Overlay */}
        {hasMapError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl mb-3 shadow-lg">
              <FiAlertTriangle />
            </div>
            <h4 className="text-base font-bold text-slate-100 mb-1">
              Google Maps Configuration Notice
            </h4>
            <p className="text-xs text-slate-300 max-w-md mb-3 leading-relaxed">
              {authErrorMessage || 'Google reported an issue with the API key.'}
            </p>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 max-w-md text-left text-[11px] text-slate-400 space-y-1.5 mb-4">
              <div className="font-semibold text-slate-200">Quick Checklist in Google Cloud Console:</div>
              <div>• Enable <strong>Maps JavaScript API</strong> in APIs & Services &gt; Library</div>
              <div>• Ensure an active <strong>Billing Account</strong> is linked to your Cloud project</div>
              <div>• Under Credentials &gt; API Key &gt; Website Restrictions: Set to <strong>None</strong> for local testing</div>
            </div>

            <div className="flex gap-2.5 flex-wrap justify-center">
              <button
                onClick={() => setActiveTab('grid')}
                className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Switch to Interactive Spatial Grid
              </button>
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
              >
                Open Google Cloud Console <FiExternalLink />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* View 2: Simulated Spatial Grid Fallback */}
      <div
        className={`w-full h-full relative flex flex-col justify-between p-4.5 select-none ${
          activeTab === 'grid' ? 'flex' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:18px_18px] pointer-events-none" />

        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none stroke-blue-500" strokeWidth="1.5">
          <line x1="0" y1="25%" x2="100%" y2="28%" strokeDasharray="6 6" />
          <line x1="0" y1="65%" x2="100%" y2="60%" strokeDasharray="8 8" />
          <line x1="32%" y1="0" x2="35%" y2="100%" strokeDasharray="5 5" />
          <line x1="72%" y1="0" x2="68%" y2="100%" strokeDasharray="10 10" />
        </svg>

        <div className="h-14" /> {/* Spacer for the header bar */}

        <div className="relative z-10 flex-1 my-3 flex items-center justify-center">
          <UserLocationMarker location={userLocation} />

          <div className="absolute inset-0 flex flex-wrap items-center justify-around p-6 pointer-events-auto gap-4 overflow-hidden">
            {stations.map((stn, idx) => (
              <StationMarker
                key={stn._id || stn.station_id || idx}
                station={stn}
                isSelected={
                  selectedStation &&
                  (selectedStation._id === stn._id ||
                    selectedStation.station_id === stn.station_id ||
                    selectedStation.stationName === stn.stationName)
                }
                onClick={() => onSelectStation && onSelectStation(stn)}
              />
            ))}
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <MapLegend />
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-sm">
            <FiRadio className="text-emerald-400 text-xs" />
            <span>Spatial Grid Preview Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};
