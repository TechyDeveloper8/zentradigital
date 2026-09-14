import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { CheckSquare, Clock, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    setLoading(true);
    api.get('/tasks')
      .then(res => setTasks(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            My Assigned Tasks
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Active production tasks, briefs, deadlines, and delivery handoffs.
          </p>
        </div>

        <button onClick={loadTasks} className="btn btn-secondary">
          Refresh Tasks
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No assigned tasks in your queue</h3>
          <p>Tasks assigned to you by your account manager will appear here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Code & Title</th>
                <th>Client</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#60A5FA', fontSize: '12px' }}>{t.task_code}</div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.task_title}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>{t.description}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.company_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.due_date}</div>
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
                      style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                      value={t.status}
                      onChange={e => handleUpdateStatus(t.id, e.target.value)}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN PROGRESS">IN PROGRESS</option>
                      <option value="WAITING">WAITING</option>
                      <option value="INTERNAL REVIEW">INTERNAL REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
