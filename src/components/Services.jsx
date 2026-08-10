import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Services({ onOpenProjectModal }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const services = [
    { num: '01', title: 'Digital Marketing', desc: 'Comprehensive multi-channel strategy designed around clear business objectives.' },
    { num: '02', title: 'Performance Marketing', desc: 'Data-driven paid media campaigns focused on qualified customer acquisition.' },
    { num: '03', title: 'Advertising', desc: 'High-impact commercial campaign positioning across digital platforms.' },
    { num: '04', title: 'Ad & Product Shoots', desc: 'High-end studio photography and commercial visual art direction.' },
    { num: '05', title: 'Influencer Marketing', desc: 'Strategic creator partnerships designed for authentic audience engagement.' },
    { num: '06', title: 'Website Development', desc: 'Modern, high-speed corporate web applications built with modern frameworks.' },
    { num: '07', title: 'Custom CRM', desc: 'Tailored lead management and sales operations automation systems.' },
    { num: '08', title: 'AI-Integrated Chatbots', desc: 'Intelligent support and automated lead intake conversational workflows.' },
    { num: '09', title: 'Content Writing', desc: 'Persuasive brand copywriting, editorial articles, and conversion landing pages.' },
    { num: '10', title: 'Social Media Management', desc: 'Complete brand management, content strategy, publishing, and community scaling.' },
    { num: '11', title: 'SEO', desc: 'Technical search optimization engineered for long-term authority and organic reach.' },
  ];

  return (
    <section id="services" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
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
            CAPABILITIES
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            WHAT WE DO<span style={{ color: '#E00000' }}>.</span>
          </h2>
        </div>

        {/* Minimal Interactive Vertical List */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {services.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.num}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={onOpenProjectModal}
                style={{
                  position: 'relative',
                  padding: '1.75rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  backgroundColor: isHovered ? '#F8F8F8' : '#FFFFFF',
                }}
                data-cursor="SERVICE"
              >
                {/* Thin Red Expand Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: isHovered ? '4px' : '0px',
                    backgroundColor: '#E00000',
                    transition: 'width 0.3s ease',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                  {/* Number */}
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: isHovered ? '#E00000' : '#888888',
                      transition: 'color 0.3s ease',
                      minWidth: '32px',
                    }}
                  >
                    {item.num}
                  </span>

                  {/* Title & Preview Text */}
                  <div>
                    <h3
                      style={{
                        fontSize: 'clamp(1.15rem, 4vw, 2.2rem)',
                        fontWeight: 700,
                        color: '#0A0A0A',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        transform: isHovered ? 'translateX(6px)' : 'translateX(0px)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {item.title}
                    </h3>

                    {isHovered && (
                      <p
                        style={{
                          fontSize: '0.9rem',
                          color: '#555555',
                          marginTop: '0.4rem',
                          transform: 'translateX(6px)',
                          transition: 'all 0.3s ease',
                          fontWeight: 500,
                        }}
                      >
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isHovered ? '#E00000' : '#0A0A0A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ArrowUpRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
