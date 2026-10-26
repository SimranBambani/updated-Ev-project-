import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  recommendStations,
  getVehicles,
  createVehicle,
  updateVehicle,
  toggleVehicleActive,
  createBooking,
  cancelBooking,
  getMyBookings,
  getMyAllocations,
  getNotifications,
  markNotificationRead,
  getMyChargingHistory
} from '../controllers/customerController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['Customer']));

// Recommendations
router.get('/stations/recommend', recommendStations);

// Customer vehicles CRUD
router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.patch('/vehicles/:id/toggle', toggleVehicleActive);

// Customer bookings
router.post('/bookings', createBooking);
router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);

// Allocations and notifications
router.get('/allocations', getMyAllocations);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/history', getMyChargingHistory);

export default router;
