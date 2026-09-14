import express from 'express';
import db, { logAudit, createNotification, recordWorkflowHistory } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Tasks with Filters
router.get('/', authenticate, (req, res) => {
  const { client_id, project_id, assigned_to, status, priority, overdue, search } = req.query;

  let sql = `
    SELECT t.*, c.company_name, c.client_code,
           p.project_name,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           rev.first_name || ' ' || rev.last_name as reviewer_name,
           creator.username as created_by_username
    FROM tasks t
    JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN employees e ON t.assigned_employee_id = e.id
    LEFT JOIN employees rev ON t.reviewer_id = rev.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE 1=1
  `;
  const params = [];

  // Client visibility: client only sees tasks with client_visible = 1 for their company
  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ? AND t.client_visible = 1`;
    params.push(req.user.id);
  } else if (req.user.role_name === 'editor' && req.employee) {
    // Editor sees tasks assigned to them or unassigned
    sql += ` AND (t.assigned_employee_id = ? OR t.assigned_employee_id IS NULL)`;
    params.push(req.employee.id);
  }

  if (client_id) {
    sql += ` AND t.client_id = ?`;
    params.push(client_id);
  }
  if (project_id) {
    sql += ` AND t.project_id = ?`;
    params.push(project_id);
  }
  if (assigned_to) {
    sql += ` AND t.assigned_employee_id = ?`;
    params.push(assigned_to);
  }
  if (status) {
    sql += ` AND t.status = ?`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND t.priority = ?`;
    params.push(priority);
  }
  if (overdue === 'true') {
    sql += ` AND t.due_date < DATE('now') AND t.status != 'COMPLETED'`;
  }
  if (search) {
    sql += ` AND (t.task_title LIKE ? OR t.task_code LIKE ? OR c.company_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY CASE WHEN t.priority = 'URGENT' THEN 1 WHEN t.priority = 'HIGH' THEN 2 WHEN t.priority = 'MEDIUM' THEN 3 ELSE 4 END, t.due_date ASC`;
  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

// Single Task Detail
router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, c.company_name, c.client_code,
           p.project_name,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           rev.first_name || ' ' || rev.last_name as reviewer_name
    FROM tasks t
    JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN employees e ON t.assigned_employee_id = e.id
    LEFT JOIN employees rev ON t.reviewer_id = rev.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Comments (respecting internal privacy boundary)
  let commentsSql = `
    SELECT tc.*, u.username, u.user_type
    FROM task_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.task_id = ?
  `;
  if (req.user.user_type === 'client') {
    commentsSql += ` AND tc.is_internal = 0`;
  }
  commentsSql += ` ORDER BY tc.created_at ASC`;
  const comments = db.prepare(commentsSql).all(task.id);

  // Workflow history
  const history = db.prepare(`
    SELECT wh.*, u.username as changed_by_user
    FROM workflow_history wh
    LEFT JOIN users u ON wh.changed_by = u.id
    WHERE wh.entity_type = 'task' AND wh.entity_id = ?
    ORDER BY wh.changed_at DESC
  `).all(task.id);

  res.json({ task, comments, history });
});

// Create Task (Section 18)
router.post('/', authenticate, (req, res) => {
  const {
    task_title, client_id, project_id, service_id, task_type, description,
    assigned_employee_id, reviewer_id, priority, start_date, due_date,
    estimated_hours, dependencies, client_visible, status
  } = req.body;

  if (!task_title || !client_id || !due_date) {
    return res.status(400).json({ error: 'Task title, client, and due date are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count + 1;
  const task_code = `TSK-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO tasks (
      task_code, task_title, client_id, project_id, service_id, task_type,
      description, assigned_employee_id, created_by, reviewer_id, priority,
      start_date, due_date, estimated_hours, dependencies, client_visible, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task_code, task_title, client_id, project_id || null, service_id || null,
    task_type || 'Creative Production', description || '', assigned_employee_id || null,
    req.user.id, reviewer_id || null, priority || 'MEDIUM', start_date || new Date().toISOString().split('T')[0],
    due_date, Number(estimated_hours) || 0, dependencies || '',
    client_visible !== undefined ? (client_visible ? 1 : 0) : 1, status || 'TODO'
  );

  const taskId = result.lastInsertRowid;

  // Record initial workflow stage
  recordWorkflowHistory({
    entityType: 'task',
    entityId: taskId,
    previousStage: null,
    newStage: status || 'TODO',
    changedBy: req.user.id,
    remarks: 'Task created'
  });

  // Notify assigned employee if specified
  if (assigned_employee_id) {
    const emp = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(assigned_employee_id);
    if (emp) {
      createNotification({
        userId: emp.user_id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You were assigned task ${task_code}: "${task_title}" due on ${due_date}.`,
        relatedEntity: 'tasks',
        relatedEntityId: taskId
      });
    }
  }

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'tasks',
    entityId: taskId,
    newValue: { task_code, task_title, client_id, assigned_employee_id, due_date },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  res.status(201).json({ message: 'Task created successfully', task: created });
});

// Update Task Status / Details
router.put('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const {
    task_title, task_type, description, assigned_employee_id, reviewer_id,
    priority, due_date, actual_hours, status, client_visible
  } = req.body;

  const previousStatus = task.status;
  const newStatus = status || task.status;

  db.prepare(`
    UPDATE tasks SET
      task_title = coalesce(?, task_title),
      task_type = coalesce(?, task_type),
      description = coalesce(?, description),
      assigned_employee_id = coalesce(?, assigned_employee_id),
      reviewer_id = coalesce(?, reviewer_id),
      priority = coalesce(?, priority),
      due_date = coalesce(?, due_date),
      actual_hours = coalesce(?, actual_hours),
      status = ?,
      client_visible = coalesce(?, client_visible),
      completed_at = CASE WHEN ? = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    task_title, task_type, description, assigned_employee_id, reviewer_id,
    priority, due_date, actual_hours, newStatus,
    client_visible !== undefined ? (client_visible ? 1 : 0) : null,
    newStatus, task.id
  );

  // If status changed, record workflow history & notification
  if (newStatus !== previousStatus) {
    recordWorkflowHistory({
      entityType: 'task',
      entityId: task.id,
      previousStage: previousStatus,
      newStage: newStatus,
      changedBy: req.user.id,
      remarks: `Status updated from ${previousStatus} to ${newStatus}`
    });

    logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGED',
      entity: 'tasks',
      entityId: task.id,
      oldValue: { status: previousStatus },
      newValue: { status: newStatus },
      ip: req.ip
    });
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ message: 'Task updated successfully', task: updated });
});

// Add Task Comment
router.post('/:id/comments', authenticate, (req, res) => {
  const { comment, is_internal } = req.body;
  if (!comment) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const internalFlag = req.user.user_type === 'client' ? 0 : (is_internal !== undefined ? (is_internal ? 1 : 0) : 1);

  const result = db.prepare(`
    INSERT INTO task_comments (task_id, user_id, comment, is_internal)
    VALUES (?, ?, ?, ?)
  `).run(task.id, req.user.id, comment, internalFlag);

  res.status(201).json({ message: 'Comment added', comment_id: result.lastInsertRowid });
});

export default router;
