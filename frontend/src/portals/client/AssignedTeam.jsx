import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Users, MessageSquare, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export default function AssignedTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current client's detail
    api.get('/clients')
      .then(async (clients) => {
        if (clients && clients.length > 0) {
          const detail = await api.get(`/clients/${clients[0].id}`);
          setTeam(detail.team || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            My Dedicated Agency Team
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Specialists directly managing your brand strategy, creative editing, and growth campaigns.
          </p>
        </div>

        <button onClick={() => navigate('/client/chat')} className="btn btn-primary">
          <MessageSquare size={16} /> Open Team Chat
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading assigned staff members...</div>
      ) : team.length === 0 ? (
        <div className="table-container empty-state">
          <h3>Your dedicated team is being assembled</h3>
          <p>Your agency director will assign your Marketing Manager and Creative Lead shortly.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {team.map(m => (
            <div
              key={m.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '18px'
                  }}>
                    {m.first_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#F9FAFB' }}>
                      {m.first_name} {m.last_name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#60A5FA', fontWeight: 600 }}>
                      {m.employee_role}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12.5px', color: '#D1D5DB', marginBottom: '12px' }}>
                  <strong>Responsibilities:</strong> {m.responsibilities || 'Strategic management & creative delivery'}
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => navigate('/client/chat')}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  <MessageSquare size={15} /> Message {m.first_name}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
