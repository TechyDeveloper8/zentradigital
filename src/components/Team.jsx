import React from 'react';
import { UserCheck } from 'lucide-react';

export default function Team() {
  const teamMembers = [
    {
      role: 'Founder / Director',
      name: '[NAME]',
      bio: 'Directing agency vision, strategic growth initiatives, and enterprise digital client partnerships.',
    },
    {
      role: 'Creative Director',
      name: '[NAME]',
      bio: 'Overseeing creative art direction, commercial campaign concepts, and high-end brand asset creation.',
    },
    {
      role: 'Head of Performance',
      name: '[NAME]',
      bio: 'Managing acquisition media budgets, ad account optimizations, and conversion funnel analytics.',
    },
    {
      role: 'Lead Web Engineer',
      name: '[NAME]',
      bio: 'Architecting fast modern web applications, custom CRM platforms, and AI chatbot integrations.',
    },
    {
      role: 'Content Strategist',
      name: '[NAME]',
      bio: 'Crafting brand copywriting, multi-channel social media calendars, and editorial storytelling.',
    },
  ];

  return (
    <section id="team" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Headline */}
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
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
            AGENCY TALENT
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            THE PEOPLE <br />
            <span style={{ color: '#E00000' }}>BEHIND ZENTRA.</span>
          </h2>
        </div>

        {/* Minimal Large Portraits Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem',
          }}
        >
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              style={{
                padding: '2.2rem',
                background: '#FFFFFF',
                border: '1px solid var(--border-dark)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              className="minimal-card"
            >
              <div>
                {/* Large Editorial Portrait Frame */}
                <div
                  style={{
                    width: '100%',
                    height: '260px',
                    borderRadius: '6px',
                    background: '#0A0A0A',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  <UserCheck size={48} color="#E00000" style={{ marginBottom: '0.75rem' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#CCCCCC', fontWeight: 600, letterSpacing: '0.05em' }}>
                    LARGE PROFESSIONAL PORTRAIT
                  </span>
                </div>

                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#E00000', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {member.role}
                </span>

                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                  {member.name}
                </h3>

                <p style={{ color: '#555555', fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }}>
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
