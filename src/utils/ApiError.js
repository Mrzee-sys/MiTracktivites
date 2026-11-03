/**
 * Operational error with an HTTP status code. Throw these from controllers /
 * services; the central error handler turns them into JSON responses.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}

