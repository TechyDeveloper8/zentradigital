import React from 'react';
import { Award, Sparkles, ShieldCheck } from 'lucide-react';

export default function Team() {
  const founderMembers = [
    {
      name: 'Rishav Raj',
      role: 'Co-Founder & Head of Marketing',
      experience: '3+ Years Experience',
      initials: 'RR',
      image: '/logoofclient/Rishav Raj.jpeg',
      badge: 'FOUNDER',
      bio: 'Leading multi-channel performance marketing, paid media strategy, brand positioning, and ROI growth funnels.',
    },
    {
      name: 'Ayush Garg',
      role: 'Co-Founder & Head of Operations',
      experience: '2+ Years Experience',
      initials: 'AG',
      image: '/logoofclient/Ayush Garg.png',
      badge: 'FOUNDER',
      bio: 'Directing agency operations, cross-departmental execution, client project delivery, and enterprise scaling.',
    },
    {
      name: 'Virat Shukla',
      role: 'Co-Founder & Head of Sales',
      experience: '3+ Years Experience',
      initials: 'VS',
      image: '/logoofclient/Virat Shukla.png',
      badge: 'FOUNDER',
      bio: 'Driving strategic client partnerships, business acquisition pipelines, and commercial brand expansions.',
    },
  ];

  const coreTeamMembers = [
    {
      name: 'Saurabh Bhardwaj',
      role: 'Editing & Creative Lead',
      experience: '2+ Years Experience',
      initials: 'SB',
      image: '/logoofclient/Saurabh Bhardwaj.PNG',
      badge: 'CREATIVE LEAD',
      bio: 'Spearheading commercial video editing, motion graphics, reel direction, and high-impact visual storytelling.',
    },
    {
      name: 'Ketan Agrawal',
      role: 'Content Ideation Lead',
      experience: '3+ Years Experience',
      initials: 'KA',
      image: null,
      badge: 'CONTENT STRATEGY',
      bio: 'Crafting high-converting viral hooks, content architecture, narrative scripts, and strategic organic brand growth concepts.',
    },
    {
      name: 'Amisha S',
      role: 'Performance Marketer',
      experience: '2+ Years Experience',
      initials: 'AS',
      image: null,
      badge: 'PERFORMANCE',
      bio: 'Managing paid media acquisition, ROI-optimized Meta & Google ad funnels, audience analytics, and conversion scaling.',
    },
  ];

  const renderMemberCard = (member, idx) => (
    <div
      key={idx}
      style={{
        padding: '2rem 1.75rem',
        background: '#FFFFFF',
        border: '1px solid var(--border-dark)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      }}
      className="minimal-card"
    >
      <div>
        {/* Team Portrait Frame with Red Border */}
        <div
          style={{
            width: '100%',
            height: '280px',
            borderRadius: '8px',
            background: '#0A0A0A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid #E00000',
            boxShadow: '0 0 15px rgba(224, 0, 0, 0.22)',
          }}
        >
          {member.image ? (
            <img
              src={member.image}
              alt={`${member.name} - ${member.role} at Zentra Digital`}
              width="280"
              height="280"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                transition: 'transform 0.4s ease',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}

          {/* Fallback Initials Avatar Badge */}
          <div
            style={{
              display: member.image ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(224, 0, 0, 0.22) 0%, #0A0A0A 85%)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(224, 0, 0, 0.95)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                marginBottom: '0.6rem',
                boxShadow: '0 0 25px rgba(224, 0, 0, 0.55)',
                border: '2px solid rgba(255,255,255,0.25)',
              }}
            >
              {member.initials}
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#CCCCCC',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {member.badge}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#E00000', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.35 }}>
            {member.role.includes('&') ? (
              <>
                {member.role.split('&')[0]}&<br />
                {member.role.split('&')[1].trim()}
              </>
            ) : (
              member.role
            )}
          </span>

          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-body)', color: '#555555', background: '#F4F4F4', padding: '0.18rem 0.5rem', borderRadius: '4px', fontWeight: 700, border: '1px solid #E0E0E0', whiteSpace: 'nowrap' }}>
            {member.experience}
          </span>
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {member.name}
        </h3>

        <p style={{ color: '#555555', fontSize: '0.92rem', lineHeight: 1.6, fontWeight: 500 }}>
          {member.bio}
        </p>
      </div>
    </div>
  );

  return (
    <section id="team" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Main Headline */}
        <div style={{ marginBottom: '3.5rem' }} className="mobile-text-center">
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
            LEADERSHIP & TALENT
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            THE LEADERSHIP & TEAM <br />
            <span style={{ color: '#E00000' }}>BEHIND ZENTRA.</span>
          </h2>
        </div>

        {/* Part 1: Founder Members */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#E00000', borderRadius: '2px' }} />
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0A0A0A',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              FOUNDER MEMBERS
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#666666',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                background: '#F0F0F0',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
              }}
            >
              Leadership
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {founderMembers.map((member, idx) => renderMemberCard(member, idx))}
          </div>
        </div>

        {/* Part 2: Core Team Members */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#0A0A0A', borderRadius: '2px' }} />
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0A0A0A',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              CORE EXECUTION TEAM
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#666666',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                background: '#F0F0F0',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
              }}
            >
              Specialists
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {coreTeamMembers.map((member, idx) => renderMemberCard(member, idx + 10))}
          </div>
        </div>
      </div>
    </section>
  );
}
