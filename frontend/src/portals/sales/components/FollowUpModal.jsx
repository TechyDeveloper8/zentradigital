import React, { useState } from 'react';
import api from '../../../api/client';
import { X, Clock, Phone, MessageSquare, Mail, Video, Users, CheckCircle2 } from 'lucide-react';

export default function FollowUpModal({ isOpen, onClose, lead, onFollowUpCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '14:00',
    contact_method: 'Phone',
    discussion_summary: '',
    client_requirement: '',
    next_action: '',
    next_follow_up_date: '',
    priority: 'HIGH',
    status: 'COMPLETED'
  });

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.discussion_summary.trim()) {
      setError('Discussion summary is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/leads/${lead.id}/follow-ups`, form);
      onFollowUpCreated(res.follow_up);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record follow-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#60A5FA', textTransform: 'uppercase', fontWeight: 700 }}>
              Prospect Engagement
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: '2px 0 0' }}>
              Log Follow-Up • {lead.company_name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '12.5px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Contact Method</label>
              <select
                className="form-input"
                value={form.contact_method}
                onChange={(e) => setForm({ ...form, contact_method: e.target.value })}
              >
                <option value="Phone">📞 Phone Call</option>
                <option value="WhatsApp">💬 WhatsApp</option>
                <option value="Email">✉️ Email</option>
                <option value="Video Call">🎥 Video Call</option>
                <option value="Meeting">🤝 Office Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Record Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="COMPLETED">Completed (Log Past Discussion)</option>
                <option value="PENDING">Pending (Schedule for Later)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.follow_up_date}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={form.follow_up_time}
                onChange={(e) => setForm({ ...form, follow_up_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Discussion Summary *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="What was discussed? Client feedback, questions raised, budget considerations..."
              value={form.discussion_summary}
              onChange={(e) => setForm({ ...form, discussion_summary: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Next Action / Next Step</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Send revised pricing proposal"
                value={form.next_action}
                onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Next Follow-Up Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={form.next_follow_up_date}
                onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 700 }}>
              {loading ? 'Recording...' : 'Log Follow-Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
