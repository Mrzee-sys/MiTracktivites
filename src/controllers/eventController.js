import ical from 'node-ical';
import { Event } from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';

const KNOWN_ACTIVITIES = [
  'Athletics',
  'Cricket',
  'Cross Country',
  'E-Sports',
  'Hockey',
  'Netball',
  'Rugby',
  'Soccer',
  'Softball',
  'Tennis',
  'Art Club',
  'Book Club',
  'Chess',
  'First Aid',
  'Photography',
];

/** Infer an activityType from an iCal summary/categories string when possible. */
function inferActivityType(summary = '', categories = []) {
  const haystack = `${summary} ${Array.isArray(categories) ? categories.join(' ') : ''}`.toLowerCase();
  const match = KNOWN_ACTIVITIES.find((act) => haystack.includes(act.toLowerCase()));
  return match || 'General';
}

/** Extract a clean string from an iCal field (which can sometimes be `{ val: '...' }`). */
function toText(field) {
  if (!field) return '';
  if (typeof field === 'string') return field.trim();
  if (typeof field === 'object' && typeof field.val === 'string') return field.val.trim();
  return String(field).trim();
}

/** Parse and validate a Date input. */
function parseDateField(value, fieldName) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${fieldName} date`);
  }
  return date;
}

/**
 * GET /api/events
 * Returns all scheduled matches/events sorted chronologically.
 */
export async function listEvents(req, res) {
  const { activityType, from, to } = req.query;
  const filter = {};

  if (typeof activityType === 'string' && activityType.trim() && activityType !== 'All') {
    filter.activityType = activityType.trim();
  }
  if (from || to) {
    filter.start = {};
    if (from) filter.start.$gte = parseDateField(from, 'from');
    if (to) filter.start.$lte = parseDateField(to, 'to');
  }

  const events = await Event.find(filter).sort({ start: 1 }).lean();
  res.json({ success: true, data: events });
}

/**
 * POST /api/events
 * Creates a new match/event.
 */
export async function createEvent(req, res) {
  const { title, start, end, location, activityType, description } = req.body ?? {};

  if (typeof title !== 'string' || !title.trim()) {
    throw ApiError.badRequest('Event title is required');
  }

  const startDate = parseDateField(start, 'start');
  const endDate = end ? parseDateField(end, 'end') : new Date(startDate.getTime() + 60 * 60 * 1000);

  if (endDate < startDate) {
    throw ApiError.badRequest('End date/time must be on or after start date/time');
  }

  const created = await Event.create({
    title: title.trim(),
    start: startDate,
    end: endDate,
    location: typeof location === 'string' ? location.trim() : '',
    activityType: typeof activityType === 'string' && activityType.trim() ? activityType.trim() : 'General',
    description: typeof description === 'string' ? description.trim() : '',
  });

  res.status(201).json({ success: true, data: created });
}

/**
 * PUT /api/events/:id
 * Updates an existing match/event.
 */
export async function updateEvent(req, res) {
  const { title, start, end, location, activityType, description } = req.body ?? {};
  const updates = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw ApiError.badRequest('Event title cannot be empty');
    }
    updates.title = title.trim();
  }
  if (start !== undefined) updates.start = parseDateField(start, 'start');
  if (end !== undefined) updates.end = parseDateField(end, 'end');
  if (updates.start && updates.end && updates.end < updates.start) {
    throw ApiError.badRequest('End date/time must be on or after start date/time');
  }
  if (typeof location === 'string') updates.location = location.trim();
  if (typeof activityType === 'string' && activityType.trim()) updates.activityType = activityType.trim();
  if (typeof description === 'string') updates.description = description.trim();

  const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!updated) throw ApiError.notFound('Event not found');
  res.json({ success: true, data: updated });
}

/**
 * DELETE /api/events/:id
 * Removes a scheduled match/event.
 */
export async function deleteEvent(req, res) {
  const deleted = await Event.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Event not found');
  res.json({ success: true, message: 'Event deleted', data: { id: deleted._id } });
}

/**
 * POST /api/events/import
 * Parses an uploaded Google Calendar / Outlook `.ics` file (via multer memoryStorage),
 * maps VEVENT entries to the Event schema, and bulk-inserts them into MongoDB.
 */
export async function importIcsEvents(req, res) {
  if (!req.file?.buffer) {
    throw ApiError.badRequest('Please upload a valid .ics calendar file');
  }

  const rawIcs = req.file.buffer.toString('utf8');
  let parsed;
  try {
    parsed = await ical.async.parseICS(rawIcs);
  } catch (err) {
    throw ApiError.badRequest(`Could not parse .ics file: ${err.message}`);
  }

  const docsToInsert = [];

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== 'VEVENT' || !item.start) continue;

    const startDate = new Date(item.start);
    if (Number.isNaN(startDate.getTime())) continue;

    const endDate =
      item.end && !Number.isNaN(new Date(item.end).getTime())
        ? new Date(item.end)
        : new Date(startDate.getTime() + 60 * 60 * 1000);

    const title = (toText(item.summary) || 'Imported Event').slice(0, 200);
    const location = toText(item.location).slice(0, 200);
    const description = toText(item.description).slice(0, 2000);
    const activityType = inferActivityType(title, item.categories);

    docsToInsert.push({
      title,
      start: startDate,
      end: endDate >= startDate ? endDate : startDate,
      location,
      activityType,
      description,
    });
  }

  if (docsToInsert.length === 0) {
    throw ApiError.badRequest('No valid calendar events (VEVENT) were found in the uploaded .ics file');
  }

  const inserted = await Event.insertMany(docsToInsert, { ordered: false });

  res.status(201).json({
    success: true,
    message: `Imported ${inserted.length} event${inserted.length === 1 ? '' : 's'} from .ics file`,
    count: inserted.length,
    data: inserted,
  });
}

