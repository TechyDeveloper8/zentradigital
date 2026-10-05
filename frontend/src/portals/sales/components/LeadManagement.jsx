import React, { useState } from 'react';
import {
  Users, Plus, Search, Filter, Phone, Mail, Building2,
  Calendar, Clock, DollarSign, Tag, ArrowRight, Edit, MessageSquare,
  ChevronRight, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';

const STAGE_COLORS = {
  NEW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  CONTACTED: { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  QUALIFIED: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.3)' },
  MEETING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
  PROPOSAL: { bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.3)' },
  NEGOTIATION: { bg: 'rgba(244, 63, 94, 0.15)', text: '#FB7185', border: 'rgba(244, 63, 94, 0.3)' },
  WON: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  LOST: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' },
  'ON HOLD': { bg: 'rgba(234, 179, 8, 0.15)', text: '#FDE047', border: 'rgba(234, 179, 8, 0.3)' }
};

const PRIORITY_BADGES = {
  URGENT: { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.2)', text: '#FB923C' },
  MEDIUM: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' },
  LOW: { bg: 'rgba(100, 116, 139, 0.2)', text: '#94A3B8' }
};

export default function LeadManagement({
  leads = [],
  loading = false,
  onRefresh,
  onAddNewLead,
  onEditLead,
  onOpenFollowUp,
  onOpenMeeting
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      !searchTerm ||
      l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.includes(searchTerm) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lead_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || l.priority === priorityFilter;
    const matchesStage = stageFilter === 'ALL' || l.status === stageFilter;
    const matchesSource = sourceFilter === 'ALL' || l.source === sourceFilter;

    return matchesSearch && matchesPriority && matchesStage && matchesSource;
  });

  // Calculate Metrics
  const totalCount = leads.length;
  const newCount = leads.filter(l => l.status === 'NEW').length;
  const qualifiedCount = leads.filter(l => ['QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION'].includes(l.status)).length;
  const wonCount = leads.filter(l => l.status === 'WON').length;
  const totalPipelineVal = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Summary Badges */}
      <div className="kpi-grid">
        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Total Leads</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', marginTop: '4px' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>In sales database</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>New Inbound Leads</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{newCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Pending first contact</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#818CF8', fontWeight: 600, textTransform: 'uppercase' }}>Qualified & In Pitch</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#818CF8', marginTop: '4px' }}>{qualifiedCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Active discussion deals</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Deals Closed Won</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>{wonCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Total ₹{totalPipelineVal.toLocaleString()}</div>
        </div>
      </div>

      {/* Control & Filter Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search leads by company, contact person, phone, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
              fontSize: '13.5px'
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Stages</option>
            {Object.keys(STAGE_COLORS).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={onRefresh}
            title="Refresh Leads"
            style={{
              padding: '9px 12px',
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Core Feature 1: Add New Lead Button */}
          <button
            onClick={onAddNewLead}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Leads Table Card */}
      <div
        style={{
          backgroundColor: '#111827',
          borderRadius: '14px',
          border: '1px solid #1F2937',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} style={{ color: '#10B981' }} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#F9FAFB' }}>
              Leads Directory ({filteredLeads.length} of {leads.length})
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            Feature 1: Add new leads & update existing lead details
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No leads found</div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px', color: '#64748B' }}>
              {searchTerm || priorityFilter !== 'ALL' || stageFilter !== 'ALL'
                ? 'Try adjusting your search query or filter chips.'
                : 'Click "Add New Lead" above to create your first prospect.'}
            </p>
            <button
              onClick={onAddNewLead}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Add Lead Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937', color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Lead / Company</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Contact Info</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Source & Industry</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Deal Value</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Stage</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const stageStyle = STAGE_COLORS[lead.status] || STAGE_COLORS['NEW'];
                  const priorityStyle = PRIORITY_BADGES[lead.priority] || PRIORITY_BADGES['MEDIUM'];

                  return (
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: '1px solid #1F2937',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F293750'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Company & Person */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94A3B8',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            {lead.company_name?.charAt(0) || 'L'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '13.5px' }}>
                              {lead.company_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{lead.contact_person}</span>
                              {lead.designation && <span style={{ color: '#64748B' }}>• {lead.designation}</span>}
                              <span style={{ color: '#475569', fontSize: '11px' }}>[{lead.lead_code}]</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <a
                            href={`tel:${lead.phone}`}
                            style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Phone size={13} style={{ color: '#10B981' }} />
                            <span>{lead.phone}</span>
                          </a>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '12px' }}
                            >
                              <Mail size={12} />
                              <span>{lead.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Source & Industry */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#E2E8F0', fontWeight: 500 }}>{lead.source}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{lead.industry || 'General Business'}</div>
                      </td>

                      {/* Deal Value */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#34D399', fontSize: '13.5px' }}>
                          ₹{Number(lead.deal_value || 0).toLocaleString()}
                        </div>
                        {lead.urgency && (
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{lead.urgency} urgency</div>
                        )}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: priorityStyle.bg,
                            color: priorityStyle.text
                          }}
                        >
                          {lead.priority || 'MEDIUM'}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: stageStyle.bg,
                            color: stageStyle.text,
                            border: `1px solid ${stageStyle.border}`,
                            display: 'inline-block'
                          }}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Core Feature 1: Ability to update existing lead details */}
                          <button
                            onClick={() => onEditLead(lead)}
                            title="Update Lead Details"
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '6px',
                              color: '#818CF8',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Quick Follow-up button */}
                          <button
                            onClick={() => onOpenFollowUp(lead)}
                            title="Schedule Follow-up"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#1E293B',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#94A3B8',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={13} />
                            <span>Follow-up</span>
                          </button>

                          {/* Quick Meeting button */}
                          <button
                            onClick={() => onOpenMeeting(lead)}
                            title="Schedule Meeting"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#1E293B',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#94A3B8',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Calendar size={13} />
                            <span>Meeting</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
