import React from 'react';
import { ArrowRight, ArrowDownRight, Award } from 'lucide-react';

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
        padding: '7.5rem 1.25rem 3.5rem 1.25rem',
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
        {/* Left Column Text & Headline (100% Unobstructed 70% Width) */}
        <div style={{ maxWidth: '720px', zIndex: 3 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              background: '#0A0A0A',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1.75rem',
            }}
          >
            <Award size={14} color="#E00000" />
            <span>1+ YEARS OF DIGITAL EXPERIENCE</span>
          </div>

          {/* Main Massive Editorial Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.6rem, 8.5vw, 5.6rem)',
              lineHeight: 1.04,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              marginBottom: '1.75rem',
              letterSpacing: '-0.04em',
            }}
          >
            WE MAKE <br />
            BRANDS <br />
            <span style={{ color: '#E00000' }}>IMPOSSIBLE TO IGNORE.</span>
          </h1>

          {/* Supporting Copy */}
          <p
            style={{
              fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
              color: '#555555',
              lineHeight: 1.6,
              fontWeight: 500,
              marginBottom: '2.5rem',
              maxWidth: '580px',
            }}
          >
            Zentra Digital combines strategy, creativity, technology and performance to help ambitious brands grow in the digital world.
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
            >
              <span>START A PROJECT</span>
              <ArrowRight size={18} />
            </button>

            <a
              href="#work"
              className="btn-secondary"
              style={{ padding: '1rem 2.2rem', fontSize: '1rem' }}
            >
              <span>VIEW OUR WORK</span>
              <ArrowDownRight size={18} />
            </a>
          </div>
        </div>

        {/* Right Column Reserved for 3D Digital Box Canvas */}
        <div style={{ pointerEvents: 'none', height: '100%' }} />
      </div>
    </section>
  );
}
