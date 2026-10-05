import express from 'express';
import {
  Lead, Client, Project, Task, AttendanceRecord, Employee,
  ContentItem, ContentPerformance, ClientRequest, Campaign,
  Payment, Invoice, Contract, ClientReport
} from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Admin Operational & Executive Analytics
router.get('/admin', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const today = getTodayDate();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const threeDaysLaterDate = new Date();
    threeDaysLaterDate.setDate(now.getDate() + 3);
    const threeDaysLater = threeDaysLaterDate.toISOString().split('T')[0];

    // 1. Leads & Sales Analytics
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'NEW' });
    const convertedLeads = await Lead.countDocuments({ status: 'WON' });
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const leadsBySourceRaw = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const leadsBySource = leadsBySourceRaw.map(s => ({
      source: s._id || 'Unknown',
      count: s.count
    }));

    // 2. Clients Analytics
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'ACTIVE' });
    const onboardingClients = await Client.countDocuments({ status: 'ONBOARDING' });

    // 3. Projects & Tasks
    const activeProjects = await Project.countDocuments({ status: 'ACTIVE' });
    const pendingTasks = await Task.countDocuments({ status: { $ne: 'COMPLETED' } });
    const overdueTasks = await Task.countDocuments({ due_date: { $lt: today }, status: { $ne: 'COMPLETED' } });

    // 4. Attendance Today
    const attendanceToday = await AttendanceRecord.countDocuments({
      date: today,
      status: { $in: ['PRESENT', 'LATE', 'HALF DAY', 'HALF_DAY'] }
    });
    const totalActiveEmployees = await Employee.countDocuments({
      employment_status: { $in: ['Active', 'Probation'] }
    });
    const employeesAbsent = Math.max(0, totalActiveEmployees - attendanceToday);

    // 5. Creative & Review Queues
    const clientApprovalsPending = await ContentItem.countDocuments({ workflow_stage: 'CLIENT_REVIEW' });
    const creativesInternalReview = await ContentItem.countDocuments({ workflow_stage: 'INTERNAL_REVIEW' });
    const clientRequestsPending = await ClientRequest.countDocuments({ status: { $nin: ['COMPLETED', 'CLOSED'] } });

    // 6. Content Scheduled & Published
    const contentScheduledToday = await ContentItem.countDocuments({
      publish_date: today,
      workflow_stage: { $in: ['APPROVED', 'SCHEDULED'] }
    });
    const contentPublished = await ContentItem.countDocuments({ workflow_stage: 'PUBLISHED' });
    const openCampaigns = await Campaign.countDocuments({ status: 'ACTIVE' });

    // 7. Financial Metrics
    const paymentSum = await Payment.aggregate([
      {
        $match: {
          payment_date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = paymentSum[0]?.total || 0;

    const invoices = await Invoice.find({
      payment_status: { $in: ['UNPAID', 'PARTIAL', 'OVERDUE'] }
    }).lean();
    const outstandingPayments = invoices.reduce((sum, inv) => sum + Math.max(0, (inv.total || 0) - (inv.paid_amount || 0)), 0);

    const contractSum = await Contract.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$monthly_amount' } } }
    ]);
    const clientRetainerSum = await Client.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$monthly_retainer_fee' } } }
    ]);
    const mrr = contractSum[0]?.total || clientRetainerSum[0]?.total || 0;

    // 8. Upcoming Deadlines (within 3 days)
    const upcomingDeadlinesRaw = await Task.find({
      status: { $ne: 'COMPLETED' },
      due_date: { $gte: today, $lte: threeDaysLater }
    })
      .populate('client_id', 'company_name')
      .sort({ due_date: 1 })
      .limit(5)
      .lean({ virtuals: true });

    const upcomingDeadlines = upcomingDeadlinesRaw.map(t => ({
      id: t._id.toString(),
      task_code: t.task_code,
      task_title: t.task_title || t.title,
      due_date: t.due_date,
      priority: t.priority,
      company_name: t.client_id?.company_name || null
    }));

    res.json({
      metrics: {
        total_leads: totalLeads,
        new_leads: newLeads,
        converted_leads: convertedLeads,
        conversion_rate: conversionRate,
        total_clients: totalClients,
        active_clients: activeClients,
        onboarding_clients: onboardingClients,
        active_projects: activeProjects,
        pending_tasks: pendingTasks,
        overdue_tasks: overdueTasks,
        attendance_today: attendanceToday,
        employees_absent: employeesAbsent,
        client_requests_pending: clientRequestsPending,
        creatives_internal_review: creativesInternalReview,
        client_approvals_pending: clientApprovalsPending,
        content_scheduled_today: contentScheduledToday,
        content_published: contentPublished,
        open_campaigns: openCampaigns,
        monthly_revenue: monthlyRevenue,
        outstanding_payments: outstandingPayments,
        mrr: mrr
      },
      leadsBySource,
      upcomingDeadlines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client Monthly Performance Reports
router.get('/client-reports', authenticate, async (req, res) => {
  try {
    const { client_id } = req.query;
    const filter = {};

    if (req.user.user_type === 'client') {
      const activeClient = req.client || req.clientProfile;
      if (activeClient) {
        filter.client_id = activeClient._id || activeClient.id;
      }
      filter.status = 'FINALIZED';
    } else if (client_id) {
      filter.client_id = client_id;
    }

    const reportsRaw = await ClientReport.find(filter)
      .populate('client_id', 'company_name client_code')
      .populate('finalized_by', 'username')
      .sort({ report_year: -1, report_month: -1, _id: -1 })
      .lean({ virtuals: true });

    const reports = reportsRaw.map(cr => ({
      ...cr,
      id: cr._id.toString(),
      client_id: cr.client_id?._id ? cr.client_id._id.toString() : cr.client_id,
      company_name: cr.client_id?.company_name || null,
      client_code: cr.client_id?.client_code || null,
      finalized_by_user: cr.finalized_by?.username || null
    }));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate / Save Client Monthly Report
router.post('/client-reports', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      client_id, report_month, report_year, title, work_completed,
      best_content_summary, recommendations, upcoming_plan, status
    } = req.body;

    if (!client_id || !report_month || !report_year || !title) {
      return res.status(400).json({ error: 'Client, month, year, and report title are required.' });
    }

    const monthStr = `${report_year}-${String(report_month).padStart(2, '0')}`;

    const publishedCount = await ContentItem.countDocuments({
      client_id,
      workflow_stage: 'PUBLISHED',
      publish_date: { $regex: `^${monthStr}` }
    });

    const perfAgg = await ContentPerformance.aggregate([
      {
        $match: {
          client_id: client_id,
          recorded_date: { $regex: `^${monthStr}` }
        }
      },
      {
        $group: {
          _id: null,
          reach: { $sum: '$reach' },
          engagement: { $sum: { $add: ['$likes', '$comments', '$shares', '$saves'] } },
          leads: { $sum: '$leads_count' }
        }
      }
    ]);

    const reach = perfAgg[0]?.reach || 0;
    const engagement = perfAgg[0]?.engagement || 0;
    const leads = perfAgg[0]?.leads || 0;

    const report = await ClientReport.create({
      client_id,
      report_month: Number(report_month),
      report_year: Number(report_year),
      title,
      work_completed: work_completed || '',
      content_published_count: publishedCount,
      reach_total: reach,
      engagement_total: engagement,
      leads_generated: leads,
      best_content_summary: best_content_summary || '',
      recommendations: recommendations || '',
      upcoming_plan: upcoming_plan || '',
      status: status || 'DRAFT',
      finalized_by: status === 'FINALIZED' ? (req.user._id || req.user.id) : null,
      finalized_at: status === 'FINALIZED' ? new Date() : null
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'CREATED',
      entity: 'client_reports',
      entityId: report._id || report.id,
      newValue: { client_id, title, month: monthStr },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Client monthly report created successfully',
      report_id: (report._id || report.id).toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
