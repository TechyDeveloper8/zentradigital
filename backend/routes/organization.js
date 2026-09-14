import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Organization Profile
router.get('/', authenticate, (req, res) => {
  const org = db.prepare('SELECT * FROM organizations LIMIT 1').get();
  const settings = db.prepare('SELECT * FROM system_settings WHERE org_id = ?').get(org?.id || 1);
  res.json({ organization: org, settings });
});

// Update Organization Profile
router.put('/', authenticate, requireRole(['admin']), (req, res) => {
  const {
    name, legal_name, logo, brand_logo_light, brand_logo_dark, website,
    email, phone, whatsapp_number, address, city, state, country, pin_code,
    gst_number, pan, cin, timezone, currency, financial_year_start, date_format,
    default_language, owner_name, primary_contact_email, primary_contact_phone
  } = req.body;

  const org = db.prepare('SELECT * FROM organizations LIMIT 1').get();
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const stmt = db.prepare(`
    UPDATE organizations SET
      name = coalesce(?, name),
      legal_name = coalesce(?, legal_name),
      logo = coalesce(?, logo),
      brand_logo_light = coalesce(?, brand_logo_light),
      brand_logo_dark = coalesce(?, brand_logo_dark),
      website = coalesce(?, website),
      email = coalesce(?, email),
      phone = coalesce(?, phone),
      whatsapp_number = coalesce(?, whatsapp_number),
      address = coalesce(?, address),
      city = coalesce(?, city),
      state = coalesce(?, state),
      country = coalesce(?, country),
      pin_code = coalesce(?, pin_code),
      gst_number = coalesce(?, gst_number),
      pan = coalesce(?, pan),
      cin = coalesce(?, cin),
      timezone = coalesce(?, timezone),
      currency = coalesce(?, currency),
      financial_year_start = coalesce(?, financial_year_start),
      date_format = coalesce(?, date_format),
      default_language = coalesce(?, default_language),
      owner_name = coalesce(?, owner_name),
      primary_contact_email = coalesce(?, primary_contact_email),
      primary_contact_phone = coalesce(?, primary_contact_phone),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    name, legal_name, logo, brand_logo_light, brand_logo_dark, website,
    email, phone, whatsapp_number, address, city, state, country, pin_code,
    gst_number, pan, cin, timezone, currency, financial_year_start, date_format,
    default_language, owner_name, primary_contact_email, primary_contact_phone,
    org.id
  );

  logAudit({
    userId: req.user.id,
    action: 'UPDATED',
    entity: 'organizations',
    entityId: org.id,
    oldValue: org,
    newValue: req.body,
    ip: req.ip
  });

  const updatedOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(org.id);
  res.json({ message: 'Organization profile updated successfully', organization: updatedOrg });
});

// Update System Settings
router.put('/settings', authenticate, requireRole(['admin']), (req, res) => {
  const {
    default_working_days, office_start_time, office_end_time, grace_period_minutes,
    attendance_rules, leave_rules, task_priority_rules, default_approval_rules
  } = req.body;

  const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  const stmt = db.prepare(`
    UPDATE system_settings SET
      default_working_days = coalesce(?, default_working_days),
      office_start_time = coalesce(?, office_start_time),
      office_end_time = coalesce(?, office_end_time),
      grace_period_minutes = coalesce(?, grace_period_minutes),
      attendance_rules = coalesce(?, attendance_rules),
      leave_rules = coalesce(?, leave_rules),
      task_priority_rules = coalesce(?, task_priority_rules),
      default_approval_rules = coalesce(?, default_approval_rules),
      updated_at = CURRENT_TIMESTAMP
    WHERE org_id = ?
  `);

  stmt.run(
    typeof default_working_days === 'object' ? JSON.stringify(default_working_days) : default_working_days,
    office_start_time, office_end_time, grace_period_minutes,
    typeof attendance_rules === 'object' ? JSON.stringify(attendance_rules) : attendance_rules,
    typeof leave_rules === 'object' ? JSON.stringify(leave_rules) : leave_rules,
    typeof task_priority_rules === 'object' ? JSON.stringify(task_priority_rules) : task_priority_rules,
    typeof default_approval_rules === 'object' ? JSON.stringify(default_approval_rules) : default_approval_rules,
    org.id
  );

  const updated = db.prepare('SELECT * FROM system_settings WHERE org_id = ?').get(org.id);
  res.json({ message: 'Business settings updated successfully', settings: updated });
});

export default router;
