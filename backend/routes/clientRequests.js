import express from 'express';
import db, { logAudit, createNotification, recordWorkflowHistory } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper: Auto-suggest employee ID based on category and client assignment (Section 23)
function suggestAssignee(clientId, category) {
  const creativeCategories = ['New Creative', 'Design Change', 'Video', 'Reel'];
  const marketingCategories = ['Social Media', 'Content', 'Advertisement'];

  if (creativeCategories.includes(category)) {
    // Look for assigned Editor
    const editor = db.prepare(`
      SELECT employee_id FROM employee_assignments
      WHERE client_id = ? AND (employee_role LIKE '%Editor%' OR employee_role LIKE '%Creative%') AND is_active = 1
      LIMIT 1
    `).get(clientId);
    if (editor) return editor.employee_id;
  }

  // Otherwise check assigned Marketing Manager
  const client = db.prepare('SELECT assigned_marketing_manager_id, account_manager_id FROM clients WHERE id = ?').get(clientId);
  if (client?.assigned_marketing_manager_id) return client.assigned_marketing_manager_id;
  if (client?.account_manager_id) return client.account_manager_id;

  // Fallback to any active employee
  const anyEmp = db.prepare("SELECT id FROM employees WHERE employment_status = 'Active' LIMIT 1").get();
  return anyEmp ? anyEmp.id : null;
}

// List Client Requests
router.get('/', authenticate, (req, res) => {
  const { client_id, status, category, priority, assigned_to, search } = req.query;

  let sql = `
    SELECT cr.*, c.company_name, c.client_code,
           p.project_name,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           e.designation as assigned_employee_designation,
           u.username as created_by_username
    FROM client_requests cr
    JOIN clients c ON cr.client_id = c.id
    LEFT JOIN projects p ON cr.project_id = p.id
    LEFT JOIN employees e ON cr.assigned_employee_id = e.id
    LEFT JOIN users u ON cr.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ?`;
    params.push(req.user.id);
  } else if (req.user.role_name === 'editor' && req.employee) {
    sql += ` AND cr.assigned_employee_id = ?`;
    params.push(req.employee.id);
  }

  if (client_id) {
    sql += ` AND cr.client_id = ?`;
    params.push(client_id);
  }
  if (status) {
    sql += ` AND cr.status = ?`;
    params.push(status);
  }
  if (category) {
    sql += ` AND cr.category = ?`;
    params.push(category);
  }
  if (priority) {
    sql += ` AND cr.priority = ?`;
    params.push(priority);
  }
  if (assigned_to) {
    sql += ` AND cr.assigned_employee_id = ?`;
    params.push(assigned_to);
  }
  if (search) {
    sql += ` AND (cr.request_title LIKE ? OR cr.request_code LIKE ? OR c.company_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY CASE WHEN cr.priority = 'URGENT' THEN 1 WHEN cr.priority = 'HIGH' THEN 2 WHEN cr.priority = 'MEDIUM' THEN 3 ELSE 4 END, cr.id DESC`;
  const requests = db.prepare(sql).all(...params);
  res.json(requests);
});

// Single Request Detail (with comments & history)
router.get('/:id', authenticate, (req, res) => {
  const request = db.prepare(`
    SELECT cr.*, c.company_name, c.client_code,
           p.project_name,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           e.designation as assigned_employee_designation,
           e.phone as assigned_employee_phone,
           u.username as created_by_username
    FROM client_requests cr
    JOIN clients c ON cr.client_id = c.id
    LEFT JOIN projects p ON cr.project_id = p.id
    LEFT JOIN employees e ON cr.assigned_employee_id = e.id
    LEFT JOIN users u ON cr.created_by = u.id
    WHERE cr.id = ?
  `).get(req.params.id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Comments
  let commentsSql = `
    SELECT rc.*, u.username, u.user_type
    FROM request_comments rc
    JOIN users u ON rc.user_id = u.id
    WHERE rc.request_id = ?
  `;
  if (req.user.user_type === 'client') {
    commentsSql += ` AND rc.is_internal = 0`;
  }
  commentsSql += ` ORDER BY rc.created_at ASC`;
  const comments = db.prepare(commentsSql).all(request.id);

  // Workflow history
  const history = db.prepare(`
    SELECT wh.*, u.username as changed_by_user
    FROM workflow_history wh
    LEFT JOIN users u ON wh.changed_by = u.id
    WHERE wh.entity_type = 'request' AND wh.entity_id = ?
    ORDER BY wh.changed_at DESC
  `).all(request.id);

  res.json({ request, comments, history });
});

// Create Client Request (Section 22)
router.post('/', authenticate, (req, res) => {
  let {
    client_id, project_id, request_title, category, description,
    due_date, priority, reference_file_url, preferred_platform, assigned_employee_id
  } = req.body;

  // If client user, auto-assign client_id
  if (req.user.user_type === 'client') {
    const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.id);
    if (!client) {
      return res.status(400).json({ error: 'Client record not found for user.' });
    }
    client_id = client.id;
  }

  if (!client_id || !request_title || !category || !description) {
    return res.status(400).json({ error: 'Client, request title, category, and description are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM client_requests').get().count + 1;
  const request_code = `REQ-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  const requested_date = new Date().toISOString().split('T')[0];

  // Auto-suggest assignee if not provided
  const targetAssigneeId = assigned_employee_id || suggestAssignee(client_id, category);

  const result = db.prepare(`
    INSERT INTO client_requests (
      request_code, client_id, project_id, request_title, category, description,
      requested_date, due_date, priority, reference_file_url, preferred_platform,
      assigned_employee_id, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?)
  `).run(
    request_code, client_id, project_id || null, request_title, category, description,
    requested_date, due_date || null, priority || 'MEDIUM', reference_file_url || null,
    preferred_platform || null, targetAssigneeId, req.user.id
  );

  const requestId = result.lastInsertRowid;

  // Create or link Client Chat for this request (Section 31 & 51)
  const chatName = `${request_code}: ${request_title}`;
  const chatRes = db.prepare(`
    INSERT INTO chats (chat_type, name, client_id, project_id, request_id)
    VALUES ('CLIENT_COMMUNICATION', ?, ?, ?, ?)
  `).run(chatName, client_id, project_id || null, requestId);

  // Add client user and assigned employee to chat
  db.prepare('INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)').run(chatRes.lastInsertRowid, req.user.id);
  if (targetAssigneeId) {
    const emp = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(targetAssigneeId);
    if (emp) {
      db.prepare('INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)').run(chatRes.lastInsertRowid, emp.user_id);
      createNotification({
        userId: emp.user_id,
        type: 'REQUEST_ASSIGNED',
        title: `New Client Request: ${request_code}`,
        message: `Assigned: "${request_title}" (${category}).`,
        relatedEntity: 'client_requests',
        relatedEntityId: requestId
      });
    }
  }

  recordWorkflowHistory({
    entityType: 'request',
    entityId: requestId,
    previousStage: null,
    newStage: 'NEW',
    changedBy: req.user.id,
    remarks: 'Request opened by client'
  });

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'client_requests',
    entityId: requestId,
    newValue: { request_code, request_title, category, priority },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM client_requests WHERE id = ?').get(requestId);
  res.status(201).json({ message: 'Request created successfully', request: created });
});

// Update Request Status
router.put('/:id', authenticate, (req, res) => {
  const request = db.prepare('SELECT * FROM client_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const { status, assigned_employee_id, resolution_notes, priority } = req.body;
  const previousStatus = request.status;
  const newStatus = status || request.status;

  db.prepare(`
    UPDATE client_requests SET
      status = ?,
      assigned_employee_id = coalesce(?, assigned_employee_id),
      resolution_notes = coalesce(?, resolution_notes),
      priority = coalesce(?, priority),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, assigned_employee_id, resolution_notes, priority, request.id);

  if (newStatus !== previousStatus) {
    recordWorkflowHistory({
      entityType: 'request',
      entityId: request.id,
      previousStage: previousStatus,
      newStage: newStatus,
      changedBy: req.user.id,
      remarks: `Status updated from ${previousStatus} to ${newStatus}`
    });

    logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGED',
      entity: 'client_requests',
      entityId: request.id,
      oldValue: { status: previousStatus },
      newValue: { status: newStatus },
      ip: req.ip
    });
  }

  const updated = db.prepare('SELECT * FROM client_requests WHERE id = ?').get(request.id);
  res.json({ message: 'Request updated successfully', request: updated });
});

// Add Request Comment
router.post('/:id/comments', authenticate, (req, res) => {
  const { comment, is_internal, attachment_url } = req.body;
  if (!comment) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const request = db.prepare('SELECT * FROM client_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const internalFlag = req.user.user_type === 'client' ? 0 : (is_internal !== undefined ? (is_internal ? 1 : 0) : 0);

  const result = db.prepare(`
    INSERT INTO request_comments (request_id, user_id, comment, is_internal, attachment_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(request.id, req.user.id, comment, internalFlag, attachment_url || null);

  res.status(201).json({ message: 'Comment added', comment_id: result.lastInsertRowid });
});

export default router;
