import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Campaigns
router.get('/', authenticate, (req, res) => {
  const { client_id, status } = req.query;

  let sql = `
    SELECT c.*, cl.company_name, cl.client_code,
           m.first_name || ' ' || m.last_name as manager_name,
           (SELECT COUNT(*) FROM content_items WHERE campaign_id = c.id) as content_count
    FROM campaigns c
    JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN employees m ON c.assigned_manager_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    sql += ` AND cl.user_id = ?`;
    params.push(req.user.id);
  }

  if (client_id) {
    sql += ` AND c.client_id = ?`;
    params.push(client_id);
  }
  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY c.id DESC`;
  const campaigns = db.prepare(sql).all(...params);
  res.json(campaigns);
});

// Create Campaign (Section 35)
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    campaign_name, client_id, objective, platform, start_date, end_date,
    budget, target_audience, location, age_range, gender, creative_requirements,
    landing_page, assigned_manager_id, status
  } = req.body;

  if (!campaign_name || !client_id || !start_date) {
    return res.status(400).json({ error: 'Campaign name, client, and start date are required.' });
  }

  const mgrId = assigned_manager_id || (req.employee ? req.employee.id : null);

  const result = db.prepare(`
    INSERT INTO campaigns (
      campaign_name, client_id, objective, platform, start_date, end_date,
      budget, target_audience, location, age_range, gender, creative_requirements,
      landing_page, assigned_manager_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaign_name, client_id, objective || 'Brand Awareness', platform || 'Meta (Instagram & Facebook)',
    start_date, end_date || null, Number(budget) || 0, target_audience || '', location || '',
    age_range || '18-45', gender || 'All', creative_requirements || '', landing_page || '',
    mgrId, status || 'PLANNED'
  );

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'campaigns',
    entityId: result.lastInsertRowid,
    newValue: { campaign_name, client_id, budget },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Campaign created successfully', campaign: created });
});

// Update Campaign
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const {
    campaign_name, objective, platform, start_date, end_date, budget, spent,
    target_audience, location, age_range, gender, status
  } = req.body;

  db.prepare(`
    UPDATE campaigns SET
      campaign_name = coalesce(?, campaign_name),
      objective = coalesce(?, objective),
      platform = coalesce(?, platform),
      start_date = coalesce(?, start_date),
      end_date = coalesce(?, end_date),
      budget = coalesce(?, budget),
      spent = coalesce(?, spent),
      target_audience = coalesce(?, target_audience),
      location = coalesce(?, location),
      age_range = coalesce(?, age_range),
      gender = coalesce(?, gender),
      status = coalesce(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    campaign_name, objective, platform, start_date, end_date, budget, spent,
    target_audience, location, age_range, gender, status, campaign.id
  );

  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id);
  res.json({ message: 'Campaign updated successfully', campaign: updated });
});

export default router;
