import React, { useState } from 'react';

export default function Services() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const services = [
    { num: '01', title: 'Digital & Performance Marketing', desc: 'Data-driven paid media acquisition (Meta & Google), multi-channel brand positioning, and ROI growth funnels.' },
    { num: '02', title: 'SaaS Solutions & Platforms', desc: 'Custom cloud software architectures, subscription management engines, and high-performance digital products.' },
    { num: '03', title: 'Custom CRM Systems', desc: 'Tailored client management pipelines, lead automation, lifecycle tracking, and sales operations infrastructure.' },
    { num: '04', title: 'B2B Sales Provider & Lead Gen', desc: 'Outbound sales pipelines, targeted B2B prospecting, high-ticket deal closing systems, and pipeline acceleration.' },
    { num: '05', title: 'Brand Advertising & Campaigns', desc: 'High-impact commercial campaign direction, editorial messaging, and omni-channel media dominance.' },
    { num: '06', title: 'Ad & Product Commercial Shoots', desc: 'High-end studio photography, 4K commercial reels, macro jewellery shoots, and visual art direction.' },
    { num: '07', title: 'Website & Web App Development', desc: 'Sub-second modern web architecture, headless CMS, 3D interactive interfaces, and corporate portals.' },
    { num: '08', title: 'AI-Integrated Chatbots & Automation', desc: 'Intelligent AI conversational agents, automated qualification workflows, and 24/7 lead capture engines.' },
    { num: '09', title: 'Social Media & Content Strategy', desc: 'Complete brand management, viral hook creation, motion graphics, and organic community scaling.' },
    { num: '10', title: 'SEO & Search Authority', desc: 'Deep technical SEO, keyword authority dominance, and sustainable long-term organic search rankings.' },
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

        {/* Minimal Interactive Vertical List (Informational Only - No Redirection) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {services.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.num}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  position: 'relative',
                  padding: '1.75rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'default',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  backgroundColor: isHovered ? '#F8F8F8' : '#FFFFFF',
                }}
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
