import React from 'react';
import { ArrowUp, Phone } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Work', href: '#work' },
    { label: 'Reviews', href: '#testimonials' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#cta' },
  ];

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        borderTop: '1px solid #1F1F1F',
        paddingTop: '4.5rem',
        paddingBottom: '3rem',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 2.5rem' }}>
        {/* Top Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          {/* Brand */}
          <div>
            <a
              href="#"
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.75rem',
                textDecoration: 'none',
                color: '#FFFFFF',
                marginBottom: '1rem',
              }}
            >
              <img
                src="/logoofclient/zentra_digital-removebg-preview.png"
                alt="Zentra Digital Agency Logo"
                width="160"
                height="50"
                style={{
                  height: '50px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                }}
              >
                ZENTRA DIGITAL<span style={{ color: '#E00000' }}>.</span>
              </span>
            </a>
            <p style={{ color: '#888888', fontSize: '0.92rem', lineHeight: 1.6, fontWeight: 500, maxWidth: '280px' }}>
              Digital Marketing & Technology Agency.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#E00000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
              NAVIGATION
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{ color: '#CCCCCC', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E00000')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CCCCCC')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#E00000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
              DIRECT INQUIRIES
            </h4>
            <a
              href="tel:+916202050810"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <Phone size={16} color="#E00000" />
              <span>+91 62020 50810</span>
            </a>
          </div>

          {/* Socials & Top */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#E00000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 700 }}>
              CONNECT
            </h4>
            <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {[
                { name: 'Instagram', url: 'https://www.instagram.com/zentra_digital/' },
                { name: 'LinkedIn', url: 'https://www.linkedin.com/company/109068474' },
                { name: 'Facebook', url: 'https://www.facebook.com/share/1DECDvAGw5/' },
              ].map((soc) => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow Zentra Digital on ${soc.name}`}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '4px',
                    background: '#121212',
                    border: '1px solid #222222',
                    color: '#CCCCCC',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E00000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#CCCCCC';
                    e.currentTarget.style.borderColor = '#222222';
                  }}
                >
                  {soc.name}
                </a>
              ))}
            </div>

            <button
              onClick={scrollToTop}
              aria-label="Back to top of the page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '9999px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Row with Centered ZeroRift Branding */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid #1A1A1A',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            alignItems: 'center',
            gap: '1rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: '#888888',
          }}
        >
          <div>© 2026 Zentra Digital. All rights reserved.</div>

          {/* Centered ZeroRift Branding */}
          <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span>Engineered by</span>
            <a
              href="https://zerorift.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.05em',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E00000')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            >
              ZeroRift<span style={{ color: '#E00000' }}>.</span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }} className="footer-links-right">
            <a href="#" style={{ color: '#888888', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#888888', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-links-right {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </footer>
  );
}
