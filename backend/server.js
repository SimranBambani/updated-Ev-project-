import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// Import Route Handlers
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import managerRoutes from './src/routes/managerRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import stationRoutes from './src/routes/stationRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS for the React/Vite development server
const corsOptions = {
  origin: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection testing on startup
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully via Prisma Client!');
  })
  .catch(err => {
    console.error('Database connection failed! Verify DB credentials and status.', err.stack || err);
  });

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/stations', stationRoutes);

// Health check endpoint (Public)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running"
  });
});

// Centralized error handling
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
