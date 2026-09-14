import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function DailyUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = () => {
    setLoading(true);
    api.get('/daily-updates')
      .then(res => setUpdates(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Daily Work Updates Feed
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Curated daily report of work delivered, items in progress, and deliverables pending your review.
          </p>
        </div>

        <button onClick={loadUpdates} className="btn btn-secondary">
          Refresh Updates
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading daily updates...</div>
      ) : updates.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No daily updates posted yet</h3>
          <p>Your agency team posts daily updates every afternoon summarising progress on your account.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {updates.map(u => (
            <div
              key={u.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#60A5FA' }}>
                  📅 Progress Report: {u.update_date}
                </span>
                <span className="status-badge green">Verified by Management</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '4px' }}>
                  ✓ Completed Today
                </div>
                <div style={{ fontSize: '13.5px', color: '#F9FAFB', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {u.completed_text}
                </div>
              </div>

              {u.in_progress_text && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '4px' }}>
                    ⏳ Currently in Production
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#D1D5DB', whiteSpace: 'pre-wrap' }}>
                    {u.in_progress_text}
                  </div>
                </div>
              )}

              {u.pending_client_text && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', marginBottom: '2px' }}>
                    ⚠️ Pending Client Feedback
                  </div>
                  <div style={{ fontSize: '13px', color: '#F9FAFB' }}>
                    {u.pending_client_text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
