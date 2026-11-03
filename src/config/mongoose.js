import mongoose from 'mongoose';

/**
 * Global Mongoose configuration. Models import `mongoose` from here so these
 * settings are always applied before any schema is used.
 */

// Ignore unknown fields in query filters (prevents filter injection via ?foo=bar)
mongoose.set('strictQuery', true);

// Strict type checking: by default Mongoose silently coerces 5 -> "5" and
// "12" -> 12. Disabling these casters means a value of the wrong JSON type is
// rejected with a validation error instead of being quietly converted.
mongoose.Schema.Types.String.cast(false);
mongoose.Schema.Types.Number.cast(false);

/**
 * Shared schema options for every model:
 * - timestamps: adds createdAt / updatedAt
 * - strict 'throw': unknown fields cause an error instead of being dropped
 * - toJSON: hide the internal __v version key
 */
export const baseSchemaOptions = Object.freeze({
  timestamps: true,
  strict: 'throw',
  toJSON: { versionKey: false },
  toObject: { versionKey: false },
});

export default mongoose;

