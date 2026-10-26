import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../common/layout/Sidebar';
import { Navbar } from '../../common/layout/Navbar';
import { Footer } from '../../common/layout/Footer';
import { ManagerProvider } from '../../../context/ManagerContext';
import { FiGrid, FiZap, FiDatabase, FiSliders, FiActivity, FiBell } from 'react-icons/fi';

export const ManagerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const managerNavItems = [
    { label: 'Dashboard', path: '/manager', icon: FiGrid },
    { label: 'Charging Slots', path: '/manager/slots', icon: FiZap },
    { label: 'Battery Inventory', path: '/manager/battery', icon: FiDatabase },
    { label: 'Slot Allocation', path: '/manager/allocation', icon: FiSliders },
    { label: 'Live Monitoring', path: '/manager/monitoring', icon: FiActivity },
    { label: 'Notifications', path: '/manager/notifications', icon: FiBell },
  ];

  return (
    <ManagerProvider>
      <div className="min-h-screen flex bg-[#F8FAFC]">
        <Sidebar
          navItems={managerNavItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          roleTitle="Station Manager"
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="Station Management Console" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </ManagerProvider>
  );
};
