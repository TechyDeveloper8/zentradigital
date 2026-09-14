import express from 'express';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Projects
router.get('/', authenticate, (req, res) => {
  const { client_id, status, search } = req.query;

  let sql = `
    SELECT p.*, c.company_name, c.client_code,
           pm.first_name || ' ' || pm.last_name as project_manager_name,
           (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
           (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_tasks
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN employees pm ON p.project_manager_id = pm.id
    WHERE 1=1
  `;
  const params = [];

  // Client view constraint: only client_visible projects belonging to their organization
  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ? AND p.client_visible = 1`;
    params.push(req.user.id);
  } else if (req.user.role_name !== 'admin') {
    // Non-admin employee: see projects where project manager or project member or client assigned
    sql += ` AND (
      p.project_manager_id = ? OR
      p.id IN (SELECT project_id FROM project_members WHERE employee_id = ?) OR
      p.client_id IN (SELECT client_id FROM employee_assignments WHERE employee_id = ? AND is_active = 1)
    )`;
    const empId = req.employee?.id || 0;
    params.push(empId, empId, empId);
  }

  if (client_id) {
    sql += ` AND p.client_id = ?`;
    params.push(client_id);
  }
  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (p.project_name LIKE ? OR p.project_code LIKE ? OR c.company_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY p.id DESC`;
  const projects = db.prepare(sql).all(...params);
  res.json(projects);
});

// Single Project Detail
router.get('/:id', authenticate, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, c.company_name, c.client_code,
           pm.first_name || ' ' || pm.last_name as project_manager_name,
           cs.service_name
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    LEFT JOIN employees pm ON p.project_manager_id = pm.id
    LEFT JOIN client_services cs ON p.service_id = cs.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Client access check
  if (req.user.user_type === 'client') {
    const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.id);
    if (!client || client.id !== project.client_id || !project.client_visible) {
      return res.status(403).json({ error: 'Access denied: Unauthorized project view.' });
    }
  }

  // Project Members
  const members = db.prepare(`
    SELECT pm.*, e.employee_code, e.first_name, e.last_name, e.designation, e.employee_type
    FROM project_members pm
    JOIN employees e ON pm.employee_id = e.id
    WHERE pm.project_id = ?
  `).all(project.id);

  // Tasks in this project
  let taskSql = `
    SELECT t.*, e.first_name || ' ' || e.last_name as assigned_name
    FROM tasks t
    LEFT JOIN employees e ON t.assigned_employee_id = e.id
    WHERE t.project_id = ?
  `;
  if (req.user.user_type === 'client') {
    taskSql += ` AND t.client_visible = 1`;
  }
  taskSql += ` ORDER BY t.due_date ASC`;
  const tasks = db.prepare(taskSql).all(project.id);

  // Content items in this project
  const contentItems = db.prepare(`
    SELECT ci.*, ed.first_name || ' ' || ed.last_name as editor_name
    FROM content_items ci
    LEFT JOIN employees ed ON ci.assigned_editor_id = ed.id
    WHERE ci.project_id = ?
    ORDER BY ci.publish_date ASC
  `).all(project.id);

  res.json({
    project,
    members,
    tasks,
    contentItems
  });
});

// Create Project (Section 15)
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    project_name, client_id, service_id, description, objective, start_date,
    end_date, project_manager_id, priority, budget, status, internal_notes,
    client_visible, assigned_employee_ids
  } = req.body;

  if (!project_name || !client_id || !start_date) {
    return res.status(400).json({ error: 'Project name, client, and start date are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get().count + 1;
  const project_code = `PRJ-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const createTransaction = db.transaction(() => {
    const pMgrId = project_manager_id || (req.employee ? req.employee.id : null);

    const result = db.prepare(`
      INSERT INTO projects (
        project_code, project_name, client_id, service_id, description, objective,
        start_date, end_date, project_manager_id, priority, budget, status,
        internal_notes, client_visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project_code, project_name, client_id, service_id || null, description || '',
      objective || '', start_date, end_date || null, pMgrId, priority || 'MEDIUM',
      Number(budget) || 0, status || 'PLANNING', internal_notes || '',
      client_visible !== undefined ? (client_visible ? 1 : 0) : 1
    );

    const projectId = result.lastInsertRowid;

    // Add project members
    if (assigned_employee_ids && Array.isArray(assigned_employee_ids)) {
      const insertMember = db.prepare('INSERT OR IGNORE INTO project_members (project_id, employee_id, role) VALUES (?, ?, ?)');
      for (const empId of assigned_employee_ids) {
        insertMember.run(projectId, empId, 'Team Member');
      }
    }

    return projectId;
  });

  const projectId = createTransaction();

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'projects',
    entityId: projectId,
    newValue: { project_code, project_name, client_id },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  res.status(201).json({ message: 'Project created successfully', project: created });
});

// Update Project
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const {
    project_name, service_id, description, objective, start_date, end_date,
    project_manager_id, priority, budget, status, internal_notes, client_visible
  } = req.body;

  db.prepare(`
    UPDATE projects SET
      project_name = coalesce(?, project_name),
      service_id = coalesce(?, service_id),
      description = coalesce(?, description),
      objective = coalesce(?, objective),
      start_date = coalesce(?, start_date),
      end_date = coalesce(?, end_date),
      project_manager_id = coalesce(?, project_manager_id),
      priority = coalesce(?, priority),
      budget = coalesce(?, budget),
      status = coalesce(?, status),
      internal_notes = coalesce(?, internal_notes),
      client_visible = coalesce(?, client_visible),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    project_name, service_id, description, objective, start_date, end_date,
    project_manager_id, priority, budget, status, internal_notes,
    client_visible !== undefined ? (client_visible ? 1 : 0) : null,
    project.id
  );

  if (status && status !== project.status) {
    logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGED',
      entity: 'projects',
      entityId: project.id,
      oldValue: { status: project.status },
      newValue: { status },
      ip: req.ip
    });
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  res.json({ message: 'Project updated successfully', project: updated });
});

export default router;
