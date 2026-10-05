import express from 'express';
import { Client, Lead, Task, ContentItem, ClientRequest } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Global Permission-Aware Search
router.get('/', authenticate, async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const regex = new RegExp(query, 'i');
    const results = [];

    // 1. Clients
    if (req.user.user_type !== 'client') {
      const clients = await Client.find({
        $or: [{ company_name: regex }, { client_code: regex }]
      }).limit(5);

      results.push(...clients.map(c => ({
        id: c._id.toString(),
        code: c.client_code,
        title: c.company_name,
        type: 'client',
        subtitle: c.status
      })));
    }

    // 2. Leads (sales/admin/manager)
    if (['admin', 'sales', 'marketing_manager'].includes(req.user.role_name)) {
      const leads = await Lead.find({
        $or: [{ company_name: regex }, { contact_person: regex }, { lead_code: regex }]
      }).limit(5);

      results.push(...leads.map(l => ({
        id: l._id.toString(),
        code: l.lead_code,
        title: l.company_name,
        type: 'lead',
        subtitle: l.status
      })));
    }

    // 3. Tasks
    const taskQuery = {
      $or: [{ title: regex }, { task_code: regex }]
    };
    if (req.user.user_type === 'client' && req.client) {
      taskQuery.client_id = req.client._id;
    }
    const tasks = await Task.find(taskQuery).limit(5);
    results.push(...tasks.map(t => ({
      id: t._id.toString(),
      code: t.task_code || 'TASK',
      title: t.title,
      type: 'task',
      subtitle: t.status
    })));

    // 4. Content Items
    const contentQuery = {
      $or: [{ title: regex }, { caption: regex }]
    };
    if (req.user.user_type === 'client' && req.client) {
      contentQuery.client_id = req.client._id;
      contentQuery.workflow_stage = { $nin: ['INBOX', 'PLANNING'] };
    }
    const content = await ContentItem.find(contentQuery).limit(5);
    results.push(...content.map(ci => ({
      id: ci._id.toString(),
      code: ci.platform,
      title: ci.title,
      type: 'content',
      subtitle: ci.workflow_stage
    })));

    // 5. Client Requests
    const reqQuery = {
      $or: [{ title: regex }, { request_code: regex }]
    };
    if (req.user.user_type === 'client' && req.client) {
      reqQuery.client_id = req.client._id;
    }
    const requests = await ClientRequest.find(reqQuery).limit(5);
    results.push(...requests.map(cr => ({
      id: cr._id.toString(),
      code: cr.request_code,
      title: cr.title,
      type: 'request',
      subtitle: cr.status
    })));

    res.json({ results });
  } catch (err) {
    console.error('Error in search:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

export default router;
