import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  CheckSquare, Plus, Clock, AlertCircle, Calendar, User,
  Filter, ArrowRight, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    task_title: '',
    client_id: '',
    project_id: '',
    task_type: 'Creative Production',
    description: '',
    assigned_employee_id: '',
    reviewer_id: '',
    priority: 'MEDIUM',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    estimated_hours: 4,
    client_visible: 1,
    status: 'TODO'
  });

  useEffect(() => {
    loadTasks();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
    api.get('/employees').then(res => setEmployees(res || [])).catch(e => console.error(e));
    api.get('/projects').then(res => setProjects(res || [])).catch(e => console.error(e));
  }, [filterStatus, filterPriority, filterOverdue]);

  const loadTasks = () => {
    setLoading(true);
    const params = {};
    if (filterStatus !== 'ALL') params.status = filterStatus;
    if (filterPriority !== 'ALL') params.priority = filterPriority;
    if (filterOverdue) params.overdue = 'true';

    api.get('/tasks', params)
      .then(res => setTasks(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', newTask);
      setShowAddModal(false);
      setNewTask({
        task_title: '', client_id: '', project_id: '', task_type: 'Creative Production',
        description: '', assigned_employee_id: '', reviewer_id: '', priority: 'MEDIUM',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        estimated_hours: 4, client_visible: 1, status: 'TODO'
      });
      loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const statusOptions = ['TODO', 'IN PROGRESS', 'WAITING', 'INTERNAL REVIEW', 'CLIENT REVIEW', 'REVISION', 'COMPLETED'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Tasks Management Board
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Operational task queues, reviewer assignments, deadlines, and delivery workflows.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create Task
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
          <Filter size={15} /> Filters:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {statusOptions.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="URGENT">URGENT</option>
        </select>

        <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#F87171' }}>
          <input
            type="checkbox"
            checked={filterOverdue}
            onChange={e => setFilterOverdue(e.target.checked)}
          /> Only Overdue Tasks
        </label>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No tasks found</h3>
          <p>Create a task to assign work to video editors, designers, or marketing managers.</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create First Task
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code & Title</th>
                <th>Client / Project</th>
                <th>Type</th>
                <th>Assigned Staff</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status Stage</th>
                <th>Quick Advance</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#60A5FA', fontSize: '12px' }}>{t.task_code}</div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{t.task_title}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.company_name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{t.project_name || 'General Operations'}</div>
                  </td>
                  <td>
                    <span className="status-badge gray">{t.task_type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{t.assigned_employee_name || 'Unassigned'}</div>
                    {t.reviewer_name && (
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Reviewer: {t.reviewer_name}</div>
                    )}
                  </td>
                  <td>
                    <div style={{
                      fontWeight: 600,
                      color: (new Date(t.due_date) < new Date() && t.status !== 'COMPLETED') ? '#EF4444' : '#F9FAFB'
                    }}>
                      {t.due_date}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Est: {t.estimated_hours}h</div>
                  </td>
                  <td>
                    <span className={`status-badge ${t.priority === 'URGENT' ? 'red' : (t.priority === 'HIGH' ? 'yellow' : 'gray')}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${t.status === 'COMPLETED' ? 'green' : (t.status === 'IN PROGRESS' ? 'blue' : 'purple')}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '11.5px', width: 'auto' }}
                      value={t.status}
                      onChange={e => handleUpdateStatus(t.id, e.target.value)}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal (Section 18) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Create Operational Task</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Design 3 Diwali Instagram Carousels"
                    value={newTask.task_title}
                    onChange={e => setNewTask({ ...newTask, task_title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newTask.client_id}
                      onChange={e => setNewTask({ ...newTask, client_id: e.target.value })}
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project</label>
                    <select
                      className="form-control"
                      value={newTask.project_id}
                      onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                    >
                      <option value="">-- Optional Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Assign Employee</label>
                    <select
                      className="form-control"
                      value={newTask.assigned_employee_id}
                      onChange={e => setNewTask({ ...newTask, assigned_employee_id: e.target.value })}
                    >
                      <option value="">-- Select Assignee (Editor / Manager) --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reviewer</label>
                    <select
                      className="form-control"
                      value={newTask.reviewer_id}
                      onChange={e => setNewTask({ ...newTask, reviewer_id: e.target.value })}
                    >
                      <option value="">-- Select Reviewer --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={newTask.due_date}
                      onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={newTask.estimated_hours}
                      onChange={e => setNewTask({ ...newTask, estimated_hours: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Instructions</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Provide detailed instructions, creative briefs, brand colors, and copy requirements..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
