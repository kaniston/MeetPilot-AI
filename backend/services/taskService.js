import { AppError } from '../utils/AppError.js';
import { normaliseDeadline, optionalText } from '../utils/validate.js';
import { mutateDatabase, readDatabase } from './store.js';

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'];

function decorateTask(task, database) {
  const meeting = database.meetings.find((entry) => entry.id === task.meetingId);

  return {
    ...task,
    meetingTitle: meeting?.title || 'Unknown meeting',
    meetingDate: meeting?.meetingDate || null,
  };
}

export function listTasks({ status, assignee, query } = {}) {
  const database = readDatabase();
  let tasks = database.tasks.map((task) => decorateTask(task, database));

  if (status && TASK_STATUSES.includes(status)) {
    tasks = tasks.filter((task) => task.status === status);
  }

  if (assignee) {
    const needle = assignee.toLowerCase();
    tasks = tasks.filter((task) => (task.assignedTo || '').toLowerCase() === needle);
  }

  if (query) {
    const needle = query.toLowerCase();
    tasks = tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(needle) ||
        (task.description || '').toLowerCase().includes(needle) ||
        (task.assignedTo || '').toLowerCase().includes(needle) ||
        (task.meetingTitle || '').toLowerCase().includes(needle)
      );
    });
  }

  return tasks.sort((a, b) => {
    if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt);
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

export function updateTask(id, payload) {
  return mutateDatabase((database) => {
    const task = database.tasks.find((entry) => entry.id === id);

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    if (payload.title !== undefined) {
      const title = optionalText(payload.title, 240);
      if (!title) throw new AppError('Task title cannot be empty.', 400, { field: 'title' });
      task.title = title;
    }

    if (payload.description !== undefined) {
      task.description = optionalText(payload.description, 3000);
    }

    if (payload.assignedTo !== undefined) {
      task.assignedTo = optionalText(payload.assignedTo, 160);
    }

    if (payload.deadline !== undefined) {
      task.deadline = normaliseDeadline(payload.deadline, 'deadline');
    }

    if (payload.status !== undefined) {
      if (!TASK_STATUSES.includes(payload.status)) {
        throw new AppError('Invalid task status.', 400, { field: 'status' });
      }
      task.status = payload.status;
    }

    task.updatedAt = new Date().toISOString();

    return decorateTask(task, database);
  });
}
