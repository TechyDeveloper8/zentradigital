import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Phone } from 'lucide-react';

export default function Navbar({ onOpenProjectModal }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Work', href: '#work' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#cta' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? '1rem 2.5rem' : '1.75rem 2.5rem',
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Brand Identity */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: '#0A0A0A',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#0A0A0A',
            }}
          >
            ZENTRA DIGITAL<span style={{ color: '#E00000' }}>.</span>
          </span>
        </a>

        {/* Center Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '2.5rem',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                color: '#0A0A0A',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E00000')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0A0A0A')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side: Phone + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a
            href="tel:+916202050810"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#0A0A0A',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
            className="phone-nav-link"
          >
            <Phone size={14} color="#E00000" />
            <span>+91 62020 50810</span>
          </a>

          <button
            onClick={onOpenProjectModal}
            className="btn-primary"
            style={{ fontSize: '0.88rem', padding: '0.65rem 1.4rem' }}
          >
            <span>Start a Project</span>
            <ArrowUpRight size={16} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0A0A0A',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.5rem',
            }}
            className="mobile-hamburger"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-dark)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: '#0A0A0A',
                textDecoration: 'none',
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="tel:+916202050810"
            style={{
              color: '#E00000',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
            }}
          >
            <Phone size={18} />
            <span>+91 62020 50810</span>
          </a>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .phone-nav-link {
            display: flex !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
