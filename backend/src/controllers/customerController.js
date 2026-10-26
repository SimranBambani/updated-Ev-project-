import prisma from '../config/db.js';
import { getNearbyStations } from '../services/recommendationService.js';
import { calculateWaitingTime } from '../services/waitingTimeService.js';

// --- STATIONS RECOMMENDATIONS ---

export const recommendStations = async (req, res, next) => {
  const lat = req.query.lat || req.query.latitude;
  const lon = req.query.lon || req.query.longitude;
  const { vehicleId, preferredSpeed } = req.query;

  try {
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required query parameters.' });
    }

    let batteryCapacity = 60.0; // defaults
    let currentCharge = 20.0;
    let speed = preferredSpeed || 'Fast';

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { vehicle_id: parseInt(vehicleId) }
      });
      if (vehicle) {
        batteryCapacity = vehicle.battery_capacity;
        currentCharge = vehicle.current_charge;
        speed = preferredSpeed || (vehicle.vehicle_type === 'Bike' ? 'Normal' : 'Fast');
      }
    }

    const stations = await getNearbyStations(
      parseFloat(lat),
      parseFloat(lon),
      batteryCapacity,
      currentCharge,
      speed
    );

    res.status(200).json({ success: true, stations });
  } catch (error) {
    next(error);
  }
};

// --- CUSTOMER VEHICLES CRUD ---

export const getVehicles = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { customer_id: customerId }
    });
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  const { vehicleNumber, vehicleModel, batteryModel, batteryCapacity, currentCharge, vehicleType } = req.body;

  try {
    if (!vehicleNumber || !vehicleModel || !batteryModel || !batteryCapacity || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Missing parameters. Vehicle number, model, type, and battery details are required.' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customer_id: customerId,
        vehicle_number: vehicleNumber,
        vehicle_model: vehicleModel,
        battery_model: batteryModel,
        battery_capacity: parseFloat(batteryCapacity),
        current_charge: currentCharge ? parseFloat(currentCharge) : 0.0,
        vehicle_type: vehicleType,
        is_active: true
      }
    });

    res.status(201).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  const { id } = req.params;
  const customerId = req.user.roleProfileId;
  const { vehicleNumber, vehicleModel, batteryModel, batteryCapacity, currentCharge, vehicleType } = req.body;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: parseInt(id) }
    });
    if (!vehicle || vehicle.customer_id !== customerId) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const updated = await prisma.vehicle.update({
      where: { vehicle_id: vehicle.vehicle_id },
      data: {
        vehicle_number: vehicleNumber,
        vehicle_model: vehicleModel,
        battery_model: batteryModel,
        battery_capacity: batteryCapacity ? parseFloat(batteryCapacity) : undefined,
        current_charge: currentCharge ? parseFloat(currentCharge) : undefined,
        vehicle_type: vehicleType
      }
    });

    res.status(200).json({ success: true, vehicle: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle a vehicle's active/inactive status (replaces hard delete).
 * A disabled vehicle cannot be used for new bookings.
 */
export const toggleVehicleActive = async (req, res, next) => {
  const { id } = req.params;
  const customerId = req.user.roleProfileId;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: parseInt(id) }
    });

    if (!vehicle || vehicle.customer_id !== customerId) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Prevent disabling a vehicle that has an active charging session
    if (vehicle.is_active) {
      const activeSession = await prisma.chargingSession.findFirst({
        where: {
          session_status: 'Charging',
          booking: {
            vehicle_id: vehicle.vehicle_id,
            customer_id: customerId
          }
        }
      });

      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable this vehicle while it has an active charging session in progress.'
        });
      }
    }

    const updated = await prisma.vehicle.update({
      where: { vehicle_id: vehicle.vehicle_id },
      data: { is_active: !vehicle.is_active }
    });

    const action = updated.is_active ? 'enabled' : 'disabled';
    res.status(200).json({
      success: true,
      message: `Vehicle successfully ${action}.`,
      vehicle: updated
    });
  } catch (error) {
    next(error);
  }
};

// --- BOOKINGS ---

export const createBooking = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  const { vehicleId, stationId, preferredSpeed } = req.body;

  try {
    if (!vehicleId || !stationId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID and Station ID are required.' });
    }

    // Use a transaction to prevent race conditions / overbooking
    const booking = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { vehicle_id: parseInt(vehicleId) }
      });

      if (!vehicle || vehicle.customer_id !== customerId) {
        throw Object.assign(new Error('Vehicle not found or does not belong to you.'), { statusCode: 404 });
      }

      if (!vehicle.is_active) {
        throw Object.assign(new Error('Cannot book a slot for a disabled vehicle. Please enable the vehicle first.'), { statusCode: 400 });
      }

      const station = await tx.chargingStation.findUnique({
        where: { station_id: parseInt(stationId) }
      });

      if (!station) {
        throw Object.assign(new Error('Charging station not found.'), { statusCode: 404 });
      }

      if (station.status !== 'Active') {
        throw Object.assign(new Error('This charging station is currently not active.'), { statusCode: 400 });
      }

      // Check for any existing active/waiting booking for this customer at this station
      const existingActiveBooking = await tx.booking.findFirst({
        where: {
          customer_id: customerId,
          station_id: parseInt(stationId),
          booking_status: { in: ['Waiting', 'Confirmed'] }
        }
      });

      if (existingActiveBooking) {
        throw Object.assign(new Error('You already have an active booking at this station. Please cancel it before creating a new one.'), { statusCode: 409 });
      }

      // Calculate wait and charge times using queue simulation
      const speed = preferredSpeed || (vehicle.vehicle_type === '2 Wheeler' ? 'Normal' : 'Fast');
      const { estimatedWaitingTime, estimatedChargingTime } = await calculateWaitingTime(
        station.station_id,
        vehicle.battery_capacity,
        vehicle.current_charge,
        speed,
        tx
      );

      const newBooking = await tx.booking.create({
        data: {
          customer_id: customerId,
          vehicle_id: vehicle.vehicle_id,
          station_id: station.station_id,
          estimated_waiting_time: estimatedWaitingTime,
          estimated_charging_time: estimatedChargingTime,
          booking_status: 'Waiting'
        },
        include: {
          vehicle: true,
          station: true
        }
      });

      // Decrement available_slots if station has capacity
      if (station.available_slots > 0) {
        await tx.chargingStation.update({
          where: { station_id: station.station_id },
          data: {
            available_slots: { decrement: 1 }
          }
        });

        // Update booking status to Confirmed since a slot is available
        const confirmed = await tx.booking.update({
          where: { booking_id: newBooking.booking_id },
          data: { booking_status: 'Confirmed' },
          include: { vehicle: true, station: true }
        });
        return confirmed;
      }

      return newBooking;
    }, { maxWait: 10000, timeout: 20000 });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  const { id } = req.params;
  const customerId = req.user.roleProfileId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
      include: { station: true }
    });

    if (!booking || booking.customer_id !== customerId) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    if (booking.booking_status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled.' });
    }

    // Check for active charging session
    const activeSession = await prisma.chargingSession.findFirst({
      where: {
        booking_id: parseInt(id),
        session_status: 'Charging'
      }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking while charging is in progress.'
      });
    }

    // Use a transaction to cancel and restore availability
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { booking_id: parseInt(id) },
        data: { booking_status: 'Cancelled' }
      });

      // Restore available slot count if booking was confirmed
      if (booking.booking_status === 'Confirmed') {
        const station = await tx.chargingStation.findUnique({
          where: { station_id: booking.station_id }
        });
        if (station && station.available_slots < station.total_slots) {
          await tx.chargingStation.update({
            where: { station_id: booking.station_id },
            data: { available_slots: { increment: 1 } }
          });
        }
      }
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  try {
    const bookings = await prisma.booking.findMany({
      where: { customer_id: customerId },
      include: { vehicle: true, station: true },
      orderBy: { booking_time: 'desc' }
    });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// --- READ ALLOCATION ---

export const getMyAllocations = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  try {
    const allocations = await prisma.slotAllocation.findMany({
      where: { booking: { customer_id: customerId } },
      include: {
        booking: { include: { vehicle: true } },
        slot: { include: { station: true } }
      },
      orderBy: { allocation_time: 'desc' }
    });
    res.status(200).json({ success: true, allocations });
  } catch (error) {
    next(error);
  }
};

// --- NOTIFICATIONS READ ---

export const getNotifications = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  try {
    const notifications = await prisma.notification.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  const { id } = req.params; // notification_id
  const customerId = req.user.roleProfileId;

  try {
    const notification = await prisma.notification.findUnique({
      where: { notification_id: parseInt(id) }
    });
    if (!notification || notification.customer_id !== customerId) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: notification.notification_id },
      data: { status: 'Read' }
    });

    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    next(error);
  }
};

export const getMyChargingHistory = async (req, res, next) => {
  const customerId = req.user.roleProfileId;
  try {
    const history = await prisma.chargingSession.findMany({
      where: {
        booking: {
          customer_id: customerId
        }
      },
      include: {
        booking: {
          include: {
            vehicle: true,
            customer: { include: { user: { select: { name: true } } } }
          }
        },
        slot: { include: { station: { select: { station_name: true } } } }
      },
      orderBy: { start_time: 'desc' }
    });
    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};
