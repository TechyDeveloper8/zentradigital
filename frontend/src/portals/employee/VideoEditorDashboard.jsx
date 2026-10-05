import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import WorkflowBadge from '../../components/common/WorkflowBadge';
import EmployeeAttendanceTracker from '../../components/attendance/EmployeeAttendanceTracker';
import {
  Video, Clock, CheckSquare, ArrowUpRight, Award, Download,
  CheckCircle2, AlertCircle, RefreshCw, Play, FileVideo, MessageSquare,
  History, Calendar, ShieldCheck, Sparkles, Send, Eye, X, AlertTriangle, Upload
} from 'lucide-react';

export default function VideoEditorDashboard() {
  const { user, employee, attendance, refreshAttendance } = useAuth();
  const location = useLocation();

  // Active Tab state (synced with URL ?tab=...)
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'tasks_raw');

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const [mediaTasks, setMediaTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Upload Edited Video Modal / State (Step 2)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadData, setUploadData] = useState({
    edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    edited_video_name: '',
    video_duration: '00:45',
    editor_notes: 'Cut v2 ready: color graded with warm film LUT, sound mixed with ducking on dialogue.'
  });
  const [uploading, setUploading] = useState(false);

  // Lightbox Video Player
  const [previewVideo, setPreviewVideo] = useState(null);

  const { isConnected, lastWorkflowEvent } = useSocket();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // REAL-TIME WEBSOCKET WORKFLOW LISTENER
  useEffect(() => {
    if (!lastWorkflowEvent) return;
    loadDashboardData();
  }, [lastWorkflowEvent]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media/all?workflow_type=video');
      setMediaTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load video editor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Download Raw Files (Requirement 3: Download Raw Files)
  const handleDownloadRawFile = (task) => {
    if (!task.raw_file_url) {
      alert('No raw footage URL attached to this task.');
      return;
    }

    const link = document.createElement('a');
    link.href = task.raw_file_url;
    link.setAttribute('download', task.raw_file_name || `${task.task_code}_raw.mp4`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', `Downloading raw footage for ${task.task_code}: ${task.raw_file_name || 'raw_footage.mp4'}`);
  };

  // Open Upload Cut Modal
  const handleOpenUploadModal = (task) => {
    setSelectedTask(task);
    const nextVer = (Number(task.version_count) || 0) + 1;
    setUploadData({
      edited_video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      edited_video_name: `${task.task_code}_Cut_v${nextVer}.mp4`,
      video_duration: task.video_duration || '00:45',
      editor_notes: task.workflow_stage === 'NEEDS_REVISION_VIDEO'
        ? `Revision addressed: updated cuts and color adjustments as requested.`
        : `Cut v${nextVer} complete with color grading and sound design.`
    });
    setShowUploadModal(true);
  };

  // Submit Edited Video (Step 2 Part A)
  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setUploading(true);

    try {
      const res = await api.post(`/media/${selectedTask.id}/editor-submit`, uploadData);
      setShowUploadModal(false);
      showToast('success', `🎬 Edited cut v${(selectedTask.version_count || 0) + 1} submitted to Admin for approval!`);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to submit edited video cut');
    } finally {
      setUploading(false);
    }
  };

  // Filter Tasks strictly for Video Production Workflow
  const isVideoTask = (t) => {
    if (!t) return false;
    if (t.workflow_type === 'STATIC_GRAPHIC') return false;
    const staticTypes = ['Static Post', 'Carousel', 'Flyer', 'Poster'];
    if (staticTypes.includes(t.post_type) || staticTypes.includes(t.task_type)) return false;
    return true;
  };

  const videoTasks = mediaTasks.filter(isVideoTask);
  const rawTasks = videoTasks.filter(t => t.workflow_stage === 'RAW_UPLOADED' || (!t.edited_video_url && t.workflow_stage !== 'NEEDS_REVISION_VIDEO' && t.workflow_stage !== 'IN_ADMIN_REVIEW_EDITOR'));
  const revisionTasks = videoTasks.filter(t => t.workflow_stage === 'NEEDS_REVISION_VIDEO');
  const inReviewTasks = videoTasks.filter(t => t.workflow_stage === 'IN_ADMIN_REVIEW_EDITOR');

  return (
    <div className="portal-inner-container">
      {/* Toast */}
      {statusMessage && (
        <div style={{
          position: 'fixed',
          top: '65px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: statusMessage.type === 'success' ? '#10B981' : '#E50914',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(229, 9, 20, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '13.5px'
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {statusMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="portal-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Video Editor Command Hub
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
              Step 2 Video Processing & Revision Loop
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
            Download raw footage from Admin, edit cuts, submit versions for Admin review, and resolve revision notes requested by Admin or Client.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadDashboardData}
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
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #222222',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('tasks_raw')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'tasks_raw' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'tasks_raw' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'tasks_raw' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <CheckSquare size={15} /> 1. Task Queue & Raw Files ({videoTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback_loop')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'feedback_loop' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'feedback_loop' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'feedback_loop' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Award size={15} /> 2. Workflow Inbox & Revisions ({revisionTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('upload_video')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'upload_video' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'upload_video' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'upload_video' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <ArrowUpRight size={15} /> 3. Upload & Cut Distribution
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'attendance' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'attendance' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'attendance' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Clock size={15} /> 4. Personal Attendance Tracker
        </button>
      </div>

      {/* TAB 1: TASK QUEUE & RAW FILES */}
      {activeTab === 'tasks_raw' && (
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
              <Download size={18} color="#E50914" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Assigned Video Tasks & Raw Footage Repository
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
              Download raw files uploaded by Admin, start editing, and push cuts to Admin approval.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {videoTasks.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#71717A', backgroundColor: '#141414', borderRadius: '12px' }}>
                No assigned video tasks or raw footage in queue.
              </div>
            ) : (
              videoTasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace', fontWeight: 700 }}>
                      {task.task_code}
                    </span>
                    <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="sm" />
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
                    {task.task_title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: '12px' }}>
                    Client: <strong style={{ color: '#FFFFFF' }}>{task.company_name}</strong>
                  </div>

                  {/* Raw File Box */}
                  <div style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700 }}>
                        📹 Raw Footage Asset
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#71717A' }}>
                        Due: {task.due_date}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#D4D4D8', wordBreak: 'break-all' }}>
                      {task.raw_file_name || 'Raw_Footage_Master.mp4'}
                    </div>
                    {task.raw_footage_notes && (
                      <div style={{ fontSize: '11.5px', color: '#A1A1AA', marginTop: '6px', fontStyle: 'italic' }}>
                        "{task.raw_footage_notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #222222' }}>
                  <button
                    onClick={() => handleDownloadRawFile(task)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      backgroundColor: '#1E1E1E',
                      border: '1px solid #333333',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Download Raw
                  </button>

                  <button
                    onClick={() => handleOpenUploadModal(task)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      backgroundColor: '#E50914',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 0 12px rgba(229, 9, 20, 0.35)'
                    }}
                  >
                    <Upload size={14} /> Upload Cut
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKFLOW INBOX & REVISIONS */}
      {activeTab === 'feedback_loop' && (
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
              <AlertTriangle size={18} color="#E50914" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Revision Requests (Admin Disapproval or Client Path A Video Feedback)
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
              When you re-upload a revised cut, the approval loop restarts automatically!
            </span>
          </div>

          {revisionTasks.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#71717A', backgroundColor: '#141414', borderRadius: '12px' }}>
              <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>No video revisions pending!</div>
              <div style={{ fontSize: '12px', color: '#A1A1AA' }}>All your cuts have been approved or are currently undergoing SMM/Client stages.</div>
            </div>
          ) : (
            revisionTasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #2D2D2D',
                  borderRadius: '14px',
                  padding: '22px',
                  borderLeft: '4px solid #E50914',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(300px, 400px) 1fr',
                  gap: '24px'
                }}
              >
                <div>
                  <div style={{ position: 'relative', height: '220px', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                    <video
                      controls
                      playsInline
                      src={task.edited_video_url || task.raw_file_url}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: '6px' }}>
                    Current cut: {task.edited_video_name || `Cut v${task.version_count || 1}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#E50914', fontWeight: 700 }}>
                          {task.task_code}
                        </span>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>
                          {task.task_title}
                        </h3>
                      </div>
                      <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="md" />
                    </div>

                    {/* Exact Revision Feedback Box */}
                    <div style={{
                      backgroundColor: 'rgba(229, 9, 20, 0.12)',
                      border: '1px solid rgba(229, 9, 20, 0.4)',
                      borderRadius: '10px',
                      padding: '14px',
                      margin: '12px 0'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#FF6B6B', marginBottom: '4px' }}>
                        {task.client_feedback ? '⚠️ Client Mandatory Revision Notes (Path A - Video Issue)' : '⚠️ Admin Revision Feedback'}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#FFFFFF', lineHeight: 1.4 }}>
                        {task.client_feedback || task.admin_feedback || 'Adjust timing, pacing, and color grade.'}
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
                      Client: <strong style={{ color: '#FFFFFF' }}>{task.company_name}</strong> • Current Version: <strong style={{ color: '#FFFFFF' }}>v{task.version_count || 1}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleDownloadRawFile(task)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#1E1E1E',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={14} /> Re-Download Raw
                    </button>

                    <button
                      onClick={() => handleOpenUploadModal(task)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#E50914',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)'
                      }}
                    >
                      <Upload size={14} /> Upload Revised Cut (Restart Loop)
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: UPLOAD & CUT DISTRIBUTION MODULE */}
      {activeTab === 'upload_video' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            Upload Edited Video Deliverables
          </h2>
          <p style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '20px' }}>
            Select any assigned video task to upload your director's cut. The task will immediately advance to Admin Review.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {videoTasks.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#71717A', backgroundColor: '#141414', borderRadius: '12px' }}>
                No video tasks available for cut upload.
              </div>
            ) : (
              videoTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#E50914', fontWeight: 700 }}>
                        {task.task_code}
                      </span>
                      <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="sm" />
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                      {task.task_title}
                    </h4>
                    <div style={{ fontSize: '11.5px', color: '#A1A1AA' }}>
                      Version: v{task.version_count || 1} • Due {task.due_date}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenUploadModal(task)}
                    style={{
                      marginTop: '14px',
                      padding: '8px 14px',
                      backgroundColor: '#E50914',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} /> Upload Video Cut
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PERSONAL ATTENDANCE TRACKER */}
      {activeTab === 'attendance' && (
        <EmployeeAttendanceTracker title="My Personal Attendance & Shift Logger" />
      )}

      {/* UPLOAD CUT MODAL */}
      {showUploadModal && selectedTask && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{
            maxWidth: '560px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(229, 9, 20, 0.25)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #222222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#18181B'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#E50914', fontWeight: 800, textTransform: 'uppercase' }}>
                  Step 2: Video Editor Upload
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>
                  Upload Cut: {selectedTask.task_title}
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitVideo} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  Edited Video MP4 Storage Link / Stream URL:
                </label>
                <input
                  type="url"
                  required
                  value={uploadData.edited_video_url}
                  onChange={(e) => setUploadData({ ...uploadData, edited_video_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Deliverable File Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadData.edited_video_name}
                    onChange={(e) => setUploadData({ ...uploadData, edited_video_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    Video Duration (MM:SS):
                  </label>
                  <input
                    type="text"
                    value={uploadData.video_duration}
                    onChange={(e) => setUploadData({ ...uploadData, video_duration: e.target.value })}
                    placeholder="00:45"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2D2D2D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  Editor Production Notes (LUT, Audio ducking, Cut description):
                </label>
                <textarea
                  rows={3}
                  value={uploadData.editor_notes}
                  onChange={(e) => setUploadData({ ...uploadData, editor_notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2D2D2D',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#1E1E1E',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#E50914',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)'
                  }}
                >
                  <Send size={14} /> Send Cut to Admin for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
