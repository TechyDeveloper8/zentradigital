import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const AttendanceRecordSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  check_in_time: { type: String },
  check_out_time: { type: String },
  punch_in: { type: Date },
  punch_out: { type: Date },
  total_working_hours: { type: Number, default: 0 },
  total_hours: { type: Number, default: 0 },
  break_duration_minutes: { type: Number, default: 0 },
  status: {
    type: String,
    default: 'PRESENT'
  },
  ip_address: { type: String },
  punch_in_ip: { type: String },
  punch_out_ip: { type: String },
  punch_in_location: { type: String },
  punch_out_location: { type: String },
  overtime_hours: { type: Number, default: 0 },
  late_minutes: { type: Number, default: 0 },
  early_exit_minutes: { type: Number, default: 0 },
  is_manual_adjusted: { type: Boolean, default: false },
  is_regularized: { type: Boolean, default: false },
  adjustment_reason: { type: String },
  regularization_reason: { type: String },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, baseSchemaOptions);

AttendanceRecordSchema.index({ employee_id: 1, date: 1 }, { unique: true });

export default mongoose.models.AttendanceRecord || mongoose.model('AttendanceRecord', AttendanceRecordSchema);

