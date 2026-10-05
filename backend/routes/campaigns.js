import express from 'express';
import mongoose from 'mongoose';
import { Campaign, Client, ContentItem } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Campaigns
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, status } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    }

    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }
    if (status) query.status = status;

    const campaigns = await Campaign.find(query)
      .populate('client_id')
      .sort({ created_at: -1 });

    const campIds = campaigns.map(c => c._id);
    const contentCounts = await ContentItem.aggregate([
      { $match: { campaign_id: { $in: campIds } } },
      { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(contentCounts.map(cc => [cc._id.toString(), cc.count]));

    const formatted = campaigns.map(c => {
      const cl = c.client_id;
      return {
        ...c.toJSON(),
        campaign_name: c.name,
        company_name: cl?.company_name || '',
        client_code: cl?.client_code || '',
        manager_name: '',
        content_count: countMap.get(c._id.toString()) || 0
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing campaigns:', err);
    res.status(500).json({ error: 'Failed to retrieve campaigns.' });
  }
});

// Create Campaign
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      campaign_name, name, client_id, objective, platform, start_date, end_date,
      budget, target_audience, status
    } = req.body;

    const finalName = campaign_name || name;
    if (!finalName || !client_id || !start_date) {
      return res.status(400).json({ error: 'Campaign name, client, and start date are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const newCamp = await Campaign.create({
      name: finalName,
      client_id,
      objective: objective || 'Brand Awareness',
      platforms: platform ? (Array.isArray(platform) ? platform : [platform]) : ['Meta (Instagram & Facebook)'],
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      budget: Number(budget) || 0,
      target_audience: target_audience || '',
      status: status || 'PLANNING'
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'campaigns',
      entityId: newCamp._id,
      newValue: { campaign_name: newCamp.name, client_id, budget },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: { ...newCamp.toJSON(), campaign_name: newCamp.name }
    });
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({ error: 'Failed to create campaign.' });
  }
});

// Update Campaign
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const camp = await Campaign.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const {
      campaign_name, name, objective, platform, start_date, end_date, budget, spent,
      target_audience, status
    } = req.body;

    if (campaign_name || name) camp.name = campaign_name || name;
    if (objective !== undefined) camp.objective = objective;
    if (platform !== undefined) camp.platforms = Array.isArray(platform) ? platform : [platform];
    if (start_date !== undefined) camp.start_date = new Date(start_date);
    if (end_date !== undefined) camp.end_date = end_date ? new Date(end_date) : null;
    if (budget !== undefined) camp.budget = Number(budget);
    if (spent !== undefined) camp.spent_amount = Number(spent);
    if (target_audience !== undefined) camp.target_audience = target_audience;
    if (status !== undefined) camp.status = status;

    await camp.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign: { ...camp.toJSON(), campaign_name: camp.name }
    });
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({ error: 'Failed to update campaign.' });
  }
});

export default router;
