import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password, role);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.signup(userData);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  /**
   * Update profile via real backend API — saves to DB and syncs state.
   */
  const updateProfile = async (updatedData) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.user_id, updatedData);
    setUser(updated);
    return updated;
  };

  /**
   * Fetch fresh profile from database and sync local state.
   */
  const refreshProfile = async () => {
    try {
      const freshUser = await authService.getProfile();
      if (freshUser) {
        // Merge with existing local user data (preserve roleProfileId etc.)
        const mergedUser = { ...user, ...freshUser };
        setUser(mergedUser);
        localStorage.setItem('voltflow_user', JSON.stringify(mergedUser));
        return mergedUser;
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
    return user;
  };

  /**
   * Disable the current account — logs out after disabling.
   */
  const disableAccount = async () => {
    const result = await authService.disableAccount();
    // Log out immediately after disabling
    authService.logout();
    setUser(null);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        signup,
        logout,
        updateProfile,
        refreshProfile,
        disableAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
