import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const UserSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  username: { type: String, unique: true, required: true, trim: true, lowercase: true },
  email: { type: String, unique: true, required: true, trim: true, lowercase: true },
  password_hash: { type: String, required: true },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  user_type: { type: String, enum: ['admin', 'employee', 'client'], required: true },
  is_active: { type: Boolean, default: true },
  last_login: { type: Date }
}, baseSchemaOptions);

export default mongoose.models.User || mongoose.model('User', UserSchema);
