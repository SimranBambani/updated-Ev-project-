import React, { createContext, useState, useEffect, useCallback } from 'react';
import { slotService } from '../services/slotService';
import { bookingService } from '../services/bookingService';

export const ManagerContext = createContext();

export const ManagerProvider = ({ children }) => {
  const [slots, setSlots] = useState([]);
  const [chargingSessions, setChargingSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [batteryInventory, setBatteryInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchManagerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sList, sessList, bkList, bList] = await Promise.all([
        slotService.getAllSlots(),
        slotService.getAllSessions(),
        bookingService.getAll(),
        slotService.getBatteryInventory(),
      ]);
      setSlots(sList);
      setChargingSessions(sessList);
      setBookings(bkList);
      setBatteryInventory(bList);
      return true;
    } catch (err) {
      console.error('Failed to fetch manager context data', err);
      setError(err.response?.data?.message || 'Unable to load station data. Check the connection and retry.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerData();
    const intervalId = setInterval(fetchManagerData, 15000);
    return () => clearInterval(intervalId);
  }, [fetchManagerData]);

  const waitingBookings = bookings.filter((b) => b.bookingStatus === 'Waiting');

  return (
    <ManagerContext.Provider
      value={{
        slots,
        chargingSessions,
        bookings,
        waitingBookings,
        batteryInventory,
        loading,
        error,
        refreshManagerData: fetchManagerData,
        setSlots,
        setChargingSessions,
        setBookings,
        setBatteryInventory,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};
