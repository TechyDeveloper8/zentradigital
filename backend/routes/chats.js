import express from 'express';
import db, { logAudit, createNotification } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { sendToUser, broadcast } from '../websocket.js';

const router = express.Router();

// List My Chats (Respecting Dual Boundary: Internal vs Client)
router.get('/', authenticate, (req, res) => {
  let sql = `
    SELECT c.*,
           cm.last_read_at,
           cl.company_name as client_name,
           p.project_name,
           cr.request_code,
           (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
           (SELECT created_at FROM chat_messages WHERE chat_id = c.id ORDER BY id DESC LIMIT 1) as last_message_at,
           (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND (cm.last_read_at IS NULL OR created_at > cm.last_read_at)) as unread_count
    FROM chats c
    JOIN chat_members cm ON c.id = cm.chat_id AND cm.user_id = ?
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN client_requests cr ON c.request_id = cr.id
    WHERE 1=1
  `;
  const params = [req.user.id];

  // Client user can ONLY see CLIENT_COMMUNICATION chats
  if (req.user.user_type === 'client') {
    sql += ` AND c.chat_type = 'CLIENT_COMMUNICATION'`;
  }

  sql += ` ORDER BY last_message_at DESC, c.id DESC`;
  const chats = db.prepare(sql).all(...params);
  res.json(chats);
});

// Messages in a Chat
router.get('/:id/messages', authenticate, (req, res) => {
  const chatId = req.params.id;

  // Verify membership
  const member = db.prepare('SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?').get(chatId, req.user.id);
  if (!member && req.user.role_name !== 'admin') {
    return res.status(403).json({ error: 'Access denied: You are not a participant in this conversation.' });
  }

  const messages = db.prepare(`
    SELECT m.*, u.username as sender_username, u.user_type as sender_type,
           r.name as sender_role,
           e.first_name || ' ' || e.last_name as sender_full_name,
           cr.request_code as converted_request_code
    FROM chat_messages m
    JOIN users u ON m.sender_user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON e.user_id = u.id
    LEFT JOIN client_requests cr ON m.converted_request_id = cr.id
    WHERE m.chat_id = ?
    ORDER BY m.id ASC
  `).all(chatId);

  // Update last_read_at
  db.prepare('UPDATE chat_members SET last_read_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND user_id = ?').run(chatId, req.user.id);

  res.json(messages);
});

// Send Message
router.post('/:id/messages', authenticate, (req, res) => {
  const chatId = req.params.id;
  const { message, attachment_url, reply_to_id } = req.body;

  if (!message && !attachment_url) {
    return res.status(400).json({ error: 'Message content or attachment is required.' });
  }

  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Client safety check: client can NEVER post into internal chat
  if (req.user.user_type === 'client' && chat.chat_type !== 'CLIENT_COMMUNICATION') {
    return res.status(403).json({ error: 'Access denied: Internal chat is strictly confidential.' });
  }

  // Insert message
  const result = db.prepare(`
    INSERT INTO chat_messages (chat_id, sender_user_id, message, attachment_url, reply_to_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(chatId, req.user.id, message || '', attachment_url || null, reply_to_id || null);

  const messageId = result.lastInsertRowid;

  // Notify chat members via WebSocket
  const members = db.prepare('SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id != ?').all(chatId, req.user.id);
  for (const m of members) {
    sendToUser(m.user_id, {
      type: 'NEW_CHAT_MESSAGE',
      chatId,
      messageId,
      sender: req.user.username,
      content: message
    });
  }

  const createdMessage = db.prepare(`
    SELECT m.*, u.username as sender_username, u.user_type as sender_type,
           r.name as sender_role,
           e.first_name || ' ' || e.last_name as sender_full_name
    FROM chat_messages m
    JOIN users u ON m.sender_user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON e.user_id = u.id
    WHERE m.id = ?
  `).get(messageId);

  res.status(201).json(createdMessage);
});

// Convert Chat Message to Structured Client Request (Section 31 & 51)
router.post('/messages/:messageId/convert-to-request', authenticate, (req, res) => {
  const messageId = req.params.messageId;
  const { category, priority, due_date } = req.body;

  const msg = db.prepare(`
    SELECT m.*, c.client_id, c.project_id
    FROM chat_messages m
    JOIN chats c ON m.chat_id = c.id
    WHERE m.id = ?
  `).get(messageId);

  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (msg.is_converted_to_request) {
    return res.status(400).json({ error: 'This message has already been converted to a request.' });
  }

  const clientId = msg.client_id || (req.client ? req.client.id : 1);
  const count = db.prepare('SELECT COUNT(*) as count FROM client_requests').get().count + 1;
  const request_code = `REQ-${new Date().getFullYear()}-${String(count).padStart(5, '0')}`;
  const request_title = msg.message.slice(0, 60) || 'Client Chat Request';

  const convertTransaction = db.transaction(() => {
    // 1. Create client request
    const reqRes = db.prepare(`
      INSERT INTO client_requests (
        request_code, client_id, project_id, request_title, category, description,
        requested_date, due_date, priority, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), ?, ?, 'NEW', ?)
    `).run(
      request_code, clientId, msg.project_id || null, request_title,
      category || 'Social Media', msg.message, due_date || null, priority || 'MEDIUM', req.user.id
    );

    const requestId = reqRes.lastInsertRowid;

    // 2. Mark message as converted
    db.prepare(`
      UPDATE chat_messages SET
        is_converted_to_request = 1,
        converted_request_id = ?
      WHERE id = ?
    `).run(requestId, messageId);

    return requestId;
  });

  const requestId = convertTransaction();

  logAudit({
    userId: req.user.id,
    action: 'CONVERTED_FROM_CHAT',
    entity: 'client_requests',
    entityId: requestId,
    newValue: { request_code, message_id: messageId },
    ip: req.ip
  });

  const createdReq = db.prepare('SELECT * FROM client_requests WHERE id = ?').get(requestId);
  res.status(201).json({ message: `Converted to request ${request_code}!`, request: createdReq });
});

// Create New Chat (1-on-1 or Team channel)
router.post('/', authenticate, (req, res) => {
  const { chat_type, name, client_id, project_id, member_user_ids } = req.body;

  const result = db.prepare(`
    INSERT INTO chats (chat_type, name, client_id, project_id)
    VALUES (?, ?, ?, ?)
  `).run(chat_type || 'INTERNAL_GROUP', name || 'New Chat', client_id || null, project_id || null);

  const chatId = result.lastInsertRowid;

  // Add creator
  db.prepare('INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)').run(chatId, req.user.id);

  // Add other members
  if (member_user_ids && Array.isArray(member_user_ids)) {
    const insertMember = db.prepare('INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)');
    for (const uid of member_user_ids) {
      insertMember.run(chatId, uid);
    }
  }

  const created = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId);
  res.status(201).json({ message: 'Chat created successfully', chat: created });
});

export default router;
