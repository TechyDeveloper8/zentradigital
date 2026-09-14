import express from 'express';
import db, { logAudit, logLeadActivity, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// =========================================================================
// 1. List Leads with Advanced Filters & Server-Side Pagination (Section 21, 22)
// =========================================================================
router.get('/', authenticate, (req, res) => {
  const {
    status, stage, assigned_to, source, priority, industry,
    search, page = 1, limit = 50, quick_filter
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let baseSql = `
    FROM leads l
    LEFT JOIN employees e ON l.assigned_sales_employee_id = e.id
    LEFT JOIN users u ON l.created_by = u.id
    LEFT JOIN clients c ON l.converted_client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Scoping for Sales Executive
  if (req.user.role_name === 'sales' && req.employee) {
    baseSql += ` AND (l.assigned_sales_employee_id = ? OR l.created_by = ?)`;
    params.push(req.employee.id, req.user.id);
  }

  const effectiveStatus = status || stage;
  if (effectiveStatus && effectiveStatus !== 'ALL') {
    baseSql += ` AND l.status = ?`;
    params.push(effectiveStatus);
  }

  if (assigned_to) {
    baseSql += ` AND l.assigned_sales_employee_id = ?`;
    params.push(Number(assigned_to));
  }

  if (source && source !== 'ALL') {
    baseSql += ` AND l.source = ?`;
    params.push(source);
  }

  if (priority && priority !== 'ALL') {
    baseSql += ` AND l.priority = ?`;
    params.push(priority);
  }

  if (industry && industry !== 'ALL') {
    baseSql += ` AND l.industry = ?`;
    params.push(industry);
  }

  // Quick Filter Chips (Section 22)
  if (quick_filter) {
    switch (quick_filter.toUpperCase()) {
      case 'HOT_LEADS':
        baseSql += ` AND (l.priority IN ('HIGH', 'URGENT') OR l.lead_score >= 80)`;
        break;
      case 'HIGH_VALUE':
        baseSql += ` AND l.deal_value >= 150000`;
        break;
      case 'RECENTLY_ADDED':
        baseSql += ` AND date(l.created_at) >= DATE('now', '-7 days')`;
        break;
      case 'PROPOSAL_PENDING':
        baseSql += ` AND l.status = 'PROPOSAL'`;
        break;
      case 'NO_FOLLOW_UP':
        baseSql += ` AND NOT EXISTS (SELECT 1 FROM lead_follow_ups fu WHERE fu.lead_id = l.id AND fu.status = 'PENDING')`;
        break;
      default:
        break;
    }
  }

  if (search) {
    baseSql += ` AND (l.company_name LIKE ? OR l.contact_person LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.lead_code LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  // Total count
  const countRow = db.prepare(`SELECT COUNT(*) as total ${baseSql}`).get(...params);
  const total = countRow ? countRow.total : 0;

  // Selected records
  const selectSql = `
    SELECT l.*,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           u.username as created_by_name,
           c.client_code as converted_client_code,
           (SELECT fu.follow_up_date || ' ' || coalesce(fu.follow_up_time, '')
            FROM lead_follow_ups fu
            WHERE fu.lead_id = l.id AND fu.status = 'PENDING'
            ORDER BY fu.follow_up_date ASC LIMIT 1) as next_follow_up,
           (SELECT act.title
            FROM lead_activities act
            WHERE act.lead_id = l.id
            ORDER BY act.id DESC LIMIT 1) as last_activity,
           (SELECT act.created_at
            FROM lead_activities act
            WHERE act.lead_id = l.id
            ORDER BY act.id DESC LIMIT 1) as last_activity_time
    ${baseSql}
    ORDER BY l.id DESC
    LIMIT ? OFFSET ?
  `;

  const leads = db.prepare(selectSql).all(...params, limitNum, offset);

  // Group by status counts
  let countSql = `SELECT status, COUNT(*) as count FROM leads WHERE 1=1`;
  const countParams = [];
  if (req.user.role_name === 'sales' && req.employee) {
    countSql += ` AND (assigned_sales_employee_id = ? OR created_by = ?)`;
    countParams.push(req.employee.id, req.user.id);
  }
  countSql += ` GROUP BY status`;
  const pipelineCounts = db.prepare(countSql).all(...countParams);

  res.json({
    leads,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    pipelineCounts
  });
});

// =========================================================================
// 2. Dedicated Today's & Overdue Follow-ups (Section 10, 11)
// =========================================================================
router.get('/follow-ups/today', authenticate, (req, res) => {
  let sql = `
    SELECT fu.*,
           l.company_name, l.contact_person, l.phone, l.lead_code, l.deal_value,
           e.first_name || ' ' || e.last_name as assigned_employee_name
    FROM lead_follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    LEFT JOIN employees e ON fu.assigned_employee_id = e.id
    WHERE fu.follow_up_date = DATE('now')
  `;
  const params = [];

  if (req.user.role_name === 'sales' && req.employee) {
    sql += ` AND (fu.assigned_employee_id = ? OR l.assigned_sales_employee_id = ?)`;
    params.push(req.employee.id, req.employee.id);
  }

  sql += ` ORDER BY fu.status = 'PENDING' DESC, fu.follow_up_time ASC, fu.id DESC`;
  const followUps = db.prepare(sql).all(...params);
  res.json({ followUps });
});

router.get('/follow-ups/overdue', authenticate, (req, res) => {
  let sql = `
    SELECT fu.*,
           CAST(julianday('now') - julianday(fu.follow_up_date) AS INTEGER) as days_overdue,
           l.company_name, l.contact_person, l.phone, l.lead_code, l.deal_value,
           e.first_name || ' ' || e.last_name as assigned_employee_name
    FROM lead_follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    LEFT JOIN employees e ON fu.assigned_employee_id = e.id
    WHERE fu.follow_up_date < DATE('now') AND fu.status = 'PENDING'
  `;
  const params = [];

  if (req.user.role_name === 'sales' && req.employee) {
    sql += ` AND (fu.assigned_employee_id = ? OR l.assigned_sales_employee_id = ?)`;
    params.push(req.employee.id, req.employee.id);
  }

  sql += ` ORDER BY fu.follow_up_date ASC, fu.priority = 'URGENT' DESC, fu.id DESC`;
  const overdueFollowUps = db.prepare(sql).all(...params);
  res.json({ overdueFollowUps });
});

// Update Follow-Up (Complete, Reschedule, Add Note)
router.put('/follow-ups/:id', authenticate, (req, res) => {
  const followUp = db.prepare('SELECT * FROM lead_follow_ups WHERE id = ?').get(req.params.id);
  if (!followUp) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }

  const {
    status, follow_up_date, follow_up_time, discussion_summary,
    next_action, next_follow_up_date, contact_method
  } = req.body;

  db.prepare(`
    UPDATE lead_follow_ups SET
      status = coalesce(?, status),
      follow_up_date = coalesce(?, follow_up_date),
      follow_up_time = coalesce(?, follow_up_time),
      discussion_summary = coalesce(?, discussion_summary),
      next_action = coalesce(?, next_action),
      next_follow_up_date = coalesce(?, next_follow_up_date),
      contact_method = coalesce(?, contact_method)
    WHERE id = ?
  `).run(
    status, follow_up_date, follow_up_time, discussion_summary,
    next_action, next_follow_up_date, contact_method, followUp.id
  );

  // Log lead activity
  if (status === 'COMPLETED' && followUp.status !== 'COMPLETED') {
    logLeadActivity({
      leadId: followUp.lead_id,
      activityType: 'FOLLOW_UP_COMPLETED',
      title: `${followUp.contact_method} Follow-up Completed`,
      description: discussion_summary || followUp.discussion_summary,
      performedBy: req.employee ? req.employee.id : null
    });
  } else if (follow_up_date && follow_up_date !== followUp.follow_up_date) {
    logLeadActivity({
      leadId: followUp.lead_id,
      activityType: 'FOLLOW_UP_SCHEDULED',
      title: 'Follow-up Rescheduled',
      description: `Rescheduled to ${follow_up_date} at ${follow_up_time || followUp.follow_up_time}. Action: ${next_action || followUp.next_action || 'Discussion'}`,
      performedBy: req.employee ? req.employee.id : null
    });
  }

  const updated = db.prepare('SELECT * FROM lead_follow_ups WHERE id = ?').get(followUp.id);
  res.json({ message: 'Follow-up updated successfully', follow_up: updated });
});

// =========================================================================
// 3. Single Lead Detail with Full 360 Records (Section 14)
// =========================================================================
router.get('/:id', authenticate, (req, res) => {
  const lead = db.prepare(`
    SELECT l.*,
           e.first_name || ' ' || e.last_name as assigned_employee_name,
           u.username as created_by_name,
           c.client_code as converted_client_code
    FROM leads l
    LEFT JOIN employees e ON l.assigned_sales_employee_id = e.id
    LEFT JOIN users u ON l.created_by = u.id
    LEFT JOIN clients c ON l.converted_client_id = c.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const followUps = db.prepare(`
    SELECT fu.*, e.first_name || ' ' || e.last_name as assigned_name
    FROM lead_follow_ups fu
    LEFT JOIN employees e ON fu.assigned_employee_id = e.id
    WHERE fu.lead_id = ?
    ORDER BY fu.follow_up_date DESC, fu.id DESC
  `).all(lead.id);

  const proposals = db.prepare(`
    SELECT * FROM proposals WHERE lead_id = ? ORDER BY id DESC
  `).all(lead.id);

  const meetings = db.prepare(`
    SELECT m.*, e.first_name || ' ' || e.last_name as assigned_employee_name
    FROM meetings m
    LEFT JOIN employees e ON m.assigned_employee_id = e.id
    WHERE m.lead_id = ?
    ORDER BY m.meeting_date DESC, m.meeting_time DESC
  `).all(lead.id);

  const activities = db.prepare(`
    SELECT act.*, e.first_name || ' ' || e.last_name as performed_by_name
    FROM lead_activities act
    LEFT JOIN employees e ON act.performed_by = e.id
    WHERE act.lead_id = ?
    ORDER BY act.created_at DESC, act.id DESC
  `).all(lead.id);

  res.json({ lead, followUps, proposals, meetings, activities });
});

// =========================================================================
// 4. Create Lead (Section 8: 6-Step Multi-Step Form)
// =========================================================================
router.post('/', authenticate, requireRole(['admin', 'sales', 'marketing_manager']), (req, res) => {
  const {
    company_name, contact_person, designation, phone, whatsapp, email, website,
    city, state, country = 'India',
    industry, business_type, company_size, product_service, target_market, target_location, competitors, current_marketing_method,
    services_required, requirement, main_business_problem, desired_outcome, expected_start_date, existing_agency, urgency = 'Medium',
    deal_value, budget_range, billing_type = 'Monthly', expected_contract_duration, decision_maker, purchase_timeline, pricing_sensitivity,
    source, lead_type = 'Inbound', priority = 'MEDIUM', assigned_sales_employee_id, first_follow_up_date, lead_score = 50, notes,
    initial_follow_up
  } = req.body;

  if (!company_name || !contact_person || !phone || !source) {
    return res.status(400).json({ error: 'Company Name, Contact Person, Phone Number, and Lead Source are mandatory.' });
  }

  const currentYear = new Date().getFullYear();
  const count = db.prepare('SELECT COUNT(*) as count FROM leads').get().count + 1;
  const lead_code = `LEAD-${currentYear}-${String(count).padStart(4, '0')}`;
  const lead_date = new Date().toISOString().split('T')[0];

  const assignedEmpId = assigned_sales_employee_id || (req.employee ? req.employee.id : null);

  const stmt = db.prepare(`
    INSERT INTO leads (
      lead_code, lead_date, company_name, contact_person, designation, phone, whatsapp,
      email, website, city, state, country,
      industry, business_type, company_size, product_service, target_market, target_location, competitors, current_marketing_method,
      services_required, requirement, main_business_problem, desired_outcome, expected_start_date, existing_agency, urgency,
      deal_value, budget_range, billing_type, expected_contract_duration, decision_maker, purchase_timeline, pricing_sensitivity,
      source, lead_type, priority, assigned_sales_employee_id, first_follow_up_date, lead_score, notes, status, created_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, 'NEW', ?
    )
  `);

  const servicesStr = Array.isArray(services_required)
    ? JSON.stringify(services_required)
    : (services_required || '');

  const result = stmt.run(
    lead_code, lead_date, company_name, contact_person, designation || 'Owner', phone, whatsapp || phone,
    email || '', website || '', city || '', state || '', country || 'India',
    industry || 'General Business', business_type || '', company_size || '', product_service || '', target_market || '', target_location || '', competitors || '', current_marketing_method || '',
    servicesStr, requirement || '', main_business_problem || '', desired_outcome || '', expected_start_date || null, existing_agency || '', urgency,
    Number(deal_value || 50000), budget_range || '₹50,000 - ₹1,00,000 / month', billing_type, expected_contract_duration || '6 Months', decision_maker || contact_person, purchase_timeline || 'Immediate', pricing_sensitivity || 'Normal',
    source, lead_type, priority, assignedEmpId, first_follow_up_date || null, Number(lead_score || 50), notes || '', req.user.id
  );

  const leadId = result.lastInsertRowid;

  // Record initial activity
  logLeadActivity({
    leadId,
    activityType: 'LEAD_CREATED',
    title: 'Lead Created',
    description: `New lead created from ${source} with deal estimate of ₹${Number(deal_value || 50000).toLocaleString()}`,
    performedBy: assignedEmpId
  });

  // Optional: create immediate initial follow-up if provided
  if (initial_follow_up && initial_follow_up.follow_up_date) {
    db.prepare(`
      INSERT INTO lead_follow_ups (
        lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
        next_action, assigned_employee_id, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      leadId,
      initial_follow_up.follow_up_date,
      initial_follow_up.follow_up_time || '11:00',
      initial_follow_up.contact_method || 'Phone',
      initial_follow_up.discussion_summary || 'Initial prospect connection call',
      initial_follow_up.next_action || 'Introductory pitch',
      assignedEmpId,
      priority
    );

    logLeadActivity({
      leadId,
      activityType: 'FOLLOW_UP_SCHEDULED',
      title: 'First Follow-Up Scheduled',
      description: `${initial_follow_up.contact_method || 'Phone'} call scheduled for ${initial_follow_up.follow_up_date}`,
      performedBy: assignedEmpId
    });
  }

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'leads',
    entityId: leadId,
    newValue: { lead_code, company_name, contact_person, source, priority, deal_value: deal_value || 50000 },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  res.status(201).json({ message: 'Lead created successfully', lead: created });
});

// =========================================================================
// 5. Update Pipeline Stage (Section 7: Drag & Drop / Stage Progression)
// =========================================================================
router.put('/:id/stage', authenticate, (req, res) => {
  const { stage, notes } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const ALLOWED_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON HOLD'];
  if (!ALLOWED_STAGES.includes(stage)) {
    return res.status(400).json({ error: `Invalid stage: ${stage}` });
  }

  const oldStage = lead.status;

  db.prepare(`
    UPDATE leads SET
      status = ?,
      notes = coalesce(?, notes),
      stage_updated_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(stage, notes, lead.id);

  // Log activity
  logLeadActivity({
    leadId: lead.id,
    activityType: 'STAGE_CHANGED',
    title: `Stage Changed: ${oldStage} → ${stage}`,
    description: notes || `Opportunity advanced from ${oldStage} to ${stage}`,
    performedBy: req.employee ? req.employee.id : null
  });

  // If assigned to another sales employee, notify them
  if (lead.assigned_sales_employee_id && (!req.employee || req.employee.id !== lead.assigned_sales_employee_id)) {
    const empUser = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(lead.assigned_sales_employee_id);
    if (empUser) {
      createNotification({
        userId: empUser.user_id,
        type: 'STAGE_CHANGED',
        title: 'Lead Stage Updated',
        message: `${lead.company_name} stage updated to ${stage}`,
        relatedEntity: 'leads',
        relatedEntityId: lead.id
      });
    }
  }

  logAudit({
    userId: req.user.id,
    action: 'STAGE_CHANGED',
    entity: 'leads',
    entityId: lead.id,
    oldValue: { status: oldStage },
    newValue: { status: stage, notes },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  res.json({ message: `Lead stage updated to ${stage}`, lead: updated });
});

// =========================================================================
// 6. Lead Qualification API (Section 9)
// =========================================================================
router.put('/:id/qualify', authenticate, (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const {
    qualification_data, qualification_status, lead_score, deal_value
  } = req.body;

  const qDataStr = typeof qualification_data === 'object'
    ? JSON.stringify(qualification_data)
    : (qualification_data || '');

  let newStatus = lead.status;
  if (qualification_status === 'Qualified' && (lead.status === 'NEW' || lead.status === 'CONTACTED')) {
    newStatus = 'QUALIFIED';
  } else if (qualification_status === 'Unqualified') {
    newStatus = 'LOST';
  }

  db.prepare(`
    UPDATE leads SET
      qualification_data = ?,
      qualification_status = coalesce(?, qualification_status),
      lead_score = coalesce(?, lead_score),
      deal_value = coalesce(?, deal_value),
      status = ?,
      stage_updated_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    qDataStr,
    qualification_status,
    lead_score !== undefined ? Number(lead_score) : lead.lead_score,
    deal_value !== undefined ? Number(deal_value) : lead.deal_value,
    newStatus,
    lead.id
  );

  logLeadActivity({
    leadId: lead.id,
    activityType: 'QUALIFICATION_UPDATED',
    title: `Lead Qualification: ${qualification_status || 'Updated'}`,
    description: `Lead scored at ${lead_score || lead.lead_score}. Status set to ${qualification_status}.`,
    performedBy: req.employee ? req.employee.id : null
  });

  logAudit({
    userId: req.user.id,
    action: 'LEAD_QUALIFIED',
    entity: 'leads',
    entityId: lead.id,
    newValue: { qualification_status, lead_score },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
  res.json({ message: 'Lead qualification updated successfully', lead: updated });
});

// =========================================================================
// 7. Lead Activity Timeline & Logging (Section 13)
// =========================================================================
router.get('/:id/activities', authenticate, (req, res) => {
  const activities = db.prepare(`
    SELECT act.*, e.first_name || ' ' || e.last_name as performed_by_name
    FROM lead_activities act
    LEFT JOIN employees e ON act.performed_by = e.id
    WHERE act.lead_id = ?
    ORDER BY act.created_at DESC, act.id DESC
  `).all(req.params.id);

  res.json({ activities });
});

router.post('/:id/activities', authenticate, (req, res) => {
  const lead = db.prepare('SELECT id, company_name FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { activity_type, title, description, metadata } = req.body;
  if (!activity_type || !title) {
    return res.status(400).json({ error: 'Activity type and title are required.' });
  }

  logLeadActivity({
    leadId: lead.id,
    activityType: activity_type,
    title,
    description: description || '',
    performedBy: req.employee ? req.employee.id : null,
    metadata
  });

  // If call or WhatsApp logged on a NEW lead, advance to CONTACTED
  if ((activity_type === 'CALL_MADE' || activity_type === 'WHATSAPP_SENT' || activity_type === 'EMAIL_SENT') && lead.status === 'NEW') {
    db.prepare(`UPDATE leads SET status = 'CONTACTED', stage_updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead.id);
  }

  const recent = db.prepare(`
    SELECT act.*, e.first_name || ' ' || e.last_name as performed_by_name
    FROM lead_activities act
    LEFT JOIN employees e ON act.performed_by = e.id
    WHERE act.lead_id = ?
    ORDER BY act.id DESC LIMIT 1
  `).get(lead.id);

  res.status(201).json({ message: 'Activity logged successfully', activity: recent });
});

// =========================================================================
// 8. Add Follow-up to Lead
// =========================================================================
router.post('/:id/follow-ups', authenticate, (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const {
    follow_up_date, follow_up_time, contact_method, discussion_summary,
    client_requirement, next_action, next_follow_up_date, priority, reminder, status
  } = req.body;

  if (!follow_up_date || !contact_method || !discussion_summary) {
    return res.status(400).json({ error: 'Date, contact method, and discussion summary are required.' });
  }

  const assignedEmp = req.employee ? req.employee.id : lead.assigned_sales_employee_id;

  const result = db.prepare(`
    INSERT INTO lead_follow_ups (
      lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
      client_requirement, next_action, next_follow_up_date, assigned_employee_id,
      priority, reminder, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lead.id, follow_up_date, follow_up_time || '14:00', contact_method, discussion_summary,
    client_requirement || '', next_action || '', next_follow_up_date || null, assignedEmp,
    priority || 'MEDIUM', reminder !== undefined ? (reminder ? 1 : 0) : 1, status || 'PENDING'
  );

  // If NEW, advance to CONTACTED
  if (lead.status === 'NEW') {
    db.prepare("UPDATE leads SET status = 'CONTACTED', stage_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(lead.id);
  }

  logLeadActivity({
    leadId: lead.id,
    activityType: 'FOLLOW_UP_SCHEDULED',
    title: `${contact_method} Follow-up Scheduled`,
    description: `Scheduled for ${follow_up_date} at ${follow_up_time || '14:00'}. Action: ${next_action || 'Discussion'}`,
    performedBy: assignedEmp
  });

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'lead_follow_ups',
    entityId: result.lastInsertRowid,
    newValue: { lead_id: lead.id, contact_method, follow_up_date },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM lead_follow_ups WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Follow-up recorded successfully', follow_up: created });
});

// =========================================================================
// 9. Won Deal & Client Handover Workflow (Section 16, 17)
// =========================================================================
router.post('/:id/convert-and-handover', authenticate, requireRole(['admin', 'sales']), (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  if (lead.converted_client_id) {
    return res.status(400).json({ error: 'This lead has already been converted to client.' });
  }

  const {
    start_date, contract_start_date, contract_end_date, billing_cycle = 'Monthly',
    monthly_value, client_priority = 'HIGH',
    account_manager_id, marketing_manager_id, creative_editor_id,
    client_requirements, services_sold, pricing_terms, commitments, campaign_requirements,
    target_audience, important_dates, special_instructions, communication_preferences
  } = req.body;

  const convertTx = db.transaction(() => {
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count + 1;
    const client_code = `CL-${new Date().getFullYear()}-${String(clientCount).padStart(4, '0')}`;
    const sDate = start_date || new Date().toISOString().split('T')[0];

    // 1. Create Client
    const clientRes = db.prepare(`
      INSERT INTO clients (
        client_code, company_name, business_type, industry, website, address,
        city, state, primary_contact_name, primary_contact_designation,
        primary_contact_phone, primary_contact_whatsapp, primary_contact_email,
        assigned_sales_employee_id, billing_cycle, status, start_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ONBOARDING', ?, ?)
    `).run(
      client_code, lead.company_name, lead.business_type, lead.industry, lead.website,
      lead.city || '', lead.city || '', lead.state || '', lead.contact_person, lead.designation,
      lead.phone, lead.whatsapp || lead.phone, lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`,
      lead.assigned_sales_employee_id, billing_cycle, sDate,
      `Converted from Won Deal [${lead.lead_code}]. Monthly Retainer: ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()}`
    );

    const clientId = clientRes.lastInsertRowid;

    // 2. Primary Contact
    db.prepare(`
      INSERT INTO client_contacts (
        client_id, name, designation, phone, email, whatsapp, can_approve_content, can_create_requests
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `).run(
      clientId, lead.contact_person, lead.designation || 'Owner', lead.phone,
      lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`, lead.whatsapp || lead.phone
    );

    // 3. Client Services (if array provided)
    const servicesArray = Array.isArray(services_sold)
      ? services_sold
      : (lead.services_required ? JSON.parse(lead.services_required || '[]') : []);

    for (const s of servicesArray) {
      const sName = typeof s === 'string' ? s : (s.service_name || 'Marketing Retainer');
      const sPrice = typeof s === 'object' && s.price ? s.price : (monthly_value || lead.deal_value || 50000);
      db.prepare(`
        INSERT INTO client_services (
          client_id, service_name, billing_cycle, price, start_date, status
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `).run(clientId, sName, billing_cycle, sPrice, sDate);
    }

    // 4. Employee Assignments
    if (marketing_manager_id) {
      db.prepare(`
        INSERT INTO employee_assignments (client_id, employee_id, role, responsibilities, is_lead)
        VALUES (?, ?, 'Marketing Manager', 'Primary strategy & client reviews oversight', 1)
      `).run(clientId, marketing_manager_id);
    }

    if (account_manager_id) {
      db.prepare(`
        INSERT INTO employee_assignments (client_id, employee_id, role, responsibilities, is_lead)
        VALUES (?, ?, 'Account Manager', 'Client communications and operations manager', 0)
      `).run(clientId, account_manager_id);
    }

    if (creative_editor_id) {
      db.prepare(`
        INSERT INTO employee_assignments (client_id, employee_id, role, responsibilities, is_lead)
        VALUES (?, ?, 'Creative Specialist', 'Lead creative design & video editing', 0)
      `).run(clientId, creative_editor_id);
    }

    // 5. 17-Point Onboarding Checklist
    const checklistItems = [
      { key: 'profile_complete', label: 'Client profile complete' },
      { key: 'logo_received', label: 'Logo received' },
      { key: 'brand_guidelines', label: 'Brand guidelines received' },
      { key: 'brand_colors', label: 'Brand colors received' },
      { key: 'fonts_received', label: 'Fonts received' },
      { key: 'social_media_links', label: 'Social media links received' },
      { key: 'social_credentials', label: 'Social media credentials configured securely' },
      { key: 'website_details', label: 'Website details received' },
      { key: 'product_service_info', label: 'Product/service information received' },
      { key: 'target_audience', label: 'Target audience defined' },
      { key: 'competitors_added', label: 'Competitors added' },
      { key: 'location_service_area', label: 'Location/service area added' },
      { key: 'comm_preferences', label: 'Communication preferences confirmed' },
      { key: 'approval_person_id', label: 'Approval person identified' },
      { key: 'content_preferences', label: 'Content preferences defined' },
      { key: 'campaign_goals', label: 'Campaign goals defined' },
      { key: 'package_confirmed', label: 'Required service package confirmed' }
    ];

    const insertChecklist = db.prepare(`
      INSERT INTO client_onboarding_checklists (client_id, item_key, item_label, is_completed)
      VALUES (?, ?, ?, 0)
    `);
    for (const item of checklistItems) {
      insertChecklist.run(clientId, item.key, item.label);
    }

    // 6. Client Handover Record
    db.prepare(`
      INSERT INTO client_handovers (
        lead_id, client_id, sales_employee_id, marketing_manager_id, account_manager_id,
        client_requirements, services_sold, pricing_terms, commitments, campaign_requirements,
        target_audience, important_dates, special_instructions, communication_preferences, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      lead.id, clientId,
      req.employee ? req.employee.id : lead.assigned_sales_employee_id,
      marketing_manager_id || null,
      account_manager_id || null,
      client_requirements || lead.requirement || '',
      JSON.stringify(servicesArray),
      pricing_terms || `Monthly Retainer: ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()} (${billing_cycle})`,
      commitments || '',
      campaign_requirements || '',
      target_audience || lead.target_market || '',
      important_dates || `Kickoff: ${sDate}`,
      special_instructions || '',
      communication_preferences || 'WhatsApp & Email',
    );

    // 7. Update Lead to WON with converted_client_id
    db.prepare(`
      UPDATE leads SET
        status = 'WON',
        deal_value = coalesce(?, deal_value),
        converted_client_id = ?,
        stage_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(monthly_value ? Number(monthly_value) : lead.deal_value, clientId, lead.id);

    // 8. Log Activities
    logLeadActivity({
      leadId: lead.id,
      activityType: 'DEAL_WON',
      title: 'Deal Won & Converted',
      description: `Opportunity successfully closed at ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()}. Converted to Client [${client_code}].`,
      performedBy: req.employee ? req.employee.id : null
    });

    logLeadActivity({
      leadId: lead.id,
      activityType: 'HANDOVER_SUBMITTED',
      title: 'Client Handover Submitted',
      description: 'Formal agency handover dossier created for onboarding and marketing execution team.',
      performedBy: req.employee ? req.employee.id : null
    });

    // 9. Notify Marketing Manager
    if (marketing_manager_id) {
      const mmUser = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(marketing_manager_id);
      if (mmUser) {
        createNotification({
          userId: mmUser.user_id,
          type: 'CLIENT_HANDOVER',
          title: 'New Client Handover Assigned',
          message: `${lead.company_name} has been won and handed over for marketing kickoff.`,
          relatedEntity: 'clients',
          relatedEntityId: clientId
        });
      }
    }

    return { clientId, client_code };
  });

  try {
    const result = convertTx();

    logAudit({
      userId: req.user.id,
      action: 'DEAL_WON',
      entity: 'leads',
      entityId: lead.id,
      newValue: { status: 'WON', clientId: result.clientId, client_code: result.client_code },
      ip: req.ip
    });

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.clientId);
    res.status(201).json({
      message: 'Deal Won! Client successfully created and Handover submitted to Marketing team.',
      client,
      client_id: result.clientId,
      client_code: result.client_code
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete deal conversion: ' + err.message });
  }
});

export default router;
