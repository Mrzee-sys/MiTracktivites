import { Router } from 'express';
import multer from 'multer';
import {
  createEvent,
  deleteEvent,
  importIcsEvents,
  listEvents,
  updateEvent,
} from '../controllers/eventController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = Router();

// Keep uploaded .ics files in memory (up to 5 MB) for instant node-ical parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Authenticated users can view events; admins can create, import, update, and delete
router.get('/', requireAuth, listEvents);
router.post('/import', requireAuth, isAdmin, upload.single('file'), importIcsEvents);
router.post('/', requireAuth, isAdmin, createEvent);
router.put('/:id', requireAuth, isAdmin, updateEvent);
router.delete('/:id', requireAuth, isAdmin, deleteEvent);

export default router;

