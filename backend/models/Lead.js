import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const LeadFollowUpSchema = new mongoose.Schema({
  follow_up_date: { type: String, required: true },
  follow_up_time: { type: String, default: '14:00' },
  contact_method: { type: String, default: 'Phone' },
  follow_up_type: { type: String, default: 'Call' },
  discussion_summary: { type: String },
  notes: { type: String },
  client_requirement: { type: String },
  next_action: { type: String },
  next_follow_up_date: { type: String },
  assigned_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  priority: { type: String, default: 'MEDIUM' },
  reminder: { type: Boolean, default: true },
  status: { type: String, default: 'PENDING' },
  completed_at: { type: Date }
}, { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const LeadActivitySchema = new mongoose.Schema({
  activity_type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: true, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const LeadSchema = new mongoose.Schema({
  lead_code: { type: String, unique: true, required: true, trim: true },
  lead_date: { type: String },
  company_name: { type: String, required: true, trim: true },
  contact_person: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true },
  email: { type: String, trim: true },
  website: { type: String, trim: true },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  industry: { type: String, default: 'General Business' },
  business_type: { type: String },
  company_size: { type: String },
  product_service: { type: String },
  target_market: { type: String },
  target_location: { type: String },
  competitors: { type: String },
  current_marketing_method: { type: String },
  services_required: { type: mongoose.Schema.Types.Mixed },
  requirement: { type: String },
  main_business_problem: { type: String },
  desired_outcome: { type: String },
  expected_start_date: { type: String },
  existing_agency: { type: String },
  urgency: { type: String, default: 'Medium' },
  budget_range: { type: String },
  billing_type: { type: String, default: 'Monthly' },
  expected_contract_duration: { type: String },
  decision_maker: { type: String },
  purchase_timeline: { type: String },
  pricing_sensitivity: { type: String },
  source: { type: String, default: 'Direct' },
  lead_type: { type: String, default: 'Inbound' },
  status: {
    type: String,
    default: 'NEW'
  },
  priority: { type: String, default: 'MEDIUM' },
  lead_score: { type: Number, default: 50 },
  deal_value: { type: Number, default: 0 },
  assigned_sales_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  first_follow_up_date: { type: String },
  stage_updated_at: { type: Date },
  qualification_data: { type: mongoose.Schema.Types.Mixed },
  qualification_status: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  lost_reason: { type: String },
  converted_client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  follow_ups: [LeadFollowUpSchema],
  activities: [LeadActivitySchema]
}, baseSchemaOptions);

// Indexes for high performance sales searching and filtering
LeadSchema.index({ company_name: 'text', contact_person: 'text', phone: 'text' });
LeadSchema.index({ status: 1, priority: 1, assigned_sales_employee_id: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

