import { listTasks, updateTask } from '../services/taskService.js';

export function getTasks(req, res) {
  res.json({
    data: listTasks({
      status: req.query.status,
      assignee: req.query.assignee,
      query: req.query.q,
    }),
  });
}

export function patchTask(req, res) {
  const task = updateTask(req.params.id, req.body || {});
  res.json({ data: task });
}
