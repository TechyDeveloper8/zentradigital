import express from 'express';
import bcrypt from 'bcryptjs';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List All Employees
router.get('/', authenticate, (req, res) => {
  const { status, department_id, search } = req.query;
  let sql = `
    SELECT e.*, u.username, u.email as official_email, u.is_active as login_enabled,
           r.name as role_name, r.display_name as role_display,
           d.name as department_name,
           m.first_name || ' ' || m.last_name as reporting_manager_name
    FROM employees e
    JOIN users u ON e.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN employees m ON e.reporting_manager_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND e.employment_status = ?`;
    params.push(status);
  }
  if (department_id) {
    sql += ` AND e.department_id = ?`;
    params.push(department_id);
  }
  if (search) {
    sql += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ? OR u.email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ` ORDER BY e.id DESC`;
  const employees = db.prepare(sql).all(...params);
  res.json(employees);
});

// Departments list
router.get('/departments', authenticate, (req, res) => {
  const depts = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  res.json(depts);
});

// Roles list
router.get('/roles', authenticate, (req, res) => {
  const roles = db.prepare("SELECT * FROM roles WHERE name != 'client' ORDER BY id ASC").all();
  res.json(roles);
});

// Single Employee Detail
router.get('/:id', authenticate, (req, res) => {
  const emp = db.prepare(`
    SELECT e.*, u.username, u.email as official_email, u.is_active as login_enabled,
           r.name as role_name, r.display_name as role_display,
           d.name as department_name,
           m.first_name || ' ' || m.last_name as reporting_manager_name
    FROM employees e
    JOIN users u ON e.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN employees m ON e.reporting_manager_id = m.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Assigned Clients
  const assignedClients = db.prepare(`
    SELECT ea.*, c.company_name, c.client_code, c.status as client_status
    FROM employee_assignments ea
    JOIN clients c ON ea.client_id = c.id
    WHERE ea.employee_id = ? AND ea.is_active = 1
  `).all(emp.id);

  // Active Tasks
  const activeTasks = db.prepare(`
    SELECT t.*, c.company_name, p.project_name
    FROM tasks t
    JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.assigned_employee_id = ? AND t.status != 'COMPLETED'
    ORDER BY t.due_date ASC
  `).all(emp.id);

  // Recent Attendance
  const recentAttendance = db.prepare(`
    SELECT * FROM attendance_records
    WHERE employee_id = ?
    ORDER BY date DESC LIMIT 14
  `).all(emp.id);

  res.json({
    employee: emp,
    assignedClients,
    activeTasks,
    recentAttendance
  });
});

// Create New Employee
router.post('/', authenticate, requireRole(['admin']), (req, res) => {
  const {
    first_name, last_name, profile_photo, dob, gender, phone, alternate_phone,
    address, city, state, pin_code, department_id, designation, employee_type,
    date_of_joining, reporting_manager_id, employment_status, work_location,
    working_hours, employment_mode, username, official_email, password, role_name,
    working_days, shift_start, shift_end, check_in_required, check_out_required,
    leave_allocation, daily_report_required
  } = req.body;

  if (!first_name || !last_name || !official_email || !username || !password || !role_name) {
    return res.status(400).json({ error: 'Please provide all required personal, employment, and account credentials.' });
  }

  // Check username or email uniqueness
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, official_email);
  if (existingUser) {
    return res.status(400).json({ error: 'Username or email is already registered.' });
  }

  const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(role_name);
  if (!role) {
    return res.status(400).json({ error: 'Selected role does not exist.' });
  }

  const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  const orgId = org ? org.id : 1;

  // Auto-generate employee code if not provided
  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count + 1;
  const employee_code = `EMP-${String(empCount).padStart(3, '0')}`;

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const insertTransaction = db.transaction(() => {
    // 1. Create User
    const userRes = db.prepare(`
      INSERT INTO users (org_id, username, email, password_hash, role_id, user_type, is_active)
      VALUES (?, ?, ?, ?, ?, 'employee', 1)
    `).run(orgId, username.trim(), official_email.trim(), password_hash, role.id);
    const userId = userRes.lastInsertRowid;

    // 2. Create Employee Profile
    const empRes = db.prepare(`
      INSERT INTO employees (
        user_id, org_id, employee_code, first_name, last_name, profile_photo, dob,
        gender, phone, alternate_phone, address, city, state, pin_code,
        department_id, designation, employee_type, date_of_joining, reporting_manager_id,
        employment_status, work_location, working_hours, employment_mode,
        working_days, shift_start, shift_end, check_in_required, check_out_required,
        leave_allocation, daily_report_required
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      userId, orgId, employee_code, first_name, last_name, profile_photo || null, dob || null,
      gender || null, phone || null, alternate_phone || null, address || null, city || null, state || null, pin_code || null,
      department_id || null, designation || employee_type, employee_type, date_of_joining || new Date().toISOString().split('T')[0], reporting_manager_id || null,
      employment_status || 'Active', work_location || 'Headquarters', working_hours || '09:30 - 18:30', employment_mode || 'Full-time',
      typeof working_days === 'object' ? JSON.stringify(working_days) : (working_days || '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]'),
      shift_start || '09:30', shift_end || '18:30', check_in_required !== undefined ? (check_in_required ? 1 : 0) : 1,
      check_out_required !== undefined ? (check_out_required ? 1 : 0) : 1, leave_allocation || 18, daily_report_required !== undefined ? (daily_report_required ? 1 : 0) : 1
    );

    return { userId, employeeId: empRes.lastInsertRowid, employee_code };
  });

  const result = insertTransaction();

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'employees',
    entityId: result.employeeId,
    newValue: { employee_code: result.employee_code, name: `${first_name} ${last_name}`, role: role_name },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.employeeId);
  res.status(201).json({ message: 'Employee created successfully', employee: created });
});

// Update Employee
router.put('/:id', authenticate, requireRole(['admin']), (req, res) => {
  const {
    first_name, last_name, profile_photo, phone, department_id, designation,
    employee_type, employment_status, reporting_manager_id, work_location,
    shift_start, shift_end, check_in_required, check_out_required, daily_report_required
  } = req.body;

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  db.prepare(`
    UPDATE employees SET
      first_name = coalesce(?, first_name),
      last_name = coalesce(?, last_name),
      profile_photo = coalesce(?, profile_photo),
      phone = coalesce(?, phone),
      department_id = coalesce(?, department_id),
      designation = coalesce(?, designation),
      employee_type = coalesce(?, employee_type),
      employment_status = coalesce(?, employment_status),
      reporting_manager_id = coalesce(?, reporting_manager_id),
      work_location = coalesce(?, work_location),
      shift_start = coalesce(?, shift_start),
      shift_end = coalesce(?, shift_end),
      check_in_required = coalesce(?, check_in_required),
      check_out_required = coalesce(?, check_out_required),
      daily_report_required = coalesce(?, daily_report_required),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    first_name, last_name, profile_photo, phone, department_id, designation,
    employee_type, employment_status, reporting_manager_id, work_location,
    shift_start, shift_end,
    check_in_required !== undefined ? (check_in_required ? 1 : 0) : null,
    check_out_required !== undefined ? (check_out_required ? 1 : 0) : null,
    daily_report_required !== undefined ? (daily_report_required ? 1 : 0) : null,
    emp.id
  );

  // If deactivated, also disable user account
  if (employment_status && employment_status !== 'Active' && employment_status !== 'Probation') {
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(emp.user_id);
  } else if (employment_status === 'Active' || employment_status === 'Probation') {
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(emp.user_id);
  }

  logAudit({
    userId: req.user.id,
    action: 'UPDATED',
    entity: 'employees',
    entityId: emp.id,
    oldValue: emp,
    newValue: req.body,
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(emp.id);
  res.json({ message: 'Employee updated successfully', employee: updated });
});

// Soft-deactivate employee
router.delete('/:id', authenticate, requireRole(['admin']), (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  db.prepare(`UPDATE employees SET employment_status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(emp.id);
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(emp.user_id);

  logAudit({
    userId: req.user.id,
    action: 'DEACTIVATED',
    entity: 'employees',
    entityId: emp.id,
    ip: req.ip
  });

  res.json({ message: 'Employee deactivated successfully' });
});

export default router;
