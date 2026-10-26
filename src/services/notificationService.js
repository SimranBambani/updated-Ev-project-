import api from './api';

export const notificationService = {
  getAll: async () => {
    const res = await api.get('/customer/notifications');
    return res.data.notifications.map(n => ({
      _id: n.notification_id,
      id: n.notification_id,
      title: n.title,
      message: n.message,
      notificationType: n.notification_type || 'ALERT',
      status: n.status,
      createdAt: n.created_at
    }));
  },

  getByCustomerId: async (customerId) => {
    return notificationService.getAll();
  },

  markAsRead: async (id) => {
    await api.put(`/customer/notifications/${id}/read`);
    return { success: true };
  },

  markAllAsRead: async () => {
    const notifications = await notificationService.getAll();
    for (const n of notifications) {
      if (n.status === 'Unread') {
        await api.put(`/customer/notifications/${n._id}/read`);
      }
    }
    return { success: true };
  },

  delete: async (id) => {
    return { success: true };
  },

  createDeduplicated: async (notifData) => {
    return { success: true };
  },

  evaluateHeavyQueue: async () => {
    // Managed natively by backend queue simulation
    return { success: true };
  },

  evaluateBatteryStatus: async () => {
    // Managed natively by backend trigger system
    return { success: true };
  },
};
