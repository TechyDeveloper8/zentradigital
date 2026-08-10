import React from 'react';
import { Activity } from 'lucide-react';

export default function About() {
  const analyticsBars = [35, 58, 42, 75, 62, 90, 84, 96];

  return (
    <section id="about" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column Editorial Text */}
          <div className="mobile-text-center">
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
              SECTION 02
            </span>
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                lineHeight: 1.05,
                fontWeight: 700,
                color: '#0A0A0A',
                textTransform: 'uppercase',
                marginBottom: '2rem',
                letterSpacing: '-0.03em',
              }}
            >
              DIGITAL GROWTH, <br />
              <span style={{ color: '#E00000' }}>WITHOUT THE NOISE.</span>
            </h2>

            <p
              style={{
                fontSize: '1.25rem',
                color: '#555555',
                lineHeight: 1.6,
                fontWeight: 500,
                maxWidth: '560px',
              }}
            >
              Zentra Digital helps brands build stronger digital identities through strategy, creative, performance marketing, technology and content.
            </p>
          </div>

          {/* Right Column Minimal Analytics Visualization */}
          <div
            style={{
              padding: '2.5rem',
              background: '#FFFFFF',
              border: '1px solid var(--border-dark)',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={18} color="#E00000" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PERFORMANCE ANALYTICS
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#E00000', fontWeight: 700 }}>
                +148% ROI
              </span>
            </div>

            {/* Bars Visualization */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: '180px', paddingTop: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              {analyticsBars.map((val, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${val}%`,
                      backgroundColor: idx === analyticsBars.length - 1 ? '#E00000' : '#0A0A0A',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.6s ease',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#888888', fontWeight: 600 }}>
                    0{idx + 1}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#555555' }}>
              <span>KEY PERFORMANCE INDICATOR</span>
              <span style={{ color: '#0A0A0A', fontWeight: 700 }}>MEASURED GROWTH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
