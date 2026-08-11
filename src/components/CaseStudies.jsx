import React, { useState } from 'react';
import { ArrowUpRight, Play, ExternalLink, Video, Globe, Camera, Eye, BarChart3, Monitor } from 'lucide-react';
import MediaLightbox from './MediaLightbox';

export default function CaseStudies({ onOpenProjectModal }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMedia, setActiveMedia] = useState(null);

  const categories = [
    'All',
    'Video Shoots',
    'Product Photography',
    'Website Development',
    'Social Media',
    'Advertising',
    'Performance Marketing',
  ];

  // =========================================================================
  // PORTFOLIO DATA CONFIGURATION
  // Place your video files in public folder (e.g. /logoofclient/tanishqvideo.mp4)
  // Place your live website URLs in websiteUrl field (e.g. https://yourwebsite.com)
  // =========================================================================
  const caseStudies = [
    {
      id: 'tanishq-jewellery-shoot',
      title: 'JEWELLERY PRODUCT SHOOT',
      client: 'Tanishq Bhagalpur & Mia by Tanishq',
      category: 'Product Photography',
      mediaType: 'video',
      videoUrl: '/logoofclient/tanishqvideo.mp4',
      posterUrl: '/logoofclient/TanishqLogo.jpg',
      subtitle: 'Luxury Commercial Video & Shoot',
      description: 'High-end commercial macro photography, studio lighting, and video campaign highlighting gold craftsmanship and gemstone brilliance.',
      featured: true,
      imageTag: 'LUXURY JEWELLERY EDITORIAL VIDEO',
      deliverables: ['4K Video Shoot', 'Lighting & Direction', 'Color Grading', 'Social Reels'],
    },
    {
      id: 'khadims-retail-campaign',
      title: 'RETAIL CAMPAIGN & REEL SHOOT',
      client: 'Khadim’s & Helios Bhagalpur',
      category: 'Social Media',
      mediaType: 'video',
      videoUrl: '/logoofclient/khadimsvideo.mp4',
      posterUrl: '/logoofclient/KhadimLogo.jpg',
      subtitle: 'Regional Campaign Video Production',
      description: 'Strategic visual content, high-converting reel production, and localized campaign videos driving footfalls across regional outlets.',
      featured: true,
      imageTag: 'RETAIL CAMPAIGN VIDEO PRODUCTION',
      deliverables: ['Footwear Campaign Shoot', 'Reel Editing', 'Local Meta Ads'],
    },
    {
      id: 'crimsone-brand-shoot',
      title: 'BRAND ADVERTISING SHOOT',
      client: 'Crimsone Club Bhagalpur',
      category: 'Advertising',
      mediaType: 'video',
      videoUrl: '/logoofclient/crimsonevideo.mp4',
      posterUrl: '/logoofclient/Crimsonelogo.jpeg',
      subtitle: 'High-Impact Brand Campaign Shoot',
      description: 'Cinematic apparel shoot and dynamic visual video production tailored for high-converting social media and display ads.',
      featured: false,
      imageTag: 'APPAREL CAMPAIGN SHOOT',
      deliverables: ['Apparel Shoot', 'Ad Creatives', 'Visual Storytelling'],
    },
    {
      id: 'brand-web-engineering',
      title: 'CUSTOM DIGITAL WEB PORTAL',
      client: 'VANA Entertainment',
      category: 'Website Development',
      mediaType: 'website',
      websiteUrl: 'https://vana-evntertainment.vercel.app/', // PLACE YOUR LIVE WEBSITE LINK HERE
      subtitle: 'Sub-second Modern Web Engineering',
      description: 'Minimal, responsive corporate web architecture built with modern frontend frameworks, 3D interactions, and ultra-fast performance.',
      featured: false,
      imageTag: 'LIVE WEBSITE DEVELOPMENT',
      deliverables: ['React / Modern Web Architecture', 'UI/UX Design', 'SEO & Speed Optimization'],
    },
    {
      id: 'performance-funnel',
      title: 'PERFORMANCE ACQUISITION ENGINE',
      client: 'Titan Eye+ & Taneira Bhagalpur',
      category: 'Performance Marketing',
      mediaType: 'image',
      imageUrl: '/logoofclient/peformance dashboard.png',
      posterUrl: '/logoofclient/peformance dashboard.png',
      subtitle: 'Paid Media Conversion Optimization',
      description: 'Data-backed ad funnels across Meta and Google Ads generating high-intent customer inquiries, scalable ROAS, and footfall conversions.',
      featured: false,
      imageTag: 'PERFORMANCE MARKETING DASHBOARD',
      deliverables: ['Meta & Google Ad Setup', 'Conversion Optimization', 'ROAS Analytics'],
    },
  ];

  const filteredStudies = activeCategory === 'All'
    ? caseStudies
    : activeCategory === 'Video Shoots'
    ? caseStudies.filter((item) => item.mediaType === 'video')
    : activeCategory === 'Website Development'
    ? caseStudies.filter((item) => item.mediaType === 'website')
    : caseStudies.filter((item) => item.category === activeCategory);

  return (
    <section id="work" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Headline Header */}
        <div style={{ marginBottom: '3rem' }} className="mobile-text-center">
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: '#E00000',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            PORTFOLIO & CAMPAIGNS
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            WORK THAT <br />
            <span style={{ color: '#E00000' }}>MOVES BRANDS.</span>
          </h2>
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
          className="portfolio-filters"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1.1rem',
                background: activeCategory === cat ? '#0A0A0A' : '#FFFFFF',
                border: activeCategory === cat ? '1px solid #0A0A0A' : '1px solid var(--border-subtle)',
                color: activeCategory === cat ? '#FFFFFF' : '#0A0A0A',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Full-Width Case Studies Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {filteredStudies.map((study) => (
            <div
              key={study.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-dark)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '0rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              }}
              className="minimal-card"
            >
              {/* Media Frame (Video / Website Preview / Image) */}
              <div
                style={{
                  minHeight: '340px',
                  background: '#050505',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRight: '1px solid var(--border-dark)',
                  background: 'radial-gradient(circle at center, rgba(224, 0, 0, 0.12) 0%, #050505 80%)',
                }}
              >
                {/* HIGH-PERFORMANCE UNCROPPED VIDEO PREVIEW */}
                {study.mediaType === 'video' && study.videoUrl ? (
                  <div
                    style={{ width: '100%', height: '100%', minHeight: '340px', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                    onClick={() => setActiveMedia(study)}
                  >
                    {!activeMedia ? (
                      <video
                        src={study.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          width: '100%',
                          height: '100%',
                          maxHeight: '380px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: '340px', background: '#080808' }} />
                    )}

                    <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)', pointerEvents: 'none' }} />

                    {/* Play Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 4,
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(224, 0, 0, 0.9)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 25px rgba(224, 0, 0, 0.6)',
                          transition: 'transform 0.3s ease',
                        }}
                        className="pulse-icon"
                      >
                        <Play size={22} style={{ marginLeft: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(10,10,10,0.85)', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        WATCH VIDEO SHOOT
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 4, background: 'rgba(10,10,10,0.85)', padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                      <Video size={12} color="#E00000" />
                      <span>CAMPAIGN VIDEO</span>
                    </div>
                  </div>
                ) : study.mediaType === 'website' ? (
                  /* LIVE VISUAL WEBSITE CARD PREVIEW (MINI BROWSER WINDOW WITH LIVE IFRAME) */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '340px',
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      background: '#0D0D0D',
                    }}
                    onClick={() => setActiveMedia(study)}
                  >
                    {/* Simulated Mini Browser Window Header */}
                    <div style={{ padding: '0.4rem 0.75rem', background: '#1A1A1A', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem', zIndex: 4 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5F56' }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBD2E' }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27C93F' }} />
                      <div style={{ marginLeft: '0.4rem', background: '#050505', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', color: '#AAAAAA', display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Globe size={10} color="#E00000" />
                        <span>{study.websiteUrl}</span>
                      </div>
                    </div>

                    {/* Scaled Live Website Iframe Preview */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
                      <iframe
                        src={study.websiteUrl}
                        title={study.title}
                        style={{
                          width: '200%',
                          height: '200%',
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                          border: 'none',
                          background: '#FFFFFF',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>

                    {/* Subtle Overlay & Play Badge */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 65%)', pointerEvents: 'none' }} />

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '1.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 5,
                      }}
                    >
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: 'rgba(224, 0, 0, 0.95)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 25px rgba(224, 0, 0, 0.7)',
                        }}
                      >
                        <Monitor size={22} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(10,10,10,0.9)', padding: '0.35rem 0.85rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                        LAUNCH INTERACTIVE VIEW
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '2.4rem', left: '1rem', zIndex: 5, background: 'rgba(10,10,10,0.85)', padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                      <Globe size={12} color="#E00000" />
                      <span>LIVE WEB PREVIEW</span>
                    </div>
                  </div>
                ) : (
                  /* IMAGE PREVIEW FRAME (PERFORMANCE DASHBOARD) */
                  <div
                    style={{ width: '100%', height: '100%', minHeight: '340px', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#050505' }}
                    onClick={() => setActiveMedia(study)}
                  >
                    <img
                      src={study.imageUrl || study.posterUrl}
                      alt={study.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '380px',
                        objectFit: 'contain',
                        padding: '1rem',
                        transition: 'transform 0.3s ease',
                      }}
                    />

                    <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', pointerEvents: 'none' }} />

                    {/* View Overlay Button */}
                    <div
                      style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 4,
                      }}
                    >
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          background: 'rgba(224, 0, 0, 0.9)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 25px rgba(224, 0, 0, 0.6)',
                        }}
                      >
                        <Eye size={22} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(10,10,10,0.85)', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        EXPAND DASHBOARD
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 4, background: 'rgba(10,10,10,0.85)', padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                      <BarChart3 size={12} color="#E00000" />
                      <span>ANALYTICS DASHBOARD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Editorial Details */}
              <div style={{ padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#E00000', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    {study.subtitle}
                  </span>

                  <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
                    {study.title}
                  </h3>

                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#888888', marginBottom: '1.25rem', fontWeight: 600 }}>
                    CLIENT: {study.client}
                  </p>

                  <p style={{ color: '#555555', fontSize: '0.98rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '1.5rem' }}>
                    {study.description}
                  </p>

                  {/* Deliverables Tags */}
                  {study.deliverables && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                      {study.deliverables.map((deliv, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-body)',
                            color: '#555555',
                            background: '#F4F4F4',
                            border: '1px solid #E0E0E0',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {deliv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {study.mediaType === 'video' && (
                      <button
                        onClick={() => setActiveMedia(study)}
                        style={{
                          padding: '0.6rem 1.1rem',
                          background: '#0A0A0A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Play size={14} fill="#FFFFFF" />
                        <span>Watch Video Shoot</span>
                      </button>
                    )}

                    {study.mediaType === 'website' && (
                      <button
                        onClick={() => setActiveMedia(study)}
                        style={{
                          padding: '0.6rem 1.1rem',
                          background: '#0A0A0A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Monitor size={14} />
                        <span>Live Interactive View</span>
                      </button>
                    )}

                    {study.mediaType === 'image' && (
                      <button
                        onClick={() => setActiveMedia(study)}
                        style={{
                          padding: '0.6rem 1.1rem',
                          background: '#0A0A0A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Eye size={14} />
                        <span>View Analytics Dashboard</span>
                      </button>
                    )}

                    {study.websiteUrl && (
                      <a
                        href={study.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.6rem 1.1rem',
                          background: '#0A0A0A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Site</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={onOpenProjectModal}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#E00000',
                      cursor: 'pointer',
                    }}
                  >
                    <span>PROJECT BRIEF</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Video & Web & Image previews */}
      <MediaLightbox
        activeMedia={activeMedia}
        onClose={() => setActiveMedia(null)}
        onOpenProjectModal={onOpenProjectModal}
      />

      <style>{`
        @media (max-width: 768px) {
          .portfolio-filters {
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  );
}
