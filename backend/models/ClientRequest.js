import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const RequestCommentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  attachment_url: { type: String }
}, { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ClientRequestSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  request_code: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  request_type: { type: String, default: 'General' }, // Creative, Revision, Strategy, Ad Campaign, Technical, Other
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  status: {
    type: String,
    enum: ['SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    default: 'SUBMITTED'
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  due_date: { type: Date },
  attachments: [String],
  comments: [RequestCommentSchema]
}, baseSchemaOptions);

export default mongoose.models.ClientRequest || mongoose.model('ClientRequest', ClientRequestSchema);
