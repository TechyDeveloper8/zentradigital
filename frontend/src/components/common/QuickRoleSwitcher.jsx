import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Shield, Users, Video, Share2, Briefcase, Sparkles, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';

export default function QuickRoleSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [switchNotice, setSwitchNotice] = useState('');

  useEffect(() => {
    api.get('/auth/quick-users')
      .then(res => {
        if (Array.isArray(res)) setActiveUsers(res);
      })
      .catch(() => {});
  }, [user]);

  const roles = [
    {
      key: 'admin',
      label: 'Admin Control',
      sub: 'All Systems & Approvals',
      icon: Shield,
      path: '/admin',
      user: activeUsers.find(u => u.role_name === 'admin' || u.user_type === 'admin')
    },
    {
      key: 'sales',
      label: 'Sales Executive',
      sub: 'Leads, DSR & Pipeline',
      icon: Users,
      path: '/sales',
      user: activeUsers.find(u => u.role_name === 'sales')
    },
    {
      key: 'editor',
      label: 'Video Editor',
      sub: 'Raw Cut & Upload Loop',
      icon: Video,
      path: '/employee?tab=tasks_raw',
      user: activeUsers.find(u => u.role_name === 'editor')
    },
    {
      key: 'marketing_manager',
      label: 'SMM Manager',
      sub: 'Captions & Post Approval',
      icon: Share2,
      path: '/employee?tab=content_tasks',
      user: activeUsers.find(u => u.role_name === 'marketing_manager')
    },
    {
      key: 'client',
      label: 'Client Portal',
      sub: 'Preview & Split Feedback',
      icon: Briefcase,
      path: '/client',
      user: activeUsers.find(u => u.user_type === 'client' || u.role_name === 'client')
    }
  ];

  // Determine current active based on path and user
  const currentPath = location.pathname;
  let currentKey = 'admin';
  if (currentPath.startsWith('/sales') || user?.role_name === 'sales') {
    currentKey = 'sales';
  } else if (currentPath.startsWith('/client') || user?.role_name === 'client' || user?.user_type === 'client') {
    currentKey = 'client';
  } else if (user?.role_name === 'editor') {
    currentKey = 'editor';
  } else if (user?.role_name === 'marketing_manager') {
    currentKey = 'marketing_manager';
  } else if (user?.role_name === 'admin') {
    currentKey = 'admin';
  }

  const handleRoleClick = async (role) => {
    if (switching) return;
    setSwitchNotice('');

    // If role has no user account in database yet (e.g. fresh start)
    if (!role.user && role.key !== 'admin') {
      setSwitchNotice(`No active "${role.label}" account yet. Add an employee in Admin > Employees.`);
      setTimeout(() => setSwitchNotice(''), 4000);
      return;
    }

    setSwitching(true);
    try {
      const res = await switchRole(role.key);
      if (res.success) {
        navigate(role.path, { replace: true });
      } else if (res.error) {
        setSwitchNotice(res.error);
        setTimeout(() => setSwitchNotice(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSwitching(false), 300);
    }
  };

  return (
    <div className="quick-role-switcher-bar">
      {/* Label & Active Context */}
      <div className="quick-role-info">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            backgroundColor: 'rgba(229, 9, 20, 0.15)',
            border: '1px solid rgba(229, 9, 20, 0.4)',
            flexShrink: 0
          }}
        >
          <Sparkles size={12} color="#E50914" />
        </div>
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E50914', fontWeight: 700 }}>
            Role:
          </span>
          <span style={{ fontSize: '11.5px', color: '#D4D4D8', marginLeft: '5px', fontWeight: 600 }}>
            <strong style={{ color: '#FFFFFF' }}>{user?.username || 'admin'}</strong>
            <span style={{ color: '#71717A', marginLeft: '4px' }}>({user?.role_name || 'Admin'})</span>
          </span>
        </div>
      </div>

      {/* Role Tabs Horizontal Scroll on Mobile */}
      <div className="quick-role-pills">
        {roles.map(r => {
          const isActive = currentKey === r.key;
          const IconComp = r.icon;
          const hasAccount = !!r.user || r.key === 'admin';

          return (
            <button
              key={r.key}
              onClick={() => handleRoleClick(r)}
              disabled={switching}
              title={hasAccount ? `Switch to ${r.label} (${r.user?.username || 'admin'})` : `${r.label} not created yet. Add via Admin > Employees.`}
              className={`role-pill-btn ${isActive ? 'active' : ''}`}
              style={{
                opacity: hasAccount ? 1 : 0.65,
                borderStyle: hasAccount ? 'solid' : 'dashed'
              }}
            >
              <IconComp size={12} color={isActive ? '#E50914' : (hasAccount ? '#A1A1AA' : '#71717A')} />
              <span>{r.label}</span>
              {isActive && (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#E50914',
                    boxShadow: '0 0 6px #E50914'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Notice if clicked a role that has not been created yet */}
      {switchNotice && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '20px',
          marginTop: '6px',
          backgroundColor: '#1E1E1E',
          border: '1px solid #E50914',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={14} color="#E50914" />
          <span>{switchNotice}</span>
        </div>
      )}
    </div>
  );
}

