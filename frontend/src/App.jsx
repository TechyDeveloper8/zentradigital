import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardPath } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Public & Landing
import MarketingLanding from './pages/MarketingLanding';
import Login from './pages/Login';

// Layout
import PortalLayout from './components/layout/PortalLayout';

// Admin Views
import AdminDashboard from './portals/admin/Dashboard';
import Leads from './portals/admin/Leads';
import Clients from './portals/admin/Clients';
import Projects from './portals/admin/Projects';
import Employees from './portals/admin/Employees';
import Attendance from './portals/admin/Attendance';
import EmployeeAnalytics from './portals/admin/EmployeeAnalytics';
import Tasks from './portals/admin/Tasks';
import ContentCalendar from './portals/admin/ContentCalendar';
import ClientRequests from './portals/admin/ClientRequests';
import Reviews from './portals/admin/Reviews';
import InternalChat from './portals/admin/InternalChat';
import DocumentsAssets from './portals/admin/DocumentsAssets';
import Settings from './portals/admin/Settings';

// Sales Portal Views
import SalesDashboard from './portals/sales/SalesDashboard';

// Employee Views
import EmployeeDashboard from './portals/employee/EmployeeDashboard';
import DailyWorkReport from './portals/employee/DailyWorkReport';
import MyTasks from './portals/employee/MyTasks';
import MyCalendar from './portals/employee/MyCalendar';

// Client Views
import ClientDashboard from './portals/client/ClientDashboard';
import ReviewApprovalCenter from './portals/client/ReviewApprovalCenter';
import ClientRequestCenter from './portals/client/ClientRequestCenter';
import ClientChat from './portals/client/ClientChat';
import DailyUpdates from './portals/client/DailyUpdates';
import AssignedTeam from './portals/client/AssignedTeam';
import ClientServices from './portals/client/ClientServices';
import ClientFiles from './portals/client/ClientFiles';
import ClientCalendar from './portals/client/ClientCalendar';
import ClientReports from './portals/client/ClientReports';

// Guard component to enforce authentication and role access
function ProtectedRoute({ children, allowedRoles, allowedUserTypes }) {
  const { user, token, loading } = useAuth();
  const effectiveToken = token || localStorage.getItem('zentra_token');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#070A13',
        color: '#94A3B8'
      }}>
        Loading session...
      </div>
    );
  }

  if (!effectiveToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(user.user_type) && user.role_name !== 'admin') {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<MarketingLanding />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />

            {/* Admin Portal (20 Modules) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><AdminDashboard /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/leads" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Leads /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/clients" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Clients /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Projects /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Employees /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Attendance /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/employee-analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><EmployeeAnalytics /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/tasks" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Tasks /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/calendar" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><ContentCalendar /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><ClientRequests /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Reviews /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/chat" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><InternalChat /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/documents" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><DocumentsAssets /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PortalLayout><Settings /></PortalLayout>
              </ProtectedRoute>
            } />

            {/* Sales Portal (Agency Revenue Engine & Command Center) */}
            <Route path="/sales" element={
              <ProtectedRoute allowedRoles={['sales', 'admin', 'marketing_manager']}>
                <PortalLayout><SalesDashboard /></PortalLayout>
              </ProtectedRoute>
            } />

            {/* Employee Portal (Role Adaptive) */}
            <Route path="/employee" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><EmployeeDashboard /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/tasks" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><MyTasks /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/calendar" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><MyCalendar /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/clients" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><Clients /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/daily-report" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><DailyWorkReport /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/attendance" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><Attendance /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/employee/chat" element={
              <ProtectedRoute allowedUserTypes={['employee']}>
                <PortalLayout><InternalChat /></PortalLayout>
              </ProtectedRoute>
            } />

            {/* Client Portal (WhatsApp-Free Dedicated Collaboration) */}
            <Route path="/client" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientDashboard /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/services" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientServices /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/calendar" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientCalendar /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/daily-updates" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><DailyUpdates /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/reviews" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ReviewApprovalCenter /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/requests" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientRequestCenter /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/team" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><AssignedTeam /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/chat" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientChat /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/files" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientFiles /></PortalLayout>
              </ProtectedRoute>
            } />
            <Route path="/client/reports" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <PortalLayout><ClientReports /></PortalLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
