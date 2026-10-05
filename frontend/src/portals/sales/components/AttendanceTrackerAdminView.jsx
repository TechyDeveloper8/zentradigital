import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import {
  Clock, Shield, UserCheck, Calendar, AlertTriangle,
  CheckCircle2, RefreshCw, Plus, Edit2, LogIn, LogOut,
  ChevronRight, ArrowRight, User
} from 'lucide-react';

const STATUS_BADGES = {
  PRESENT: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)' },
  LATE: { bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)' },
  'HALF DAY': { bg: 'rgba(249, 115, 22, 0.2)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.4)' },
  ABSENT: { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171', border: 'rgba(239, 68, 68, 0.4)' },
  LEAVE: { bg: 'rgba(148, 163, 184, 0.2)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.4)' }
};

export default function AttendanceTrackerAdminView({
  onOpenAdjustModal
}) {
  const { user, attendance: myTodayAttendance, refreshAttendance } = useAuth();
  const isAdmin = user?.role_name === 'admin';

  const [loading, setLoading] = useState(false);
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('');

  // Punch In / Punch Out local loading
  const [punchLoading, setPunchLoading] = useState(false);

  // Fetch sales executive attendance data
  const loadExecutiveAttendance = async (empId = null) => {
    setLoading(true);
    try {
      const queryParams = {};
      if (empId || selectedExecutiveId) {
        queryParams.employee_id = empId || selectedExecutiveId;
      }
      if (statusFilter !== 'ALL') {
        queryParams.status = statusFilter;
      }
      if (monthFilter) {
        queryParams.month = monthFilter;
      }

      const res = await api.get('/attendance/sales-executives', queryParams);
      setSalesExecutives(res.salesExecutives || []);
      setSelectedExecutive(res.selectedExecutive || null);
      setRecords(res.records || []);
      setSummary(res.summary || null);

      if (!selectedExecutiveId && res.selectedExecutive) {
        setSelectedExecutiveId(res.selectedExecutive.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutiveAttendance();
  }, [selectedExecutiveId, statusFilter, monthFilter]);

  // Executive Punch In / Out
  const handleCheckIn = async () => {
    setPunchLoading(true);
    try {
      await api.post('/attendance/check-in');
      await refreshAttendance();
      loadExecutiveAttendance();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setPunchLoading(true);
    try {
      await api.post('/attendance/check-out');
      await refreshAttendance();
      loadExecutiveAttendance();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Admin Mode Badge & Header */}
      <div
        style={{
          backgroundColor: '#111827',
          padding: '18px 24px',
          borderRadius: '14px',
          border: '1px solid #1F2937',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F87171', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Admin Attendance Control View
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Feature 6: Track & view attendance records for each Sales Executive
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0' }}>
              Sales Executive Attendance Tracker
            </h2>
          </div>
        </div>

        {/* Admin Action: Adjust Attendance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadExecutiveAttendance()}
            title="Refresh Attendance"
            style={{
              padding: '9px 12px',
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
            onClick={() => onOpenAdjustModal(selectedExecutive, salesExecutives)}
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>Admin Adjust Attendance</span>
          </button>
        </div>
      </div>

      {/* Sales Executive Selector & Live Punch Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Executive Selector */}
        <div
          style={{
            backgroundColor: '#111827',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #1F2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
            Select Sales Executive to Track:
          </label>
          <select
            value={selectedExecutiveId}
            onChange={(e) => {
              setSelectedExecutiveId(e.target.value);
              loadExecutiveAttendance(e.target.value);
            }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '10px',
              color: '#F8FAFC',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {salesExecutives.map((exec) => (
              <option key={exec.id} value={exec.id}>
                {exec.first_name} {exec.last_name} • [{exec.employee_code}] - {exec.designation}
              </option>
            ))}
          </select>

          {selectedExecutive && (
            <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#F8FAFC' }}>Role:</strong> {selectedExecutive.designation}</div>
              <div><strong style={{ color: '#F8FAFC' }}>Shift Hours:</strong> {selectedExecutive.shift_start || '09:30'} - {selectedExecutive.shift_end || '18:30'}</div>
              <div><strong style={{ color: '#F8FAFC' }}>Email:</strong> {selectedExecutive.email}</div>
            </div>
          )}
        </div>

        {/* Live Punch Status */}
        <div
          style={{
            backgroundColor: '#111827',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #1F2937',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <span style={{ fontSize: '11.5px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Attendance Status
            </span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
              {myTodayAttendance?.record?.check_in_time ? (
                <span style={{ color: '#34D399' }}>
                  Checked In at {myTodayAttendance.record.check_in_time} {myTodayAttendance.record.check_out_time ? `• Out at ${myTodayAttendance.record.check_out_time}` : '(Active Shift)'}
                </span>
              ) : (
                <span style={{ color: '#FBBF24' }}>Not punched in yet today</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCheckIn}
              disabled={punchLoading || myTodayAttendance?.record?.check_in_time}
              style={{
                flex: 1,
                padding: '9px 16px',
                backgroundColor: myTodayAttendance?.record?.check_in_time ? '#1E293B' : 'rgba(16, 185, 129, 0.2)',
                border: myTodayAttendance?.record?.check_in_time ? '1px solid #334155' : '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                color: myTodayAttendance?.record?.check_in_time ? '#64748B' : '#34D399',
                fontWeight: 700,
                fontSize: '13px',
                cursor: myTodayAttendance?.record?.check_in_time ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={15} />
              <span>Punch In</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={punchLoading || !myTodayAttendance?.record?.check_in_time || myTodayAttendance?.record?.check_out_time}
              style={{
                flex: 1,
                padding: '9px 16px',
                backgroundColor: myTodayAttendance?.record?.check_out_time || !myTodayAttendance?.record?.check_in_time ? '#1E293B' : 'rgba(239, 68, 68, 0.2)',
                border: myTodayAttendance?.record?.check_out_time || !myTodayAttendance?.record?.check_in_time ? '1px solid #334155' : '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: myTodayAttendance?.record?.check_out_time || !myTodayAttendance?.record?.check_in_time ? '#64748B' : '#F87171',
                fontWeight: 700,
                fontSize: '13px',
                cursor: myTodayAttendance?.record?.check_out_time || !myTodayAttendance?.record?.check_in_time ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={15} />
              <span>Punch Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics for Selected Executive */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}
        >
          <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Recorded Days</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', marginTop: '4px' }}>{summary.totalRecords}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Working days tracked</div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '12px', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Present Days</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>{summary.presentDays}</div>
            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>{summary.onTimeRate}% on-time arrival</div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '12px', color: '#FBBF24', fontWeight: 600, textTransform: 'uppercase' }}>Late Days</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginTop: '4px' }}>{summary.lateDays}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Arrived after grace time</div>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>Total Hours Logged</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>{summary.totalHours} hrs</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Avg {summary.avgHours} hrs/day</div>
          </div>
        </div>
      )}

      {/* Filter Tabs for Records */}
      <div
        style={{
          backgroundColor: '#111827',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #1F2937',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'PRESENT', 'LATE', 'HALF DAY', 'ABSENT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: statusFilter === st ? 700 : 500,
                border: statusFilter === st ? '1px solid #EF4444' : '1px solid #374151',
                backgroundColor: statusFilter === st ? 'rgba(239, 68, 68, 0.2)' : '#1F2937',
                color: statusFilter === st ? '#F87171' : '#9CA3AF',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>
          Showing {records.length} records for {selectedExecutive?.first_name || 'Selected Executive'}
        </span>
      </div>

      {/* Attendance Records Table */}
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
              <tr style={{ borderBottom: '1px solid #1F2937', color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#0F172A' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Punch In</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Punch Out</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Working Hours</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Admin Adjustments & Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                    No attendance records found for this filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const badge = STATUS_BADGES[r.status] || STATUS_BADGES['PRESENT'];

                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid #1F2937' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F293750'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Date */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#F8FAFC' }}>
                        {r.date}
                      </td>

                      {/* Punch In */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1' }}>
                        {r.check_in_time || '—'}
                      </td>

                      {/* Punch Out */}
                      <td style={{ padding: '14px 18px', color: '#CBD5E1' }}>
                        {r.check_out_time || '—'}
                      </td>

                      {/* Working Hours */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#60A5FA' }}>
                        {r.total_working_hours ? `${r.total_working_hours} hrs` : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Adjustment / Notes */}
                      <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#94A3B8' }}>
                        {r.is_manual_adjusted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Adjusted by Admin
                            </span>
                            <span>{r.adjustment_reason || 'Manual correction applied.'}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#64748B' }}>Standard biometric log</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
