import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { FileText, Plus, CheckCircle2, Clock, Trash2, Save } from 'lucide-react';

export default function DailyWorkReport() {
  const [report, setReport] = useState(null);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    remarks: '',
    challenges: 'None',
    tomorrows_plan: 'Continue production of scheduled creatives.',
    entries: [
      {
        client_id: '',
        task_id: '',
        work_category: 'Creative Production',
        work_description: '',
        hours_worked: 4,
        deliverable_output: '',
        client_visible: 1
      }
    ]
  });

  useEffect(() => {
    loadTodayReport();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
    api.get('/tasks').then(res => setTasks(res || [])).catch(e => console.error(e));
  }, []);

  const loadTodayReport = () => {
    setLoading(true);
    api.get('/daily-reports/my-today')
      .then(res => {
        if (res.report) {
          setReport(res.report);
          setForm({
            report_date: res.report.report_date,
            remarks: res.report.remarks || '',
            challenges: res.report.challenges || '',
            tomorrows_plan: res.report.tomorrows_plan || '',
            entries: res.entries.length > 0 ? res.entries : form.entries
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const addEntry = () => {
    setForm({
      ...form,
      entries: [
        ...form.entries,
        {
          client_id: '',
          task_id: '',
          work_category: 'Creative Production',
          work_description: '',
          hours_worked: 2,
          deliverable_output: '',
          client_visible: 1
        }
      ]
    });
  };

  const removeEntry = (index) => {
    if (form.entries.length <= 1) return;
    setForm({
      ...form,
      entries: form.entries.filter((_, i) => i !== index)
    });
  };

  const updateEntry = (index, field, value) => {
    const updated = [...form.entries];
    updated[index][field] = value;
    setForm({ ...form, entries: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/daily-reports', form);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      loadTodayReport();
    } catch (err) {
      alert(err.message || 'Failed to submit daily report');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Daily Work Report Submission
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Mandatory end-of-day deliverable log detailing hours worked, outputs generated, and tomorrow's plan.
          </p>
        </div>

        {submitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> Submitted to management!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Deliverable Entries for {form.report_date}</h3>
            <button type="button" onClick={addEntry} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <Plus size={14} /> Add Deliverable Entry
            </button>
          </div>

          {form.entries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA' }}>Entry #{idx + 1}</span>
                {form.entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Client Association</label>
                  <select
                    className="form-control"
                    value={entry.client_id || ''}
                    onChange={e => updateEntry(idx, 'client_id', e.target.value)}
                  >
                    <option value="">-- General Agency Work --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Work Category</label>
                  <select
                    className="form-control"
                    value={entry.work_category}
                    onChange={e => updateEntry(idx, 'work_category', e.target.value)}
                  >
                    <option value="Creative Production">Creative Production</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Copywriting">Copywriting</option>
                    <option value="Client Strategy">Client Strategy</option>
                    <option value="Ad Campaign Optimization">Ad Campaign Optimization</option>
                    <option value="Client Communication">Client Communication</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    required
                    value={entry.hours_worked}
                    onChange={e => updateEntry(idx, 'hours_worked', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Deliverable Output & Description *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Designed 2 Instagram reels and finalized carousel graphics for festive campaign"
                  value={entry.work_description}
                  onChange={e => updateEntry(idx, 'work_description', e.target.value)}
                />
              </div>
            </div>
          ))}

          {/* Section 2: Summary, Challenges, Tomorrow's Plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '18px' }}>
            <div className="form-group">
              <label className="form-label">Challenges or Blockers Faced</label>
              <textarea
                rows={2}
                className="form-control"
                value={form.challenges}
                onChange={e => setForm({ ...form, challenges: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tomorrow's Planned Deliverables</label>
              <textarea
                rows={2}
                className="form-control"
                value={form.tomorrows_plan}
                onChange={e => setForm({ ...form, tomorrows_plan: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px', marginTop: '12px' }}>
            <Save size={16} /> Submit Daily Work Report
          </button>
        </div>
      </form>
    </div>
  );
}
