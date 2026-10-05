import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { X, Building2, User, Phone, Mail, DollarSign, Tag, Briefcase, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const SOURCES = [
  'Website', 'LinkedIn', 'Referral', 'Cold Call', 'Google Ads',
  'Instagram', 'Facebook', 'Email Campaign', 'Walk-in', 'Other'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function LeadFormModal({ isOpen, onClose, lead, onLeadSaved }) {
  const isEdit = Boolean(lead && lead.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    designation: '',
    phone: '',
    whatsapp: '',
    email: '',
    source: 'Website',
    industry: 'General Business',
    deal_value: 50000,
    priority: 'MEDIUM',
    urgency: 'Medium',
    requirement: '',
    notes: '',
    status: 'NEW'
  });

  useEffect(() => {
    if (lead) {
      setForm({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        designation: lead.designation || '',
        phone: lead.phone || '',
        whatsapp: lead.whatsapp || lead.phone || '',
        email: lead.email || '',
        source: lead.source || 'Website',
        industry: lead.industry || 'General Business',
        deal_value: lead.deal_value || 50000,
        priority: lead.priority || 'MEDIUM',
        urgency: lead.urgency || 'Medium',
        requirement: lead.requirement || '',
        notes: lead.notes || '',
        status: lead.status || 'NEW'
      });
    } else {
      setForm({
        company_name: '',
        contact_person: '',
        designation: '',
        phone: '',
        whatsapp: '',
        email: '',
        source: 'Website',
        industry: 'General Business',
        deal_value: 50000,
        priority: 'MEDIUM',
        urgency: 'Medium',
        requirement: '',
        notes: '',
        status: 'NEW'
      });
    }
    setError('');
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.contact_person.trim() || !form.phone.trim()) {
      setError('Company Name, Contact Person, and Phone Number are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let saved;
      if (isEdit) {
        const res = await api.put(`/leads/${lead.id}`, form);
        saved = res.lead;
      } else {
        const res = await api.post('/leads', form);
        saved = res.lead;
      }
      onLeadSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} lead.`);
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
          maxWidth: '680px',
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
              <Building2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                {isEdit ? 'Update Existing Lead' : 'Add New Prospect'}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {isEdit ? `Edit Details: ${lead.company_name}` : 'Create New Sales Lead'}
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
              borderRadius: '8px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '24px', gap: '18px' }}>
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

          {/* Row 1: Company & Contact Person */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Company Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="e.g. Apex Enterprises Pvt Ltd"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
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
                Contact Person <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Singhal"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
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

          {/* Row 2: Phone & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Phone Number <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: form.whatsapp || e.target.value })}
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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

          {/* Row 3: Designation & Source */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Managing Director / Founder"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
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

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Lead Source <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
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
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Deal Value, Priority, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Estimated Deal Value (₹)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={form.deal_value}
                  onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 28px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13.5px'
                  }}
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

            {isEdit && (
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Pipeline Stage
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
                  {STAGES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 5: Requirement Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Client Requirements / Services Needed
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Needs complete rebranding, Instagram growth & Google Ads for festive product launch..."
              value={form.requirement}
              onChange={(e) => setForm({ ...form, requirement: e.target.value })}
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

          {/* Row 6: Sales Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
              Internal Sales Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key notes, prospect background, budget flexibility, decision timeline..."
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
                  ? 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isEdit ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Saving...' : isEdit ? 'Update Lead Details' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
