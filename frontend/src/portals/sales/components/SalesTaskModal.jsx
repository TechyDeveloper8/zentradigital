import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { X, CheckSquare, Calendar, Flag, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

export default function SalesTaskModal({
  isOpen,
  onClose,
  task = null,
  leadsList = [],
  onTaskSaved
}) {
  const isEdit = Boolean(task && task.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    task_title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    status: 'TODO',
    lead_id: ''
  });

  useEffect(() => {
    if (task) {
      setForm({
        task_title: task.task_title || '',
        description: task.description || '',
        due_date: task.due_date || new Date().toISOString().split('T')[0],
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        lead_id: task.lead_id || ''
      });
    } else {
      setForm({
        task_title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        status: 'TODO',
        lead_id: ''
      });
    }
    setError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.task_title.trim() || !form.due_date) {
      setError('Task title and due date are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let saved;
      if (isEdit) {
        const res = await api.put(`/sales/tasks/${task.id}`, form);
        saved = res.task;
      } else {
        const res = await api.post('/sales/tasks', form);
        saved = res.task;
      }
      onTaskSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save sales task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '540px',
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
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#C084FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckSquare size={18} />
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                {isEdit ? 'Update Daily Task' : 'New Sales Task'}
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {isEdit ? 'Edit Task Details' : 'Add Daily Sales Task'}
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
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          {/* Task Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Task Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Call 15 leads from Instagram campaign"
              value={form.task_title}
              onChange={(e) => setForm({ ...form, task_title: e.target.value })}
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

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Action Details / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key notes, prospect specifics, or deliverables..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

          {/* Due Date & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Due Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Lead & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Link to Lead (Optional)
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
              >
                <option value="">-- None / General Task --</option>
                {leadsList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.company_name} ({l.contact_person})
                  </option>
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
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
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
              <span>{loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
