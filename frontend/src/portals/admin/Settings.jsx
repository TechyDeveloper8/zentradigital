import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Settings as SettingsIcon, Save, Building, Clock, Shield, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [org, setOrg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    api.get('/organization')
      .then(res => {
        setOrg(res.organization || {});
        setSettings(res.settings || {});
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/organization', org);
      await api.put('/organization/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading agency settings...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Agency Profile & Business Settings
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Configure agency credentials, tax numbers, standard shifts, and default approval policies.
          </p>
        </div>

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600, fontSize: '13px' }}>
            <CheckCircle2 size={16} /> Saved to database!
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        {/* Section 1: Agency Information */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Building size={18} color="#3B82F6" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Agency Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Agency Brand Name</label>
              <input
                type="text"
                className="form-control"
                value={org.name || ''}
                onChange={e => setOrg({ ...org, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Legal Registered Name</label>
              <input
                type="text"
                className="form-control"
                value={org.legal_name || ''}
                onChange={e => setOrg({ ...org, legal_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                className="form-control"
                value={org.email || ''}
                onChange={e => setOrg({ ...org, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Phone</label>
              <input
                type="text"
                className="form-control"
                value={org.phone || ''}
                onChange={e => setOrg({ ...org, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                value={org.gst_number || ''}
                onChange={e => setOrg({ ...org, gst_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-control"
                value={org.pan || ''}
                onChange={e => setOrg({ ...org, pan: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                value={org.city || ''}
                onChange={e => setOrg({ ...org, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <input
                type="text"
                className="form-control"
                value={org.currency || 'INR'}
                onChange={e => setOrg({ ...org, currency: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shift & Attendance Policies */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Clock size={18} color="#F59E0B" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Work Hours & Attendance Rules</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Default Office Start Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.office_start_time || '09:30'}
                onChange={e => setSettings({ ...settings, office_start_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Office End Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.office_end_time || '18:30'}
                onChange={e => setSettings({ ...settings, office_end_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Grace Period (Minutes before marked LATE)</label>
              <input
                type="number"
                className="form-control"
                value={settings.grace_period_minutes || 15}
                onChange={e => setSettings({ ...settings, grace_period_minutes: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
          <Save size={16} /> Save All Settings to Database
        </button>
      </form>
    </div>
  );
}
