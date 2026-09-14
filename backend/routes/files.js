import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { logAudit } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const router = express.Router();

// List Files with Visibility Enforcement (Section 33)
router.get('/', authenticate, (req, res) => {
  const { client_id, project_id, task_id, visibility } = req.query;

  let sql = `
    SELECT fm.*, u.username as uploaded_by_username,
           c.company_name, p.project_name
    FROM files_metadata fm
    LEFT JOIN users u ON fm.uploaded_by_user_id = u.id
    LEFT JOIN clients c ON fm.client_id = c.id
    LEFT JOIN projects p ON fm.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // Client user can ONLY view CLIENT_VISIBLE files belonging to their client account
  if (req.user.user_type === 'client') {
    sql += ` AND c.user_id = ? AND fm.visibility = 'CLIENT_VISIBLE'`;
    params.push(req.user.id);
  }

  if (client_id) {
    sql += ` AND fm.client_id = ?`;
    params.push(client_id);
  }
  if (project_id) {
    sql += ` AND fm.project_id = ?`;
    params.push(project_id);
  }
  if (task_id) {
    sql += ` AND fm.task_id = ?`;
    params.push(task_id);
  }
  if (visibility && req.user.user_type !== 'client') {
    sql += ` AND fm.visibility = ?`;
    params.push(visibility);
  }

  sql += ` ORDER BY fm.id DESC`;
  const files = db.prepare(sql).all(...params);
  res.json(files);
});

// Upload File
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const { client_id, project_id, task_id, content_id, version_number, visibility } = req.body;

  const result = db.prepare(`
    INSERT INTO files_metadata (
      file_name, original_name, mime_type, file_size, storage_path,
      uploaded_by_user_id, client_id, project_id, task_id, content_id,
      version_number, visibility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    req.file.path,
    req.user.id,
    client_id || null,
    project_id || null,
    task_id || null,
    content_id || null,
    version_number || 1,
    visibility || 'INTERNAL'
  );

  logAudit({
    userId: req.user.id,
    action: 'FILE_UPLOADED',
    entity: 'files_metadata',
    entityId: result.lastInsertRowid,
    newValue: { original_name: req.file.originalname, size: req.file.size, visibility: visibility || 'INTERNAL' },
    ip: req.ip
  });

  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      id: result.lastInsertRowid,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size
    }
  });
});

// Download / Stream File with Authorization Check
router.get('/:id/download', authenticate, (req, res) => {
  const file = db.prepare('SELECT * FROM files_metadata WHERE id = ?').get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Client safety check
  if (req.user.user_type === 'client') {
    const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.id);
    if (!client || client.id !== file.client_id || file.visibility !== 'CLIENT_VISIBLE') {
      return res.status(403).json({ error: 'Access denied: File is restricted or internal only.' });
    }
  }

  const filePath = path.join(uploadsDir, file.file_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File data missing from storage.' });
  }

  res.download(filePath, file.original_name);
});

export default router;
