import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { recommendStations } from '../controllers/customerController.js';

const router = express.Router();

router.use(authenticate);

// Expose charging station locator and recommendations list to all authenticated roles
router.get('/recommend', recommendStations);

export default router;
