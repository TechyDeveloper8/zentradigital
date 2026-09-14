import express from 'express';
import db, { logAudit, logLeadActivity, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Calculate date ranges for SQLite
function getDateRangeBounds(dateRange, customStart, customEnd) {
  const now = new Date();
  let currentStart = '';
  let currentEnd = '';
  let prevStart = '';
  let prevEnd = '';

  const format = (d) => d.toISOString().split('T')[0];

  switch ((dateRange || 'THIS_MONTH').toUpperCase()) {
    case 'TODAY': {
      currentStart = format(now);
      currentEnd = format(now);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      prevStart = format(yesterday);
      prevEnd = format(yesterday);
      break;
    }
    case 'YESTERDAY': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      currentStart = format(yesterday);
      currentEnd = format(yesterday);
      const dayBefore = new Date(now);
      dayBefore.setDate(now.getDate() - 2);
      prevStart = format(dayBefore);
      prevEnd = format(dayBefore);
      break;
    }
    case 'THIS_WEEK': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now);
      monday.setDate(diff);
      currentStart = format(monday);
      currentEnd = format(now);

      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      const prevSunday = new Date(monday);
      prevSunday.setDate(monday.getDate() - 1);
      prevStart = format(prevMonday);
      prevEnd = format(prevSunday);
      break;
    }
    case 'LAST_MONTH': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      currentStart = format(firstDayLastMonth);
      currentEnd = format(lastDayLastMonth);

      const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const lastDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      prevStart = format(firstDayTwoMonthsAgo);
      prevEnd = format(lastDayTwoMonthsAgo);
      break;
    }
    case 'CUSTOM': {
      currentStart = customStart || format(new Date(now.getFullYear(), now.getMonth(), 1));
      currentEnd = customEnd || format(now);
      const daysDiff = Math.max(1, Math.round((new Date(currentEnd) - new Date(currentStart)) / (1000 * 60 * 60 * 24)));
      const pEnd = new Date(currentStart);
      pEnd.setDate(pEnd.getDate() - 1);
      const pStart = new Date(pEnd);
      pStart.setDate(pStart.getDate() - daysDiff);
      prevStart = format(pStart);
      prevEnd = format(pEnd);
      break;
    }
    case 'THIS_MONTH':
    default: {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      currentStart = format(firstDay);
      currentEnd = format(now);

      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const equivalentDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate()));
      prevStart = format(firstDayLastMonth);
      prevEnd = format(equivalentDayLastMonth);
      break;
    }
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
}

// Stage Probability Mapping for Expected Weighted Revenue Calculation (Section 20)
const STAGE_PROBABILITIES = {
  NEW: 0.10,
  CONTACTED: 0.20,
  QUALIFIED: 0.40,
  MEETING: 0.50,
  PROPOSAL: 0.70,
  NEGOTIATION: 0.85,
  WON: 1.00,
  LOST: 0.00,
  'ON HOLD': 0.15
};

// =========================================================================
// 1. Live Sales Dashboard Master API (Section 6, 18, 19, 20, 25)
// =========================================================================
router.get('/dashboard', authenticate, (req, res) => {
  const { date_range, start_date, end_date, employee_id } = req.query;
  const bounds = getDateRangeBounds(date_range, start_date, end_date);

  // Role scoping: sales employee only sees their assigned leads if not admin
  let userFilterSql = '';
  const userParams = [];
  const prevUserParams = [];

  if (req.user.role_name === 'sales' && req.employee) {
    userFilterSql = ' AND (assigned_sales_employee_id = ? OR created_by = ?)';
    userParams.push(req.employee.id, req.user.id);
    prevUserParams.push(req.employee.id, req.user.id);
  } else if (employee_id && (req.user.role_name === 'admin' || req.user.role_name === 'marketing_manager')) {
    userFilterSql = ' AND assigned_sales_employee_id = ?';
    userParams.push(Number(employee_id));
    prevUserParams.push(Number(employee_id));
  }

  // --- 1. NEW LEADS ---
  const newLeadsCurr = db.prepare(`
    SELECT COUNT(*) as count FROM leads
    WHERE date(created_at) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.currentStart, bounds.currentEnd, ...userParams).count;

  const newLeadsPrev = db.prepare(`
    SELECT COUNT(*) as count FROM leads
    WHERE date(created_at) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.prevStart, bounds.prevEnd, ...prevUserParams).count;

  // --- 2. TODAY'S FOLLOW-UPS (Live count for today) ---
  const followUpUserFilter = (req.user.role_name === 'sales' && req.employee)
    ? ' AND (fu.assigned_employee_id = ? OR l.assigned_sales_employee_id = ?)'
    : (employee_id ? ' AND fu.assigned_employee_id = ?' : '');
  const fuParams = (req.user.role_name === 'sales' && req.employee)
    ? [req.employee.id, req.employee.id]
    : (employee_id ? [Number(employee_id)] : []);

  const todayFollowUps = db.prepare(`
    SELECT COUNT(*) as count FROM lead_follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    WHERE fu.follow_up_date = DATE('now') AND fu.status = 'PENDING' ${followUpUserFilter}
  `).get(...fuParams).count;

  const yesterdayFollowUps = db.prepare(`
    SELECT COUNT(*) as count FROM lead_follow_ups fu
    JOIN leads l ON fu.lead_id = l.id
    WHERE fu.follow_up_date = DATE('now', '-1 day') ${followUpUserFilter}
  `).get(...fuParams).count;

  // --- 3. UPCOMING MEETINGS ---
  const meetingUserFilter = (req.user.role_name === 'sales' && req.employee)
    ? ' AND (m.assigned_employee_id = ? OR m.created_by = ?)'
    : (employee_id ? ' AND m.assigned_employee_id = ?' : '');
  const meetingParams = (req.user.role_name === 'sales' && req.employee)
    ? [req.employee.id, req.user.id]
    : (employee_id ? [Number(employee_id)] : []);

  const upcomingMeetings = db.prepare(`
    SELECT COUNT(*) as count FROM meetings m
    WHERE (m.meeting_date >= DATE('now') OR (m.meeting_date = DATE('now') AND m.meeting_time >= time('now', 'localtime')))
      AND m.status = 'SCHEDULED' ${meetingUserFilter}
  `).get(...meetingParams).count;

  const pastMeetingsPeriod = db.prepare(`
    SELECT COUNT(*) as count FROM meetings m
    WHERE m.meeting_date BETWEEN ? AND ? ${meetingUserFilter}
  `).get(bounds.currentStart, bounds.currentEnd, ...meetingParams).count;

  const prevMeetingsPeriod = db.prepare(`
    SELECT COUNT(*) as count FROM meetings m
    WHERE m.meeting_date BETWEEN ? AND ? ${meetingUserFilter}
  `).get(bounds.prevStart, bounds.prevEnd, ...meetingParams).count;

  // --- 4. OPEN PROPOSALS ---
  const proposalUserFilter = (req.user.role_name === 'sales' && req.employee)
    ? ' AND (p.prepared_by = ? OR l.assigned_sales_employee_id = ?)'
    : (employee_id ? ' AND p.prepared_by = ?' : '');
  const propParams = (req.user.role_name === 'sales' && req.employee)
    ? [req.employee.id, req.employee.id]
    : (employee_id ? [Number(employee_id)] : []);

  const openProposalsData = db.prepare(`
    SELECT COUNT(*) as count, coalesce(SUM(p.total), 0) as total_value
    FROM proposals p
    LEFT JOIN leads l ON p.lead_id = l.id
    WHERE p.status IN ('DRAFT', 'SENT', 'VIEWED', 'NEGOTIATION') ${proposalUserFilter}
  `).get(...propParams);

  const prevOpenProposals = db.prepare(`
    SELECT COUNT(*) as count
    FROM proposals p
    LEFT JOIN leads l ON p.lead_id = l.id
    WHERE date(p.created_at) BETWEEN ? AND ? ${proposalUserFilter}
  `).get(bounds.prevStart, bounds.prevEnd, ...propParams).count;

  // --- 5. WON DEALS IN PERIOD ---
  const wonDealsCurr = db.prepare(`
    SELECT COUNT(*) as count, coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE status = 'WON' AND date(coalesce(stage_updated_at, updated_at, created_at)) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.currentStart, bounds.currentEnd, ...userParams);

  const wonDealsPrev = db.prepare(`
    SELECT COUNT(*) as count, coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE status = 'WON' AND date(coalesce(stage_updated_at, updated_at, created_at)) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.prevStart, bounds.prevEnd, ...prevUserParams);

  // --- 6. LOST DEALS IN PERIOD ---
  const lostDealsCurr = db.prepare(`
    SELECT COUNT(*) as count, coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE status = 'LOST' AND date(coalesce(stage_updated_at, updated_at, created_at)) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.currentStart, bounds.currentEnd, ...userParams);

  const lostDealsPrev = db.prepare(`
    SELECT COUNT(*) as count
    FROM leads
    WHERE status = 'LOST' AND date(coalesce(stage_updated_at, updated_at, created_at)) BETWEEN ? AND ? ${userFilterSql}
  `).get(bounds.prevStart, bounds.prevEnd, ...prevUserParams).count;

  // --- 7. ACTIVE PIPELINE VALUE (Open active opportunities) ---
  const openPipelineData = db.prepare(`
    SELECT COUNT(*) as count, coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION') ${userFilterSql}
  `).get(...userParams);

  // Expected Weighted Revenue: sum of (deal_value * stage_probability)
  const openLeadsForWeight = db.prepare(`
    SELECT status, deal_value FROM leads
    WHERE status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION') ${userFilterSql}
  `).all(...userParams);

  const expectedWeightedRevenue = openLeadsForWeight.reduce((acc, lead) => {
    const prob = STAGE_PROBABILITIES[lead.status] || 0.1;
    return acc + (Number(lead.deal_value || 0) * prob);
  }, 0);

  // --- 8. CONVERSION RATE ---
  const totalDecidedCurr = wonDealsCurr.count + lostDealsCurr.count;
  const convRateCurr = totalDecidedCurr > 0
    ? Math.round((wonDealsCurr.count / totalDecidedCurr) * 100)
    : (newLeadsCurr > 0 ? Math.round((wonDealsCurr.count / newLeadsCurr) * 100) : 0);

  const totalDecidedPrev = wonDealsPrev.count + lostDealsPrev;
  const convRatePrev = totalDecidedPrev > 0
    ? Math.round((wonDealsPrev.count / totalDecidedPrev) * 100)
    : (newLeadsPrev > 0 ? Math.round((wonDealsPrev.count / newLeadsPrev) * 100) : 0);

  const calcChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const kpis = {
    new_leads: {
      value: newLeadsCurr,
      prev_value: newLeadsPrev,
      change_percent: calcChange(newLeadsCurr, newLeadsPrev),
      period_label: date_range || 'This Month'
    },
    today_followups: {
      value: todayFollowUps,
      prev_value: yesterdayFollowUps,
      change_percent: calcChange(todayFollowUps, yesterdayFollowUps),
      period_label: "vs Yesterday"
    },
    upcoming_meetings: {
      value: upcomingMeetings,
      prev_value: prevMeetingsPeriod,
      change_percent: calcChange(pastMeetingsPeriod, prevMeetingsPeriod),
      period_label: "vs previous period"
    },
    open_proposals: {
      value: openProposalsData.count,
      total_amount: openProposalsData.total_value,
      prev_value: prevOpenProposals,
      change_percent: calcChange(openProposalsData.count, prevOpenProposals),
      period_label: "Active pipeline proposals"
    },
    won_deals: {
      value: wonDealsCurr.count,
      total_revenue: wonDealsCurr.total_value,
      prev_value: wonDealsPrev.count,
      prev_revenue: wonDealsPrev.total_value,
      change_percent: calcChange(wonDealsCurr.count, wonDealsPrev.count),
      period_label: "vs previous period"
    },
    lost_deals: {
      value: lostDealsCurr.count,
      total_loss: lostDealsCurr.total_value,
      prev_value: lostDealsPrev,
      change_percent: calcChange(lostDealsCurr.count, lostDealsPrev),
      period_label: "vs previous period"
    },
    pipeline_value: {
      value: openPipelineData.total_value,
      deal_count: openPipelineData.count,
      weighted_revenue: Math.round(expectedWeightedRevenue),
      change_percent: calcChange(openPipelineData.total_value, wonDealsPrev.total_value),
      period_label: "Active open pipeline"
    },
    conversion_rate: {
      value: `${convRateCurr}%`,
      raw_value: convRateCurr,
      prev_value: `${convRatePrev}%`,
      change_percent: convRateCurr - convRatePrev,
      period_label: "Closed deals conversion"
    }
  };

  // --- 9. SALES CONVERSION FUNNEL ---
  const funnelStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'];
  const allStageCounts = db.prepare(`
    SELECT status, COUNT(*) as count, coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE 1=1 ${userFilterSql}
    GROUP BY status
  `).all(...userParams);

  const stageCountMap = {};
  allStageCounts.forEach(s => { stageCountMap[s.status] = s; });

  const funnelData = [];
  let prevCount = null;
  const firstStageCount = (stageCountMap['NEW']?.count || 0) + (stageCountMap['CONTACTED']?.count || 0) + (stageCountMap['QUALIFIED']?.count || 0) + (stageCountMap['MEETING']?.count || 0) + (stageCountMap['PROPOSAL']?.count || 0) + (stageCountMap['NEGOTIATION']?.count || 0) + (stageCountMap['WON']?.count || 0);

  for (const stage of funnelStages) {
    const currStageCount = stageCountMap[stage]?.count || 0;
    const stageVal = stageCountMap[stage]?.total_value || 0;
    const stepConv = prevCount !== null && prevCount > 0
      ? Math.round((currStageCount / prevCount) * 100)
      : 100;
    const overallConv = firstStageCount > 0 ? Math.round((currStageCount / firstStageCount) * 100) : 0;
    const dropOff = prevCount !== null ? Math.max(0, prevCount - currStageCount) : 0;

    funnelData.push({
      stage,
      count: currStageCount,
      total_value: stageVal,
      conversion_rate: stepConv,
      overall_conversion: overallConv,
      drop_off: dropOff
    });
    prevCount = currStageCount;
  }

  // --- 10. LEAD SOURCE ANALYTICS ---
  const sourceStats = db.prepare(`
    SELECT
      source,
      COUNT(*) as lead_count,
      SUM(CASE WHEN status NOT IN ('NEW', 'CONTACTED') THEN 1 ELSE 0 END) as qualified_count,
      SUM(CASE WHEN status = 'WON' THEN 1 ELSE 0 END) as won_count,
      coalesce(SUM(CASE WHEN status = 'WON' THEN deal_value ELSE 0 END), 0) as won_revenue,
      coalesce(SUM(deal_value), 0) as total_value
    FROM leads
    WHERE 1=1 ${userFilterSql}
    GROUP BY source
    ORDER BY lead_count DESC
  `).all(...userParams).map(s => ({
    ...s,
    conversion_rate: s.lead_count > 0 ? Math.round((s.won_count / s.lead_count) * 100) : 0
  }));

  // --- 11. REVENUE / PIPELINE ANALYTICS ---
  const revenueAnalytics = {
    open_pipeline: openPipelineData.total_value,
    won_revenue: wonDealsCurr.total_value,
    expected_weighted_revenue: Math.round(expectedWeightedRevenue),
    avg_deal_size: openPipelineData.count > 0 ? Math.round(openPipelineData.total_value / openPipelineData.count) : 0,
    active_deal_count: openPipelineData.count,
    won_deal_count: wonDealsCurr.count
  };

  // --- 12. EMPLOYEE SALES PERFORMANCE SUMMARY ---
  const empPerformance = db.prepare(`
    SELECT
      e.id as employee_id,
      e.first_name || ' ' || e.last_name as name,
      e.designation,
      COUNT(l.id) as total_leads,
      SUM(CASE WHEN l.status != 'NEW' THEN 1 ELSE 0 END) as contacted_leads,
      SUM(CASE WHEN l.status IN ('QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON') THEN 1 ELSE 0 END) as qualified_leads,
      SUM(CASE WHEN l.status = 'WON' THEN 1 ELSE 0 END) as won_deals,
      SUM(CASE WHEN l.status = 'LOST' THEN 1 ELSE 0 END) as lost_deals,
      coalesce(SUM(CASE WHEN l.status = 'WON' THEN l.deal_value ELSE 0 END), 0) as revenue_generated,
      coalesce(AVG(l.deal_value), 0) as avg_deal_value
    FROM employees e
    JOIN users u ON e.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN leads l ON l.assigned_sales_employee_id = e.id
    WHERE r.name = 'sales' OR e.id = ?
    GROUP BY e.id
  `).all(req.employee ? req.employee.id : 201).map(p => ({
    ...p,
    conversion_rate: (p.won_deals + p.lost_deals) > 0
      ? Math.round((p.won_deals / (p.won_deals + p.lost_deals)) * 100)
      : (p.total_leads > 0 ? Math.round((p.won_deals / p.total_leads) * 100) : 0)
  }));

  res.json({
    bounds,
    kpis,
    funnel: funnelData,
    sources: sourceStats,
    revenue: revenueAnalytics,
    performance: empPerformance
  });
});

// =========================================================================
// 2. Kanban Sales Pipeline API (Section 7)
// =========================================================================
router.get('/pipeline', authenticate, (req, res) => {
  const { search, priority, source, employee_id } = req.query;

  let filterSql = '';
  const params = [];

  if (req.user.role_name === 'sales' && req.employee) {
    filterSql += ' AND (l.assigned_sales_employee_id = ? OR l.created_by = ?)';
    params.push(req.employee.id, req.user.id);
  } else if (employee_id && req.user.role_name === 'admin') {
    filterSql += ' AND l.assigned_sales_employee_id = ?';
    params.push(Number(employee_id));
  }

  if (priority) {
    filterSql += ' AND l.priority = ?';
    params.push(priority);
  }

  if (source) {
    filterSql += ' AND l.source = ?';
    params.push(source);
  }

  if (search) {
    filterSql += ' AND (l.company_name LIKE ? OR l.contact_person LIKE ? OR l.phone LIKE ? OR l.lead_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const query = `
    SELECT
      l.*,
      e.first_name || ' ' || e.last_name as assigned_employee_name,
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
    FROM leads l
    LEFT JOIN employees e ON l.assigned_sales_employee_id = e.id
    WHERE 1=1 ${filterSql}
    ORDER BY l.priority = 'URGENT' DESC, l.priority = 'HIGH' DESC, l.deal_value DESC, l.id DESC
  `;

  const allLeads = db.prepare(query).all(...params);

  // Group by the 8 required stages
  const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  const columns = {};

  STAGES.forEach(stage => {
    columns[stage] = {
      stage,
      count: 0,
      total_value: 0,
      leads: []
    };
  });

  allLeads.forEach(lead => {
    const st = columns[lead.status] ? lead.status : 'NEW';
    columns[st].leads.push(lead);
    columns[st].count += 1;
    columns[st].total_value += Number(lead.deal_value || 0);
  });

  res.json({
    stages: STAGES,
    columns,
    total_pipeline_value: Object.values(columns).reduce((acc, col) => col.stage !== 'WON' && col.stage !== 'LOST' ? acc + col.total_value : acc, 0),
    total_opportunities: allLeads.length
  });
});

// =========================================================================
// 3. Bulk Lead Import API (Section 5, 8)
// =========================================================================
router.post('/import-leads', authenticate, requireRole(['admin', 'sales']), (req, res) => {
  const { leads } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of leads to import.' });
  }

  const salesEmployeeId = req.employee ? req.employee.id : null;
  const importedIds = [];

  const importTx = db.transaction(() => {
    const currentYear = new Date().getFullYear();
    let counter = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;

    const stmt = db.prepare(`
      INSERT INTO leads (
        lead_code, lead_date, company_name, contact_person, designation, phone, whatsapp,
        email, website, city, state, country, source, industry, deal_value, lead_score,
        priority, status, urgency, requirement, assigned_sales_employee_id, created_by,
        created_at, updated_at
      ) VALUES (
        ?, DATE('now'), ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'India', ?, ?, ?, ?,
        ?, 'NEW', ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    for (const l of leads) {
      if (!l.company_name || !l.contact_person || !l.phone) continue;
      counter += 1;
      const code = `LEAD-${currentYear}-${String(counter).padStart(4, '0')}`;

      const result = stmt.run(
        code,
        l.company_name,
        l.contact_person,
        l.designation || 'Owner',
        l.phone,
        l.whatsapp || l.phone,
        l.email || '',
        l.website || '',
        l.city || '',
        l.state || '',
        l.source || 'Website',
        l.industry || 'General Business',
        Number(l.deal_value || 50000),
        Number(l.lead_score || 50),
        l.priority || 'MEDIUM',
        l.urgency || 'Medium',
        l.requirement || 'Lead generated via bulk import',
        l.assigned_sales_employee_id || salesEmployeeId,
        req.user.id
      );

      const leadId = result.lastInsertRowid;
      importedIds.push(leadId);

      logLeadActivity({
        leadId,
        activityType: 'LEAD_CREATED',
        title: 'Lead Imported',
        description: `Imported via bulk CSV/JSON upload by ${req.user.username}`,
        performedBy: salesEmployeeId
      });
    }
  });

  try {
    importTx();
    logAudit({
      userId: req.user.id,
      action: 'BULK_IMPORT',
      entity: 'leads',
      entityId: null,
      newValue: { count: importedIds.length },
      ip: req.ip
    });

    res.status(201).json({
      message: `Successfully imported ${importedIds.length} leads.`,
      imported_count: importedIds.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete bulk import: ' + err.message });
  }
});

// =========================================================================
// 4. Client Handovers API (Section 16, 17)
// =========================================================================
router.get('/handovers', authenticate, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT ch.*,
           l.company_name, l.contact_person, l.phone, l.email, l.lead_code,
           c.client_code,
           se.first_name || ' ' || se.last_name as sales_rep_name,
           me.first_name || ' ' || me.last_name as marketing_manager_name,
           ae.first_name || ' ' || ae.last_name as account_manager_name
    FROM client_handovers ch
    JOIN leads l ON ch.lead_id = l.id
    JOIN clients c ON ch.client_id = c.id
    LEFT JOIN employees se ON ch.sales_employee_id = se.id
    LEFT JOIN employees me ON ch.marketing_manager_id = me.id
    LEFT JOIN employees ae ON ch.account_manager_id = ae.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND ch.status = ?';
    params.push(status);
  }

  if (req.user.role_name === 'sales' && req.employee) {
    sql += ' AND ch.sales_employee_id = ?';
    params.push(req.employee.id);
  }

  sql += ' ORDER BY ch.id DESC';
  const handovers = db.prepare(sql).all(...params);
  res.json({ handovers });
});

router.put('/handovers/:id', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const { status, special_instructions } = req.body;
  const handover = db.prepare('SELECT * FROM client_handovers WHERE id = ?').get(req.params.id);
  if (!handover) {
    return res.status(404).json({ error: 'Handover record not found' });
  }

  db.prepare(`
    UPDATE client_handovers
    SET status = coalesce(?, status),
        special_instructions = coalesce(?, special_instructions),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, special_instructions, handover.id);

  logAudit({
    userId: req.user.id,
    action: 'HANDOVER_STATUS_UPDATED',
    entity: 'client_handovers',
    entityId: handover.id,
    oldValue: { status: handover.status },
    newValue: { status },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM client_handovers WHERE id = ?').get(handover.id);
  res.json({ message: 'Handover updated successfully', handover: updated });
});

export default router;
