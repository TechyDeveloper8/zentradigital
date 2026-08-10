import React, { useState } from 'react';
import { ArrowUpRight, Camera } from 'lucide-react';

export default function CaseStudies({ onOpenProjectModal }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Product Photography',
    'Social Media',
    'Advertising',
    'Performance Marketing',
    'Website Development',
    'Content',
    'Influencer Marketing',
  ];

  const caseStudies = [
    {
      id: 'jewellery-shoot',
      title: 'JEWELLERY PRODUCT SHOOT',
      client: 'Tanishq Bhagalpur & Mia by Tanishq Bhagalpur',
      category: 'Product Photography',
      subtitle: 'Luxury Jewellery Visual Presentation',
      description: 'High-end commercial macro photography, lighting, and art direction highlighting gold craftsmanship and gemstone brilliance.',
      featured: true,
      imageTag: 'LUXURY JEWELLERY EDITORIAL PHOTOGRAPHY',
    },
    {
      id: 'retail-campaigns',
      title: 'RETAIL SOCIAL MEDIA CAMPAIGNS',
      client: 'Khadim’s & Helios Bhagalpur',
      category: 'Social Media',
      subtitle: 'Regional Digital Presence Scaling',
      description: 'Strategic visual content, reel production, and localized engagement campaigns driving footfalls across regional outlets.',
      featured: false,
      imageTag: 'RETAIL CAMPAIGN CREATIVE DIRECTION',
    },
    {
      id: 'performance-funnel',
      title: 'PERFORMANCE ACQUISITION ENGINE',
      client: 'Titan Eye+ & Taneira Bhagalpur',
      category: 'Performance Marketing',
      subtitle: 'Paid Media Conversion Optimization',
      description: 'Data-backed ad funnels across Meta and Google Ads generating high-intent customer inquiries.',
      featured: false,
      imageTag: 'PERFORMANCE MARKETING DASHBOARD',
    },
    {
      id: 'brand-web-engineering',
      title: 'CUSTOM DIGITAL WEB PORTAL',
      client: 'Limelight Advertising & Criosmoun Club',
      category: 'Website Development',
      subtitle: 'Sub-second Modern Web Engineering',
      description: 'Minimal, responsive corporate web architecture built with modern frontend frameworks.',
      featured: false,
      imageTag: 'CORPORATE WEBSITE INTERFACE',
    },
  ];

  const filteredStudies = activeCategory === 'All'
    ? caseStudies
    : caseStudies.filter((item) => item.category === activeCategory);

  return (
    <section id="work" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Headline Header — Centered on Mobile */}
        <div style={{ marginBottom: '3rem' }} className="mobile-text-center">
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
            PORTFOLIO
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
            WORK THAT <br />
            <span style={{ color: '#E00000' }}>MOVES BRANDS.</span>
          </h2>
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
          className="portfolio-filters"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1.1rem',
                background: activeCategory === cat ? '#0A0A0A' : '#FFFFFF',
                border: activeCategory === cat ? '1px solid #0A0A0A' : '1px solid var(--border-subtle)',
                color: activeCategory === cat ? '#FFFFFF' : '#0A0A0A',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Full-Width Editorial Case Studies Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {filteredStudies.map((study) => (
            <div
              key={study.id}
              onClick={onOpenProjectModal}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-dark)',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0rem',
                transition: 'all 0.3s ease',
              }}
              className="minimal-card"
            >
              {/* Large Image Frame */}
              <div
                style={{
                  minHeight: '260px',
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '2.5rem 1.5rem',
                  borderRight: '1px solid var(--border-dark)',
                }}
              >
                <Camera size={48} color="#E00000" style={{ marginBottom: '1rem' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#E00000', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {study.category}
                </span>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                  {study.imageTag}
                </h4>
              </div>

              {/* Text Editorial Details */}
              <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#E00000', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    {study.subtitle}
                  </span>

                  <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', fontWeight: 700, color: '#0A0A0A', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
                    {study.title}
                  </h3>

                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#888888', marginBottom: '1.25rem', fontWeight: 600 }}>
                    CLIENT: {study.client}
                  </p>

                  <p style={{ color: '#555555', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500, marginBottom: '1.75rem' }}>
                    {study.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 700, color: '#0A0A0A' }}>
                  <span>EXPLORE PROJECT BRIEF</span>
                  <ArrowUpRight size={16} color="#E00000" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .portfolio-filters {
            justify-content: center !important;
          }
        }
      `}</style>
    </section>
  );
}
