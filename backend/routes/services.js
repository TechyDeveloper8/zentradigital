import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Services
router.get('/', authenticate, (req, res) => {
  const { client_id, status } = req.query;
  let sql = `
    SELECT cs.*, c.company_name, c.client_code
    FROM client_services cs
    JOIN clients c ON cs.client_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ?`;
    params.push(req.user.id);
  } else if (client_id) {
    sql += ` AND cs.client_id = ?`;
    params.push(client_id);
  }

  if (status) {
    sql += ` AND cs.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY cs.id DESC`;
  const services = db.prepare(sql).all(...params);
  res.json(services);
});

// Create Client Service (Section 14)
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    client_id, service_name, package_name, start_date, end_date,
    monthly_quantity, assigned_team_summary, sla, monthly_deliverables,
    price, billing_cycle, status
  } = req.body;

  if (!client_id || !service_name || price === undefined) {
    return res.status(400).json({ error: 'Client, service name, and price are required.' });
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  const result = db.prepare(`
    INSERT INTO client_services (
      client_id, service_name, package_name, start_date, end_date,
      monthly_quantity, assigned_team_summary, sla, monthly_deliverables,
      price, billing_cycle, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client_id, service_name, package_name || '', start_date || new Date().toISOString().split('T')[0],
    end_date || null, monthly_quantity || 1, assigned_team_summary || '', sla || '48 hours turnaround',
    monthly_deliverables || '', Number(price) || 0, billing_cycle || 'Monthly', status || 'ACTIVE'
  );

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'client_services',
    entityId: result.lastInsertRowid,
    newValue: { client_id, service_name, price },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM client_services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Service plan created successfully', service: created });
});

// Update Service
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const service = db.prepare('SELECT * FROM client_services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const {
    service_name, package_name, monthly_quantity, sla, monthly_deliverables,
    price, billing_cycle, status
  } = req.body;

  db.prepare(`
    UPDATE client_services SET
      service_name = coalesce(?, service_name),
      package_name = coalesce(?, package_name),
      monthly_quantity = coalesce(?, monthly_quantity),
      sla = coalesce(?, sla),
      monthly_deliverables = coalesce(?, monthly_deliverables),
      price = coalesce(?, price),
      billing_cycle = coalesce(?, billing_cycle),
      status = coalesce(?, status)
    WHERE id = ?
  `).run(
    service_name, package_name, monthly_quantity, sla, monthly_deliverables,
    price, billing_cycle, status, service.id
  );

  const updated = db.prepare('SELECT * FROM client_services WHERE id = ?').get(service.id);
  res.json({ message: 'Service updated successfully', service: updated });
});

export default router;
