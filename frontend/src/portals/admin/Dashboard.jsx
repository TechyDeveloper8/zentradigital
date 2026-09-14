import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  TrendingUp, Users, Briefcase, CheckSquare, Clock, AlertCircle,
  Award, Calendar, DollarSign, ArrowUpRight, Shield,
  ChevronRight, AlertTriangle, BarChart3, Plus, RefreshCw, Zap,
  Activity, ArrowRight, Layers, FileText, CheckCircle2, UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const [reportRes, logsRes] = await Promise.all([
        api.get('/reports/admin'),
        api.get('/audit-logs').catch(() => [])
      ]);
      setData(reportRes);
      setRecentLogs((logsRes || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#9CA3AF' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 16px', color: '#3B82F6' }} />
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#F9FAFB' }}>Computing Live Executive Metrics</div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>Querying live database tables and operational records...</div>
      </div>
    );
  }

  const m = data?.metrics || {};

  // All 10 Core KPIs with categorization
  const allCards = [
    {
      category: 'SALES',
      label: 'Total Leads',
      val: m.total_leads || 0,
      sub: `${m.new_leads || 0} New • ${m.conversion_rate || 0}% Won`,
      icon: TrendingUp,
      color: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      route: '/admin/leads'
    },
    {
      category: 'SALES',
      label: 'Monthly Revenue',
      val: `₹${(m.monthly_revenue || 0).toLocaleString()}`,
      sub: `₹${(m.mrr || 0).toLocaleString()} Active MRR`,
      icon: DollarSign,
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      route: null
    },
    {
      category: 'SALES',
      label: 'Outstanding Invoices',
      val: `₹${(m.outstanding_payments || 0).toLocaleString()}`,
      sub: 'Unpaid / Overdue Invoices',
      icon: AlertTriangle,
      color: (m.outstanding_payments || 0) > 0 ? '#EF4444' : '#10B981',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      route: null
    },
    {
      category: 'PRODUCTION',
      label: 'Active Clients',
      val: m.active_clients || 0,
      sub: `${m.onboarding_clients || 0} In Onboarding`,
      icon: Users,
      color: '#06B6D4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      route: '/admin/clients'
    },
    {
      category: 'PRODUCTION',
      label: 'Active Projects',
      val: m.active_projects || 0,
      sub: 'Live Agency Engagements',
      icon: Briefcase,
      color: '#8B5CF6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      route: '/admin/projects'
    },
    {
      category: 'PRODUCTION',
      label: 'Pending Tasks',
      val: m.pending_tasks || 0,
      sub: `${m.overdue_tasks || 0} Overdue Items`,
      icon: CheckSquare,
      color: (m.overdue_tasks || 0) > 0 ? '#EF4444' : '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      route: '/admin/tasks'
    },
    {
      category: 'WORKFORCE',
      label: "Today's Attendance",
      val: `${m.attendance_today || 0} / ${(m.attendance_today || 0) + (m.employees_absent || 0)}`,
      sub: `${m.employees_absent || 0} Staff Absent Today`,
      icon: Clock,
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      route: '/admin/attendance'
    },
    {
      category: 'PRODUCTION',
      label: 'Client Approvals Pending',
      val: m.client_approvals_pending || 0,
      sub: 'Waiting for Client Review',
      icon: Award,
      color: '#EC4899',
      bgGlow: 'rgba(236, 72, 153, 0.15)',
      route: '/admin/reviews'
    },
    {
      category: 'WORKFORCE',
      label: 'Open Client Requests',
      val: m.client_requests_pending || 0,
      sub: 'Support & Creative Tickets',
      icon: AlertCircle,
      color: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      route: '/admin/requests'
    },
    {
      category: 'PRODUCTION',
      label: 'Content Scheduled Today',
      val: m.content_scheduled_today || 0,
      sub: `${m.content_published || 0} Total Creatives Published`,
      icon: Calendar,
      color: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      route: '/admin/calendar'
    }
  ];

  const filteredCards = selectedCategory === 'ALL'
    ? allCards
    : allCards.filter(c => c.category === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive Command Header */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(13, 20, 36, 0.9) 100%)'
      }}>
        {/* Glow ambient circle */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="live-indicator-dot" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Agency Operations • Live DB Sync
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {getGreeting()}, Administrator
            </h1>
            <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
              Live executive oversight of agency pipelines, workforce attendance, deliverables velocity, and client revenue.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/leads')}
              className="action-chip-btn"
            >
              <Plus size={14} color="#3B82F6" />
              <span>New Lead</span>
            </button>
            <button
              onClick={() => navigate('/admin/clients')}
              className="action-chip-btn"
            >
              <Users size={14} color="#10B981" />
              <span>New Client</span>
            </button>
            <button
              onClick={() => navigate('/admin/calendar')}
              className="action-chip-btn"
            >
              <Calendar size={14} color="#EC4899" />
              <span>Plan Content</span>
            </button>
            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="action-chip-btn"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.35)' }}
              title="Refresh all metrics from live database"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} color="#60A5FA" />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Spotlight Row: 3 High-Impact Executive Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Spotlight 1: Financial & Revenue Velocity */}
        <div className="spotlight-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Financial Pulse
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFB', margin: '4px 0 0' }}>
                Revenue & Contracts
              </h3>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <DollarSign size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#F9FAFB', letterSpacing: '-0.02em' }}>
              ₹{(m.monthly_revenue || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>collected this month</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '10px',
            marginBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Active MRR</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                ₹{(m.mrr || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Outstanding</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: (m.outstanding_payments || 0) > 0 ? '#EF4444' : '#9CA3AF', marginTop: '2px' }}>
                ₹{(m.outstanding_payments || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: '#9CA3AF',
              fontWeight: 500
            }}
          >
            <span>Active Financial Cycle</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>Live DB Sync</span>
          </div>
        </div>

        {/* Spotlight 2: Client Ecosystem & Retainers */}
        <div className="spotlight-card" style={{ borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Client Portfolio
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFB', margin: '4px 0 0' }}>
                Clients & Growth
              </h3>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <Users size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#F9FAFB', letterSpacing: '-0.02em' }}>
              {m.active_clients || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>active retainer clients</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '10px',
            marginBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Onboarding</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#3B82F6', marginTop: '2px' }}>
                {m.onboarding_clients || 0} brands
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Conversion Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                {m.conversion_rate || 0}%
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/clients')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: '#3B82F6',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>View Client Command Center</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Spotlight 3: Creative Velocity & Approvals */}
        <div className="spotlight-card" style={{ borderLeft: '4px solid #EC4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#EC4899', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Creative Velocity
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFB', margin: '4px 0 0' }}>
                Approvals & Publishing
              </h3>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EC4899'
            }}>
              <Award size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#F9FAFB', letterSpacing: '-0.02em' }}>
              {m.content_published || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>total assets published</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '10px',
            marginBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Client Approvals</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: (m.client_approvals_pending || 0) > 0 ? '#F59E0B' : '#10B981', marginTop: '2px' }}>
                {m.client_approvals_pending || 0} pending
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Internal Reviews</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#EC4899', marginTop: '2px' }}>
                {m.creatives_internal_review || 0} queued
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/reviews')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: '#EC4899',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>Open Review & Approvals Queue</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Operational Metrics Matrix & Filter Tabs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Operational KPI Matrix
            </h2>
            <p style={{ fontSize: '12.5px', color: '#9CA3AF', margin: '2px 0 0' }}>
              Click any card to inspect and manage the underlying database records.
            </p>
          </div>

          {/* Category Filter Switcher */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '4px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {['ALL', 'SALES', 'PRODUCTION', 'WORKFORCE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`quick-category-tab ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat === 'ALL' ? 'All Metrics' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Interactive Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
          {filteredCards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="kpi-card-premium"
                style={{ '--card-accent': c.color, cursor: c.route ? 'pointer' : 'default' }}
                onClick={() => c.route && navigate(c.route)}
                title={c.route ? `Click to open ${c.label}` : c.label}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: c.bgGlow,
                    color: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} />
                  </div>
                  {c.route && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6B7280'
                    }}>
                      <ArrowUpRight size={14} />
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                    {c.val}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '6px' }}>
                    {c.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Column Tactical Operations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Col 1: Upcoming Critical Deadlines (Next 72h) */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#F59E0B" />
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F9FAFB' }}>Upcoming Deadlines (Next 72h)</span>
            </div>
            <button
              onClick={() => navigate('/admin/tasks')}
              style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Tasks Board →
            </button>
          </div>

          {(!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <CheckCircle2 size={32} style={{ color: '#10B981', margin: '0 auto 8px', opacity: 0.8 }} />
              <div style={{ color: '#F9FAFB', fontWeight: 600, fontSize: '14px' }}>All Deliverables on Schedule</div>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>No overdue or immediate tasks approaching in the next 72 hours.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.upcomingDeadlines.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate('/admin/tasks')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.task_title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
                      {t.company_name} &bull; <span style={{ color: '#60A5FA' }}>{t.task_code}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`status-badge ${t.priority === 'URGENT' ? 'red' : 'yellow'}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                      {t.due_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 2: Leads by Acquisition Source */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#3B82F6" />
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F9FAFB' }}>Lead Acquisition Sources</span>
            </div>
            <button
              onClick={() => navigate('/admin/leads')}
              style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Sales Pipeline →
            </button>
          </div>

          {(!data?.leadsBySource || data.leadsBySource.length === 0) ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <TrendingUp size={32} style={{ color: '#6B7280', margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>No lead acquisition channels registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.leadsBySource.map((s, i) => {
                const totalLeads = m.total_leads || 1;
                const percentage = Math.round((s.count / totalLeads) * 100);
                const colors = ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#06B6D4'];
                const barColor = colors[i % colors.length];

                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#D1D5DB' }}>{s.source}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{percentage}%</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>{s.count}</span>
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '7px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '9999px',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Col 3: Live Audit & Activity Stream */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#10B981" />
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F9FAFB' }}>Live Operational Trail</span>
            </div>
          </div>

          {recentLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Shield size={32} style={{ color: '#6B7280', margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>System running normally. No recent audit records.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {log.action}
                      </span>
                      <span style={{ fontWeight: 600, color: '#F9FAFB' }}>{log.entity}</span>
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      By {log.username || 'System Administrator'}
                    </div>
                  </div>
                  <span style={{ color: '#6B7280', fontSize: '11px', flexShrink: 0 }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Launchpad Navigation Bar */}
      <div className="glass-panel" style={{ padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="#F59E0B" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>Quick Operational Shortcuts:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/attendance')}
              className="action-chip-btn"
              style={{ fontSize: '12px' }}
            >
              <Clock size={13} color="#06B6D4" />
              <span>Attendance Hub</span>
            </button>
            <button
              onClick={() => navigate('/admin/requests')}
              className="action-chip-btn"
              style={{ fontSize: '12px' }}
            >
              <AlertCircle size={13} color="#F59E0B" />
              <span>Client Tickets</span>
            </button>
            <button
              onClick={() => navigate('/admin/employee-analytics')}
              className="action-chip-btn"
              style={{ fontSize: '12px' }}
            >
              <BarChart3 size={13} color="#8B5CF6" />
              <span>Staff Productivity</span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="action-chip-btn"
              style={{ fontSize: '12px' }}
            >
              <Shield size={13} color="#3B82F6" />
              <span>Agency Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
