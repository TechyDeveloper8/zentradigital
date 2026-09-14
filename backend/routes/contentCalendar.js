import express from 'express';
import db, { logAudit, createNotification, recordWorkflowHistory } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Content Items with Calendar filters
router.get('/', authenticate, (req, res) => {
  const { client_id, platform, content_type, workflow_stage, start_date, end_date, search } = req.query;

  let sql = `
    SELECT ci.*, c.company_name, c.client_code,
           p.project_name,
           camp.campaign_name,
           mm.first_name || ' ' || mm.last_name as marketing_manager_name,
           ed.first_name || ' ' || ed.last_name as editor_name,
           (SELECT preview_url FROM content_versions WHERE content_id = ci.id AND version_number = ci.current_version) as current_preview_url,
           (SELECT file_name FROM content_versions WHERE content_id = ci.id AND version_number = ci.current_version) as current_file_name
    FROM content_items ci
    JOIN clients c ON ci.client_id = c.id
    LEFT JOIN projects p ON ci.project_id = p.id
    LEFT JOIN campaigns camp ON ci.campaign_id = camp.id
    LEFT JOIN employees mm ON ci.assigned_marketing_manager_id = mm.id
    LEFT JOIN employees ed ON ci.assigned_editor_id = ed.id
    WHERE 1=1
  `;
  const params = [];

  // Client role sees only content for their organization
  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ? AND ci.workflow_stage NOT IN ('IDEA', 'PLANNED')`;
    params.push(req.user.id);
  } else if (req.user.role_name === 'editor' && req.employee) {
    // Editor sees items assigned to them
    sql += ` AND (ci.assigned_editor_id = ? OR ci.assigned_editor_id IS NULL)`;
    params.push(req.employee.id);
  }

  if (client_id) {
    sql += ` AND ci.client_id = ?`;
    params.push(client_id);
  }
  if (platform) {
    sql += ` AND ci.platform = ?`;
    params.push(platform);
  }
  if (content_type) {
    sql += ` AND ci.content_type = ?`;
    params.push(content_type);
  }
  if (workflow_stage) {
    sql += ` AND ci.workflow_stage = ?`;
    params.push(workflow_stage);
  }
  if (start_date && end_date) {
    sql += ` AND ci.publish_date BETWEEN ? AND ?`;
    params.push(start_date, end_date);
  }
  if (search) {
    sql += ` AND (ci.topic LIKE ? OR ci.caption LIKE ? OR ci.content_code LIKE ? OR c.company_name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ` ORDER BY ci.publish_date ASC, ci.publish_time ASC`;
  const items = db.prepare(sql).all(...params);
  res.json(items);
});

// Single Content Item Detail (with versions & reviews)
router.get('/:id', authenticate, (req, res) => {
  const item = db.prepare(`
    SELECT ci.*, c.company_name, c.client_code,
           p.project_name, camp.campaign_name,
           mm.first_name || ' ' || mm.last_name as marketing_manager_name,
           ed.first_name || ' ' || ed.last_name as editor_name
    FROM content_items ci
    JOIN clients c ON ci.client_id = c.id
    LEFT JOIN projects p ON ci.project_id = p.id
    LEFT JOIN campaigns camp ON ci.campaign_id = camp.id
    LEFT JOIN employees mm ON ci.assigned_marketing_manager_id = mm.id
    LEFT JOIN employees ed ON ci.assigned_editor_id = ed.id
    WHERE ci.id = ?
  `).get(req.params.id);

  if (!item) {
    return res.status(404).json({ error: 'Content item not found' });
  }

  // Versions history (Section 21 - never overwrite)
  const versions = db.prepare(`
    SELECT cv.*, u.username as submitted_by_user
    FROM content_versions cv
    LEFT JOIN users u ON cv.submitted_by = u.id
    WHERE cv.content_id = ?
    ORDER BY cv.version_number DESC
  `).all(item.id);

  // Review history
  const reviews = db.prepare(`
    SELECT cr.*, u.username as reviewer_name, u.user_type
    FROM content_reviews cr
    JOIN users u ON cr.reviewer_user_id = u.id
    WHERE cr.content_id = ?
    ORDER BY cr.created_at DESC
  `).all(item.id);

  // Performance data (if published)
  const performance = db.prepare(`
    SELECT * FROM content_performance WHERE content_id = ? ORDER BY recorded_date DESC
  `).all(item.id);

  res.json({ item, versions, reviews, performance });
});

// Create Content Plan Item (Section 19 & 20)
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), (req, res) => {
  const {
    client_id, project_id, campaign_id, platform, content_type, topic,
    caption, hashtags, cta, reference_url, assigned_editor_id, publish_date,
    publish_time, workflow_stage
  } = req.body;

  if (!client_id || !platform || !content_type || !topic) {
    return res.status(400).json({ error: 'Client, platform, content type, and topic are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM content_items').get().count + 1;
  const content_code = `CNT-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const mmId = req.employee ? req.employee.id : null;
  const initialStage = workflow_stage || (assigned_editor_id ? 'ASSIGNED' : 'PLANNED');

  const result = db.prepare(`
    INSERT INTO content_items (
      content_code, client_id, project_id, campaign_id, platform, content_type,
      topic, caption, hashtags, cta, reference_url, assigned_marketing_manager_id,
      assigned_editor_id, publish_date, publish_time, workflow_stage, current_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    content_code, client_id, project_id || null, campaign_id || null, platform,
    content_type, topic, caption || '', hashtags || '', cta || '', reference_url || '',
    mmId, assigned_editor_id || null, publish_date || null, publish_time || '10:00',
    initialStage
  );

  const contentId = result.lastInsertRowid;

  // If editor assigned, notify editor
  if (assigned_editor_id) {
    const editor = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(assigned_editor_id);
    if (editor) {
      createNotification({
        userId: editor.user_id,
        type: 'CONTENT_ASSIGNED',
        title: 'New Creative Task Assigned',
        message: `You were assigned ${content_type} for ${platform}: "${topic}".`,
        relatedEntity: 'content_items',
        relatedEntityId: contentId
      });
    }
  }

  recordWorkflowHistory({
    entityType: 'content',
    entityId: contentId,
    previousStage: null,
    newStage: initialStage,
    changedBy: req.user.id,
    remarks: 'Content planned'
  });

  logAudit({
    userId: req.user.id,
    action: 'CREATED',
    entity: 'content_items',
    entityId: contentId,
    newValue: { content_code, topic, platform, content_type },
    ip: req.ip
  });

  const created = db.prepare('SELECT * FROM content_items WHERE id = ?').get(contentId);
  res.status(201).json({ message: 'Content item created successfully', content: created });
});

// Update Content Item
router.put('/:id', authenticate, (req, res) => {
  const item = db.prepare('SELECT * FROM content_items WHERE id = ?').get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Content item not found' });
  }

  const {
    topic, caption, hashtags, cta, reference_url, assigned_editor_id,
    publish_date, publish_time, workflow_stage, publishing_status
  } = req.body;

  const previousStage = item.workflow_stage;
  const newStage = workflow_stage || item.workflow_stage;

  db.prepare(`
    UPDATE content_items SET
      topic = coalesce(?, topic),
      caption = coalesce(?, caption),
      hashtags = coalesce(?, hashtags),
      cta = coalesce(?, cta),
      reference_url = coalesce(?, reference_url),
      assigned_editor_id = coalesce(?, assigned_editor_id),
      publish_date = coalesce(?, publish_date),
      publish_time = coalesce(?, publish_time),
      workflow_stage = ?,
      publishing_status = coalesce(?, publishing_status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    topic, caption, hashtags, cta, reference_url, assigned_editor_id,
    publish_date, publish_time, newStage, publishing_status, item.id
  );

  if (newStage !== previousStage) {
    recordWorkflowHistory({
      entityType: 'content',
      entityId: item.id,
      previousStage,
      newStage,
      changedBy: req.user.id,
      remarks: `Stage updated to ${newStage}`
    });

    logAudit({
      userId: req.user.id,
      action: 'STAGE_CHANGED',
      entity: 'content_items',
      entityId: item.id,
      oldValue: { workflow_stage: previousStage },
      newValue: { workflow_stage: newStage },
      ip: req.ip
    });
  }

  const updated = db.prepare('SELECT * FROM content_items WHERE id = ?').get(item.id);
  res.json({ message: 'Content item updated successfully', content: updated });
});

export default router;
