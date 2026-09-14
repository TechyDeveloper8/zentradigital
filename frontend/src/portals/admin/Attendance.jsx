import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Clock, CheckCircle2, AlertTriangle, XCircle, Edit3, Shield,
  Calendar, Search, Filter
} from 'lucide-react';

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [adjustment, setAdjustment] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    check_in_time: '09:30',
    check_out_time: '18:30',
    total_working_hours: 8,
    adjustment_reason: ''
  });

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const loadTodayAttendance = () => {
    setLoading(true);
    api.get('/attendance/today')
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenAdjust = (rec) => {
    setSelectedRecord(rec);
    setAdjustment({
      employee_id: rec.id,
      date: data?.date || new Date().toISOString().split('T')[0],
      status: rec.attendance_status || 'PRESENT',
      check_in_time: rec.check_in_time || '09:30',
      check_out_time: rec.check_out_time || '18:30',
      total_working_hours: rec.total_working_hours || 8,
      adjustment_reason: ''
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustment.adjustment_reason.trim()) {
      alert('Adjustment reason is strictly mandatory for audit compliance.');
      return;
    }

    try {
      await api.post('/attendance/adjust', adjustment);
      setShowAdjustModal(false);
      loadTodayAttendance();
    } catch (err) {
      alert(err.message || 'Failed to adjust attendance');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Workforce Attendance Hub
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Live presence monitoring for {data?.date || 'Today'}, check-in timestamps, and audited manual adjustments.
          </p>
        </div>

        <button onClick={loadTodayAttendance} className="btn btn-secondary">
          Refresh Live Status
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Active Staff</div>
          <div className="kpi-value">{data?.total_employees || 0}</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Scheduled to work today</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Present Today</div>
          <div className="kpi-value" style={{ color: '#10B981' }}>{data?.present_count || 0}</div>
          <div style={{ fontSize: '11px', color: '#10B981' }}>Checked in</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Late Arrivals</div>
          <div className="kpi-value" style={{ color: '#F59E0B' }}>{data?.late_count || 0}</div>
          <div style={{ fontSize: '11px', color: '#F59E0B' }}>After grace period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Absent / Pending</div>
          <div className="kpi-value" style={{ color: '#EF4444' }}>{data?.absent_count || 0}</div>
          <div style={{ fontSize: '11px', color: '#EF4444' }}>Not yet checked in</div>
        </div>
      </div>

      {/* Attendance Grid */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading attendance records...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift Window</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Hours Worked</th>
                <th>Status</th>
                <th>Audit / Adjust</th>
              </tr>
            </thead>
            <tbody>
              {data?.records?.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.employee_code} • {r.designation}</div>
                  </td>
                  <td>{r.department_name || 'General'}</td>
                  <td style={{ fontSize: '12px', color: '#9CA3AF' }}>{r.shift_start} - {r.shift_end}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: r.check_in_time ? '#F9FAFB' : '#6B7280' }}>
                      {r.check_in_time || '--:--'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: r.check_out_time ? '#F9FAFB' : '#6B7280' }}>
                      {r.check_out_time || '--:--'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>
                      {r.total_working_hours ? `${r.total_working_hours} hrs` : '--'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      r.attendance_status === 'PRESENT' ? 'green' :
                      (r.attendance_status === 'LATE' ? 'yellow' :
                      (r.attendance_status === 'HALF DAY' ? 'purple' : 'red'))
                    }`}>
                      {r.attendance_status || 'ABSENT'}
                    </span>
                    {r.is_manual_adjusted ? (
                      <div style={{ fontSize: '10px', color: '#F59E0B', marginTop: '2px' }}>
                        * Adjusted: {r.adjustment_reason}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenAdjust(r)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      <Edit3 size={13} /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Attendance Adjustment Modal (Section 26) */}
      {showAdjustModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Adjust Attendance: {selectedRecord.first_name} {selectedRecord.last_name}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '12px', color: '#FBBF24' }}>
                  Audited action: All manual modifications are logged with your user signature and timestamp.
                </div>

                <div className="form-group">
                  <label className="form-label">Attendance Status *</label>
                  <select
                    className="form-control"
                    value={adjustment.status}
                    onChange={e => setAdjustment({ ...adjustment, status: e.target.value })}
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="HALF DAY">HALF DAY</option>
                    <option value="LEAVE">LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Check-In Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={adjustment.check_in_time}
                      onChange={e => setAdjustment({ ...adjustment, check_in_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-Out Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={adjustment.check_out_time}
                      onChange={e => setAdjustment({ ...adjustment, check_out_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    value={adjustment.total_working_hours}
                    onChange={e => setAdjustment({ ...adjustment, total_working_hours: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Adjustment Reason *</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    placeholder="e.g. Employee was on client on-site visit during morning session..."
                    value={adjustment.adjustment_reason}
                    onChange={e => setAdjustment({ ...adjustment, adjustment_reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Audited Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
