import express from 'express';
import { Lead, Client, Employee, User, Proposal, Meeting, ClientService, ClientHandover } from '../models/index.js';
import { logAudit, logLeadActivity, createNotification } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 1. List Leads with Advanced Filters & Server-Side Pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      status, stage, assigned_to, source, priority, industry,
      search, page = 1, limit = 50, quick_filter
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Scoping for Sales Executive
    if (req.user.role_name === 'sales' && req.employee) {
      filter.$or = [
        { assigned_sales_employee_id: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    }

    const effectiveStatus = status || stage;
    if (effectiveStatus && effectiveStatus !== 'ALL') {
      filter.status = effectiveStatus;
    }

    if (assigned_to) {
      filter.assigned_sales_employee_id = assigned_to;
    }

    if (source && source !== 'ALL') {
      filter.source = source;
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    if (industry && industry !== 'ALL') {
      filter.industry = industry;
    }

    // Quick Filter Chips
    if (quick_filter) {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      switch (quick_filter.toUpperCase()) {
        case 'HOT_LEADS':
          filter.$or = [
            { priority: { $in: ['HIGH', 'URGENT'] } },
            { lead_score: { $gte: 80 } }
          ];
          break;
        case 'HIGH_VALUE':
          filter.deal_value = { $gte: 150000 };
          break;
        case 'RECENTLY_ADDED':
          filter.createdAt = { $gte: sevenDaysAgo };
          break;
        case 'PROPOSAL_PENDING':
          filter.status = 'PROPOSAL';
          break;
        case 'NO_FOLLOW_UP':
          filter['follow_ups.status'] = { $ne: 'PENDING' };
          break;
        default:
          break;
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      filter.$or = [
        { company_name: regex },
        { contact_person: regex },
        { phone: regex },
        { email: regex },
        { lead_code: regex }
      ];
    }

    const total = await Lead.countDocuments(filter);

    const rawLeads = await Lead.find(filter)
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('created_by', 'username')
      .populate('converted_client_id', 'client_code')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean({ virtuals: true });

    const leads = rawLeads.map(l => {
      const emp = l.assigned_sales_employee_id || {};
      const u = l.created_by || {};
      const c = l.converted_client_id || {};

      // Determine next follow-up and last activity
      const pendingFollowUps = (l.follow_ups || [])
        .filter(fu => fu.status === 'PENDING')
        .sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''));

      const nextFu = pendingFollowUps[0];
      const next_follow_up = nextFu ? `${nextFu.follow_up_date} ${nextFu.follow_up_time || ''}`.trim() : null;

      const activities = l.activities || [];
      const lastAct = activities.length > 0 ? activities[activities.length - 1] : null;

      return {
        ...l,
        id: l._id.toString(),
        assigned_sales_employee_id: emp._id ? emp._id.toString() : (l.assigned_sales_employee_id || null),
        assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null,
        created_by_name: u.username || null,
        converted_client_id: c._id ? c._id.toString() : (l.converted_client_id || null),
        converted_client_code: c.client_code || null,
        next_follow_up,
        last_activity: lastAct?.title || null,
        last_activity_time: lastAct?.createdAt || lastAct?.created_at || null
      };
    });

    // Pipeline counts group by status
    const countMatch = {};
    if (req.user.role_name === 'sales' && req.employee) {
      countMatch.$or = [
        { assigned_sales_employee_id: req.employee._id || req.employee.id },
        { created_by: req.user._id || req.user.id }
      ];
    }

    const pipelineCountsRaw = await Lead.aggregate([
      { $match: countMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const pipelineCounts = pipelineCountsRaw.map(p => ({
      status: p._id,
      count: p.count
    }));

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Today's Follow-ups
router.get('/follow-ups/today', authenticate, async (req, res) => {
  try {
    const today = getTodayDate();
    const leads = await Lead.find({ 'follow_ups.follow_up_date': today })
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('follow_ups.assigned_employee_id', 'first_name last_name')
      .lean({ virtuals: true });

    let followUps = [];
    for (const l of leads) {
      const isSalesScoped = req.user.role_name === 'sales' && req.employee;
      const empIdStr = (req.employee?._id || req.employee?.id)?.toString();

      for (const fu of (l.follow_ups || [])) {
        if (fu.follow_up_date === today) {
          const fuAssigned = fu.assigned_employee_id?._id?.toString() || fu.assigned_employee_id?.toString();
          const leadAssigned = l.assigned_sales_employee_id?._id?.toString() || l.assigned_sales_employee_id?.toString();

          if (isSalesScoped && fuAssigned !== empIdStr && leadAssigned !== empIdStr) {
            continue;
          }

          const fuEmp = fu.assigned_employee_id || l.assigned_sales_employee_id || {};
          followUps.push({
            ...fu,
            id: fu._id.toString(),
            lead_id: l._id.toString(),
            company_name: l.company_name,
            contact_person: l.contact_person,
            phone: l.phone,
            lead_code: l.lead_code,
            deal_value: l.deal_value,
            assigned_employee_name: fuEmp.first_name ? `${fuEmp.first_name} ${fuEmp.last_name || ''}`.trim() : null
          });
        }
      }
    }

    followUps.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return (a.follow_up_time || '').localeCompare(b.follow_up_time || '');
    });

    res.json({ followUps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overdue Follow-ups
router.get('/follow-ups/overdue', authenticate, async (req, res) => {
  try {
    const today = getTodayDate();
    const leads = await Lead.find({
      'follow_ups.follow_up_date': { $lt: today },
      'follow_ups.status': 'PENDING'
    })
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('follow_ups.assigned_employee_id', 'first_name last_name')
      .lean({ virtuals: true });

    let overdueFollowUps = [];
    const todayTime = new Date(today).getTime();

    for (const l of leads) {
      const isSalesScoped = req.user.role_name === 'sales' && req.employee;
      const empIdStr = (req.employee?._id || req.employee?.id)?.toString();

      for (const fu of (l.follow_ups || [])) {
        if (fu.follow_up_date < today && fu.status === 'PENDING') {
          const fuAssigned = fu.assigned_employee_id?._id?.toString() || fu.assigned_employee_id?.toString();
          const leadAssigned = l.assigned_sales_employee_id?._id?.toString() || l.assigned_sales_employee_id?.toString();

          if (isSalesScoped && fuAssigned !== empIdStr && leadAssigned !== empIdStr) {
            continue;
          }

          const fuTime = new Date(fu.follow_up_date).getTime();
          const days_overdue = Math.max(1, Math.round((todayTime - fuTime) / (1000 * 60 * 60 * 24)));
          const fuEmp = fu.assigned_employee_id || l.assigned_sales_employee_id || {};

          overdueFollowUps.push({
            ...fu,
            id: fu._id.toString(),
            lead_id: l._id.toString(),
            days_overdue,
            company_name: l.company_name,
            contact_person: l.contact_person,
            phone: l.phone,
            lead_code: l.lead_code,
            deal_value: l.deal_value,
            assigned_employee_name: fuEmp.first_name ? `${fuEmp.first_name} ${fuEmp.last_name || ''}`.trim() : null
          });
        }
      }
    }

    overdueFollowUps.sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''));

    res.json({ overdueFollowUps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dedicated List all Follow-ups with advanced filtering
router.get('/follow-ups', authenticate, async (req, res) => {
  try {
    const { status, lead_id, date, search, filter } = req.query;
    const today = getTodayDate();

    const leadQuery = {};
    if (lead_id) {
      leadQuery._id = lead_id;
    }

    const leads = await Lead.find(leadQuery)
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('follow_ups.assigned_employee_id', 'first_name last_name')
      .lean({ virtuals: true });

    let followUps = [];
    for (const l of leads) {
      const isSalesScoped = req.user.role_name === 'sales' && req.employee;
      const empIdStr = (req.employee?._id || req.employee?.id)?.toString();

      for (const fu of (l.follow_ups || [])) {
        const fuAssigned = fu.assigned_employee_id?._id?.toString() || fu.assigned_employee_id?.toString();
        const leadAssigned = l.assigned_sales_employee_id?._id?.toString() || l.assigned_sales_employee_id?.toString();

        if (isSalesScoped && fuAssigned !== empIdStr && leadAssigned !== empIdStr) {
          continue;
        }

        if (status && status !== 'ALL' && fu.status !== status) {
          continue;
        }

        if (date && fu.follow_up_date !== date) {
          continue;
        }

        if (filter === 'today' && fu.follow_up_date !== today) {
          continue;
        } else if (filter === 'overdue' && !(fu.follow_up_date < today && fu.status === 'PENDING')) {
          continue;
        } else if (filter === 'upcoming' && !(fu.follow_up_date > today && fu.status === 'PENDING')) {
          continue;
        }

        if (search) {
          const s = search.toLowerCase();
          const matchCompany = l.company_name?.toLowerCase().includes(s);
          const matchPerson = l.contact_person?.toLowerCase().includes(s);
          const matchSummary = fu.discussion_summary?.toLowerCase().includes(s);
          if (!matchCompany && !matchPerson && !matchSummary) {
            continue;
          }
        }

        const fuEmp = fu.assigned_employee_id || l.assigned_sales_employee_id || {};
        followUps.push({
          ...fu,
          id: fu._id.toString(),
          lead_id: l._id.toString(),
          company_name: l.company_name,
          contact_person: l.contact_person,
          phone: l.phone,
          lead_code: l.lead_code,
          deal_value: l.deal_value,
          lead_status: l.status,
          assigned_employee_name: fuEmp.first_name ? `${fuEmp.first_name} ${fuEmp.last_name || ''}`.trim() : null
        });
      }
    }

    followUps.sort((a, b) => (a.follow_up_date || '').localeCompare(b.follow_up_date || ''));

    res.json({ followUps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create follow-up with body lead_id
router.post('/follow-ups', authenticate, async (req, res) => {
  try {
    const {
      lead_id, follow_up_date, follow_up_time, contact_method, discussion_summary,
      client_requirement, next_action, next_follow_up_date, priority, reminder, status
    } = req.body;

    if (!lead_id || !follow_up_date || !contact_method || !discussion_summary) {
      return res.status(400).json({ error: 'Lead, date, contact method, and discussion summary / notes are required.' });
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const assignedEmp = req.employee ? (req.employee._id || req.employee.id) : lead.assigned_sales_employee_id;

    const followUpDoc = {
      follow_up_date,
      follow_up_time: follow_up_time || '14:00',
      contact_method,
      follow_up_type: contact_method || 'Call',
      discussion_summary,
      notes: discussion_summary,
      client_requirement: client_requirement || '',
      next_action: next_action || '',
      next_follow_up_date: next_follow_up_date || null,
      assigned_employee_id: assignedEmp,
      performed_by: req.employee ? (req.employee._id || req.employee.id) : null,
      priority: priority || 'MEDIUM',
      reminder: reminder !== undefined ? !!reminder : true,
      status: status || 'PENDING'
    };

    lead.follow_ups.push(followUpDoc);

    if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
      lead.stage_updated_at = new Date();
    }

    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'FOLLOW_UP_SCHEDULED',
      title: `${contact_method} Follow-up Scheduled`,
      description: `Scheduled for ${follow_up_date} at ${follow_up_time || '14:00'}. Notes: ${discussion_summary}`,
      performedBy: assignedEmp
    });

    const newFollowUp = lead.follow_ups[lead.follow_ups.length - 1];

    res.status(201).json({
      message: 'Follow-up created successfully',
      follow_up: {
        ...newFollowUp.toObject(),
        id: newFollowUp._id.toString(),
        company_name: lead.company_name,
        contact_person: lead.contact_person
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Follow-Up (Complete, Reschedule, Add Note)
router.put('/follow-ups/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findOne({ 'follow_ups._id': req.params.id });
    if (!lead) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    const followUp = lead.follow_ups.id(req.params.id);
    const {
      status, follow_up_date, follow_up_time, discussion_summary,
      next_action, next_follow_up_date, contact_method
    } = req.body;

    const oldStatus = followUp.status;
    const oldDate = followUp.follow_up_date;

    if (status) followUp.status = status;
    if (follow_up_date) followUp.follow_up_date = follow_up_date;
    if (follow_up_time) followUp.follow_up_time = follow_up_time;
    if (discussion_summary) {
      followUp.discussion_summary = discussion_summary;
      followUp.notes = discussion_summary;
    }
    if (next_action) followUp.next_action = next_action;
    if (next_follow_up_date) followUp.next_follow_up_date = next_follow_up_date;
    if (contact_method) {
      followUp.contact_method = contact_method;
      followUp.follow_up_type = contact_method;
    }

    if (status === 'COMPLETED') {
      followUp.completed_at = new Date();
    }

    await lead.save();

    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await logLeadActivity({
        leadId: lead._id || lead.id,
        activityType: 'FOLLOW_UP_COMPLETED',
        title: `${followUp.contact_method} Follow-up Completed`,
        description: discussion_summary || followUp.discussion_summary,
        performedBy: req.employee ? (req.employee._id || req.employee.id) : null
      });
    } else if (follow_up_date && follow_up_date !== oldDate) {
      await logLeadActivity({
        leadId: lead._id || lead.id,
        activityType: 'FOLLOW_UP_SCHEDULED',
        title: 'Follow-up Rescheduled',
        description: `Rescheduled to ${follow_up_date} at ${follow_up_time || followUp.follow_up_time}. Action: ${next_action || followUp.next_action || 'Discussion'}`,
        performedBy: req.employee ? (req.employee._id || req.employee.id) : null
      });
    }

    res.json({
      message: 'Follow-up updated successfully',
      follow_up: {
        ...followUp.toObject(),
        id: followUp._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Single Lead Detail with Full 360 Records
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('created_by', 'username')
      .populate('converted_client_id', 'client_code')
      .populate('follow_ups.assigned_employee_id', 'first_name last_name')
      .populate('activities.performed_by', 'first_name last_name')
      .lean({ virtuals: true });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.id = lead._id.toString();
    const emp = lead.assigned_sales_employee_id || {};
    lead.assigned_employee_name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null;
    lead.created_by_name = lead.created_by?.username || null;
    lead.converted_client_code = lead.converted_client_id?.client_code || null;

    const followUps = (lead.follow_ups || []).map(fu => {
      const aEmp = fu.assigned_employee_id || {};
      return {
        ...fu,
        id: fu._id.toString(),
        assigned_name: aEmp.first_name ? `${aEmp.first_name} ${aEmp.last_name || ''}`.trim() : null
      };
    }).sort((a, b) => (b.follow_up_date || '').localeCompare(a.follow_up_date || ''));

    const activities = (lead.activities || []).map(act => {
      const pEmp = act.performed_by || {};
      return {
        ...act,
        id: act._id.toString(),
        performed_by_name: pEmp.first_name ? `${pEmp.first_name} ${pEmp.last_name || ''}`.trim() : null
      };
    }).reverse();

    const proposals = await Proposal.find({ lead_id: lead._id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const formattedProposals = proposals.map(p => ({ ...p, id: p._id.toString() }));

    const meetings = await Meeting.find({ lead_id: lead._id })
      .populate('assigned_employee_id', 'first_name last_name')
      .sort({ meeting_date: -1, meeting_time: -1 })
      .lean({ virtuals: true });

    const formattedMeetings = meetings.map(m => ({
      ...m,
      id: m._id.toString(),
      assigned_employee_name: m.assigned_employee_id?.first_name
        ? `${m.assigned_employee_id.first_name} ${m.assigned_employee_id.last_name || ''}`.trim()
        : null
    }));

    res.json({
      lead,
      followUps,
      proposals: formattedProposals,
      meetings: formattedMeetings,
      activities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create Lead (Multi-Step Form)
router.post('/', authenticate, requireRole(['admin', 'sales', 'marketing_manager']), async (req, res) => {
  try {
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
    const count = await Lead.countDocuments() + 1;
    const lead_code = `LEAD-${currentYear}-${String(count).padStart(4, '0')}`;
    const lead_date = getTodayDate();

    const assignedEmpId = assigned_sales_employee_id || (req.employee ? (req.employee._id || req.employee.id) : null);

    const follow_ups = [];
    if (initial_follow_up && initial_follow_up.follow_up_date) {
      follow_ups.push({
        follow_up_date: initial_follow_up.follow_up_date,
        follow_up_time: initial_follow_up.follow_up_time || '11:00',
        contact_method: initial_follow_up.contact_method || 'Phone',
        follow_up_type: initial_follow_up.contact_method || 'Call',
        discussion_summary: initial_follow_up.discussion_summary || 'Initial prospect connection call',
        notes: initial_follow_up.discussion_summary || 'Initial prospect connection call',
        next_action: initial_follow_up.next_action || 'Introductory pitch',
        assigned_employee_id: assignedEmpId,
        priority: priority || 'MEDIUM',
        status: 'PENDING'
      });
    }

    const newLead = await Lead.create({
      lead_code,
      lead_date,
      company_name,
      contact_person,
      designation: designation || 'Owner',
      phone,
      whatsapp: whatsapp || phone,
      email: email || '',
      website: website || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      industry: industry || 'General Business',
      business_type: business_type || '',
      company_size: company_size || '',
      product_service: product_service || '',
      target_market: target_market || '',
      target_location: target_location || '',
      competitors: competitors || '',
      current_marketing_method: current_marketing_method || '',
      services_required,
      requirement: requirement || '',
      main_business_problem: main_business_problem || '',
      desired_outcome: desired_outcome || '',
      expected_start_date: expected_start_date || null,
      existing_agency: existing_agency || '',
      urgency,
      deal_value: Number(deal_value || 50000),
      budget_range: budget_range || '₹50,000 - ₹1,00,000 / month',
      billing_type,
      expected_contract_duration: expected_contract_duration || '6 Months',
      decision_maker: decision_maker || contact_person,
      purchase_timeline: purchase_timeline || 'Immediate',
      pricing_sensitivity: pricing_sensitivity || 'Normal',
      source,
      lead_type,
      priority,
      assigned_sales_employee_id: assignedEmpId,
      first_follow_up_date: first_follow_up_date || null,
      lead_score: Number(lead_score || 50),
      notes: notes || '',
      status: 'NEW',
      created_by: req.user._id || req.user.id,
      follow_ups
    });

    await logLeadActivity({
      leadId: newLead._id || newLead.id,
      activityType: 'LEAD_CREATED',
      title: 'Lead Created',
      description: `New lead created from ${source} with deal estimate of ₹${Number(deal_value || 50000).toLocaleString()}`,
      performedBy: assignedEmpId
    });

    if (initial_follow_up && initial_follow_up.follow_up_date) {
      await logLeadActivity({
        leadId: newLead._id || newLead.id,
        activityType: 'FOLLOW_UP_SCHEDULED',
        title: 'First Follow-Up Scheduled',
        description: `${initial_follow_up.contact_method || 'Phone'} call scheduled for ${initial_follow_up.follow_up_date}`,
        performedBy: assignedEmpId
      });
    }

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'CREATED',
      entity: 'leads',
      entityId: newLead._id || newLead.id,
      newValue: { lead_code, company_name, contact_person, source, priority, deal_value: deal_value || 50000 },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Lead created successfully',
      lead: {
        ...newLead.toObject(),
        id: newLead._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update Pipeline Stage
router.put('/:id/stage', authenticate, async (req, res) => {
  try {
    const { stage, notes } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const ALLOWED_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON HOLD'];
    if (!ALLOWED_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage: ${stage}` });
    }

    const oldStage = lead.status;
    lead.status = stage;
    if (notes) lead.notes = notes;
    lead.stage_updated_at = new Date();
    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'STAGE_CHANGED',
      title: `Stage Changed: ${oldStage} → ${stage}`,
      description: notes || `Opportunity advanced from ${oldStage} to ${stage}`,
      performedBy: req.employee ? (req.employee._id || req.employee.id) : null
    });

    // Notify assigned sales employee if different from current user
    if (lead.assigned_sales_employee_id && (!req.employee || (req.employee._id || req.employee.id).toString() !== lead.assigned_sales_employee_id.toString())) {
      const emp = await Employee.findById(lead.assigned_sales_employee_id);
      if (emp && emp.user_id) {
        await createNotification({
          userId: emp.user_id,
          type: 'STAGE_CHANGED',
          title: 'Lead Stage Updated',
          message: `${lead.company_name} stage updated to ${stage}`,
          relatedEntity: 'leads',
          relatedEntityId: lead._id
        });
      }
    }

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'STAGE_CHANGED',
      entity: 'leads',
      entityId: lead._id || lead.id,
      oldValue: { status: oldStage },
      newValue: { status: stage, notes },
      ip: req.ip
    });

    res.json({
      message: `Lead stage updated to ${stage}`,
      lead: {
        ...lead.toObject(),
        id: lead._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Lead Details
router.put('/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updateFields = [
      'company_name', 'contact_person', 'designation', 'phone', 'whatsapp', 'email', 'website',
      'city', 'state', 'country', 'source', 'industry', 'business_type', 'deal_value', 'budget_range',
      'requirement', 'urgency', 'priority', 'notes', 'status', 'assigned_sales_employee_id'
    ];

    for (const f of updateFields) {
      if (req.body[f] !== undefined) {
        lead[f] = req.body[f];
      }
    }

    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'NOTE_ADDED',
      title: 'Lead Details Updated',
      description: `Details updated by ${req.user.username}`,
      performedBy: req.employee ? (req.employee._id || req.employee.id) : null
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'UPDATED',
      entity: 'leads',
      entityId: lead._id || lead.id,
      newValue: req.body,
      ip: req.ip
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate('assigned_sales_employee_id', 'first_name last_name')
      .populate('created_by', 'username')
      .lean({ virtuals: true });

    updatedLead.id = updatedLead._id.toString();
    const emp = updatedLead.assigned_sales_employee_id || {};
    updatedLead.assigned_employee_name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null;
    updatedLead.created_by_name = updatedLead.created_by?.username || null;

    res.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Lead Qualification API
router.put('/:id/qualify', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { qualification_data, qualification_status, lead_score, deal_value } = req.body;

    let newStatus = lead.status;
    if (qualification_status === 'Qualified' && (lead.status === 'NEW' || lead.status === 'CONTACTED')) {
      newStatus = 'QUALIFIED';
    } else if (qualification_status === 'Unqualified') {
      newStatus = 'LOST';
    }

    lead.qualification_data = qualification_data;
    if (qualification_status) lead.qualification_status = qualification_status;
    if (lead_score !== undefined) lead.lead_score = Number(lead_score);
    if (deal_value !== undefined) lead.deal_value = Number(deal_value);
    lead.status = newStatus;
    lead.stage_updated_at = new Date();
    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'QUALIFICATION_UPDATED',
      title: `Lead Qualification: ${qualification_status || 'Updated'}`,
      description: `Lead scored at ${lead_score || lead.lead_score}. Status set to ${qualification_status}.`,
      performedBy: req.employee ? (req.employee._id || req.employee.id) : null
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'LEAD_QUALIFIED',
      entity: 'leads',
      entityId: lead._id || lead.id,
      newValue: { qualification_status, lead_score },
      ip: req.ip
    });

    res.json({
      message: 'Lead qualification updated successfully',
      lead: {
        ...lead.toObject(),
        id: lead._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Lead Activity Timeline & Logging
router.get('/:id/activities', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('activities.performed_by', 'first_name last_name')
      .lean({ virtuals: true });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const activities = (lead.activities || []).map(act => {
      const emp = act.performed_by || {};
      return {
        ...act,
        id: act._id.toString(),
        performed_by_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null
      };
    }).reverse();

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/activities', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { activity_type, title, description, metadata } = req.body;
    if (!activity_type || !title) {
      return res.status(400).json({ error: 'Activity type and title are required.' });
    }

    const activityDoc = {
      activity_type,
      title,
      description: description || '',
      performed_by: req.employee ? (req.employee._id || req.employee.id) : null,
      metadata
    };

    lead.activities.push(activityDoc);

    if ((activity_type === 'CALL_MADE' || activity_type === 'WHATSAPP_SENT' || activity_type === 'EMAIL_SENT') && lead.status === 'NEW') {
      lead.status = 'CONTACTED';
      lead.stage_updated_at = new Date();
    }

    await lead.save();

    const createdAct = lead.activities[lead.activities.length - 1];

    res.status(201).json({
      message: 'Activity logged successfully',
      activity: {
        ...createdAct.toObject(),
        id: createdAct._id.toString(),
        performed_by_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name || ''}`.trim() : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Add Follow-up to Lead
router.post('/:id/follow-ups', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
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

    const assignedEmp = req.employee ? (req.employee._id || req.employee.id) : lead.assigned_sales_employee_id;

    const followUpDoc = {
      follow_up_date,
      follow_up_time: follow_up_time || '14:00',
      contact_method,
      follow_up_type: contact_method || 'Call',
      discussion_summary,
      notes: discussion_summary,
      client_requirement: client_requirement || '',
      next_action: next_action || '',
      next_follow_up_date: next_follow_up_date || null,
      assigned_employee_id: assignedEmp,
      performed_by: req.employee ? (req.employee._id || req.employee.id) : null,
      priority: priority || 'MEDIUM',
      reminder: reminder !== undefined ? !!reminder : true,
      status: status || 'PENDING'
    };

    lead.follow_ups.push(followUpDoc);

    if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
      lead.stage_updated_at = new Date();
    }

    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'FOLLOW_UP_SCHEDULED',
      title: `${contact_method} Follow-up Scheduled`,
      description: `Scheduled for ${follow_up_date} at ${follow_up_time || '14:00'}. Action: ${next_action || 'Discussion'}`,
      performedBy: assignedEmp
    });

    const newFollowUp = lead.follow_ups[lead.follow_ups.length - 1];

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'CREATED',
      entity: 'lead_follow_ups',
      entityId: newFollowUp._id,
      newValue: { lead_id: lead._id, contact_method, follow_up_date },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Follow-up recorded successfully',
      follow_up: {
        ...newFollowUp.toObject(),
        id: newFollowUp._id.toString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Won Deal & Client Handover Workflow
router.post('/:id/convert-and-handover', authenticate, requireRole(['admin', 'sales']), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (lead.converted_client_id) {
      return res.status(400).json({ error: 'This lead has already been converted to client.' });
    }

    const {
      start_date, billing_cycle = 'Monthly',
      monthly_value,
      account_manager_id, marketing_manager_id, creative_editor_id,
      client_requirements, services_sold, pricing_terms, commitments, campaign_requirements,
      target_audience, important_dates, special_instructions, communication_preferences
    } = req.body;

    const clientCount = await Client.countDocuments() + 1;
    const client_code = `CL-${new Date().getFullYear()}-${String(clientCount).padStart(4, '0')}`;
    const sDate = start_date || getTodayDate();

    // 17-Point Onboarding Checklist
    const checklistItems = [
      { item_key: 'profile_complete', item_label: 'Client profile complete', is_completed: false },
      { item_key: 'logo_received', item_label: 'Logo received', is_completed: false },
      { item_key: 'brand_guidelines', item_label: 'Brand guidelines received', is_completed: false },
      { item_key: 'brand_colors', item_label: 'Brand colors received', is_completed: false },
      { item_key: 'fonts_received', item_label: 'Fonts received', is_completed: false },
      { item_key: 'social_media_links', item_label: 'Social media links received', is_completed: false },
      { item_key: 'social_credentials', item_label: 'Social media credentials configured securely', is_completed: false },
      { item_key: 'website_details', item_label: 'Website details received', is_completed: false },
      { item_key: 'product_service_info', item_label: 'Product/service information received', is_completed: false },
      { item_key: 'target_audience', item_label: 'Target audience defined', is_completed: false },
      { item_key: 'competitors_added', item_label: 'Competitors added', is_completed: false },
      { item_key: 'location_service_area', item_label: 'Location/service area added', is_completed: false },
      { item_key: 'comm_preferences', item_label: 'Communication preferences confirmed', is_completed: false },
      { item_key: 'approval_person_id', item_label: 'Approval person identified', is_completed: false },
      { item_key: 'content_preferences', item_label: 'Content preferences defined', is_completed: false },
      { item_key: 'campaign_goals', item_label: 'Campaign goals defined', is_completed: false },
      { item_key: 'package_confirmed', item_label: 'Required service package confirmed', is_completed: false }
    ];

    const primaryContact = {
      name: lead.contact_person,
      designation: lead.designation || 'Owner',
      email: lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`,
      phone: lead.phone,
      is_primary: true
    };

    const newClient = await Client.create({
      client_code,
      company_name: lead.company_name,
      business_type: lead.business_type,
      industry: lead.industry,
      website: lead.website,
      address: lead.city || '',
      city: lead.city || '',
      state: lead.state || '',
      primary_contact_name: lead.contact_person,
      primary_contact_designation: lead.designation,
      primary_contact_phone: lead.phone,
      primary_contact_whatsapp: lead.whatsapp || lead.phone,
      primary_contact_email: lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`,
      assigned_sales_employee_id: lead.assigned_sales_employee_id,
      account_manager_id: account_manager_id || null,
      billing_cycle,
      status: 'ONBOARDING',
      start_date: sDate,
      monthly_retainer_fee: Number(monthly_value || lead.deal_value || 0),
      notes: `Converted from Won Deal [${lead.lead_code}]. Monthly Retainer: ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()}`,
      contacts: [primaryContact],
      onboarding_checklist: checklistItems
    });

    const clientId = newClient._id;

    // Services Sold
    const servicesArray = Array.isArray(services_sold)
      ? services_sold
      : (lead.services_required ? (typeof lead.services_required === 'string' ? JSON.parse(lead.services_required || '[]') : lead.services_required) : []);

    for (const s of servicesArray) {
      const sName = typeof s === 'string' ? s : (s.service_name || 'Marketing Retainer');
      const sPrice = typeof s === 'object' && s.price ? s.price : (monthly_value || lead.deal_value || 50000);
      await ClientService.create({
        client_id: clientId,
        service_name: sName,
        billing_cycle,
        price: sPrice,
        start_date: sDate,
        status: 'ACTIVE'
      });
    }

    // Client Handover Record
    await ClientHandover.create({
      lead_id: lead._id,
      client_id: clientId,
      sales_employee_id: req.employee ? (req.employee._id || req.employee.id) : lead.assigned_sales_employee_id,
      marketing_manager_id: marketing_manager_id || null,
      account_manager_id: account_manager_id || null,
      client_requirements: client_requirements || lead.requirement || '',
      services_sold: servicesArray,
      pricing_terms: pricing_terms || `Monthly Retainer: ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()} (${billing_cycle})`,
      commitments: commitments || '',
      campaign_requirements: campaign_requirements || '',
      target_audience: target_audience || lead.target_market || '',
      important_dates: important_dates || `Kickoff: ${sDate}`,
      special_instructions: special_instructions || '',
      communication_preferences: communication_preferences || 'WhatsApp & Email',
      status: 'PENDING'
    });

    // Update Lead to WON
    lead.status = 'WON';
    lead.deal_value = monthly_value ? Number(monthly_value) : lead.deal_value;
    lead.converted_client_id = clientId;
    lead.stage_updated_at = new Date();
    await lead.save();

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'DEAL_WON',
      title: 'Deal Won & Converted',
      description: `Opportunity successfully closed at ₹${Number(monthly_value || lead.deal_value || 0).toLocaleString()}. Converted to Client [${client_code}].`,
      performedBy: req.employee ? (req.employee._id || req.employee.id) : null
    });

    await logLeadActivity({
      leadId: lead._id || lead.id,
      activityType: 'HANDOVER_SUBMITTED',
      title: 'Client Handover Submitted',
      description: 'Formal agency handover dossier created for onboarding and marketing execution team.',
      performedBy: req.employee ? (req.employee._id || req.employee.id) : null
    });

    if (marketing_manager_id) {
      const mmEmp = await Employee.findById(marketing_manager_id);
      if (mmEmp && mmEmp.user_id) {
        await createNotification({
          userId: mmEmp.user_id,
          type: 'CLIENT_HANDOVER',
          title: 'New Client Handover Assigned',
          message: `${lead.company_name} has been won and handed over for marketing kickoff.`,
          relatedEntity: 'clients',
          relatedEntityId: clientId
        });
      }
    }

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'DEAL_WON',
      entity: 'leads',
      entityId: lead._id || lead.id,
      newValue: { status: 'WON', clientId: clientId.toString(), client_code },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Deal Won! Client successfully created and Handover submitted to Marketing team.',
      client: {
        ...newClient.toObject(),
        id: clientId.toString()
      },
      client_id: clientId.toString(),
      client_code
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete deal conversion: ' + err.message });
  }
});

export default router;
