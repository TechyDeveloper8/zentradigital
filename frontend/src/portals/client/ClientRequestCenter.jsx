import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  AlertCircle, Plus, CheckCircle2, Clock, MessageSquare,
  User, ArrowRight
} from 'lucide-react';

export default function ClientRequestCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const [newRequest, setNewRequest] = useState({
    request_title: '',
    category: 'New Creative',
    description: '',
    preferred_platform: 'Instagram',
    priority: 'MEDIUM',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    setLoading(true);
    api.get('/client-requests')
      .then(res => setRequests(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/client-requests', newRequest);
      setShowAddModal(false);
      setNewRequest({
        request_title: '', category: 'New Creative', description: '',
        preferred_platform: 'Instagram', priority: 'MEDIUM',
        due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
      });
      alert(`Request ticket [${res.request.request_code}] logged and assigned to agency staff!`);
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to create request');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Client Request Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Submit ad-hoc creative requests, campaign changes, and technical requirements to your dedicated agency team.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create New Request
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No requests created yet</h3>
          <p>Need a festival creative, emergency revision, or reel concept? Submit a ticket directly to your team.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create First Request
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Request Title</th>
                <th>Category</th>
                <th>Assigned Agency Staff</th>
                <th>Date Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>{r.request_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.request_title}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{r.description}</div>
                  </td>
                  <td>
                    <span className="status-badge gray">{r.category}</span>
                  </td>
                  <td>
                    {/* Section 23: Assigned Person Visible to Client with Chat Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {r.assigned_employee_name || 'Staff Triage'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {r.assigned_employee_designation || 'Agency Specialist'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{r.requested_date}</div>
                    {r.due_date && <div style={{ fontSize: '11px', color: '#EF4444' }}>Target: {r.due_date}</div>}
                  </td>
                  <td>
                    <span className={`status-badge ${r.status === 'COMPLETED' ? 'green' : (r.status === 'NEW' ? 'blue' : 'purple')}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate('/client/chat')}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      <MessageSquare size={13} /> Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Request Modal (Section 22) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Create New Agency Request</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Request Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Need Diwali Festival Creative by 18 September"
                    value={newRequest.request_title}
                    onChange={e => setNewRequest({ ...newRequest, request_title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={newRequest.category}
                      onChange={e => setNewRequest({ ...newRequest, category: e.target.value })}
                    >
                      <option value="New Creative">New Creative (Design/Graphic)</option>
                      <option value="Video">Video / Motion Graphic</option>
                      <option value="Reel">Reel / Short Format</option>
                      <option value="Social Media">Social Media Post</option>
                      <option value="Design Change">Design Change</option>
                      <option value="Advertisement">Ad Creative</option>
                      <option value="Urgent Requirement">Urgent Requirement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Platform</label>
                    <select
                      className="form-control"
                      value={newRequest.preferred_platform}
                      onChange={e => setNewRequest({ ...newRequest, preferred_platform: e.target.value })}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Website">Website</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Requirement Description *</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    placeholder="Specify dimensions, copy requirements, offer text, and visual mood..."
                    value={newRequest.description}
                    onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Needed By Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newRequest.due_date}
                      onChange={e => setNewRequest({ ...newRequest, due_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={newRequest.priority}
                      onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Standard</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Ticket to Agency</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
