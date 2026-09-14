import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  TrendingUp, CheckSquare, Calendar, Clock, Award,
  AlertCircle, FileText, ArrowRight, UserCheck, CheckCircle2
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user, employee, attendance, refreshAttendance } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/tasks'),
      api.get('/content-calendar'),
      api.get('/leads')
    ]).then(([tsks, cnt, lds]) => {
      setTasks(tsks || []);
      setContent(cnt || []);
      setLeads(lds.leads || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in');
      await refreshAttendance();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out');
      await refreshAttendance();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };

  const role = user?.role_name;

  return (
    <div>
      {/* Header & Attendance Action Banner */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Welcome back, {employee ? `${employee.first_name} ${employee.last_name}` : user?.username}!
            </h1>
            <span className="status-badge blue">{user?.role_display || user?.role_name}</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: '4px 0 0' }}>
            {employee?.designation} • Shift: {employee?.shift_start || '09:30'} - {employee?.shift_end || '18:30'}
          </p>
        </div>

        {/* Live Attendance Widget (Section 26) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {attendance?.check_in_time && !attendance?.check_out_time ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>● Session Active</div>
                <div style={{ fontSize: '12.5px', color: '#D1D5DB' }}>Checked in at {attendance.check_in_time}</div>
              </div>
              <button onClick={handleCheckOut} className="btn btn-secondary" style={{ borderColor: '#EF4444', color: '#F87171' }}>
                Check Out
              </button>
            </div>
          ) : attendance?.check_out_time ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <div style={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                Shift Completed ({attendance.total_working_hours} hours)
              </div>
            </div>
          ) : (
            <button onClick={handleCheckIn} className="btn btn-success" style={{ padding: '10px 20px', fontSize: '14px' }}>
              <Clock size={16} /> Check In Today
            </button>
          )}

          <button onClick={() => navigate('/employee/daily-report')} className="btn btn-primary">
            <FileText size={16} /> Submit Daily Report
          </button>
        </div>
      </div>

      {/* Role-Adaptive KPI Cards (Section 27) */}
      <div className="kpi-grid">
        {role === 'sales' ? (
          <>
            <div className="kpi-card" onClick={() => navigate('/admin/leads')}>
              <div className="kpi-label">Active Leads</div>
              <div className="kpi-value">{leads.length}</div>
              <div style={{ fontSize: '11px', color: '#60A5FA' }}>Inquiries assigned to you</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Won Conversions</div>
              <div className="kpi-value" style={{ color: '#10B981' }}>
                {leads.filter(l => l.status === 'WON').length}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>Converted to active clients</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Follow-ups Scheduled</div>
              <div className="kpi-value" style={{ color: '#F59E0B' }}>
                {leads.filter(l => l.status === 'CONTACTED' || l.status === 'MEETING').length}
              </div>
              <div style={{ fontSize: '11px', color: '#F59E0B' }}>Calls & meetings</div>
            </div>
          </>
        ) : role === 'editor' ? (
          <>
            <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
              <div className="kpi-label">Creatives & Tasks Assigned</div>
              <div className="kpi-value">{tasks.filter(t => t.status !== 'COMPLETED').length}</div>
              <div style={{ fontSize: '11px', color: '#60A5FA' }}>Pending in your queue</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Revisions Requested</div>
              <div className="kpi-value" style={{ color: '#EF4444' }}>
                {tasks.filter(t => t.status === 'REVISION').length + content.filter(c => c.workflow_stage === 'REVISION').length}
              </div>
              <div style={{ fontSize: '11px', color: '#EF4444' }}>Requires Version update</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Tasks Completed</div>
              <div className="kpi-value" style={{ color: '#10B981' }}>
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>Delivered to production</div>
            </div>
          </>
        ) : (
          /* Marketing Manager view */
          <>
            <div className="kpi-card" onClick={() => navigate('/employee/tasks')}>
              <div className="kpi-label">Operational Tasks</div>
              <div className="kpi-value">{tasks.filter(t => t.status !== 'COMPLETED').length}</div>
              <div style={{ fontSize: '11px', color: '#60A5FA' }}>Active deliverables</div>
            </div>
            <div className="kpi-card" onClick={() => navigate('/employee/calendar')}>
              <div className="kpi-label">Scheduled Content</div>
              <div className="kpi-value" style={{ color: '#10B981' }}>
                {content.filter(c => c.workflow_stage === 'APPROVED' || c.workflow_stage === 'SCHEDULED').length}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>Approved for release</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Pending Reviews</div>
              <div className="kpi-value" style={{ color: '#F59E0B' }}>
                {content.filter(c => c.workflow_stage === 'INTERNAL_REVIEW' || c.workflow_stage === 'CLIENT_REVIEW').length}
              </div>
              <div style={{ fontSize: '11px', color: '#F59E0B' }}>Awaiting approvals</div>
            </div>
          </>
        )}
      </div>

      {/* Active Tasks Table */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#F9FAFB' }}>My Active Tasks</h3>
          <button onClick={() => navigate('/employee/tasks')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
            View Full Board →
          </button>
        </div>

        {tasks.filter(t => t.status !== 'COMPLETED').length === 0 ? (
          <div className="table-container empty-state" style={{ padding: '30px' }}>
            <CheckCircle2 size={32} color="#10B981" style={{ marginBottom: '8px' }} />
            <p>You have no pending tasks in your queue.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Code & Title</th>
                  <th>Client</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#60A5FA', fontSize: '12px' }}>{t.task_code}</div>
                      <div style={{ fontWeight: 600 }}>{t.task_title}</div>
                    </td>
                    <td>{t.company_name}</td>
                    <td>{t.due_date}</td>
                    <td>
                      <span className={`status-badge ${t.priority === 'URGENT' ? 'red' : 'yellow'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === 'IN PROGRESS' ? 'blue' : 'purple'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
