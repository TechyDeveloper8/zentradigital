import express from 'express';
import mongoose from 'mongoose';
import { ContentPerformance, ContentItem } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Record / Update Content Performance
router.post('/record', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      content_id, client_id, platform, reach, impressions, likes, comments,
      shares, saves, views, clicks, leads_count, conversion_count, recorded_date
    } = req.body;

    if (!content_id || !platform) {
      return res.status(400).json({ error: 'Content item and platform are required.' });
    }

    let targetClientId = client_id;
    if (!targetClientId && mongoose.Types.ObjectId.isValid(content_id)) {
      const content = await ContentItem.findById(content_id);
      targetClientId = content?.client_id;
    }

    const numLikes = Number(likes) || 0;
    const numComments = Number(comments) || 0;
    const numShares = Number(shares) || 0;
    const numSaves = Number(saves) || 0;
    const numReach = Number(reach) || 0;

    const newPerf = await ContentPerformance.create({
      content_id: mongoose.Types.ObjectId.isValid(content_id) ? content_id : null,
      client_id: targetClientId && mongoose.Types.ObjectId.isValid(targetClientId) ? targetClientId : null,
      record_date: recorded_date ? new Date(recorded_date) : new Date(),
      reach: numReach,
      impressions: Number(impressions) || 0,
      likes: numLikes,
      comments: numComments,
      shares: numShares,
      saves: numSaves,
      video_views: Number(views) || 0,
      clicks: Number(clicks) || 0,
      conversions: Number(conversion_count) || 0,
      engagement_count: numLikes + numComments + numShares + numSaves
    });

    if (mongoose.Types.ObjectId.isValid(content_id)) {
      await ContentItem.findByIdAndUpdate(content_id, {
        workflow_stage: 'PUBLISHED',
        is_published: true,
        published_at: new Date()
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'PERFORMANCE_RECORDED',
      entity: 'content_performance',
      entityId: newPerf._id,
      newValue: { content_id, reach: numReach },
      ip: req.ip
    });

    res.status(201).json({ message: 'Performance metrics recorded successfully' });
  } catch (err) {
    console.error('Error recording performance:', err);
    res.status(500).json({ error: 'Failed to record performance metrics.' });
  }
});

// Get Performance Summary for a Client
router.get('/client/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.json({
        summary: { total_reach: 0, total_impressions: 0, total_likes: 0, total_comments: 0 },
        byPlatform: []
      });
    }

    const targetId = new mongoose.Types.ObjectId(clientId);

    const aggregates = await ContentPerformance.aggregate([
      { $match: { client_id: targetId } },
      {
        $group: {
          _id: null,
          total_reach: { $sum: '$reach' },
          total_impressions: { $sum: '$impressions' },
          total_likes: { $sum: '$likes' },
          total_comments: { $sum: '$comments' },
          total_shares: { $sum: '$shares' },
          total_saves: { $sum: '$saves' },
          total_views: { $sum: '$video_views' },
          total_clicks: { $sum: '$clicks' },
          total_conversions: { $sum: '$conversions' },
          content_ids: { $addToSet: '$content_id' }
        }
      }
    ]);

    const summary = aggregates.length > 0 ? {
      ...aggregates[0],
      total_content_tracked: aggregates[0].content_ids?.length || 0
    } : {
      total_reach: 0, total_impressions: 0, total_likes: 0, total_comments: 0,
      total_shares: 0, total_saves: 0, total_views: 0, total_clicks: 0,
      total_conversions: 0, total_content_tracked: 0
    };

    res.json({ summary, byPlatform: [] });
  } catch (err) {
    console.error('Error fetching performance summary:', err);
    res.status(500).json({ error: 'Failed to fetch performance summary.' });
  }
});

export default router;
