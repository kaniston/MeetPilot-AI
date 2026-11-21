import { isTaskOverdue, todayKey } from './format.js';

export function getWorkspaceStats(meetings = [], tasks = []) {
  const pending = tasks.filter((task) => task.status === 'pending').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const overdue = tasks.filter(isTaskOverdue).length;

  const upcoming = tasks
    .filter(
      (task) =>
        task.status !== 'completed' &&
        task.deadline &&
        task.deadline.slice(0, 10) >= todayKey(),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const missingOwners = tasks.filter(
    (task) => !task.assignedTo || task.assignedTo.trim().toLowerCase() === 'not specified',
  ).length;

  const missingDeadlines = tasks.filter((task) => !task.deadline).length;

  const now = new Date();
  const meetingsThisMonth = meetings.filter((meeting) => {
    const date = new Date(`${meeting.meetingDate}T00:00:00`);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return {
    meetings: meetings.length,
    meetingsThisMonth,
    tasks: tasks.length,
    pending,
    inProgress,
    completed,
    overdue,
    upcoming,
    missingOwners,
    missingDeadlines,
    completionRate,
  };
}
