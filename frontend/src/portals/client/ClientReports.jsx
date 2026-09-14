import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart3, Calendar, Award, Eye, ThumbsUp, Users, CheckCircle2, ArrowRight, Printer } from 'lucide-react';

export default function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/client-reports');
      setReports(res || []);
      if (res && res.length > 0) {
        setSelectedReport(res[0]);
      }
    } catch (err) {
      console.error('Failed to load client reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date(2000, monthNum - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="portal-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Monthly Performance Reports
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Comprehensive performance summaries, metrics, and strategic campaign roadmaps.
          </p>
        </div>

        {selectedReport && (
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading performance reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="portal-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BarChart3 size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Finalized Reports Yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
            Your dedicated marketing team prepares and finalizes detailed monthly performance reviews at the end of each billing cycle. Check back soon!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Report Archive Sidebar */}
          <div className="portal-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Report Archive
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-bg)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {getMonthName(rep.report_month)} {rep.report_year}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        FINAL
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rep.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Report Presentation View */}
          {selectedReport && (
            <div className="portal-card" style={{ padding: '28px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedReport.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} />
                    <span>Period: {getMonthName(selectedReport.report_month)} {selectedReport.report_year}</span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Client: {selectedReport.company_name} &bull; Prepared by Zentra Digital Analytics Team
                </p>
              </div>

              {/* High-Impact Stat Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>Creatives Published</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedReport.content_published_count || 0}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
                    <Eye size={16} color="#3B82F6" />
                    <span>Total Impressions & Reach</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {(selectedReport.reach_total || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
                    <ThumbsUp size={16} color="#EC4899" />
                    <span>Engagements</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {(selectedReport.engagement_total || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
                    <Users size={16} color="#F59E0B" />
                    <span>Leads Generated</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedReport.leads_generated || 0}
                  </div>
                </div>
              </div>

              {/* Detailed Qualitative Analysis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {selectedReport.work_completed && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--accent-blue)" />
                      Key Deliverables & Work Completed
                    </h4>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
                      {selectedReport.work_completed}
                    </div>
                  </div>
                )}

                {selectedReport.best_content_summary && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="#F59E0B" />
                      Top Performing Content & Wins
                    </h4>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
                      {selectedReport.best_content_summary}
                    </div>
                  </div>
                )}

                {selectedReport.recommendations && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart3 size={16} color="#10B981" />
                      Agency Strategic Recommendations
                    </h4>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
                      {selectedReport.recommendations}
                    </div>
                  </div>
                )}

                {selectedReport.upcoming_plan && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowRight size={16} color="var(--accent-blue)" />
                      Action Plan for Next Month
                    </h4>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
                      {selectedReport.upcoming_plan}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
