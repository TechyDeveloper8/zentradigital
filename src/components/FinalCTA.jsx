import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

export default function FinalCTA({ onOpenProjectModal }) {
  return (
    <section
      id="cta"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        borderTop: '1px solid #1F1F1F',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: '#E00000',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '1.25rem',
            fontWeight: 700,
          }}
        >
          TAKEOFF BRIEF
        </span>

        <h2
          style={{
            fontSize: 'clamp(3.2rem, 8.5vw, 6.5rem)',
            lineHeight: 1.02,
            fontWeight: 700,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
            letterSpacing: '-0.04em',
          }}
        >
          READY TO <br />
          <span style={{ color: '#E00000' }}>GROW?</span>
        </h2>

        <p
          style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.4rem)',
            color: '#CCCCCC',
            maxWidth: '680px',
            margin: '0 auto 3rem auto',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          Let's build something your audience notices and your business grows from.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            marginBottom: '3.5rem',
          }}
        >
          <button
            onClick={onOpenProjectModal}
            className="btn-primary"
            style={{ padding: '1.1rem 2.6rem', fontSize: '1.05rem' }}
            data-cursor="PROJECT"
          >
            <span>Start a Project</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Direct Phone Contact */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.8rem',
            background: '#121212',
            border: '1px solid #222222',
            borderRadius: '9999px',
            fontFamily: 'var(--font-body)',
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <Phone size={18} color="#E00000" />
          <span style={{ color: '#888888' }}>CALL US DIRECTLY:</span>
          <a href="tel:+916202050810" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
            +91 62020 50810
          </a>
        </div>
      </div>
    </section>
  );
}
