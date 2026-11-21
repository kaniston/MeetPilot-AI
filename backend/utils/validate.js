import { AppError } from './AppError.js';

export function requireText(value, field, { min = 1, max = 50000 } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} is required.`, 400, { field });
  }

  const trimmed = value.trim();

  if (trimmed.length < min) {
    throw new AppError(`${field} must be at least ${min} characters.`, 400, { field });
  }

  if (trimmed.length > max) {
    throw new AppError(`${field} must be ${max} characters or fewer.`, 400, { field });
  }

  return trimmed;
}

export function optionalText(value, max = 2000) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function normaliseDate(value, field = 'date') {
  if (value === null || value === undefined || value === '') return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date.`, 400, { field });
  }

  return date.toISOString();
}

export function normaliseDateOnly(value, field = 'meetingDate') {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} is required.`, 400, { field });
  }

  const trimmed = value.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const date = new Date(isDateOnly ? `${trimmed}T00:00:00Z` : trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date.`, 400, { field });
  }

  return date.toISOString().slice(0, 10);
}

export function normaliseDeadline(value, field = 'deadline') {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a date string.`, 400, { field });
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const date = new Date(isDateOnly ? `${trimmed}T00:00:00Z` : trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date.`, 400, { field });
  }

  return date.toISOString().slice(0, 10);
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
