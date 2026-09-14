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
              gap: '0.55rem',
              padding: '0.45rem 1rem',
              background: '#0A0A0A',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1.75rem',
              border: '1px solid rgba(224, 0, 0, 0.4)',
              boxShadow: '0 2px 12px rgba(224, 0, 0, 0.15)',
            }}
          >
            <Award size={15} color="#E00000" />
            <span>20+ CLIENTS IN 1 YEAR OF COMPANY</span>
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

          {/* Milestone Metrics Bar */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              flexWrap: 'wrap',
              borderTop: '1px solid #ECECEC',
              paddingTop: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0A0A0A', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                20<span style={{ color: '#E00000' }}>+</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#666666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Clients in Year 1
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: '#E0E0E0' }} />

            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0A0A0A', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                100<span style={{ color: '#E00000' }}>%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#666666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dedicated Delivery
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: '#E0E0E0' }} />

            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0A0A0A', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                Full<span style={{ color: '#E00000' }}>-Stack</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#666666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Growth Ecosystem
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Reserved for 3D Digital Box Canvas */}
        <div style={{ pointerEvents: 'none', height: '100%' }} />
      </div>
    </section>
  );
}
