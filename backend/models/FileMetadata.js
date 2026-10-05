import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const FileMetadataSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  original_name: { type: String, required: true },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, default: 0 },
  mime_type: { type: String },
  folder: { type: String, default: 'general' },
  is_public: { type: Boolean, default: false }
}, baseSchemaOptions);

export default mongoose.models.FileMetadata || mongoose.model('FileMetadata', FileMetadataSchema);
