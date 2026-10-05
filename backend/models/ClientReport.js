import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ClientReportSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true },
  report_month: { type: Number },
  report_year: { type: Number },
  report_period_start: { type: Date },
  report_period_end: { type: Date },
  report_type: { type: String, default: 'MONTHLY' },
  work_completed: { type: String },
  content_published_count: { type: Number, default: 0 },
  reach_total: { type: Number, default: 0 },
  engagement_total: { type: Number, default: 0 },
  leads_generated: { type: Number, default: 0 },
  best_content_summary: { type: String },
  recommendations: { type: String },
  upcoming_plan: { type: String },
  highlights: { type: String },
  metrics_summary: { type: mongoose.Schema.Types.Mixed },
  pdf_url: { type: String },
  status: { type: String, default: 'DRAFT' },
  finalized_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalized_at: { type: Date }
}, baseSchemaOptions);

export default mongoose.models.ClientReport || mongoose.model('ClientReport', ClientReportSchema);

