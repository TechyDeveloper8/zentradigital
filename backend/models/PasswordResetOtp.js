import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const PasswordResetOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  is_used: { type: Boolean, default: false }
}, baseSchemaOptions);

// Auto-cleanup documents 30 minutes after creation
PasswordResetOtpSchema.index({ created_at: 1 }, { expireAfterSeconds: 1800 });

export default mongoose.models.PasswordResetOtp || mongoose.model('PasswordResetOtp', PasswordResetOtpSchema);
