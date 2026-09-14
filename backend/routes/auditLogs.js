import express from 'express';
import db from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Query Audit Logs (Section 40)
router.get('/', authenticate, requireRole(['admin']), (req, res) => {
  const { entity, action, user_id, start_date, end_date } = req.query;

  let sql = `
    SELECT al.*, u.username, u.email, r.name as role_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (entity) {
    sql += ` AND al.entity = ?`;
    params.push(entity);
  }
  if (action) {
    sql += ` AND al.action = ?`;
    params.push(action);
  }
  if (user_id) {
    sql += ` AND al.user_id = ?`;
    params.push(user_id);
  }
  if (start_date && end_date) {
    sql += ` AND al.created_at BETWEEN ? AND ?`;
    params.push(start_date, end_date);
  }

  sql += ` ORDER BY al.created_at DESC LIMIT 100`;
  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

export default router;
