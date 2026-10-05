import express from 'express';
import mongoose from 'mongoose';
import { ClientRequest, Client, Employee, User, Project } from '../models/index.js';
import { logAudit, createNotification, recordWorkflowHistory } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper: Auto-suggest employee ID based on category and client assignment
async function suggestAssignee(clientId, category) {
  try {
    const client = await Client.findById(clientId).populate('account_manager_id');
    if (client?.account_manager_id) return client.account_manager_id._id;

    const anyEmp = await Employee.findOne({ employment_status: 'Active' });
    return anyEmp ? anyEmp._id : null;
  } catch {
    return null;
  }
}

// List Client Requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, status, category, priority, assigned_to, search } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (req.user.role_name === 'editor' && req.employee) {
      query.assigned_to = req.employee._id;
    }

    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigned_to && mongoose.Types.ObjectId.isValid(assigned_to)) {
      query.assigned_to = assigned_to;
    }

    let requests = await ClientRequest.find(query)
      .populate('client_id')
      .populate('project_id')
      .populate('assigned_to')
      .sort({ created_at: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      requests = requests.filter(r =>
        (r.title && r.title.toLowerCase().includes(s)) ||
        (r.request_code && r.request_code.toLowerCase().includes(s)) ||
        (r.client_id?.company_name && r.client_id.company_name.toLowerCase().includes(s))
      );
    }

    const formatted = requests.map(r => {
      const c = r.client_id;
      const p = r.project_id;
      const e = r.assigned_to;

      return {
        ...r.toJSON(),
        request_title: r.title,
        company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        project_name: p?.project_name || '',
        assigned_employee_name: e ? `${e.first_name} ${e.last_name}` : '',
        assigned_employee_designation: e?.designation || '',
        created_by_username: ''
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing client requests:', err);
    res.status(500).json({ error: 'Failed to retrieve client requests.' });
  }
});

// Single Request Detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Client request not found' });
    }

    const request = await ClientRequest.findById(req.params.id)
      .populate('client_id')
      .populate('project_id')
      .populate('assigned_to')
      .populate({
        path: 'comments.user_id',
        select: 'username user_type'
      });

    if (!request) {
      return res.status(404).json({ error: 'Client request not found' });
    }

    const c = request.client_id;
    const p = request.project_id;
    const e = request.assigned_to;

    const formattedComments = (request.comments || []).map(cm => ({
      ...cm.toObject ? cm.toObject() : cm,
      user_name: cm.user_id?.username || 'User'
    }));

    const result = {
      ...request.toJSON(),
      request_title: request.title,
      company_name: c?.company_name || '',
      client_code: c?.client_code || '',
      project_name: p?.project_name || '',
      assigned_employee_name: e ? `${e.first_name} ${e.last_name}` : '',
      assigned_employee_designation: e?.designation || '',
      assigned_employee_phone: e?.phone || '',
      comments: formattedComments
    };

    res.json({ request: result, comments: formattedComments, history: [] });
  } catch (err) {
    console.error('Error fetching request detail:', err);
    res.status(500).json({ error: 'Failed to retrieve client request.' });
  }
});

// Create Request
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      client_id, project_id, title, request_title, description, category,
      priority, target_date, reference_links, files, assigned_employee_id
    } = req.body;

    const finalTitle = title || request_title;
    if (!finalTitle) {
      return res.status(400).json({ error: 'Request title is required.' });
    }

    let finalClientId = client_id;
    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (client) finalClientId = client._id;
    }

    if (!finalClientId || !mongoose.Types.ObjectId.isValid(finalClientId)) {
      return res.status(400).json({ error: 'Valid Client is required for creating a request.' });
    }

    const count = await ClientRequest.countDocuments() + 1;
    const request_code = `REQ-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const assignedEmpId = (assigned_employee_id && mongoose.Types.ObjectId.isValid(assigned_employee_id))
      ? assigned_employee_id
      : await suggestAssignee(finalClientId, category);

    const newRequest = await ClientRequest.create({
      client_id: finalClientId,
      project_id: project_id && mongoose.Types.ObjectId.isValid(project_id) ? project_id : null,
      request_code,
      title: finalTitle,
      description: description || '',
      request_type: category || 'General',
      priority: priority || 'MEDIUM',
      status: 'SUBMITTED',
      assigned_to: assignedEmpId,
      due_date: target_date ? new Date(target_date) : null,
      attachments: Array.isArray(files) ? files : []
    });

    if (assignedEmpId) {
      const emp = await Employee.findById(assignedEmpId);
      if (emp?.user_id) {
        await createNotification({
          userId: emp.user_id,
          type: 'REQUEST_ASSIGNED',
          title: `New Client Request (${newRequest.request_code})`,
          message: `You were assigned request "${newRequest.title}".`,
          relatedEntity: 'client_requests',
          relatedEntityId: newRequest._id
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'client_requests',
      entityId: newRequest._id,
      newValue: { request_code: newRequest.request_code, title: newRequest.title },
      ip: req.ip
    });

    res.status(201).json({
      message: 'Client request created successfully',
      request: newRequest.toJSON()
    });
  } catch (err) {
    console.error('Error creating client request:', err);
    res.status(500).json({ error: 'Failed to create client request.' });
  }
});

// Update Request Status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = await ClientRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const prevStatus = request.status;
    request.status = status;
    await request.save();

    await recordWorkflowHistory({
      entityType: 'request',
      entityId: request._id,
      previousStage: prevStatus,
      newStage: status,
      changedBy: req.user.id,
      remarks: remarks || ''
    });

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGED',
      entity: 'client_requests',
      entityId: request._id,
      oldValue: { status: prevStatus },
      newValue: { status, remarks },
      ip: req.ip
    });

    res.json({ message: `Request status transitioned to ${status}`, request: request.toJSON() });
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

// Add Comment to Request
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { comment, attachment_url } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = await ClientRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const newComment = {
      user_id: req.user._id,
      comment: comment.trim(),
      attachment_url: attachment_url || null
    };

    request.comments.push(newComment);
    await request.save();

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error('Error adding request comment:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

export default router;
