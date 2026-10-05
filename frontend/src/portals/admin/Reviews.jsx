import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Award, CheckCircle2, XCircle, Clock, Eye, AlertCircle,
  MessageSquare, User, ArrowRight, Shield, Video, Download,
  Play, FileText, Send, RefreshCw
} from 'lucide-react';

export default function Reviews() {
  const [activeTab, setActiveTab] = useState('video_tasks'); // 'video_tasks' or 'content_items'
  const [pendingContent, setPendingContent] = useState([]);
  const [videoTasks, setVideoTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Content Review Modal state
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentAction, setContentAction] = useState('APPROVE');
  const [contentReason, setContentReason] = useState('');
  const [contentComment, setContentComment] = useState('');

  // Video Task Review Modal state (Requirement 3)
  const [selectedVideoTask, setSelectedVideoTask] = useState(null);
  const [videoAction, setVideoAction] = useState('APPROVE');
  const [videoComment, setVideoComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState('');

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    setLoading(true);
    try {
      const [contentRes, tasksRes] = await Promise.all([
        api.get('/reviews/pending').catch(() => []),
        api.get('/tasks').catch(() => [])
      ]);

      setPendingContent(contentRes || []);
      // Filter for video tasks in review or with active video submissions
      const vTasks = (tasksRes || []).filter(t =>
        t.review_status === 'Pending Approval' ||
        t.status === 'INTERNAL REVIEW' ||
        t.task_type === 'VIDEO_EDITING'
      );
      setVideoTasks(vTasks);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Content Review Submit
  const handleContentReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContent) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/internal/${selectedContent.id}`, {
        action: contentAction,
        reason: contentReason,
        comment: contentComment
      });
      setSelectedContent(null);
      setContentComment('');
      setContentReason('');
      setFeedbackToast(`Content item review recorded: ${contentAction}`);
      setTimeout(() => setFeedbackToast(''), 5000);
      loadAllReviews();
    } catch (err) {
      alert(err.message || 'Failed to submit content review');
    } finally {
      setSubmitting(false);
    }
  };

  // Video Task Review Submit (Feedback & Approval Loop)
  const handleVideoTaskReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVideoTask) return;
    setSubmitting(true);
    try {
      await api.post(`/tasks/${selectedVideoTask.id}/review`, {
        action: videoAction,
        comments: videoComment || (videoAction === 'APPROVE' ? 'Approved by Admin' : 'Revisions requested')
      });

      setSelectedVideoTask(null);
      setVideoComment('');
      setFeedbackToast(
        videoAction === 'APPROVE'
          ? `Video task explicitly approved! Status marked completed.`
          : `Changes requested. Task remains active for Video Editor re-upload.`
      );
      setTimeout(() => setFeedbackToast(''), 5000);
      loadAllReviews();
    } catch (err) {
      alert(err.message || 'Failed to submit video task review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Creative Reviews & Approvals Queue
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Audit Video Editor cut submissions and Social Media Manager content prior to release.
          </p>
        </div>

        <button onClick={loadAllReviews} className="btn btn-secondary">
          <RefreshCw size={15} /> Refresh Queue
        </button>
      </div>

      {/* Success Notification */}
      {feedbackToast && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          {feedbackToast}
        </div>
      )}

      {/* Review Type Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('video_tasks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'video_tasks' ? 700 : 500,
            backgroundColor: activeTab === 'video_tasks' ? '#3B82F6' : '#1F2937',
            color: activeTab === 'video_tasks' ? '#FFFFFF' : '#9CA3AF'
          }}
        >
          <Video size={16} />
          <span>Video Editor Submissions ({videoTasks.filter(t => t.review_status === 'Pending Approval').length} pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('content_items')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'content_items' ? 700 : 500,
            backgroundColor: activeTab === 'content_items' ? '#3B82F6' : '#1F2937',
            color: activeTab === 'content_items' ? '#FFFFFF' : '#9CA3AF'
          }}
        >
          <FileText size={16} />
          <span>Social Media Content ({pendingContent.length} pending)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VIDEO EDITOR SUBMISSIONS (REQUIREMENT 3: FEEDBACK & APPROVAL LOOP) */}
      {/* ========================================================================= */}
      {activeTab === 'video_tasks' && (
        <div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading video submissions...</div>
          ) : videoTasks.length === 0 ? (
            <div className="table-container empty-state">
              <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: '12px' }} />
              <h3>All video tasks are reviewed!</h3>
              <p>No video edits are currently awaiting Admin review.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {videoTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: `1px solid ${task.review_status === 'Needs Revision' ? '#EF4444' : (task.review_status === 'Approved' ? '#10B981' : (task.review_status === 'Pending Approval' ? '#F59E0B' : 'var(--border-color)'))}`,
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700 }}>{task.task_code}</span>
                      <span className={`status-badge ${
                        task.review_status === 'Approved' ? 'green' :
                        (task.review_status === 'Needs Revision' ? 'red' :
                        (task.review_status === 'Pending Approval' ? 'yellow' : 'blue'))
                      }`}>
                        {task.review_status || task.status}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 4px', fontSize: '15.5px', color: '#F9FAFB', fontWeight: 700 }}>
                      {task.task_title}
                    </h4>

                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
                      Strict Deadline: <strong style={{ color: '#E5E7EB' }}>{task.due_date || 'N/A'}</strong> • Version: <strong>v{task.version_count || 1}</strong>
                    </div>

                    {/* Latest Uploaded Video Details */}
                    {task.edited_video_name ? (
                      <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '10px 12px', border: '1px solid #1F2937', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Video size={13} /> LATEST EDITED VIDEO CUT
                        </div>
                        <div style={{ fontSize: '13px', color: '#F3F4F6', fontWeight: 600, marginTop: '2px' }}>
                          {task.edited_video_name} ({task.video_duration || '00:45'})
                        </div>
                        {task.edited_video_url && (
                          <a
                            href={task.edited_video_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '11px', color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}
                          >
                            <Play size={11} /> Open Video Delivery Link
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
                        Raw footage attached: {task.raw_file_name || 'Raw_Footage.zip'} ({task.raw_file_size || 'N/A'}). Awaiting editor upload.
                      </div>
                    )}

                    {/* Admin Feedback Display if revision was requested */}
                    {task.admin_feedback && (
                      <div style={{ fontSize: '12px', color: '#FCA5A5', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                        <strong>Feedback:</strong> "{task.admin_feedback}"
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedVideoTask(task);
                        setVideoAction('APPROVE');
                        setVideoComment('Video edit approved by Admin! Quality and color grade meet all agency standards.');
                      }}
                      className="btn btn-success"
                      style={{ flex: 1, padding: '7px', fontSize: '12px' }}
                    >
                      <CheckCircle2 size={14} /> Explicitly Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVideoTask(task);
                        setVideoAction('REQUEST_CHANGES');
                        setVideoComment('Please speed up the transition cut at 0:15, normalize dialogue audio, and re-export.');
                      }}
                      className="btn btn-danger"
                      style={{ flex: 1, padding: '7px', fontSize: '12px' }}
                    >
                      <XCircle size={14} /> Request Revision
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOCIAL MEDIA CONTENT REVIEWS */}
      {/* ========================================================================= */}
      {activeTab === 'content_items' && (
        <div>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading content queue...</div>
          ) : pendingContent.length === 0 ? (
            <div className="table-container empty-state">
              <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: '12px' }} />
              <h3>All social media reviews are up to date!</h3>
              <p>No content items are currently waiting for internal review.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {pendingContent.map(item => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700 }}>{item.content_code}</span>
                      <span className="status-badge blue">{item.platform}</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#F9FAFB', fontWeight: 700 }}>
                      {item.topic}
                    </h4>

                    <div style={{ backgroundColor: '#111827', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#D1D5DB', marginBottom: '10px' }}>
                      {item.caption || 'No caption text'}
                    </div>

                    {item.hashtags && (
                      <div style={{ fontSize: '11px', color: '#60A5FA', marginBottom: '10px' }}>
                        {item.hashtags}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => setSelectedContent(item)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '8px', fontSize: '12.5px' }}
                    >
                      Audit & Approve Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIDEO TASK REVIEW DECISION (REQUIREMENT 3) */}
      {/* ========================================================================= */}
      {selectedVideoTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Admin Review: {selectedVideoTask.task_title}
                </h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                  {selectedVideoTask.task_code} • Strict Deadline: {selectedVideoTask.due_date || 'N/A'}
                </div>
              </div>
              <button onClick={() => setSelectedVideoTask(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleVideoTaskReviewSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoAction('APPROVE');
                      setVideoComment('Video edit approved by Admin! Outstanding visual rhythm and grading.');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${videoAction === 'APPROVE' ? '#10B981' : '#1F2937'}`,
                      backgroundColor: videoAction === 'APPROVE' ? 'rgba(16, 185, 129, 0.15)' : '#111827',
                      color: videoAction === 'APPROVE' ? '#34D399' : '#9CA3AF',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={20} color="#10B981" />
                    <span>Explicitly Approve</span>
                    <span style={{ fontSize: '11px', fontWeight: 400 }}>Completes Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVideoAction('REQUEST_CHANGES');
                      setVideoComment('Please speed up the transition cut at 0:15, normalize dialogue audio, and re-export.');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${videoAction === 'REQUEST_CHANGES' ? '#EF4444' : '#1F2937'}`,
                      backgroundColor: videoAction === 'REQUEST_CHANGES' ? 'rgba(239, 68, 68, 0.15)' : '#111827',
                      color: videoAction === 'REQUEST_CHANGES' ? '#F87171' : '#9CA3AF',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <AlertCircle size={20} color="#EF4444" />
                    <span>Request Changes</span>
                    <span style={{ fontSize: '11px', fontWeight: 400 }}>Task Remains Active</span>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {videoAction === 'APPROVE' ? 'Approval Comments (Optional)' : 'Revision Instructions (Required) *'}
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    required={videoAction === 'REQUEST_CHANGES'}
                    value={videoComment}
                    onChange={e => setVideoComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedVideoTask(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn ${videoAction === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                >
                  {submitting ? 'Recording Decision...' : (videoAction === 'APPROVE' ? 'Confirm Approval' : 'Send Revision Instructions')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONTENT ITEM REVIEW */}
      {/* ========================================================================= */}
      {selectedContent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{selectedContent.topic}</h3>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{selectedContent.platform} • {selectedContent.company_name}</div>
              </div>
              <button onClick={() => setSelectedContent(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleContentReviewSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setContentAction('APPROVE')}
                    className={`btn ${contentAction === 'APPROVE' ? 'btn-success' : 'btn-secondary'}`}
                  >
                    <CheckCircle2 size={16} /> Approve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentAction('REQUEST_CHANGES')}
                    className={`btn ${contentAction === 'REQUEST_CHANGES' ? 'btn-danger' : 'btn-secondary'}`}
                  >
                    <XCircle size={16} /> Request Changes
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Remarks / Reason</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Enter review comments or revision instructions..."
                    value={contentComment}
                    onChange={e => setContentComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedContent(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
