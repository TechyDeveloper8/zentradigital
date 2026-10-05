import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import WorkflowBadge from '../../components/common/WorkflowBadge';
import GraphicPostViewer, { getPostTypeColor, getPostTypeIcon } from '../../components/common/GraphicPostViewer';
import EmployeeAttendanceTracker from '../../components/attendance/EmployeeAttendanceTracker';
import {
  Calendar, CheckSquare, Clock, FileText, Layers, FolderOpen, Award,
  CheckCircle2, ArrowRight, Send, Hash, Sparkles, Filter, Search,
  RefreshCw, Video, Image, Eye, MessageSquare, AlertCircle, Play,
  AlertTriangle, Check, X, Upload, Plus, Trash2, Palette, ShieldAlert
} from 'lucide-react';

export default function SocialMediaManagerDashboard() {
  const { user, employee, attendance, refreshAttendance } = useAuth();
  const location = useLocation();

  // Active Tab state (synced with URL ?tab=...)
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'graphic_studio');

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const [mediaTasks, setMediaTasks] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Selected Task for Step 3 Caption & Hashtag Processing (Videos)
  const [selectedTask, setSelectedTask] = useState(null);
  const [postForm, setPostForm] = useState({
    caption: '',
    hashtags: '',
    post_notes: '',
    target_platforms: 'Instagram Reels, TikTok, YouTube Shorts',
    schedule_publish_date: ''
  });
  const [submittingPost, setSubmittingPost] = useState(false);

  // =========================================================================
  // DEDICATED GRAPHIC & CAROUSEL STUDIO STATE
  // =========================================================================
  const [selectedGraphicTask, setSelectedGraphicTask] = useState(null);
  const [graphicFilter, setGraphicFilter] = useState('ALL');
  const [graphicForm, setGraphicForm] = useState({
    graphic_image_url: '',
    carousel_slides: [],
    caption: '',
    hashtags: '',
    post_notes: '',
    target_platforms: 'Instagram, LinkedIn',
    schedule_publish_date: ''
  });
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideName, setNewSlideName] = useState('');
  const [submittingGraphic, setSubmittingGraphic] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useUrlFallback, setUseUrlFallback] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Hashtag suggestions chips
  const hashtagPacks = [
    '#ViralReels', '#TrendingNow', '#ContentCreator', '#BrandGrowth',
    '#AgencyLife', '#VideoProduction', '#SocialMediaStrategy', '#LuxuryLifestyle',
    '#VisualDesign', '#CreativeDirector', '#MarketingTips', '#DesignInspiration'
  ];

  const { isConnected, lastWorkflowEvent } = useSocket();

  useEffect(() => {
    loadAllData();
  }, []);

  // REAL-TIME WEBSOCKET WORKFLOW LISTENER
  useEffect(() => {
    if (!lastWorkflowEvent) return;
    loadAllData();
  }, [lastWorkflowEvent]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [mediaRes, calRes] = await Promise.all([
        api.get('/media/all').catch(() => []),
        api.get('/content-calendar').catch(() => [])
      ]);

      const items = Array.isArray(mediaRes) ? mediaRes : [];
      setMediaTasks(items);
      setCalendarItems(Array.isArray(calRes) ? calRes : []);

      // Auto-select first graphic item awaiting SMM
      const graphicItems = items.filter(t =>
        t.workflow_type === 'STATIC_GRAPHIC' ||
        ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(t.post_type)
      );

      const pendingGraphic = graphicItems.find(t =>
        t.workflow_stage === 'SMM_DRAFTING' ||
        t.workflow_stage === 'NEEDS_REVISION_SMM' ||
        t.workflow_stage === 'TASK_CREATED'
      );

      if (pendingGraphic) {
        selectGraphicTaskForEditing(pendingGraphic);
      } else if (graphicItems.length > 0) {
        selectGraphicTaskForEditing(graphicItems[0]);
      }

      // Auto-select first video item awaiting SMM if available
      const smmItem = items.find(t =>
        t.workflow_type !== 'STATIC_GRAPHIC' &&
        (t.workflow_stage === 'SMM_CAPTIONING' || t.workflow_stage === 'NEEDS_REVISION_CAPTION')
      );
      if (smmItem) {
        selectTaskForEditing(smmItem);
      } else if (items.length > 0) {
        selectTaskForEditing(items[0]);
      }
    } catch (err) {
      console.error('Failed to load SMM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const selectTaskForEditing = (task) => {
    setSelectedTask(task);
    setPostForm({
      caption: task.caption || `✨ Experience excellence with ${task.company_name}. Elevating every detail with precision. Tap link in bio to explore the latest drop!`,
      hashtags: task.hashtags || '#BrandExcellence #LuxuryDesign #ReelsGrowth #VisualStorytelling',
      post_notes: task.post_notes || 'Target: Engaged social followers, high intent buyers.',
      target_platforms: task.target_platforms || 'Instagram Reels, TikTok, YouTube Shorts',
      schedule_publish_date: task.schedule_publish_date || task.due_date || ''
    });
  };

  const selectGraphicTaskForEditing = (task) => {
    setSelectedGraphicTask(task);
    let parsedSlides = [];
    if (task.carousel_slides) {
      try {
        parsedSlides = typeof task.carousel_slides === 'string'
          ? JSON.parse(task.carousel_slides)
          : task.carousel_slides;
      } catch (e) {
        parsedSlides = [];
      }
    }

    if (parsedSlides.length === 0 && task.post_type === 'Carousel') {
      parsedSlides = [
        { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80', name: 'Slide 1: Hero Visual', order: 1 },
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80', name: 'Slide 2: Detail Focus', order: 2 },
        { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&q=80', name: 'Slide 3: Call to Action', order: 3 }
      ];
    } else if (parsedSlides.length === 0 && task.graphic_image_url) {
      parsedSlides = [
        { url: task.graphic_image_url, name: task.graphic_image_name || `${task.post_type} Creative`, order: 1 }
      ];
    }

    const defaultUrl = task.graphic_image_url || (parsedSlides.length > 0 ? parsedSlides[0].url : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80');

    setGraphicForm({
      graphic_image_url: defaultUrl,
      carousel_slides: parsedSlides,
      caption: task.caption || `✨ Introducing our latest showcase for ${task.company_name}. Crafted with unmatched precision, modern aesthetics, and purpose.\n\nSwipe through to explore the details. Tap the link in bio to get yours today!`,
      hashtags: task.hashtags || '#VisualDesign #BrandIdentity #DesignInspiration #LuxuryCreative #ModernAesthetics',
      post_notes: task.post_notes || '',
      target_platforms: task.target_platforms || 'Instagram, LinkedIn',
      schedule_publish_date: task.schedule_publish_date || task.due_date || ''
    });
  };

  const handleAddSlide = (url, name) => {
    const slideUrl = url || newSlideUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
    const slideName = name || newSlideName.trim() || `Slide ${graphicForm.carousel_slides.length + 1}`;
    const newSlide = {
      url: slideUrl,
      name: slideName,
      order: graphicForm.carousel_slides.length + 1
    };
    setGraphicForm(prev => {
      const updated = [...prev.carousel_slides, newSlide];
      return {
        ...prev,
        carousel_slides: updated,
        graphic_image_url: updated.length === 1 ? slideUrl : prev.graphic_image_url
      };
    });
    setNewSlideUrl('');
    setNewSlideName('');
  };

  const handleRemoveSlide = (index) => {
    setGraphicForm(prev => {
      const updated = prev.carousel_slides.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...prev,
        carousel_slides: updated,
        graphic_image_url: updated.length > 0 ? updated[0].url : ''
      };
    });
  };

  // Upload single picture from device (Static Post, Flyer, Poster)
  const handleUploadSinglePicture = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, SVG, GIF).');
      return;
    }

    setUploadingImage(true);
    // Instant local preview for immediate visual feedback
    const localPreviewUrl = URL.createObjectURL(file);
    setGraphicForm(prev => ({
      ...prev,
      graphic_image_url: localPreviewUrl,
      carousel_slides: [{ url: localPreviewUrl, name: file.name, size: file.size, order: 1 }]
    }));

    try {
      const formData = new FormData();
      formData.append('images', file);

      const res = await api.post('/media/upload-creative', formData);
      if (res?.file?.url) {
        setGraphicForm(prev => ({
          ...prev,
          graphic_image_url: res.file.url,
          carousel_slides: [{ url: res.file.url, name: res.file.name, size: res.file.size, order: 1 }]
        }));
        showToast('success', `📸 Picture "${file.name}" uploaded successfully! Live preview updated.`);
      }
    } catch (err) {
      console.error('Failed to upload picture:', err);
      showToast('error', err.message || 'Failed to upload image file');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload multiple carousel slides from device (Carousel)
  const handleUploadCarouselPictures = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        alert('Please select valid image files.');
        return;
      }

      // Add instant local previews
      const localSlides = validFiles.map((f, idx) => ({
        url: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        order: graphicForm.carousel_slides.length + idx + 1
      }));

      setGraphicForm(prev => {
        const merged = [...prev.carousel_slides, ...localSlides];
        return {
          ...prev,
          carousel_slides: merged,
          graphic_image_url: prev.graphic_image_url || merged[0].url
        };
      });

      const formData = new FormData();
      validFiles.forEach(f => formData.append('images', f));

      const res = await api.post('/media/upload-creative', formData);
      const uploadedList = res?.files || (res?.file ? [res.file] : []);

      if (uploadedList.length > 0) {
        setGraphicForm(prev => {
          // Replace local blob URLs with permanent server URLs
          const nonBlobSlides = prev.carousel_slides.filter(s => !s.url.startsWith('blob:'));
          const currentCount = nonBlobSlides.length;
          const serverSlides = uploadedList.map((item, idx) => ({
            url: item.url,
            name: item.name || `Slide ${currentCount + idx + 1}`,
            size: item.size,
            order: currentCount + idx + 1
          }));

          const finalMerged = [...nonBlobSlides, ...serverSlides];
          return {
            ...prev,
            carousel_slides: finalMerged,
            graphic_image_url: finalMerged[0]?.url || prev.graphic_image_url
          };
        });
        showToast('success', `📸 ${uploadedList.length} slide picture(s) uploaded to Carousel!`);
      }
    } catch (err) {
      console.error('Failed to upload carousel pictures:', err);
      showToast('error', err.message || 'Failed to upload carousel slides');
    } finally {
      setUploadingImage(false);
    }
  };

  const addHashtag = (tag, isGraphic = false) => {
    if (isGraphic) {
      if (!graphicForm.hashtags.includes(tag)) {
        setGraphicForm(prev => ({
          ...prev,
          hashtags: prev.hashtags ? `${prev.hashtags} ${tag}` : tag
        }));
      }
    } else {
      if (!postForm.hashtags.includes(tag)) {
        setPostForm(prev => ({
          ...prev,
          hashtags: prev.hashtags ? `${prev.hashtags} ${tag}` : tag
        }));
      }
    }
  };

  // STEP 3 (VIDEOS): SUBMIT COMPLETE POST TO ADMIN FOR APPROVAL
  const handleSubmitCompletePost = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!postForm.caption.trim()) {
      alert('Post caption is required.');
      return;
    }

    setSubmittingPost(true);
    try {
      const res = await api.post(`/media/${selectedTask.id}/smm-submit`, postForm);
      showToast('success', `📱 Complete post for "${selectedTask.task_title}" submitted to Admin for approval!`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to submit post');
    } finally {
      setSubmittingPost(false);
    }
  };

  // STEP 2 (GRAPHICS): SUBMIT COMPLETED GRAPHIC DRAFT TO ADMIN FOR APPROVAL
  const handleSubmitGraphicDraft = async (e) => {
    e.preventDefault();
    if (!selectedGraphicTask) return;
    if (!graphicForm.caption || !graphicForm.caption.trim()) {
      alert('Post caption is required.');
      return;
    }

    setSubmittingGraphic(true);
    try {
      const payload = {
        caption: graphicForm.caption.trim(),
        hashtags: graphicForm.hashtags.trim(),
        post_notes: graphicForm.post_notes.trim(),
        target_platforms: graphicForm.target_platforms,
        schedule_publish_date: graphicForm.schedule_publish_date,
        graphic_image_url: graphicForm.graphic_image_url,
        carousel_slides: JSON.stringify(graphicForm.carousel_slides)
      };

      await api.post(`/media/${selectedGraphicTask.id}/smm-submit-graphic`, payload);
      showToast('success', `🎨 ${selectedGraphicTask.post_type || 'Draft'} for "${selectedGraphicTask.task_title}" submitted to Admin for approval!`);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to submit graphic post');
    } finally {
      setSubmittingGraphic(false);
    }
  };

  const smmInboxTasks = mediaTasks.filter(t =>
    t.workflow_type !== 'STATIC_GRAPHIC' &&
    !['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(t.post_type) &&
    (t.workflow_stage === 'SMM_CAPTIONING' ||
     t.workflow_stage === 'NEEDS_REVISION_CAPTION' ||
     t.workflow_stage === 'IN_ADMIN_REVIEW_SMM')
  );

  const graphicTasks = mediaTasks.filter(t =>
    t.workflow_type === 'STATIC_GRAPHIC' ||
    ['Static Post', 'Carousel', 'Flyer', 'Poster'].includes(t.post_type)
  );

  const graphicActionNeededTasks = graphicTasks.filter(t =>
    t.workflow_stage === 'SMM_DRAFTING' ||
    t.workflow_stage === 'TASK_CREATED' ||
    t.workflow_stage === 'NEEDS_REVISION_SMM'
  );

  return (
    <div className="portal-inner-container">
      {/* Toast Alert */}
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
              Social Media Manager (SMM) Command Hub
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
              Step 3 Post Captioning & Hashtags
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
            Receive approved edited footage from Admin, craft high-converting captions and hashtags, and submit full posts for Admin publishing review.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadAllData}
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

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #222222',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('graphic_studio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'graphic_studio' ? '1px solid #8B5CF6' : '1px solid #262626',
            backgroundColor: activeTab === 'graphic_studio' ? '#8B5CF6' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'graphic_studio' ? '0 0 15px rgba(139, 92, 246, 0.4)' : 'none'
          }}
        >
          <Sparkles size={15} /> 🎨 Graphic & Carousel Studio ({graphicTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('workflow_inbox')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'workflow_inbox' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'workflow_inbox' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'workflow_inbox' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Award size={15} /> 1. Workflow Inbox (Passed Videos) ({smmInboxTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('captions_hashtags')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'captions_hashtags' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'captions_hashtags' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'captions_hashtags' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <Hash size={15} /> 2. Caption & Hashtag Editor
        </button>

        <button
          onClick={() => setActiveTab('content_tasks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'content_tasks' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'content_tasks' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'content_tasks' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <CheckSquare size={15} /> 3. Task Queue & Content View ({mediaTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
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
          <Calendar size={15} /> 4. Content Calendar View
        </button>

        <button
          onClick={() => setActiveTab('creatives')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'creatives' ? '1px solid #E50914' : '1px solid #262626',
            backgroundColor: activeTab === 'creatives' ? '#E50914' : '#141414',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'creatives' ? '0 0 15px rgba(229, 9, 20, 0.35)' : 'none'
          }}
        >
          <FolderOpen size={15} /> 5. Asset Repository
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
          <Clock size={15} /> 6. Personal Attendance Tracker
        </button>
      </div>

      {/* DEDICATED TAB: GRAPHIC & CAROUSEL STUDIO (STATIC POSTS, CAROUSELS, FLYERS, POSTERS) */}
      {activeTab === 'graphic_studio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
          {/* Left: Graphic Tasks Queue */}
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #262626',
            borderRadius: '14px',
            padding: '18px',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="#8B5CF6" /> Graphic & Carousel Queue
                </span>
                <span style={{ fontSize: '11px', color: '#A1A1AA' }}>
                  {graphicActionNeededTasks.length} requiring your action
                </span>
              </div>
              <span style={{
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                color: '#C084FC',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {graphicTasks.length} Total
              </span>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ACTION_NEEDED', label: 'Action Needed' },
                { id: 'IN_REVIEW', label: 'In Review' },
                { id: 'APPROVED', label: 'Approved' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setGraphicFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: graphicFilter === f.id ? '#8B5CF6' : '#222222',
                    color: graphicFilter === f.id ? '#FFFFFF' : '#A1A1AA',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '720px', overflowY: 'auto' }}>
              {graphicTasks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#71717A', fontSize: '12.5px' }}>
                  No graphic tasks assigned yet. Admin creates new tasks from the Admin Panel.
                </div>
              ) : (
                graphicTasks
                  .filter(task => {
                    if (graphicFilter === 'ACTION_NEEDED') {
                      return task.workflow_stage === 'SMM_DRAFTING' || task.workflow_stage === 'TASK_CREATED' || task.workflow_stage === 'NEEDS_REVISION_SMM';
                    }
                    if (graphicFilter === 'IN_REVIEW') {
                      return task.workflow_stage === 'IN_ADMIN_GRAPHIC_REVIEW' || task.workflow_stage === 'IN_CLIENT_REVIEW';
                    }
                    if (graphicFilter === 'APPROVED') {
                      return task.workflow_stage === 'APPROVED' || task.status === 'COMPLETED';
                    }
                    return true;
                  })
                  .map(task => {
                    const isSelected = selectedGraphicTask?.id === task.id;
                    const isRevision = task.workflow_stage === 'NEEDS_REVISION_SMM';
                    const formatColor = getPostTypeColor(task.post_type);

                    return (
                      <div
                        key={task.id}
                        onClick={() => selectGraphicTaskForEditing(task)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          border: isSelected ? '1.5px solid #8B5CF6' : '1px solid #222222',
                          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.12)' : '#1A1A1A',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(139, 92, 246, 0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            color: formatColor,
                            backgroundColor: `${formatColor}18`,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${formatColor}40`
                          }}>
                            {task.post_type || 'Static Post'}
                          </span>
                          <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="sm" />
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', lineHeight: 1.3 }}>
                          {task.task_title}
                        </div>

                        {isRevision && (
                          <div style={{
                            fontSize: '11px',
                            color: '#F87171',
                            fontWeight: 700,
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginTop: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertTriangle size={12} />
                            Revision Requested ({task.revision_source === 'CLIENT' ? 'Client' : 'Admin'})
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginTop: '6px' }}>
                          <span>Client: {task.company_name}</span>
                          <span>Due: {task.due_date}</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Right: Creative Studio & Submission */}
          {selectedGraphicTask ? (
            <div style={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '14px',
              padding: '24px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#8B5CF6', fontFamily: 'monospace', fontWeight: 800 }}>
                      {selectedGraphicTask.task_code}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: getPostTypeColor(selectedGraphicTask.post_type),
                      backgroundColor: `${getPostTypeColor(selectedGraphicTask.post_type)}20`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {selectedGraphicTask.post_type || 'Static Post'}
                    </span>
                    <WorkflowBadge stage={selectedGraphicTask.workflow_stage} status={selectedGraphicTask.review_status} size="sm" />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedGraphicTask.task_title}
                  </h2>
                  <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '4px' }}>
                    Client: <strong style={{ color: '#FFFFFF' }}>{selectedGraphicTask.company_name}</strong> • Due: {selectedGraphicTask.due_date} • Priority: <span style={{ color: '#F59E0B', fontWeight: 700 }}>{selectedGraphicTask.priority || 'HIGH'}</span>
                  </div>
                </div>
              </div>

              {/* Revision Banner if Loop Back */}
              {selectedGraphicTask.workflow_stage === 'NEEDS_REVISION_SMM' && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#F87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} /> Revision Feedback from {selectedGraphicTask.revision_source === 'CLIENT' ? 'Client Dashboard' : 'Admin Review'}
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#FFFFFF', lineHeight: 1.4 }}>
                    {selectedGraphicTask.client_feedback || selectedGraphicTask.admin_feedback || selectedGraphicTask.revision_comments || 'Please revise the creatives or captions as requested.'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#FCA5A5', marginTop: '6px' }}>
                    * Strict Rule: Upon resubmitting your modified draft, it will be routed to Admin for review before proceeding to the Client.
                  </div>
                </div>
              )}

              {/* Admin Creative Brief */}
              {selectedGraphicTask.raw_footage_notes && (
                <div style={{
                  backgroundColor: '#181818',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '12.5px',
                  color: '#D4D4D8'
                }}>
                  <strong style={{ color: '#A78BFA' }}>Admin Creative Brief & Guidelines:</strong> {selectedGraphicTask.raw_footage_notes}
                </div>
              )}

              {/* Main Studio Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px' }}>
                {/* Visual Creatives & Carousel Builder Column */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#D4D4D8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    1. Creative Visuals & Slides
                  </div>

                  {/* Interactive Live Preview */}
                  <div style={{ marginBottom: '16px' }}>
                    <GraphicPostViewer
                      task={{
                        ...selectedGraphicTask,
                        graphic_image_url: graphicForm.graphic_image_url,
                        carousel_slides: JSON.stringify(graphicForm.carousel_slides)
                      }}
                      maxHeight="320px"
                    />
                  </div>

                  {/* Multi-Slide Carousel Controls vs Single Creative Controls */}
                  {selectedGraphicTask.post_type === 'Carousel' ? (
                    <div style={{
                      backgroundColor: '#181818',
                      border: '1px solid #282828',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                            Carousel Slides ({graphicForm.carousel_slides.length})
                          </span>
                          <div style={{ fontSize: '11px', color: '#A1A1AA' }}>
                            Upload multiple slides or add one by one (Reorder & Preview)
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: '#A78BFA',
                          backgroundColor: 'rgba(167, 139, 250, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          Up to 10 slides
                        </span>
                      </div>

                      {/* Drag & Drop / Click Upload Area for Multiple Carousel Slides */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleUploadCarouselPictures(e.dataTransfer.files);
                          }
                        }}
                        onClick={() => document.getElementById('smm-carousel-file-input').click()}
                        style={{
                          border: `2px dashed ${dragOver ? '#8B5CF6' : '#383838'}`,
                          backgroundColor: dragOver ? 'rgba(139, 92, 246, 0.15)' : '#121212',
                          borderRadius: '10px',
                          padding: '18px 14px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          marginBottom: '14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input
                          type="file"
                          id="smm-carousel-file-input"
                          multiple
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleUploadCarouselPictures(e.target.files);
                            }
                          }}
                        />
                        <Upload size={24} color="#A78BFA" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {uploadingImage ? 'Uploading slide picture(s)...' : 'Upload Pictures for Carousel Slides'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#A1A1AA', marginTop: '3px' }}>
                          Drag & drop multiple image files here, or <span style={{ color: '#A78BFA', textDecoration: 'underline' }}>click to browse from computer</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#71717A', marginTop: '4px' }}>
                          Supports PNG, JPG, JPEG, WEBP, SVG • Instant live preview above
                        </div>
                      </div>

                      {/* Slides list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                        {graphicForm.carousel_slides.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#71717A', fontSize: '12px', border: '1px dashed #262626', borderRadius: '8px' }}>
                            No carousel slides added yet. Upload pictures above to start!
                          </div>
                        ) : (
                          graphicForm.carousel_slides.map((s, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#121212',
                                borderRadius: '8px',
                                border: '1px solid #282828'
                              }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#A78BFA', width: '22px' }}>
                                #{idx + 1}
                              </span>
                              <img
                                src={s.url}
                                alt={`Slide ${idx + 1}`}
                                style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #333' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.name || `Slide ${idx + 1}`}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#71717A' }}>
                                  {s.size ? `${Math.round(s.size / 1024)} KB • ` : ''}Slide #{idx + 1} of {graphicForm.carousel_slides.length}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlide(idx)}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                title="Delete Slide"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add New Slide Form via URL */}
                      <div style={{ borderTop: '1px solid #262626', paddingTop: '10px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA' }}>
                            Or Add Slide by URL:
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="url"
                            placeholder="Image URL (https://...)"
                            value={newSlideUrl}
                            onChange={e => setNewSlideUrl(e.target.value)}
                            style={{
                              flex: 2,
                              backgroundColor: '#121212',
                              border: '1px solid #333333',
                              borderRadius: '6px',
                              padding: '7px 10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Slide Title (optional)..."
                            value={newSlideName}
                            onChange={e => setNewSlideName(e.target.value)}
                            style={{
                              flex: 1,
                              backgroundColor: '#121212',
                              border: '1px solid #333333',
                              borderRadius: '6px',
                              padding: '7px 10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSlide()}
                            style={{
                              padding: '7px 12px',
                              backgroundColor: '#8B5CF6',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '10.5px', color: '#71717A' }}>Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddSlide('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80', 'Minimal Abstract Visual');
                          }}
                          style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: '#222', border: '1px solid #333', color: '#C084FC', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          + Abstract Art
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddSlide('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80', 'Architecture Focus');
                          }}
                          style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: '#222', border: '1px solid #333', color: '#60A5FA', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          + Architecture
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Single Creative Upload / URL for Static Post, Flyer, Poster */
                    <div style={{
                      backgroundColor: '#181818',
                      border: '1px solid #282828',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                            Creative Asset Picture
                          </span>
                          <div style={{ fontSize: '11px', color: '#A1A1AA' }}>
                            Upload your designed image file to display in the live preview
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          {selectedGraphicTask.post_type || 'Static Post'}
                        </span>
                      </div>

                      {/* Drag & Drop File Upload Area */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleUploadSinglePicture(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('smm-single-image-input').click()}
                        style={{
                          border: `2px dashed ${dragOver ? '#10B981' : (graphicForm.graphic_image_url ? '#2D4A3E' : '#383838')}`,
                          backgroundColor: dragOver ? 'rgba(16, 185, 129, 0.15)' : '#121212',
                          borderRadius: '10px',
                          padding: '18px 14px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          marginBottom: '12px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input
                          type="file"
                          id="smm-single-image-input"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleUploadSinglePicture(e.target.files[0]);
                            }
                          }}
                        />
                        <Upload size={24} color="#10B981" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {uploadingImage ? 'Uploading picture to server...' : `Upload ${selectedGraphicTask.post_type || 'Creative'} Picture`}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#A1A1AA', marginTop: '3px' }}>
                          Drag & drop your picture here, or <span style={{ color: '#10B981', textDecoration: 'underline' }}>click to browse from computer</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#71717A', marginTop: '4px' }}>
                          Supports PNG, JPG, JPEG, WEBP, SVG • Instantly updates live simulator preview
                        </div>
                      </div>

                      {/* Active File Loaded Card */}
                      {graphicForm.graphic_image_url && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: '#121212',
                          border: '1px solid #282828',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <img
                            src={graphicForm.graphic_image_url}
                            alt="Uploaded graphic preview"
                            style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #333' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={13} color="#10B981" />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                                Picture Loaded & Displayed
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#A1A1AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {graphicForm.graphic_image_url}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('smm-single-image-input').click();
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#222222',
                              border: '1px solid #333333',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Change
                          </button>
                        </div>
                      )}

                      {/* Toggle for manual URL input */}
                      <div style={{ marginBottom: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setUseUrlFallback(prev => !prev)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#A1A1AA',
                            fontSize: '11px',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{useUrlFallback ? '▲ Hide URL input' : '▼ Or specify image URL manually'}</span>
                        </button>
                      </div>

                      {useUrlFallback && (
                        <div style={{ marginBottom: '10px' }}>
                          <input
                            type="url"
                            value={graphicForm.graphic_image_url}
                            onChange={e => {
                              const url = e.target.value;
                              setGraphicForm(prev => ({
                                ...prev,
                                graphic_image_url: url,
                                carousel_slides: [{ url, name: `${selectedGraphicTask.post_type} Creative`, order: 1 }]
                              }));
                            }}
                            placeholder="https://..."
                            style={{
                              width: '100%',
                              backgroundColor: '#121212',
                              border: '1px solid #333333',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              color: '#FFFFFF',
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      )}

                      {/* Presets */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#71717A' }}>Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
                            setGraphicForm(prev => ({ ...prev, graphic_image_url: u, carousel_slides: [{ url: u, name: 'Luxury Minimalist', order: 1 }] }));
                          }}
                          style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: '#222', border: '1px solid #333', color: '#10B981', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          📸 Minimalist
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1572945753563-8049567821c4?w=1080&q=80';
                            setGraphicForm(prev => ({ ...prev, graphic_image_url: u, carousel_slides: [{ url: u, name: 'Event Flyer Visual', order: 1 }] }));
                          }}
                          style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: '#222', border: '1px solid #333', color: '#3B82F6', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          📄 Promo Flyer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080&q=80';
                            setGraphicForm(prev => ({ ...prev, graphic_image_url: u, carousel_slides: [{ url: u, name: 'Vibrant Poster Visual', order: 1 }] }));
                          }}
                          style={{ padding: '3px 8px', fontSize: '10.5px', backgroundColor: '#222', border: '1px solid #333', color: '#EC4899', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🎨 Vibrant Poster
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Copywriting & Submission Form Column */}
                <form onSubmit={handleSubmitGraphicDraft} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#D4D4D8', textTransform: 'uppercase' }}>
                    2. Copywriting & Campaign Package
                  </div>

                  {/* Caption */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                        Post Caption *
                      </label>
                      <span style={{ fontSize: '11px', color: '#A1A1AA' }}>
                        {graphicForm.caption.length} chars
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      placeholder="Write an engaging caption for this creative post..."
                      value={graphicForm.caption}
                      onChange={e => setGraphicForm(prev => ({ ...prev, caption: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E1E1E',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        lineHeight: 1.4,
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                      Hashtags
                    </label>
                    <input
                      type="text"
                      placeholder="#BrandGrowth #VisualDesign #CreativeDirection..."
                      value={graphicForm.hashtags}
                      onChange={e => setGraphicForm(prev => ({ ...prev, hashtags: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: '#1E1E1E',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#FFFFFF',
                        fontSize: '13px'
                      }}
                    />

                    {/* Hashtag Quick-Add Chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {hashtagPacks.slice(0, 8).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addHashtag(tag, true)}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#242424',
                            border: '1px solid #333333',
                            borderRadius: '12px',
                            color: '#A1A1AA',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Platforms & Publish Date (2 Columns) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                        Target Platforms
                      </label>
                      <input
                        type="text"
                        value={graphicForm.target_platforms}
                        onChange={e => setGraphicForm(prev => ({ ...prev, target_platforms: e.target.value }))}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E1E1E',
                          border: '1px solid #333333',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#FFFFFF',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                        Target Publish Date
                      </label>
                      <input
                        type="date"
                        value={graphicForm.schedule_publish_date}
                        onChange={e => setGraphicForm(prev => ({ ...prev, schedule_publish_date: e.target.value }))}
                        style={{
                          width: '100%',
                          backgroundColor: '#1E1E1E',
                          border: '1px solid #333333',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          color: '#FFFFFF',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #222222' }}>
                    <button
                      type="submit"
                      disabled={submittingGraphic}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#8B5CF6',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: submittingGraphic ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Send size={16} />
                      {submittingGraphic
                        ? 'Submitting Draft to Admin...'
                        : `🚀 Submit ${selectedGraphicTask.post_type || 'Creative'} Draft to Admin for Approval`}
                    </button>
                    <div style={{ fontSize: '11.5px', color: '#A1A1AA', textAlign: 'center', marginTop: '8px' }}>
                      Once approved by Admin, this post package is automatically published to Client Dashboard for final client sign-off.
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '14px',
              padding: '60px',
              textAlign: 'center',
              color: '#71717A'
            }}>
              <Sparkles size={36} color="#8B5CF6" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#FFFFFF', margin: '0 0 6px' }}>Select a Graphic Task</h3>
              <p style={{ fontSize: '13px' }}>Choose a static post, carousel, flyer, or poster from the left queue to start drafting.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: WORKFLOW INBOX FOR INCOMING VIDEOS PASSED FROM ADMIN (STEP 3) */}
      {activeTab === 'workflow_inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          {/* Left: Incoming Passed Videos */}
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #262626',
            borderRadius: '14px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Incoming Videos from Admin
              </span>
              <span style={{ fontSize: '11px', color: '#E50914', fontWeight: 700 }}>
                {smmInboxTasks.length} Ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {smmInboxTasks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#71717A', fontSize: '12px' }}>
                  No videos currently awaiting captioning.
                </div>
              ) : (
                smmInboxTasks.map(task => {
                  const isSelected = selectedTask?.id === task.id;
                  const isRevision = task.workflow_stage === 'NEEDS_REVISION_CAPTION';

                  return (
                    <div
                      key={task.id}
                      onClick={() => selectTaskForEditing(task)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #E50914' : '1px solid #222222',
                        backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.12)' : '#1A1A1A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#E50914', fontWeight: 700 }}>
                          {task.task_code}
                        </span>
                        <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="sm" />
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                        {task.task_title}
                      </div>

                      {isRevision && (
                        <div style={{ fontSize: '11px', color: '#FF6B6B', fontWeight: 600, marginTop: '4px' }}>
                          ⚠️ Caption revision requested
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '4px' }}>
                        Client: {task.company_name} • Due: {task.due_date}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Caption & Hashtag Production Studio */}
          {selectedTask ? (
            <div style={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '14px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedTask.task_code}
                    </span>
                    <WorkflowBadge stage={selectedTask.workflow_stage} status={selectedTask.review_status} size="sm" />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedTask.task_title}
                  </h2>
                </div>
              </div>

              {/* Show Revision Notes if Looped Back */}
              {(selectedTask.workflow_stage === 'NEEDS_REVISION_CAPTION' || selectedTask.split_path === 'PATH_B') && (
                <div style={{
                  backgroundColor: 'rgba(229, 9, 20, 0.12)',
                  border: '1px solid rgba(229, 9, 20, 0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#FF6B6B', marginBottom: '4px' }}>
                    ⚠️ {selectedTask.client_feedback ? 'Client Feedback (Path B: Content Issue)' : 'Admin Revision Notes'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#FFFFFF' }}>
                    {selectedTask.client_feedback || selectedTask.admin_feedback || 'Please adjust captions & hashtags.'}
                  </div>
                </div>
              )}

              {/* Layout: Video Preview + Form */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
                {/* Video Player */}
                <div>
                  <div style={{ position: 'relative', height: '320px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2D2D2D' }}>
                    <video
                      controls
                      playsInline
                      src={selectedTask.edited_video_url || selectedTask.raw_file_url}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: '6px' }}>
                    Editor Cut: {selectedTask.edited_video_name || `Cut v${selectedTask.version_count || 1}`}
                  </div>
                </div>

                {/* Form: Captions, Hashtags, Notes */}
                <form onSubmit={handleSubmitCompletePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Captions Input with Character Counter */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                        Post Captions:
                      </label>
                      <span style={{ fontSize: '11px', color: '#A1A1AA' }}>
                        {postForm.caption.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      placeholder="Write captivating captions with hooks, value, and calls-to-action..."
                      value={postForm.caption}
                      onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Hashtags Input & Quick Chips */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                        Hashtags & Strategy Tags:
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="#ViralReels #JewelryStyle #LuxuryDrop..."
                      value={postForm.hashtags}
                      onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {/* Hashtag Suggestion Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {hashtagPacks.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addHashtag(tag)}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #333333',
                            borderRadius: '6px',
                            color: '#A1A1AA',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Platforms & Schedule */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                        Target Platforms:
                      </label>
                      <input
                        type="text"
                        value={postForm.target_platforms}
                        onChange={(e) => setPostForm({ ...postForm, target_platforms: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          backgroundColor: '#1A1A1A',
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                        Publish Schedule:
                      </label>
                      <input
                        type="date"
                        value={postForm.schedule_publish_date}
                        onChange={(e) => setPostForm({ ...postForm, schedule_publish_date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          backgroundColor: '#1A1A1A',
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="submit"
                      disabled={submittingPost}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        backgroundColor: '#E50914',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: submittingPost ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)'
                      }}
                    >
                      <Send size={16} /> Submit Complete Post (Video + Captions) to Admin for Approval
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#71717A' }}>
              Select a passed video from the left to write captions.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAPTION & HASHTAG EDITOR */}
      {activeTab === 'captions_hashtags' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            Caption & Hashtag Strategy Studio
          </h2>
          <p style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '20px' }}>
            Craft high-converting hooks, calls to action, and strategic hashtag sets for upcoming campaigns.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {mediaTasks.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10.5px', color: '#E50914', fontFamily: 'monospace', fontWeight: 700 }}>{item.task_code}</span>
                  <WorkflowBadge stage={item.workflow_stage} status={item.review_status} size="sm" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>{item.task_title}</h4>
                <p style={{ fontSize: '12px', color: '#D4D4D8', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {item.caption || '(No caption attached)'}
                </p>
                <div style={{ fontSize: '11px', color: '#6EE7B7' }}>{item.hashtags || '#SocialMedia'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TASK QUEUE & CONTENT VIEW */}
      {activeTab === 'content_tasks' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
            All Content Tasks & Video Queue
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {mediaTasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#E50914', fontFamily: 'monospace' }}>{task.task_code}</span>
                  <WorkflowBadge stage={task.workflow_stage} status={task.review_status} size="sm" />
                </div>
                <h4 style={{ fontSize: '15px', color: '#FFFFFF', margin: '0 0 4px' }}>{task.task_title}</h4>
                <div style={{ fontSize: '11.5px', color: '#A1A1AA' }}>Due: {task.due_date} • Priority: {task.priority}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
            Social Media Content Calendar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {calendarItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#E50914', fontWeight: 700 }}>{item.publish_date}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0' }}>{item.topic}</div>
                <div style={{ fontSize: '12px', color: '#A1A1AA' }}>{item.platform} • {item.content_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ASSET REPOSITORY */}
      {activeTab === 'creatives' && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
            Creative Assets & Media Repository
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {mediaTasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ height: '160px', backgroundColor: '#000', position: 'relative' }}>
                  <video
                    src={task.edited_video_url || task.raw_file_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{task.task_title}</div>
                  <div style={{ fontSize: '11px', color: '#A1A1AA', marginTop: '2px' }}>{task.company_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PERSONAL ATTENDANCE TRACKER */}
      {activeTab === 'attendance' && (
        <EmployeeAttendanceTracker title="My Personal Attendance & Shift Logger" />
      )}
    </div>
  );
}
