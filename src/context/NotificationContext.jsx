import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { notificationService } from '../services/notificationService';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      let data = [];
      if (user.role === 'Customer') {
        const customerId = user._id || user.customerId;
        data = customerId ? await notificationService.getByCustomerId(customerId) : [];
      } else {
        data = [];
      }

      const unreadData = (data || []).filter((n) => n.status === 'Unread');
      setNotifications(unreadData);
      setUnreadCount(unreadData.length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, loading, fetchNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
