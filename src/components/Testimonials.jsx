import React, { useState } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviews = [
    {
      quote: "Zentra didn't just improve our marketing. They changed the way we think about growth.",
      author: "Alex Morgan",
      role: "CEO, Nova Technologies",
      metrics: "+184% Pipeline Growth",
    },
    {
      quote: "Their blend of 3D digital experiences and performance marketing boosted our conversion rates by 210%.",
      author: "Elena Rostova",
      role: "CMO, Apex Global",
      metrics: "3.8× ROAS Scaled",
    },
    {
      quote: "The team at Zentra delivers enterprise-grade strategy with high-end creative execution. Unmatched quality.",
      author: "Marcus Thorne",
      role: "Founder, Vertex Systems",
      metrics: "+126% Organic Traffic",
    },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const current = reviews[currentIndex];

  return (
    <section
      id="testimonials"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(6, 7, 10, 0.85)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--accent-electric)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1rem',
          }}
        >
          // EXECUTIVE ENDORSEMENTS
        </span>

        {/* Big Quote Symbol */}
        <div style={{ color: 'rgba(0, 240, 255, 0.2)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Quote size={60} />
        </div>

        {/* Testimonial Card */}
        <div
          key={currentIndex}
          className="glass-panel"
          style={{
            padding: '3.5rem 2.5rem',
            background: 'rgba(12, 15, 23, 0.85)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            boxShadow: '0 20px 40px -15px rgba(0, 240, 255, 0.15)',
            animation: 'fadeIn 0.4s ease',
          }}
        >
          {/* Star Rating */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', color: '#00F0FF', marginBottom: '2rem' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} fill="#00F0FF" />
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.4,
              marginBottom: '2.5rem',
              fontStyle: 'italic',
            }}
          >
            "{current.quote}"
          </p>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{current.author}</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-electric)', marginTop: '0.25rem' }}>
              {current.role}
            </p>
            <div
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.35rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '9999px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              RESULT: {current.metrics}
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
          <button
            onClick={handlePrev}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            data-cursor="PREV"
          >
            <ChevronLeft size={22} />
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {reviews.map((_, i) => (
              <span
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: i === currentIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === currentIndex ? '#00F0FF' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            data-cursor="NEXT"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}
