import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Layers, CheckCircle2, Clock, Award, Shield } from 'lucide-react';

export default function ClientServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then(res => setServices(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            My Active Service Packages
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Overview of your subscribed marketing retainers, agreed deliverables, and service SLAs.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading service plans...</div>
      ) : services.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No service packages subscribed</h3>
          <p>Contact your account manager to activate your agency service package.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {services.map(s => (
            <div
              key={s.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="status-badge blue">{s.package_name || 'Active Package'}</span>
                  <span className="status-badge green">{s.status}</span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>
                  {s.service_name}
                </h3>

                <div style={{ background: '#1F2937', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Agreed Monthly Deliverables
                  </div>
                  <div style={{ fontSize: '13px', color: '#F9FAFB', lineHeight: '1.4' }}>
                    {s.monthly_deliverables || 'Monthly creative design and social distribution.'}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
                  <strong>Guaranteed SLA:</strong> {s.sla || '48 hours turnaround'}
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#9CA3AF' }}>Monthly Investment</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
                  ₹{Number(s.price).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
