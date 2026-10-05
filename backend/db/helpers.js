import {
  AuditLog,
  Notification,
  WorkflowHistory,
  Lead
} from '../models/index.js';
import { broadcastNotification } from '../websocket.js';

// Helper: Log Audit Trail
export async function logAudit({ userId, action, entity, entityId, oldValue, newValue, ip }) {
  try {
    await AuditLog.create({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      ip_address: ip || null
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

// Helper: Log Lead Activity
export async function logLeadActivity({ leadId, activityType, title, description, performedBy, metadata }) {
  try {
    const activity = {
      activity_type: activityType,
      title,
      description: description || null,
      performed_by: performedBy || null,
      metadata: metadata || null
    };

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, {
        $push: { activities: activity }
      });
    }
  } catch (err) {
    console.error('Failed to log lead activity:', err.message);
  }
}

// Helper: Create Notification with WebSocket Broadcast
export async function createNotification({ userId, type, title, message, relatedEntity, relatedEntityId }) {
  try {
    const doc = await Notification.create({
      user_id: userId,
      type: type || 'INFO',
      title,
      message,
      related_entity: relatedEntity || null,
      related_entity_id: relatedEntityId || null,
      is_read: false
    });

    const notifObj = doc.toJSON();
    broadcastNotification(userId?.toString(), notifObj);
    return doc._id.toString();
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

// Helper: Record Workflow Transition History
export async function recordWorkflowHistory({ entityType, entityId, previousStage, newStage, changedBy, remarks }) {
  try {
    await WorkflowHistory.create({
      entity_type: entityType,
      entity_id: entityId,
      previous_stage: previousStage || null,
      new_stage: newStage,
      changed_by: changedBy || null,
      remarks: remarks || null
    });
  } catch (err) {
    console.error('Failed to record workflow history:', err.message);
  }
}
