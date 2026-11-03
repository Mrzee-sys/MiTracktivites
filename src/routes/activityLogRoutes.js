import { Router } from 'express';
import { createLog, getMyLogs } from '../controllers/activityLogController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Every log endpoint requires an authenticated user.
router.use(requireAuth);

router.get('/me', getMyLogs);
router.post('/', createLog);

export default router;

