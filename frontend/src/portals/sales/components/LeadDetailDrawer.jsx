import React, { useState, useEffect } from 'react';
import api from '../../../api/client';
import {
  X, Phone, MessageSquare, Mail, Calendar, Clock, DollarSign,
  TrendingUp, Award, CheckCircle2, AlertCircle, Send, FileText,
  UserCheck, ExternalLink, RefreshCw, ChevronRight, Briefcase,
  Shield, Edit3, Tag, Building2, Globe, MapPin, User, ChevronDown
} from 'lucide-react';

const STAGES = [
  { key: 'NEW', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-purple-100 text-purple-800' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'MEETING', label: 'Meeting Scheduled', color: 'bg-amber-100 text-amber-800' },
  { key: 'PROPOSAL', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-800' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-rose-100 text-rose-800' },
  { key: 'WON', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'LOST', label: 'Closed Lost', color: 'bg-slate-100 text-slate-800' },
];

export default function LeadDetailDrawer({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenFollowUp,
  onOpenMeeting,
  onOpenProposal,
  onOpenQualify,
  onOpenHandover
}) {
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [updatingStage, setUpdatingStage] = useState(false);

  // Quick activity log state
  const [activityForm, setActivityForm] = useState({
    activity_type: 'CALL',
    title: '',
    outcome: 'CONNECTED',
    notes: ''
  });
  const [loggingActivity, setLoggingActivity] = useState(false);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const res = await api.get(`/leads/${leadId}`);
      setLeadData(res);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  const lead = leadData?.lead;
  const activities = leadData?.activities || [];
  const followUps = leadData?.followUps || [];
  const meetings = leadData?.meetings || [];
  const proposals = leadData?.proposals || [];

  const handleStageChange = async (newStage) => {
    if (!lead || lead.status === newStage) return;
    setUpdatingStage(true);
    try {
      await api.put(`/leads/${lead.id}/stage`, {
        stage: newStage,
        notes: `Stage changed to ${newStage} via Lead Detail Drawer`
      });
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update lead stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.notes.trim()) return;
    setLoggingActivity(true);
    try {
      await api.post(`/leads/${lead.id}/activities`, {
        activity_type: activityForm.activity_type,
        title: activityForm.title || `${activityForm.activity_type} with ${lead.contact_person}`,
        notes: activityForm.notes,
        outcome: activityForm.outcome
      });
      setActivityForm({
        activity_type: 'CALL',
        title: '',
        outcome: 'CONNECTED',
        notes: ''
      });
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert(err.message || 'Failed to log activity');
    } finally {
      setLoggingActivity(false);
    }
  };

  const handleCall = () => {
    if (!lead?.phone) return;
    window.open(`tel:${lead.phone}`, '_self');
    // Log quick activity
    api.post(`/leads/${lead.id}/activities`, {
      activity_type: 'CALL',
      title: `Outgoing call placed to ${lead.contact_person} (${lead.phone})`,
      notes: 'Initiated outbound voice call from Lead Command Drawer.',
      outcome: 'CONNECTED'
    }).then(fetchLeadDetails).catch(console.error);
  };

  const handleWhatsApp = () => {
    if (!lead?.whatsapp && !lead?.phone) return;
    const rawPhone = (lead.whatsapp || lead.phone).replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = encodeURIComponent(`Hi ${lead.contact_person}, I'm reaching out from Zentra Digital regarding your digital marketing inquiry for ${lead.company_name}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    api.post(`/leads/${lead.id}/activities`, {
      activity_type: 'WHATSAPP',
      title: `WhatsApp chat opened for ${lead.contact_person}`,
      notes: 'Sent WhatsApp template message from Lead Command Drawer.',
      outcome: 'MESSAGE_SENT'
    }).then(fetchLeadDetails).catch(console.error);
  };

  const handleEmail = () => {
    if (!lead?.email) return;
    const subject = encodeURIComponent(`Growth & Digital Marketing Strategy — ${lead.company_name}`);
    window.open(`mailto:${lead.email}?subject=${subject}`, '_self');
    api.post(`/leads/${lead.id}/activities`, {
      activity_type: 'EMAIL',
      title: `Outgoing email initiated to ${lead.email}`,
      notes: 'Opened email composer from Lead Command Drawer.',
      outcome: 'EMAIL_SENT'
    }).then(fetchLeadDetails).catch(console.error);
  };

  const handleCompleteFollowUp = async (fuId) => {
    try {
      await api.put(`/leads/follow-ups/${fuId}`, {
        status: 'COMPLETED',
        remarks: 'Marked as completed from Lead Drawer'
      });
      fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      alert('Failed to complete follow up');
    }
  };

  const currentStageObj = STAGES.find(s => s.key === lead?.status) || STAGES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-slate-200 text-slate-700">
                    {lead?.lead_code || 'LEAD'}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    lead?.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                    lead?.priority === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lead?.priority || 'MEDIUM'} Priority
                  </span>
                  {lead?.lead_score !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      lead.lead_score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                      lead.lead_score >= 40 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Award className="w-3 h-3" /> Score: {lead.lead_score}/100
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {lead?.company_name || 'Loading...'}
                </h2>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium text-slate-700">{lead?.contact_person}</span>
                  {lead?.designation && <span>• {lead.designation}</span>}
                  {lead?.city && <span>• {lead.city}, {lead.state || 'India'}</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-xs text-slate-500 font-medium">Deal Value</div>
                  <div className="text-lg font-bold text-emerald-600">
                    ₹{(lead?.deal_value || 0).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500">/{lead?.billing_type || 'mo'}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleCall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={handleEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />

              <button
                onClick={() => onOpenFollowUp && onOpenFollowUp(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" /> + Follow-up
              </button>
              <button
                onClick={() => onOpenMeeting && onOpenMeeting(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Meeting
              </button>
              <button
                onClick={() => onOpenProposal && onOpenProposal(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Proposal
              </button>
              <button
                onClick={() => onOpenQualify && onOpenQualify(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Award className="w-3.5 h-3.5" /> BANT
              </button>
              <button
                onClick={() => onOpenHandover && onOpenHandover(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> Won & Handover
              </button>
            </div>

            {/* Pipeline Stage Quick Selector */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-500">Pipeline Stage:</span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
                {STAGES.map(s => {
                  const isActive = lead?.status === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => handleStageChange(s.key)}
                      disabled={updatingStage}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 bg-white px-6">
            {[
              { id: 'OVERVIEW', label: '360° Overview' },
              { id: 'ACTIVITIES', label: `Timeline (${activities.length})` },
              { id: 'FOLLOWUPS', label: `Follow-ups (${followUps.length})` },
              { id: 'MEETINGS', label: `Meetings (${meetings.length})` },
              { id: 'PROPOSALS', label: `Proposals (${proposals.length})` },
              { id: 'BANT', label: 'BANT Audit' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Fetching real-time 360° lead records...</p>
              </div>
            ) : !lead ? (
              <div className="p-8 text-center text-slate-500">Lead not found or inaccessible.</div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Key Metrics Strip */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs text-slate-500 font-medium">Source</div>
                        <div className="text-sm font-semibold text-slate-800 mt-0.5">{lead.source}</div>
                        <div className="text-[11px] text-slate-400">{lead.lead_type || 'Inbound'}</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs text-slate-500 font-medium">Industry</div>
                        <div className="text-sm font-semibold text-slate-800 mt-0.5">{lead.industry || 'General'}</div>
                        <div className="text-[11px] text-slate-400">{lead.business_type || 'B2B/B2C'}</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs text-slate-500 font-medium">Assigned Rep</div>
                        <div className="text-sm font-semibold text-slate-800 mt-0.5">{lead.assigned_employee_name || 'Rahul Sharma'}</div>
                        <div className="text-[11px] text-emerald-600 font-medium">Direct Ownership</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs text-slate-500 font-medium">Next Follow-up</div>
                        <div className="text-sm font-semibold text-indigo-600 mt-0.5">
                          {lead.first_follow_up_date || (followUps[0]?.follow_up_date) || 'None set'}
                        </div>
                        <div className="text-[11px] text-slate-400">Scheduled reminder</div>
                      </div>
                    </div>

                    {/* Requirements & Business Problem */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Client Pain Point & Target Outcome
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-slate-700 mb-0.5">Core Business Problem</div>
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                            {lead.main_business_problem || lead.requirement || 'No problem statement recorded.'}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-700 mb-0.5">Desired Outcome & Goal</div>
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                            {lead.desired_outcome || 'Improve digital presence and generate high quality qualified leads.'}
                          </p>
                        </div>
                      </div>
                      {lead.services_required && (
                        <div className="mt-3 pt-3 border-t border-amber-200/60">
                          <span className="text-xs font-semibold text-slate-700 mr-2">Services Demanded:</span>
                          <span className="inline-block text-xs font-medium text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                            {lead.services_required}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact & Location Details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-500" /> Detailed Profile & Coordinates
                      </h4>
                      <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-xs">
                        <div>
                          <span className="text-slate-400 block">Phone Number</span>
                          <span className="font-semibold text-slate-800">{lead.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">WhatsApp</span>
                          <span className="font-semibold text-slate-800">{lead.whatsapp || lead.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Work Email</span>
                          <span className="font-semibold text-slate-800">{lead.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Website</span>
                          {lead.website ? (
                            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                              {lead.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500">Not provided</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400 block">City & State</span>
                          <span className="font-semibold text-slate-800">{lead.city || 'N/A'}, {lead.state || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Target Location</span>
                          <span className="font-semibold text-slate-800">{lead.target_location || lead.city || 'Pan India'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Existing Agency</span>
                          <span className="font-semibold text-slate-800">{lead.existing_agency || 'None (Internal Team)'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Contract Duration</span>
                          <span className="font-semibold text-slate-800">{lead.expected_contract_duration || '6 Months'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Decision Maker</span>
                          <span className="font-semibold text-slate-800">{lead.decision_maker || 'Primary Contact'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Converted Client Badge if WON */}
                    {lead.converted_client_id && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          <div>
                            <div className="text-xs font-bold text-emerald-900">Successfully Converted to Agency Client</div>
                            <div className="text-xs text-emerald-700">Client Code: <span className="font-mono font-bold">{lead.converted_client_code || 'CLT-ACTIVE'}</span></div>
                          </div>
                        </div>
                        <span className="text-xs bg-emerald-600 text-white font-semibold px-3 py-1 rounded-lg">
                          Active Client
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ACTIVITIES & TIMELINE TAB */}
                {activeTab === 'ACTIVITIES' && (
                  <div className="space-y-6">
                    {/* Log New Activity Box */}
                    <form onSubmit={handleLogActivity} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-indigo-600" /> Quick Log Communication
                      </h4>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select
                          value={activityForm.activity_type}
                          onChange={e => setActivityForm(prev => ({ ...prev, activity_type: e.target.value }))}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option value="CALL">Phone Call</option>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">Email</option>
                          <option value="NOTE">Internal Note</option>
                          <option value="MEETING">Meeting Record</option>
                        </select>
                        <select
                          value={activityForm.outcome}
                          onChange={e => setActivityForm(prev => ({ ...prev, outcome: e.target.value }))}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                        >
                          <option value="CONNECTED">Connected / Discussed</option>
                          <option value="BUSY_NO_ANSWER">Busy / No Answer</option>
                          <option value="LEFT_VOICEMAIL">Left Message</option>
                          <option value="RESCHEDULED">Client Requested Call Later</option>
                          <option value="POSITIVE_INTEREST">Strong Positive Interest</option>
                          <option value="NOT_INTERESTED">Not Interested</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Short title (optional)"
                          value={activityForm.title}
                          onChange={e => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Log detailed call discussion, objections raised, client budget cues, or next action agreed upon..."
                        value={activityForm.notes}
                        onChange={e => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 mb-2"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loggingActivity}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          {loggingActivity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Save to Timeline
                        </button>
                      </div>
                    </form>

                    {/* Timeline Feed */}
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {activities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4">No activities logged yet.</p>
                      ) : (
                        activities.map(act => (
                          <div key={act.id} className="relative group">
                            {/* Marker */}
                            <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
                              act.activity_type === 'CALL' ? 'bg-emerald-500 text-white' :
                              act.activity_type === 'WHATSAPP' ? 'bg-emerald-400 text-white' :
                              act.activity_type === 'EMAIL' ? 'bg-blue-500 text-white' :
                              act.activity_type === 'MEETING' ? 'bg-purple-500 text-white' :
                              act.activity_type === 'STAGE_CHANGE' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                            }`}>
                              {act.activity_type === 'CALL' ? <Phone className="w-2.5 h-2.5" /> :
                               act.activity_type === 'WHATSAPP' ? <MessageSquare className="w-2.5 h-2.5" /> :
                               act.activity_type === 'EMAIL' ? <Mail className="w-2.5 h-2.5" /> :
                               act.activity_type === 'STAGE_CHANGE' ? <TrendingUp className="w-2.5 h-2.5" /> :
                               <FileText className="w-2.5 h-2.5" />}
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-800">{act.title || act.activity_type}</span>
                                <span className="text-[11px] text-slate-400">{new Date(act.created_at).toLocaleString('en-IN')}</span>
                              </div>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap">{act.notes}</p>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                                <span>Logged by: <strong className="text-slate-600">{act.performed_by_name || 'Sales Rep'}</strong></span>
                                {act.outcome && <span>• Outcome: <strong className="text-indigo-600">{act.outcome}</strong></span>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. FOLLOW-UPS TAB */}
                {activeTab === 'FOLLOWUPS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scheduled Follow-up Reminders</h4>
                      <button
                        onClick={() => onOpenFollowUp && onOpenFollowUp(lead)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        + Schedule Follow-up
                      </button>
                    </div>

                    {followUps.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                        No follow-ups recorded for this lead yet.
                      </div>
                    ) : (
                      followUps.map(fu => {
                        const isPending = fu.status === 'PENDING';
                        return (
                          <div key={fu.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{fu.follow_up_date} {fu.follow_up_time || ''}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  fu.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  fu.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {fu.status}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">via {fu.follow_up_type}</span>
                              </div>
                              <p className="text-xs text-slate-600">{fu.remarks || 'No remarks provided.'}</p>
                            </div>

                            {isPending && (
                              <button
                                onClick={() => handleCompleteFollowUp(fu.id)}
                                className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 4. MEETINGS TAB */}
                {activeTab === 'MEETINGS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scheduled Sales Meetings</h4>
                      <button
                        onClick={() => onOpenMeeting && onOpenMeeting(lead)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        + Schedule Meeting
                      </button>
                    </div>

                    {meetings.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                        No sales meetings scheduled yet.
                      </div>
                    ) : (
                      meetings.map(m => (
                        <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-900">{m.title}</span>
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                              {m.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-4">
                            <span>📅 {m.meeting_date} at {m.meeting_time}</span>
                            <span>⏳ {m.duration_minutes || 30} mins</span>
                            <span>📍 {m.platform || 'Google Meet'}</span>
                          </div>
                          {m.meeting_link && (
                            <div className="text-xs">
                              <a
                                href={m.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
                              >
                                Join Video Call <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {m.notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">{m.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. PROPOSALS TAB */}
                {activeTab === 'PROPOSALS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Commercial Proposals</h4>
                      <button
                        onClick={() => onOpenProposal && onOpenProposal(lead)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        + Create Proposal
                      </button>
                    </div>

                    {proposals.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                        No proposals generated yet.
                      </div>
                    ) : (
                      proposals.map(p => (
                        <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-700">{p.proposal_number}</span>
                              <div className="text-xs font-semibold text-slate-900 mt-0.5">{p.proposal_title}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-900">₹{(p.total_amount || 0).toLocaleString('en-IN')}</div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                                {p.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Package: <strong className="text-slate-700">{p.package_name || 'Custom Retainer'}</strong> • Valid Until: {p.valid_until || '14 days'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 6. BANT QUALIFICATION TAB */}
                {activeTab === 'BANT' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">BANT Qualification Framework</div>
                        <p className="text-xs text-slate-500">Budget, Authority, Need, and Timeline assessment</p>
                      </div>
                      <button
                        onClick={() => onOpenQualify && onOpenQualify(lead)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        Launch BANT Evaluation
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-700">Qualification Status</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          lead.qualification_status === 'QUALIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          lead.qualification_status === 'DISQUALIFIED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lead.qualification_status || 'PENDING'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Overall Lead Quality Score</span>
                          <span className="font-bold text-indigo-700">{lead.lead_score || 50} / 100</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              (lead.lead_score || 50) >= 70 ? 'bg-emerald-500' :
                              (lead.lead_score || 50) >= 40 ? 'bg-indigo-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${lead.lead_score || 50}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Budget Fit
                        </span>
                        <p className="text-xs text-slate-600">Range: <strong>{lead.budget_range || 'Flexible'}</strong></p>
                        <p className="text-xs text-slate-600">Sensitivity: <strong>{lead.pricing_sensitivity || 'Normal'}</strong></p>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-blue-600" /> Authority / Decision Maker
                        </span>
                        <p className="text-xs text-slate-600">Role: <strong>{lead.decision_maker || lead.designation || 'Key Stakeholder'}</strong></p>
                        <p className="text-xs text-slate-600">Influence: <strong>High (Direct Signoff)</strong></p>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Need & Urgency
                        </span>
                        <p className="text-xs text-slate-600">Urgency: <strong>{lead.urgency || 'Medium'}</strong></p>
                        <p className="text-xs text-slate-600">Start Date: <strong>{lead.expected_start_date || 'Within 30 Days'}</strong></p>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" /> Purchase Timeline
                        </span>
                        <p className="text-xs text-slate-600">Window: <strong>{lead.purchase_timeline || 'Immediate'}</strong></p>
                        <p className="text-xs text-slate-600">Contract: <strong>{lead.expected_contract_duration || '6 Months'}</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
