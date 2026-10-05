import express from 'express';
import mongoose from 'mongoose';
import { Invoice, Payment, Contract, Client } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Invoices
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const { client_id, payment_status, search } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }

    if (payment_status) {
      query.payment_status = payment_status;
    }

    let invoices = await Invoice.find(query)
      .populate('client_id')
      .sort({ due_date: -1, created_at: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      invoices = invoices.filter(inv =>
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(s)) ||
        (inv.client_id?.company_name && inv.client_id.company_name.toLowerCase().includes(s))
      );
    }

    const formatted = invoices.map(inv => {
      const c = inv.client_id;
      return {
        ...inv.toJSON(),
        company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        primary_contact_email: c?.primary_contact_email || '',
        items: inv.items || []
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing invoices:', err);
    res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
});

// Single Invoice Detail
router.get('/invoices/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = await Invoice.findById(req.params.id).populate('client_id');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const payments = await Payment.find({ invoice_id: invoice._id }).sort({ payment_date: -1 });

    const c = invoice.client_id;
    const formattedInvoice = {
      ...invoice.toJSON(),
      company_name: c?.company_name || '',
      client_code: c?.client_code || '',
      address: c?.address || '',
      city: c?.city || '',
      state: c?.state || '',
      gst_number: c?.gst_number || '',
      pan: c?.pan || '',
      primary_contact_name: c?.primary_contact_name || '',
      primary_contact_phone: c?.primary_contact_phone || '',
      primary_contact_email: c?.primary_contact_email || ''
    };

    res.json({
      invoice: formattedInvoice,
      items: invoice.items || [],
      payments: payments.map(p => p.toJSON())
    });
  } catch (err) {
    console.error('Error fetching invoice detail:', err);
    res.status(500).json({ error: 'Failed to retrieve invoice.' });
  }
});

// Create Invoice
router.post('/invoices', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      client_id, contract_id, billing_period_start, billing_period_end,
      due_date, discount, tax, notes, items
    } = req.body;

    if (!client_id || !due_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Client, due date, and at least one item are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const count = await Invoice.countDocuments() + 1;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const subtotal = items.reduce((sum, it) => sum + (Number(it.rate || it.unit_price) * (Number(it.quantity) || 1)), 0);
    const numDiscount = Number(discount) || 0;
    const numTax = Number(tax) || 0;
    const total = (subtotal - numDiscount) + numTax;

    const lineItems = items.map(it => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.rate || it.unit_price) || 0,
      total_amount: Number(it.rate || it.unit_price) * (Number(it.quantity) || 1)
    }));

    const newInvoice = await Invoice.create({
      invoice_number,
      client_id,
      subtotal,
      discount_amount: numDiscount,
      tax_amount: numTax,
      total_amount: total,
      due_date: new Date(due_date),
      payment_status: 'SENT',
      paid_amount: 0,
      balance_due: total,
      notes: notes || '',
      items: lineItems
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'invoices',
      entityId: newInvoice._id,
      newValue: { invoice_number, total, client_id },
      ip: req.ip
    });

    res.status(201).json({ message: 'Invoice created successfully', invoice: newInvoice.toJSON() });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Failed to create invoice.' });
  }
});

// Record Payment
router.post('/payments', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { invoice_id, amount, payment_date, payment_method, reference_number, notes } = req.body;

    if (!invoice_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(invoice_id)) {
      return res.status(404).json({ error: 'Invalid invoice ID.' });
    }

    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const payAmount = Number(amount);
    const newPaidTotal = (invoice.paid_amount || 0) + payAmount;
    let newStatus = 'PARTIALLY_PAID';

    if (newPaidTotal >= invoice.total_amount) {
      newStatus = 'PAID';
    }

    await Payment.create({
      invoice_id: invoice._id,
      client_id: invoice.client_id,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      amount: payAmount,
      payment_mode: payment_method,
      transaction_reference: reference_number || '',
      notes: notes || ''
    });

    invoice.paid_amount = newPaidTotal;
    invoice.balance_due = Math.max(0, invoice.total_amount - newPaidTotal);
    invoice.payment_status = newStatus;
    await invoice.save();

    await logAudit({
      userId: req.user.id,
      action: 'PAYMENT_RECORDED',
      entity: 'invoices',
      entityId: invoice._id,
      newValue: { amount: payAmount, new_paid_total: newPaidTotal, status: newStatus },
      ip: req.ip
    });

    res.status(201).json({ message: 'Payment recorded successfully', payment_status: newStatus });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
});

// List Contracts
router.get('/contracts', authenticate, async (req, res) => {
  try {
    const { client_id } = req.query;

    const query = {};
    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }

    const contracts = await Contract.find(query).populate('client_id').sort({ end_date: -1 });

    const formatted = contracts.map(con => ({
      ...con.toJSON(),
      company_name: con.client_id?.company_name || '',
      client_code: con.client_id?.client_code || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error listing contracts:', err);
    res.status(500).json({ error: 'Failed to retrieve contracts.' });
  }
});

// Create Contract
router.post('/contracts', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      client_id, package_name, start_date, end_date, monthly_amount,
      billing_cycle, deliverables_summary, status
    } = req.body;

    if (!client_id || !package_name || !start_date || !end_date || !monthly_amount) {
      return res.status(400).json({ error: 'Client, package name, start/end dates, and monthly amount are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const count = await Contract.countDocuments() + 1;
    const contract_number = `CNT-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const newContract = await Contract.create({
      contract_number,
      client_id,
      title: package_name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      contract_value: Number(monthly_amount) * 12,
      billing_frequency: billing_cycle || 'MONTHLY',
      scope_summary: deliverables_summary || '',
      status: status || 'ACTIVE'
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'contracts',
      entityId: newContract._id,
      newValue: { contract_number, client_id, monthly_amount },
      ip: req.ip
    });

    res.status(201).json({ message: 'Contract created successfully', contract: newContract.toJSON() });
  } catch (err) {
    console.error('Error creating contract:', err);
    res.status(500).json({ error: 'Failed to create contract.' });
  }
});

export default router;
