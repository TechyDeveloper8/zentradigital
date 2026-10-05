import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ContentPerformanceSchema = new mongoose.Schema({
  content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  record_date: { type: Date, default: Date.now },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  engagement_count: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  video_views: { type: Number, default: 0 },
  ad_spend: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 }
}, baseSchemaOptions);

export default mongoose.models.ContentPerformance || mongoose.model('ContentPerformance', ContentPerformanceSchema);
