import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const ChatMemberSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'MEMBER' }, // ADMIN, MEMBER
  last_read_at: { type: Date }
}, { _id: true, timestamps: { createdAt: 'joined_at' } });

const ChatSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, trim: true },
  chat_type: {
    type: String,
    enum: ['DIRECT', 'GROUP', 'PROJECT', 'CLIENT_COMMUNICATION'],
    default: 'DIRECT'
  },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientRequest' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [ChatMemberSchema]
}, baseSchemaOptions);

ChatSchema.index({ 'members.user_id': 1, chat_type: 1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
