import { Router } from 'express';
import {
  createActivity,
  deleteActivity,
  getActivities,
  getActivityById,
  updateActivity,
} from '../controllers/activityController.js';

const router = Router();

router.route('/').get(getActivities).post(createActivity);
router.route('/:id').get(getActivityById).patch(updateActivity).delete(deleteActivity);

export default router;

