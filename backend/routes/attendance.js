import express from 'express';
import { AttendanceRecord, Employee, User, Role, Department } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastAttendanceEvent } from '../websocket.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 1. Current Employee's Today Status
router.get('/my-today', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const today = getTodayDate();
    const record = await AttendanceRecord.findOne({
      employee_id: req.employee._id || req.employee.id,
      date: today
    }).lean({ virtuals: true });

    if (record) {
      record.id = record._id.toString();
    }

    res.json({
      employee_id: req.employee.id || req.employee._id.toString(),
      date: today,
      shift_start: req.employee.shift_start || '09:30',
      shift_end: req.employee.shift_end || '18:30',
      designation: req.employee.designation,
      record: record || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Personal Attendance Marking: Employee Check-In
router.post('/check-in', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const today = getTodayDate();
    let existing = await AttendanceRecord.findOne({
      employee_id: req.employee._id || req.employee.id,
      date: today
    });

    if (existing && existing.check_in_time) {
      return res.status(400).json({ error: `You have already checked in today at ${existing.check_in_time}` });
    }

    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    let status = 'PRESENT';
    const shiftStart = req.employee.shift_start || '09:30';
    const [shiftHours, shiftMins] = shiftStart.split(':').map(Number);
    const shiftStartTime = new Date();
    shiftStartTime.setHours(shiftHours, shiftMins + 15, 0, 0); // 15 mins grace period

    if (now > shiftStartTime) {
      status = 'LATE';
    }

    if (existing) {
      existing.check_in_time = checkInTime;
      existing.punch_in = now;
      existing.status = status;
      existing.ip_address = req.ip;
      await existing.save();
    } else {
      existing = await AttendanceRecord.create({
        employee_id: req.employee._id || req.employee.id,
        date: today,
        check_in_time: checkInTime,
        punch_in: now,
        status,
        ip_address: req.ip
      });
    }

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'CHECK_IN',
      entity: 'attendance_records',
      newValue: { employee_id: req.employee.id || req.employee._id, date: today, check_in_time: checkInTime, status },
      ip: req.ip
    });

    const plainRecord = existing.toJSON ? existing.toJSON() : existing;
    plainRecord.id = (existing._id || existing.id).toString();

    broadcastAttendanceEvent({
      eventType: 'EMPLOYEE_CHECK_IN',
      employeeId: req.employee.id || req.employee._id.toString(),
      employeeName: `${req.employee.first_name} ${req.employee.last_name}`,
      designation: req.employee.designation,
      checkInTime,
      status,
      date: today,
      record: plainRecord
    });

    res.json({ message: 'Checked in successfully', record: plainRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Personal Attendance Marking: Employee Check-Out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const today = getTodayDate();
    const existing = await AttendanceRecord.findOne({
      employee_id: req.employee._id || req.employee.id,
      date: today
    });

    if (!existing || !existing.check_in_time) {
      return res.status(400).json({ error: 'You must check in first before checking out.' });
    }

    if (existing.check_out_time) {
      return res.status(400).json({ error: `You have already checked out today at ${existing.check_out_time}` });
    }

    const now = new Date();
    const checkOutTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    const [inH, inM] = existing.check_in_time.split(':').map(Number);
    const [outH, outM] = checkOutTime.split(':').map(Number);
    const checkInDate = new Date();
    checkInDate.setHours(inH, inM, 0, 0);
    const checkOutDate = new Date();
    checkOutDate.setHours(outH, outM, 0, 0);

    const diffMs = Math.max(0, checkOutDate - checkInDate);
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    existing.check_out_time = checkOutTime;
    existing.punch_out = now;
    existing.total_working_hours = totalHours;
    existing.total_hours = totalHours;
    await existing.save();

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'CHECK_OUT',
      entity: 'attendance_records',
      entityId: existing._id || existing.id,
      newValue: { check_out_time: checkOutTime, total_working_hours: totalHours },
      ip: req.ip
    });

    const plainRecord = existing.toJSON ? existing.toJSON() : existing;
    plainRecord.id = (existing._id || existing.id).toString();

    broadcastAttendanceEvent({
      eventType: 'EMPLOYEE_CHECK_OUT',
      employeeId: req.employee.id || req.employee._id.toString(),
      employeeName: `${req.employee.first_name} ${req.employee.last_name}`,
      designation: req.employee.designation,
      checkOutTime,
      totalWorkingHours: totalHours,
      date: today,
      record: plainRecord
    });

    res.json({ message: 'Checked out successfully', record: plainRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Individual History: View ONLY own historical attendance logs
router.get('/my-history', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const { limit, month, start_date, end_date, status } = req.query;
    const filter = {
      employee_id: req.employee._id || req.employee.id
    };

    if (month) {
      filter.date = { $regex: `^${month}` };
    } else if (start_date && end_date) {
      filter.date = { $gte: start_date, $lte: end_date };
    } else if (start_date) {
      filter.date = { $gte: start_date };
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const parsedLimit = limit ? Number(limit) : 60;
    const records = await AttendanceRecord.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(parsedLimit)
      .lean({ virtuals: true });

    const formattedRecords = records.map(r => ({
      ...r,
      id: r._id.toString(),
      employee_id: r.employee_id.toString()
    }));

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalHours = 0;

    for (const r of formattedRecords) {
      if (r.status === 'PRESENT') {
        presentDays++;
      } else if (r.status === 'LATE') {
        presentDays++;
        lateDays++;
      } else if (r.status === 'HALF DAY' || r.status === 'HALF_DAY') {
        halfDays++;
        presentDays += 0.5;
      } else if (r.status === 'ABSENT' || r.status === 'LEAVE' || r.status === 'ON_LEAVE') {
        absentDays++;
      }
      totalHours += Number(r.total_working_hours || r.total_hours || 0);
    }

    const totalRecords = formattedRecords.length;
    const avgHours = totalRecords > 0 ? Number((totalHours / totalRecords).toFixed(1)) : 0;
    const onTimeRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

    res.json({
      employee: {
        id: req.employee.id || req.employee._id.toString(),
        employee_code: req.employee.employee_code,
        name: `${req.employee.first_name} ${req.employee.last_name}`,
        designation: req.employee.designation,
        shift: `${req.employee.shift_start || '09:30'} - ${req.employee.shift_end || '18:30'}`
      },
      records: formattedRecords,
      summary: {
        totalRecords,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        totalHours: Number(totalHours.toFixed(1)),
        avgHours,
        onTimeRate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Universal Attendance Master View: Real-Time & Historical records for ALL employees (Admin)
router.get('/records', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { search, role, status, start_date, end_date, date, employee_id, limit, page } = req.query;

    const filter = {};

    if (date) {
      filter.date = date;
    } else if (start_date && end_date) {
      filter.date = { $gte: start_date, $lte: end_date };
    } else if (start_date) {
      filter.date = { $gte: start_date };
    } else if (end_date) {
      filter.date = { $lte: end_date };
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (employee_id) {
      filter.employee_id = employee_id;
    }

    // Load active employees list for filter dropdown and role matching
    const allEmployeesList = await Employee.find({
      employment_status: { $in: ['Active', 'Probation'] }
    })
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .populate('department_id')
      .sort({ first_name: 1 })
      .lean({ virtuals: true });

    const formattedEmployeesList = allEmployeesList.map(e => ({
      ...e,
      id: e._id.toString(),
      role_name: e.user_id?.role_id?.name || null,
      role_display: e.user_id?.role_id?.display_name || null,
      department_name: e.department_id?.name || null
    }));

    // If search or role is provided, find matching employee IDs
    if (search || (role && role !== 'ALL')) {
      let filteredEmps = formattedEmployeesList;

      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        filteredEmps = filteredEmps.filter(e =>
          (e.first_name && e.first_name.toLowerCase().includes(s)) ||
          (e.last_name && e.last_name.toLowerCase().includes(s)) ||
          (`${e.first_name || ''} ${e.last_name || ''}`.toLowerCase().includes(s)) ||
          (e.employee_code && e.employee_code.toLowerCase().includes(s))
        );
      }

      if (role && role !== 'ALL') {
        filteredEmps = filteredEmps.filter(e => {
          if (role === 'sales' || role === 'Sales Executive') {
            return e.role_name === 'sales' || /sales|growth/i.test(e.employee_type || '') || /sales|growth/i.test(e.designation || '');
          }
          if (role === 'marketing_manager' || role === 'Social Media Manager') {
            return e.role_name === 'marketing_manager' || /marketing|social/i.test(e.employee_type || '') || /social|marketing/i.test(e.designation || '');
          }
          if (role === 'editor' || role === 'Video Editor') {
            return e.role_name === 'editor' || /editor|creative/i.test(e.employee_type || '') || /editor/i.test(e.designation || '');
          }
          return e.role_name === role || (e.employee_type && e.employee_type.includes(role)) || (e.designation && e.designation.includes(role));
        });
      }

      const matchedIds = filteredEmps.map(e => e._id);
      if (filter.employee_id) {
        // already filtered by specific employee_id
      } else {
        filter.employee_id = { $in: matchedIds };
      }
    }

    const maxLimit = limit ? Number(limit) : 200;
    const skip = page ? (Number(page) - 1) * maxLimit : 0;

    const rawRecords = await AttendanceRecord.find(filter)
      .populate({
        path: 'employee_id',
        populate: [
          { path: 'user_id', populate: { path: 'role_id' } },
          { path: 'department_id' }
        ]
      })
      .populate('approved_by', 'username')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean({ virtuals: true });

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalHours = 0;

    const records = rawRecords.map(r => {
      const e = r.employee_id || {};
      const u = e.user_id || {};
      const rl = u.role_id || {};
      const d = e.department_id || {};
      const approver = r.approved_by || {};

      const status = r.status;
      if (status === 'PRESENT') {
        presentDays++;
      } else if (status === 'LATE') {
        presentDays++;
        lateDays++;
      } else if (status === 'HALF DAY' || status === 'HALF_DAY') {
        halfDays++;
        presentDays += 0.5;
      } else if (status === 'ABSENT' || status === 'LEAVE' || status === 'ON_LEAVE') {
        absentDays++;
      }
      totalHours += Number(r.total_working_hours || r.total_hours || 0);

      return {
        ...r,
        id: r._id.toString(),
        employee_id: e._id ? e._id.toString() : r.employee_id,
        first_name: e.first_name || null,
        last_name: e.last_name || null,
        employee_name: e.first_name ? `${e.first_name} ${e.last_name || ''}`.trim() : null,
        employee_code: e.employee_code || null,
        designation: e.designation || null,
        employee_type: e.employee_type || null,
        shift_start: e.shift_start || null,
        shift_end: e.shift_end || null,
        profile_photo: e.profile_photo || null,
        department_name: d.name || null,
        role_name: rl.name || null,
        role_display: rl.display_name || null,
        approved_by_name: approver.username || null
      };
    });

    const totalRecords = records.length;
    const avgHours = totalRecords > 0 ? Number((totalHours / totalRecords).toFixed(1)) : 0;
    const onTimeRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

    res.json({
      summary: {
        totalRecords,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        totalHours: Number(totalHours.toFixed(1)),
        avgHours,
        onTimeRate
      },
      employees: formattedEmployeesList,
      records
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Live Presence Hub for Today (Admin Only)
router.get('/today', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const today = getTodayDate();

    const activeEmployees = await Employee.find({
      employment_status: { $in: ['Active', 'Probation'] }
    })
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .populate('department_id')
      .sort({ first_name: 1 })
      .lean({ virtuals: true });

    const empIds = activeEmployees.map(e => e._id);
    const todayRecords = await AttendanceRecord.find({
      employee_id: { $in: empIds },
      date: today
    })
      .populate('approved_by', 'username')
      .lean({ virtuals: true });

    const recordsByEmpId = {};
    for (const r of todayRecords) {
      recordsByEmpId[r.employee_id.toString()] = r;
    }

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let completedCount = 0;
    let totalHours = 0;

    const records = activeEmployees.map(e => {
      const u = e.user_id || {};
      const rl = u.role_id || {};
      const d = e.department_id || {};
      const a = recordsByEmpId[e._id.toString()] || null;

      const attendance_status = a?.status || 'ABSENT';
      const check_in_time = a?.check_in_time || null;
      const check_out_time = a?.check_out_time || null;
      const total_working_hours = a?.total_working_hours || a?.total_hours || 0;

      if (attendance_status === 'PRESENT' || attendance_status === 'LATE' || attendance_status === 'HALF DAY' || attendance_status === 'HALF_DAY') {
        presentCount++;
        if (attendance_status === 'LATE') lateCount++;
        if (attendance_status === 'HALF DAY' || attendance_status === 'HALF_DAY') halfDayCount++;
        if (check_out_time) completedCount++;
        totalHours += Number(total_working_hours);
      } else {
        absentCount++;
      }

      return {
        id: e._id.toString(),
        employee_code: e.employee_code,
        first_name: e.first_name,
        last_name: e.last_name,
        designation: e.designation,
        employee_type: e.employee_type,
        shift_start: e.shift_start,
        shift_end: e.shift_end,
        department_name: d.name || null,
        role_name: rl.name || null,
        role_display: rl.display_name || null,
        attendance_id: a ? a._id.toString() : null,
        check_in_time,
        check_out_time,
        total_working_hours,
        attendance_status,
        is_manual_adjusted: a?.is_manual_adjusted || false,
        adjustment_reason: a?.adjustment_reason || null,
        approved_by_name: a?.approved_by?.username || null
      };
    });

    res.json({
      date: today,
      total_employees: activeEmployees.length,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      half_day_count: halfDayCount,
      completed_count: completedCount,
      total_hours: Number(totalHours.toFixed(1)),
      records
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Manual Override of Attendance Entries (Disabled per system policy)
router.post('/adjust', authenticate, requireRole(['admin']), async (req, res) => {
  return res.status(403).json({
    error: 'Manual attendance override has been disabled by system policy. Direct punches only.'
  });
});

// 8. Sales Executives attendance query (Admin Only)
router.get('/sales-executives', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const allEmployees = await Employee.find({
      employment_status: { $in: ['Active', 'Probation'] }
    })
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .sort({ first_name: 1 })
      .lean({ virtuals: true });

    const salesExecutives = allEmployees
      .filter(e => {
        const roleName = e.user_id?.role_id?.name;
        return roleName === 'sales' || /sales|growth/i.test(e.designation || '');
      })
      .map(e => ({
        id: e._id.toString(),
        employee_code: e.employee_code,
        first_name: e.first_name,
        last_name: e.last_name,
        designation: e.designation,
        phone: e.phone,
        shift_start: e.shift_start,
        shift_end: e.shift_end,
        email: e.user_id?.email,
        username: e.user_id?.username
      }));

    const targetEmployeeId = req.query.employee_id || salesExecutives[0]?.id;
    const { start_date, end_date, month, status } = req.query;

    let records = [];
    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalHours = 0;

    if (targetEmployeeId) {
      const filter = { employee_id: targetEmployeeId };

      if (month) {
        filter.date = { $regex: `^${month}` };
      } else if (start_date && end_date) {
        filter.date = { $gte: start_date, $lte: end_date };
      }

      if (status && status !== 'ALL') {
        filter.status = status;
      }

      const rawRecords = await AttendanceRecord.find(filter)
        .populate('employee_id', 'first_name last_name employee_code designation')
        .populate('approved_by', 'username')
        .sort({ date: -1, createdAt: -1 })
        .lean({ virtuals: true });

      records = rawRecords.map(r => {
        const emp = r.employee_id || {};
        const approver = r.approved_by || {};
        const st = r.status;

        if (st === 'PRESENT') presentDays++;
        else if (st === 'LATE') { presentDays++; lateDays++; }
        else if (st === 'HALF DAY' || st === 'HALF_DAY') { halfDays++; presentDays += 0.5; }
        else if (st === 'ABSENT' || st === 'LEAVE' || st === 'ON_LEAVE') absentDays++;

        totalHours += Number(r.total_working_hours || r.total_hours || 0);

        return {
          ...r,
          id: r._id.toString(),
          employee_id: emp._id ? emp._id.toString() : r.employee_id,
          employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null,
          employee_code: emp.employee_code || null,
          designation: emp.designation || null,
          approved_by_name: approver.username || null
        };
      });
    }

    const totalRecords = records.length;
    const avgHours = totalRecords > 0 ? (totalHours / totalRecords).toFixed(1) : 0;
    const onTimeRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;
    const selectedExecutive = salesExecutives.find(e => e.id === targetEmployeeId) || null;

    res.json({
      salesExecutives,
      selectedExecutive,
      summary: {
        totalRecords,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        totalHours: Number(totalHours.toFixed(1)),
        avgHours: Number(avgHours),
        onTimeRate
      },
      records
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
