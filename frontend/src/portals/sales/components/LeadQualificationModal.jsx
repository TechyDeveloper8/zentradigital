import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import {
  X, CheckCircle2, AlertCircle, ShieldAlert, Award,
  Sparkles, DollarSign, Clock, Users, HelpCircle
} from 'lucide-react';

export default function LeadQualificationModal({ isOpen, onClose, lead, onQualified }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    problem_to_solve: '',
    services_needed: '',
    why_now: '',
    expected_result: '',

    budget_confirmed: 'Yes',
    budget_range: '',
    billing_type: 'Monthly',

    is_decision_maker: 'Yes',
    final_decision_maker: '',
    other_stakeholders: '',

    timeline: 'Immediate',
    current_solution: 'Existing agency (underperforming)',

    qualification_status: 'Qualified',
    deal_value: 100000,
    lead_score: 80
  });

  useEffect(() => {
    if (lead) {
      let existingData = {};
      try {
        if (lead.qualification_data) {
          existingData = typeof lead.qualification_data === 'string'
            ? JSON.parse(lead.qualification_data)
            : lead.qualification_data;
        }
      } catch (e) {
        console.error(e);
      }

      setForm({
        problem_to_solve: existingData.problem_to_solve || lead.main_business_problem || '',
        services_needed: existingData.services_needed || lead.requirement || '',
        why_now: existingData.why_now || lead.urgency || '',
        expected_result: existingData.expected_result || lead.desired_outcome || '',

        budget_confirmed: existingData.budget_confirmed || 'Yes',
        budget_range: existingData.budget_range || lead.budget_range || '',
        billing_type: existingData.billing_type || lead.billing_type || 'Monthly',

        is_decision_maker: existingData.is_decision_maker || (lead.decision_maker ? 'Yes' : 'Yes'),
        final_decision_maker: existingData.final_decision_maker || lead.decision_maker || lead.contact_person || '',
        other_stakeholders: existingData.other_stakeholders || '',

        timeline: existingData.timeline || lead.purchase_timeline || 'Immediate',
        current_solution: existingData.current_solution || lead.existing_agency || 'Existing agency',

        qualification_status: lead.qualification_status !== 'Pending' ? lead.qualification_status : 'Qualified',
        deal_value: lead.deal_value || 100000,
        lead_score: lead.lead_score || 80
      });
    }
  }, [lead]);

  // Dynamic score calculator
  const calculateScore = () => {
    let score = 20;
    if (form.budget_confirmed === 'Yes') score += 25;
    else if (form.budget_confirmed === 'Partial') score += 10;

    if (form.is_decision_maker === 'Yes') score += 25;
    else if (form.is_decision_maker === 'Influencer') score += 12;

    if (form.timeline === 'Immediate') score += 20;
    else if (form.timeline === 'Within 30 days') score += 15;
    else if (form.timeline === '1-3 months') score += 5;

    if (form.current_solution && form.current_solution.includes('agency')) score += 10;
    return Math.min(100, Math.max(0, score));
  };

  const handleScoreRecalculate = () => {
    const sc = calculateScore();
    setForm(prev => ({ ...prev, lead_score: sc }));
  };

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        qualification_data: form,
        qualification_status: form.qualification_status,
        lead_score: Number(form.lead_score),
        deal_value: Number(form.deal_value)
      };

      const res = await api.put(`/leads/${lead.id}/qualify`, payload);
      onQualified(res.lead);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update qualification.');
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
        maxWidth: '780px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
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
              <span className="badge badge-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                BANT FRAMEWORK
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{lead.lead_code} • {lead.company_name}</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0' }}>
              Structured Lead Qualification
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

            {/* SECTION 1: BUSINESS NEED */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                1. Business Need & Intent
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">What problem are they trying to solve?</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Unpredictable lead acquisition and high CAC"
                    value={form.problem_to_solve}
                    onChange={(e) => setForm({ ...form, problem_to_solve: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">What specific service do they require?</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Meta ads scaling + 16 Monthly high-converting Reels"
                    value={form.services_needed}
                    onChange={(e) => setForm({ ...form, services_needed: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Why do they need it now?</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Upcoming festive launch in 45 days"
                    value={form.why_now}
                    onChange={(e) => setForm({ ...form, why_now: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">What result do they expect?</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 3.5x ROAS and 250 verified leads/month"
                    value={form.expected_result}
                    onChange={(e) => setForm({ ...form, expected_result: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: BUDGET & AUTHORITY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* BUDGET */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  2. Budget Verification
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="form-label">Budget Confirmed?</label>
                    <select
                      className="form-input"
                      value={form.budget_confirmed}
                      onChange={(e) => setForm({ ...form, budget_confirmed: e.target.value })}
                    >
                      <option value="Yes">Yes — Budget formally allocated</option>
                      <option value="Partial">Partial — Flexible depending on proposal</option>
                      <option value="No">No — Strictly exploratory</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Estimated Monthly Retainer (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.deal_value}
                      onChange={(e) => setForm({ ...form, deal_value: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Billing Cycle Preference</label>
                    <select
                      className="form-input"
                      value={form.billing_type}
                      onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
                    >
                      <option value="Monthly">Monthly Retainer</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="One-time">One-time Sprint</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AUTHORITY */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  3. Authority & Stakeholders
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="form-label">Is Contact the Decision Maker?</label>
                    <select
                      className="form-input"
                      value={form.is_decision_maker}
                      onChange={(e) => setForm({ ...form, is_decision_maker: e.target.value })}
                    >
                      <option value="Yes">Yes — Primary authority</option>
                      <option value="Influencer">Influencer / Champion (Reports to Founder)</option>
                      <option value="No">No — Gatekeeper</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Final Decision Maker</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Managing Partner / CEO"
                      value={form.final_decision_maker}
                      onChange={(e) => setForm({ ...form, final_decision_maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Other Stakeholders</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. In-house marketing manager, legal advisor"
                      value={form.other_stakeholders}
                      onChange={(e) => setForm({ ...form, other_stakeholders: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: TIMELINE & CURRENT SOLUTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Implementation Timeline</label>
                <select
                  className="form-input"
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                >
                  <option value="Immediate">Immediate (Within 7-10 days)</option>
                  <option value="Within 30 days">Within 30 days</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3+ months">3+ months (Long range)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Current Solution in Place</label>
                <select
                  className="form-input"
                  value={form.current_solution}
                  onChange={(e) => setForm({ ...form, current_solution: e.target.value })}
                >
                  <option value="Existing agency (underperforming)">Existing agency (seeking replacement)</option>
                  <option value="In-house team (capacity constraint)">In-house team needing scale</option>
                  <option value="Freelancers (quality inconsistency)">Freelancers / Inconsistent</option>
                  <option value="No active marketing yet">No active digital marketing yet</option>
                </select>
              </div>
            </div>

            {/* SECTION 4: QUALIFICATION DECISION & SCORE */}
            <div style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Qualification Outcome *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Qualified', 'Nurture', 'On Hold', 'Unqualified'].map(st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setForm({ ...form, qualification_status: st })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: form.qualification_status === st
                          ? (st === 'Qualified' ? '#10B981' : (st === 'Unqualified' ? '#EF4444' : '#3B82F6'))
                          : '#1E293B',
                        color: form.qualification_status === st ? '#fff' : '#94A3B8',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Computed Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: form.lead_score >= 70 ? '#10B981' : (form.lead_score >= 50 ? '#F59E0B' : '#EF4444') }}>
                    {form.lead_score}/100
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleScoreRecalculate}
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', padding: '6px 10px' }}
                >
                  Auto-Rate
                </button>
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
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 700 }}>
              {loading ? 'Saving BANT Analysis...' : 'Confirm Qualification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
