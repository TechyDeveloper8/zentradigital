import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  UserCheck, Plus, Shield, Briefcase, Mail, Phone, Calendar,
  Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Multi-section employee creation state (Section 7 & 53)
  const [formSection, setFormSection] = useState(1);
  const [newEmp, setNewEmp] = useState({
    // Section 1: Personal Information
    first_name: '',
    last_name: '',
    phone: '',
    dob: '',
    gender: 'Male',
    city: '',
    state: '',
    // Section 2: Employment Information
    department_id: '',
    designation: 'Sales Executive',
    employee_type: 'Sales Executive',
    date_of_joining: new Date().toISOString().split('T')[0],
    work_location: 'Headquarters',
    employment_status: 'Active',
    // Section 3: Account Information
    username: '',
    official_email: '',
    password: 'Admin@123',
    role_name: 'sales',
    // Section 4: Working Configuration
    shift_start: '09:30',
    shift_end: '18:30',
    check_in_required: 1,
    check_out_required: 1,
    daily_report_required: 1
  });

  useEffect(() => {
    loadEmployees();
    api.get('/employees/departments').then(res => setDepartments(res || [])).catch(e => console.error(e));
    api.get('/employees/roles').then(res => setRoles(res || [])).catch(e => console.error(e));
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    api.get('/employees')
      .then(res => setEmployees(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmp);
      setShowAddModal(false);
      setFormSection(1);
      setNewEmp({
        first_name: '', last_name: '', phone: '', dob: '', gender: 'Male', city: '', state: '',
        department_id: '', designation: 'Sales Executive', employee_type: 'Sales Executive',
        date_of_joining: new Date().toISOString().split('T')[0], work_location: 'Headquarters',
        employment_status: 'Active', username: '', official_email: '', password: 'Admin@123',
        role_name: 'sales', shift_start: '09:30', shift_end: '18:30', check_in_required: 1,
        check_out_required: 1, daily_report_required: 1
      });
      loadEmployees();
    } catch (err) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const handleDeactivate = async (emp) => {
    if (!confirm(`Are you sure you want to deactivate ${emp.first_name} ${emp.last_name}? Their login will be disabled while preserving historical records.`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      loadEmployees();
    } catch (err) {
      alert(err.message || 'Deactivation failed');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Employees & Workforce Directory
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Manage staff members, role permissions, shifts, and daily reporting configurations.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Employee
        </button>
      </div>

      {/* Employee Directory Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading employees from database...</div>
      ) : employees.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No employees found</h3>
          <p>Create staff accounts to assign clients, tasks, and attendance tracking.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Department & Role</th>
                <th>Work Email & Phone</th>
                <th>Shift Times</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>{emp.employee_code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>@{emp.username}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{emp.designation}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{emp.department_name || 'General'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{emp.official_email}</div>
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{emp.phone || 'No phone'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#D1D5DB' }}>{emp.shift_start} - {emp.shift_end}</div>
                    <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Daily Report: {emp.daily_report_required ? 'Required' : 'No'}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${emp.employment_status === 'Active' ? 'green' : 'gray'}`}>
                      {emp.employment_status}
                    </span>
                  </td>
                  <td>
                    {emp.employment_status === 'Active' && emp.user_id !== 1 && (
                      <button
                        onClick={() => handleDeactivate(emp)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11.5px', color: '#F87171' }}
                        title="Deactivate Employee"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Multi-Section Add Employee Modal (Section 7 & 53) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Add New Employee</h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  Section {formSection} of 4: {formSection === 1 ? 'Personal Information' : (formSection === 2 ? 'Employment Profile' : (formSection === 3 ? 'Account & Security' : 'Working Configuration'))}
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Section Progress Bar */}
            <div style={{ display: 'flex', height: '4px', backgroundColor: '#1F2937' }}>
              <div style={{ width: `${(formSection / 4) * 100}%`, backgroundColor: '#3B82F6', transition: 'width 0.2s' }} />
            </div>

            <form onSubmit={formSection === 4 ? handleCreateEmployee : (e) => { e.preventDefault(); setFormSection(formSection + 1); }}>
              <div className="modal-body">
                {/* Section 1: Personal Information */}
                {formSection === 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Rahul"
                        value={newEmp.first_name}
                        onChange={e => setNewEmp({ ...newEmp, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Sharma"
                        value={newEmp.last_name}
                        onChange={e => setNewEmp({ ...newEmp, last_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="+91 9876543210"
                        value={newEmp.phone}
                        onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-control"
                        value={newEmp.gender}
                        onChange={e => setNewEmp({ ...newEmp, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mumbai"
                        value={newEmp.city}
                        onChange={e => setNewEmp({ ...newEmp, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Maharashtra"
                        value={newEmp.state}
                        onChange={e => setNewEmp({ ...newEmp, state: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Section 2: Employment Profile */}
                {formSection === 2 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        value={newEmp.department_id}
                        onChange={e => setNewEmp({ ...newEmp, department_id: e.target.value })}
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Marketing Manager, Video Editor, etc."
                        value={newEmp.designation}
                        onChange={e => setNewEmp({ ...newEmp, designation: e.target.value, employee_type: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Joining *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={newEmp.date_of_joining}
                        onChange={e => setNewEmp({ ...newEmp, date_of_joining: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select
                        className="form-control"
                        value={newEmp.employment_status}
                        onChange={e => setNewEmp({ ...newEmp, employment_status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Probation">Probation</option>
                        <option value="Notice Period">Notice Period</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Section 3: Account Credentials */}
                {formSection === 3 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="rahul_marketing"
                        value={newEmp.username}
                        onChange={e => setNewEmp({ ...newEmp, username: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Official Work Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        placeholder="rahul@zentradigital.com"
                        value={newEmp.official_email}
                        onChange={e => setNewEmp({ ...newEmp, official_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">System Role *</label>
                      <select
                        className="form-control"
                        value={newEmp.role_name}
                        onChange={e => setNewEmp({ ...newEmp, role_name: e.target.value })}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.name}>{r.display_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temporary Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        placeholder="••••••••••••"
                        value={newEmp.password}
                        onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Section 4: Working Configuration */}
                {formSection === 4 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Shift Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newEmp.shift_start}
                        onChange={e => setNewEmp({ ...newEmp, shift_start: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Shift End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={newEmp.shift_end}
                        onChange={e => setNewEmp({ ...newEmp, shift_end: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Attendance Tracking</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={!!newEmp.check_in_required}
                            onChange={e => setNewEmp({ ...newEmp, check_in_required: e.target.checked ? 1 : 0 })}
                          /> Check-in Required
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Work Reporting</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={!!newEmp.daily_report_required}
                            onChange={e => setNewEmp({ ...newEmp, daily_report_required: e.target.checked ? 1 : 0 })}
                          /> Daily Report Required
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {formSection > 1 && (
                  <button type="button" onClick={() => setFormSection(formSection - 1)} className="btn btn-secondary">
                    ← Back
                  </button>
                )}
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {formSection === 4 ? 'Save Employee to Database' : 'Next Step →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
