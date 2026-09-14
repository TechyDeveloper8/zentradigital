import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Invoices
router.get('/invoices', authenticate, (req, res) => {
  const { client_id, payment_status, search } = req.query;

  let sql = `
    SELECT inv.*, c.company_name, c.client_code, c.primary_contact_email
    FROM invoices inv
    JOIN clients c ON inv.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ?`;
    params.push(req.user.id);
  } else if (client_id) {
    sql += ` AND inv.client_id = ?`;
    params.push(client_id);
  }

  if (payment_status) {
    sql += ` AND inv.payment_status = ?`;
    params.push(payment_status);
  }
  if (search) {
    sql += ` AND (inv.invoice_number LIKE ? OR c.company_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s);
  }

  sql += ` ORDER BY inv.due_date DESC, inv.id DESC`;
  const invoices = db.prepare(sql).all(...params);

  // Attach line items
  const stmtItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
  const populated = invoices.map(inv => ({
    ...inv,
    items: stmtItems.all(inv.id)
  }));

  res.json(populated);
});

// Single Invoice Detail
router.get('/invoices/:id', authenticate, (req, res) => {
  const invoice = db.prepare(`
    SELECT inv.*, c.company_name, c.client_code, c.address, c.city, c.state,
           c.gst_number, c.pan, c.primary_contact_name, c.primary_contact_phone, c.primary_contact_email
    FROM invoices inv
    JOIN clients c ON inv.client_id = c.id
    WHERE inv.id = ?
  `).get(req.params.id);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC').all(invoice.id);

  res.json({ invoice, items, payments });
});

// Create Invoice (Section 37)
router.post('/invoices', authenticate, requireRole(['admin']), (req, res) => {
  const {
    client_id, contract_id, billing_period_start, billing_period_end,
    due_date, discount, tax, notes, items
  } = req.body;

  if (!client_id || !due_date || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Client, due date, and at least one item are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count + 1;
  const invoice_number = `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const subtotal = items.reduce((sum, it) => sum + (Number(it.rate) * (Number(it.quantity) || 1)), 0);
  const numDiscount = Number(discount) || 0;
  const numTax = Number(tax) || 0;
  const total = (subtotal - numDiscount) + numTax;

  const insertTransaction = db.transaction(() => {
    const invRes = db.prepare(`
      INSERT INTO invoices (
        invoice_number, client_id, contract_id, billing_period_start,
        billing_period_end, subtotal, discount, tax, total, due_date,
        payment_status, paid_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 0, ?)
    `).run(
      invoice_number, client_id, contract_id || null, billing_period_start || null,
      billing_period_end || null, subtotal, numDiscount, numTax, total, due_date, notes || ''
    );

    const invoiceId = invRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const it of items) {
      const lineTotal = Number(it.rate) * (Number(it.quantity) || 1);
      insertItem.run(invoiceId, it.description, Number(it.quantity) || 1, Number(it.rate), lineTotal);
    }

    return invoiceId;
  });

  const invoiceId = insertTransaction();

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'invoices',
    entityId: invoiceId,
    newValue: { invoice_number, total, client_id },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  res.status(201).json({ message: 'Invoice created successfully', invoice: created });
});

// Record Payment
router.post('/payments', authenticate, requireRole(['admin']), (req, res) => {
  const { invoice_id, amount, payment_date, payment_method, reference_number, notes } = req.body;

  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required.' });
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const payAmount = Number(amount);
  const newPaidTotal = (invoice.paid_amount || 0) + payAmount;
  let newStatus = 'PARTIAL';

  if (newPaidTotal >= invoice.total) {
    newStatus = 'PAID';
  }

  const payTransaction = db.transaction(() => {
    // 1. Insert Payment
    db.prepare(`
      INSERT INTO payments (
        invoice_id, client_id, payment_date, amount, payment_method, reference_number, notes, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoice.id, invoice.client_id, payment_date || new Date().toISOString().split('T')[0],
      payAmount, payment_method, reference_number || '', notes || '', req.user.id
    );

    // 2. Update Invoice
    db.prepare(`
      UPDATE invoices SET
        paid_amount = ?,
        payment_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPaidTotal, newStatus, invoice.id);
  });

  payTransaction();

  logAudit({
    userId: req.user.id,
    action: 'PAYMENT_RECORDED',
    entity: 'invoices',
    entityId: invoice.id,
    newValue: { amount: payAmount, new_paid_total: newPaidTotal, status: newStatus },
    ip: req.ip
  });

  res.status(201).json({ message: 'Payment recorded successfully', payment_status: newStatus });
});

// List Contracts / Subscriptions (Section 38)
router.get('/contracts', authenticate, (req, res) => {
  const { client_id } = req.query;

  let sql = `
    SELECT con.*, c.company_name, c.client_code
    FROM contracts con
    JOIN clients c ON con.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ?`;
    params.push(req.user.id);
  } else if (client_id) {
    sql += ` AND con.client_id = ?`;
    params.push(client_id);
  }

  sql += ` ORDER BY con.end_date DESC`;
  const contracts = db.prepare(sql).all(...params);
  res.json(contracts);
});

// Create Contract
router.post('/contracts', authenticate, requireRole(['admin']), (req, res) => {
  const {
    client_id, package_name, services_json, start_date, end_date,
    monthly_amount, billing_cycle, deliverables_summary, renewal_date, status
  } = req.body;

  if (!client_id || !package_name || !start_date || !end_date || !monthly_amount) {
    return res.status(400).json({ error: 'Client, package name, start/end dates, and monthly amount are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM contracts').get().count + 1;
  const contract_code = `CNT-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO contracts (
      contract_code, client_id, package_name, services_json, start_date, end_date,
      monthly_amount, billing_cycle, deliverables_summary, renewal_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    contract_code, client_id, package_name,
    typeof services_json === 'object' ? JSON.stringify(services_json) : services_json || '',
    start_date, end_date, Number(monthly_amount), billing_cycle || 'Monthly',
    deliverables_summary || '', renewal_date || end_date, status || 'ACTIVE'
  );

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'contracts',
    entityId: result.lastInsertRowid,
    newValue: { contract_code, client_id, monthly_amount },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Contract created successfully', contract: created });
});

export default router;
