import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

const { ObjectId } = mongoose.Schema.Types;

export const SESSION_TYPES = Object.freeze(['Practice', 'Match', 'Meet', 'Event']);
export const MAX_DURATION_MINUTES = 24 * 60;

/**
 * One document per logged session. Every log lives in the single
 * `ActivityLogs` collection so totals (e.g. hours per sport per user) are a
 * simple aggregation over one collection.
 */
const activityLogSchema = new mongoose.Schema(
  {
    activityName: {
      type: String,
      required: [true, 'activityName is required'],
      trim: true,
      minlength: [1, 'activityName cannot be empty'],
      maxlength: [100, 'activityName cannot exceed 100 characters'],
      index: true, // fast filtering by sport
    },
    sessionType: {
      type: String,
      required: [true, 'sessionType is required'],
      enum: { values: SESSION_TYPES, message: `sessionType must be one of: ${SESSION_TYPES.join(', ')}` },
    },
    durationMinutes: {
      type: Number,
      required: [true, 'durationMinutes is required'],
      min: [1, 'durationMinutes must be at least 1'],
      max: [MAX_DURATION_MINUTES, `durationMinutes cannot exceed ${MAX_DURATION_MINUTES}`],
      validate: { validator: Number.isInteger, message: 'durationMinutes must be a whole number' },
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    coachOnDuty: {
      type: String,
      trim: true,
      maxlength: [100, 'coachOnDuty cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'notes cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true, // fast per-user queries / totals
    },
  },
  baseSchemaOptions,
);

// Explicit collection name so all logs land in `ActivityLogs`.
export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'ActivityLogs');

