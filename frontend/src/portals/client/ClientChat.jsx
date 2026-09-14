import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  MessageSquare, Send, Paperclip, AlertCircle, CheckCircle2,
  User, Clock, Shield
} from 'lucide-react';

export default function ClientChat() {
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

  // Section 31 & 51: Convert Chat Message to Structured Request
  const handleConvertToRequest = async (msg) => {
    if (msg.is_converted_to_request) {
      alert(`This message has already been converted to ticket [${msg.converted_request_code}].`);
      return;
    }

    if (!confirm(`Convert message: "${msg.message}" into a formal tracked request ticket?`)) return;

    try {
      const res = await api.post(`/chats/messages/${msg.id}/convert-to-request`, {
        category: 'New Creative',
        priority: 'MEDIUM'
      });
      alert(`Success! Created Request Ticket: ${res.request.request_code}`);
      loadMessages(activeChat.id);
    } catch (err) {
      alert(err.message || 'Conversion failed');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Agency Communication Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Direct real-time communication with your assigned marketing manager and creative team.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        height: '75vh',
        overflow: 'hidden'
      }}>
        {/* Left: Threads */}
        <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '13.5px' }}>
            Communication Streams
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                No active streams yet.
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
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name || 'Account Stream'}</div>
                  {c.last_message && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {c.last_message}
                    </div>
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
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#F9FAFB' }}>{activeChat.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#10B981' }}>● Dedicated Agency Team Stream</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                    Send a message to discuss deliverables or ask questions without needing WhatsApp.
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

                        {/* Section 31: Convert Message to Request Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#6B7280' }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {m.is_converted_to_request ? (
                            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>
                              ✓ Linked to Ticket {m.converted_request_code}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConvertToRequest(m)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60A5FA',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              + Create Request from Message
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Type a message to your agency team..."
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
              Select a conversation stream to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
