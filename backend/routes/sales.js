import express from 'express';
import { Lead, Client, Employee, User, Proposal, Meeting, ClientHandover, SalesTask } from '../models/index.js';
import { logAudit, logLeadActivity, createNotification } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

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
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

// 1. Live Sales Dashboard Master API
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { date_range, start_date, end_date, employee_id } = req.query;
    const bounds = getDateRangeBounds(date_range, start_date, end_date);

    const baseFilter = {};
    if (req.user.role_name === 'sales' && req.employee) {
      baseFilter.$or = [
        { assigned_sales_employee_id: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    } else if (employee_id && (req.user.role_name === 'admin' || req.user.role_name === 'marketing_manager')) {
      baseFilter.assigned_sales_employee_id = employee_id;
    }

    const curStart = new Date(bounds.currentStart);
    const curEnd = new Date(bounds.currentEnd + 'T23:59:59.999Z');
    const pStart = new Date(bounds.prevStart);
    const pEnd = new Date(bounds.prevEnd + 'T23:59:59.999Z');

    // 1. NEW LEADS
    const newLeadsCurr = await Lead.countDocuments({
      ...baseFilter,
      createdAt: { $gte: curStart, $lte: curEnd }
    });

    const newLeadsPrev = await Lead.countDocuments({
      ...baseFilter,
      createdAt: { $gte: pStart, $lte: pEnd }
    });

    // 2. TODAY'S FOLLOW-UPS
    const todayStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().split('T')[0];

    const todayLeads = await Lead.find({
      ...baseFilter,
      'follow_ups.follow_up_date': todayStr,
      'follow_ups.status': 'PENDING'
    }).lean();

    let todayFollowUps = 0;
    for (const l of todayLeads) {
      for (const fu of (l.follow_ups || [])) {
        if (fu.follow_up_date === todayStr && fu.status === 'PENDING') {
          todayFollowUps++;
        }
      }
    }

    const yestLeads = await Lead.find({
      ...baseFilter,
      'follow_ups.follow_up_date': yestStr
    }).lean();

    let yesterdayFollowUps = 0;
    for (const l of yestLeads) {
      for (const fu of (l.follow_ups || [])) {
        if (fu.follow_up_date === yestStr) {
          yesterdayFollowUps++;
        }
      }
    }

    // 3. UPCOMING MEETINGS
    const meetingFilter = { status: 'SCHEDULED', meeting_date: { $gte: todayStr } };
    if (req.user.role_name === 'sales' && req.employee) {
      meetingFilter.$or = [
        { assigned_employee_id: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    } else if (employee_id) {
      meetingFilter.assigned_employee_id = employee_id;
    }
    const upcomingMeetings = await Meeting.countDocuments(meetingFilter);

    const pastMeetingsFilter = { meeting_date: { $gte: bounds.currentStart, $lte: bounds.currentEnd } };
    const prevMeetingsFilter = { meeting_date: { $gte: bounds.prevStart, $lte: bounds.prevEnd } };
    if (meetingFilter.$or) {
      pastMeetingsFilter.$or = meetingFilter.$or;
      prevMeetingsFilter.$or = meetingFilter.$or;
    } else if (meetingFilter.assigned_employee_id) {
      pastMeetingsFilter.assigned_employee_id = meetingFilter.assigned_employee_id;
      prevMeetingsFilter.assigned_employee_id = meetingFilter.assigned_employee_id;
    }
    const pastMeetingsPeriod = await Meeting.countDocuments(pastMeetingsFilter);
    const prevMeetingsPeriod = await Meeting.countDocuments(prevMeetingsFilter);

    // 4. OPEN PROPOSALS
    const proposalFilter = { status: { $in: ['DRAFT', 'SENT', 'VIEWED', 'NEGOTIATION'] } };
    if (req.user.role_name === 'sales' && req.employee) {
      proposalFilter.$or = [
        { prepared_by: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    } else if (employee_id) {
      proposalFilter.prepared_by = employee_id;
    }
    const openProposals = await Proposal.find(proposalFilter).lean();
    const openProposalsCount = openProposals.length;
    const openProposalsValue = openProposals.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    const prevOpenProposals = await Proposal.countDocuments({
      ...proposalFilter,
      createdAt: { $gte: pStart, $lte: pEnd }
    });

    // 5. WON DEALS IN PERIOD
    const wonLeadsCurr = await Lead.find({
      ...baseFilter,
      status: 'WON',
      $or: [
        { stage_updated_at: { $gte: curStart, $lte: curEnd } },
        { updatedAt: { $gte: curStart, $lte: curEnd } },
        { createdAt: { $gte: curStart, $lte: curEnd } }
      ]
    }).lean();

    const wonLeadsPrev = await Lead.find({
      ...baseFilter,
      status: 'WON',
      $or: [
        { stage_updated_at: { $gte: pStart, $lte: pEnd } },
        { updatedAt: { $gte: pStart, $lte: pEnd } },
        { createdAt: { $gte: pStart, $lte: pEnd } }
      ]
    }).lean();

    const wonDealsCurrCount = wonLeadsCurr.length;
    const wonDealsCurrValue = wonLeadsCurr.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
    const wonDealsPrevCount = wonLeadsPrev.length;
    const wonDealsPrevValue = wonLeadsPrev.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    // 6. LOST DEALS IN PERIOD
    const lostLeadsCurr = await Lead.find({
      ...baseFilter,
      status: 'LOST',
      $or: [
        { stage_updated_at: { $gte: curStart, $lte: curEnd } },
        { updatedAt: { $gte: curStart, $lte: curEnd } },
        { createdAt: { $gte: curStart, $lte: curEnd } }
      ]
    }).lean();

    const lostLeadsPrevCount = await Lead.countDocuments({
      ...baseFilter,
      status: 'LOST',
      $or: [
        { stage_updated_at: { $gte: pStart, $lte: pEnd } },
        { updatedAt: { $gte: pStart, $lte: pEnd } },
        { createdAt: { $gte: pStart, $lte: pEnd } }
      ]
    });

    const lostDealsCurrCount = lostLeadsCurr.length;
    const lostDealsCurrValue = lostLeadsCurr.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    // 7. ACTIVE PIPELINE VALUE
    const activePipelineLeads = await Lead.find({
      ...baseFilter,
      status: { $in: ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION'] }
    }).lean();

    const openPipelineValue = activePipelineLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
    const expectedWeightedRevenue = activePipelineLeads.reduce((sum, l) => {
      const prob = STAGE_PROBABILITIES[l.status] || 0.1;
      return sum + ((Number(l.deal_value) || 0) * prob);
    }, 0);

    // 8. CONVERSION RATE
    const totalDecidedCurr = wonDealsCurrCount + lostDealsCurrCount;
    const convRateCurr = totalDecidedCurr > 0
      ? Math.round((wonDealsCurrCount / totalDecidedCurr) * 100)
      : (newLeadsCurr > 0 ? Math.round((wonDealsCurrCount / newLeadsCurr) * 100) : 0);

    const totalDecidedPrev = wonDealsPrevCount + lostLeadsPrevCount;
    const convRatePrev = totalDecidedPrev > 0
      ? Math.round((wonDealsPrevCount / totalDecidedPrev) * 100)
      : (newLeadsPrev > 0 ? Math.round((wonDealsPrevCount / newLeadsPrev) * 100) : 0);

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
        value: openProposalsCount,
        total_amount: openProposalsValue,
        prev_value: prevOpenProposals,
        change_percent: calcChange(openProposalsCount, prevOpenProposals),
        period_label: "Active pipeline proposals"
      },
      won_deals: {
        value: wonDealsCurrCount,
        total_revenue: wonDealsCurrValue,
        prev_value: wonDealsPrevCount,
        prev_revenue: wonDealsPrevValue,
        change_percent: calcChange(wonDealsCurrCount, wonDealsPrevCount),
        period_label: "vs previous period"
      },
      lost_deals: {
        value: lostDealsCurrCount,
        total_loss: lostDealsCurrValue,
        prev_value: lostLeadsPrevCount,
        change_percent: calcChange(lostDealsCurrCount, lostLeadsPrevCount),
        period_label: "vs previous period"
      },
      pipeline_value: {
        value: openPipelineValue,
        deal_count: activePipelineLeads.length,
        weighted_revenue: Math.round(expectedWeightedRevenue),
        change_percent: calcChange(openPipelineValue, wonDealsPrevValue),
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

    // 9. SALES CONVERSION FUNNEL
    const funnelStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'];
    const stageCountsRaw = await Lead.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, total_value: { $sum: '$deal_value' } } }
    ]);

    const stageCountMap = {};
    stageCountsRaw.forEach(s => {
      stageCountMap[s._id] = { count: s.count, total_value: s.total_value };
    });

    const funnelData = [];
    let prevCount = null;
    const firstStageCount = funnelStages.reduce((sum, st) => sum + (stageCountMap[st]?.count || 0), 0);

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

    // 10. LEAD SOURCE ANALYTICS
    const sourceStatsRaw = await Lead.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$source',
          lead_count: { $sum: 1 },
          qualified_count: {
            $sum: { $cond: [{ $not: [{ $in: ['$status', ['NEW', 'CONTACTED']] }] }, 1, 0] }
          },
          won_count: {
            $sum: { $cond: [{ $eq: ['$status', 'WON'] }, 1, 0] }
          },
          won_revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'WON'] }, '$deal_value', 0] }
          },
          total_value: { $sum: '$deal_value' }
        }
      },
      { $sort: { lead_count: -1 } }
    ]);

    const sourceStats = sourceStatsRaw.map(s => ({
      source: s._id || 'Unknown',
      lead_count: s.lead_count,
      qualified_count: s.qualified_count,
      won_count: s.won_count,
      won_revenue: s.won_revenue,
      total_value: s.total_value,
      conversion_rate: s.lead_count > 0 ? Math.round((s.won_count / s.lead_count) * 100) : 0
    }));

    // 11. REVENUE / PIPELINE ANALYTICS
    const revenueAnalytics = {
      open_pipeline: openPipelineValue,
      won_revenue: wonDealsCurrValue,
      expected_weighted_revenue: Math.round(expectedWeightedRevenue),
      avg_deal_size: activePipelineLeads.length > 0 ? Math.round(openPipelineValue / activePipelineLeads.length) : 0,
      active_deal_count: activePipelineLeads.length,
      won_deal_count: wonDealsCurrCount
    };

    // 12. EMPLOYEE SALES PERFORMANCE SUMMARY
    const salesEmployees = await Employee.find({ employment_status: { $in: ['Active', 'Probation'] } })
      .populate({ path: 'user_id', populate: { path: 'role_id' } })
      .lean();

    const filteredEmployees = salesEmployees.filter(e => {
      const rName = e.user_id?.role_id?.name;
      const isSales = rName === 'sales' || /sales|growth/i.test(e.designation || '');
      if (req.user.role_name === 'sales' && req.employee) {
        return (e._id.toString() === (req.employee._id || req.employee.id).toString());
      }
      return isSales;
    });

    const empPerformance = [];
    for (const emp of filteredEmployees) {
      const empLeads = await Lead.find({ assigned_sales_employee_id: emp._id }).lean();
      const total_leads = empLeads.length;
      const contacted_leads = empLeads.filter(l => l.status !== 'NEW').length;
      const qualified_leads = empLeads.filter(l => ['QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.status)).length;
      const won_deals = empLeads.filter(l => l.status === 'WON').length;
      const lost_deals = empLeads.filter(l => l.status === 'LOST').length;
      const revenue_generated = empLeads.filter(l => l.status === 'WON').reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
      const total_val = empLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
      const avg_deal_value = total_leads > 0 ? Math.round(total_val / total_leads) : 0;
      const conversion_rate = (won_deals + lost_deals) > 0
        ? Math.round((won_deals / (won_deals + lost_deals)) * 100)
        : (total_leads > 0 ? Math.round((won_deals / total_leads) * 100) : 0);

      empPerformance.push({
        employee_id: emp._id.toString(),
        name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
        designation: emp.designation,
        total_leads,
        contacted_leads,
        qualified_leads,
        won_deals,
        lost_deals,
        revenue_generated,
        avg_deal_value,
        conversion_rate
      });
    }

    res.json({
      bounds,
      kpis,
      funnel: funnelData,
      sources: sourceStats,
      revenue: revenueAnalytics,
      performance: empPerformance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Kanban Sales Pipeline API
router.get('/pipeline', authenticate, async (req, res) => {
  try {
    const { search, priority, source, employee_id } = req.query;
    const filter = {};

    if (req.user.role_name === 'sales' && req.employee) {
      filter.$or = [
        { assigned_sales_employee_id: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    } else if (employee_id && req.user.role_name === 'admin') {
      filter.assigned_sales_employee_id = employee_id;
    }

    if (priority) filter.priority = priority;
    if (source) filter.source = source;

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      filter.$or = [
        { company_name: regex },
        { contact_person: regex },
        { phone: regex },
        { lead_code: regex }
      ];
    }

    const allLeadsRaw = await Lead.find(filter)
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .sort({ deal_value: -1, _id: -1 })
      .lean({ virtuals: true });

    const allLeads = allLeadsRaw.map(l => {
      const emp = l.assigned_sales_employee_id || {};
      const pendingFu = (l.follow_ups || [])
        .filter(fu => fu.status === 'PENDING')
        .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''))[0];
      const acts = l.activities || [];
      const lastAct = acts.length > 0 ? acts[acts.length - 1] : null;

      return {
        ...l,
        id: l._id.toString(),
        assigned_sales_employee_id: emp._id ? emp._id.toString() : (l.assigned_sales_employee_id || null),
        assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null,
        next_follow_up: pendingFu ? `${pendingFu.follow_up_date} ${pendingFu.follow_up_time || ''}`.trim() : null,
        last_activity: lastAct?.title || null,
        last_activity_time: lastAct?.createdAt || lastAct?.created_at || null
      };
    });

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

    const total_pipeline_value = Object.values(columns).reduce((acc, col) => {
      return col.stage !== 'WON' && col.stage !== 'LOST' ? acc + col.total_value : acc;
    }, 0);

    res.json({
      stages: STAGES,
      columns,
      total_pipeline_value,
      total_opportunities: allLeads.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Bulk Lead Import API
router.post('/import-leads', authenticate, requireRole(['admin', 'sales']), async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of leads to import.' });
    }

    const salesEmployeeId = req.employee ? (req.employee._id || req.employee.id) : null;
    const currentYear = new Date().getFullYear();
    let counter = await Lead.countDocuments();
    const importedIds = [];

    for (const l of leads) {
      if (!l.company_name || !l.contact_person || !l.phone) continue;
      counter += 1;
      const code = `LEAD-${currentYear}-${String(counter).padStart(4, '0')}`;

      const newLead = await Lead.create({
        lead_code: code,
        lead_date: new Date().toISOString().split('T')[0],
        company_name: l.company_name,
        contact_person: l.contact_person,
        designation: l.designation || 'Owner',
        phone: l.phone,
        whatsapp: l.whatsapp || l.phone,
        email: l.email || '',
        website: l.website || '',
        city: l.city || '',
        state: l.state || '',
        country: 'India',
        source: l.source || 'Website',
        industry: l.industry || 'General Business',
        deal_value: Number(l.deal_value || 50000),
        lead_score: Number(l.lead_score || 50),
        priority: l.priority || 'MEDIUM',
        status: 'NEW',
        urgency: l.urgency || 'Medium',
        requirement: l.requirement || 'Lead generated via bulk import',
        assigned_sales_employee_id: l.assigned_sales_employee_id || salesEmployeeId,
        created_by: req.user._id || req.user.id
      });

      importedIds.push(newLead._id);

      await logLeadActivity({
        leadId: newLead._id || newLead.id,
        activityType: 'LEAD_CREATED',
        title: 'Lead Imported',
        description: `Imported via bulk CSV/JSON upload by ${req.user.username}`,
        performedBy: salesEmployeeId
      });
    }

    await logAudit({
      userId: req.user._id || req.user.id,
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

// 4. Client Handovers API
router.get('/handovers', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (req.user.role_name === 'sales' && req.employee) {
      filter.sales_employee_id = req.employee._id || req.employee.id;
    }

    const handoversRaw = await ClientHandover.find(filter)
      .populate('lead_id', 'company_name contact_person phone email lead_code')
      .populate('client_id', 'client_code')
      .populate('sales_employee_id', 'first_name last_name')
      .populate('marketing_manager_id', 'first_name last_name')
      .populate('account_manager_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const handovers = handoversRaw.map(ch => {
      const l = ch.lead_id || {};
      const c = ch.client_id || {};
      const se = ch.sales_employee_id || {};
      const me = ch.marketing_manager_id || {};
      const ae = ch.account_manager_id || {};

      return {
        ...ch,
        id: ch._id.toString(),
        lead_id: l._id ? l._id.toString() : ch.lead_id,
        company_name: l.company_name || null,
        contact_person: l.contact_person || null,
        phone: l.phone || null,
        email: l.email || null,
        lead_code: l.lead_code || null,
        client_id: c._id ? c._id.toString() : ch.client_id,
        client_code: c.client_code || null,
        sales_rep_name: se.first_name ? `${se.first_name} ${se.last_name || ''}`.trim() : null,
        marketing_manager_name: me.first_name ? `${me.first_name} ${me.last_name || ''}`.trim() : null,
        account_manager_name: ae.first_name ? `${ae.first_name} ${ae.last_name || ''}`.trim() : null
      };
    });

    res.json({ handovers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/handovers/:id', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const { status, special_instructions } = req.body;
    const handover = await ClientHandover.findById(req.params.id);
    if (!handover) {
      return res.status(404).json({ error: 'Handover record not found' });
    }

    const oldStatus = handover.status;
    if (status) handover.status = status;
    if (special_instructions !== undefined) handover.special_instructions = special_instructions;
    await handover.save();

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'HANDOVER_STATUS_UPDATED',
      entity: 'client_handovers',
      entityId: handover._id || handover.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      ip: req.ip
    });

    res.json({
      message: 'Handover updated successfully',
      handover: {
        ...handover.toObject(),
        id: handover._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Sales Executive Daily Tasks Management
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const { status, filter, lead_id, search } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const queryFilter = {};

    if (req.user.role_name === 'sales' && req.employee) {
      queryFilter.assigned_employee_id = req.employee._id || req.employee.id;
    }

    if (status && status !== 'ALL') {
      queryFilter.status = status;
    }

    if (lead_id) {
      queryFilter.lead_id = lead_id;
    }

    if (filter === 'today') {
      queryFilter.due_date = today;
    } else if (filter === 'overdue') {
      queryFilter.due_date = { $lt: today };
      queryFilter.status = { $ne: 'COMPLETED' };
    } else if (filter === 'upcoming') {
      queryFilter.due_date = { $gt: today };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      queryFilter.$or = [
        { task_title: regex },
        { description: regex }
      ];
    }

    const tasksRaw = await SalesTask.find(queryFilter)
      .populate('lead_id', 'company_name contact_person lead_code')
      .populate('assigned_employee_id', 'first_name last_name')
      .sort({ due_date: 1, _id: -1 })
      .lean({ virtuals: true });

    const tasks = tasksRaw.map(st => {
      const l = st.lead_id || {};
      const emp = st.assigned_employee_id || {};
      return {
        ...st,
        id: st._id.toString(),
        lead_id: l._id ? l._id.toString() : st.lead_id,
        lead_company_name: l.company_name || null,
        lead_contact_person: l.contact_person || null,
        lead_code: l.lead_code || null,
        assigned_employee_id: emp._id ? emp._id.toString() : st.assigned_employee_id,
        assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null
      };
    });

    const countFilter = {};
    if (req.user.role_name === 'sales' && req.employee) {
      countFilter.assigned_employee_id = req.employee._id || req.employee.id;
    }

    const total = await SalesTask.countDocuments(countFilter);
    const pending = await SalesTask.countDocuments({ ...countFilter, status: { $ne: 'COMPLETED' } });
    const completed = await SalesTask.countDocuments({ ...countFilter, status: 'COMPLETED' });
    const todayDue = await SalesTask.countDocuments({ ...countFilter, due_date: today, status: { $ne: 'COMPLETED' } });
    const overdue = await SalesTask.countDocuments({ ...countFilter, due_date: { $lt: today }, status: { $ne: 'COMPLETED' } });

    res.json({
      tasks,
      counts: { total, pending, completed, todayDue, overdue }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Sales Task
router.post('/tasks', authenticate, async (req, res) => {
  try {
    const { task_title, description, due_date, priority, lead_id, assigned_employee_id } = req.body;

    if (!task_title || !due_date) {
      return res.status(400).json({ error: 'Task title and due date are required.' });
    }

    const assignedEmpId = assigned_employee_id || (req.employee ? (req.employee._id || req.employee.id) : null);

    const task = await SalesTask.create({
      task_title,
      description: description || '',
      due_date,
      priority: priority || 'MEDIUM',
      lead_id: lead_id || null,
      assigned_employee_id: assignedEmpId,
      status: 'TODO'
    });

    const populated = await SalesTask.findById(task._id)
      .populate('lead_id', 'company_name contact_person')
      .lean({ virtuals: true });

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...populated,
        id: populated._id.toString(),
        lead_company_name: populated.lead_id?.company_name || null,
        lead_contact_person: populated.lead_id?.contact_person || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Sales Task Status / Details
router.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await SalesTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Sales task not found.' });
    }

    const { task_title, description, due_date, priority, status, lead_id } = req.body;

    if (task_title !== undefined) task.task_title = task_title;
    if (description !== undefined) task.description = description;
    if (due_date !== undefined) task.due_date = due_date;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) {
      task.status = status;
      if (status === 'COMPLETED' && !task.completed_at) {
        task.completed_at = new Date();
      }
    }
    if (lead_id !== undefined) task.lead_id = lead_id || null;

    await task.save();

    const populated = await SalesTask.findById(task._id)
      .populate('lead_id', 'company_name contact_person')
      .lean({ virtuals: true });

    res.json({
      message: 'Task updated successfully',
      task: {
        ...populated,
        id: populated._id.toString(),
        lead_company_name: populated.lead_id?.company_name || null,
        lead_contact_person: populated.lead_id?.contact_person || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Sales Task
router.delete('/tasks/:id', authenticate, async (req, res) => {
  try {
    const task = await SalesTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await SalesTask.findByIdAndDelete(task._id);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Follow-ups (Alias for /sales/follow-ups)
router.get('/follow-ups', authenticate, async (req, res) => {
  try {
    const leads = await Lead.find({})
      .populate('follow_ups.assigned_employee_id', 'first_name last_name')
      .lean({ virtuals: true });

    const followUps = [];
    for (const l of leads) {
      for (const fu of (l.follow_ups || [])) {
        const emp = fu.assigned_employee_id || {};
        followUps.push({
          ...fu,
          id: fu._id.toString(),
          lead_id: l._id.toString(),
          company_name: l.company_name,
          contact_person: l.contact_person,
          phone: l.phone,
          deal_value: l.deal_value,
          assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null
        });
      }
    }

    followUps.sort((a, b) => {
      const dateCompare = (b.follow_up_date || '').localeCompare(a.follow_up_date || '');
      if (dateCompare !== 0) return dateCompare;
      return (b.follow_up_time || '').localeCompare(a.follow_up_time || '');
    });

    res.json({ followUps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch follow-ups: ' + err.message });
  }
});

export default router;
