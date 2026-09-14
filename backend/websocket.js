import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zentra-enterprise-jwt-secret-key-2026';

let wss = null;
const userSockets = new Map(); // userId -> Set of WebSocket instances

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let authenticatedUserId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'AUTH') {
          try {
            const decoded = jwt.verify(data.token, JWT_SECRET);
            authenticatedUserId = decoded.id;
            if (!userSockets.has(authenticatedUserId)) {
              userSockets.set(authenticatedUserId, new Set());
            }
            userSockets.get(authenticatedUserId).add(ws);
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId: authenticatedUserId }));
          } catch (e) {
            ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Invalid token' }));
          }
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      if (authenticatedUserId && userSockets.has(authenticatedUserId)) {
        userSockets.get(authenticatedUserId).delete(ws);
        if (userSockets.get(authenticatedUserId).size === 0) {
          userSockets.delete(authenticatedUserId);
        }
      }
    });
  });

  return wss;
}

// Send event to specific user
export function sendToUser(userId, payload) {
  if (userSockets.has(userId)) {
    const message = JSON.stringify(payload);
    for (const ws of userSockets.get(userId)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}

// Broadcast event to all connected clients
export function broadcast(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
