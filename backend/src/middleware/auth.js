import { verifyToken } from '../utils/crypto.js';
import prisma from '../config/db.js';

/**
 * Express middleware to authenticate users using JWT and verify account is still active.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }

  // Verify account is still active in the database (handles post-token disable)
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { user_id: true, is_active: true }
    });

    if (!user || !user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been disabled. Please contact support to reactivate.'
      });
    }
  } catch (err) {
    // If DB check fails (e.g., connectivity), fall through to allow request (graceful degradation)
    console.error('Auth middleware DB check failed:', err.message);
  }

  req.user = decoded;
  next();
};

/**
 * Express middleware helper to enforce role authorization.
 * @param {string[]} allowedRoles - List of authorized roles (Admin, Customer, Station Manager)
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};
