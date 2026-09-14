import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  TrendingUp, Plus, Phone, Calendar, UserCheck, CheckCircle2,
  AlertCircle, MessageSquare, Filter, ArrowRight, Clock, FileText
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pipelineCounts, setPipelineCounts] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form states
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_person: '',
    designation: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    industry: '',
    source: 'Website',
    requirement: '',
    budget_range: '₹50,000 - ₹1,00,000 / month',
    priority: 'MEDIUM',
    assigned_sales_employee_id: ''
  });

  const [followUp, setFollowUp] = useState({
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '14:00',
    contact_method: 'Phone',
    discussion_summary: '',
    client_requirement: '',
    next_action: '',
    next_follow_up_date: ''
  });

  useEffect(() => {
    loadLeads();
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
  }, [activeTab]);

  const loadLeads = () => {
    setLoading(true);
    const params = activeTab === 'ALL' ? {} : { status: activeTab };
    api.get('/leads', params)
      .then(res => {
        setLeads(res.leads || []);
        setPipelineCounts(res.pipelineCounts || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leads', newLead);
      setShowAddModal(false);
      setNewLead({
        company_name: '', contact_person: '', designation: '', phone: '',
        whatsapp: '', email: '', website: '', industry: '', source: 'Website',
        requirement: '', budget_range: '', priority: 'MEDIUM', assigned_sales_employee_id: ''
      });
      loadLeads();
    } catch (err) {
      alert(err.message || 'Failed to create lead');
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await api.post(`/leads/${selectedLead.id}/follow-ups`, followUp);
      setShowFollowUpModal(false);
      setFollowUp({
        follow_up_date: new Date().toISOString().split('T')[0],
        follow_up_time: '14:00',
        contact_method: 'Phone',
        discussion_summary: '',
        client_requirement: '',
        next_action: '',
        next_follow_up_date: ''
      });
      loadLeads();
    } catch (err) {
      alert(err.message || 'Failed to log follow-up');
    }
  };

  const handleConvertToClient = async (lead) => {
    if (!confirm(`Are you sure you want to convert "${lead.company_name}" into an active client and launch onboarding?`)) return;
    try {
      const res = await api.post(`/leads/${lead.id}/convert`);
      alert(`Success! Lead converted to Client [${res.client.client_code}] and 17-point onboarding checklist initialized.`);
      loadLeads();
    } catch (err) {
      alert(err.message || 'Conversion failed');
    }
  };

  const stages = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Leads & Sales Pipeline
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Track lead lifecycle from first inquiry through qualification, follow-ups, and client conversion.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Lead
        </button>
      </div>

      {/* Stage Tabs */}
      <div className="tabs-header">
        {stages.map(st => {
          const countItem = pipelineCounts.find(p => p.status === st);
          const count = countItem ? countItem.count : (st === 'ALL' ? leads.length : 0);
          return (
            <button
              key={st}
              className={`tab-btn ${activeTab === st ? 'active' : ''}`}
              onClick={() => setActiveTab(st)}
            >
              {st} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Leads Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading leads from database...</div>
      ) : leads.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No leads found in this pipeline stage</h3>
          <p>Create a new inquiry or modify pipeline filter to view records.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add First Lead
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead Code</th>
                <th>Company & Contact</th>
                <th>Source</th>
                <th>Requirement & Budget</th>
                <th>Assigned Sales</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>{lead.lead_code}</span>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{lead.lead_date}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{lead.company_name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {lead.contact_person} • {lead.phone}
                    </div>
                  </td>
                  <td>
                    <span className="status-badge gray">{lead.source}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{lead.requirement || 'Digital Marketing'}</div>
                    <div style={{ fontSize: '11px', color: '#10B981' }}>{lead.budget_range || 'Standard'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', color: '#D1D5DB' }}>
                      {lead.assigned_employee_name || 'Unassigned'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      lead.status === 'WON' ? 'green' :
                      (lead.status === 'NEW' ? 'blue' :
                      (lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION' ? 'purple' : 'yellow'))
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${lead.priority === 'URGENT' ? 'red' : (lead.priority === 'HIGH' ? 'yellow' : 'gray')}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Follow-up button */}
                      <button
                        onClick={() => { setSelectedLead(lead); setShowFollowUpModal(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        title="Log Follow-Up"
                      >
                        <Phone size={13} /> Follow-Up
                      </button>

                      {/* Convert to Client Button (Section 11) */}
                      {lead.status !== 'WON' && !lead.converted_client_id && (
                        <button
                          onClick={() => handleConvertToClient(lead)}
                          className="btn btn-success"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="Convert to Client"
                        >
                          <UserCheck size={13} /> Convert
                        </button>
                      )}

                      {lead.converted_client_code && (
                        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                          ✓ {lead.converted_client_code}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal (Section 9) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Apex Hospitalities"
                      value={newLead.company_name}
                      onChange={e => setNewLead({ ...newLead, company_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Rajesh Mehra"
                      value={newLead.contact_person}
                      onChange={e => setNewLead({ ...newLead, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="+91 9876543210"
                      value={newLead.phone}
                      onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Official Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="rajesh@apex.com"
                      value={newLead.email}
                      onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lead Source *</label>
                    <select
                      className="form-control"
                      value={newLead.source}
                      onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                    >
                      <option value="Website">Website</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Google">Google</option>
                      <option value="Referral">Referral</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget Range</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="₹50,000 - ₹1,00,000 / month"
                      value={newLead.budget_range}
                      onChange={e => setNewLead({ ...newLead, budget_range: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Sales Exec</label>
                    <select
                      className="form-control"
                      value={newLead.assigned_sales_employee_id}
                      onChange={e => setNewLead({ ...newLead, assigned_sales_employee_id: e.target.value })}
                    >
                      <option value="">-- Assign Automatically --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={newLead.priority}
                      onChange={e => setNewLead({ ...newLead, priority: e.target.value })}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Requirement Details</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Social Media management, reels production, and lead generation campaigns..."
                    value={newLead.requirement}
                    onChange={e => setNewLead({ ...newLead, requirement: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal (Section 10) */}
      {showFollowUpModal && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Record Follow-Up: {selectedLead.company_name}
              </h3>
              <button onClick={() => setShowFollowUpModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateFollowUp}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={followUp.follow_up_date}
                      onChange={e => setFollowUp({ ...followUp, follow_up_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Method *</label>
                    <select
                      className="form-control"
                      value={followUp.contact_method}
                      onChange={e => setFollowUp({ ...followUp, contact_method: e.target.value })}
                    >
                      <option value="Phone">Phone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Video Call">Video Call</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Discussion Summary *</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    required
                    placeholder="Discussed monthly retainer, package deliverables, and timeline..."
                    value={followUp.discussion_summary}
                    onChange={e => setFollowUp({ ...followUp, discussion_summary: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Next Action</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Send formal proposal by tomorrow"
                      value={followUp.next_action}
                      onChange={e => setFollowUp({ ...followUp, next_action: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Follow-Up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={followUp.next_follow_up_date}
                      onChange={e => setFollowUp({ ...followUp, next_follow_up_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Follow-Up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
