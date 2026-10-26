import api from './api';

export const managerService = {
  getManagersSync: () => [],

  getAll: async () => {
    const res = await api.get('/admin/managers');
    return res.data.managers.map((m) => {
      const u = m.user || {};
      const s = m.station || {};
      return {
        _id: m.manager_id,
        managerId: m.manager_id,
        userId: m.user_id,
        stationId: m.station_id,
        name: u.name || 'Station Manager',
        email: u.email || 'manager@evcharge.com',
        phone: u.phone || '9876543210',
        stationName: s.station_name || 'Station assignment unavailable',
        shift: m.shift || 'Morning'
      };
    });
  },

  getById: async (id) => {
    const all = await managerService.getAll();
    return all.find((m) => m._id === id || m.managerId === id);
  },

  create: async (data) => {
    const res = await api.post('/admin/managers', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password || 'Manager@123',
      stationId: parseInt(data.stationId),
      shift: data.shift || 'Morning'
    });
    return res.data.manager;
  },

  update: async (id, data) => {
    const res = await api.put(`/admin/managers/${id}`, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      stationId: data.stationId ? parseInt(data.stationId) : undefined,
      shift: data.shift
    });
    return res.data.manager;
  },

  delete: async (id) => {
    await api.delete(`/admin/managers/${id}`);
    return { success: true };
  },
};
