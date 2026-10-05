import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import {
  X, Sparkles, Image, Layers, FileText, Palette,
  Calendar, Check, Shield, Users, AlertCircle, Upload
} from 'lucide-react';

export default function AdminCreateGraphicTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  clients = [],
  smmEmployees = []
}) {
  const [internalClients, setInternalClients] = useState([]);
  const [internalSmms, setInternalSmms] = useState([]);

  // Use passed clients/smm or internally fetched ones
  const availableClients = (clients && clients.length > 0) ? clients : internalClients;
  const availableSmms = (smmEmployees && smmEmployees.length > 0) ? smmEmployees : internalSmms;

  const [postType, setPostType] = useState('Static Post');
  const [taskTitle, setTaskTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [assignedSmmId, setAssignedSmmId] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [targetPlatforms, setTargetPlatforms] = useState(['Instagram', 'LinkedIn']);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Self-fetch clients and SMM staff if not provided by parent
  useEffect(() => {
    if (!isOpen) return;

    if (!clients || clients.length === 0) {
      api.get('/clients')
        .then(res => {
          if (Array.isArray(res)) setInternalClients(res);
        })
        .catch(err => console.error('Failed to fetch clients:', err));
    }

    if (!smmEmployees || smmEmployees.length === 0) {
      api.get('/employees')
        .then(res => {
          if (Array.isArray(res)) {
            const smms = res.filter(e =>
              e.role_name === 'marketing_manager' ||
              e.employee_type === 'marketing_manager' ||
              (e.designation && (e.designation.toLowerCase().includes('social') || e.designation.toLowerCase().includes('marketing'))) ||
              e.first_name === 'Priya'
            );
            setInternalSmms(smms.length > 0 ? smms : res);
          }
        })
        .catch(err => console.error('Failed to fetch employees:', err));
    }
  }, [isOpen, clients, smmEmployees]);

  // Ensure a valid client is always selected once availableClients is populated
  useEffect(() => {
    if (!isOpen) return;
    if (availableClients.length > 0) {
      const isCurrentValid = availableClients.some(c => String(c.id || c._id) === String(clientId));
      if (!clientId || !isCurrentValid) {
        setClientId(String(availableClients[0].id || availableClients[0]._id));
      }
    }
  }, [availableClients, isOpen, clientId]);

  // Ensure lead SMM is auto-selected if available
  useEffect(() => {
    if (!isOpen) return;
    if (availableSmms.length > 0 && !assignedSmmId) {
      setAssignedSmmId(String(availableSmms[0].id || availableSmms[0]._id));
    }
  }, [availableSmms, isOpen, assignedSmmId]);

  // Clear errors and ensure default due date on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (!dueDate) {
        setDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const postTypes = [
    {
      id: 'Static Post',
      label: 'Static Post',
      icon: Image,
      desc: 'Single high-impact creative image for feed & story',
      color: '#10B981'
    },
    {
      id: 'Carousel',
      label: 'Carousel',
      icon: Layers,
      desc: 'Multi-slide swipeable series (up to 10 slides)',
      color: '#A855F7'
    },
    {
      id: 'Flyer',
      label: 'Flyer',
      icon: FileText,
      desc: 'Promotional one-pager & announcement graphic',
      color: '#3B82F6'
    },
    {
      id: 'Poster',
      label: 'Poster',
      icon: Palette,
      desc: 'Event, branding or campaign master visual',
      color: '#EC4899'
    }
  ];

  const availablePlatforms = ['Instagram', 'LinkedIn', 'Facebook', 'Twitter / X', 'Pinterest'];

  const togglePlatform = (p) => {
    if (targetPlatforms.includes(p)) {
      if (targetPlatforms.length > 1) {
        setTargetPlatforms(targetPlatforms.filter(item => item !== p));
      }
    } else {
      setTargetPlatforms([...targetPlatforms, p]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const effectiveTitle = taskTitle.trim();
    // Resilient fallback: use selected clientId, or default to first available client
    const effectiveClientId = clientId || (availableClients.length > 0 ? String(availableClients[0].id || availableClients[0]._id) : '');
    const effectiveDueDate = dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (!effectiveTitle) {
      setErrorMsg('Please specify a Task Title.');
      return;
    }

    if (!effectiveClientId) {
      setErrorMsg('Please select a Client Organization. If none exists, please onboard a client first.');
      return;
    }

    if (!effectiveDueDate) {
      setErrorMsg('Please specify a Delivery Due Date.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/media/static-task', {
        post_type: postType,
        task_title: effectiveTitle,
        client_id: effectiveClientId,
        assigned_smm_id: assignedSmmId || undefined,
        due_date: effectiveDueDate,
        priority,
        description: description.trim(),
        target_platforms: targetPlatforms.join(', ')
      });

      if (onTaskCreated) {
        onTaskCreated(res.task);
      }

      // Reset form
      setTaskTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create graphic task:', err);
      setErrorMsg(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '720px', color: '#FFFFFF' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #222222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1C1C1C 0%, #141414 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#E50914',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Step 1: Admin Creation
              </span>
              <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Auto-routed to SMM</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
              Create Static Post, Carousel, Flyer or Poster
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '18px',
              color: '#FCA5A5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* 1. Post Type Selector (4 Types) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Post Format Type *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {postTypes.map(pt => {
                const TypeIcon = pt.icon;
                const isSelected = postType === pt.id;
                return (
                  <div
                    key={pt.id}
                    onClick={() => setPostType(pt.id)}
                    style={{
                      border: isSelected ? `2px solid ${pt.color}` : '1px solid #2A2A2A',
                      backgroundColor: isSelected ? `${pt.color}15` : '#181818',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 12px ${pt.color}30` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <TypeIcon size={18} color={isSelected ? pt.color : '#A1A1AA'} />
                      {isSelected && <Check size={14} color={pt.color} />}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#D4D4D8' }}>
                      {pt.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717A', marginTop: '3px', lineHeight: 1.3 }}>
                      {pt.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Task Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Campaign / Post Title *
            </label>
            <input
              type="text"
              placeholder={`e.g. Summer Launch ${postType}: Minimalist Living & Highlights`}
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: '#1E1E1E',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#FFFFFF',
                fontSize: '13.5px'
              }}
            />
          </div>

          {/* 3. Client & Due Date (Two Column) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Client Organization *
              </label>
              <select
                value={clientId || (availableClients[0] ? String(availableClients[0].id || availableClients[0]._id) : '')}
                onChange={e => setClientId(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                {availableClients.length === 0 ? (
                  <option value="">Loading client organizations...</option>
                ) : (
                  availableClients.map(c => {
                    const cid = String(c.id || c._id);
                    return (
                      <option key={cid} value={cid}>
                        {c.company_name} ({c.client_code || `#${cid.slice(-4)}`})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Delivery Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* 4. Priority & Assigned SMM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="URGENT">🔴 Urgent (24h turnaround)</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="LOW">🟢 Standard Delivery</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Assigned Social Media Manager
              </label>
              <select
                value={assignedSmmId}
                onChange={e => setAssignedSmmId(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="">Auto-Assign / Select SMM</option>
                {availableSmms.map(e => {
                  const eid = String(e.id || e._id);
                  return (
                    <option key={eid} value={eid}>
                      {e.first_name} {e.last_name} ({e.designation || 'Marketing Manager'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 5. Target Social Platforms */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Target Platforms
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availablePlatforms.map(p => {
                const active = targetPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1px solid #E50914' : '1px solid #333',
                      backgroundColor: active ? 'rgba(229, 9, 20, 0.15)' : '#181818',
                      color: active ? '#FF6B6B' : '#A1A1AA'
                    }}
                  >
                    {active ? '✓ ' : ''}{p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Creative Brief / Instructions for SMM */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Creative Brief & Guidelines for SMM
            </label>
            <textarea
              rows={3}
              placeholder={`Provide instructions for the SMM (e.g. Design 4 slides with brand typography, highlight CTA on final slide, tone should be inspiring and aspirational)...`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#1E1E1E',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#FFFFFF',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #222222' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#E50914',
                borderColor: '#E50914',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              {submitting ? 'Creating & Routing...' : `Create & Route to SMM`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
