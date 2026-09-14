import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Briefcase, Plus, CheckCircle2, Clock, Users,
  FolderOpen, ArrowRight, Shield
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newProject, setNewProject] = useState({
    project_name: '',
    client_id: '',
    description: '',
    objective: 'Brand Growth & Performance Marketing',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    project_manager_id: '',
    priority: 'MEDIUM',
    budget: 100000,
    status: 'ACTIVE',
    client_visible: 1
  });

  useEffect(() => {
    loadProjects();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
  }, []);

  const loadProjects = () => {
    setLoading(true);
    api.get('/projects')
      .then(res => setProjects(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowAddModal(false);
      loadProjects();
    } catch (err) {
      alert(err.message || 'Failed to create project');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Projects Portfolio
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Active campaigns, branding sprints, and client deliverable initiatives.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading projects from database...</div>
      ) : projects.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No projects initiated yet</h3>
          <p>Create a project to group tasks, content, and client communication.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create First Project
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Code</th>
                <th>Project Name</th>
                <th>Client</th>
                <th>Project Manager</th>
                <th>Timeline</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>{p.project_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.project_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{p.objective}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.company_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{p.project_manager_name || 'Unassigned'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{p.start_date}</div>
                    {p.end_date && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>to {p.end_date}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', backgroundColor: '#374151', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${p.total_tasks > 0 ? (p.completed_tasks / p.total_tasks) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: '#3B82F6'
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{p.completed_tasks}/{p.total_tasks}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${p.status === 'ACTIVE' ? 'green' : 'blue'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Initiate New Project</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Q3 Brand Transformation & Reels Push"
                    value={newProject.project_name}
                    onChange={e => setNewProject({ ...newProject, project_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newProject.client_id}
                      onChange={e => setNewProject({ ...newProject, client_id: e.target.value })}
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Manager</label>
                    <select
                      className="form-control"
                      value={newProject.project_manager_id}
                      onChange={e => setNewProject({ ...newProject, project_manager_id: e.target.value })}
                    >
                      <option value="">-- Choose Project Manager --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={newProject.start_date}
                      onChange={e => setNewProject({ ...newProject, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newProject.end_date}
                      onChange={e => setNewProject({ ...newProject, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Objective</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Generate 200 qualified leads through paid Meta campaigns"
                    value={newProject.objective}
                    onChange={e => setNewProject({ ...newProject, objective: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
