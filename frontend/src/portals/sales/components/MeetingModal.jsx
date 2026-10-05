import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { X, Calendar, Clock, Video, MapPin, Users, FileText, CheckCircle2, AlertCircle, RefreshCw, XCircle, CheckSquare } from 'lucide-react';

const MEETING_TYPES = ['Video Call', 'Phone Call', 'Office Meeting', 'Client Location', 'Other'];
const MEETING_STATUSES = [
  { key: 'SCHEDULED', label: 'Scheduled', color: '#F59E0B' },
  { key: 'COMPLETED', label: 'Completed', color: '#10B981' },
  { key: 'RESCHEDULED', label: 'Rescheduled', color: '#3B82F6' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#EF4444' },
  { key: 'NO SHOW', label: 'No Show', color: '#94A3B8' }
];

export default function MeetingModal({
  isOpen,
  onClose,
  meeting = null,
  lead = null,
  leadsList = [],
  onMeetingSaved
}) {
  const isEdit = Boolean(meeting && meeting.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    lead_id: '',
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '15:00',
    meeting_type: 'Video Call',
    meeting_link: 'https://meet.google.com/zen-sales-discovery',
    location: '',
    agenda: 'Discovery, marketing requirements review, and presentation of pricing tiers.',
    notes: '',
    status: 'SCHEDULED'
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        lead_id: meeting.lead_id || (lead ? lead.id : ''),
        title: meeting.title || '',
        meeting_date: meeting.meeting_date || new Date().toISOString().split('T')[0],
        meeting_time: meeting.meeting_time || '15:00',
        meeting_type: meeting.meeting_type || 'Video Call',
        meeting_link: meeting.meeting_link || '',
        location: meeting.location || '',
        agenda: meeting.agenda || '',
        notes: meeting.notes || '',
        status: meeting.status || 'SCHEDULED'
      });
    } else {
      setForm({
        lead_id: lead ? lead.id : (leadsList[0]?.id || ''),
        title: lead ? `Discovery & Strategy Pitch — ${lead.company_name}` : 'Sales Strategy Meeting',
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: '15:00',
        meeting_type: 'Video Call',
        meeting_link: 'https://meet.google.com/zen-sales-discovery',
        location: '',
        agenda: 'Discovery, marketing requirements review, and presentation of pricing tiers.',
        notes: '',
        status: 'SCHEDULED'
      });
    }
    setError('');
  }, [meeting, lead, leadsList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Meeting title is required.');
      return;
    }
    if (!form.meeting_date || !form.meeting_time) {
      setError('Meeting date and time are required.');
      return;
    }
    if (!isEdit && !form.lead_id) {
      setError('Please select a lead for this meeting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let saved;
      if (isEdit) {
        const res = await api.put(`/meetings/${meeting.id}`, form);
        saved = res.meeting;
      } else {
        const payload = {
          ...form,
          lead_id: form.lead_id ? Number(form.lead_id) : null
        };
        const res = await api.post('/meetings', payload);
        saved = res.meeting;
      }
      onMeetingSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update meeting status' : 'schedule meeting'}.`);
    } finally {
      setLoading(false);
    }
  };

  const currentLeadName = lead
    ? lead.company_name
    : (meeting?.lead_company_name || leadsList.find(l => String(l.id) === String(form.lead_id))?.company_name || 'Select Lead');

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '600px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0B1120'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: isEdit ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isEdit ? '#818CF8' : '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                {isEdit ? 'Update Meeting Status & Outcome' : 'Schedule Sales Meeting'}
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {isEdit ? `Meeting • ${currentLeadName}` : 'New Prospect Meeting'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '24px', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#F87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Core Feature 3: Status Selector Highlighted */}
          {isEdit && (
            <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>
                Update Meeting Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {MEETING_STATUSES.map((st) => {
                  const isSelected = form.status === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setForm({ ...form, status: st.key })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: isSelected ? `2px solid ${st.color}` : '1px solid #334155',
                        backgroundColor: isSelected ? `${st.color}25` : '#0F172A',
                        color: isSelected ? st.color : '#94A3B8',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lead Selector if creating */}
          {!lead && !isEdit && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Select Lead <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={form.lead_id}
                onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '13.5px'
                }}
                required
              >
                <option value="">-- Choose a Lead --</option>
                {leadsList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.company_name} ({l.contact_person} • {l.lead_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Meeting Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Agency Retainer Discovery Call"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '13.5px'
              }}
              required
            />
          </div>

          {/* Meeting Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Date <span style={{ color: '#EF4444' }}>*</span>
                {form.status === 'RESCHEDULED' && <span style={{ color: '#3B82F6', marginLeft: '6px' }}>(New Date)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="date"
                  value={form.meeting_date}
                  onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13.5px'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Time <span style={{ color: '#EF4444' }}>*</span>
                {form.status === 'RESCHEDULED' && <span style={{ color: '#3B82F6', marginLeft: '6px' }}>(New Time)</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="time"
                  value={form.meeting_time}
                  onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13.5px'
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Meeting Type & Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Meeting Type
              </label>
              <select
                value={form.meeting_type}
                onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '13.5px'
                }}
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Meeting Link / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Google Meet link or Office Room"
                value={form.meeting_link || form.location}
                onChange={(e) => setForm({ ...form, meeting_link: e.target.value, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '13.5px'
                }}
              />
            </div>
          </div>

          {/* Agenda */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Meeting Agenda
            </label>
            <input
              type="text"
              placeholder="e.g. Discuss Q4 creative deliverables & pricing"
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Meeting Notes / Outcome */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Meeting Notes & Outcomes {isEdit && <span style={{ color: '#94A3B8' }}>(Reason for status change / discussion summary)</span>}
            </label>
            <textarea
              rows={3}
              placeholder="Key points agreed, client reaction to pricing, reasons if cancelled or rescheduled..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Footer Controls */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                background: isEdit
                  ? 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Meeting Status' : 'Schedule Meeting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
