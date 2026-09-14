import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart3, Users, CheckCircle2, Clock, Award, Shield } from 'lucide-react';

export default function EmployeeAnalytics() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/tasks'),
      api.get('/attendance/today')
    ]).then(([emps, tsks, att]) => {
      setEmployees(emps || []);
      setTasks(tsks || []);
      setAttendance(att?.records || []);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Workforce Productivity & Analytics
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Formula-driven metrics derived directly from task completion records, attendance logs, and turnaround hours.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Computing analytics from database...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {employees.map(emp => {
            const empTasks = tasks.filter(t => t.assigned_employee_id === emp.id);
            const completedTasks = empTasks.filter(t => t.status === 'COMPLETED');
            const completionRate = empTasks.length > 0 ? Math.round((completedTasks.length / empTasks.length) * 100) : 100;
            const attRec = attendance.find(a => a.id === emp.id);

            return (
              <div
                key={emp.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#F9FAFB' }}>
                        {emp.first_name} {emp.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#60A5FA' }}>
                        {emp.designation} • {emp.employee_code}
                      </div>
                    </div>
                    <span className={`status-badge ${attRec?.attendance_status === 'PRESENT' ? 'green' : 'gray'}`}>
                      {attRec?.attendance_status || 'NOT CHECKED IN'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                    <div style={{ background: '#1F2937', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Tasks Completed</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>
                        {completedTasks.length} / {empTasks.length}
                      </div>
                    </div>
                    <div style={{ background: '#1F2937', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Completion Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6' }}>
                        {completionRate}%
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', fontSize: '12px', color: '#9CA3AF' }}>
                    <strong>Work Shift:</strong> {emp.shift_start} - {emp.shift_end} ({emp.work_location})
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '11.5px', color: '#6B7280' }}>
                  Documented Formula: Completion Rate = (Completed Tasks / Total Assigned Tasks) * 100
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
