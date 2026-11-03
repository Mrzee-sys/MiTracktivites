import { ApiError } from './ApiError.js';

const PROTECTED_FIELDS = new Set(['_id', 'id', 'createdAt', 'updatedAt', '__v']);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Ensures the body is a plain object and strips server-managed fields. */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }
  return Object.fromEntries(Object.entries(body).filter(([key]) => !PROTECTED_FIELDS.has(key)));
}

function parsePagination({ page, limit }) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/**
 * Generates standard CRUD handlers for a Mongoose model.
 * Express 5 forwards rejected promises to the error handler automatically.
 *
 * @param {import('mongoose').Model} Model
 * @param {object}   [options]
 * @param {Array}    [options.populate]     Populate spec applied to reads/writes.
 * @param {object}   [options.sort]         Default sort for list().
 * @param {Function} [options.buildFilter]  (req.query) => Mongo filter for list().
 * @param {Function} [options.beforeDelete] async (id) => void; throw to block deletion.
 * @param {Function} [options.afterDelete]  async (doc) => void; clean up references.
 */
export function createCrudController(
  Model,
  { populate = [], sort = { createdAt: -1 }, buildFilter = () => ({}), beforeDelete, afterDelete } = {},
) {
  const label = Model.modelName;

  return {
    async list(req, res) {
      const { page, limit, skip } = parsePagination(req.query);
      const filter = buildFilter(req.query);

      const [data, total] = await Promise.all([
        Model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate).lean(),
        Model.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    },

    async getById(req, res) {
      const doc = await Model.findById(req.params.id).populate(populate).lean();
      if (!doc) throw ApiError.notFound(`${label} not found`);
      res.json({ success: true, data: doc });
    },

    async create(req, res) {
      const doc = await Model.create(sanitizeBody(req.body));
      await doc.populate(populate);
      res.status(201).json({ success: true, data: doc });
    },

    async update(req, res) {
      const doc = await Model.findByIdAndUpdate(req.params.id, sanitizeBody(req.body), {
        new: true,
        runValidators: true,
      }).populate(populate);
      if (!doc) throw ApiError.notFound(`${label} not found`);
      res.json({ success: true, data: doc });
    },

    async remove(req, res) {
      if (beforeDelete) await beforeDelete(req.params.id);
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw ApiError.notFound(`${label} not found`);
      if (afterDelete) await afterDelete(doc);
      res.status(204).end();
    },
  };
}

