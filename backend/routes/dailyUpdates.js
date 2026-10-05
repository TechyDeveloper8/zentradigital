import express from 'express';
import mongoose from 'mongoose';
import { DailyClientUpdate, Client } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Daily Updates for a Client
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, date } = req.query;

    let targetClientId = client_id;
    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.status(400).json({ error: 'Client record not found' });
      targetClientId = client._id;
    }

    const query = {};
    if (targetClientId && mongoose.Types.ObjectId.isValid(targetClientId)) {
      query.client_id = targetClientId;
    }
    if (date) {
      const d = new Date(date);
      const nextD = new Date(date);
      nextD.setDate(nextD.getDate() + 1);
      query.update_date = { $gte: d, $lt: nextD };
    }

    const updates = await DailyClientUpdate.find(query)
      .populate('client_id')
      .populate('sent_by_employee_id')
      .sort({ update_date: -1 })
      .limit(30);

    const formatted = updates.map(u => ({
      ...u.toJSON(),
      company_name: u.client_id?.company_name || '',
      approved_by_username: ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching daily client updates:', err);
    res.status(500).json({ error: 'Failed to retrieve daily updates.' });
  }
});

// Post / Update Client Daily Update
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const { client_id, update_date, completed_text, in_progress_text, pending_client_text } = req.body;

    if (!client_id || !completed_text) {
      return res.status(400).json({ error: 'Client ID and Completed Work text are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid Client ID.' });
    }

    const targetDate = update_date ? new Date(update_date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let updateDoc = await DailyClientUpdate.findOne({
      client_id,
      update_date: targetDate
    });

    if (updateDoc) {
      updateDoc.completed_work_summary = completed_text;
      updateDoc.plan_for_tomorrow = in_progress_text || '';
      updateDoc.urgent_approvals_needed = pending_client_text || '';
      await updateDoc.save();
    } else {
      updateDoc = await DailyClientUpdate.create({
        client_id,
        update_date: targetDate,
        completed_work_summary: completed_text,
        plan_for_tomorrow: in_progress_text || '',
        urgent_approvals_needed: pending_client_text || '',
        sent_by_employee_id: req.employee ? req.employee._id : null,
        status: 'SENT',
        sent_at: new Date()
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'POSTED',
      entity: 'daily_client_updates',
      newValue: { client_id, update_date: targetDate },
      ip: req.ip
    });

    res.status(201).json({ message: 'Daily client update posted successfully', update: updateDoc.toJSON() });
  } catch (err) {
    console.error('Error posting daily client update:', err);
    res.status(500).json({ error: 'Failed to post daily update.' });
  }
});

export default router;
