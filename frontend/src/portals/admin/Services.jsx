import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Layers, Plus, CheckCircle2, Clock, DollarSign } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newService, setNewService] = useState({
    client_id: '',
    service_name: 'Social Media Management',
    package_name: 'Growth Retainer',
    monthly_quantity: 1,
    sla: '48 hours turnaround for creatives',
    monthly_deliverables: '12 Carousels, 4 Reels, Daily Stories & Community Management',
    price: 45000,
    billing_cycle: 'Monthly',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadServices();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
  }, []);

  const loadServices = () => {
    setLoading(true);
    api.get('/services')
      .then(res => setServices(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', newService);
      setShowAddModal(false);
      loadServices();
    } catch (err) {
      alert(err.message || 'Failed to create service plan');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Client Services & Packages
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Configure active service subscriptions, SLAs, monthly deliverables, and pricing.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Client Service Plan
        </button>
      </div>

      {/* Services Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading service plans...</div>
      ) : services.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No service plans created yet</h3>
          <p>Subscribe clients to Social Media, Performance Marketing, SEO, or Creative Production plans.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add First Service Plan
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Client</th>
                <th>Package & Deliverables</th>
                <th>SLA</th>
                <th>Monthly Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#F9FAFB' }}>{s.service_name}</div>
                    <div style={{ fontSize: '11px', color: '#60A5FA' }}>{s.package_name || 'Standard'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.company_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{s.client_code}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', color: '#D1D5DB' }}>{s.monthly_deliverables}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{s.sla || '48h'}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>
                      ₹{Number(s.price).toLocaleString()} / {s.billing_cycle}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge green">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Add Client Service Plan</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateService}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newService.client_id}
                      onChange={e => setNewService({ ...newService, client_id: e.target.value })}
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Type *</label>
                    <select
                      className="form-control"
                      value={newService.service_name}
                      onChange={e => setNewService({ ...newService, service_name: e.target.value })}
                    >
                      <option value="Social Media Management">Social Media Management</option>
                      <option value="Content Creation">Content Creation</option>
                      <option value="Video Editing & Reels">Video Editing & Reels</option>
                      <option value="Paid Advertising (Meta & Google)">Paid Advertising (Meta & Google)</option>
                      <option value="Search Engine Optimization (SEO)">Search Engine Optimization (SEO)</option>
                      <option value="Website Maintenance">Website Maintenance</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Package Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Growth Booster, Enterprise Tier"
                      value={newService.package_name}
                      onChange={e => setNewService({ ...newService, package_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Retainer Price (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={newService.price}
                      onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Deliverables Summary</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. 15 Carousels, 6 Reels, Monthly Performance Report..."
                    value={newService.monthly_deliverables}
                    onChange={e => setNewService({ ...newService, monthly_deliverables: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Turnaround SLA</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 48 hours for drafts, 24 hours for minor revisions"
                    value={newService.sla}
                    onChange={e => setNewService({ ...newService, sla: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Subscribe Client to Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
