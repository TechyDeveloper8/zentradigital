import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SocialMediaManagerDashboard from './SocialMediaManagerDashboard';
import VideoEditorDashboard from './VideoEditorDashboard';
import { ShieldCheck, Video, Share2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [adminPreviewRole, setAdminPreviewRole] = useState('marketing_manager');

  const role = user?.role_name;

  // Sales Executive has dedicated command hub
  if (role === 'sales') {
    return <Navigate to="/sales" replace />;
  }

  // Social Media Manager
  if (role === 'marketing_manager') {
    return <SocialMediaManagerDashboard />;
  }

  // Video Editor
  if (role === 'editor') {
    return <VideoEditorDashboard />;
  }

  // If Admin is visiting /employee, provide role preview switcher
  if (role === 'admin') {
    return (
      <div className="portal-inner-container">
        {/* Admin Preview Header */}
        <div style={{
          backgroundColor: '#1E1B4B',
          border: '1px solid #4338CA',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#A5B4FC" />
            <span style={{ fontSize: '13px', color: '#E0E7FF', fontWeight: 600 }}>
              Administrator Workspace Preview
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAdminPreviewRole('marketing_manager')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: adminPreviewRole === 'marketing_manager' ? '#3B82F6' : '#312E81',
                color: adminPreviewRole === 'marketing_manager' ? '#FFFFFF' : '#C7D2FE'
              }}
            >
              <Share2 size={14} /> Social Media Manager View
            </button>
            <button
              onClick={() => setAdminPreviewRole('editor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: adminPreviewRole === 'editor' ? '#3B82F6' : '#312E81',
                color: adminPreviewRole === 'editor' ? '#FFFFFF' : '#C7D2FE'
              }}
            >
              <Video size={14} /> Video Editor View
            </button>
          </div>
        </div>

        {adminPreviewRole === 'marketing_manager' ? (
          <SocialMediaManagerDashboard />
        ) : (
          <VideoEditorDashboard />
        )}
      </div>
    );
  }

  // Fallback to Social Media Manager view
  return <SocialMediaManagerDashboard />;
}
