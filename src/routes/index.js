import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import activityRoutes from './activityRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';
import adminRoutes from './adminRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/activities', activityRoutes);
router.use('/sessions', sessionRoutes);
router.use('/logs', activityLogRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);

export default router;
