import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import {
  LayoutDashboard, Users, UserCheck, Briefcase, Calendar, CheckSquare,
  FileText, MessageSquare, Bell, Settings, LogOut, Search, Clock,
  FolderOpen, BarChart3, Shield, Menu, X, ArrowUpRight,
  TrendingUp, Award, Layers, AlertCircle, Video, Download, Hash, Send, Eye,
  Sparkles, RefreshCw
} from 'lucide-react';

export default function PortalLayout({ children }) {
  const { user, employee, client, attendance, logout, refreshAttendance, isAdmin, isEmployee, isClient } = useAuth();
  const { incomingMessage, incomingNotification, lastWorkflowEvent, lastAttendanceEvent, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [clockTime, setClockTime] = useState(new Date().toLocaleTimeString());

  // Real-time digital clock in header
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notifications
  const loadNotifications = () => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadNotifications();
  }, [incomingNotification, lastWorkflowEvent, lastAttendanceEvent, location.pathname]);

  // Global search debouncing
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delay = setTimeout(() => {
        api.get('/search', { q: searchQuery })
          .then(res => {
            setSearchResults(res.results || []);
            setSearchOpen(true);
          })
          .catch(err => console.error(err));
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, [searchQuery]);

  // Close sidebar drawer on route navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Handle Attendance Check-In / Check-Out
  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in');
      await refreshAttendance();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out');
      await refreshAttendance();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const handleClearAllRoleNotifications = async () => {
    try {
      await api.post('/notifications/clear-all-roles');
      setUnreadCount(0);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Nav menus strictly per user prompt
  const adminNav = [
    { header: 'Admin Control Center' },
    { to: '/admin?tab=approvals', label: '1. Multi-Stage Approval Inbox', icon: Award, isDefault: true },
    { to: '/admin?tab=media', label: '2. Raw Video & Distribution', icon: Video },
    { to: '/admin?tab=attendance', label: '3. Master Attendance Center', icon: Clock },
    { to: '/admin?tab=users', label: '4. User & Role Management', icon: Users },
    { to: '/admin?tab=rejections', label: '5. Global Audit & Rejection Logs', icon: AlertCircle },
    { header: 'Secondary Systems' },
    { to: '/sales', label: 'Sales Command Hub', icon: Layers },
    { to: '/admin/clients', label: 'Clients Directory', icon: Briefcase },
    { to: '/admin/calendar', label: 'Master Content Calendar', icon: Calendar },
    { to: '/admin/settings', label: 'Agency Settings', icon: Settings }
  ];

  const salesNav = [
    { header: 'Sales Executive Hub' },
    { to: '/sales?tab=attendance', label: '1. Personal Attendance Tracker', icon: Clock },
    { to: '/sales?tab=leads', label: '2. Lead Management', icon: Users, isDefault: true },
    { to: '/sales?tab=follow_ups', label: '3. Follow-ups Module', icon: Clock },
    { to: '/sales?tab=meetings', label: '4. Meetings Tracker', icon: Calendar },
    { to: '/sales?tab=dsr_tasks', label: '5. Daily Sales Report (DSR) & Tasks', icon: CheckSquare },
    { to: '/sales?tab=pipeline', label: '6. Pipeline Tracker', icon: Layers }
  ];

  const smmNav = [
    { header: 'SMM Content Command' },
    { to: '/employee?tab=attendance', label: '1. Personal Attendance Tracker', icon: Clock },
    { to: '/employee?tab=workflow_inbox', label: '2. Workflow Inbox (Passed Videos)', icon: Award, isDefault: true },
    { to: '/employee?tab=captions_hashtags', label: '3. Caption & Hashtag Editor', icon: Hash },
    { to: '/employee?tab=content_tasks', label: '4. Task Queue & Content View', icon: CheckSquare },
    { to: '/employee?tab=calendar', label: '5. Content Calendar View', icon: Calendar },
    { to: '/employee?tab=creatives', label: '6. Asset Repository', icon: FolderOpen }
  ];

  const editorNav = [
    { header: 'Video Production Hub' },
    { to: '/employee?tab=attendance', label: '1. Personal Attendance Tracker', icon: Clock },
    { to: '/employee?tab=tasks_raw', label: '2. Task Queue (Raw Footage & Tasks)', icon: CheckSquare, isDefault: true },
    { to: '/employee?tab=upload_video', label: '3. Download Raw & Upload Edited', icon: ArrowUpRight },
    { to: '/employee?tab=feedback_loop', label: '4. Workflow Inbox (Revisions)', icon: Award }
  ];

  const clientNav = [
    { header: 'Client Review Portal' },
    { to: '/client?tab=inspection', label: '1. Post Previewer (Video & Captions)', icon: Eye, isDefault: true },
    { to: '/client?tab=approvals', label: '2. Dual Action Approvals & Feedback', icon: Award },
    { to: '/client?tab=calendar', label: '3. Content Calendar View (Read-Only)', icon: Calendar }
  ];

  const employeeNav = [
    { to: '/employee', label: 'My Dashboard', icon: LayoutDashboard, end: true },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/employee/calendar', label: 'Content Calendar', icon: Calendar },
    { to: '/employee/attendance', label: 'My Attendance', icon: Clock }
  ];

  const isSalesPortal = location.pathname.startsWith('/sales') || (user?.role_name === 'sales' && !isAdmin);

  // Strict Role-Based Dynamic Navigation resolution
  let navItems;
  if (isAdmin) {
    navItems = adminNav;
  } else if (isSalesPortal) {
    navItems = salesNav;
  } else if (isClient) {
    navItems = clientNav;
  } else if (user?.role_name === 'marketing_manager') {
    navItems = smmNav;
  } else if (user?.role_name === 'editor') {
    navItems = editorNav;
  } else {
    navItems = employeeNav;
  }

  // Mobile Bottom Navigation Dock resolution (4 quick actions + 1 Menu button)
  const getBottomNavItems = () => {
    if (isAdmin) {
      return [
        { to: '/admin?tab=approvals', label: 'Approvals', icon: Award },
        { to: '/admin?tab=media', label: 'Media', icon: Video },
        { to: '/admin?tab=attendance', label: 'Attendance', icon: Clock },
        { to: '/admin?tab=users', label: 'Users', icon: Users },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    } else if (isSalesPortal) {
      return [
        { to: '/sales?tab=leads', label: 'Leads', icon: Users },
        { to: '/sales?tab=follow_ups', label: 'Follow-ups', icon: Clock },
        { to: '/sales?tab=meetings', label: 'Meetings', icon: Calendar },
        { to: '/sales?tab=pipeline', label: 'Pipeline', icon: Layers },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    } else if (isClient) {
      return [
        { to: '/client?tab=inspection', label: 'Preview', icon: Eye },
        { to: '/client?tab=approvals', label: 'Approvals', icon: Award },
        { to: '/client?tab=calendar', label: 'Calendar', icon: Calendar },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    } else if (user?.role_name === 'marketing_manager') {
      return [
        { to: '/employee?tab=workflow_inbox', label: 'Passed', icon: Award },
        { to: '/employee?tab=content_tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/employee?tab=captions_hashtags', label: 'Captions', icon: Hash },
        { to: '/employee?tab=calendar', label: 'Calendar', icon: Calendar },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    } else if (user?.role_name === 'editor') {
      return [
        { to: '/employee?tab=tasks_raw', label: 'Raw Tasks', icon: CheckSquare },
        { to: '/employee?tab=upload_video', label: 'Upload', icon: ArrowUpRight },
        { to: '/employee?tab=feedback_loop', label: 'Revisions', icon: Award },
        { to: '/employee?tab=attendance', label: 'Attendance', icon: Clock },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    } else {
      return [
        { to: '/employee', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/employee/tasks', label: 'Tasks', icon: CheckSquare },
        { to: '/employee/calendar', label: 'Calendar', icon: Calendar },
        { to: '/employee/attendance', label: 'Attendance', icon: Clock },
        { action: 'menu', label: 'Menu', icon: Menu }
      ];
    }
  };

  return (
    <div className="portal-container">
      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          className="portal-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="portal-layout-body" style={{ display: 'flex', flex: 1, minHeight: '100vh', width: '100%', position: 'relative' }}>
        {/* Sidebar Navigation (Off-canvas drawer on mobile, sticky on desktop) */}
        <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Logo / Brand Header */}
          <div style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            borderBottom: '1px solid #222222',
            background: '#141414',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #E50914 0%, #99050C 100%)',
                boxShadow: '0 0 14px rgba(229, 9, 20, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Shield size={17} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  ZENTRA <span style={{ color: '#E50914' }}>OS</span>
                </span>
                <span style={{ display: 'block', fontSize: '9.5px', color: '#71717A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Enterprise Operations
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              className="portal-sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Persona Profile Header in Drawer */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #222222', background: '#161616', flexShrink: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
              {employee ? `${employee.first_name} ${employee.last_name}` : (client?.company_name || user?.username)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(229, 9, 20, 0.15)',
                color: '#FF4D4D',
                border: '1px solid rgba(229, 9, 20, 0.4)',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {user?.role_display || user?.role_name}
              </span>
              {(employee?.employee_code || employee?.id) ? (
                <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600 }}>
                  • {employee.employee_code || `EMP-${employee.id}`}
                </span>
              ) : client?.client_code ? (
                <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600 }}>
                  • {client.client_code}
                </span>
              ) : null}
            </div>
          </div>

          {/* Navigation list */}
          <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
            {navItems.map((item, idx) => {
              if (item.header) {
                return (
                  <div
                    key={`header-${idx}`}
                    className="nav-section-title"
                  >
                    {item.header}
                  </div>
                );
              }
              const Icon = item.icon;
              const currentFull = location.pathname + location.search;
              const currentTabParam = new URLSearchParams(location.search).get('tab');
              const itemTabParam = item.to.includes('?tab=') ? new URLSearchParams(item.to.split('?')[1]).get('tab') : null;
              const isItemActive = itemTabParam
                ? (
                    location.pathname === item.to.split('?')[0] && (
                      currentTabParam === itemTabParam ||
                      (!currentTabParam && item.isDefault)
                    )
                  )
                : item.to.includes('?')
                  ? currentFull === item.to
                  : null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const active = isItemActive !== null ? isItemActive : isActive;
                    return `nav-item ${active ? 'active' : ''}`;
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer Logout */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #222222', background: '#111111', flexShrink: 0 }}>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(229, 9, 20, 0.08)',
                border: '1px solid rgba(229, 9, 20, 0.25)',
                color: '#FF6B6B',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={15} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="portal-main">
          {/* Top Navbar */}
          <header className="portal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              {/* Hamburger Button for Mobile Drawer */}
              <button
                className="portal-hamburger-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>

              {/* Global Search Bar */}
              <div className="portal-header-search">
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717A', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search assets, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Global Search Dropdown */}
                {searchOpen && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    zIndex: 70,
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSearchOpen(false);
                          if (res.link) navigate(res.link);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #242424',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#FFFFFF'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{res.title || res.name}</div>
                        <div style={{ fontSize: '10.5px', color: '#A1A1AA' }}>{res.type || res.category}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Tools: Clock, Attendance Toggle, Live Indicator, Notifications, User */}
            <div className="portal-header-tools">
              {/* Live Digital Clock (Hidden on very narrow mobile screens) */}
              <div
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: '#D4D4D8',
                  fontFamily: 'monospace'
                }}
                className="portal-clock-widget"
              >
                <Clock size={13} color="#E50914" />
                <span>{clockTime}</span>
              </div>

              {/* Real-Time WebSocket Sync Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                borderRadius: '8px',
                fontSize: '10.5px',
                color: isConnected ? '#34D399' : '#F87171',
                fontWeight: 700
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10B981' : '#EF4444'
                }} />
                <span style={{ display: 'none' }} className="status-text-expanded">{isConnected ? 'LIVE' : 'SYNCING'}</span>
              </div>

              {/* Quick Attendance Pill for Employees */}
              {employee && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px'
                }}>
                  {!attendance?.check_in_time ? (
                    <button
                      onClick={handleCheckIn}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#E50914',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      In
                    </button>
                  ) : !attendance?.check_out_time ? (
                    <button
                      onClick={handleCheckOut}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#374151',
                        color: '#F9FAFB',
                        border: '1px solid #4B5563',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Out
                    </button>
                  ) : (
                    <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 600 }}>
                      ✓ {attendance.total_working_hours}h
                    </span>
                  )}
                </div>
              )}

              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="View notifications"
                  style={{
                    position: 'relative',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    color: '#D4D4D8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#E50914',
                      color: '#fff',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      width: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(229, 9, 20, 0.6)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Menu */}
                {notifOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '125%',
                    right: 0,
                    width: '310px',
                    maxWidth: '90vw',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '12px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.9), 0 0 20px rgba(229, 9, 20, 0.15)',
                    zIndex: 60,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #262626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#141414'
                    }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>Workflow Notifications</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{ background: 'transparent', border: 'none', color: '#A1A1AA', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={handleClearAllRoleNotifications}
                          style={{
                            background: 'rgba(229, 9, 20, 0.15)',
                            border: '1px solid rgba(229, 9, 20, 0.4)',
                            color: '#FF4D4D',
                            fontSize: '10.5px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#71717A', fontSize: '12px' }}>
                          No workflow notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            style={{
                              padding: '10px 12px',
                              borderBottom: '1px solid #242424',
                              backgroundColor: n.is_read ? 'transparent' : 'rgba(229, 9, 20, 0.08)'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{n.title}</div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA', margin: '2px 0 3px' }}>{n.message}</div>
                            <div style={{ fontSize: '9.5px', color: '#71717A' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px 3px 3px',
                background: '#1A1A1A',
                borderRadius: '9999px',
                border: '1px solid #2A2A2A',
                flexShrink: 0
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E50914 0%, #99050C 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px'
                }}>
                  {(user?.username || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#FFFFFF', display: 'none' }} className="portal-username-label">
                  {user?.username}
                </span>
              </div>
            </div>
          </header>

          {/* Page Children Container (Mobile-first responsive padding with bottom dock clearance) */}
          <main className="portal-content">
            {children}
          </main>
        </div>
      </div>

      {/* Native-App Mobile Bottom Navigation Dock */}
      <nav className="portal-bottom-nav" aria-label="Mobile Navigation Dock">
        {getBottomNavItems().map((item, idx) => {
          const Icon = item.icon;
          if (item.action === 'menu') {
            return (
              <button
                key={`bottom-nav-${idx}`}
                className={`bottom-nav-item ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation drawer"
              >
                <Icon size={19} />
                <span className="bottom-nav-label">{sidebarOpen ? 'Close' : item.label}</span>
              </button>
            );
          }

          const currentFull = location.pathname + location.search;
          const currentTabParam = new URLSearchParams(location.search).get('tab');
          const itemTabParam = item.to.includes('?tab=') ? new URLSearchParams(item.to.split('?')[1]).get('tab') : null;
          const isActive = itemTabParam
            ? (location.pathname === item.to.split('?')[0] && currentTabParam === itemTabParam)
            : (currentFull === item.to || location.pathname === item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={19} />
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
