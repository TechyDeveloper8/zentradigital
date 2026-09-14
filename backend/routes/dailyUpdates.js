import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Get Daily Updates for a Client
router.get('/', authenticate, (req, res) => {
  const { client_id, date } = req.query;

  let targetClientId = client_id;
  if (req.user.user_type === 'client') {
    const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.id);
    if (!client) {
      return res.status(400).json({ error: 'Client record not found' });
    }
    targetClientId = client.id;
  }

  let sql = `
    SELECT dcu.*, c.company_name, u.username as approved_by_username
    FROM daily_client_updates dcu
    JOIN clients c ON dcu.client_id = c.id
    LEFT JOIN users u ON dcu.approved_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (targetClientId) {
    sql += ` AND dcu.client_id = ?`;
    params.push(targetClientId);
  }
  if (date) {
    sql += ` AND dcu.update_date = ?`;
    params.push(date);
  }

  sql += ` ORDER BY dcu.update_date DESC, dcu.id DESC LIMIT 30`;
  const updates = db.prepare(sql).all(...params);
  res.json(updates);
});

// Post / Update Client Daily Update (Section 24)
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const { client_id, update_date, completed_text, in_progress_text, pending_client_text } = req.body;

  if (!client_id || !completed_text) {
    return res.status(400).json({ error: 'Client ID and Completed Work text are required.' });
  }

  const date = update_date || getTodayDate();

  const existing = db.prepare('SELECT id FROM daily_client_updates WHERE client_id = ? AND update_date = ?').get(client_id, date);

  if (existing) {
    db.prepare(`
      UPDATE daily_client_updates SET
        completed_text = ?,
        in_progress_text = ?,
        pending_client_text = ?,
        approved_by = ?
      WHERE id = ?
    `).run(completed_text, in_progress_text || '', pending_client_text || '', req.user.id, existing.id);
  } else {
    db.prepare(`
      INSERT INTO daily_client_updates (
        client_id, update_date, completed_text, in_progress_text, pending_client_text, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(client_id, date, completed_text, in_progress_text || '', pending_client_text || '', req.user.id);
  }

  logAudit({
    userId: req.user.id,
    action: 'POSTED',
    entity: 'daily_client_updates',
    newValue: { client_id, update_date: date },
    ip: req.ip
  });

  res.status(201).json({ message: 'Daily client update posted successfully' });
});

export default router;
