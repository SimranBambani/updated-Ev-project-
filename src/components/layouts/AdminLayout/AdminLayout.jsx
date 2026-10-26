import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../common/layout/Sidebar';
import { Navbar } from '../../common/layout/Navbar';
import { Footer } from '../../common/layout/Footer';
import { AdminProvider } from '../../../context/AdminContext';
import { FiGrid, FiUsers, FiMapPin, FiBarChart2, FiUserCheck, FiClock } from 'react-icons/fi';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: FiGrid },
    { label: 'Customer Details', path: '/admin/customers', icon: FiUsers },
    { label: 'Waiting Vehicles', path: '/admin/waiting', icon: FiClock },
    { label: 'Station Managers', path: '/admin/managers', icon: FiUserCheck },
    { label: 'Charging Stations', path: '/admin/stations', icon: FiMapPin },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: FiBarChart2 },
  ];

  return (
    <AdminProvider>
      <div className="min-h-screen flex bg-[#F8FAFC]">
        <Sidebar
          navItems={adminNavItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          roleTitle="Admin Portal"
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="System Administration" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </AdminProvider>
  );
};
