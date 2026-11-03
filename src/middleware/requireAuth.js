import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';

/**
 * Requires a valid `Authorization: Bearer <token>` header.
 * On success, `req.user` is set to `{ id, email }`.
 */
export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      userRightId: payload.userRightId ?? 0,
    };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired session'));
  }
}

