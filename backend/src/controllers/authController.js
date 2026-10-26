import prisma from '../config/db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/crypto.js';

/**
 * Register a new user and corresponding role profile (Customer or Station Manager).
 */
export const register = async (req, res, next) => {
  const { name, email, password, phone, role, address, preferredStationId, stationId, shift } = req.body;

  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required parameters: name, email, password, role.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' }
      }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const hashedPassword = hashPassword(cleanPassword);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          phone: phone ? phone.trim() : null,
          role,
          is_active: true
        }
      });

      if (role === 'Customer') {
        const targetAddress = address || '123 EV Lane, New York';
        let targetPrefStation = preferredStationId;
        if (!targetPrefStation) {
          const firstStation = await tx.chargingStation.findFirst();
          targetPrefStation = firstStation ? firstStation.station_id : null;
        }
        await tx.customer.create({
          data: {
            user_id: newUser.user_id,
            name: newUser.name,
            address: targetAddress,
            preferred_station_id: targetPrefStation ? parseInt(targetPrefStation) : null
          }
        });
      } else if (role === 'Station Manager') {
        const targetShift = shift || 'Morning';
        let targetStationId = stationId;
        if (!targetStationId) {
          const firstStation = await tx.chargingStation.findFirst();
          targetStationId = firstStation ? firstStation.station_id : 1;
        }
        await tx.stationManager.create({
          data: {
            user_id: newUser.user_id,
            station_id: parseInt(targetStationId),
            shift: targetShift
          }
        });
      }

      return newUser;
    });

    // Remove password hash from response
    delete result.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: result
    });
  } catch (error) {
    if (error.message && error.message.includes('required')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Log in a user and issue a JWT token.
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' }
      }
    });

    if (!user || !comparePassword(cleanPassword, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been disabled. Please contact support to reactivate your account.'
      });
    }

    // Determine additional identifiers based on role
    let roleProfileId = null;
    let stationId = null;

    if (user.role === 'Customer') {
      const customer = await prisma.customer.findFirst({ where: { user_id: user.user_id } });
      if (customer) roleProfileId = customer.customer_id;
    } else if (user.role === 'Station Manager') {
      const manager = await prisma.stationManager.findFirst({ where: { user_id: user.user_id } });
      if (manager) {
        roleProfileId = manager.manager_id;
        stationId = manager.station_id;
      }
    }

    // Generate JWT token
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      roleProfileId,
      stationId
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        is_active: user.is_active,
        roleProfileId,
        stationId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current user's profile from the database.
 */
export const getProfile = async (req, res, next) => {
  const userId = req.user.user_id;
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the current user's profile in the database.
 */
export const updateProfile = async (req, res, next) => {
  const userId = req.user.user_id;
  const { name, email, phone } = req.body;

  try {
    if (!name && !email && phone === undefined) {
      return res.status(400).json({ success: false, message: 'At least one field (name, email, phone) is required.' });
    }

    // Build update data
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email && email.trim()) {
      // Check email uniqueness (excluding self)
      const existing = await prisma.user.findFirst({
        where: {
          email: { equals: email.trim().toLowerCase(), mode: 'insensitive' },
          NOT: { user_id: userId }
        }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another account.' });
      }
      updateData.email = email.trim().toLowerCase();
    }
    // phone can be empty string (clearing) or a value
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { user_id: userId },
        data: updateData,
        select: {
          user_id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true
        }
      });

      // Sync name to Customer profile if applicable
      if (updateData.name && user.role === 'Customer') {
        await tx.customer.updateMany({
          where: { user_id: userId },
          data: { name: updateData.name }
        });
      }

      return user;
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * Disable the current user's account (soft-disable, not permanent deletion).
 */
export const disableAccount = async (req, res, next) => {
  const userId = req.user.user_id;

  try {
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.is_active) {
      return res.status(400).json({ success: false, message: 'Account is already disabled.' });
    }

    // Check for active charging sessions before disabling
    if (user.role === 'Customer') {
      const customer = await prisma.customer.findFirst({ where: { user_id: userId } });
      if (customer) {
        const activeSession = await prisma.chargingSession.findFirst({
          where: {
            session_status: 'Charging',
            booking: { customer_id: customer.customer_id }
          }
        });
        if (activeSession) {
          return res.status(400).json({
            success: false,
            message: 'Cannot disable account while an active charging session is in progress. Please wait for it to complete.'
          });
        }
      }
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: { is_active: false }
    });

    res.status(200).json({
      success: true,
      message: 'Account disabled successfully. Your data has been preserved. Contact support to reactivate.'
    });
  } catch (error) {
    next(error);
  }
};
