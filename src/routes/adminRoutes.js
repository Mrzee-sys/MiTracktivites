import { Router } from 'express';
import { emailAdminReport, getAdminLogs } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = Router();

// Every admin route requires a valid JWT + userRightId === 1
router.use(requireAuth, isAdmin);

router.get('/logs', getAdminLogs);
router.post('/email-report', emailAdminReport);

export default router;

