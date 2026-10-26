import api from './api';

const mapVehicle = (v) => {
  if (!v) return null;
  return {
    _id: v.vehicle_id,
    vehicle_id: v.vehicle_id,
    customer_id: v.customer_id,
    vehicleNumber: v.vehicle_number,
    vehicleModel: v.vehicle_model,
    batteryModel: v.battery_model,
    batteryCapacity: v.battery_capacity,
    currentCharge: v.current_charge,
    vehicleType: v.vehicle_type,
    isActive: v.is_active !== undefined ? v.is_active : true,
  };
};

export const vehicleService = {
  getAll: async () => {
    const res = await api.get('/customer/vehicles');
    return (res.data.vehicles || []).map(mapVehicle);
  },

  getByCustomerId: async (customerId) => {
    const res = await api.get('/customer/vehicles');
    return (res.data.vehicles || []).map(mapVehicle);
  },

  getById: async (id) => {
    const res = await api.get('/customer/vehicles');
    const mapped = (res.data.vehicles || []).map(mapVehicle);
    return mapped.find((v) => v.vehicle_id === parseInt(id) || v._id === id);
  },

  create: async (data) => {
    // No fallback defaults — require all fields to be explicitly provided
    const res = await api.post('/customer/vehicles', {
      vehicleNumber: data.vehicleNumber,
      vehicleModel: data.vehicleModel,
      batteryModel: data.batteryModel,
      batteryCapacity: parseFloat(data.batteryCapacity),
      currentCharge: data.currentCharge !== undefined ? parseFloat(data.currentCharge) : 0.0,
      vehicleType: data.vehicleType,
    });
    return mapVehicle(res.data.vehicle);
  },

  update: async (id, data) => {
    const res = await api.put(`/customer/vehicles/${id}`, {
      vehicleNumber: data.vehicleNumber,
      vehicleModel: data.vehicleModel,
      batteryModel: data.batteryModel,
      batteryCapacity: data.batteryCapacity ? parseFloat(data.batteryCapacity) : undefined,
      currentCharge: data.currentCharge !== undefined && data.currentCharge !== '' ? parseFloat(data.currentCharge) : undefined,
      vehicleType: data.vehicleType,
    });
    return mapVehicle(res.data.vehicle);
  },

  /**
   * Toggle vehicle active/inactive status (replaces hard delete).
   */
  toggleActive: async (id) => {
    const res = await api.patch(`/customer/vehicles/${id}/toggle`);
    return mapVehicle(res.data.vehicle);
  },
};
