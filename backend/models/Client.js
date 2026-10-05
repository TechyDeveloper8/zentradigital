import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ClientContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  is_primary: { type: Boolean, default: false }
}, { _id: true });

const OnboardingChecklistSchema = new mongoose.Schema({
  item_key: { type: String, required: true },
  item_label: { type: String, required: true },
  is_completed: { type: Boolean, default: false },
  completed_at: { type: Date }
}, { _id: true });

const ClientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  client_code: { type: String, unique: true, required: true, trim: true },
  company_name: { type: String, required: true, trim: true },
  brand_name: { type: String, trim: true },
  industry: { type: String },
  website: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pin_code: { type: String },
  gst_number: { type: String },
  pan: { type: String },
  primary_contact_name: { type: String, required: true },
  primary_contact_phone: { type: String, required: true },
  primary_contact_email: { type: String, required: true },
  account_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assigned_sales_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  business_type: { type: String },
  billing_cycle: { type: String },
  notes: { type: String },
  status: {
    type: String,
    enum: ['LEAD', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'TERMINATED'],
    default: 'ACTIVE'
  },
  start_date: { type: Date, default: Date.now },
  renewal_date: { type: Date },
  monthly_retainer_fee: { type: Number, default: 0 },
  contacts: [ClientContactSchema],
  onboarding_checklist: [OnboardingChecklistSchema]
}, baseSchemaOptions);

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
