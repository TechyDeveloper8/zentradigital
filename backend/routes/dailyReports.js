import express from 'express';
import {
  DailyWorkReport, Employee, Client, Project, Task,
  Lead, Meeting, Proposal, SalesTask, AttendanceRecord
} from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastDailyReportEvent } from '../websocket.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Helper: Calculate live production metrics for an employee for a specific date
async function computeLiveEmployeeMetrics(employeeId, dateStr) {
  const targetDate = dateStr || getTodayDate();
  const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);
  const empIdObj = employeeId?._id || employeeId;

  // 1. Attendance Logged Hours & Status
  let loggedHours = 0;
  let attendanceStatus = 'NOT_CHECKED_IN';
  let checkInTime = null;
  let checkOutTime = null;

  try {
    const att = await AttendanceRecord.findOne({
      employee_id: empIdObj,
      date: targetDate
    }).lean();

    if (att) {
      attendanceStatus = att.status || 'PRESENT';
      checkInTime = att.check_in_time || null;
      checkOutTime = att.check_out_time || null;
      if (att.total_working_hours) {
        loggedHours = Number(att.total_working_hours);
      } else if (att.check_in_time) {
        if (targetDate === getTodayDate()) {
          const parts = att.check_in_time.split(':');
          if (parts.length >= 2) {
            const inH = parseInt(parts[0], 10);
            const inM = parseInt(parts[1], 10);
            const now = new Date();
            const inMinutes = inH * 60 + inM;
            const curMinutes = now.getHours() * 60 + now.getMinutes();
            loggedHours = Math.max(0.5, Math.round(((curMinutes - inMinutes) / 60) * 10) / 10);
          }
        } else {
          loggedHours = 8.0;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching attendance in computeLiveEmployeeMetrics:', e);
  }

  // 2. Calls / Follow-ups Completed Today
  let callsMade = 0;
  let proposalsSent = 0;
  let dealsClosed = 0;

  try {
    const leads = await Lead.find({
      $or: [
        { assigned_employee_id: empIdObj },
        { 'follow_ups.assigned_employee_id': empIdObj },
        { 'follow_ups.performed_by': empIdObj }
      ]
    }).lean();

    for (const l of leads) {
      if (Array.isArray(l.follow_ups)) {
        for (const fu of l.follow_ups) {
          const isAssigned = (fu.performed_by?.toString() === empIdObj.toString()) ||
                             (fu.assigned_employee_id?.toString() === empIdObj.toString());
          const isDateMatch = fu.follow_up_date === targetDate ||
                              (fu.completed_at && new Date(fu.completed_at).toISOString().split('T')[0] === targetDate);
          if (isAssigned && isDateMatch && (fu.status === 'COMPLETED' || fu.discussion_summary)) {
            callsMade++;
          }
        }
      }

      // Check stage progression today
      const updatedDate = l.updatedAt ? new Date(l.updatedAt).toISOString().split('T')[0] : null;
      if (l.assigned_employee_id?.toString() === empIdObj.toString() && updatedDate === targetDate) {
        if (l.stage === 'PROPOSAL' || l.stage === 'NEGOTIATION') {
          proposalsSent++;
        } else if (l.stage === 'WON' || l.status === 'WON') {
          dealsClosed++;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching leads in computeLiveEmployeeMetrics:', e);
  }

  // 3. Meetings Conducted / Scheduled Today
  let meetingsDone = 0;
  try {
    const meetings = await Meeting.find({
      assigned_employee_id: empIdObj,
      $or: [
        { meeting_date: { $gte: startOfDay, $lte: endOfDay } },
        { date: targetDate }
      ]
    }).lean();
    meetingsDone = meetings.length;
  } catch (e) {
    console.error('Error fetching meetings in computeLiveEmployeeMetrics:', e);
  }

  // 4. Completed Tasks Today
  const completedTasks = [];
  try {
    const salesTasks = await SalesTask.find({
      assigned_employee_id: empIdObj,
      status: 'COMPLETED',
      $or: [
        { due_date: targetDate },
        { completed_at: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).populate('lead_id', 'company_name contact_person').lean();

    for (const st of salesTasks) {
      completedTasks.push({
        id: st._id.toString(),
        type: 'SALES_TASK',
        title: st.task_title,
        description: st.description || `Sales task for ${st.lead_id?.company_name || 'client'}`,
        lead_name: st.lead_id?.company_name || null
      });
    }

    const generalTasks = await Task.find({
      assigned_employee_id: empIdObj,
      status: 'COMPLETED',
      $or: [
        { due_date: targetDate },
        { completed_at: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).populate('client_id', 'company_name').lean();

    for (const gt of generalTasks) {
      completedTasks.push({
        id: gt._id.toString(),
        type: 'CREATIVE_TASK',
        title: gt.task_title,
        description: gt.task_description || `Deliverable for ${gt.client_id?.company_name || 'client'}`,
        client_name: gt.client_id?.company_name || null
      });
    }
  } catch (e) {
    console.error('Error fetching completed tasks in computeLiveEmployeeMetrics:', e);
  }

  return {
    targetDate,
    loggedHours: Math.min(24, Math.max(0, loggedHours)),
    callsMade,
    meetingsDone,
    proposalsSent,
    dealsClosed,
    attendanceStatus,
    checkInTime,
    checkOutTime,
    completedTasks
  };
}

// Get Daily Reports List (Admin / Managers / Employee self)
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, employee_id, status } = req.query;
    const filter = {};

    if (date) filter.report_date = date;
    if (employee_id) filter.employee_id = employee_id;
    if (status) filter.status = status;

    // If regular employee, only see their own reports
    if (req.user.role_name !== 'admin' && req.user.role_name !== 'marketing_manager') {
      filter.employee_id = req.employee?._id || req.employee?.id;
    }

    const reports = await DailyWorkReport.find(filter)
      .populate('employee_id', 'employee_code first_name last_name designation')
      .populate('reviewed_by', 'first_name last_name')
      .populate('entries.client_id', 'company_name')
      .populate('entries.project_id', 'project_name')
      .populate('entries.task_id', 'task_title')
      .sort({ report_date: -1, createdAt: -1 })
      .lean({ virtuals: true });

    const formatted = reports.map(r => {
      const emp = r.employee_id || {};
      const rev = r.reviewed_by || {};
      const entries = (r.entries || []).map(e => ({
        ...e,
        id: e._id ? e._id.toString() : e.id,
        client_id: e.client_id?._id || e.client_id?.id || e.client_id,
        company_name: e.client_id?.company_name || null,
        project_id: e.project_id?._id || e.project_id?.id || e.project_id,
        project_name: e.project_id?.project_name || null,
        task_id: e.task_id?._id || e.task_id?.id || e.task_id,
        task_title: e.task_id?.task_title || null
      }));

      return {
        ...r,
        id: r._id ? r._id.toString() : r.id,
        employee_id: emp._id ? emp._id.toString() : (r.employee_id || null),
        employee_code: emp.employee_code || null,
        first_name: emp.first_name || null,
        last_name: emp.last_name || null,
        designation: emp.designation || null,
        reviewed_by: rev._id ? rev._id.toString() : (r.reviewed_by || null),
        reviewer_name: rev.first_name ? `${rev.first_name} ${rev.last_name || ''}`.trim() : null,
        calls_made: r.calls_made || 0,
        meetings_done: r.meetings_done || 0,
        proposals_sent: r.proposals_sent || 0,
        deals_closed: r.deals_closed || 0,
        revenue_generated: r.revenue_generated || 0,
        entries
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get My Report for Today (or specified date) with Real-Time Activity Metrics
router.get('/my-today', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const today = req.query.date || getTodayDate();
    const empId = req.employee._id || req.employee.id;

    // Fetch existing submitted report for this date
    const report = await DailyWorkReport.findOne({
      employee_id: empId,
      report_date: today
    })
      .populate('entries.client_id', 'company_name')
      .populate('entries.project_id', 'project_name')
      .populate('entries.task_id', 'task_title')
      .lean({ virtuals: true });

    // Compute live real-time metrics for this employee on this date
    const liveMetrics = await computeLiveEmployeeMetrics(empId, today);

    if (!report) {
      return res.json({
        report: null,
        entries: [],
        liveMetrics
      });
    }

    const entries = (report.entries || []).map(e => ({
      ...e,
      id: e._id ? e._id.toString() : e.id,
      client_id: e.client_id?._id || e.client_id?.id || e.client_id,
      company_name: e.client_id?.company_name || null,
      project_id: e.project_id?._id || e.project_id?.id || e.project_id,
      project_name: e.project_id?.project_name || null,
      task_id: e.task_id?._id || e.task_id?.id || e.task_id,
      task_title: e.task_id?.task_title || null
    }));

    res.json({
      report: {
        ...report,
        id: report._id ? report._id.toString() : report.id,
        calls_made: report.calls_made !== undefined ? report.calls_made : liveMetrics.callsMade,
        meetings_done: report.meetings_done !== undefined ? report.meetings_done : liveMetrics.meetingsDone,
        proposals_sent: report.proposals_sent !== undefined ? report.proposals_sent : liveMetrics.proposalsSent,
        deals_closed: report.deals_closed !== undefined ? report.deals_closed : liveMetrics.dealsClosed,
        revenue_generated: report.revenue_generated || 0
      },
      entries,
      liveMetrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Daily Work Report
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({ error: 'User is not linked to an employee profile.' });
    }

    const {
      report_date,
      total_hours,
      calls_made,
      meetings_done,
      proposals_sent,
      deals_closed,
      revenue_generated,
      remarks,
      challenges,
      tomorrows_plan,
      entries
    } = req.body;

    const date = report_date || getTodayDate();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Please include at least one work deliverable item describing your deliverables.' });
    }

    const calculatedHours = entries.reduce((sum, item) => sum + (Number(item.hours_worked || item.hours_spent) || 0), 0);
    const finalHours = total_hours !== undefined && Number(total_hours) > 0 ? Number(total_hours) : (calculatedHours > 0 ? calculatedHours : 8);

    const formattedEntries = entries.map(e => ({
      client_id: e.client_id || null,
      project_id: e.project_id || null,
      task_id: e.task_id || null,
      work_category: e.work_category || 'General Operations',
      work_description: e.work_description || '',
      start_time: e.start_time || null,
      end_time: e.end_time || null,
      hours_worked: Number(e.hours_worked || e.hours_spent) || 1,
      hours_spent: Number(e.hours_worked || e.hours_spent) || 1,
      deliverable_output: e.deliverable_output || '',
      output_link: e.output_link || e.deliverable_output || '',
      proof_file_url: e.proof_file_url || '',
      client_visible: e.client_visible !== undefined ? !!e.client_visible : true
    }));

    let report = await DailyWorkReport.findOne({
      employee_id: req.employee._id || req.employee.id,
      report_date: date
    });

    const reportFields = {
      total_hours: finalHours,
      calls_made: Number(calls_made) || 0,
      meetings_done: Number(meetings_done) || 0,
      proposals_sent: Number(proposals_sent) || 0,
      deals_closed: Number(deals_closed) || 0,
      revenue_generated: Number(revenue_generated) || 0,
      remarks: remarks || '',
      summary: remarks || '',
      challenges: challenges || '',
      tomorrows_plan: tomorrows_plan || '',
      plan_for_tomorrow: tomorrows_plan || '',
      status: 'SUBMITTED',
      entries: formattedEntries
    };

    if (report) {
      Object.assign(report, reportFields);
      await report.save();
    } else {
      report = await DailyWorkReport.create({
        employee_id: req.employee._id || req.employee.id,
        report_date: date,
        ...reportFields
      });
    }

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'SUBMITTED',
      entity: 'daily_work_reports',
      entityId: report._id || report.id,
      newValue: {
        employee_id: req.employee._id || req.employee.id,
        date,
        total_hours: finalHours,
        calls_made: reportFields.calls_made,
        meetings_done: reportFields.meetings_done,
        entry_count: entries.length
      },
      ip: req.ip
    });

    // Real-time broadcast
    broadcastDailyReportEvent({
      eventType: 'REPORT_SUBMITTED',
      reportId: report._id.toString(),
      employeeId: req.employee._id.toString(),
      employeeName: `${req.employee.first_name} ${req.employee.last_name || ''}`.trim(),
      designation: req.employee.designation,
      reportDate: date,
      totalHours: finalHours,
      callsMade: reportFields.calls_made,
      meetingsDone: reportFields.meetings_done,
      proposalsSent: reportFields.proposals_sent,
      dealsClosed: reportFields.deals_closed
    });

    res.status(201).json({
      message: 'Daily work report submitted successfully and synchronized in real-time.',
      report_id: report.id || report._id.toString(),
      report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Review Report (Manager / Admin)
router.put('/:id/review', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const report = await DailyWorkReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = 'REVIEWED';
    report.reviewed_by = req.employee?._id || req.employee?.id || null;
    report.reviewed_at = new Date();
    if (req.body.reviewer_feedback) {
      report.reviewer_feedback = req.body.reviewer_feedback;
    }
    await report.save();

    broadcastDailyReportEvent({
      eventType: 'REPORT_REVIEWED',
      reportId: report._id.toString(),
      status: 'REVIEWED'
    });

    res.json({ message: 'Report marked as reviewed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Report (Author employee or Admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await DailyWorkReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const isAdmin = req.user.role_name === 'admin';
    const isAuthor = req.employee && report.employee_id.toString() === (req.employee._id || req.employee.id).toString();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: 'You are not authorized to delete this daily report.' });
    }

    await DailyWorkReport.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'DELETED',
      entity: 'daily_work_reports',
      entityId: req.params.id,
      newValue: { report_date: report.report_date },
      ip: req.ip
    });

    broadcastDailyReportEvent({
      eventType: 'REPORT_DELETED',
      reportId: req.params.id,
      reportDate: report.report_date
    });

    res.json({ message: 'Daily report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
