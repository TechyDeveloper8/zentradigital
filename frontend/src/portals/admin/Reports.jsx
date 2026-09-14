import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart3, Download, Plus, CheckCircle2, FileText, TrendingUp } from 'lucide-react';

export default function Reports() {
  const [adminData, setAdminData] = useState(null);
  const [clientReports, setClientReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newReport, setNewReport] = useState({
    client_id: '',
    report_month: new Date().getMonth() + 1,
    report_year: new Date().getFullYear(),
    title: `Monthly Growth Report - ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    work_completed: 'Published scheduled carousel series, optimized Meta campaign ad sets, delivered brand guidelines.',
    best_content_summary: 'Reel #4 achieved 24% higher reach and engagement than previous baseline.',
    recommendations: 'Scale paid budget by 20% on top converting Meta ad set; initiate LinkedIn outreach.',
    upcoming_plan: 'Focus on festive product launch creative suite and video interviews.',
    status: 'FINALIZED'
  });

  useEffect(() => {
    Promise.all([
      api.get('/reports/admin'),
      api.get('/reports/client-reports'),
      api.get('/clients')
    ]).then(([adm, cr, cls]) => {
      setAdminData(adm);
      setClientReports(cr || []);
      setClients(cls || []);
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports/client-reports', newReport);
      setShowAddModal(false);
      const cr = await api.get('/reports/client-reports');
      setClientReports(cr || []);
    } catch (err) {
      alert(err.message || 'Failed to create report');
    }
  };

  const handleExportCSV = () => {
    const m = adminData?.metrics || {};
    const csvContent = "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Total Leads,${m.total_leads || 0}\n` +
      `Converted Leads,${m.converted_leads || 0}\n` +
      `Active Clients,${m.active_clients || 0}\n` +
      `Active Projects,${m.active_projects || 0}\n` +
      `Monthly Revenue,${m.monthly_revenue || 0}\n` +
      `Outstanding Payments,${m.outstanding_payments || 0}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zentra_agency_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Agency Reporting & Client Summaries
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Operational metrics, lead conversions, financial summaries, and formalized monthly client reviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={15} /> Export Analytics CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={15} /> Generate Monthly Client Report
          </button>
        </div>
      </div>

      {/* Client Monthly Reports */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Formalized Client Monthly Reports</h3>
        {loading ? (
          <div style={{ padding: '20px', color: '#9CA3AF' }}>Loading reports...</div>
        ) : clientReports.length === 0 ? (
          <div className="table-container empty-state">
            <h3>No client reports finalized yet</h3>
            <p>Generate monthly growth reports summarizing deliverables and reach for client review.</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={16} /> Generate First Monthly Report
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Client</th>
                  <th>Period</th>
                  <th>Content Published</th>
                  <th>Total Reach</th>
                  <th>Engagement</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientReports.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.recommendations}</div>
                    </td>
                    <td><div style={{ fontWeight: 600 }}>{r.company_name}</div></td>
                    <td>{r.report_month}/{r.report_year}</td>
                    <td><span style={{ fontWeight: 700, color: '#60A5FA' }}>{r.content_published_count} posts</span></td>
                    <td><span style={{ fontWeight: 700, color: '#10B981' }}>{r.reach_total.toLocaleString()}</span></td>
                    <td>{r.engagement_total.toLocaleString()}</td>
                    <td><span className="status-badge green">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Generate Client Monthly Report</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateReport}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newReport.client_id}
                      onChange={e => setNewReport({ ...newReport, client_id: e.target.value })}
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Report Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={newReport.title}
                      onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Completed Summary</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    value={newReport.work_completed}
                    onChange={e => setNewReport({ ...newReport, work_completed: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Strategic Recommendations</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    value={newReport.recommendations}
                    onChange={e => setNewReport({ ...newReport, recommendations: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upcoming Month Plan</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    value={newReport.upcoming_plan}
                    onChange={e => setNewReport({ ...newReport, upcoming_plan: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Finalize & Publish Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
