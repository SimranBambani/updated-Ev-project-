import React, { createContext, useState, useEffect } from 'react';
import { stationService } from '../services/stationService';
import { managerService } from '../services/managerService';
import { customerService } from '../services/customerService';
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [stations, setStations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);

    const loadStns = stationService.getAll()
      .then((data) => setStations(data || []))
      .catch((err) => console.error('Failed to load stations', err));

    const loadMgrs = managerService.getAll()
      .then((data) => setManagers(data || []))
      .catch((err) => console.error('Failed to load managers', err));

    const loadCusts = customerService.getAll()
      .then((data) => setCustomers(data || []))
      .catch((err) => console.error('Failed to load customers', err));

    const loadStats = reportService.getDashboardStats()
      .then((data) => setStats(data || {}))
      .catch((err) => console.error('Failed to load stats', err));
    const loadBookings = bookingService.getAll()
      .then((data) => setBookings(data || []))
      .catch((err) => console.error('Failed to load bookings', err));
    const loadSessions = reportService.getChargingHistory()
      .then((data) => setSessions(data || []))
      .catch((err) => console.error('Failed to load charging sessions', err));

    try {
      await Promise.allSettled([loadStns, loadMgrs, loadCusts, loadStats, loadBookings, loadSessions]);
    } catch (err) {
      console.error('Failed to load Admin context data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        stations,
        managers,
        customers,
        bookings,
        sessions,
        stats,
        loading,
        refreshAdminData: fetchAdminData,
        setStations,
        setManagers,
        setCustomers,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
