import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Users, Plus, CheckCircle2, AlertCircle, Briefcase, FileText,
  Calendar, Award, MessageSquare, DollarSign, Clock, Shield,
  ArrowRight, ExternalLink, ChevronRight, UserCheck
} from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  // Selected client for 14-tab command center modal (Section 68)
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('Overview');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form states
  const [newClient, setNewClient] = useState({
    company_name: '',
    business_type: '',
    industry: '',
    website: '',
    city: '',
    state: '',
    primary_contact_name: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    billing_cycle: 'Monthly',
    portal_username: '',
    portal_password: 'Client@123'
  });

  const [assignment, setAssignment] = useState({
    employee_id: '',
    employee_role: 'Marketing Manager',
    responsibilities: 'Primary account strategist and content planner'
  });

  useEffect(() => {
    loadClients();
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
  }, []);

  const loadClients = () => {
    setLoading(true);
    api.get('/clients')
      .then(res => setClients(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const openClientDetail = async (clientId) => {
    setSelectedClientId(clientId);
    setLoadingDetail(true);
    setDetailTab('Overview');
    try {
      const data = await api.get(`/clients/${clientId}`);
      setClientDetail(data);
    } catch (err) {
      alert(err.message || 'Failed to load client details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setShowAddModal(false);
      setNewClient({
        company_name: '', business_type: '', industry: '', website: '',
        city: '', state: '', primary_contact_name: '', primary_contact_phone: '',
        primary_contact_email: '', billing_cycle: 'Monthly',
        portal_username: '', portal_password: 'Client@123'
      });
      loadClients();
    } catch (err) {
      alert(err.message || 'Failed to create client');
    }
  };

  const handleToggleOnboardingItem = async (itemKey, currentStatus) => {
    if (!selectedClientId) return;
    try {
      await api.put(`/clients/${selectedClientId}/onboarding/${itemKey}`, {
        is_completed: !currentStatus
      });
      openClientDetail(selectedClientId);
      loadClients();
    } catch (err) {
      alert(err.message || 'Failed to update onboarding checklist');
    }
  };

  const handleAssignEmployee = async (e) => {
    e.preventDefault();
    if (!selectedClientId || !assignment.employee_id) return;
    try {
      await api.post(`/clients/${selectedClientId}/assignments`, assignment);
      setShowAssignModal(false);
      openClientDetail(selectedClientId);
    } catch (err) {
      alert(err.message || 'Assignment failed');
    }
  };

  const tabs = [
    'Overview', 'Contacts', 'Onboarding Checklist', 'Services', 'Projects',
    'Assigned Team', 'Invoices', 'Contracts', 'Activity Timeline'
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Clients Command Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Manage client accounts, onboardings, assigned teams, service agreements, and deliverables.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Client
        </button>
      </div>

      {/* Clients Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading clients from database...</div>
      ) : clients.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No clients registered in database</h3>
          <p>Convert an existing qualified lead or create a new client account to start onboarding.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create First Client
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client Code</th>
                <th>Company Name</th>
                <th>Primary Contact</th>
                <th>Assigned Managers</th>
                <th>Onboarding Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>{c.client_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.company_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                      {c.city || 'Headquarters'} {c.industry ? `• ${c.industry}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{c.primary_contact_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                      {c.primary_contact_phone} • {c.primary_contact_email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                      MM: <span style={{ color: '#F9FAFB' }}>{c.marketing_manager_name || 'Unassigned'}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      Sales: {c.sales_person_name || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '70px',
                        height: '6px',
                        backgroundColor: '#374151',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${c.onboarding_total_count > 0 ? (c.onboarding_completed_count / c.onboarding_total_count) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: '#10B981'
                        }} />
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#10B981' }}>
                        {c.onboarding_completed_count}/{c.onboarding_total_count}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${c.status === 'ACTIVE' ? 'green' : (c.status === 'ONBOARDING' ? 'yellow' : 'gray')}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => openClientDetail(c.id)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                    >
                      Open Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comprehensive 14-Tab Client Detail Modal (Section 68) */}
      {selectedClientId && clientDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '950px', maxHeight: '92vh' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    {clientDetail.client.company_name}
                  </h3>
                  <span className="status-badge blue">{clientDetail.client.client_code}</span>
                  <span className={`status-badge ${clientDetail.client.status === 'ACTIVE' ? 'green' : 'yellow'}`}>
                    {clientDetail.client.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Primary Contact: {clientDetail.client.primary_contact_name} ({clientDetail.client.primary_contact_phone})
                </div>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs Header */}
            <div className="tabs-header" style={{ margin: '0 24px', borderBottom: '1px solid var(--border-color)' }}>
              {tabs.map(t => (
                <button
                  key={t}
                  className={`tab-btn ${detailTab === t ? 'active' : ''}`}
                  onClick={() => setDetailTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {/* Tab 1: Overview */}
              {detailTab === 'Overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ background: '#1F2937', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Active Projects</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{clientDetail.projects?.length || 0}</div>
                    </div>
                    <div style={{ background: '#1F2937', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Subscribed Services</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{clientDetail.services?.length || 0}</div>
                    </div>
                    <div style={{ background: '#1F2937', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Assigned Team</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{clientDetail.team?.length || 0}</div>
                    </div>
                    <div style={{ background: '#1F2937', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Onboarding Status</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', marginTop: '8px' }}>
                        {clientDetail.onboarding?.filter(o => o.is_completed).length} / {clientDetail.onboarding?.length} Complete
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '10px', padding: '18px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#F9FAFB' }}>Client Profile Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div><span style={{ color: '#9CA3AF' }}>Legal Name:</span> {clientDetail.client.legal_name || 'N/A'}</div>
                      <div><span style={{ color: '#9CA3AF' }}>Website:</span> {clientDetail.client.website || 'N/A'}</div>
                      <div><span style={{ color: '#9CA3AF' }}>City/State:</span> {clientDetail.client.city}, {clientDetail.client.state}</div>
                      <div><span style={{ color: '#9CA3AF' }}>Billing Cycle:</span> {clientDetail.client.billing_cycle}</div>
                      <div><span style={{ color: '#9CA3AF' }}>Marketing Manager:</span> {clientDetail.client.marketing_manager_name || 'None'}</div>
                      <div><span style={{ color: '#9CA3AF' }}>Portal Login:</span> {clientDetail.client.portal_username || 'Active'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contacts */}
              {detailTab === 'Contacts' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                    {clientDetail.contacts?.map(c => (
                      <div key={c.id} style={{ background: '#1F2937', padding: '14px', borderRadius: '10px', border: '1px solid #374151' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#60A5FA', margin: '2px 0 8px' }}>{c.designation}</div>
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>📞 {c.phone}</div>
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>✉️ {c.email}</div>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                          {c.can_approve_content ? <span className="status-badge green">Can Approve</span> : null}
                          {c.can_create_requests ? <span className="status-badge blue">Can Request</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Onboarding Checklist (Section 13) */}
              {detailTab === 'Onboarding Checklist' && (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>17-Point Client Onboarding Checklist</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                        Toggle completed items. When all items are complete, client status automatically advances to Active.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {clientDetail.onboarding?.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleOnboardingItem(item.item_key, item.is_completed)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: item.is_completed ? 'rgba(16, 185, 129, 0.08)' : '#1F2937',
                          border: `1px solid ${item.is_completed ? 'rgba(16, 185, 129, 0.3)' : '#374151'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={!!item.is_completed}
                            onChange={() => {}}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: item.is_completed ? '#34D399' : '#F9FAFB' }}>
                              {item.item_label}
                            </span>
                            {item.completed_at && (
                              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                Completed on {new Date(item.completed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`status-badge ${item.is_completed ? 'green' : 'gray'}`}>
                          {item.is_completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Assigned Team (Section 16) */}
              {detailTab === 'Assigned Team' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Dedicated Agency Team</h4>
                    <button onClick={() => setShowAssignModal(true)} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <Plus size={14} /> Assign Employee
                    </button>
                  </div>

                  {(!clientDetail.team || clientDetail.team.length === 0) ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>No employees assigned to this client yet.</p>
                      <button onClick={() => setShowAssignModal(true)} className="btn btn-primary">
                        Assign Marketing Manager or Editor
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                      {clientDetail.team.map(m => (
                        <div key={m.id} style={{ background: '#1F2937', padding: '16px', borderRadius: '10px', border: '1px solid #374151' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700
                            }}>
                              {m.first_name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name}</div>
                              <div style={{ fontSize: '12px', color: '#60A5FA' }}>{m.employee_role}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: '12px', fontSize: '12px', color: '#9CA3AF' }}>
                            {m.responsibilities || 'Account team member'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Services */}
              {detailTab === 'Services' && (
                <div>
                  {(!clientDetail.services || clientDetail.services.length === 0) ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>No active services subscribed yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {clientDetail.services.map(s => (
                        <div key={s.id} style={{ background: '#1F2937', padding: '14px', borderRadius: '10px', border: '1px solid #374151' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{s.service_name} ({s.package_name || 'Standard'})</div>
                              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Deliverables: {s.monthly_deliverables || 'Monthly creative suite'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>₹{Number(s.price).toLocaleString()} / {s.billing_cycle}</div>
                              <span className="status-badge green">{s.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Projects */}
              {detailTab === 'Projects' && (
                <div>
                  {(!clientDetail.projects || clientDetail.projects.length === 0) ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>No projects initiated for this client yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {clientDetail.projects.map(p => (
                        <div key={p.id} style={{ background: '#1F2937', padding: '14px', borderRadius: '10px', border: '1px solid #374151' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.project_name}</div>
                              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Code: {p.project_code} • PM: {p.manager_name || 'Unassigned'}</div>
                            </div>
                            <span className="status-badge blue">{p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: Invoices */}
              {detailTab === 'Invoices' && (
                <div>
                  {(!clientDetail.invoices || clientDetail.invoices.length === 0) ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>No invoices generated for this client yet.</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice Number</th>
                          <th>Total Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientDetail.invoices.map(inv => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 600, color: '#60A5FA' }}>{inv.invoice_number}</td>
                            <td style={{ fontWeight: 700 }}>₹{Number(inv.total).toLocaleString()}</td>
                            <td>{inv.due_date}</td>
                            <td>
                              <span className={`status-badge ${inv.payment_status === 'PAID' ? 'green' : 'red'}`}>
                                {inv.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 8: Activity Timeline (Section 67) */}
              {detailTab === 'Activity Timeline' && (
                <div>
                  {(!clientDetail.activity || clientDetail.activity.length === 0) ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>No audit activity recorded yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {clientDetail.activity.map(act => (
                        <div key={act.id} style={{ display: 'flex', gap: '14px', padding: '10px 0', borderBottom: '1px solid #1F2937' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', marginTop: '6px' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F9FAFB' }}>
                              {act.action} on {act.entity} (ID: {act.entity_id})
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {new Date(act.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedClientId(null)} className="btn btn-secondary">Close Command Center</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Create New Client Account</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Zenith Global"
                      value={newClient.company_name}
                      onChange={e => setNewClient({ ...newClient, company_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Healthcare, Retail"
                      value={newClient.industry}
                      onChange={e => setNewClient({ ...newClient, industry: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Contact Person *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={newClient.primary_contact_name}
                      onChange={e => setNewClient({ ...newClient, primary_contact_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="+91 9876543210"
                      value={newClient.primary_contact_phone}
                      onChange={e => setNewClient({ ...newClient, primary_contact_phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="priya@zenith.com"
                      value={newClient.primary_contact_email}
                      onChange={e => setNewClient({ ...newClient, primary_contact_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://zenith.com"
                      value={newClient.website}
                      onChange={e => setNewClient({ ...newClient, website: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portal Username (Client Login)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="zenith_client"
                      value={newClient.portal_username}
                      onChange={e => setNewClient({ ...newClient, portal_username: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portal Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Client@123"
                      value={newClient.portal_password}
                      onChange={e => setNewClient({ ...newClient, portal_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Client & Launch Onboarding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employee Modal (Section 16) */}
      {showAssignModal && selectedClientId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Assign Employee to Client</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAssignEmployee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select
                    className="form-control"
                    required
                    value={assignment.employee_id}
                    onChange={e => setAssignment({ ...assignment, employee_id: e.target.value })}
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Client Role *</label>
                  <select
                    className="form-control"
                    value={assignment.employee_role}
                    onChange={e => setAssignment({ ...assignment, employee_role: e.target.value })}
                  >
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Editor">Editor / Creative Team</option>
                    <option value="Sales">Sales Executive</option>
                    <option value="Account Manager">Account Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Responsibilities</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assignment.responsibilities}
                    onChange={e => setAssignment({ ...assignment, responsibilities: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
