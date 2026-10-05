import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const SystemSettingsSchema = new mongoose.Schema({
  default_working_days: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  office_start_time: { type: String, default: '09:30' },
  office_end_time: { type: String, default: '18:30' },
  grace_period_minutes: { type: Number, default: 15 },
  attendance_rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  leave_rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  task_priority_rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  default_approval_rules: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  legal_name: { type: String, trim: true },
  logo: { type: String },
  brand_logo_light: { type: String },
  brand_logo_dark: { type: String },
  website: { type: String },
  email: { type: String },
  phone: { type: String },
  whatsapp_number: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pin_code: { type: String },
  gst_number: { type: String },
  pan: { type: String },
  cin: { type: String },
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'INR' },
  financial_year_start: { type: String, default: '04-01' },
  date_format: { type: String, default: 'YYYY-MM-DD' },
  default_language: { type: String, default: 'en' },
  owner_name: { type: String },
  primary_contact_email: { type: String },
  primary_contact_phone: { type: String },
  settings: { type: SystemSettingsSchema, default: () => ({}) }
}, baseSchemaOptions);

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
