import React from 'react';
import { ArrowRight, ArrowDownRight } from 'lucide-react';

export default function Hero({ onOpenProjectModal }) {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '7rem 1.25rem 3rem 1.25rem',
        zIndex: 2,
        backgroundColor: 'transparent',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        {/* Left Column Text & Headline (100% Unobstructed) */}
        <div style={{ maxWidth: '680px', zIndex: 3 }}>
          {/* Main Massive Editorial Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 9.5vw, 5.8rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              marginBottom: '1.75rem',
              letterSpacing: '-0.04em',
            }}
          >
            WE BUILD <br />
            DIGITAL <br />
            <span style={{ color: '#E00000' }}>MOMENTUM.</span>
          </h1>

          {/* Supporting Copy */}
          <p
            style={{
              fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
              color: '#555555',
              lineHeight: 1.6,
              fontWeight: 500,
              marginBottom: '2.25rem',
              maxWidth: '560px',
            }}
          >
            Zentra Digital combines strategy, creative, technology and performance to help ambitious brands grow in the digital world.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={onOpenProjectModal}
              className="btn-primary"
              style={{ padding: '1rem 2.2rem', fontSize: '1rem' }}
              data-cursor="PROJECT"
            >
              <span>Start a Project</span>
              <ArrowRight size={18} />
            </button>

            <a
              href="#work"
              className="btn-secondary"
              style={{ padding: '1rem 2.2rem', fontSize: '1rem' }}
              data-cursor="WORK"
            >
              <span>View Our Work</span>
              <ArrowDownRight size={18} />
            </a>
          </div>
        </div>

        {/* Right Column Spacer for 3D Digital Glass Core */}
        <div style={{ pointerEvents: 'none', height: '100%' }} />
      </div>
    </section>
  );
}
