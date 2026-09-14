import express from 'express';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Get Daily Reports List (Admin / Managers)
router.get('/', authenticate, (req, res) => {
  const { date, employee_id, status } = req.query;
  let sql = `
    SELECT dwr.*, e.employee_code, e.first_name, e.last_name, e.designation,
           rev.first_name || ' ' || rev.last_name as reviewer_name
    FROM daily_work_reports dwr
    JOIN employees e ON dwr.employee_id = e.id
    LEFT JOIN employees rev ON dwr.reviewed_by = rev.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ` AND dwr.report_date = ?`;
    params.push(date);
  }
  if (employee_id) {
    sql += ` AND dwr.employee_id = ?`;
    params.push(employee_id);
  }
  if (status) {
    sql += ` AND dwr.status = ?`;
    params.push(status);
  }

  // If regular employee, only see their own reports
  if (req.user.role_name !== 'admin' && req.user.role_name !== 'marketing_manager') {
    sql += ` AND dwr.employee_id = ?`;
    params.push(req.employee?.id || 0);
  }

  sql += ` ORDER BY dwr.report_date DESC, dwr.id DESC`;
  const reports = db.prepare(sql).all(...params);

  // Fetch entries for each report
  const stmtEntries = db.prepare(`
    SELECT dwe.*, c.company_name, p.project_name, t.task_title
    FROM daily_work_entries dwe
    LEFT JOIN clients c ON dwe.client_id = c.id
    LEFT JOIN projects p ON dwe.project_id = p.id
    LEFT JOIN tasks t ON dwe.task_id = t.id
    WHERE dwe.report_id = ?
  `);

  const populated = reports.map(r => ({
    ...r,
    entries: stmtEntries.all(r.id)
  }));

  res.json(populated);
});

// Get My Report for Today
router.get('/my-today', authenticate, (req, res) => {
  if (!req.employee) {
    return res.status(400).json({ error: 'User is not linked to an employee profile.' });
  }

  const today = getTodayDate();
  const report = db.prepare(`
    SELECT * FROM daily_work_reports WHERE employee_id = ? AND report_date = ?
  `).get(req.employee.id, today);

  if (!report) {
    return res.json({ report: null, entries: [] });
  }

  const entries = db.prepare(`
    SELECT dwe.*, c.company_name, p.project_name, t.task_title
    FROM daily_work_entries dwe
    LEFT JOIN clients c ON dwe.client_id = c.id
    LEFT JOIN projects p ON dwe.project_id = p.id
    LEFT JOIN tasks t ON dwe.task_id = t.id
    WHERE dwe.report_id = ?
  `).all(report.id);

  res.json({ report, entries });
});

// Submit Daily Work Report
router.post('/', authenticate, (req, res) => {
  if (!req.employee) {
    return res.status(400).json({ error: 'User is not linked to an employee profile.' });
  }

  const { report_date, remarks, challenges, tomorrows_plan, entries } = req.body;
  const date = report_date || getTodayDate();

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'Please include at least one work entry describing your deliverables.' });
  }

  const totalHours = entries.reduce((sum, item) => sum + (Number(item.hours_worked) || 0), 0);

  const submitTransaction = db.transaction(() => {
    // Check if report already exists for this day
    const existing = db.prepare('SELECT id FROM daily_work_reports WHERE employee_id = ? AND report_date = ?').get(req.employee.id, date);
    let reportId = null;

    if (existing) {
      reportId = existing.id;
      db.prepare(`
        UPDATE daily_work_reports SET
          total_hours = ?,
          remarks = ?,
          challenges = ?,
          tomorrows_plan = ?,
          status = 'SUBMITTED',
          created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(totalHours, remarks || '', challenges || '', tomorrows_plan || '', reportId);

      // Remove existing entries and re-insert
      db.prepare('DELETE FROM daily_work_entries WHERE report_id = ?').run(reportId);
    } else {
      const res = db.prepare(`
        INSERT INTO daily_work_reports (employee_id, report_date, total_hours, remarks, challenges, tomorrows_plan, status)
        VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED')
      `).run(req.employee.id, date, totalHours, remarks || '', challenges || '', tomorrows_plan || '');
      reportId = res.lastInsertRowid;
    }

    const insertEntry = db.prepare(`
      INSERT INTO daily_work_entries (
        report_id, client_id, project_id, task_id, work_category, work_description,
        start_time, end_time, hours_worked, deliverable_output, proof_file_url, client_visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const e of entries) {
      insertEntry.run(
        reportId,
        e.client_id || null,
        e.project_id || null,
        e.task_id || null,
        e.work_category || 'General Operations',
        e.work_description,
        e.start_time || null,
        e.end_time || null,
        Number(e.hours_worked) || 1,
        e.deliverable_output || '',
        e.proof_file_url || '',
        e.client_visible !== undefined ? (e.client_visible ? 1 : 0) : 1
      );
    }

    return reportId;
  });

  const reportId = submitTransaction();

  logAudit({
    userId: req.user.id,
    action: 'SUBMITTED',
    entity: 'daily_work_reports',
    entityId: reportId,
    newValue: { employee_id: req.employee.id, date, total_hours: totalHours, entry_count: entries.length },
    ip: req.ip
  });

  res.status(201).json({ message: 'Daily work report submitted successfully', report_id: reportId });
});

// Review Report (Manager / Admin)
router.put('/:id/review', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const report = db.prepare('SELECT * FROM daily_work_reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  db.prepare(`
    UPDATE daily_work_reports SET
      status = 'REVIEWED',
      reviewed_by = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.employee?.id || null, report.id);

  res.json({ message: 'Report marked as reviewed' });
});

export default router;
