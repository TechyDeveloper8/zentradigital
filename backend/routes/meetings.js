import express from 'express';
import db, { logAudit, logLeadActivity, createNotification } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// List Meetings with filters
router.get('/', authenticate, (req, res) => {
  const { lead_id, client_id, status, upcoming_only, date } = req.query;

  let sql = `
    SELECT m.*,
           l.company_name as lead_company_name, l.contact_person as lead_contact_person, l.phone as lead_phone, l.lead_code,
           c.company_name as client_company_name, c.client_code,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           u.username as created_by_username
    FROM meetings m
    LEFT JOIN leads l ON m.lead_id = l.id
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN employees e ON m.assigned_employee_id = e.id
    LEFT JOIN users u ON m.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  // Scoping for sales employees
  if (req.user.role_name === 'sales' && req.employee) {
    sql += ' AND (m.assigned_employee_id = ? OR m.created_by = ? OR l.assigned_sales_employee_id = ?)';
    params.push(req.employee.id, req.user.id, req.employee.id);
  }

  if (lead_id) {
    sql += ' AND m.lead_id = ?';
    params.push(Number(lead_id));
  }
  if (client_id) {
    sql += ' AND m.client_id = ?';
    params.push(Number(client_id));
  }
  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }
  if (date) {
    sql += ' AND m.meeting_date = ?';
    params.push(date);
  }
  if (upcoming_only === 'true') {
    sql += ` AND (m.meeting_date > DATE('now') OR (m.meeting_date = DATE('now') AND m.meeting_time >= time('now', 'localtime'))) AND m.status = 'SCHEDULED'`;
  }

  sql += ' ORDER BY m.meeting_date ASC, m.meeting_time ASC, m.id DESC';
  const meetings = db.prepare(sql).all(...params);
  res.json({ meetings });
});

// Schedule Meeting (Section 12)
router.post('/', authenticate, (req, res) => {
  const {
    lead_id, client_id, title, meeting_date, meeting_time, meeting_type,
    meeting_link, location, participants, agenda, notes, reminder, assigned_employee_id
  } = req.body;

  if (!title || !meeting_date || !meeting_time) {
    return res.status(400).json({ error: 'Title, date, and time are required to schedule a meeting.' });
  }

  const assignedEmpId = assigned_employee_id || (req.employee ? req.employee.id : null);

  const stmt = db.prepare(`
    INSERT INTO meetings (
      lead_id, client_id, title, meeting_date, meeting_time, meeting_type,
      meeting_link, location, participants, agenda, notes, reminder,
      status, assigned_employee_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?)
  `);

  const result = stmt.run(
    lead_id || null,
    client_id || null,
    title,
    meeting_date,
    meeting_time,
    meeting_type || 'Video Call',
    meeting_link || '',
    location || '',
    participants || '',
    agenda || '',
    notes || '',
    reminder !== undefined ? (reminder ? 1 : 0) : 1,
    assignedEmpId,
    req.user.id
  );

  const meetingId = result.lastInsertRowid;

  // If lead associated, log lead activity and advance stage to MEETING if currently NEW or CONTACTED
  if (lead_id) {
    logLeadActivity({
      leadId: lead_id,
      activityType: 'MEETING_SCHEDULED',
      title: `Meeting Scheduled: ${title}`,
      description: `${meeting_type || 'Video Call'} scheduled for ${meeting_date} at ${meeting_time}. Agenda: ${agenda || 'Discovery & Pitch'}`,
      performedBy: assignedEmpId
    });

    const lead = db.prepare('SELECT status FROM leads WHERE id = ?').get(lead_id);
    if (lead && (lead.status === 'NEW' || lead.status === 'CONTACTED')) {
      db.prepare(`
        UPDATE leads SET status = 'MEETING', stage_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lead_id);
    }
  }

  // Create notification for assigned employee if different from creator
  if (assignedEmpId && (!req.employee || req.employee.id !== assignedEmpId)) {
    const empUser = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(assignedEmpId);
    if (empUser) {
      createNotification({
        userId: empUser.user_id,
        type: 'MEETING_SCHEDULED',
        title: 'New Meeting Scheduled',
        message: `${title} has been scheduled for ${meeting_date} at ${meeting_time}.`,
        relatedEntity: 'meetings',
        relatedEntityId: meetingId
      });
    }
  }

  logAudit({
    userId: req.user.id,
    action: 'MEETING_SCHEDULED',
    entity: 'meetings',
    entityId: meetingId,
    newValue: { title, meeting_date, meeting_time, lead_id },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  res.status(201).json({ message: 'Meeting scheduled successfully', meeting: created });
});

// Update Meeting Status / Reschedule
router.put('/:id', authenticate, (req, res) => {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  const {
    title, meeting_date, meeting_time, meeting_type, meeting_link,
    location, participants, agenda, notes, status
  } = req.body;

  db.prepare(`
    UPDATE meetings SET
      title = coalesce(?, title),
      meeting_date = coalesce(?, meeting_date),
      meeting_time = coalesce(?, meeting_time),
      meeting_type = coalesce(?, meeting_type),
      meeting_link = coalesce(?, meeting_link),
      location = coalesce(?, location),
      participants = coalesce(?, participants),
      agenda = coalesce(?, agenda),
      notes = coalesce(?, notes),
      status = coalesce(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title, meeting_date, meeting_time, meeting_type, meeting_link,
    location, participants, agenda, notes, status, meeting.id
  );

  // If status changed to COMPLETED, log activity
  if (status && status !== meeting.status) {
    if (meeting.lead_id) {
      logLeadActivity({
        leadId: meeting.lead_id,
        activityType: status === 'COMPLETED' ? 'MEETING_COMPLETED' : 'MEETING_UPDATED',
        title: status === 'COMPLETED' ? `Meeting Completed: ${meeting.title}` : `Meeting Status: ${status}`,
        description: `Meeting status changed from ${meeting.status} to ${status}. Notes: ${notes || meeting.notes || ''}`,
        performedBy: req.employee ? req.employee.id : null
      });
    }

    logAudit({
      userId: req.user.id,
      action: 'MEETING_STATUS_CHANGED',
      entity: 'meetings',
      entityId: meeting.id,
      oldValue: { status: meeting.status },
      newValue: { status },
      ip: req.ip
    });
  }

  const updated = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meeting.id);
  res.json({ message: 'Meeting updated successfully', meeting: updated });
});

export default router;
