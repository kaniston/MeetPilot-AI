const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function parseDateValue(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, options = {}) {
  const date = parseDateValue(value);
  if (!date) return 'Not specified';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatShortDate(value) {
  const date = parseDateValue(value);
  if (!date) return 'No date';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatMonth(value) {
  const date = parseDateValue(value);
  return date ? MONTHS_SHORT[date.getMonth()] : '—';
}

export function formatDay(value) {
  const date = parseDateValue(value);
  return date ? String(date.getDate()).padStart(2, '0') : '—';
}

export function formatRelativeTime(value) {
  const date = parseDateValue(value);
  if (!date) return '';

  const difference = Date.now() - date.getTime();
  const minutes = Math.round(difference / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return formatDate(value);
}

export function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(value) {
  const date = parseDateValue(value);
  if (!date) return null;

  const today = parseDateValue(todayKey());
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function isTaskOverdue(task) {
  if (!task?.deadline || task.status === 'completed') return false;
  return task.deadline.slice(0, 10) < todayKey();
}

export function isTaskDueToday(task) {
  if (!task?.deadline || task.status === 'completed') return false;
  return task.deadline.slice(0, 10) === todayKey();
}

export function getInitials(name) {
  if (!name || name.toLowerCase() === 'not specified') return '?';

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function displayOwner(value) {
  if (!value || value.trim().toLowerCase() === 'not specified') return 'Unassigned';
  return value.trim();
}

export function displayDeadline(value) {
  if (!value) return 'No deadline';
  return formatDate(value);
}

export function titleCaseStatus(status) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  return 'Pending';
}
