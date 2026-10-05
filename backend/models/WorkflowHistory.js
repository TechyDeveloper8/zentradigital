import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const WorkflowHistorySchema = new mongoose.Schema({
  entity_type: { type: String, required: true }, // 'task', 'content_item', 'lead'
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  previous_stage: { type: String },
  new_stage: { type: String, required: true },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String }
}, baseSchemaOptions);

WorkflowHistorySchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });

export default mongoose.models.WorkflowHistory || mongoose.model('WorkflowHistory', WorkflowHistorySchema);
