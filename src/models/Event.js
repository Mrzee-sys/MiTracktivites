import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

/**
 * School sports match or extracurricular event on the shared MiTracktivities calendar.
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [1, 'Event title cannot be empty'],
      maxlength: [200, 'Event title cannot exceed 200 characters'],
    },
    start: {
      type: Date,
      required: [true, 'Event start date/time is required'],
      index: true,
    },
    end: {
      type: Date,
      required: [true, 'Event end date/time is required'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
      default: '',
    },
    activityType: {
      type: String,
      trim: true,
      maxlength: [100, 'activityType cannot exceed 100 characters'],
      default: 'General',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
  },
  baseSchemaOptions,
);

eventSchema.index({ start: 1, end: 1 });

export const Event = mongoose.model('Event', eventSchema);

