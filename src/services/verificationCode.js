import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const CODE_LENGTH = 6;
export const MAX_VERIFY_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

/** Cryptographically secure, zero-padded numeric code, e.g. "048213". */
export function generateCode() {
  return crypto.randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
}

/** Keyed hash so a leaked database cannot be brute-forced offline without the secret. */
export function hashCode(code) {
  return crypto.createHmac('sha256', env.jwtSecret).update(code).digest('hex');
}

/** Constant-time comparison of a submitted code against the stored hash. */
export function matchesCode(code, codeHash) {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(codeHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Builds a fresh `verification` sub-document plus the plain code to email. */
export function createVerification() {
  const code = generateCode();
  const now = Date.now();
  return {
    code,
    verification: {
      codeHash: hashCode(code),
      expiresAt: new Date(now + env.verificationCodeTtlMinutes * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(now),
    },
  };
}

