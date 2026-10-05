import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  Employee,
  User,
  Role,
  Department,
  Client,
  ClientService,
  Task,
  AttendanceRecord,
  Organization
} from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List All Employees
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, department_id, search } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.employment_status = status;
    }
    if (department_id && mongoose.Types.ObjectId.isValid(department_id)) {
      query.department_id = department_id;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { first_name: { $regex: s, $options: 'i' } },
        { last_name: { $regex: s, $options: 'i' } },
        { employee_code: { $regex: s, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .populate('department_id')
      .populate('reporting_manager_id')
      .sort({ created_at: -1 });

    const formatted = employees.map(e => {
      const u = e.user_id;
      const r = u?.role_id;
      const d = e.department_id;
      const m = e.reporting_manager_id;

      return {
        ...e.toJSON(),
        username: u?.username || '',
        official_email: u?.email || '',
        login_enabled: u ? (u.is_active ? 1 : 0) : 0,
        role_name: r?.name || '',
        role_display: r?.display_name || '',
        department_name: d?.name || '',
        reporting_manager_name: m ? `${m.first_name} ${m.last_name}` : ''
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing employees:', err);
    res.status(500).json({ error: 'Failed to retrieve employees list.' });
  }
});

// Departments list
router.get('/departments', authenticate, async (req, res) => {
  try {
    const depts = await Department.find().sort({ name: 1 });
    res.json(depts);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

// Roles list
router.get('/roles', authenticate, async (req, res) => {
  try {
    const roles = await Role.find({ name: { $ne: 'client' } }).sort({ name: 1 });
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

// Single Employee Detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const emp = await Employee.findById(req.params.id)
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .populate('department_id')
      .populate('reporting_manager_id');

    if (!emp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const u = emp.user_id;
    const r = u?.role_id;
    const d = emp.department_id;
    const m = emp.reporting_manager_id;

    const empData = {
      ...emp.toJSON(),
      username: u?.username || '',
      official_email: u?.email || '',
      login_enabled: u ? (u.is_active ? 1 : 0) : 0,
      role_name: r?.name || '',
      role_display: r?.display_name || '',
      department_name: d?.name || '',
      reporting_manager_name: m ? `${m.first_name} ${m.last_name}` : ''
    };

    // Assigned Clients
    const assignedServices = await ClientService.find({ assigned_employee_id: emp._id, status: 'ACTIVE' }).populate('client_id');
    const assignedClients = assignedServices.map(as => ({
      ...as.toJSON(),
      company_name: as.client_id?.company_name || '',
      client_code: as.client_id?.client_code || '',
      client_status: as.client_id?.status || ''
    }));

    // Active Tasks
    const tasks = await Task.find({
      assigned_to: emp._id,
      status: { $ne: 'COMPLETED' }
    })
      .populate('client_id')
      .populate('project_id')
      .sort({ due_date: 1 });

    const activeTasks = tasks.map(t => ({
      ...t.toJSON(),
      company_name: t.client_id?.company_name || '',
      project_name: t.project_id?.project_name || ''
    }));

    // Recent Attendance
    const recentAttendance = await AttendanceRecord.find({ employee_id: emp._id })
      .sort({ date: -1 })
      .limit(14);

    res.json({
      employee: empData,
      assignedClients,
      activeTasks,
      recentAttendance
    });
  } catch (err) {
    console.error('Error fetching employee detail:', err);
    res.status(500).json({ error: 'Failed to retrieve employee details.' });
  }
});

// Create New Employee
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
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

    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = official_email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: cleanUser }, { email: cleanEmail }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already registered.' });
    }

    const role = await Role.findOne({ name: role_name });
    if (!role) {
      return res.status(400).json({ error: 'Selected role does not exist.' });
    }

    const org = await Organization.findOne();
    const orgId = org ? org._id : null;

    const empCount = await Employee.countDocuments() + 1;
    const employee_code = `EMP-${String(empCount).padStart(3, '0')}`;

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = await User.create({
      org_id: orgId,
      username: cleanUser,
      email: cleanEmail,
      password_hash,
      role_id: role._id,
      user_type: 'employee',
      is_active: true
    });

    const newEmp = await Employee.create({
      user_id: newUser._id,
      org_id: orgId,
      employee_code,
      first_name,
      last_name,
      profile_photo: profile_photo || null,
      dob: dob ? new Date(dob) : null,
      gender: gender || null,
      phone: phone || null,
      alternate_phone: alternate_phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pin_code: pin_code || null,
      department_id: department_id && mongoose.Types.ObjectId.isValid(department_id) ? department_id : null,
      designation: designation || employee_type,
      employee_type,
      date_of_joining: date_of_joining ? new Date(date_of_joining) : new Date(),
      reporting_manager_id: reporting_manager_id && mongoose.Types.ObjectId.isValid(reporting_manager_id) ? reporting_manager_id : null,
      employment_status: employment_status || 'Active',
      work_location: work_location || 'Headquarters',
      working_hours: working_hours || '09:30 - 18:30',
      employment_mode: employment_mode || 'Full-time',
      working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      shift_start: shift_start || '09:30',
      shift_end: shift_end || '18:30',
      check_in_required: check_in_required !== undefined ? Boolean(check_in_required) : true,
      check_out_required: check_out_required !== undefined ? Boolean(check_out_required) : true,
      leave_allocation: leave_allocation || 18,
      daily_report_required: daily_report_required !== undefined ? Boolean(daily_report_required) : true
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'employees',
      entityId: newEmp._id,
      newValue: { employee_code: newEmp.employee_code, name: `${first_name} ${last_name}`, role: role_name },
      ip: req.ip
    });

    res.status(201).json({ message: 'Employee created successfully', employee: newEmp.toJSON() });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ error: err.message || 'Failed to create employee profile.' });
  }
});

// Update Employee
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const {
      first_name, last_name, profile_photo, phone, department_id, designation,
      employee_type, employment_status, reporting_manager_id, work_location,
      shift_start, shift_end, check_in_required, check_out_required, daily_report_required,
      role_name, role_id
    } = req.body;

    if (role_name || role_id) {
      let targetRole = null;
      if (role_id && mongoose.Types.ObjectId.isValid(role_id)) {
        targetRole = await Role.findById(role_id);
      } else if (role_name) {
        targetRole = await Role.findOne({ name: role_name });
      }
      if (targetRole) {
        await User.findByIdAndUpdate(emp.user_id, { role_id: targetRole._id });
      }
    }

    if (first_name !== undefined) emp.first_name = first_name;
    if (last_name !== undefined) emp.last_name = last_name;
    if (profile_photo !== undefined) emp.profile_photo = profile_photo;
    if (phone !== undefined) emp.phone = phone;
    if (department_id !== undefined) emp.department_id = mongoose.Types.ObjectId.isValid(department_id) ? department_id : null;
    if (designation !== undefined) emp.designation = designation;
    if (employee_type !== undefined) emp.employee_type = employee_type;
    if (employment_status !== undefined) emp.employment_status = employment_status;
    if (reporting_manager_id !== undefined) emp.reporting_manager_id = mongoose.Types.ObjectId.isValid(reporting_manager_id) ? reporting_manager_id : null;
    if (work_location !== undefined) emp.work_location = work_location;
    if (shift_start !== undefined) emp.shift_start = shift_start;
    if (shift_end !== undefined) emp.shift_end = shift_end;
    if (check_in_required !== undefined) emp.check_in_required = Boolean(check_in_required);
    if (check_out_required !== undefined) emp.check_out_required = Boolean(check_out_required);
    if (daily_report_required !== undefined) emp.daily_report_required = Boolean(daily_report_required);

    await emp.save();

    // If deactivated, sync user account
    if (employment_status && employment_status !== 'Active' && employment_status !== 'Probation') {
      await User.findByIdAndUpdate(emp.user_id, { is_active: false });
    } else if (employment_status === 'Active' || employment_status === 'Probation') {
      await User.findByIdAndUpdate(emp.user_id, { is_active: true });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATED',
      entity: 'employees',
      entityId: emp._id,
      oldValue: emp,
      newValue: req.body,
      ip: req.ip
    });

    const updatedEmp = await Employee.findById(emp._id)
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      });

    res.json({ message: 'Employee updated successfully', employee: updatedEmp.toJSON() });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
});

// Admin Role Assignment Endpoint
router.put('/:id/role', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const emp = await Employee.findById(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { role_name, role_id, designation } = req.body;

    let role = null;
    if (role_id && mongoose.Types.ObjectId.isValid(role_id)) {
      role = await Role.findById(role_id);
    } else if (role_name) {
      role = await Role.findOne({ name: role_name });
    }

    if (!role) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    await User.findByIdAndUpdate(emp.user_id, { role_id: role._id });

    let newDesignation = designation;
    let newEmployeeType = emp.employee_type;
    if (!newDesignation) {
      if (role.name === 'marketing_manager') {
        newDesignation = 'Social Media & Marketing Manager';
        newEmployeeType = 'Marketing & Social Media Manager';
      } else if (role.name === 'editor') {
        newDesignation = 'Video Editor & Creative Producer';
        newEmployeeType = 'Editor / Creative Team';
      } else if (role.name === 'sales') {
        newDesignation = 'Sales Executive';
        newEmployeeType = 'Sales Executive';
      } else if (role.name === 'admin') {
        newDesignation = 'Administrator';
        newEmployeeType = 'Management';
      }
    }

    if (newDesignation) {
      emp.designation = newDesignation;
      emp.employee_type = newEmployeeType;
      await emp.save();
    }

    await logAudit({
      userId: req.user.id,
      action: 'ROLE_ASSIGNED',
      entity: 'employees',
      entityId: emp._id,
      newValue: { role_id: role._id, role_name: role.name, role_display: role.display_name, designation: newDesignation },
      ip: req.ip
    });

    const updated = await Employee.findById(emp._id).populate({
      path: 'user_id',
      populate: { path: 'role_id' }
    });

    res.json({
      message: `Role updated to ${role.display_name} successfully`,
      employee: updated.toJSON()
    });
  } catch (err) {
    console.error('Error assigning role:', err);
    res.status(500).json({ error: 'Failed to assign role.' });
  }
});

// Master User Accounts (Admin Control Panel)
router.get('/master/users', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { role, status, search } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') query.is_active = true;
      else if (status === 'SUSPENDED' || status === 'INACTIVE') query.is_active = false;
    }

    let users = await User.find(query).populate('role_id').sort({ created_at: -1 });

    if (role && role !== 'ALL') {
      users = users.filter(u => u.role_id?.name === role);
    }

    const userIds = users.map(u => u._id);
    const employees = await Employee.find({ user_id: { $in: userIds } }).populate('department_id');
    const clients = await Client.find({ user_id: { $in: userIds } });

    const empMap = new Map(employees.map(e => [e.user_id.toString(), e]));
    const clientMap = new Map(clients.map(c => [c.user_id?.toString(), c]));

    let result = users.map(u => {
      const emp = empMap.get(u._id.toString());
      const cl = clientMap.get(u._id.toString());
      const r = u.role_id;

      return {
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        user_type: u.user_type,
        is_active: u.is_active ? 1 : 0,
        last_login: u.last_login,
        created_at: u.created_at,
        role_id: r?._id?.toString() || null,
        role_name: r?.name || '',
        role_display: r?.display_name || '',
        employee_id: emp?._id?.toString() || null,
        employee_code: emp?.employee_code || null,
        first_name: emp?.first_name || null,
        last_name: emp?.last_name || null,
        full_name: emp ? `${emp.first_name} ${emp.last_name}` : null,
        designation: emp?.designation || null,
        employee_type: emp?.employee_type || null,
        phone: emp?.phone || cl?.primary_contact_phone || null,
        employment_status: emp?.employment_status || null,
        department_name: emp?.department_id?.name || null,
        client_id: cl?._id?.toString() || null,
        client_code: cl?.client_code || null,
        company_name: cl?.company_name || null,
        primary_contact_name: cl?.primary_contact_name || null,
        primary_contact_phone: cl?.primary_contact_phone || null,
        client_status: cl?.status || null
      };
    });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(u =>
        u.username?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.first_name?.toLowerCase().includes(s) ||
        u.last_name?.toLowerCase().includes(s) ||
        u.company_name?.toLowerCase().includes(s)
      );
    }

    return res.json(result);
  } catch (error) {
    console.error('Error fetching master users:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user accounts' });
  }
});

// Create new user account (Staff or Client)
router.post('/master/users', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      username, email, password, role_name, first_name, last_name,
      phone, designation, department_id, company_name
    } = req.body;

    if (!username || !email || !password || !role_name) {
      return res.status(400).json({ error: 'Username, Email, Password, and Role are strictly required.' });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ $or: [{ username: cleanUser }, { email: cleanEmail }] });
    if (existing) {
      return res.status(400).json({ error: 'A user account with this username or email already exists.' });
    }

    const role = await Role.findOne({ name: role_name });
    if (!role) {
      return res.status(400).json({ error: `Invalid role "${role_name}".` });
    }

    const org = await Organization.findOne();
    const orgId = org ? org._id : null;

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const user_type = role_name === 'client' ? 'client' : (role_name === 'admin' ? 'admin' : 'employee');

    const newUser = await User.create({
      org_id: orgId,
      username: cleanUser,
      email: cleanEmail,
      password_hash,
      role_id: role._id,
      user_type,
      is_active: true
    });

    if (role_name === 'client') {
      const clientCount = await Client.countDocuments() + 1;
      const client_code = `CLI-${String(clientCount).padStart(3, '0')}`;
      const compName = company_name || `${first_name || username}'s Business`;

      await Client.create({
        org_id: orgId,
        user_id: newUser._id,
        client_code,
        company_name: compName,
        primary_contact_name: `${first_name || ''} ${last_name || ''}`.trim() || username,
        primary_contact_email: cleanEmail,
        primary_contact_phone: phone || '+91 9999999999',
        status: 'ACTIVE'
      });
    } else {
      const empCount = await Employee.countDocuments() + 1;
      const employee_code = `EMP-${String(empCount).padStart(3, '0')}`;

      let autoDesignation = designation;
      let autoEmpType = 'Staff';

      if (role_name === 'sales') {
        autoDesignation = designation || 'Sales Executive';
        autoEmpType = 'Sales Executive';
      } else if (role_name === 'marketing_manager') {
        autoDesignation = designation || 'Social Media & Marketing Manager';
        autoEmpType = 'Marketing & Social Media Manager';
      } else if (role_name === 'editor') {
        autoDesignation = designation || 'Video Editor & Motion Designer';
        autoEmpType = 'Editor / Creative Team';
      } else if (role_name === 'admin') {
        autoDesignation = designation || 'System Administrator';
        autoEmpType = 'Management';
      }

      await Employee.create({
        user_id: newUser._id,
        org_id: orgId,
        employee_code,
        first_name: first_name || username,
        last_name: last_name || '',
        phone: phone || '',
        department_id: department_id && mongoose.Types.ObjectId.isValid(department_id) ? department_id : null,
        designation: autoDesignation,
        employee_type: autoEmpType,
        date_of_joining: new Date(),
        employment_status: 'Active'
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATED',
      entity: 'users',
      entityId: newUser._id,
      newValue: { username: cleanUser, email: cleanEmail, role: role_name },
      ip: req.ip
    });

    return res.status(201).json({
      message: `User account "${username}" with role "${role.display_name}" created successfully.`,
      user_id: newUser._id.toString()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user account' });
  }
});

// Update user details & dynamic role assignment
router.put('/master/users/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const rawId = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const {
      username, email, password, role_name, first_name, last_name,
      phone, designation, company_name, is_active
    } = req.body;

    if (username || email) {
      const dup = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(username ? [{ username: username.trim().toLowerCase() }] : []),
          ...(email ? [{ email: email.trim().toLowerCase() }] : [])
        ]
      });
      if (dup) {
        return res.status(400).json({ error: 'Username or email already in use by another user.' });
      }
    }

    if (role_name) {
      const resolvedRole = await Role.findOne({ name: role_name });
      if (resolvedRole) {
        user.role_id = resolvedRole._id;
        user.user_type = role_name === 'client' ? 'client' : (role_name === 'admin' ? 'admin' : 'employee');
      }
    }

    if (password && password.trim()) {
      const salt = bcrypt.genSaltSync(10);
      user.password_hash = bcrypt.hashSync(password.trim(), salt);
    }

    if (username) user.username = username.trim().toLowerCase();
    if (email) user.email = email.trim().toLowerCase();
    if (is_active !== undefined) user.is_active = Boolean(is_active);

    await user.save();

    // Update corresponding employee
    const emp = await Employee.findOne({ user_id: user._id });
    if (emp) {
      if (first_name) emp.first_name = first_name;
      if (last_name) emp.last_name = last_name;
      if (phone) emp.phone = phone;
      if (designation) emp.designation = designation;
      if (is_active !== undefined) {
        emp.employment_status = is_active ? 'Active' : 'Suspended';
      }
      await emp.save();
    }

    // Update corresponding client
    const client = await Client.findOne({ user_id: user._id });
    if (client) {
      if (company_name) client.company_name = company_name;
      if (first_name) client.primary_contact_name = `${first_name} ${last_name || ''}`.trim();
      if (phone) client.primary_contact_phone = phone;
      if (email) client.primary_contact_email = email.trim();
      if (is_active !== undefined) {
        client.status = is_active ? 'ACTIVE' : 'SUSPENDED';
      }
      await client.save();
    }

    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entity: 'users',
      entityId: user._id,
      newValue: { username: user.username, email: user.email, role: role_name, is_active: user.is_active },
      ip: req.ip
    });

    return res.json({ message: 'User account and role profile updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user account' });
  }
});

// Toggle suspend / active user account
router.put('/master/users/:id/toggle-suspend', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const rawId = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot suspend your own admin account.' });
    }

    user.is_active = !user.is_active;
    await user.save();

    await Employee.updateOne(
      { user_id: user._id },
      { employment_status: user.is_active ? 'Active' : 'Suspended' }
    );

    await Client.updateOne(
      { user_id: user._id },
      { status: user.is_active ? 'ACTIVE' : 'SUSPENDED' }
    );

    await logAudit({
      userId: req.user.id,
      action: user.is_active ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      entity: 'users',
      entityId: user._id,
      ip: req.ip
    });

    return res.json({
      message: user.is_active ? 'User account activated successfully.' : 'User account suspended. Access revoked.',
      is_active: user.is_active ? 1 : 0
    });
  } catch (error) {
    console.error('Error toggling user suspend:', error);
    return res.status(500).json({ error: error.message || 'Failed to toggle account suspension' });
  }
});

// Delete user account
router.delete('/master/users/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const rawId = req.params.id;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete the currently logged in admin user.' });
    }

    // Soft delete / deactivate
    user.is_active = false;
    user.username = `${user.username}_deleted_${user._id}`;
    user.email = `${user.email}_deleted_${user._id}`;
    await user.save();

    await Employee.updateOne(
      { user_id: user._id },
      { employment_status: 'Terminated' }
    );

    await Client.updateOne(
      { user_id: user._id },
      { status: 'INACTIVE' }
    );

    await logAudit({
      userId: req.user.id,
      action: 'USER_DELETED',
      entity: 'users',
      entityId: user._id,
      ip: req.ip
    });

    return res.json({ message: 'User account deleted and revoked successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

export default router;
