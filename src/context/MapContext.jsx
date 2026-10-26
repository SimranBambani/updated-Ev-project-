import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentLocation, watchCustomerLocation, DEFAULT_LOCATION } from '../utils/location';
import { mapService } from '../services/mapService';
import { toast } from 'react-toastify';

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [selectedStation, setSelectedStation] = useState(null);
  const [routeActive, setRouteActive] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const alertShownRef = useRef(false);

  const showLocationWarningOnce = useCallback(() => {
    if (alertShownRef.current) return;
    if (sessionStorage.getItem('voltflow_location_alerted')) return;
    if (toast.isActive('location-fallback-warning')) return;

    alertShownRef.current = true;
    sessionStorage.setItem('voltflow_location_alerted', 'true');

    toast.warning(
      'Location access is unavailable. Enable location permission to get nearby station recommendations.',
      {
        toastId: 'location-fallback-warning',
        autoClose: 5000,
        closeOnClick: true,
      }
    );
  }, []);

  const updateLocationState = useCallback((newLoc) => {
    setUserLocation((prev) => {
      if (
        prev &&
        prev.latitude === newLoc.latitude &&
        prev.longitude === newLoc.longitude &&
        prev.locationSource === newLoc.locationSource
      ) {
        return prev;
      }
      return newLoc;
    });
  }, []);

  useEffect(() => {
    // Initialize initial GPS position
    getCurrentLocation().then((loc) => {
      const isFallback = loc.isFallback || !loc.latitude;
      const finalLoc = {
        ...loc,
        locationSource: isFallback ? 'fallback' : 'gps',
      };

      if (isFallback) {
        showLocationWarningOnce();
      }

      updateLocationState(finalLoc);
      setLoadingLocation(false);
    });

    // Continuously monitor live GPS location updates
    const stopWatching = watchCustomerLocation((updatedLoc) => {
      const isFallback = updatedLoc.isFallback || !updatedLoc.latitude;
      if (isFallback) {
        showLocationWarningOnce();
        updateLocationState({
          ...updatedLoc,
          locationSource: 'fallback',
        });
      } else {
        updateLocationState({
          ...updatedLoc,
          locationSource: 'gps',
        });
      }
    });

    return () => {
      if (typeof stopWatching === 'function') {
        stopWatching();
      }
    };
  }, [showLocationWarningOnce, updateLocationState]);

  const selectStationForMap = async (station) => {
    setSelectedStation(station);
    if (station && userLocation) {
      const route = await mapService.getRouteCoordinates(
        userLocation.latitude,
        userLocation.longitude,
        station.latitude,
        station.longitude
      );
      setRouteCoordinates(route);
      setRouteActive(true);
    }
  };

  const clearMapRoute = () => {
    setSelectedStation(null);
    setRouteActive(false);
    setRouteCoordinates([]);
  };

  return (
    <MapContext.Provider
      value={{
        userLocation,
        selectedStation,
        routeActive,
        routeCoordinates,
        loadingLocation,
        setUserLocation,
        setSelectedStation,
        selectStationForMap,
        clearMapRoute,
        setRouteActive,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
