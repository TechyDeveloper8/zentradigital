import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Radio, Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const defaultSocketContextValue = {
  socket: null,
  isConnected: false,
  incomingMessage: null,
  incomingNotification: null,
  lastWorkflowEvent: null,
  lastAttendanceEvent: null,
  triggerLiveToast: () => {}
};

const SocketContext = createContext(defaultSocketContextValue);

// Module-level persistent singleton connection manager
let globalWs = null;
let globalPingInterval = null;
let globalReconnectTimeout = null;
let globalTeardownTimeout = null;
let globalActiveToken = null;
let reconnectAttempts = 0;
const listeners = new Set();

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  // Connect directly to backend port 5000 in dev to avoid Vite proxy drops (ECONNRESET)
  if (window.location.port === '5173' || (window.location.hostname === 'localhost' && window.location.port !== '5000')) {
    return `ws://${window.location.hostname}:5000/ws`;
  }
  // Vercel does not support WebSocket proxying; connect directly to live Render backend
  if (window.location.hostname.includes('zentradigital.agency') || window.location.hostname.includes('vercel.app')) {
    return 'wss://zentradigital.onrender.com/ws';
  }
  const defaultProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${defaultProtocol}//${window.location.host}/ws`;
}

function broadcastToListeners(data) {
  for (const listener of listeners) {
    try {
      listener(data);
    } catch (err) {
      console.error('Socket event listener error:', err);
    }
  }
}

function safeCloseGlobalSocket() {
  if (globalPingInterval) {
    clearInterval(globalPingInterval);
    globalPingInterval = null;
  }
  if (globalReconnectTimeout) {
    clearTimeout(globalReconnectTimeout);
    globalReconnectTimeout = null;
  }
  if (!globalWs) return;

  const wsToClose = globalWs;
  globalWs = null;
  globalActiveToken = null;

  wsToClose.onmessage = null;
  wsToClose.onclose = null;

  if (wsToClose.readyState === WebSocket.OPEN) {
    try {
      wsToClose.close(1000, 'Normal Closure');
    } catch (_) {}
  } else if (wsToClose.readyState === WebSocket.CONNECTING) {
    wsToClose.onerror = () => {};
    wsToClose.onopen = () => {
      try {
        wsToClose.close(1000, 'Normal Closure');
      } catch (_) {}
    };
  }
}

function connectGlobalWebSocket(token) {
  if (!token) return;

  // If already connected or connecting with the same token, reuse existing connection
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    if (globalActiveToken === token) {
      return;
    }
    safeCloseGlobalSocket();
  }

  globalActiveToken = token;
  const wsUrl = getWsUrl();

  try {
    const ws = new WebSocket(wsUrl);
    globalWs = ws;

    ws.onopen = () => {
      reconnectAttempts = 0;
      broadcastToListeners({ type: '__CONNECTION_STATUS__', isConnected: true });

      if (token) {
        ws.send(JSON.stringify({ type: 'AUTH', token }));
      }

      if (globalPingInterval) clearInterval(globalPingInterval);
      globalPingInterval = setInterval(() => {
        if (globalWs && globalWs.readyState === WebSocket.OPEN) {
          globalWs.send(JSON.stringify({ type: 'PING' }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') return;
        if (data.type === 'AUTH_SUCCESS') {
          broadcastToListeners({ type: '__CONNECTION_STATUS__', isConnected: true });
        }
        broadcastToListeners(data);
      } catch (err) {
        console.error('Socket parse error:', err);
      }
    };

    ws.onclose = () => {
      if (globalPingInterval) {
        clearInterval(globalPingInterval);
        globalPingInterval = null;
      }
      globalWs = null;
      broadcastToListeners({ type: '__CONNECTION_STATUS__', isConnected: false });

      // Reconnect with backoff if listeners are still registered
      if (listeners.size > 0 && globalActiveToken) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts - 1), 6000);
        if (globalReconnectTimeout) clearTimeout(globalReconnectTimeout);
        globalReconnectTimeout = setTimeout(() => {
          connectGlobalWebSocket(globalActiveToken);
        }, delay);
      }
    };

    ws.onerror = () => {
      // Handled cleanly via onclose to avoid noisy console errors
    };
  } catch (err) {
    if (listeners.size > 0 && globalActiveToken) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts - 1), 6000);
      if (globalReconnectTimeout) clearTimeout(globalReconnectTimeout);
      globalReconnectTimeout = setTimeout(() => {
        connectGlobalWebSocket(globalActiveToken);
      }, delay);
    }
  }
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(() => globalWs?.readyState === WebSocket.OPEN);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);
  const [lastWorkflowEvent, setLastWorkflowEvent] = useState(null);
  const [lastAttendanceEvent, setLastAttendanceEvent] = useState(null);
  const [liveToast, setLiveToast] = useState(null);

  useEffect(() => {
    if (!user) {
      safeCloseGlobalSocket();
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('zentra_token');

    // Cancel any pending teardown from React 18 Strict Mode mount/unmount cycles
    if (globalTeardownTimeout) {
      clearTimeout(globalTeardownTimeout);
      globalTeardownTimeout = null;
    }

    const handleEvent = (data) => {
      if (data.type === '__CONNECTION_STATUS__') {
        setIsConnected(data.isConnected);
        return;
      }

      if (data.type === 'NEW_CHAT_MESSAGE') {
        setIncomingMessage(data);
      } else if (data.type === 'NOTIFICATION') {
        setIncomingNotification(data);
        setLiveToast({
          id: Date.now(),
          title: data.notification?.title || 'Notification',
          message: data.notification?.message || 'New activity in workflow',
          type: 'notification'
        });
      } else if (data.type === 'WORKFLOW_EVENT') {
        setLastWorkflowEvent(data);
        setLiveToast({
          id: Date.now(),
          title: data.eventType?.replace(/_/g, ' ') || 'Workflow Update',
          message: data.message || `Task ${data.task_title || data.taskId || ''} updated to ${data.badge || data.stage || ''}`,
          type: 'workflow',
          badge: data.badge
        });
      } else if (data.type === 'ATTENDANCE_EVENT') {
        setLastAttendanceEvent(data);
        setLiveToast({
          id: Date.now(),
          title: 'Attendance Updated',
          message: `${data.employeeName || 'Staff'}: ${data.eventType === 'EMPLOYEE_CHECK_IN' ? 'Checked In' : (data.eventType === 'EMPLOYEE_CHECK_OUT' ? 'Checked Out' : 'Attendance Adjusted')}`,
          type: 'attendance'
        });
      } else if (data.type === 'DAILY_REPORT_EVENT') {
        setLiveToast({
          id: Date.now(),
          title: 'Daily Sales Report (DSR)',
          message: `${data.employeeName || 'Team Member'} logged DSR for ${data.reportDate}: ${data.callsMade || 0} Calls, ${data.meetingsDone || 0} Meetings, ${data.dealsClosed || 0} Won Deals (${data.totalHours || 0} hrs)`,
          type: 'report'
        });
      } else if (data.type === 'NOTIFICATIONS_CLEARED') {
        setIncomingNotification({ type: 'NOTIFICATIONS_CLEARED', timestamp: Date.now() });
        setLiveToast({
          id: Date.now(),
          title: 'Notifications Cleared',
          message: 'All role notifications have been cleared.',
          type: 'notification'
        });
      }
    };

    listeners.add(handleEvent);
    connectGlobalWebSocket(token);

    if (globalWs?.readyState === WebSocket.OPEN) {
      setIsConnected(true);
    }

    return () => {
      listeners.delete(handleEvent);
      // Give a 1200ms grace period before closing so React StrictMode remount or fast route transitions
      // reuse the active WebSocket instead of aborting the connection
      if (listeners.size === 0) {
        if (globalTeardownTimeout) clearTimeout(globalTeardownTimeout);
        globalTeardownTimeout = setTimeout(() => {
          if (listeners.size === 0) {
            safeCloseGlobalSocket();
          }
        }, 1200);
      }
    };
  }, [user]);

  // Auto-dismiss live toast after 4.5 seconds
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      setLiveToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [liveToast]);

  return (
    <SocketContext.Provider value={{
      socket: globalWs,
      isConnected,
      incomingMessage,
      incomingNotification,
      lastWorkflowEvent,
      lastAttendanceEvent,
      triggerLiveToast: setLiveToast
    }}>
      {children}

      {/* Real-Time Live Event Toast Banner */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#1A1A1A] border border-[#E50914] shadow-2xl shadow-red-950/40 rounded-xl p-4 text-white flex items-start space-x-3 animate-bounce-in transition-all">
          <div className="p-2 rounded-lg bg-red-950/60 text-[#E50914] shrink-0 border border-red-800/40">
            {liveToast.type === 'attendance' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : liveToast.type === 'workflow' ? (
              <Radio className="w-5 h-5 text-[#E50914] animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Real-Time Update</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-sm font-bold text-white mt-0.5 truncate">{liveToast.title}</p>
            <p className="text-xs text-[#A1A1AA] mt-1 leading-snug line-clamp-2">{liveToast.message}</p>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context || defaultSocketContextValue;
}
