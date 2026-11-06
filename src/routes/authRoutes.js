import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, me, register, resendCode, updateAvatar, verify } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

/** Throttle credential / code endpoints per IP to slow brute-force attempts. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/verify', authLimiter, verify);
router.post('/login', authLimiter, login);
router.post('/resend', authLimiter, resendCode);
router.get('/me', requireAuth, me);
router.patch('/avatar', requireAuth, updateAvatar);

export default router;

