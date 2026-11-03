import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [1, 'Student name cannot be empty'],
      maxlength: [100, 'Student name cannot exceed 100 characters'],
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [20, 'Grade cannot exceed 20 characters'],
    },
    guardianContact: {
      type: String,
      trim: true,
      maxlength: [200, 'Guardian contact cannot exceed 200 characters'],
    },
  },
  baseSchemaOptions,
);

studentSchema.index({ name: 1 });

export const Student = mongoose.model('Student', studentSchema);

