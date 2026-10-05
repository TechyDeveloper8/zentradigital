import express from 'express';
import mongoose from 'mongoose';
import { ContentItem, ContentReview, Client, Employee } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Pending Reviews (Manager or Client)
router.get('/pending', authenticate, async (req, res) => {
  try {
    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) {
        return res.json([]);
      }
      query.client_id = client._id;
      query.workflow_stage = { $in: ['CLIENT REVIEW', 'CLIENT_REVIEW'] };
    } else {
      query.workflow_stage = { $in: ['INTERNAL REVIEW', 'INTERNAL_REVIEW', 'CLIENT REVIEW', 'CLIENT_REVIEW'] };
    }

    const items = await ContentItem.find(query)
      .populate('client_id')
      .populate('assigned_creator_id')
      .sort({ scheduled_date: 1 });

    const formatted = items.map(ci => {
      const c = ci.client_id;
      const ed = ci.assigned_creator_id;
      const lastVersion = ci.versions && ci.versions.length > 0 ? ci.versions[ci.versions.length - 1] : null;

      return {
        ...ci.toJSON(),
        company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        editor_name: ed ? `${ed.first_name} ${ed.last_name}` : '',
        current_preview_url: lastVersion?.asset_url || ci.media_url || '',
        version_number: lastVersion?.version_number || 1
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching pending reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve pending reviews.' });
  }
});

// Internal Review Action
router.post('/internal/:contentId', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, reason, comment } = req.body; // 'APPROVE' or 'REQUEST_CHANGES'

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const content = await ContentItem.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    await ContentReview.create({
      content_id: content._id,
      reviewer_id: req.user._id,
      review_stage: 'INTERNAL',
      decision: action === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED',
      feedback: comment || reason || ''
    });

    const prevStage = content.workflow_stage;
    if (action === 'APPROVE') {
      content.workflow_stage = 'CLIENT_REVIEW';
      content.review_status = 'APPROVED_INTERNAL';
      await content.save();

      await recordWorkflowHistory({
        entityType: 'content',
        entityId: content._id,
        previousStage: prevStage,
        newStage: 'CLIENT_REVIEW',
        changedBy: req.user.id,
        remarks: 'Approved internally by marketing manager, sent to client for approval'
      });

      const client = await Client.findById(content.client_id);
      if (client && client.user_id) {
        await createNotification({
          userId: client.user_id,
          type: 'CLIENT_REVIEW_REQUESTED',
          title: 'New Creative Waiting for Approval',
          message: `Your agency team submitted "${content.title}" for review and approval.`,
          relatedEntity: 'content_items',
          relatedEntityId: content._id
        });
      }
    } else {
      content.workflow_stage = 'REVISION';
      content.review_status = 'REVISION_REQUESTED';
      content.admin_feedback = comment || reason || '';
      await content.save();

      await recordWorkflowHistory({
        entityType: 'content',
        entityId: content._id,
        previousStage: prevStage,
        newStage: 'REVISION',
        changedBy: req.user.id,
        remarks: `Internal revision requested: ${comment || reason}`
      });

      if (content.assigned_creator_id) {
        const editor = await Employee.findById(content.assigned_creator_id);
        if (editor && editor.user_id) {
          await createNotification({
            userId: editor.user_id,
            type: 'REVISION_REQUESTED',
            title: 'Internal Revision Requested',
            message: `Manager requested changes for "${content.title}": ${comment || reason}`,
            relatedEntity: 'content_items',
            relatedEntityId: content._id
          });
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      action: action === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUESTED',
      entity: 'content_items',
      entityId: content._id,
      newValue: { reviewer: 'INTERNAL', action, comment },
      ip: req.ip
    });

    res.json({ message: `Internal review submitted: ${action}`, content: content.toJSON() });
  } catch (err) {
    console.error('Error in internal review:', err);
    res.status(500).json({ error: 'Failed to process internal review.' });
  }
});

// Client Review Action
router.post('/client/:contentId', authenticate, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { action, reason, comment, specific_change, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const content = await ContentItem.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client || client._id.toString() !== content.client_id.toString()) {
        return res.status(403).json({ error: 'Access denied: You can only review your own content.' });
      }
    }

    await ContentReview.create({
      content_id: content._id,
      reviewer_id: req.user._id,
      review_stage: 'CLIENT',
      decision: action === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED',
      feedback: specific_change || comment || reason || ''
    });

    const prevStage = content.workflow_stage;
    if (action === 'APPROVE') {
      content.workflow_stage = 'APPROVED';
      content.review_status = 'APPROVED_BY_CLIENT';
      content.client_feedback = 'Approved by client: Ready for social media publishing';
      await content.save();

      await recordWorkflowHistory({
        entityType: 'content',
        entityId: content._id,
        previousStage: prevStage,
        newStage: 'APPROVED',
        changedBy: req.user.id,
        remarks: 'Approved by client: Ready for social media publishing'
      });

      if (content.assigned_creator_id) {
        const creator = await Employee.findById(content.assigned_creator_id);
        if (creator && creator.user_id) {
          await createNotification({
            userId: creator.user_id,
            type: 'CLIENT_APPROVED',
            title: 'Creative Approved by Client! 🎉',
            message: `Client approved "${content.title}". It is now ready for publishing.`,
            relatedEntity: 'content_items',
            relatedEntityId: content._id
          });
        }
      }
    } else {
      const feedbackNote = specific_change || comment || reason || 'Client requested revisions';
      content.workflow_stage = 'REVISION';
      content.review_status = 'REVISION_REQUESTED';
      content.client_feedback = feedbackNote;
      await content.save();

      await recordWorkflowHistory({
        entityType: 'content',
        entityId: content._id,
        previousStage: prevStage,
        newStage: 'REVISION',
        changedBy: req.user.id,
        remarks: `Client revision note: ${feedbackNote}`
      });

      if (content.assigned_creator_id) {
        const creator = await Employee.findById(content.assigned_creator_id);
        if (creator && creator.user_id) {
          await createNotification({
            userId: creator.user_id,
            type: 'REVISION_REQUESTED',
            title: `Client Revision Note on "${content.title}" ⚠️`,
            message: `Client requested revisions: "${feedbackNote}"`,
            relatedEntity: 'content_items',
            relatedEntityId: content._id
          });
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      action: action === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUESTED',
      entity: 'content_items',
      entityId: content._id,
      newValue: { reviewer: 'CLIENT', action, specific_change },
      ip: req.ip
    });

    res.json({ message: `Client review recorded: ${action}`, content: content.toJSON() });
  } catch (err) {
    console.error('Error in client review:', err);
    res.status(500).json({ error: 'Failed to record client review.' });
  }
});

export default router;
