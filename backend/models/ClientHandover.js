import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ClientHandoverSchema = new mongoose.Schema({
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  transferred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  accepted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  handover_notes: { type: String },
  key_deliverables: { type: String },
  special_requirements: { type: String },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  transferred_at: { type: Date, default: Date.now },
  accepted_at: { type: Date }
}, baseSchemaOptions);

export default mongoose.models.ClientHandover || mongoose.model('ClientHandover', ClientHandoverSchema);
