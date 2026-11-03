import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Signs a JWT access token for the given user document. */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      userRightId: user.userRightId ?? 0,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      algorithm: 'HS256',
    },
  );
}

/** Verifies a token and returns its payload; throws on invalid/expired tokens. */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

