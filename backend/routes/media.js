import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Task, Client, Employee, User, Notification, WorkflowHistory } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastWorkflowEvent } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for raw & edited videos up to 250MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitizedOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }
});

const router = express.Router();

// Helper: safe parse for history
function parseHistory(raw) {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return [];
  }
}

// Map workflow_stage to human-readable badge status
export function getWorkflowBadge(stage, fallbackReviewStatus) {
  switch (stage) {
    case 'RAW_UPLOADED':
      return 'Raw Uploaded';
    case 'EDITING':
      return 'Editing';
    case 'TASK_CREATED':
    case 'SMM_DRAFTING':
      return 'Task Created';
    case 'IN_ADMIN_REVIEW_EDITOR':
    case 'IN_ADMIN_REVIEW_SMM':
    case 'IN_ADMIN_GRAPHIC_REVIEW':
      return 'Admin Review';
    case 'SMM_CAPTIONING':
      return 'SMM Captioning';
    case 'IN_CLIENT_REVIEW':
      return 'Client Review';
    case 'NEEDS_REVISION_VIDEO':
      return 'Needs Revision - Video';
    case 'NEEDS_REVISION_CAPTION':
      return 'Needs Revision - Caption';
    case 'NEEDS_REVISION_SMM':
      return 'Revision Required';
    case 'APPROVED':
    case 'PUBLISHED':
      return 'Fully Approved';
    default:
      return fallbackReviewStatus || 'In Progress';
  }
}

/**
 * GET ALL MEDIA ASSETS (With RBAC Scoping & Workflow Stages)
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const { client_id, assigned_to, stage, review_status, search, role_view, type, workflow_type, post_type } = req.query;

    const filter = {
      $or: [
        { task_type: 'Video Editing' },
        { raw_file_url: { $ne: null } },
        { edited_video_url: { $ne: null } },
        { workflow_type: 'STATIC_GRAPHIC' },
        { post_type: { $in: ['Static Post', 'Carousel', 'Flyer', 'Poster'] } }
      ]
    };

    // Role-specific visibility rules
    if (req.user.user_type === 'client') {
      filter.client_visible = true;
      const activeClient = req.client || req.clientProfile;
      if (activeClient) {
        filter.client_id = activeClient._id || activeClient.id;
      }
    } else if (req.user.role_name === 'editor') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { workflow_type: { $exists: false } },
          { workflow_type: null },
          { workflow_type: { $ne: 'STATIC_GRAPHIC' } }
        ]
      });
      filter.$and.push({
        $or: [
          { post_type: { $exists: false } },
          { post_type: null },
          { post_type: { $nin: ['Static Post', 'Carousel', 'Flyer', 'Poster'] } }
        ]
      });
      if (req.employee && role_view === 'assigned_only') {
        filter.$and.push({
          $or: [
            { assigned_employee_id: req.employee._id || req.employee.id },
            { assigned_employee_id: null },
            { assigned_to: req.employee._id || req.employee.id }
          ]
        });
      }
    } else if (req.user.role_name === 'marketing_manager' && req.employee && role_view === 'assigned_only') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { assigned_smm_id: req.employee._id || req.employee.id },
          { assigned_smm_id: null }
        ]
      });
    }

    // Explicit workflow type filtering (video vs graphic)
    if (type === 'video' || workflow_type === 'video' || workflow_type === 'VIDEO_PRODUCTION') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { workflow_type: { $exists: false } },
          { workflow_type: null },
          { workflow_type: { $ne: 'STATIC_GRAPHIC' } }
        ]
      });
      filter.$and.push({
        $or: [
          { post_type: { $exists: false } },
          { post_type: null },
          { post_type: { $nin: ['Static Post', 'Carousel', 'Flyer', 'Poster'] } }
        ]
      });
    } else if (type === 'graphic' || workflow_type === 'graphic' || workflow_type === 'STATIC_GRAPHIC') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { workflow_type: 'STATIC_GRAPHIC' },
          { post_type: { $in: ['Static Post', 'Carousel', 'Flyer', 'Poster'] } }
        ]
      });
    } else if (workflow_type) {
      filter.workflow_type = workflow_type;
    }

    if (post_type && post_type !== 'ALL') {
      filter.post_type = post_type;
    }

    if (client_id) {
      filter.client_id = client_id;
    }

    if (assigned_to) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { assigned_employee_id: assigned_to },
          { assigned_smm_id: assigned_to },
          { assigned_to: assigned_to }
        ]
      });
    }

    if (stage && stage !== 'ALL') {
      filter.workflow_stage = stage;
    }

    if (review_status && review_status !== 'ALL') {
      filter.$or = [
        { review_status },
        { workflow_stage: review_status }
      ];
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { task_title: regex },
        { title: regex },
        { task_code: regex },
        { caption: regex }
      ];
    }

    const itemsRaw = await Task.find(filter)
      .populate('client_id', 'company_name client_code primary_contact_name primary_contact_email')
      .populate('assigned_employee_id', 'first_name last_name designation employee_code')
      .populate('assigned_smm_id', 'first_name last_name designation')
      .populate('reviewer_id', 'first_name last_name')
      .populate('created_by', 'username')
      .sort({ _id: -1 })
      .lean({ virtuals: true });

    const formatted = itemsRaw.map(item => {
      const c = item.client_id || {};
      const emp = item.assigned_employee_id || {};
      const smm = item.assigned_smm_id || {};
      const rev = item.reviewer_id || {};
      const u = item.created_by || {};

      const history = parseHistory(item.feedback_history);
      const stage = item.workflow_stage || (item.review_status === 'Approved' ? 'APPROVED' : (item.review_status === 'Needs Revision' ? 'NEEDS_REVISION_VIDEO' : 'RAW_UPLOADED'));
      const badge = getWorkflowBadge(stage, item.review_status);

      return {
        ...item,
        id: item._id.toString(),
        task_title: item.task_title || item.title,
        client_id: c._id ? c._id.toString() : item.client_id,
        company_name: c.company_name || null,
        client_code: c.client_code || null,
        primary_contact_name: c.primary_contact_name || null,
        primary_contact_email: c.primary_contact_email || null,
        assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null,
        assigned_employee_designation: emp.designation || null,
        assigned_employee_code: emp.employee_code || null,
        assigned_smm_name: smm.first_name ? `${smm.first_name} ${smm.last_name || ''}`.trim() : null,
        assigned_smm_designation: smm.designation || null,
        reviewer_name: rev.first_name ? `${rev.first_name} ${rev.last_name || ''}`.trim() : null,
        created_by_username: u.username || null,
        workflow_stage: stage,
        workflow_badge: badge,
        feedback_history: history
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error in /api/media/all:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch media assets' });
  }
});

/**
 * CLIENT REJECTIONS & SPLIT ROUTING AUDIT LOGS
 */
router.get('/client-rejections', authenticate, async (req, res) => {
  try {
    const filter = {
      $or: [
        { client_feedback: { $ne: null } },
        { split_path: { $ne: null } },
        { 'feedback_history.action': { $regex: /CLIENT_DISAPPROVED/ } }
      ]
    };

    const rejectionsRaw = await Task.find(filter)
      .populate('client_id', 'company_name client_code')
      .populate('assigned_employee_id', 'first_name last_name')
      .populate('assigned_smm_id', 'first_name last_name')
      .sort({ updatedAt: -1 })
      .lean({ virtuals: true });

    const formatted = rejectionsRaw.map(r => {
      const c = r.client_id || {};
      const emp = r.assigned_employee_id || {};
      const smm = r.assigned_smm_id || {};

      const isPathA = r.split_path === 'PATH_A' || r.client_feedback_type === 'VIDEO_ISSUE';
      const editorName = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null;
      const smmName = smm.first_name ? `${smm.first_name} ${smm.last_name || ''}`.trim() : null;

      return {
        ...r,
        id: r._id.toString(),
        task_id: r._id.toString(),
        item_code: r.task_code,
        item_title: r.task_title || r.title,
        platform: 'Video / Reel',
        content_type: 'Video Deliverable',
        media_type: 'video',
        media_url: r.edited_video_url || r.raw_file_url || r.graphic_image_url,
        feedback_notes: r.client_feedback,
        client_approval_status: r.review_status,
        rejected_at: r.updatedAt,
        company_name: c.company_name || null,
        client_name: c.company_name || null,
        client_code: c.client_code || null,
        editor_name: editorName,
        assigned_editor_name: editorName,
        smm_name: smmName,
        assigned_smm_name: smmName,
        routed_to_name: isPathA ? editorName : smmName,
        routed_role: isPathA ? 'Video Editor (Path A)' : 'Social Media Manager (Path B)',
        feedback_history: parseHistory(r.feedback_history)
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error in /api/media/client-rejections:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch rejection logs' });
  }
});

/**
 * GET SINGLE MEDIA ASSET
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await Task.findById(req.params.id)
      .populate('client_id', 'company_name client_code primary_contact_name primary_contact_email')
      .populate('assigned_employee_id', 'first_name last_name designation')
      .populate('assigned_smm_id', 'first_name last_name')
      .populate('reviewer_id', 'first_name last_name')
      .populate('created_by', 'username')
      .lean({ virtuals: true });

    if (!item) {
      return res.status(404).json({ error: 'Media task not found' });
    }

    const c = item.client_id || {};
    const emp = item.assigned_employee_id || {};
    const smm = item.assigned_smm_id || {};
    const rev = item.reviewer_id || {};
    const u = item.created_by || {};

    const history = parseHistory(item.feedback_history);
    const stage = item.workflow_stage || 'RAW_UPLOADED';
    const badge = getWorkflowBadge(stage, item.review_status);

    return res.json({
      ...item,
      id: item._id.toString(),
      task_title: item.task_title || item.title,
      client_id: c._id ? c._id.toString() : item.client_id,
      company_name: c.company_name || null,
      client_code: c.client_code || null,
      primary_contact_name: c.primary_contact_name || null,
      primary_contact_email: c.primary_contact_email || null,
      assigned_employee_name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : null,
      assigned_employee_designation: emp.designation || null,
      assigned_smm_name: smm.first_name ? `${smm.first_name} ${smm.last_name || ''}`.trim() : null,
      reviewer_name: rev.first_name ? `${rev.first_name} ${rev.last_name || ''}`.trim() : null,
      created_by_username: u.username || null,
      workflow_stage: stage,
      workflow_badge: badge,
      feedback_history: history
    });
  } catch (error) {
    console.error('Error fetching media task:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch task' });
  }
});

/**
 * STEP 1: ADMIN UPLOAD & DISTRIBUTION
 */
router.post('/raw-upload', authenticate, requireRole(['admin', 'marketing_manager']), upload.single('raw_video'), async (req, res) => {
  try {
    const {
      task_title,
      client_id,
      project_id,
      assigned_employee_id,
      assigned_smm_id,
      due_date,
      priority,
      raw_footage_notes,
      client_visible,
      raw_file_url: manualUrl,
      raw_file_name: manualName,
      raw_file_size: manualSize
    } = req.body;

    if (!task_title || !client_id || !due_date) {
      return res.status(400).json({ error: 'Task Title, Client, and Due Date are mandatory.' });
    }

    let rawFileUrl = manualUrl || '';
    let rawFileName = manualName || '';
    let rawFileSize = manualSize ? Number(manualSize) : 0;

    if (req.file) {
      rawFileUrl = `/uploads/${req.file.filename}`;
      rawFileName = req.file.originalname;
      rawFileSize = req.file.size;
    } else if (!rawFileUrl) {
      rawFileUrl = 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-studio-41154-large.mp4';
      rawFileName = `${task_title.replace(/\s+/g, '_')}_Raw_Footage.mp4`;
      rawFileSize = 45 * 1024 * 1024;
    }

    let defaultSmmId = assigned_smm_id || null;
    if (!defaultSmmId) {
      const smmRow = await Employee.findOne({ employee_type: 'marketing_manager' });
      if (smmRow) defaultSmmId = smmRow._id;
    }

    const count = await Task.countDocuments({ task_type: 'Video Editing' }) + 1;
    const task_code = `VID-RAW-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const clientVisibleFlag = client_visible !== undefined ? (client_visible === '1' || client_visible === true || client_visible === 1) : true;

    const initialHistory = [{
      step: 1,
      action: 'ADMIN_RAW_UPLOAD',
      title: 'Step 1: Admin Raw Footage Uploaded & Distributed',
      by_user: req.user.username,
      role: 'Admin',
      notes: raw_footage_notes || `Raw video footage "${rawFileName}" uploaded and distributed to Video Editor & Client preview.`,
      timestamp: new Date().toISOString()
    }];

    const task = await Task.create({
      task_code,
      task_title,
      title: task_title,
      client_id,
      project_id: project_id || null,
      task_type: 'Video Editing',
      description: raw_footage_notes || `Raw video editing assignment: ${task_title}`,
      assigned_employee_id: assigned_employee_id || null,
      assigned_to: assigned_employee_id || null,
      assigned_smm_id: defaultSmmId,
      created_by: req.user._id || req.user.id,
      priority: priority || 'HIGH',
      start_date: new Date(),
      due_date,
      status: 'IN PROGRESS',
      workflow_stage: 'RAW_UPLOADED',
      client_visible: clientVisibleFlag,
      raw_file_url: rawFileUrl,
      raw_file_name: rawFileName,
      raw_file_size: rawFileSize,
      raw_footage_notes: raw_footage_notes || '',
      review_status: 'Raw Uploaded',
      version_count: 0,
      feedback_history: initialHistory
    });

    const taskId = task._id;

    if (assigned_employee_id) {
      const editor = await Employee.findById(assigned_employee_id);
      if (editor && editor.user_id) {
        await createNotification({
          userId: editor.user_id,
          type: 'RAW_VIDEO_ASSIGNED',
          title: '🎬 New Raw Video Task Assigned',
          message: `Admin uploaded raw footage for "${task_title}" (Due: ${due_date}). Ready for download and editing.`,
          relatedEntity: 'tasks',
          relatedEntityId: taskId
        });
      }
    }

    const clientUser = await Client.findById(client_id);
    if (clientUser && clientUser.user_id) {
      await createNotification({
        userId: clientUser.user_id,
        type: 'NEW_ASSET_IN_PIPELINE',
        title: '📹 New Video Production In Progress',
        message: `A new video project "${task_title}" has entered production and is scheduled for review on ${due_date}.`,
        relatedEntity: 'tasks',
        relatedEntityId: taskId
      });
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: taskId,
      previousStage: null,
      newStage: 'RAW_UPLOADED',
      changedBy: req.user._id || req.user.id,
      remarks: `Step 1: Admin uploaded raw footage (${rawFileName}) and dispatched task.`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'ADMIN_RAW_VIDEO_UPLOAD',
      entity: 'tasks',
      entityId: taskId,
      newValue: { task_code, task_title, raw_file_name: rawFileName },
      ip: req.ip
    });

    const createdTask = await Task.findById(taskId)
      .populate('client_id', 'company_name client_code')
      .populate('assigned_employee_id', 'first_name last_name')
      .populate('assigned_smm_id', 'first_name last_name')
      .lean({ virtuals: true });

    const returnTask = {
      ...createdTask,
      id: createdTask._id.toString(),
      workflow_badge: 'Raw Uploaded',
      feedback_history: initialHistory
    };

    broadcastWorkflowEvent({
      eventType: 'TASK_CREATED',
      taskId: taskId.toString(),
      task_code,
      task_title,
      stage: 'RAW_UPLOADED',
      badge: 'Raw Uploaded',
      assigned_employee_id,
      assigned_smm_id: defaultSmmId,
      client_id,
      task: returnTask,
      message: `🎬 New raw video "${task_title}" uploaded by Admin and dispatched to Video Editor & Client.`
    });

    return res.status(201).json({
      message: 'Raw video task uploaded successfully and dispatched to Video Editor and Client Dashboard.',
      task: returnTask
    });
  } catch (error) {
    console.error('Error in /api/media/raw-upload:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload raw video task' });
  }
});

/**
 * STEP 2: VIDEO EDITOR PROCESSING & ADMIN APPROVAL
 */
router.post('/:id/editor-submit', authenticate, upload.single('edited_video'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const {
      edited_video_url: manualUrl,
      edited_video_name: manualName,
      video_duration,
      editor_notes
    } = req.body;

    let videoUrl = manualUrl || '';
    let videoName = manualName || '';

    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
      videoName = req.file.originalname;
    } else if (!videoUrl) {
      videoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
      videoName = `${(task.task_title || task.title).replace(/\s+/g, '_')}_Edited_Cut_v${(task.version_count || 0) + 1}.mp4`;
    }

    const newVersion = (task.version_count || 0) + 1;
    task.feedback_history.push({
      step: 2,
      action: 'EDITOR_SUBMITTED',
      title: `Step 2: Video Editor Uploaded Cut v${newVersion}`,
      by_user: req.user.username,
      role: 'Video Editor',
      notes: editor_notes || `Edited cut version v${newVersion} submitted to Admin for review. Duration: ${video_duration || '00:45'}.`,
      edited_video_url: videoUrl,
      timestamp: new Date().toISOString()
    });

    task.edited_video_url = videoUrl;
    task.edited_video_name = videoName || `Edited_Cut_v${newVersion}.mp4`;
    task.video_duration = video_duration || '00:45';
    task.editor_notes = editor_notes || '';
    task.version_count = newVersion;
    task.workflow_stage = 'IN_ADMIN_REVIEW_EDITOR';
    task.review_status = 'In Admin Review';
    await task.save();

    const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
    if (adminRole) {
      const admins = await User.find({ role_id: adminRole._id });
      for (const a of admins) {
        await createNotification({
          userId: a._id,
          type: 'VIDEO_SUBMITTED_FOR_REVIEW',
          title: '🎬 Video Editor Submitted Cut for Review',
          message: `Video Editor submitted cut v${newVersion} for "${task.task_title || task.title}". Admin approval required.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: 'IN_ADMIN_REVIEW_EDITOR',
      changedBy: req.user._id || req.user.id,
      remarks: `Video Editor uploaded cut v${newVersion} with notes: ${editor_notes || 'Ready for review'}`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'EDITOR_SUBMIT_VIDEO',
      entity: 'tasks',
      entityId: task._id,
      newValue: { version: newVersion, video_url: videoUrl },
      ip: req.ip
    });

    broadcastWorkflowEvent({
      eventType: 'EDITOR_SUBMITTED',
      taskId: task._id.toString(),
      task_code: task.task_code,
      task_title: task.task_title || task.title,
      stage: 'IN_ADMIN_REVIEW_EDITOR',
      badge: 'In Admin Review',
      version: newVersion,
      video_url: videoUrl,
      editor_notes: editor_notes || '',
      message: `🎬 Video Editor uploaded cut v${newVersion} for "${task.task_title || task.title}". Admin approval required.`
    });

    return res.json({
      message: `Cut v${newVersion} submitted to Admin for approval.`,
      task_id: task._id.toString(),
      workflow_stage: 'IN_ADMIN_REVIEW_EDITOR',
      workflow_badge: 'In Admin Review'
    });
  } catch (error) {
    console.error('Error in /api/media/:id/editor-submit:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit edited video' });
  }
});

/**
 * ADMIN REVIEW OF VIDEO EDITOR CUT
 */
router.post('/:id/admin-editor-review', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { decision, notes, revision_notes } = req.body;
    const feedbackNotes = notes || revision_notes || '';

    if (decision !== 'APPROVE' && decision !== 'DISAPPROVE') {
      return res.status(400).json({ error: 'Decision must be APPROVE or DISAPPROVE.' });
    }

    if (decision === 'DISAPPROVE' && !feedbackNotes.trim()) {
      return res.status(400).json({ error: 'Admin must attach revision notes detailing required changes.' });
    }

    let nextStage = '';
    let nextReviewStatus = '';

    if (decision === 'DISAPPROVE') {
      nextStage = 'NEEDS_REVISION_VIDEO';
      nextReviewStatus = 'Needs Revision - Video';

      task.feedback_history.push({
        step: 2,
        action: 'ADMIN_DISAPPROVED_EDITOR',
        title: 'Step 2: Admin Disapproved Video Cut (Looping Back to Video Editor)',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'DISAPPROVE',
        notes: feedbackNotes,
        timestamp: new Date().toISOString()
      });

      if (task.assigned_employee_id) {
        const editor = await Employee.findById(task.assigned_employee_id);
        if (editor && editor.user_id) {
          await createNotification({
            userId: editor.user_id,
            type: 'VIDEO_REVISION_REQUESTED',
            title: '⚠️ Video Cut Revision Required',
            message: `Admin requested revisions on "${task.task_title || task.title}": "${feedbackNotes}"`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }
    } else {
      nextStage = 'SMM_CAPTIONING';
      nextReviewStatus = 'SMM Captioning';

      task.feedback_history.push({
        step: 2,
        action: 'ADMIN_APPROVED_EDITOR',
        title: 'Step 2: Admin Approved Video Cut (Automatically Advanced to SMM)',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'APPROVE',
        notes: feedbackNotes || 'Video cut approved by Admin. Automatically routed to Social Media Manager for captions & hashtags.',
        timestamp: new Date().toISOString()
      });

      if (task.assigned_smm_id) {
        const smm = await Employee.findById(task.assigned_smm_id);
        if (smm && smm.user_id) {
          await createNotification({
            userId: smm.user_id,
            type: 'SMM_TASK_READY',
            title: '✨ Video Cut Approved: Ready for Captions & Hashtags',
            message: `Admin approved the video for "${task.task_title || task.title}". Add captions, hashtags, and submit for final approval.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }
    }

    task.workflow_stage = nextStage;
    task.review_status = nextReviewStatus;
    task.admin_feedback = feedbackNotes;
    await task.save();

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: nextStage,
      changedBy: req.user._id || req.user.id,
      remarks: `Admin decision: ${decision}. ${feedbackNotes}`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: decision === 'APPROVE' ? 'ADMIN_APPROVE_VIDEO_CUT' : 'ADMIN_REJECT_VIDEO_CUT',
      entity: 'tasks',
      entityId: task._id,
      newValue: { decision, notes: feedbackNotes },
      ip: req.ip
    });

    broadcastWorkflowEvent({
      eventType: decision === 'APPROVE' ? 'ADMIN_APPROVED_EDITOR' : 'ADMIN_DISAPPROVED_EDITOR',
      taskId: task._id.toString(),
      task_code: task.task_code,
      task_title: task.task_title || task.title,
      stage: nextStage,
      badge: getWorkflowBadge(nextStage, nextReviewStatus),
      decision,
      notes: feedbackNotes,
      message: decision === 'APPROVE'
        ? `✅ Admin approved video cut for "${task.task_title || task.title}"! Forwarded to SMM.`
        : `⚠️ Admin requested video revisions on "${task.task_title || task.title}": "${feedbackNotes}"`
    });

    return res.json({
      message: decision === 'APPROVE'
        ? 'Video cut approved by Admin! Task automatically moved to Social Media Manager.'
        : 'Revision notes attached. Task looped back directly to Video Editor.',
      workflow_stage: nextStage,
      workflow_badge: getWorkflowBadge(nextStage, nextReviewStatus)
    });
  } catch (error) {
    console.error('Error in /api/media/:id/admin-editor-review:', error);
    return res.status(500).json({ error: error.message || 'Failed to process admin review' });
  }
});

/**
 * STEP 3: SMM SUBMISSION
 */
router.post('/:id/smm-submit', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { caption, hashtags, post_notes, target_platforms, schedule_publish_date } = req.body;
    if (!caption || !caption.trim()) {
      return res.status(400).json({ error: 'Caption is required for post completion.' });
    }

    task.feedback_history.push({
      step: 3,
      action: 'SMM_SUBMITTED_POST',
      title: 'Step 3: SMM Submitted Complete Post (Video + Captions + Hashtags)',
      by_user: req.user.username,
      role: 'Social Media Manager',
      caption: caption.trim(),
      hashtags: hashtags || '',
      target_platforms: target_platforms || 'Instagram Reels, TikTok, YouTube Shorts',
      notes: post_notes || 'Post package submitted to Admin for pre-client publishing approval.',
      timestamp: new Date().toISOString()
    });

    task.caption = caption.trim();
    task.hashtags = hashtags || '';
    task.post_notes = post_notes || '';
    task.target_platforms = target_platforms || 'Instagram Reels, TikTok, YouTube Shorts';
    task.schedule_publish_date = schedule_publish_date || task.due_date;
    task.workflow_stage = 'IN_ADMIN_REVIEW_SMM';
    task.review_status = 'In Admin Review';
    await task.save();

    const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
    if (adminRole) {
      const admins = await User.find({ role_id: adminRole._id });
      for (const a of admins) {
        await createNotification({
          userId: a._id,
          type: 'SMM_POST_SUBMITTED',
          title: '📱 Complete Post Submitted by SMM',
          message: `SMM submitted post captions & hashtags for "${task.task_title || task.title}". Review post before publishing to Client.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: 'IN_ADMIN_REVIEW_SMM',
      changedBy: req.user._id || req.user.id,
      remarks: `SMM submitted complete post for Admin review.`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: 'SMM_SUBMIT_POST',
      entity: 'tasks',
      entityId: task._id,
      newValue: { caption: caption.substring(0, 100), hashtags },
      ip: req.ip
    });

    broadcastWorkflowEvent({
      eventType: 'SMM_SUBMITTED',
      taskId: task._id.toString(),
      task_code: task.task_code,
      task_title: task.task_title || task.title,
      stage: 'IN_ADMIN_REVIEW_SMM',
      badge: 'In Admin Review',
      caption,
      hashtags: hashtags || '',
      message: `📱 SMM submitted complete post for "${task.task_title || task.title}". Waiting for Admin approval.`
    });

    return res.json({
      message: 'Complete post (Video + Captions/Hashtags) submitted to Admin for approval.',
      workflow_stage: 'IN_ADMIN_REVIEW_SMM',
      workflow_badge: 'In Admin Review'
    });
  } catch (error) {
    console.error('Error in /api/media/:id/smm-submit:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit post package' });
  }
});

/**
 * ADMIN REVIEW OF SMM POST
 */
router.post('/:id/admin-smm-review', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { decision, notes, revision_notes } = req.body;
    const feedbackNotes = notes || revision_notes || '';

    if (decision !== 'APPROVE' && decision !== 'DISAPPROVE') {
      return res.status(400).json({ error: 'Decision must be APPROVE or DISAPPROVE.' });
    }

    if (decision === 'DISAPPROVE' && !feedbackNotes.trim()) {
      return res.status(400).json({ error: 'Admin must attach notes detailing required changes for SMM.' });
    }

    let nextStage = '';
    let nextReviewStatus = '';

    if (decision === 'DISAPPROVE') {
      nextStage = 'NEEDS_REVISION_CAPTION';
      nextReviewStatus = 'Needs Revision - Caption';

      task.feedback_history.push({
        step: 3,
        action: 'ADMIN_DISAPPROVED_SMM',
        title: 'Step 3: Admin Disapproved Post Details (Looping Back to SMM)',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'DISAPPROVE',
        notes: feedbackNotes,
        timestamp: new Date().toISOString()
      });

      if (task.assigned_smm_id) {
        const smm = await Employee.findById(task.assigned_smm_id);
        if (smm && smm.user_id) {
          await createNotification({
            userId: smm.user_id,
            type: 'CAPTION_REVISION_REQUESTED',
            title: '⚠️ Caption/Hashtag Revision Required',
            message: `Admin requested changes on "${task.task_title || task.title}": "${feedbackNotes}"`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }
    } else {
      nextStage = 'IN_CLIENT_REVIEW';
      nextReviewStatus = 'In Client Review';

      task.feedback_history.push({
        step: 3,
        action: 'ADMIN_APPROVED_SMM',
        title: 'Step 3: Admin Approved Full Post (Published to Client Dashboard for Final Review)',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'APPROVE',
        notes: feedbackNotes || 'Full post package approved by Admin. Published to Client Dashboard for final client sign-off.',
        timestamp: new Date().toISOString()
      });

      const clientUser = await Client.findById(task.client_id);
      if (clientUser && clientUser.user_id) {
        await createNotification({
          userId: clientUser.user_id,
          type: 'FINAL_POST_FOR_CLIENT_REVIEW',
          title: '🚀 Complete Post Ready for Your Review',
          message: `Your finished post "${task.task_title || task.title}" is ready! Inspect video, captions, hashtags, and grant approval.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    task.workflow_stage = nextStage;
    task.review_status = nextReviewStatus;
    task.client_visible = true;
    task.admin_feedback = feedbackNotes;
    await task.save();

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: nextStage,
      changedBy: req.user._id || req.user.id,
      remarks: `Admin decision on SMM post: ${decision}. ${feedbackNotes}`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: decision === 'APPROVE' ? 'ADMIN_APPROVE_SMM_POST' : 'ADMIN_REJECT_SMM_POST',
      entity: 'tasks',
      entityId: task._id,
      newValue: { decision, notes: feedbackNotes },
      ip: req.ip
    });

    broadcastWorkflowEvent({
      eventType: decision === 'APPROVE' ? 'ADMIN_APPROVED_SMM' : 'ADMIN_DISAPPROVED_SMM',
      taskId: task._id.toString(),
      task_code: task.task_code,
      task_title: task.task_title || task.title,
      stage: nextStage,
      badge: getWorkflowBadge(nextStage, nextReviewStatus),
      decision,
      notes: feedbackNotes,
      message: decision === 'APPROVE'
        ? `✅ Admin approved post for "${task.task_title || task.title}"! Published to Client Dashboard for final review.`
        : `⚠️ Admin requested caption revisions on "${task.task_title || task.title}": "${feedbackNotes}"`
    });

    return res.json({
      message: decision === 'APPROVE'
        ? 'Full post approved by Admin and published to Client Dashboard for final review!'
        : 'Revision notes attached. Task looped back directly to SMM.',
      workflow_stage: nextStage,
      workflow_badge: getWorkflowBadge(nextStage, nextReviewStatus)
    });
  } catch (error) {
    console.error('Error in /api/media/:id/admin-smm-review:', error);
    return res.status(500).json({ error: error.message || 'Failed to process admin SMM review' });
  }
});

/**
 * STEP 4: CLIENT REVIEW & SPLIT FEEDBACK ROUTING
 */
router.post('/:id/client-decision', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { decision, feedback_type, notes, reason } = req.body;
    const clientNotes = notes || reason || '';

    if (decision !== 'APPROVE' && decision !== 'DISAPPROVE') {
      return res.status(400).json({ error: 'Decision must be APPROVE or DISAPPROVE.' });
    }

    let nextStage = '';
    let nextReviewStatus = '';
    let nextStatus = task.status;
    let splitPath = null;

    if (decision === 'APPROVE') {
      nextStage = 'APPROVED';
      nextReviewStatus = 'Approved';
      nextStatus = 'COMPLETED';

      task.feedback_history.push({
        step: 4,
        action: 'CLIENT_FULLY_APPROVED',
        title: 'Step 4: Client Granted Final Approval (Fully Approved / Published)',
        by_user: req.user.username,
        role: 'Client',
        decision: 'APPROVE',
        notes: clientNotes || 'Client approved the deliverable. Ready for social media publishing.',
        timestamp: new Date().toISOString()
      });

      const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
      if (adminRole) {
        const admins = await User.find({ role_id: adminRole._id });
        for (const a of admins) {
          await createNotification({
            userId: a._id,
            type: 'CLIENT_APPROVED_FINAL',
            title: '🎉 Client Approved: Post Fully Published',
            message: `Client approved "${task.task_title || task.title}"! The post is now Fully Approved & Published.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      if (task.assigned_employee_id) {
        const editor = await Employee.findById(task.assigned_employee_id);
        if (editor && editor.user_id) {
          await createNotification({
            userId: editor.user_id,
            type: 'CLIENT_APPROVED_FINAL',
            title: '🎉 Client Approved Your Video Cut!',
            message: `Congratulations! Client fully approved "${task.task_title || task.title}".`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      if (task.assigned_smm_id) {
        const smm = await Employee.findById(task.assigned_smm_id);
        if (smm && smm.user_id) {
          await createNotification({
            userId: smm.user_id,
            type: 'CLIENT_APPROVED_FINAL',
            title: '🎉 Client Approved Your Captions & Hashtags!',
            message: `Congratulations! Client fully approved "${task.task_title || task.title}". Ready for scheduled publishing.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }
    } else {
      if (!clientNotes.trim()) {
        return res.status(400).json({ error: 'Client must provide mandatory feedback/notes explaining what needs changes.' });
      }

      const issueType = feedback_type === 'CONTENT_ISSUE' ? 'CONTENT_ISSUE' : 'VIDEO_ISSUE';

      if (issueType === 'VIDEO_ISSUE') {
        splitPath = 'PATH_A';
        nextStage = 'NEEDS_REVISION_VIDEO';
        nextReviewStatus = 'Needs Revision - Video';
        nextStatus = 'REVISION';

        task.feedback_history.push({
          step: 4,
          action: 'CLIENT_DISAPPROVED_PATH_A',
          title: 'Step 4: Client Disapproved (Path A: Video Related Issue -> Routed directly to Video Editor)',
          by_user: req.user.username,
          role: 'Client',
          decision: 'DISAPPROVE',
          feedback_type: 'VIDEO_ISSUE',
          split_path: 'PATH_A',
          notes: clientNotes,
          routing_info: 'Loop restarted: Video Editor -> Admin -> SMM -> Admin -> Client',
          timestamp: new Date().toISOString()
        });

        if (task.assigned_employee_id) {
          const editor = await Employee.findById(task.assigned_employee_id);
          if (editor && editor.user_id) {
            await createNotification({
              userId: editor.user_id,
              type: 'CLIENT_VIDEO_REVISION',
              title: '⚠️ Client Feedback (Video Edits Required)',
              message: `Client requested video revisions on "${task.task_title || task.title}": "${clientNotes}". Approval loop will restart upon upload.`,
              relatedEntity: 'tasks',
              relatedEntityId: task._id
            });
          }
        }
      } else {
        splitPath = 'PATH_B';
        nextStage = 'NEEDS_REVISION_CAPTION';
        nextReviewStatus = 'Needs Revision - Caption';
        nextStatus = 'REVISION';

        task.feedback_history.push({
          step: 4,
          action: 'CLIENT_DISAPPROVED_PATH_B',
          title: 'Step 4: Client Disapproved (Path B: Content / Caption Issue -> Routed directly to SMM)',
          by_user: req.user.username,
          role: 'Client',
          decision: 'DISAPPROVE',
          feedback_type: 'CONTENT_ISSUE',
          split_path: 'PATH_B',
          notes: clientNotes,
          routing_info: 'Fast loop: SMM -> Admin -> Client',
          timestamp: new Date().toISOString()
        });

        if (task.assigned_smm_id) {
          const smm = await Employee.findById(task.assigned_smm_id);
          if (smm && smm.user_id) {
            await createNotification({
              userId: smm.user_id,
              type: 'CLIENT_CONTENT_REVISION',
              title: '⚠️ Client Feedback (Caption/Content Revision Required)',
              message: `Client requested caption revisions on "${task.task_title || task.title}": "${clientNotes}". Resubmit to Admin once updated.`,
              relatedEntity: 'tasks',
              relatedEntityId: task._id
            });
          }
        }
      }
    }

    task.workflow_stage = nextStage;
    task.review_status = nextReviewStatus;
    task.status = nextStatus;
    task.client_feedback = clientNotes;
    task.client_feedback_type = feedback_type || null;
    task.client_feedback_notes = clientNotes;
    task.split_path = splitPath;
    if (nextStage === 'APPROVED') {
      task.completed_at = new Date();
    }
    await task.save();

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: nextStage,
      changedBy: req.user._id || req.user.id,
      remarks: `Client decision: ${decision} (${splitPath || 'APPROVED'}). Notes: ${clientNotes}`
    });

    await logAudit({
      userId: req.user._id || req.user.id,
      action: decision === 'APPROVE' ? 'CLIENT_APPROVE_POST' : 'CLIENT_REJECT_POST',
      entity: 'tasks',
      entityId: task._id,
      newValue: { decision, split_path: splitPath, feedback: clientNotes },
      ip: req.ip
    });

    broadcastWorkflowEvent({
      eventType: decision === 'APPROVE' ? 'CLIENT_APPROVED' : (feedback_type === 'CONTENT_ISSUE' ? 'CLIENT_DISAPPROVED_PATH_B' : 'CLIENT_DISAPPROVED_PATH_A'),
      taskId: task._id.toString(),
      task_code: task.task_code,
      task_title: task.task_title || task.title,
      stage: nextStage,
      badge: getWorkflowBadge(nextStage, nextReviewStatus),
      decision,
      split_path: splitPath,
      feedback_type,
      notes: clientNotes,
      message: decision === 'APPROVE'
        ? `🎉 Client approved "${task.task_title || task.title}"! Post is now Fully Approved & Published.`
        : `⚠️ Client requested changes (${splitPath === 'PATH_A' ? 'Path A: Video Edits -> Video Editor' : 'Path B: Captions/Hashtags -> SMM'}): "${clientNotes}"`
    });

    return res.json({
      message: decision === 'APPROVE'
        ? 'Post fully approved! Notifications sent to Admin, Video Editor, and SMM.'
        : `Revision notes recorded and routed directly to ${splitPath === 'PATH_A' ? 'Video Editor' : 'Social Media Manager'}.`,
      workflow_stage: nextStage,
      workflow_badge: getWorkflowBadge(nextStage, nextReviewStatus),
      split_path: splitPath
    });
  } catch (error) {
    console.error('Error in /api/media/:id/client-decision:', error);
    return res.status(500).json({ error: error.message || 'Failed to process client decision' });
  }
});

/**
 * Universal Review Endpoint (Backward Compatibility)
 */
router.post('/:id/review', authenticate, async (req, res, next) => {
  const { action, comments, reason, feedback_type } = req.body;
  const isClient = req.user.user_type === 'client';

  if (isClient) {
    req.body.decision = action === 'APPROVE' ? 'APPROVE' : 'DISAPPROVE';
    req.body.notes = comments || reason || '';
    req.body.feedback_type = feedback_type || (reason?.toLowerCase().includes('video') ? 'VIDEO_ISSUE' : 'CONTENT_ISSUE');
    req.url = `/${req.params.id}/client-decision`;
    return router.handle(req, res, next);
  } else {
    const task = await Task.findById(req.params.id);
    req.body.decision = action === 'APPROVE' ? 'APPROVE' : 'DISAPPROVE';
    req.body.notes = comments || reason || '';

    if (task && (task.workflow_stage === 'IN_ADMIN_REVIEW_SMM' || task.workflow_stage === 'SMM_CAPTIONING')) {
      req.url = `/${req.params.id}/admin-smm-review`;
      return router.handle(req, res, next);
    } else {
      req.url = `/${req.params.id}/admin-editor-review`;
      return router.handle(req, res, next);
    }
  }
});

/**
 * 1. TASK CREATION (Admin - Static Post, Carousel, Flyer, Poster)
 */
router.post('/static-task', authenticate, requireRole(['admin']), upload.any(), async (req, res) => {
  try {
    const {
      post_type,
      task_title,
      client_id,
      due_date,
      priority,
      description,
      target_platforms,
      assigned_smm_id,
      schedule_publish_date
    } = req.body;

    let finalClientId = client_id;
    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      finalClientId = client_id;
    } else if (client_id) {
      const foundClient = await Client.findOne({
        $or: [{ client_code: String(client_id) }, { company_name: String(client_id) }]
      });
      if (foundClient) finalClientId = foundClient._id;
    }

    if (!finalClientId) {
      const fallbackClient = await Client.findOne();
      if (fallbackClient) finalClientId = fallbackClient._id;
    }

    if (!task_title || !finalClientId || !due_date) {
      return res.status(400).json({ error: 'Task Title, Client, and Due Date are mandatory.' });
    }

    const validPostTypes = ['Static Post', 'Carousel', 'Flyer', 'Poster'];
    const chosenPostType = validPostTypes.includes(post_type) ? post_type : 'Static Post';

    let smmId = assigned_smm_id || null;
    if (smmId && mongoose.Types.ObjectId.isValid(smmId)) {
      // valid ObjectId
    } else if (smmId) {
      const foundSmm = await Employee.findOne({
        $or: [
          { employee_code: String(smmId) },
          { employee_type: 'marketing_manager' },
          { designation: { $regex: /social|marketing/i } }
        ]
      });
      smmId = foundSmm ? foundSmm._id : null;
    }

    if (!smmId) {
      const smmRow = await Employee.findOne({
        $or: [
          { employee_type: 'marketing_manager' },
          { designation: { $regex: /social|marketing/i } }
        ]
      });
      if (smmRow) smmId = smmRow._id;
    }

    const prefix = chosenPostType === 'Carousel' ? 'CAR' : (chosenPostType === 'Flyer' ? 'FLY' : (chosenPostType === 'Poster' ? 'POS' : 'STAT'));
    const count = await Task.countDocuments({ workflow_type: 'STATIC_GRAPHIC' }) + 1;
    const task_code = `POST-${prefix}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const initialHistory = [{
      step: 1,
      action: 'ADMIN_TASK_CREATED',
      title: `Step 1: Admin Created ${chosenPostType} Task`,
      by_user: req.user.username,
      role: 'Admin',
      notes: description || `Created ${chosenPostType} task "${task_title}" and assigned to Social Media Manager.`,
      timestamp: new Date().toISOString()
    }];

    const task = await Task.create({
      task_code,
      task_title,
      title: task_title,
      client_id: finalClientId,
      task_type: chosenPostType,
      post_type: chosenPostType,
      workflow_type: 'STATIC_GRAPHIC',
      description: description || `${chosenPostType} campaign brief`,
      assigned_smm_id: smmId,
      created_by: req.user._id || req.user.id,
      priority: priority || 'HIGH',
      start_date: new Date(),
      due_date,
      status: 'TODO',
      workflow_stage: 'SMM_DRAFTING',
      client_visible: true,
      target_platforms: target_platforms || 'Instagram, LinkedIn, Facebook',
      schedule_publish_date: schedule_publish_date || due_date,
      review_status: 'Task Created',
      version_count: 0,
      feedback_history: initialHistory
    });

    if (smmId) {
      const smmEmp = await Employee.findById(smmId);
      if (smmEmp && smmEmp.user_id) {
        await createNotification({
          userId: smmEmp.user_id,
          type: 'STATIC_TASK_ASSIGNED',
          title: `🎨 New ${chosenPostType} Task Assigned`,
          message: `Admin assigned new ${chosenPostType} "${task_title}" (Due: ${due_date}). Ready for creative upload and copy drafting.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: null,
      newStage: 'SMM_DRAFTING',
      changedBy: req.user._id || req.user.id,
      remarks: `Step 1: Admin created ${chosenPostType} task "${task_title}" routed to SMM.`
    });

    broadcastWorkflowEvent({
      eventType: 'STATIC_TASK_CREATED',
      taskId: task._id.toString(),
      taskTitle: task_title,
      postType: chosenPostType,
      smmId,
      stage: 'SMM_DRAFTING',
      message: `New ${chosenPostType} "${task_title}" created and routed to Social Media Manager.`
    });

    const populatedTask = await Task.findById(task._id)
      .populate('client_id', 'company_name client_code')
      .populate('assigned_smm_id', 'first_name last_name')
      .lean({ virtuals: true });

    return res.status(201).json({
      message: `New ${chosenPostType} task created and routed to SMM.`,
      task: {
        ...populatedTask,
        id: populatedTask._id.toString(),
        company_name: populatedTask.client_id?.company_name || null,
        client_code: populatedTask.client_id?.client_code || null,
        assigned_smm_name: populatedTask.assigned_smm_id?.first_name ? `${populatedTask.assigned_smm_id.first_name} ${populatedTask.assigned_smm_id.last_name || ''}`.trim() : null
      }
    });
  } catch (err) {
    console.error('Error creating static task:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2A. UPLOAD CREATIVE PICTURES (SMM)
 */
router.post('/upload-creative', authenticate, upload.any(), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      if (req.file) {
        return res.status(201).json({
          success: true,
          message: 'Creative picture uploaded successfully.',
          file: {
            url: `/uploads/${req.file.filename}`,
            name: req.file.originalname,
            size: req.file.size
          },
          files: [{
            url: `/uploads/${req.file.filename}`,
            name: req.file.originalname,
            size: req.file.size,
            order: 1
          }]
        });
      }
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const uploadedFiles = req.files.map((f, idx) => ({
      url: `/uploads/${f.filename}`,
      name: f.originalname,
      size: f.size,
      order: idx + 1
    }));

    return res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} creative picture(s) uploaded successfully.`,
      files: uploadedFiles,
      file: uploadedFiles[0]
    });
  } catch (err) {
    console.error('Error uploading creative picture:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. CONTENT UPLOAD & WRITING (SMM)
 */
router.post('/:id/smm-submit-graphic', authenticate, upload.any(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const {
      caption,
      hashtags,
      post_notes,
      target_platforms,
      schedule_publish_date,
      graphic_image_url: manualGraphicUrl,
      carousel_slides: manualSlidesJson
    } = req.body;

    if (!caption || !caption.trim()) {
      return res.status(400).json({ error: 'Caption is required for post submission.' });
    }

    let graphicImageUrl = manualGraphicUrl || task.graphic_image_url || '';
    let graphicImageName = task.graphic_image_name || '';
    let graphicImageSize = task.graphic_image_size || 0;
    let carouselSlides = [];

    if (manualSlidesJson) {
      try {
        carouselSlides = typeof manualSlidesJson === 'string' ? JSON.parse(manualSlidesJson) : manualSlidesJson;
      } catch (e) {
        carouselSlides = [];
      }
    } else if (task.carousel_slides) {
      carouselSlides = task.carousel_slides;
    }

    if (req.files && req.files.length > 0) {
      if (task.post_type === 'Carousel' || req.files.length > 1) {
        const newSlides = req.files.map((f, i) => ({
          url: `/uploads/${f.filename}`,
          name: f.originalname,
          size: f.size,
          order: carouselSlides.length + i + 1
        }));
        carouselSlides = [...carouselSlides, ...newSlides];
        if (!graphicImageUrl && carouselSlides.length > 0) {
          graphicImageUrl = carouselSlides[0].url;
          graphicImageName = carouselSlides[0].name;
        }
      } else {
        const f = req.files[0];
        graphicImageUrl = `/uploads/${f.filename}`;
        graphicImageName = f.originalname;
        graphicImageSize = f.size;
      }
    }

    if (!graphicImageUrl && carouselSlides.length === 0) {
      if (task.post_type === 'Carousel') {
        carouselSlides = [
          { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80', name: 'Slide 1 - Brand Identity', order: 1 },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80', name: 'Slide 2 - Interior Architecture', order: 2 },
          { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1080&q=80', name: 'Slide 3 - Minimalist Details', order: 3 }
        ];
        graphicImageUrl = carouselSlides[0].url;
        graphicImageName = 'Carousel_Master_Deck';
      } else if (task.post_type === 'Flyer') {
        graphicImageUrl = 'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=1080&q=80';
        graphicImageName = 'Promotional_Flyer_Design.jpg';
      } else if (task.post_type === 'Poster') {
        graphicImageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&q=80';
        graphicImageName = 'Exhibition_Event_Poster.jpg';
      } else {
        graphicImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
        graphicImageName = 'Social_Static_Creative.jpg';
      }
    }

    const versionNum = (task.version_count || 0) + 1;
    task.feedback_history.push({
      step: 2,
      action: 'SMM_SUBMITTED_DRAFT',
      title: `Step 2: SMM Draft v${versionNum} Submitted for Admin Approval`,
      by_user: req.user.username,
      role: 'Social Media Manager',
      notes: post_notes || `Uploaded creative visual asset and drafted copy/hashtags. Submitted for Admin review.`,
      timestamp: new Date().toISOString()
    });

    task.graphic_image_url = graphicImageUrl;
    task.graphic_image_name = graphicImageName;
    task.graphic_image_size = graphicImageSize;
    task.carousel_slides = carouselSlides;
    task.caption = caption.trim();
    task.hashtags = hashtags || '';
    task.post_notes = post_notes || '';
    task.target_platforms = target_platforms || task.target_platforms || 'Instagram, LinkedIn';
    if (schedule_publish_date) task.schedule_publish_date = schedule_publish_date;
    task.workflow_stage = 'IN_ADMIN_GRAPHIC_REVIEW';
    task.review_status = 'Admin Review';
    task.status = 'INTERNAL REVIEW';
    task.version_count = versionNum;
    task.smm_submitted_at = new Date();
    await task.save();

    const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
    if (adminRole) {
      const admins = await User.find({ role_id: adminRole._id });
      for (const a of admins) {
        await createNotification({
          userId: a._id,
          type: 'STATIC_DRAFT_SUBMITTED',
          title: `📋 ${task.post_type || 'Static Post'} Ready for Admin Review`,
          message: `${req.user.username} submitted creative draft & copy for "${task.task_title || task.title}". Awaiting your review.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.workflow_stage,
      newStage: 'IN_ADMIN_GRAPHIC_REVIEW',
      changedBy: req.user._id || req.user.id,
      remarks: `SMM submitted ${task.post_type || 'Static Post'} draft v${versionNum} for Admin review.`
    });

    broadcastWorkflowEvent({
      eventType: 'STATIC_DRAFT_SUBMITTED',
      taskId: task._id.toString(),
      taskTitle: task.task_title || task.title,
      postType: task.post_type,
      stage: 'IN_ADMIN_GRAPHIC_REVIEW',
      message: `${task.post_type || 'Static Post'} "${task.task_title || task.title}" submitted by SMM for Admin review.`
    });

    const updatedTask = await Task.findById(task._id)
      .populate('client_id', 'company_name client_code')
      .populate('assigned_smm_id', 'first_name last_name')
      .lean({ virtuals: true });

    return res.json({
      message: `Draft submitted to Admin for review successfully.`,
      workflow_stage: updatedTask.workflow_stage,
      review_status: updatedTask.review_status,
      task: {
        ...updatedTask,
        id: updatedTask._id.toString(),
        company_name: updatedTask.client_id?.company_name || null,
        client_code: updatedTask.client_id?.client_code || null,
        assigned_smm_name: updatedTask.assigned_smm_id?.first_name ? `${updatedTask.assigned_smm_id.first_name} ${updatedTask.assigned_smm_id.last_name || ''}`.trim() : null
      }
    });
  } catch (err) {
    console.error('Error submitting graphic draft:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. ADMIN APPROVAL LOOP (Graphics)
 */
router.post('/:id/admin-graphic-review', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { decision, notes } = req.body;
    if (!decision || !['APPROVE', 'DISAPPROVE'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be either APPROVE or DISAPPROVE' });
    }

    if (decision === 'DISAPPROVE') {
      if (!notes || !notes.trim()) {
        return res.status(400).json({ error: 'Feedback notes explaining required changes are mandatory when disapproving.' });
      }

      task.feedback_history.push({
        step: 3,
        action: 'ADMIN_DISAPPROVED_GRAPHIC',
        title: 'Step 3: Admin Requested Creative / Copy Changes',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'DISAPPROVE',
        notes: notes.trim(),
        timestamp: new Date().toISOString()
      });

      task.workflow_stage = 'NEEDS_REVISION_SMM';
      task.review_status = 'Revision Required';
      task.status = 'REVISION';
      task.admin_feedback = notes.trim();
      task.revision_source = 'ADMIN';
      await task.save();

      if (task.assigned_smm_id) {
        const smmEmp = await Employee.findById(task.assigned_smm_id);
        if (smmEmp && smmEmp.user_id) {
          await createNotification({
            userId: smmEmp.user_id,
            type: 'REVISION_REQUESTED_ADMIN',
            title: `⚠️ Admin Requested Changes on ${task.post_type || 'Post'}`,
            message: `Admin feedback on "${task.task_title || task.title}": ${notes.trim()}`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      await recordWorkflowHistory({
        entityType: 'task',
        entityId: task._id,
        previousStage: task.workflow_stage,
        newStage: 'NEEDS_REVISION_SMM',
        changedBy: req.user._id || req.user.id,
        remarks: `Admin disapproved: ${notes.trim()}`
      });

      broadcastWorkflowEvent({
        eventType: 'STATIC_ADMIN_REJECTED',
        taskId: task._id.toString(),
        taskTitle: task.task_title || task.title,
        postType: task.post_type,
        stage: 'NEEDS_REVISION_SMM',
        revisionSource: 'ADMIN',
        feedbackNotes: notes.trim(),
        message: `Admin requested revisions for "${task.task_title || task.title}". Looped back to SMM.`
      });

      return res.json({
        message: 'Feedback notes attached. Task looped back directly to SMM for modification.',
        workflow_stage: 'NEEDS_REVISION_SMM',
        review_status: 'Revision Required'
      });
    } else {
      task.feedback_history.push({
        step: 3,
        action: 'ADMIN_APPROVED_GRAPHIC',
        title: 'Step 3: Admin Approved Creative & Copy',
        by_user: req.user.username,
        role: 'Admin',
        decision: 'APPROVE',
        notes: notes || 'Admin verified creative graphic and copy. Published to Client Dashboard for final approval.',
        timestamp: new Date().toISOString()
      });

      task.workflow_stage = 'IN_CLIENT_REVIEW';
      task.review_status = 'Client Review';
      task.status = 'CLIENT REVIEW';
      task.admin_approved_at = new Date();
      await task.save();

      const client = await Client.findById(task.client_id);
      if (client && client.user_id) {
        await createNotification({
          userId: client.user_id,
          type: 'CLIENT_REVIEW_READY',
          title: `🚀 New ${task.post_type || 'Post'} Ready for Approval`,
          message: `Your new ${task.post_type || 'post'} "${task.task_title || task.title}" is ready for your inspection and final sign-off.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }

      if (task.assigned_smm_id) {
        const smmEmp = await Employee.findById(task.assigned_smm_id);
        if (smmEmp && smmEmp.user_id) {
          await createNotification({
            userId: smmEmp.user_id,
            type: 'ADMIN_APPROVED_STATIC',
            title: `✅ Admin Approved ${task.post_type || 'Post'}`,
            message: `Admin approved "${task.task_title || task.title}". Published to Client Dashboard for final sign-off.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      await recordWorkflowHistory({
        entityType: 'task',
        entityId: task._id,
        previousStage: task.workflow_stage,
        newStage: 'IN_CLIENT_REVIEW',
        changedBy: req.user._id || req.user.id,
        remarks: `Admin approved ${task.post_type || 'post'}. Published to Client Dashboard.`
      });

      broadcastWorkflowEvent({
        eventType: 'STATIC_ADMIN_APPROVED',
        taskId: task._id.toString(),
        taskTitle: task.task_title || task.title,
        postType: task.post_type,
        stage: 'IN_CLIENT_REVIEW',
        message: `Admin approved "${task.task_title || task.title}". Published to Client Dashboard for final approval.`
      });

      return res.json({
        message: `Post approved by Admin and published to Client Dashboard.`,
        workflow_stage: 'IN_CLIENT_REVIEW',
        review_status: 'Client Review'
      });
    }
  } catch (err) {
    console.error('Error in admin graphic review:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. CLIENT APPROVAL & NOTIFICATION LOOP (Graphics)
 */
router.post('/:id/client-graphic-review', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('client_id', 'company_name');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { decision, notes } = req.body;
    if (!decision || !['APPROVE', 'DISAPPROVE'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be either APPROVE or DISAPPROVE' });
    }

    const clientCompanyName = task.client_id?.company_name || 'Client';

    if (decision === 'DISAPPROVE') {
      if (!notes || !notes.trim()) {
        return res.status(400).json({ error: 'Client must provide feedback/change notes explaining required modifications.' });
      }

      task.feedback_history.push({
        step: 4,
        action: 'CLIENT_DISAPPROVED_GRAPHIC',
        title: 'Step 4: Client Requested Creative / Copy Changes',
        by_user: req.user.username || 'Client',
        role: 'Client',
        decision: 'DISAPPROVE',
        notes: notes.trim(),
        timestamp: new Date().toISOString()
      });

      task.workflow_stage = 'NEEDS_REVISION_SMM';
      task.review_status = 'Revision Required';
      task.status = 'REVISION';
      task.client_feedback = notes.trim();
      task.client_feedback_notes = notes.trim();
      task.revision_source = 'CLIENT';
      await task.save();

      if (task.assigned_smm_id) {
        const smmEmp = await Employee.findById(task.assigned_smm_id);
        if (smmEmp && smmEmp.user_id) {
          await createNotification({
            userId: smmEmp.user_id,
            type: 'REVISION_REQUESTED_CLIENT',
            title: `⚠️ Client Requested Changes on ${task.post_type || 'Post'}`,
            message: `Client (${clientCompanyName}) requested changes for "${task.task_title || task.title}": ${notes.trim()}`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
      if (adminRole) {
        const admins = await User.find({ role_id: adminRole._id });
        for (const a of admins) {
          await createNotification({
            userId: a._id,
            type: 'CLIENT_REVISION_LOGGED',
            title: `📝 Client Revision Logged: ${task.post_type || 'Post'}`,
            message: `Client (${clientCompanyName}) requested changes for "${task.task_title || task.title}". Routed back to SMM.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      await recordWorkflowHistory({
        entityType: 'task',
        entityId: task._id,
        previousStage: task.workflow_stage,
        newStage: 'NEEDS_REVISION_SMM',
        changedBy: req.user._id || req.user.id,
        remarks: `Client requested changes: ${notes.trim()}. Routed back to SMM.`
      });

      broadcastWorkflowEvent({
        eventType: 'STATIC_CLIENT_REJECTED',
        taskId: task._id.toString(),
        taskTitle: task.task_title || task.title,
        postType: task.post_type,
        stage: 'NEEDS_REVISION_SMM',
        revisionSource: 'CLIENT',
        feedbackNotes: notes.trim(),
        message: `Client requested changes for "${task.task_title || task.title}". Looped directly back to SMM.`
      });

      return res.json({
        message: 'Feedback submitted. Task looped directly back to SMM for modification.',
        workflow_stage: 'NEEDS_REVISION_SMM',
        review_status: 'Revision Required'
      });
    } else {
      task.feedback_history.push({
        step: 4,
        action: 'CLIENT_APPROVED_GRAPHIC',
        title: 'Step 4: Client Fully Approved Post Deliverable',
        by_user: req.user.username || 'Client',
        role: 'Client',
        decision: 'APPROVE',
        notes: notes || 'Client approved post for scheduling & publishing.',
        timestamp: new Date().toISOString()
      });

      task.workflow_stage = 'APPROVED';
      task.review_status = 'Fully Approved';
      task.status = 'COMPLETED';
      task.completed_at = new Date();
      task.client_approved_at = new Date();
      await task.save();

      const adminRole = await (await import('../models/Role.js')).default.findOne({ name: 'admin' });
      if (adminRole) {
        const admins = await User.find({ role_id: adminRole._id });
        for (const a of admins) {
          await createNotification({
            userId: a._id,
            type: 'POST_FULLY_APPROVED',
            title: `🎉 Client Approved ${task.post_type || 'Post'}!`,
            message: `Client (${clientCompanyName}) fully approved ${task.post_type || 'post'} "${task.task_title || task.title}". Ready for scheduling & publishing.`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      if (task.assigned_smm_id) {
        const smmEmp = await Employee.findById(task.assigned_smm_id);
        if (smmEmp && smmEmp.user_id) {
          await createNotification({
            userId: smmEmp.user_id,
            type: 'POST_FULLY_APPROVED',
            title: `🎉 Client Approved Your ${task.post_type || 'Post'}!`,
            message: `Congratulations! Client (${clientCompanyName}) has officially approved your ${task.post_type || 'post'} "${task.task_title || task.title}".`,
            relatedEntity: 'tasks',
            relatedEntityId: task._id
          });
        }
      }

      await recordWorkflowHistory({
        entityType: 'task',
        entityId: task._id,
        previousStage: task.workflow_stage,
        newStage: 'APPROVED',
        changedBy: req.user._id || req.user.id,
        remarks: `Client (${clientCompanyName}) fully approved ${task.post_type || 'post'}. Finalized.`
      });

      broadcastWorkflowEvent({
        eventType: 'STATIC_FULLY_APPROVED',
        taskId: task._id.toString(),
        taskTitle: task.task_title || task.title,
        postType: task.post_type,
        stage: 'APPROVED',
        clientName: clientCompanyName,
        message: `🎉 Success! Client (${clientCompanyName}) fully approved ${task.post_type || 'post'} "${task.task_title || task.title}".`
      });

      return res.json({
        message: `Post fully approved and finalized. Success notifications sent to Admin and SMM.`,
        workflow_stage: 'APPROVED',
        review_status: 'Fully Approved'
      });
    }
  } catch (err) {
    console.error('Error in client graphic review:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE SINGLE TASK
 */
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const taskId = req.params.id;
    await WorkflowHistory.deleteMany({ entity_id: taskId });
    await Notification.deleteMany({ related_entity: 'tasks', related_entity_id: taskId });
    await Task.findByIdAndDelete(taskId);

    broadcastWorkflowEvent({
      eventType: 'TASK_DELETED',
      taskId: taskId.toString(),
      message: `Task #${taskId} deleted.`
    });

    return res.json({ message: `Task #${taskId} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting task:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * CLEAN ALL TASKS
 */
router.post('/clean-tasks', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    await Task.deleteMany({
      $or: [
        { task_type: 'Video Editing' },
        { raw_file_url: { $ne: null } },
        { edited_video_url: { $ne: null } },
        { workflow_type: 'STATIC_GRAPHIC' },
        { post_type: { $in: ['Static Post', 'Carousel', 'Flyer', 'Poster'] } }
      ]
    });

    broadcastWorkflowEvent({
      eventType: 'TASKS_CLEANED',
      message: 'All mock and sample tasks removed. System operating cleanly in real time.'
    });

    return res.json({ message: 'All mock tasks deleted successfully. Ready for real-time operation.' });
  } catch (err) {
    console.error('Error cleaning tasks:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
