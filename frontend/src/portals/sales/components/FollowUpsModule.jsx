import React, { useState } from 'react';
import api from '../../../api/client';
import {
  Clock, Plus, Search, Calendar, Phone, MessageSquare, Mail,
  Video, CheckCircle2, AlertTriangle, XCircle, Edit3, ArrowRight,
  Filter, Check, MoreHorizontal, RefreshCw
} from 'lucide-react';

const CONTACT_ICONS = {
  Phone: Phone,
  WhatsApp: MessageSquare,
  Email: Mail,
  'Video Call': Video,
  'In-Person Meeting': Calendar,
  Other: Clock
};

export default function FollowUpsModule({
  followUps = [],
  loading = false,
  onRefresh,
  onAddFollowUp,
  onEditFollowUp,
  onStatusUpdated
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered follow-ups
  const filtered = followUps.filter((fu) => {
    const matchesSearch =
      !searchTerm ||
      fu.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.discussion_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.lead_code?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'TODAY') {
      return fu.follow_up_date === todayStr && fu.status === 'PENDING';
    } else if (activeTab === 'OVERDUE') {
      return fu.follow_up_date < todayStr && fu.status === 'PENDING';
    } else if (activeTab === 'UPCOMING') {
      return fu.follow_up_date > todayStr && fu.status === 'PENDING';
    } else if (activeTab === 'COMPLETED') {
      return fu.status === 'COMPLETED';
    }
    return true; // 'ALL'
  });

  // Summary counts
  const todayCount = followUps.filter(f => f.follow_up_date === todayStr && f.status === 'PENDING').length;
  const overdueCount = followUps.filter(f => f.follow_up_date < todayStr && f.status === 'PENDING').length;
  const upcomingCount = followUps.filter(f => f.follow_up_date > todayStr && f.status === 'PENDING').length;
  const completedCount = followUps.filter(f => f.status === 'COMPLETED').length;

  // Quick Complete Follow-Up
  const handleQuickComplete = async (fu) => {
    setActionLoadingId(fu.id);
    try {
      const res = await api.put(`/leads/follow-ups/${fu.id}`, {
        status: 'COMPLETED'
      });
      onStatusUpdated(res.follow_up);
    } catch (err) {
      alert(err.message || 'Failed to update follow-up status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Stats */}
      <div className="kpi-grid">
        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>All Follow-ups</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', marginTop: '4px' }}>{followUps.length}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Logged touchpoints</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Due Today</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{todayCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Action scheduled today</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>Overdue Calls</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F87171', marginTop: '4px' }}>{overdueCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Requires immediate touch</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>{completedCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Concluded conversations</div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, Add Follow-up */}
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
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All (${followUps.length})` },
            { key: 'TODAY', label: `Today (${todayCount})` },
            { key: 'OVERDUE', label: `Overdue (${overdueCount})` },
            { key: 'UPCOMING', label: `Upcoming (${upcomingCount})` },
            { key: 'COMPLETED', label: `Completed (${completedCount})` }
          ].map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #3B82F6' : '1px solid #374151',
                  backgroundColor: isSelected ? '#1E3A8A' : '#1F2937',
                  color: isSelected ? '#93C5FD' : '#9CA3AF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '240px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search follow-ups or notes..."
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
            title="Refresh Follow-ups"
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

          {/* Core Feature 2: Capability to add follow-ups */}
          <button
            onClick={() => onAddFollowUp(null)}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>Add Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Follow-up Cards / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: '#111827',
              borderRadius: '14px',
              border: '1px solid #1F2937',
              padding: '50px 20px',
              textAlign: 'center',
              color: '#94A3B8'
            }}
          >
            <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No follow-ups found in this view</div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px', color: '#64748B' }}>
              {activeTab === 'TODAY'
                ? "You don't have any follow-ups scheduled for today!"
                : 'Click "Add Follow-Up" to schedule prospect interactions.'}
            </p>
            <button
              onClick={() => onAddFollowUp(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Add Follow-Up
            </button>
          </div>
        ) : (
          filtered.map((fu) => {
            const isCompleted = fu.status === 'COMPLETED';
            const isOverdue = fu.follow_up_date < todayStr && !isCompleted;
            const isToday = fu.follow_up_date === todayStr && !isCompleted;
            const Icon = CONTACT_ICONS[fu.contact_method] || Phone;

            return (
              <div
                key={fu.id}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : (isToday ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid #1F2937'),
                  padding: '18px 20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                {/* Left Section: Company, Contact, Date, Method */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1', minWidth: '280px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : (isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                      color: isCompleted ? '#34D399' : (isOverdue ? '#F87171' : '#60A5FA'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '15px' }}>
                        {fu.company_name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        ({fu.contact_person} • {fu.phone})
                      </span>
                      {fu.lead_code && (
                        <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px' }}>
                          {fu.lead_code}
                        </span>
                      )}
                    </div>

                    {/* Date badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.2)' : (isToday ? 'rgba(59, 130, 246, 0.2)' : '#1E293B'),
                          color: isOverdue ? '#F87171' : (isToday ? '#93C5FD' : '#94A3B8'),
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Calendar size={12} />
                        <span>{fu.follow_up_date}</span>
                        {fu.follow_up_time && <span>• {fu.follow_up_time}</span>}
                        {isOverdue && <span>(Overdue)</span>}
                        {isToday && <span>(Today)</span>}
                      </span>

                      <span style={{ fontSize: '11.5px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '6px' }}>
                        Via {fu.contact_method}
                      </span>

                      {/* Status */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isCompleted ? '#34D399' : '#FBBF24'
                        }}
                      >
                        {fu.status}
                      </span>
                    </div>

                    {/* Discussion Summary / Follow-up Notes (Core Requirement 2) */}
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        color: '#E2E8F0',
                        backgroundColor: '#1E293B',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        borderLeft: '3px solid #3B82F6'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Follow-Up Notes & Discussion:
                      </div>
                      <div>{fu.discussion_summary || 'No notes added yet.'}</div>
                      {fu.next_action && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#60A5FA', fontWeight: 600 }}>
                          Next Action: {fu.next_action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Mark complete button */}
                  {!isCompleted && (
                    <button
                      onClick={() => handleQuickComplete(fu)}
                      disabled={actionLoadingId === fu.id}
                      title="Mark Follow-up as Completed"
                      style={{
                        padding: '7px 12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#34D399',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Check size={14} />
                      <span>{actionLoadingId === fu.id ? 'Updating...' : 'Mark Done'}</span>
                    </button>
                  )}

                  {/* Core Feature 2: Capability to update follow-up date and notes */}
                  <button
                    onClick={() => onEditFollowUp(fu)}
                    title="Update Follow-Up Date & Add Notes"
                    style={{
                      padding: '7px 14px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      color: '#FBBF24',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Update Date & Notes</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
