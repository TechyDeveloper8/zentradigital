import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Award, CheckCircle2, XCircle, Clock, Eye, AlertCircle,
  Sparkles, MessageSquare, ArrowRight, Shield
} from 'lucide-react';

export default function ReviewApprovalCenter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Revision Form State
  const [revision, setRevision] = useState({
    reason: 'Design Change',
    comment: '',
    specific_change: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = () => {
    setLoading(true);
    api.get('/reviews/pending')
      .then(res => setItems(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (item) => {
    if (!confirm(`Confirm approval for "${item.topic}"? It will be marked ready for scheduling.`)) return;

    try {
      await api.post(`/reviews/client/${item.id}`, {
        action: 'APPROVE',
        comment: 'Approved by client'
      });
      alert('Creative approved successfully! Your agency team has been notified.');
      loadReviewItems();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRequestChanges = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.post(`/reviews/client/${selectedItem.id}`, {
        action: 'REQUEST_CHANGES',
        reason: revision.reason,
        comment: revision.comment,
        specific_change: revision.specific_change,
        priority: revision.priority
      });
      setShowRevisionModal(false);
      setRevision({ reason: 'Design Change', comment: '', specific_change: '', priority: 'MEDIUM' });
      alert('Revisions submitted! The assigned designer has received your changes.');
      loadReviewItems();
    } catch (err) {
      alert(err.message || 'Failed to submit revisions');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Creative Review & Approval Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Inspect drafted visuals, review captions, sign off for scheduling, or request design modifications.
          </p>
        </div>

        <button onClick={loadReviewItems} className="btn btn-secondary">
          Refresh Deliverables
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading review queue...</div>
      ) : items.length === 0 ? (
        <div className="table-container empty-state" style={{ padding: '48px' }}>
          <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: '12px' }} />
          <h3>No creatives waiting for your review!</h3>
          <p>Your agency team is hard at work. Once new creatives are drafted, they will appear here for approval.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {items.map(it => (
            <div
              key={it.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
            >
              <div>
                {/* Visual Banner Preview */}
                <div style={{ height: '220px', backgroundColor: '#1F2937', position: 'relative', overflow: 'hidden' }}>
                  {it.current_preview_url ? (
                    <img
                      src={it.current_preview_url}
                      alt={it.topic}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
                      Deliverable Preview
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="status-badge blue">{it.platform}</span>
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span className="status-badge purple">Version {it.current_version}</span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA' }}>{it.content_code}</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#F9FAFB', margin: '4px 0 8px' }}>
                    {it.topic}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '14px' }}>
                    Format: {it.content_type} • Scheduled for: {it.publish_date} {it.publish_time}
                  </div>

                  {/* Caption Box */}
                  <div style={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '12.5px',
                    color: '#D1D5DB',
                    lineHeight: '1.5',
                    maxHeight: '100px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>COPY & CAPTION</div>
                    {it.caption || 'No caption copy submitted.'}
                    {it.hashtags && (
                      <div style={{ color: '#60A5FA', marginTop: '6px', fontSize: '11.5px' }}>{it.hashtags}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: '#0d121f',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <button
                  onClick={() => handleApprove(it)}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button
                  onClick={() => { setSelectedItem(it); setShowRevisionModal(true); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', borderColor: '#EF4444', color: '#F87171' }}
                >
                  <XCircle size={16} /> Request Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Changes Modal (Section 21) */}
      {showRevisionModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Request Changes: {selectedItem.topic}
                </h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Currently Version {selectedItem.current_version}</div>
              </div>
              <button onClick={() => setShowRevisionModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleRequestChanges}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category of Change *</label>
                  <select
                    className="form-control"
                    value={revision.reason}
                    onChange={e => setRevision({ ...revision, reason: e.target.value })}
                  >
                    <option value="Design Change">Design Change (Colors, Layout, Typography)</option>
                    <option value="Copy Modification">Copy Modification (Caption or Headline)</option>
                    <option value="Branding Alignment">Branding Alignment (Logo, Guidelines)</option>
                    <option value="Format Change">Format Change</option>
                    <option value="Other">Other Specific Requirement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Changes Requested *</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    placeholder="e.g. Please change the headline color to our primary brand navy and enlarge the product shot..."
                    value={revision.specific_change}
                    onChange={e => setRevision({ ...revision, specific_change: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Priority</label>
                  <select
                    className="form-control"
                    value={revision.priority}
                    onChange={e => setRevision({ ...revision, priority: e.target.value })}
                  >
                    <option value="MEDIUM">Standard Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Immediate attention)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRevisionModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-danger">Submit Revision Request to Designer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
