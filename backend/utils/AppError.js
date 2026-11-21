/**
 * An error with an HTTP status code and optional machine-readable details.
 * Controllers can throw these; the central error handler turns them into JSON.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
