import express from 'express';
import db, { logAudit, createNotification, recordWorkflowHistory } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Pending Reviews (Manager or Client)
router.get('/pending', authenticate, (req, res) => {
  let sql = `
    SELECT ci.*, c.company_name, c.client_code,
           p.project_name,
           ed.first_name || ' ' || ed.last_name as editor_name,
           cv.preview_url as current_preview_url,
           cv.file_name as current_file_name,
           cv.version_number
    FROM content_items ci
    JOIN clients c ON ci.client_id = c.id
    LEFT JOIN projects p ON ci.project_id = p.id
    LEFT JOIN employees ed ON ci.assigned_editor_id = ed.id
    LEFT JOIN content_versions cv ON cv.content_id = ci.id AND cv.version_number = ci.current_version
    WHERE 1=1
  `;
  const params = [];

  if (req.user.user_type === 'client') {
    // Client sees items waiting for client review
    sql += ` AND c.user_id = ? AND ci.workflow_stage = 'CLIENT_REVIEW'`;
    params.push(req.user.id);
  } else {
    // Internal team sees items waiting for internal review or client review
    sql += ` AND ci.workflow_stage IN ('INTERNAL_REVIEW', 'CLIENT_REVIEW')`;
  }

  sql += ` ORDER BY ci.publish_date ASC`;
  const pending = db.prepare(sql).all(...params);
  res.json(pending);
});

// Internal Review Action (Manager/Admin approves to send to Client OR requests revision)
router.post('/internal/:contentId', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const contentId = req.params.contentId;
  const { action, reason, comment } = req.body; // 'APPROVE' or 'REQUEST_CHANGES'

  const content = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  if (!content) {
    return res.status(404).json({ error: 'Content item not found' });
  }

  const reviewTransaction = db.transaction(() => {
    // Record review
    db.prepare(`
      INSERT INTO content_reviews (
        content_id, version_number, reviewer_user_id, reviewer_type, action, reason, comment
      ) VALUES (?, ?, ?, 'INTERNAL', ?, ?, ?)
    `).run(contentId, content.current_version, req.user.id, action, reason || '', comment || '');

    if (action === 'APPROVE') {
      // Advance to CLIENT_REVIEW
      db.prepare(`
        UPDATE content_items SET
          internal_approval_status = 'APPROVED',
          workflow_stage = 'CLIENT_REVIEW',
          client_approval_status = 'PENDING',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(contentId);

      recordWorkflowHistory({
        entityType: 'content',
        entityId: contentId,
        previousStage: 'INTERNAL_REVIEW',
        newStage: 'CLIENT_REVIEW',
        changedBy: req.user.id,
        remarks: 'Approved internally by marketing manager, sent to client for approval'
      });

      // Notify Client user if linked
      const client = db.prepare('SELECT user_id, company_name FROM clients WHERE id = ?').get(content.client_id);
      if (client && client.user_id) {
        createNotification({
          userId: client.user_id,
          type: 'CLIENT_REVIEW_REQUESTED',
          title: 'New Creative Waiting for Approval',
          message: `Your agency team submitted "${content.topic}" for review and approval.`,
          relatedEntity: 'content_items',
          relatedEntityId: contentId
        });
      }
    } else {
      // Revert to REVISION for editor
      db.prepare(`
        UPDATE content_items SET
          internal_approval_status = 'REVISION_REQUESTED',
          workflow_stage = 'REVISION',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(contentId);

      recordWorkflowHistory({
        entityType: 'content',
        entityId: contentId,
        previousStage: 'INTERNAL_REVIEW',
        newStage: 'REVISION',
        changedBy: req.user.id,
        remarks: `Internal revision requested: ${comment || reason}`
      });

      if (content.assigned_editor_id) {
        const editor = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(content.assigned_editor_id);
        if (editor) {
          createNotification({
            userId: editor.user_id,
            type: 'REVISION_REQUESTED',
            title: 'Internal Revision Requested',
            message: `Manager requested changes for "${content.topic}": ${comment || reason}`,
            relatedEntity: 'content_items',
            relatedEntityId: contentId
          });
        }
      }
    }
  });

  reviewTransaction();

  logAudit({
    userId: req.user.id,
    action: action === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUESTED',
    entity: 'content_items',
    entityId: contentId,
    newValue: { reviewer: 'INTERNAL', action, comment },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  res.json({ message: `Internal review submitted: ${action}`, content: updated });
});

// Client Review Action (Section 21: Client APPROVE or REQUEST_CHANGES)
router.post('/client/:contentId', authenticate, (req, res) => {
  const contentId = req.params.contentId;
  const { action, reason, comment, specific_change, priority, attachment_url } = req.body;

  const content = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  if (!content) {
    return res.status(404).json({ error: 'Content item not found' });
  }

  // Verify client owns this item if client user
  if (req.user.user_type === 'client') {
    const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.id);
    if (!client || client.id !== content.client_id) {
      return res.status(403).json({ error: 'Access denied: You can only review your own content.' });
    }
  }

  const reviewTransaction = db.transaction(() => {
    // 1. Record Review
    db.prepare(`
      INSERT INTO content_reviews (
        content_id, version_number, reviewer_user_id, reviewer_type, action,
        reason, comment, specific_change, attachment_url, priority
      ) VALUES (?, ?, ?, 'CLIENT', ?, ?, ?, ?, ?, ?)
    `).run(
      contentId, content.current_version, req.user.id, action,
      reason || '', comment || '', specific_change || '', attachment_url || null, priority || 'MEDIUM'
    );

    if (action === 'APPROVE') {
      // 2. Client Approved -> eligible for scheduling / publishing
      db.prepare(`
        UPDATE content_items SET
          client_approval_status = 'APPROVED',
          workflow_stage = 'APPROVED',
          publishing_status = 'SCHEDULED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(contentId);

      recordWorkflowHistory({
        entityType: 'content',
        entityId: contentId,
        previousStage: 'CLIENT_REVIEW',
        newStage: 'APPROVED',
        changedBy: req.user.id,
        remarks: 'Approved by client'
      });

      // Notify marketing manager & editor
      if (content.assigned_marketing_manager_id) {
        const mm = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(content.assigned_marketing_manager_id);
        if (mm) {
          createNotification({
            userId: mm.user_id,
            type: 'CLIENT_APPROVED',
            title: 'Creative Approved by Client! 🎉',
            message: `Client approved "${content.topic}". It is now ready to schedule.`,
            relatedEntity: 'content_items',
            relatedEntityId: contentId
          });
        }
      }
    } else {
      // 3. Client Requested Changes -> advance to REVISION
      db.prepare(`
        UPDATE content_items SET
          client_approval_status = 'REVISION_REQUESTED',
          workflow_stage = 'REVISION',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(contentId);

      recordWorkflowHistory({
        entityType: 'content',
        entityId: contentId,
        previousStage: 'CLIENT_REVIEW',
        newStage: 'REVISION',
        changedBy: req.user.id,
        remarks: `Client requested changes: ${reason || ''} - ${specific_change || comment}`
      });

      // Notify Editor & Marketing Manager
      if (content.assigned_editor_id) {
        const editor = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(content.assigned_editor_id);
        if (editor) {
          createNotification({
            userId: editor.user_id,
            type: 'REVISION_REQUESTED',
            title: 'Client Revision Requested ✏️',
            message: `Client requested change on "${content.topic}": ${specific_change || comment}`,
            relatedEntity: 'content_items',
            relatedEntityId: contentId
          });
        }
      }
    }
  });

  reviewTransaction();

  logAudit({
    userId: req.user.id,
    action: action === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUESTED',
    entity: 'content_items',
    entityId: contentId,
    newValue: { reviewer: 'CLIENT', action, specific_change },
    ip: req.ip
  });

  const updated = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  res.json({ message: `Client review recorded: ${action}`, content: updated });
});

export default router;
