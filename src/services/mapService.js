import { mockChargingStations } from '../mock/mockData';
import { calculateDistance } from '../utils/distanceCalculator';
import { getCurrentLocation } from '../utils/location';

export const mapService = {
  getNearbyStations: async (userLat, userLng, radiusKm = 25) => {
    await new Promise((r) => setTimeout(r, 200));
    
    return mockChargingStations.map((station) => {
      const distance = calculateDistance(userLat, userLng, station.latitude, station.longitude);
      return {
        ...station,
        distance,
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  },

  getUserLocation: async () => {
    return await getCurrentLocation();
  },

  getRouteCoordinates: async (startLat, startLng, endLat, endLng) => {
    await new Promise((r) => setTimeout(r, 100));
    // Mock polyline coordinates generator for map rendering preview
    const points = 5;
    const route = [];
    for (let i = 0; i <= points; i++) {
      route.push({
        lat: startLat + ((endLat - startLat) * i) / points,
        lng: startLng + ((endLng - startLng) * i) / points,
      });
    }
    return route;
  },
};
