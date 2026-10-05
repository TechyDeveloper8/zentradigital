import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const MeetingSchema = new mongoose.Schema({
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  title: { type: String, required: true, trim: true },
  meeting_date: { type: Date, required: true },
  meeting_time: { type: String, required: true },
  meeting_type: {
    type: String,
    enum: ['Phone', 'Video Call', 'Office Meeting', 'Client Location', 'Other'],
    default: 'Video Call'
  },
  meeting_link: { type: String },
  location: { type: String },
  participants: [String],
  agenda: { type: String },
  notes: { type: String },
  reminder: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO SHOW'],
    default: 'SCHEDULED'
  },
  assigned_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, baseSchemaOptions);

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
