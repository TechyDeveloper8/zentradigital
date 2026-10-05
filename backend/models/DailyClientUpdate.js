import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const DailyClientUpdateSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  update_date: { type: Date, required: true },
  completed_work_summary: { type: String, required: true },
  posts_published_count: { type: Number, default: 0 },
  leads_generated_count: { type: Number, default: 0 },
  key_metrics_summary: { type: String },
  urgent_approvals_needed: { type: String },
  plan_for_tomorrow: { type: String },
  sent_by_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['DRAFT', 'SENT'], default: 'DRAFT' },
  sent_at: { type: Date }
}, baseSchemaOptions);

export default mongoose.models.DailyClientUpdate || mongoose.model('DailyClientUpdate', DailyClientUpdateSchema);
