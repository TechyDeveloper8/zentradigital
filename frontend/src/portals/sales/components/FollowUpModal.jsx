import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { X, Calendar, Clock, Phone, MessageSquare, Mail, Video, Users, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

const CONTACT_METHODS = ['Phone', 'WhatsApp', 'Email', 'Video Call', 'In-Person Meeting', 'Other'];
const STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'];

export default function FollowUpModal({
  isOpen,
  onClose,
  followUp = null,
  lead = null,
  leadsList = [],
  onFollowUpSaved
}) {
  const isEdit = Boolean(followUp && followUp.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    lead_id: '',
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '14:00',
    contact_method: 'Phone',
    discussion_summary: '',
    client_requirement: '',
    next_action: '',
    next_follow_up_date: '',
    priority: 'MEDIUM',
    status: 'PENDING'
  });

  useEffect(() => {
    if (followUp) {
      setForm({
        lead_id: followUp.lead_id || (lead ? lead.id : ''),
        follow_up_date: followUp.follow_up_date || new Date().toISOString().split('T')[0],
        follow_up_time: followUp.follow_up_time || '14:00',
        contact_method: followUp.contact_method || 'Phone',
        discussion_summary: followUp.discussion_summary || '',
        client_requirement: followUp.client_requirement || '',
        next_action: followUp.next_action || '',
        next_follow_up_date: followUp.next_follow_up_date || '',
        priority: followUp.priority || 'MEDIUM',
        status: followUp.status || 'PENDING'
      });
    } else {
      setForm({
        lead_id: lead ? lead.id : (leadsList[0]?.id || ''),
        follow_up_date: new Date().toISOString().split('T')[0],
        follow_up_time: '14:00',
        contact_method: 'Phone',
        discussion_summary: '',
        client_requirement: '',
        next_action: '',
        next_follow_up_date: '',
        priority: 'MEDIUM',
        status: 'PENDING'
      });
    }
    setError('');
  }, [followUp, lead, leadsList, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.follow_up_date) {
      setError('Follow-up date is required.');
      return;
    }
    if (!form.discussion_summary.trim()) {
      setError('Please add discussion notes / summary for this follow-up.');
      return;
    }
    if (!isEdit && !form.lead_id) {
      setError('Please select a lead for this follow-up.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let saved;
      if (isEdit) {
        const res = await api.put(`/leads/follow-ups/${followUp.id}`, form);
        saved = res.follow_up;
      } else {
        const res = await api.post('/leads/follow-ups', form);
        saved = res.follow_up;
      }
      onFollowUpSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save follow-up.');
    } finally {
      setLoading(false);
    }
  };

  const currentLeadName = lead
    ? lead.company_name
    : (followUp?.company_name || leadsList.find(l => String(l.id) === String(form.lead_id))?.company_name || 'Select Lead');

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
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
                backgroundColor: isEdit ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isEdit ? '#F59E0B' : '#60A5FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isEdit ? <Edit3 size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                {isEdit ? 'Update Follow-up & Notes' : 'Schedule Lead Follow-Up'}
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {isEdit ? `Follow-up with ${currentLeadName}` : 'Add New Follow-Up'}
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

        {/* Body */}
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

          {/* Lead selector (if not editing an existing follow-up or lead not locked) */}
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

          {/* Follow-up Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Follow-up Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
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
                Follow-up Time
              </label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="time"
                  value={form.follow_up_time}
                  onChange={(e) => setForm({ ...form, follow_up_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13.5px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Method & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Contact Method
              </label>
              <select
                value={form.contact_method}
                onChange={(e) => setForm({ ...form, contact_method: e.target.value })}
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
                {CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Notes & Discussion Summary */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Follow-up Notes / Discussion Summary <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="What was discussed? What is the prospect's feedback or current obstacle?..."
              value={form.discussion_summary}
              onChange={(e) => setForm({ ...form, discussion_summary: e.target.value })}
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
              required
            />
          </div>

          {/* Next Action Item */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Next Action Item
            </label>
            <input
              type="text"
              placeholder="e.g. Send revised quote on WhatsApp / Schedule product demo"
              value={form.next_action}
              onChange={(e) => setForm({ ...form, next_action: e.target.value })}
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
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
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
              <span>{loading ? 'Saving...' : isEdit ? 'Update Follow-up & Notes' : 'Schedule Follow-Up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
