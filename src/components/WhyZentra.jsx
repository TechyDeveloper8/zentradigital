import React from 'react';
import { Briefcase, Brain, Flame, Cpu } from 'lucide-react';

export default function WhyZentra() {
  const concepts = [
    {
      num: '01',
      title: 'STRATEGY',
      icon: Briefcase,
      desc: 'We understand the business economics and market opportunity before launching any campaign.',
    },
    {
      num: '02',
      title: 'CREATIVE',
      icon: Brain,
      desc: 'Memorable brand messaging, commercial visual direction, and creative advertising concepts.',
    },
    {
      num: '03',
      title: 'PERFORMANCE',
      icon: Flame,
      desc: 'High-intent digital acquisition marketing designed strictly around measurable ROI.',
    },
    {
      num: '04',
      title: 'TECHNOLOGY',
      icon: Cpu,
      desc: 'Custom web development, CRM pipeline automation, and AI chatbots built for scale.',
    },
  ];

  return (
    <section
      id="why-zentra"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Header — Centered on Mobile */}
        <div style={{ marginBottom: '4rem' }} className="mobile-text-center">
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
            WHY ZENTRA
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            MORE THAN <br />
            <span style={{ color: '#E00000' }}>MARKETING.</span>
          </h2>
        </div>

        {/* 4 Connected Concepts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            position: 'relative',
          }}
        >
          {concepts.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.num}
                style={{
                  padding: '2.5rem 2rem',
                  background: '#121212',
                  border: '1px solid #222222',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  borderTop: '3px solid #E00000',
                }}
                data-cursor="CONCEPT"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#E00000', fontWeight: 700 }}>
                      {item.num}
                    </span>
                    <IconComp size={24} color="#E00000" />
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {item.title}
                  </h3>

                  <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
