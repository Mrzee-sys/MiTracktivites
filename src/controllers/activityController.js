import { Activity } from '../models/Activity.js';
import { Session } from '../models/Session.js';
import { ApiError } from '../utils/ApiError.js';
import { createCrudController } from '../utils/createCrudController.js';

export const {
  list: getActivities,
  getById: getActivityById,
  create: createActivity,
  update: updateActivity,
  remove: deleteActivity,
} = createCrudController(Activity, {
  sort: { title: 1 },
  // Block deletion while sessions still reference this activity
  beforeDelete: async (id) => {
    if (await Session.exists({ activityId: id })) {
      throw new ApiError(409, 'Cannot delete an activity that still has sessions. Delete its sessions first.');
    }
  },
});
