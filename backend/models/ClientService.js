import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ClientServiceSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  service_name: { type: String, required: true, trim: true },
  package_type: { type: String, trim: true },
  monthly_fee: { type: Number, default: 0 },
  billing_cycle: { type: String, default: 'MONTHLY' },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED'], default: 'ACTIVE' },
  deliverables_summary: { type: String },
  assigned_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date }
}, baseSchemaOptions);

export default mongoose.models.ClientService || mongoose.model('ClientService', ClientServiceSchema);
