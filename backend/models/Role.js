import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const RoleSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, trim: true },
  display_name: { type: String, required: true, trim: true },
  description: { type: String },
  is_system: { type: Boolean, default: false },
  permissions: [{ type: String, trim: true }]
}, baseSchemaOptions);

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
