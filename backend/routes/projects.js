import express from 'express';
import mongoose from 'mongoose';
import { Project, Client, Employee, Task, ContentItem } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List Projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { client_id, status, search } = req.query;

    const query = {};

    if (req.user.user_type === 'client') {
      const client = await Client.findOne({ user_id: req.user._id });
      if (!client) return res.json([]);
      query.client_id = client._id;
    } else if (req.user.role_name !== 'admin' && req.employee) {
      query.$or = [
        { project_manager_id: req.employee._id },
        { 'members.employee_id': req.employee._id }
      ];
    }

    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }
    if (status) query.status = status;

    let projects = await Project.find(query)
      .populate('client_id')
      .populate('project_manager_id')
      .sort({ created_at: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      projects = projects.filter(p =>
        (p.project_name && p.project_name.toLowerCase().includes(s)) ||
        (p.client_id?.company_name && p.client_id.company_name.toLowerCase().includes(s))
      );
    }

    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project_id: { $in: projectIds } });

    const taskCountMap = new Map();
    const completedCountMap = new Map();
    for (const t of tasks) {
      const pid = t.project_id?.toString();
      taskCountMap.set(pid, (taskCountMap.get(pid) || 0) + 1);
      if (t.status === 'COMPLETED') {
        completedCountMap.set(pid, (completedCountMap.get(pid) || 0) + 1);
      }
    }

    const formatted = projects.map(p => {
      const pid = p._id.toString();
      const cl = p.client_id;
      const pm = p.project_manager_id;

      return {
        ...p.toJSON(),
        company_name: cl?.company_name || '',
        client_code: cl?.client_code || '',
        project_manager_name: pm ? `${pm.first_name} ${pm.last_name}` : '',
        total_tasks: taskCountMap.get(pid) || 0,
        completed_tasks: completedCountMap.get(pid) || 0
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
});

// Single Project Detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await Project.findById(req.params.id)
      .populate('client_id')
      .populate('project_manager_id')
      .populate('members.employee_id');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const cl = project.client_id;
    const pm = project.project_manager_id;

    const formattedProject = {
      ...project.toJSON(),
      company_name: cl?.company_name || '',
      client_code: cl?.client_code || '',
      project_manager_name: pm ? `${pm.first_name} ${pm.last_name}` : '',
      service_name: ''
    };

    const members = (project.members || []).map(m => {
      const e = m.employee_id;
      return {
        ...m.toObject ? m.toObject() : m,
        employee_code: e?.employee_code || '',
        first_name: e?.first_name || '',
        last_name: e?.last_name || '',
        designation: e?.designation || '',
        employee_type: e?.employee_type || ''
      };
    });

    const tasks = await Task.find({ project_id: project._id }).populate('assigned_to').sort({ due_date: 1 });
    const formattedTasks = tasks.map(t => {
      const e = t.assigned_to;
      return {
        ...t.toJSON(),
        assigned_name: e ? `${e.first_name} ${e.last_name}` : ''
      };
    });

    const contentItems = await ContentItem.find({ project_id: project._id }).populate('assigned_creator_id');
    const formattedContent = contentItems.map(ci => {
      const ed = ci.assigned_creator_id;
      return {
        ...ci.toJSON(),
        editor_name: ed ? `${ed.first_name} ${ed.last_name}` : ''
      };
    });

    res.json({
      project: formattedProject,
      members,
      tasks: formattedTasks,
      contentItems: formattedContent
    });
  } catch (err) {
    console.error('Error fetching project detail:', err);
    res.status(500).json({ error: 'Failed to retrieve project.' });
  }
});

// Create Project
router.post('/', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    const {
      project_name, client_id, description, start_date, end_date,
      project_manager_id, budget, status, assigned_employee_ids
    } = req.body;

    if (!project_name || !client_id || !start_date) {
      return res.status(400).json({ error: 'Project name, client, and start date are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const memberList = [];
    if (assigned_employee_ids && Array.isArray(assigned_employee_ids)) {
      for (const empId of assigned_employee_ids) {
        if (mongoose.Types.ObjectId.isValid(empId)) {
          memberList.push({
            employee_id: empId,
            project_role: 'Team Member'
          });
        }
      }
    }

    const newProject = await Project.create({
      project_name,
      client_id,
      description: description || '',
      start_date: new Date(start_date),
      target_end_date: end_date ? new Date(end_date) : null,
      project_manager_id: project_manager_id && mongoose.Types.ObjectId.isValid(project_manager_id) ? project_manager_id : null,
      budget: Number(budget) || 0,
      status: status || 'ACTIVE',
      members: memberList
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATED',
      entity: 'projects',
      entityId: newProject._id,
      newValue: { project_name, client_id },
      ip: req.ip
    });

    res.status(201).json({ message: 'Project created successfully', project: newProject.toJSON() });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// Update Project
router.put('/:id', authenticate, requireRole(['admin', 'marketing_manager']), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const {
      project_name, description, start_date, end_date,
      project_manager_id, budget, status
    } = req.body;

    if (project_name !== undefined) project.project_name = project_name;
    if (description !== undefined) project.description = description;
    if (start_date !== undefined) project.start_date = new Date(start_date);
    if (end_date !== undefined) project.target_end_date = new Date(end_date);
    if (project_manager_id !== undefined) project.project_manager_id = mongoose.Types.ObjectId.isValid(project_manager_id) ? project_manager_id : null;
    if (budget !== undefined) project.budget = Number(budget);
    if (status !== undefined) project.status = status;

    await project.save();

    res.json({ message: 'Project updated successfully', project: project.toJSON() });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

export default router;
