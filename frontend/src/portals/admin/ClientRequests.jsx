import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  AlertCircle, Plus, CheckCircle2, Clock, MessageSquare,
  User, Filter, ArrowRight, ChevronRight
} from 'lucide-react';

export default function ClientRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadRequests();
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
  }, [filterStatus]);

  const loadRequests = () => {
    setLoading(true);
    const params = filterStatus !== 'ALL' ? { status: filterStatus } : {};
    api.get('/client-requests', params)
      .then(res => setRequests(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (reqId, newStatus) => {
    try {
      await api.put(`/client-requests/${reqId}`, { status: newStatus });
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to update request status');
    }
  };

  const handleReassign = async (reqId, empId) => {
    try {
      await api.put(`/client-requests/${reqId}`, { assigned_employee_id: empId, status: 'ASSIGNED' });
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to reassign request');
    }
  };

  const statuses = ['ALL', 'NEW', 'ASSIGNED', 'IN PROGRESS', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'COMPLETED', 'CLOSED'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Client Requests Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Track tickets submitted by clients, automatic role-based assignments, and resolution statuses.
          </p>
        </div>

        <button onClick={loadRequests} className="btn btn-secondary">
          Refresh Tickets
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="tabs-header">
        {statuses.map(st => (
          <button
            key={st}
            className={`tab-btn ${filterStatus === st ? 'active' : ''}`}
            onClick={() => setFilterStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading requests from database...</div>
      ) : requests.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No client requests found</h3>
          <p>Clients can create tickets directly from their portal or through live conversation.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Client & Title</th>
                <th>Category</th>
                <th>Assigned Staff</th>
                <th>Date Requested</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Stage Advance</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '12px' }}>{req.request_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{req.request_title}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{req.company_name}</div>
                  </td>
                  <td>
                    <span className="status-badge gray">{req.category}</span>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                      value={req.assigned_employee_id || ''}
                      onChange={e => handleReassign(req.id, e.target.value)}
                    >
                      <option value="">-- Unassigned --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{req.requested_date}</div>
                    {req.due_date && <div style={{ fontSize: '11px', color: '#EF4444' }}>Due: {req.due_date}</div>}
                  </td>
                  <td>
                    <span className={`status-badge ${req.priority === 'URGENT' ? 'red' : (req.priority === 'HIGH' ? 'yellow' : 'gray')}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${req.status === 'COMPLETED' ? 'green' : (req.status === 'NEW' ? 'blue' : 'purple')}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '11.5px', width: 'auto' }}
                      value={req.status}
                      onChange={e => handleUpdateStatus(req.id, e.target.value)}
                    >
                      {statuses.filter(s => s !== 'ALL').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
