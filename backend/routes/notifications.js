import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Notifications for Current User
router.get('/', authenticate, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(req.user.id).count;

  res.json({ notifications, unread_count: unreadCount });
});

// Mark Notification as Read
router.put('/:id/read', authenticate, (req, res) => {
  db.prepare(`
    UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);

  res.json({ message: 'Marked as read' });
});

// Mark All Notifications as Read
router.put('/read-all', authenticate, (req, res) => {
  db.prepare(`
    UPDATE notifications SET is_read = 1 WHERE user_id = ?
  `).run(req.user.id);

  res.json({ message: 'All notifications marked as read' });
});

export default router;
