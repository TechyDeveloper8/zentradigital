import express from 'express';
import db, { logAudit, createNotification, recordWorkflowHistory } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Upload New Creative Version (Section 20 & 21)
router.post('/upload-version/:contentId', authenticate, (req, res) => {
  const contentId = req.params.contentId;
  const { preview_url, file_name, file_path, caption_snapshot, notes } = req.body;

  const content = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  if (!content) {
    return res.status(404).json({ error: 'Content item not found' });
  }

  // Determine next version number
  const latestVersion = db.prepare('SELECT MAX(version_number) as max_v FROM content_versions WHERE content_id = ?').get(contentId);
  const nextVersion = (latestVersion?.max_v || 0) + 1;

  const insertTransaction = db.transaction(() => {
    // 1. Insert Version Record
    db.prepare(`
      INSERT INTO content_versions (
        content_id, version_number, file_path, preview_url, file_name, caption_snapshot, notes, submitted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentId, nextVersion, file_path || null, preview_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      file_name || `creative-v${nextVersion}.png`, caption_snapshot || content.caption, notes || '', req.user.id
    );

    // 2. Update Content Item
    db.prepare(`
      UPDATE content_items SET
        current_version = ?,
        workflow_stage = 'INTERNAL_REVIEW',
        internal_approval_status = 'PENDING',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextVersion, contentId);

    // 3. Record workflow transition
    recordWorkflowHistory({
      entityType: 'content',
      entityId: contentId,
      previousStage: content.workflow_stage,
      newStage: 'INTERNAL_REVIEW',
      changedBy: req.user.id,
      remarks: `Version ${nextVersion} uploaded by editor`
    });

    // 4. Notify Marketing Manager
    if (content.assigned_marketing_manager_id) {
      const mm = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(content.assigned_marketing_manager_id);
      if (mm) {
        createNotification({
          userId: mm.user_id,
          type: 'INTERNAL_REVIEW_REQUESTED',
          title: `Creative Ready for Review (v${nextVersion})`,
          message: `Editor uploaded Version ${nextVersion} for "${content.topic}".`,
          relatedEntity: 'content_items',
          relatedEntityId: contentId
        });
      }
    }

    return nextVersion;
  });

  const versionNumber = insertTransaction();

  logAudit({
    userId: req.user.id,
    action: 'VERSION_UPLOADED',
    entity: 'content_items',
    entityId: contentId,
    newValue: { version_number: versionNumber, file_name },
    ip: req.ip
  });

  const updatedContent = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  res.status(201).json({ message: `Version ${versionNumber} uploaded successfully for internal review`, content: updatedContent });
});

export default router;
