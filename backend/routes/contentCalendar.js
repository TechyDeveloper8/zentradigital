import express from 'express';
import mongoose from 'mongoose';
import { ContentItem, Client, Employee, User, Role, ContentReview, ContentPerformance } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Content Items with Calendar filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, platform, content_type, workflow_stage, start_date, end_date, search } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (req.user.role_name === 'editor' && req.employee) {
      query.$or = [
        { assigned_creator_id: req.employee._id },
        { assigned_creator_id: null }
      ];
    }

    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) query.client_id = client_id;
    if (platform) query.platform = platform;
    if (content_type) query.content_type = content_type;
    if (workflow_stage) query.workflow_stage = workflow_stage;

    if (start_date && end_date) {
      query.scheduled_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    let items = await ContentItem.find(query)
      .populate('client_id')
      .populate('assigned_creator_id')
      .populate('campaign_id')
      .sort({ scheduled_date: 1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(ci =>
        (ci.title && ci.title.toLowerCase().includes(s)) ||
        (ci.caption && ci.caption.toLowerCase().includes(s)) ||
        (ci.client_id?.company_name && ci.client_id.company_name.toLowerCase().includes(s))
      );
    }

    const formatted = items.map(ci => {
      const c = ci.client_id;
      const ed = ci.assigned_creator_id;
      const lastVersion = ci.versions && ci.versions.length > 0 ? ci.versions[ci.versions.length - 1] : null;

      return {
        ...ci.toJSON(),
        topic: ci.title,
        company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        marketing_manager_name: '',
        editor_name: ed ? `${ed.first_name} ${ed.last_name}` : '',
        assigned_employee_name: ed ? `${ed.first_name} ${ed.last_name}` : 'Agency Creative Team',
        current_preview_url: lastVersion?.asset_url || ci.media_url || '',
        current_file_name: ci.raw_file_name || '',
        publish_date: ci.scheduled_date,
        publish_time: ci.scheduled_time
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing content items:', err);
    res.status(500).json({ error: 'Failed to retrieve content items.' });
  }
});

// Single Content Item Detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const item = await ContentItem.findById(req.params.id)
      .populate('client_id')
      .populate('assigned_creator_id')
      .populate('campaign_id');

    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const reviews = await ContentReview.find({ content_id: item._id }).populate('reviewer_id');
    const performance = await ContentPerformance.find({ content_id: item._id }).sort({ record_date: -1 });

    const c = item.client_id;
    const ed = item.assigned_creator_id;

    const formattedItem = {
      ...item.toJSON(),
      topic: item.title,
      company_name: c?.company_name || '',
      client_code: c?.client_code || '',
      editor_name: ed ? `${ed.first_name} ${ed.last_name}` : '',
      publish_date: item.scheduled_date,
      publish_time: item.scheduled_time
    };

    const formattedVersions = (item.versions || []).map(v => ({
      ...v.toObject ? v.toObject() : v,
      submitted_by_user: ''
    }));

    const formattedReviews = reviews.map(r => ({
      ...r.toJSON(),
      reviewer_name: r.reviewer_id?.username || 'User'
    }));

    res.json({
      item: formattedItem,
      versions: formattedVersions,
      reviews: formattedReviews,
      performance: performance.map(p => p.toJSON())
    });
  } catch (err) {
    console.error('Error fetching content detail:', err);
    res.status(500).json({ error: 'Failed to retrieve content item.' });
  }
});

// Create Content Plan Item
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      client_id, project_id, campaign_id, platform, content_type, topic, title,
      caption, hashtags, cta, reference_url, assigned_editor_id, publish_date,
      publish_time, workflow_stage
    } = req.body;

    const finalTitle = topic || title;
    if (!client_id || !platform || !content_type || !finalTitle) {
      return res.status(400).json({ error: 'Client, platform, content type, and topic/title are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const initialStage = workflow_stage || (assigned_editor_id ? 'ASSIGNED' : 'PLANNED');

    const newItem = await ContentItem.create({
      title: finalTitle,
      client_id,
      campaign_id: campaign_id && mongoose.Types.ObjectId.isValid(campaign_id) ? campaign_id : null,
      assigned_creator_id: assigned_editor_id && mongoose.Types.ObjectId.isValid(assigned_editor_id) ? assigned_editor_id : null,
      platform: platform || 'Instagram',
      content_type: content_type || 'Reel',
      scheduled_date: publish_date ? new Date(publish_date) : null,
      scheduled_time: publish_time || '10:00',
      caption: caption || '',
      hashtags: hashtags || '',
      workflow_stage: initialStage
    });

    if (assigned_editor_id && mongoose.Types.ObjectId.isValid(assigned_editor_id)) {
      const editor = await Employee.findById(assigned_editor_id);
      if (editor?.user_id) {
        await createNotification({
          userId: editor.user_id,
          type: 'CONTENT_ASSIGNED',
          title: 'New Creative Task Assigned',
          message: `You were assigned ${content_type} for ${platform}: "${newItem.title}".`,
          relatedEntity: 'content_items',
          relatedEntityId: newItem._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'content',
      entityId: newItem._id,
      previousStage: null,
      newStage: initialStage,
      changedBy: req.user.id,
      remarks: 'Content planned'
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'content_items',
      entityId: newItem._id,
      newValue: { topic: newItem.title, platform, content_type },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Content item created successfully',
      content: { ...newItem.toJSON(), topic: newItem.title }
    });
  } catch (err) {
    console.error('Error creating content item:', err);
    res.status(500).json({ error: 'Failed to create content item.' });
  }
});

// Update Content Item
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const item = await ContentItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const {
      topic, title, caption, hashtags, assigned_editor_id,
      publish_date, publish_time, workflow_stage
    } = req.body;

    const prevStage = item.workflow_stage;
    const newStage = workflow_stage || item.workflow_stage;

    if (topic || title) item.title = topic || title;
    if (caption !== undefined) item.caption = caption;
    if (hashtags !== undefined) item.hashtags = hashtags;
    if (assigned_editor_id !== undefined) item.assigned_creator_id = mongoose.Types.ObjectId.isValid(assigned_editor_id) ? assigned_editor_id : null;
    if (publish_date !== undefined) item.scheduled_date = publish_date ? new Date(publish_date) : null;
    if (publish_time !== undefined) item.scheduled_time = publish_time;
    if (workflow_stage !== undefined) item.workflow_stage = newStage;

    await item.save();

    if (newStage !== prevStage) {
      await recordWorkflowHistory({
        entityType: 'content',
        entityId: item._id,
        previousStage: prevStage,
        newStage,
        changedBy: req.user.id,
        remarks: `Stage updated to ${newStage}`
      });

      await logAudit({
        userId: req.user.id,
        action: 'STAGE_CHANGED',
        entity: 'content_items',
        entityId: item._id,
        oldValue: { workflow_stage: prevStage },
        newValue: { workflow_stage: newStage },
        ip: req.ip
      });
    }

    res.json({ message: 'Content item updated successfully', content: { ...item.toJSON(), topic: item.title } });
  } catch (err) {
    console.error('Error updating content item:', err);
    res.status(500).json({ error: 'Failed to update content item.' });
  }
});

// Submit Content for Review
router.post('/:id/submit-review', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const item = await ContentItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const { caption, hashtags, notes } = req.body;
    if (caption !== undefined) item.caption = caption;
    if (hashtags !== undefined) item.hashtags = hashtags;
    item.workflow_stage = 'INTERNAL_REVIEW';
    item.review_status = 'PENDING';
    await item.save();

    // Notify Admins
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const adminUsers = await User.find({ role_id: adminRole._id });
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin._id,
          type: 'CONTENT_SUBMITTED',
          title: 'Content Submitted for Review 📝',
          message: `${req.user.username} submitted "${item.title}" for review.`,
          relatedEntity: 'content_items',
          relatedEntityId: item._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'content',
      entityId: item._id,
      previousStage: item.workflow_stage,
      newStage: 'INTERNAL_REVIEW',
      changedBy: req.user.id,
      remarks: `Submitted for review by ${req.user.username}: ${notes || 'Ready for review'}`
    });

    res.json({
      message: 'Content successfully submitted to Admin for review',
      content: { ...item.toJSON(), topic: item.title }
    });
  } catch (err) {
    console.error('Error submitting content review:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

export default router;
