import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ProjectMemberSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  project_role: { type: String, default: 'Member' },
  joined_at: { type: Date, default: Date.now }
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project_name: { type: String, required: true, trim: true },
  description: { type: String },
  project_type: { type: String, default: 'Digital Marketing' },
  start_date: { type: Date, default: Date.now },
  target_end_date: { type: Date },
  actual_end_date: { type: Date },
  status: {
    type: String,
    enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  budget: { type: Number, default: 0 },
  billing_model: { type: String, default: 'MONTHLY' },
  project_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  members: [ProjectMemberSchema]
}, baseSchemaOptions);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
