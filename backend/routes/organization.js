import express from 'express';
import { Organization } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Organization Profile
router.get('/', authenticate, async (req, res) => {
  try {
    let org = await Organization.findOne();
    if (!org) {
      org = await Organization.create({
        name: 'Zentra Digital Agency',
        legal_name: 'Zentra Digital Private Limited',
        country: 'India'
      });
    }

    const orgJson = org.toJSON();
    const settings = orgJson.settings || {};

    res.json({ organization: orgJson, settings });
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ error: 'Failed to retrieve organization profile.' });
  }
});

// Update Organization Profile
router.put('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    let org = await Organization.findOne();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const oldVal = org.toJSON();

    const allowedFields = [
      'name', 'legal_name', 'logo', 'brand_logo_light', 'brand_logo_dark', 'website',
      'email', 'phone', 'whatsapp_number', 'address', 'city', 'state', 'country', 'pin_code',
      'gst_number', 'pan', 'cin', 'timezone', 'currency', 'financial_year_start', 'date_format',
      'default_language', 'owner_name', 'primary_contact_email', 'primary_contact_phone'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        org[field] = req.body[field];
      }
    }

    await org.save();

    await logAudit({
      userId: req.user.id,
      action: 'UPDATED',
      entity: 'organizations',
      entityId: org._id,
      oldValue: oldVal,
      newValue: req.body,
      ip: req.ip
    });

    res.json({ message: 'Organization profile updated successfully', organization: org.toJSON() });
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ error: 'Failed to update organization profile.' });
  }
});

// Update System Settings
router.put('/settings', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    let org = await Organization.findOne();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!org.settings) {
      org.settings = {};
    }

    const {
      default_working_days, office_start_time, office_end_time, grace_period_minutes,
      attendance_rules, leave_rules, task_priority_rules, default_approval_rules
    } = req.body;

    if (default_working_days !== undefined) org.settings.default_working_days = default_working_days;
    if (office_start_time !== undefined) org.settings.office_start_time = office_start_time;
    if (office_end_time !== undefined) org.settings.office_end_time = office_end_time;
    if (grace_period_minutes !== undefined) org.settings.grace_period_minutes = grace_period_minutes;
    if (attendance_rules !== undefined) org.settings.attendance_rules = attendance_rules;
    if (leave_rules !== undefined) org.settings.leave_rules = leave_rules;
    if (task_priority_rules !== undefined) org.settings.task_priority_rules = task_priority_rules;
    if (default_approval_rules !== undefined) org.settings.default_approval_rules = default_approval_rules;

    await org.save();

    res.json({ message: 'Business settings updated successfully', settings: org.settings });
  } catch (err) {
    console.error('Error updating system settings:', err);
    res.status(500).json({ error: 'Failed to update system settings.' });
  }
});

export default router;
