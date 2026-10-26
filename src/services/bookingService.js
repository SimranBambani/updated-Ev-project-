import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

export const bookingService = {
  getAll: async () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userStr) return [];
    const user = JSON.parse(userStr);

    if (user.role === 'Admin') {
      const res = await api.get('/admin/bookings');
      return (res.data.bookings || []).map(b => ({
        _id: b.booking_id,
        booking_id: b.booking_id,
        bookingTime: b.booking_time,
        bookingStatus: b.booking_status,
        customerName: b.customer?.user?.name || 'Customer',
        gmail: b.customer?.user?.email || 'customer@gmail.com',
        phone: b.customer?.user?.phone || '',
        stationName: b.station?.station_name || 'Station Hub',
        vehicleModel: b.vehicle?.vehicle_model || 'Vehicle Model',
        vehicleNumber: b.vehicle?.vehicle_number || 'EV-00-XX',
        allocatedSlotNumber: b.booking_status === 'Waiting' ? 'Waiting in Queue' : 'Allocated',
        estimatedWaitingTime: b.estimated_waiting_time
      }));
    }

    if (user.role === 'Station Manager') {
      const res = await api.get('/manager/bookings');
      return (res.data.bookings || []).map(b => {
        const allocation = b.allocations?.find(a => a.allocation_status === 'Allocated');
        return {
          _id: b.booking_id,
          booking_id: b.booking_id,
          bookingTime: b.booking_time,
          bookingStatus: b.booking_status,
          customerName: b.customer?.user?.name || b.customer?.name || 'Customer',
          gmail: b.customer?.user?.email || '',
          phone: b.customer?.user?.phone || '',
          stationName: b.station?.station_name || 'Station Hub',
          vehicleModel: b.vehicle?.vehicle_model || 'Vehicle Model',
          vehicleNumber: b.vehicle?.vehicle_number || 'EV-00-XX',
          allocatedSlotId: allocation?.slot_id,
          allocatedSlotNumber: allocation?.slot?.slot_number ? `Slot A-${allocation.slot.slot_number}` : 'Waiting in Queue',
          currentBattery: b.vehicle?.current_charge
        };
      });
    }

    // Customer bookings view
    const res = await api.get('/customer/bookings');
    return (res.data.bookings || []).map(b => ({
      _id: b.booking_id,
      booking_id: b.booking_id,
      bookingTime: b.booking_time,
      bookingStatus: b.booking_status,
      stationName: b.station?.station_name || 'Station Hub',
      vehicleModel: b.vehicle?.vehicle_model || 'Vehicle Model',
      vehicleNumber: b.vehicle?.vehicle_number || 'EV-00-XX',
      batteryModel: b.vehicle?.battery_model || '',
      estimatedChargingTime: b.estimated_charging_time || 0,
      estimatedWaitingTime: b.estimated_waiting_time || 0,
      allocatedSlotNumber: b.booking_status === 'Waiting' ? 'Waiting in Queue' : 'Confirmed - Slot Allocated',
      currentBattery: b.vehicle?.current_charge || 0,
    }));
  },

  getByCustomerId: async (customerId) => {
    const res = await api.get('/customer/bookings');
    return (res.data.bookings || []).map(b => ({
      _id: b.booking_id,
      booking_id: b.booking_id,
      bookingTime: b.booking_time,
      bookingStatus: b.booking_status,
      stationName: b.station?.station_name || 'Station Hub',
      vehicleModel: b.vehicle?.vehicle_model || 'Vehicle Model',
      vehicleNumber: b.vehicle?.vehicle_number || 'EV-00-XX',
      batteryModel: b.vehicle?.battery_model || '',
      estimatedChargingTime: b.estimated_charging_time || 0,
      estimatedWaitingTime: b.estimated_waiting_time || 0,
      allocatedSlotNumber: b.booking_status === 'Waiting' ? 'Waiting in Queue' : 'Confirmed - Slot Allocated',
      currentBattery: b.vehicle?.current_charge || 0,
    }));
  },

  getById: async (id) => {
    const all = await bookingService.getAll();
    return all.find((b) => b.booking_id === parseInt(id) || b._id === id);
  },

  create: async (data) => {
    const res = await api.post('/customer/bookings', {
      vehicleId: parseInt(data.vehicleId),
      stationId: parseInt(data.stationId),
      preferredSpeed: data.preferredSpeed || 'Fast',
    });
    return res.data.booking;
  },

  /**
   * Cancel a booking by ID — calls real backend API.
   */
  cancel: async (id) => {
    const res = await api.put(`/customer/bookings/${id}/cancel`);
    return res.data;
  },

  allocateSlotToWaitingVehicle: async (bookingId, slotId) => {
    const res = await api.post('/manager/slots/allocate', {
      bookingId: parseInt(bookingId),
      slotId: parseInt(slotId)
    });
    return res.data.allocation;
  },

  startChargingSession: async (bookingId, slotId) => {
    const res = await api.post('/manager/sessions/start', {
      bookingId: parseInt(bookingId),
      slotId: parseInt(slotId)
    });
    return res.data.session;
  },

  completeChargingSession: async (sessionId) => {
    const res = await api.put(`/manager/sessions/${sessionId}/complete`, {
      finalBattery: 100,
      energyConsumed: 0
    });
    return res.data.session;
  },

  update: async (id, data) => {
    return { success: true };
  },

  delete: async (id) => {
    return { success: true };
  },
};
