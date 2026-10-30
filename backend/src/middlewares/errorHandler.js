const { AppError } = require('../utils/appError');
const { ResponseFormatter } = require('../utils/responseFormatter');
const { logger } = require('../config/logger');
const { env } = require('../config/env');
const { ZodError } = require('zod');

const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn({ path: req.path, errors: formattedErrors }, 'Validation Error');
    return ResponseFormatter.error(res, 'Validation failed', 400, formattedErrors);
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, 'Operational Server Error');
    } else {
      logger.warn({ statusCode: err.statusCode, message: err.message, path: req.path }, 'Operational Client Error');
    }
    return ResponseFormatter.error(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof SyntaxError && err.status === 400) {
    logger.warn({ err, path: req.path }, 'Malformed JSON body');
    return ResponseFormatter.error(res, 'Invalid JSON payload received', 400);
  }

  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      path: req.path,
      method: req.method,
    },
    '🔥 Unhandled Exception caught by global error handler'
  );

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return ResponseFormatter.error(res, message, 500);
};

module.exports = { errorHandler };