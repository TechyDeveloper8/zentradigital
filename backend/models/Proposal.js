import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ProposalItemSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
}, { _id: true });

const ProposalSchema = new mongoose.Schema({
  proposal_code: { type: String, unique: true, required: true, trim: true },
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  title: { type: String, required: true, trim: true },
  scope_of_work: { type: String },
  deliverables: { type: String },
  total_amount: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  final_amount: { type: Number, default: 0 },
  valid_until: { type: Date },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'DRAFT'
  },
  sent_at: { type: Date },
  accepted_at: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [ProposalItemSchema]
}, baseSchemaOptions);

export default mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
