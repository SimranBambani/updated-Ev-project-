import api from './api';

export const customerService = {
  getAll: async () => {
    const res = await api.get('/admin/customers');
    return res.data.customers.map((c, idx) => {
      const u = c.user || {};
      const v = c.vehicles && c.vehicles.length > 0 ? c.vehicles[0] : {};
      const b = c.bookings && c.bookings.length > 0 ? c.bookings[0] : {};

      return {
        _id: c.customer_id,
        customerId: c.customer_id,
        name: u.name || 'Customer Name',
        gmail: u.email || 'customer@gmail.com',
        phone: u.phone || '9876543210',
        vehicleNumber: v.vehicle_number || 'EV-00-XX',
        vehicleModel: v.vehicle_model || 'Electric Vehicle',
        batteryModel: v.battery_model || 'Li-Ion Pack',
        batteryPct: v.current_charge !== undefined ? v.current_charge : 65,
        bookingStatus: b.booking_status || 'No Booking',
        allocatedSlot: b.booking_status === 'Waiting' ? 'Waiting in Queue' : (b.booking_status === 'Confirmed' || b.booking_status === 'Charging' ? 'Allocated' : 'No Active Slot'),
        bookingId: b.booking_id
      };
    });
  },

  getById: async (id) => {
    const all = await customerService.getAll();
    return all.find((c) => c._id === id || c.customerId === id);
  },

  create: async (data) => {
    const res = await api.post('/admin/customers', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address || 'Default Address',
      password: data.password || 'password123',
      vehicleNumber: data.vehicleNumber,
      vehicleModel: data.vehicleModel,
      batteryModel: data.batteryModel,
      batteryCapacity: data.batteryCapacity ? parseFloat(data.batteryCapacity) : 75.0,
      currentCharge: data.batteryPct ? parseFloat(data.batteryPct) : 65.0,
      vehicleType: data.vehicleType || 'Car'
    });
    return res.data.customer;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/customers/${id}`, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      vehicleNumber: data.vehicleNumber,
      vehicleModel: data.vehicleModel,
      batteryModel: data.batteryModel,
      batteryCapacity: data.batteryCapacity ? parseFloat(data.batteryCapacity) : undefined,
      currentCharge: data.batteryPct ? parseFloat(data.batteryPct) : undefined,
      vehicleType: data.vehicleType
    });
    return res.data.customer;
  },

  delete: async (id) => {
    await api.delete(`/admin/customers/${id}`);
    return { success: true };
  },
};
