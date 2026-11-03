import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      minlength: [1, 'Activity title cannot be empty'],
      maxlength: [100, 'Activity title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    schedule: {
      type: String,
      trim: true,
      maxlength: [200, 'Schedule cannot exceed 200 characters'],
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Capacity must be a whole number',
      },
    },
  },
  baseSchemaOptions,
);

activitySchema.index({ title: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
