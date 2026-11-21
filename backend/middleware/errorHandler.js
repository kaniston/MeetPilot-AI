import { env } from '../config/env.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = Number(error.statusCode) || 500;
  if (error.code === 'LIMIT_FILE_SIZE') statusCode = 413;
  if (error.code === 'LIMIT_UNEXPECTED_FILE') statusCode = 400;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error(error);
  }

  const body = {
    error: {
      message:
        statusCode >= 500 && env.nodeEnv === 'production'
          ? 'Something went wrong on the server.'
          : error.message || 'Something went wrong.',
      code: error.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    },
  };

  if (error.details) {
    body.error.details = error.details;
  }

  res.status(statusCode).json(body);
}
