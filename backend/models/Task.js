import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const TaskCommentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  attachment_url: { type: String }
}, { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const FeedbackHistorySchema = new mongoose.Schema({
  step: { type: Number },
  action: { type: String },
  title: { type: String },
  by_user: { type: String },
  role: { type: String },
  decision: { type: String },
  notes: { type: String },
  comment: { type: String },
  feedback_type: { type: String },
  split_path: { type: String },
  routing_info: { type: String },
  edited_video_url: { type: String },
  caption: { type: String },
  hashtags: { type: String },
  target_platforms: { type: String },
  timestamp: { type: String },
  date: { type: Date, default: Date.now }
}, { _id: true });

const TaskSchema = new mongoose.Schema({
  task_code: { type: String, trim: true },
  task_title: { type: String, trim: true },
  title: { type: String, trim: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assigned_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assigned_smm_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  task_type: { type: String, default: 'General' },
  post_type: { type: String },
  workflow_type: { type: String },
  priority: { type: String, default: 'MEDIUM' },
  status: { type: String, default: 'TODO' },
  workflow_stage: { type: String, default: 'INBOX' },
  review_status: { type: String, default: 'Pending Upload' },
  client_visible: { type: Boolean, default: true },
  start_date: { type: Date },
  due_date: { type: String },
  schedule_publish_date: { type: String },
  estimated_hours: { type: Number, default: 0 },
  actual_hours: { type: Number, default: 0 },
  is_billable: { type: Boolean, default: true },
  // Video workflow fields
  raw_file_url: { type: String },
  raw_file_name: { type: String },
  raw_file_size: { type: Number },
  raw_footage_notes: { type: String },
  edited_video_url: { type: String },
  edited_video_name: { type: String },
  video_duration: { type: String },
  editor_notes: { type: String },
  // Static graphic & content fields
  graphic_image_url: { type: String },
  graphic_image_name: { type: String },
  graphic_image_size: { type: Number },
  carousel_slides: { type: mongoose.Schema.Types.Mixed },
  caption: { type: String },
  hashtags: { type: String },
  post_notes: { type: String },
  target_platforms: { type: String },
  // Feedback & split routing
  admin_feedback: { type: String },
  client_feedback: { type: String },
  client_feedback_type: { type: String },
  client_feedback_notes: { type: String },
  split_path: { type: String },
  revision_source: { type: String },
  version_count: { type: Number, default: 0 },
  smm_submitted_at: { type: Date },
  admin_approved_at: { type: Date },
  client_approved_at: { type: Date },
  completed_at: { type: Date },
  feedback_history: [FeedbackHistorySchema],
  comments: [TaskCommentSchema]
}, baseSchemaOptions);

TaskSchema.index({ client_id: 1, workflow_stage: 1 });
TaskSchema.index({ assigned_to: 1, status: 1 });
TaskSchema.index({ assigned_employee_id: 1, assigned_smm_id: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);

