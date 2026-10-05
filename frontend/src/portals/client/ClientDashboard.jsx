import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import WorkflowBadge from '../../components/common/WorkflowBadge';
import GraphicPostViewer, { getPostTypeColor, getPostTypeIcon } from '../../components/common/GraphicPostViewer';
import {
  Calendar, Eye, Award, CheckCircle2, AlertTriangle, Clock, Video,
  Image, FileText, AlertCircle, ArrowRight, Play, ExternalLink,
  Search, Filter, ChevronLeft, ChevronRight, Hash, Send, Sparkles,
  User, Check, X, Maximize2, ShieldAlert, Split, RefreshCw, ThumbsUp, ThumbsDown
} from 'lucide-react';

export default function ClientDashboard() {
  const { user, client } = useAuth();
  const location = useLocation();

  // Active Tab state (synced with URL ?tab=...)
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(
    queryTab === 'calendar' || queryTab === 'approvals' ? queryTab : 'inspection'
  );

  useEffect(() => {
    if (queryTab && ['calendar', 'inspection', 'approvals'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const [mediaTasks, setMediaTasks] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Platform simulation mode (Instagram Reels, TikTok, YouTube Shorts, LinkedIn)
  const [previewPlatform, setPreviewPlatform] = useState('Instagram Reels');

  // Split Feedback & Rejection Modal State (Step 4 Requirement)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState('VIDEO_ISSUE'); // 'VIDEO_ISSUE' (Path A) or 'CONTENT_ISSUE' (Path B)
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fullscreen Video Lightbox
  const [lightboxVideo, setLightboxVideo] = useState(null);

  const { isConnected, lastWorkflowEvent } = useSocket();

  useEffect(() => {
    loadClientContent();
  }, []);

  // REAL-TIME WEBSOCKET WORKFLOW LISTENER
  useEffect(() => {
    if (!lastWorkflowEvent) return;
    loadClientContent();
  }, [lastWorkflowEvent]);

  const loadClientContent = async () => {
    setLoading(true);
    try {
      const [mediaRes, calRes] = await Promise.all([
        api.get('/media/all').catch(() => []),
        api.get('/content-calendar').catch(() => [])
      ]);

      const items = Array.isArray(mediaRes) ? mediaRes : [];
      setMediaTasks(items);
      setCalendarItems(Array.isArray(calRes) ? calRes : []);

      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
      }
    } catch (err) {
      console.error('Failed to load client content:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // STEP 4: CLIENT APPROVAL
  const handleApproveContent = async (item) => {
    setSubmittingAction(true);
    const isGraphic = item.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type);

    try {
      if (isGraphic) {
        await api.post(`/media/${item.id}/client-graphic-review`, {
          decision: 'APPROVE',
          notes: 'Client granted final approval for post creative and copy.'
        });
        showToast('success', `🎉 "${item.task_title}" is Fully Approved! Success notifications automatically triggered to both Admin and Social Media Manager.`);
      } else {
        await api.post(`/media/${item.id}/client-decision`, {
          decision: 'APPROVE',
          notes: 'Client reviewed and granted final approval. Ready for social media distribution.'
        });
        showToast('success', `🎉 "${item.task_title}" is Fully Approved & Published! System notifications sent to Admin, Video Editor, and SMM.`);
      }

      // Update state locally
      setMediaTasks(prev => prev.map(t => t.id === item.id ? {
        ...t,
        workflow_stage: 'APPROVED',
        review_status: 'Fully Approved',
        workflow_badge: 'Fully Approved',
        client_feedback: 'Approved by Client'
      } : t));

      if (selectedItem?.id === item.id) {
        setSelectedItem(prev => ({
          ...prev,
          workflow_stage: 'APPROVED',
          review_status: 'Fully Approved',
          workflow_badge: 'Fully Approved',
          client_feedback: 'Approved by Client'
        }));
      }

      loadClientContent();
    } catch (err) {
      alert(err.message || 'Failed to approve deliverable');
    } finally {
      setSubmittingAction(false);
    }
  };

  // STEP 4: CLIENT SPLIT FEEDBACK & REJECTION
  const handleOpenRejectModal = (item) => {
    setRejectingItem(item);
    setFeedbackCategory('VIDEO_ISSUE'); // default Path A for videos
    setFeedbackNote('');
    setShowRejectModal(true);
  };

  const handleSubmitRejection = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!feedbackNote.trim()) {
      alert('Mandatory feedback notes are required detailing the requested changes.');
      return;
    }

    setSubmittingAction(true);
    const isGraphic = rejectingItem.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(rejectingItem.post_type);

    try {
      if (isGraphic) {
        await api.post(`/media/${rejectingItem.id}/client-graphic-review`, {
          decision: 'DISAPPROVE',
          notes: feedbackNote.trim()
        });

        setMediaTasks(prev => prev.map(t => t.id === rejectingItem.id ? {
          ...t,
          workflow_stage: 'NEEDS_REVISION_SMM',
          review_status: 'Revision Required',
          workflow_badge: 'Revision Required',
          client_feedback: feedbackNote.trim(),
          revision_source: 'CLIENT'
        } : t));

        if (selectedItem?.id === rejectingItem.id) {
          setSelectedItem(prev => ({
            ...prev,
            workflow_stage: 'NEEDS_REVISION_SMM',
            review_status: 'Revision Required',
            workflow_badge: 'Revision Required',
            client_feedback: feedbackNote.trim(),
            revision_source: 'CLIENT'
          }));
        }

        setShowRejectModal(false);
        showToast(
          'warning',
          `⚠️ Feedback dispatched! Task looped directly back to Social Media Manager. Upon re-upload, it must pass Admin approval again before returning to Client.`
        );
      } else {
        await api.post(`/media/${rejectingItem.id}/client-decision`, {
          decision: 'DISAPPROVE',
          feedback_type: feedbackCategory,
          notes: feedbackNote.trim()
        });

        const isVideoPath = feedbackCategory === 'VIDEO_ISSUE';
        const nextBadge = isVideoPath ? 'Needs Revision - Video' : 'Needs Revision - Caption';
        const nextStage = isVideoPath ? 'NEEDS_REVISION_VIDEO' : 'NEEDS_REVISION_CAPTION';

        setMediaTasks(prev => prev.map(t => t.id === rejectingItem.id ? {
          ...t,
          workflow_stage: nextStage,
          review_status: nextBadge,
          workflow_badge: nextBadge,
          client_feedback: feedbackNote.trim(),
          client_feedback_type: feedbackCategory,
          split_path: isVideoPath ? 'PATH_A' : 'PATH_B'
        } : t));

        if (selectedItem?.id === rejectingItem.id) {
          setSelectedItem(prev => ({
            ...prev,
            workflow_stage: nextStage,
            review_status: nextBadge,
            workflow_badge: nextBadge,
            client_feedback: feedbackNote.trim(),
            client_feedback_type: feedbackCategory,
            split_path: isVideoPath ? 'PATH_A' : 'PATH_B'
          }));
        }

        setShowRejectModal(false);
        showToast(
          'warning',
          isVideoPath
            ? `⚠️ Path A Triggered: Video revision notes routed directly to Video Editor! Loop will restart upon re-upload.`
            : `⚠️ Path B Triggered: Caption revision notes routed directly to Social Media Manager! Fast-loop to Admin.`
        );
      }

      loadClientContent();
    } catch (err) {
      alert(err.message || 'Failed to submit revision request');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter tasks
  const filteredTasks = mediaTasks.filter(item => {
    if (statusFilter === 'ALL') return true;
    return item.workflow_stage === statusFilter || item.review_status === statusFilter;
  });

  return (
    <div className="portal-inner-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '65px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#E50914',
          color: '#FFFFFF',
          padding: '14px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(229, 9, 20, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          fontSize: '13.5px',
          maxWidth: '520px',
          lineHeight: 1.4
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Client Portal Header */}
      <div className="portal-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
              Client Content & Deliverables Hub
            </h1>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(229, 9, 20, 0.15)',
              color: '#FF4D4D',
              border: '1px solid rgba(229, 9, 20, 0.35)',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              Step 4: Client Review & Split Routing
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
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
          <p style={{ color: '#A1A1AA', fontSize: '13.5px', margin: 0 }}>
            Inspect upcoming raw footage assets, preview completed video deliverables with captions & hashtags, and grant one-click approval or split revision routing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadClientContent}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#1E1E1E',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Inspection, Approvals, Calendar) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #222222',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('inspection')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'inspection' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'inspection' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'inspection' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Eye size={15} /> 1. Post Previewer (Video + Captions + Hashtags)
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'approvals' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'approvals' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'approvals' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Award size={15} /> 2. Dual Action Approvals & Split Routing Queue ({mediaTasks.filter(t => t.workflow_stage === 'IN_CLIENT_REVIEW').length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: activeTab === 'calendar' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'calendar' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'calendar' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Calendar size={15} /> 3. Content Calendar View (Read-Only)
        </button>
      </div>

      {/* TAB 1: POST PREVIEWER & INSPECTION */}
      {activeTab === 'inspection' && (
        <div className="portal-split-view">
          {/* Left Column: Asset Selection List */}
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #262626',
            borderRadius: '14px',
            padding: '16px',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Deliverables Stream</span>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>{filteredTasks.length} Assets</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#71717A', fontSize: '12px' }}>
                  No deliverables in pipeline yet.
                </div>
              ) : (
                filteredTasks.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const isGraphic = item.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type);
                  const isRawOnly = !isGraphic && !item.edited_video_url && item.raw_file_url;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #E50914' : '1px solid #222222',
                        backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.12)' : '#1A1A1A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#E50914', fontWeight: 700 }}>
                          {item.task_code}
                        </span>
                        <WorkflowBadge stage={item.workflow_stage} status={item.review_status} size="sm" />
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', lineHeight: 1.3 }}>
                        {item.task_title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#A1A1AA' }}>
                        <span>{isGraphic ? `🎨 ${item.post_type || 'Graphic Post'}` : (isRawOnly ? '📹 Raw Footage' : `🎬 Cut v${item.version_count || 1}`)}</span>
                        <span>•</span>
                        <span>Due {item.due_date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full Post Inspection Studio */}
          {selectedItem ? (
            <div style={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '14px',
              padding: '24px'
            }}>
              {/* Header with Title and Current Stage Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, fontFamily: 'monospace' }}>
                      {selectedItem.task_code}
                    </span>
                    <WorkflowBadge stage={selectedItem.workflow_stage} status={selectedItem.review_status} size="md" />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedItem.task_title}
                  </h2>
                </div>

                {/* Social Media Platform Simulation Switcher */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1A1A1A',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid #2D2D2D'
                }}>
                  {['Instagram Reels', 'TikTok', 'YouTube Shorts', 'LinkedIn'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPreviewPlatform(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: previewPlatform === p ? '#E50914' : 'transparent',
                        color: previewPlatform === p ? '#FFFFFF' : '#A1A1AA',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Layout: Interactive Video Player Mockup on Left + Captions/Hashtags on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px' }}>
                {/* 1. Device Mockup with Video Player */}
                <div style={{
                  backgroundColor: '#000000',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid #2D2D2D',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.8)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Mock Device Header */}
                  <div style={{
                    padding: '10px 16px',
                    backgroundColor: '#111111',
                    borderBottom: '1px solid #222222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: '#A1A1AA'
                  }}>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{previewPlatform} Simulator</span>
                    <span>1080 × 1920 HD</span>
                  </div>

                  {/* Media Content (Graphic Post / Carousel vs Video) */}
                  {(selectedItem.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(selectedItem.post_type)) ? (
                    <GraphicPostViewer task={selectedItem} maxHeight="420px" />
                  ) : (
                    <>
                      {/* Video Player */}
                      <div style={{ position: 'relative', width: '100%', height: '420px', backgroundColor: '#000' }}>
                        <video
                          controls
                          playsInline
                          src={selectedItem.edited_video_url || selectedItem.raw_file_url || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-studio-41154-large.mp4'}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      {/* Device Bottom Info Bar */}
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#111111',
                        borderTop: '1px solid #222222',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        color: '#D4D4D8'
                      }}>
                        <span>{selectedItem.edited_video_name || selectedItem.raw_file_name || 'Master_Cut.mp4'}</span>
                        <span style={{ color: '#E50914', fontWeight: 700 }}>
                          Duration: {selectedItem.video_duration || '00:45'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. Post Copy & Review Decision Station */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Captions Box */}
                    <div style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E50914', fontWeight: 700, marginBottom: '6px' }}>
                        Post Caption (Written by SMM)
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: selectedItem.caption ? '#FFFFFF' : '#71717A',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedItem.caption || '(Awaiting Social Media Manager to draft final captions)'}
                      </div>
                    </div>

                    {/* Hashtags Box */}
                    <div style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>
                        Target Hashtags & Keywords
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedItem.hashtags ? (
                          selectedItem.hashtags.split(' ').map((tag, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '6px',
                                color: '#6EE7B7',
                                fontSize: '12px',
                                fontWeight: 500
                              }}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: '#71717A' }}>No hashtags attached yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Notes & Team Info */}
                    <div style={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      fontSize: '12px'
                    }}>
                      <div>
                        <span style={{ color: '#71717A', display: 'block', fontSize: '10.5px' }}>Assigned Editor</span>
                        <strong style={{ color: '#FFFFFF' }}>{selectedItem.assigned_employee_name || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#71717A', display: 'block', fontSize: '10.5px' }}>Assigned SMM</span>
                        <strong style={{ color: '#FFFFFF' }}>{selectedItem.assigned_smm_name || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#71717A', display: 'block', fontSize: '10.5px' }}>Version State</span>
                        <strong style={{ color: '#FFFFFF' }}>Cut v{selectedItem.version_count || 1}</strong>
                      </div>
                    </div>

                    {/* Existing Client Feedback Display (If already reviewed) */}
                    {selectedItem.client_feedback && (
                      <div style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: selectedItem.workflow_stage === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(229, 9, 20, 0.12)',
                        border: selectedItem.workflow_stage === 'APPROVED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(229, 9, 20, 0.4)'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: selectedItem.workflow_stage === 'APPROVED' ? '#10B981' : '#E50914',
                          marginBottom: '4px'
                        }}>
                          {selectedItem.workflow_stage === 'APPROVED' ? '✓ Client Approval Record' : `⚠️ Client Revision Feedback (${selectedItem.split_path || 'Recorded'})`}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#FFFFFF' }}>
                          {selectedItem.client_feedback}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DUAL ACTION BUTTONS (Prompt Requirement: Approve Post vs Request Changes) */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid #262626',
                    display: 'flex',
                    gap: '14px'
                  }}>
                    <button
                      onClick={() => handleApproveContent(selectedItem)}
                      disabled={submittingAction || selectedItem.workflow_stage === 'APPROVED'}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        backgroundColor: selectedItem.workflow_stage === 'APPROVED' ? '#262626' : '#10B981',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: selectedItem.workflow_stage === 'APPROVED' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: selectedItem.workflow_stage === 'APPROVED' ? 'none' : '0 0 20px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      {selectedItem.workflow_stage === 'APPROVED' ? 'Post Fully Approved' : 'Approve Post (Publish)'}
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(selectedItem)}
                      disabled={submittingAction}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        backgroundColor: 'transparent',
                        border: '1.5px solid #E50914',
                        borderRadius: '12px',
                        color: '#FF6B6B',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Split size={18} />
                      {(selectedItem.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(selectedItem.post_type))
                        ? 'Request Changes (Feedback Notes)'
                        : 'Request Changes (Split Feedback)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#71717A' }}>
              Select a deliverable from the left panel to inspect.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPROVALS & REJECTIONS QUEUE */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #262626',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#E50914" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Deliverables Awaiting Client Sign-Off
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
              Step 4: Once approved, notification sends to Admin, Video Editor, and SMM. If rejected, system splits path based on issue category.
            </div>
          </div>

          {mediaTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717A', backgroundColor: '#141414', borderRadius: '12px' }}>
              No items in client review queue.
            </div>
          ) : (
            mediaTasks.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 360px) 1fr',
                  gap: '24px'
                }}
              >
                <div>
                  {(item.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type)) ? (
                    <GraphicPostViewer task={item} maxHeight="220px" />
                  ) : (
                    <>
                      <div style={{ position: 'relative', height: '220px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                        <video
                          controls
                          playsInline
                          src={item.edited_video_url || item.raw_file_url || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-studio-41154-large.mp4'}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717A', marginTop: '6px' }}>
                        <span>{item.edited_video_name || item.raw_file_name}</span>
                        <span>Duration: {item.video_duration || '00:45'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#E50914', fontWeight: 700 }}>
                          {item.task_code}
                        </span>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>
                          {item.task_title}
                        </h3>
                      </div>
                      <WorkflowBadge stage={item.workflow_stage} status={item.review_status} size="md" />
                    </div>

                    <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '8px', padding: '12px', margin: '10px 0' }}>
                      <div style={{ fontSize: '10.5px', color: '#E50914', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Post Caption:
                      </div>
                      <div style={{ fontSize: '13px', color: '#D4D4D8', lineHeight: 1.4 }}>
                        {item.caption || item.raw_footage_notes || '(Awaiting captions)'}
                      </div>
                      {item.hashtags && (
                        <div style={{ fontSize: '11.5px', color: '#6EE7B7', marginTop: '6px' }}>
                          {item.hashtags}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleApproveContent(item)}
                      disabled={item.workflow_stage === 'APPROVED'}
                      style={{
                        flex: 1,
                        padding: '11px',
                        backgroundColor: item.workflow_stage === 'APPROVED' ? '#262626' : '#10B981',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: item.workflow_stage === 'APPROVED' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> Approve Post
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(item)}
                      style={{
                        flex: 1,
                        padding: '11px',
                        backgroundColor: 'transparent',
                        border: '1px solid #E50914',
                        borderRadius: '8px',
                        color: '#FF6B6B',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Split size={16} />
                      {(item.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(item.post_type))
                        ? 'Request Changes (Feedback Notes)'
                        : 'Request Changes (Split Routing)'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CONTENT CALENDAR VIEW (READ-ONLY) */}
      {activeTab === 'calendar' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Scheduled Content Calendar (Read-Only)
              </h2>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '4px 0 0' }}>
                All approved and upcoming production assets mapped across upcoming release dates.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {mediaTasks.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.due_date}
                    </span>
                    <WorkflowBadge stage={item.workflow_stage} status={item.review_status} size="sm" />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
                    {item.task_title}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#A1A1AA', margin: 0, lineHeight: 1.4 }}>
                    {item.caption || item.raw_footage_notes || 'Production cut scheduled'}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #262626', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717A' }}>
                  <span>{item.target_platforms || 'Instagram Reels'}</span>
                  <span>{item.assigned_employee_name || 'Creative Team'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: MANDATORY SPLIT FEEDBACK MODAL */}
      {showRejectModal && rejectingItem && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{
            maxWidth: '580px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(229, 9, 20, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #222222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#18181B'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Step 4: Client Feedback Routing
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>
                  Request Changes: {rejectingItem.task_title}
                </h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitRejection} style={{ padding: '24px' }}>
              {/* Category Selector (Videos) vs Direct SMM Routing Banner (Graphics) */}
              {(rejectingItem?.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(rejectingItem?.post_type)) ? (
                <div style={{
                  marginBottom: '20px',
                  backgroundColor: 'rgba(229, 9, 20, 0.12)',
                  border: '1.5px solid rgba(229, 9, 20, 0.45)',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ShieldAlert size={18} color="#E50914" />
                    <strong style={{ fontSize: '13.5px', color: '#FFFFFF' }}>
                      Creative & Copy Feedback Loop (Direct to Social Media Manager)
                    </strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0, lineHeight: 1.4 }}>
                    Your feedback will loop directly back to Social Media Manager ({rejectingItem?.assigned_smm_name || 'Social Media Manager'}) to modify the images, slides, or copy. <strong>Important: Upon re-upload, it must pass Admin approval again before returning to Client Dashboard.</strong>
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                    1. Issue Categorization (Determines Automated Feedback Path):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Path A Option */}
                    <div
                      onClick={() => setFeedbackCategory('VIDEO_ISSUE')}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: feedbackCategory === 'VIDEO_ISSUE' ? '1.5px solid #E50914' : '1px solid #2D2D2D',
                        backgroundColor: feedbackCategory === 'VIDEO_ISSUE' ? 'rgba(229, 9, 20, 0.12)' : '#1A1A1A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Video size={16} color={feedbackCategory === 'VIDEO_ISSUE' ? '#E50914' : '#A1A1AA'} />
                        <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>Path A: Video Issue</strong>
                      </div>
                      <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0, lineHeight: 1.3 }}>
                        Relates to video edits, cuts, pacing, color grading, or audio. <strong>Routes back to Video Editor.</strong> Approval loop restarts.
                      </p>
                    </div>

                    {/* Path B Option */}
                    <div
                      onClick={() => setFeedbackCategory('CONTENT_ISSUE')}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: feedbackCategory === 'CONTENT_ISSUE' ? '1.5px solid #E50914' : '1px solid #2D2D2D',
                        backgroundColor: feedbackCategory === 'CONTENT_ISSUE' ? 'rgba(229, 9, 20, 0.12)' : '#1A1A1A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Hash size={16} color={feedbackCategory === 'CONTENT_ISSUE' ? '#E50914' : '#A1A1AA'} />
                        <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>Path B: Content Issue</strong>
                      </div>
                      <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0, lineHeight: 1.3 }}>
                        Relates to captions, wording, hashtags, or typos. <strong>Routes back to SMM.</strong> Upon rewrite, goes to Admin and back to you.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mandatory Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  {(rejectingItem?.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(rejectingItem?.post_type))
                    ? 'Mandatory Revision Notes for SMM *'
                    : '2. Mandatory Feedback Notes *'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={(rejectingItem?.workflow_type === 'STATIC_GRAPHIC' || ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(rejectingItem?.post_type))
                    ? 'Specify required modifications for the images, carousel slides, captions, or hashtags...'
                    : feedbackCategory === 'VIDEO_ISSUE'
                      ? 'Specify exact timestamps, pacing notes, color grading adjustments, or audio changes required...'
                      : 'Specify required caption adjustments, hashtags to add/remove, or copy corrections...'}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !feedbackNote.trim()}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#E50914',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: submittingAction ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)'
                  }}
                >
                  <Send size={15} />
                  Dispatch Revision to {feedbackCategory === 'VIDEO_ISSUE' ? 'Video Editor' : 'SMM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
