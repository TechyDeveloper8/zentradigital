import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) socket.close();
      setSocket(null);
      return;
    }

    const token = localStorage.getItem('zentra_token');
    const defaultProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${defaultProtocol}//${window.location.host}/ws`;
    const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_CHAT_MESSAGE') {
          setIncomingMessage(data);
        } else if (data.type === 'NOTIFICATION') {
          setIncomingNotification(data);
        }
      } catch (err) {
        console.error('Socket message error:', err);
      }
    };

    ws.onclose = () => {
      setSocket(null);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, incomingMessage, incomingNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
