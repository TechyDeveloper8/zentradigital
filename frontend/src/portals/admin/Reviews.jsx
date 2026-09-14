import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Award, CheckCircle2, XCircle, Clock, Eye, AlertCircle,
  MessageSquare, User, ArrowRight, Shield
} from 'lucide-react';

export default function Reviews() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = () => {
    setLoading(true);
    api.get('/reviews/pending')
      .then(res => setPending(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/internal/${selectedItem.id}`, {
        action: actionType,
        reason,
        comment
      });
      setSelectedItem(null);
      setComment('');
      setReason('');
      loadPending();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Creative Reviews & Approvals Queue
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Audit and approve creative versions internally before submitting for client sign-off.
          </p>
        </div>

        <button onClick={loadPending} className="btn btn-secondary">
          Refresh Queue
        </button>
      </div>

      {/* Pending Items Grid */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading review queue...</div>
      ) : pending.length === 0 ? (
        <div className="table-container empty-state">
          <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: '12px' }} />
          <h3>All creative reviews are up to date!</h3>
          <p>No creatives are currently waiting for internal review or client sign-off.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {pending.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Preview Banner */}
                <div style={{ height: '180px', backgroundColor: '#1F2937', position: 'relative', overflow: 'hidden' }}>
                  {item.current_preview_url ? (
                    <img
                      src={item.current_preview_url}
                      alt={item.topic}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                      Asset Preview
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <span className="status-badge blue">{item.platform}</span>
                  </div>
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="status-badge purple">Version {item.current_version}</span>
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700 }}>{item.content_code}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F9FAFB', margin: '2px 0 4px' }}>{item.topic}</div>
                  <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginBottom: '10px' }}>{item.company_name}</div>

                  <div style={{ background: '#111827', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#D1D5DB', maxHeight: '60px', overflowY: 'auto' }}>
                    {item.caption || 'No caption text.'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`status-badge ${item.workflow_stage === 'CLIENT_REVIEW' ? 'purple' : 'yellow'}`}>
                  {item.workflow_stage}
                </span>

                <button
                  onClick={() => setSelectedItem(item)}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12.5px' }}
                >
                  Review Creative →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Review Creative: {selectedItem.topic}</h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>v{selectedItem.current_version} for {selectedItem.company_name}</div>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="modal-body">
                {selectedItem.current_preview_url && (
                  <div style={{ marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', maxHeight: '200px' }}>
                    <img src={selectedItem.current_preview_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Review Decision *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setActionType('APPROVE')}
                      className={`btn ${actionType === 'APPROVE' ? 'btn-success' : 'btn-secondary'}`}
                      style={{ padding: '10px' }}
                    >
                      <CheckCircle2 size={16} /> Approve & Send to Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('REQUEST_CHANGES')}
                      className={`btn ${actionType === 'REQUEST_CHANGES' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ padding: '10px' }}
                    >
                      <XCircle size={16} /> Request Revisions
                    </button>
                  </div>
                </div>

                {actionType === 'REQUEST_CHANGES' && (
                  <div className="form-group">
                    <label className="form-label">Reason for Revision</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Logo contrast is too low; fix caption copy"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Review Comments / Specific Notes</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Provide specific feedback or approval remarks..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedItem(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className={`btn ${actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}>
                  {submitting ? 'Submitting...' : (actionType === 'APPROVE' ? 'Confirm Approval' : 'Send Revisions to Editor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
