import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const EmployeeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  employee_code: { type: String, unique: true, required: true, trim: true },
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  profile_photo: { type: String },
  dob: { type: Date },
  gender: { type: String },
  phone: { type: String },
  alternate_phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pin_code: { type: String },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: String, required: true, trim: true },
  employee_type: { type: String, required: true },
  date_of_joining: { type: Date, default: Date.now },
  reporting_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employment_status: {
    type: String,
    enum: ['Active', 'Probation', 'Notice Period', 'Inactive', 'Terminated'],
    default: 'Active'
  },
  work_location: { type: String, default: 'Headquarters' },
  working_hours: { type: String, default: '09:30 - 18:30' },
  employment_mode: { type: String, default: 'Full-time' },
  working_days: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  shift_start: { type: String, default: '09:30' },
  shift_end: { type: String, default: '18:30' },
  check_in_required: { type: Boolean, default: true },
  check_out_required: { type: Boolean, default: true },
  leave_allocation: { type: Number, default: 18 },
  daily_report_required: { type: Boolean, default: true }
}, baseSchemaOptions);

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
