import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp, Users, Phone, MessageSquare, Mail, Calendar, Clock,
  DollarSign, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw,
  Plus, Search, Filter, Upload, FileText, Award, ChevronRight,
  ExternalLink, UserCheck, BarChart3, PieChart, Shield, ArrowUpRight,
  ArrowDownRight, ChevronDown, Check, MoreHorizontal, Sparkles,
  Briefcase, Target, Eye, Layers, LogIn, LogOut
} from 'lucide-react';

// Modals
import LeadCreationWizardModal from './components/LeadCreationWizardModal';
import LeadQualificationModal from './components/LeadQualificationModal';
import FollowUpModal from './components/FollowUpModal';
import MeetingModal from './components/MeetingModal';
import ProposalModal from './components/ProposalModal';
import WonHandoverModal from './components/WonHandoverModal';
import LeadImportModal from './components/LeadImportModal';
import LeadDetailDrawer from './components/LeadDetailDrawer';

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'New Lead', color: 'border-blue-500 bg-blue-50/50 text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-purple-500 bg-purple-50/50 text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { key: 'QUALIFIED', label: 'Qualified (BANT)', color: 'border-indigo-500 bg-indigo-50/50 text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
  { key: 'MEETING', label: 'Meeting Scheduled', color: 'border-amber-500 bg-amber-50/50 text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  { key: 'PROPOSAL', label: 'Proposal Sent', color: 'border-orange-500 bg-orange-50/50 text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-rose-500 bg-rose-50/50 text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { key: 'WON', label: 'Closed Won', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'LOST', label: 'Closed Lost', color: 'border-slate-400 bg-slate-50/50 text-slate-700', badge: 'bg-slate-100 text-slate-800' },
];

export default function SalesDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Filter States
  const [dateRange, setDateRange] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('KANBAN'); // 'KANBAN' | 'TABLE'

  // Handle URL view query parameters
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'leads' || view === 'my_leads' || view === 'clients') {
      setViewMode('TABLE');
      setSelectedStageFilter('ALL');
    } else if (view === 'pipeline') {
      setViewMode('KANBAN');
      setSelectedStageFilter('ALL');
    } else if (view === 'follow_ups') {
      document.getElementById('todays-followups-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'meetings') {
      document.getElementById('upcoming-meetings-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'proposals') {
      setSelectedStageFilter('PROPOSAL');
      setViewMode('TABLE');
    } else if (view === 'handover') {
      setSelectedStageFilter('WON');
      setViewMode('TABLE');
    }
  }, [searchParams]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelineData, setPipelineData] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Table Pagination
  const [tablePage, setTablePage] = useState(1);
  const [tableTotalPages, setTableTotalPages] = useState(1);

  // Modal Control States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);

  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [selectedLeadForMeeting, setSelectedLeadForMeeting] = useState(null);

  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [selectedLeadForProposal, setSelectedLeadForProposal] = useState(null);

  const [isQualifyOpen, setIsQualifyOpen] = useState(false);
  const [selectedLeadForQualify, setSelectedLeadForQualify] = useState(null);

  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [selectedLeadForHandover, setSelectedLeadForHandover] = useState(null);

  // Fetch all live data
  const loadAllData = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      const queryParams = { range: dateRange };
      if (dateRange === 'custom') {
        if (customStart) queryParams.start_date = customStart;
        if (customEnd) queryParams.end_date = customEnd;
      }

      const [dashRes, pipeRes, todayFuRes, overdueFuRes, meetingsRes, leadsRes, attRes] = await Promise.all([
        api.get('/sales/dashboard', queryParams).catch(err => { console.error(err); return null; }),
        api.get('/sales/pipeline').catch(err => { console.error(err); return { pipeline: [] }; }),
        api.get('/leads/follow-ups/today').catch(() => []),
        api.get('/leads/follow-ups/overdue').catch(() => []),
        api.get('/meetings', { status: 'SCHEDULED' }).catch(() => []),
        api.get('/leads', { page: tablePage, limit: 15, search: searchTerm, status: selectedStageFilter !== 'ALL' ? selectedStageFilter : undefined }).catch(() => ({ leads: [], pagination: { totalPages: 1 } })),
        api.get('/attendance/my-today').catch(() => null)
      ]);

      setDashboardData(dashRes);
      setPipelineData(pipeRes?.pipeline || []);
      setTodayFollowUps(Array.isArray(todayFuRes) ? todayFuRes : []);
      setOverdueFollowUps(Array.isArray(overdueFuRes) ? overdueFuRes : []);
      setUpcomingMeetings(Array.isArray(meetingsRes) ? meetingsRes : []);
      setRecentLeads(leadsRes?.leads || []);
      setTableTotalPages(leadsRes?.pagination?.totalPages || 1);
      setAttendance(attRes?.record || null);

    } catch (err) {
      console.error('Failed to load Sales Command Center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dateRange, customStart, customEnd, tablePage, selectedStageFilter]);

  // Handle stage move for card
  const handleMoveStage = async (leadId, newStage, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/leads/${leadId}/stage`, {
        stage: newStage,
        notes: `Advanced to ${newStage} via Pipeline Board`
      });
      loadAllData(true);
    } catch (err) {
      alert(err.message || 'Failed to update stage');
    }
  };

  // Handle Attendance Check-in / Check-out
  const handleAttendanceAction = async (actionType) => {
    setAttendanceLoading(true);
    try {
      if (actionType === 'CHECK_IN') {
        await api.post('/attendance/check-in');
      } else {
        await api.post('/attendance/check-out');
      }
      const attRes = await api.get('/attendance/my-today');
      setAttendance(attRes?.record || null);
    } catch (err) {
      alert(err.message || `Failed to ${actionType.toLowerCase()}`);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Quick complete follow-up
  const handleCompleteFollowUp = async (fuId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/leads/follow-ups/${fuId}`, {
        status: 'COMPLETED',
        remarks: 'Completed via Sales Command Center'
      });
      loadAllData(true);
    } catch (err) {
      alert('Failed to mark follow-up completed');
    }
  };

  // Quick reschedule follow-up to today
  const handleRescheduleToToday = async (fuId, e) => {
    if (e) e.stopPropagation();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.put(`/leads/follow-ups/${fuId}`, {
        status: 'RESCHEDULED',
        follow_up_date: todayStr,
        remarks: 'Overdue follow-up moved to today'
      });
      loadAllData(true);
    } catch (err) {
      alert('Failed to reschedule follow-up');
    }
  };

  // Drawer Opener
  const handleOpenLeadDrawer = (leadId) => {
    setSelectedLeadId(leadId);
    setIsDetailDrawerOpen(true);
  };

  const kpis = dashboardData?.kpis || {};
  const funnel = dashboardData?.funnel || {};
  const sourceStats = dashboardData?.source_analytics || [];
  const revenueStats = dashboardData?.revenue_analytics || {};
  const activitiesStream = dashboardData?.activities_stream || [];

  // Filtered pipeline data
  const filteredPipeline = useMemo(() => {
    if (!searchTerm.trim() && selectedStageFilter === 'ALL') {
      return pipelineData;
    }
    return pipelineData.map(col => {
      let deals = col.deals || [];
      if (selectedStageFilter !== 'ALL' && col.stage !== selectedStageFilter) {
        deals = [];
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        deals = deals.filter(d =>
          d.company_name?.toLowerCase().includes(term) ||
          d.contact_person?.toLowerCase().includes(term) ||
          d.lead_code?.toLowerCase().includes(term) ||
          d.phone?.includes(term)
        );
      }
      return {
        ...col,
        deals,
        count: deals.length,
        total_value: deals.reduce((acc, d) => acc + (d.deal_value || 0), 0)
      };
    });
  }, [pipelineData, searchTerm, selectedStageFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-6 space-y-6">
      {/* SECTION 3: TOP BAR / HEADER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Target className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">SALES COMMAND CENTER</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  LIVE REVENUE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Real-time pipeline progression from Lead Creation to Client Handover
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Bar & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateRange === r.id
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-xl text-xs">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs border-0 p-1 focus:ring-0 text-slate-700"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs border-0 p-1 focus:ring-0 text-slate-700"
              />
            </div>
          )}

          <button
            onClick={() => loadAllData()}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Real-time Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* SECTION 5: QUICK ACTIONS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Agency Lead
          </button>
          <button
            onClick={() => {
              setSelectedLeadForFollowUp(null);
              setIsFollowUpOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> + Follow-up
          </button>
          <button
            onClick={() => {
              setSelectedLeadForMeeting(null);
              setIsMeetingOpen(true);
            }}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" /> + Meeting
          </button>
          <button
            onClick={() => {
              setSelectedLeadForProposal(null);
              setIsProposalOpen(true);
            }}
            className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-xl border border-orange-200 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-orange-600" /> + Proposal
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Import Leads
          </button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, contacts, phones..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'KANBAN' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 6: 8 DYNAMIC KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Card 1: Total Leads */}
        <div
          onClick={() => setSelectedStageFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedStageFilter === 'ALL' ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Total Leads</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.total_leads || 0}</div>
          <div className="text-[11px] font-semibold mt-1 flex items-center gap-1 text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>{kpis.total_leads_change || '+0%'}</span>
            <span className="text-[10px] text-slate-400 font-normal">vs prev</span>
          </div>
        </div>

        {/* Card 2: Qualified Leads */}
        <div
          onClick={() => setSelectedStageFilter('QUALIFIED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedStageFilter === 'QUALIFIED' ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Qualified</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.qualified_leads || 0}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {kpis.qualification_rate || '0%'} rate
          </div>
        </div>

        {/* Card 3: Meetings */}
        <div
          onClick={() => setSelectedStageFilter('MEETING')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedStageFilter === 'MEETING' ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Meetings</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.meetings_count || 0}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            {kpis.meetings_change || '+0%'} vs prev
          </div>
        </div>

        {/* Card 4: Proposals */}
        <div
          onClick={() => setSelectedStageFilter('PROPOSAL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedStageFilter === 'PROPOSAL' ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Proposals</span>
            <FileText className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.proposals_sent || 0}</div>
          <div className="text-[11px] text-orange-600 font-semibold mt-1 truncate">
            ₹{(kpis.proposals_value || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 5: Deals Won */}
        <div
          onClick={() => setSelectedStageFilter('WON')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedStageFilter === 'WON' ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Deals Won</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.deals_won || 0}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            {kpis.win_rate || '0%'} Win Rate
          </div>
        </div>

        {/* Card 6: Won Revenue */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Won Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 truncate">
            ₹{(kpis.won_revenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {kpis.won_revenue_change || '+0%'} closed
          </div>
        </div>

        {/* Card 7: Active Pipeline */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Pipeline Val</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-indigo-600 truncate">
            ₹{(kpis.pipeline_value || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            In negotiation
          </div>
        </div>

        {/* Card 8: Follow-ups Due */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">Due Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{kpis.follow_ups_due_today || 0}</div>
          <div className="text-[11px] font-semibold mt-1">
            {(kpis.follow_ups_overdue || 0) > 0 ? (
              <span className="text-rose-600 font-bold">{kpis.follow_ups_overdue} OVERDUE</span>
            ) : (
              <span className="text-emerald-600 font-medium">All on track</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 11: OVERDUE FOLLOW-UPS ALERT (If any exist) */}
      {overdueFollowUps.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  {overdueFollowUps.length} Overdue Follow-up(s) Detected
                </h3>
                <p className="text-xs text-rose-700">
                  Immediate action required to prevent lead decay and deal loss.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-rose-200 text-rose-900 px-3 py-1 rounded-full">
              HIGH PRIORITY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueFollowUps.slice(0, 3).map(fu => (
              <div key={fu.id} className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{fu.company_name}</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {fu.days_overdue || 1}d Overdue
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Contact: <strong className="text-slate-800">{fu.contact_person}</strong> ({fu.phone})
                  </div>
                  {fu.remarks && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                      "{fu.remarks}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => handleRescheduleToToday(fu.id, e)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Move to Today
                  </button>
                  <button
                    onClick={(e) => handleCompleteFollowUp(fu.id, e)}
                    className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: SECTION 7 KANBAN PIPELINE BOARD */}
      {viewMode === 'KANBAN' ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Live 8-Stage Sales Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Drag or click cards to advance leads across stages with full audit tracking.
              </p>
            </div>
            {selectedStageFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedStageFilter('ALL')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1"
              >
                Clear Filter: {selectedStageFilter} <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-4">
            {filteredPipeline.map((column, colIdx) => {
              const stageConfig = PIPELINE_STAGES.find(s => s.key === column.stage) || PIPELINE_STAGES[0];
              const deals = column.deals || [];

              return (
                <div
                  key={column.stage}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-2.5 flex flex-col min-w-[210px]"
                >
                  {/* Column Header */}
                  <div className="pb-2.5 mb-2.5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 truncate">
                        {stageConfig.label}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stageConfig.badge}`}>
                        {column.count || 0}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-1">
                      ₹{(column.total_value || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Column Deal Cards */}
                  <div className="space-y-2.5 flex-1 min-h-[160px] overflow-y-auto max-h-[620px] pr-0.5">
                    {deals.length === 0 ? (
                      <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400 italic">
                        No deals
                      </div>
                    ) : (
                      deals.map(deal => (
                        <div
                          key={deal.id}
                          onClick={() => handleOpenLeadDrawer(deal.id)}
                          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-mono font-bold text-slate-500">{deal.lead_code}</span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${
                                deal.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                deal.priority === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {deal.priority || 'MED'}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {deal.company_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {deal.contact_person}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                              <span className="text-xs font-black text-emerald-600">
                                ₹{(deal.deal_value || 0).toLocaleString('en-IN')}
                              </span>
                              {deal.lead_score !== undefined && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  deal.lead_score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  deal.lead_score >= 40 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {deal.lead_score}/100
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Stage Transition & Communication Buttons */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-slate-400">
                              <a
                                href={`tel:${deal.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                title={`Call ${deal.phone}`}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <a
                                href={`https://wa.me/${deal.phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:text-emerald-500 hover:bg-emerald-50 rounded"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Move to next stage button if not final */}
                            {colIdx < PIPELINE_STAGES.length - 1 && column.stage !== 'WON' && column.stage !== 'LOST' && (
                              <button
                                onClick={(e) => handleMoveStage(deal.id, PIPELINE_STAGES[colIdx + 1].key, e)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-indigo-200"
                                title={`Move to ${PIPELINE_STAGES[colIdx + 1].label}`}
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: FULL DATA TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Agency Leads Directory
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Page {tablePage} of {tableTotalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Lead Code</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Deal Value</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Next Follow-up</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-400">
                      No agency leads found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map(lead => {
                    const stageConfig = PIPELINE_STAGES.find(s => s.key === lead.status) || PIPELINE_STAGES[0];
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleOpenLeadDrawer(lead.id)}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      >
                        <td className="p-3 font-mono font-bold text-slate-700">{lead.lead_code}</td>
                        <td className="p-3 font-bold text-slate-900">{lead.company_name}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{lead.contact_person}</div>
                          <div className="text-[11px] text-slate-400">{lead.phone}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {lead.source}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ₹{(lead.deal_value || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageConfig.badge}`}>
                            {stageConfig.label}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-700">
                          {lead.lead_score || 50}/100
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                            lead.priority === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {lead.priority || 'MED'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {lead.next_follow_up || lead.first_follow_up_date || '—'}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleOpenLeadDrawer(lead.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => setTablePage(prev => Math.max(1, prev - 1))}
              disabled={tablePage <= 1}
              className="px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {tablePage} of {tableTotalPages}
            </span>
            <button
              onClick={() => setTablePage(prev => Math.min(tableTotalPages, prev + 1))}
              disabled={tablePage >= tableTotalPages}
              className="px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 3-COLUMN OPERATIONAL SECTION: Follow-ups, Meetings, Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 10: TODAY'S FOLLOW-UPS */}
        <div id="todays-followups-section" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Today's Follow-up Calls & Chats ({todayFollowUps.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedLeadForFollowUp(null);
                  setIsFollowUpOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {todayFollowUps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No pending follow-ups scheduled for today.
                </div>
              ) : (
                todayFollowUps.map(fu => (
                  <div
                    key={fu.id}
                    onClick={() => handleOpenLeadDrawer(fu.lead_id)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">{fu.company_name}</span>
                      <span className="text-[11px] font-bold text-indigo-600">
                        {fu.follow_up_time || 'Today'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>{fu.contact_person} ({fu.phone})</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                        via {fu.follow_up_type}
                      </span>
                    </div>
                    {fu.remarks && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                        "{fu.remarks}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${fu.phone}`}
                        className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${fu.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </a>
                      <button
                        onClick={(e) => handleCompleteFollowUp(fu.id, e)}
                        className="px-2 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 12: UPCOMING SALES MEETINGS */}
        <div id="upcoming-meetings-section" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Scheduled Sales Meetings ({upcomingMeetings.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedLeadForMeeting(null);
                  setIsMeetingOpen(true);
                }}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                + Schedule
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {upcomingMeetings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No upcoming meetings scheduled.
                </div>
              ) : (
                upcomingMeetings.map(m => (
                  <div
                    key={m.id}
                    onClick={() => m.lead_id && handleOpenLeadDrawer(m.lead_id)}
                    className="p-3 bg-slate-50 hover:bg-purple-50/40 rounded-xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">{m.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {m.meeting_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span>{m.company_name || 'Prospective Client'}</span>
                      {m.contact_person && <span> • {m.contact_person}</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>📅 {m.meeting_date} at {m.meeting_time}</span>
                      <span>⏳ {m.duration_minutes || 30} mins</span>
                    </div>
                    {m.meeting_link && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={m.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          Join {m.platform || 'Google Meet'} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 18: CONVERSION FUNNEL */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Live Conversion Funnel
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {funnel.overall_conversion || '0%'} Win Rate
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { label: 'Total Inbound/Outbound Leads', count: funnel.total_leads || 0, pct: 100, color: 'bg-blue-500' },
                { label: 'Prospects Contacted', count: funnel.contacted || 0, pct: funnel.contacted_rate || 0, color: 'bg-purple-500' },
                { label: 'BANT Qualified', count: funnel.qualified || 0, pct: funnel.qualified_rate || 0, color: 'bg-indigo-500' },
                { label: 'Sales Meetings Done', count: funnel.meetings || 0, pct: funnel.meetings_rate || 0, color: 'bg-amber-500' },
                { label: 'Proposals Submitted', count: funnel.proposals || 0, pct: funnel.proposals_rate || 0, color: 'bg-orange-500' },
                { label: 'Closed Won Clients', count: funnel.deals_won || 0, pct: funnel.overall_conversion || 0, color: 'bg-emerald-500' }
              ].map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{step.label}</span>
                    <span className="font-bold text-slate-900">{step.count} ({step.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} transition-all duration-500`}
                      style={{ width: `${Math.max(4, Math.min(100, step.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Conversion Efficiency</span>
            <span className="text-xs font-black text-emerald-700">High Performing</span>
          </div>
        </div>
      </div>

      {/* 3-COLUMN ANALYTICS SECTION: Lead Sources, Revenue & Pipeline, Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 19: LEAD SOURCE ANALYTICS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Lead Acquisition Channels
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2">Channel</th>
                  <th className="p-2">Leads</th>
                  <th className="p-2">Won</th>
                  <th className="p-2">Revenue</th>
                  <th className="p-2 text-right">Conv %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {sourceStats.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-400">No source records found.</td>
                  </tr>
                ) : (
                  sourceStats.map((src, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{src.source}</td>
                      <td className="p-2">{src.leads_count}</td>
                      <td className="p-2 font-semibold text-emerald-600">{src.won_count}</td>
                      <td className="p-2 font-semibold">₹{(src.won_revenue || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold text-indigo-600">{src.conversion_rate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 20: REVENUE & PIPELINE OVERVIEW */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Commercial & Deal Metrics
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-500 font-medium">Open Pipeline</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{(revenueStats.open_pipeline_value || kpis.pipeline_value || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">8 active deal stages</div>
            </div>

            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <div className="text-[11px] text-indigo-700 font-medium">Weighted Expected</div>
              <div className="text-base font-bold text-indigo-900 mt-0.5">
                ₹{(revenueStats.weighted_pipeline_value || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-indigo-500">Based on stage probabilities</div>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <div className="text-[11px] text-emerald-700 font-medium">Closed Won Revenue</div>
              <div className="text-base font-bold text-emerald-900 mt-0.5">
                ₹{(revenueStats.closed_won_revenue || kpis.won_revenue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">100% Realized</div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-500 font-medium">Avg Deal Size</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{(revenueStats.avg_deal_size || 75000).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Monthly Retainer</div>
            </div>
          </div>

          {/* SECTION 24: ATTENDANCE CHECK-IN / CHECK-OUT WIDGET */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Today's Shift & Attendance
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                attendance?.check_in_time ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {attendance?.status || 'NOT CHECKED IN'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
              <div>
                In: <strong className="text-slate-800">{attendance?.check_in_time || '—'}</strong>
              </div>
              <div>
                Out: <strong className="text-slate-800">{attendance?.check_out_time || '—'}</strong>
              </div>
              <div>
                Hours: <strong className="text-indigo-600">{attendance?.total_working_hours ? `${attendance.total_working_hours}h` : 'Active'}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              {!attendance?.check_in_time ? (
                <button
                  onClick={() => handleAttendanceAction('CHECK_IN')}
                  disabled={attendanceLoading}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" /> Check In Now
                </button>
              ) : !attendance?.check_out_time ? (
                <button
                  onClick={() => handleAttendanceAction('CHECK_OUT')}
                  disabled={attendanceLoading}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> Check Out Shift
                </button>
              ) : (
                <div className="w-full py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg text-center">
                  Shift Completed Today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 13: SALES ACTIVITY STREAM */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Live Sales Activity Stream
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Audited Log
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {activitiesStream.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No sales activities recorded in this time range.
                </div>
              ) : (
                activitiesStream.map(act => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{act.company_name || 'Lead Activity'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-600">{act.title || act.notes}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>By: <strong className="text-slate-600">{act.performed_by_name || 'Rahul Sharma'}</strong></span>
                      <span className="font-semibold text-indigo-600">{act.activity_type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Lead Creation Wizard */}
      <LeadCreationWizardModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onLeadCreated={() => {
          setIsNewLeadOpen(false);
          loadAllData();
        }}
      />

      {/* 2. Lead Detail Drawer */}
      <LeadDetailDrawer
        leadId={selectedLeadId}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedLeadId(null);
        }}
        onLeadUpdated={() => loadAllData(true)}
        onOpenFollowUp={(lead) => {
          setSelectedLeadForFollowUp(lead);
          setIsFollowUpOpen(true);
        }}
        onOpenMeeting={(lead) => {
          setSelectedLeadForMeeting(lead);
          setIsMeetingOpen(true);
        }}
        onOpenProposal={(lead) => {
          setSelectedLeadForProposal(lead);
          setIsProposalOpen(true);
        }}
        onOpenQualify={(lead) => {
          setSelectedLeadForQualify(lead);
          setIsQualifyOpen(true);
        }}
        onOpenHandover={(lead) => {
          setSelectedLeadForHandover(lead);
          setIsHandoverOpen(true);
        }}
      />

      {/* 3. Follow-up Modal */}
      <FollowUpModal
        isOpen={isFollowUpOpen}
        lead={selectedLeadForFollowUp}
        onClose={() => {
          setIsFollowUpOpen(false);
          setSelectedLeadForFollowUp(null);
        }}
        onFollowUpCreated={() => {
          setIsFollowUpOpen(false);
          loadAllData(true);
        }}
      />

      {/* 4. Meeting Modal */}
      <MeetingModal
        isOpen={isMeetingOpen}
        lead={selectedLeadForMeeting}
        onClose={() => {
          setIsMeetingOpen(false);
          setSelectedLeadForMeeting(null);
        }}
        onMeetingScheduled={() => {
          setIsMeetingOpen(false);
          loadAllData(true);
        }}
      />

      {/* 5. Proposal Modal */}
      <ProposalModal
        isOpen={isProposalOpen}
        lead={selectedLeadForProposal}
        onClose={() => {
          setIsProposalOpen(false);
          setSelectedLeadForProposal(null);
        }}
        onProposalCreated={() => {
          setIsProposalOpen(false);
          loadAllData(true);
        }}
      />

      {/* 6. Lead Qualification Modal */}
      <LeadQualificationModal
        isOpen={isQualifyOpen}
        lead={selectedLeadForQualify}
        onClose={() => {
          setIsQualifyOpen(false);
          setSelectedLeadForQualify(null);
        }}
        onQualified={() => {
          setIsQualifyOpen(false);
          loadAllData(true);
        }}
      />

      {/* 7. Won Handover Modal */}
      <WonHandoverModal
        isOpen={isHandoverOpen}
        lead={selectedLeadForHandover}
        onClose={() => {
          setIsHandoverOpen(false);
          setSelectedLeadForHandover(null);
        }}
        onHandoverCompleted={() => {
          setIsHandoverOpen(false);
          loadAllData(true);
        }}
      />

      {/* 8. Bulk Import Modal */}
      <LeadImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          setIsImportOpen(false);
          loadAllData();
        }}
      />
    </div>
  );
}
