import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ContentVersionSchema = new mongoose.Schema({
  version_number: { type: Number, required: true },
  asset_url: { type: String, required: true },
  thumbnail_url: { type: String },
  change_notes: { type: String },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_approved: { type: Boolean, default: false }
}, { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ContentItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assigned_creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  platform: { type: String, default: 'Instagram' }, // Instagram, YouTube, Facebook, LinkedIn, Twitter, etc.
  content_type: { type: String, default: 'Reel' }, // Reel, Post, Story, Carousel, Short, Video, Graphic
  scheduled_date: { type: Date },
  scheduled_time: { type: String },
  caption: { type: String },
  hashtags: { type: String },
  asset_url: { type: String },
  thumbnail_url: { type: String },
  media_type: { type: String, default: 'image' },
  media_url: { type: String },
  media_thumbnail: { type: String },
  media_aspect_ratio: { type: String, default: '9:16' },
  raw_file_url: { type: String },
  raw_file_name: { type: String },
  raw_file_size: { type: String },
  workflow_stage: { type: String, default: 'INBOX' },
  review_status: { type: String, default: 'DRAFT' },
  admin_feedback: { type: String },
  client_feedback: { type: String },
  feedback_history: [mongoose.Schema.Types.Mixed],
  is_published: { type: Boolean, default: false },
  published_at: { type: Date },
  published_url: { type: String },
  versions: [ContentVersionSchema]
}, baseSchemaOptions);

ContentItemSchema.index({ client_id: 1, scheduled_date: 1 });
ContentItemSchema.index({ platform: 1, workflow_stage: 1 });

export default mongoose.models.ContentItem || mongoose.model('ContentItem', ContentItemSchema);
