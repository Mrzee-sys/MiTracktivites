import bcrypt from 'bcryptjs';
import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

const BCRYPT_ROUNDS = 12;

/**
 * Temporary email-verification state. Only a SHA-256 hash of the code is
 * stored, never the code itself; the whole sub-document is removed once the
 * user is verified.
 */
const verificationSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned unless explicitly requested
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    userRightId: {
      type: Number,
      default: 0,
    },
    avatarUrl: {
      type: String,
      maxlength: [300000, 'Avatar image is too large'],
      default: '',
    },
    verification: {
      type: verificationSchema,
      select: false,
    },
  },
  {
    ...baseSchemaOptions,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.verification;
        return ret;
      },
    },
  },
);

/** Hashes and sets a plain-text password (length is validated upstream). */
userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

/** Requires the document to have been loaded with `.select('+passwordHash')`. */
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);

