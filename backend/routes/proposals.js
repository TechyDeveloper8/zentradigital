import express from 'express';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Proposals
router.get('/', authenticate, (req, res) => {
  const { status, lead_id, search } = req.query;
  let sql = `
    SELECT p.*, l.lead_code, l.contact_person,
           e.first_name || ' ' || e.last_name as prepared_by_name
    FROM proposals p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN employees e ON p.prepared_by = e.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }
  if (lead_id) {
    sql += ` AND p.lead_id = ?`;
    params.push(lead_id);
  }
  if (search) {
    sql += ` AND (p.company_name LIKE ? OR p.proposal_number LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s);
  }

  sql += ` ORDER BY p.id DESC`;
  const proposals = db.prepare(sql).all(...params);
  res.json(proposals);
});

// Single Proposal
router.get('/:id', authenticate, (req, res) => {
  const proposal = db.prepare(`
    SELECT p.*, l.lead_code, l.contact_person, l.phone, l.email,
           e.first_name || ' ' || e.last_name as prepared_by_name
    FROM proposals p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN employees e ON p.prepared_by = e.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  res.json(proposal);
});

// Create Proposal (Section 11)
router.post('/', authenticate, requireRole(['admin', 'sales']), (req, res) => {
  const {
    lead_id, company_name, services_summary, package_name, quantity,
    price, discount, tax, proposal_valid_until, terms, notes
  } = req.body;

  if (!company_name || !services_summary || price === undefined) {
    return res.status(400).json({ error: 'Company name, services summary, and price are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM proposals').get().count + 1;
  const proposal_number = `PROP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const numPrice = Number(price) || 0;
  const numDiscount = Number(discount) || 0;
  const numTax = Number(tax) || 0;
  const numQty = Number(quantity) || 1;
  const subtotal = (numPrice * numQty) - numDiscount;
  const total = subtotal + numTax;

  const preparedBy = req.employee ? req.employee.id : null;

  const result = db.prepare(`
    INSERT INTO proposals (
      proposal_number, lead_id, company_name, services_summary, package_name,
      quantity, price, discount, tax, total, proposal_valid_until, terms, notes,
      prepared_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
  `).run(
    proposal_number, lead_id || null, company_name, services_summary, package_name || '',
    numQty, numPrice, numDiscount, numTax, total, proposal_valid_until || null,
    terms || 'Payment terms: 50% advance, 50% upon month end.', notes || '',
    preparedBy
  );

  const proposalId = result.lastInsertRowid;

  // If tied to lead, update lead status to PROPOSAL
  if (lead_id) {
    db.prepare("UPDATE leads SET status = 'PROPOSAL', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(lead_id);
  }

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'proposals',
    entityId: proposalId,
    newValue: { proposal_number, company_name, total },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
  res.status(201).json({ message: 'Proposal created successfully', proposal: created });
});

// Update Proposal Status (DRAFT -> SENT -> VIEWED -> NEGOTIATION -> ACCEPTED -> REJECTED)
router.put('/:id/status', authenticate, requireRole(['admin', 'sales']), (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  db.prepare('UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, proposal.id);

  // If ACCEPTED, convert or link to Client automatically if tied to lead and lead not yet converted
  let clientCreated = null;
  if (status === 'ACCEPTED' && proposal.lead_id) {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(proposal.lead_id);
    if (lead && !lead.converted_client_id) {
      const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count + 1;
      const client_code = `CL-${new Date().getFullYear()}-${String(clientCount).padStart(4, '0')}`;
      const startDate = new Date().toISOString().split('T')[0];

      const clientRes = db.prepare(`
        INSERT INTO clients (
          client_code, company_name, business_type, industry, website,
          city, state, primary_contact_name, primary_contact_designation,
          primary_contact_phone, primary_contact_whatsapp, primary_contact_email,
          assigned_sales_employee_id, status, start_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ONBOARDING', ?, ?)
      `).run(
        client_code, lead.company_name, lead.business_type, lead.industry, lead.website,
        lead.city || '', lead.state || '', lead.contact_person, lead.designation,
        lead.phone, lead.whatsapp || lead.phone, lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`,
        lead.assigned_sales_employee_id, startDate, `Created via accepted proposal ${proposal.proposal_number}`
      );

      const clientId = clientRes.lastInsertRowid;

      // Primary contact
      db.prepare(`
        INSERT INTO client_contacts (client_id, name, designation, phone, email, whatsapp, can_approve_content, can_create_requests)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1)
      `).run(clientId, lead.contact_person, lead.designation || 'Owner', lead.phone, lead.email, lead.whatsapp);

      // Onboarding checklist
      const checklistItems = [
        'profile_complete', 'logo_received', 'brand_guidelines', 'brand_colors',
        'fonts_received', 'social_media_links', 'social_credentials', 'website_details',
        'product_service_info', 'target_audience', 'competitors_added', 'location_service_area',
        'comm_preferences', 'approval_person_id', 'content_preferences', 'campaign_goals', 'package_confirmed'
      ];
      for (const item of checklistItems) {
        db.prepare('INSERT INTO client_onboarding_checklists (client_id, item_key, item_label) VALUES (?, ?, ?)').run(
          clientId, item, item.replace(/_/g, ' ')
        );
      }

      // Link lead
      db.prepare("UPDATE leads SET status = 'WON', converted_client_id = ? WHERE id = ?").run(clientId, lead.id);
      db.prepare("UPDATE proposals SET client_id = ? WHERE id = ?").run(clientId, proposal.id);

      clientCreated = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    }
  }

  logAudit({
    userId: req.user.id,
    action: 'STATUS_CHANGED',
    entity: 'proposals',
    entityId: proposal.id,
    oldValue: { status: proposal.status },
    newValue: { status },
    ip: req.ip
  });

  res.json({ message: `Proposal status updated to ${status}`, client: clientCreated });
});

export default router;
