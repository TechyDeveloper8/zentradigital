import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Global Permission-Aware Search (Section 41)
router.get('/', authenticate, (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.json({ results: [] });
  }

  const s = `%${query}%`;
  const results = [];

  // 1. Clients
  if (req.user.user_type !== 'client') {
    const clients = db.prepare(`
      SELECT id, client_code as code, company_name as title, 'client' as type, status as subtitle
      FROM clients WHERE company_name LIKE ? OR client_code LIKE ? LIMIT 5
    `).all(s, s);
    results.push(...clients);
  }

  // 2. Leads (sales/admin/manager)
  if (req.user.role_name === 'admin' || req.user.role_name === 'sales' || req.user.role_name === 'marketing_manager') {
    const leads = db.prepare(`
      SELECT id, lead_code as code, company_name as title, 'lead' as type, status as subtitle
      FROM leads WHERE company_name LIKE ? OR contact_person LIKE ? OR lead_code LIKE ? LIMIT 5
    `).all(s, s, s);
    results.push(...leads);
  }

  // 3. Tasks
  let taskSql = `
    SELECT t.id, t.task_code as code, t.task_title as title, 'task' as type, t.status as subtitle
    FROM tasks t
    JOIN clients c ON t.client_id = c.id
    WHERE (t.task_title LIKE ? OR t.task_code LIKE ?)
  `;
  if (req.user.user_type === 'client') {
    taskSql += ` AND c.user_id = ${req.user.id} AND t.client_visible = 1`;
  }
  taskSql += ` LIMIT 5`;
  const tasks = db.prepare(taskSql).all(s, s);
  results.push(...tasks);

  // 4. Content Items
  let contentSql = `
    SELECT ci.id, ci.content_code as code, ci.topic as title, 'content' as type, ci.workflow_stage as subtitle
    FROM content_items ci
    JOIN clients c ON ci.client_id = c.id
    WHERE (ci.topic LIKE ? OR ci.caption LIKE ? OR ci.content_code LIKE ?)
  `;
  if (req.user.user_type === 'client') {
    contentSql += ` AND c.user_id = ${req.user.id} AND ci.workflow_stage NOT IN ('IDEA', 'PLANNED')`;
  }
  contentSql += ` LIMIT 5`;
  const content = db.prepare(contentSql).all(s, s, s);
  results.push(...content);

  // 5. Client Requests
  let reqSql = `
    SELECT cr.id, cr.request_code as code, cr.request_title as title, 'request' as type, cr.status as subtitle
    FROM client_requests cr
    JOIN clients c ON cr.client_id = c.id
    WHERE (cr.request_title LIKE ? OR cr.request_code LIKE ?)
  `;
  if (req.user.user_type === 'client') {
    reqSql += ` AND c.user_id = ${req.user.id}`;
  }
  reqSql += ` LIMIT 5`;
  const requests = db.prepare(reqSql).all(s, s);
  results.push(...requests);

  res.json({ results });
});

export default router;
