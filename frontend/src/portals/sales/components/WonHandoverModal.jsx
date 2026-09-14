import React, { useState } from 'react';
import api from '../../../api/client';
import {
  X, CheckCircle2, Award, Briefcase, Users, Calendar,
  DollarSign, Sparkles, AlertCircle, ArrowRight, ShieldCheck
} from 'lucide-react';

export default function WonHandoverModal({ isOpen, onClose, lead, onHandoverCompleted, employees = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const marketingManagers = employees.filter(e => e.designation?.toLowerCase().includes('marketing') || e.employee_type === 'marketing_manager');
  const editors = employees.filter(e => e.designation?.toLowerCase().includes('editor') || e.employee_type === 'editor');
  const generalStaff = employees;

  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_cycle: lead?.billing_type || 'Monthly',
    monthly_value: lead?.deal_value || 120000,
    client_priority: 'HIGH',

    marketing_manager_id: marketingManagers[0]?.id || '',
    account_manager_id: generalStaff[0]?.id || '',
    creative_editor_id: editors[0]?.id || '',

    client_requirements: lead?.requirement || 'Full-funnel digital marketing, organic reels production, and performance ads management.',
    services_sold: lead?.services_required ? (typeof lead.services_required === 'string' ? JSON.parse(lead.services_required || '[]') : lead.services_required) : ['Social Media Management', 'Paid Advertising', 'Video Editing'],
    pricing_terms: `Monthly Retainer: ₹${Number(lead?.deal_value || 120000).toLocaleString()} (Net 7 billing)`,
    commitments: 'Guaranteed 16 approved reels delivered per month, bi-weekly performance reviews, minimum 3.0x blended ROAS target.',
    campaign_requirements: 'Meta Advantage+ catalog ads + custom UGC creative angle testing.',
    target_audience: lead?.target_market || 'HNWI and fitness-oriented consumers aged 24-40 in tier-1 metro cities.',
    important_dates: `Kickoff Strategy Session: ${new Date().toISOString().split('T')[0]}, First Content Batch: 10 days post kickoff.`,
    special_instructions: 'Client prefers communications strictly via dedicated agency WhatsApp group and weekly Monday summary emails.',
    communication_preferences: 'WhatsApp & Email'
  });

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        monthly_value: Number(form.monthly_value)
      };

      const res = await api.post(`/leads/${lead.id}/convert-and-handover`, payload);
      onHandoverCompleted(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete client handover.');
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
        maxWidth: '820px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 800 }}>
                🎉 WON DEAL CONVERSION
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{lead.lead_code} • {lead.company_name}</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0' }}>
              Client Handover & Onboarding Dossier
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#F87171',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            {/* Deal Summary Banner */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>Client Account to Be Created</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>{lead.company_name}</div>
                <div style={{ fontSize: '12.5px', color: '#CBD5E1' }}>Primary Contact: {lead.contact_person} ({lead.phone})</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Monthly Contract Value</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981' }}>
                  ₹{Number(form.monthly_value).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{form.billing_cycle} Retainer</div>
              </div>
            </div>

            {/* Section 1: Commercials & Dates */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                1. Contract & Financial Parameters
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Client Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Monthly Retainer (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.monthly_value}
                    onChange={(e) => setForm({ ...form, monthly_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Billing Cycle</label>
                  <select
                    className="form-input"
                    value={form.billing_cycle}
                    onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                  >
                    <option value="Monthly">Monthly Retainer</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="One-time">One-time Sprint</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Team Member Assignments */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                2. Internal Agency Pod Assignment
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Lead Marketing Manager *</label>
                  <select
                    className="form-input"
                    value={form.marketing_manager_id}
                    onChange={(e) => setForm({ ...form, marketing_manager_id: e.target.value })}
                    required
                  >
                    <option value="">Select Marketing Strategist</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Account Manager</label>
                  <select
                    className="form-input"
                    value={form.account_manager_id}
                    onChange={(e) => setForm({ ...form, account_manager_id: e.target.value })}
                  >
                    <option value="">Select Account Manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Lead Video Editor / Creative</label>
                  <select
                    className="form-input"
                    value={form.creative_editor_id}
                    onChange={(e) => setForm({ ...form, creative_editor_id: e.target.value })}
                  >
                    <option value="">Select Creative Specialist</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Handover Instructions & Promises */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                3. Deliverables, Promises & Client Expectations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Promises & Commitments Made During Sales Pitch</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Specific deliverables, reel counts, ROAS guarantees, turnaround speeds promised..."
                    value={form.commitments}
                    onChange={(e) => setForm({ ...form, commitments: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Special Instructions & Communication Rules</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Tone preferences, sensitive topics, approval hierarchies..."
                    value={form.special_instructions}
                    onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldCheck size={20} color="#3B82F6" />
              <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                Upon conversion, the system will automatically initialize a <strong>17-point Onboarding Checklist</strong> and trigger a high-priority notification to the assigned Marketing Manager.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#0B1120'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success"
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Converting & Handing Over...' : 'Convert to Client & Submit Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
