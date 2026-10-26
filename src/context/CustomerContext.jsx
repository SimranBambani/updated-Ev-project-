import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { vehicleService } from '../services/vehicleService';
import { bookingService } from '../services/bookingService';
import { stationService } from '../services/stationService';
import { AuthContext } from './AuthContext';

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      // Determine logged-in customer ID
      const customerId = user?.roleProfileId || user?.user_id;

      const [vList, bList, sList] = await Promise.all([
        customerId ? vehicleService.getByCustomerId(customerId) : Promise.resolve([]),
        customerId ? bookingService.getByCustomerId(customerId) : bookingService.getAll(),
        stationService.getAll(),
      ]);

      // Filter ACTIVE stations only for Customer view
      const activeStationsOnly = (sList || []).filter((stn) => stn.status === 'Active');

      setVehicles(vList || []);
      setBookings(bList || []);
      setStations(activeStationsOnly);
    } catch (err) {
      console.error('Failed to load Customer context data', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const value = useMemo(
    () => ({
      vehicles,
      bookings,
      stations,
      loading,
      refreshCustomerData: fetchCustomerData,
      setVehicles,
      setBookings,
    }),
    [vehicles, bookings, stations, loading, fetchCustomerData]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};
