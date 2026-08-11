import React from 'react';

export default function TrustProof() {
  const clientLogos = [
    { name: 'Crimsone', src: '/logoofclient/Crimsonelogo.jpeg' },
    { name: 'Dilse Biryani', src: '/logoofclient/Dilsebiryani.png' },
    { name: 'Duke', src: '/logoofclient/Dukelogo.png' },
    { name: 'Helios', src: '/logoofclient/Helios.png' },
    { name: 'Khadim\'s', src: '/logoofclient/KhadimLogo.jpg' },
    { name: 'Limelight Advertising', src: '/logoofclient/Limelightingadvertising.png' },
    { name: 'Makanwale', src: '/logoofclient/Makanwalelogo.png' },
    { name: 'Shila Enterprise', src: '/logoofclient/ShilaEnterprise.png' },
    { name: 'Taneira', src: '/logoofclient/Tanieralogo.jpeg' },
    { name: 'Tanishq', src: '/logoofclient/TanishqLogo.jpg' },
    { name: 'TV', src: '/logoofclient/Tvlogo.png' },
    { name: 'Fashion World', src: '/logoofclient/faishonworldlogo.jpeg' },
    { name: 'Glam Studio 99', src: '/logoofclient/glamstudiologo.png' },
    { name: 'ITC', src: '/logoofclient/itclogo.png' },
    { name: 'The Luxe Shop', src: '/logoofclient/theluxeshoplogo.png' },
    { name: 'Titan Eye+', src: '/logoofclient/titaneyelogo.png' },
  ];

  // Quadruple the list so it scrolls endlessly and seamlessly across wide screens
  const marqueeLogos = [...clientLogos, ...clientLogos, ...clientLogos, ...clientLogos];

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
        overflow: 'hidden',
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

        {/* Animated Infinite Marquee Container (Left to Right, Linear) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            padding: '1rem 0',
            maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          }}
        >
          <div
            className="animate-marquee-right"
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {marqueeLogos.map((client, idx) => (
              <div
                key={idx}
                style={{
                  flexShrink: 0,
                  width: '200px',
                  height: '100px',
                  padding: '0.4rem 0.6rem',
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                }}
                className="client-logo-card"
              >
                <img
                  src={client.src}
                  alt={client.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .client-logo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
        }
        .client-logo-card:hover img {
          transform: scale(1.08);
        }
      `}</style>
    </section>
  );
}

