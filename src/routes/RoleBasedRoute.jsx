import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/loading/Loader';

export const RoleBasedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen label="Checking User Permissions..." />;
  }

  if (!user || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
