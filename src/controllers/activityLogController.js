import { ActivityLog } from '../models/ActivityLog.js';
import { ApiError } from '../utils/ApiError.js';

// Allow a little clock skew between client and server.
const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/logs
 * Creates a log for the authenticated user. Only whitelisted body fields are
 * used; `userId` always comes from the verified token, never the request body.
 */
export async function createLog(req, res) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }

  const { activityName, sessionType, durationMinutes, coachOnDuty, notes, date } = body;

  let parsedDate;
  if (date !== undefined) {
    parsedDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      throw ApiError.badRequest('Validation failed', [{ field: 'date', message: 'date must be a valid date' }]);
    }
    if (parsedDate.getTime() > Date.now() + MAX_FUTURE_SKEW_MS) {
      throw ApiError.badRequest('Validation failed', [{ field: 'date', message: 'date cannot be in the future' }]);
    }
  }

  const log = await ActivityLog.create({
    activityName,
    sessionType,
    durationMinutes,
    ...(typeof coachOnDuty === 'string' && coachOnDuty.trim() && { coachOnDuty: coachOnDuty.trim() }),
    ...(typeof notes === 'string' && notes.trim() && { notes }),
    ...(parsedDate && { date: parsedDate }),
    userId: req.user.id,
  });

  res.status(201).json({ success: true, data: log });
}

/**
 * GET /api/logs/me
 * Returns the authenticated user's logged sessions sorted newest-first.
 */
export async function getMyLogs(req, res) {
  const logs = await ActivityLog.find({ userId: req.user.id }).sort({ date: -1 }).lean();
  res.json({ success: true, data: logs });
}

