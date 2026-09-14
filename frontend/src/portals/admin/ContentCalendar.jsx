import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Calendar as CalendarIcon, Plus, Eye, CheckCircle2, AlertCircle,
  Globe, Clock, Filter, Award, Sparkles, ArrowRight, Share2, Video
} from 'lucide-react';

export default function ContentCalendar() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' or 'KANBAN'

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [newItem, setNewItem] = useState({
    client_id: '',
    platform: 'Instagram',
    content_type: 'Carousel',
    topic: '',
    caption: '',
    hashtags: '#digitalmarketing #branding',
    cta: 'Link in bio to learn more',
    assigned_editor_id: '',
    publish_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    publish_time: '18:00',
    workflow_stage: 'PLANNED'
  });

  useEffect(() => {
    loadContent();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
  }, [filterPlatform, filterStage]);

  const loadContent = () => {
    setLoading(true);
    const params = {};
    if (filterPlatform !== 'ALL') params.platform = filterPlatform;
    if (filterStage !== 'ALL') params.workflow_stage = filterStage;

    api.get('/content-calendar', params)
      .then(res => setItems(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/content-calendar', newItem);
      setShowAddModal(false);
      setNewItem({
        client_id: '', platform: 'Instagram', content_type: 'Carousel',
        topic: '', caption: '', hashtags: '#digitalmarketing', cta: 'Link in bio',
        assigned_editor_id: '', publish_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        publish_time: '18:00', workflow_stage: 'PLANNED'
      });
      loadContent();
    } catch (err) {
      alert(err.message || 'Failed to schedule content');
    }
  };

  const platforms = ['ALL', 'Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'X', 'Website'];
  const stages = ['ALL', 'IDEA', 'PLANNED', 'ASSIGNED', 'IN PRODUCTION', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Content Calendar & Publishing Hub
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Plan, produce, review, and schedule omnichannel creative assets across all client accounts.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Plan New Content
        </button>
      </div>

      {/* Filter Bar & View Toggle */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '20px',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
            <Filter size={15} /> Platform:
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
          >
            {platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF', marginLeft: '10px' }}>
            Stage:
          </div>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
          >
            {stages.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('LIST')}
            className={`btn ${viewMode === 'LIST' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('KANBAN')}
            className={`btn ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Kanban Stages
          </button>
        </div>
      </div>

      {/* Content Items List View */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading content calendar from database...</div>
      ) : items.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No content scheduled for this selection</h3>
          <p>Plan monthly carousels, reels, and stories for your clients.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Plan First Content Item
          </button>
        </div>
      ) : viewMode === 'LIST' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Client & Topic</th>
                <th>Platform & Type</th>
                <th>Assigned Editor</th>
                <th>Publish Schedule</th>
                <th>Workflow Stage</th>
                <th>Client Approval</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '12px' }}>{it.content_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{it.topic}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{it.company_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#F9FAFB' }}>{it.platform}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{it.content_type} (v{it.current_version})</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{it.editor_name || 'Unassigned'}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>MM: {it.marketing_manager_name || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#F9FAFB' }}>{it.publish_date || 'Unscheduled'}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{it.publish_time}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      it.workflow_stage === 'APPROVED' || it.workflow_stage === 'PUBLISHED' ? 'green' :
                      (it.workflow_stage === 'CLIENT_REVIEW' ? 'purple' :
                      (it.workflow_stage === 'INTERNAL_REVIEW' ? 'yellow' : 'blue'))
                    }`}>
                      {it.workflow_stage}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${it.client_approval_status === 'APPROVED' ? 'green' : (it.client_approval_status === 'REVISION_REQUESTED' ? 'red' : 'gray')}`}>
                      {it.client_approval_status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedItem(it)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          overflowX: 'auto'
        }}>
          {['PLANNED', 'IN PRODUCTION', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'APPROVED', 'PUBLISHED'].map(col => {
            const colItems = items.filter(it => it.workflow_stage === col);
            return (
              <div
                key={col}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '75vh'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F9FAFB', textTransform: 'uppercase' }}>
                    {col}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#1F2937',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    color: '#9CA3AF'
                  }}>
                    {colItems.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {colItems.map(it => (
                    <div
                      key={it.id}
                      onClick={() => setSelectedItem(it)}
                      style={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA' }}>{it.platform}</span>
                        <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>v{it.current_version}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#F9FAFB', marginBottom: '4px' }}>
                        {it.topic}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginBottom: '8px' }}>
                        {it.company_name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#6B7280' }}>
                        <span>📅 {it.publish_date}</span>
                        <span>👤 {it.editor_name || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Content Modal (Section 19) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Plan Content Calendar Item</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateContent}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newItem.client_id}
                      onChange={e => setNewItem({ ...newItem, client_id: e.target.value })}
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Platform *</label>
                    <select
                      className="form-control"
                      value={newItem.platform}
                      onChange={e => setNewItem({ ...newItem, platform: e.target.value })}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="X">X (Twitter)</option>
                      <option value="Website">Website</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Content Type *</label>
                    <select
                      className="form-control"
                      value={newItem.content_type}
                      onChange={e => setNewItem({ ...newItem, content_type: e.target.value })}
                    >
                      <option value="Carousel">Carousel</option>
                      <option value="Reel">Reel / Short Video</option>
                      <option value="Static Post">Static Post</option>
                      <option value="Story">Story</option>
                      <option value="Ad Creative">Ad Creative</option>
                      <option value="Festival Creative">Festival Creative</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Editor</label>
                    <select
                      className="form-control"
                      value={newItem.assigned_editor_id}
                      onChange={e => setNewItem({ ...newItem, assigned_editor_id: e.target.value })}
                    >
                      <option value="">-- Select Creative / Editor --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Headline *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 5 Growth Hacks for B2B Startups in 2026"
                    value={newItem.topic}
                    onChange={e => setNewItem({ ...newItem, topic: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Draft Caption</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Write engaging caption for the target audience..."
                    value={newItem.caption}
                    onChange={e => setNewItem({ ...newItem, caption: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Publish Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newItem.publish_date}
                      onChange={e => setNewItem({ ...newItem, publish_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Publish Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newItem.publish_time}
                      onChange={e => setNewItem({ ...newItem, publish_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule to Calendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Content Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{selectedItem.topic}</h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{selectedItem.content_code} • {selectedItem.platform}</div>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <span className="status-badge blue">{selectedItem.workflow_stage}</span>
                <span className="status-badge green">Client: {selectedItem.client_approval_status}</span>
                <span className="status-badge purple">v{selectedItem.current_version}</span>
              </div>

              {selectedItem.current_preview_url && (
                <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', maxHeight: '220px' }}>
                  <img src={selectedItem.current_preview_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid #374151', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>CAPTION</div>
                <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{selectedItem.caption || 'No caption entered yet.'}</div>
                {selectedItem.hashtags && (
                  <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '6px' }}>{selectedItem.hashtags}</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', color: '#D1D5DB' }}>
                <div><strong>Assigned Editor:</strong> {selectedItem.editor_name || 'Unassigned'}</div>
                <div><strong>Publish Date:</strong> {selectedItem.publish_date} {selectedItem.publish_time}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedItem(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
