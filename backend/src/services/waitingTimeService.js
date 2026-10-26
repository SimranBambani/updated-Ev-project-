import prisma from '../config/db.js';

export const getSpeedKW = (speedString) => {
  return speedString === 'Fast' ? 50.0 : 11.0;
};

/**
 * Calculates estimated charging time in minutes for a vehicle.
 */
export const calculateChargingTime = (capacity, currentCharge, speedString) => {
  const speed = getSpeedKW(speedString);
  const remainingPercentage = 100.0 - currentCharge;
  if (remainingPercentage <= 0) return 0;
  
  const capacityNeeded = (capacity * remainingPercentage) / 100.0;
  return Math.round((capacityNeeded / speed) * 60);
};

/**
 * Calculates estimated waiting time for a station queue in minutes.
 */
export const calculateWaitingTime = async (
  stationId,
  newVehicleCapacity,
  newVehicleCharge,
  preferredSpeed,
  db = prisma
) => {
  // 1. Fetch slots at this station
  const slots = await db.chargingSlot.findMany({
    where: { station_id: stationId }
  });
  
  if (slots.length === 0) {
    return { estimatedWaitingTime: 0, estimatedChargingTime: 0 };
  }
  
  // 2. Fetch active sessions (ongoing charging sessions)
  const activeSessions = await db.chargingSession.findMany({
    where: {
      slot: { station_id: stationId },
      session_status: 'Charging'
    },
    include: {
      slot: true,
      booking: {
        include: {
          vehicle: true
        }
      }
    }
  });

  // Map slots to their current remaining time (in minutes)
  const slotAvailability = {};
  slots.forEach(slot => {
    slotAvailability[slot.slot_id] = 0; // default to 0 (free)
  });

  // Calculate remaining time for currently charging vehicles
  activeSessions.forEach(session => {
    if (session.booking && session.booking.vehicle) {
      const vehicle = session.booking.vehicle;
      const totalChargeTime = calculateChargingTime(
        vehicle.battery_capacity,
        session.initial_battery,
        session.slot.charging_speed
      );
      
      const elapsed = Math.round((Date.now() - new Date(session.start_time).getTime()) / (1000 * 60));
      const remaining = Math.max(0, totalChargeTime - elapsed);
      slotAvailability[session.slot_id] = remaining;
    }
  });

  // 3. Fetch all queued bookings in "Waiting" state for this station
  const queuedBookings = await db.booking.findMany({
    where: {
      station_id: stationId,
      booking_status: 'Waiting'
    },
    include: {
      vehicle: true
    },
    orderBy: {
      booking_time: 'asc'
    }
  });

  // Simulate assigning queued bookings to the first available slots
  queuedBookings.forEach(booking => {
    // Find the slot that becomes available earliest
    let earliestSlotId = null;
    let minTime = Infinity;
    
    slots.forEach(slot => {
      const time = slotAvailability[slot.slot_id];
      if (time < minTime) {
        minTime = time;
        earliestSlotId = slot.slot_id;
      }
    });

    if (earliestSlotId !== null && booking.vehicle) {
      const chosenSlot = slots.find(s => s.slot_id === earliestSlotId);
      const chargeTime = calculateChargingTime(
        booking.vehicle.battery_capacity,
        booking.vehicle.current_charge,
        chosenSlot.charging_speed
      );

      // Update estimated booking waiting time in simulation
      slotAvailability[earliestSlotId] = minTime + chargeTime;
    }
  });

  // 4. Now find the earliest available slot for the new incoming booking
  // We check the minimum availability of slots matching the preferred speed type.
  let targetSlots = slots.filter(s => s.charging_speed === preferredSpeed);
  if (targetSlots.length === 0) targetSlots = slots; // fallback to all slots

  let estimatedWaitingTime = Infinity;
  let allocatedSlotSpeed = preferredSpeed;

  targetSlots.forEach(slot => {
    const time = slotAvailability[slot.slot_id];
    if (time < estimatedWaitingTime) {
      estimatedWaitingTime = time;
      allocatedSlotSpeed = slot.charging_speed;
    }
  });

  if (estimatedWaitingTime === Infinity) estimatedWaitingTime = 0;

  const estimatedChargingTime = calculateChargingTime(
    newVehicleCapacity,
    newVehicleCharge,
    allocatedSlotSpeed
  );

  return {
    estimatedWaitingTime,
    estimatedChargingTime
  };
};
