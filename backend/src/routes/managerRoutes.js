import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getStationSessions,
  getStationBookings,
  startSession,
  completeSession,
  getBatteries,
  createBattery,
  updateBattery,
  setBatteryEnabled,
  getSlots,
  createSlot,
  updateSlot,
  setSlotEnabled,
  emergencyStopSession,
  allocateSlot,
  getPluggedRecommendation
} from '../controllers/managerController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['Station Manager']));

// Sessions and vehicle status
router.get('/sessions', getStationSessions);
router.get('/bookings', getStationBookings);
router.post('/sessions/start', startSession);
router.put('/sessions/:id/complete', completeSession);
router.put('/sessions/:id/emergency-stop', emergencyStopSession);
router.get('/sessions/:sessionId/recommendation', getPluggedRecommendation);

// Slot Allocations
router.post('/slots/allocate', allocateSlot);

// Batteries Details CRUD
router.get('/batteries', getBatteries);
router.post('/batteries', createBattery);
router.put('/batteries/:id', updateBattery);
router.patch('/batteries/:id/enabled', setBatteryEnabled);

// Charging Slots CRUD
router.get('/slots', getSlots);
router.post('/slots', createSlot);
router.put('/slots/:id', updateSlot);
router.patch('/slots/:id/enabled', setSlotEnabled);

export default router;
