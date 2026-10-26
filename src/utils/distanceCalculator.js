/**
 * Calculate distance between two lat/lng points using Haversine Formula (Returns kilometers)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return parseFloat(distanceKm.toFixed(1));
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export const formatDistance = (km) => {
  if (km === null || km === undefined) return 'N/A';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km} km`;
};
