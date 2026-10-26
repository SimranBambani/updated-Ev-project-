import prisma from '../config/db.js';
import { calculateChargingTime } from '../services/waitingTimeService.js';

const SLOT_STATUSES = ['Available', 'Occupied', 'Maintenance', 'Out of Service'];
const CHARGING_SPEEDS = ['Fast', 'Normal'];
const BATTERY_STATUSES = ['Available', 'In Use', 'Charging', 'Maintenance', 'Out of Service'];
const isFiniteNumber = (value) => Number.isFinite(Number(value));

const managerStationId = (req) => Number(req.user.stationId);

// --- CHARGING SESSIONS & VEHICLE STATUS CRUD ---

export const getStationSessions = async (req, res, next) => {
  const stationId = managerStationId(req);
  try {
    if (!Number.isInteger(stationId) || stationId <= 0) {
      return res.status(400).json({ success: false, message: 'You are not assigned to a station.' });
    }

    const sessions = await prisma.chargingSession.findMany({
      where: { slot: { station_id: stationId } },
      include: {
        booking: { include: { vehicle: true, customer: { include: { user: { select: { name: true } } } } } },
        slot: true
      },
      orderBy: { start_time: 'desc' }
    });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

export const getStationBookings = async (req, res, next) => {
  const stationId = managerStationId(req);
  try {
    if (!Number.isInteger(stationId) || stationId <= 0) {
      return res.status(400).json({ success: false, message: 'You are not assigned to a station.' });
    }
    const bookings = await prisma.booking.findMany({
      where: { station_id: stationId },
      include: {
        vehicle: true,
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        station: { select: { station_name: true } },
        allocations: { include: { slot: true }, orderBy: { allocation_time: 'desc' } }
      },
      orderBy: { booking_time: 'asc' }
    });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a charging session (moves status from Waiting/Allocated to Charging).
 */
export const startSession = async (req, res, next) => {
  const { bookingId, slotId } = req.body;
  const stationId = managerStationId(req);

  try {
    if (!isFiniteNumber(bookingId) || !isFiniteNumber(slotId)) {
      return res.status(400).json({ success: false, message: 'Valid booking ID and slot ID are required.' });
    }

    const session = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { booking_id: Number(bookingId) },
        include: { vehicle: true }
      });
      if (!booking || booking.station_id !== stationId) {
        throw Object.assign(new Error('Booking not found at your assigned station.'), { statusCode: 404 });
      }
      if (!['Waiting', 'Confirmed'].includes(booking.booking_status)) {
        throw Object.assign(new Error('Only waiting or confirmed bookings can start charging.'), { statusCode: 409 });
      }
      if (!booking.vehicle?.is_active) {
        throw Object.assign(new Error('The vehicle is not active and cannot start charging.'), { statusCode: 400 });
      }
      if (booking.booking_status === 'Waiting') {
        const reservedCapacity = await tx.chargingStation.updateMany({
          where: { station_id: stationId, available_slots: { gt: 0 } },
          data: { available_slots: { decrement: 1 } }
        });
        if (reservedCapacity.count !== 1) {
          throw Object.assign(new Error('No station capacity is available for this waiting booking.'), { statusCode: 409 });
        }
      }

      const slot = await tx.chargingSlot.findUnique({ where: { slot_id: Number(slotId) } });
      if (!slot || slot.station_id !== stationId) {
        throw Object.assign(new Error('Slot not found at your assigned station.'), { statusCode: 404 });
      }
      if (!slot.is_enabled || slot.slot_status !== 'Available') {
        throw Object.assign(new Error('This slot is disabled or not operationally available.'), { statusCode: 409 });
      }

      const activeSession = await tx.chargingSession.findFirst({
        where: {
          session_status: 'Charging',
          OR: [{ slot_id: slot.slot_id }, { booking_id: booking.booking_id }]
        }
      });
      if (activeSession) {
        throw Object.assign(new Error('This booking or slot already has an active charging session.'), { statusCode: 409 });
      }

      const occupied = await tx.chargingSlot.updateMany({
        where: { slot_id: slot.slot_id, is_enabled: true, slot_status: 'Available' },
        data: { slot_status: 'Occupied' }
      });
      if (occupied.count !== 1) {
        throw Object.assign(new Error('This slot is no longer available. Refresh and try another slot.'), { statusCode: 409 });
      }

      const newSession = await tx.chargingSession.create({
        data: {
          booking_id: booking.booking_id,
          slot_id: slot.slot_id,
          start_time: new Date(),
          initial_battery: booking.vehicle.current_charge,
          session_status: 'Charging'
        }
      });

      await tx.booking.update({
        where: { booking_id: booking.booking_id },
        data: { booking_status: 'Confirmed' }
      });
      return newSession;
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });

    res.status(201).json({ success: true, session });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'Slot state changed during allocation. Refresh and try again.' });
    }
    next(error);
  }
};

/**
 * Completes a charging session, triggers duration/energy calculations,
 * releases the slot, and registers a customer notification.
 */
export const completeSession = async (req, res, next) => {
  const sessionId = Number(req.params.id);
  const { finalBattery, energyConsumed } = req.body;
  const stationId = managerStationId(req);

  try {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid charging session ID is required.' });
    }
    const session = await prisma.chargingSession.findUnique({
      where: { session_id: sessionId },
      include: { slot: true, booking: true }
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.slot.station_id !== stationId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (session.session_status !== 'Charging') {
      return res.status(409).json({ success: false, message: 'Only an active charging session can be completed.' });
    }

    const final = finalBattery === undefined ? 100 : Number(finalBattery);
    const energy = energyConsumed === undefined ? 0 : Number(energyConsumed);
    if (!Number.isFinite(final) || final < 0 || final > 100 ||
        !Number.isFinite(energy) || energy < 0) {
      return res.status(400).json({ success: false, message: 'Final battery must be 0-100 and energy consumed must be non-negative.' });
    }

    const endTime = new Date();
    const duration = Math.max(1, Math.round((endTime.getTime() - new Date(session.start_time).getTime()) / (1000 * 60)));

    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.chargingSession.updateMany({
        where: { session_id: session.session_id, session_status: 'Charging' },
        data: {
          end_time: endTime,
          final_battery: final,
          energy_consumed: energy,
          duration,
          session_status: 'Completed'
        }
      });
      if (changed.count !== 1) {
        throw Object.assign(new Error('This charging session is no longer active.'), { statusCode: 409 });
      }

      const slot = await tx.chargingSlot.findUnique({ where: { slot_id: session.slot_id } });
      if (slot?.is_enabled && slot.slot_status === 'Occupied') {
        await tx.chargingSlot.update({
          where: { slot_id: session.slot_id },
          data: { slot_status: 'Available' }
        });
        const station = await tx.chargingStation.findUnique({ where: { station_id: slot.station_id } });
        if (station && station.available_slots < station.total_slots) {
          await tx.chargingStation.update({
            where: { station_id: slot.station_id },
            data: { available_slots: { increment: 1 } }
          });
        }
      }
      if (session.booking) {
        await tx.booking.updateMany({
          where: { booking_id: session.booking.booking_id, booking_status: 'Confirmed' },
          data: { booking_status: 'Completed' }
        });
        await tx.vehicle.update({
          where: { vehicle_id: session.booking.vehicle_id },
          data: { current_charge: final }
        });
      }

      // 3. Update slot allocation status if exists
      const allocation = await tx.slotAllocation.findFirst({
        where: { booking_id: session.booking_id, slot_id: session.slot_id }
      });
      if (allocation) {
        await tx.slotAllocation.update({
          where: { allocation_id: allocation.allocation_id },
          data: { allocation_status: 'Released' }
        });
      }

      // 4. Create charging complete notification for customer
      if (session.booking) {
        await tx.notification.create({
          data: {
            customer_id: session.booking.customer_id,
            booking_id: session.booking.booking_id,
            title: 'Charging Complete',
            message: 'Your vehicle has finished charging. Please remove your vehicle immediately to free the slot.',
            notification_type: 'Charging Complete',
            status: 'Unread'
          }
        });
      }

      return tx.chargingSession.findUnique({ where: { session_id: session.session_id } });
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });

    res.status(200).json({ success: true, session: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const emergencyStopSession = async (req, res, next) => {
  const sessionId = Number(req.params.id);
  const stationId = managerStationId(req);

  try {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid charging session ID is required.' });
    }
    const session = await prisma.chargingSession.findUnique({
      where: { session_id: sessionId },
      include: { slot: true, booking: true }
    });
    if (!session || session.slot.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Active charging session not found at your station.' });
    }
    if (session.session_status !== 'Charging') {
      return res.status(409).json({ success: false, message: 'This charging session is no longer active.' });
    }

    const stoppedAt = new Date();
    const duration = Math.max(0, Math.round((stoppedAt.getTime() - new Date(session.start_time).getTime()) / 60000));
    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.chargingSession.updateMany({
        where: { session_id: sessionId, session_status: 'Charging' },
        data: { session_status: 'Emergency Stopped', end_time: stoppedAt, duration }
      });
      if (changed.count !== 1) {
        throw Object.assign(new Error('This charging session has already stopped.'), { statusCode: 409 });
      }

      if (session.slot.is_enabled && session.slot.slot_status === 'Occupied') {
        await tx.chargingSlot.update({
          where: { slot_id: session.slot_id },
          data: { slot_status: 'Available' }
        });
        const station = await tx.chargingStation.findUnique({
          where: { station_id: session.slot.station_id }
        });
        if (station && station.available_slots < station.total_slots) {
          await tx.chargingStation.update({
            where: { station_id: session.slot.station_id },
            data: { available_slots: { increment: 1 } }
          });
        }
      }
      await tx.slotAllocation.updateMany({
        where: {
          booking_id: session.booking_id,
          slot_id: session.slot_id,
          allocation_status: 'Allocated'
        },
        data: { allocation_status: 'Released' }
      });

      if (session.booking) {
        await tx.booking.updateMany({
          where: { booking_id: session.booking.booking_id, booking_status: { in: ['Waiting', 'Confirmed'] } },
          data: { booking_status: 'Cancelled' }
        });
        await tx.notification.create({
          data: {
            customer_id: session.booking.customer_id,
            booking_id: session.booking.booking_id,
            title: 'Charging Session Stopped',
            message: 'Your charging session was stopped by the station manager. This system records a software stop only; it does not confirm physical power isolation.',
            notification_type: 'Charging Stopped',
            status: 'Unread'
          }
        });
      }
      return tx.chargingSession.findUnique({ where: { session_id: sessionId } });
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });

    res.status(200).json({
      success: true,
      simulated: true,
      message: 'Software session stopped. Physical charger power isolation is not confirmed by this application.',
      session: updated
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

// --- BATTERY INVENTORY CRUD ---

export const getBatteries = async (req, res, next) => {
  const stationId = managerStationId(req);
  try {
    const batteries = await prisma.batteryInventory.findMany({
      where: { station_id: stationId }
    });
    res.status(200).json({ success: true, batteries });
  } catch (error) {
    next(error);
  }
};

export const createBattery = async (req, res, next) => {
  const stationId = managerStationId(req);
  const { batteryModel, capacity, health, status } = req.body;

  try {
    const parsedCapacity = Number(capacity);
    const parsedHealth = Number(health);
    if (typeof batteryModel !== 'string' || !batteryModel.trim() ||
        capacity === undefined || capacity === null || capacity === '' ||
        health === undefined || health === null || health === '' ||
        !Number.isFinite(parsedCapacity) || parsedCapacity <= 0 ||
        !Number.isFinite(parsedHealth) || parsedHealth < 0 || parsedHealth > 100 ||
        !BATTERY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Battery model, positive capacity, SoH from 0 to 100, and a valid inventory status are required.'
      });
    }
    const battery = await prisma.batteryInventory.create({
      data: {
        station_id: stationId,
        battery_model: batteryModel.trim(),
        capacity: parsedCapacity,
        health: parsedHealth,
        status
      }
    });
    res.status(201).json({ success: true, battery });
  } catch (error) {
    next(error);
  }
};

export const updateBattery = async (req, res, next) => {
  const batteryId = Number(req.params.id);
  const stationId = managerStationId(req);
  const { batteryModel, capacity, health, status } = req.body;

  try {
    if (!Number.isInteger(batteryId) || batteryId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid battery ID is required.' });
    }
    const battery = await prisma.batteryInventory.findUnique({
      where: { battery_id: batteryId }
    });
    if (!battery || battery.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Battery inventory not found.' });
    }

    const updateData = {};
    if (batteryModel !== undefined) {
      if (typeof batteryModel !== 'string' || !batteryModel.trim()) {
        return res.status(400).json({ success: false, message: 'Battery model cannot be empty.' });
      }
      updateData.battery_model = batteryModel.trim();
    }
    if (capacity !== undefined) {
      const parsedCapacity = Number(capacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
        return res.status(400).json({ success: false, message: 'Capacity must be a positive number.' });
      }
      updateData.capacity = parsedCapacity;
    }
    if (health !== undefined) {
      if (health === null || health === '') {
        return res.status(400).json({ success: false, message: 'SoH must be between 0 and 100.' });
      }
      const parsedHealth = Number(health);
      if (!Number.isFinite(parsedHealth) || parsedHealth < 0 || parsedHealth > 100) {
        return res.status(400).json({ success: false, message: 'SoH must be between 0 and 100.' });
      }
      updateData.health = parsedHealth;
    }
    if (status !== undefined) {
      if (!BATTERY_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Unsupported inventory status.' });
      }
      updateData.status = status;
    }
    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: 'At least one battery field must be updated.' });
    }

    const updated = await prisma.batteryInventory.update({
      where: { battery_id: battery.battery_id },
      data: updateData
    });
    res.status(200).json({ success: true, battery: updated });
  } catch (error) {
    next(error);
  }
};

export const setBatteryEnabled = async (req, res, next) => {
  const batteryId = Number(req.params.id);
  const stationId = managerStationId(req);
  const { enabled } = req.body;

  try {
    if (!Number.isInteger(batteryId) || batteryId <= 0 || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Valid battery ID and enabled flag are required.' });
    }
    const battery = await prisma.batteryInventory.findUnique({
      where: { battery_id: batteryId }
    });
    if (!battery || battery.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Battery inventory not found.' });
    }

    if (battery.is_enabled === enabled) {
      return res.status(200).json({ success: true, battery, message: `Battery is already ${enabled ? 'enabled' : 'disabled'}.` });
    }
    if (!enabled && ['In Use', 'Charging'].includes(battery.status)) {
      return res.status(409).json({ success: false, message: 'A battery in use or charging cannot be disabled.' });
    }
    const updated = await prisma.batteryInventory.update({
      where: { battery_id: battery.battery_id },
      data: { is_enabled: enabled }
    });
    res.status(200).json({ success: true, battery: updated, message: `Battery ${enabled ? 'enabled' : 'disabled'} successfully.` });
  } catch (error) {
    next(error);
  }
};

// --- CHARGING SLOTS CRUD ---

export const getSlots = async (req, res, next) => {
  const stationId = managerStationId(req);
  try {
    const slots = await prisma.chargingSlot.findMany({
      where: { station_id: stationId },
      orderBy: { slot_number: 'asc' }
    });
    res.status(200).json({ success: true, slots });
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (req, res, next) => {
  const stationId = managerStationId(req);
  const { chargingSpeed, slotStatus } = req.body;

  try {
    if (!CHARGING_SPEEDS.includes(chargingSpeed) || !SLOT_STATUSES.includes(slotStatus) || slotStatus === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Choose a supported charging speed and a valid initial operational status (Available, Maintenance, or Out of Service).'
      });
    }
    const slot = await prisma.$transaction(async (tx) => {
      const existing = await tx.chargingSlot.findMany({
        where: { station_id: stationId },
        select: { slot_number: true }
      });
      const used = new Set(existing.map(({ slot_number }) => slot_number));
      let slotNumber = 1;
      while (used.has(slotNumber)) slotNumber += 1;

      const created = await tx.chargingSlot.create({
        data: {
          station_id: stationId,
          slot_number: slotNumber,
          charging_speed: chargingSpeed,
          slot_status: slotStatus,
          is_enabled: true
        }
      });
      await tx.chargingStation.update({
        where: { station_id: stationId },
        data: {
          total_slots: { increment: 1 },
          ...(slotStatus === 'Available' ? { available_slots: { increment: 1 } } : {})
        }
      });
      return created;
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });
    res.status(201).json({ success: true, slot });
  } catch (error) {
    if (error.code === 'P2002' || error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'A slot number was assigned concurrently. Please retry.' });
    }
    next(error);
  }
};

export const updateSlot = async (req, res, next) => {
  const slotId = Number(req.params.id);
  const stationId = managerStationId(req);
  const { slotNumber, chargingSpeed, slotStatus } = req.body;

  try {
    if (!Number.isInteger(slotId) || slotId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid slot ID is required.' });
    }
    const slot = await prisma.chargingSlot.findUnique({
      where: { slot_id: slotId }
    });
    if (!slot || slot.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    const updateData = {};
    if (slotNumber !== undefined) {
      const parsedNumber = Number(slotNumber);
      if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
        return res.status(400).json({ success: false, message: 'Slot number must be a positive integer.' });
      }
      updateData.slot_number = parsedNumber;
    }
    if (chargingSpeed !== undefined) {
      if (!CHARGING_SPEEDS.includes(chargingSpeed)) {
        return res.status(400).json({ success: false, message: 'Charging speed must be Fast or Normal.' });
      }
      updateData.charging_speed = chargingSpeed;
    }
    if (slotStatus !== undefined) {
      if (!SLOT_STATUSES.includes(slotStatus)) {
        return res.status(400).json({ success: false, message: 'Unsupported operational status.' });
      }
      if (slotStatus === 'Occupied' && slot.slot_status !== 'Occupied') {
        return res.status(400).json({ success: false, message: 'A slot can only become occupied when a charging session starts.' });
      }
      const activeSession = await prisma.chargingSession.findFirst({
        where: { slot_id: slotId, session_status: 'Charging' }
      });
      if (activeSession && slotStatus !== 'Occupied') {
        return res.status(409).json({ success: false, message: 'Stop the active charging session before changing this slot status.' });
      }
      updateData.slot_status = slotStatus;
    }
    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: 'No supported slot changes were provided.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.chargingSlot.update({
        where: { slot_id: slot.slot_id },
        data: updateData
      });
      if (slot.is_enabled && slot.slot_status !== changed.slot_status &&
          (slot.slot_status === 'Available' || changed.slot_status === 'Available')) {
        await tx.chargingStation.update({
          where: { station_id: stationId },
          data: { available_slots: { increment: changed.slot_status === 'Available' ? 1 : -1 } }
        });
      }
      return changed;
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });
    res.status(200).json({ success: true, slot: updated });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'That slot number is already in use at this station.' });
    }
    next(error);
  }
};

export const setSlotEnabled = async (req, res, next) => {
  const slotId = Number(req.params.id);
  const stationId = managerStationId(req);
  const { enabled } = req.body;

  try {
    if (!Number.isInteger(slotId) || slotId <= 0 || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Valid slot ID and enabled flag are required.' });
    }
    const slot = await prisma.chargingSlot.findUnique({
      where: { slot_id: slotId }
    });
    if (!slot || slot.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    if (slot.is_enabled === enabled) {
      return res.status(200).json({ success: true, slot, message: `Slot is already ${enabled ? 'enabled' : 'disabled'}.` });
    }
    const activeSession = await prisma.chargingSession.findFirst({
      where: { slot_id: slot.slot_id, session_status: 'Charging' }
    });
    if (!enabled && activeSession) {
      return res.status(409).json({ success: false, message: 'A slot with an active charging session cannot be disabled.' });
    }
    const activeAllocation = await prisma.slotAllocation.findFirst({
      where: { slot_id: slot.slot_id, allocation_status: 'Allocated' }
    });
    if (!enabled && activeAllocation) {
      return res.status(409).json({ success: false, message: 'Release the slot allocation before disabling this slot.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.chargingSlot.update({
        where: { slot_id: slot.slot_id },
        data: { is_enabled: enabled }
      });
      if (slot.slot_status === 'Available') {
        await tx.chargingStation.update({
          where: { station_id: stationId },
          data: { available_slots: { increment: enabled ? 1 : -1 } }
        });
      }
      return changed;
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });
    res.status(200).json({ success: true, slot: updated, message: `Charging slot ${enabled ? 'enabled' : 'disabled'} successfully.` });
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (req, res, next) => {
  req.body = { enabled: false };
  return setSlotEnabled(req, res, next);
};

// --- SLOT ALLOCATION ---

export const allocateSlot = async (req, res, next) => {
  const { bookingId, slotId } = req.body;
  const managerId = Number(req.user.roleProfileId);

  try {
    if (!isFiniteNumber(bookingId) || !isFiniteNumber(slotId)) {
      return res.status(400).json({ success: false, message: 'Valid booking ID and slot ID are required.' });
    }

    const booking = await prisma.booking.findUnique({ where: { booking_id: parseInt(bookingId) } });
    const slot = await prisma.chargingSlot.findUnique({ where: { slot_id: parseInt(slotId) } });

    if (!booking || !slot) {
      return res.status(404).json({ success: false, message: 'Booking or Slot not found.' });
    }
    if (booking.station_id !== req.user.stationId || slot.station_id !== req.user.stationId) {
      return res.status(403).json({ success: false, message: 'Booking and slot must belong to your assigned station.' });
    }
    if (booking.booking_status !== 'Waiting') {
      return res.status(409).json({ success: false, message: 'Only waiting bookings can be allocated.' });
    }
    if (!slot.is_enabled || slot.slot_status !== 'Available') {
      return res.status(409).json({ success: false, message: 'Only enabled, available slots can be allocated.' });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const currentSlot = await tx.chargingSlot.findUnique({ where: { slot_id: slot.slot_id } });
      if (!currentSlot?.is_enabled || currentSlot.slot_status !== 'Available') {
        throw Object.assign(new Error('This slot is no longer available.'), { statusCode: 409 });
      }
      const bookingAllocation = await tx.slotAllocation.findFirst({
        where: { booking_id: booking.booking_id, allocation_status: 'Allocated' }
      });
      if (bookingAllocation) {
        throw Object.assign(new Error('This booking already has an allocated slot.'), { statusCode: 409 });
      }
      const existingAllocation = await tx.slotAllocation.findFirst({
        where: { slot_id: slot.slot_id, allocation_status: 'Allocated' }
      });
      if (existingAllocation) {
        throw Object.assign(new Error('This slot is already allocated.'), { statusCode: 409 });
      }
      const reservedCapacity = await tx.chargingStation.updateMany({
        where: { station_id: booking.station_id, available_slots: { gt: 0 } },
        data: { available_slots: { decrement: 1 } }
      });
      if (reservedCapacity.count !== 1) {
        throw Object.assign(new Error('No station capacity is available for this waiting booking.'), { statusCode: 409 });
      }
      // 1. Create Allocation
      const alloc = await tx.slotAllocation.create({
        data: {
          booking_id: booking.booking_id,
          slot_id: slot.slot_id,
          allocated_by: managerId,
          allocation_status: 'Allocated'
        }
      });

      // 2. Update Booking Status
      await tx.booking.update({
        where: { booking_id: booking.booking_id },
        data: { booking_status: 'Confirmed' }
      });

      // 3. Create Notification for Customer
      await tx.notification.create({
        data: {
          customer_id: booking.customer_id,
          booking_id: booking.booking_id,
          title: 'Slot Allocated',
          message: `Your booking has been allocated to Slot ${slot.slot_number}. Please plug in your vehicle.`,
          notification_type: 'Slot Allocated',
          status: 'Unread'
        }
      });

      return alloc;
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 20000 });

    res.status(201).json({ success: true, allocation });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'Slot or station capacity changed during allocation. Refresh and try again.' });
    }
    next(error);
  }
};

// --- CHARGING RECOMMENDATION ---

export const getPluggedRecommendation = async (req, res, next) => {
  const { sessionId } = req.params;
  const stationId = req.user.stationId;

  try {
    const session = await prisma.chargingSession.findUnique({
      where: { session_id: parseInt(sessionId) },
      include: {
        slot: true,
        booking: { include: { vehicle: true } }
      }
    });

    if (!session || session.slot.station_id !== stationId) {
      return res.status(404).json({ success: false, message: 'Charging session not found.' });
    }

    if (!session.booking || !session.booking.vehicle) {
      return res.status(400).json({ success: false, message: 'No vehicle associated with this session.' });
    }

    const vehicle = session.booking.vehicle;
    const timeTo100 = calculateChargingTime(
      vehicle.battery_capacity,
      session.initial_battery,
      session.slot.charging_speed
    );

    res.status(200).json({
      success: true,
      vehicleModel: vehicle.vehicle_model,
      batteryCapacity: vehicle.battery_capacity,
      initialBattery: session.initial_battery,
      chargingSpeed: session.slot.charging_speed,
      estimatedMinutesToFull: timeTo100
    });
  } catch (error) {
    next(error);
  }
};
