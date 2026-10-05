import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const DailyWorkEntrySchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  work_category: { type: String, default: 'General Operations' },
  work_description: { type: String, required: true },
  start_time: { type: String },
  end_time: { type: String },
  hours_worked: { type: Number, default: 0 },
  hours_spent: { type: Number, default: 0 },
  deliverable_output: { type: String },
  output_link: { type: String },
  proof_file_url: { type: String },
  client_visible: { type: Boolean, default: true }
}, { _id: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const DailyWorkReportSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  report_date: { type: String, required: true },
  total_hours: { type: Number, default: 0 },
  calls_made: { type: Number, default: 0 },
  meetings_done: { type: Number, default: 0 },
  proposals_sent: { type: Number, default: 0 },
  deals_closed: { type: Number, default: 0 },
  revenue_generated: { type: Number, default: 0 },
  remarks: { type: String },
  summary: { type: String },
  challenges: { type: String },
  tomorrows_plan: { type: String },
  plan_for_tomorrow: { type: String },
  status: {
    type: String,
    enum: ['SUBMITTED', 'REVIEWED', 'FLAGGED'],
    default: 'SUBMITTED'
  },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  reviewed_at: { type: Date },
  reviewer_feedback: { type: String },
  entries: [DailyWorkEntrySchema]
}, baseSchemaOptions);

DailyWorkReportSchema.index({ employee_id: 1, report_date: 1 }, { unique: true });

export default mongoose.models.DailyWorkReport || mongoose.model('DailyWorkReport', DailyWorkReportSchema);

