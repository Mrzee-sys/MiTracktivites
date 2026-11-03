import { ApiError } from '../utils/ApiError.js';
import { CODE_LENGTH } from '../services/verificationCode.js';

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes of input; reject longer passwords explicitly.
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_REGEX = new RegExp(`^\\d{${CODE_LENGTH}}$`);

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }
}

function validateEmail(email, errors) {
  if (typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
    return undefined;
  }
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !EMAIL_REGEX.test(normalized)) {
    errors.push({ field: 'email', message: 'Enter a valid email address' });
  }
  return normalized;
}

function throwIfErrors(errors) {
  if (errors.length > 0) throw ApiError.badRequest('Validation failed', errors);
}

/** Validates { email, password } for registration, enforcing the 8-character minimum. */
export function validateRegister(body) {
  assertObject(body);
  const errors = [];
  const email = validateEmail(body.email, errors);
  const { password } = body;

  if (typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push({ field: 'password', message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_LENGTH) {
    errors.push({ field: 'password', message: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters` });
  }

  throwIfErrors(errors);
  return { email, password };
}

/** Validates { email, password } for login (no strength rules, just presence). */
export function validateLogin(body) {
  assertObject(body);
  const errors = [];
  const email = validateEmail(body.email, errors);
  if (typeof body.password !== 'string' || body.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }
  throwIfErrors(errors);
  return { email, password: body.password };
}

/** Validates { email, code } for email verification. */
export function validateVerify(body) {
  assertObject(body);
  const errors = [];
  const email = validateEmail(body.email, errors);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!CODE_REGEX.test(code)) {
    errors.push({ field: 'code', message: `Enter the ${CODE_LENGTH}-digit code from your email` });
  }
  throwIfErrors(errors);
  return { email, code };
}

/** Validates { email } for resending a verification code. */
export function validateResend(body) {
  assertObject(body);
  const errors = [];
  const email = validateEmail(body.email, errors);
  throwIfErrors(errors);
  return { email };
}

