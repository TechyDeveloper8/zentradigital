import express from 'express';
import mongoose from 'mongoose';
import { Chat, ChatMessage, Client, Project, ClientRequest, User, Role, Employee } from '../models/index.js';
import { logAudit } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';
import { sendToUser } from '../websocket.js';

const router = express.Router();

// List My Chats
router.get('/', authenticate, async (req, res) => {
  try {
    const query = {
      'members.user_id': req.user._id
    };

    if (req.user.user_type === 'client') {
      query.chat_type = 'CLIENT_COMMUNICATION';
    }

    const chats = await Chat.find(query)
      .populate('client_id')
      .populate('project_id')
      .sort({ updated_at: -1 });

    const chatIds = chats.map(c => c._id);
    const lastMessages = await ChatMessage.aggregate([
      { $match: { chat_id: { $in: chatIds } } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$chat_id',
          last_message: { $first: '$message' },
          last_message_at: { $first: '$created_at' }
        }
      }
    ]);

    const msgMap = new Map(lastMessages.map(m => [m._id.toString(), m]));

    const formatted = chats.map(c => {
      const cid = c._id.toString();
      const msgInfo = msgMap.get(cid);
      const member = (c.members || []).find(m => m.user_id?.toString() === req.user.id);

      return {
        ...c.toJSON(),
        client_name: c.client_id?.company_name || '',
        project_name: c.project_id?.project_name || '',
        last_message: msgInfo?.last_message || '',
        last_message_at: msgInfo?.last_message_at || c.updated_at,
        unread_count: 0
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error listing chats:', err);
    res.status(500).json({ error: 'Failed to retrieve chats.' });
  }
});

// Messages in a Chat
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const chatId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const isMember = (chat.members || []).some(m => m.user_id?.toString() === req.user.id);
    if (!isMember && req.user.role_name !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You are not a participant in this conversation.' });
    }

    const messages = await ChatMessage.find({ chat_id: chat._id })
      .populate({
        path: 'sender_user_id',
        populate: { path: 'role_id' }
      })
      .sort({ created_at: 1 });

    const userIds = messages.map(m => m.sender_user_id?._id).filter(Boolean);
    const employees = await Employee.find({ user_id: { $in: userIds } });
    const empMap = new Map(employees.map(e => [e.user_id.toString(), e]));

    const formatted = messages.map(m => {
      const u = m.sender_user_id;
      const r = u?.role_id;
      const emp = u ? empMap.get(u._id.toString()) : null;

      return {
        ...m.toJSON(),
        sender_username: u?.username || '',
        sender_type: u?.user_type || '',
        sender_role: r?.name || '',
        sender_full_name: emp ? `${emp.first_name} ${emp.last_name}` : u?.username || ''
      };
    });

    // Update last_read_at
    await Chat.updateOne(
      { _id: chat._id, 'members.user_id': req.user._id },
      { $set: { 'members.$.last_read_at': new Date() } }
    );

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// Send Message
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { message, attachment_url } = req.body;

    if (!message && !attachment_url) {
      return res.status(400).json({ error: 'Message content or attachment is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (req.user.user_type === 'client' && chat.chat_type !== 'CLIENT_COMMUNICATION') {
      return res.status(403).json({ error: 'Access denied: Internal chat is strictly confidential.' });
    }

    const newMsg = await ChatMessage.create({
      chat_id: chat._id,
      sender_user_id: req.user._id,
      message: message || '',
      attachment_url: attachment_url || null
    });

    // Notify other members via WebSocket
    for (const m of chat.members || []) {
      if (m.user_id?.toString() !== req.user.id) {
        sendToUser(m.user_id.toString(), {
          type: 'NEW_CHAT_MESSAGE',
          chatId,
          messageId: newMsg._id.toString(),
          sender: req.user.username,
          content: message
        });
      }
    }

    const createdMessage = {
      ...newMsg.toJSON(),
      sender_username: req.user.username,
      sender_type: req.user.user_type,
      sender_role: req.user.role_name,
      sender_full_name: req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : req.user.username
    };

    res.status(201).json(createdMessage);
  } catch (err) {
    console.error('Error sending chat message:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Convert Chat Message to Structured Client Request
router.post('/messages/:messageId/convert-to-request', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { category, priority, due_date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (msg.converted_request_id) {
      return res.status(400).json({ error: 'This message has already been converted to a request.' });
    }

    const chat = await Chat.findById(msg.chat_id);
    const clientId = chat?.client_id || (req.client ? req.client._id : null);

    const count = await ClientRequest.countDocuments() + 1;
    const request_code = `REQ-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
    const request_title = msg.message.slice(0, 60) || 'Client Chat Request';

    const newReq = await ClientRequest.create({
      request_code,
      client_id: clientId,
      project_id: chat?.project_id || null,
      title: request_title,
      request_type: category || 'Social Media',
      description: msg.message,
      priority: priority || 'MEDIUM',
      status: 'SUBMITTED',
      due_date: due_date ? new Date(due_date) : null
    });

    msg.converted_request_id = newReq._id;
    await msg.save();

    await logAudit({
      userId: req.user.id,
      action: 'CONVERTED_FROM_CHAT',
      entity: 'client_requests',
      entityId: newReq._id,
      newValue: { request_code, message_id: messageId },
      ip: req.ip
    });

    res.status(201).json({ message: `Converted to request ${request_code}!`, request: newReq.toJSON() });
  } catch (err) {
    console.error('Error converting message to request:', err);
    res.status(500).json({ error: 'Failed to convert message.' });
  }
});

// Create New Chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { chat_type, name, client_id, project_id, member_user_ids } = req.body;

    const members = [{ user_id: req.user._id, role: 'ADMIN' }];

    if (member_user_ids && Array.isArray(member_user_ids)) {
      for (const uid of member_user_ids) {
        if (mongoose.Types.ObjectId.isValid(uid) && uid.toString() !== req.user.id) {
          members.push({ user_id: uid, role: 'MEMBER' });
        }
      }
    }

    const newChat = await Chat.create({
      chat_type: chat_type || 'DIRECT',
      name: name || 'New Chat',
      client_id: client_id && mongoose.Types.ObjectId.isValid(client_id) ? client_id : null,
      project_id: project_id && mongoose.Types.ObjectId.isValid(project_id) ? project_id : null,
      created_by: req.user._id,
      members
    });

    res.status(201).json({ message: 'Chat created successfully', chat: newChat.toJSON() });
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ error: 'Failed to create chat.' });
  }
});

export default router;
