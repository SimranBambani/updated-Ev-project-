import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

// Layouts
import { AuthLayout } from '../components/layouts/AuthLayout/AuthLayout';
import { AdminLayout } from '../components/layouts/AdminLayout/AdminLayout';
import { ManagerLayout } from '../components/layouts/ManagerLayout/ManagerLayout';
import { CustomerLayout } from '../components/layouts/CustomerLayout/CustomerLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Shared Pages
import { Profile } from '../pages/shared/Profile';
import { NotFound } from '../pages/shared/NotFound';
import { Unauthorized } from '../pages/shared/Unauthorized';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { CustomerManagement } from '../pages/admin/CustomerManagement';
import { WaitingVehicles } from '../pages/admin/WaitingVehicles';
import { ManagerManagement } from '../pages/admin/ManagerManagement';
import { StationManagement } from '../pages/admin/StationManagement';
import { Reports } from '../pages/admin/Reports';

// Manager Pages
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { SlotManagement } from '../pages/manager/SlotManagement';
import { BatteryInventory } from '../pages/manager/BatteryInventory';
import { SlotAllocation } from '../pages/manager/SlotAllocation';
import { LiveMonitoring } from '../pages/manager/LiveMonitoring';
import { ManagerNotifications } from '../pages/manager/ManagerNotifications';

// Customer Pages
import { CustomerDashboard } from '../pages/customer/CustomerDashboard';
import { VehicleManagement } from '../pages/customer/VehicleManagement';
import { Bookings } from '../pages/customer/Bookings';
import { CustomerNotifications } from '../pages/customer/CustomerNotifications';
import { ChargingHistory } from '../pages/customer/ChargingHistory';

// Smart Home Redirection Helper
const HomeRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'Admin') return <Navigate to="/admin" replace />;
  if (role === 'Station Manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/customer" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Admin Module */}
        <Route element={<RoleBasedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="waiting" element={<WaitingVehicles />} />
            <Route path="managers" element={<ManagerManagement />} />
            <Route path="stations" element={<StationManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Station Manager Module */}
        <Route element={<RoleBasedRoute allowedRoles={['Station Manager']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="slots" element={<SlotManagement />} />
            <Route path="battery" element={<BatteryInventory />} />
            <Route path="allocation" element={<SlotAllocation />} />
            <Route path="monitoring" element={<LiveMonitoring />} />
            <Route path="notifications" element={<ManagerNotifications />} />
          </Route>
        </Route>

        {/* Customer Module */}
        <Route element={<RoleBasedRoute allowedRoles={['Customer', 'Admin', 'Station Manager']} />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboard />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="notifications" element={<CustomerNotifications />} />
            <Route path="history" element={<ChargingHistory />} />
          </Route>
        </Route>

        {/* Profile Page Accessible to all logged-in roles */}
        <Route path="/profile" element={<CustomerLayout />}>
          <Route index element={<Profile />} />
        </Route>
      </Route>

      {/* Error & Unauthorized Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
