import React from 'react';

export default function TrustProof() {
  const clients = [
    'Tanishq Bhagalpur',
    'Mia by Tanishq Bhagalpur',
    'Helios Bhagalpur',
    'Titan Eye+',
    'Taneira Bhagalpur',
    'Khadim’s',
    'Criosmoun Club',
    'The Fashion World',
    'Hari Om Laxminarayan',
    'Limelight Advertising & Marketing Network',
    'Arya Art',
    'Dr. Kahniya Lal Gupta',
    'Dr. Ujjawal Kumar',
    'Innovation Classes',
    'Glam Studio 99',
  ];

  return (
    <section
      id="clients"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
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
            CLIENT NETWORK
          </span>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              lineHeight: 1.1,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            BRANDS WE <span style={{ color: '#E00000' }}>WORK WITH.</span>
          </h2>
        </div>

        {/* Clean Black-and-White Logo Wall Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {clients.map((cName, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.75rem 1.25rem',
                textAlign: 'center',
                background: '#FFFFFF',
                border: '1px solid var(--border-dark)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25 ease',
              }}
              className="minimal-card"
              data-cursor="CLIENT"
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#0A0A0A',
                  letterSpacing: '-0.01em',
                }}
              >
                {cName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
