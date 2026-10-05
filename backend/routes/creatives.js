import express from 'express';
import mongoose from 'mongoose';
import { ContentItem, Employee } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Upload New Creative Version
router.post('/upload-version/:contentId', authenticate, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { preview_url, file_name, file_path, caption_snapshot, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const content = await ContentItem.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const currentVersions = content.versions || [];
    const nextVersion = currentVersions.length + 1;

    const newVersion = {
      version_number: nextVersion,
      asset_url: preview_url || file_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      thumbnail_url: preview_url || null,
      change_notes: notes || '',
      uploaded_by: req.user._id,
      is_approved: false
    };

    content.versions.push(newVersion);
    const prevStage = content.workflow_stage;
    content.workflow_stage = 'INTERNAL_REVIEW';
    content.review_status = 'PENDING';
    await content.save();

    await recordWorkflowHistory({
      entityType: 'content',
      entityId: content._id,
      previousStage: prevStage,
      newStage: 'INTERNAL_REVIEW',
      changedBy: req.user.id,
      remarks: `Version ${nextVersion} uploaded by editor`
    });

    await logAudit({
      userId: req.user.id,
      action: 'VERSION_UPLOADED',
      entity: 'content_items',
      entityId: content._id,
      newValue: { version_number: nextVersion, file_name },
      ip: req.ip
    });

    res.status(201).json({
      message: `Version ${nextVersion} uploaded successfully for internal review`,
      content: content.toJSON()
    });
  } catch (err) {
    console.error('Error uploading creative version:', err);
    res.status(500).json({ error: 'Failed to upload creative version.' });
  }
});

export default router;
