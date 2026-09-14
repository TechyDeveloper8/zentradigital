import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Award, AlertCircle, Calendar, Layers, Clock, Users,
  CheckCircle2, ArrowRight, MessageSquare, FileText
} from 'lucide-react';

export default function ClientDashboard() {
  const { user, client } = useAuth();
  const [services, setServices] = useState([]);
  const [content, setContent] = useState([]);
  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      api.get('/services'),
      api.get('/content-calendar'),
      api.get('/client-requests'),
      api.get('/daily-updates')
    ]).then(([srv, cnt, reqs, upd]) => {
      setServices(srv || []);
      setContent(cnt || []);
      setRequests(reqs || []);
      setUpdates(upd || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const pendingApprovals = content.filter(c => c.workflow_stage === 'CLIENT_REVIEW');
  const openRequests = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CLOSED');
  const upcomingContent = content.filter(c => c.workflow_stage === 'APPROVED' || c.workflow_stage === 'SCHEDULED');

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Welcome, {client?.company_name || user?.username}!
            </h1>
            <span className="status-badge green">Active Client Portal</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: '4px 0 0' }}>
            Your dedicated collaboration hub for creative approvals, service tracking, and direct agency communication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/client/requests')} className="btn btn-primary">
            <AlertCircle size={16} /> Create Request
          </button>
          <button onClick={() => navigate('/client/chat')} className="btn btn-secondary">
            <MessageSquare size={16} /> Open Agency Chat
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 29) */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/client/reviews')}>
          <div className="kpi-label">Pending Your Approval</div>
          <div className="kpi-value" style={{ color: pendingApprovals.length > 0 ? '#F59E0B' : '#10B981' }}>
            {pendingApprovals.length}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Creatives ready for review</div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/client/requests')}>
          <div className="kpi-label">Open Requests</div>
          <div className="kpi-value" style={{ color: '#3B82F6' }}>
            {openRequests.length}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Tickets in progress</div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/client/calendar')}>
          <div className="kpi-label">Upcoming Scheduled Content</div>
          <div className="kpi-value" style={{ color: '#10B981' }}>
            {upcomingContent.length}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981' }}>Approved for release</div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/client/services')}>
          <div className="kpi-label">Active Subscribed Services</div>
          <div className="kpi-value">
            {services.length}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Monthly retainer plans</div>
        </div>
      </div>

      {/* Two Column Section: Pending Approvals & Today's Updates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '10px' }}>
        {/* Pending Approvals Widget */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#F59E0B" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F9FAFB' }}>Action Required: Creative Approvals</span>
            </div>
            <button
              onClick={() => navigate('/client/reviews')}
              style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer' }}
            >
              Review Center →
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <CheckCircle2 size={30} color="#10B981" style={{ marginBottom: '8px' }} />
              <p>All creative deliverables have been reviewed. You are all caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingApprovals.map(item => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#F9FAFB' }}>{item.topic}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{item.platform} • {item.content_type} (v{item.current_version})</div>
                  </div>
                  <button
                    onClick={() => navigate('/client/reviews')}
                    className="btn btn-primary"
                    style={{ padding: '5px 12px', fontSize: '12px' }}
                  >
                    Review & Sign Off
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Updates Feed (Section 24) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#10B981" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F9FAFB' }}>Today's Agency Progress</span>
            </div>
            <button
              onClick={() => navigate('/client/daily-updates')}
              style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer' }}
            >
              History →
            </button>
          </div>

          {updates.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>No client updates posted yet today. Check back during afternoon work hours.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {updates.slice(0, 1).map(u => (
                <div key={u.id} style={{ background: '#1F2937', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11.5px', color: '#60A5FA', fontWeight: 700, marginBottom: '6px' }}>
                    UPDATES FOR {u.update_date}
                  </div>
                  <div style={{ fontSize: '13px', color: '#F9FAFB', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {u.completed_text}
                  </div>
                  {u.pending_client_text && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#FBBF24' }}>
                      Pending Your Action: {u.pending_client_text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
