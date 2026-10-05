import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import {
  CheckSquare, FileText, Plus, Calendar, Clock, Phone,
  CheckCircle2, AlertCircle, Trash2, Edit2, ChevronRight,
  TrendingUp, Award, Layers, AlertTriangle, ArrowRight, RefreshCw,
  Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const TASK_PRIORITIES = {
  URGENT: { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.2)', text: '#FB923C' },
  MEDIUM: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' },
  LOW: { bg: 'rgba(100, 116, 139, 0.2)', text: '#94A3B8' }
};

export default function SalesTasksDSRModule({
  tasks = [],
  leadsList = [],
  loading = false,
  onRefresh,
  onAddTask,
  onEditTask
}) {
  const [subTab, setSubTab] = useState('DSR'); // 'DSR' | 'TASKS'

  // DSR States
  const [dsrLoading, setDsrLoading] = useState(false);
  const [dsrSubmitting, setDsrSubmitting] = useState(false);
  const [dsrSuccess, setDsrSuccess] = useState('');
  const [dsrError, setDsrError] = useState('');
  const [pastReports, setPastReports] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [expandedReportId, setExpandedReportId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [dsrForm, setDsrForm] = useState({
    report_date: todayStr,
    total_hours: 0,
    calls_made: 0,
    meetings_done: 0,
    proposals_sent: 0,
    deals_closed: 0,
    remarks: '',
    challenges: '',
    tomorrows_plan: '',
    entries: [
      { work_category: 'Sales Outreach', work_description: '', hours_worked: 1 }
    ]
  });

  // Task Filter States
  const [taskFilterTab, setTaskFilterTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED'
  const [taskLoadingId, setTaskLoadingId] = useState(null);

  // Load existing DSR report & real-time live production metrics
  const loadDSRData = async (targetDate = null) => {
    setDsrLoading(true);
    const dateToQuery = targetDate || dsrForm.report_date || todayStr;
    try {
      const todayRes = await api.get(`/daily-reports/my-today?date=${dateToQuery}`).catch(() => null);
      if (todayRes) {
        setLiveMetrics(todayRes.liveMetrics || null);
        if (todayRes.report) {
          setExistingReport(todayRes.report);
          setDsrForm({
            report_date: todayRes.report.report_date,
            total_hours: Number(todayRes.report.total_hours) || 0,
            calls_made: todayRes.report.calls_made !== undefined ? Number(todayRes.report.calls_made) : (todayRes.liveMetrics?.callsMade || 0),
            meetings_done: todayRes.report.meetings_done !== undefined ? Number(todayRes.report.meetings_done) : (todayRes.liveMetrics?.meetingsDone || 0),
            proposals_sent: todayRes.report.proposals_sent !== undefined ? Number(todayRes.report.proposals_sent) : (todayRes.liveMetrics?.proposalsSent || 0),
            deals_closed: todayRes.report.deals_closed !== undefined ? Number(todayRes.report.deals_closed) : (todayRes.liveMetrics?.dealsClosed || 0),
            remarks: todayRes.report.remarks || todayRes.report.summary || '',
            challenges: todayRes.report.challenges || '',
            tomorrows_plan: todayRes.report.tomorrows_plan || todayRes.report.plan_for_tomorrow || '',
            entries: (todayRes.entries && todayRes.entries.length > 0)
              ? todayRes.entries.map(e => ({
                  work_category: e.work_category || 'Sales Activity',
                  work_description: e.work_description || '',
                  hours_worked: Number(e.hours_worked) || 1
                }))
              : [
                  { work_category: 'Sales Outreach', work_description: '', hours_worked: 1 }
                ]
          });
        } else {
          // No report yet for this date: auto-populate from real-time database activity metrics
          setExistingReport(null);
          const live = todayRes.liveMetrics || {};
          let initialEntries = [
            { work_category: 'Sales Outreach', work_description: '', hours_worked: 1 }
          ];

          if (live.completedTasks && live.completedTasks.length > 0) {
            initialEntries = live.completedTasks.map(t => ({
              work_category: t.type === 'SALES_TASK' ? 'Sales Deliverable' : 'Operational Deliverable',
              work_description: `${t.title}${t.lead_name ? ` (Lead: ${t.lead_name})` : ''}`,
              hours_worked: 1
            }));
          }

          setDsrForm({
            report_date: dateToQuery,
            total_hours: live.loggedHours || 0,
            calls_made: live.callsMade || 0,
            meetings_done: live.meetingsDone || 0,
            proposals_sent: live.proposalsSent || 0,
            deals_closed: live.dealsClosed || 0,
            remarks: '',
            challenges: '',
            tomorrows_plan: '',
            entries: initialEntries
          });
        }
      }

      const allRes = await api.get('/daily-reports').catch(() => []);
      if (Array.isArray(allRes)) {
        setPastReports(allRes);
      }
    } catch (err) {
      console.error('Failed to load DSR data:', err);
    } finally {
      setDsrLoading(false);
    }
  };

  useEffect(() => {
    loadDSRData();
  }, []);

  // Quick live sync with today's real database activity
  const handleSyncLiveMetrics = () => {
    if (!liveMetrics) return;
    setDsrForm(prev => ({
      ...prev,
      calls_made: liveMetrics.callsMade || 0,
      meetings_done: liveMetrics.meetingsDone || 0,
      proposals_sent: liveMetrics.proposalsSent || 0,
      deals_closed: liveMetrics.dealsClosed || 0,
      total_hours: liveMetrics.loggedHours || prev.total_hours
    }));
    setDsrSuccess('Counters synchronized with live production activity for today.');
    setTimeout(() => setDsrSuccess(''), 4000);
  };

  // Import completed tasks from today
  const handleImportCompletedTasks = () => {
    if (!liveMetrics?.completedTasks || liveMetrics.completedTasks.length === 0) {
      alert('No completed tasks found for today in the system.');
      return;
    }
    const newItems = liveMetrics.completedTasks.map(t => ({
      work_category: t.type === 'SALES_TASK' ? 'Sales Deliverable' : 'Operational Deliverable',
      work_description: `${t.title}${t.lead_name ? ` (Lead: ${t.lead_name})` : ''}`,
      hours_worked: 1
    }));
    setDsrForm(prev => ({
      ...prev,
      entries: [...prev.entries.filter(e => e.work_description.trim() !== ''), ...newItems]
    }));
  };

  // Delete past report
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this Daily Sales Report?')) return;
    try {
      await api.delete(`/daily-reports/${reportId}`);
      setDsrSuccess('Daily Sales Report deleted.');
      setTimeout(() => setDsrSuccess(''), 3000);
      loadDSRData(dsrForm.report_date);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete report');
    }
  };

  // Submit DSR
  const handleDsrSubmit = async (e) => {
    e.preventDefault();
    setDsrSubmitting(true);
    setDsrSuccess('');
    setDsrError('');

    try {
      const validEntries = dsrForm.entries.filter(e => e.work_description.trim() !== '');
      if (validEntries.length === 0) {
        throw new Error('Please enter at least one deliverable description in the work breakdown.');
      }

      const payload = {
        report_date: dsrForm.report_date,
        total_hours: Number(dsrForm.total_hours) || 0,
        calls_made: Number(dsrForm.calls_made) || 0,
        meetings_done: Number(dsrForm.meetings_done) || 0,
        proposals_sent: Number(dsrForm.proposals_sent) || 0,
        deals_closed: Number(dsrForm.deals_closed) || 0,
        remarks: dsrForm.remarks.trim(),
        challenges: dsrForm.challenges.trim(),
        tomorrows_plan: dsrForm.tomorrows_plan.trim(),
        entries: validEntries.map(item => ({
          work_category: item.work_category || 'Sales Outreach',
          work_description: item.work_description.trim(),
          hours_worked: Number(item.hours_worked) || 1
        }))
      };

      await api.post('/daily-reports', payload);
      setDsrSuccess('✓ Daily Sales Report (DSR) submitted and synchronized live in real-time!');
      loadDSRData(dsrForm.report_date);
      if (onRefresh) onRefresh();
    } catch (err) {
      setDsrError(err.message || 'Failed to submit Daily Sales Report.');
    } finally {
      setDsrSubmitting(false);
    }
  };

  // Add work breakdown entry
  const handleAddEntry = () => {
    setDsrForm({
      ...dsrForm,
      entries: [
        ...dsrForm.entries,
        { work_category: 'Sales Follow-up', work_description: '', hours_worked: 1 }
      ]
    });
  };

  // Remove work entry
  const handleRemoveEntry = (idx) => {
    setDsrForm({
      ...dsrForm,
      entries: dsrForm.entries.filter((_, i) => i !== idx)
    });
  };

  // Update entry
  const handleUpdateEntry = (idx, field, val) => {
    const updated = [...dsrForm.entries];
    updated[idx][field] = val;
    setDsrForm({ ...dsrForm, entries: updated });
  };

  // Quick Task status toggle
  const handleToggleTaskStatus = async (task) => {
    setTaskLoadingId(task.id);
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await api.put(`/sales/tasks/${task.id}`, { status: newStatus });
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    } finally {
      setTaskLoadingId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales task?')) return;
    try {
      await api.delete(`/sales/tasks/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilterTab === 'TODAY') {
      return t.due_date === todayStr && t.status !== 'COMPLETED';
    } else if (taskFilterTab === 'OVERDUE') {
      return t.due_date < todayStr && t.status !== 'COMPLETED';
    } else if (taskFilterTab === 'UPCOMING') {
      return t.due_date > todayStr && t.status !== 'COMPLETED';
    } else if (taskFilterTab === 'COMPLETED') {
      return t.status === 'COMPLETED';
    }
    return true; // 'ALL'
  });

  const todayTasksCount = tasks.filter(t => t.due_date === todayStr && t.status !== 'COMPLETED').length;
  const overdueTasksCount = tasks.filter(t => t.due_date < todayStr && t.status !== 'COMPLETED').length;
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-navigation tabs: DSR vs Sales Tasks */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #1F2937',
          paddingBottom: '14px'
        }}
      >
        <button
          onClick={() => setSubTab('DSR')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: subTab === 'DSR' ? 800 : 600,
            border: subTab === 'DSR' ? '1px solid #3B82F6' : '1px solid transparent',
            backgroundColor: subTab === 'DSR' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: subTab === 'DSR' ? '#60A5FA' : '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={17} />
          <span>Daily Sales Report (DSR)</span>
        </button>

        <button
          onClick={() => setSubTab('TASKS')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: subTab === 'TASKS' ? 800 : 600,
            border: subTab === 'TASKS' ? '1px solid #8B5CF6' : '1px solid transparent',
            backgroundColor: subTab === 'TASKS' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: subTab === 'TASKS' ? '#C084FC' : '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckSquare size={17} />
          <span>Manage Daily Tasks ({tasks.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DAILY SALES REPORT (DSR) */}
      {/* ========================================================================= */}
      {subTab === 'DSR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Form Card */}
          <div
            style={{
              backgroundColor: '#111827',
              borderRadius: '14px',
              border: '1px solid #1F2937',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#60A5FA', fontWeight: 700 }}>
                  Sales Executive Compliance
                </span>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#F8FAFC', margin: '2px 0 0' }}>
                  Daily Sales Report Submission
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Reporting Date:</span>
                <input
                  type="date"
                  value={dsrForm.report_date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDsrForm(prev => ({ ...prev, report_date: newDate }));
                    loadDSRData(newDate);
                  }}
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Live Real-time Activity Sync Banner */}
            <div
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 10px #10B981'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#F59E0B" /> Real-time Activity Sync:
                </span>
                <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                  {liveMetrics
                    ? `${liveMetrics.callsMade} Calls • ${liveMetrics.meetingsDone} Meetings • ${liveMetrics.proposalsSent} Quotes • ${liveMetrics.dealsClosed} Won Deals • ${liveMetrics.loggedHours} Attendance Hrs`
                    : 'Syncing live production metrics...'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSyncLiveMetrics}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #3B82F6',
                    borderRadius: '6px',
                    color: '#60A5FA',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Sync form numbers with today's live activity in database"
                >
                  <RefreshCw size={12} className={dsrLoading ? 'spin' : ''} />
                  <span>Sync Live Numbers</span>
                </button>

                {liveMetrics?.completedTasks?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportCompletedTasks}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '6px',
                      color: '#34D399',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Import completed tasks from today as deliverables"
                  >
                    <Plus size={12} />
                    <span>Import {liveMetrics.completedTasks.length} Completed Tasks</span>
                  </button>
                )}
              </div>
            </div>

            {existingReport && (
              <div
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: '#93C5FD',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#60A5FA" />
                  <span>
                    Report registered for <strong>{dsrForm.report_date}</strong> (Status: <strong>{existingReport.status}</strong>). You can update entries and re-save.
                  </span>
                </div>
                {existingReport.reviewer_name && (
                  <span style={{ fontSize: '11.5px', color: '#34D399' }}>
                    Reviewed by {existingReport.reviewer_name}
                  </span>
                )}
              </div>
            )}

            {dsrSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#34D399',
                  fontSize: '13.5px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{dsrSuccess}</span>
              </div>
            )}

            {dsrError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#F87171',
                  fontSize: '13.5px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{dsrError}</span>
              </div>
            )}

            <form onSubmit={handleDsrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Daily KPI Metrics Counters */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#E2E8F0', marginBottom: '10px' }}>
                  Daily Activity Numbers (DSR Key Metrics)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Calls Made</span>
                    <input
                      type="number"
                      min="0"
                      value={dsrForm.calls_made}
                      onChange={(e) => setDsrForm({ ...dsrForm, calls_made: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#60A5FA', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Meetings Done</span>
                    <input
                      type="number"
                      min="0"
                      value={dsrForm.meetings_done}
                      onChange={(e) => setDsrForm({ ...dsrForm, meetings_done: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#FBBF24', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Quotes / Proposals</span>
                    <input
                      type="number"
                      min="0"
                      value={dsrForm.proposals_sent}
                      onChange={(e) => setDsrForm({ ...dsrForm, proposals_sent: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#C084FC', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Deals Closed</span>
                    <input
                      type="number"
                      min="0"
                      value={dsrForm.deals_closed}
                      onChange={(e) => setDsrForm({ ...dsrForm, deals_closed: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#34D399', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#1E293B', padding: '12px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Total Hours Logged</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={dsrForm.total_hours}
                      onChange={(e) => setDsrForm({ ...dsrForm, total_hours: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F8FAFC', fontSize: '20px', fontWeight: 800, marginTop: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Work Breakdown Deliverables */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0' }}>
                    Work Breakdown & Deliverables
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#60A5FA',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dsrForm.entries.map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 100px 40px',
                        gap: '10px',
                        alignItems: 'center',
                        backgroundColor: '#1E293B',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #334155'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Category (e.g. Cold Calling)"
                        value={entry.work_category}
                        onChange={(e) => handleUpdateEntry(idx, 'work_category', e.target.value)}
                        style={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#F8FAFC',
                          padding: '7px 10px',
                          fontSize: '12.5px'
                        }}
                      />

                      <input
                        type="text"
                        placeholder="Description of activities or deliverables completed..."
                        value={entry.work_description}
                        onChange={(e) => handleUpdateEntry(idx, 'work_description', e.target.value)}
                        style={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#F8FAFC',
                          padding: '7px 10px',
                          fontSize: '12.5px'
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="24"
                          value={entry.hours_worked}
                          onChange={(e) => handleUpdateEntry(idx, 'hours_worked', Number(e.target.value))}
                          style={{
                            width: '60px',
                            backgroundColor: '#0F172A',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#F8FAFC',
                            padding: '7px 6px',
                            fontSize: '12.5px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>hrs</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(idx)}
                        disabled={dsrForm.entries.length <= 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: dsrForm.entries.length <= 1 ? '#475569' : '#EF4444',
                          cursor: dsrForm.entries.length <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenges & Roadblocks */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Roadblocks, Objections & Challenges Encountered
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe any objections, blockers, or dependencies encountered today..."
                  value={dsrForm.challenges}
                  onChange={(e) => setDsrForm({ ...dsrForm, challenges: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Tomorrow's Plan */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Tomorrow's Action Plan & Commitments
                </label>
                <textarea
                  rows={2}
                  placeholder="Key priorities, scheduled calls, demos, or deals planned for tomorrow..."
                  value={dsrForm.tomorrows_plan}
                  onChange={(e) => setDsrForm({ ...dsrForm, tomorrows_plan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="submit"
                  disabled={dsrSubmitting}
                  style={{
                    padding: '10px 28px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: dsrSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{dsrSubmitting ? 'Submitting DSR...' : (existingReport ? 'Update Daily Sales Report' : 'Submit Daily Sales Report')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past DSR Reports History */}
          <div
            style={{
              backgroundColor: '#111827',
              borderRadius: '14px',
              border: '1px solid #1F2937',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', margin: '0 0 14px' }}>
              Past Daily Sales Reports Logged
            </h3>

            {pastReports.length === 0 ? (
              <div style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                No past daily reports found. Submit your report for today above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pastReports.slice(0, 10).map((r) => {
                  const isExpanded = expandedReportId === r.id;
                  return (
                    <div
                      key={r.id}
                      style={{
                        backgroundColor: '#1E293B',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '14px' }}>
                              Report for {r.report_date} {r.first_name ? `• ${r.first_name} ${r.last_name || ''}`.trim() : ''}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: r.status === 'REVIEWED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: r.status === 'REVIEWED' ? '#34D399' : '#60A5FA'
                              }}
                            >
                              {r.status || 'SUBMITTED'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#60A5FA', border: '1px solid #334155' }}>
                              📞 {r.calls_made || 0} Calls
                            </span>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#FBBF24', border: '1px solid #334155' }}>
                              🤝 {r.meetings_done || 0} Meetings
                            </span>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#C084FC', border: '1px solid #334155' }}>
                              📑 {r.proposals_sent || 0} Quotes
                            </span>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#34D399', border: '1px solid #334155' }}>
                              🏆 {r.deals_closed || 0} Won Deals
                            </span>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0F172A', color: '#F8FAFC', border: '1px solid #334155' }}>
                              ⏱️ {r.total_hours || 0} hrs
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDsrForm({
                                report_date: r.report_date,
                                total_hours: r.total_hours || 0,
                                calls_made: r.calls_made || 0,
                                meetings_done: r.meetings_done || 0,
                                proposals_sent: r.proposals_sent || 0,
                                deals_closed: r.deals_closed || 0,
                                remarks: r.remarks || '',
                                challenges: r.challenges || '',
                                tomorrows_plan: r.tomorrows_plan || '',
                                entries: (r.entries && r.entries.length > 0)
                                  ? r.entries.map(ent => ({
                                      work_category: ent.work_category || 'Sales Activity',
                                      work_description: ent.work_description || '',
                                      hours_worked: ent.hours_worked || 1
                                    }))
                                  : [{ work_category: 'Sales Outreach', work_description: '', hours_worked: 1 }]
                              });
                              setExistingReport(r);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#0F172A',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#60A5FA',
                              fontSize: '11.5px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(r.id);
                            }}
                            style={{
                              padding: '5px 9px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#F87171',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Delete this report"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                          {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '6px', fontSize: '12.5px', color: '#CBD5E1' }}>
                          {r.remarks && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong style={{ color: '#94A3B8' }}>Remarks: </strong> {r.remarks}
                            </div>
                          )}
                          {r.challenges && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong style={{ color: '#F87171' }}>Challenges: </strong> {r.challenges}
                            </div>
                          )}
                          {r.tomorrows_plan && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong style={{ color: '#34D399' }}>Tomorrow's Plan: </strong> {r.tomorrows_plan}
                            </div>
                          )}
                          {r.entries && r.entries.length > 0 && (
                            <div>
                              <strong style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Deliverables:</strong>
                              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94A3B8' }}>
                                {r.entries.map((ent, i) => (
                                  <li key={i} style={{ marginBottom: '2px' }}>
                                    <span style={{ color: '#F8FAFC' }}>{ent.work_category}: </span>
                                    {ent.work_description} ({ent.hours_worked || 1} hrs)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MANAGE DAILY TASKS */}
      {/* ========================================================================= */}
      {subTab === 'TASKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls: Filter Tabs & Add Task */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: `All Tasks (${tasks.length})` },
                { key: 'TODAY', label: `Due Today (${todayTasksCount})` },
                { key: 'OVERDUE', label: `Overdue (${overdueTasksCount})` },
                { key: 'UPCOMING', label: `Upcoming` },
                { key: 'COMPLETED', label: `Completed (${completedTasksCount})` }
              ].map((t) => {
                const isSelected = taskFilterTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTaskFilterTab(t.key)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid #8B5CF6' : '1px solid #374151',
                      backgroundColor: isSelected ? '#4C1D95' : '#1F2937',
                      color: isSelected ? '#DDD6FE' : '#9CA3AF',
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
                title="Refresh Tasks"
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
                onClick={() => onAddTask(null)}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Plus size={16} />
                <span>New Sales Task</span>
              </button>
            </div>
          </div>

          {/* Task Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '14px',
                  border: '1px solid #1F2937',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#94A3B8'
                }}
              >
                <CheckSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0' }}>No tasks found in this view</div>
                <p style={{ fontSize: '13px', margin: '4px 0 16px', color: '#64748B' }}>
                  Create and manage your daily sales checklist above!
                </p>
                <button
                  onClick={() => onAddTask(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8B5CF6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Daily Task
                </button>
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isCompleted = t.status === 'COMPLETED';
                const isOverdue = t.due_date < todayStr && !isCompleted;
                const isToday = t.due_date === todayStr && !isCompleted;
                const priorityStyle = TASK_PRIORITIES[t.priority] || TASK_PRIORITIES['MEDIUM'];

                return (
                  <div
                    key={t.id}
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: '10px',
                      border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1F2937',
                      padding: '14px 18px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    {/* Left: Checkbox & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '260px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(t)}
                        disabled={taskLoadingId === t.id}
                        title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: isCompleted ? '#10B981' : 'transparent',
                          border: isCompleted ? '1px solid #10B981' : '2px solid #64748B',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {isCompleted && <CheckCircle2 size={16} />}
                      </button>

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: isCompleted ? '#94A3B8' : '#F8FAFC',
                            fontSize: '14px',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                        >
                          {t.task_title}
                        </div>

                        {t.description && (
                          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                            {t.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.text
                            }}
                          >
                            {t.priority}
                          </span>

                          <span
                            style={{
                              fontSize: '11px',
                              color: isOverdue ? '#F87171' : (isToday ? '#60A5FA' : '#94A3B8'),
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Calendar size={11} />
                            <span>Due: {t.due_date}</span>
                            {isOverdue && <span>(Overdue)</span>}
                            {isToday && <span>(Today)</span>}
                          </span>

                          {t.lead_company_name && (
                            <span style={{ fontSize: '11.5px', color: '#C084FC', backgroundColor: '#1E293B', padding: '1px 6px', borderRadius: '4px' }}>
                              Lead: {t.lead_company_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => onEditTask(t)}
                        title="Edit Task"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#CBD5E1',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        title="Delete Task"
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#F87171',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
