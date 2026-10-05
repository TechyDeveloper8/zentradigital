import express from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { broadcast } from '../websocket.js';

const router = express.Router();

// Get Notifications for Current User
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false
    });

    res.json({
      notifications: notifications.map(n => n.toJSON()),
      unread_count: unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark Notification as Read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Notification.updateOne(
        { _id: req.params.id, user_id: req.user._id },
        { is_read: true }
      );
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark All Notifications as Read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user._id, is_read: false },
      { is_read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error reading all notifications:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// Clear All Notifications for Current User
router.delete('/clear-all', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({ user_id: req.user._id });
    res.json({ message: 'All personal notifications cleared successfully' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});

// Clear All Notifications Across ALL Roles (Global Reset)
router.post('/clear-all-roles', authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    broadcast({
      type: 'NOTIFICATIONS_CLEARED',
      message: 'All notifications have been cleared across all roles.',
      timestamp: new Date().toISOString()
    });
    res.json({
      message: 'All role notifications cleared successfully across the system.',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing all notifications:', err);
    res.status(500).json({ error: 'Failed to clear all notifications.' });
  }
});

router.delete('/clear-all-roles', authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    broadcast({
      type: 'NOTIFICATIONS_CLEARED',
      message: 'All notifications have been cleared across all roles.',
      timestamp: new Date().toISOString()
    });
    res.json({
      message: 'All role notifications cleared successfully across the system.',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing all notifications:', err);
    res.status(500).json({ error: 'Failed to clear all notifications.' });
  }
});

export default router;
