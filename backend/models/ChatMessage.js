import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ChatMessageSchema = new mongoose.Schema({
  chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  message_type: { type: String, enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'REQUEST_CONVERSION'], default: 'TEXT' },
  attachment_url: { type: String },
  attachment_metadata: { type: mongoose.Schema.Types.Mixed },
  converted_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientRequest' }
}, baseSchemaOptions);

ChatMessageSchema.index({ chat_id: 1, created_at: 1 });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
