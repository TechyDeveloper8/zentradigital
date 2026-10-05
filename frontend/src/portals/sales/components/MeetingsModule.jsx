import React, { useState } from 'react';
import api from '../../../api/client';
import {
  Calendar, Clock, Video, Phone, MapPin, Users, Plus,
  CheckCircle2, AlertCircle, XCircle, RefreshCw, ExternalLink,
  Edit, MoreHorizontal, ChevronRight, FileText
} from 'lucide-react';

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
  COMPLETED: { label: 'Completed', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  RESCHEDULED: { label: 'Rescheduled', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
  'NO SHOW': { label: 'No Show', bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' }
};

export default function MeetingsModule({
  meetings = [],
  loading = false,
  onRefresh,
  onScheduleMeeting,
  onEditMeeting,
  onStatusUpdated
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED'
  const [updatingId, setUpdatingId] = useState(null);

  // Quick Status Change directly from dropdown
  const handleQuickStatusChange = async (meeting, newStatus) => {
    if (meeting.status === newStatus) return;

    // If changing to Rescheduled or adding notes, it's better to open the modal so user can set the new date/time
    if (newStatus === 'RESCHEDULED') {
      onEditMeeting({ ...meeting, status: newStatus });
      return;
    }

    setUpdatingId(meeting.id);
    try {
      const res = await api.put(`/meetings/${meeting.id}`, {
        status: newStatus
      });
      onStatusUpdated(res.meeting);
    } catch (err) {
      alert(err.message || 'Failed to update meeting status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = meetings.filter((m) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SCHEDULED') return m.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return m.status === 'COMPLETED';
    if (activeTab === 'RESCHEDULED') return m.status === 'RESCHEDULED';
    if (activeTab === 'CANCELLED') return m.status === 'CANCELLED' || m.status === 'NO SHOW';
    return true;
  });

  const scheduledCount = meetings.filter(m => m.status === 'SCHEDULED').length;
  const completedCount = meetings.filter(m => m.status === 'COMPLETED').length;
  const rescheduledCount = meetings.filter(m => m.status === 'RESCHEDULED').length;
  const cancelledCount = meetings.filter(m => m.status === 'CANCELLED' || m.status === 'NO SHOW').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Stats */}
      <div className="kpi-grid">
        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>All Meetings</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', marginTop: '4px' }}>{meetings.length}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Discovery & pitches</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#FBBF24', fontWeight: 600, textTransform: 'uppercase' }}>Scheduled</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>{scheduledCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Upcoming calls</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>{completedCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Conducted pitches</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>Rescheduled</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{rescheduledCount}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Updated timings</div>
        </div>
      </div>

      {/* Control Bar: Tabs & Action */}
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
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All (${meetings.length})` },
            { key: 'SCHEDULED', label: `Scheduled (${scheduledCount})` },
            { key: 'COMPLETED', label: `Completed (${completedCount})` },
            { key: 'RESCHEDULED', label: `Rescheduled (${rescheduledCount})` },
            { key: 'CANCELLED', label: `Cancelled (${cancelledCount})` }
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
                  border: isSelected ? '1px solid #6366F1' : '1px solid #374151',
                  backgroundColor: isSelected ? '#312E81' : '#1F2937',
                  color: isSelected ? '#C7D2FE' : '#9CA3AF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onRefresh}
            title="Refresh Meetings"
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

          <button
            onClick={() => onScheduleMeeting(null)}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No meetings found</div>
            <p style={{ fontSize: '13px', margin: '4px 0 16px', color: '#64748B' }}>
              Schedule client discovery or proposal pitch meetings using the button above.
            </p>
            <button
              onClick={() => onScheduleMeeting(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6366F1',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Schedule Meeting
            </button>
          </div>
        ) : (
          filtered.map((m) => {
            const stConf = STATUS_CONFIG[m.status] || STATUS_CONFIG['SCHEDULED'];
            const isVideo = m.meeting_type === 'Video Call';

            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '12px',
                  border: `1px solid ${stConf.border}`,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header Row: Title, Lead, Date, Type */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: stConf.bg,
                        color: stConf.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isVideo ? <Video size={18} /> : <Calendar size={18} />}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                        {m.title}
                      </h3>
                      <div style={{ fontSize: '12.5px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#CBD5E1' }}>{m.lead_company_name || 'Prospect'}</span>
                        {m.lead_contact_person && <span>• {m.lead_contact_person}</span>}
                        {m.lead_phone && <span>({m.lead_phone})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Core Feature 3: Module to update meeting status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Update Status:
                      </span>
                      <select
                        value={m.status}
                        disabled={updatingId === m.id}
                        onChange={(e) => handleQuickStatusChange(m, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1E293B',
                          border: `1px solid ${stConf.border}`,
                          borderRadius: '8px',
                          color: stConf.text,
                          fontWeight: 700,
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="RESCHEDULED">Rescheduled</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="NO SHOW">No Show</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onEditMeeting(m)}
                      title="Update Meeting Details, Reschedule, or Add Outcome Notes"
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#CBD5E1',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit size={13} />
                      <span>Edit / Notes</span>
                    </button>
                  </div>
                </div>

                {/* Info Pills: Date, Time, Type, Link */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#93C5FD', backgroundColor: '#1E293B', padding: '4px 10px', borderRadius: '6px' }}>
                    <Calendar size={13} />
                    <span>{m.meeting_date}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '4px 10px', borderRadius: '6px' }}>
                    <Clock size={13} />
                    <span>{m.meeting_time}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '4px 10px', borderRadius: '6px' }}>
                    {isVideo ? <Video size={13} /> : <MapPin size={13} />}
                    <span>{m.meeting_type}</span>
                  </div>

                  {m.meeting_link && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#60A5FA',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>

                {/* Agenda & Notes */}
                {(m.agenda || m.notes) && (
                  <div style={{ display: 'grid', gridTemplateColumns: m.notes ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr', gap: '10px', marginTop: '2px' }}>
                    {m.agenda && (
                      <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          Agenda:
                        </span>
                        {m.agenda}
                      </div>
                    )}
                    {m.notes && (
                      <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#E2E8F0', borderLeft: `3px solid ${stConf.text}` }}>
                        <span style={{ fontSize: '11px', color: stConf.text, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          Outcome / Notes:
                        </span>
                        {m.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
