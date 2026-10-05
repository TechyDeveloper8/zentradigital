import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entity_id: { type: mongoose.Schema.Types.Mixed },
  old_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String }
}, baseSchemaOptions);

AuditLogSchema.index({ entity: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
