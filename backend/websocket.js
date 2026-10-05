import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'zentra-enterprise-jwt-secret-key-2026';

let wss = null;
const userSockets = new Map(); // userId -> Set of WebSocket instances

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let authenticatedUserId = null;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          return;
        }
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

    ws.on('error', (err) => {
      // Quietly handle connection errors, cleanup takes place in 'close'
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

  // Heartbeat ping every 25 seconds to keep connection alive through proxies/NAT
  const heartbeatInterval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (err) {
        // Socket may already be closed/closing
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
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

// Real-time helper: Broadcast video workflow lifecycle changes
export function broadcastWorkflowEvent(payload) {
  broadcast({
    type: 'WORKFLOW_EVENT',
    ...payload,
    timestamp: new Date().toISOString()
  });
}

// Real-time helper: Broadcast employee attendance punch/adjustment events
export function broadcastAttendanceEvent(payload) {
  broadcast({
    type: 'ATTENDANCE_EVENT',
    ...payload,
    timestamp: new Date().toISOString()
  });
}

// Real-time helper: Broadcast daily work / sales report submission events
export function broadcastDailyReportEvent(payload) {
  broadcast({
    type: 'DAILY_REPORT_EVENT',
    ...payload,
    timestamp: new Date().toISOString()
  });
}

// Real-time helper: Send instant user notification
export function broadcastNotification(userId, notification) {
  if (userId) {
    sendToUser(userId, {
      type: 'NOTIFICATION',
      notification,
      timestamp: new Date().toISOString()
    });
  }
}
