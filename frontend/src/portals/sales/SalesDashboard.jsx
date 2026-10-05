import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Clock, Calendar, CheckSquare, Layers, UserCheck,
  Plus, RefreshCw, Sparkles, Shield, TrendingUp, DollarSign
} from 'lucide-react';

// Specialized Modules for the 6 Core Features
import LeadManagement from './components/LeadManagement';
import FollowUpsModule from './components/FollowUpsModule';
import MeetingsModule from './components/MeetingsModule';
import SalesTasksDSRModule from './components/SalesTasksDSRModule';
import PipelineManagement from './components/PipelineManagement';
import EmployeeAttendanceTracker from '../../components/attendance/EmployeeAttendanceTracker';

// Modals
import LeadFormModal from './components/LeadFormModal';
import FollowUpModal from './components/FollowUpModal';
import MeetingModal from './components/MeetingModal';
import SalesTaskModal from './components/SalesTaskModal';

export default function SalesDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State (strictly the 6 core features)
  const currentTab = searchParams.get('tab') || 'leads';
  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Live Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Modal Control States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedFollowUpForEdit, setSelectedFollowUpForEdit] = useState(null);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedMeetingForEdit, setSelectedMeetingForEdit] = useState(null);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);

  // Fetch all dashboard data
  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [leadsRes, followUpsRes, meetingsRes, tasksRes] = await Promise.all([
        api.get('/leads', { limit: 100 }).catch(err => { console.error(err); return { leads: [] }; }),
        api.get('/leads/follow-ups').catch(err => { console.error(err); return { followUps: [] }; }),
        api.get('/meetings').catch(err => { console.error(err); return { meetings: [] }; }),
        api.get('/sales/tasks').catch(err => { console.error(err); return { tasks: [] }; })
      ]);

      setLeads(leadsRes.leads || []);
      setFollowUps(followUpsRes.followUps || []);
      setMeetings(meetingsRes.meetings || []);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for Lead actions
  const handleOpenAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLead = (lead) => {
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleLeadSaved = (savedLead) => {
    setLeads(prev => {
      const exists = prev.some(l => l.id === savedLead.id);
      if (exists) {
        return prev.map(l => l.id === savedLead.id ? savedLead : l);
      }
      return [savedLead, ...prev];
    });
  };

  // Handlers for Follow-up actions
  const handleOpenAddFollowUp = (lead = null) => {
    setSelectedFollowUpForEdit(null);
    setSelectedLeadForFollowUp(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleOpenEditFollowUp = (followUp) => {
    setSelectedFollowUpForEdit(followUp);
    setSelectedLeadForFollowUp(null);
    setIsFollowUpModalOpen(true);
  };

  const handleFollowUpSaved = (savedFollowUp) => {
    setFollowUps(prev => {
      const exists = prev.some(f => f.id === savedFollowUp.id);
      if (exists) {
        return prev.map(f => f.id === savedFollowUp.id ? savedFollowUp : f);
      }
      return [savedFollowUp, ...prev];
    });
    loadAllData(true);
  };

  // Handlers for Meeting actions
  const handleOpenScheduleMeeting = (lead = null) => {
    setSelectedMeetingForEdit(null);
    setSelectedLeadForMeeting(lead);
    setIsMeetingModalOpen(true);
  };

  const handleOpenEditMeeting = (meeting) => {
    setSelectedMeetingForEdit(meeting);
    setSelectedLeadForMeeting(null);
    setIsMeetingModalOpen(true);
  };

  const handleMeetingSaved = (savedMeeting) => {
    setMeetings(prev => {
      const exists = prev.some(m => m.id === savedMeeting.id);
      if (exists) {
        return prev.map(m => m.id === savedMeeting.id ? savedMeeting : m);
      }
      return [savedMeeting, ...prev];
    });
    loadAllData(true);
  };

  // Handlers for Task actions
  const handleOpenAddTask = () => {
    setSelectedTaskForEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setSelectedTaskForEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = (savedTask) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === savedTask.id);
      if (exists) {
        return prev.map(t => t.id === savedTask.id ? savedTask : t);
      }
      return [savedTask, ...prev];
    });
  };



  // Navigation Tabs configuration: Strictly the 6 core features
  const tabsConfig = [
    {
      key: 'leads',
      label: 'Lead Management',
      count: leads.length,
      icon: Users,
      badgeColor: '#10B981'
    },
    {
      key: 'follow_ups',
      label: 'Follow-ups',
      count: followUps.filter(f => f.status === 'PENDING').length,
      icon: Clock,
      badgeColor: '#3B82F6'
    },
    {
      key: 'meetings',
      label: 'Meetings',
      count: meetings.filter(m => m.status === 'SCHEDULED').length,
      icon: Calendar,
      badgeColor: '#F59E0B'
    },
    {
      key: 'dsr_tasks',
      label: 'Sales Tasks & DSR',
      count: tasks.filter(t => t.status !== 'COMPLETED').length,
      icon: CheckSquare,
      badgeColor: '#8B5CF6'
    },
    {
      key: 'pipeline',
      label: 'Pipeline Management',
      count: leads.filter(l => l.status !== 'WON' && l.status !== 'LOST').length,
      icon: Layers,
      badgeColor: '#6366F1'
    },
    {
      key: 'attendance',
      label: 'Attendance Tracker',
      count: null,
      icon: UserCheck,
      badgeColor: '#10B981'
    }
  ];

  return (
    <div className="portal-inner-container">
      {/* Top Header Card */}
      <div className="portal-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FF4D4D',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                border: '1px solid rgba(229, 9, 20, 0.3)',
                padding: '3px 10px',
                borderRadius: '6px'
              }}
            >
              Sales Executive Command Center
            </span>
            <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
              Logged in as: <strong style={{ color: '#FFFFFF' }}>{user?.username}</strong> ({user?.role_name})
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
            Sales Executive Dashboard
          </h1>
          <p style={{ fontSize: '13.5px', color: '#A1A1AA', margin: 0 }}>
            Dedicated operational suite for Leads, Follow-ups, Meetings, Daily Sales Reports (DSR), Pipeline & Attendance.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenAddLead}
            style={{
              padding: '9px 16px',
              backgroundColor: '#E50914',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)'
            }}
          >
            <Plus size={15} />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => handleOpenAddFollowUp(null)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} color="#E50914" />
            <span>Add Follow-up</span>
          </button>

          <button
            onClick={() => handleOpenScheduleMeeting(null)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} color="#E50914" />
            <span>Schedule Meeting</span>
          </button>

          <button
            onClick={() => loadAllData()}
            title="Refresh All Dashboard Data"
            style={{
              padding: '9px 12px',
              backgroundColor: '#141414',
              border: '1px solid #2D2D2D',
              borderRadius: '8px',
              color: '#A1A1AA',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* The 6 Core Navigation Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        {tabsConfig.map((t, idx) => {
          const isSelected = currentTab === t.key;
          const Icon = t.icon;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                backgroundColor: isSelected ? '#141414' : '#1A1A1A',
                border: isSelected ? '2px solid #E50914' : '1px solid #2D2D2D',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                boxShadow: isSelected ? '0 4px 16px rgba(229, 9, 20, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#E50914' : '#141414',
                    color: isSelected ? '#FFFFFF' : '#71717A',
                    border: isSelected ? 'none' : '1px solid #2D2D2D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase' }}>
                    Feature #{idx + 1}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#FFFFFF' : '#D4D4D8' }}>
                    {t.label}
                  </div>
                </div>
              </div>

              {t.count !== null && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.25)' : '#141414',
                    color: isSelected ? '#FF4D4D' : '#A1A1AA',
                    border: '1px solid ' + (isSelected ? 'rgba(229, 9, 20, 0.4)' : '#2D2D2D')
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Feature Content Container */}
      <main style={{ minHeight: '500px' }}>
        {/* Feature 1: Lead Management */}
        {currentTab === 'leads' && (
          <LeadManagement
            leads={leads}
            loading={loading}
            onRefresh={() => loadAllData()}
            onAddNewLead={handleOpenAddLead}
            onEditLead={handleOpenEditLead}
            onOpenFollowUp={handleOpenAddFollowUp}
            onOpenMeeting={handleOpenScheduleMeeting}
          />
        )}

        {/* Feature 2: Follow-ups */}
        {currentTab === 'follow_ups' && (
          <FollowUpsModule
            followUps={followUps}
            loading={loading}
            onRefresh={() => loadAllData()}
            onAddFollowUp={handleOpenAddFollowUp}
            onEditFollowUp={handleOpenEditFollowUp}
            onStatusUpdated={handleFollowUpSaved}
          />
        )}

        {/* Feature 3: Meetings */}
        {currentTab === 'meetings' && (
          <MeetingsModule
            meetings={meetings}
            loading={loading}
            onRefresh={() => loadAllData()}
            onScheduleMeeting={handleOpenScheduleMeeting}
            onEditMeeting={handleOpenEditMeeting}
            onStatusUpdated={handleMeetingSaved}
          />
        )}

        {/* Feature 4: Sales Task / Daily Sales Report (DSR) */}
        {currentTab === 'dsr_tasks' && (
          <SalesTasksDSRModule
            tasks={tasks}
            leadsList={leads}
            loading={loading}
            onRefresh={() => loadAllData()}
            onAddTask={handleOpenAddTask}
            onEditTask={handleOpenEditTask}
          />
        )}

        {/* Feature 5: Pipeline Management */}
        {currentTab === 'pipeline' && (
          <PipelineManagement
            leads={leads}
            loading={loading}
            onRefresh={() => loadAllData()}
            onStageUpdated={handleLeadSaved}
            onEditLead={handleOpenEditLead}
          />
        )}

        {/* Feature 6: Personal Attendance Tracker (Strictly Isolated) */}
        {currentTab === 'attendance' && (
          <EmployeeAttendanceTracker title="Sales Executive Attendance Tracker" />
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* 1. Lead Add / Edit Modal */}
      <LeadFormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLeadForEdit}
        onLeadSaved={handleLeadSaved}
      />

      {/* 2. Follow-Up Add / Edit Modal */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        followUp={selectedFollowUpForEdit}
        lead={selectedLeadForFollowUp}
        leadsList={leads}
        onFollowUpSaved={handleFollowUpSaved}
      />

      {/* 3. Meeting Schedule / Update Modal */}
      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        meeting={selectedMeetingForEdit}
        lead={selectedLeadForMeeting}
        leadsList={leads}
        onMeetingSaved={handleMeetingSaved}
      />

      {/* 4. Sales Task Add / Edit Modal */}
      <SalesTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTaskForEdit}
        leadsList={leads}
        onTaskSaved={handleTaskSaved}
      />

    </div>
  );
}
