import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Shield, Clock, User, Filter, RefreshCw } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntity]);

  const loadLogs = () => {
    setLoading(true);
    const params = {};
    if (filterAction) params.action = filterAction;
    if (filterEntity) params.entity = filterEntity;

    api.get('/audit-logs', params)
      .then(res => setLogs(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            System Audit & Compliance Logs
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Immutable audit record of every entity creation, status change, attendance adjustment, and approval.
          </p>
        </div>

        <button onClick={loadLogs} className="btn btn-secondary">
          <RefreshCw size={15} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
          <Filter size={15} /> Filter By:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="CREATED">CREATED</option>
          <option value="UPDATED">UPDATED</option>
          <option value="STATUS_CHANGED">STATUS_CHANGED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
          <option value="ATTENDANCE_CORRECTED">ATTENDANCE_CORRECTED</option>
          <option value="LOGIN">LOGIN</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
          value={filterEntity}
          onChange={e => setFilterEntity(e.target.value)}
        >
          <option value="">All Entities</option>
          <option value="leads">leads</option>
          <option value="clients">clients</option>
          <option value="tasks">tasks</option>
          <option value="content_items">content_items</option>
          <option value="client_requests">client_requests</option>
          <option value="attendance_records">attendance_records</option>
          <option value="invoices">invoices</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading audit logs from database...</div>
      ) : logs.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No audit records match your criteria</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor User</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Entity ID</th>
                <th>Audit Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.username || 'System'}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{log.role_name || 'Automated'}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      log.action === 'CREATED' ? 'green' :
                      (log.action === 'STATUS_CHANGED' || log.action === 'APPROVED' ? 'blue' :
                      (log.action === 'ATTENDANCE_CORRECTED' || log.action === 'REVISION_REQUESTED' ? 'yellow' : 'gray'))
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#F9FAFB' }}>{log.entity}</td>
                  <td style={{ color: '#60A5FA', fontWeight: 600 }}>#{log.entity_id || '--'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11.5px', color: '#9CA3AF' }}>
                    {log.new_value || log.old_value || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
