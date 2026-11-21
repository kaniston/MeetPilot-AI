import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ListChecks,
  Pencil,
  Plus,
  Search,
  UserRoundX,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Alert from '../components/ui/Alert.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { displayOwner, formatDate, isTaskDueToday, isTaskOverdue } from '../utils/format.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export default function Tasks() {
  const { tasks, loading, updateTask } = useWorkspace();
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [editError, setEditError] = useState('');

  const assignees = useMemo(() => {
    return [...new Set(tasks.map((task) => displayOwner(task.assignedTo)))]
      .filter((name) => name !== 'Unassigned')
      .sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const hasUnassignedTasks = useMemo(
    () => tasks.some((task) => displayOwner(task.assignedTo) === 'Unassigned'),
    [tasks],
  );

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      in_progress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;

      if (assigneeFilter !== 'all' && displayOwner(task.assignedTo) !== assigneeFilter) {
        return false;
      }

      if (!needle) return true;

      return (
        task.title.toLowerCase().includes(needle) ||
        (task.description || '').toLowerCase().includes(needle) ||
        displayOwner(task.assignedTo).toLowerCase().includes(needle) ||
        (task.meetingTitle || '').toLowerCase().includes(needle)
      );
    });
  }, [tasks, statusFilter, assigneeFilter, query]);

  async function handleStatusChange(task, nextStatus) {
    setActionError('');
    setUpdatingId(task.id);

    try {
      await updateTask(task.id, { status: nextStatus });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editingTask) return;

    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setEditError('');

    try {
      await updateTask(editingTask.id, {
        title: formData.get('title'),
        description: formData.get('description'),
        assignedTo: formData.get('assignedTo'),
        deadline: formData.get('deadline') || null,
        status: formData.get('status'),
      });
      setEditingTask(null);
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setStatusFilter('all');
    setAssigneeFilter('all');
    setQuery('');
  }

  const hasFilters = statusFilter !== 'all' || assigneeFilter !== 'all' || query.trim() !== '';

  return (
    <div>
      <PageHeader
        eyebrow="Execution"
        title="Tasks that stay accountable."
        description="Every action item, connected to its source meeting, owner, and deadline."
        actions={
          <Link to="/meetings/new" className="btn btn-primary">
            <Plus size={16} />
            <span>New meeting</span>
          </Link>
        }
      />

      {loading ? (
        <LoadingState label="Loading tasks…" />
      ) : (
        <>
          {actionError ? (
            <Alert tone="danger" title="Could not update the task">
              {actionError}
            </Alert>
          ) : null}

          <Card className="list-card">
            <div className="tasks-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filter tasks by status">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === filter.value}
                    className={`filter-tab ${statusFilter === filter.value ? 'filter-tab-active' : ''}`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                    <span className="filter-count">{counts[filter.value]}</span>
                  </button>
                ))}
              </div>

              <div className="toolbar-controls">
                <label className="search-field search-field-small">
                  <Search size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks"
                    aria-label="Search tasks"
                  />
                </label>

                <select
                  className="select"
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                  aria-label="Filter tasks by assignee"
                >
                  <option value="all">All owners</option>
                  {assignees.map((name) => (
                    <option value={name} key={name}>
                      {name}
                    </option>
                  ))}
                  {hasUnassignedTasks ? <option value="Unassigned">Unassigned</option> : null}
                </select>
              </div>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Action items you confirm in a meeting report become tracked tasks here."
                action={
                  <Link to="/meetings/new" className="btn btn-primary btn-sm">
                    <Plus size={14} />
                    <span>Analyse a meeting</span>
                  </Link>
                }
              />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No tasks match these filters"
                description="Try another status, owner, or search term."
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Task</th>
                        <th scope="col">Owner</th>
                        <th scope="col">Deadline</th>
                        <th scope="col">Meeting</th>
                        <th scope="col">Status</th>
                        <th scope="col"><span className="sr-only">Edit</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => {
                        const overdue = isTaskOverdue(task);
                        const dueToday = isTaskDueToday(task);
                        const owner = displayOwner(task.assignedTo);

                        return (
                          <tr key={task.id} className={overdue ? 'task-row-overdue' : ''}>
                            <td data-label="Task">
                              <div className="task-title-cell">
                                <span className="task-title">{task.title}</span>
                                <span className="task-description">
                                  {task.description || 'No description provided.'}
                                </span>
                              </div>
                            </td>
                            <td data-label="Owner">
                              {owner === 'Unassigned' ? (
                                <span className="missing-value">
                                  <UserRoundX size={13} />
                                  Unassigned
                                </span>
                              ) : (
                                <span className="owner-cell">
                                  <span className="avatar-sm" aria-hidden="true">
                                    {owner
                                      .split(/\s+/)
                                      .slice(0, 2)
                                      .map((part) => part[0])
                                      .join('')
                                      .toUpperCase()}
                                  </span>
                                  {owner}
                                </span>
                              )}
                            </td>
                            <td data-label="Deadline">
                              {task.deadline ? (
                                <span className="deadline-cell">
                                  <span className={overdue ? 'deadline-overdue' : ''}>
                                    {formatDate(task.deadline)}
                                  </span>
                                  {overdue ? (
                                    <Badge tone="danger">Overdue</Badge>
                                  ) : dueToday ? (
                                    <Badge tone="warning">Today</Badge>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="missing-value">
                                  <AlertTriangle size={13} />
                                  No deadline
                                </span>
                              )}
                            </td>
                            <td data-label="Meeting">
                              <Link to={`/meetings/${task.meetingId}`} className="table-link">
                                {task.meetingTitle}
                              </Link>
                            </td>
                            <td data-label="Status">
                              <span className="status-control">
                                <select
                                  className={`status-select status-${task.status}`}
                                  value={task.status}
                                  onChange={(event) => handleStatusChange(task, event.target.value)}
                                  disabled={updatingId === task.id}
                                  aria-label={`Status for ${task.title}`}
                                >
                                  {STATUS_OPTIONS.map((option) => (
                                    <option value={option.value} key={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </td>
                            <td data-label="Edit">
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => {
                                  setEditError('');
                                  setEditingTask(task);
                                }}
                                aria-label={`Edit ${task.title}`}
                              >
                                <Pencil size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">
                  <span>
                    Showing {filteredTasks.length} of {tasks.length} tasks
                  </span>
                  {hasFilters ? (
                    <button type="button" className="text-link" onClick={clearFilters}>
                      Clear filters
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit task"
        description="Keep the task connected to its meeting while updating the details."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingTask(null)}>
              Cancel
            </button>
            <button
              type="submit"
              form="task-edit-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        {editingTask ? (
          <form id="task-edit-form" className="modal-form" onSubmit={handleEditSubmit}>
            {editError ? <Alert tone="danger">{editError}</Alert> : null}

            <div className="field">
              <label className="field-label" htmlFor="edit-task-title">
                Task title
              </label>
              <input
                id="edit-task-title"
                name="title"
                className="input"
                type="text"
                defaultValue={editingTask.title}
                required
                maxLength={240}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="edit-task-description">
                Description
              </label>
              <textarea
                id="edit-task-description"
                name="description"
                className="input textarea"
                defaultValue={editingTask.description}
                rows={3}
                maxLength={3000}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="edit-task-owner">
                  Assigned person
                </label>
                <input
                  id="edit-task-owner"
                  name="assignedTo"
                  className="input"
                  type="text"
                  defaultValue={
                    displayOwner(editingTask.assignedTo) === 'Unassigned'
                      ? ''
                      : editingTask.assignedTo
                  }
                  placeholder="Leave blank if not specified"
                  maxLength={160}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="edit-task-deadline">
                  Deadline
                </label>
                <input
                  id="edit-task-deadline"
                  name="deadline"
                  className="input"
                  type="date"
                  defaultValue={editingTask.deadline?.slice(0, 10) || ''}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="edit-task-status">
                Status
              </label>
              <select
                id="edit-task-status"
                name="status"
                className="select select-full"
                defaultValue={editingTask.status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
