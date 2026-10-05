import express from 'express';
import mongoose from 'mongoose';
import { Proposal, Lead, Client, Employee } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Proposals
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, lead_id, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) query.lead_id = lead_id;

    let proposals = await Proposal.find(query)
      .populate('lead_id')
      .populate('created_by')
      .sort({ created_at: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      proposals = proposals.filter(p =>
        (p.title && p.title.toLowerCase().includes(s)) ||
        (p.proposal_code && p.proposal_code.toLowerCase().includes(s)) ||
        (p.lead_id?.company_name && p.lead_id.company_name.toLowerCase().includes(s))
      );
    }

    const formatted = proposals.map(p => {
      const l = p.lead_id;
      const u = p.created_by;
      return {
        ...p.toJSON(),
        proposal_number: p.proposal_code,
        lead_code: l?.lead_code || '',
        contact_person: l?.contact_person || '',
        company_name: l?.company_name || p.title || '',
        total: p.final_amount || p.total_amount || 0,
        prepared_by_name: u?.username || ''
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing proposals:', err);
    res.status(500).json({ error: 'Failed to retrieve proposals.' });
  }
});

// Single Proposal
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = await Proposal.findById(req.params.id)
      .populate('lead_id')
      .populate('created_by');

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const l = proposal.lead_id;
    const u = proposal.created_by;

    const formatted = {
      ...proposal.toJSON(),
      proposal_number: proposal.proposal_code,
      company_name: l?.company_name || proposal.title || '',
      lead_code: l?.lead_code || '',
      contact_person: l?.contact_person || '',
      phone: l?.phone || '',
      email: l?.email || '',
      total: proposal.final_amount || proposal.total_amount || 0,
      prepared_by_name: u?.username || ''
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching proposal detail:', err);
    res.status(500).json({ error: 'Failed to retrieve proposal.' });
  }
});

// Create Proposal
router.post('/', authenticate, requireRole(['admin', 'sales']), async (req, res) => {
  try {
    const {
      lead_id, company_name, services_summary, package_name, quantity,
      price, discount, tax, proposal_valid_until, terms, notes
    } = req.body;

    if (!company_name || !services_summary || price === undefined) {
      return res.status(400).json({ error: 'Company name, services summary, and price are required.' });
    }

    const count = await Proposal.countDocuments() + 1;
    const proposal_code = `PROP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const numPrice = Number(price) || 0;
    const numDiscount = Number(discount) || 0;
    const numTax = Number(tax) || 0;
    const numQty = Number(quantity) || 1;
    const subtotal = (numPrice * numQty) - numDiscount;
    const total = subtotal + numTax;

    const newProposal = await Proposal.create({
      proposal_code,
      lead_id: lead_id && mongoose.Types.ObjectId.isValid(lead_id) ? lead_id : null,
      title: `${company_name} - ${package_name || 'Marketing Proposal'}`,
      scope_of_work: services_summary,
      total_amount: subtotal,
      discount_amount: numDiscount,
      tax_amount: numTax,
      final_amount: total,
      valid_until: proposal_valid_until ? new Date(proposal_valid_until) : null,
      status: 'DRAFT',
      created_by: req.user._id,
      items: [
        {
          item_name: package_name || services_summary,
          description: services_summary,
          quantity: numQty,
          unit_price: numPrice,
          amount: numPrice * numQty
        }
      ]
    });

    if (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) {
      await Lead.findByIdAndUpdate(lead_id, { status: 'PROPOSAL' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'proposals',
      entityId: newProposal._id,
      newValue: { proposal_code, company_name, total },
      ip: req.ip
    });

    const retObj = {
      ...newProposal.toJSON(),
      proposal_number: proposal_code,
      company_name,
      total
    };

    res.status(201).json({ message: 'Proposal created successfully', proposal: retObj });
  } catch (err) {
    console.error('Error creating proposal:', err);
    res.status(500).json({ error: 'Failed to create proposal.' });
  }
});

// Update Proposal Status
router.put('/:id/status', authenticate, requireRole(['admin', 'sales']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const oldStatus = proposal.status;
    proposal.status = status;
    await proposal.save();

    let clientCreated = null;
    if (status === 'ACCEPTED' && proposal.lead_id) {
      const lead = await Lead.findById(proposal.lead_id);
      if (lead && !lead.converted_client_id) {
        const clientCount = await Client.countDocuments() + 1;
        const client_code = `CL-${new Date().getFullYear()}-${String(clientCount).padStart(4, '0')}`;

        const newClient = await Client.create({
          client_code,
          company_name: lead.company_name,
          industry: lead.industry || '',
          website: lead.website || '',
          address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          primary_contact_name: lead.contact_person,
          primary_contact_designation: lead.designation || 'Director',
          primary_contact_phone: lead.phone,
          primary_contact_email: lead.email || `${lead.contact_person.toLowerCase().replace(/\s+/g, '')}@client.com`,
          account_manager_id: lead.assigned_sales_employee_id,
          status: 'ONBOARDING',
          start_date: new Date(),
          contacts: [
            {
              name: lead.contact_person,
              designation: lead.designation || 'Owner',
              phone: lead.phone,
              email: lead.email || '',
              is_primary: true
            }
          ]
        });

        lead.status = 'WON';
        lead.converted_client_id = newClient._id;
        await lead.save();

        proposal.client_id = newClient._id;
        await proposal.save();

        clientCreated = newClient.toJSON();
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGED',
      entity: 'proposals',
      entityId: proposal._id,
      oldValue: { status: oldStatus },
      newValue: { status },
      ip: req.ip
    });

    res.json({ message: `Proposal status updated to ${status}`, client: clientCreated });
  } catch (err) {
    console.error('Error updating proposal status:', err);
    res.status(500).json({ error: 'Failed to update proposal status.' });
  }
});

export default router;
