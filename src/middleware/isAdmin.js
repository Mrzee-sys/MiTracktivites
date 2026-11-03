import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Requires an authenticated admin user (`userRightId === 1`).
 * Runs after `requireAuth`. If the JWT was minted before `userRightId` was
 * updated manually in MongoDB, it falls back to checking the database so
 * newly promoted admins gain access immediately.
 */
export async function isAdmin(req, _res, next) {
  if (!req.user?.id) {
    return next(new ApiError(401, 'Authentication required'));
  }

  // Always verify against MongoDB if req.user.userRightId !== 1, or check DB directly
  if (req.user.userRightId !== 1) {
    const dbUser = await User.findById(req.user.id).select('userRightId').lean();
    req.user.userRightId = dbUser?.userRightId ?? 0;
  }

  if (req.user.userRightId !== 1) {
    return next(new ApiError(403, 'Admin privileges required'));
  }

  return next();
}

