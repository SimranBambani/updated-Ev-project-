import express from 'express';
import { register, login, getProfile, updateProfile, disableAccount } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Protected profile routes (requires authentication)
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/disable-account', authenticate, disableAccount);

export default router;
