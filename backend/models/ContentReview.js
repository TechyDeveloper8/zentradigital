import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ContentReviewSchema = new mongoose.Schema({
  content_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  version_id: { type: mongoose.Schema.Types.ObjectId },
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  review_stage: { type: String, enum: ['INTERNAL', 'CLIENT'], default: 'INTERNAL' },
  decision: { type: String, enum: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'], required: true },
  feedback: { type: String }
}, baseSchemaOptions);

export default mongoose.models.ContentReview || mongoose.model('ContentReview', ContentReviewSchema);
