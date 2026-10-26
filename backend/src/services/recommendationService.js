import prisma from '../config/db.js';
import { calculateWaitingTime } from './waitingTimeService.js';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates distance between two coordinates using the Haversine formula.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;

  const rLat1 = (lat1 * Math.PI) / 180.0;
  const rLat2 = (lat2 * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

  const c = 2.0 * Math.asin(Math.sqrt(a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Recommends nearby stations ranked by distance and waiting time.
 */
export const getNearbyStations = async (lat, lon, batteryCapacity, currentCharge, preferredSpeed) => {
  // Fetch active stations
  const stations = await prisma.chargingStation.findMany({
    where: { status: 'Active' },
    include: {
      slots: true
    }
  });

  const recommendations = await Promise.all(
    stations.map(async (station) => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lon),
        parseFloat(station.latitude),
        parseFloat(station.longitude)
      );

      // Compute wait time for this station
      const { estimatedWaitingTime, estimatedChargingTime } = await calculateWaitingTime(
        station.station_id,
        batteryCapacity,
        currentCharge,
        preferredSpeed
      );

      // Lower scores favor shorter trips, shorter queues, faster charging, and available capacity.
      const occupiedSlots = (station.total_slots || 0) - (station.available_slots || 0);
      const hasFast = station.slots.some((s) => s.charging_speed === 'Fast');
      const recommendationScore = parseFloat(
        (
          distance * 2.0 +
          estimatedWaitingTime * 1.5 +
          estimatedChargingTime * 0.25 +
          occupiedSlots * 0.5 -
          (hasFast ? 10.0 : 0.0)
        ).toFixed(2)
      );

      return {
        ...station,
        distanceKM: parseFloat(distance.toFixed(2)),
        estimatedWaitingTime,
        estimatedChargingTime,
        recommendationScore
      };
    })
  );

  // Sort recommendations by score ascending (lower score represents a better, more optimal recommendation)
  return recommendations.sort((a, b) => a.recommendationScore - b.recommendationScore);
};
