import React, { useState } from 'react';
import api from '../../../api/client';
import {
  Layers, Table, ArrowRight, DollarSign, Building2,
  Phone, User, Calendar, CheckCircle2, ChevronRight,
  TrendingUp, RefreshCw, Filter, Search, ArrowUpRight
} from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'New Lead', color: '#3B82F6', badge: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA' },
  { key: 'CONTACTED', label: 'Contacted', color: '#A855F7', badge: 'rgba(168, 85, 247, 0.15)', text: '#C084FC' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#6366F1', badge: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' },
  { key: 'MEETING', label: 'Meeting', color: '#F59E0B', badge: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24' },
  { key: 'PROPOSAL', label: 'Proposal', color: '#F97316', badge: 'rgba(249, 115, 22, 0.15)', text: '#FB923C' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#F43F5E', badge: 'rgba(244, 63, 94, 0.15)', text: '#FB7185' },
  { key: 'WON', label: 'Won', color: '#10B981', badge: 'rgba(16, 185, 129, 0.15)', text: '#34D399' },
  { key: 'LOST', label: 'Lost', color: '#64748B', badge: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8' }
];

export default function PipelineManagement({
  leads = [],
  loading = false,
  onRefresh,
  onStageUpdated,
  onEditLead
}) {
  const [viewMode, setViewMode] = useState('VISUAL'); // 'VISUAL' | 'TABLE'
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingLeadId, setUpdatingLeadId] = useState(null);

  // Manual stage progression call
  const handleStageChange = async (leadId, newStage) => {
    setUpdatingLeadId(leadId);
    try {
      const res = await api.put(`/leads/${leadId}/stage`, { stage: newStage });
      onStageUpdated(res.lead);
    } catch (err) {
      alert(err.message || 'Failed to update pipeline stage');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Step to next stage helper
  const handleAdvanceNext = (lead) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === lead.status);
    if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 2) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1].key;
      handleStageChange(lead.id, nextStage);
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true;
    return (
      l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lead_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate totals
  const totalPipelineValue = leads.reduce((sum, l) => l.status !== 'WON' && l.status !== 'LOST' ? sum + (Number(l.deal_value) || 0) : sum, 0);
  const totalWonValue = leads.reduce((sum, l) => l.status === 'WON' ? sum + (Number(l.deal_value) || 0) : sum, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Active Pipeline Value</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>
            ₹{totalPipelineValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Across active opportunities</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Total Closed Won</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
            ₹{totalWonValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Successfully won deals</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#C084FC', fontWeight: 600, textTransform: 'uppercase' }}>Deals in Motion</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#C084FC', marginTop: '4px' }}>
            {leads.filter(l => l.status !== 'WON' && l.status !== 'LOST').length}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Active negotiation pipeline</div>
        </div>
      </div>

      {/* Control Bar: View Mode Switcher & Search */}
      <div
        style={{
          backgroundColor: '#111827',
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid #1F2937',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        {/* Visual vs Table Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setViewMode('VISUAL')}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: viewMode === 'VISUAL' ? 700 : 500,
              border: viewMode === 'VISUAL' ? '1px solid #6366F1' : '1px solid #374151',
              backgroundColor: viewMode === 'VISUAL' ? '#312E81' : '#1F2937',
              color: viewMode === 'VISUAL' ? '#C7D2FE' : '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={15} />
            <span>Visual Pipeline Stages</span>
          </button>

          <button
            onClick={() => setViewMode('TABLE')}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: viewMode === 'TABLE' ? 700 : 500,
              border: viewMode === 'TABLE' ? '1px solid #6366F1' : '1px solid #374151',
              backgroundColor: viewMode === 'TABLE' ? '#312E81' : '#1F2937',
              color: viewMode === 'TABLE' ? '#C7D2FE' : '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Table size={15} />
            <span>Pipeline Table Tracker</span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '240px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search deals in pipeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            onClick={onRefresh}
            title="Refresh Pipeline"
            style={{
              padding: '8px 12px',
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#9CA3AF',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: VISUAL PIPELINE KANBAN COLUMNS */}
      {/* ========================================================================= */}
      {viewMode === 'VISUAL' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}
        >
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.key);
            const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

            return (
              <div
                key={stage.key}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  border: '1px solid #1F2937',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Stage Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1F2937',
                    backgroundColor: '#0F172A',
                    borderTop: `3px solid ${stage.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '13.5px' }}>
                      {stage.label}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: stage.badge,
                        color: stage.text
                      }}
                    >
                      {stageLeads.length}
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>
                    ₹{stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                  {stageLeads.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
                      No deals in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isUpdating = updatingLeadId === lead.id;
                      const canAdvance = stage.key !== 'WON' && stage.key !== 'LOST';

                      return (
                        <div
                          key={lead.id}
                          style={{
                            backgroundColor: '#1E293B',
                            borderRadius: '10px',
                            border: '1px solid #334155',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '14px' }}>
                                {lead.company_name}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#34D399' }}>
                                ₹{Number(lead.deal_value || 0).toLocaleString()}
                              </span>
                            </div>

                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>
                              {lead.contact_person} • {lead.phone}
                            </div>
                          </div>

                          {/* Interactive manual stage movement: Core Feature 5 */}
                          <div style={{ paddingTop: '8px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <select
                              value={lead.status}
                              disabled={isUpdating}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                backgroundColor: '#0F172A',
                                border: '1px solid #475569',
                                borderRadius: '6px',
                                color: stage.text,
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s.key} value={s.key}>Move: {s.label}</option>
                              ))}
                            </select>

                            {canAdvance && (
                              <button
                                onClick={() => handleAdvanceNext(lead)}
                                disabled={isUpdating}
                                title="Advance to Next Stage"
                                style={{
                                  padding: '5px 8px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                  border: '1px solid rgba(99, 102, 241, 0.4)',
                                  borderRadius: '6px',
                                  color: '#818CF8',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  flexShrink: 0
                                }}
                              >
                                <span>Advance</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PIPELINE TABLE TRACKER */}
      {/* ========================================================================= */}
      {viewMode === 'TABLE' && (
        <div
          style={{
            backgroundColor: '#111827',
            borderRadius: '14px',
            border: '1px solid #1F2937',
            overflow: 'hidden'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937', color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Company & Contact</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Deal Value</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Current Stage</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Manual Stage Progression Tracker</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const currentStageObj = PIPELINE_STAGES.find(s => s.key === lead.status) || PIPELINE_STAGES[0];
                  const isUpdating = updatingLeadId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: '1px solid #1F2937' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F293750'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Company */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '13.5px' }}>
                          {lead.company_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                          {lead.contact_person} • {lead.phone}
                        </div>
                      </td>

                      {/* Value */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: '#34D399', fontSize: '14px' }}>
                          ₹{Number(lead.deal_value || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{lead.source}</div>
                      </td>

                      {/* Current Stage */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: currentStageObj.badge,
                            color: currentStageObj.text,
                            border: `1px solid ${currentStageObj.color}40`,
                            display: 'inline-block'
                          }}
                        >
                          {currentStageObj.label}
                        </span>
                      </td>

                      {/* Stage Progression Pills: Core Feature 5 */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {PIPELINE_STAGES.slice(0, 7).map((st) => {
                            const isCurrent = lead.status === st.key;
                            return (
                              <button
                                key={st.key}
                                onClick={() => handleStageChange(lead.id, st.key)}
                                disabled={isUpdating}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: isCurrent ? 800 : 500,
                                  backgroundColor: isCurrent ? st.color : '#1E293B',
                                  color: isCurrent ? '#FFFFFF' : '#94A3B8',
                                  border: isCurrent ? `1px solid ${st.color}` : '1px solid #334155',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Quick Dropdown Move */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <select
                          value={lead.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: currentStageObj.text,
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
