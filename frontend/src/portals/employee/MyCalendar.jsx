import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Calendar, Upload, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';

export default function MyCalendar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [versionData, setVersionData] = useState({
    preview_url: '',
    file_name: '',
    caption_snapshot: '',
    notes: 'Updated creative visual, tuned font hierarchy and contrast.'
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = () => {
    setLoading(true);
    api.get('/content-calendar')
      .then(res => setItems(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.post(`/creatives/upload-version/${selectedItem.id}`, versionData);
      setShowUploadModal(false);
      alert(`Success! Creative version submitted for internal review.`);
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to upload creative version');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            My Assigned Creatives & Calendar
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Production queue for posts, reels, carousels, and version submissions.
          </p>
        </div>

        <button onClick={loadContent} className="btn btn-secondary">
          Refresh Content
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading calendar...</div>
      ) : items.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No creative tasks scheduled</h3>
          <p>Creatives assigned to you by the marketing manager will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {items.map(it => (
            <div
              key={it.id}
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
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700 }}>{it.content_code}</span>
                    <span className="status-badge purple">v{it.current_version}</span>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F9FAFB', marginBottom: '4px' }}>{it.topic}</div>
                  <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginBottom: '10px' }}>{it.company_name} • {it.platform} ({it.content_type})</div>

                  <div style={{ background: '#111827', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#D1D5DB', maxHeight: '60px', overflowY: 'auto' }}>
                    {it.caption || 'No caption text yet.'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`status-badge ${
                  it.workflow_stage === 'APPROVED' ? 'green' :
                  (it.workflow_stage === 'REVISION' ? 'red' :
                  (it.workflow_stage === 'INTERNAL_REVIEW' ? 'yellow' : 'blue'))
                }`}>
                  {it.workflow_stage}
                </span>

                <button
                  onClick={() => {
                    setSelectedItem(it);
                    setVersionData({
                      preview_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                      file_name: `${it.topic.toLowerCase().replace(/\s+/g, '-')}-v${it.current_version + 1}.png`,
                      caption_snapshot: it.caption,
                      notes: 'Revised creative asset according to review comments'
                    });
                    setShowUploadModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                >
                  <Upload size={13} /> Upload Version
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Creative Version Modal (Section 20) */}
      {showUploadModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Upload Version {selectedItem.current_version + 1}
                </h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{selectedItem.topic} ({selectedItem.company_name})</div>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUploadVersion}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asset Preview URL / File URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    required
                    value={versionData.preview_url}
                    onChange={e => setVersionData({ ...versionData, preview_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asset File Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={versionData.file_name}
                    onChange={e => setVersionData({ ...versionData, file_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Version Changelog / Notes *</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    placeholder="Describe specific changes made from previous version..."
                    value={versionData.notes}
                    onChange={e => setVersionData({ ...versionData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Version for Manager Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
