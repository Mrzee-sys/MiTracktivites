import { Session } from '../models/Session.js';
import { createCrudController } from '../utils/createCrudController.js';

/**
 * Supported list filters:
 *   ?activityId=<id>   sessions for one activity
 *   ?studentId=<id>    sessions a student attended
 *   ?from=<ISO date>&to=<ISO date>   date range (inclusive)
 */
function buildSessionFilter({ activityId, studentId, from, to }) {
  const filter = {};
  if (typeof activityId === 'string') filter.activityId = activityId;
  if (typeof studentId === 'string') filter.attendance = studentId;
  if (typeof from === 'string' || typeof to === 'string') {
    filter.date = {};
    if (typeof from === 'string') filter.date.$gte = new Date(from);
    if (typeof to === 'string') filter.date.$lte = new Date(to);
  }
  return filter;
}

export const {
  list: getSessions,
  getById: getSessionById,
  create: createSession,
  update: updateSession,
  remove: deleteSession,
} = createCrudController(Session, {
  sort: { date: -1 },
  buildFilter: buildSessionFilter,
  populate: [
    { path: 'activityId', select: 'title schedule capacity' },
    { path: 'attendance', select: 'name grade' },
  ],
});

