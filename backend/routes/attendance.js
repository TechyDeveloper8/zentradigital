import express from 'express';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Format today's date in YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Today's Attendance Overview (Admin & Manager)
router.get('/today', authenticate, (req, res) => {
  const today = getTodayDate();

  // All active employees
  const allEmployees = db.prepare(`
    SELECT e.id, e.employee_code, e.first_name, e.last_name, e.designation, e.shift_start, e.shift_end,
           d.name as department_name,
           a.id as attendance_id, a.check_in_time, a.check_out_time, a.total_working_hours,
           a.status as attendance_status, a.is_manual_adjusted, a.adjustment_reason
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN attendance_records a ON a.employee_id = e.id AND a.date = ?
    WHERE e.employment_status IN ('Active', 'Probation')
    ORDER BY e.first_name ASC
  `).all(today);

  // Summary counts
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  for (const emp of allEmployees) {
    if (emp.attendance_status === 'PRESENT' || emp.attendance_status === 'LATE' || emp.attendance_status === 'HALF DAY') {
      presentCount++;
      if (emp.attendance_status === 'LATE') lateCount++;
    } else {
      absentCount++;
    }
  }

  res.json({
    date: today,
    total_employees: allEmployees.length,
    present_count: presentCount,
    late_count: lateCount,
    absent_count: absentCount,
    records: allEmployees
  });
});

// Current Employee's Today Status
router.get('/my-today', authenticate, (req, res) => {
  if (!req.employee) {
    return res.status(400).json({ error: 'User is not linked to an employee profile.' });
  }

  const today = getTodayDate();
  const record = db.prepare(`
    SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?
  `).get(req.employee.id, today);

  res.json({
    employee_id: req.employee.id,
    date: today,
    record: record || null
  });
});

// Employee Check-In
router.post('/check-in', authenticate, (req, res) => {
  if (!req.employee) {
    return res.status(400).json({ error: 'User is not linked to an employee profile.' });
  }

  const today = getTodayDate();
  const existing = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.employee.id, today);

  if (existing && existing.check_in_time) {
    return res.status(400).json({ error: 'You have already checked in today at ' + existing.check_in_time });
  }

  const now = new Date();
  const checkInTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

  // Determine status (PRESENT or LATE based on shift_start + grace_period)
  let status = 'PRESENT';
  const shiftStart = req.employee.shift_start || '09:30';
  const [shiftHours, shiftMins] = shiftStart.split(':').map(Number);
  const shiftStartTime = new Date();
  shiftStartTime.setHours(shiftHours, shiftMins + 15, 0, 0); // 15 mins grace period

  if (now > shiftStartTime) {
    status = 'LATE';
  }

  if (existing) {
    db.prepare(`
      UPDATE attendance_records SET
        check_in_time = ?,
        status = ?,
        ip_address = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(checkInTime, status, req.ip, existing.id);
  } else {
    db.prepare(`
      INSERT INTO attendance_records (employee_id, date, check_in_time, status, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.employee.id, today, checkInTime, status, req.ip);
  }

  logAudit({
    userId: req.user.id,
    action: 'CHECK_IN',
    entity: 'attendance_records',
    newValue: { employee_id: req.employee.id, date: today, check_in_time: checkInTime, status },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.employee.id, today);
  res.json({ message: 'Checked in successfully', record: updated });
});

// Employee Check-Out
router.post('/check-out', authenticate, (req, res) => {
  if (!req.employee) {
    return res.status(400).json({ error: 'User is not linked to an employee profile.' });
  }

  const today = getTodayDate();
  const existing = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.employee.id, today);

  if (!existing || !existing.check_in_time) {
    return res.status(400).json({ error: 'You must check in first before checking out.' });
  }

  const now = new Date();
  const checkOutTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

  // Calculate total hours
  const [inH, inM] = existing.check_in_time.split(':').map(Number);
  const [outH, outM] = checkOutTime.split(':').map(Number);
  const checkInDate = new Date();
  checkInDate.setHours(inH, inM, 0, 0);
  const checkOutDate = new Date();
  checkOutDate.setHours(outH, outM, 0, 0);

  const diffMs = Math.max(0, checkOutDate - checkInDate);
  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  db.prepare(`
    UPDATE attendance_records SET
      check_out_time = ?,
      total_working_hours = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(checkOutTime, totalHours, existing.id);

  logAudit({
    userId: req.user.id,
    action: 'CHECK_OUT',
    entity: 'attendance_records',
    entityId: existing.id,
    newValue: { check_out_time: checkOutTime, total_working_hours: totalHours },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM attendance_records WHERE id = ?').get(existing.id);
  res.json({ message: 'Checked out successfully', record: updated });
});

// Admin Manual Attendance Adjustment (Section 26 - mandatory audit & reason)
router.post('/adjust', authenticate, requireRole(['admin']), (req, res) => {
  const { employee_id, date, status, check_in_time, check_out_time, total_working_hours, adjustment_reason } = req.body;

  if (!employee_id || !date || !status || !adjustment_reason) {
    return res.status(400).json({ error: 'Employee, date, status, and adjustment reason are mandatory.' });
  }

  const existing = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(employee_id, date);

  if (existing) {
    db.prepare(`
      UPDATE attendance_records SET
        status = ?,
        check_in_time = coalesce(?, check_in_time),
        check_out_time = coalesce(?, check_out_time),
        total_working_hours = coalesce(?, total_working_hours),
        is_manual_adjusted = 1,
        adjustment_reason = ?,
        approved_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, check_in_time, check_out_time, total_working_hours, adjustment_reason, req.user.id, existing.id);
  } else {
    db.prepare(`
      INSERT INTO attendance_records (
        employee_id, date, status, check_in_time, check_out_time, total_working_hours,
        is_manual_adjusted, adjustment_reason, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(employee_id, date, status, check_in_time || '09:30', check_out_time || '18:30', total_working_hours || 8, adjustment_reason, req.user.id);
  }

  logAudit({
    userId: req.user.id,
    action: 'ATTENDANCE_CORRECTED',
    entity: 'attendance_records',
    entityId: existing?.id,
    oldValue: existing,
    newValue: { employee_id, date, status, check_in_time, check_out_time, adjustment_reason },
    ip: req.ip
  });

  res.json({ message: 'Attendance record adjusted successfully with audit history.' });
});

export default router;
