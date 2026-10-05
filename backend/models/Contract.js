import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ContractSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  contract_number: { type: String, unique: true, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  contract_value: { type: Number, default: 0 },
  billing_frequency: { type: String, default: 'MONTHLY' },
  scope_summary: { type: String },
  sla_terms: { type: String },
  document_url: { type: String },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'ACTIVE', 'EXPIRED', 'TERMINATED'],
    default: 'ACTIVE'
  },
  auto_renew: { type: Boolean, default: false }
}, baseSchemaOptions);

export default mongoose.models.Contract || mongoose.model('Contract', ContractSchema);
