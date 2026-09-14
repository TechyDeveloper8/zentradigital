import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Admin Operational & Executive Analytics (Section 5, 28, 39)
// STRICT RULE: All metrics calculated directly from database records, ZERO mock data.
router.get('/admin', authenticate, requireRole(['admin']), (req, res) => {
  // 1. Leads & Sales Analytics
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const newLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'NEW'").get().count;
  const convertedLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'WON'").get().count;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const leadsBySource = db.prepare(`
    SELECT source, COUNT(*) as count FROM leads GROUP BY source
  `).all();

  // 2. Clients Analytics
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
  const activeClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'ACTIVE'").get().count;
  const onboardingClients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'ONBOARDING'").get().count;

  // 3. Projects & Tasks
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'ACTIVE'").get().count;
  const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'COMPLETED'").get().count;
  const overdueTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < DATE('now') AND status != 'COMPLETED'").get().count;

  // 4. Attendance Today
  const today = new Date().toISOString().split('T')[0];
  const attendanceToday = db.prepare(`
    SELECT COUNT(*) as count FROM attendance_records
    WHERE date = ? AND status IN ('PRESENT', 'LATE', 'HALF DAY')
  `).get(today).count;

  const totalActiveEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE employment_status IN ('Active', 'Probation')").get().count;
  const employeesAbsent = Math.max(0, totalActiveEmployees - attendanceToday);

  // 5. Creative & Review Queues
  const clientApprovalsPending = db.prepare("SELECT COUNT(*) as count FROM content_items WHERE workflow_stage = 'CLIENT_REVIEW'").get().count;
  const creativesInternalReview = db.prepare("SELECT COUNT(*) as count FROM content_items WHERE workflow_stage = 'INTERNAL_REVIEW'").get().count;
  const clientRequestsPending = db.prepare("SELECT COUNT(*) as count FROM client_requests WHERE status NOT IN ('COMPLETED', 'CLOSED')").get().count;

  // 6. Content Scheduled & Published
  const contentScheduledToday = db.prepare("SELECT COUNT(*) as count FROM content_items WHERE publish_date = ? AND workflow_stage IN ('APPROVED', 'SCHEDULED')").get(today).count;
  const contentPublished = db.prepare("SELECT COUNT(*) as count FROM content_items WHERE workflow_stage = 'PUBLISHED'").get().count;
  const openCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = 'ACTIVE'").get().count;

  // 7. Financial Metrics
  const monthlyRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments
    WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')
  `).get().total;

  const outstandingPayments = db.prepare(`
    SELECT COALESCE(SUM(total - paid_amount), 0) as total FROM invoices
    WHERE payment_status IN ('UNPAID', 'PARTIAL', 'OVERDUE')
  `).get().total;

  const mrr = db.prepare(`
    SELECT COALESCE(SUM(monthly_amount), 0) as total FROM contracts WHERE status = 'ACTIVE'
  `).get().total;

  // 8. Upcoming Deadlines (within 3 days)
  const upcomingDeadlines = db.prepare(`
    SELECT t.id, t.task_code, t.task_title, t.due_date, t.priority, c.company_name
    FROM tasks t
    JOIN clients c ON t.client_id = c.id
    WHERE t.status != 'COMPLETED' AND t.due_date BETWEEN DATE('now') AND DATE('now', '+3 days')
    ORDER BY t.due_date ASC LIMIT 5
  `).all();

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
});

// Client Monthly Performance Reports (Section 36)
router.get('/client-reports', authenticate, (req, res) => {
  const { client_id } = req.query;

  let sql = `
    SELECT cr.*, c.company_name, c.client_code,
           u.username as finalized_by_user
    FROM client_reports cr
    JOIN clients c ON cr.client_id = c.id
    LEFT JOIN users u ON cr.finalized_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ? AND cr.status = 'FINALIZED'`;
    params.push(req.user.id);
  } else if (client_id) {
    sql += ` AND cr.client_id = ?`;
    params.push(client_id);
  }

  sql += ` ORDER BY cr.report_year DESC, cr.report_month DESC`;
  const reports = db.prepare(sql).all(...params);
  res.json(reports);
});

// Generate / Save Client Monthly Report
router.post('/client-reports', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    client_id, report_month, report_year, title, work_completed,
    best_content_summary, recommendations, upcoming_plan, status
  } = req.body;

  if (!client_id || !report_month || !report_year || !title) {
    return res.status(400).json({ error: 'Client, month, year, and report title are required.' });
  }

  // Calculate live numbers from database for this month
  const monthStr = `${report_year}-${String(report_month).padStart(2, '0')}`;

  const publishedCount = db.prepare(`
    SELECT COUNT(*) as count FROM content_items
    WHERE client_id = ? AND workflow_stage = 'PUBLISHED' AND strftime('%Y-%m', publish_date) = ?
  `).get(client_id, monthStr).count;

  const perf = db.prepare(`
    SELECT COALESCE(SUM(reach), 0) as reach,
           COALESCE(SUM(likes + comments + shares + saves), 0) as engagement,
           COALESCE(SUM(leads_count), 0) as leads
    FROM content_performance
    WHERE client_id = ? AND strftime('%Y-%m', recorded_date) = ?
  `).get(client_id, monthStr);

  const result = db.prepare(`
    INSERT INTO client_reports (
      client_id, report_month, report_year, title, work_completed,
      content_published_count, reach_total, engagement_total, leads_generated,
      best_content_summary, recommendations, upcoming_plan, status,
      finalized_by, finalized_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client_id, report_month, report_year, title, work_completed || '',
    publishedCount, perf.reach, perf.engagement, perf.leads,
    best_content_summary || '', recommendations || '', upcoming_plan || '',
    status || 'DRAFT', status === 'FINALIZED' ? req.user.id : null,
    status === 'FINALIZED' ? new Date().toISOString() : null
  );

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'client_reports',
    entityId: result.lastInsertRowid,
    newValue: { client_id, title, month: monthStr },
    ip: req.ip
  });

  res.status(201).json({ message: 'Client monthly report created successfully' });
});

export default router;
