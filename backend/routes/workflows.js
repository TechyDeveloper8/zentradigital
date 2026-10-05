import express from 'express';
import mongoose from 'mongoose';
import { Workflow, WorkflowHistory, Task, ContentItem, ClientRequest } from '../models/index.js';
import { logAudit, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get Workflows and Stages
router.get('/', authenticate, async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ created_at: 1 });
    res.json(workflows.map(wf => wf.toJSON()));
  } catch (err) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ error: 'Failed to retrieve workflows.' });
  }
});

// Get Workflow History for an entity
router.get('/history/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const query = { entity_type: entityType };
    if (mongoose.Types.ObjectId.isValid(entityId)) {
      query.entity_id = entityId;
    } else {
      query.$or = [{ entity_id: entityId }];
    }

    const history = await WorkflowHistory.find(query)
      .populate('changed_by')
      .sort({ created_at: -1 });

    const formatted = history.map(h => ({
      ...h.toJSON(),
      changed_at: h.created_at,
      changed_by_user: h.changed_by?.username || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching workflow history:', err);
    res.status(500).json({ error: 'Failed to retrieve workflow history.' });
  }
});

// Update Workflow Stage for Entity
router.post('/transition', authenticate, async (req, res) => {
  try {
    const { entity_type, entity_id, previous_stage, new_stage, remarks } = req.body;

    if (!entity_type || !entity_id || !new_stage) {
      return res.status(400).json({ error: 'entity_type, entity_id, and new_stage are required.' });
    }

    await recordWorkflowHistory({
      entityType: entity_type,
      entityId: entity_id,
      previousStage: previous_stage,
      newStage: new_stage,
      changedBy: req.user.id,
      remarks: remarks || ''
    });

    if (mongoose.Types.ObjectId.isValid(entity_id)) {
      if (entity_type === 'task') {
        await Task.findByIdAndUpdate(entity_id, { status: new_stage, workflow_stage: new_stage });
      } else if (entity_type === 'content') {
        await ContentItem.findByIdAndUpdate(entity_id, { workflow_stage: new_stage });
      } else if (entity_type === 'request') {
        await ClientRequest.findByIdAndUpdate(entity_id, { status: new_stage });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'STAGE_CHANGED',
      entity: entity_type,
      entityId: entity_id,
      oldValue: { stage: previous_stage },
      newValue: { stage: new_stage, remarks },
      ip: req.ip
    });

    res.json({ message: 'Stage transitioned successfully' });
  } catch (err) {
    console.error('Error transitioning stage:', err);
    res.status(500).json({ error: 'Failed to transition stage.' });
  }
});

export default router;
