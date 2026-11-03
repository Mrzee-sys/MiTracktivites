import mongoose from 'mongoose';
import { env } from '../config/env.js';

/**
 * Normalises known error types (Mongoose, JSON parse, ApiError) into a
 * consistent { success, message, errors } response shape.
 * Express 5 forwards rejected promises from async handlers here automatically.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode ?? err.status ?? 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.name === 'CastError' ? `${e.path} must be a valid ${e.kind}` : e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}: expected ${err.kind}`;
    errors = undefined;
  } else if (err instanceof mongoose.Error.StrictModeError) {
    statusCode = 400;
    message = `Unknown field: ${err.path}`;
    errors = undefined;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue ?? {}).join(', ')}`;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    console.error('💥', err);
    if (env.isProduction) message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(!env.isProduction && { stack: err.stack }),
  });
}

