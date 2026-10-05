import mongoose from 'mongoose';
import { baseSchemaOptions } from '../db/mongodb.js';

const DepartmentSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true }
}, baseSchemaOptions);

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
