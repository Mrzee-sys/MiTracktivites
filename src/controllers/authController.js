import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/token.js';
import { sendVerificationEmail } from '../services/mailer.js';
import {
  createVerification,
  matchesCode,
  MAX_VERIFY_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from '../services/verificationCode.js';
import {
  validateLogin,
  validateRegister,
  validateResend,
  validateVerify,
} from '../validators/authValidator.js';

const INVALID_CODE = 'Invalid or expired verification code';

const authResponse = (user) => ({
  token: signAccessToken(user),
  user: {
    id: user._id,
    email: user.email,
    isVerified: user.isVerified,
    userRightId: user.userRightId ?? 0,
    avatarUrl: user.avatarUrl || '',
  },
});

const isInCooldown = (user) =>
  Boolean(user.verification?.lastSentAt) &&
  Date.now() - user.verification.lastSentAt.getTime() < RESEND_COOLDOWN_MS;

/** Generates a new code, persists its hash and emails the plain code. */
async function issueVerificationCode(user) {
  const { code, verification } = createVerification();
  user.verification = verification;
  await user.save();
  await sendVerificationEmail(user.email, code);
}

/**
 * POST /api/auth/register
 * Creates an unverified account and emails a verification code.
 * Re-registering an unverified email replaces the password and sends a new code.
 */
export async function register(req, res) {
  const { email, password } = validateRegister(req.body);

  let user = await User.findOne({ email }).select('+verification');

  if (user?.isVerified) {
    throw new ApiError(409, 'An account with this email already exists. Please log in.');
  }
  if (user && isInCooldown(user)) {
    throw new ApiError(429, 'A code was sent recently. Please wait a minute before trying again.');
  }

  const isNewUser = !user;
  user ??= new User({ email });
  await user.setPassword(password);

  try {
    await issueVerificationCode(user);
  } catch (err) {
    // Don't leave a half-registered account behind if the email couldn't be sent.
    if (isNewUser && user._id) await User.deleteOne({ _id: user._id, isVerified: false });
    if (err.code === 11000) throw err;
    console.error('📧 Failed to send verification email:', err);
    throw new ApiError(502, 'We could not send the verification email. Please try again.');
  }

  res.status(201).json({
    success: true,
    message: 'Account created. Check your email for a verification code.',
    data: { email: user.email },
  });
}

/**
 * POST /api/auth/verify
 * Confirms the emailed code, marks the account verified and logs the user in.
 */
export async function verify(req, res) {
  const { email, code } = validateVerify(req.body);

  const user = await User.findOne({ email }).select('+verification');

  if (user?.isVerified) {
    throw ApiError.badRequest('This email is already verified. Please log in.');
  }
  if (!user?.verification) throw ApiError.badRequest(INVALID_CODE);

  const { verification } = user;
  if (verification.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (verification.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new code.');
  }

  if (!matchesCode(code, verification.codeHash)) {
    // Atomic increment so parallel guesses can't bypass the attempt limit.
    await User.updateOne({ _id: user._id }, { $inc: { 'verification.attempts': 1 } });
    throw ApiError.badRequest(INVALID_CODE);
  }

  user.isVerified = true;
  user.verification = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified', data: authResponse(user) });
}

/**
 * POST /api/auth/login
 * Verified users receive a token. Unverified users get a 403 with
 * code EMAIL_NOT_VERIFIED (and a fresh code is emailed) so the client can
 * route them to the verification step.
 */
export async function login(req, res) {
  const { email, password } = validateLogin(req.body);

  const user = await User.findOne({ email }).select('+passwordHash +verification');
  const passwordOk = user ? await user.comparePassword(password) : false;

  if (!user || !passwordOk) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isVerified) {
    if (!isInCooldown(user)) {
      try {
        await issueVerificationCode(user);
      } catch (err) {
        console.error('📧 Failed to send verification email:', err);
      }
    }
    return res.status(403).json({
      success: false,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email. We sent a code to your inbox.',
      data: { email: user.email },
    });
  }

  res.json({ success: true, message: 'Logged in', data: authResponse(user) });
}

/**
 * POST /api/auth/resend
 * Sends a new code to an unverified account. Always responds generically so
 * the endpoint can't be used to discover which emails are registered.
 */
export async function resendCode(req, res) {
  const { email } = validateResend(req.body);

  const user = await User.findOne({ email }).select('+verification');
  if (user && !user.isVerified && !isInCooldown(user)) {
    try {
      await issueVerificationCode(user);
    } catch (err) {
      console.error('📧 Failed to send verification email:', err);
    }
  }

  res.json({
    success: true,
    message: 'If that account needs verification, a new code is on its way.',
  });
}

/** GET /api/auth/me — returns the authenticated user. */
export async function me(req, res) {
  const user = await User.findById(req.user.id).lean();
  if (!user) throw new ApiError(401, 'Invalid or expired session');
  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      userRightId: user.userRightId ?? 0,
      avatarUrl: user.avatarUrl || '',
    },
  });
}

/** PATCH /api/auth/avatar — updates the authenticated user's profile picture. */
export async function updateAvatar(req, res) {
  const { avatarUrl } = req.body ?? {};
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
    throw ApiError.badRequest('Please provide a valid image');
  }
  if (avatarUrl.length > 300_000) {
    throw ApiError.badRequest('Image is too large. Please choose a smaller photo.');
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatarUrl },
    { new: true, runValidators: true },
  ).lean();

  if (!user) throw new ApiError(401, 'Invalid or expired session');

  res.json({
    success: true,
    message: 'Profile picture updated',
    data: {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      userRightId: user.userRightId ?? 0,
      avatarUrl: user.avatarUrl || '',
    },
  });
}

