import api from './api';

export const stationService = {
  getStationsSync: () => [],

  getAll: async (latitude = 28.4950, longitude = 77.0895, vehicleId = null) => {
    const params = { latitude, longitude };
    if (vehicleId) params.vehicleId = vehicleId;

    const res = await api.get('/stations/recommend', { params });
    const list = res.data.stations || res.data.recommendations || [];
    return list.map((s) => ({
      _id: s.station_id,
      id: s.station_id,
      stationId: s.station_id,
      stationName: s.station_name,
      address: s.address,
      city: s.city,
      latitude: parseFloat(s.latitude),
      longitude: parseFloat(s.longitude),
      totalSlots: s.total_slots,
      availableSlots: s.available_slots,
      status: s.status,
      distance: s.distanceKM ?? s.distance,
      waitingTime: s.estimatedWaitingTime ?? s.waiting_time,
      estimatedChargingTime: s.estimatedChargingTime,
      recommendationScore: s.recommendationScore,
      pricingPerKWh: '₹15.00',
      avgRating: 4.8
    }));
  },

  getById: async (id) => {
    // Queries general recommended list and matches id
    const stations = await stationService.getAll();
    return stations.find((s) => s.stationId === parseInt(id) || s._id === id);
  },

  create: async (data) => {
    // Admin station CRUD can be added if needed, otherwise returns created station model
    const res = await api.post('/admin/stations', {
      stationName: data.stationName,
      address: data.address,
      city: data.city,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      totalSlots: parseInt(data.totalSlots)
    });
    return res.data.station;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/stations/${id}`, data);
    return res.data.station;
  },

  delete: async (id) => {
    await api.delete(`/admin/stations/${id}`);
    return { success: true };
  },
};
