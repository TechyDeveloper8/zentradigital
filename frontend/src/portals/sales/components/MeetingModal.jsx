import React, { useState } from 'react';
import api from '../../../api/client';
import { X, Calendar, Clock, Video, MapPin, Users, FileText, CheckCircle2 } from 'lucide-react';

export default function MeetingModal({ isOpen, onClose, lead, onMeetingScheduled, employees = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: lead ? `Discovery & Strategy Pitch — ${lead.company_name}` : 'Sales Strategy Meeting',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '15:00',
    meeting_type: 'Video Call',
    meeting_link: 'https://meet.google.com/zen-sales-hub',
    location: '',
    participants: lead ? `${lead.contact_person} (Prospect), Rahul Sharma (Sales)` : '',
    agenda: 'Understand marketing pain points, present agency case studies, align on retainer scope',
    notes: '',
    reminder: true,
    assigned_employee_id: lead?.assigned_sales_employee_id || ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.meeting_date || !form.meeting_time) {
      setError('Title, date, and time are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        lead_id: lead ? lead.id : null
      };
      const res = await api.post('/meetings', payload);
      onMeetingScheduled(res.meeting);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule meeting.');
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
        maxWidth: '600px',
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
              Calendar Dispatch
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: '2px 0 0' }}>
              Schedule Sales Meeting
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <div>
            <label className="form-label">Meeting Title *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Time *</label>
              <input
                type="time"
                className="form-input"
                value={form.meeting_time}
                onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Meeting Type</label>
              <select
                className="form-input"
                value={form.meeting_type}
                onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}
              >
                <option value="Video Call">🎥 Google Meet / Zoom</option>
                <option value="Phone">📞 Phone Call</option>
                <option value="Office Meeting">🏢 Agency Office</option>
                <option value="Client Location">📍 Client Office / Site</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Meeting Link / Room</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://meet.google.com/..."
                value={form.meeting_link}
                onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Participants</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Sharma, Dr. Radhika Sen"
              value={form.participants}
              onChange={(e) => setForm({ ...form, participants: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Meeting Agenda & Goal</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Key topics, slide deck presentation, commercial alignment..."
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#CBD5E1' }}>
              <input
                type="checkbox"
                checked={form.reminder}
                onChange={(e) => setForm({ ...form, reminder: e.target.checked })}
              />
              <span>Send automatic reminder alert 15 mins prior</span>
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 700 }}>
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
