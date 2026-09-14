import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Sparkles, Plus, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCamp, setNewCamp] = useState({
    campaign_name: '',
    client_id: '',
    objective: 'Lead Generation',
    platform: 'Meta (Instagram & Facebook)',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: 50000,
    target_audience: 'Founders, Directors, CMOs (Age 25-50)',
    location: 'Tier 1 Metro Cities (Mumbai, Delhi, Bengaluru)',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadCampaigns();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
  }, []);

  const loadCampaigns = () => {
    setLoading(true);
    api.get('/campaigns')
      .then(res => setCampaigns(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', newCamp);
      setShowAddModal(false);
      loadCampaigns();
    } catch (err) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Paid Campaigns & Performance Ads
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Oversee paid growth campaigns across Meta, Google Ads, and LinkedIn.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading campaigns from database...</div>
      ) : campaigns.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No ad campaigns launched yet</h3>
          <p>Plan a lead generation or brand awareness campaign for your clients.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create First Campaign
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Client</th>
                <th>Objective & Platform</th>
                <th>Budget Allocated</th>
                <th>Target Audience</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#F9FAFB' }}>{c.campaign_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>From {c.start_date} {c.end_date ? `to ${c.end_date}` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.company_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#60A5FA' }}>{c.platform}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.objective}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>
                      ₹{Number(c.budget).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#D1D5DB' }}>{c.target_audience}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{c.location}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${c.status === 'ACTIVE' ? 'green' : 'yellow'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Launch Ad Campaign</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Campaign Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Diwali Mega Sale Paid Conversion Ads"
                    value={newCamp.campaign_name}
                    onChange={e => setNewCamp({ ...newCamp, campaign_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newCamp.client_id}
                      onChange={e => setNewCamp({ ...newCamp, client_id: e.target.value })}
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ad Platform *</label>
                    <select
                      className="form-control"
                      value={newCamp.platform}
                      onChange={e => setNewCamp({ ...newCamp, platform: e.target.value })}
                    >
                      <option value="Meta (Instagram & Facebook)">Meta (Instagram & Facebook)</option>
                      <option value="Google Ads (Search & Display)">Google Ads (Search & Display)</option>
                      <option value="LinkedIn Ads">LinkedIn Ads</option>
                      <option value="YouTube Ads">YouTube Ads</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Objective</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newCamp.objective}
                      onChange={e => setNewCamp({ ...newCamp, objective: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ad Budget (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={newCamp.budget}
                      onChange={e => setNewCamp({ ...newCamp, budget: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={newCamp.start_date}
                      onChange={e => setNewCamp({ ...newCamp, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newCamp.end_date}
                      onChange={e => setNewCamp({ ...newCamp, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience Definition</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCamp.target_audience}
                    onChange={e => setNewCamp({ ...newCamp, target_audience: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
