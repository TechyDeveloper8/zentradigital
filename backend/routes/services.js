import express from 'express';
import mongoose from 'mongoose';
import { ClientService, Client } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Services
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, status } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }

    if (status) query.status = status;

    const services = await ClientService.find(query)
      .populate('client_id')
      .sort({ created_at: -1 });

    const formatted = services.map(cs => ({
      ...cs.toJSON(),
      company_name: cs.client_id?.company_name || '',
      client_code: cs.client_id?.client_code || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error listing services:', err);
    res.status(500).json({ error: 'Failed to retrieve services.' });
  }
});

// Create Client Service
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      client_id, service_name, package_name, start_date, end_date,
      monthly_quantity, assigned_team_summary, sla, monthly_deliverables,
      price, billing_cycle, status
    } = req.body;

    if (!client_id || !service_name || price === undefined) {
      return res.status(400).json({ error: 'Client, service name, and price are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const newService = await ClientService.create({
      client_id,
      service_name,
      package_type: package_name || '',
      monthly_fee: Number(price) || 0,
      billing_cycle: billing_cycle || 'MONTHLY',
      status: status || 'ACTIVE',
      deliverables_summary: monthly_deliverables || assigned_team_summary || '',
      start_date: start_date ? new Date(start_date) : new Date(),
      end_date: end_date ? new Date(end_date) : null
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'client_services',
      entityId: newService._id,
      newValue: { client_id, service_name, price },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Service plan created successfully',
      service: {
        ...newService.toJSON(),
        company_name: client.company_name,
        client_code: client.client_code
      }
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

// Update Service
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = await ClientService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const {
      service_name, package_name, monthly_quantity, sla, monthly_deliverables,
      price, billing_cycle, status
    } = req.body;

    if (service_name !== undefined) service.service_name = service_name;
    if (package_name !== undefined) service.package_type = package_name;
    if (price !== undefined) service.monthly_fee = Number(price);
    if (billing_cycle !== undefined) service.billing_cycle = billing_cycle;
    if (status !== undefined) service.status = status;
    if (monthly_deliverables !== undefined) service.deliverables_summary = monthly_deliverables;

    await service.save();

    res.json({ message: 'Service updated successfully', service: service.toJSON() });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

export default router;
