import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getManagers,
  createManager,
  updateManager,
  deleteManager,
  getVehicleHistory,
  generateReport,
  getBookings,
  getUsers
} from '../controllers/adminController.js';

const router = express.Router();

// Apply global protection to all admin sub-routes
router.use(authenticate);
router.use(requireRole(['Admin']));

// Customers Management
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Managers Management
router.get('/managers', getManagers);
router.post('/managers', createManager);
router.put('/managers/:id', updateManager);
router.delete('/managers/:id', deleteManager);

// Log histories and report analytics
router.get('/vehicles/history', getVehicleHistory);
router.post('/reports/generate', generateReport);
router.get('/reports/generate', generateReport);
router.get('/bookings', getBookings);
router.get('/users', getUsers);

export default router;
