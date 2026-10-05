import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const WorkflowStageSchema = new mongoose.Schema({
  stage_key: { type: String, required: true },
  stage_label: { type: String, required: true },
  order_index: { type: Number, default: 0 },
  color: { type: String, default: '#3B82F6' },
  client_visible: { type: Boolean, default: false }
}, { _id: true });

const WorkflowSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  is_default: { type: Boolean, default: false },
  stages: [WorkflowStageSchema]
}, baseSchemaOptions);

export default mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);
