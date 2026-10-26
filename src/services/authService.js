import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

export const DEV_SENDER_EMAIL = 'noreply@voltflow.io';

export const authService = {
  getUsersSync: () => [], // not needed when backend is connected

  login: async (email, password, selectedRole = null) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const res = await api.post('/auth/login', { email: cleanEmail, password: cleanPassword });
    
    const { token, user } = res.data;
    
    if (selectedRole) {
      const normSelected = selectedRole.trim().toLowerCase();
      const normActual = (user.role || '').trim().toLowerCase();
      if (normSelected !== normActual && normSelected !== 'all') {
        console.warn(`User authenticated as ${user.role}, overriding UI preset selection ${selectedRole}.`);
      }
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));

    return { token, user };
  },

  signup: async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanPassword = (userData.password || '').trim();

    // Register the user
    await api.post('/auth/register', {
      name: (userData.name || '').trim(),
      email: cleanEmail,
      password: cleanPassword,
      phone: userData.phone ? userData.phone.trim() : null,
      role: userData.role || 'Customer',
      address: userData.address || 'Default Address',
      stationId: userData.stationId,
      shift: userData.shift
    });

    // Auto-login after successful registration
    return authService.login(cleanEmail, cleanPassword, userData.role);
  },

  requestPasswordReset: async (gmailId) => {
    // Request reset link (mock/simulated for now, as we don't have active mail sender)
    await new Promise((res) => setTimeout(res, 500));
    const resetToken = `rst_token_${Date.now()}`;
    return {
      success: true,
      recipientEmail: gmailId,
      resetLink: `/reset-password?token=${resetToken}&email=${encodeURIComponent(gmailId)}`,
      message: `Password reset instructions simulated for ${gmailId}`,
    };
  },

  resetPassword: async (token, newPassword, email) => {
    // Reset password (mock/simulated)
    await new Promise((res) => setTimeout(res, 500));
    return { success: true, message: 'Password updated successfully' };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  },

  getCurrentUser: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  /**
   * Fetch the current user's profile fresh from the database.
   */
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data.user;
  },

  /**
   * Update the user's profile in the database and sync localStorage.
   */
  updateProfile: async (userId, updatedData) => {
    const res = await api.patch('/auth/profile', {
      name: updatedData.name,
      email: updatedData.email,
      phone: updatedData.phone !== undefined ? updatedData.phone : undefined,
    });

    const updatedUser = res.data.user;

    // Sync localStorage with fresh server data
    const currentUser = authService.getCurrentUser();
    const mergedUser = { ...currentUser, ...updatedUser };
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(mergedUser));

    return mergedUser;
  },

  /**
   * Disable the current user's account (soft disable, not deletion).
   */
  disableAccount: async () => {
    const res = await api.post('/auth/disable-account');
    return res.data;
  },
};
