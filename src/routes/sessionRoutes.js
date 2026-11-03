import { Router } from 'express';
import {
  createSession,
  deleteSession,
  getSessionById,
  getSessions,
  updateSession,
} from '../controllers/sessionController.js';

const router = Router();

router.route('/').get(getSessions).post(createSession);
router.route('/:id').get(getSessionById).patch(updateSession).delete(deleteSession);

export default router;

