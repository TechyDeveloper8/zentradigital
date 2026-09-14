import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Calendar as CalendarIcon, Filter, Eye, Clock, CheckCircle2, Share2, Layers, X } from 'lucide-react';

export default function ClientCalendar() {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadContent();
  }, [filterPlatform, filterType, filterStage]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterPlatform) params.platform = filterPlatform;
      if (filterType) params.content_type = filterType;
      if (filterStage) params.workflow_stage = filterStage;

      const res = await api.get('/content-calendar', params);
      setContentItems(res || []);
    } catch (err) {
      console.error('Failed to load client calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'PUBLISHED':
        return <span className="badge badge-success">PUBLISHED</span>;
      case 'SCHEDULED':
        return <span className="badge badge-primary">SCHEDULED</span>;
      case 'APPROVED':
        return <span className="badge badge-info">APPROVED</span>;
      case 'CLIENT_REVIEW':
        return <span className="badge badge-warning">AWAITING YOUR APPROVAL</span>;
      case 'REVISION_REQUESTED':
        return <span className="badge badge-danger">REVISION IN PROGRESS</span>;
      default:
        return <span className="badge badge-secondary">{stage?.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="portal-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Content Calendar
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Live schedule of your brand's marketing creatives, reels, posts, and publishing timeline.
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
            <option value="Twitter">Twitter / X</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="">All Types</option>
            <option value="Reel">Reel / Short</option>
            <option value="Carousel">Carousel</option>
            <option value="Single Image">Single Post</option>
            <option value="Story">Story</option>
            <option value="Video">Video Ad</option>
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
          >
            <option value="">All Statuses</option>
            <option value="CLIENT_REVIEW">Awaiting My Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading calendar items...
        </div>
      ) : contentItems.length === 0 ? (
        <div className="portal-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CalendarIcon size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Scheduled Content Found
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
            There are currently no items matching your filter criteria. Your marketing team is continually preparing high-impact assets for your brand.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {contentItems.map((item) => (
            <div
              key={item.id}
              className="portal-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative'
              }}
              onClick={() => setSelectedItem(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Card Preview Header */}
              <div style={{
                height: '160px',
                backgroundColor: 'var(--bg-secondary)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                {item.current_preview_url ? (
                  <img
                    src={item.current_preview_url}
                    alt={item.topic}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Layers size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <span style={{ fontSize: '12px' }}>{item.content_type || 'Creative Asset'}</span>
                  </div>
                )}

                {/* Platform Badge Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '20px'
                }}>
                  {item.platform || 'Multi-platform'}
                </div>

                {/* Version badge */}
                {item.current_version > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'var(--accent-blue)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    V{item.current_version}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                    {item.topic}
                  </h3>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  {getStageBadge(item.workflow_stage)}
                </div>

                {item.caption && (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: '0 0 16px 0',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.caption}
                  </p>
                )}

                <div style={{
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={13} color="var(--accent-blue)" />
                    <span>{item.publish_date || 'TBD'}</span>
                  </div>
                  {item.publish_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span>{item.publish_time}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {selectedItem.content_code} &bull; {selectedItem.platform}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {selectedItem.topic}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {selectedItem.current_preview_url && (
              <div style={{
                maxHeight: '340px',
                overflow: 'hidden',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img
                  src={selectedItem.current_preview_url}
                  alt={selectedItem.topic}
                  style={{ maxHeight: '340px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <span style={{ marginTop: '4px', display: 'inline-block' }}>{getStageBadge(selectedItem.workflow_stage)}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Format</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedItem.content_type || 'General'}</span>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Publish Schedule</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedItem.publish_date} {selectedItem.publish_time || ''}
                </span>
              </div>
            </div>

            {selectedItem.caption && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Caption / Post Copy
                </h4>
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedItem.caption}
                </div>
              </div>
            )}

            {selectedItem.hashtags && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Hashtags
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--accent-blue)', wordBreak: 'break-word' }}>
                  {selectedItem.hashtags}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-secondary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
