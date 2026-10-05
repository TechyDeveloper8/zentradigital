import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Clock, CheckCircle2, AlertTriangle, XCircle, Shield,
  Calendar, Search, Filter, RefreshCw, Users, UserCheck,
  ChevronRight, ArrowUpDown, Download, Check, AlertCircle, Info
} from 'lucide-react';

const STATUS_BADGES = {
  PRESENT: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    text: '#34D399',
    label: 'PRESENT'
  },
  LATE: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: '#FBBF24',
    label: 'LATE'
  },
  'HALF DAY': {
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.35)',
    text: '#C084FC',
    label: 'HALF DAY'
  },
  ABSENT: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
    text: '#F87171',
    label: 'ABSENT'
  },
  LEAVE: {
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.35)',
    text: '#94A3B8',
    label: 'LEAVE'
  }
};

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Roles & Departments' },
  { value: 'sales', label: 'Sales Executive' },
  { value: 'marketing_manager', label: 'Social Media Manager' },
  { value: 'editor', label: 'Video Editor / Creative' }
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PRESENT', label: 'Present (On-Time)' },
  { value: 'LATE', label: 'Late Arrival' },
  { value: 'HALF DAY', label: 'Half Day' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEAVE', label: 'Leave' }
];

export default function Attendance() {
  const [viewMode, setViewMode] = useState('master'); // 'master' | 'today'
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [todayOverview, setTodayOverview] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [summary, setSummary] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');



  // Success toast state
  const [toastMessage, setToastMessage] = useState('');

  // Helper: Format today's date in YYYY-MM-DD
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  // Helper: Calculate date ranges for presets
  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === 'today') {
      const d = today.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const d = y.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Fetch Master Attendance Records with search & filters
  const loadMasterRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else if (startDate) {
        params.start_date = startDate;
      }

      const res = await api.get('/attendance/records', params);
      setRecords(res.records || []);
      setSummary(res.summary || null);
      if (res.employees) setEmployeesList(res.employees);
    } catch (err) {
      console.error('Failed to load master attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Today's Live Presence
  const loadTodayOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/today');
      setTodayOverview(res);
      if (res.records) {
        // Also update employees list from today's active staff
        setEmployeesList(prev => prev.length ? prev : res.records.map(r => ({
          id: r.id,
          employee_code: r.employee_code,
          first_name: r.first_name,
          last_name: r.last_name,
          designation: r.designation,
          role_name: r.role_name,
          role_display: r.role_display,
          department_name: r.department_name
        })));
      }
    } catch (err) {
      console.error("Failed to load today's attendance overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'master') {
      const timeout = setTimeout(() => {
        loadMasterRecords();
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      loadTodayOverview();
    }
  }, [viewMode, searchQuery, selectedRole, selectedStatus, startDate, endDate]);



  return (
    <div className="portal-inner-container">
      {/* Top Header Card */}
      <div className="portal-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #E50914 0%, #99050C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)'
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#FF4D4D',
                  backgroundColor: 'rgba(229, 9, 20, 0.15)',
                  border: '1px solid rgba(229, 9, 20, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                Admin Control Panel
              </span>
              <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
                Universal Operational Attendance Management
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
              Universal Workforce Attendance Hub
            </h1>
          </div>
        </div>

        {/* View Mode Toggle & Manual Override Button */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '10px',
              padding: '3px'
            }}
          >
            <button
              onClick={() => setViewMode('master')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: viewMode === 'master' ? '#E50914' : 'transparent',
                color: viewMode === 'master' ? '#FFFFFF' : '#A1A1AA',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={14} /> Master Attendance Log
            </button>
            <button
              onClick={() => setViewMode('today')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: viewMode === 'today' ? '#E50914' : 'transparent',
                color: viewMode === 'today' ? '#FFFFFF' : '#A1A1AA',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={14} /> Live Presence (Today)
            </button>
          </div>


        </div>
      </div>

      {/* Success Notification Toast */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        <div className="kpi-card" style={{ padding: '16px 20px' }}>
          <div className="kpi-label">Total Logged Records</div>
          <div className="kpi-value" style={{ color: '#F8FAFC' }}>
            {viewMode === 'master' ? (summary?.totalRecords || records.length) : (todayOverview?.total_employees || 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            {viewMode === 'master' ? 'Filtered universal entries' : 'Active workforce today'}
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px 20px' }}>
          <div className="kpi-label">Present (On-Time)</div>
          <div className="kpi-value" style={{ color: '#10B981' }}>
            {viewMode === 'master' ? (summary?.presentDays || 0) : (todayOverview?.present_count || 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981' }}>
            {viewMode === 'master' ? `${summary?.onTimeRate || 100}% on-time rate` : 'Logged in on time'}
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px 20px' }}>
          <div className="kpi-label">Late Arrivals</div>
          <div className="kpi-value" style={{ color: '#F59E0B' }}>
            {viewMode === 'master' ? (summary?.lateDays || 0) : (todayOverview?.late_count || 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#F59E0B' }}>After 15 min grace window</div>
        </div>

        <div className="kpi-card" style={{ padding: '16px 20px' }}>
          <div className="kpi-label">Absent / Pending</div>
          <div className="kpi-value" style={{ color: '#EF4444' }}>
            {viewMode === 'master' ? (summary?.absentDays || 0) : (todayOverview?.absent_count || 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#EF4444' }}>
            {viewMode === 'master' ? 'Absent or unapproved' : 'Not yet punched today'}
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px 20px' }}>
          <div className="kpi-label">Total Working Hours</div>
          <div className="kpi-value" style={{ color: '#8B5CF6' }}>
            {viewMode === 'master' ? `${summary?.totalHours || 0} hrs` : `${todayOverview?.total_hours || 0} hrs`}
          </div>
          <div style={{ fontSize: '11px', color: '#A78BFA' }}>
            {viewMode === 'master' ? `Avg ${summary?.avgHours || 0}h / shift` : 'Cumulative hours logged'}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR (MASTER VIEW) */}
      {viewMode === 'master' && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '14px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Row 1: Search, Role, Status, and Refresh */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee name or code..."
                style={{
                  width: '100%',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  padding: '9px 12px 9px 36px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Role Filter (Sales Executive, SMM, Video Editor) */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  padding: '9px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  padding: '9px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date Range Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid #262626', paddingTop: '12px' }}>
            {/* Quick Date Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#A1A1AA', marginRight: '4px', fontWeight: 600 }}>
                Date Range:
              </span>
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'month', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyDatePreset(p.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #2D2D2D',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: datePreset === p.id ? '#E50914' : '#141414',
                    color: datePreset === p.id ? '#FFFFFF' : '#A1A1AA',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '5px 10px',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              <span style={{ color: '#71717A', fontSize: '12px' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '5px 10px',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => applyDatePreset('all')}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE RECORDS TABLE */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2D2D2D',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #2D2D2D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#141414'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              {viewMode === 'master' ? 'Universal Attendance Log' : "Today's Live Presence Roster"}
            </h3>
            <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
              ({viewMode === 'master' ? `${records.length} records found` : `${todayOverview?.records?.length || 0} active employees`})
            </span>
          </div>

          <button
            onClick={viewMode === 'master' ? loadMasterRecords : loadTodayOverview}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Roster</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading workforce attendance records...</div>
          </div>
        ) : (viewMode === 'master' ? records : todayOverview?.records || []).length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No Attendance Records Found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search criteria, role filter, or date range.</div>
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Role</th>
                  <th>{viewMode === 'master' ? 'Date & Shift' : 'Scheduled Shift'}</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Hours Worked</th>
                  <th>Status</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {(viewMode === 'master' ? records : todayOverview?.records || []).map((r) => {
                  const status = viewMode === 'master' ? r.status : (r.attendance_status || 'ABSENT');
                  const statusConf = STATUS_BADGES[status] || STATUS_BADGES.ABSENT;

                  return (
                    <tr key={`${r.employee_id || r.id}-${r.date || 'today'}`}>
                      {/* Employee Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(229, 9, 20, 0.15)',
                              color: '#FF4D4D',
                              border: '1px solid rgba(229, 9, 20, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                              flexShrink: 0
                            }}
                          >
                            {r.first_name ? r.first_name[0] : 'E'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>
                              {r.first_name} {r.last_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA' }}>
                              {r.employee_code} • {r.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Role */}
                      <td>
                        <div style={{ fontSize: '13px', color: '#FFFFFF' }}>
                          {r.department_name || 'General'}
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#262626',
                            color: '#D4D4D8',
                            border: '1px solid #333333',
                            display: 'inline-block',
                            marginTop: '2px'
                          }}
                        >
                          {r.employee_type || r.role_display || r.role_name}
                        </span>
                      </td>

                      {/* Date & Shift */}
                      <td>
                        {viewMode === 'master' ? (
                          <>
                            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{r.date}</div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA' }}>
                              {r.shift_start || '09:30'} - {r.shift_end || '18:30'}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '12.5px', color: '#A1A1AA' }}>
                            {r.shift_start || '09:30'} - {r.shift_end || '18:30'}
                          </div>
                        )}
                      </td>

                      {/* Check-In */}
                      <td>
                        <span style={{ fontWeight: 700, color: r.check_in_time ? '#FFFFFF' : '#71717A' }}>
                          {r.check_in_time || '--:--'}
                        </span>
                      </td>

                      {/* Check-Out */}
                      <td>
                        <span style={{ fontWeight: 700, color: r.check_out_time ? '#FFFFFF' : '#71717A' }}>
                          {r.check_out_time || '--:--'}
                        </span>
                      </td>

                      {/* Hours Worked */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#FF4D4D' }}>
                          {r.total_working_hours ? `${r.total_working_hours} hrs` : '--'}
                        </span>
                      </td>

                      {/* Attendance Status */}
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: statusConf.bg,
                            color: statusConf.text,
                            border: `1px solid ${statusConf.border}`
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Audit Details */}
                      <td>
                        {r.is_manual_adjusted ? (
                          <div style={{ fontSize: '11.5px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Info size={13} />
                            <span>
                              Adjusted: {r.adjustment_reason || 'Admin override'}
                              {r.approved_by_name ? ` (by @${r.approved_by_name})` : ''}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#71717A' }}>Self-logged system record</span>
                        )}
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
