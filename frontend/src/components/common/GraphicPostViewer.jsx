import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Image as ImageIcon, Layers,
  FileText, Palette, Maximize2, X, Download, ZoomIn
} from 'lucide-react';

export function getPostTypeIcon(postType) {
  switch (postType) {
    case 'Carousel':
      return Layers;
    case 'Flyer':
      return FileText;
    case 'Poster':
      return Palette;
    case 'Static Post':
    default:
      return ImageIcon;
  }
}

export function getPostTypeColor(postType) {
  switch (postType) {
    case 'Carousel':
      return '#A855F7'; // Purple
    case 'Flyer':
      return '#3B82F6'; // Blue
    case 'Poster':
      return '#EC4899'; // Pink
    case 'Static Post':
    default:
      return '#10B981'; // Emerald
  }
}

/**
 * Interactive Graphic & Multi-Slide Carousel Viewer
 * Designed for Admin review, SMM preview, and Client inspection.
 */
export default function GraphicPostViewer({
  task,
  maxHeight = '420px',
  showThumbnails = true,
  autoAspectRatio = '1/1'
}) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!task) return null;

  const postType = task.post_type || 'Static Post';
  const Icon = getPostTypeIcon(postType);
  const accentColor = getPostTypeColor(postType);

  // Parse slides
  let slides = [];
  if (task.carousel_slides) {
    try {
      slides = typeof task.carousel_slides === 'string'
        ? JSON.parse(task.carousel_slides)
        : task.carousel_slides;
    } catch (e) {
      slides = [];
    }
  }

  // If no slides array or single image post, build 1-item slide from graphic_image_url
  if (!Array.isArray(slides) || slides.length === 0) {
    if (task.graphic_image_url) {
      slides = [{
        url: task.graphic_image_url,
        name: task.graphic_image_name || `${postType} Creative`,
        order: 1
      }];
    } else {
      slides = [{
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80',
        name: `${postType} Creative Draft`,
        order: 1
      }];
    }
  }

  const isCarousel = postType === 'Carousel' || slides.length > 1;
  const currentSlide = slides[currentSlideIndex] || slides[0] || {};
  const currentUrl = currentSlide.url || task.graphic_image_url;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentSlideIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentSlideIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{
      backgroundColor: '#0F0F0F',
      border: '1px solid #262626',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Graphic Header Bar */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: '#161616',
        borderBottom: '1px solid #242424',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '6px',
            backgroundColor: `${accentColor}20`,
            border: `1px solid ${accentColor}50`,
            color: accentColor,
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <Icon size={13} />
            {postType}
          </span>
          {isCarousel && (
            <span style={{
              fontSize: '11.5px',
              color: '#A1A1AA',
              fontWeight: 600,
              backgroundColor: '#222222',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setLightboxOpen(true)}
            style={{
              background: '#222222',
              border: '1px solid #333333',
              color: '#D4D4D8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Expand Fullscreen Creative Lightbox"
          >
            <Maximize2 size={12} />
            Zoom
          </button>
        </div>
      </div>

      {/* Main Image Display Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: maxHeight,
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          key={currentUrl}
          src={currentUrl}
          alt={currentSlide.name || `${postType} Slide`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.2s ease'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80';
          }}
        />

        {/* Carousel Navigation Arrows */}
        {isCarousel && slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                zIndex: 10
              }}
              title="Previous Slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                zIndex: 10
              }}
              title="Next Slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Bottom Pagination Dots */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '4px 10px',
              borderRadius: '20px',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIndex(idx);
                  }}
                  style={{
                    width: currentSlideIndex === idx ? '18px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    backgroundColor: currentSlideIndex === idx ? accentColor : 'rgba(255,255,255,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Slide Title Bar */}
      <div style={{
        padding: '8px 14px',
        backgroundColor: '#121212',
        borderTop: '1px solid #222222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11.5px',
        color: '#A1A1AA'
      }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong style={{ color: '#FFFFFF' }}>{currentSlide.name || `${postType} Slide ${currentSlideIndex + 1}`}</strong>
        </div>
        <div>
          Format: <span style={{ color: '#D4D4D8' }}>{postType}</span>
        </div>
      </div>

      {/* Thumbnails Strip (for Carousels) */}
      {showThumbnails && isCarousel && slides.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#0D0D0D',
          borderTop: '1px solid #1E1E1E',
          overflowX: 'auto'
        }}>
          {slides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              style={{
                width: '56px',
                height: '56px',
                minWidth: '56px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: currentSlideIndex === idx ? `2px solid ${accentColor}` : '1px solid #2A2A2A',
                backgroundColor: '#181818',
                padding: 0,
                cursor: 'pointer',
                opacity: currentSlideIndex === idx ? 1 : 0.65,
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <img
                src={slide.url}
                alt={`Thumb ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 3px',
                borderRadius: '3px'
              }}>
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          {/* Header */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10
          }}>
            <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>
              {currentSlide.name || `${postType} Slide ${currentSlideIndex + 1}`} ({currentSlideIndex + 1}/{slides.length})
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img
              src={currentUrl}
              alt="Zoomed Creative"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            />

            {isCarousel && slides.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: '-48px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: '-48px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
