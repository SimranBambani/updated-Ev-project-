import api from './api';
import { calculateChargingTime, formatDuration } from '../utils/estimationEngine';

const chargingSpeedKw = (speed) => (speed === 'Fast' ? 50 : 11);

export const slotService = {
  getAllSlots: async () => {
    const res = await api.get('/manager/slots');
    return res.data.slots.map(s => ({
      _id: s.slot_id,
      stationId: s.station_id,
      slotNumber: `Slot A-${s.slot_number}`,
      chargingSpeed: s.charging_speed,
      slotStatus: s.slot_status,
      isEnabled: s.is_enabled !== false
    }));
  },

  getSlotsByStationId: async (stationId) => {
    return slotService.getAllSlots();
  },

  createSlot: async (data) => {
    const res = await api.post('/manager/slots', {
      chargingSpeed: data.chargingSpeed,
      slotStatus: data.slotStatus
    });
    return res.data.slot;
  },

  updateSlot: async (id, data) => {
    const res = await api.put(`/manager/slots/${id}`, {
      chargingSpeed: data.chargingSpeed,
      slotStatus: data.slotStatus
    });
    return res.data.slot;
  },

  setSlotEnabled: async (id, enabled) => {
    const res = await api.patch(`/manager/slots/${id}/enabled`, { enabled });
    return res.data.slot;
  },

  getAllSessions: async () => {
    const res = await api.get('/manager/sessions');
    return (res.data.sessions || []).map(s => {
      const vehicle = s.booking?.vehicle;
      const capacity = Number(vehicle?.battery_capacity) || 0;
      const initialBattery = Number(s.initial_battery) || 0;
      const speed = chargingSpeedKw(s.slot?.charging_speed);
      const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(s.start_time).getTime()) / 60000));
      const estimatedCharge = calculateChargingTime(initialBattery, 100, capacity, speed);
      const estimatedCurrent = Math.min(100, initialBattery + (capacity ? elapsedMinutes * speed / capacity * 100 : 0));
      const remainingMinutes = Math.max(0, estimatedCharge.totalMinutes - elapsedMinutes);
      const estimatedFinish = new Date(new Date(s.start_time).getTime() + estimatedCharge.totalMinutes * 60000);

      return {
        _id: s.session_id,
        sessionId: s.session_id,
        bookingId: s.booking_id,
        slotId: s.slot_id,
        startTime: s.start_time,
        endTime: s.end_time,
        initialBattery,
        batteryCapacity: capacity,
        batteryPercentage: Math.round(estimatedCurrent),
        chargingProgress: estimatedCharge.totalMinutes
          ? Math.min(100, Math.round(elapsedMinutes / estimatedCharge.totalMinutes * 100))
          : 100,
        estimatedRemainingTime: formatDuration(remainingMinutes),
        estimatedFinishTime: estimatedFinish.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chargingSpeedKw: speed,
        finalBattery: s.final_battery,
        energyConsumed: s.energy_consumed,
        duration: s.duration,
        sessionStatus: s.session_status,
        chargingStatus: s.session_status,
        slotEnabled: s.slot?.is_enabled !== false,
        slotStatus: s.slot?.slot_status,
        customerName: s.booking?.customer?.user?.name || s.booking?.customer?.name || 'Customer',
        vehicleModel: vehicle?.vehicle_model || 'EV Vehicle',
        vehicleNumber: vehicle?.vehicle_number || 'EV-00-XX',
        slotNumber: s.slot?.slot_number ? `Slot A-${s.slot.slot_number}` : 'Slot'
      };
    });
  },

  // Battery Inventory
  getBatteryInventory: async () => {
    const res = await api.get('/manager/batteries');
    return res.data.batteries.map(b => ({
      _id: b.battery_id,
      stationId: b.station_id,
      batteryModel: b.battery_model,
      capacity: b.capacity,
      health: Number(b.health),
      status: b.status,
      isEnabled: b.is_enabled !== false
    }));
  },

  createBatteryItem: async (data) => {
    const res = await api.post('/manager/batteries', {
      batteryModel: data.batteryModel,
      capacity: Number(data.capacity),
      health: Number(data.health),
      status: data.status
    });
    return res.data.battery;
  },

  updateBatteryItem: async (id, data) => {
    const res = await api.put(`/manager/batteries/${id}`, {
      batteryModel: data.batteryModel,
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      health: data.health !== undefined ? Number(data.health) : undefined,
      status: data.status
    });
    return res.data.battery;
  },

  setBatteryEnabled: async (id, enabled) => {
    const res = await api.patch(`/manager/batteries/${id}/enabled`, { enabled });
    return res.data.battery;
  },

  emergencyStopSession: async (id) => {
    const res = await api.put(`/manager/sessions/${id}/emergency-stop`);
    return res.data;
  },
};
