import mongoose, { baseSchemaOptions } from '../config/mongoose.js';

const { ObjectId } = mongoose.Schema.Types;

const sessionSchema = new mongoose.Schema(
  {
    activityId: {
      type: ObjectId,
      ref: 'Activity',
      required: [true, 'activityId is required'],
      validate: {
        // Referential integrity: the activity must actually exist
        validator: async (id) => Boolean(await mongoose.model('Activity').exists({ _id: id })),
        message: (props) => `Activity ${props.value} does not exist`,
      },
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      default: Date.now,
    },
    attendance: {
      type: [{ type: ObjectId, ref: 'Student' }],
      default: [],
      validate: [
        {
          validator: (ids) => new Set(ids.map(String)).size === ids.length,
          message: 'Attendance contains duplicate students',
        },
        {
          validator: async (ids) =>
            ids.length === 0 ||
            (await mongoose.model('Student').countDocuments({ _id: { $in: ids } })) === ids.length,
          message: 'Attendance references one or more students that do not exist',
        },
      ],
    },
  },
  baseSchemaOptions,
);

sessionSchema.index({ activityId: 1, date: -1 });
sessionSchema.index({ attendance: 1 });

export const Session = mongoose.model('Session', sessionSchema);

