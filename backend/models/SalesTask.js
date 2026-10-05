import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const SalesTaskSchema = new mongoose.Schema({
  task_title: { type: String, required: true, trim: true },
  description: { type: String },
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  assigned_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  due_date: { type: String, required: true },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
    default: 'TODO'
  },
  completed_at: { type: Date }
}, baseSchemaOptions);

SalesTaskSchema.index({ assigned_employee_id: 1, due_date: 1 });
SalesTaskSchema.index({ status: 1 });

export default mongoose.models.SalesTask || mongoose.model('SalesTask', SalesTaskSchema);
