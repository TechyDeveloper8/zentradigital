import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  MessageSquare, Send, Paperclip, Users, User, Plus,
  Shield, CheckCheck, Clock
} from 'lucide-react';

export default function InternalChat() {
  const { user } = useAuth();
  const { incomingMessage } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    if (incomingMessage && activeChat && incomingMessage.chatId == activeChat.id) {
      loadMessages(activeChat.id);
    }
  }, [incomingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = () => {
    setLoading(true);
    api.get('/chats')
      .then(res => {
        setChats(res || []);
        if (res && res.length > 0 && !activeChat) {
          setActiveChat(res[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadMessages = (chatId) => {
    api.get(`/chats/${chatId}/messages`)
      .then(res => setMessages(res || []))
      .catch(err => console.error(err));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText('');

    try {
      const res = await api.post(`/chats/${activeChat.id}/messages`, {
        message: textToSend
      });
      setMessages(prev => [...prev, res]);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleCreateChannel = async () => {
    const channelName = prompt('Enter new team channel name (e.g. Creative Production, Sales Pod):');
    if (!channelName) return;

    try {
      const newC = await api.post('/chats', {
        chat_type: 'INTERNAL_GROUP',
        name: `# ${channelName}`
      });
      loadChats();
      setActiveChat(newC.chat);
    } catch (err) {
      alert(err.message || 'Failed to create channel');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Internal Team Communication Hub
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Real-time confidential staff discussions (strictly isolated from client visibility).
          </p>
        </div>

        <button onClick={handleCreateChannel} className="btn btn-primary">
          <Plus size={16} /> New Channel
        </button>
      </div>

      {/* Dual Column Chat Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        height: '75vh',
        overflow: 'hidden'
      }}>
        {/* Left: Chat Channels */}
        <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '13.5px', color: '#F9FAFB' }}>
            Internal Channels
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '12.5px' }}>
                No channels active yet.
              </div>
            ) : (
              chats.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveChat(c)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: activeChat?.id === c.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: activeChat?.id === c.id ? '#60A5FA' : '#D1D5DB',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={15} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.name || 'Team Chat'}</span>
                  </div>
                  {c.unread_count > 0 && (
                    <span style={{ fontSize: '10px', background: '#EF4444', color: '#fff', padding: '1px 6px', borderRadius: '9999px', fontWeight: 700 }}>
                      {c.unread_count}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {activeChat ? (
            <>
              {/* Active Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#F9FAFB' }}>{activeChat.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#10B981' }}>● Internal Team Only (Encrypted)</div>
                </div>
              </div>

              {/* Message History */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                    No messages in this channel yet. Say hello to your agency team!
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.sender_user_id === user.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}>
                          {isMe ? 'You' : `${m.sender_full_name || m.sender_username} (${m.sender_role})`}
                        </div>
                        <div style={{
                          backgroundColor: isMe ? '#3B82F6' : '#1F2937',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '13.5px',
                          lineHeight: '1.4'
                        }}>
                          {m.message}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '3px' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Type an internal team message..."
                  className="form-control"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 18px' }}>
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
              Select a channel to begin communicating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
