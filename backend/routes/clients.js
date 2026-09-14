import express from 'express';
import bcrypt from 'bcryptjs';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Clients with Role-based filtering
router.get('/', authenticate, (req, res) => {
  const { status, search } = req.query;

  let sql = `
    SELECT c.*,
           am.first_name || ' ' || am.last_name as account_manager_name,
           mm.first_name || ' ' || mm.last_name as marketing_manager_name,
           se.first_name || ' ' || se.last_name as sales_person_name,
           (SELECT COUNT(*) FROM client_onboarding_checklists WHERE client_id = c.id AND is_completed = 1) as onboarding_completed_count,
           (SELECT COUNT(*) FROM client_onboarding_checklists WHERE client_id = c.id) as onboarding_total_count,
           (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND status = 'ACTIVE') as active_projects_count,
           (SELECT COUNT(*) FROM client_services WHERE client_id = c.id AND status = 'ACTIVE') as active_services_count
    FROM clients c
    LEFT JOIN employees am ON c.account_manager_id = am.id
    LEFT JOIN employees mm ON c.assigned_marketing_manager_id = mm.id
    LEFT JOIN employees se ON c.assigned_sales_employee_id = se.id
    WHERE 1=1
  `;
  const params = [];

  // Client role sees only their own organization
  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ?`;
    params.push(req.user.id);
  } else if (req.user.role_name !== 'admin') {
    // Non-admin employees see clients where assigned
    sql += ` AND (
      c.account_manager_id = ? OR
      c.assigned_marketing_manager_id = ? OR
      c.assigned_sales_employee_id = ? OR
      c.id IN (SELECT client_id FROM employee_assignments WHERE employee_id = ? AND is_active = 1)
    )`;
    const empId = req.employee?.id || 0;
    params.push(empId, empId, empId, empId);
  }

  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (c.company_name LIKE ? OR c.client_code LIKE ? OR c.primary_contact_name LIKE ? OR c.primary_contact_email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ` ORDER BY c.id DESC`;
  const clients = db.prepare(sql).all(...params);
  res.json(clients);
});

// Single Client Detail with all Sub-tabs
router.get('/:id', authenticate, (req, res) => {
  const client = db.prepare(`
    SELECT c.*,
           am.first_name || ' ' || am.last_name as account_manager_name,
           mm.first_name || ' ' || mm.last_name as marketing_manager_name,
           se.first_name || ' ' || se.last_name as sales_person_name,
           u.username as portal_username
    FROM clients c
    LEFT JOIN employees am ON c.account_manager_id = am.id
    LEFT JOIN employees mm ON c.assigned_marketing_manager_id = mm.id
    LEFT JOIN employees se ON c.assigned_sales_employee_id = se.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  // Permission check for client role
  if (req.user.user_type === 'client' && client.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Unauthorized client data request.' });
  }

  // Contacts
  const contacts = db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY id ASC').all(client.id);

  // Onboarding Checklist
  const onboarding = db.prepare(`
    SELECT coc.*, u.username as completed_by_user
    FROM client_onboarding_checklists coc
    LEFT JOIN users u ON coc.completed_by = u.id
    WHERE coc.client_id = ?
    ORDER BY coc.id ASC
  `).all(client.id);

  // Services
  const services = db.prepare('SELECT * FROM client_services WHERE client_id = ? ORDER BY id DESC').all(client.id);

  // Assigned Team
  const team = db.prepare(`
    SELECT ea.*, e.employee_code, e.first_name, e.last_name, e.designation, e.employee_type, e.phone
    FROM employee_assignments ea
    JOIN employees e ON ea.employee_id = e.id
    WHERE ea.client_id = ? AND ea.is_active = 1
    ORDER BY ea.id ASC
  `).all(client.id);

  // Projects
  const projects = db.prepare(`
    SELECT p.*, pm.first_name || ' ' || pm.last_name as manager_name,
           (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
           (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'COMPLETED') as completed_tasks
    FROM projects p
    LEFT JOIN employees pm ON p.project_manager_id = pm.id
    WHERE p.client_id = ?
    ORDER BY p.id DESC
  `).all(client.id);

  // Invoices & Contracts
  const invoices = db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY due_date DESC').all(client.id);
  const contracts = db.prepare('SELECT * FROM contracts WHERE client_id = ? ORDER BY end_date DESC').all(client.id);

  // Activity Timeline
  const activity = db.prepare(`
    SELECT * FROM audit_logs
    WHERE (entity = 'clients' AND entity_id = ?)
       OR (entity = 'tasks' AND entity_id IN (SELECT id FROM tasks WHERE client_id = ?))
       OR (entity = 'content_items' AND entity_id IN (SELECT id FROM content_items WHERE client_id = ?))
       OR (entity = 'client_requests' AND entity_id IN (SELECT id FROM client_requests WHERE client_id = ?))
    ORDER BY created_at DESC LIMIT 50
  `).all(client.id, client.id, client.id, client.id);

  res.json({
    client,
    contacts,
    onboarding,
    services,
    team,
    projects,
    invoices,
    contracts,
    activity
  });
});

// Create Client Manually
router.post('/', authenticate, requireRole(['admin']), (req, res) => {
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

  const count = db.prepare('SELECT COUNT(*) as count FROM clients').get().count + 1;
  const client_code = `CL-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const createTransaction = db.transaction(() => {
    let clientUserId = null;

    // Optionally create client portal login
    if (portal_username && portal_password) {
      const clientRole = db.prepare("SELECT id FROM roles WHERE name = 'client'").get();
      const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
      const hash = bcrypt.hashSync(portal_password, 10);
      const userRes = db.prepare(`
        INSERT INTO users (org_id, username, email, password_hash, role_id, user_type, is_active)
        VALUES (?, ?, ?, ?, ?, 'client', 1)
      `).run(org ? org.id : 1, portal_username.trim(), primary_contact_email.trim(), hash, clientRole.id);
      clientUserId = userRes.lastInsertRowid;
    }

    const clientRes = db.prepare(`
      INSERT INTO clients (
        client_code, company_name, legal_name, business_type, industry, website, logo,
        address, city, state, country, pin_code, gst_number, pan,
        primary_contact_name, primary_contact_designation, primary_contact_phone,
        primary_contact_whatsapp, primary_contact_email, account_manager_id,
        assigned_marketing_manager_id, assigned_sales_employee_id, status,
        start_date, contract_start, contract_end, billing_cycle, payment_terms,
        priority, notes, user_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      client_code, company_name, legal_name || company_name, business_type || '', industry || '', website || '', logo || null,
      address || '', city || '', state || '', country || 'India', pin_code || '', gst_number || '', pan || '',
      primary_contact_name, primary_contact_designation || 'Director', primary_contact_phone,
      primary_contact_whatsapp || primary_contact_phone, primary_contact_email, account_manager_id || null,
      assigned_marketing_manager_id || null, assigned_sales_employee_id || null, status || 'ONBOARDING',
      start_date || new Date().toISOString().split('T')[0], contract_start || null, contract_end || null,
      billing_cycle || 'Monthly', payment_terms || 'Net 15', priority || 'MEDIUM', notes || '', clientUserId
    );

    const clientId = clientRes.lastInsertRowid;

    // Insert primary contact into client_contacts
    db.prepare(`
      INSERT INTO client_contacts (client_id, name, designation, phone, email, whatsapp, can_approve_content, can_create_requests)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `).run(clientId, primary_contact_name, primary_contact_designation || 'Director', primary_contact_phone, primary_contact_email, primary_contact_whatsapp || primary_contact_phone);

    // Insert any secondary contacts
    if (contacts && Array.isArray(contacts)) {
      const insertContact = db.prepare(`
        INSERT INTO client_contacts (client_id, name, designation, phone, email, whatsapp, can_approve_content, can_create_requests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of contacts) {
        insertContact.run(clientId, c.name, c.designation || '', c.phone || '', c.email || '', c.whatsapp || '', c.can_approve_content ? 1 : 0, c.can_create_requests ? 1 : 0);
      }
    }

    // Initialize 17-point Onboarding Checklist
    const checklistItems = [
      { key: 'profile_complete', label: 'Client profile complete' },
      { key: 'logo_received', label: 'Logo received' },
      { key: 'brand_guidelines', label: 'Brand guidelines received' },
      { key: 'brand_colors', label: 'Brand colors received' },
      { key: 'fonts_received', label: 'Fonts received' },
      { key: 'social_media_links', label: 'Social media links received' },
      { key: 'social_credentials', label: 'Social media credentials/access configured securely' },
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

    const insertChecklist = db.prepare('INSERT INTO client_onboarding_checklists (client_id, item_key, item_label) VALUES (?, ?, ?)');
    for (const item of checklistItems) {
      insertChecklist.run(clientId, item.key, item.label);
    }

    return { clientId, client_code };
  });

  const result = createTransaction();

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'clients',
    entityId: result.clientId,
    newValue: { client_code: result.client_code, company_name },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.clientId);
  res.status(201).json({ message: 'Client created successfully with onboarding checklist launched!', client: created });
});

// Update Client Profile
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const {
    company_name, legal_name, business_type, industry, website, logo,
    address, city, state, country, pin_code, gst_number, pan,
    primary_contact_name, primary_contact_designation, primary_contact_phone,
    primary_contact_whatsapp, primary_contact_email, account_manager_id,
    assigned_marketing_manager_id, assigned_sales_employee_id, status,
    billing_cycle, payment_terms, priority, notes
  } = req.body;

  db.prepare(`
    UPDATE clients SET
      company_name = coalesce(?, company_name),
      legal_name = coalesce(?, legal_name),
      business_type = coalesce(?, business_type),
      industry = coalesce(?, industry),
      website = coalesce(?, website),
      logo = coalesce(?, logo),
      address = coalesce(?, address),
      city = coalesce(?, city),
      state = coalesce(?, state),
      country = coalesce(?, country),
      pin_code = coalesce(?, pin_code),
      gst_number = coalesce(?, gst_number),
      pan = coalesce(?, pan),
      primary_contact_name = coalesce(?, primary_contact_name),
      primary_contact_designation = coalesce(?, primary_contact_designation),
      primary_contact_phone = coalesce(?, primary_contact_phone),
      primary_contact_whatsapp = coalesce(?, primary_contact_whatsapp),
      primary_contact_email = coalesce(?, primary_contact_email),
      account_manager_id = coalesce(?, account_manager_id),
      assigned_marketing_manager_id = coalesce(?, assigned_marketing_manager_id),
      assigned_sales_employee_id = coalesce(?, assigned_sales_employee_id),
      status = coalesce(?, status),
      billing_cycle = coalesce(?, billing_cycle),
      payment_terms = coalesce(?, payment_terms),
      priority = coalesce(?, priority),
      notes = coalesce(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    company_name, legal_name, business_type, industry, website, logo,
    address, city, state, country, pin_code, gst_number, pan,
    primary_contact_name, primary_contact_designation, primary_contact_phone,
    primary_contact_whatsapp, primary_contact_email, account_manager_id,
    assigned_marketing_manager_id, assigned_sales_employee_id, status,
    billing_cycle, payment_terms, priority, notes, client.id
  );

  logAudit({
    userId: req.user.id,
    action: 'UPDATED',
    entity: 'clients',
    entityId: client.id,
    oldValue: client,
    newValue: req.body,
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.id);
  res.json({ message: 'Client profile updated successfully', client: updated });
});

// Update Onboarding Checklist Item (Section 13)
router.put('/:id/onboarding/:itemKey', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const { is_completed, notes } = req.body;
  const clientId = req.params.id;
  const itemKey = req.params.itemKey;

  db.prepare(`
    UPDATE client_onboarding_checklists SET
      is_completed = ?,
      notes = coalesce(?, notes),
      completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
      completed_by = CASE WHEN ? = 1 THEN ? ELSE NULL END
    WHERE client_id = ? AND item_key = ?
  `).run(
    is_completed ? 1 : 0, notes || null, is_completed ? 1 : 0, is_completed ? 1 : 0, req.user.id, clientId, itemKey
  );

  // Check if all 17 items are completed; if so, transition status to ACTIVE if currently ONBOARDING
  const pending = db.prepare('SELECT COUNT(*) as count FROM client_onboarding_checklists WHERE client_id = ? AND is_completed = 0').get(clientId);
  if (pending.count === 0) {
    db.prepare("UPDATE clients SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ONBOARDING'").run(clientId);
  }

  logAudit({
    userId: req.user.id,
    action: 'ONBOARDING_UPDATED',
    entity: 'clients',
    entityId: clientId,
    newValue: { item_key: itemKey, is_completed },
    ip: req.ip
  });

  res.json({ message: 'Onboarding checklist updated successfully' });
});

// Assign Employee to Client (Section 16)
router.post('/:id/assignments', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const clientId = req.params.id;
  const { employee_id, employee_role, assignment_type, responsibilities } = req.body;

  if (!employee_id || !employee_role) {
    return res.status(400).json({ error: 'Employee and role are required.' });
  }

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const startDate = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO employee_assignments (
      client_id, employee_id, employee_role, assignment_type, start_date, responsibilities, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    clientId, employee_id, employee_role, assignment_type || 'PRIMARY', startDate, responsibilities || ''
  );

  // Also update primary manager field if role is Marketing Manager or Sales
  if (employee_role === 'Marketing Manager' || employee_role === 'Marketing & Social Media Manager') {
    db.prepare('UPDATE clients SET assigned_marketing_manager_id = ? WHERE id = ?').run(employee_id, clientId);
  } else if (employee_role === 'Sales') {
    db.prepare('UPDATE clients SET assigned_sales_employee_id = ? WHERE id = ?').run(employee_id, clientId);
  }

  createNotification({
    userId: emp.user_id,
    type: 'CLIENT_ASSIGNED',
    title: 'New Client Assignment',
    message: `You have been assigned to client as ${employee_role}.`,
    relatedEntity: 'clients',
    relatedEntityId: clientId
  });

  logAudit({
    userId: req.user.id,
    action: 'ASSIGNED',
    entity: 'client_assignments',
    entityId: result.lastInsertRowid,
    newValue: { client_id: clientId, employee_id, employee_role },
    ip: req.ip
  });

  res.status(201).json({ message: 'Employee assigned to client successfully' });
});

export default router;
