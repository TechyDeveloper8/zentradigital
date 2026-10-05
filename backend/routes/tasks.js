import express from 'express';
import mongoose from 'mongoose';
import { Task, Client, Project, Employee, User, Role } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Tasks with Filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, project_id, assigned_to, status, priority, overdue, search } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (req.user.role_name === 'editor' && req.employee) {
      query.$or = [
        { assigned_to: req.employee._id },
        { assigned_to: null }
      ];
    }

    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) query.client_id = client_id;
    if (project_id && mongoose.Types.ObjectId.isValid(project_id)) query.project_id = project_id;
    if (assigned_to && mongoose.Types.ObjectId.isValid(assigned_to)) query.assigned_to = assigned_to;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (overdue === 'true') {
      const today = new Date();
      query.due_date = { $lt: today };
      query.status = { $ne: 'COMPLETED' };
    }

    let tasks = await Task.find(query)
      .populate('client_id')
      .populate('project_id')
      .populate('assigned_to')
      .sort({ created_at: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(s)) ||
        (t.task_code && t.task_code.toLowerCase().includes(s)) ||
        (t.client_id?.company_name && t.client_id.company_name.toLowerCase().includes(s))
      );
    }

    const formatted = tasks.map(t => {
      const c = t.client_id;
      const p = t.project_id;
      const e = t.assigned_to;

      return {
        ...t.toJSON(),
        task_title: t.title,
        company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        project_name: p?.project_name || '',
        assigned_employee_name: e ? `${e.first_name} ${e.last_name}` : '',
        reviewer_name: '',
        created_by_username: ''
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing tasks:', err);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// Single Task Detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.findById(req.params.id)
      .populate('client_id')
      .populate('project_id')
      .populate('assigned_to')
      .populate({
        path: 'comments.user_id',
        select: 'username user_type'
      });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const c = task.client_id;
    const p = task.project_id;
    const e = task.assigned_to;

    const formattedTask = {
      ...task.toJSON(),
      task_title: task.title,
      company_name: c?.company_name || '',
      client_code: c?.client_code || '',
      project_name: p?.project_name || '',
      assigned_employee_name: e ? `${e.first_name} ${e.last_name}` : '',
      reviewer_name: ''
    };

    const formattedComments = (task.comments || []).map(cm => ({
      ...cm.toObject ? cm.toObject() : cm,
      username: cm.user_id?.username || 'User',
      user_type: cm.user_id?.user_type || 'employee'
    }));

    res.json({
      task: formattedTask,
      comments: formattedComments,
      history: []
    });
  } catch (err) {
    console.error('Error fetching task detail:', err);
    res.status(500).json({ error: 'Failed to retrieve task.' });
  }
});

// Create Task
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      task_title, title, client_id, project_id, task_type, description,
      assigned_employee_id, priority, start_date, due_date, estimated_hours, status
    } = req.body;

    const finalTitle = task_title || title;
    if (!finalTitle || !client_id || !due_date) {
      return res.status(400).json({ error: 'Task title, client, and due date are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const count = await Task.countDocuments() + 1;
    const task_code = `TSK-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const newTask = await Task.create({
      task_code,
      title: finalTitle,
      client_id,
      project_id: project_id && mongoose.Types.ObjectId.isValid(project_id) ? project_id : null,
      assigned_to: assigned_employee_id && mongoose.Types.ObjectId.isValid(assigned_employee_id) ? assigned_employee_id : null,
      created_by: req.user._id,
      task_type: task_type || 'Creative Production',
      description: description || '',
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      workflow_stage: 'INBOX',
      start_date: start_date ? new Date(start_date) : new Date(),
      due_date: new Date(due_date),
      estimated_hours: Number(estimated_hours) || 0
    });

    if (assigned_employee_id && mongoose.Types.ObjectId.isValid(assigned_employee_id)) {
      const emp = await Employee.findById(assigned_employee_id);
      if (emp?.user_id) {
        await createNotification({
          userId: emp.user_id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You were assigned task ${task_code}: "${finalTitle}" due on ${due_date}.`,
          relatedEntity: 'tasks',
          relatedEntityId: newTask._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: newTask._id,
      previousStage: null,
      newStage: status || 'TODO',
      changedBy: req.user.id,
      remarks: 'Task created'
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'tasks',
      entityId: newTask._id,
      newValue: { task_code, title: finalTitle, client_id },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: { ...newTask.toJSON(), task_title: newTask.title }
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update Task
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const {
      task_title, title, task_type, description, assigned_employee_id,
      priority, due_date, actual_hours, status
    } = req.body;

    const prevStatus = task.status;
    const newStatus = status || task.status;

    if (task_title || title) task.title = task_title || title;
    if (task_type !== undefined) task.task_type = task_type;
    if (description !== undefined) task.description = description;
    if (assigned_employee_id !== undefined) task.assigned_to = mongoose.Types.ObjectId.isValid(assigned_employee_id) ? assigned_employee_id : null;
    if (priority !== undefined) task.priority = priority;
    if (due_date !== undefined) task.due_date = new Date(due_date);
    if (actual_hours !== undefined) task.actual_hours = Number(actual_hours);
    if (status !== undefined) {
      task.status = newStatus;
      task.workflow_stage = newStatus;
    }

    await task.save();

    if (newStatus !== prevStatus) {
      await recordWorkflowHistory({
        entityType: 'task',
        entityId: task._id,
        previousStage: prevStatus,
        newStage: newStatus,
        changedBy: req.user.id,
        remarks: `Status updated from ${prevStatus} to ${newStatus}`
      });

      await logAudit({
        userId: req.user.id,
        action: 'STATUS_CHANGED',
        entity: 'tasks',
        entityId: task._id,
        oldValue: { status: prevStatus },
        newValue: { status: newStatus },
        ip: req.ip
      });
    }

    res.json({ message: 'Task updated successfully', task: { ...task.toJSON(), task_title: task.title } });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Upload Video for Review
router.post('/:id/upload-video', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { edited_video_url, edited_video_name, video_duration, notes } = req.body;
    const newVersionCount = (Number(task.version_count) || 0) + 1;

    task.edited_video_url = edited_video_url || 'https://assets.mixkit.co/videos/preview/mixkit-luxury-fashion-model-in-studio-41154-large.mp4';
    task.edited_video_name = edited_video_name || `Video_Edit_v${newVersionCount}.mp4`;
    task.video_duration = video_duration || '00:45';
    task.version_count = newVersionCount;
    task.review_status = 'Pending Approval';
    task.status = 'INTERNAL_REVIEW';
    task.workflow_stage = 'INTERNAL_REVIEW';

    const submissionEntry = {
      reviewer: req.user.username,
      role: req.user.role_name,
      decision: 'SUBMISSION',
      comment: notes || `Cut v${newVersionCount} ready for review`,
      date: new Date()
    };

    task.feedback_history.push(submissionEntry);
    await task.save();

    // Notify Admin
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const adminUsers = await User.find({ role_id: adminRole._id });
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin._id,
          type: 'VIDEO_SUBMITTED',
          title: `Video Edit Submitted (v${newVersionCount}) 🎬`,
          message: `${req.user.username} submitted video edit for "${task.title}". Ready for review.`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.status,
      newStage: 'INTERNAL_REVIEW',
      changedBy: req.user.id,
      remarks: `Uploaded video cut v${newVersionCount}: ${notes || 'Ready for review'}`
    });

    res.json({
      message: `Video edit version ${newVersionCount} submitted and routed to Admin view for approval`,
      task: { ...task.toJSON(), task_title: task.title }
    });
  } catch (err) {
    console.error('Error uploading video:', err);
    res.status(500).json({ error: 'Failed to upload video edit.' });
  }
});

// Admin Review Feedback & Approval Loop
router.post('/:id/review', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { action, comments, reason } = req.body;
    if (action !== 'APPROVE' && action !== 'REQUEST_CHANGES') {
      return res.status(400).json({ error: 'Action must be APPROVE or REQUEST_CHANGES.' });
    }

    const isApproved = action === 'APPROVE';
    const feedbackText = comments || reason || (isApproved ? 'Approved by Admin' : 'Changes requested');

    task.review_status = isApproved ? 'Approved' : 'Needs Revision';
    task.status = isApproved ? 'COMPLETED' : 'REVISION';
    task.workflow_stage = isApproved ? 'APPROVED' : 'REVISION';
    task.admin_feedback = feedbackText;

    const reviewEntry = {
      reviewer: req.user.username,
      role: req.user.role_name,
      decision: action,
      comment: feedbackText,
      date: new Date()
    };
    task.feedback_history.push(reviewEntry);
    await task.save();

    // Notify Video Editor
    if (task.assigned_to) {
      const editor = await Employee.findById(task.assigned_to);
      if (editor?.user_id) {
        await createNotification({
          userId: editor.user_id,
          type: isApproved ? 'TASK_APPROVED' : 'REVISION_REQUESTED',
          title: isApproved ? 'Video Task Approved! 🎉' : 'Revisions Requested on Video ⚠️',
          message: isApproved
            ? `Admin approved your video edit for "${task.title}".`
            : `Admin requested revisions on "${task.title}": ${feedbackText}`,
          relatedEntity: 'tasks',
          relatedEntityId: task._id
        });
      }
    }

    await recordWorkflowHistory({
      entityType: 'task',
      entityId: task._id,
      previousStage: task.status,
      newStage: task.status,
      changedBy: req.user.id,
      remarks: `Admin review: ${action} - ${feedbackText}`
    });

    res.json({
      message: isApproved ? 'Video task explicitly approved! Task completed.' : 'Changes requested. Task remains active for editor re-upload.',
      task: { ...task.toJSON(), task_title: task.title }
    });
  } catch (err) {
    console.error('Error in task review:', err);
    res.status(500).json({ error: 'Failed to process task review.' });
  }
});

// Add Task Comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.comments.push({
      user_id: req.user._id,
      comment: comment.trim()
    });
    await task.save();

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error('Error adding task comment:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

export default router;
