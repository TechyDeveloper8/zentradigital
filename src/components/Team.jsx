import React, { useState } from 'react';
import { UserCheck, Award, Briefcase, Sparkles } from 'lucide-react';

export default function Team() {
  const teamMembers = [
    {
      name: 'Ayush Garg',
      role: 'Co-Founder & Head of Operations',
      experience: '2+ Years Experience',
      initials: 'AG',
      image: '/logoofclient/Ayush Garg.png',
      bio: 'Directing agency operations, cross-departmental execution, client project delivery, and enterprise scaling.',
    },
    {
      name: 'Rishav Raj',
      role: 'Co-Founder & Head of Marketing',
      experience: '3+ Years Experience',
      initials: 'RR',
      image: '/logoofclient/Rishav Raj.jpeg',
      bio: 'Leading multi-channel performance marketing, paid media strategy, brand positioning, and ROI growth funnels.',
    },
    {
      name: 'Virat Shukla',
      role: 'Sales Head',
      experience: '3+ Years Experience',
      initials: 'VS',
      image: '/logoofclient/Virat Shukla.png',
      bio: 'Driving strategic client partnerships, business acquisition pipelines, and commercial brand expansions.',
    },
    {
      name: 'Saurabh Bhardwaj',
      role: 'Editing & Creative Lead',
      experience: '2+ Years Experience',
      initials: 'SB',
      image: '/logoofclient/Saurabh Bhardwaj.PNG',
      bio: 'Spearheading commercial video editing, motion graphics, reel direction, and high-impact visual storytelling.',
    },
  ];

  return (
    <section id="team" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Headline */}
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
            THE LEADERSHIP <br />
            <span style={{ color: '#E00000' }}>BEHIND ZENTRA.</span>
          </h2>
        </div>

        {/* 4-Column Grid for Team Members */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {teamMembers.map((member, idx) => (
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
                    boxShadow: '0 0 15px rgba(224, 0, 0, 0.25)',
                  }}
                >
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
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
                      background: 'radial-gradient(circle at center, rgba(224, 0, 0, 0.15) 0%, #0A0A0A 85%)',
                    }}
                  >
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'rgba(224, 0, 0, 0.9)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        marginBottom: '0.6rem',
                        boxShadow: '0 0 25px rgba(224, 0, 0, 0.5)',
                        border: '2px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {member.initials}
                    </div>
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
          ))}
        </div>
      </div>
    </section>
  );
}
