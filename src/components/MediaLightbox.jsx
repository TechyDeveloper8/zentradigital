import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, ExternalLink, ArrowRight, Globe, Sparkles, Eye, Monitor, RefreshCw } from 'lucide-react';

export default function MediaLightbox({ activeMedia, onClose, onOpenProjectModal }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (activeMedia && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => console.log('Video play error:', err));
    }
  }, [activeMedia]);

  if (!activeMedia) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isVideo = activeMedia.mediaType === 'video' && activeMedia.videoUrl;
  const isImage = activeMedia.mediaType === 'image' && (activeMedia.imageUrl || activeMedia.posterUrl);
  const isWebsite = activeMedia.mediaType === 'website' || activeMedia.websiteUrl;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 5, 0.96)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: isWebsite ? '1240px' : isImage ? '1100px' : '920px',
          width: '100%',
          maxHeight: '90vh',
          background: '#0D0D0D',
          border: '1px solid var(--border-dark)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#050505',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="#E00000" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#E00000', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ZENTRA LIVE VIEWER // {activeMedia.category}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content Body */}
        <div style={{ display: 'flex', flexStyle: 'row', flex: 1, minHeight: 0, overflowY: 'auto' }} className="lightbox-body">
          {/* Media Player Column */}
          <div
            style={{
              flex: isVideo ? '0 0 clamp(280px, 40%, 380px)' : isWebsite ? '0 0 clamp(380px, 62%, 720px)' : isImage ? '0 0 clamp(340px, 55%, 620px)' : '1',
              backgroundColor: '#050505',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '380px',
              maxHeight: '75vh',
              overflow: 'hidden',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              background: 'radial-gradient(circle at center, rgba(224, 0, 0, 0.12) 0%, #050505 75%)',
            }}
          >
            {isVideo ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={videoRef}
                  src={activeMedia.videoUrl}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  preload="auto"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    maxHeight: '72vh',
                    width: '100%',
                    objectFit: 'contain',
                    transform: 'translateZ(0)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
                  }}
                />

                {/* Floating Video Player Controls */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.25rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.6rem',
                    zIndex: 5,
                  }}
                >
                  <button
                    onClick={togglePlay}
                    style={{
                      background: 'rgba(15, 15, 15, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#FFFFFF',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={toggleMute}
                    style={{
                      background: 'rgba(15, 15, 15, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#FFFFFF',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    }}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isMuted ? 'Unmute' : 'Sound On'}</span>
                  </button>
                </div>
              </div>
            ) : isImage ? (
              /* HIGH RESOLUTION IMAGE VIEWER */
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <img
                  src={activeMedia.imageUrl || activeMedia.posterUrl}
                  alt={activeMedia.title}
                  style={{
                    maxHeight: '70vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                  }}
                />
              </div>
            ) : isWebsite ? (
              /* LIVE INTERACTIVE WEBSITE BROWSER FRAME */
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#111111' }}>
                {/* Embedded Browser Header Bar */}
                <div style={{ padding: '0.6rem 1rem', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F56' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27C93F' }} />
                  </div>

                  <div style={{ flex: 1, maxWidth: '400px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#AAAAAA' }}>
                    <Globe size={12} color="#E00000" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeMedia.websiteUrl}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIframeKey((prev) => prev + 1)}
                      title="Reload Live View"
                      style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <RefreshCw size={14} />
                    </button>
                    <a
                      href={activeMedia.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in New Tab"
                      style={{ color: '#E00000', display: 'flex', alignItems: 'center' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Live Interactive Iframe View */}
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: '450px' }}>
                  <iframe
                    key={iframeKey}
                    src={activeMedia.websiteUrl}
                    title={activeMedia.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '450px',
                      border: 'none',
                      background: '#FFFFFF',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#FFFFFF', width: '100%' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(224,0,0,0.1)', border: '1px solid rgba(224,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                  <Globe size={36} color="#E00000" />
                </div>
                <h3 style={{ fontSize: '1.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>{activeMedia.title}</h3>
                <p style={{ color: '#888888', marginBottom: '2rem', fontSize: '0.95rem' }}>Live Web Engineering Project</p>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div
            style={{
              flex: '1',
              padding: '2.25rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#0D0D0D',
              overflowY: 'auto',
            }}
          >
            <div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#E00000', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                CLIENT: {activeMedia.client}
              </span>

              <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.15 }}>
                {activeMedia.title}
              </h2>

              <p style={{ color: '#E0E0E0', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {activeMedia.subtitle}
              </p>

              <p style={{ color: '#A0A0A0', fontSize: '0.95rem', lineHeight: 1.65, fontWeight: 400, marginBottom: '1.75rem' }}>
                {activeMedia.description}
              </p>

              {activeMedia.deliverables && (
                <div style={{ marginBottom: '2rem' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-body)', color: '#666666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.65rem' }}>
                    CAMPAIGN DELIVERABLES
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {activeMedia.deliverables.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-body)',
                          color: '#D0D0D0',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {activeMedia.websiteUrl && (
                <a
                  href={activeMedia.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1',
                    padding: '0.85rem 1.25rem',
                    background: '#FFFFFF',
                    color: '#0A0A0A',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minWidth: '140px',
                  }}
                >
                  <span>Open Full Site</span>
                  <ExternalLink size={16} />
                </a>
              )}

              <button
                onClick={() => {
                  onClose();
                  if (onOpenProjectModal) onOpenProjectModal();
                }}
                className="btn-primary"
                style={{ flex: '2', padding: '0.85rem 1.5rem', fontSize: '0.88rem', justifyContent: 'center', minWidth: '180px' }}
              >
                <span>Build Similar Website</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .lightbox-body {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
