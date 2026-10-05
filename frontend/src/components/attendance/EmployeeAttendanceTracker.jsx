import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  Clock, CheckCircle2, AlertCircle, Calendar, Shield,
  RefreshCw, LogIn, LogOut, ArrowRight, Timer, Sun, Moon,
  AlertTriangle, Filter, ChevronRight, Info
} from 'lucide-react';

const STATUS_CONFIG = {
  PRESENT: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    text: '#34D399',
    label: 'Present (On-Time)'
  },
  LATE: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    text: '#FBBF24',
    label: 'Late Arrival'
  },
  'HALF DAY': {
    bg: 'rgba(229, 9, 20, 0.15)',
    border: 'rgba(229, 9, 20, 0.35)',
    text: '#FF4D4D',
    label: 'Half Day'
  },
  ABSENT: {
    bg: 'rgba(229, 9, 20, 0.2)',
    border: 'rgba(229, 9, 20, 0.5)',
    text: '#FF4D4D',
    label: 'Absent'
  },
  LEAVE: {
    bg: 'rgba(161, 161, 170, 0.15)',
    border: 'rgba(161, 161, 170, 0.35)',
    text: '#D4D4D8',
    label: 'Approved Leave'
  }
};

export default function EmployeeAttendanceTracker({ title = 'My Attendance & Shift Logger' }) {
  const { user, employee, attendance: authAttendance, refreshAttendance } = useAuth();

  const [todayData, setTodayData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Filters for individual history
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Live timer for current time and active work session
  const [currentTime, setCurrentTime] = useState(new Date());

  const { isConnected, lastAttendanceEvent } = useSocket();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // REAL-TIME WEBSOCKET ATTENDANCE LISTENER
  useEffect(() => {
    if (!lastAttendanceEvent) return;
    loadData();
    if (refreshAttendance) refreshAttendance();
  }, [lastAttendanceEvent]);

  // Fetch individual attendance data
  const loadData = async () => {
    setLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/my-today'),
        api.get('/attendance/my-history', {
          month: selectedMonth || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined
        })
      ]);

      setTodayData(todayRes);
      setHistoryRecords(historyRes?.records || []);
      setSummary(historyRes?.summary || null);
    } catch (err) {
      console.error('Failed to load employee attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedStatus]);

  // Personal Check-In
  const handleCheckIn = async () => {
    setPunchLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/check-in');
      setActionMessage({
        type: 'success',
        text: `Checked in successfully at ${res.record?.check_in_time || 'now'} (${res.record?.status})`
      });
      await refreshAttendance();
      await loadData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to check in. Please try again.'
      });
    } finally {
      setPunchLoading(false);
    }
  };

  // Personal Check-Out
  const handleCheckOut = async () => {
    if (!window.confirm('Are you ready to check out and complete your shift for today?')) {
      return;
    }

    setPunchLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.post('/attendance/check-out');
      setActionMessage({
        type: 'success',
        text: `Checked out successfully! Total working hours: ${res.record?.total_working_hours} hrs.`
      });
      await refreshAttendance();
      await loadData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to check out. Please try again.'
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const todayRecord = todayData?.record || authAttendance;
  const isCheckedIn = Boolean(todayRecord?.check_in_time);
  const isCheckedOut = Boolean(todayRecord?.check_out_time);

  // Calculate live elapsed time if checked in but not checked out
  const getElapsedDuration = () => {
    if (!isCheckedIn || isCheckedOut || !todayRecord?.check_in_time) return null;
    const [inH, inM] = todayRecord.check_in_time.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, 0, 0);
    const diffMs = Math.max(0, currentTime - inDate);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const formattedToday = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #141414 100%)',
          borderRadius: '16px',
          border: '1px solid #2D2D2D',
          borderLeft: '4px solid #E50914',
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
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
            <Clock size={24} />
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
                Employee Portal • Attendance Logger
              </span>
              <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
                Strict Isolated View
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>
              {title}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#FFFFFF',
              fontWeight: 600
            }}
          >
            <Timer size={16} color="#E50914" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage.text && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: actionMessage.type === 'success' ? '#34D399' : '#F87171'
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: PERSONAL ATTENDANCE MARKING (LIVE PRESENCE CARD) */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '16px',
          border: '1px solid #2D2D2D',
          padding: '24px 28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daily Presence Status • {formattedToday}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Scheduled Shift: {todayData?.shift_start || '09:30'} - {todayData?.shift_end || '18:30'}
              </h2>
              {todayRecord?.status && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: STATUS_CONFIG[todayRecord.status]?.bg || 'rgba(229, 9, 20, 0.15)',
                    color: STATUS_CONFIG[todayRecord.status]?.text || '#FF4D4D',
                    border: `1px solid ${STATUS_CONFIG[todayRecord.status]?.border || 'rgba(229, 9, 20, 0.3)'}`
                  }}
                >
                  {STATUS_CONFIG[todayRecord.status]?.label || todayRecord.status}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: isCheckedOut
                ? 'rgba(16, 185, 129, 0.12)'
                : isCheckedIn
                ? 'rgba(229, 9, 20, 0.15)'
                : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${
                isCheckedOut
                  ? 'rgba(16, 185, 129, 0.3)'
                  : isCheckedIn
                  ? 'rgba(229, 9, 20, 0.4)'
                  : 'rgba(245, 158, 11, 0.3)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isCheckedOut ? '#10B981' : isCheckedIn ? '#E50914' : '#F59E0B',
                boxShadow: isCheckedIn && !isCheckedOut ? '0 0 10px #E50914' : 'none'
              }}
            />
            <div>
              <div style={{ fontSize: '11px', color: '#A1A1AA', textTransform: 'uppercase', fontWeight: 600 }}>
                Current State
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                {isCheckedOut
                  ? 'Shift Completed'
                  : isCheckedIn
                  ? 'Actively Checked In'
                  : 'Not Checked In Today'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          {/* Check-In Time */}
          <div
            style={{
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A1A1AA', fontSize: '12px', marginBottom: '8px' }}>
              <LogIn size={15} color="#34D399" />
              <span>Check-In Timestamp</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: todayRecord?.check_in_time ? '#34D399' : '#71717A' }}>
              {todayRecord?.check_in_time || '--:--'}
            </div>
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
              {todayRecord?.check_in_time ? (todayRecord.status === 'LATE' ? 'Late arrival logged' : 'On-time arrival') : 'Grace period: 15 mins'}
            </div>
          </div>

          {/* Check-Out Time */}
          <div
            style={{
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A1A1AA', fontSize: '12px', marginBottom: '8px' }}>
              <LogOut size={15} color="#E50914" />
              <span>Check-Out Timestamp</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: todayRecord?.check_out_time ? '#E50914' : '#71717A' }}>
              {todayRecord?.check_out_time || '--:--'}
            </div>
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
              {todayRecord?.check_out_time ? 'Recorded on check out' : (isCheckedIn ? 'Pending shift completion' : 'Awaiting check-in')}
            </div>
          </div>

          {/* Total / Active Working Hours */}
          <div
            style={{
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A1A1AA', fontSize: '12px', marginBottom: '8px' }}>
              <Timer size={15} color="#FF4D4D" />
              <span>{isCheckedOut ? 'Total Shift Hours' : 'Active Work Duration'}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
              {isCheckedOut
                ? `${todayRecord?.total_working_hours || 0} hrs`
                : isCheckedIn
                ? (getElapsedDuration() || 'Active')
                : '0.0 hrs'}
            </div>
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
              {isCheckedOut ? 'Logged for payroll' : (isCheckedIn ? 'Live tracking in session' : 'Standard 8.0h shift')}
            </div>
          </div>
        </div>

        {/* Attendance Action Button Area */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={punchLoading}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: '#E50914',
                borderColor: '#E50914',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
                cursor: 'pointer'
              }}
            >
              <LogIn size={18} />
              <span>{punchLoading ? 'Recording Check-In...' : 'Check-In for Today'}</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={punchLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: '#DC2626',
                borderColor: '#B91C1C',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <LogOut size={18} />
              <span>{punchLoading ? 'Recording Check-Out...' : 'Check-Out & End Shift'}</span>
            </button>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                fontWeight: 700,
                fontSize: '13.5px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>Today's Shift Completed ({todayRecord?.total_working_hours} Hours Logged)</span>
            </div>
          )}

          {todayRecord?.is_manual_adjusted ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#FBBF24',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <Info size={14} />
              <span>Admin Adjustment Applied: {todayRecord.adjustment_reason}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* SECTION 2: INDIVIDUAL ATTENDANCE HISTORY (STRICT ISOLATION) */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '16px',
          border: '1px solid #2D2D2D',
          padding: '24px 28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Section Header & Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
              My Attendance History
            </h3>
            <p style={{ fontSize: '13px', color: '#A1A1AA', margin: 0 }}>
              Viewing personal attendance logs strictly for {employee ? `${employee.first_name} ${employee.last_name}` : user?.username} ({employee?.employee_code || 'Self'}).
            </p>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                backgroundColor: '#141414',
                border: '1px solid #2D2D2D',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '8px 12px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present (On-Time)</option>
              <option value="LATE">Late Arrival</option>
              <option value="HALF DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>

            {/* Month Filter */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                backgroundColor: '#141414',
                border: '1px solid #2D2D2D',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '7px 12px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />

            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                Clear Month
              </button>
            )}
          </div>
        </div>

        {/* Summary Statistics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ backgroundColor: '#141414', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2D2D2D' }}>
            <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>Total Days Logged</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
              {summary?.totalRecords || historyRecords.length}
            </div>
          </div>
          <div style={{ backgroundColor: '#141414', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2D2D2D' }}>
            <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, textTransform: 'uppercase' }}>Present Days</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>
              {summary?.presentDays || 0}
            </div>
          </div>
          <div style={{ backgroundColor: '#141414', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2D2D2D' }}>
            <div style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 600, textTransform: 'uppercase' }}>Late Arrivals</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FBBF24', marginTop: '2px' }}>
              {summary?.lateDays || 0}
            </div>
          </div>
          <div style={{ backgroundColor: '#141414', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2D2D2D' }}>
            <div style={{ fontSize: '11px', color: '#FF4D4D', fontWeight: 600, textTransform: 'uppercase' }}>Total Hours Worked</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FF4D4D', marginTop: '2px' }}>
              {summary?.totalHours || 0} hrs
            </div>
          </div>
          <div style={{ backgroundColor: '#141414', padding: '12px 16px', borderRadius: '10px', border: '1px solid #2D2D2D' }}>
            <div style={{ fontSize: '11px', color: '#D4D4D8', fontWeight: 600, textTransform: 'uppercase' }}>Average Hours / Shift</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
              {summary?.avgHours || 0}h
            </div>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#A1A1AA' }}>
            Loading your attendance history...
          </div>
        ) : historyRecords.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#141414',
              borderRadius: '12px',
              border: '1px dashed #2D2D2D',
              color: '#A1A1AA'
            }}
          >
            <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#E50914' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>No Attendance Records Found</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
              No attendance logs match your selected filter criteria.
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Total Working Hours</th>
                  <th>Attendance Status</th>
                  <th>Notes / Audited Adjustments</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((r) => {
                  const statusConf = STATUS_CONFIG[r.status] || STATUS_CONFIG.PRESENT;
                  const dateObj = new Date(r.date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{formattedDate}</div>
                        <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{r.date}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: r.check_in_time ? '#FFFFFF' : '#71717A' }}>
                          {r.check_in_time || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: r.check_out_time ? '#FFFFFF' : '#71717A' }}>
                          {r.check_out_time || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#FF4D4D' }}>
                          {r.total_working_hours ? `${r.total_working_hours} hrs` : '--'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: statusConf.bg,
                            color: statusConf.text,
                            border: `1px solid ${statusConf.border}`
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td>
                        {r.is_manual_adjusted ? (
                          <div style={{ fontSize: '11.5px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Info size={13} />
                            <span>Admin Adjusted: {r.adjustment_reason || 'Verified'}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#71717A' }}>Standard self-log</span>
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
