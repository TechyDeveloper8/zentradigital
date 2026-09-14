import express from 'express';
import db, { logAudit, recordWorkflowHistory } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Workflows and Stages
router.get('/', authenticate, (req, res) => {
  const workflows = db.prepare('SELECT * FROM workflows ORDER BY id ASC').all();
  const stages = db.prepare('SELECT * FROM workflow_stages ORDER BY workflow_id, order_index ASC').all();

  const populated = workflows.map(wf => ({
    ...wf,
    stages: stages.filter(s => s.workflow_id === wf.id)
  }));

  res.json(populated);
});

// Get Workflow History for an entity
router.get('/history/:entityType/:entityId', authenticate, (req, res) => {
  const { entityType, entityId } = req.params;
  const history = db.prepare(`
    SELECT wh.*, u.username as changed_by_user
    FROM workflow_history wh
    LEFT JOIN users u ON wh.changed_by = u.id
    WHERE wh.entity_type = ? AND wh.entity_id = ?
    ORDER BY wh.changed_at DESC
  `).all(entityType, entityId);

  res.json(history);
});

// Update Workflow Stage for Entity (Section 17)
router.post('/transition', authenticate, (req, res) => {
  const { entity_type, entity_id, previous_stage, new_stage, remarks } = req.body;

  if (!entity_type || !entity_id || !new_stage) {
    return res.status(400).json({ error: 'entity_type, entity_id, and new_stage are required.' });
  }

  // Record history
  recordWorkflowHistory({
    entityType: entity_type,
    entityId: entity_id,
    previousStage: previous_stage,
    newStage: new_stage,
    changedBy: req.user.id,
    remarks: remarks || ''
  });

  // Update corresponding entity table
  if (entity_type === 'task') {
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(new_stage, entity_id);
  } else if (entity_type === 'content') {
    db.prepare('UPDATE content_items SET workflow_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(new_stage, entity_id);
  } else if (entity_type === 'request') {
    db.prepare('UPDATE client_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(new_stage, entity_id);
  }

  logAudit({
    userId: req.user.id,
    action: 'STAGE_CHANGED',
    entity: entity_type,
    entityId: entity_id,
    oldValue: { stage: previous_stage },
    newValue: { stage: new_stage, remarks },
    ip: req.ip
  });

  res.json({ message: 'Stage transitioned successfully' });
});

export default router;
