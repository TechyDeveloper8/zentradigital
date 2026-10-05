import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { FileMetadata, Client } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

// List Files
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, project_id, visibility } = req.query;

    const query = {};
    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
      query.is_public = true;
    } else if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }

    if (project_id && mongoose.Types.ObjectId.isValid(project_id)) {
      query.project_id = project_id;
    }

    const files = await FileMetadata.find(query)
      .populate('uploaded_by')
      .populate('client_id')
      .populate('project_id')
      .sort({ created_at: -1 });

    const formatted = files.map(fm => ({
      ...fm.toJSON(),
      uploaded_by_username: fm.uploaded_by?.username || '',
      company_name: fm.client_id?.company_name || '',
      project_name: fm.project_id?.project_name || '',
      visibility: fm.is_public ? 'CLIENT_VISIBLE' : 'INTERNAL'
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ error: 'Failed to retrieve files.' });
  }
});

// Upload File
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { client_id, project_id, visibility } = req.body;

    const isPublic = visibility === 'CLIENT_VISIBLE';

    const newFile = await FileMetadata.create({
      file_name: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      file_path: req.file.path,
      uploaded_by: req.user._id,
      client_id: client_id && mongoose.Types.ObjectId.isValid(client_id) ? client_id : null,
      project_id: project_id && mongoose.Types.ObjectId.isValid(project_id) ? project_id : null,
      is_public: isPublic
    });

    await logAudit({
      userId: req.user.id,
      action: 'FILE_UPLOADED',
      entity: 'files_metadata',
      entityId: newFile._id,
      newValue: { original_name: req.file.originalname, size: req.file.size, visibility: visibility || 'INTERNAL' },
      ip: req.ip
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: newFile._id.toString(),
        file_name: req.file.filename,
        original_name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size
      }
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

// Download / Stream File
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = await FileMetadata.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client || client._id.toString() !== file.client_id?.toString() || !file.is_public) {
        return res.status(403).json({ error: 'Access denied: File is restricted or internal only.' });
      }
    }

    const filePath = path.join(uploadsDir, file.file_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File data missing from storage.' });
    }

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file.' });
  }
});

export default router;
