import express from 'express';
import mongoose from 'mongoose';
import { AuditLog } from '../models/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Query Audit Logs
router.get('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { entity, action, user_id, start_date, end_date } = req.query;

    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) query.user_id = user_id;

    if (start_date && end_date) {
      query.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const logs = await AuditLog.find(query)
      .populate({
        path: 'user_id',
        populate: { path: 'role_id' }
      })
      .sort({ created_at: -1 })
      .limit(100);

    const formatted = logs.map(al => {
      const u = al.user_id;
      const r = u?.role_id;
      return {
        ...al.toJSON(),
        username: u?.username || '',
        email: u?.email || '',
        role_name: r?.name || ''
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error querying audit logs:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
