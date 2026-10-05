import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'INFO' }, // INFO, WARNING, TASK, APPROVAL, CHAT, ATTENDANCE, SALES
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_entity: { type: String }, // 'tasks', 'leads', 'invoices', etc.
  related_entity_id: { type: mongoose.Schema.Types.ObjectId },
  is_read: { type: Boolean, default: false }
}, baseSchemaOptions);

NotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
