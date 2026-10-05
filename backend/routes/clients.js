import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  Client,
  User,
  Role,
  Organization,
  Employee,
  ClientService,
  Project,
  Invoice,
  Contract,
  AuditLog,
  Task,
  ContentItem
} from '../models/index.js';
import { logAudit, createNotification } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Clients with Role-based filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (req.user.user_type === 'client') {
      query.user_id = req.user._id;
    } else if (req.user.role_name !== 'admin' && req.employee) {
      query.$or = [
        { account_manager_id: req.employee._id },
        { assigned_marketing_manager_id: req.employee._id },
        { assigned_sales_employee_id: req.employee._id }
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { company_name: { $regex: s, $options: 'i' } },
        { client_code: { $regex: s, $options: 'i' } },
        { primary_contact_name: { $regex: s, $options: 'i' } },
        { primary_contact_email: { $regex: s, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query)
      .populate('account_manager_id')
      .populate('user_id')
      .sort({ created_at: -1 });

    const clientIds = clients.map(c => c._id);
    const activeProjects = await Project.find({ client_id: { $in: clientIds }, status: 'ACTIVE' });
    const activeServices = await ClientService.find({ client_id: { $in: clientIds }, status: 'ACTIVE' });

    const projectCountMap = new Map();
    for (const p of activeProjects) {
      const cid = p.client_id.toString();
      projectCountMap.set(cid, (projectCountMap.get(cid) || 0) + 1);
    }

    const serviceCountMap = new Map();
    for (const s of activeServices) {
      const cid = s.client_id.toString();
      serviceCountMap.set(cid, (serviceCountMap.get(cid) || 0) + 1);
    }

    const formatted = clients.map(c => {
      const cid = c._id.toString();
      const checklist = c.onboarding_checklist || [];
      const completedOnboarding = checklist.filter(item => item.is_completed).length;
      const am = c.account_manager_id;

      return {
        ...c.toJSON(),
        account_manager_name: am ? `${am.first_name} ${am.last_name}` : '',
        marketing_manager_name: '',
        sales_person_name: '',
        onboarding_completed_count: completedOnboarding,
        onboarding_total_count: checklist.length,
        active_projects_count: projectCountMap.get(cid) || 0,
        active_services_count: serviceCountMap.get(cid) || 0
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing clients:', err);
    res.status(500).json({ error: 'Failed to retrieve clients list.' });
  }
});

// Single Client Detail with all Sub-tabs
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await Client.findById(req.params.id)
      .populate('account_manager_id')
      .populate('user_id');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Permission check for client role
    if (req.user.user_type === 'client' && client.user_id?._id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Unauthorized client data request.' });
    }

    const am = client.account_manager_id;
    const clientData = {
      ...client.toJSON(),
      account_manager_name: am ? `${am.first_name} ${am.last_name}` : '',
      marketing_manager_name: '',
      sales_person_name: '',
      portal_username: client.user_id?.username || ''
    };

    const contacts = client.contacts || [];
    const onboarding = (client.onboarding_checklist || []).map(ck => ({
      ...ck.toObject ? ck.toObject() : ck,
      completed_by_user: ''
    }));

    const services = await ClientService.find({ client_id: client._id }).sort({ created_at: -1 });

    const projects = await Project.find({ client_id: client._id })
      .populate('project_manager_id')
      .sort({ created_at: -1 });

    const projectTasks = await Task.find({ project_id: { $in: projects.map(p => p._id) } });
    const formattedProjects = projects.map(p => {
      const tasks = projectTasks.filter(t => t.project_id?.toString() === p._id.toString());
      const pm = p.project_manager_id;
      return {
        ...p.toJSON(),
        manager_name: pm ? `${pm.first_name} ${pm.last_name}` : '',
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'COMPLETED').length
      };
    });

    const invoices = await Invoice.find({ client_id: client._id }).sort({ due_date: -1 });
    const contracts = await Contract.find({ client_id: client._id }).sort({ end_date: -1 });

    const activity = await AuditLog.find({
      $or: [
        { entity: 'clients', entity_id: client._id },
        { entity: 'clients', entity_id: client._id.toString() }
      ]
    }).sort({ created_at: -1 }).limit(50);

    res.json({
      client: clientData,
      contacts,
      onboarding,
      services,
      team: [],
      projects: formattedProjects,
      invoices,
      contracts,
      activity
    });
  } catch (err) {
    console.error('Error fetching client details:', err);
    res.status(500).json({ error: 'Failed to retrieve client details.' });
  }
});

// Create Client Manually
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      company_name, legal_name, business_type, industry, website, logo, address,
      city, state, country, pin_code, gst_number, pan, primary_contact_name,
      primary_contact_designation, primary_contact_phone, primary_contact_whatsapp,
      primary_contact_email, account_manager_id, assigned_marketing_manager_id,
      assigned_sales_employee_id, status, start_date, contract_start, contract_end,
      billing_cycle, payment_terms, priority, notes, contacts, portal_username, portal_password
    } = req.body;

    if (!company_name || !primary_contact_name || !primary_contact_phone || !primary_contact_email) {
      return res.status(400).json({ error: 'Company name, contact name, phone, and email are required.' });
    }

    const org = await Organization.findOne();
    const orgId = org ? org._id : null;

    const count = await Client.countDocuments() + 1;
    const client_code = `CL-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    let clientUserId = null;
    if (portal_username && portal_password) {
      const clientRole = await Role.findOne({ name: 'client' });
      const hash = bcrypt.hashSync(portal_password, 10);
      const user = await User.create({
        org_id: orgId,
        username: portal_username.trim().toLowerCase(),
        email: primary_contact_email.trim().toLowerCase(),
        password_hash: hash,
        role_id: clientRole._id,
        user_type: 'client',
        is_active: true
      });
      clientUserId = user._id;
    }

    const contactList = [
      {
        name: primary_contact_name,
        designation: primary_contact_designation || 'Director',
        phone: primary_contact_phone,
        email: primary_contact_email,
        is_primary: true
      }
    ];

    if (contacts && Array.isArray(contacts)) {
      for (const c of contacts) {
        contactList.push({
          name: c.name,
          designation: c.designation || '',
          phone: c.phone || '',
          email: c.email || '',
          is_primary: false
        });
      }
    }

    const checklistItems = [
      { item_key: 'profile_complete', item_label: 'Client profile complete', is_completed: false },
      { item_key: 'logo_received', item_label: 'Logo received', is_completed: false },
      { item_key: 'brand_guidelines', item_label: 'Brand guidelines received', is_completed: false },
      { item_key: 'brand_colors', item_label: 'Brand colors received', is_completed: false },
      { item_key: 'fonts_received', item_label: 'Fonts received', is_completed: false },
      { item_key: 'social_media_links', item_label: 'Social media links received', is_completed: false },
      { item_key: 'social_credentials', item_label: 'Social media credentials/access configured securely', is_completed: false },
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

    const newClient = await Client.create({
      user_id: clientUserId,
      org_id: orgId,
      client_code,
      company_name,
      brand_name: company_name,
      industry: industry || '',
      website: website || '',
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || 'India',
      pin_code: pin_code || '',
      gst_number: gst_number || '',
      pan: pan || '',
      primary_contact_name,
      primary_contact_phone,
      primary_contact_email,
      account_manager_id: account_manager_id && mongoose.Types.ObjectId.isValid(account_manager_id) ? account_manager_id : null,
      status: status || 'ONBOARDING',
      start_date: start_date ? new Date(start_date) : new Date(),
      contacts: contactList,
      onboarding_checklist: checklistItems
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'clients',
      entityId: newClient._id,
      newValue: { client_code: newClient.client_code, company_name },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Client created successfully with onboarding checklist launched!',
      client: newClient.toJSON()
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: err.message || 'Failed to create client.' });
  }
});

// Update Client Profile
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const {
      company_name, legal_name, business_type, industry, website, logo,
      address, city, state, country, pin_code, gst_number, pan,
      primary_contact_name, primary_contact_phone, primary_contact_email,
      account_manager_id, status
    } = req.body;

    if (company_name !== undefined) client.company_name = company_name;
    if (industry !== undefined) client.industry = industry;
    if (website !== undefined) client.website = website;
    if (address !== undefined) client.address = address;
    if (city !== undefined) client.city = city;
    if (state !== undefined) client.state = state;
    if (country !== undefined) client.country = country;
    if (pin_code !== undefined) client.pin_code = pin_code;
    if (gst_number !== undefined) client.gst_number = gst_number;
    if (pan !== undefined) client.pan = pan;
    if (primary_contact_name !== undefined) client.primary_contact_name = primary_contact_name;
    if (primary_contact_phone !== undefined) client.primary_contact_phone = primary_contact_phone;
    if (primary_contact_email !== undefined) client.primary_contact_email = primary_contact_email;
    if (account_manager_id !== undefined) client.account_manager_id = mongoose.Types.ObjectId.isValid(account_manager_id) ? account_manager_id : null;
    if (status !== undefined) client.status = status;

    await client.save();

    await logAudit({
      userId: req.user.id,
      action: 'UPDATED',
      entity: 'clients',
      entityId: client._id,
      newValue: req.body,
      ip: req.ip
    });

    res.json({ message: 'Client profile updated successfully', client: client.toJSON() });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: 'Failed to update client profile.' });
  }
});

// Update Onboarding Checklist Item
router.put('/:id/onboarding/:itemKey', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { is_completed } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const itemKey = req.params.itemKey;
    const item = (client.onboarding_checklist || []).find(ck => ck.item_key === itemKey);
    if (item) {
      item.is_completed = Boolean(is_completed);
      item.completed_at = is_completed ? new Date() : null;
    }

    const pending = (client.onboarding_checklist || []).filter(ck => !ck.is_completed).length;
    if (pending === 0 && client.status === 'ONBOARDING') {
      client.status = 'ACTIVE';
    }

    await client.save();

    await logAudit({
      userId: req.user.id,
      action: 'ONBOARDING_UPDATED',
      entity: 'clients',
      entityId: client._id,
      newValue: { item_key: itemKey, is_completed },
      ip: req.ip
    });

    res.json({ message: 'Onboarding checklist updated successfully' });
  } catch (err) {
    console.error('Error updating onboarding item:', err);
    res.status(500).json({ error: 'Failed to update checklist item.' });
  }
});

export default router;
