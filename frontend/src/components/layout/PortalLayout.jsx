import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import {
  LayoutDashboard, Users, UserCheck, Briefcase, Calendar, CheckSquare,
  FileText, MessageSquare, Bell, Settings, LogOut, Search, Clock,
  FolderOpen, BarChart3, Shield, Menu, X, ArrowUpRight,
  TrendingUp, Award, Layers, AlertCircle
} from 'lucide-react';

export default function PortalLayout({ children }) {
  const { user, employee, client, attendance, logout, refreshAttendance, isAdmin, isEmployee, isClient } = useAuth();
  const { incomingMessage, incomingNotification } = useSocket();
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
  }, [incomingNotification, location.pathname]);

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

  // Nav menus by role
  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/sales', label: 'Sales Command Hub', icon: TrendingUp },
    { to: '/admin/leads', label: 'Leads & Pipeline', icon: TrendingUp },
    { to: '/admin/clients', label: 'Clients Directory', icon: Users },
    { to: '/admin/projects', label: 'Projects', icon: Briefcase },
    { to: '/admin/employees', label: 'Employees', icon: UserCheck },
    { to: '/admin/attendance', label: 'Attendance Hub', icon: Clock },
    { to: '/admin/employee-analytics', label: 'Employee Analytics', icon: BarChart3 },
    { to: '/admin/tasks', label: 'Tasks Board', icon: CheckSquare },
    { to: '/admin/calendar', label: 'Content Calendar', icon: Calendar },
    { to: '/admin/requests', label: 'Client Requests', icon: AlertCircle },
    { to: '/admin/reviews', label: 'Reviews & Approvals', icon: Award },
    { to: '/admin/chat', label: 'Team Communication', icon: MessageSquare },
    { to: '/admin/documents', label: 'Documents & Assets', icon: FolderOpen },
    { to: '/admin/settings', label: 'Agency Settings', icon: Settings }
  ];

  const salesNav = [
    { to: '/sales', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { header: 'CRM' },
    { to: '/sales?view=leads', label: 'Leads', icon: TrendingUp },
    { to: '/sales?view=my_leads', label: 'My Leads', icon: UserCheck },
    { to: '/sales?view=follow_ups', label: 'Follow-ups', icon: Clock },
    { to: '/sales?view=meetings', label: 'Meetings', icon: Calendar },
    { to: '/sales?view=proposals', label: 'Proposals', icon: FileText },
    { to: '/sales?view=pipeline', label: 'Sales Pipeline', icon: Layers },
    { header: 'Clients' },
    { to: '/sales?view=clients', label: 'My Clients', icon: Users },
    { to: '/sales?view=handover', label: 'Client Handover', icon: ArrowUpRight },
    { header: 'Reports' },
    { to: '/sales?view=reports', label: 'My Sales Report', icon: BarChart3 },
    { to: '/employee/daily-report', label: 'Daily Work Report', icon: FileText },
    { header: 'Attendance' },
    { to: '/employee/attendance', label: 'Attendance Hub', icon: Clock },
    { header: 'Communication' },
    { to: '/admin/chat', label: 'Team Chat', icon: MessageSquare }
  ];

  const employeeNav = [
    { to: '/employee', label: 'My Dashboard', icon: LayoutDashboard, end: true },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/employee/calendar', label: 'Content Calendar', icon: Calendar },
    { to: '/employee/clients', label: 'My Clients', icon: Users },
    { to: '/employee/daily-report', label: 'Daily Work Report', icon: FileText },
    { to: '/employee/attendance', label: 'My Attendance', icon: Clock },
    { to: '/employee/chat', label: 'Team Chat', icon: MessageSquare }
  ];

  const clientNav = [
    { to: '/client', label: 'Client Dashboard', icon: LayoutDashboard, end: true },
    { to: '/client/services', label: 'My Services', icon: Layers },
    { to: '/client/calendar', label: 'Content Calendar', icon: Calendar },
    { to: '/client/daily-updates', label: "Today's Updates", icon: Clock },
    { to: '/client/reviews', label: 'Review & Approvals', icon: Award },
    { to: '/client/requests', label: 'Request Center', icon: AlertCircle },
    { to: '/client/team', label: 'Assigned Team', icon: Users },
    { to: '/client/chat', label: 'Agency Chat', icon: MessageSquare },
    { to: '/client/files', label: 'Files & Assets', icon: FolderOpen },
    { to: '/client/reports', label: 'Monthly Reports', icon: BarChart3 }
  ];

  const isSalesPortal = location.pathname.startsWith('/sales') || (user?.role_name === 'sales' && !isAdmin);
  const navItems = isSalesPortal ? salesNav : (isAdmin ? adminNav : (isClient ? clientNav : employeeNav));

  return (
    <div className="portal-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F9FAFB', width: '100%' }}>
      {/* Sidebar Navigation */}
      <aside
        className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          backgroundColor: '#0d121f',
          borderRight: '1px solid #1F2937',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 40
        }}
      >
        <div style={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Shield size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#F9FAFB' }}>
              ZENTRA OS
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#9CA3AF' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Persona Profile Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#0a0e1a' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F4F6' }}>
            {employee ? `${employee.first_name} ${employee.last_name}` : (client?.company_name || user?.username)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isAdmin ? 'rgba(59, 130, 246, 0.2)' : (isClient ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)'),
              color: isAdmin ? '#60A5FA' : (isClient ? '#34D399' : '#A78BFA'),
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {user?.role_display || user?.role_name}
            </span>
            {employee?.designation && (
              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                • {employee.designation}
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div style={{ padding: '12px 0', flex: 1 }}>
          <div className="nav-section-title">
            {isSalesPortal ? 'Sales Command Center' : (isAdmin ? 'Agency Operations' : (isClient ? 'Client Portal' : 'Workspace'))}
          </div>
          {navItems.map((item, idx) => {
            if (item.header) {
              return (
                <div
                  key={`header-${idx}`}
                  style={{
                    padding: '12px 20px 4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    letterSpacing: '0.08em'
                  }}
                >
                  {item.header}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Sidebar Footer Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="nav-item"
            style={{ color: '#EF4444' }}
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden', backgroundColor: '#0B0F19', minHeight: '100vh' }}>
        {/* Top Navbar */}
        <header className="portal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
            >
              <Menu size={22} />
            </button>

            {/* Global Search Bar (Section 41) */}
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Search clients, leads, tasks, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length) setSearchOpen(true); }}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />

              {/* Search Dropdown Results */}
              {searchOpen && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '100%',
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  overflow: 'hidden'
                }}>
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        if (r.type === 'client') navigate(isAdmin ? `/admin/clients` : '/client');
                        else if (r.type === 'lead') navigate('/admin/leads');
                        else if (r.type === 'task') navigate(isAdmin ? '/admin/tasks' : '/employee/tasks');
                        else if (r.type === 'content') navigate(isAdmin ? '/admin/calendar' : '/employee/calendar');
                        else if (r.type === 'request') navigate(isAdmin ? '/admin/requests' : '/client/requests');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#374151'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F9FAFB' }}>{r.title}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.code} • {r.subtitle}</div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#111827',
                        color: '#60A5FA',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}>
                        {r.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Real-time Time Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: '#9CA3AF',
              background: '#111827',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <Clock size={14} color="#60A5FA" />
              <span>{clockTime}</span>
            </div>

            {/* Attendance Widget for Employees (Section 26) */}
            {isEmployee && !isClient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {attendance?.check_in_time && !attendance?.check_out_time ? (
                  <button
                    onClick={handleCheckOut}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', borderColor: '#EF4444', color: '#F87171' }}
                    title={`Checked in at ${attendance.check_in_time}`}
                  >
                    Check Out ({attendance.check_in_time})
                  </button>
                ) : attendance?.check_out_time ? (
                  <span className="status-badge green" style={{ fontSize: '11.5px' }}>
                    Completed ({attendance.total_working_hours}h)
                  </span>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="btn btn-success"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Check In
                  </button>
                )}
              </div>
            )}

            {/* Notification Bell Dropdown (Section 32) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unreadCount > 0 ? '#60A5FA' : '#9CA3AF',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#EF4444',
                    color: '#fff',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 60,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F9FAFB' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #374151',
                            backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)'
                          }}
                        >
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#F9FAFB' }}>{n.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#9CA3AF', margin: '2px 0 4px' }}>{n.message}</div>
                          <div style={{ fontSize: '10px', color: '#6B7280' }}>
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
              gap: '10px',
              padding: '4px 10px 4px 4px',
              background: '#111827',
              borderRadius: '9999px',
              border: '1px solid #374151'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#3B82F6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px'
              }}>
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#F3F4F6' }}>
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="portal-content" style={{ padding: '28px', flex: 1, backgroundColor: '#0B0F19', minHeight: 'calc(100vh - 68px)', color: '#F9FAFB' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
