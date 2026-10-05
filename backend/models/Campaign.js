import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const CampaignSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true, trim: true },
  objective: { type: String },
  target_audience: { type: String },
  platforms: [String],
  start_date: { type: Date },
  end_date: { type: Date },
  budget: { type: Number, default: 0 },
  spent_amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED'],
    default: 'PLANNING'
  }
}, baseSchemaOptions);

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
