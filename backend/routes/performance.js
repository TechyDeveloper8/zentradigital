import express from 'express';
import db, { logAudit } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Record / Update Content Performance (Section 34)
router.post('/record', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    content_id, client_id, platform, reach, impressions, likes, comments,
    shares, saves, views, clicks, leads_count, conversion_count, recorded_date
  } = req.body;

  if (!content_id || !platform) {
    return res.status(400).json({ error: 'Content item and platform are required.' });
  }

  const content = db.prepare('SELECT client_id FROM content_items WHERE id = ?').get(content_id);
  const targetClientId = client_id || content?.client_id;
  const date = recorded_date || new Date().toISOString().split('T')[0];

  const numLikes = Number(likes) || 0;
  const numComments = Number(comments) || 0;
  const numShares = Number(shares) || 0;
  const numSaves = Number(saves) || 0;
  const numReach = Number(reach) || 0;
  const totalEngagement = numLikes + numComments + numShares + numSaves;
  const engagementRate = numReach > 0 ? Math.round((totalEngagement / numReach) * 1000) / 10 : 0;

  const result = db.prepare(`
    INSERT INTO content_performance (
      content_id, client_id, platform, reach, impressions, likes, comments,
      shares, saves, views, engagement_rate, clicks, leads_count, conversion_count, recorded_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    content_id, targetClientId, platform, numReach, Number(impressions) || 0,
    numLikes, numComments, numShares, numSaves, Number(views) || 0,
    engagementRate, Number(clicks) || 0, Number(leads_count) || 0, Number(conversion_count) || 0, date
  );

  // Mark content as PUBLISHED if not already
  db.prepare(`
    UPDATE content_items SET
      workflow_stage = 'PUBLISHED',
      publishing_status = 'PUBLISHED',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(content_id);

  logAudit({
    userId: req.user.id,
    action: 'PERFORMANCE_RECORDED',
    entity: 'content_performance',
    entityId: result.lastInsertRowid,
    newValue: { content_id, reach: numReach, engagement_rate: engagementRate },
    ip: req.ip
  });

  res.status(201).json({ message: 'Performance metrics recorded successfully' });
});

// Get Performance Summary for a Client
router.get('/client/:clientId', authenticate, (req, res) => {
  const clientId = req.params.clientId;

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(reach), 0) as total_reach,
      COALESCE(SUM(impressions), 0) as total_impressions,
      COALESCE(SUM(likes), 0) as total_likes,
      COALESCE(SUM(comments), 0) as total_comments,
      COALESCE(SUM(shares), 0) as total_shares,
      COALESCE(SUM(saves), 0) as total_saves,
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(leads_count), 0) as total_leads,
      COALESCE(SUM(conversion_count), 0) as total_conversions,
      COUNT(DISTINCT content_id) as total_content_tracked
    FROM content_performance
    WHERE client_id = ?
  `).get(clientId);

  const byPlatform = db.prepare(`
    SELECT platform,
           SUM(reach) as reach,
           SUM(likes + comments + shares + saves) as engagement,
           COUNT(*) as posts_count
    FROM content_performance
    WHERE client_id = ?
    GROUP BY platform
  `).all(clientId);

  res.json({ summary, byPlatform });
});

export default router;
