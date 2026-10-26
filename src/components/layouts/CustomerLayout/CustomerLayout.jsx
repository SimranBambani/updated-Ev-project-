import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../common/layout/Sidebar';
import { Navbar } from '../../common/layout/Navbar';
import { Footer } from '../../common/layout/Footer';
import { CustomerProvider } from '../../../context/CustomerContext';
import { MapProvider } from '../../../context/MapContext';
import { FiGrid, FiTruck, FiCalendar, FiBell, FiClock, FiUser } from 'react-icons/fi';

export const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const customerNavItems = [
    { label: 'Dashboard & Stations', path: '/customer', icon: FiGrid },
    { label: 'My Vehicles', path: '/customer/vehicles', icon: FiTruck },
    { label: 'Bookings & Progress', path: '/customer/bookings', icon: FiCalendar },
    { label: 'Notifications', path: '/customer/notifications', icon: FiBell },
    { label: 'Charging History', path: '/customer/history', icon: FiClock },
    { label: 'My Profile', path: '/profile', icon: FiUser },
  ];

  return (
    <CustomerProvider>
      <MapProvider>
        <div className="min-h-screen flex bg-[#F8FAFC]">
          <Sidebar
            navItems={customerNavItems}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            roleTitle="Customer Portal"
          />

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="EV Charging Hub" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
      </MapProvider>
    </CustomerProvider>
  );
};
