import React from 'react';

export default function About() {
  const categories = [
    'SOCIAL',
    'CONTENT',
    'ADS',
    'WEBSITE',
    'DATA',
    'CRM',
    'AI',
    'SEO',
  ];

  return (
    <section
      id="about"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Category Pills Bar showing connected ecosystem categories */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.6rem',
            justifyContent: 'center',
            marginBottom: '3.5rem',
          }}
        >
          {categories.map((cat) => (
            <span
              key={cat}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#E00000',
                background: '#141414',
                border: '1px solid #282828',
                padding: '0.4rem 1.1rem',
                borderRadius: '9999px',
                letterSpacing: '0.1em',
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Section Header */}
        <div style={{ maxWidth: '980px', margin: '0 auto' }} className="mobile-text-center">
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
            OUR ECOSYSTEM PHILOSOPHY
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.4rem, 6.5vw, 4.8rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              marginBottom: '2rem',
              letterSpacing: '-0.03em',
            }}
          >
            DIGITAL GROWTH, <br />
            <span style={{ color: '#E00000' }}>BUILT DIFFERENTLY.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: '#CCCCCC',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            We don't sell random marketing tactics. Zentra Digital engineers integrated digital ecosystems where social media, targeted advertising, custom software, SEO, and AI automation work together to drive undeniable revenue growth.
          </p>
        </div>
      </div>
    </section>
  );
}
