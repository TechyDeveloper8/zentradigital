import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import {
  Shield, Video, Users, UserCheck, TrendingUp, Award, Clock,
  Upload, Download, CheckCircle2, AlertCircle, X, RefreshCw,
  Search, Filter, ChevronRight, Play, Eye, FileText, Check,
  Edit2, Trash2, UserPlus, AlertTriangle, Layers, Calendar,
  ArrowUpRight, Sparkles, ExternalLink, ShieldAlert, CheckSquare,
  DollarSign, Activity, Zap, Plus, ArrowRight, Radio
} from 'lucide-react';
import AdminCreateGraphicTaskModal from './components/AdminCreateGraphicTaskModal';
import GraphicPostViewer from '../../components/common/GraphicPostViewer';
import WorkflowBadge from '../../components/common/WorkflowBadge';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state synced with URL ?tab=...
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(
    ['media', 'users', 'attendance', 'sales', 'approvals', 'rejections'].includes(queryTab)
      ? (queryTab === 'rejections' ? 'approvals' : queryTab)
      : 'approvals'
  );
  const [approvalSubTab, setApprovalSubTab] = useState(
    queryTab === 'rejections' ? 'client_rejections' : 'editor_review'
  );

  // Dynamically sync tab and sub-tab reactively whenever location.search changes
  useEffect(() => {
    const qTab = new URLSearchParams(location.search).get('tab');
    if (qTab === 'rejections') {
      setActiveTab('approvals');
      setApprovalSubTab('client_rejections');
    } else if (qTab === 'approvals') {
      setActiveTab('approvals');
      setApprovalSubTab(prev => (prev === 'client_rejections' ? 'editor_review' : prev));
    } else if (['media', 'users', 'attendance'].includes(qTab)) {
      setActiveTab(qTab);
    } else {
      setActiveTab('approvals');
      setApprovalSubTab('editor_review');
    }
  }, [location.search]);

  const handleTabChange = (tabId) => {
    if (tabId === 'rejections') {
      setActiveTab('approvals');
      setApprovalSubTab('client_rejections');
      navigate('/admin?tab=rejections');
    } else if (tabId === 'approvals') {
      setActiveTab('approvals');
      setApprovalSubTab('editor_review');
      navigate('/admin?tab=approvals');
    } else {
      setActiveTab(tabId);
      navigate(`/admin?tab=${tabId}`);
    }
  };

  // Toast banner
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // =========================================================================
  // EXECUTIVE LIVE SYSTEM METRICS (100% Dynamic DB Calculation)
  // =========================================================================
  const [execMetrics, setExecMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // =========================================================================
  // PILLAR 1: RAW VIDEO UPLOAD & MEDIA SHARING STATE
  // =========================================================================
  const [mediaAssets, setMediaAssets] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [videoEditorsList, setVideoEditorsList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFilterStatus, setMediaFilterStatus] = useState('ALL');

  // Raw Video Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    task_title: '',
    client_id: '',
    assigned_employee_id: '',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'HIGH',
    raw_footage_notes: '',
    client_visible: true,
    raw_file_url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-studio-41154-large.mp4',
    raw_file_name: 'Raw_Footage_Master_Cut.mp4',
    raw_file_size: 48500000
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [submittingUpload, setSubmittingUpload] = useState(false);

  // Video Stream Player Lightbox
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState('');

  // Re-assign / Edit Asset Modal
  const [editingAsset, setEditingAsset] = useState(null);
  const [reassignEditorId, setReassignEditorId] = useState('');
  const [reassignDeadline, setReassignDeadline] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');
  const [reassignClientVisible, setReassignClientVisible] = useState(true);
  const [submittingReassign, setSubmittingReassign] = useState(false);

  // =========================================================================
  // PILLAR 2: MASTER USER & ROLE MANAGEMENT STATE
  // =========================================================================
  const [masterUsers, setMasterUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role_name: 'editor',
    first_name: '',
    last_name: '',
    phone: '',
    designation: '',
    company_name: ''
  });
  const [submittingCreateUser, setSubmittingCreateUser] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [submittingEditUser, setSubmittingEditUser] = useState(false);

  // =========================================================================
  // PILLAR 3: UNIVERSAL ATTENDANCE MANAGEMENT STATE
  // =========================================================================
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceRoleFilter, setAttendanceRoleFilter] = useState('ALL');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('ALL');
  const [attendanceDate, setAttendanceDate] = useState('');

  const [allEmployeesList, setAllEmployeesList] = useState([]);

  // =========================================================================
  // PILLAR 4: SALES & PIPELINE OVERHEAD STATE
  // =========================================================================
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [followUpsList, setFollowUpsList] = useState([]);
  const [meetingsList, setMeetingsList] = useState([]);
  const [dailySalesReports, setDailySalesReports] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // =========================================================================
  // PILLAR 5: WORKFLOW APPROVAL & REVISION CENTER STATE
  const [videoReviewItems, setVideoReviewItems] = useState([]);
  const [smmReviewItems, setSmmReviewItems] = useState([]);
  const [staticReviewItems, setStaticReviewItems] = useState([]);
  const [clientRejections, setClientRejections] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [showCreateGraphicModal, setShowCreateGraphicModal] = useState(false);
  // (approvalSubTab and setApprovalSubTab declared above with URL queryTab sync)

  // Revision Request Modal State
  const [revisionModalTask, setRevisionModalTask] = useState(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // =========================================================================
  // DATA LOADERS
  // =========================================================================

  useEffect(() => {
    loadLiveExecutiveMetrics();
    loadInitialDependencies();
  }, []);

  const { isConnected, lastWorkflowEvent, lastAttendanceEvent } = useSocket();

  // REAL-TIME WEBSOCKET WORKFLOW LISTENER
  useEffect(() => {
    if (!lastWorkflowEvent) return;
    loadLiveExecutiveMetrics();
    loadApprovalCenterData();
    loadMediaAssets();
  }, [lastWorkflowEvent]);

  // REAL-TIME WEBSOCKET ATTENDANCE LISTENER
  useEffect(() => {
    if (!lastAttendanceEvent) return;
    loadAttendanceData();
    loadLiveExecutiveMetrics();
  }, [lastAttendanceEvent]);

  useEffect(() => {
    if (activeTab === 'media') loadMediaAssets();
    if (activeTab === 'users') loadMasterUsers();
    if (activeTab === 'attendance') loadAttendanceData();
    if (activeTab === 'sales') loadSalesOverhead();
    if (activeTab === 'approvals') loadApprovalCenterData();
  }, [activeTab]);

  const loadLiveExecutiveMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await api.get('/reports/admin').catch(() => null);
      setExecMetrics(res?.metrics || null);
    } catch (e) {
      console.error('Failed to load executive metrics:', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadInitialDependencies = async () => {
    try {
      const [clients, employees] = await Promise.all([
        api.get('/clients').catch(() => []),
        api.get('/employees').catch(() => [])
      ]);
      setClientsList(clients || []);
      setAllEmployeesList(employees || []);

      const editors = (employees || []).filter(e =>
        e.role_name === 'editor' ||
        (e.employee_type && e.employee_type.toLowerCase().includes('editor')) ||
        (e.designation && e.designation.toLowerCase().includes('editor'))
      );
      setVideoEditorsList(editors.length > 0 ? editors : employees || []);

      if (clients && clients.length > 0 && !uploadForm.client_id) {
        setUploadForm(prev => ({ ...prev, client_id: clients[0].id }));
      }
      if (editors && editors.length > 0 && !uploadForm.assigned_employee_id) {
        setUploadForm(prev => ({ ...prev, assigned_employee_id: editors[0].id }));
      }
    } catch (e) {
      console.error('Failed to load initial dependencies:', e);
    }
  };

  const loadMediaAssets = async () => {
    setLoadingMedia(true);
    try {
      const data = await api.get('/media/all');
      setMediaAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadMasterUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.get('/employees/master/users');
      setMasterUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load master users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAttendanceData = async () => {
    setLoadingAttendance(true);
    try {
      const [todayRes, recordsRes] = await Promise.all([
        api.get('/attendance/today').catch(() => null),
        api.get('/attendance/records', {
          role: attendanceRoleFilter,
          status: attendanceStatusFilter,
          search: attendanceSearch,
          date: attendanceDate
        }).catch(() => ({ records: [], summary: null }))
      ]);
      setAttendanceToday(todayRes);
      setAttendanceRecords(recordsRes?.records || []);
      if (recordsRes?.employees) {
        setAllEmployeesList(recordsRes.employees);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadSalesOverhead = async () => {
    setLoadingSales(true);
    try {
      const [dashRes, leadsRes, followRes, meetRes, dsrRes] = await Promise.all([
        api.get('/sales/dashboard').catch(() => null),
        api.get('/leads').catch(() => []),
        api.get('/leads/follow-ups').catch(() => ({ followUps: [] })),
        api.get('/meetings').catch(() => []),
        api.get('/daily-reports').catch(() => [])
      ]);
      setSalesMetrics(dashRes?.metrics || null);
      setLeadsList(Array.isArray(leadsRes) ? leadsRes : []);
      const fus = followRes?.followUps || followRes;
      setFollowUpsList(Array.isArray(fus) ? fus : []);
      setMeetingsList(Array.isArray(meetRes) ? meetRes : []);
      setDailySalesReports(Array.isArray(dsrRes) ? dsrRes : []);
    } catch (err) {
      console.error('Failed to load sales overhead:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const loadApprovalCenterData = async () => {
    setLoadingApprovals(true);
    try {
      const [allMedia, rejections] = await Promise.all([
        api.get('/media/all').catch(() => []),
        api.get('/media/client-rejections').catch(() => [])
      ]);

      const items = Array.isArray(allMedia) ? allMedia : [];

      // Stage 2: Video Editor Cuts for Admin Review
      const editorCuts = items.filter(item =>
        (item.workflow_type !== 'STATIC_GRAPHIC' && !['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type)) &&
        (item.workflow_stage === 'IN_ADMIN_REVIEW_EDITOR' ||
        (item.edited_video_url && item.workflow_stage !== 'APPROVED' && item.workflow_stage !== 'IN_CLIENT_REVIEW' && item.workflow_stage !== 'IN_ADMIN_REVIEW_SMM'))
      );

      // Stage 3: SMM Post Packages (Video + Captions/Hashtags) for Admin Review
      const smmPosts = items.filter(item =>
        (item.workflow_type !== 'STATIC_GRAPHIC' && !['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type)) &&
        (item.workflow_stage === 'IN_ADMIN_REVIEW_SMM' ||
        (item.caption && item.workflow_stage === 'SMM_CAPTIONING'))
      );

      // Dedicated Stage: Static Posts, Carousels, Flyers & Posters for Admin Review
      const staticPosts = items.filter(item =>
        (item.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type)) &&
        item.workflow_stage === 'IN_ADMIN_GRAPHIC_REVIEW'
      );

      setVideoReviewItems(editorCuts);
      setSmmReviewItems(smmPosts);
      setStaticReviewItems(staticPosts);
      setClientRejections(rejections || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoadingApprovals(false);
    }
  };

  // =========================================================================
  // ACTIONS: PILLAR 1 (RAW VIDEO & MEDIA MANAGEMENT)
  // =========================================================================

  const handleUploadRawVideo = async (e) => {
    e.preventDefault();
    if (!uploadForm.task_title || !uploadForm.client_id || !uploadForm.due_date) {
      alert('Please fill all mandatory task fields.');
      return;
    }

    setSubmittingUpload(true);
    try {
      const formData = new FormData();
      formData.append('task_title', uploadForm.task_title);
      formData.append('client_id', uploadForm.client_id);
      if (uploadForm.assigned_employee_id) {
        formData.append('assigned_employee_id', uploadForm.assigned_employee_id);
      }
      formData.append('due_date', uploadForm.due_date);
      formData.append('priority', uploadForm.priority);
      formData.append('raw_footage_notes', uploadForm.raw_footage_notes);
      formData.append('client_visible', uploadForm.client_visible ? '1' : '0');

      if (uploadFile) {
        formData.append('raw_video', uploadFile);
      } else {
        formData.append('raw_file_url', uploadForm.raw_file_url);
        formData.append('raw_file_name', uploadForm.raw_file_name);
        formData.append('raw_file_size', uploadForm.raw_file_size);
      }

      await api.post('/media/raw-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      setUploadFile(null);
      showToast('success', '🎬 Raw video footage successfully uploaded and dispatched to Video Editor!');
      loadMediaAssets();
      loadLiveExecutiveMetrics();
    } catch (err) {
      alert(err.message || 'Failed to upload raw video');
    } finally {
      setSubmittingUpload(false);
    }
  };

  const handleOpenReassignModal = (asset) => {
    setEditingAsset(asset);
    setReassignEditorId(asset.assigned_employee_id || '');
    setReassignDeadline(asset.due_date || '');
    setReassignNotes(asset.raw_footage_notes || '');
    setReassignClientVisible(asset.client_visible === 1);
  };

  const handleSaveReassignment = async (e) => {
    e.preventDefault();
    if (!editingAsset) return;

    setSubmittingReassign(true);
    try {
      await api.put(`/media/${editingAsset.id}`, {
        assigned_employee_id: reassignEditorId || null,
        due_date: reassignDeadline,
        raw_footage_notes: reassignNotes,
        client_visible: reassignClientVisible ? 1 : 0
      });

      setEditingAsset(null);
      showToast('success', 'Asset assignments and oversight specifications updated.');
      loadMediaAssets();
    } catch (err) {
      alert(err.message || 'Failed to update asset');
    } finally {
      setSubmittingReassign(false);
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (!window.confirm(`Are you sure you want to delete media asset ${asset.task_code} ("${asset.task_title}")?`)) {
      return;
    }
    try {
      await api.delete(`/media/${asset.id}`);
      showToast('success', `Asset ${asset.task_code} deleted successfully.`);
      loadMediaAssets();
      loadLiveExecutiveMetrics();
    } catch (err) {
      alert(err.message || 'Failed to delete asset');
    }
  };

  const handleDownloadRawFile = (asset) => {
    if (!asset.raw_file_url) {
      alert('No raw footage URL associated with this asset card.');
      return;
    }
    const link = document.createElement('a');
    link.href = asset.raw_file_url;
    link.setAttribute('download', asset.raw_file_name || 'raw_footage.mp4');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // ACTIONS: PILLAR 2 (MASTER USER & ROLE MANAGEMENT)
  // =========================================================================

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createUserForm.username || !createUserForm.email || !createUserForm.password || !createUserForm.role_name) {
      alert('Please fill in username, email, password, and select a role.');
      return;
    }

    setSubmittingCreateUser(true);
    try {
      await api.post('/employees/master/users', createUserForm);
      setShowCreateUserModal(false);
      setCreateUserForm({
        username: '',
        email: '',
        password: '',
        role_name: 'editor',
        first_name: '',
        last_name: '',
        phone: '',
        designation: '',
        company_name: ''
      });
      showToast('success', 'User account created and role permissions enforced!');
      loadMasterUsers();
      loadLiveExecutiveMetrics();
    } catch (err) {
      alert(err.message || 'Failed to create user account');
    } finally {
      setSubmittingCreateUser(false);
    }
  };

  const handleUpdateRole = async (user, newRoleName) => {
    try {
      await api.put(`/employees/master/users/${user.id}`, {
        role_name: newRoleName
      });
      showToast('success', `Role for ${user.username} dynamically updated to ${newRoleName.toUpperCase()}. Portal navigation immediately enforced upon login.`);
      loadMasterUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleToggleSuspendUser = async (user) => {
    const action = user.is_active === 1 ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user account "${user.username}"?`)) {
      return;
    }
    try {
      const res = await api.put(`/employees/master/users/${user.id}/toggle-suspend`);
      showToast('success', res.message || `User account ${action}d successfully.`);
      loadMasterUsers();
    } catch (err) {
      alert(err.message || 'Failed to toggle account suspension');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanently revoke and delete user account "${user.username}"?`)) {
      return;
    }
    try {
      await api.delete(`/employees/master/users/${user.id}`);
      showToast('success', `User account ${user.username} revoked and deleted.`);
      loadMasterUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user account');
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmittingEditUser(true);
    try {
      await api.put(`/employees/master/users/${editingUser.id}`, {
        username: editingUser.username,
        email: editingUser.email,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        phone: editingUser.phone,
        designation: editingUser.designation,
        company_name: editingUser.company_name,
        role_name: editingUser.role_name
      });
      setEditingUser(null);
      showToast('success', 'User profile credentials and role synced.');
      loadMasterUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    } finally {
      setSubmittingEditUser(false);
    }
  };

  // =========================================================================
  // ACTIONS: PILLAR 5 (WORKFLOW APPROVAL & REVISION CENTER)
  // =========================================================================

  const handleApproveVideoEdit = async (task) => {
    try {
      await api.post(`/media/${task.id}/admin-editor-review`, {
        decision: 'APPROVE',
        notes: 'Video cut approved by Admin. Automatically routed to Social Media Manager for captions & hashtags.'
      });
      showToast('success', `✨ Video cut for "${task.task_title}" approved! Automatically advanced to Social Media Manager.`);
      loadApprovalCenterData();
      loadLiveExecutiveMetrics();
      loadMediaAssets();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleApproveSmmPost = async (task) => {
    try {
      await api.post(`/media/${task.id}/admin-smm-review`, {
        decision: 'APPROVE',
        notes: 'Full post package approved by Admin. Published to Client Dashboard for final client sign-off.'
      });
      showToast('success', `🚀 Full post for "${task.task_title}" approved! Published to Client Dashboard for final client review.`);
      loadApprovalCenterData();
      loadLiveExecutiveMetrics();
      loadMediaAssets();
    } catch (err) {
      alert(err.message || 'Post approval failed');
    }
  };

  const handleApproveGraphicPost = async (task) => {
    try {
      await api.post(`/media/${task.id}/admin-graphic-review`, {
        decision: 'APPROVE',
        notes: 'Graphic creative & copy approved by Admin. Published to Client Dashboard for final approval.'
      });
      showToast('success', `🚀 ${task.post_type || 'Graphic Post'} "${task.task_title}" approved! Published to Client Dashboard for final client approval.`);
      loadApprovalCenterData();
      loadLiveExecutiveMetrics();
      loadMediaAssets();
    } catch (err) {
      alert(err.message || 'Graphic post approval failed');
    }
  };

  const handleOpenRevisionModal = (task) => {
    setRevisionModalTask(task);
    setRevisionComments('');
  };

  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    if (!revisionModalTask) return;
    if (!revisionComments.trim()) {
      alert('Please specify the revision notes detailing required changes.');
      return;
    }

    setSubmittingRevision(true);
    const isGraphic = revisionModalTask.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(revisionModalTask.post_type);
    const isSmmPost = revisionModalTask.workflow_stage === 'IN_ADMIN_REVIEW_SMM' || (revisionModalTask.caption && !revisionModalTask.workflow_stage?.includes('EDITOR'));

    try {
      if (isGraphic) {
        await api.post(`/media/${revisionModalTask.id}/admin-graphic-review`, {
          decision: 'DISAPPROVE',
          notes: revisionComments.trim()
        });
        showToast('warning', `⚠️ Revision notes attached. Task looped back directly to Social Media Manager.`);
      } else if (isSmmPost) {
        await api.post(`/media/${revisionModalTask.id}/admin-smm-review`, {
          decision: 'DISAPPROVE',
          notes: revisionComments.trim()
        });
        showToast('warning', `⚠️ Caption revision notes attached. Task looped back directly to Social Media Manager.`);
      } else {
        await api.post(`/media/${revisionModalTask.id}/admin-editor-review`, {
          decision: 'DISAPPROVE',
          notes: revisionComments.trim()
        });
        showToast('warning', `⚠️ Video revision notes attached. Task looped back directly to Video Editor.`);
      }
      setRevisionModalTask(null);
      loadApprovalCenterData();
      loadLiveExecutiveMetrics();
      loadMediaAssets();
    } catch (err) {
      alert(err.message || 'Failed to request revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const renderStatusBadge = (reviewStatus, status) => {
    if (reviewStatus === 'Approved' || status === 'COMPLETED') {
      return (
        <span className="status-badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    }
    if (reviewStatus === 'Needs Revision' || status === 'REVISION') {
      return (
        <span className="status-badge red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} /> Needs Revision
        </span>
      );
    }
    if (reviewStatus === 'Pending Approval' || status === 'INTERNAL REVIEW') {
      return (
        <span className="status-badge yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    return (
      <span className="status-badge blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Sparkles size={12} /> In Production
      </span>
    );
  };

  // Helper: Isolate Video Production Workflow from Static Graphics (Static Post, Carousel, Flyer, Poster)
  const isVideoTask = (item) => {
    if (!item) return false;
    if (item.workflow_type === 'STATIC_GRAPHIC') return false;
    const staticTypes = ['Static Post', 'Carousel', 'Flyer', 'Poster'];
    if (staticTypes.includes(item.post_type) || staticTypes.includes(item.task_type)) return false;
    return true;
  };

  // Filtered Assets & Users
  const filteredMedia = mediaAssets.filter(item => {
    if (!isVideoTask(item)) return false;
    const matchSearch = !mediaSearch ||
      item.task_title?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      item.task_code?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      item.assigned_employee_name?.toLowerCase().includes(mediaSearch.toLowerCase());
    const matchStatus = mediaFilterStatus === 'ALL' || item.review_status === mediaFilterStatus;
    return matchSearch && matchStatus;
  });

  const filteredUsers = masterUsers.filter(u => {
    const matchSearch = !userSearch ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role_name === userRoleFilter;
    const matchStatus = userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ACTIVE' && u.is_active === 1) ||
      (userStatusFilter === 'SUSPENDED' && u.is_active === 0);
    return matchSearch && matchRole && matchStatus;
  });

  const m = execMetrics || {};

  return (
    <div className="portal-inner-container">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: toast.type === 'success' ? '#10B981' : '#E50914',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '13.5px'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Modern Black & Red Executive Header */}
      <div className="portal-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#E50914',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              Core Admin Control Center
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: isConnected ? '#34D399' : '#F87171',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10B981' : '#EF4444'
              }} />
              {isConnected ? 'LIVE REAL-TIME' : 'OFFLINE'}
            </div>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
            Admin Control Panel & System-Wide Media Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#D4D4D8', margin: '4px 0 0' }}>
            Dynamic workflow operations: raw video deposit, role assignments, live attendance oversight, sales overhead, and video cut approvals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#E50914',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(229, 9, 20, 0.4)'
            }}
          >
            <Upload size={16} /> Upload Raw Video Task
          </button>
          <button
            onClick={() => setShowCreateGraphicModal(true)}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Sparkles size={16} /> + Create Static / Carousel Task
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Delete all mock/sample tasks from database? This leaves a 100% clean real-time operational database.')) {
                try {
                  await api.post('/media/clean-tasks');
                  showToast('success', 'Database cleared cleanly. Operating in 100% real-time.');
                  loadMediaAssets();
                  loadApprovalCenterData();
                  loadLiveExecutiveMetrics();
                } catch (e) {
                  alert(e.message || 'Failed to clean tasks');
                }
              }
            }}
            className="btn"
            style={{
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#222222',
              color: '#A1A1AA',
              border: '1px solid #333333'
            }}
            title="Wipe mock tasks for zero-seed operational testing"
          >
            <Trash2 size={14} /> Clean Mock Data
          </button>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="btn btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UserPlus size={16} /> New User Account
          </button>
        </div>
      </div>

      {/* Dynamic Operational KPI Ribbon */}
      <div className="kpi-grid">
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11.5px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase' }}>Active Clients</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
            {m.active_clients || clientsList.length}
          </div>
          <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Live Client Directory</div>
        </div>

        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #E50914' }}>
          <div style={{ fontSize: '11.5px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase' }}>Video Deliverables</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#E50914', marginTop: '4px' }}>
            {mediaAssets.filter(isVideoTask).length}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Raw & Edited Assets</div>
        </div>

        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11.5px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase' }}>Staff Checked In</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            {attendanceToday?.present_count || m.attendance_today || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Live On-Duty Today</div>
        </div>

        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '11.5px', color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase' }}>Pending Approvals</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
            {videoReviewItems.length}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Video Cuts Awaiting Sign-off</div>
        </div>
      </div>

      {/* Main Command Tabs (5 Pillars) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: '#121212',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid #2D2D2D',
        marginBottom: '26px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'approvals', label: '1. Multi-Stage Approval Inbox', icon: Award, badge: videoReviewItems.length + smmReviewItems.length + staticReviewItems.length },
          { id: 'media', label: '2. Raw Video & Distribution', icon: Video, badge: mediaAssets.filter(isVideoTask).length },
          { id: 'attendance', label: '3. Master Attendance Center', icon: Clock, badge: attendanceToday?.present_count },
          { id: 'users', label: '4. User & Role Management', icon: Users, badge: masterUsers.length },
          { id: 'rejections', label: '5. Global Audit & Rejection Logs', icon: AlertCircle, badge: clientRejections.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === 'rejections'
            ? (activeTab === 'approvals' && approvalSubTab === 'client_rejections')
            : tab.id === 'approvals'
              ? (activeTab === 'approvals' && approvalSubTab !== 'client_rejections')
              : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#E50914' : 'transparent',
                color: isActive ? '#FFFFFF' : '#A1A1AA',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 16px rgba(229, 9, 20, 0.4)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span style={{
                  backgroundColor: isActive ? '#FFFFFF' : '#2D2D2D',
                  color: isActive ? '#E50914' : '#D4D4D8',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  marginLeft: '4px'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* PILLAR 1: RAW VIDEO UPLOAD & MEDIA SHARING */}
      {/* ===================================================================== */}
      {activeTab === 'media' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '600px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
                <input
                  type="text"
                  placeholder="Search video task by title, code, client, or editor..."
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <select
                value={mediaFilterStatus}
                onChange={e => setMediaFilterStatus(e.target.value)}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Review Statuses</option>
                <option value="In Production">In Production</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Needs Revision">Needs Revision</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadMediaAssets}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loadingMedia ? 'spin' : ''} /> Refresh Media
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={14} /> Upload Raw Footage
              </button>
            </div>
          </div>

          {/* Shared Access Rules Card */}
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2D2D2D',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Shield size={16} color="#E50914" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#FFFFFF' }}>Admin Oversight:</strong>
                <p style={{ margin: '2px 0 0', color: '#A1A1AA' }}>Upload raw footage, assign deadline/notes, review cuts, re-assign editors, or replace media assets.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Video size={16} color="#60A5FA" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#FFFFFF' }}>Video Editor View:</strong>
                <p style={{ margin: '2px 0 0', color: '#A1A1AA' }}>Access and download raw files assigned to them, upload edited versions, and track revision notes.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Eye size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#FFFFFF' }}>Client Shared Access:</strong>
                <p style={{ margin: '2px 0 0', color: '#A1A1AA' }}>Preview client-visible media assets (raw or finished drafts) along with project notes and captions.</p>
              </div>
            </div>
          </div>

          {/* Dynamic Table */}
          {loadingMedia ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A1A1AA' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#E50914' }} />
              <div>Querying database media assets...</div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center' }}>
              <Video size={36} color="#E50914" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No raw video assets yet</h3>
              <p style={{ color: '#A1A1AA', fontSize: '13px', margin: '0 0 16px' }}>
                Your production workflow is clean and ready. Upload your first raw video footage below.
              </p>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
                <Upload size={14} /> Upload Raw Video File
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '14px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task & Code</th>
                    <th>Client Organization</th>
                    <th>Assigned Video Editor</th>
                    <th>Deadline & Priority</th>
                    <th>Raw Footage Asset</th>
                    <th>Edited Video Cut</th>
                    <th>Review Status</th>
                    <th>Client Visibility</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedia.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #2D2D2D' }}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>{item.task_title}</div>
                        <div style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace', marginTop: '2px' }}>{item.task_code}</div>
                        {item.raw_footage_notes && (
                          <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📝 {item.raw_footage_notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px' }}>{item.company_name}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{item.client_code}</div>
                      </td>
                      <td>
                        {item.assigned_employee_name ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#E0E7FF', fontSize: '12.5px' }}>{item.assigned_employee_name}</div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{item.assigned_employee_designation || 'Video Editor'}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#F59E0B', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#D4D4D8' }}>{item.due_date}</div>
                        <span className={`status-badge ${item.priority === 'URGENT' ? 'red' : item.priority === 'HIGH' ? 'yellow' : 'blue'}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                          {item.priority}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Video size={13} color="#60A5FA" /> {item.raw_file_name || 'Footage.mp4'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '1px' }}>
                            {item.raw_file_size ? `${Math.round(item.raw_file_size / 1024 / 1024)} MB` : 'Cloud Stream'}
                          </div>
                          {item.raw_file_url && (
                            <button
                              onClick={() => handleDownloadRawFile(item)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60A5FA',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Download size={11} /> Download Raw
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.edited_video_url ? (
                          <div>
                            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> {item.edited_video_name || `Cut v${item.version_count || 1}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA' }}>Duration: {item.video_duration || '00:45'}</div>
                            <button
                              onClick={() => {
                                setPreviewVideoUrl(item.edited_video_url);
                                setPreviewVideoTitle(`${item.task_title} (Cut v${item.version_count || 1})`);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#E50914',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                marginTop: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Play size={11} /> Stream / Preview
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#71717A' }}>Awaiting Editor Cut</span>
                        )}
                      </td>
                      <td>{renderStatusBadge(item.review_status, item.status)}</td>
                      <td>
                        {item.client_visible === 1 ? (
                          <span className="status-badge green" style={{ fontSize: '10.5px' }}>✓ Client Visible</span>
                        ) : (
                          <span className="status-badge gray" style={{ fontSize: '10.5px' }}>🔒 Internal Only</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenReassignModal(item)}
                            title="Re-assign Editor or Adjust Oversight"
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(item)}
                            title="Delete Asset & Associated Files"
                            style={{
                              padding: '5px 8px',
                              fontSize: '11px',
                              backgroundColor: 'rgba(229, 9, 20, 0.1)',
                              border: '1px solid rgba(229, 9, 20, 0.3)',
                              color: '#EF4444',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PILLAR 2: MASTER USER & ROLE MANAGEMENT */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '700px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
                <input
                  type="text"
                  placeholder="Search user by username, email, full name, or company..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="sales">Sales Executive</option>
                <option value="marketing_manager">Social Media Manager</option>
                <option value="editor">Video Editor</option>
                <option value="client">Client</option>
                <option value="admin">Administrator</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={e => setUserStatusFilter(e.target.value)}
                style={{
                  padding: '9px 12px',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadMasterUsers}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loadingUsers ? 'spin' : ''} /> Refresh Accounts
              </button>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserPlus size={14} /> Create User Account
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A1A1AA' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#E50914' }} />
              <div>Fetching user accounts...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center' }}>
              <Users size={36} color="#E50914" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No user accounts match</h3>
              <p style={{ color: '#A1A1AA', fontSize: '13px' }}>Adjust your filters or add a new team member.</p>
            </div>
          ) : (
            <div className="table-container" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '14px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User & Credentials</th>
                    <th>Linked Profile</th>
                    <th>Dynamic Role Assignment</th>
                    <th>Enforced Portal Route</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    let enforcedPortal = '/employee';
                    if (user.role_name === 'admin' || user.user_type === 'admin') enforcedPortal = '/admin';
                    else if (user.role_name === 'client' || user.user_type === 'client') enforcedPortal = '/client';
                    else if (user.role_name === 'sales') enforcedPortal = '/sales';
                    else if (user.role_name === 'marketing_manager') enforcedPortal = '/employee (SMM)';
                    else if (user.role_name === 'editor') enforcedPortal = '/employee (Editor)';

                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #2D2D2D' }}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>{user.username}</div>
                          <div style={{ fontSize: '12px', color: '#A1A1AA' }}>{user.email}</div>
                          <div style={{ fontSize: '10.5px', color: '#71717A', marginTop: '2px' }}>UID: #{user.id}</div>
                        </td>
                        <td>
                          {user.user_type === 'client' ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#60A5FA', fontSize: '13px' }}>{user.company_name || 'Client Account'}</div>
                              <div style={{ fontSize: '11px', color: '#A1A1AA' }}>Contact: {user.primary_contact_name || user.full_name || '—'}</div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, color: '#E0E7FF', fontSize: '13px' }}>{user.full_name || user.username}</div>
                              <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{user.designation || 'Agency Staff'}</div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <select
                              value={user.role_name}
                              onChange={e => handleUpdateRole(user, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#141414',
                                border: '1px solid #3B82F6',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="sales">Sales Executive</option>
                              <option value="marketing_manager">Social Media Manager</option>
                              <option value="editor">Video Editor</option>
                              <option value="client">Client</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#1F2937',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            color: '#93C5FD',
                            fontFamily: 'monospace'
                          }}>
                            <ArrowUpRight size={12} /> {enforcedPortal}
                          </span>
                        </td>
                        <td>
                          {user.is_active === 1 ? (
                            <span className="status-badge green" style={{ fontSize: '11px' }}>
                              <CheckCircle2 size={11} /> Active
                            </span>
                          ) : (
                            <span className="status-badge red" style={{ fontSize: '11px' }}>
                              <AlertCircle size={11} /> Suspended
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', color: '#71717A' }}>
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => setEditingUser(user)}
                              title="Edit User Credentials & Info"
                              className="btn btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '11px' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleSuspendUser(user)}
                              title={user.is_active === 1 ? 'Suspend Account' : 'Activate Account'}
                              style={{
                                padding: '5px 8px',
                                fontSize: '11px',
                                backgroundColor: user.is_active === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                border: `1px solid ${user.is_active === 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                color: user.is_active === 1 ? '#F87171' : '#34D399',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              {user.is_active === 1 ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Revoke / Delete User"
                              style={{
                                padding: '5px 8px',
                                fontSize: '11px',
                                backgroundColor: 'rgba(229, 9, 20, 0.1)',
                                border: '1px solid rgba(229, 9, 20, 0.3)',
                                color: '#EF4444',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PILLAR 3: UNIVERSAL ATTENDANCE MANAGEMENT CENTER */}
      {/* ===================================================================== */}
      {activeTab === 'attendance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Active Personnel</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {attendanceToday?.total_employees || allEmployeesList.length}
              </div>
              <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Registered Employees</div>
            </div>

            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Checked In Today</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                {attendanceToday?.present_count || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Live On-Duty</div>
            </div>

            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Late Arrivals</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                {attendanceToday?.late_count || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Past Grace Window</div>
            </div>

            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #E50914' }}>
              <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Absences / Pending</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#E50914', marginTop: '4px' }}>
                {attendanceToday?.absent_count || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Not yet punched</div>
            </div>

            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Shifts Completed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', marginTop: '4px' }}>
                {attendanceToday?.completed_count || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>Checked-out staff</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '800px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
                <input
                  type="text"
                  placeholder="Search historical logs by employee name or code..."
                  value={attendanceSearch}
                  onChange={e => setAttendanceSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <select
                value={attendanceRoleFilter}
                onChange={e => setAttendanceRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="sales">Sales Executive</option>
                <option value="marketing_manager">Social Media Manager</option>
                <option value="editor">Video Editor</option>
              </select>

              <select
                value={attendanceStatusFilter}
                onChange={e => setAttendanceStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="HALF DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={loadAttendanceData}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={loadingAttendance ? 'spin' : ''} /> Filter Logs
              </button>
            </div>
          </div>

          {loadingAttendance ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A1A1AA' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#E50914' }} />
              <div>Fetching attendance logs from DB...</div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center' }}>
              <Clock size={36} color="#E50914" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No attendance entries logged</h3>
              <p style={{ color: '#A1A1AA', fontSize: '13px' }}>
                Direct employee check-ins and punches will immediately register here.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '14px', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee Name & Code</th>
                    <th>Role & Department</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Audit Note</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #2D2D2D' }}>
                      <td style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px' }}>{rec.date}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13px' }}>{rec.employee_name || `${rec.first_name} ${rec.last_name}`}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{rec.employee_code}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#93C5FD' }}>{rec.role_display || rec.role_name}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{rec.department_name || rec.designation}</div>
                      </td>
                      <td style={{ color: '#D4D4D8', fontSize: '12.5px' }}>{rec.check_in_time || '—'}</td>
                      <td style={{ color: '#D4D4D8', fontSize: '12.5px' }}>{rec.check_out_time || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '12.5px' }}>
                        {rec.total_working_hours ? `${rec.total_working_hours} hrs` : '—'}
                      </td>
                      <td>
                        <span className={`status-badge ${rec.status === 'PRESENT' ? 'green' : rec.status === 'LATE' ? 'yellow' : 'red'}`} style={{ fontSize: '11px' }}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        {rec.is_manual_adjusted === 1 ? (
                          <div style={{ fontSize: '11px', color: '#F59E0B' }}>
                            <strong>Adjusted:</strong> {rec.adjustment_reason}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#71717A' }}>Direct Punch</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PILLAR 5: WORKFLOW APPROVAL & REVISION CENTER */}
      {/* ===================================================================== */}
      {activeTab === 'approvals' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setApprovalSubTab('editor_review');
                navigate('/admin?tab=approvals');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: approvalSubTab === 'editor_review' ? '#E50914' : '#1A1A1A',
                color: approvalSubTab === 'editor_review' ? '#FFFFFF' : '#A1A1AA',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: approvalSubTab === 'editor_review' ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none'
              }}
            >
              <Video size={15} /> Stage 2: Video Editor Uploads ({videoReviewItems.length})
            </button>

            <button
              onClick={() => {
                setApprovalSubTab('smm_review');
                navigate('/admin?tab=approvals');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: approvalSubTab === 'smm_review' ? '#E50914' : '#1A1A1A',
                color: approvalSubTab === 'smm_review' ? '#FFFFFF' : '#A1A1AA',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: approvalSubTab === 'smm_review' ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none'
              }}
            >
              <Award size={15} /> Stage 3: SMM Post Packages ({smmReviewItems.length})
            </button>

            <button
              onClick={() => {
                setApprovalSubTab('static_review');
                navigate('/admin?tab=approvals');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: approvalSubTab === 'static_review' ? '#8B5CF6' : '#1A1A1A',
                color: approvalSubTab === 'static_review' ? '#FFFFFF' : '#A1A1AA',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: approvalSubTab === 'static_review' ? '0 0 15px rgba(139, 92, 246, 0.4)' : 'none'
              }}
            >
              <Sparkles size={15} /> 🎨 Static Posts, Carousels & Flyers ({staticReviewItems.length})
            </button>

            <button
              onClick={() => {
                setApprovalSubTab('client_rejections');
                navigate('/admin?tab=rejections');
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: approvalSubTab === 'client_rejections' ? '#E50914' : '#1A1A1A',
                color: approvalSubTab === 'client_rejections' ? '#FFFFFF' : '#A1A1AA',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: approvalSubTab === 'client_rejections' ? '0 0 15px rgba(229, 9, 20, 0.4)' : 'none'
              }}
            >
              <ShieldAlert size={15} /> Stage 4: Client Rejection Logs & Routing ({clientRejections.length})
            </button>
          </div>

          {/* SUB-TAB 1: STAGE 2 VIDEO EDITOR UPLOADS */}
          {approvalSubTab === 'editor_review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '10px', padding: '12px 18px', fontSize: '12.5px', color: '#A1A1AA' }}>
                <strong style={{ color: '#FFFFFF' }}>Step 2 Admin Approval:</strong> If approved, task automatically advances to Social Media Manager (SMM) stage. If disapproved, attach revision notes to loop back directly to Video Editor.
              </div>

              {videoReviewItems.length === 0 ? (
                <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                  <Award size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No video editor cuts awaiting review</h3>
                  <p style={{ color: '#A1A1AA', fontSize: '13px' }}>
                    All submitted video cuts have been reviewed or are currently being edited by team members.
                  </p>
                </div>
              ) : (
                videoReviewItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2D2D2D',
                      borderRadius: '14px',
                      padding: '22px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(320px, 420px) 1fr',
                      gap: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      borderLeft: item.review_status === 'Approved' ? '4px solid #10B981' : (item.review_status === 'Needs Revision - Video' ? '4px solid #EF4444' : '4px solid #E50914')
                    }}
                  >
                    <div>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #2D2D2D' }}>
                        <video
                          controls
                          playsInline
                          src={item.edited_video_url || item.raw_file_url || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-studio-41154-large.mp4'}
                          style={{ width: '100%', height: '240px', objectFit: 'contain', backgroundColor: '#000' }}
                        />
                        <div style={{ padding: '8px 12px', backgroundColor: '#121212', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA' }}>
                          <span>{item.edited_video_name || `Cut v${item.version_count || 1}`}</span>
                          <span>Duration: {item.video_duration || '00:45'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, fontFamily: 'monospace' }}>{item.task_code}</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{item.task_title}</h3>
                            <div style={{ fontSize: '12px', color: '#A1A1AA' }}>Client: <strong style={{ color: '#FFFFFF' }}>{item.company_name}</strong></div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(229, 9, 20, 0.15)',
                            border: '1px solid rgba(229, 9, 20, 0.4)',
                            color: '#FF6B6B',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            {item.review_status || 'In Admin Review'}
                          </span>
                        </div>

                        <div style={{ backgroundColor: '#121212', border: '1px solid #2D2D2D', borderRadius: '8px', padding: '12px', margin: '12px 0', fontSize: '12.5px' }}>
                          <div style={{ color: '#93C5FD', fontWeight: 700, marginBottom: '2px' }}>Video Editor Notes:</div>
                          <div style={{ color: '#D4D4D8' }}>{item.editor_notes || item.raw_footage_notes || 'Director cut ready for review.'}</div>
                          {item.admin_feedback && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2D2D2D', color: '#F87171' }}>
                              <strong>Latest Feedback:</strong> {item.admin_feedback}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A1A1AA' }}>
                          <div>Editor: <strong style={{ color: '#FFFFFF' }}>{item.assigned_employee_name || 'Unassigned'}</strong></div>
                          <div>Version: <strong style={{ color: '#FFFFFF' }}>v{item.version_count || 1}</strong></div>
                          <div>Due: <strong style={{ color: '#FFFFFF' }}>{item.due_date}</strong></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #2D2D2D' }}>
                        <button
                          onClick={() => handleApproveVideoEdit(item)}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#10B981',
                            borderColor: '#10B981'
                          }}
                        >
                          <Check size={16} /> Approve Video (Advance to SMM)
                        </button>
                        <button
                          onClick={() => handleOpenRevisionModal(item)}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: '#F87171',
                            borderColor: '#EF4444'
                          }}
                        >
                          <AlertTriangle size={15} /> Disapprove (Revision Notes)
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUB-TAB 2: STAGE 3 SMM POST PACKAGES */}
          {approvalSubTab === 'smm_review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '10px', padding: '12px 18px', fontSize: '12.5px', color: '#A1A1AA' }}>
                <strong style={{ color: '#FFFFFF' }}>Step 3 Admin Approval:</strong> If approved, the complete post (Video + Captions + Hashtags) is published to the Client Dashboard for final review. If disapproved, attach notes to loop back to SMM.
              </div>

              {smmReviewItems.length === 0 ? (
                <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                  <Award size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No SMM posts awaiting review</h3>
                  <p style={{ color: '#A1A1AA', fontSize: '13px' }}>
                    All submitted post packages have been reviewed or are in production.
                  </p>
                </div>
              ) : (
                smmReviewItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2D2D2D',
                      borderRadius: '14px',
                      padding: '22px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(320px, 420px) 1fr',
                      gap: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      borderLeft: '4px solid #3B82F6'
                    }}
                  >
                    <div>
                      <div style={{ borderRadius: '10px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #2D2D2D' }}>
                        <video
                          controls
                          playsInline
                          src={item.edited_video_url || item.raw_file_url}
                          style={{ width: '100%', height: '240px', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ padding: '8px 12px', backgroundColor: '#121212', fontSize: '11px', color: '#A1A1AA', marginTop: '6px' }}>
                        Platforms: <strong>{item.target_platforms || 'Instagram Reels, TikTok'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, fontFamily: 'monospace' }}>{item.task_code}</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{item.task_title}</h3>
                            <div style={{ fontSize: '12px', color: '#A1A1AA' }}>Client: <strong style={{ color: '#FFFFFF' }}>{item.company_name}</strong></div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#93C5FD',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>
                            SMM Post Review
                          </span>
                        </div>

                        {/* Caption & Hashtag Box */}
                        <div style={{ backgroundColor: '#121212', border: '1px solid #2D2D2D', borderRadius: '8px', padding: '14px', margin: '12px 0' }}>
                          <div style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Post Caption (by SMM):
                          </div>
                          <div style={{ fontSize: '13px', color: '#FFFFFF', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {item.caption || '(No caption attached)'}
                          </div>
                          {item.hashtags && (
                            <div style={{ fontSize: '12px', color: '#6EE7B7', marginTop: '8px' }}>
                              {item.hashtags}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A1A1AA' }}>
                          <div>SMM: <strong style={{ color: '#FFFFFF' }}>{item.assigned_smm_name || 'Unassigned'}</strong></div>
                          <div>Publish Target: <strong style={{ color: '#FFFFFF' }}>{item.schedule_publish_date || item.due_date}</strong></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #2D2D2D' }}>
                        <button
                          onClick={() => handleApproveSmmPost(item)}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#10B981',
                            borderColor: '#10B981'
                          }}
                        >
                          <Check size={16} /> Approve Post (Publish to Client Dashboard)
                        </button>
                        <button
                          onClick={() => handleOpenRevisionModal(item)}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: '#F87171',
                            borderColor: '#EF4444'
                          }}
                        >
                          <AlertTriangle size={15} /> Disapprove Captions (Revision Notes)
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* DEDICATED SUB-TAB: STATIC POSTS, CAROUSELS, FLYERS & POSTERS REVIEW */}
          {approvalSubTab === 'static_review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141414',
                border: '1px solid #262626',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '12.5px',
                color: '#A1A1AA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <strong style={{ color: '#FFFFFF' }}>Step 3 Admin Review for Graphic Creatives:</strong> Review the uploaded creative image / carousel slides, post caption, and hashtags drafted by the Social Media Manager (SMM). If approved, deliverable advances to Client Dashboard for final approval. If disapproved, attach revision notes to loop back directly to SMM.
                </div>
                <button
                  onClick={() => setShowCreateGraphicModal(true)}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={13} /> + New Graphic Task
                </button>
              </div>

              {staticReviewItems.length === 0 ? (
                <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                  <Sparkles size={36} color="#8B5CF6" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No Static Posts or Carousels awaiting review</h3>
                  <p style={{ color: '#A1A1AA', fontSize: '13px' }}>
                    All submitted graphic post drafts have been reviewed or are currently being drafted by SMM.
                  </p>
                </div>
              ) : (
                staticReviewItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2D2D2D',
                      borderRadius: '14px',
                      padding: '22px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(320px, 460px) 1fr',
                      gap: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      borderLeft: '4px solid #8B5CF6'
                    }}
                  >
                    <div>
                      <GraphicPostViewer task={item} maxHeight="340px" />
                      <div style={{ padding: '8px 12px', backgroundColor: '#121212', fontSize: '11px', color: '#A1A1AA', marginTop: '6px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Platforms: <strong style={{ color: '#FFFFFF' }}>{item.target_platforms || 'Instagram, LinkedIn'}</strong></span>
                        <span>Format: <strong style={{ color: '#8B5CF6' }}>{item.post_type || 'Static Post'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 800, fontFamily: 'monospace' }}>{item.task_code}</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{item.task_title}</h3>
                            <div style={{ fontSize: '12px', color: '#A1A1AA' }}>Client: <strong style={{ color: '#FFFFFF' }}>{item.company_name}</strong></div>
                          </div>
                          <WorkflowBadge stage={item.workflow_stage} status={item.review_status} size="md" />
                        </div>

                        {/* Caption & Hashtag Box */}
                        <div style={{ backgroundColor: '#121212', border: '1px solid #2D2D2D', borderRadius: '8px', padding: '14px', margin: '12px 0' }}>
                          <div style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Post Caption (Drafted by SMM):
                          </div>
                          <div style={{ fontSize: '13px', color: '#FFFFFF', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {item.caption || '(No caption provided)'}
                          </div>
                          {item.hashtags && (
                            <div style={{ fontSize: '12px', color: '#6EE7B7', marginTop: '8px' }}>
                              {item.hashtags}
                            </div>
                          )}
                        </div>

                        {item.raw_footage_notes && (
                          <div style={{ fontSize: '12px', color: '#9CA3AF', backgroundColor: '#161616', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px' }}>
                            <strong style={{ color: '#D1D5DB' }}>Admin Creative Brief:</strong> {item.raw_footage_notes}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A1A1AA' }}>
                          <div>SMM: <strong style={{ color: '#FFFFFF' }}>{item.assigned_smm_name || 'Unassigned'}</strong></div>
                          <div>Target Publish: <strong style={{ color: '#FFFFFF' }}>{item.schedule_publish_date || item.due_date}</strong></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #2D2D2D' }}>
                        <button
                          onClick={() => handleApproveGraphicPost(item)}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#10B981',
                            borderColor: '#10B981'
                          }}
                        >
                          <Check size={16} /> Approve Post (Publish to Client Dashboard)
                        </button>
                        <button
                          onClick={() => handleOpenRevisionModal(item)}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: '#F87171',
                            borderColor: '#EF4444'
                          }}
                        >
                          <AlertTriangle size={15} /> Disapprove & Request Revisions (Loop to SMM)
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUB-TAB 4: STAGE 4 CLIENT REJECTIONS & SPLIT ROUTING */}
          {approvalSubTab === 'client_rejections' && (
            <div>
              <div style={{
                backgroundColor: '#141414',
                border: '1px solid #2D2D2D',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldAlert size={20} color="#E50914" />
                <div style={{ fontSize: '13px', color: '#D4D4D8' }}>
                  <strong>Client Rejection Audit Stream:</strong> Automatically captures every creative or video cut rejected by clients in the client portal, verifying that revision notes are routed directly to the designated employee.
                </div>
              </div>

              {clientRejections.length === 0 ? (
                <div className="table-container empty-state" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', padding: '40px', textAlign: 'center' }}>
                  <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>No client rejections logged</h3>
                  <p style={{ color: '#A1A1AA', fontSize: '13px' }}>
                    All client-reviewed deliverables are in approved standing.
                  </p>
                </div>
              ) : (
                <div className="table-container" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '14px', overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asset Code & Title</th>
                        <th>Client Organization</th>
                        <th>Client Feedback Notes</th>
                        <th>Assigned Creative</th>
                        <th>Routing Verification</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientRejections.map((rej, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #2D2D2D' }}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '13.5px' }}>{rej.item_title}</div>
                            <div style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace' }}>{rej.item_code}</div>
                            <span style={{ fontSize: '10.5px', background: '#1F2937', color: '#93C5FD', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                              {rej.asset_category} ({rej.platform || 'General'})
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '13px' }}>{rej.client_name}</div>
                            <div style={{ fontSize: '11px', color: '#71717A' }}>{rej.client_code}</div>
                          </td>
                          <td>
                            <div style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12.5px',
                              color: '#FCA5A5',
                              maxWidth: '380px'
                            }}>
                              {rej.feedback_notes || 'Client requested revisions on visual style and framing.'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#E0E7FF', fontSize: '13px' }}>{rej.assigned_employee_name || 'Unassigned'}</div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{rej.assigned_employee_designation || 'Creator'}</div>
                          </td>
                          <td>
                            <span style={{
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={12} /> {rej.routing_status}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '11.5px', color: '#71717A' }}>
                              {rej.rejected_at ? new Date(rej.rejected_at).toLocaleString() : 'Recent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: ADMIN RAW VIDEO UPLOAD MODAL */}
      {/* ===================================================================== */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{
            maxWidth: '640px',
            borderTop: '5px solid #E50914'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Upload Raw Video & Dispatch Assignment
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#A1A1AA' }}>
                  Admin interface to deposit raw video footage directly and route to a designated Video Editor.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadRawVideo} style={{ padding: '22px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Video Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brand Anthem High-Bitrate Reel Cut"
                    value={uploadForm.task_title}
                    onChange={e => setUploadForm({ ...uploadForm, task_title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Select Client *
                  </label>
                  <select
                    required
                    value={uploadForm.client_id}
                    onChange={e => setUploadForm({ ...uploadForm, client_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    {clientsList.length === 0 ? (
                      <option value="">No clients registered</option>
                    ) : (
                      clientsList.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Assign to Video Editor *
                  </label>
                  <select
                    required
                    value={uploadForm.assigned_employee_id}
                    onChange={e => setUploadForm({ ...uploadForm, assigned_employee_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    {videoEditorsList.length === 0 ? (
                      <option value="">No editors registered</option>
                    ) : (
                      videoEditorsList.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.designation || 'Video Editor'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Production Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.due_date}
                    onChange={e => setUploadForm({ ...uploadForm, due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={uploadForm.priority}
                    onChange={e => setUploadForm({ ...uploadForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    <option value="URGENT">URGENT (24-48h)</option>
                    <option value="HIGH">HIGH Priority</option>
                    <option value="MEDIUM">MEDIUM Priority</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div style={{
                backgroundColor: '#121212',
                border: '1px dashed #E50914',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <Video size={28} color="#E50914" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {uploadFile ? `Selected: ${uploadFile.name} (${Math.round(uploadFile.size / 1024 / 1024)} MB)` : 'Choose Raw Footage File (.mp4, .mov, .zip)'}
                </div>
                <p style={{ fontSize: '11.5px', color: '#A1A1AA', margin: '4px 0 10px' }}>
                  Or utilize direct high-speed video storage link
                </p>
                <input
                  type="file"
                  id="raw_file_input_dash"
                  accept="video/*,.zip"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="raw_file_input_dash"
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={13} /> Select Raw File from Disk
                </label>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                  Editor Instructions & Raw Footage Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Cut 9:16 vertical format for Instagram & YouTube Shorts. Emphasize fast-paced bass transitions at 0:04."
                  value={uploadForm.raw_footage_notes}
                  onChange={e => setUploadForm({ ...uploadForm, raw_footage_notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                padding: '10px 14px',
                backgroundColor: '#121212',
                borderRadius: '8px',
                border: '1px solid #2D2D2D'
              }}>
                <input
                  type="checkbox"
                  id="client_visible_dash"
                  checked={uploadForm.client_visible}
                  onChange={e => setUploadForm({ ...uploadForm, client_visible: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#E50914' }}
                />
                <label htmlFor="client_visible_dash" style={{ fontSize: '12.5px', color: '#D4D4D8', cursor: 'pointer' }}>
                  <strong>Shared Access Rule:</strong> Make uploaded asset visible in Client Portal for preview and inspection.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingUpload ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
                  {submittingUpload ? 'Uploading Footage...' : 'Dispatch Raw Video Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: VIDEO STREAM LIGHTBOX */}
      {/* ===================================================================== */}
      {previewVideoUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '840px',
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} color="#E50914" />
                <h4 style={{ margin: 0, fontSize: '15px', color: '#FFFFFF', fontWeight: 800 }}>
                  {previewVideoTitle || 'Video Stream Preview'}
                </h4>
              </div>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#000000', padding: '10px' }}>
              <video
                controls
                autoPlay
                playsInline
                src={previewVideoUrl}
                style={{ width: '100%', maxHeight: '520px', objectFit: 'contain', backgroundColor: '#000000' }}
              />
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414' }}>
              <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
                Full-bitrate live video stream preview
              </span>
              <a
                href={previewVideoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Download size={13} /> Direct Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: RE-ASSIGN EDITOR & EDIT ASSET MODAL */}
      {/* ===================================================================== */}
      {editingAsset && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Re-assign Video Editor & Oversight
                </h3>
                <span style={{ fontSize: '11.5px', color: '#E50914', fontFamily: 'monospace' }}>{editingAsset.task_code}</span>
              </div>
              <button onClick={() => setEditingAsset(null)} style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReassignment} style={{ padding: '20px 22px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                  Re-assign to Video Editor
                </label>
                <select
                  value={reassignEditorId}
                  onChange={e => setReassignEditorId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  <option value="">Unassigned / Pool</option>
                  {videoEditorsList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                  Production Deadline
                </label>
                <input
                  type="date"
                  value={reassignDeadline}
                  onChange={e => setReassignDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                  Updated Notes & Direction
                </label>
                <textarea
                  rows={3}
                  value={reassignNotes}
                  onChange={e => setReassignNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '18px',
                padding: '10px 12px',
                backgroundColor: '#121212',
                borderRadius: '8px'
              }}>
                <input
                  type="checkbox"
                  id="reassign_visible_dash"
                  checked={reassignClientVisible}
                  onChange={e => setReassignClientVisible(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#E50914' }}
                />
                <label htmlFor="reassign_visible_dash" style={{ fontSize: '12.5px', color: '#D4D4D8', cursor: 'pointer' }}>
                  Keep visible to client in client portal
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingAsset(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingReassign} className="btn btn-primary">
                  {submittingReassign ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: CREATE USER ACCOUNT MODAL */}
      {/* ===================================================================== */}
      {showCreateUserModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{
            maxWidth: '600px',
            borderTop: '5px solid #3B82F6'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Create Master User & Role Assignment
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#A1A1AA' }}>
                  Instantly establishes login credentials and binds user to appropriate portal interface.
                </p>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. editor_rahul"
                    value={createUserForm.username}
                    onChange={e => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@zentradigital.com"
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Staff@123"
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Access Role *
                  </label>
                  <select
                    required
                    value={createUserForm.role_name}
                    onChange={e => setCreateUserForm({ ...createUserForm, role_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #3B82F6',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="marketing_manager">Social Media Manager</option>
                    <option value="editor">Video Editor</option>
                    <option value="client">Client</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={createUserForm.first_name}
                    onChange={e => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={createUserForm.last_name}
                    onChange={e => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {createUserForm.role_name === 'client' ? (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                      Client Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Luxury Retails Pvt Ltd"
                      value={createUserForm.company_name}
                      onChange={e => setCreateUserForm({ ...createUserForm, company_name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        backgroundColor: '#141414',
                        border: '1px solid #2D2D2D',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Video Editor & Colorist"
                      value={createUserForm.designation}
                      onChange={e => setCreateUserForm({ ...createUserForm, designation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        backgroundColor: '#141414',
                        border: '1px solid #2D2D2D',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCreateUser} className="btn btn-primary">
                  {submittingCreateUser ? 'Creating...' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: EDIT USER CREDENTIALS MODAL */}
      {/* ===================================================================== */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2D2D2D',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Edit User Account: {editingUser.username}
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.username || ''}
                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.first_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.last_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                    Role Assignment
                  </label>
                  <select
                    value={editingUser.role_name}
                    onChange={e => setEditingUser({ ...editingUser, role_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#141414',
                      border: '1px solid #3B82F6',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    <option value="sales">Sales Executive</option>
                    <option value="marketing_manager">Social Media Manager</option>
                    <option value="editor">Video Editor</option>
                    <option value="client">Client</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingEditUser} className="btn btn-primary">
                  {submittingEditUser ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: REVISION REQUEST MODAL ("NEEDS REVISION") */}
      {/* ===================================================================== */}
      {revisionModalTask && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{
            maxWidth: '560px',
            borderTop: '5px solid #EF4444'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #2D2D2D',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                  Issue "Needs Revision" Request
                </h3>
                <span style={{ fontSize: '11.5px', color: '#A1A1AA' }}>
                  Task: {revisionModalTask.task_title} ({revisionModalTask.task_code})
                </span>
              </div>
              <button onClick={() => setRevisionModalTask(null)} style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} style={{ padding: '20px 22px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#D4D4D8', display: 'block', marginBottom: '6px' }}>
                  Revision Comments & Specific Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify exact changes needed (e.g. Truncate intro by 2 seconds, brighten shadow levels on studio shots, fix audio dip at 0:18)."
                  value={revisionComments}
                  onChange={e => setRevisionComments(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#141414',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#FCA5A5',
                marginBottom: '18px'
              }}>
                <strong>Direct Routing Notice:</strong> This revision note will be dispatched directly to {
                  (revisionModalTask.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(revisionModalTask.post_type))
                    ? `Social Media Manager (${revisionModalTask.assigned_smm_name || revisionModalTask.assigned_employee_name || 'Assigned SMM'})`
                    : revisionModalTask.caption
                      ? `Social Media Manager (${revisionModalTask.assigned_smm_name || 'Assigned SMM'})`
                      : `Video Editor (${revisionModalTask.assigned_employee_name || 'Assigned Editor'})`
                } as an urgent notification.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRevisionModalTask(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision}
                  className="btn btn-primary"
                  style={{ background: '#EF4444', borderColor: '#EF4444' }}
                >
                  {submittingRevision ? 'Dispatching...' : 'Dispatch "Needs Revision"'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ===================================================================== */}
      {/* DEDICATED STATIC / CAROUSEL / FLYER / POSTER CREATION MODAL */}
      {/* ===================================================================== */}
      <AdminCreateGraphicTaskModal
        isOpen={showCreateGraphicModal}
        onClose={() => setShowCreateGraphicModal(false)}
        clients={clientsList}
        smmEmployees={allEmployeesList.filter(e => e.role_name === 'marketing_manager' || e.employee_type === 'marketing_manager' || e.designation?.toLowerCase().includes('social') || e.department?.toLowerCase().includes('marketing'))}
        onTaskCreated={(newTask) => {
          showToast('success', `✨ New ${newTask.post_type || 'Graphic Task'} "${newTask.task_title}" created and routed to Social Media Manager!`);
          loadMediaAssets();
          loadApprovalCenterData();
          loadLiveExecutiveMetrics();
        }}
      />
    </div>
  );
}
