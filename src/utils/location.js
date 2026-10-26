// Default fallback location (Ahmedabad City Center, Gujarat)
export const DEFAULT_LOCATION = {
  latitude: 23.0225,
  longitude: 72.5714,
  city: 'Ahmedabad',
  address: 'Ahmedabad City Center, Gujarat',
  isFallback: true,
};

/**
 * Get current browser GPS location with promise interface
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: 'Current GPS Location',
          address: `${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°`,
        });
      },
      (error) => {
        console.warn('Geolocation failed or denied, using default:', error.message);
        resolve(DEFAULT_LOCATION);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
};

/**
 * Continuously watch customer location using browser Geolocation watchPosition API
 */
export const watchCustomerLocation = (onLocationUpdate) => {
  if (!navigator.geolocation) {
    onLocationUpdate(DEFAULT_LOCATION);
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city: 'Live GPS Location',
        address: `${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°`,
        accuracy: position.coords.accuracy,
      });
    },
    (err) => {
      console.warn('Live location watching fallback:', err.message);
      onLocationUpdate(DEFAULT_LOCATION);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );

  return () => {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
};
